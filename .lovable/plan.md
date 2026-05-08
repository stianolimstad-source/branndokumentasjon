# Plan: Side-ved-side planer + sperre nedgradering fra årlig

## Endringer i `src/pages/Abonnement.tsx`

1. **Vis alltid begge planer side-ved-side** (samme grid som ved første kjøp), uavhengig av om brukeren er innlogget med aktivt abonnement.
   - Prisene (500 kr/mnd, 5 000 kr/år) vises tydelig på begge kort i alle tilstander.
   - Beholder "Spar ~17%"-merket på årlig.

2. **Tilstandsavhengige knapper på hvert plan-kort**:
   - Ingen aktivt abonnement: "Start gratis prøveperiode" (som i dag).
   - Aktivt abonnement på den planen kortet representerer: vis "Din nåværende plan" (deaktivert), pluss status (Prøveperiode / Aktivt / Utløper dato).
   - På månedlig (når bruker er på månedlig): "Bytt til årlig" på årskortet (oppgradering).
   - **På månedlig (når bruker er på årlig): knappen er deaktivert** med tekst "Tilgjengelig ved neste fornyelse" og en hjelpetekst "Du har allerede betalt for et år. Du kan bytte til månedlig ved neste fornyelse."
     - Trial-årlig er unntak: tillates fremdeles bytte (ingen reell betaling skjedd ennå). Logikken: deaktiver kun når `status === "active"` og `priceId === YEARLY_ID`.
   - Eier (`status === "owner"`) får ingen handlingsknapper på kortene.

3. **Egen "Administrer abonnement"-seksjon under kortene** (erstatter dagens store kort) for å samle status-info og oppsigelse/gjenopptakelse:
   - Viser status, gjeldende plan og periode-slutt.
   - Si opp / Gjenoppta-knapp.
   - Holder feature-listen ute herfra siden den allerede står på plan-kortene.

4. **Bevare eksisterende dialoger** (`confirmCancel`, `confirmSwitch`) og logikk for `runSwitch`/`runAction` uendret.

## Tekniske detaljer

- `canDowngradeToMonthly = priceId === YEARLY_ID && status === "trialing"` — eneste tilfellet hvor nedgrader-knappen er aktiv.
- Plankortet får en ny prop `state: "purchase" | "current" | "switch" | "locked"` som styrer knapp-tekst/-stil.
- Ingen endringer i edge-funksjoner eller database.