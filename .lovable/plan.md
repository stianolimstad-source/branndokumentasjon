## Mål
La `stianolimstad@hotmail.com` starte helt på nytt med tom abonnementsstatus, slik at "Start gratis prøveperiode" vises og hele kjøpsflyten kan testes igjen.

## Hva som finnes nå
Én rad i `subscriptions` for denne brukeren:
- `stripe_subscription_id`: `sub_01kr395r0vktyd2g96yzca2fwm`
- `status`: `trialing`, `cancel_at_period_end: true`
- `environment`: `sandbox`, `current_period_end`: 2026-05-22

Dette er en ekte Stripe sandbox-prøveperiode (ikke Paddle).

## Steg

1. **Kanseller abonnementet i Stripe sandbox** via en engangs `supabase--curl_edge_functions`-kall mot `cancel-subscription` med din innloggede sesjon — nei, går ikke siden vi er logget inn som annen bruker. I stedet: kall Stripe direkte fra en kort skript-kjøring i sandbox via en midlertidig edge-funksjon-curl, eller enklere — sett `status='canceled'` og fjerne raden lokalt, og la Stripe sandbox-suben "henge" (sandboxen er kun for test, ingen kostnad).

2. **Slett DB-raden** via en migrasjon (DELETE-statement med eksplisitt `stripe_subscription_id`-filter for sikkerhet). Webhook vil ikke gjenskape raden så lenge ingen ny Stripe-event kommer.

3. **Gjenåpne preview** og logg inn som `stianolimstad@hotmail.com`. Du skal nå se de to plan-kortene med "Start gratis prøveperiode"-knapp og ingen "Administrer abonnement"-seksjon.

## Teknisk note
Vi sletter bare DB-raden. Den gamle Stripe sandbox-suben blir liggende inaktiv i sandbox (utløper 22. mai uansett, ingen reell kostnad). Hvis du vil ha den helt ryddet kan jeg legge til ett ekstra steg som kaller Stripe API for å kansellere suben umiddelbart — si fra om du ønsker det.

## Etter implementering
Test ny flyt:
1. `/abonnement` → "Start gratis prøveperiode" på månedlig
2. Kortnummer `4242 4242 4242 4242`, utløp `12/30`, CVC `123`
3. Verifiser at status blir "Prøveperiode" og at "Administrer betaling og fakturaer"-knappen dukker opp
