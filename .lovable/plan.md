## Problem

Etter at årsak-boksene ble venstrejustert blir det et stort tomrom mellom boksen og der de fargede strekene starter. Strekene tegnes nemlig fra høyre kant av hele Årsaker-kolonnen (`ARSAK.x + ARSAK.w`), ikke fra selve boksen.

## Endring

I `src/components/ros/RosPreview.tsx`:

1. Smalere Årsaker-kolonne: endre `ARSAK = { x: 16, w: 180 }` til `ARSAK = { x: 16, w: 140 }`. Det reduserer avstanden mellom boksens høyre kant og strekstarten betraktelig.

2. La selve årsak-boksen fylle kolonnebredden, så høyre kant av boksen alltid faller sammen med strekstarten. På den indre boksen (rundt linje 1413–1448), bytt `display: "inline-flex"` til `display: "flex"` og fjern `maxWidth: "100%"` (overflødig med `display: flex` i en wrapper med fast bredde). Da blir boksen alltid like bred som kolonnen, uansett tittelens lengde, og strekene treffer kanten av boksen.

Ingen endringer i bezier-beregning, kolonneoverskrift eller andre kolonner — bare bredde og box display.