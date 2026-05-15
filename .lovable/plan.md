## Endring

For tilstandsvurderinger skal kolonnen "Prosjekterende" i revisjonshistorikk-tabellen erstattes med "Utførende" (gjelder både BF85 og TEK17). Konsept-dokumenter (kap. 5) er uendret.

### 1. `src/components/konsept/KonseptPreview.tsx` (~linje 6004)
I tilstandsvurdering-grenen (kap. 3 Revisjonshistorikk) endre `<th>Prosjekterende</th>` → `<th>Utførende</th>`. Dataverdien (`rev.prosjekterende`) beholdes som lagringsnøkkel.

### 2. `src/pages/Konsept.tsx` (~linje 2561, Word-eksport)
I `createTableCellShaded("Prosjekterende", ...)` gjør header-teksten betinget av `documentType === "tilstandsvurdering"` → "Utførende", ellers "Prosjekterende".

### 3. `src/pages/Konsept.tsx` (~linje 10139, input-tabellen for revisjoner)
Endre `<th>Prosjekterende</th>` til "Utførende" når `documentType === "tilstandsvurdering"`.

## Avgrensning

- Kun visuell kolonneoverskrift endres. State-feltet `prosjekterende` beholdes for å unngå datamigrering.
- Konsept-dokumenter (kap. 5 Revisjonshistorikk, KonseptPreview.tsx linje 5970 og Konsept.tsx linje 3088 "Brannteknisk prosjekterende (PRO RIBR)") er uendret.
