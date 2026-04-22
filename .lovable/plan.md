
## Mål

Utvide delen «Lagring i bygning» for salgslokaler slik at rapporten tydelig får med at DSB sin veiledning åpner for høyere mengder enn tabellverdiene, dersom dette er risikovurdert og det etableres egnede kompenserende tiltak.

Dette skal ikke endre selve DSB-tabellen eller mengdegrensene, men legge til en faglig presisering og en redigerbar vurderingstekst.

## Endring i input-siden

I `src/pages/Brensellagring.tsx` utvides kortet:

```text
Største tillatte mengder i salgslokaler – DSB Temaveiledning Kap. 3
```

Under tabellen legges det inn en tydelig infoboks, for eksempel:

```text
DSB sin temaveiledning angir anbefalte mengder for salgslokaler, men legger opp til at mengdene kan økes noe dersom det er gjort særskilte tiltak og det fremgår av risikovurderingen at en begrenset økning er akseptabel. Eksempler på tiltak kan være sprinkleranlegg, oppbevaring i brannskap eller egen avlukke, røykdeteksjon og automatisk stenging/lukking av skap eller dører.
```

## Redigerbar rapporttekst

Det legges til et eget tekstfelt under DSB-tabellen:

```text
Vurdering av høyere mengder / kompenserende tiltak
```

Feltet får en automatisk standardtekst basert på innholdet i bildet/eksempelet brukeren la ved:

```text
Ovennevnte krav til avstander og mengder bør kunne økes noe, under forutsetning av at salgslokalet er sprinklet og at det fremgår av risikovurderingen at en slik begrenset økning er akseptabel.

Det anbefales imidlertid at de brannfarlige stoffene oppbevares i eget brannskap eller avlukke i salgslokalet. Dette bør også kunne medføre aksept for større lagringsmengder enn angitt i tabellen over. Det forutsettes da at alt brannfarlig stoff i salgslokalet oppbevares i skapet/avlukket. Brannskapet/avlukket bør ha dør eller sjalusidør, samt røykdetektor utenfor og eventuelt inne i skapet/avlukket, med automatisk stenging av dører ved detektering. Brannskapet/avlukket vil da kunne beskytte både dersom brannen starter i det brannfarlige stoffet i skapet/avlukket, og dersom brannen starter utenfor. Alternativt kan det benyttes skap/avlukke hvor dørene er selvlukkende, dvs. lukker automatisk for hver gang de har vært åpnet.
```

Teksten skal kunne redigeres fritt.

## Original tekst-knapp

Ved tekstfeltet legges det inn en knapp:

```text
Original tekst
```

Knappen tilbakestiller tekstfeltet til standardteksten over.

Dette følger samme mønster som nylig ble lagt inn for branntekniske tiltak.

## State og lagring

I `Brensellagring.tsx` legges det til et nytt felt i dokumentinnholdet, for eksempel:

```ts
salgslokaleTiltakTekst: string
```

Eksisterende dokumenter uten dette feltet åpnes bakoverkompatibelt med tom streng eller standardtekst.

Ved lagring inkluderes feltet i eksisterende `content`-objekt. Ingen databaseendring er nødvendig.

## Rapport / forhåndsvisning

I `src/components/brensellagring/BrensellagringPreview.tsx` oppdateres seksjonen:

```text
Største tillatte mengder i salgslokaler
```

Etter DSB-tabellen vises:
1. kort presisering om at tabellen er veiledende/anbefalt nivå
2. redigerbar vurderingstekst om høyere mengder ved tiltak
3. eventuell eksisterende kommentar fra brukeren

Dette gjør at rapporten tydelig dokumenterer:
- at tabellverdiene er utgangspunktet
- at økte mengder kan vurderes dersom tiltak er etablert
- hvilke tiltak som legges til grunn
- at vurderingen må forankres i risikovurderingen

## Filer som endres

### `src/pages/Brensellagring.tsx`
- Legge til state for `salgslokaleTiltakTekst`
- Lese og lagre feltet i dokumentinnhold
- Legge inn standardtekst-funksjon
- Legge inn infoboks under DSB-tabellen
- Legge inn redigerbart tekstfelt for vurdering av høyere mengder
- Legge inn «Original tekst»-knapp

### `src/components/brensellagring/BrensellagringPreview.tsx`
- Utvide props med `salgslokaleTiltakTekst`
- Vise presisering og redigerbar vurderingstekst i rapportseksjonen for salgslokale
- Beholde eksisterende DSB-tabell og kommentar

## Ikke inkludert

- Ingen endring av DSB-tabellens mengdeverdier
- Ingen automatisk aksept/konklusjon om at høyere mengder er tillatt
- Ingen databaseendringer
