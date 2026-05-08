## Problem

Når brukeren klikker "Administrer abonnement" åpnes en ny fane med teksten "Åpner kundeportal…", men den navigerer aldri videre til Paddle-portalen.

Edge-funksjonen `customer-portal` fungerer korrekt (loggene viser at den genererer gyldige `cancelSubscription`-URL-er fra Paddle). Problemet ligger i frontend i `src/pages/Abonnement.tsx`.

## Årsak

Dagens `openPortal`-funksjon bruker en "pre-open popup"-strategi:
1. Åpner et tomt vindu (`window.open("")`)
2. Skriver placeholder-HTML i den nye fanen
3. Venter på edge-funksjonen
4. Kaller `popup.location.replace(data.url)`

Å skrive `innerHTML` i en nyåpnet `about:blank`-fane setter dokumentet i en "loading"-tilstand som hindrer påfølgende navigering, og lar fanen henge på placeholder-teksten.

## Løsning

Forenkle flyten i `src/pages/Abonnement.tsx`:

1. Fjern pre-open popup-strategien helt.
2. Hent portal-URL først via `supabase.functions.invoke("customer-portal")`.
3. Når URL-en er hentet, åpne portalen i ny fane: `window.open(data.url, "_blank", "noopener,noreferrer")`.
4. Hvis `window.open` returnerer `null` (popup blokkert), fall tilbake til `window.top.location.href = data.url` slik at brukeren havner på Paddle i samme fane.
5. Behold `portalLoading`-state og spinner i knappen, og vis en toast-feilmelding hvis edge-funksjonen feiler.

Backend (`supabase/functions/customer-portal/index.ts`) er korrekt satt opp og trenger ingen endringer – den returnerer `cancelSubscription`-URL fra Paddle's customer portal session, som er den riktige måten å avslutte abonnement på.

## Filer som endres

- `src/pages/Abonnement.tsx` – kun `openPortal`-funksjonen
