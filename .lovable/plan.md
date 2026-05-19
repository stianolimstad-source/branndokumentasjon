## Problem
Etter at årsak-/konsekvens-boksene ble krympet til "fit-content" og grid-en fikk `alignItems: "start"`, mistet diagrammet bow-tie-fasongen: topphendelsen står øverst sammen med chip-ene i stedet for å være sentrert i "knytepunktet", og det er ingen visuell innsnevring mot midten.

## Mål
Behold de kompakte chip-boksene, men gjenopprett den klassiske bow-tie-silhuetten: årsaker vifter ut til venstre, konsekvenser vifter ut til høyre, og topphendelsen sitter sentrert i midten som knuten.

## Endringer i `src/components/ros/RosPreview.tsx` (kap. 4 Bow-tie)

1. **Vertikal sentrering av topphendelsen**
   - Behold `alignItems: "start"` på det ytre gridet (slik at chip-kolonnene stables fra toppen), men wrap topphendelse-boksen i en flex-container som er `height: "100%"`, `display: "flex"`, `alignItems: "center"`, `justifyContent: "center"`. Da synker den røde boksen ned til midten av diagrammet, uansett hvor mange årsaker/konsekvenser som er listet.

2. **Bow-tie-vinger (SVG-wedges)**
   - Legg en absolutt-posisjonert SVG bak topphendelsen som tegner to trekanter:
     - Venstre trekant: punktene (0, 0) – (0, høyde) – (midt, midt/2..midt) som krymper mot midten. Fyll: lys rød (`#fde2e4`), stroke `#DC3545` 1px.
     - Høyre trekant: speilbilde.
   - Topphendelse-boksen ligger oppå, sentrert. Dette gir den klassiske "sløyfe"-formen uten å øke kolonnebredden.
   - Implementasjon: wrap topphendelse-kolonnen i `position: relative` + `<svg style="position:absolute; inset:0; width:100%; height:100%; z-index:0">` med to `<polygon>`. Topphendelse-div får `position: relative; zIndex: 1`.

3. **Minimum høyde**
   - Sett `minHeight: 160` på topphendelse-wrapperen slik at vingene alltid er synlige selv om det bare er én årsak/konsekvens.

4. **Kolonnebredder uendret**
   - `gridTemplateColumns` beholdes som i forrige iterasjon (smale chip-kolonner + sentral kolonne). Chip-boksene forblir `width: fit-content`.

## Ingen endringer
- Word-eksport (`src/lib/ros-word-export.ts`)
- Felles barrierer-kortene, AI-logikk, "Barrierer/tiltak"-tabellen, `BowTieScroll`

## Resultat
Kompakte chip-bokser for årsaker og konsekvenser, men topphendelsen sentreres vertikalt i midten med to lyserøde trekant-vinger som visuelt former en "bow-tie". Diagrammet leses umiddelbart som en bow-tie igjen.
