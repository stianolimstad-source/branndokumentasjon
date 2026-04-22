
## Plan: Korrigere vurderingstekst for mengder over DSB-anbefaling

Jeg oppdaterer vurderingen i «Lagring av brannfarlig stoff» slik at brannskap ikke automatisk fremstår som et tiltak når dette ikke er lagt til grunn. Teksten skal i stedet beskrive at en begrenset økning kan aksepteres fordi bygget er sprinklet og økningen er liten, mens ytterligere økning må håndteres med brannsikker oppbevaring.

## Hva som endres

### 1. Fjerne automatisk «brannskap» som tiltak

I dag legges «oppbevaring i brannskap/avlukke» inn i den genererte vurderingsteksten dersom standardteksten for salgslokale inneholder ordet «brannskap». Det gir feil resultat, fordi brannskap da blir omtalt som et faktisk tiltak selv om det bare er nevnt som en mulig løsning.

Jeg endrer dette slik at:

- brannskap ikke hentes automatisk fra standardteksten
- brannskap kun omtales som tiltak dersom brukeren selv skriver det inn som prosjektspesifikt tiltak
- vurderingen ikke feilaktig sier at dagens mengder forutsetter oppbevaring i brannskap

### 2. Ny fagtekst for begrenset økning

«Generer tekst»-knappen i vurderingsdelen oppdateres til en mer presis standardtekst:

- mengdene overstiger DSB sin anbefalte tabellverdi
- overskridelsen vurderes som begrenset
- aksepten begrunnes med sprinkleranlegg i bygget dersom automatisk slokkeanlegg er valgt/forutsatt
- økningen gjelder bare de angitte mengdene og forutsetningene
- ytterligere økning utover vurdert mengde må plasseres i brannsikre skap/avlukke eller vurderes særskilt

Eksempel på ønsket retning:

```text
Planlagt lagring overstiger anbefalt mengde i DSB sin temaveiledning. Overskridelsen vurderes som begrenset, og bygget er sprinklet. På denne bakgrunn vurderes den angitte økte mengden som akseptabel for dette bygget, forutsatt at lagringen skjer oversiktlig og i samsvar med beskrevne forutsetninger.

Dersom det ønskes lagret mengder utover det som er vurdert her, må dette enten plasseres i brannsikre skap/avlukke eller underlegges en ny særskilt risikovurdering.
```

### 3. Presisering om væsker vs. gass

Jeg legger inn en tydelig presisering i vurderingsteksten om at økt mengde bare kan aksepteres for brannfarlige væsker, ikke for gass.

Teksten skal forklare faglig hvorfor:

- DSB-tabellen åpner for at tillatt væskemengde øker med areal
- tillatt gassmengde øker ikke tilsvarende med bygningsstørrelse
- dette tilsier at DSB legger en strengere vurdering til grunn for gass
- gassmengder skal derfor ikke økes utover anbefalt mengde uten særskilt vurdering

### 4. Oppdatere hjelpetekster i skjemaet

Jeg justerer teksten i skjemaet slik at den ikke lenger fremhever brannskap som et generelt eksempel på tiltak for den aktuelle vurderingen.

Jeg endrer blant annet:

- infoteksten under DSB-tabellen for salgslokaler
- placeholder for «Andre prosjektspesifikke tiltak»
- eventuell standardtekst som kan gi inntrykk av at brannskap allerede er lagt til grunn

### 5. Forhåndsvisning og Word-eksport

Forhåndsvisningen og Word-dokumentet bruker allerede vurderingsteksten som brukeren har i feltet. Når generatoren og standardtekstene oppdateres, vil både forhåndsvisning og Word-eksport få korrekt tekst.

Jeg kontrollerer også at:

- vurderingsdelen fortsatt ligger nederst i dokumentet
- tabellen for overskridelse fortsatt viser anbefalt, planlagt, overskridelse og vurdert tillatt mengde
- Word-eksporten ikke introduserer egen brannskapstekst uten at brukeren har skrevet det inn

## Teknisk gjennomføring

Jeg oppdaterer hovedsakelig:

- `src/pages/Brensellagring.tsx`
  - fjerner automatisk deteksjon av «brannskap» fra salgslokaleteksten
  - oppdaterer `foreslattOverskridelseTekst`
  - legger inn presisering om at økning kun gjelder væsker
  - justerer hjelpetekster/placeholdere i vurderingskortet

- `src/components/brensellagring/BrensellagringPreview.tsx`
  - kontrollerer at vurderingsteksten vises uendret og uten ekstra brannskapstekst

- `src/lib/brensellagring-word-export.ts`
  - kontrollerer at Word-eksporten bruker samme vurderingstekst uten ekstra automatisk tiltakstekst

## Viktig om eksisterende dokumenter

Eksisterende dokumenter som allerede har lagret gammel vurderingstekst vil beholde teksten til brukeren trykker «Generer tekst» på nytt eller redigerer feltet manuelt. Nye genererte tekster vil bruke den korrigerte formuleringen.
