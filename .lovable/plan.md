## Endring – BF85 heissjakt

### 1. Ny relevans-knapp i editoren

`src/pages/Konsept.tsx` (~linje 5420, før heissjakt-blokken): Når `regelverk === "BF85"`, vis først en Ja/Nei-velger:

> "Er heissjakt relevant for bygget?"

Lagres i nytt felt `heissjaktRelevantBF85: "ja" | "nei" | undefined` (initialiseres som `undefined` ~linje 627–632).

Hvis `"nei"` (eller udefinert): Hele heissjakt-tekstboksen skjules. Ingenting rendres i kap. 3.5 i preview eller Word.

Hvis `"ja"`: Tekstboksen vises som i dag, men auto-tekst for BF85 erstattes (se neste punkt).

### 2. BF85-tekst forenkles

`src/pages/Konsept.tsx` linje 5424–5430 (`getHeissjaktkravOriginalTekst` BF85-grenen): Erstatt dagens 3-punkts liste med:

> "Heissjakt skal være egen branncelle med brannmotstand minst A 60. Heisen skal ha egen krets for strømtilkobling. Det var ikke flere branntekniske krav til heisen i Byggeforskrift 1985."

Rebehandling for BF85: hvis `heissjaktkravTekst` er tom og `heissjaktRelevantBF85 === "ja"`, auto-fyll med ny tekst. Hvis brukeren slår av relevansen, ikke nullstill — bare skjul rendering.

### 3. Render-gating i preview

`src/components/konsept/KonseptPreview.tsx` linje 2200–2210 (Heissjakt-blokk): Legg til betingelse — for BF85 må `formData.heissjaktRelevantBF85 === "ja"` for at blokken skal rendres. TEK17-flyt uendret.

### 4. Render-gating i Word

`src/lib/word-export-chapter3.ts` linje 651–664: Speile samme BF85-betingelse.

## Ikke endret

- TEK17 heissjakt-logikk og -tekster.
- `heissjaktkrav`-array (brukes kun i Word-eksportens checkbox-baserte fallback for TEK17).
- Heismaskinrom-feltet (eget felt, beholdes).

## Spørsmål

Skal Ja/Nei-velgeren ha en spesifikk default (forslag: ingen valgt, med liten hjelpetekst om at eldre bygg ofte mangler heis), eller skal den default til "Nei"?
