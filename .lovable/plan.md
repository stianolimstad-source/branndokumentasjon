## Endring

Årsak-boksene (Trafo 1, Trafo 2, …) er i dag høyrejustert i Årsaker-kolonnen, mens kolonneoverskriften «ÅRSAKER» står til venstre. Resultatet er at boksene flyter til høyre, et godt stykke unna teksten.

## Hva som gjøres

I `src/components/ros/RosPreview.tsx`, i rendringen av årsakskortene (rundt linje 1396–1410), endre `justifyContent: "flex-end"` til `justifyContent: "flex-start"` slik at årsak-boksene venstrejusteres og legger seg rett under «ÅRSAKER»-overskriften.

## Bivirkninger

Bezier-linjene starter fra `ARSAK.x + ARSAK.w` (høyre kant av kolonnen), uavhengig av hvor selve boksen tegnes. Når boksene flyttes til venstre vil det derfor være litt mer luft mellom boks og linjestart — det er ønskelig her siden hovedmålet er bedre visuell tilknytning til kolonneoverskriften.

Ingen andre kolonner, beregninger eller Word-eksport berøres.