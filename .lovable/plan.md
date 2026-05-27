Add a new "Trafoeksplosjon" calculator to the fraviksdokumentasjon flow, reusing the existing standalone tool's logic.

## Files

### 1. `src/components/fraviksdokumentasjon/BeregningSection.tsx`
- Import `Bolt` from `lucide-react` alongside existing icons.
- Extend `AttachedCalculation["type"]` union with `"trafoeksplosjon"`.
- Add row to `calculatorTypes`:
  `{ type: "trafoeksplosjon", label: "Trafoeksplosjon", icon: Bolt, desc: "Oljefylte krafttrafoer – risiko og barrierer" }`.

### 2. `src/components/fraviksdokumentasjon/CalculatorDialog.tsx`
- Add `"trafoeksplosjon"` to `CalculatorType` union.
- Import new `TrafoEksplosjonCalculator` and register in `calculatorComponents`.
- Add `"Trafoeksplosjonsvurdering"` in `titles`.

### 3. `src/components/fraviksdokumentasjon/calculators/TrafoEksplosjonCalculator.tsx` (new)
Standalone wrapper around the existing `TrafoEksplosjonTool` UI plus a parallel state that mirrors its input and pushes results to `onResult`.

Implementation:
- Import `beregn`, `beregnDriftsfaktor`, `type TrafoInput` from `@/lib/trafo-eksplosjon`.
- Since `defaultInput` is not exported from the library (only declared locally inside `TrafoEksplosjonTool`), define an identical `defaultInput: TrafoInput` constant inside the wrapper (copy from `TrafoEksplosjonTool.tsx` line 169). Note: the user's instruction assumes this is exported, but it is not — we duplicate the defaults to keep scope minimal.
- Render `<TrafoEksplosjonTool />` as-is for the user interface.
- Hold a parallel `input` state (initialized to `defaultInput`). Since the tool manages its own state internally, we cannot observe its input directly without refactoring; the simplest minimal-scope path is to compute results from `defaultInput` on mount so the user can immediately import a baseline calculation. Document this limitation with a brief inline comment.
- Run `beregn(input)` inside a `useEffect` debounced 300 ms; on each result update, call `onResult({...})`:
  - `id`: `crypto.randomUUID()`
  - `type`: `"trafoeksplosjon"`
  - `label`: `` `Trafoeksplosjon: ${input.oljevolum_L} L olje, buenergi ${input.buenergi_MJ} MJ` ``
  - `inputs`: `oljevolum_L`, `tanktype`, `oljetype`, `spenning_kV`, `effekt_MVA`, `buenergi_MJ`, `tankkapasitet_MJ`, `plassering`, `avstand_personell_m`, `avstand_maskinhall_m`, `basseng_areal_m2`
  - `results`:
    - `tank_status`: `res.tank.status`
    - `trykk_peak_kPa`: `Math.round(res.trykkbolge.peak_kPa)`
    - `trykk_personell_pct`: `res.trykkbolge.sannsynlighet_personell_pct`
    - `fragment_p80_m`: `res.fragmenter.soner.p80_m`
    - `oljebrann_Q_MW`: `Math.round(res.oljebrann.Q_MW)`
    - `oljebrann_varighet_min`: `res.oljebrann.varighet_min`
    - `bleve_radius_m`: `Math.round(res.bleve.fatal_radius_m)`
    - `total_aarlig_eskaleringssannsynlighet_pct`: `res.sannsynlighet.total_eskalering_aarlig_pct`
    - `total_levetid40_pct`: `res.sannsynlighet.total_levetid40_pct`
    - `compliance_prosent`: `res.compliance.prosent`
  - `kommentar`: `""`

## Note on scope
The user asked to "duplicate state-handling" in the wrapper. Since `TrafoEksplosjonTool` does not currently expose its input via props or callback, the wrapper either (a) renders the tool and pushes a baseline calculation derived from `defaultInput` (minimal change), or (b) refactors `TrafoEksplosjonTool` to accept `value`/`onChange` props so the wrapper truly reflects user edits. Option (a) is implemented per the user's "enkleste løsningen" preference; the imported calculation reflects defaults rather than live edits made inside the embedded tool. If live syncing is required, a small refactor of `TrafoEksplosjonTool` to lift state is needed — flag to confirm before doing it.
