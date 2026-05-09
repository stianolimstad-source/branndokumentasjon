## Mål

Utloggede brukere / brukere uten abonnement skal ikke se popupen "Start nytt brannkonsept / Mine prosjekter" når de trykker på Brannkonsepter-kortet på forsiden. De skal gå direkte til `/konsept`, som viser "Krever abonnement"-skjermen.

## Endring

### `src/pages/Index.tsx`

Importer `useSubscription` og bruk `isActive` i klikk-håndteringen for Brannkonsepter-kortet (`feature.href === "dialog"`):

- Hvis `isActive === true` → åpne popupen som i dag.
- Hvis ikke → `navigate("/konsept")` direkte, slik at `RequireSubscription`-komponenten viser låseskjermen med "Logg inn"-knapp.

Kun Brannkonsepter-popupen endres. Tilstandsvurdering, Fravik og Brensellagring beholdes uendret (brukeren nevnte kun konsepter).
