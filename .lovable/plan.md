## Mål
Gjør omhyllingsflate-beregningen i brannenergi-verktøyet (modus "Per omhyllingsflate") identisk med det dedikerte omhyllingsflate-verktøyet, slik at de fungerer sømløst sammen. Vi løser det ved å **gjenbruke `OmhyllingsflateCalculator` direkte** som sub-komponent i stedet for å duplisere logikk.

## Endringer

### 1. `src/components/fraviksdokumentasjon/calculators/OmhyllingsflateCalculator.tsx`
- La til en valgfri prop `onValueChange?: (totalOmhylling: number | null, modus: "noyaktig" | "forenklet") => void`.
- Kall `onValueChange` i `useEffect` parallelt med eksisterende `onResult`-kall, samt når `result` blir `null` (ved modusbytte/reset).
- Eksisterende oppførsel (verktøy-side og fravik-dialog) er uendret.

### 2. `src/components/fraviksdokumentasjon/calculators/BrannenergCalculator.tsx`
I "Per omhyllingsflate"-fanen:
- Erstatt det innebygde `<Tabs>` for "Beregn (ca. fra høyde)" / "Oppgi manuelt" og dets felter med en innfelling av `<OmhyllingsflateCalculator />` (uten `onResult`, men med `onValueChange`).
- Lagre returverdien i state `omhyllingFraVerktoy: { value: number; modus: "noyaktig" | "forenklet" } | null`.
- Bruk denne verdien som `omhyllingsflate` videre i beregningen `q_omh = Q / A_omh`.
- Når `modus === "forenklet"` markeres total/visning med "≈" / "ca."; når `"noyaktig"` vises eksakt verdi.
- Fjern lokale states `omhyllingMode`, `omhyllingManuell`, `bygghoyde` og tilhørende beregning `beregnetOmhylling` (gjøres nå i sub-komponenten).
- `AttachedCalculation.inputs` inkluderer fortsatt `omhyllingsflate_modus` og `omhyllingsflate_m2` for sporbarhet.

Resultat: brukeren får nøyaktig samme UI for omhyllingsflate-beregning begge steder, og endringer i ett verktøy gjelder automatisk begge steder.

## Filer som endres
- `src/components/fraviksdokumentasjon/calculators/OmhyllingsflateCalculator.tsx`
- `src/components/fraviksdokumentasjon/calculators/BrannenergCalculator.tsx`
