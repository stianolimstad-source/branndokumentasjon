## Problem

1. **Fargene endres ikke** når man klikker på en mal-knapp (Klassisk / Moderne / Minimalistisk). I dag oppdateres bare `template`-state, mens primær- og aksentfarge + skrift forblir det forrige valget. Brukeren forventer at malens forhåndsdefinerte farger lastes inn umiddelbart.

2. **Logoen vises ikke** stabilt i forhåndsvisningen:
   - I "moderne" plasseres logoen på en mørk fargeblokk med kun `bg-white/10` bakgrunn — en mørk logo blir nesten usynlig.
   - Hvis gruppen ikke har lastet opp logo brukes ingen logo i det hele tatt, selv om brukeren har en profil-logo som naturlig fallback.
   - I dag vises forhåndsvisningen kun med logo dersom `logoUrl` finnes — ingen "fallback"/plassholder, og brukeren har sagt at logoen "alltid" skal med på bedriftens dokumentmal.

## Endringer

### `MalvalgPanel.tsx`
Når en mal-knapp klikkes, hent malens default-verdier fra `document-templates.ts` og oppdater `primary`, `accent` og `font` samtidig. Brukeren kan deretter justere fargene videre om ønsket. Fargevelger og forhåndsvisning oppdateres umiddelbart.

Også: ta inn `profileLogoUrl` (brukerens egen logo fra profilen) som fallback-prop. Hvis gruppen ikke har en egen logo, bruk profil-logoen i forhåndsvisningen — slik at det alltid vises noe.

### `GruppeDetalj.tsx`
Send med `profileLogoUrl` til `MalvalgPanel` (verdien finnes allerede i state).

### `MalForhandsvisning.tsx`
- Bruk effektiv logo: `logoUrl ?? profileLogoUrl`.
- I "moderne"-malen: gi logo-wrapperen en hvit bakgrunn (`bg-white`) i stedet for `bg-white/10`, slik at både lyse og mørke logoer er synlige på den mørke fargeblokken.
- Hvis ingen logo finnes overhodet, vis en liten plassholder ("Logo") med stiplet ramme og en hint-tekst ("Last opp logo for å se den på malen") i stedet for tom plass.

### Eksponere defaults
I `document-templates.ts` eksporter `DEFAULTS`-mappingen (eller en helper `getTemplateDefaults(id)`) så `MalvalgPanel` kan hente farger ved bytte av mal uten å duplisere verdier.

## Filer

- **Endret:** `src/lib/document-templates.ts` — eksporter `getTemplateDefaults(template)`
- **Endret:** `src/components/gruppe/MalvalgPanel.tsx` — oppdater farger/skrift ved mal-bytte; ta inn `profileLogoUrl`
- **Endret:** `src/components/gruppe/MalForhandsvisning.tsx` — fallback-logo og synlig wrapper i "moderne"; plassholder hvis ingen logo
- **Endret:** `src/pages/GruppeDetalj.tsx` — send `profileLogoUrl`-prop

Ingen DB- eller eksport-endringer.
