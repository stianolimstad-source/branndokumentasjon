## Mål
I Word-rapporten for ROS-analysen skal kapittel 3 «Hendelsesregister» vises på liggende A4, mens resten av rapporten beholder stående format. Innputsiden i appen endres ikke.

## Endring

**Fil:** `src/lib/ros-word-export.ts`

Dagens dokument bygges som én seksjon (portrett). Jeg deler det opp i tre seksjoner i `Document.sections`:

1. **Seksjon 1 — Portrett:** forside, infotabell, kap. 1 Innledning, kap. 2 Metode.
2. **Seksjon 2 — Landskap:** kap. 3 Hendelsesregister (overskrift + tabell/«Ingen hendelser registrert»).
   - `properties.page.size`: `width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE` (A4).
   - `properties.type: SectionType.NEXT_PAGE` så kapittelet starter på ny side — fungerer som tydelig skille for kap. 3.
   - Tabellbredden i hendelseslisten settes opp så den utnytter den bredere siden (full prosent-bredde beholdes, men `columnWidths`/cellebredder justeres ved behov for jevn fordeling i landskap).
3. **Seksjon 3 — Portrett igjen:** kap. 4 Oppsummering og kap. 5 Revisjonshistorikk, også med `SectionType.NEXT_PAGE`.

Alle tre seksjonene får samme `headers`/`footers` (samme `buildHeader`/`buildFooter`) for visuell konsistens.

## Det som ikke endres
- `src/components/ros/RosPreview.tsx`, `RosMatriks.tsx`, `src/pages/RosAnalyse.tsx` og øvrig UI for innputt/forhåndsvisning forblir uendret.
- Innhold, tekster, farger og temalogikk i rapporten beholdes.

## Tekniske detaljer
- Importere `PageOrientation` og `SectionType` fra `docx` i `ros-word-export.ts`.
- A4 i DXA: portrett `width: 11906, height: 16838`; for landskap sendes samme verdier inn med `orientation: LANDSCAPE` (docx-js bytter selv internt).
- Marginer beholdes som i nåværende oppsett (eller settes eksplisitt likt i alle tre seksjoner for å unngå hopp).
