# Kontaktside

## Mål
Legge til en enkel kontaktside som viser e-post og telefon, tilgjengelig via en "Kontakt"-lenke ved siden av "Logg inn"-knappen i headeren — kun på forsiden (`/`).

## Hva som lages

### 1. Ny side: `src/pages/Kontakt.tsx`
Rute: `/kontakt`

Innhold (norsk, design i tråd med eksisterende profil):
- Sidetittel: "Kontakt"
- Kort ingress: "Ta gjerne kontakt ved spørsmål om Branndokumentasjon.no."
- Kort med kontaktinfo:
  - **E-post:** stian.olimstad@olimstadbrannrådgivning.no (mailto-lenke)
  - **Telefon:** +47 90 70 12 85 (tel-lenke)
- Bruker `AppHeader` øverst, `Card` fra shadcn for kontaktblokken, ikoner fra lucide (`Mail`, `Phone`).
- Plass reservert nederst med en kommentar i koden om at "mer innhold kommer her" (slik at det er enkelt å utvide til en infoside senere).

### 2. Rute i `src/App.tsx`
Legge til `<Route path="/kontakt" element={<Kontakt />} />`.

### 3. Lenke i header — kun på forsiden
I `src/pages/Index.tsx` ligger forsiden. Headeren brukes via `AppHeader`. For å unngå at lenken vises globalt, legges en valgfri prop på `AppHeader`:

- `AppHeader` får ny prop `showContactLink?: boolean` (default `false`).
- Når `true`, rendres en `<Link to="/kontakt">` som en `Button variant="ghost"` rett til venstre for `ThemeToggle` / "Logg inn".
- I `Index.tsx` settes `<AppHeader showContactLink />`.

Dette holder endringen lokal til forsiden og bryter ikke med "global header"-regelen.

## Tekniske detaljer
- Ingen backend-endringer, ingen skjema, ingen e-postsending i denne omgangen.
- Telefon og e-post som klikkbare `mailto:`/`tel:`-lenker.
- Æ/Ø/Å i e-postdomenet: rendres som vist, men `mailto:`-href bruker IDN-domenet `olimstadbrannrådgivning.no` direkte (moderne klienter håndterer dette; ellers kan vi bytte til punycode senere).
- Responsivt: lenken skjules ikke på mobil, men bruker kompakt størrelse (`size="sm"`) i tråd med "Logg inn"-knappen.

## Ute av scope (kan utvides senere)
- Utvidet info-/om-oss-innhold på `/kontakt`.
- Kontaktskjema med e-postutsendelse.
- Lenke i footer eller på andre sider.
