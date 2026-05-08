# Plan for å fikse planbytte på abonnementssiden

## Hva som skjer nå
- Backend-bytte til årlig plan ser ut til å fungere.
- Databasen viser allerede `branndok_pro_yearly` for abonnementet ditt i testmiljøet.
- Feilen du ser nå kommer sannsynligvis av at frontend fortsatt viser gammel plan et øyeblikk, eller at samme bytte trigges en gang til og svarer med «Du er allerede på denne planen».

## Jeg vil gjøre
1. Oppdatere `Abonnement`-siden slik at planbytte håndteres idempotent i UI.
   - Hvis backend svarer at brukeren allerede er på valgt plan, skal siden behandle det som vellykket og oppdatere visningen i stedet for å vise feil.
   - Hindre dobbeltkjøring fra dialog/knapp mens forespørselen pågår.

2. Gjøre oppdateringen av abonnementsdata mer robust.
   - Tvinge en umiddelbar refresh av `useSubscription` etter vellykket planbytte.
   - Sørge for at realtime/polling ikke etterlater UI i gammel tilstand rett etter byttet.

3. Forbedre brukerbeskjeden på abonnementssiden.
   - Ved prøveperiode: vise at årlig plan er valgt og trer i kraft når prøveperioden utløper.
   - Unngå generisk feiltoast når resultatet egentlig er at byttet allerede er registrert.

4. Verifisere flyten etter endring.
   - Teste edge-funksjonen igjen.
   - Kontrollere at siden viser riktig plan etter bytte uten ny feiltoast.

## Tekniske detaljer
- `change-subscription-plan` returnerer nå korrekt for trial-bytte, men kan også returnere en «allerede på denne planen»-melding ved nytt kall.
- `subscriptions`-tabellen viser allerede årlig plan for brukeren, så problemet er nå primært i frontend-synkronisering og feilhåndtering.
- Endringene vil være begrenset til abonnementsflyten og ikke påvirke annen betalingslogikk.