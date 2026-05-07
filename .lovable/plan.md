## Mål
Krav til panikkbeslag på dører i rømningsvei skal alltid gjelde for kraftstasjoner i kap. 3.11 (§11-14 / Kap. 30:7). Gjelder både brannkonsept og tilstandsvurdering, både TEK17 og BF85.

## Endringer

### 1. `src/components/konsept/KonseptPreview.tsx` (~linje 4498)
Vis panikkbeslag-raden hvis `romningsveiPanikkbeslag === true` **eller** bygget/bygningsdel er kraftstasjon. Tekst tilpasses for kraftstasjon:
- Kraftstasjon: "For kraftstasjon må dør i rømningsvei være utført for sikker rømning ved at døren kan åpnes manuelt med ett grep og uten bruk av nøkkel (panikkbeslag iht. NS-EN 1125)."
- Ellers: eksisterende RK5/RK6-tekst.

### 2. `src/pages/Konsept.tsx` (~linje 8578)
- Tving `romningsveiPanikkbeslag = true` og deaktiver checkboxen når kraftstasjon er valgt. Vis hjelpetekst: "Påkrevd for kraftstasjon."
- Sørg for at NS-EN 1125-referansen (linje 1195) også inkluderes når kraftstasjon (allerede styrt av samme flagg, så automatisk OK).

### 3. Word-eksport
- Sjekk om kap. 3.11 panikkbeslag-rad allerede eksporteres et sted; legg evt. til samme logikk. (Pågående søk indikerte ingen treff for `panikkbeslag` i `word-export-chapter3.ts` — hvis raden ikke eksporteres i dag, hopper vi over og lar HTML-preview/PDF være kanal. Bekreftes ved implementering.)

## Filer som endres
- `src/components/konsept/KonseptPreview.tsx`
- `src/pages/Konsept.tsx`
- evt. `src/lib/word-export-chapter3.ts` (kun hvis raden allerede finnes der eller skal legges til)

## Spørsmål
Skal jeg også legge inn panikkbeslag-raden i Word-eksporten (hvis den ikke finnes i dag), så den følger med i nedlastet rapport? Foreslår ja for konsistens.
