## Endringer i `src/lib/trafo-eksplosjon.ts`

1. Utvid `TrafoInput` med:
```ts
drift: {
  alder_aar: number;
  maaneder_siden_dga: number;
  overlast_historisk: boolean;
}
```

2. I `beregn()`, etter at `intern_feil` er beregnet, multipliser med driftsfaktoren:
- `alderF = alder_aar > 30 ? 1.5 : alder_aar >= 20 ? 1.2 : 1.0`
- `dgaF = maaneder_siden_dga > 24 ? 1.3 : maaneder_siden_dga >= 12 ? 1.1 : 1.0`
- `overlastF = overlast_historisk ? 1.4 : 1.0`
- `driftsfaktor = alderF * dgaF * overlastF`
- `intern_feil *= driftsfaktor`

(Beregn faktoren før den brukes; ingen endring i resterende sannsynlighetsberegning siden den allerede bruker `intern_feil`.)

## Endringer i `src/components/verktoy/TrafoEksplosjonTool.tsx`

1. Legg til `drift: { alder_aar: 20, maaneder_siden_dga: 12, overlast_historisk: false }` i `defaultInput`.

2. Endre input-grid fra `lg:grid-cols-3` til `lg:grid-cols-2 xl:grid-cols-4` slik at det er plass til et fjerde kort. (Kortene flyter naturlig på smale skjermer.)

3. Legg til hjelper `updD` analogt med `updB` for å oppdatere `drift`-felter.

4. Beregn driftsfaktor lokalt i komponenten (samme logikk som i biblioteket) for visning ved siden av kort-tittelen: `Driftsfaktor: ×1,32` (`toFixed(2)` med komma).

5. Nytt `<Card>` «Driftstilstand» som fjerde kort, med:
   - `CardTitle` som flex-rad: tittel + liten `text-xs text-muted-foreground` badge med driftsfaktor.
   - Tallinput «Trafoens alder (år)»
   - Tallinput «Måneder siden siste DGA-analyse»
   - Checkbox «Trafoen har hatt historisk overlast utover skiltverdi»

## Filer

- `src/lib/trafo-eksplosjon.ts`
- `src/components/verktoy/TrafoEksplosjonTool.tsx`
