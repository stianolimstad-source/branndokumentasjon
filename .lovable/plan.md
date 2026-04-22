
## Plan: Legge til «Utarbeidet av» og «KS» i brensellagring-rapporten

Jeg legger inn dokumentkontroll i rapporten for «Lagring av brannfarlig stoff», slik at rapporten viser hvem som har utarbeidet dokumentet og hvem som har kvalitetssikret det.

## Hva som bygges

### 1. Automatisk «Utarbeidet av»

Rapporten skal vise brukeren som lager rapporten.

Jeg henter dette fra innlogget bruker/profil:

- navn fra brukerprofil hvis tilgjengelig
- e-post som fallback dersom navn mangler
- eventuelt firma/tittel dersom det allerede finnes i profilen

Dette vises i rapportens informasjonstabell, for eksempel:

```text
Utarbeidet av: Ola Nordmann
```

Hvis profilnavn mangler, brukes e-post:

```text
Utarbeidet av: ola@example.no
```

### 2. Manuelt KS-felt

I skjemaet legger jeg til et nytt felt for kvalitetssikring:

```text
KS / Kontrollert av
```

Brukeren kan fylle inn navn selv, for eksempel:

```text
Kari Kontrollør
```

Dette feltet lagres sammen med brensellagring-dokumentet og vises i rapporten.

### 3. Rapportvisning

I forhåndsvisningen legger jeg inn dokumentkontrollen i toppinformasjonen sammen med firma, kunde, prosjekt, adresse, dato og regelverk.

Eksempel:

```text
Firma:          ...
Kunde:          ...
Prosjekt:       ...
Adresse:        ...
Bygningstype:   ...
Utarbeidet av:  ...
KS:             ...
Dato:           ...
Regelverk:      ...
```

Hvis KS-feltet er tomt, skjules raden eller vises som tom etter samme mønster som resten av tabellen.

### 4. Word-eksport

Word-dokumentet oppdateres tilsvarende, slik at «Utarbeidet av» og «KS» blir med i den samme informasjonstabellen øverst i dokumentet.

Dette gir samme innhold i:

- forhåndsvisning
- nedlastet Word-dokument
- lagret dokument

### 5. Lagring og eksisterende dokumenter

Dette krever ingen databaseendring. Feltene lagres i eksisterende `content`-JSON for brensellagring-dokumentet.

Eksisterende dokumenter vil fortsatt åpne som før. For gamle dokumenter:

- «Utarbeidet av» fylles automatisk fra innlogget bruker/profil
- «KS» er tomt frem til brukeren fyller det inn og lagrer dokumentet

## Teknisk gjennomføring

Jeg oppdaterer hovedsakelig:

- `src/pages/Brensellagring.tsx`
  - henter flere profilfelt for innlogget bruker
  - lager automatisk visningsnavn for «Utarbeidet av»
  - legger til state for `ksAnsvarlig`
  - legger inn inputfelt for KS i toppdelen av skjemaet
  - lagrer/leser KS-feltet i dokumentets `content`
  - sender `utarbeidetAv` og `ksAnsvarlig` videre til forhåndsvisning og Word-eksport

- `src/components/brensellagring/BrensellagringPreview.tsx`
  - utvider props med `utarbeidetAv` og `ksAnsvarlig`
  - viser feltene i toppinformasjonstabellen

- `src/lib/brensellagring-word-export.ts`
  - utvider Word-data med `utarbeidetAv` og `ksAnsvarlig`
  - legger feltene inn i dokumentets informasjonstabell

## Ingen databaseendring

Endringen bruker eksisterende lagringsstruktur og krever ingen migrasjoner.
