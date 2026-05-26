# Brannvarighet for pølbrann

## Endringer i `src/lib/trafo-eksplosjon.ts`

1. **Utvid `Resultat.oljebrann`** med nytt felt:
   - `varighet_min: number`

2. **Beregn varighet** i `beregn()` etter at `A` er definert:
   ```
   varighet_min = (oljevolum_L * 0.88) / (M_BURN * A * 60)
   ```
   (bruker eksisterende `M_BURN = 0.015` og `basseng_areal_m2`).

3. **Statusoppgradering**: hvis `varighet_min > 240` og `brannStatus === "ok"`, sett `brannStatus = "warning"`.

4. **Utvid `brannTekst`** med en ny linje etter eksisterende tekst:
   - Hvis `varighet_min > 90`: `"Brannvarighet ved fri brann: ca. {Math.round(varighet_min)} minutter ({(varighet_min/60).toFixed(1)} timer)."`
   - Ellers: `"Brannvarighet ved fri brann: ca. {Math.round(varighet_min)} minutter."`
   - Hvis `b.deluge_vannspray`: legg til ` (Med effektivt slokkesystem antas brannen begrenset til 15–30 minutter etter aktivering.)`
   - Skilles fra eksisterende tekst med linjeskift (`\n`).

5. Returner `varighet_min` i `oljebrann`-objektet.

## Ingen UI-endring nødvendig

`TrafoEksplosjonTool.tsx` rendrer allerede `res.oljebrann.tekst` — den nye linjen vises automatisk hvis teksten rendres med `whitespace-pre-line`. Verifiseres ved implementering; hvis ikke, legges `whitespace-pre-line` til på relevant `<p>` der `oljebrann.tekst` vises.
