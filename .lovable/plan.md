## To mindre forbedringer

### 1. Skaler trykksoner (20 m / 78 m) i Soneskisse-SVG
Trykksonen 20 m og 78 m i SVG-en er hardkodet, men `sannsynlighetTrykk` i `trafo-eksplosjon.ts` skalerer dem internt med `skala = cbrt(E_eff / 2.64)`. Etter at barrierene reduserer `E_eff` (bristeskive, aktiv trykkavlastning), må SVG-en bruke samme skalering.

**Endringer:**
- I `src/lib/trafo-eksplosjon.ts`: Utvid `Resultat.trykkbolge` med `r20_m` og `r78_m` (= `20 * skala` og `78 * skala`). Fyll dem inn i return-objektet.
- I `src/components/verktoy/TrafoEksplosjonTool.tsx` (`Soneskisse`): Bytt `sc(20)` → `sc(res.trykkbolge.r20_m)` og `sc(78)` → `sc(res.trykkbolge.r78_m)`. Oppdater label-tekstene til å vise faktisk skalert avstand (f.eks. `${res.trykkbolge.r20_m.toFixed(0)} m (100 % trykk)`).
- Inkluder `r20_m` og `r78_m` i `maxR`-beregningen slik at skissen aldri klipper sonene.

### 2. IEEE 979-avstand: fjern overflødig checkbox
**Endringer i `src/lib/trafo-eksplosjon.ts`:**
- I `Barrierer`-interfacet: fjern `avstand_standard: boolean`.
- I anbefalingen "Klaringsavstand iht. IEEE 979": endre `oppfylt: b.avstand_standard && minAvstand >= 9.1` til `oppfylt: minAvstand >= 9.1`.

**Endringer i `src/components/verktoy/TrafoEksplosjonTool.tsx`:**
- Fjern `avstand_standard: false` fra `defaultInput.barrierer`.
- Fjern raden `["avstand_standard", "Avstand iht. IEEE 979 / NEK 440"]` fra barriere-checkboxlisten.

### Filer
- `src/lib/trafo-eksplosjon.ts`
- `src/components/verktoy/TrafoEksplosjonTool.tsx`