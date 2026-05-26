## Endringer i `src/lib/trafo-eksplosjon.ts`

1. Endre `Resultat.sannsynlighet` til:
```ts
sannsynlighet: {
  intern_feil_aarlig_pct: number;
  arc_gitt_feil_pct: number;
  tankbrudd_gitt_arc_pct: number;
  brann_gitt_brudd_pct: number;
  eskalering_gitt_brann_pct: number;
  total_eskalering_aarlig_pct: number;
  total_levetid40_pct: number;
}
```

2. I `beregn()`, erstatt nåværende `aarlig`/`levetid40`-blokk med:

- `intern_feil = 1.0 * oljeF.brannsannsynlighet`, deretter `* 0.6` hvis `b.dga && b.temperaturovervaking`.
- `arc = 40`; hvis `b.bucholtz && b.differensialvern` → 15; ellers hvis `b.differensialvern` → 25.
- `tankbrudd` basert på `tankMargin` (allerede beregnet): `<0.5` → 5; `<0.85` → 15; `<1.3` → 50; ellers 90.
- `brann = 70 * oljeF.brannsannsynlighet`.
- `eskalering = 50`; hvis `b.brannmur_EI >= 120 && b.deluge_vannspray` → 20; hvis i tillegg `b.brannmur_EI === 240` → 10.
- `total_aarlig_pct = (intern/100) * (arc/100) * (tankbrudd/100) * (brann/100) * (eskalering/100) * 100`.
- `levetid40 = (1 - (1 - total_aarlig_pct/100)^40) * 100`.

3. Returner alle syv feltene i `sannsynlighet`-objektet.

## Endringer i `src/components/verktoy/TrafoEksplosjonTool.tsx`

Erstatt Sannsynlighet-kortets innhold (linjer 489–495) med et hendelsestre:

- Fem rader (intern feil, arc gitt feil, tankbrudd gitt arc, brann gitt brudd, eskalering gitt brann), hver med label, prosentverdi (1 desimal) og en nedover-pil (`ArrowDown` fra lucide) mellom radene.
- Bruk semantiske tokens (`bg-muted`, `text-foreground`, `text-muted-foreground`, `border`).
- Under treet: en tydelig blokk med
  - "Total årlig eskaleringssannsynlighet: **X %**" (formatert med passende antall desimaler, f.eks. `toFixed(3)` siden tallene blir små)
  - "Kumulert over 40 år: **Y %**" (`toFixed(1)`)
- Importere `ArrowDown` fra `lucide-react`.

## Filer

- `src/lib/trafo-eksplosjon.ts`
- `src/components/verktoy/TrafoEksplosjonTool.tsx`
