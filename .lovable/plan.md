## Mål

Fjern hele "kundeportal"-flyten (som åpner ekstern fane og ofte blokkeres) og la brukeren si opp abonnementet med ett klikk inne i appen — på samme måte som kjøp gjøres direkte via Paddle uten omveier. Tilgangen beholdes ut inneværende periode.

## Slik blir det for brukeren

På `/abonnement`, når abonnementet er aktivt:
- Knapp: **"Si opp abonnement"** (rød/outline).
- Klikk åpner en bekreftelsesdialog: *"Er du sikker på at du vil si opp? Du beholder tilgang ut perioden frem til {dato}."* — med valg "Avbryt" / "Si opp".
- Ved bekreftelse: kall til backend, toast "Abonnementet er sagt opp", og kortet oppdateres til å vise "utløper {dato}" (status `cancel_at_period_end`).
- Hvis abonnementet allerede er satt til opphør: vis i stedet en **"Gjenoppta abonnement"**-knapp som angrer oppsigelsen.

Ingen ny fane, ingen ekstern portal.

## Teknisk

**Ny edge function `cancel-subscription`** (basert på samme mønster som `customer-portal`):
- Verifiserer JWT, finner brukerens nyeste rad i `subscriptions` for valgt `environment`.
- Body: `{ environment, action: "cancel" | "resume" }`.
- `cancel`: `POST /subscriptions/{id}/cancel` med `effective_from: "next_billing_period"` via `getPaddleClient(env).subscriptions.cancel(...)`.
- `resume`: `PATCH /subscriptions/{id}` med `scheduled_change: null` for å fjerne planlagt oppsigelse.
- Returnerer `{ ok: true }`. Webhooken `subscription.updated` / `subscription.canceled` oppdaterer DB-raden (allerede implementert i `payments-webhook`), og `useSubscription` plukker opp endringen via realtime.

**Frontend `src/pages/Abonnement.tsx`:**
- Fjern `openPortal`, `portalLoading`, `window.open`-logikken og `ExternalLink`-knappen.
- Legg til `AlertDialog` (samme mønster som `MineProsjekter.tsx`) for bekreftelse.
- Vis "Si opp abonnement" når `!cancelAtPeriodEnd`, og "Gjenoppta abonnement" når `cancelAtPeriodEnd`.
- Kall `supabase.functions.invoke("cancel-subscription", { body: { environment, action } })`, så `refresh()` + toast.
- Behold visning av "utløper {dato}" som allerede finnes.

**Slett:** `supabase/functions/customer-portal/index.ts` (ikke lenger i bruk).

## Utenfor scope
- Bytte plan / oppgradering — kan legges til senere som egen knapp.
- Oppdatere betalingskort — Paddle håndterer dette automatisk ved neste fornyelse hvis kortet er utløpt; tar vi hvis behovet kommer.
