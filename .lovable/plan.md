## Mål
Erstatte dagens buenergi-input (numerisk felt + seks rå preset-badges) med en faglig forståelig Tabs-velger med tre faner.

## Endring i `src/components/verktoy/TrafoEksplosjonTool.tsx`

Kun blokken for "Buenergi" (linje 91–101) byttes ut. Resten av komponenten er uendret.

### Ny lokal state
```ts
const [buMetode, setBuMetode] = useState<"scenario" | "kortslutning" | "manuell">("scenario");
const [ik_kA, setIk] = useState(30);
const [uBue_V, setUBue] = useState(1000);
const [tKlar_ms, setT] = useState(100);
```
En `useEffect` beregner `E = U·I·t / 1e6` (MJ) når fanen er "kortslutning" og kaller `upd("buenergi_MJ", E)`.

### Tabs-struktur (shadcn `Tabs`, `Tooltip`)

**Fane 1 — "Scenario" (default)**
Grid med 4 knapper (`Button variant="outline"`), aktiv knapp får `variant="default"` når `input.buenergi_MJ === verdi`:

| Knapp | MJ | Tooltip |
|---|---|---|
| Lavt | 1,5 | Primærvern OK, kort bue |
| Sannsynlig | 4,0 | Primærvern OK, middels bue |
| Høyt | 8,0 | Primærvern feiler, reservevern utløser |
| Worst case | 15,0 | Lang bue og tregt reservevern |

Klikk → `upd("buenergi_MJ", verdi)`. Beskrivelsen vises både som liten tekst under tittelen og som `Tooltip` på hover.

**Fane 2 — "Beregn fra kortslutning"**
Tre felt:
- `I_k` (kA): `Input type="number"`, default 30
- `U_bue` (V): `Select` — 500 (Kort bue) / 1000 (Middels bue, default) / 2000 (Lang bue)
- `t_klar` (ms): `Select` — 60 (Primærvern hurtig) / 100 (Primærvern normalt, default) / 300 (Reservevern) / 500 (Reservevern langsomt)

Under inputs vises beregnet verdi i stor tekst:
```
E = U · I · t = {U} V · {I} kA · {t} ms = {E.toFixed(2)} MJ
```
Formel: `E_MJ = (uBue_V * ik_kA * 1000 * tKlar_ms / 1000) / 1e6 = uBue_V * ik_kA * tKlar_ms / 1e6`.
Verdien synkroniseres til `input.buenergi_MJ` via `useEffect` så lenge fanen er aktiv.

**Fane 3 — "Manuell"**
Eksisterende numeriske input beholdes (`type="number" step="0.01"`).
Under inputen, en liten seksjon:
```
Referansetester (PLOS One 2015)
[0,65 MJ] [1,28 MJ] [2,64 MJ] [5 MJ] [6,3 MJ] [17,3 MJ]
```
Hver badge med kort forklaring i tooltip:
- 0,65 — Lav testenergi, kort bue
- 1,28 — Lav-middels test
- 2,64 — Referansetest brukt for skalering av trykkbølge
- 5 — Elastisk tankkapasitet (benchmark)
- 6,3 — Middels-høy test
- 17,3 — Høyeste testenergi, lang bue

Klikk → `upd("buenergi_MJ", verdi)`.

### UI-detaljer
- Tabs erstatter den nåværende `<Label>Buenergi (MJ)</Label> + Input + Badge-rad`-blokken.
- Over Tabs vises «Buenergi: **{input.buenergi_MJ.toFixed(2)} MJ**» som lite resultat-display, slik at brukeren alltid ser hva som faktisk brukes uansett valgt fane.
- Tooltip importeres fra `@/components/ui/tooltip` (`TooltipProvider`, `Tooltip`, `TooltipTrigger`, `TooltipContent`).

### Ikke endret
- `defaultInput.buenergi_MJ` settes til 4,0 (matcher «Sannsynlig» som default-fane).
- `BUENERGI_PRESETS` i `src/lib/trafo-eksplosjon.ts` brukes ikke lenger fra komponenten, men eksporten beholdes for bakoverkompatibilitet.
- All beregningslogikk, resultatkort, soneskisse og barriereanbefalinger er uendret.

## Filer
- `src/components/verktoy/TrafoEksplosjonTool.tsx` (kun buenergi-blokken + nye imports + ny lokal state/effekt)
