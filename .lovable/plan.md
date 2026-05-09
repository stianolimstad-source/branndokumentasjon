## Mål

Bytte ut Paddle med Lovables innebygde Stripe-integrasjon. Vipps aktiveres i Stripe-dashbordet etter at kontoen er verifisert. Ingen aktive abonnenter, så ingen migrering av brukerdata kreves.

## Steg

### 1. Aktivere Stripe Payments
- Aktivere Lovables innebygde Stripe-integrasjon (ingen API-nøkkel kreves fra deg).
- Opprette de samme to produktene som finnes i Paddle:
  - **Branndok Pro Månedlig** — 500 kr/mnd
  - **Branndok Pro Årlig** — 5 000 kr/år
- Begge med 14 dagers gratis prøveperiode.

### 2. Bygge om frontend til Stripe
- Erstatte `src/lib/paddle.ts` med Stripe-klient (`src/lib/stripe.ts`).
- Erstatte `src/hooks/usePaddleCheckout.ts` med `useStripeCheckout.ts`.
- Oppdatere `src/hooks/useSubscription.tsx` til å lese fra Stripe-baserte abonnementsrader.
- Oppdatere `src/pages/Abonnement.tsx`:
  - Bytte ut Paddle-checkout med Stripe Checkout (redirect-flow).
  - Bytte ut "kanseller/gjenoppta/bytt plan"-kall til nye Stripe edge functions.
- Erstatte `src/components/PaymentTestModeBanner.tsx` slik at den leser Stripe test-mode i stedet for Paddle-token.

### 3. Bygge om backend (edge functions)
Erstatte tre Paddle-funksjoner med tilsvarende Stripe-funksjoner:
- `cancel-subscription` → bruker Stripe API
- `change-subscription-plan` → bruker Stripe API (proration ved oppgradering)
- `payments-webhook` → verifiserer Stripe-webhook signatur, oppdaterer `subscriptions`-tabellen
- `get-paddle-price` slettes (ikke nødvendig — Stripe price IDs brukes direkte)

### 4. Database
- Beholde `subscriptions`-tabellen, men:
  - Endre kolonnenavn: `paddle_subscription_id` → `stripe_subscription_id`, `paddle_customer_id` → `stripe_customer_id`.
  - Beholde `environment`-kolonne ("test"/"live").
- Tabellen er allerede tom (ingen aktive abonnenter), så migrering er trygg.

### 5. Rydde opp
- Slette Paddle-spesifikke filer: `supabase/functions/_shared/paddle.ts`, gamle Paddle-edge-functions.
- Fjerne Paddle-pakken fra `package.json`.
- Beholde Paddle-secrets i Supabase (de skader ikke noe — kan slettes manuelt senere).

### 6. Vipps (etter Stripe er live)
Vipps krever at Stripe-kontoen er verifisert først (samme prosess som Paddle: identitetsbekreftelse, bankdetaljer). Etter verifisering:
- Aktivere Vipps som betalingsmetode i Stripe-dashbordet → **Settings → Payment methods → Vipps**.
- Vipps dukker da automatisk opp som valg i checkout-en — ingen kodeendringer trengs.

## Hva du må gjøre selv

1. **I Stripe-dashbordet etter aktivering:** fylle ut samme info som i Paddle (org.nr., bankkonto i NOK, kontaktperson). Stripe verifiserer typisk på 1–2 dager.
2. **Etter verifisering:** aktivere Vipps i Stripe-innstillingene.
3. **Før publisering:** teste hele flyten i preview med Stripes testkort (`4242 4242 4242 4242`).

## Hva som ikke endres

- All annen funksjonalitet (brannkonsept, fraviksdokumentasjon, tilstandsvurdering osv.) er upåvirket.
- Eier-tilgang for `stianolimstad@gmail.com` (full tilgang uten abonnement) bevares.
- Prøveperiode på 14 dager bevares.
- Pris og produktnavn er identiske.

## Risiko

- **Mellomperiode uten betaling:** Mens Stripe-kontoen verifiseres (1–2 dager), vil ikke live-checkout fungere. Du kan fortsatt teste i preview. Anbefaling: ikke publiser før Stripe er verifisert.
- **Webhook-oppsett:** Lovable håndterer dette automatisk når Stripe aktiveres.
