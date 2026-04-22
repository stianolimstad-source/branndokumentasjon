
## Plan: Fjerne dobbel omtale av automatisk slokkeanlegg i vurderingsteksten

Jeg retter tekstgeneratoren for «Vurdering av mengde over anbefalt DSB-mengde» slik at automatisk slokkeanlegg ikke nevnes to ganger i samme avsnitt.

## Hva som endres

### 1. Skille hovedbegrunnelse fra tilleggstiltak

I dag skjer dette:

```text
Bygget er sprinklet/har automatisk slokkeanlegg ...
Det er også lagt til grunn brannalarmanlegg/tidlig deteksjon, automatisk slokkeanlegg.
```

Jeg endrer logikken slik at når automatisk slokkeanlegg allerede brukes som hovedbegrunnelse, tas det ikke med på nytt i listen over «også lagt til grunn».

### 2. Ny formulering

Teksten blir i stedet omtrent slik:

```text
Overskridelsen vurderes som begrenset. Bygget er sprinklet/har automatisk slokkeanlegg, noe som reduserer sannsynligheten for videre brannutvikling og begrenser konsekvensene av et branntilløp. Det er i tillegg lagt til grunn brannalarmanlegg/tidlig deteksjon.
```

Hvis det også er valgt røykventilasjon eller skrevet inn prosjektspesifikke tiltak, tas disse med i samme tilleggsliste.

### 3. Oppdatere genereringslogikken

Jeg oppdaterer `src/pages/Brensellagring.tsx`:

- beholder `harAutomatiskSlokkeanlegg` som hovedbegrunnelse
- lager en egen liste for tilleggstiltak som ikke inkluderer automatisk slokkeanlegg når det allerede er nevnt
- justerer setningen fra «Det er også lagt til grunn ...» til en mer presis formulering, for eksempel «Det er i tillegg lagt til grunn ...»

### 4. Forhåndsvisning og Word

Forhåndsvisning og Word-eksport bruker den lagrede vurderingsteksten. Når ny tekst genereres etter endringen, vil begge steder få den korrigerte teksten.

## Viktig om eksisterende tekst

Tekst som allerede ligger i feltet blir ikke automatisk overskrevet. Brukeren må enten:

- trykke «Generer tekst» på nytt, eller
- redigere teksten manuelt

for å få den nye formuleringen.
