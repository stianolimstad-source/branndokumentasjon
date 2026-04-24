## Plan: Redigerbar seksjon for «Plassering av brannfarlig vare»

Jeg legger inn «Plassering av brannfarlig vare» som en egen del i input-siden, slik at teksten som vises i rapporten kan redigeres før dokumentet lagres/eksporteres.

## Hva som endres

### 1. Legge til redigerbare standardtekster

Inputdelen får en egen seksjon under «Største tillatte mengder i salgslokaler – DSB Temaveiledning Kap. 3» med felter for:

- Innledende vurderingstekst for plassering
- Vurderingstekst for avstand til rømningsvei, standard: 8 meter
- Vurderingstekst for avstand mellom gass og brannfarlig væske, standard: 3 meter

Standardtekstene beholdes som utgangspunkt, men kan endres fritt av brannrådgiver.

### 2. Vise redigert tekst i forhåndsvisningen

Rapportseksjonen «Plassering av brannfarlig vare» oppdateres til å bruke tekstene fra inputfeltet i stedet for hardkodet tekst.

Tabellen beholdes med samme struktur:

```text
Forhold | Anbefalt avstand | Vurdering
```

men kolonnen «Vurdering» henter redigert innhold fra inputdelen.

### 3. Lagre tekstene sammen med dokumentet

De redigerte plasseringstekstene lagres i dokumentinnholdet, slik at de kommer tilbake ved senere åpning av samme rapport.

### 4. Oppdatere Word-eksport

Word-eksporten oppdateres til å bruke samme redigerte plasseringstekster som forhåndsvisningen.

## Tekniske detaljer

Filer som endres:

- `src/pages/Brensellagring.tsx`
  - legge til state for plasseringstekster
  - laste inn og lagre tekstene i `fire_concepts.content`
  - legge inn redigerbar inputseksjon i salgslokale-kortet
  - sende tekstene til forhåndsvisning og Word-eksport

- `src/components/brensellagring/BrensellagringPreview.tsx`
  - utvide props med plasseringstekster
  - bruke redigerte tekster i rapportseksjonen

- `src/lib/brensellagring-word-export.ts`
  - utvide eksportdata med plasseringstekster
  - bruke redigerte tekster i Word-tabellen

## Resultat

«Plassering av brannfarlig vare» blir ikke lenger bare en fast rapporttekst. Den blir synlig og redigerbar i inputdelen, og samme tekst brukes konsekvent i forhåndsvisning, lagret dokument og Word-eksport.