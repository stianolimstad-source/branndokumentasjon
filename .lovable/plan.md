## Mål
Lås den årlige abonnementsplanen midlertidig på `/abonnement`. Månedlig plan forblir den eneste kjøpbare planen inntil videre. Ingen endringer i Stripe-priser eller backend – kun UI.

## Endringer i `src/pages/Abonnement.tsx`

1. **Legg til en konstant** `YEARLY_LOCKED = true` øverst slik at vi enkelt kan skru på årlig igjen senere ved å sette den til `false`.

2. **Skjul "Spar ~17%"-badge** og fjern `recommended`-uthevingen fra årlig-kortet når låst.

3. **Erstatt knappen i årlig-kortet** med en deaktivert "Kommer snart"-knapp (med låseikon). Bruk `disabled` + tydelig tekst:
   - Tittel-badge: "Kommer snart" i stedet for "Spar ~17%"
   - Knapp: `<Button disabled>Kommer snart</Button>`
   - Liten beskrivelse under: "Årlig abonnement åpnes senere."

4. **Layout-justering**: Når årlig er låst, vis månedlig-kortet sentrert og smalere (f.eks. `max-w-md mx-auto`) slik at siden ikke ser tom ut, i stedet for to-kolonners grid. Behold årlig-kortet synlig som "kommer snart" til høyre på desktop (grid beholdes), men uten kjøpsmulighet — dette signaliserer at det kommer.

   Anbefalt: behold 2-kolonners grid med begge kortene synlige, men årlig-kortet er låst. Dette gir best forventningsstyring.

5. **Nåværende abonnenter på årlig**: Hvis en bruker allerede har årlig (`priceId === YEARLY_ID`), skal kortet fortsatt vises som "Din plan" med riktig status og administrasjonsmuligheter (avbestill/fornye via portal). De skal IKKE blokkeres. Logikken `stateFor(YEARLY_ID)` returnerer `current` for disse — vi viser da kortet normalt uten "Kommer snart"-låsen.

6. **Skjul "Bytt til årlig"-mulighet**: I `stateFor`, når `cardPlan === YEARLY_ID && priceId === MONTHLY_ID && YEARLY_LOCKED`, returner `{ kind: "purchase" }` men i UI vis låst "Kommer snart" i stedet (siden brukeren ikke skal kunne bytte til en låst plan).

## Logikk-oppsummering for årlig-kortet
- Hvis bruker har YEARLY allerede → vis normalt som "Din plan" (admin)
- Ellers (uansett om innlogget eller ikke, månedlig eller ingen abonnement) → vis låst "Kommer snart"-versjon

## Ikke i scope
- Ingen endringer i Stripe-produkter, priser, edge-funksjoner eller database
- Ingen endringer i `useSubscription`, `useStripeCheckout` eller webhook-håndtering
- Ingen endringer i `MONTHLY_ID`/`YEARLY_ID`-konstantene

## Verifisering
- Ikke innlogget: månedlig kjøpbar, årlig viser "Kommer snart"
- Innlogget uten abonnement: månedlig kjøpbar, årlig låst
- Innlogget med månedlig: ingen "Bytt til årlig"-knapp, årlig viser "Kommer snart"
- Innlogget med årlig (legacy): årlig viser "Din plan" + admin
