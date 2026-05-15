## Mål

Utvide hendelsesmodellen i ROS-analysen med flere felter (før/etter tiltak) og oppdatere editor, forhåndsvisning, Word-eksport og AI-import slik at strukturen blir konsistent overalt.

## Ny datamodell – `RosHendelse`

Felter (alle valgfrie utenom S/K-verdiene som har default 1):

- `tittel` – kort navn på hendelsen
- `sarbarhet` – Sårbarhet (NY)
- `hendelse` – Hendelse/scenario (NY, erstatter dagens "beskrivelse" semantisk; vi beholder `beskrivelse` for bakoverkompatibilitet ved innlasting)
- `arsak` – Årsak (beholdes)
- `beskrivelseSannsynlighetFor` – Beskrivelse av sannsynlighet (før tiltak) (NY)
- `beskrivelseRisikoFor` – Beskrivelse av risiko/konsekvens (før tiltak) (NY)
- `sannsynlighet` (S før) – 1–5
- `konsekvens` (K før) – 1–5
- (R før = S × K, beregnes)
- `tiltak` – Forebyggende tiltak (beholdes)
- `beskrivelseEtter` – Beskrivelse av risiko og konsekvens etter tiltak (NY)
- `sannsynlighetEtter` – S etter tiltak (1–5, default = S før)
- `konsekvensEtter` – K etter tiltak (1–5, default = K før)
- (R etter = Setter × Ketter, beregnes)
- `restrisiko` – Restrisiko (beholdes)

Bakoverkompatibilitet: gamle analyser uten de nye feltene leses som tomme strenger / kopierer S/K til "etter". `beskrivelse` (gammel) mappes ved load til `hendelse` hvis `hendelse` er tom.

## Filer som endres

### 1. `src/components/ros/RosPreview.tsx`
- Utvide `RosHendelse`-interface med nye felter.
- Endre hendelsesregister-tabellen i kap. 3 til ny kolonnestruktur:
  - Nr | Sårbarhet | Hendelse/scenario | Årsak | Beskr. S (før) | Beskr. R (før) | S | K | R | Forebyggende tiltak | Beskr. etter tiltak | S etter | K etter | R etter | Restrisiko
- Bruk `riskCellStyle` på både R-kolonner. Tabellen blir bred – bruk mindre font (9 px) og `tableLayout: fixed` med horisontal scroll-container.

### 2. `src/pages/RosAnalyse.tsx`
- `addHendelse`: initialiser nye felter (tomme strenger; `sannsynlighetEtter`/`konsekvensEtter` = 1).
- Ved load: migrer gamle hendelser (kopier `beskrivelse` → `hendelse` hvis tom; `sannsynlighetEtter`/`konsekvensEtter` = `sannsynlighet`/`konsekvens` hvis ikke satt).
- Editor (Accordion-innholdet) får ny seksjonsstruktur:
  - **Identifikasjon**: Tittel, Sårbarhet, Hendelse/scenario, Årsak
  - **Før tiltak**: Beskrivelse sannsynlighet, Beskrivelse risiko/konsekvens, S, K (med R-badge som vises live)
  - **Forebyggende tiltak**: Tiltak (textarea)
  - **Etter tiltak**: Beskrivelse, S, K (med R-badge)
  - **Restrisiko**: textarea
- Søkefilter utvides til å inkludere `sarbarhet` + `hendelse`.
- Header-badge i accordion-trigger viser både "R før → R etter" (f.eks. `4×3=12 → 2×2=4`).

### 3. `src/lib/ros-word-export.ts`
- Utvide hendelsestabell med samme kolonner som preview. Pga. plass: bruk landskapsorientering for kap. 3-tabellen, eller kompakt skrift (size 16). Anbefaler å beholde portrait men sette font-size 14 og `tableLayout` via prosent-bredder per kolonne.
- R-celler (før og etter) får fargekoding via `risikoShading`.

### 4. `supabase/functions/parse-ros-analysis/index.ts`
- Oppdater system-prompt: be modellen returnere nye felter. Mapping:
  - "Sårbarhet" → `sarbarhet`
  - "Hendelse/Scenario" → `hendelse`
  - "Beskrivelse av sannsynlighet" (før tiltak) → `beskrivelseSannsynlighetFor`
  - "Beskrivelse av konsekvens" (før tiltak) → `beskrivelseRisikoFor`
  - "Forebyggende og avhjelpende tiltak" → `tiltak`
  - "Beskrivelse av sannsynlighet og konsekvens etter tiltak" → `beskrivelseEtter`
  - "S etter / K etter" hvis finnes → `sannsynlighetEtter` / `konsekvensEtter`, ellers = før
  - "Restrisiko" → `restrisiko`
- Sanitering: clamp begge S/K-par til 1–5; `tittel` autogenereres som `sarbarhet – hendelse` hvis tom.

### 5. `src/components/ros/UploadRosDialog.tsx`
- Utvide `ExtractedRosData.hendelser` med nye felter (alle valgfrie strenger + S/K-etter).
- Vurderingstabellen i dialogen får én ekstra kolonne for "R etter" ved siden av dagens R, slik at brukeren ser begge.

## Visuelt – breddehåndtering

Kap. 3-tabellen blir bredere enn A4. Vi løser det med:
- Wrap rundt `<table>` i `<div style={{overflowX:'auto'}}>` i preview.
- I Word: redusere skrift (size 14) og bruke prosent-bredder; ingen sideorientering-endring (holder portrait for konsistens med resten av dokumentet).

## Bakoverkompatibilitet

- Eksisterende lagrede ROS-analyser leses uten feil; manglende nye felter blir tomme.
- Word-eksport av en gammel analyse viser tomme celler i nye kolonner – ingen migrering nødvendig i databasen siden `content` er JSONB.
