## Mål
Skille **eksisterende barrierer** (forutsetninger som allerede ligger til grunn for risikovurderingen) fra **foreslåtte nye tiltak** (planlagte risikoreduksjoner), i tråd med NVE-veilederen.

## Endringer

### 1. `src/components/ros/RosPreview.tsx` – Datamodell og migrering
- Utvid `RosHendelse`-interfacet:
  ```ts
  eksisterendeBarrierer?: string;
  foreslatteTiltak?: string;
  /** @deprecated bruk eksisterendeBarrierer + foreslatteTiltak – beholdes for migrasjon */
  tiltak: string;
  ```
- I `migrerHendelse`: hvis `foreslatteTiltak` er undefined og `tiltak` har innhold, sett `foreslatteTiltak = tiltak`. La `eksisterendeBarrierer` være undefined.

### 2. `src/pages/RosAnalyse.tsx` – Editor
- Erstatt dagens enkelt-felt «Tiltak» (Area-komponent rundt linje 1184) med to nye felter under «Forebyggende tiltak»-overskriften:
  - **Eksisterende barrierer / forutsetninger** (Textarea rows=3, bundet til `h.eksisterendeBarrierer`). Hjelpetekst i `text-xs text-muted-foreground`: *«Hva er allerede på plass av tekniske og organisatoriske barrierer? Disse er forutsetninger for sannsynlighet- og konsekvensvurderingen.»*
  - **Foreslåtte nye tiltak** (Textarea rows=3, bundet til `h.foreslatteTiltak`). Hjelpetekst: *«Nye risikoreduserende tiltak som skal vurderes. Disse er ennå ikke implementert.»* Ved `onChange` oppdateres også `tiltak`-feltet med samme verdi for bakoverkompatibilitet (bl.a. bow-tie-aggregeringen som leser `a.tiltak`).
- `addHendelse` initialiserer `tiltak: ""`, `eksisterendeBarrierer: ""`, `foreslatteTiltak: ""`.

### 3. `src/components/ros/RosPreview.tsx` – Hendelsesregister-tabell
- Erstatt «Forebyggende tiltak»-kolonnen med to kolonner:
  - **Eksisterende barrierer** → `h.eksisterendeBarrierer || ""`
  - **Foreslåtte tiltak** → `h.foreslatteTiltak || h.tiltak || ""` (fallback til legacy)
- Oppdater `colSpan` på sub-rader (17 → 18) og minWidth på tabell + sticky scroll-proxy tilsvarende.

### 4. `src/lib/ros-word-export.ts` – Word-eksport
- I `hendelseHeader`: erstatt `smallHeader("Forebyggende tiltak", 8)` med to kolonner **«Eksisterende barrierer»** og **«Foreslåtte tiltak»** (juster width-prosent slik at totalen forblir 100).
- I radbygging (linje 654): erstatt `smallCell(h.tiltak || "", 9)` med to celler som leser hhv. `h.eksisterendeBarrierer || ""` og `h.foreslatteTiltak || h.tiltak || ""`.
- Oppdater alle `columnSpan: 17` til `18` for sub-rader (konsekvens-sub-tabell, beregningsnotat, kreverBeregning-notat).
- **Bow-tie-tilknyttede hendelser**: i seksjonen som rendrer hver topphendelse (rundt linje 800–870), hvis en tilknyttet årsakshendelse har `eksisterendeBarrierer` fylt ut, legg til en sub-blokk i Word-output under topphendelse-tabellen med tittel **«Eksisterende barrierer (forutsetninger for risikovurderingen)»** (paragraph bold) etterfulgt av en kort tabell: kolonne «Hendelse» + «Eksisterende barrierer» for hver tilknyttet årsak som har innhold.

## Tekniske detaljer
- Ingen DB-skjema-endringer (lagres i JSON-feltet).
- Det gamle `tiltak`-feltet beholdes som obligatorisk string og skrives kontinuerlig som speil av `foreslatteTiltak` for å unngå at bow-tie-aggregering i `RosPreview` (linje 1237) og evt. eksisterende lesere mister data inntil de migreres.
- Tabeller blir bredere – juster `minWidth` (1240 → 1340) og sticky scroll-proxy bredden tilsvarende i RosPreview.
