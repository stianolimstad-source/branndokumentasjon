## Mål
Gi `stian.olimstad@olimstadbrannrådgivning.no` (jobb-konto) samme fulle tilgang som `stianolimstad@gmail.com` — uten Stripe-abonnement.

## Endring
Legge til e-posten i listen `FULL_ACCESS_EMAILS` på to steder:

1. `src/hooks/useSubscription.tsx` (linje 6) — styrer `isActive` og abonnementsstatus
2. `src/hooks/useIsFullAccess.ts` (linje 3) — styrer øvrige tilgangssjekker (bl.a. nedlasting via `useCanDownload`)

E-posten lagres i punycode-form siden Supabase-auth normaliserer det norske tegnet (`å`) til ASCII:
`stian.olimstad@xn--olimstadbrannrdgivning-15b.no`

Sammenligningen er allerede `toLowerCase()` i `useSubscription`. Jeg legger inn punycode-varianten i begge listene for å være sikker på at det matcher uansett hvordan auth-systemet returnerer adressen.

## Ikke i scope
- Ingen DB-endringer
- Ingen endring i Stripe-flyt
- Velkomst-e-post (venter fortsatt på DNS hos domene.no)
