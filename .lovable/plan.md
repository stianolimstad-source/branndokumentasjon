## Mål

Samme oppførsel for Brannfarlig lagring som for Brannkonsepter: hvis brukeren ikke har aktivt abonnement, naviger direkte til `/brensellagring` (som viser "Krever abonnement"-skjermen) i stedet for å åpne prosjektvelger-popupen.

## Endring

### `src/pages/Index.tsx`

I klikk-håndteringen for `feature.href === "brensellagring-dialog"`:

- Hvis `isSubActive === true` → åpne `setShowBrensellagringDialog(true)` som i dag.
- Hvis ikke → `navigate("/brensellagring")` direkte.

Tilstandsvurdering og Fravik beholdes uendret.
