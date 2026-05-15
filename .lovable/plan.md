## Endringer i `src/pages/RosAnalyse.tsx`

**1. Flytt "Last opp eksisterende ROS"-knappen til toppen**
- Fjern `<UploadRosDialog onApply={importHendelser} />` fra Hendelser-seksjonen (rundt linje 396).
- Legg den inn i den sticky topplinjen (rundt linje 314), til venstre for Word/Lagre-knappene, slik at den er tilgjengelig uansett hvor på siden man er.
- "Ny hendelse"-knappen blir værende i Hendelser-seksjonen.

**2. Gjør lagreknappen alltid synlig i bunnen**
- Legg til en ny sticky bunnlinje (`sticky bottom-0 z-30 border-t bg-background/95 backdrop-blur`) nederst i editor-visningen, etter forhåndsvisning/grid-en.
- Plasser "Lagre"-knappen der (kan også speile Word-knappen for konsistens).
- Beholder lagreknappen i toppen også, eller fjerner den derfra — anbefaler å fjerne fra toppen for å unngå duplikat. Word-knapp og slett-knapp blir værende i toppen.

Ingen endringer i logikk, data eller andre filer.
