## Mål
For både brannkonsept og tilstandsvurdering (TEK17 og BF85) skal brukeren kunne registrere hvor mange av de tellende etasjene som ligger under bakken (kjelleretasjer), i tillegg til totalt antall etasjer.

Feltet er rent informativt — det endrer ikke eksisterende beregninger (brannklasse, bygningsbrannklasse osv. baseres fortsatt på totalt antall etasjer slik forskriftene legger opp til).

## Endringer

### 1. `src/pages/Konsept.tsx`
- Legg til nytt felt i `formData`-state: `etasjerUnderBakken: ""` (string, ved siden av `etasjer: ""` på ca. linje 526).
- I bygningsdata-skjemaet (rundt linje 3112–3122) der "Antall etasjer" allerede vises, endre layouten til to felter side om side i samme grid:
  - "Antall etasjer (totalt)" — eksisterende felt
  - "Hvorav under bakken" — nytt `Input type="number"`, bindet til `formData.etasjerUnderBakken`
- Validering (myk): hvis brukeren skriver inn flere under bakken enn totalt, vis liten advarsel under feltet (text-destructive). Ingen hardlock.
- For `Bygningsdel`-typen (linje 498–507): ikke nødvendig nå — brukeren har bedt om feltet på toppnivå (gjelder hele bygget). Lar bygningsdeler være uendret.

### 2. `src/components/konsept/KonseptPreview.tsx`
- I de tre tabellene som viser "Antall etasjer" (linje 522, 597, 691), bytt ut den ene raden med to rader:
  - "Antall etasjer (totalt)"
  - "Hvorav under bakken" — vises kun hvis `formData.etasjerUnderBakken` er satt og > 0; ellers vises "0" / "[Ikke angitt]" for å holde tabellen forutsigbar.

### 3. `src/lib/word-export-chapter3.ts`
- I de tre Word-tabell-radene (linje ~1997, 2085, 2154) som viser "Antall etasjer", legg til en tilsvarende ekstra rad "Hvorav under bakken" rett under, med samme regel: vises bare når feltet er satt.

Ingen endringer i logikk for brannklasse, bygningsbrannklasse, røykventilasjon, trapperomstype eller andre automatiserte beregninger.

## Filer som endres
- `src/pages/Konsept.tsx`
- `src/components/konsept/KonseptPreview.tsx`
- `src/lib/word-export-chapter3.ts`
