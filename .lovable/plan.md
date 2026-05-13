## Mål
I BF85-modus skal kap. 3.6 (Kledninger og overflater) bare vise relevante :513/:514/:515-krav basert på `bygningsbrannklasse` og `etasjer`. Dette gjelder både inputtsiden, forhåndsvisning og Word-eksport (i dag finnes :513–:515 kun i preview, ikke i Word-eksport — se "Tekniske detaljer").

## Regler

### :513 Yttervegger i B-konstruksjon
- **Relevant kun** når `bygningsbrannklasse` ∈ {1, 2}
- Underavsnitt:
  - "Inntil 2 etasjer kan ha K2/Ut2": vis kun når `etasjer ≤ 2`
  - "Inntil 4 etasjer kan ha K2/Ut2 (med 20m/10m-regel)": vis kun når `etasjer ≤ 4`

### :514 Fasademateriale på vegg i A-konstruksjon
- Alltid potensielt relevant
- Underavsnitt:
  - "Inntil 2 etasjer K2/Ut2": vis kun når `etasjer ≤ 2`
  - "3 til 8 etasjer (med flammesperre >4 etg)": vis kun når `etasjer` ∈ [3, 8]
  - Hvis `etasjer > 8`: vis melding "Ingen lettelser for fasademateriale i bygning over 8 etasjer — krav til K1/Ut1."

### :515 Brennbar isolasjon
- **Relevant kun** når `bygningsbrannklasse` ∈ {3, 4} og `etasjer ≤ 2`

## Endringer

### 1. `src/pages/Konsept.tsx` (input — kap. 3.6)
- Linjer 7188–7205: Filtrér listen `[bf85_513, bf85_514, bf85_515]` basert på `bygningsbrannklasse` og `etasjer`.
- Vis kun relevante checkboxer.
- Hvis et krav blir irrelevant pga. endring i etasjer/BBK, sett tilhørende felt til `false` automatisk (via `useEffect`) for å unngå "spøkelses-state" som påvirker preview.

### 2. `src/components/konsept/KonseptPreview.tsx` (preview — kap. 3.6)
- Linjer 3180–3218: 
  - For `:513`: legg inn etasjer-baserte conditionals for hvert underavsnitt.
  - For `:514`: split tekstblokken i etasjer-baserte conditionals; legg til "over 8 etasjer"-melding.
  - `:515`: ingen interne underavsnitt — kun rendres når relevant.
- Ekstra sikkerhet: i tillegg til `formData.bf85_5xx`-flagget, sjekk relevans (i tilfelle data lagret før filteret ble innført).

### 3. (Valgfritt) Word-eksport
- I dag finnes ikke :513/:514/:515 i `word-export-chapter3.ts` for kap. 3.6. Vi gjør **ingen** endring her med mindre du ønsker at de skal eksporteres til Word i samme oppdatering. Standardvalg: ingen endring.

## Tekniske detaljer
- Bruk hjelpefunksjon `getRelevantBF85_5xx(bygningsbrannklasse, etasjer)` som returnerer `{ vis513: boolean, vis514: boolean, vis515: boolean, etasjerNum: number, bklNum: number }` for å unngå duplisering mellom Konsept.tsx og KonseptPreview.tsx. Plasseres i `src/lib/bf85-constants.ts`.
- `etasjer` kan være streng — parse til tall.
- Auto-uncheck skjer kun i én retning: når et felt blir irrelevant, settes til false. Bruker beholder kontroll for relevante felter.

## Spørsmål før implementering
Skal :513/:514/:515 også legges til i Word-eksporten (kap. 3.6) i samme oppdatering, eller forblir det kun i preview/inputt?