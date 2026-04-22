
## Mål

Justere «Brannenergi i bygget» for salgslokaler slik at lagring av brannfarlig vare behandles som et tillegg til normal brannenergi i bygget, ikke som hele brannenergien alene.

Resultatet skal vise:
- generell/statistisk brannenergi for bygget uten brannfarlig lagring
- brannenergi fra planlagte brannfarlige varer som tillegg
- spesifikk brannenergi per m² omhyllingsflate for begge tilfeller
- sammenligning med og uten brannfarlige materialer, slik at man kan vurdere om økningen er vesentlig

## Faglig grunnlag

For salgslokale/kjøpesenter legges det inn en standardverdi:

```text
730 MJ/m² gulvareal
```

Kilde vises som:

```text
Byggforsk 321.051 Brannenergi i bygninger. Beregninger og statistiske verdier
```

Denne verdien brukes som normal brannenergi for bygget før planlagt lagring av brannfarlig vare legges til.

## Endring i beregningslogikk

Eksisterende mål per etasje brukes videre, men beregningen utvides:

For hver etasje beregnes:
- gulvareal: `lengde × bredde`
- omhyllingsflate: `gulv + tak + vegger = 2LB + 2LH + 2BH`

For hele vurdert areal beregnes:
- samlet gulvareal
- samlet omhyllingsflate
- generell brannenergi uten brannfarlig vare:
  - `730 MJ/m² × samlet gulvareal`
- tilleggsbrannenergi fra planlagte brannfarlige varer:
  - dagens beregning fra mengde og energitetthet
- total brannenergi med brannfarlig vare:
  - generell brannenergi + tilleggsbrannenergi

Deretter vises:
- generell brannenergi per m² omhyllingsflate
- tilleggsbrannenergi per m² omhyllingsflate
- total brannenergi per m² omhyllingsflate
- prosentvis økning fra generell situasjon til situasjon med brannfarlig vare

## Input-side

I `src/pages/Brensellagring.tsx` endres kortet «Brannenergi i bygget».

### Ny tekst og struktur

Kortet får tydeligere forklaring om at beregningen består av to deler:

```text
1. Generell brannenergi i bygget uten brannfarlig lagring
2. Tillegg fra planlagt lagring av brannfarlige varer
```

For salgslokaler vises en infoboks:

```text
For salgslokale/kjøpesenter benyttes 730 MJ/m² gulvareal som statistisk brannenergi iht. Byggforsk 321.051. Planlagt lagring av brannfarlig vare beregnes som et tillegg til denne brannenergien.
```

### Standardverdi

Det legges inn en state for generell brannenergi per gulvareal, med standard:

```ts
generellBrannenergiMJm2 = "730"
```

Feltet kan vises som redigerbart, slik at brukeren kan justere dersom prosjektet har et annet dokumentert grunnlag.

Label:

```text
Generell brannenergi uten brannfarlig lagring (MJ/m² gulvareal)
```

Hjelpetekst:

```text
Standardverdi for salgslokale/kjøpesenter: 730 MJ/m², Byggforsk 321.051.
```

## Resultatvisning på input-siden

Dagens tabell for brannfarlige materialer beholdes, men får ny overskrift:

```text
Tillegg fra brannfarlige varer
```

Under/over denne legges det inn en sammenligningstabell:

| Beregningsdel | Total brannenergi | Spesifikk brannenergi per m² omhyllingsflate |
|---|---:|---:|
| Generell brannenergi uten brannfarlig lagring | ... MJ | ... MJ/m² |
| Tillegg fra brannfarlige varer | ... MJ | ... MJ/m² |
| Sum med brannfarlige varer | ... MJ | ... MJ/m² |

I tillegg vises:

```text
Økning som følge av brannfarlige varer: X %
```

Dersom omhyllingsflate mangler, vises en tydelig beskjed om at lengde, bredde og høyde må fylles inn for å kunne vurdere brannenergi per omhyllingsflate.

## Rapport / forhåndsvisning

I `src/components/brensellagring/BrensellagringPreview.tsx` oppdateres seksjonen «Brannenergi i bygget» tilsvarende.

Rapporten skal vise:
1. kilde og forutsetning for generell brannenergi
2. tabell med etasjemål, gulvareal og omhyllingsflate
3. tabell med tillegg fra brannfarlige varer
4. oppsummeringstabell med:
   - uten brannfarlige varer
   - tillegg fra brannfarlige varer
   - med brannfarlige varer
5. prosentvis økning

Eksempeltekst i rapporten:

```text
For salgslokale/kjøpesenter er generell brannenergi satt til 730 MJ/m² gulvareal iht. Byggforsk 321.051. Planlagt lagring av brannfarlig vare er vurdert som et tillegg til den statistiske brannenergien i bygget. Begge verdier er omregnet til spesifikk brannenergi per m² omhyllingsflate.
```

## Lagring og bakoverkompatibilitet

I dokumentinnholdet lagres nytt felt:

```ts
generellBrannenergiMJm2: string
```

Eksisterende dokumenter uten feltet åpnes med standardverdi `730`.

Ingen databasemigrasjon er nødvendig, fordi dette lagres i eksisterende dokumentinnhold.

## Filer som endres

### `src/pages/Brensellagring.tsx`
- Legge til state for generell brannenergi per gulvareal
- Lese og lagre feltet i dokumentinnhold
- Beregne samlet gulvareal og omhyllingsflate
- Beregne generell brannenergi uten brannfarlig lagring
- Beregne tillegg fra brannfarlige varer
- Beregne total med brannfarlige varer
- Vise sammenligningstabell og prosentvis økning
- Oppdatere hjelpetekster og kildehenvisning til Byggforsk 321.051

### `src/components/brensellagring/BrensellagringPreview.tsx`
- Utvide props med `generellBrannenergiMJm2`
- Beregne samme verdier som input-siden
- Vise gulvareal, omhyllingsflate og sammenligning i rapporten
- Oppdatere tekst og kildehenvisninger
- Beholde eksisterende seksjonsrekkefølge

## Ikke inkludert

- Ingen databaseendringer
- Ingen endring av DSB-mengdegrenser
- Ingen automatisk konklusjon om «vesentlig høyere» utover beregnet økning; vurderingen overlates til brukerens faglige kommentar
