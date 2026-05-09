## Mål
Sende en velkomst-/bekreftelses-e-post fra branndokumentasjon.no umiddelbart når en bruker starter prøveperioden via Stripe Checkout.

## Tilnærming
Bruke Lovable's innebygde e-postsystem (app-e-poster) — ingen tredjepartstjeneste eller API-nøkkel kreves. E-posten trigges fra Stripe-webhooken når en ny abonnementshendelse mottas, slik at den sendes uavhengig av om brukeren returnerer til appen etter checkout.

## Steg

1. **Sett opp e-postdomene** (hvis ikke allerede gjort)
   - Sjekke status på e-postdomenet for prosjektet
   - Hvis ingen domene er konfigurert: vise oppsettsdialog for `notify.branndokumentasjon.no`
   - DNS-verifisering kan fortsette i bakgrunnen — blokkerer ikke videre arbeid

2. **Sett opp e-post-infrastruktur**
   - Køsystem, suppression, unsubscribe-tokens, cron-jobb for sending

3. **Lag transactional-e-post-mal**
   - Ny mal: `trial-started.tsx` i `_shared/transactional-email-templates/`
   - Norsk innhold, profesjonell teknisk tone som matcher resten av appen
   - Inneholder:
     - Bekreftelse på at 14-dagers prøveperiode har startet
     - Hvilken plan (månedlig/årlig) og pris ved fornyelse
     - Dato når prøveperioden utløper og første belastning skjer
     - Lenke til "Min konto / Abonnement" for å si opp før utløp
     - Lenke til support
   - Registrere i `registry.ts`

4. **Lag unsubscribe-side**
   - Branded side i appen (f.eks. `/avmeld`) som validerer token og bekrefter avmelding

5. **Trigge sending fra Stripe-webhook**
   - I `stripe-webhooks` edge function: ved `customer.subscription.created` (eller `checkout.session.completed` for trial) — kalle `send-transactional-email` med:
     - `templateName: 'trial-started'`
     - `recipientEmail`: brukerens e-post (fra subscription metadata / customer)
     - `idempotencyKey: trial-started-${subscriptionId}` (sikrer ingen duplikater ved retry)
     - `templateData`: `{ name, planName, priceAtRenewal, trialEndDate, manageUrl }`

6. **Deploy og test**
   - Deploye edge functions
   - Teste i sandbox først (preview), så live på branndokumentasjon.no

## Tekniske detaljer
- Sender-domene: `notify.branndokumentasjon.no` (subdomene delegert til Lovable)
- Fra-adresse vises som `noreply@branndokumentasjon.no` hvis "display from root" aktiveres
- Webhook-trigger valgt fremfor frontend-trigger: garanterer at e-posten sendes selv om brukeren lukker fanen etter betaling
- Idempotensnøkkel basert på `subscription.id` hindrer dobbel sending ved Stripe retry
- E-postens body-bakgrunn er hvit (#ffffff) — system-krav, uavhengig av app-tema
- Avmeldingsfooter legges til automatisk av systemet — skal ikke inkluderes i malen

## Spørsmål før implementering
Sender bare én e-post (velkomst ved prøvestart). Stripe sender selv kvittering ved faktisk belastning. Si fra hvis du også vil ha:
- E-post 2-3 dager før prøveperioden utløper (påminnelse — Stripe gjør dette innebygd hvis du slo det på)
- E-post ved oppsigelse
- E-post ved fornyelse (utover Stripe-kvitteringen)