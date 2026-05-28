## Mål
Legge til vurdering av **usikkerhet** og **styrbarhet** på hver ROS-hendelse, i tråd med veilederpraksis. Feltene vises i editor, preview og Word-eksport, og hendelser med høy usikkerhet markeres visuelt.

## Endringer

### 1. `src/components/ros/RosPreview.tsx` – Datamodell
- Utvid `RosHendelse`-interfacet med:
  ```ts
  usikkerhet?: "lav" | "medium" | "høy";
  styrbarhet?: "lav" | "medium" | "høy";
  ```
- Ingen migrering – eksisterende hendelser beholder `undefined` så brukeren ser at de ikke er vurdert.

### 2. `src/pages/RosAnalyse.tsx` – Editor
- Ved opprettelse av ny hendelse: sett `usikkerhet: "lav"`, `styrbarhet: "medium"`.
- I hendelse-accordion, rett etter konsekvensvurderingene og før «Tilknyttede beregninger»:
  - 2-kolonne grid med to `Select`-felter.
  - Venstre: **Usikkerhet** (Lav / Medium / Høy). Label har Tooltip: *«Sett 'Høy' hvis det er stor variasjon i mulige utfall eller bakgrunnskunnskapen er begrenset.»*
  - Høyre: **Styrbarhet** (Lav / Medium / Høy). Label har Tooltip: *«Hvor lett er det å påvirke risikoen? Lav = ingen kjente tiltak. Høy = enkle, kjente tiltak finnes.»*
  - Placeholder ved `undefined`: «Ikke vurdert».

### 3. `src/components/ros/RosPreview.tsx` – Preview
- Hendelsesregister-tabellen: to nye kolonner helt til høyre, **Usikkerhet** og **Styrbarhet**, med fargede badges:
  - Usikkerhet: lav = grå, medium = gul, høy = rød
  - Styrbarhet: lav = rød, medium = gul, høy = grønn
  - `undefined` → grå «—»
- I konsekvens-sub-tabellen under hver hendelse: hvis `usikkerhet === "høy"`, vis en ekstra linje «Usikkerhet: Høy ⚠» i rød skrift.

### 4. `src/lib/ros-word-export.ts` – Word-eksport
- Hendelsesregister-tabell: to nye kolonner **Usikk.** og **Styrb.** med samme fargekoding via cell-shading.
- `undefined` → tom celle / «—», ingen shading.

## Tekniske detaljer
- Bruk `Badge`-komponenten med inline `className` for HSL-baserte semantiske farger (ikke harde fargeklasser direkte; bruk eksisterende tokens hvor mulig, ev. `bg-destructive`, `bg-yellow-500/20`, `bg-emerald-500/20` o.l. i tråd med eksisterende kodebase).
- Bruk `TooltipProvider`/`Tooltip`/`TooltipTrigger`/`TooltipContent` rundt `Label`.
- I Word-eksport brukes `TableCell` med `shading: { fill: "<hex>" }`.

Ingen endringer i databaseskjema – feltene lagres som del av `RosContent`-JSON.
