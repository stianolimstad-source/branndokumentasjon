# Plassering påvirker beregninger

## `src/lib/trafo-eksplosjon.ts`

1. `Barrierer` — legg til `rom_ventilasjon: boolean`.
2. `Resultat` — legg til `hydrogen_advarsel: boolean`.
3. I `beregn()`:
   - `const innendors = input.plassering === "innendørs";`
   - **Trykkbølge**: etter `const skala = ...` og `peak_kPa`:
     ```
     const refleksjon = innendors ? 1.3 : 1.0;
     const peak_kPa = 80 * skala * refleksjon;
     const r20 = 20 * skala * refleksjon;
     const r78 = 78 * skala * refleksjon;
     ```
     Bruk `r20`/`r78` i `sannsynlighetTrykk` og returner som `r20_m`/`r78_m`.
   - **Fragmenter** (utendørs ×1,15):
     ```
     const fragSkalaPlass = innendors ? 1.0 : 1.15;
     const p80 = 115 * fragSkala * fragSkalaPlass;
     const ytter = 430 * fragSkala * fragSkalaPlass;
     const ekstrem = 860 * fragSkala * fragSkalaPlass;
     ```
   - **BLEVE** (innendørs ×0,6): `const bleveR = 140 * bleveSkala * (innendors ? 0.6 : 1.0);`
   - **Hydrogen**: `const hydrogen_advarsel = innendors && !b.rom_ventilasjon;`
4. Returner `hydrogen_advarsel`.
5. Legg til ny anbefaling for rom_ventilasjon (kritisk ved innendørs, ellers valgfri):
   ```
   a.push({
     kategori: "Ventilasjon",
     tekst: "Romventilasjon for hydrogenavlasting (CIGRE TB 537)",
     prioritet: innendors ? "kritisk" : "valgfri",
     oppfylt: b.rom_ventilasjon,
   });
   ```

## `src/components/verktoy/TrafoEksplosjonTool.tsx`

1. `defaultInput.barrierer.rom_ventilasjon = false`.
2. I barriere-listen (rundt linje 399), legg inn ny rad: `["rom_ventilasjon", "Romventilasjon (hydrogenavlasting)"]`.
3. Under barriere-kortet, når `res.hydrogen_advarsel`:
   ```
   <Alert variant="destructive" className="mt-3">
     <AlertTriangle className="h-4 w-4" />
     <AlertDescription>
       Innendørs plassering uten dedikert romventilasjon: hydrogen og andre brennbare gasser fra buespaltet olje kan akkumulere og gi sekundær gasseksplosjon. Vurder ventilasjon dimensjonert iht. CIGRE TB 537.
     </AlertDescription>
   </Alert>
   ```
   (`Alert`/`AlertDescription` allerede importert, `AlertTriangle` allerede importert.)

Ingen andre filer berøres.
