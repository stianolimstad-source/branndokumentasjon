## Mål
Gjøre barrierene i Trafoeksplosjon-verktøyet faktisk virksomme i fysikkberegningen, ikke bare som anbefalingsliste.

## Endringer i `src/lib/trafo-eksplosjon.ts`

Kun `beregn`-funksjonen endres. Inn-/utdata-typer er uendret (utvides kun med et lite flagg for barriere-info i tekstene).

### 1. Effektiv buenergi (påvirker tank + trykkbølge)
```
let E_eff = input.buenergi_MJ;
if (b.bristeskive)            E_eff *= 0.80;
if (b.aktiv_trykkavlastning)  E_eff *= 0.30;  // multiplikativt med bristeskive
```
Bruk `E_eff` (ikke rå `buenergi_MJ`) for:
- tankvurdering (sammenligning mot `tankkapasitet_MJ`)
- `skala = cbrt(E_eff / 2.64)` for peak_kPa og trykkbølge-sannsynlighet
- `gass_L` regnes fortsatt på rå buenergi (gassproduksjon i lysbuen er fysisk uavhengig av trykkavlastning).

### 2. Brannmur reduserer stråling mot maskinhall
```
let q_mh = stralePunkt(input.avstand_maskinhall_m);
if (b.brannmur_EI >= 60) q_mh *= 0.10;
```
`q_pers` påvirkes ikke (brannmur står typisk mot maskinhall/kontrollbygg).

### 3. Deluge/vannspray reduserer pølbrann
```
let Q_eff = M_BURN * A * DH_C;       // MW
if (b.deluge_vannspray) Q_eff *= 0.45;
```
Bruk `Q_eff` i `stralePunkt` (q = X_RAD · Q_eff · 1000 / (4π r²)) før brannmur-reduksjonen på maskinhall.

### 4. Sannsynlighet
```
let aarlig = 0.1;
if (b.dga && b.temperaturovervaking) aarlig = 0.07;
const levetid40 = (1 - Math.pow(1 - aarlig/100, 40)) * 100;
```

### 5. Tekstmarkering
Bygg `barriereAktiv = b.bristeskive || b.aktiv_trykkavlastning || b.brannmur_EI >= 60 || b.deluge_vannspray || (b.dga && b.temperaturovervaking)`.
Når sant, suffiks « (inkluderer effekt av eksisterende barrierer)» på tekstene i `tank`, `trykkbolge`, `oljebrann` og `sannsynlighet`-relaterte kort der relevant.

## Ikke endret
- Fragmenter, BLEVE og anbefalingslisten beholder dagens logikk (anbefalinger leser allerede `b.*` direkte).
- UI-komponentene (`TrafoEksplosjonTool.tsx`) trenger ingen endringer — de viser feltene fra `Resultat` som nå inneholder de barriere-justerte verdiene.

## Filer
- `src/lib/trafo-eksplosjon.ts` (kun `beregn`-funksjonen)
