## Plan: Legge til total brannenergi for hele bygget

Jeg utvider dokumentet «Lagring av brannfarlig stoff» med en egen brannenergiberegning for hele bygget, basert på totalmengdene som allerede er lagt inn for hele virksomheten/anlegget.

Målet er å kunne kontrollere om samlet brannenergi, inkludert varer i salgslokale, brannskap og egne brannceller/lagerrom, kan påvirke forutsetningene i brannkonseptet og eventuelt krav til branncellebegrensende konstruksjoner/brannvegger.

## Datagrunnlag etter endringen

```text
Total mengde brannfarlig stoff i virksomheten/anlegget
→ innmeldingsplikt til DSB
→ ny beregning: brannenergi i hele bygget

Planlagt mengde utover DSB sin veiledning i salgslokalet
→ overskridelsesvurdering i salgslokalet
→ brannenergi i salgslokalet
```

## Hva som bygges

### 1. Ny seksjon i skjemaet: «Brannenergi i hele bygget»

Jeg legger inn en egen beregningsseksjon i skjemaet, ved siden av/etter dagens brannenergiseksjon for salgslokalet.

Seksjonen får egen «Legg til i dokumentet»-knapp og forklarende tekst:

```text
Beregningen tar utgangspunkt i total mengde brannfarlig stoff i virksomheten/anlegget, inkludert mengder i salgslokale, brannsikre skap og egne brannceller/lagerrom beregnet for brannfarlig vare.
```

### 2. Brannenergi for hele bygget beregnes fra totalmengdene

Beregningen bruker eksisterende energitettheter/sjablongverdier:

- brannfarlig gass kategori 1
- brannfarlig gass kategori 2
- brannfarlig væske kategori 1 og 2
- brannfarlig væske kategori 3
- diesel/fyringsolje
- aerosoler

I stedet for `plannedAmounts` brukes `totalAmounts`.

Resultatet vises som:

- bidrag per stoffkategori
- total brannenergi fra brannfarlige stoffer i hele bygget, MJ
- generell/statistisk brannenergi for bygget, dersom areal er fylt ut
- samlet beregnet brannenergi
- spesifikk brannenergi per m² omhyllingsflate, dersom lengde, bredde og høyde er fylt ut

### 3. Brannkonsept-grense legges inn som valgfritt kontrollfelt

Jeg legger til et valgfritt felt i den nye seksjonen:

```text
Dimensjonerende brannenergi fra brannkonsept (MJ/m² omhyllingsflate)
```

Brukeren kan fylle inn grensen fra brannkonseptet, for eksempel 400 MJ/m², 600 MJ/m² eller annet prosjektspesifikt nivå.

Når feltet er utfylt, viser appen en tydelig vurdering:

- under eller lik grense: «Beregnet brannenergi ligger innenfor angitt nivå i brannkonseptet»
- over grense: «Beregnet brannenergi overstiger angitt nivå i brannkonseptet og kan kreve ny vurdering av branncellebegrensende konstruksjoner/brannvegger»

### 4. Kommentar-/vurderingsfelt

Den nye seksjonen får et eget kommentarfelt, for eksempel:

```text
Kommentar til samlet brannenergi / kontroll mot brannkonsept
```

Dette kan brukes til å beskrive:

- hvilken brannenergi som er lagt til grunn i brannkonseptet
- om lagringen er fordelt i flere brannceller
- om brannskap/egne brannceller er dimensjonert særskilt
- om beregningen utløser behov for revurdering

### 5. Dagens «Brannenergi i salgslokalet» beholdes

Eksisterende brannenergiberegning beholdes, men fortsatt avgrenset til salgslokalet:

```text
Brannenergi i salgslokalet
→ bruker kun mengde utover DSB-veiledningen i salgslokalet
```

Den nye beregningen skal ikke erstatte denne. Den blir et tillegg for helhetskontroll mot brannkonseptet.

## Forhåndsvisning

Jeg oppdaterer rapportforhåndsvisningen slik at den kan vise en ny seksjon:

```text
Brannenergi i hele bygget
```

Denne seksjonen skal inneholde:

1. forklaring av datagrunnlaget
2. tabell med bidrag fra totalmengdene
3. beregningsoppsummering
4. eventuell kontroll mot angitt brannkonsept-grense
5. brukerens kommentar

Eksisterende seksjon «Brannenergi i salgslokalet» blir stående uendret i prinsipp, men rapporten får dermed to separate brannenergivurderinger med tydelig forskjellig datagrunnlag.

## Word-eksport

Jeg oppdaterer Word-eksporten tilsvarende:

- nytt eksportfelt for å slå på/av «Brannenergi i hele bygget»
- nye felt for brannkonsept-grense og kommentar
- beregning fra `totalAmounts`
- egen seksjon i Word-dokumentet
- samme vurderingstekst som i forhåndsvisningen

## Lagring

Ingen databaseendring er nødvendig. Nye felt lagres i eksisterende dokumentinnhold (`content` JSON), for eksempel:

```ts
byggBrannenergiInkludert
byggBrannenergiGrenseMJm2
byggBrannenergiKommentar
```

Eksisterende dokumenter åpnes som før. Nye felt starter tomme/avslått for gamle dokumenter.

## Teknisk gjennomføring

Jeg oppdaterer hovedsakelig:

- `src/pages/Brensellagring.tsx`
  - legger til state for brannenergi i hele bygget
  - beregner energibidrag fra `totalAmounts`
  - legger inn ny UI-seksjon med grensefelt og kommentar
  - lagrer/leser nye felt i dokumentets `content`
  - sender nye props til forhåndsvisning og Word-eksport

- `src/components/brensellagring/BrensellagringPreview.tsx`
  - legger til props for den nye beregningen
  - beregner/viser «Brannenergi i hele bygget»
  - viser kontroll mot angitt nivå fra brannkonseptet

- `src/lib/brensellagring-word-export.ts`
  - legger til nye eksportfelt
  - genererer seksjonen «Brannenergi i hele bygget» i Word
  - inkluderer tabeller og vurderingstekst

## Resultat

Etter endringen får rapporten to tydelige brannenergiberegninger:

```text
Brannenergi i salgslokalet
→ bare varer i salgslokalet utover DSB-veiledningen

Brannenergi i hele bygget
→ totalmengder i hele virksomheten/anlegget, inkludert brannskap og egne brannceller
→ kontroll mot brannkonseptets forutsatte brannenerginivå
```

Dette gjør dokumentet bedre egnet til å vurdere om total lagring kan påvirke krav til branncellebegrensende konstruksjoner, brannvegger eller øvrige forutsetninger i brannkonseptet.