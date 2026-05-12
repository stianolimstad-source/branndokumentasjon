## Mål

For tilstandsanalyser etter BF85 hvor bygningstype er **Industri** eller **Kraftstasjon**, skal kap. 3.4 "Generelt" i rapporten erstattes med relevant informasjon fra Tabell 34:23 (basert på valgt brannbelastning og evt. brannventilasjon/sprinkler), i stedet for den generiske teksten. Hele tabellen vises på inputsiden som referanse, men kun den relevante linjen tas med i rapporten.

## Endringer

### 1. `src/pages/Konsept.tsx` (inputside, kap. 3.4)

Når `regelverk === "BF85"` og `bygningstype` er "Industri" eller "Kraftstasjon":

- Vis en kompakt referansetabell (Tabell 34:23) med kolonner:
  - Brannbelastning (MJ/m²)
  - Største grunnflate uten brannventilasjon/sprinkler
  - Med brannventilasjon
  - Med sprinkleranlegg
- Tabellen vises kun på inputsiden, plassert i kap. 3.4-blokken nær feltene for brannbelastning/brannventilasjon/sprinkler, slik at brukeren enkelt kan kontrollere hvilken rad som blir aktiv.
- Marker den raden som matcher valgt brannbelastning visuelt (f.eks. uthevet bakgrunn).

### 2. `src/components/konsept/KonseptPreview.tsx` (rapport, kap. 3.4)

Når `regelverk === "BF85"` og `bygningstype` er "Industri" eller "Kraftstasjon":

- Erstatt den eksisterende generiske "Generelt (:61)"-raden ("Største grunnflate etter kap. 31 til 39 kan økes dersom bygningen oppdeles med brannvegg…") med én rad som henter relevant tall fra Tabell 34:23 basert på `formData.brannbelastning` og evt. `formData.brannventilasjon` / `formData.sprinkler`.
- Eksempeltekst:  
  *"Iht. BF85 Tabell 34:23 tillates inntil {maksAreal} m² bruttoareal pr. etasje for {bygningstype} med brannbelastning {brannbelastning} MJ/m²{ , med brannventilasjon | , med sprinkleranlegg | uten brannventilasjon/sprinkler}."*
- Hvis brannbelastning ikke er valgt: vis en fallback-tekst som ber bruker fylle inn feltet på inputsiden.
- Den eksisterende "Tabell 34:23"-vurderingsraden (faktisk areal vs. tillatt areal) beholdes uendret.
- Andre BF85-bygningstyper (Kontor, Garasje, Lager, Skole) og TEK17-grenen er **uendret**.

### 3. Datakilde

- Bruk eksisterende konstanter i `src/lib/bf85-constants.ts` hvis Tabell 34:23-data allerede finnes der. Hvis ikke, legg til en ny konstant `TABELL_34_23` med radene fra forskriften (kun for Industri/Kraftstasjon).

## Ikke endret

- `src/lib/word-export-chapter3.ts` (Word-eksport følger samme logikk via preview-data hvis den allerede speiler preview; ellers speiles endringen der).
- Beregningslogikk, RLS, andre kapitler.

## Avklaring nødvendig

Jeg trenger de eksakte tallene fra Tabell 34:23 (BF85, kap. 34) for Industri og Kraftstasjon — radene for ulike brannbelastninger og kolonner for hhv. uten tiltak / med brannventilasjon / med sprinkleranlegg. Hvis disse allerede ligger i `bf85-constants.ts` bruker jeg dem; ellers ber jeg deg lime inn tabellen før implementering.
