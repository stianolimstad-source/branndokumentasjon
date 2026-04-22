
## Plan: Ny vurderingsdel for mengder over DSB-anbefaling

Jeg legger til en egen del i «Lagring av brannfarlig stoff» som vurderer planlagt mengde opp mot anbefalte mengder i DSB sin veiledning, og som kan beskrive hvorfor en høyere mengde kan aksepteres basert på kompenserende tiltak.

## Hva som bygges

### 1. Ny seksjon i skjemaet

Jeg legger inn et nytt kort i venstre panel, etter «Planlagt lagret mengde i bygget» og før/ved siden av brannenergi/tiltak:

```text
Vurdering av mengde over anbefalt DSB-mengde
```

Seksjonen får:

- knapp for «Legg til i dokument»
- automatisk sammenligning mellom:
  - planlagt lagret mengde
  - anbefalt mengde fra DSB-tabellen/valgt bygningstype
  - overskridelse i liter/kg
  - overskridelse i prosent
- tekstfelt for prosjektspesifikk vurdering
- tekstfelt for konklusjon / anbefalt maksimal mengde etter tiltak

### 2. Automatisk beregning av overskridelse

Systemet beregner hvilke stoffgrupper som overstiger anbefalt mengde.

For vanlige bygningstyper brukes eksisterende grensedata i `brensellagring-krav.ts`.

For salgslokaler brukes DSB-tabellen for stykkgods/salgslokale. Siden DSB-tabellen avhenger av areal, legger jeg inn en enkel arealvurdering:

- hvis etasje-/arealdata allerede er fylt ut i brannenergidelen, kan systemet bruke samlet gulvareal
- hvis ikke, kan brukeren fylle inn/velge arealgrunnlag manuelt
- riktig DSB-rad brukes deretter som anbefalt mengde

### 3. Tiltaksbasert vurderingstekst

Jeg lager en automatisk rapporttekst som bygger på tiltakene som allerede finnes i verktøyet:

- brannalarmanlegg
- røykventilasjon
- automatisk slokkeanlegg/sprinkler
- brannskap/avlukke
- oppsamlingskar
- kontroll og dokumentasjon
- andre prosjektspesifikke tiltak skrevet av brukeren

Teksten skal forklare at mengdene overstiger anbefalte mengder, men at høyere mengde kan vurderes akseptabel dersom tiltakene samlet gir tilstrekkelig sikkerhetsnivå.

Eksempel på rapportlogikk:

```text
Planlagt mengde brannfarlig væske kategori 1 og 2 overstiger anbefalt mengde i DSB sin temaveiledning med X liter, tilsvarende Y %. Det er lagt til grunn at stoffene oppbevares i brannskap/avlukke, at området er dekket av brannalarmanlegg og at bygget er sprinklet. På bakgrunn av disse tiltakene vurderes en økning til Z liter som akseptabel for dette bygget, forutsatt at lagringen skjer som beskrevet og at tiltakene opprettholdes i driftsfasen.
```

Brukeren skal kunne redigere teksten manuelt.

### 4. Ny tabell i forhåndsvisningen

I dokumentforhåndsvisningen legger jeg inn en ny seksjon, for eksempel:

```text
Vurdering av mengde over anbefalt DSB-mengde
```

Den får en tabell med:

| Stoffgruppe | Anbefalt mengde | Planlagt mengde | Overskridelse | Vurdert tillatt mengde |
|---|---:|---:|---:|---:|

Under tabellen vises:

- vurderingsteksten
- forutsetninger/tiltak
- konklusjon
- en tydelig presisering om at dette er en risikovurdering, ikke en generell heving av DSB-grensen

### 5. Lagring

Jeg utvider eksisterende lagring i `fire_concepts.content` med nye felter, uten å lage nye databasetabeller.

Nye data kan lagres omtrent slik:

```ts
overskridelseInkludert
overskridelseArealgrunnlag
overskridelseVurdertTillattMengde
overskridelseTiltak
overskridelseVurderingstekst
overskridelseKonklusjon
```

Dette bevarer eksisterende dokumenter og krever ingen databaseendring.

### 6. Integrasjon med eksisterende dokumentflyt

Jeg kobler den nye delen inn i:

- lasting av eksisterende dokument
- lagring av dokument
- forhåndsvisning
- dynamisk kapittelnummerering
- eksisterende «Planlagt lagret mengde»
- eksisterende «Branntekniske tiltak»

## Teknisk gjennomføring

Jeg oppdaterer hovedsakelig disse filene:

- `src/pages/Brensellagring.tsx`
  - nye state-felter
  - beregning av anbefalt mengde og overskridelse
  - nytt skjema-/kort for vurderingen
  - lagring/lasting i `fire_concepts.content`
  - props videre til forhåndsvisningen

- `src/components/brensellagring/BrensellagringPreview.tsx`
  - nye props/types
  - ny rapportseksjon
  - tabell for overskridelse
  - vurderingstekst og konklusjon
  - dynamisk nummerering

Eventuelt:
- `src/lib/brensellagring-krav.ts`
  - bare hvis det trengs en liten hjelpefunksjon for å slå opp anbefalte mengder mer ryddig

## Faglig avgrensning

Jeg legger inn en tydelig tekst i dokumentet om at:

- DSB-verdiene er anbefalte mengder fra veiledningen
- høyere mengder må begrunnes med en konkret risikovurdering
- vurderingen gjelder bare for bygget, tiltakene og forutsetningene som er beskrevet
- økt mengde forutsetter at tiltakene etableres og opprettholdes
