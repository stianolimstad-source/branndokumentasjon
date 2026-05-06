## Mål
Legge til "Kraftstasjon" som valgbar bygningstype i kap. 2.1 for både brannkonsept og tilstandsvurdering, for både TEK17 og BF85. Behandles likt som Industri/håndverk for de generelle branntekniske kravene. Egne særkrav (tilleggskrav) legges inn i en senere iterasjon.

## Endringer

### 1. `src/pages/Konsept.tsx` (TEK17-mapping)
- I `bygningsTypeRisikoklasseMap` (linje 73): legg til `"Kraftstasjon": "RK2"` (samme risikoklasse som Industri/Trafo).
- I `<Select>` for bygningstype TEK17 (ca. linje 3061 i hovedform og linje 3267 i bygningsdeler): legg til `<SelectItem value="Kraftstasjon">Kraftstasjon</SelectItem>` rett under "Industri" / under RK2-gruppen.
- I logikken som sjekker `bygningstype.includes("industri") || bygningstype.includes("lager")` (linje 1227, og evt. tilsvarende steder): utvid til også å matche `"kraftstasjon"`, slik at brannenergi-vurdering og andre industrispesifikke regler aktiveres.
- I `["Industri", "Kontor", "Garasje", "Lager"].includes(...)` (linje 4410) og lignende lister: legg til `"Kraftstasjon"` der industri behandles.

### 2. `src/lib/bf85-constants.ts` (BF85-mapping)
- Utvid type `BF85Bygningstype` med `| "Kraftstasjon"`.
- I `bf85BygningstyperListe` (linje 237): legg til `{ value: "Kraftstasjon", label: "Kraftstasjon", kap: "Kap. 34" }` rett etter Industri.
- I `getBygningsbrannklasse`-switchen: la `case "Kraftstasjon":` falle gjennom til samme behandling som `"Industri"` (samme tabell, samme brannbelastning-input).
- Sørg for at alle steder der `bygningstype === "Industri" || bygningstype === "Lager"` brukes (f.eks. for brannbelastning-input i Konsept.tsx linje 3162), inkluderer "Kraftstasjon".

### 3. Konsekvensjusteringer
- Sjekk `KonseptPreview.tsx` og `word-export-chapter3.ts` for hardkodede sjekker på "Industri"/"Lager" og inkluder "Kraftstasjon" der det styrer industri-spesifikk tekst/tabeller.
- Ingen endringer i ytterligere kapitler — kraftstasjon arver alt fra industri.

### 4. Forberedelse for tilleggskrav (kun struktur, ikke innhold)
- Ingen UI for særkrav i denne iterasjonen. Innholdet kommer i neste runde når du leverer konkrete tilleggskrav.

## Filer som endres
- `src/pages/Konsept.tsx`
- `src/lib/bf85-constants.ts`
- `src/components/konsept/KonseptPreview.tsx` (kun hvis hardkodede industri-sjekker finnes)
- `src/lib/word-export-chapter3.ts` (samme)

## Spørsmål før implementering
Vil du at "Kraftstasjon" skal vises som eget alternativ i nedtrekksmenyen (anbefalt), eller bakes inn under "Industri / kraftstasjon"-label? Planen over forutsetter eget alternativ.
