## Mål

Beregningsverktøyene skal kreve aktivt abonnement på lik linje med Brannkonsept. Brensellagring (brannfarlig lagring) har allerede dette, men skal verifiseres at meldingen vises korrekt for utloggede brukere.

## Endringer

### `src/App.tsx` – pakk inn verktøy-rutene i `RequireSubscription`

Følgende ruter får `<RequireSubscription feature="Beregningsverktøy">…</RequireSubscription>`:

- `/verktoy` (oversikten)
- `/verktoy/romningsvei`
- `/verktoy/straling`
- `/verktoy/flammehoyde`
- `/verktoy/omhyllingsflate`
- `/verktoy/persontall`
- `/verktoy/brannenergi`
- `/verktoy/brannmotstand`
- `/verktoy/brannareal`
- `/verktoy/roykventilasjon`

Rutene som allerede er låst med `RequireFullAccess` (`/verktoy/brannsimulering`, `/tek17-assistent`) beholdes uendret – de er strengere låst og påvirkes ikke.

### Brensellagring

`/brensellagring` har allerede `RequireSubscription`. Ingen kodeendring, men bekreftet at `RequireSubscription`-komponenten viser tydelig "Logg inn"-knapp når brukeren ikke er logget inn, og "Se abonnement" når innlogget uten aktivt abonnement. Dette dekker brukerens krav om at man får beskjed når man trykker på Brannfarlig lagring uten å være logget inn.

## Resultat

Utloggede brukere som klikker på et beregningsverktøy eller Brannfarlig lagring får samme låseskjerm som ved Brannkonsept, med tydelig "Logg inn"-knapp og henvisning til 14 dagers gratis prøveperiode.
