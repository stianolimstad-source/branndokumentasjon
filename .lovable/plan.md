# Containment-validering (NFPA 850)

## `src/lib/trafo-eksplosjon.ts`

1. Utvid `Resultat` med:
   - `containment_ok: boolean`
   - `containment_paakrevd_m2: number`
2. I `beregn()`:
   ```
   const containment_paakrevd_m2 = (input.oljevolum_L * 1.10) / 500;
   const containment_ok = b.oljegruve && input.basseng_areal_m2 >= containment_paakrevd_m2;
   ```
3. Oppdater anbefalingen «Containment» — tekst:
   ```
   `Oljegruve dimensjonert for full oljemengde + slokkevann (minimum ${containment_paakrevd_m2.toFixed(0)} m²), med oljeavskiller`
   ```
   og `oppfylt: containment_ok`.
4. Returner de to nye feltene.

## `src/components/ui/alert.tsx`

Legg til `warning`-variant i `alertVariants` (varianten finnes ikke i dag) — bruk semantiske tokens for å holde dark/light mode konsistent:
```
warning: "border-yellow-500/50 text-yellow-700 dark:text-yellow-400 [&>svg]:text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20"
```

## `src/components/verktoy/TrafoEksplosjonTool.tsx`

1. Importer `Alert, AlertDescription` fra `@/components/ui/alert` og `AlertTriangle` (allerede importert fra lucide).
2. Rett under `<Input>` for «Oljegruve / bassengareal» (linje 383), når `!res.containment_ok && input.barrierer.oljegruve` (eller alltid når arealet < påkrevd, uavhengig av checkbox? Spec sier «når arealet er for lite» → vis hvis `input.basseng_areal_m2 < res.containment_paakrevd_m2`):
   ```
   {input.basseng_areal_m2 < res.containment_paakrevd_m2 && (
     <Alert variant="warning" className="mt-2">
       <AlertTriangle className="h-4 w-4" />
       <AlertDescription>
         Oljegruven bør være minst {Math.ceil(res.containment_paakrevd_m2)} m² for å romme 110 % av oljemengden iht. NFPA 850. Underdimensjonert containment medfører risiko for spredning av brennende olje utover anlegget.
       </AlertDescription>
     </Alert>
   )}
   ```

Ingen andre filer berøres.
