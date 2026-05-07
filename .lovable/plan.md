## Mål
For kraftstasjoner skal dører til og i rømningsvei alltid slå ut i rømningsretningen — unntaket "lite antall personer" gjelder ikke. Dette skal håndteres automatisk i kap. 3.10 (§11-13 / Kap. 30:71–73) for både brannkonsept og tilstandsvurdering, både TEK17 og BF85.

## Endringer

### 1. Form (`src/pages/Konsept.tsx`, ~linje 8410–8418)
- Oppdag om bygningstype (eller noen av bygningsdelene) er "Kraftstasjon".
- Hvis ja:
  - Deaktiver checkboxen "Dør kan slå mot rømningsretning (lite antall personer)" (`disabled` + tving `dorerLiteAntallPersoner = false`).
  - Vis liten hjelpetekst under: "Gjelder ikke for kraftstasjon — alle dører til og i rømningsvei skal slå ut i rømningsretning."

### 2. Preview (`src/components/konsept/KonseptPreview.tsx`)
- I kap. 3.10 "Dører til rømningsvei" (~linje 4183):
  - Skjul `dorerLiteAntallPersoner`-li-elementet hvis kraftstasjon.
  - Legg til ny obligatorisk linje når kraftstasjon: "Alle dører til og i rømningsvei skal slå ut i rømningsretning."
- Samme tillegg vurderes i kap. 3.11 "Dør i rømningsvei" (~linje 4463) for konsistens.
- Gjelder uavhengig av `isBF85` siden samme tabell brukes.

### 3. Word-eksport (`src/lib/word-export-chapter3.ts`, ~linje 1298–1300)
- Speil samme logikk: skjul "lite antall personer"-bullet for kraftstasjon, og legg til ny bullet "Alle dører til og i rømningsvei skal slå ut i rømningsretning."

### 4. Deteksjonshelper
- Definer en lokal `erKraftstasjon`-sjekk: hovedbygning eller noen `bygningsdeler[i].bygningstype` lik `"Kraftstasjon"` (case-insensitive). Brukes i alle tre filer.

## Filer som endres
- `src/pages/Konsept.tsx`
- `src/components/konsept/KonseptPreview.tsx`
- `src/lib/word-export-chapter3.ts`

## Spørsmål
1. Skal regelen også gjelde i kap. 3.11 (§11-14 Rømningsvei) "Dør i rømningsvei"? Planen foreslår ja for konsistens.
2. Hvis bygget har flere bygningsdeler hvor bare én er kraftstasjon — skal regelen vises generelt, eller kun nevnes for kraftstasjon-delen? Planen foreslår å vise det generelt med formulering "For kraftstasjon: alle dører til og i rømningsvei skal slå ut i rømningsretning."
