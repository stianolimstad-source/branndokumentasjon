
## Plan: Endre begrepet «Planlagt lagret mengde i bygget» til mengde utover DSB-veiledningen

Jeg oppdaterer brensellagring-modulen slik at denne delen ikke lenger fremstår som en generell oversikt over all brannfarlig lagring i bygget. Den skal tydelig beskrive at feltet gjelder mengder som ønskes lagret utover DSB sin veiledning, og som ikke allerede håndteres med brannsikre skap eller egne brannceller for brannfarlig vare.

## Hva som endres

### 1. Ny tittel i skjemaet

Dagens tittel:

```text
Planlagt lagret mengde i bygget
```

endres til for eksempel:

```text
Planlagt mengde utover DSB sin veiledning
```

Dette gjør det tydelig at brukeren bare skal registrere mengdene som inngår i avviksvurderingen mot DSB-tabellen.

### 2. Presisering i hjelpetekst

Hjelpeteksten under tittelen endres fra generell lagring til en faglig presisering:

```text
Fyll inn mengder brannfarlig stoff som ønskes lagret utover DSB sin anbefalte mengde. Mengder som oppbevares i brannsikre skap eller i egne brannceller beregnet for brannfarlig vare skal ikke tas med her.
```

### 3. Kommentar-placeholder oppdateres

Kommentar-feltet justeres slik at det peker på relevant vurderingsgrunnlag:

```text
F.eks. hvor mengdene plasseres, hvorfor de ikke står i brannskap/egen branncelle, og hvilke forutsetninger som gjelder for lagringen.
```

### 4. Forhåndsvisning oppdateres

I rapportforhåndsvisningen endres seksjonsnavnet tilsvarende:

```text
Planlagt mengde utover DSB sin veiledning
```

Beskrivelsen under overskriften endres til å forklare at tabellen viser mengder som vurderes utover anbefalt DSB-nivå, ikke byggets totale mengde brannfarlig stoff.

Tabellkolonnen «Planlagt mengde» kan beholdes, siden den beskriver mengden innenfor denne vurderingsdelen.

### 5. Word-eksport oppdateres

Word-dokumentet får samme endring som forhåndsvisningen:

- ny seksjonstittel
- ny forklarende tekst under tittelen
- samme tabellinnhold som før

Dette sikrer at skjema, forhåndsvisning og nedlastet Word-dokument bruker samme begrepsbruk.

### 6. Relaterte hjelpetekster justeres

Tekster som peker tilbake på den gamle seksjonen oppdateres, blant annet:

```text
Vurderingen er beregnet automatisk fra «Planlagt lagret mengde i bygget».
```

endres til:

```text
Vurderingen er beregnet automatisk fra «Planlagt mengde utover DSB sin veiledning».
```

Det samme gjelder meldingen som vises dersom ingen mengder er registrert.

## Teknisk gjennomføring

Jeg oppdaterer hovedsakelig:

- `src/pages/Brensellagring.tsx`
  - tittel, hjelpetekst og kommentar-placeholder i inndatafeltet
  - interne hjelpetekster for innmeldingsplikt og overskridelsesvurdering
  - kommentarer i koden der de bruker gammel formulering

- `src/components/brensellagring/BrensellagringPreview.tsx`
  - seksjonsnavn i dynamisk kapitteloversikt
  - overskrift og ingress i rapportforhåndsvisningen

- `src/lib/brensellagring-word-export.ts`
  - seksjonsoverskrift og ingress i Word-eksporten

## Ingen databaseendring

Dette er en tekst- og begrepsendring. Eksisterende lagrede mengder og dokumenter berøres ikke strukturelt.
