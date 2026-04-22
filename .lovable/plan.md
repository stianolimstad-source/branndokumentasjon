
## Mål

Legge til et nytt beregningsverktøy under «Beregningsverktøy»:

```text
Brannsimulering / røykutvikling
```

Verktøyet skal ikke være en full erstatning for CFAST eller PyroSim/FDS, men et raskt, praktisk tidligfaseverktøy som gir ingeniørmessige estimater for:

- brannstørrelse over tid
- røykproduksjon
- røyklagshøyde over tid
- temperatur i øvre røyklag
- tid til kritiske forhold
- effekt av enkel røykventilasjon
- sammenligning av scenarier

Dette blir et «CFAST-inspirert» to-sonemodellverktøy for raske vurderinger, ikke en CFD-simulering.

## Faglig avgrensning

Verktøyet skal tydelig merkes som en forenklet modell for tidligfasevurderinger.

Det skal brukes til:
- grovvurdering av røykutvikling
- sammenligning av tiltak
- vurdering av tilgjengelig rømningstid i tidligfase
- dokumentasjon av konservative forutsetninger

Det skal ikke brukes alene som:
- fullverdig CFD-analyse
- erstatning for CFAST/FDS der myndighetsdokumentasjon krever avansert simulering
- detaljert analyse av kompleks geometri, vind, sprinkleraktivering, trykksetting eller flerromsstrømning

## Ny side

Opprette ny rute:

```text
/verktoy/brannsimulering
```

Og legge den inn i `App.tsx`.

På oversikten `src/pages/Verktoy.tsx` legges det inn nytt kort:

```text
Brannsimulering
Forenklet to-sonemodell for brannvekst, røykutvikling og røyklagshøyde i tidlig fase.
```

Ikon kan være `Activity`, `ChartLine`, `Flame` eller tilsvarende fra `lucide-react`.

## Modell som implementeres først

### 1. Brannvekst

Brannen modelleres først som en t²-brann:

```text
Q(t) = α · t²
```

Der α velges fra brannvekstkategorier:

| Kategori | t_g til 1 MW | α |
|---|---:|---:|
| Langsom | 600 s | 0,00278 kW/s² |
| Medium | 300 s | 0,0111 kW/s² |
| Rask | 150 s | 0,0444 kW/s² |
| Ultra rask | 75 s | 0,1778 kW/s² |

Brukeren kan også sette maksimal branneffekt:

```text
Q_max
```

Da brukes:

```text
Q(t) = min(α · t², Q_max)
```

Dette gjør verktøyet nyttig for typiske designbranner.

### 2. Romgeometri

Input:

- romlengde
- rombredde
- romhøyde
- gulvareal beregnes automatisk
- romvolum beregnes automatisk

### 3. Røykproduksjon / plumestrøm

Det legges inn en forenklet plume-/røykgassmodell basert på klassiske korrelasjoner for tidligfase rombrann.

Første versjon beregner estimert masse-/volumstrøm av varme røykgasser til øvre lag basert på:

- branneffekt `Q`
- høyde fra brannkilde til røyklag
- romhøyde
- antatt konvektiv andel av branneffekten

Standardverdier:
- konvektiv andel: 70 %
- omgivelsestemperatur: 20 °C
- røykdensitet/luftdata som faste standardverdier

### 4. Røyklagshøyde over tid

Verktøyet beregner utvikling per tidssteg, for eksempel hvert 5. eller 10. sekund:

- akkumulert røykvolum
- øvre røyklags tykkelse
- høyde til røyklag over gulv
- tidspunkt når røyklaget passerer kritisk høyde

Kritisk høyde kan settes av bruker, standard:

```text
2,0 m over gulv
```

### 5. Temperatur i øvre lag

Det beregnes en forenklet temperaturindikasjon for øvre røyklag basert på:

- akkumulert konvektiv energi
- akkumulert røykgassmasse
- varmekapasitet

Resultatet vises som estimert øvre-lag-temperatur over tid.

Dette merkes tydelig som indikativt, fordi full temperaturberegning krever mer detaljert varmebalanse.

### 6. Røykventilasjon

Første versjon får enkel input for ventilasjon:

- ingen ventilasjon
- manuelt angitt røykluke-/åpningsareal
- avtrekksmengde i m³/s

Dette trekkes fra beregnet røykakkumulering per tidssteg.

Senere kan dette kobles tettere mot eksisterende «Røykventilasjon»-verktøyet.

## Resultatvisning

På siden vises:

### Nøkkelresultater

Kort med:

- tid til røyklag når 2,0 m
- maksimal branneffekt innen simulert tid
- tid til valgt `Q_max`
- estimert temperatur i øvre lag ved kritisk tidspunkt
- røyklagshøyde ved slutttid

### Grafer

Bruke eksisterende `recharts`-bibliotek for:

1. Branneffekt over tid  
   ```text
   Q(t) [kW]
   ```

2. Røyklagshøyde over tid  
   ```text
   z_lag [m]
   ```

3. Estimert øvre-lag-temperatur  
   ```text
   T_upper [°C]
   ```

4. Akkumulert røykvolum / røyklagstykkelse

### Tabell

En detaljert tidsserie med kolonner:

| Tid | Q | Røyklagshøyde | Røyklagstykkelse | Øvre-lag temp. |
|---:|---:|---:|---:|---:|

## Brukerinput

Første versjon får disse feltene:

### Rom

- Lengde
- Bredde
- Høyde
- Brannkildens høyde over gulv, standard 0 m

### Brann

- Brannvekstkategori
- Alternativ: egendefinert α
- Maks branneffekt `Q_max`
- Simuleringstid, standard 600 s
- Tidssteg, standard 10 s

### Røyk / kriterier

- Kritisk røyklagshøyde, standard 2,0 m
- Konvektiv andel, standard 0,7
- Omgivelsestemperatur, standard 20 °C

### Ventilasjon

- Ingen ventilasjon
- Avtrekk m³/s
- Eventuelt åpningsareal m² som enkel indikasjon

## Dokumentasjon og advarsler i UI

Verktøyet skal ha en faglig infoboks:

```text
Dette er en forenklet tidligfasemodell for overslagsberegninger. Modellen gir ikke samme presisjon som CFAST eller CFD/FDS/PyroSim, men kan brukes til å sammenligne scenarier og vurdere størrelsesorden for røykutvikling, brannvekst og tilgjengelig tid før kritiske forhold.
```

Og en begrensningsliste:

- én sonegeometri / ett rom
- ingen detaljert flerromsstrømning
- ingen full varmeoverføring til vegger/tak
- ingen sprinkleraktivering i første versjon
- ingen toksisitetsberegning i første versjon
- ingen import/eksport av CFAST-input i første versjon

## Filer som endres/opprettes

### Ny fil

```text
src/pages/verktoy/Brannsimulering.tsx
```

Inneholder selve verktøyet, beregningslogikken, inputskjema, resultater, grafer og tabell.

### Endres

```text
src/App.tsx
```

Legge til rute:

```tsx
<Route path="/verktoy/brannsimulering" element={<Brannsimulering />} />
```

### Endres

```text
src/pages/Verktoy.tsx
```

Legge til nytt kort under beregningsverktøy.

## Teknisk løsning

- Alt kjøres i nettleseren som TypeScript/React.
- Ingen databaseendringer.
- Ingen backend nødvendig.
- Ingen tunge simuleringer eller serverprosess.
- Beregningen utføres deterministisk når brukeren endrer input.
- `useMemo` brukes for å beregne tidsserien effektivt.
- `recharts` brukes for grafer, siden det allerede finnes i prosjektet.
- UI bygges med eksisterende `Card`, `Input`, `Label`, `Select`, `Tabs`, `Alert` og `Table`-komponenter.

## Første leveranse

Første versjon blir et praktisk MVP-verktøy:

1. Nytt verktøykort under «Beregningsverktøy»
2. Ny brannsimuleringsside
3. t²-brann med valg av veksthastighet
4. romgeometri
5. forenklet røyklagshøyde over tid
6. forenklet øvre-lag-temperatur
7. kritisk tidspunkt for røyklag
8. grafer og tidsserietabell
9. tydelig faglig begrensningstekst

## Mulige senere utvidelser

Etter første versjon kan vi bygge videre med:

- sprinkleraktivering og effekt på HRR
- flere brannscenarier i samme graf
- dør-/vindu-/lekkasjeåpninger
- mer avansert ventilasjonsmodell
- toksisitet/CO-indikasjon
- eksport til rapport
- lagring av scenario på prosjekt
- sammenligning mot tilgjengelig/nødvendig rømningstid
- CFAST-inputfil-generator
- import av material-/brannenergidata fra eksisterende brannenergiverktøy
