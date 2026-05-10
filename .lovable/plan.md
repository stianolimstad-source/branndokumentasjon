## Problem

På mobilvisning (390px) blir høyre side av forsiden kuttet. Hovedårsaken er den globale `AppHeader`: logo + tittel + flere knapper med tekst (Kontakt, Tema, Bell, Meny / Logg inn) tar mer plass enn 390px tillater og presses ut av skjermen. I tillegg har "Velkommen tilbake / Fullt dashboard"-raden på forsiden tekst som kan overflowe.

## Endringer (kun frontend / presentasjon)

### 1. `src/components/AppHeader.tsx`
Gjør header responsiv uten å fjerne funksjonalitet:
- **Logo-tittel**: Skjul tekst "Branndokumentasjon.no" på `< sm` (vis bare flammeikonet). Behold full tekst fra `sm:` og oppover.
- **Kontakt-knapp** (kun synlig på "/"): På mobil → ikon-only (`size="icon"`), behold label fra `sm:`.
- **Meny-knapp** (innlogget): På mobil → ikon-only (skjul "Meny"-label, fjern `mr-2` på ikon), behold label fra `sm:`.
- **Logg inn-knapp** (utlogget): På mobil → ikon-only, label fra `sm:`.
- Reduser `gap-2` til `gap-1` på mobil for høyre-gruppen (`gap-1 sm:gap-2`).
- Reduser ytre container-padding på mobil (`px-3 sm:px-4`) for å gi litt ekstra plass.

### 2. `src/pages/Index.tsx`
Sikre at heltest-raden ikke skaper overflow:
- "Velkommen tilbake"-raden: la `flex` wrappe på mobil (`flex-col sm:flex-row sm:items-center sm:justify-between gap-3`) slik at "Fullt dashboard"-knappen havner under på smale skjermer.
- Reduser hero-section vertikal padding på mobil (`py-8 sm:py-16`) for å hindre at innholdet skyves langt ned.
- Container-padding: `px-3 sm:px-4` for mer breddebudsjett.

### 3. `src/App.css` (opprydding)
Fjern den ubrukte Vite-default-CSS-en (`#root { max-width: 1280px; padding: 2rem; text-align: center; ... }`). Filen er ikke importert noe sted, men forvirrer fremtidige endringer. Erstatt med en tom kommentar eller slett innholdet.

## Verifisering
- Vis forsiden på 390px: header skal ha alle knapper synlige uten kutt; tittel-tekst skjult, kun ikon vises.
- Sjekk både utlogget (Kontakt + Tema + Logg inn) og innlogget (Tema + Bell + Meny) tilstand.
- Test på 360px (Galaxy S) og 414px (iPhone Pro Max) at ingenting kuttes og ingen horisontal scroll oppstår.
- Sjekk at desktop (≥`sm` 640px) ser ut som før med all tekst på knapper.

## Ikke i scope
- Ingen endringer i forretningslogikk, datakilder, RLS eller routing.
- Ingen endring av selve dashboardpanelet eller funksjonskortene (de wrapper allerede til 1 kolonne på mobil).
