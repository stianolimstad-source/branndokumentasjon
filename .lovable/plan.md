## Mål
Aktiver betalt abonnement via Paddle (Lovables innebygde løsning) slik at brukere må abonnere for å få full tilgang til verktøyene. Gratis brukere får kun lese-/visningstilgang.

## Hva blir satt opp

### 1. Aktivere Paddle-betalinger
- Aktiverer Lovables innebygde Paddle-integrasjon (du trenger ikke egen Paddle-konto for å starte – sandbox/test opprettes automatisk).
- Pris settes senere av deg i Paddle-dashbordet. Vi setter opp én plan med både månedlig og årlig pris.
- For å gå live må du verifisere virksomheten din i Paddle.

### 2. Database
- Ny tabell `subscribers` (user_id, email, subscribed, subscription_tier, subscription_end, trial_end, paddle_customer_id, paddle_subscription_id, updated_at) med RLS – kun egen rad lesbar.
- Hjelpefunksjon `has_active_subscription(uuid)` (security definer) som returnerer true hvis bruker har aktivt abonnement, er i prøveperiode, eller er stianolimstad@gmail.com.

### 3. Edge functions
- `create-checkout` – starter Paddle-checkout for valgt plan (månedlig/årlig), inkl. 14 dagers trial.
- `check-subscription` – sjekker status mot Paddle og oppdaterer `subscribers`.
- `customer-portal` – åpner Paddle kundeportal for å si opp/endre.
- `paddle-webhook` – mottar `subscription.created/updated/canceled` og oppdaterer `subscribers`.

### 4. Tilgangskontroll i frontend
- Ny hook `useSubscription()` som henter abonnementstatus.
- Ny `RequireSubscription`-wrapper (samme mønster som `RequireFullAccess`) – viser hengelås-overlegg + "Start abonnement"-knapp på sider som krever abonnement.
- "Kun lesing/visning"-modell:
  - **Gratis tilgang**: Brukere kan navigere, åpne verktøy/sider, og se eksisterende UI.
  - **Krever abonnement** (eller stianolimstad@gmail.com): opprette/lagre prosjekter, opprette/lagre konsept, tilstandsvurdering, fravik, brensellagring, eksport av Word/PDF, AI-kall.
- Eksisterende `useCanDownload` og `useIsFullAccess` flettes med abonnementstatus.

### 5. Ny "Abonnement"-side (`/abonnement`)
- Viser nåværende status (gratis / prøveperiode med dager igjen / aktiv / utløpt).
- To pris-kort (månedlig / årlig) med "Start 14 dagers gratis prøve"-knapp som åpner Paddle-checkout i nytt vindu.
- "Administrer abonnement"-knapp (åpner Paddle kundeportal) for aktive abonnenter.
- Lenke til `/abonnement` legges i `AppHeader` (brukermeny) og som CTA på låste områder.

### 6. Etter publisering
- Du får en Paddle-webhook-URL som må limes inn i Paddle-dashbordet.
- Du oppretter selve produktet/prisene i Paddle (vi gir deg veiledning og Paddle Product/Price ID feltene legges som secrets).

## Det som IKKE inngår nå
- Faktisk pris og produkt opprettes av deg i Paddle etter aktivering.
- Vi rører ikke eksisterende hengelåser på Tilbud/Oppdragsbekreftelse/Sikkerhetsrutiner/Eksempelkatalog/Brannsimulering/AI Brannkonsulent – disse forblir låst til stianolimstad@gmail.com.
