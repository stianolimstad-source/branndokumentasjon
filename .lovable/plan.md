
## Plan: Nedlasting av dokument for «Lagring av brannfarlig stoff»

Jeg legger til nedlasting av brensellagring-dokumentet som Word-fil, basert på samme innhold og struktur som forhåndsvisningen.

## Hva som bygges

### 1. Ny «Last ned Word»-knapp

I høyre forhåndsvisningspanel legger jeg til en nedlastingsknapp ved siden av tittelen «Forhåndsvisning»:

```text
Last ned Word
```

Knappen skal:

- eksportere gjeldende dokumentinnhold
- bruke prosjekt-, kunde-, firma- og logoopplysninger
- følge samme tilgangsbegrensning som andre dokumentnedlastinger i appen
- være deaktivert eller skjult hvis det ikke finnes nok innhold å eksportere

### 2. Egen Word-eksport for brensellagring

Jeg lager en ny eksportfunksjon, for eksempel:

```text
src/lib/brensellagring-word-export.ts
```

Denne bygger et `.docx`-dokument med:

- firmalogo øverst til høyre
- tittel: «Lagring av brannfarlig stoff»
- firma, kunde, prosjekt, adresse, bygningstype, dato og regelverk
- innledning
- valgte dokumentseksjoner
- tabeller og vurderingstekster tilsvarende forhåndsvisningen
- kilde-/kvalitetssikringstekst nederst

### 3. Samme innhold som forhåndsvisningen

Eksporten skal ta med de seksjonene som faktisk er valgt/inkludert:

- Planlagt lagret mengde i bygget
- Brannenergi i bygget
- Branntekniske tiltak i bygget
- Innmeldingsplikt til DSB
- Største tillatte mengder i salgslokaler
- Beliggenhet og utforming
- Sikkerhetsavstander
- Krav til tanker
- Oppsamling og overfyllingsvern
- Rørledninger og ventiler
- Kontroll og tilstandskontroll
- Dokumentasjonskrav
- Tillatte mengder
- Konstruksjonskrav
- Vurdering av mengde over anbefalt DSB-mengde nederst

### 4. Gjenbruk av eksisterende beregninger

Jeg gjenbruker beregningene som allerede finnes i `Brensellagring.tsx`, blant annet:

- planlagte mengder
- samlet gulvareal og omhyllingsflate
- brannenergi
- innmeldingsvurdering
- overskridelse mot DSB-anbefalt mengde
- vurdert tillatt mengde etter tiltak
- valgte krav og dokumentseksjoner

Dette gjør at Word-filen samsvarer med det brukeren ser i forhåndsvisningen.

### 5. Tilgangsstyring for nedlasting

Jeg bruker eksisterende `useCanDownload`-logikk, slik at nedlasting følger samme begrensning som resten av appen.

Hvis brukeren ikke har nedlastingstilgang, vises ikke nedlastingsknappen.

### 6. Filnavn

Word-filen får et ryddig norsk filnavn, for eksempel:

```text
Brensellagring_Prosjektnavn.docx
```

Hvis prosjektnavn mangler, brukes:

```text
Brensellagring.docx
```

## Teknisk gjennomføring

Jeg oppdaterer hovedsakelig:

- `src/pages/Brensellagring.tsx`
  - importerer eksportfunksjon og `useCanDownload`
  - legger til `handleDownloadWord`
  - legger inn «Last ned Word»-knapp i forhåndsvisningspanelet
  - sender alle nødvendige data til eksportfunksjonen

- `src/lib/brensellagring-word-export.ts`
  - bygger Word-dokumentet med `docx`
  - lager tabeller, overskrifter, tekstblokker og logo
  - formaterer tall, enheter og datoer
  - lagrer dokumentet via `file-saver`

Eventuelt:
- eksportere eller speile små hjelpefunksjoner fra forhåndsvisningen dersom det gjør eksporten mer konsistent og ryddig

## Ingen databaseendring

Dette krever ingen endringer i databasen. Eksporten bruker data som allerede ligger i skjemaet og lagres i eksisterende dokumentinnhold.
