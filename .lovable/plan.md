## Mål

Utvide RosHendelse til å støtte parallelle konsekvensvurderinger over 5 dimensjoner (forsyningssikkerhet, personellsikkerhet, ytre miljø, økonomi, omdømme) iht. NVE-veileder, uten å bryte eksisterende ROS-data.

## 1. `src/lib/ros-risk-criteria.ts`

- Ny type `KonsekvensDimensjon = "forsyningssikkerhet" | "personellsikkerhet" | "ytre_miljø" | "økonomi" | "omdømme"`.
- Ny konstant `DIMENSJON_NAVN: Record<KonsekvensDimensjon, string>` med visningsnavn.
- Endre `KONSEKVENS_KRITERIER` fra `Record<BransjeId, KriterieTabell>` til `Record<BransjeId, Record<KonsekvensDimensjon, KriterieTabell>>`.
  - Behold dagens forsyningssikkerhet-tekst ordrett.
  - Legg til kriterietabeller (nivå 1–5) for personellsikkerhet, ytre miljø, økonomi og omdømme med tekstene oppgitt i prompten.

## 2. `src/components/ros/RosPreview.tsx` (typer)

- Importer `KonsekvensDimensjon` fra `@/lib/ros-risk-criteria`.
- Nytt interface `KonsekvensVurdering { dimensjon; score; begrunnelse?; scoreEtter?; begrunnelseEtter? }` (eksportert).
- Legg til `konsekvensvurderinger?: KonsekvensVurdering[]` på `RosHendelse`. Marker `konsekvens`, `konsekvensEtter` og `beskrivelseRisikoFor` som `@deprecated` (kun JSDoc) – beholdes som fallback.
- Eksporter hjelper `migrerHendelse(h)` som returnerer hendelsen med garantert `konsekvensvurderinger`-array. Hvis tomt/missing: lag ett element `{ dimensjon: "forsyningssikkerhet", score: h.konsekvens || 1, begrunnelse: h.beskrivelseRisikoFor || "", scoreEtter: h.konsekvensEtter, begrunnelseEtter: "" }`. Hvis array finnes men mangler forsyningssikkerhet, prepend den (slik at den alltid er rad 0).

## 3. Migrering ved innlasting

- `src/pages/RosAnalyse.tsx`: I useEffect som henter ROS fra Supabase, map `content.hendelser` gjennom `migrerHendelse` før state settes.
- `src/components/ros/UploadRosDialog.tsx`: Når ekstrahert data konverteres til `RosContent`/hendelser sendes via `onApply`, kjør `migrerHendelse` per hendelse.

## 4. Hendelseskjema-UI i `src/pages/RosAnalyse.tsx`

Erstatt dagens to Select-felter («Konsekvens (1–5)» og «Konsekvens etter») i accordion-innholdet med en seksjon «Konsekvensvurderinger»:

- Rad per `KonsekvensVurdering`:
  - `Badge` med `DIMENSJON_NAVN[dimensjon]` (forsyningssikkerhet vises som låst chip).
  - Select for `score` (1–5), klikk på nummer åpner `RosKriterier`-popover for riktig dimensjon.
  - Select for `scoreEtter` (1–5, valgfri).
  - Liten `Textarea` for `begrunnelse`.
  - Liten `Textarea` for `begrunnelseEtter` (kun synlig hvis `scoreEtter` er satt).
  - `Trash2`-knapp som fjerner raden, skjult når `dimensjon === "forsyningssikkerhet"`.
- Under listen: «Legg til dimensjon»-knapp som åpner Dropdown med dimensjoner som ennå ikke er valgt. Default `score: 1`.
- Forsyningssikkerhet legges til automatisk hvis den mangler.
- Når `score`/`scoreEtter` for forsyningssikkerhet endres, oppdater også de gamle feltene `h.konsekvens` / `h.konsekvensEtter` slik at gammel logikk (matriks, bow-tie m.m.) fortsetter å virke i fase 1.
- `RosKriterier`-komponenten må kunne velge tabell per dimensjon – utvid signatur med valgfri `dimensjon?: KonsekvensDimensjon` (default `"forsyningssikkerhet"`) og bruk `KONSEKVENS_KRITERIER["kraftstasjon"][dimensjon]` for konsekvenstabellen. Sannsynlighetstabellen forblir uendret.

## 5. Preview – `src/components/ros/RosPreview.tsx`

I hendelse-renderingen, erstatt dagens enkle konsekvensvisning med en kompakt tabell:

| Dimensjon | Score | Risiko (S×K) | Score etter | Risiko etter | Begrunnelse |

- S hentes fra hendelsens `sannsynlighet`/`sannsynlighetEtter` (felles).
- K hentes per dimensjon fra `konsekvensvurderinger`.
- Risikoceller fargelegges med `riskCellStyle(s, score)` / `riskCellStyle(sEtter, scoreEtter)`.
- Begrunnelse-kolonnen viser `begrunnelse` (og evt. `begrunnelseEtter` på linje under).

## 6. `src/components/ros/RosMatriks.tsx` (midlertidig)

- For hver hendelse: hent score fra `konsekvensvurderinger.find(k => k.dimensjon === "forsyningssikkerhet")?.score ?? h.konsekvens`. Tilsvarende for `scoreEtter` / `konsekvensEtter`.
- Vis liten info-tekst over matrisen: «Viser forsyningssikkerhet. Full visning per dimensjon kommer i en senere oppdatering.»

## 7. Word-eksport – `src/lib/ros-word-export.ts`

For hver hendelse, erstatt dagens konsekvens-rad med en tabell:

| Dimensjon | Score | Begrunnelse | Score etter | Begrunnelse etter |

- Samme docx-stil som eksisterende tabeller.
- For rader der `score >= 4` eller `scoreEtter >= 4`: marker den raden med bakgrunnsfarge iht. `risikoFarge(sannsynlighet, score)` (rød/gul) – gjenbruk eksisterende fargekonstanter.

## Tekniske notater

- `RosKriterier`-callsites i preview/matriks beholdes uendret (default = forsyningssikkerhet).
- Ingen DB-migrering: nytt felt er valgfritt og lagres i `ros_analyses.content` (jsonb).
- Bow-tie- og AI-funksjoner (`extract-bowtie-from-ros` m.fl.) røres ikke i denne fasen – de leser fortsatt `h.konsekvens`, som holdes synkronisert med forsyningssikkerhet-raden.
- Ingen endring i typer/tabeller i Supabase.

## Filer som endres

- `src/lib/ros-risk-criteria.ts`
- `src/components/ros/RosPreview.tsx`
- `src/components/ros/RosMatriks.tsx`
- `src/components/ros/RosKriterier.tsx`
- `src/components/ros/UploadRosDialog.tsx`
- `src/pages/RosAnalyse.tsx`
- `src/lib/ros-word-export.ts`
