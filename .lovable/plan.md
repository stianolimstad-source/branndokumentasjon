## Mål

Flytt rendringen av beregnings-detaljer ut av hendelsesregisteret og inn i et eget «Beregningsgrunnlag»-kapittel, både i live-preview (`RosPreview.tsx`) og Word-eksport (`ros-word-export.ts`). Hendelsesregisteret skal kun vise kompakte ID-referanser (B&lt;hendelsesnr&gt;.&lt;løpenr&gt;). Selve redigerings-UI i `RosAnalyse.tsx` rører vi ikke.

---

## Nummereringsskjema

Genereres dynamisk under rendering, ikke lagret i datamodellen:
- Hendelse 4 med tre beregninger → `B4.1`, `B4.2`, `B4.3`
- Hendelse 7 med én beregning → `B7.1`

Rekkefølge = `content.hendelser`-rekkefølge × `h.beregninger`-rekkefølge.

---

## Endring 1 — `src/lib/ros-word-export.ts`

### Dynamiske kapittelnummer

I dag:
```ts
const oppsummeringNr = harBowTie ? "5" : "4";
const revisjonNr     = harBowTie ? "6" : "5";
```

Endres til (beregningskapittelet er alltid med):
```ts
const beregningNr    = "4";
const bowTieNr       = "5"; // brukes kun hvis harBowTie
const oppsummeringNr = harBowTie ? "6" : "5";
const revisjonNr     = harBowTie ? "7" : "6";
```

Alle `"4. Bow-tie analyse"`-strenger og `4.${idx + 1}`-prefikser i bow-tie-blokken (linje 689, 701) endres til `${bowTieNr}.` / `${bowTieNr}.${idx + 1}`.

### Erstatt nåværende beregnings-rad i hendelsesregisteret

Linje 643–655 (blokken `if (h.beregninger && h.beregninger.length > 0) { hendelseRows.push(...buildBeregningerBlock...) }`) fjernes.

Erstattes av en kompakt ID-referanselinje, plassert rett under hendelsesraden (før dimensjons-sub-tabellen på linje 656):

```ts
if (h.beregninger && h.beregninger.length > 0) {
  const ids = h.beregninger.map((_, bi) => `B${i + 1}.${bi + 1}`).join(", ");
  hendelseRows.push(
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 15,
          width: { size: 100, type: WidthType.PERCENTAGE },
          shading: { fill: "F7F9FC", type: ShadingType.CLEAR, color: "auto" },
          children: [
            new Paragraph({
              children: [
                text(
                  `Beregninger: ${ids} – se kapittel ${beregningNr} Beregningsgrunnlag.`,
                  { italics: true, size: 14 },
                ),
              ],
            }),
          ],
        }),
      ],
    }),
  );
}
```

### Nytt kapittel «4. Beregningsgrunnlag»

Bygges som ny array `beregningsgrunnlag: (Paragraph | Table)[]` rett etter `hendelser`-arrayet (etter linje 683):

```ts
const hendelserMedBeregninger = content.hendelser
  .map((h, i) => ({ h, i }))
  .filter(({ h }) => h.beregninger && h.beregninger.length > 0);

const beregningsgrunnlag: (Paragraph | Table)[] = [
  buildSectionHeading(theme, `${beregningNr}. Beregningsgrunnlag`),
];

if (hendelserMedBeregninger.length === 0) {
  beregningsgrunnlag.push(
    para("Ingen beregninger er tilknyttet hendelsene i denne analysen.", { /* italics via egen variant */ }),
  );
} else {
  for (const { h, i } of hendelserMedBeregninger) {
    beregningsgrunnlag.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [text(
          `${beregningNr}.${i + 1} – Beregninger for hendelse ${i + 1}: ${h.tittel || h.hendelse || "—"}`,
          { bold: true, size: 22 },
        )],
      }),
    );
    h.beregninger!.forEach((b, bi) => {
      const id = `B${i + 1}.${bi + 1}`;
      const typeLabel = BEREGNING_LABELS[b.type] ?? String(b.type);
      // HEADING_4 med ID + label
      beregningsgrunnlag.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_4,
          children: [text(`${id} – ${typeLabel}: ${b.label ?? ""}`, { bold: true, size: 18 })],
        }),
      );
      // Bruk gjenværende del av eksisterende `buildBeregningerBlock`-logikk (resultat-tabell + kommentar)
      // ved å enten kalle en refaktorert helper, eller inline samme tabell-bygging her.
      beregningsgrunnlag.push(/* parameter/verdi-tabell og kommentar */);
    });
  }
}
```

Refaktorering av `buildBeregningerBlock`: splittes i en helper `buildBeregningTabell(b: AttachedCalculation)` som returnerer `(Paragraph | Table)[]` for én beregning (param/verdi-tabell + evt. kommentar), uten den ytre «Beregningsgrunnlag»-headeren. Brukes fra det nye kapittelet.

### Document sections

I `Document.sections`-arrayet (linje 968–982), legg til en ny landskaps-seksjon med `beregningsgrunnlag` rett etter hendelses-seksjonen (linje 967) og før bow-tie-seksjonen. Samme header/footer-oppsett som de andre kapitlene.

---

## Endring 2 — `src/components/ros/RosPreview.tsx`

### Erstatt beregnings-tr i hendelsestabellen

Linje 959–992 (`{h.beregninger && h.beregninger.length > 0 && (<tr>…</tr>)}`) erstattes av en kompakt linje:

```tsx
{h.beregninger && h.beregninger.length > 0 && (
  <tr>
    <td colSpan={15} style={{ ...tdStyle, padding: "4px 10px", background: "#f7f9fc" }}>
      <span style={{ fontSize: 9, fontStyle: "italic", color: "#64748b" }}>
        Beregninger: {h.beregninger.map((_, bi) => `B${i + 1}.${bi + 1}`).join(", ")} – se kapittel 4 Beregningsgrunnlag.
      </span>
    </td>
  </tr>
)}
```

### Nytt seksjons-ark «4. Beregningsgrunnlag»

Plasseres som en ny `<div style={pageStyle} className="ros-page">` (eller landscape om mer naturlig — bruk portrait som de øvrige tekst-kapitlene) etter hendelses-arket (linje 1020) og før bow-tie-arket (linje 1023). Bruk `chapterDivider`, `h2`, `h3` for konsistens.

Innhold:
```tsx
<section id="kap-4">
  <h2 style={h2}>4. Beregningsgrunnlag</h2>
  {(() => {
    const hms = content.hendelser
      .map((h, i) => ({ h, i }))
      .filter(({ h }) => h.beregninger && h.beregninger.length > 0);
    if (hms.length === 0) {
      return (
        <p style={{ ...pStyle, fontStyle: "italic", color: "#64748b" }}>
          Ingen beregninger er tilknyttet hendelsene i denne analysen.
        </p>
      );
    }
    return hms.map(({ h, i }) => (
      <div key={h.id} style={{ marginBottom: 18 }}>
        <h3 style={h3}>
          4.{i + 1} – Beregninger for hendelse {i + 1}: {h.tittel || h.hendelse || "—"}
        </h3>
        {h.beregninger!.map((b, bi) => {
          const id = `B${i + 1}.${bi + 1}`;
          const Icon = BEREGNING_IKONER[b.type];
          return (
            <div key={b.id} style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: 10, marginBottom: 10, background: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ background: "#1e3a5f", color: "#fff", borderRadius: 3, padding: "2px 6px", fontSize: 10, fontWeight: 700 }}>{id}</span>
                {Icon && <Icon size={14} style={{ color: "#1e3a5f" }} />}
                <span style={{ fontWeight: 700, color: "#1e3a5f", fontSize: 11 }}>{b.label}</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
                <thead>
                  <tr><th style={thStyle}>Parameter</th><th style={thStyle}>Verdi</th></tr>
                </thead>
                <tbody>
                  {Object.entries(b.results).map(([k, v]) => (
                    <tr key={k}>
                      <td style={tdStyle}>{k.replace(/_/g, " ")}</td>
                      <td style={tdStyle}><strong>{String(v)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {b.kommentar && (
                <p style={{ fontStyle: "italic", color: "#475569", fontSize: 10, marginTop: 6 }}>{b.kommentar}</p>
              )}
            </div>
          );
        })}
      </div>
    ));
  })()}
</section>
```

Bow-tie-arket (`<section id="kap-4">` i dag, linje 1025–1026) renummereres til **5**, og overskrifter `4.{idx + 1}` (linje 1080) blir `5.{idx + 1}`. Sjekk om det også finnes oppsummering/revisjon-kapitler senere i filen som må renummereres tilsvarende (5→6, 6→7) – disse må vises kun når bow-tie finnes; ellers blir beregningsgrunnlag = 4, oppsummering = 5, revisjon = 6.

---

## Filer som endres

- `src/lib/ros-word-export.ts`
- `src/components/ros/RosPreview.tsx`

`src/pages/RosAnalyse.tsx` (selve redigerings-UI) endres **ikke**.
