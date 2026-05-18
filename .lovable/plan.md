## Mål
I forhåndsvisningen av ROS-rapporten skal det være et tydelig fysisk skille mellom kapitlene, slik at hvert kapittel oppleves som en egen «side»/blokk. Endringen gjelder kun visningen i appen (`RosPreview`), ikke Word-eksporten eller innputt­sidene.

## Endring
**Fil:** `src/components/ros/RosPreview.tsx`

Legge til en felles «kapittel-skille»-stil som plasseres mellom kap. 1–5 (`<section id="kap-1">` … `kap-5`). Skillet består av:

- Tydelig vertikal luft mellom seksjonene (`margin-top: 56px`, `padding-top: 40px`).
- En tynn horisontal linje på toppen av hver seksjon fra og med kap. 2 (`border-top: 1px dashed #c8d2df`).
- Liten «sidebryter»-etikett sentrert over linjen (f.eks. «— Nytt kapittel —» i muted farge, valgfritt) for å forsterke det fysiske skillet.

Konkret:
1. Definere `chapterDivider: React.CSSProperties` øverst sammen med øvrige stiler.
2. Sette `style={chapterDivider}` på `<section id="kap-2">`, `kap-3`, `kap-4` og `kap-5` (kap. 1 beholdes uten skille siden den følger rett etter infotabellen).
3. Beholde eksisterende `h2`-styling; eventuelt redusere `marginTop` på `h2` til 0 når elementet ligger inne i en seksjon med skille, for å unngå dobbel luft.

## Ikke endret
- `src/lib/ros-word-export.ts` (Word-rapporten beholdes som nå med liggende A4 for kap. 3).
- `src/pages/RosAnalyse.tsx` og øvrig innputt-UI.
