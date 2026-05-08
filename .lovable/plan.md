## Plan

1. Endre portal-flyten i `src/pages/Abonnement.tsx` slik at en ny fane åpnes synkront i selve klikket, før noen `await`-kall skjer.
2. Hente portal-URL-en etterpå og sende den inn i den allerede åpnede fanen med `location.replace(...)`, uten å skrive placeholder-HTML inn i vinduet.
3. Beholde robust fallback: hvis ny fane ikke kan åpnes, send brukeren til kundeportalen i samme fane.
4. Beholde lastetilstand på knappen så flere klikk ikke oppretter flere faner.
5. Verifisere at avbestillingslenken brukes riktig, siden backend allerede returnerer korrekt `cancelSubscription`-URL.

## Hvorfor dette bør løse problemet

- Nettverkskallet lykkes allerede og returnerer korrekt kundeportal-URL.
- Autorisasjonen sendes også riktig i preview.
- Det som sannsynligvis blir blokkert er `window.open(...)` fordi det skjer etter et async-kall og dermed ikke lenger regnes som en direkte brukerhandling.
- Forrige forsøk med forhåndsåpning hang trolig fordi blankvinduet fikk skrevet inn eget innhold før navigering.

## Tekniske detaljer

- Ikke gjøre endringer i backend-funksjonen med mindre verifisering viser at feil URL velges.
- Frontend-løsningen skal bruke mønsteret:
  - `const popup = window.open("", "_blank", "noopener,noreferrer")` direkte i klikkhandleren
  - hente portal-URL
  - `popup.location.replace(url)` når svaret kommer
  - fallback til `window.location.href = url` hvis popup er blokkert eller mangler
- Unngå `document.write`, `innerHTML` eller annen manipulering av det blanke popup-vinduet.

## Validering

- Test at knappen åpner kundeportalen uten popup-blokkering.
- Test at avbestillingssiden faktisk vises, ikke bare en tom fane.
- Test fallback til samme fane hvis nettleseren nekter popup.