
## Plan: Skille total mengde fra mengde som overskrider DSB-veiledningen i salgslokalet

Jeg endrer brensellagring-dokumentet slik at det får to separate mengdesett:

1. **Total mengde brannfarlig stoff i virksomheten/anlegget**
   - brukes til vurdering av innmeldingsplikt til DSB
   - inkluderer alt: butikk/salgslokale, brannsikre skap og egne brannceller/lagerrom beregnet for brannfarlig vare

2. **Planlagt mengde utover DSB sin veiledning i salgslokalet**
   - brukes til vurdering av overskridelse av DSB-anbefaling for salgslokale
   - brukes til brannenergiberegningen for salgslokalet
   - inkluderer kun det som faktisk står i salgslokalet utenfor brannsikre skap og utenfor egne brannceller

## Hva som endres i skjemaet

### 1. Ny seksjon: Total mengde brannfarlig stoff

Jeg legger inn en ny mengdeseksjon før/ved innmeldingsvurderingen:

```text
Total mengde brannfarlig stoff i virksomheten/anlegget
```

Denne får samme stoffkategorier som dagens mengdefelt:

- brannfarlig gass kategori 1
- brannfarlig gass kategori 2
- brannfarlig væske kategori 1 og 2
- brannfarlig væske kategori 3
- diesel/fyringsolje
- aerosoler

Hjelpeteksten blir tydelig på at dette er **sum av alt**:

```text
Fyll inn samlet mengde brannfarlig stoff i virksomheten/anlegget. Mengder i salgslokale, brannsikre skap og egne brannceller/lagerrom beregnet for brannfarlig vare skal tas med. Disse mengdene brukes til vurdering av innmeldingsplikt til DSB.
```

### 2. Eksisterende seksjon avgrenses til salgslokalet

Eksisterende seksjon beholdes, men presiseres slik:

```text
Planlagt mengde utover DSB sin veiledning i salgslokalet
```

Hjelpeteksten endres til:

```text
Fyll inn mengder brannfarlig stoff som ønskes plassert i selve salgslokalet utover DSB sin anbefalte mengde. Mengder som oppbevares i brannsikre skap eller i egne brannceller/lagerrom beregnet for brannfarlig vare skal ikke tas med her.
```

## Logikk som endres

### 1. Innmeldingsplikt skal bruke total mengde

Dagens innmeldingsvurdering bruker `plannedAmounts`. Dette endres til ny state, for eksempel:

```ts
totalAmounts
```

Da beregnes innmeldingsplikt ut fra totalmengdene, ikke bare mengdene som overskrider anbefalingen i salgslokalet.

Dette påvirker:

- innmeldingsstatus
- innmeldingstabell
- tekst i forhåndsvisning
- Word-eksport

### 2. Overskridelsesvurdering skal fortsatt bruke salgslokale-mengden

Vurderingen av mengde over anbefalt DSB-mengde skal fortsatt bruke dagens mengdefelt, men feltet får tydeligere navn og tekstlig avgrensning:

```text
Planlagt mengde utover DSB sin veiledning i salgslokalet
```

Dette brukes til:

- overskridelsesrader
- automatisk vurderingstekst
- konklusjon/avgrensning
- sammenligning mot DSB sine anbefalte salgslokalegrenser

### 3. Brannenergi endres fra «i bygget» til «i salgslokalet»

Siden brannenergiberegningen bruker mengdene som står i salgslokalet utenfor brannskap/egne brannceller, endres tekst og overskrift fra:

```text
Brannenergi i bygget
```

til:

```text
Brannenergi i salgslokalet
```

Relaterte formuleringer endres tilsvarende:

```text
Generell brannenergi i salgslokalet
Tillegg fra brannfarlige varer i salgslokalet
Sum for salgslokalet
```

## Lagring

Ingen databaseendring er nødvendig. Nye totalmengder lagres i eksisterende dokumentinnhold (`content` JSON), for eksempel:

```ts
totalAmounts
totalKommentar
totalInkludert
```

Eksisterende dokumenter håndteres bakoverkompatibelt:

- gamle dokumenter åpnes som før
- hvis `totalAmounts` mangler, starter totalmengdefeltene tomme
- eksisterende `plannedAmounts` beholdes som salgslokale-/overskridelsesmengder

## Forhåndsvisning

Jeg oppdaterer `BrensellagringPreview.tsx` slik at rapporten kan vise begge mengdesettene:

1. **Total mengde brannfarlig stoff**
   - egen tabell hvis valgt inn i dokumentet
   - tydelig tekst om at dette danner grunnlag for innmeldingsplikt

2. **Planlagt mengde utover DSB sin veiledning i salgslokalet**
   - eksisterende tabell, men med ny overskrift og avgrensning

3. **Brannenergi i salgslokalet**
   - ny overskrift og oppdaterte forklaringstekster

4. **Innmeldingsplikt til DSB**
   - forklaring endres til at vurderingen baseres på total mengde i virksomheten/anlegget

## Word-eksport

Jeg oppdaterer `src/lib/brensellagring-word-export.ts` tilsvarende:

- legger til totalmengde-data i eksportinterface
- skriver egen tabell for total mengde dersom den er valgt inn
- lar innmeldingsplikt bruke totalmengdene
- endrer brannenergi-kapittelet til «Brannenergi i salgslokalet»
- oppdaterer forklaringstekster slik at Word-dokumentet samsvarer med forhåndsvisningen

## Filer som endres

- `src/pages/Brensellagring.tsx`
  - ny state for totalmengder
  - ny inndataseksjon for total mengde
  - lagring/lasting av totalmengder
  - innmeldingsberegning fra totalmengder
  - brannenergi-tekst endres til salgslokale
  - props til forhåndsvisning og Word-eksport oppdateres

- `src/components/brensellagring/BrensellagringPreview.tsx`
  - nye props for totalmengder
  - ny rapportseksjon for total mengde
  - innmeldingsseksjon oppdateres
  - brannenergi-kapittel omdøpes til salgslokale

- `src/lib/brensellagring-word-export.ts`
  - nye eksportfelt for totalmengder
  - ny tabell for total mengde
  - innmeldingsplikt og brannenergi får korrekt datagrunnlag og tekst

## Resultat

Etter endringen blir datagrunnlaget faglig riktig:

```text
Total mengde
→ brukes til innmeldingsplikt

Mengde utover DSB-veiledningen i salgslokalet
→ brukes til overskridelsesvurdering og brannenergi i salgslokalet
```
