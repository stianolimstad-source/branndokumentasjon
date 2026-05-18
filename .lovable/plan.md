## Mål
I forhåndsvisningen av ROS-rapporten skal den horisontale scrollbaren for hendelsesregisteret (kap. 3) være synlig så lenge brukeren ser på kap. 3 — ikke bare når man har scrollet helt ned til bunnen av tabellen. Scrollbaren skal «følge» viewporten (sticky) nederst på skjermen mens kap. 3 er synlig.

## Endring
**Fil:** `src/components/ros/RosPreview.tsx`

### Teknikk: dobbel scrollbar med sticky overlay
Standard `overflow-x: scroll` viser scrollbaren bare nederst i tabellens egen container. For å gjøre den synlig hele tiden brukes en kjent teknikk med to synkroniserte scroll-containere:

1. **Hoved-container** (allerede på plass): `div.ros-h-scroll` rundt `<table>` med `overflowX: scroll`. Denne håndterer selve tabellvisningen.

2. **Sticky scroll-proxy** rett over/under tabellen:
   - Egen `<div>` med `position: sticky; bottom: 0; z-index: 5;`
   - Inne i den: en tom `<div>` med samme bredde som tabellen (`minWidth: 1100px`) og høyde 1px, slik at den ytre containeren får horisontal scroll.
   - Synkroniseres med hoved-containeren via to `onScroll`-handlere (refs) — når den ene scrolles, oppdateres `scrollLeft` på den andre.

3. **Plassering:** Sticky-proxyen plasseres **inni `<section id="kap-3">`** slik at den kun er synlig så lenge kap. 3-seksjonen er i viewporten. Når man har scrollet forbi kap. 3, forsvinner den naturlig.

4. **Styling:** Beholder eksisterende `.ros-h-scroll` webkit-styling (mørk thumb, 14 px høyde) på begge containere så scrollbaren ser tydelig og lik ut.

5. **Fjerne "scroll horisontalt"-hint-teksten** over tabellen (eller flytte den til sticky-baren) siden scrollbaren nå er synlig hele tiden.

### Implementasjonsdetaljer
- Bruke `useRef<HTMLDivElement>(null)` for begge containere.
- `onScroll` på topp-proxy: `tableRef.current.scrollLeft = proxyRef.current.scrollLeft`.
- `onScroll` på tabell-container: `proxyRef.current.scrollLeft = tableRef.current.scrollLeft`.
- Bruke en `isSyncing`-ref for å unngå evig loop.
- Sticky-elementet trenger en bakgrunnsfarge (f.eks. `#fff`) så det dekker innholdet bak når det «klister seg» nederst.

## Ikke endret
- `src/lib/ros-word-export.ts` (Word-eksport berøres ikke).
- Layout/struktur av de tre arkene (stående → liggende → stående) beholdes.
- Datamodell og forretningslogikk.

## Teknisk skisse

```text
┌─ Ark 2 (liggende A4) ─────────────────────┐
│  Kap. 3 Hendelsesregister                 │
│  ┌─────────────────────────────────────┐  │
│  │ <table> (overflow-x scroll)         │  │
│  │  ... mange kolonner ...             │  │
│  └─────────────────────────────────────┘  │
│                                            │
│  ┌─ position: sticky; bottom: 0 ───────┐  │ ← følger viewporten
│  │ ▓▓▓▓▓▓▓░░░░░░░░░░░  scroll-proxy   │  │
│  └─────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```
