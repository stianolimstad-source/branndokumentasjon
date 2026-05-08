## Problem
`KonseptPreview` rendrer sin egen forside (linje 132–159 i `KonseptPreview.tsx`), og `MalForhandsvisning` legger til en egen temabasert forside på toppen — så det vises to forsider. Brukeren vil beholde den første (vår tema-baserte).

## Endring

### `src/components/konsept/KonseptPreview.tsx`
- Legg til ny valgfri prop `hideCover?: boolean` på `KonseptPreviewProps`.
- Pakk forside-blokken (linje 132–159) i `{!hideCover && (...)}`.
- Ingen andre endringer i logikk eller sidetelling — sidetallene brukes ikke synlig (`PageFooter` returnerer `null`).

### `src/components/gruppe/MalForhandsvisning.tsx`
- Send `hideCover` til `KonseptPreview`:
  ```tsx
  <KonseptPreview formData={{}} logoUrl={logoUrl} hideCover />
  ```

Ingen andre filer berøres.
