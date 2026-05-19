## Plan: Flytte Nivå 3-silo inn i Nivå 2-sirkel

For å tydeligere illustrere hierarkiet (Nivå 3 ⊂ Nivå 2 ⊂ Nivå 1) skal den oransje ringen med tilhørende silo flyttes slik at den står rett ved siden av gasskraftverket, inne i den lilla Nivå 2-sirkelen.

### Fremgangsmåte

1. Bruke `imagegen--edit_image` på `src/assets/ros-detaljeringsnivaa.jpg` med en målrettet prompt som:
   - Flytter den lille sylindriske tanken/siloen med den oransje ringen rundt til å stå like ved siden av gasskraftverket
   - Plasserer hele den oransje sirkelen tydelig inne i den lilla Nivå 2-sirkelen
   - Beholder den lilla sirkelen rundt gasskraftverket, blå Nivå 1-sone, bioenergiverket utenfor lilla, og alle øvrige elementer (landskap, tekst, kolonner under) uendret
2. Overskrive samme fil – ingen kodeendringer trengs siden input-skjema, preview og Word-eksport alle bruker denne filen.
3. Visuell QA: verifisere at oransje sirkel ligger helt inne i lilla, og lilla helt inne i blå. Kjøre ny edit-runde ved behov.

### Filer som endres

- `src/assets/ros-detaljeringsnivaa.jpg` (overskrives)
