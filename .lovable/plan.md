## Mål

1. Legg til en kort info-tekst over 5×5-matrisen i `RosMatriks.tsx` som forklarer at den viser forsyningssikkerhet-dimensjonen.
2. Utvid hendelses-tabellen i Word-eksporten (`ros-word-export.ts`) med en innrykket sub-tabell per hendelse som lister alle konsekvensvurderinger (Dimensjon, Score, R, Score etter, R etter, Begrunnelse), med fargekoding for høye scores.

---

## Endring 1 – `src/components/ros/RosMatriks.tsx`

Inni `RosMatriks`-returen, helt øverst i ytre `<div className="inline-block">`, legg til et avsnitt:

```tsx
<p className="text-xs text-muted-foreground mb-2 max-w-md">
  Viser konsekvensdimensjonen forsyningssikkerhet. Visning per dimensjon kommer i senere fase.
</p>
```

Ingen andre endringer i filen.

---

## Endring 2 – `src/lib/ros-word-export.ts`

### Imports
- Legg til `migrerHendelse` fra `@/components/ros/RosPreview`.
- Legg til `DIMENSJON_NAVN` fra `@/lib/ros-risk-criteria`.

### Ny hjelpefunksjon (plasseres rett over `hendelseRows`-byggingen, ca. linje 499)

```ts
// Fargekoding for én konsekvens-rad i sub-tabellen
const dimRowShading = (score: number | undefined, s: number) => {
  if (!score) return undefined;
  if (score === 5 || (score === 4 && s > 3)) {
    return { fill: FARGE_HEX.rod, type: ShadingType.CLEAR, color: "auto" };
  }
  if (score === 4) {
    return { fill: FARGE_HEX.gul, type: ShadingType.CLEAR, color: "auto" };
  }
  return undefined;
};
const dimTextColor = (score: number | undefined, s: number) => {
  if (!score) return undefined;
  if (score === 5 || (score === 4 && s > 3)) return FARGE_TEKST.rod;
  if (score === 4) return FARGE_TEKST.gul;
  return undefined;
};
```

### Ny `buildKonsekvensSubTabell(h)`

Returnerer en `Table` med samme kolonnestil som i `RosPreview` sin nested dimensjonstabell. Header-rad bruker `tableHeaderShading(theme)` og hvit fet skrift (`size: 14`). Datarader bygger `TableCell`-er for hver `KonsekvensVurdering`:

Kolonner og prosent-bredder:
- Dimensjon (18 %)
- Score (8 %, sentrert)
- R = S×score (8 %, sentrert, bruker `risikoShading(h.sannsynlighet, kv.score)`)
- Score etter (8 %, sentrert)
- R etter (8 %, sentrert, `risikoShading(sE, kv.scoreEtter)` når satt, ellers tom)
- Begrunnelse (50 %, kombinerer `kv.begrunnelse` og evt. `kv.begrunnelseEtter` med linjeskift `"Etter tiltak: …"`)

Hele raden får `shading: dimRowShading(kv.score, h.sannsynlighet)` (R/score-cellene beholder sin egen risiko-shading). Tekstfargen settes via `dimTextColor` på dimensjon-, score- og begrunnelse-cellene når raden er rød/gul.

### Innrykket boks under hendelsesraden

I `content.hendelser.forEach`-loopen, etter den eksisterende `if (h.beregninger…)`-blokken (linje 556) og før loopens slutt:

```ts
const hm = migrerHendelse(h);
const kvs = hm.konsekvensvurderinger || [];
const harBegrunnelse = kvs.some((k) => (k.begrunnelse || "").trim() || (k.begrunnelseEtter || "").trim());
if (kvs.length > 1 || harBegrunnelse) {
  hendelseRows.push(
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 15,
          width: { size: 100, type: WidthType.PERCENTAGE },
          shading: { fill: "F7F9FC", type: ShadingType.CLEAR, color: "auto" }, // bleik innrykk-bakgrunn
          margins: { top: 100, bottom: 100, left: 300, right: 100 }, // venstre-innrykk
          children: [
            new Paragraph({ children: [text("Konsekvensvurderinger per dimensjon", { bold: true, size: 16 })] }),
            buildKonsekvensSubTabell(h, hm),
          ],
        }),
      ],
    }),
  );
}
```

`buildKonsekvensSubTabell` får både `h` (for sannsynlighet før/etter) og `hm` (migrert hendelse med garantert `konsekvensvurderinger`).

`migrerHendelse` brukes som krevd, så også eldre hendelser uten array får én rad (forsyningssikkerhet) — men sub-tabellen rendres bare når `kvs.length > 1` eller det finnes en begrunnelse, slik at enkle gamle hendelser ikke får dobbel info.

### Ingen andre endringer

Ingen endringer i hovedraden (linje 506–541), ingen endringer i bow-tie-seksjonen eller andre kapitler. `FARGE_HEX`/`FARGE_TEKST` gjenbrukes som de er.

---

## Filer som endres

- `src/components/ros/RosMatriks.tsx`
- `src/lib/ros-word-export.ts`
