## Mål
I forhåndsvisningen av ROS-rapporten skal overgangen mellom kap. 2 (stående A4) og kap. 3 «Hendelsesregister» (liggende A4) se ut som to fysisk adskilte ark. Tabellen i kap. 3 skal også ha en tydelig, alltid synlig horisontal scrollbar slik at det er åpenbart at innholdet fortsetter til siden.

## Endring
**Fil:** `src/components/ros/RosPreview.tsx`

### 1. Del opp i flere «ark»
- Bytte ut dagens enkelt-`<div style={pageStyle}>` med flere «ark»-blokker, hver med samme `pageStyle` (skygge, hvit bakgrunn, A4-bredde) — dette gir den fysiske «to ark»-følelsen via mellomrom og skygge:
  - **Ark 1 (stående):** Logo, header-bar, prosjektinfo-tabell, kap. 1, kap. 2.
  - **Ark 2 (liggende):** Kap. 3 Hendelsesregister.
  - **Ark 3 (stående):** Kap. 4, kap. 5, footer.
- Wrappe alt i en ytre container med `display: flex; flex-direction: column; gap: 48px;` slik at det blir tydelig luft mellom arkene (grå bakgrunn synes mellom dem).

### 2. Liggende ark for kap. 3
- Ny `landscapePageStyle` basert på `pageStyle`, men med byttede dimensjoner: `maxWidth: 297mm`, `minHeight: 210mm`, padding tilpasset liggende format.
- Beholde samme skygge/bakgrunn så det visuelt matcher de stående arkene, bare bredere/lavere.

### 3. Tydelig scroll-indikasjon på hendelsesregisteret
- Bytte den enkle `<div style={{ overflowX: "auto" }}>` rundt tabellen med en wrapper som har:
  - `overflowX: scroll` (ikke `auto`) for alltid-synlig scrollbar.
  - En liten «← scroll →»-hint over tabellen (muted tekst, kun synlig dersom innholdet er bredere enn arket).
  - Tydelig styling på scrollbaren via inline `<style>` (eller en liten CSS-klasse) med høyde ~12px, mørk thumb, lys track, slik at den blir godt synlig (Webkit + standard `scrollbar-color`).

### 4. Rydde opp
- Fjerne dagens `chapterDivider` (stiplet linje) på kap. 3, siden det fysiske skillet mellom ark erstatter det. Beholde `chapterDivider` (eller bytte til vanlig `marginTop`) for kap. 2, 4 og 5 internt i arkene — eller fjerne helt hvis luft mellom seksjoner i samme ark er nok. Anbefaling: fjerne `chapterDivider` på kap. 4 (siden ark-skillet allerede er der), men beholde luft (`marginTop: 32`) for kap. 2 og 5 innenfor samme ark.

## Ikke endret
- `src/lib/ros-word-export.ts` (Word-eksporten beholder allerede liggende A4 for kap. 3).
- `src/pages/RosAnalyse.tsx` og innputt-UI.
- Datamodell / forretningslogikk.

## Teknisk skisse

```text
[ Ark 1 — A4 stående ]   <- skygge
       (luft 48px)
[ Ark 2 — A4 liggende ]  <- bredere, egen skygge, scrollbar synlig på tabell
       (luft 48px)
[ Ark 3 — A4 stående ]   <- skygge
```
