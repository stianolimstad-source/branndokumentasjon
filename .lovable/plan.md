
## Mål
Legge inn en ny seksjon i «Lagring av brannfarlig stoff» som beskriver branntekniske tiltak i bygget, og som kan inkluderes i rapporten på samme måte som planlagte mengder, brannenergi, innmelding og kontroll.

Tiltakene skal dekke:
- Brannalarmanlegg
- Røykventilasjon
- Automatisk slokkeanlegg

## Plassering i input-siden
I `src/pages/Brensellagring.tsx` legges det inn et nytt kort etter «Brannenergi i bygget» / «Planlagt lagret mengde i bygget» og før de øvrige kravfanene.

Kortet får tittelen:

```text
Branntekniske tiltak i bygget
```

Kortet får:
- «Legg til i dokument»-knapp
- Tre underseksjoner:
  1. Brannalarmanlegg
  2. Røykventilasjon
  3. Automatisk slokkeanlegg
- Kommentar-/beskrivelsesfelt for hvert tiltak
- En felles kommentar nederst for prosjektspesifikke forutsetninger

## Felt som legges inn

### 1. Brannalarmanlegg
Felt:
- Status:
  - Ikke aktuelt
  - Ikke installert
  - Installert / forutsatt
  - Eksisterende anlegg beholdes
- Type/beskrivelse:
  - Fritekst, f.eks. «Heldekkende brannalarmanlegg kategori 2», «Manuelle meldere», «Deteksjon i lagerrom» osv.
- Kommentar:
  - Fritekst for prosjekttilpasning

### 2. Røykventilasjon
Felt:
- Status:
  - Ikke aktuelt
  - Ikke installert
  - Installert / forutsatt
  - Eksisterende løsning beholdes
- Type:
  - Naturlig røykventilasjon
  - Mekanisk røykventilasjon
  - Luker/vinduer/åpninger
  - Annet
- Beskrivelse/kommentar:
  - Fritekst, f.eks. «Røykventilasjon vurderes ikke nødvendig for små mengder i salgslokale» eller «Termisk røykventilasjon dimensjoneres iht. HO-3/2000».

Det kan også legges inn en liten hjelpetekst med lenke/knapp til eksisterende røykventilasjonsverktøy dersom brukeren ønsker å beregne nødvendig åpningsareal.

### 3. Automatisk slokkeanlegg
Felt:
- Status:
  - Ikke aktuelt
  - Ikke installert
  - Installert / forutsatt
  - Eksisterende anlegg beholdes
- Type:
  - Sprinkleranlegg
  - Vanntåkeanlegg
  - Skum-/gassanlegg
  - Annet
- Beskrivelse/kommentar:
  - Fritekst, f.eks. «Bygget er sprinklet», «Lagerrom omfattes av eksisterende sprinkleranlegg», eller «Automatisk slokkeanlegg er ikke forutsatt».

## State og lagring
I `src/pages/Brensellagring.tsx` legges det til ny state:

```ts
branntekniskeTiltakInkludert: boolean

branntekniskeTiltak: {
  brannalarm: {
    status: string;
    beskrivelse: string;
    kommentar: string;
  };
  roykventilasjon: {
    status: string;
    type: string;
    beskrivelse: string;
  };
  slokkeanlegg: {
    status: string;
    type: string;
    beskrivelse: string;
  };
  generellKommentar: string;
}
```

Disse feltene:
- lagres i `docContent`
- leses tilbake ved åpning av eksisterende dokument
- sendes videre til forhåndsvisningen

## Rapport / forhåndsvisning
I `src/components/brensellagring/BrensellagringPreview.tsx` legges det inn en ny rapportseksjon:

```text
Branntekniske tiltak i bygget
```

Seksjonen vises når:
- `branntekniskeTiltakInkludert === true`
- minst ett tiltak har valgt status eller beskrivelse

Rapporten får en tabell med kolonnene:

| Tiltak | Status | Beskrivelse |
|---|---|---|
| Brannalarmanlegg | Installert / forutsatt | ... |
| Røykventilasjon | Ikke aktuelt | ... |
| Automatisk slokkeanlegg | Eksisterende anlegg beholdes | ... |

Hvis felles kommentar er fylt ut, vises den under tabellen i en egen kommentarboks.

## Rekkefølge i rapporten
Ny seksjon legges inn tidlig i rapporten, etter:
1. Planlagt lagret mengde i bygget
2. Brannenergi i bygget

og før:
3. Innmeldingsplikt til DSB
4. Lagring i bygning
5. Kontroll og tilstandskontroll

Dette gir en naturlig rapportflyt:
```text
Planlagte mengder
Brannenergi
Branntekniske tiltak
Innmelding
Lagring i bygning
Kontroll
Dokumentasjon
```

## Teknisk gjennomføring

### Endres i `src/pages/Brensellagring.tsx`
- Legge til state for `branntekniskeTiltakInkludert`
- Legge til state for alle tiltakene
- Lese/lagre feltene i eksisterende `content`
- Lage nytt input-kort for branntekniske tiltak
- Sende props til `BrensellagringPreview`

### Endres i `src/components/brensellagring/BrensellagringPreview.tsx`
- Utvide props med `branntekniskeTiltakInkludert` og `branntekniskeTiltak`
- Legge ny seksjon inn i `sections`-listen
- Rendre tabell for brannalarm, røykventilasjon og slokkeanlegg
- Vise eventuell generell kommentar

## Ingen databaseendringer
Dette lagres i eksisterende dokumentinnhold, slik de andre delene i brensellagringsrapporten allerede gjør. Det krever derfor ingen migrasjon.
