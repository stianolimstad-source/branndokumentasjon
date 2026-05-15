## Mål

Etter opplasting av en eksisterende ROS-analyse skal brukeren få en tydelig oversikt over funne hendelser og kunne velge hvilke som skal legges til (alle eller et utvalg).

## Endringer i `src/components/ros/UploadRosDialog.tsx`

### 1. Bredere dialog
- Endre `DialogContent` fra `sm:max-w-lg` til `sm:max-w-3xl` slik at oversikten får plass.

### 2. Ny oversiktstabell i review-steget
Erstatt dagens kompakte liste (`max-h-64 overflow-y-auto border rounded-md divide-y` med små tekstblokker) med en sortert tabell som viser alle hendelser:

| ☐ | # | Tittel | S | K | R |
|---|---|--------|---|---|---|

- Header med "velg alle"-checkbox.
- Hver rad: checkbox, nummer, tittel (truncate med tooltip på full tekst), S, K, og R = S×K med fargekoding fra `risikoFarge` (importeres fra `@/components/ros/RosMatriks`).
- Klikk på rad-tittel åpner et lite ekspanderbart panel under raden med beskrivelse, årsak, tiltak, restrisiko (bruk en enkel `useState` for `expandedIndex`).
- Tabellen scroller vertikalt (`max-h-[60vh] overflow-y-auto`), header er sticky.

### 3. Valgstate
- Ny `useState<Set<number>>` `selected`, initialisert til alle indekser når `data` settes.
- Helper `toggleAll`, `toggleOne(i)`.
- Vis teller: "X av Y valgt".

### 4. Filtrer før apply
- Endre `apply(mode)` slik at `onApply` får `{ ...data, hendelser: data.hendelser.filter((_, i) => selected.has(i)) }`.
- Disable knappene "Legg til" og "Erstatt eksisterende" hvis `selected.size === 0`.
- Oppdater knappetekstene til "Legg til valgte (N)" og "Erstatt med valgte (N)".

### 5. Toast-melding
- Bruk antall valgte i toast-teksten ("N hendelser ble importert").

## Ingen endringer i `src/pages/RosAnalyse.tsx`
`importHendelser` fungerer allerede riktig — den legger nye hendelser inn i `content.hendelser` og kaller `setContent`. Når brukeren ser "hendelser kom ikke med", skyldes det sannsynligvis at den nåværende oversikten er uleselig og at klikk på "Legg til" ikke føltes tydelig. Den nye dialogen med eksplisitt "Legg til valgte (N)"-knapp løser dette.

## Resultat
- Tydelig tabell med S/K/R og fargekoding.
- Mulighet til å velge alle eller plukke enkelte hendelser.
- Tydeligere knapper som viser hvor mange som blir importert.
