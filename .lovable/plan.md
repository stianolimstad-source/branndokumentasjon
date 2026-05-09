## Mål

Samme oppførsel for Tilstandsvurdering og Fraviksdokumentasjon på forsiden: hvis brukeren ikke har aktivt abonnement, naviger direkte til abonnement-låseskjermen i stedet for å åpne valg-popupen.

## Endring

### `src/pages/Index.tsx`

I `handleClick` for feature-kortene:

- `tilstand-dialog`: hvis `!isSubActive` → `navigate("/tilstandsvurdering")`, ellers `setShowTilstandDialog(true)`.
- `fravik-dialog` (else-grenen): hvis `!isSubActive` → `navigate("/fraviksdokumentasjon/kvalitativ")`, ellers `setShowFravikDialog(true)`.

Begge målruter er allerede beskyttet av `RequireSubscription`, og viser dermed "Krever abonnement"-skjermen med "Logg inn"-knapp.
