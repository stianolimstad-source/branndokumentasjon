## Mål
Erstatte dagens grid-baserte bow-tie i kap. 4 (`RosPreview.tsx`) med et ekte bow-tie-diagram der:
- Årsakene fordeles jevnt fra topp til bunn på venstre side.
- Konsekvensene fordeles jevnt fra topp til bunn på høyre side.
- Topphendelsen sitter sentrert i midten som "knuten".
- SVG-linjer går fra hver årsak gjennom relevante felles barrierer og inn i topphendelsen, og fra topphendelsen ut til hver konsekvens — slik at silhuetten faktisk ser ut som en sløyfe.
- Linjer som krysser hverandre rutes med liten vertikal offset så de ikke ligger oppå hverandre.

Bare visuell endring i kap. 4 i `src/components/ros/RosPreview.tsx`. Ingen endring i Word-eksport, AI-logikk, datamodell eller "Barrierer / tiltak"-tabellen.

## Layout

```text
ÅRSAKER            FELLES BARRIERER             TOPPHENDELSE       KONSEKVENSER
[Trafo 1] ─┐        ┌─[Termografering]─┐                            ┌─ [Personskade]
[Trafo 2] ─┼────────┼─[Oljeanalyse]────┼──►   ┌──────────┐  ───────┼─ [Materiell]
[Trafo 3] ─┼────────┼─[Isolasjons.]────┼──►   │ EKSPLOSJON│  ──────┼─ [Brann]
[Trafo 4] ─┼────────┼─[Oljegrube]──────┼──►   └──────────┘  ──────┘
[Trafo 5] ─┘        └─[Trykkavlast.]──┘
```

Hele diagrammet rendres inne i én `position: relative`-container med et absolutt SVG-lerret i bakgrunnen som tegner alle linjer. Innholdet (kort/chips) ligger oppå med `position: relative; zIndex: 1`.

## Tekniske detaljer

1. **Container**
   - `BowTieScroll` beholdes (horisontal scroll på smal skjerm).
   - Indre wrapper: `position: relative`, fast `minHeight` beregnet fra `max(arsaker.length, konsekvenser.length, aiBarrierer.length) * RAD_HOYDE + PADDING` (RAD_HOYDE ≈ 42 px, min 240 px).
   - Fire absolutt-posisjonerte kolonner med kjente `left/width`:
     - Årsaker: `left: 0`, `width: 180`
     - Felles barrierer (hvis finnes): `left: 210`, `width: 230`
     - Topphendelse: sentrert, `width: 180`
     - Konsekvenser: `right: 0`, `width: 180`
   - Hver chip i en kolonne fordeles vertikalt med jevn `top` slik at de spenner hele høyden (første chip øverst, siste nederst, jevn avstand). Topphendelsen plasseres vertikalt sentrert.

2. **SVG-lerret**
   - `<svg style="position:absolute; inset:0; width:100%; height:100%; zIndex:0">` med `viewBox` lik faktiske px (bruk `useRef` + `useLayoutEffect` + `ResizeObserver` for å lese container-bredden, eller bare bruk `100%` koordinater via `getBoundingClientRect` etter mount).
   - Enklere alternativ uten ref-måling: bruk kjente kolonne-`left`-verdier (px) og beregn `top` for hver chip ut fra index/antall. Da kan SVG bruke samme talleksens som layoutet og vi slipper måling.

3. **Linjer**
   - Fra hver årsak: bezier-kurve fra (xÅrsakHøyre, yÅrsak) til (xBarriereVenstre, yBarriere) for hver relevant barriere (matchet via `b.arsakIds`). Hvis ingen barriere matcher den årsaken, går linjen direkte til topphendelsens venstre kant.
   - Fra hver barriere: bezier fra (xBarriereHøyre, yBarriere) til topphendelsens venstre kant (xTopp, yTopp).
   - Fra topphendelsens høyre kant: bezier til hver konsekvens (xKonsHøyre kant).
   - Alle linjer: `stroke="#94a3b8"`, `strokeWidth="1.2"`, `fill="none"`, `opacity="0.7"`.
   - Linjer inn til/ut fra topphendelsen samles mot ett senterpunkt — det gir den klassiske "sløyfe"-formen automatisk.

4. **Anti-overlap**
   - For hver gruppe linjer som ender i samme punkt (f.eks. alle inn til en barriere eller inn til topphendelsen), fordel ankerpunktet langs en kort vertikal "kam" (f.eks. yTopp ± i·3 px) basert på sortert kilde-y. Dette gjør at parallelle linjer ikke ligger oppå hverandre.
   - Bezier-kontrollpunkter settes midt mellom kolonnene horisontalt, samme y som henholdsvis start og slutt — gir myke S-kurver uten å trenge full ruting.

5. **Bow-tie vinger**
   - Fjernes som egne `<polygon>` — sløyfeformen kommer nå fra linjene selv. Topphendelse-boksen beholdes som rødt rektangel sentrert.

6. **Chips**
   - Beholder dagens stil (hvit boks med score-badge for årsaker, grønne kort for barrierer, hvite bokser for konsekvenser). Bare plassering endres til absolutt med beregnet `top`.

7. **Responsivt / utskrift**
   - `BowTieScroll` gir horisontal scroll på skjerm.
   - Hele containeren har fast bredde (sum av kolonner + gap, f.eks. 980 px) slik at både skjerm-rendring og PDF-utskrift av liggende A4 viser hele diagrammet.

## Filer som endres
- `src/components/ros/RosPreview.tsx` — kun bow-tie-blokken (linjene 502–679).

## Filer som ikke endres
- `src/lib/ros-word-export.ts`
- `supabase/functions/analyze-bowtie-barriers/index.ts`
- "Barrierer / tiltak"-tabellen under diagrammet
- All AI-/data-/RLS-logikk
