# Kompakt bow-tie-layout i ROS-forhåndsvisning

Årsak- og konsekvens-boksene i bow-tie-diagrammet (`src/components/ros/RosPreview.tsx`) tar i dag full kolonnebredde (`1fr`) selv når teksten bare er noen få tegn ("Trafo 1"). Vi gjør hver boks så bred som innholdet krever, og smalere kolonner totalt.

## Endringer i `src/components/ros/RosPreview.tsx` (kap. 4 Bow-tie)

1. **Kolonnebredder** – endre `gridTemplateColumns` slik at årsak/konsekvens får faste, smale kolonner i stedet for å sluke all plass:
   - Med felles barrierer: `"minmax(160px, 240px) 200px 220px minmax(160px, 240px)"`
   - Uten felles barrierer: `"minmax(160px, 240px) 240px minmax(160px, 240px)"`
   - Endre `alignItems` fra `center` til `start` så kolonnene starter øverst når de har ulik høyde.

2. **Årsak-kort (linje 530–560)** – la kortet krympe til tekst:
   - `display: "inline-flex"`, `width: "fit-content"`, `maxWidth: "100%"`
   - `gap: 6`, samme padding, tekst-`span` mister `flex: 1` (bare la teksten flyte naturlig).
   - Wrap hver i en `<div style={{ marginBottom: 4 }}>` slik at flex-bokser stables vertikalt og hver får sin egen bredde.

3. **Konsekvens-kort (linje 632–644)** – samme behandling: `display: "inline-block"`, `width: "fit-content"`, `maxWidth: "100%"`, wrapper-div for vertikal stabling.

4. **Felles barriere-kort (linje 580–598)** – også `width: "fit-content"`, `maxWidth: "100%"` så de ikke unødvendig strekker seg.

5. **`BowTieScroll` minWidth** – senk fra 1100 til ca. 900, siden diagrammet nå er mer kompakt. Sticky proxy-scrollbaren beholdes uendret ellers.

## Ingen endringer
- `src/lib/ros-word-export.ts` (Word-eksport) – uberørt.
- Logikk for AI-barrierer / state – uberørt.

## Resultat
Korte årsak-/konsekvens-tekster (f.eks. "Trafo 1") vises som små chip-lignende bokser i stedet for fullbreddebokser. Lange tekster wrapper innenfor maks kolonnebredde. Diagrammet blir merkbart mer kompakt og lesbart på liggende A4.
