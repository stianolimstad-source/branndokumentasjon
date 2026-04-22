
## Mål
Utvide seksjonen «Branntekniske tiltak i bygget» slik at hvert tiltak får en automatisk fagtekst om funksjon og betydning for tilgjengelig/nødvendig rømningstid. Teksten skal kunne redigeres fritt, og brukeren skal kunne trykke «Original tekst» for å tilbakestille til den automatisk genererte standardteksten.

Tiltakene gjelder:
- Brannalarmanlegg
- Røykventilasjon
- Automatisk slokkeanlegg

## Endring på input-siden

I `src/pages/Brensellagring.tsx` utvides kortet «Branntekniske tiltak i bygget».

For hvert tiltak legges det til et nytt tekstfelt:

```text
Rapporttekst / virkning på rømningstid
```

Feltet fylles automatisk med standardtekst når brukeren velger status/type, men kan redigeres manuelt.

Ved siden av feltet legges en knapp:

```text
Original tekst
```

Knappen erstatter feltets innhold med standardteksten for valgt tiltak/status/type.

## Foreslåtte standardtekster

### Brannalarmanlegg
Teksten beskriver at brannalarmanlegg gir tidlig deteksjon og varsling, og dermed bidrar til å redusere nødvendig rømningstid ved at personer i bygget varsles tidligere. Tidlig varsling gir økt sikkerhetsmargin mellom tilgjengelig rømningstid og nødvendig rømningstid.

Eksempel:

```text
Brannalarmanlegg bidrar til tidlig deteksjon og varsling ved branntilløp. Tidlig varsling reduserer normalt nødvendig rømningstid, fordi personer i bygget kan starte evakuering tidligere. Tiltaket øker dermed sikkerhetsmarginen mellom tilgjengelig rømningstid og nødvendig rømningstid.
```

### Røykventilasjon
Teksten beskriver at røykventilasjon kan begrense røykoppbygging, bedre siktforhold og redusere temperatur-/røykpåvirkning i rømningsfasen. Dette kan bidra til å opprettholde tilgjengelig rømningstid.

Eksempel:

```text
Røykventilasjon har som formål å begrense røykoppbygging og bidra til bedre sikt- og temperaturforhold i bygget ved brann. Tiltaket kan bidra til å opprettholde tilgjengelig rømningstid ved at røyk- og varmebelastningen i rømningsfasen reduseres.
```

### Automatisk slokkeanlegg
Teksten beskriver at automatisk slokkeanlegg kan kontrollere eller slokke brannen tidlig, redusere brannutvikling, røykproduksjon og temperatur, og dermed øke tilgjengelig rømningstid.

Eksempel:

```text
Automatisk slokkeanlegg kan bidra til å kontrollere eller slokke brannen i en tidlig fase. Dette reduserer brannutvikling, røykproduksjon og temperaturpåvirkning, og kan dermed øke tilgjengelig rømningstid sammenlignet med et bygg uten automatisk slokkeanlegg.
```

## State og lagring

Eksisterende state for `branntekniskeTiltak` utvides bakoverkompatibelt:

```ts
branntekniskeTiltak: {
  brannalarm: {
    status: string;
    beskrivelse: string;
    kommentar: string;
    rapporttekst: string;
  };
  roykventilasjon: {
    status: string;
    type: string;
    beskrivelse: string;
    rapporttekst: string;
  };
  slokkeanlegg: {
    status: string;
    type: string;
    beskrivelse: string;
    rapporttekst: string;
  };
  generellKommentar: string;
}
```

Eksisterende dokumenter som mangler `rapporttekst` skal fortsatt åpnes uten feil. Tomme felt initialiseres med tom streng.

## Automatisk generering uten å overskrive brukerens tekst

Det legges inn hjelpefunksjoner i `Brensellagring.tsx`:

- `getOriginalTiltakTekst("brannalarm", status)`
- `getOriginalTiltakTekst("roykventilasjon", status, type)`
- `getOriginalTiltakTekst("slokkeanlegg", status, type)`

Når brukeren endrer status/type:
- Hvis rapporttekstfeltet er tomt, fylles det automatisk med originaltekst.
- Hvis rapporttekstfeltet allerede er redigert manuelt, overskrives det ikke.
- Knappen «Original tekst» kan brukes for å manuelt tilbakestille teksten.

## UI-oppsett

Hver tiltak-boks får denne strukturen:

```text
Brannalarmanlegg
[Status] [Type/beskrivelse]
[Kommentar]
Rapporttekst / virkning på rømningstid        [Original tekst]
[Redigerbart tekstfelt]
```

For røykventilasjon beholdes knappen til beregningsverktøyet.

Tekstfeltene får større høyde enn kommentarene, f.eks. `min-h-[120px]`, siden dette er rapporttekst.

## Rapport / forhåndsvisning

I `src/components/brensellagring/BrensellagringPreview.tsx` utvides rapportseksjonen «Branntekniske tiltak i bygget».

Dagens tabell beholdes, men beskrivelseskolonnen utvides slik at den viser:
1. Type/beskrivelse/status
2. Eventuell kommentar
3. Redigerbar rapporttekst om funksjon og rømningstid

Alternativt struktureres innholdet i rapporten slik:

```text
Brannalarmanlegg
Status: Installert / forutsatt
Beskrivelse: Heldekkende brannalarmanlegg kategori 2

Brannalarmanlegg bidrar til tidlig deteksjon ...
```

Dette gir mer lesbar rapporttekst enn en veldig tett tabell.

## Rapportlogikk

Seksjonen vises når:
- `branntekniskeTiltakInkludert === true`
- minst ett tiltak har status, beskrivelse, kommentar eller rapporttekst

Et tiltak tas med dersom minst ett av disse feltene er utfylt:
- status
- type/beskrivelse
- kommentar
- rapporttekst

## Filer som endres

### `src/pages/Brensellagring.tsx`
- Utvide `BranntekniskeTiltakData`
- Utvide tom initialstate
- Lese gamle og nye dokumentdata bakoverkompatibelt
- Legge inn standardtekst-funksjoner
- Legge inn rapporttekstfelt for hvert tiltak
- Legge inn «Original tekst»-knapp for hvert tiltak
- Sikre at automatisk tekst ikke overskriver brukerredigert tekst

### `src/components/brensellagring/BrensellagringPreview.tsx`
- Utvide `BranntekniskeTiltakData`
- Ta med `rapporttekst` i rapportseksjonen
- Justere rendering slik at tiltakstekstene blir lesbare i rapporten

## Ingen databaseendringer
Dette lagres videre i eksisterende dokumentinnhold (`content`) sammen med resten av brensellagringsrapporten. Det krever derfor ingen migrasjon.
