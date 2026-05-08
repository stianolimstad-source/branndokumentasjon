## Problem
Forhåndsvisningen og Word-eksporten av et faktisk brannkonsept/tilstandsvurdering matcher ikke `MalForhandsvisning` i bedriftsmalen. Den faktiske forsiden viser bare logo + caps-tittel + en tynn aksentlinje **over** tittelen, mens malen viser:
- Topp-stripe i primærfarge (klassisk)
- Stor mixed-case tittel ("Brannkonsept", ikke "BRANNKONSEPT") i primærfargen
- Italic undertittel ("Eksempel på dokumentutseende" → bruk reell tagline/prosjekttype)
- Aksentlinje **under** tittelen
- Prosjektnavn + dato sentrert
- Footer-stripe nederst med dato + sidetall

I tillegg har malen 3 varianter (`klassisk`, `moderne`, `minimalistisk`) — KonseptPreview rendrer kun én layout uavhengig av valgt mal.

## Mål
La forsiden i `KonseptPreview` (skjerm) og forsiden i `exportToWord` (Word-fil) speile `MalForhandsvisning` for valgt template, slik at det brukeren ser i bedriftsmal-fanen er nøyaktig det de får i sitt brannkonsept/tilstandsvurdering.

## Endringer

### 1. `src/components/konsept/KonseptPreview.tsx` — Ny forside per template
- Utvid `theme`-prop til også å inneholde `template?: TemplateId`.
- Erstatt nåværende forside-blokk (linje 134–162) med tre varianter, kopiert fra `MalForhandsvisning`:
  - **klassisk**: topp-stripe i primærfarge (h ≈ 14px), logo sentrert, tittel mixed-case stor + bold i `primaryColor`, italic undertittel hvis tilgjengelig, kort aksentlinje under tittel, prosjektnavn (bold) + adresse + dato sentrert, "Utarbeidet av"-blokk, footer-stripe nederst med tynn `borderTop accentColor`, dato venstre / "Side 1" høyre.
  - **moderne**: venstre kolonne (35 % bredde) i primærfarge med logo (negative bg) + dato + versjon. Høyre kolonne med liten aksent-bar over tittel, mixed-case tittel i primærfarge, undertittel i `accentColor`, prosjektnavn + "Utarbeidet av".
  - **minimalistisk**: ren layout, logo øverst venstre, lett skrift i primærfarge, undertittel i grått, full-bredde tynn aksentlinje, prosjektnavn venstre / dato høyre.
- Bruk `documentType === "tilstandsvurdering" ? "Tilstandsvurdering" : "Brannkonsept"` som tittel (mixed case, ikke caps).
- Hvis `theme` mangler (gjeste-/standardtilfelle uten bedriftsmal): bruk klassisk variant med default-farger fra `getTemplateDefaults("klassisk")` slik at vi alltid har noe konsistent.
- Behold `hideCover`-prop intakt (brukt fra `MalForhandsvisning` for å unngå dobbel forside).

### 2. `src/pages/Konsept.tsx` — Pass `template` videre
- I effekten som setter `previewTheme`, lagre også `template` fra `resolveDocumentTheme`-resultatet.
- Send hele `theme` (inkl. template) til `<KonseptPreview ... />`.

### 3. `src/pages/Konsept.tsx` — Word-eksportens forside per template
I `exportToWord` (etter at `theme` er resolvert), erstatt dagens forside-bygging (logo → caps tittel → aksentlinje → prosjekt/forfatter/dato) med template-basert konstruksjon:

- **klassisk** (default): 
  - Tom Paragraph med `shading: { fill: theme.primaryColor }` og liten high-spacing for å simulere topp-stripe (Word kan ikke true full-bleed, men vi får tilnærmet effekt med en tynn shaded paragraph over hele bredden).
  - Logo sentrert.
  - Mixed-case tittel "Brannkonsept"/"Tilstandsvurdering" i `primaryColor`, font fra `theme.fontFamily`, size 56.
  - Aksentlinje (Paragraph med `border.bottom`, color = `accentColor`, smal).
  - Prosjektnavn (bold), adresse, dato.
  - "Utarbeidet av"-blokk uendret.
  - Footer (allerede definert) får ekstra `borderTop` i accentColor — eller vi behold dagens footer (sidetall) og hopper over.
- **moderne**: drop venstre-kolonne (komplisert i Word) — i stedet en tydelig topp-stripe + tittel venstrejustert + accent-bar.
- **minimalistisk**: ingen stripe, lett tittelfont, full-bredde aksentlinje under metadata.

For å holde implementeringen håndterlig: lag en hjelpefunksjon `buildCoverParagraphs(theme, opts)` lokalt i `exportToWord` som returnerer riktig array av `Paragraph` basert på `theme.template`.

### 4. Tilpass eksisterende "andre tittel-paragraph" på Innholdsfortegnelse-siden
Den blir også rammet av template-fonten/fargen vi allerede satte; ingen ekstra endring nødvendig der.

## Avgrensninger
- Vi tema-styler fortsatt **kun forsiden** + standard font + TOC-tittelen i Word. Resten av rapportens kapitler beholder sin nåværende layout (kommer i senere runde).
- Topp-stripen i Word blir en smal shaded paragraph (Word støtter ikke ekte full-bleed bakgrunn uten section-tricks). Visuelt nær nok.
- Hvis brukeren ikke har en bedriftsmal, brukes klassisk default — samme som malens preview viser.

## Resultat
Forhåndsvisning av et faktisk brannkonsept eller tilstandsvurdering ser nå likt ut som forhåndsvisningen i bedriftsmalen for valgt template. Word-fila som lastes ned følger samme forsidestruktur.
