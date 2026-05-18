## Mål
Kun én horisontal scrollbar nederst i kap. 3 — den som følger viewporten (sticky). Den skal også løftes noen piksler opp fra bunnen så den blir tydeligere/lettere å treffe.

## Endringer
**Fil:** `src/components/ros/RosPreview.tsx`

1. **Skjul scrollbaren på tabell-containeren** (men behold scroll-funksjonen via JS-sync):
   - Bytt `className="ros-h-scroll"` på `tableScrollRef`-div-en til en ny klasse `ros-h-scroll-hidden`.
   - Legg til CSS-regler i `<style>`-blokken:
     ```css
     .ros-h-scroll-hidden { scrollbar-width: none; }
     .ros-h-scroll-hidden::-webkit-scrollbar { display: none; }
     ```
   - Tabellen kan fortsatt scrolles horisontalt programmatisk (via sync fra proxy) og med touch/shift+wheel.

2. **Løft sticky-proxyen opp fra bunnen**:
   - Endre `bottom: 0` til `bottom: 16` på `proxyScrollRef`-div-en.
   - Øk scrollbar-høyden litt: ny CSS-regel `.ros-h-scroll-proxy::-webkit-scrollbar { height: 16px; }` (eller behold 14 px og bare flytt baren opp — anbefalt 16 px + bottom 16).
   - Legg på en svak skygge over baren (`boxShadow: "0 -4px 8px -4px rgba(0,0,0,0.08)"`) og litt padding/border-radius så den ser ut som et eget «verktøy».

3. **Behold** synkroniseringen mellom de to containerne, plassering inni `<section id="kap-3">`, og bakgrunnsfargen så den dekker innholdet bak.

## Ikke endret
- Word-eksport, layout av de tre arkene, datamodell, andre kapitler.
