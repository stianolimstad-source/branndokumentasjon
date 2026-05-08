## Mål

I stedet for de 4 håndlagde sidene i `MalForhandsvisning.tsx`, vis et komplett testbrannkonsept ved å gjenbruke selve `KonseptPreview` (samme komponent som brukes på konseptsiden). Da får man se alle TEK17-delene (kapittel 1–6, alle §11-krav, rømning, slokking osv.) eksakt slik de vil rendres i et ekte konsept, bare med tomt innhold.

## Endringer

### `src/components/gruppe/MalForhandsvisning.tsx`
- Fjern de fire egendefinerte sidene (Cover/TOC/Content1/Content2) og all tilhørende kode (Page-wrapper, Cover-varianter, dummy-tabeller).
- Behold `LogoOrPlaceholder`-fallback-logikken (`imgFailed`).
- Render i stedet:
  1. Én cover-side på toppen som viser logo + valgt template-stil (klassisk/moderne/minimalistisk) — slik at man ser primær/aksent/font på forsiden.
  2. Under coveret: `<KonseptPreview formData={{}} logoUrl={logoUrl} />` pakket i en hvit A4-bredde-container (`max-w-[800px]`, hvit bakgrunn, skygge) slik at det ser ut som dokumentpapir.
- Hele stacken ligger fortsatt i `flex flex-col items-center gap-6`, og scrollingen håndteres av `MalvalgPanel` sin `max-h-[80vh] overflow-y-auto`.

### `src/components/gruppe/MalvalgPanel.tsx`
- Oppdater hjelpeteksten til: "Forhåndsvisning av et tomt testkonsept med alle TEK17-deler — endelig innhold fylles ut per prosjekt."
- Ingen andre endringer (props uendret).

## Tekniske notater

- `KonseptPreview` aksepterer allerede `logoUrl` som prop og rendrer alle seksjoner uavhengig av om data finnes (tomme felter vises som tomme, men strukturen er komplett).
- Template-fargene (primær/aksent/font) påvirker fortsatt cover-siden i forhåndsvisningen. Selve `KonseptPreview` bruker faste stiler — det er bevisst, fordi den speiler hvordan konseptet faktisk genereres på siden i dag. Word-eksporten styres separat av `document-templates.ts` og er allerede tema-bevisst.
- Ingen DB- eller backend-endringer.

## Hva brukeren ser etterpå

- En A4-stor forside i valgt mal (logo + farger + font).
- Deretter et fullt scrollbart testkonsept med alle kapitler (1 Innledning, 2 Bygningsdata, 3 Branntekniske krav §11-4 til §11-17, 4 Utførelse/drift, 5 Revisjonshistorikk, 6 Litteratur) — tomt, men strukturelt komplett.
