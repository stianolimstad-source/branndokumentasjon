## Problem
For tilstandsvurderinger etter BF85 vises knappen (checkbox) for «Universell utforming» i kapittel 2.1. Dette er ikke relevant for BF85, da universell utforming (TEK17 § 12-13) ikke fantes i Byggeforskrift 1985.

## Løsning

### 1. Inputside – `src/pages/Konsept.tsx`
Skjul «Universell utforming»-checkboxene når `formData.regelverk === "BF85"`.

**Sted 1 – linje 3311–3322:**  
Checkbox under del 1 når `harFlereRisikoklasser` er valgt. Wrap med `{formData.regelverk !== "BF85" && ...}`.

**Sted 2 – linje 3451–3460:**  
Checkbox for hver bygningsdel. Wrap med samme betingelse.

**Sted 3 – linje 3551–3565:**  
Checkbox når `!harFlereRisikoklasser` (enkeltbygg). Wrap med samme betingelse.

### 2. Forhåndsvisning – `src/components/konsept/KonseptPreview.tsx`
Skjul visning av universell utforming i tabellene når `formData.regelverk === "BF85"`.

**Sted 1 – linje 768:**  
Kolonneheader «Univ. utforming» i bygningsdeler-tabellen. Skjul kolonne og juster `colSpan` på oppsummeringsraden under (linje 811).

**Sted 2 – linje 787 og 806:**  
Celleverdier for universell utforming i bygningsdeler-tabellen. Skjul cellene.

**Sted 3 – linje 865–870:**  
Egen rad «Universell utforming» i enkeltbygg-tabellen. Skjul hele raden.

### 3. Eventuell tilpasning av kolonnetall
Når «Univ. utforming»-kolonnen fjernes fra bygningsdeler-tabellen, må `colSpan={6}` på tiltaksklasse-raden (linje 811) justeres til `colSpan={5}`.

## Ingen endring
- Ingen DB- eller skjemaendringer.
- Ingen påvirkning på beregninger (feltet i `formData` beholdes, bare ikke vises).
- Word-eksport oppdateres ikke som del av denne endringen.