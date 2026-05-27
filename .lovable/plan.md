## Mål

Flytt beregningsregistrering ut av hver hendelses accordion og inn i et eget toppnivå-kapittel «4. Beregninger» i `RosAnalyse.tsx`. Hendelser markeres kun som «trenger beregning» med kort merknad. Beregninger lagres på `content.beregninger` med `hendelseIds`-kobling, slik at én beregning kan dekke flere hendelser.

---

## Datamodell — `src/components/ros/RosPreview.tsx`

Nytt interface og felter:

```ts
export interface RosBeregning extends AttachedCalculation {
  hendelseIds: string[];
}

// RosContent:
beregninger?: RosBeregning[];

// RosHendelse:
kreverBeregning?: boolean;
beregningTekst?: string;
/** @deprecated bruk content.beregninger med hendelseIds – beholdes for migrasjon */
beregninger?: AttachedCalculation[];
```

Ny migrasjonsfunksjon `migrerBeregninger(content)`:
- Itererer `content.hendelser`. Hvis `h.beregninger?.length > 0`: flytt hver til `content.beregninger` (dedup på `id`, push `h.id` til `hendelseIds`), sett `h.kreverBeregning = true`, fjern `h.beregninger`.
- Returnerer nytt `content` med oppdatert `hendelser` og `beregninger`.

---

## Nummerering

`B<hendelsesnr>.<løpenr>` der hendelsesnr er 1-basert indeks på første hendelse i `hendelseIds`. Løpenr telles innenfor samme hendelse (rekkefølge = `content.beregninger`-rekkefølge filtrert på hendelseId).

For beregninger uten `hendelseIds` (ikke tilknyttet): bruk badge `B–.N` (N = løpenr i ikke-tilknyttet-listen).

Bygges som en helper `byggBeregningIder(content): Map<beregningId, string>` som returnerer ID-streng per beregning. Brukes i preview, Word og editor for konsistens.

---

## Editor — `src/pages/RosAnalyse.tsx`

**Last/import:**
- Kjør `migrerBeregninger(content)` etter `migrerHendelse` ved lasting og i `UploadRosDialog`-mottak (linje ~655 `data.hendelser.map`).
- I `addHendelse`: fjern `beregninger: []`.

**Hendelse-accordion (linje 1064–1235):**
- Fjern beregninger-badgen (linje 1064–1067) og hele «Tilknyttede beregninger»-blokken med `<BeregningSection>` (~linje 1220–1235).
- Erstatt med kompakt blokk:
  - `<Checkbox>` «Krever beregning» bundet til `h.kreverBeregning`.
  - Når på: `<Textarea rows={2}>` for `h.beregningTekst` med placeholder «F.eks. strålingsberegning mot kontrollbygg, eller trafoeksplosjonsvurdering».
  - Hvis det finnes beregninger i `content.beregninger` med `h.id` i `hendelseIds`: vis liten linje «Tilknyttede beregninger: B<X>.<Y>, …» + lenke «Gå til beregningskapittelet» som scroller til `#kap-beregninger`.

**Nytt toppnivåkapittel «4. Beregninger»** (mellom hendelseslisten og bow-tie-seksjonen, med id `kap-beregninger`):

- Innledende hjelpetekst.
- Hvis `content.beregninger` er tom: «Ingen beregninger registrert. Klikk på en av knappene under for å legge til en beregning.»
- Ellers: liste over kort, hvert med:
  - ID-badge fra `byggBeregningIder`
  - Ikon + label fra `calculatorTypes` (importert fra `BeregningSection` — eksporter denne).
  - Kompakt visning av `b.results` (samme styling som dagens `BeregningSection`).
  - Multi-select for tilknyttede hendelser. Bruk `DropdownMenu` med `DropdownMenuCheckboxItem` for hver `content.hendelser` (vis «{i+1}. {h.tittel || h.hendelse}»). Oppdaterer `b.hendelseIds`.
  - `<Textarea>` for `b.kommentar`.
  - Slette-knapp (med `AlertDialog`-bekreftelse, som dagens).
- Knappgruppe nederst: gjenbruk `calculatorTypes` og `CalculatorDialog` direkte. På `onImport` legges ny `RosBeregning` til `content.beregninger` med `hendelseIds: []`.

Skriv inn nye state-helpers `updateBeregning(id, patch)`, `removeBeregning(id)`, `addBeregning(calc)` i komponenten (parallelt med `updateHendelse`).

**Refaktor av `BeregningSection`-import:**
- `calculatorTypes` flyttes til navngitt eksport fra `BeregningSection.tsx` (uendret innhold), eller dupliseres lokalt i RosAnalyse hvis enklere. Foretrekker eksport for å unngå drift.

---

## Output — `src/components/ros/RosPreview.tsx`

**Hendelsesregister-rad (linje 968–977):**
- Bytt fra `h.beregninger` til `content.beregninger.filter(b => b.hendelseIds.includes(h.id))`.
- Hvis funn: vis kompakt referanse «Beregninger: B<X>.<Y>, …» (bruk `byggBeregningIder`).
- Hvis tom OG `h.kreverBeregning`: vis advarsel-tr «Krever beregning – ikke registrert ennå» med gul bakgrunn (`#fff3cd` eller `bg-amber-100`).

**Kap. «4. Beregningsgrunnlag» (linje 1000+):**
- Iterer `content.beregninger` gruppert per første tilknyttet hendelse (eller egen «Ikke tilknyttet hendelse»-undertittel for `hendelseIds.length === 0`).
- Bruk samme ID-format.

---

## Output — `src/lib/ros-word-export.ts`

Speilbilde av endringene over:
- Linje 653–675 (kompakt referanse i hendelsesrad): les `content.beregninger.filter(b => b.hendelseIds.includes(h.id))`. Hvis ingen og `h.kreverBeregning`: render advarsel-rad med gul shading.
- Linje 705–760 (kap. 4): iterer `content.beregninger`, grupper per første tilknyttede hendelse, samme ID-format. Egen «Ikke tilknyttet hendelse»-blokk for ikke-tilknyttede.
- Importer `migrerBeregninger` ikke nødvendig – Word-eksporten antar at content allerede er migrert (skjer i editor før lagring/preview).

---

## Filer som endres

- `src/components/ros/RosPreview.tsx` — typer, `migrerBeregninger`, `byggBeregningIder`, output-rendering.
- `src/components/fraviksdokumentasjon/BeregningSection.tsx` — eksport av `calculatorTypes`.
- `src/pages/RosAnalyse.tsx` — fjern BeregningSection inni accordion, ny enkel «Krever beregning»-blokk, nytt kapittel-UI.
- `src/components/ros/UploadRosDialog.tsx` — kjør `migrerBeregninger` etter parsing.
- `src/lib/ros-word-export.ts` — output-rendering basert på `content.beregninger`.

Eksisterende lagrede ROS-data berøres ikke i DB; migrering kjøres on-the-fly ved lasting. Selve `BeregningSection`-komponenten beholdes (brukes fortsatt av fraviksdokumentasjon).
