# Plan: Forhåndsvisning og avkrysning av AI-funnet innhold

## Mål

Etter at AI har analysert et opplastet brannkonsept eller en tilstandsvurdering, skal brukeren se en oversikt over hva som ble funnet og kunne huke av/på hvert felt før det fylles inn i skjemaet. Tilsvarende som ROS-opplastingen allerede har.

## Endringer

### 1. `src/components/konsept/UploadConceptDialog.tsx` — ny review-status

- Utvid `status` med `"review"` mellom `"analyzing"` og `"done"`.
- Lagre AI-svaret i lokal state (`extractedData`) i stedet for å kalle `onDataExtracted` direkte.
- Bytt status til `"review"` når svaret kommer (så lenge minst ett felt har innhold).
- Ny review-UI inne i dialogen som viser:
  - **Metadata (kap. 1 & 2)** — gruppert liste av alle ikke-tomme metadata-felter (oppdragsgiver, prosjektnavn, adresse, gnr/bnr, kommune, tiltakstype, tiltaksbeskrivelse, bygningstype, areal, etasjer, tiltakshaver, ansvarlig søker, risikoklasse, prosjekteringsmetode, avgrensning, tilleggskrav, bygningshøyde, regelverk, bygningsbrannklasse, byggeår). Norske visningsnavn.
  - **Kapittel 3** — gruppert liste av alle felter i `kapittel3` som har eksplisitt verdi (true/false/ikke-tom streng). Booleans vises som «Ja»/«Nei».
  - Hvert felt har en `Checkbox` (alle krysset av som default). En «Velg alle / Fjern alle» øverst per gruppe.
  - Verdien vises sammen med feltnavnet, truncated om nødvendig.
  - Knapper nederst: «Avbryt» og «Fyll inn valgte felter».
- Når brukeren klikker «Fyll inn valgte felter», bygg et filtrert objekt som inneholder kun avkryssede felter (samme form som `ExtractedData`/`ExtractedKapittel3`) og kall `onDataExtracted(filtered)`.
- Behold dagens `setIfEmpty`-logikk i `Konsept.tsx` slik at allerede utfylte felter ikke overskrives — review-steget ekskluderer i tillegg de feltene brukeren ikke ønsker.
- Hvis AI ikke fant noe (metaCount + kap3Count = 0), behold dagens destructive toast og ikke gå inn i review.

### 2. Liten visnings-helper i samme fil

- Map fra feltnøkkel → norsk label (objekt). Felter som mangler i mappen vises med rå nøkkel.
- Bool → «Ja»/«Nei», string → vis som-er, lange strings trunkeres med tooltip via `title`.

### 3. Ingen endring i `Konsept.tsx`

- `onDataExtracted` mottar fortsatt et `ExtractedData`-objekt. Siden ikke-valgte felter er fjernet fra objektet, vil `setIfEmpty` automatisk hoppe over dem (verdien er `undefined`).
- Ingen endringer i edge function eller datamodell.

### 4. Toast-tekst

- Etter «Fyll inn valgte felter»: vis «N felter fylt inn» basert på antall valgte, ikke antall funnet.

## Ikke i scope

- Inline-redigering av AI-verdier før innsending (kun velge på/av).
- Endring av ROS-dialogen (har allerede review).
- Endring av selve datamodellen eller AI-prompten.

## Filer som endres

- `src/components/konsept/UploadConceptDialog.tsx`
