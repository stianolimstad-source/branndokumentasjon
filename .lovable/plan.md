# Utvide kontaktsiden med info-seksjoner

## Mål
Legge til to informasjonsbokser på `/kontakt` som forklarer hva man kan ta kontakt om.

## Endring
Kun `src/pages/Kontakt.tsx` oppdateres. Under det eksisterende kontaktinfo-kortet legges to nye `Card`-blokker:

### 1. "Egne maler og spesialløsninger"
Ikon: `FileCog` (lucide).
Tekst:
> Trenger bedriften din egne maler eller andre spesialløsninger for å bruke Branndokumentasjon.no? Ta kontakt, så finner vi en løsning som passer dere.

### 2. "Samarbeid og videreutvikling"
Ikon: `Handshake` (lucide).
Tekst:
> Har du innspill, ønsker å samarbeide om videreutvikling av produktet, eller vurderer å investere? Vi tar gjerne en uforpliktende prat.

## Layout
- Samme `max-w-2xl` container som i dag.
- `space-y-6` mellom kortene.
- Ikon i venstre kolonne (samme stil som e-post/telefon-radene: rund/avrundet `bg-primary/10 text-primary`-boks), tittel + brødtekst i høyre kolonne.
- Følger eksisterende design (semantiske tokens, `shadow-soft`).

## Ute av scope
- Kontaktskjema (kun visning av info i denne omgangen).
- Endring av header/rute (allerede på plass).
