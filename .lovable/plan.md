## Rette opp innhold på abonnementssiden

### Bakgrunn
Brukeren påpeker at det står ting på abonnementssiden som ikke stemmer med hva produktet faktisk gjør. Alt skal være hardkodet og verifisert — ingenting skal være "gjettet" eller hintet om AI-funksjonalitet vi ikke har. I tillegg skal AI Brannkonsulent (under Beregningsverktøy) være låst for brukere uten spesiell tilgang.

### Endringer

#### 1. `src/pages/Abonnement.tsx` — fjerne AI-påstand fra featurelisten
I `FEATURES`-arrayen (linje 17–26) fjernes oppføringen:
- `"AI-assistert utfylling"`

Dette er den eneste posten som antyder AI-funksjonalitet i abonnementet, og den stemmer ikke med produktet i dag. De øvrige punktene (prosjekter, brannkonsept, tilstandsvurdering, fravik, brensellagring, beregningsverktøy, Word/PDF-eksport) beholdes.

#### 2. AI Brannkonsulent — bekrefte at den er låst
Verifisert at funksjonen allerede er låst på to nivåer:
- `src/pages/Verktoy.tsx`: kortet har `locked: true` og vises med låseoverlay for brukere uten full tilgang.
- `src/App.tsx` linje 101: ruten `/tek17-assistent` er pakket inn i `<RequireFullAccess>`.

Ingen kodeendring nødvendig her — låsingen virker som ønsket. Nevnes kun for sporbarhet.

### Tekniske detaljer
- Kun frontend-endring (én linje fjernes i `FEATURES`-arrayen).
- Ingen endringer i database, Stripe, edge functions eller ruter.
- Introduksjonspris-banneret og priskortene beholdes som de er.
