## Mål

Når en bruker har et aktivt abonnement på siden `/abonnement`, skal hen kunne se hvilken plan hen har og bytte mellom månedlig og årlig (oppgradere/nedgradere) — ikke bare si opp/gjenoppta.

## Endringer

### 1. `src/pages/Abonnement.tsx`
I "aktivt abonnement"-kortet:
- Vis hvilken plan brukeren har nå (Månedlig 500 kr eller Årlig 5 000 kr) basert på `priceId` fra `useSubscription`.
- Legg til en knapp "Bytt til årlig" (når månedlig er aktiv) eller "Bytt til månedlig" (når årlig er aktiv). Skjul knappen når `cancelAtPeriodEnd` er true eller status er `owner`.
- Bekreftelsesdialog som forklarer:
  - Ved oppgradering til årlig: byttet skjer umiddelbart, og Paddle pro-raterer differansen (faktureres med en gang).
  - Ved nedgradering til månedlig: byttet trer i kraft ved neste fornyelse (ingen umiddelbar fakturering).

### 2. Ny edge function `supabase/functions/change-subscription-plan/index.ts`
- Autentiser bruker (samme mønster som `cancel-subscription`).
- Input: `{ environment, newPriceId }` der `newPriceId` er den menneskelig lesbare ID-en (`branndok_pro_monthly` / `branndok_pro_yearly`).
- Slå opp Paddle-intern price-ID via `gatewayFetch(env, /prices?external_id=...)` (samme logikk som `get-paddle-price`).
- Hent brukerens `paddle_subscription_id` fra `subscriptions`-tabellen (filtrert på `environment`).
- Avgjør om det er oppgradering (måned → år) eller nedgradering (år → måned) basert på nåværende `price_id`.
- Kall Paddle `PATCH /subscriptions/{id}` med:
  - `items: [{ price_id: <ny paddle id>, quantity: 1 }]`
  - `proration_billing_mode: 'prorated_immediately'` ved oppgradering, `'do_not_bill'` ved nedgradering (trer i kraft ved neste fornyelse).
- Returnér `{ ok: true }`. Webhook (`payments-webhook`) oppdaterer DB som vanlig.

### 3. Ingen DB-endringer
`subscriptions.price_id` finnes allerede og oppdateres av webhook når planen endres.

## Tekniske detaljer

- Bruker eksisterende `gatewayFetch` fra `_shared/paddle.ts`.
- Frontend poller `refresh()` etter handling (samme mønster som cancel/resume) for å fange opp webhook-oppdateringen.
- Plan-IDer er hardkodet som konstanter i Abonnement.tsx (`branndok_pro_monthly`, `branndok_pro_yearly`) — samme som checkout-flyten.
- Ingen endringer i Paddle-katalogen (prisene finnes allerede).

## Bekreftelse på pro-rating

Paddle håndterer pro-rateringen automatisk basert på `proration_billing_mode`. Brukeren får ikke betalt for hele året på toppen av månedlig — kun differansen for resten av perioden.
