## Mål
Forhåndsvisningen av ROS-analysen skal se ut som den ferdige Word-rapporten – på linje med `BrensellagringPreview` / `KonseptPreview`. Da blir det enklere å redigere innhold og se hvordan det blir ved nedlasting.

## Endringer

### `src/components/ros/RosPreview.tsx` — full omskriving av layout
Beholder samme `Props` (`content: RosContent`), men utvider med valgfrie felt fra siden:

```ts
interface Props {
  content: RosContent;
  logoUrl?: string | null;
  firmaNavn?: string | null;
  utarbeidetAv?: string | null;
}
```

Visuell stil etter `BrensellagringPreview`:
- A4-side: hvit bakgrunn, `maxWidth: 210mm`, `minHeight: 297mm`, padding `20mm 18mm 24mm 18mm`, mykt `box-shadow`, `Segoe UI / Arial`, fontstørrelse 11, line-height 1.6, tekstfarge `#1a1a1a`.
- Topp: logo øverst til høyre (om tilgjengelig), deretter mørkeblå header-bar (`#1e3a5f`, hvit tekst) med kicker `RISIKO- OG SÅRBARHETSANALYSE`, hovedtittel = `metadata.prosjektnavn`, undertittel = adresse.
- Prosjektinfo-tabell rett under header (Firma, Kunde, Prosjekt, Adresse, Oppdragsgiver, Utført av, Dato, Versjon) – samme `thStyle`/`tdStyle`-stil som Brensellagring.
- Kapittel-overskrifter (`h2`) i `#1e3a5f` med 2px underline – nummerering `1. Innledning`, `2. Metode`, `3. Hendelsesregister`, `4. Oppsummering`, `5. Revisjonshistorikk`. Underoverskrifter (`h3`) i `#2d4a6f`.
- Kap. 2 Metode: behold introtekst, vis sannsynlighet/konsekvens som to tabeller (Trinn / Beskrivelse) i stedet for `<ul>`. Behold `<RosMatriks />` under, sentrert, og legg til en liten tekst om fargekoding.
- Kap. 3 Hendelsesregister: erstatt dagens kort-liste med én **rapport-tabell** (Nr, Tittel, Beskrivelse, Årsak, S, K, R, Tiltak, Restrisiko) der R-cellen er fargekodet via `risikoFarge` (samme grønn/gul/rød som Word-eksporten), tekst sentrert. Bruker `thStyle`/`tdStyle`. Tom-tilstand: liten kursiv tekst i en tabellcelle.
- Kap. 4 Oppsummering: vanlig avsnitt med `whitespace-pre-line`, samme typografi.
- Kap. 5 Revisjonshistorikk: tabell Versjon / Dato / Utførende / Endring med rapport-stil.
- Footer-stripe nederst (lik Brensellagring) med firmanavn + dato + sidetittel "ROS-analyse".

Wrapping: ytre `<div>` med `bg-muted/20 p-4 md:p-8 flex justify-center` slik at den hvite "siden" flyter pent inni dagens preview-pane. Selve sidekortet får `marginInline: auto`.

### `src/pages/RosAnalyse.tsx`
- Send `logoUrl`, `firmaNavn` (= `profile.company`) og `utarbeidetAv` (allerede i `content.metadata.utfortAv`, men send også `profile.full_name` som fallback) til `RosPreview`. Hent `profile`/`logoUrl` på samme måte som i `handleExportWord`, men cache i `useState`/`useEffect` ved mount slik at det er tilgjengelig for live-preview.
- `<RosPreview content={content} logoUrl={logoUrl} firmaNavn={firmaNavn} utarbeidetAv={utfortAv} />`.

### Ut av scope
- Ingen endring i datamodell, lagring, eller `ros-word-export.ts`.
- Ingen endring i innputsiden (accordion-løsningen) eller matrise-komponenten.
- Ingen ny logikk for fargeterskler – gjenbruker eksisterende `risikoFarge`.

### Tekniske detaljer
- Alle nye stiler bruker inline `React.CSSProperties`-konstanter (`pageStyle`, `h2`, `h3`, `thStyle`, `tdStyle`) kopiert fra `BrensellagringPreview` for konsistent rapport-utseende.
- Fargekoding av R-celle: liten helper `riskCellStyle(s, k)` som returnerer `{ background, color }` basert på `risikoFarge` (`#22A06B` / `#F5B82E` / `#DC3545`, hvit/mørk tekst).
- Eksisterende anker-IDer (`kap-1`…`kap-5`) beholdes så preview-navigasjon i `RosAnalyse` fortsatt fungerer.
