# Oljetype-støtte i trafoeksplosjon-verktøyet

## `src/lib/trafo-eksplosjon.ts`

1. Ny type: `export type Oljetype = "mineralolje" | "naturlig_ester" | "syntetisk_ester" | "silikonolje";`
2. Konstanttabell:
   ```
   OLJETYPE_FAKTOR: Record<Oljetype, { brennverdi: number; brannsannsynlighet: number; tetthet: number }>
   ```
   - `mineralolje`: 1.0 / 1.0 / 880
   - `naturlig_ester`: 0.85 / 0.40 / 920
   - `syntetisk_ester`: 0.85 / 0.40 / 920
   - `silikonolje`: 0.75 / 0.20 / 960
3. Legg `oljetype: Oljetype` på `TrafoInput`.
4. I `beregn()`:
   - Hent `const f = OLJETYPE_FAKTOR[input.oljetype];`
   - Etter eksisterende `if (b.deluge_vannspray) Q_MW *= 0.45;` → `Q_MW *= f.brennverdi;`
   - `varighet_min = (input.oljevolum_L * f.tetthet / 1000) / (M_BURN * A * 60)` (oljevolum_L × tetthet (kg/m³) / 1000 = kg).
   - `const aarlig = (b.dga && b.temperaturovervaking ? 0.07 : 0.1) * f.brannsannsynlighet;`

## `src/components/verktoy/TrafoEksplosjonTool.tsx`

1. Importer `Oljetype` (typeimport via `TrafoInput["oljetype"]` holder).
2. `defaultInput.oljetype = "mineralolje"`.
3. Ny dropdown «Oljetype» plassert mellom «Tanktype» (linje 184) og «Spenning»:
   ```
   <div className="space-y-2">
     <Label>Oljetype</Label>
     <Select value={input.oljetype} onValueChange={(v) => upd("oljetype", v as any)}>
       <SelectTrigger><SelectValue /></SelectTrigger>
       <SelectContent>
         <SelectItem value="mineralolje">Mineralolje</SelectItem>
         <SelectItem value="naturlig_ester">Naturlig ester (FR3)</SelectItem>
         <SelectItem value="syntetisk_ester">Syntetisk ester (Midel 7131)</SelectItem>
         <SelectItem value="silikonolje">Silikonolje</SelectItem>
       </SelectContent>
     </Select>
   </div>
   ```

Ingen andre filer berøres.
