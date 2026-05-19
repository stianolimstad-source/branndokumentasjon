## Plan: Justere Nivå 2-sirkel i illustrasjonen

Den lilla Nivå 2-sirkelen dekker i dag både gasskraftverket og bioenergiverket. Den skal snevres inn slik at den kun omslutter gasskraftverket (med tilhørende skorsteiner/anlegg), mens bioenergiverket ligger utenfor sirkelen — kun innenfor den store blå Nivå 1-sonen.

### Fremgangsmåte

1. Bruke `imagegen--edit_image` på eksisterende `src/assets/ros-detaljeringsnivaa.jpg` med en målrettet prompt som:
   - Krymper den lilla ovalen til kun å omslutte gasskraftverket
   - Flytter bioenergiverket utenfor den lilla sirkelen (fortsatt inne i blå)
   - Beholder alt annet uendret (landskap, øvrige anlegg, tre nivå-kolonner under, tekst, farger)
2. Overskrive samme fil slik at både input-skjema, preview (kap. 2.2) og Word-eksport automatisk bruker det oppdaterte bildet.
3. Visuell QA: åpne resultatet og verifisere at lilla sirkel kun dekker gasskraftverket og at bioenergi tydelig er utenfor. Hvis ikke, kjøre én ny edit-runde.

### Filer som endres

- `src/assets/ros-detaljeringsnivaa.jpg` (overskrives)

Ingen kodeendringer nødvendig.
