## Mål
Legge til en seksjon på "Min profil" hvor brukeren kan se kvitteringer (fakturaer) for betalte abonnementer.

## Endringer

### 1. Ny edge function: `supabase/functions/get-stripe-invoices/index.ts`
- Henter innlogget bruker fra Authorization-header (verify_jwt = false, manuell `auth.getUser`).
- Bruker `createStripeClient(env)` fra `_shared/stripe.ts`.
- Finner Stripe-kunde via `metadata['userId']` (subscriptions.search → customers.search → email fallback).
- Lister fakturaer for kunden (`stripe.invoices.list`, limit 100).
- Returnerer: `id, number, status, amount_paid, currency, created, hosted_invoice_url, pdf_url, description`.

### 2. `supabase/config.toml`
- Legg til `[functions.get-stripe-invoices]` med `verify_jwt = false`.

### 3. `src/pages/MinProfil.tsx`
- Nytt kort "Kvitteringer / Fakturaer" (vises kun hvis bruker har abonnement, dvs. `useSubscription().isActive` eller alltid fetch og skjul hvis tom liste).
- Henter fakturaer via `supabase.functions.invoke("get-stripe-invoices", { body: { environment: getStripeEnvironment() } })`.
- Tabell med kolonner: dato, beskrivelse, beløp, status, "Last ned PDF" (lenke til `pdf_url`) og "Vis kvittering" (lenke til `hosted_invoice_url`, åpnes i ny fane).
- Loading-state, tom-state ("Ingen kvitteringer funnet"), feilhåndtering med toast.
- Norske labels, formatert dato (no-NB) og beløp.

## Ikke endret
- Stripe-produkter, abonnementsmodell, webhook, DB-skjema, andre sider.
