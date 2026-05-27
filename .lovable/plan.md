## Endringer i `src/lib/trafo-eksplosjon.ts`

1. Utvid `Resultat` med nytt felt:
```ts
compliance: {
  krav: { navn: string; standard: string; oppfylt: boolean; kommentar: string }[];
  oppfylt_antall: number;
  totalt_antall: number;
  prosent: number;
}
```

2. I `beregn()`, etter at `containment_ok`, `minAvstand` og barrierer er kjent, bygg listen med 7 krav:

- **Min. avstand 9,1 m** (IEEE 979) — `min(avstand_personell, avstand_maskinhall) >= 9.1`. Kommentar viser faktisk minste avstand.
- **Brannmur EI ≥ 120** (NFPA 850 / NEK 440) — innendørs: `brannmur_EI >= 120`; utendørs: `brannmur_EI >= 60`. Kommentar viser valgt EI-klasse + krav for plasseringen.
- **Oljegruve dimensjonert** (NFPA 850) — `containment_ok`. Kommentar viser påkrevd areal vs faktisk.
- **Trykkavlastning** (CIGRE TB 537) — `barrierer.bristeskive`.
- **Indre vern (Bucholtz + 87T)** (Standard praksis) — `bucholtz && differensialvern`.
- **Slokkesystem (deluge/vannspray)** (NFPA 850 anbefalt) — `deluge_vannspray`.
- **Romventilasjon** (CIGRE TB 537) — `rom_ventilasjon || plassering === "utendørs"`. Kommentar nevner at det ikke er relevant utendørs.

3. Beregn `oppfylt_antall = krav.filter(k => k.oppfylt).length`, `totalt_antall = 7`, `prosent = oppfylt_antall / 7 * 100`. Returner i `compliance`.

## Endringer i `src/components/verktoy/TrafoEksplosjonTool.tsx`

1. Importer `CheckCircle2` og `XCircle` fra `lucide-react`.

2. Nytt `<Card>` «Standardoppfyllelse» plassert rett over sannsynlighet/hendelsestre-kortet.

3. Layout:
   - Stor prosentangivelse øverst (`text-4xl font-bold`) med fargeklasse basert på terskel:
     - `>= 85` → `text-green-600` (dark: `text-green-500`)
     - `60–85` → `text-yellow-600`
     - `< 60` → `text-red-600`
   - Liten tabell under (bruker `Table`-komponenter eller en enkel grid) med kolonner: ikon, navn, standard, kommentar. `CheckCircle2` grønn for oppfylt, `XCircle` rød for ikke oppfylt.
   - Bunntekst: `«X av 7 anbefalte tiltak iht. NFPA 850, IEEE 979 og CIGRE TB 537 er oppfylt.»` med `text-sm text-muted-foreground`.

## Filer

- `src/lib/trafo-eksplosjon.ts`
- `src/components/verktoy/TrafoEksplosjonTool.tsx`