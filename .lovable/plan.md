## Endring – Tilstandsvurdering: skille mellom tiltak og fravik + samlet oppsummering

### Bakgrunn

I dag har hvert kapittel (3.1–3.14) i tilstandsvurderingen ett `TilstandsvurderingPanel` med én tekstboks, én tilstandsgrad og bilder. Brukeren ønsker å skille avvikene i to kategorier per kapittel:

1. **Avvik som krever aktive tiltak** – må settes tilbake til riktig stand.
2. **Avvik som kan fraviksbehandles** – aksepteres med fravik.

Hver kategori skal ha egen tekstboks (og bilder), og alle avvik skal samles i en oppsummering bakerst i dokumentet, gruppert etter de to kategoriene.

### 1. Datamodell – `TilstandsvurderingPanel.tsx`

Utvid `TilstandData` (bakoverkompatibelt):

```ts
interface TilstandData {
  grad: TilstandGrad;
  beskrivelse: string;          // beholdes for bakoverkompat (legacy)
  bilder: TilstandBilde[];      // beholdes for bakoverkompat (legacy)
  tiltak?: {                    // NY: avvik som krever aktive tiltak
    beskrivelse: string;
    bilder: TilstandBilde[];
  };
  fravik?: {                    // NY: avvik som kan fraviksbehandles
    beskrivelse: string;
    bilder: TilstandBilde[];
  };
}
```

`emptyTilstand()` initialiserer `tiltak` og `fravik` med tomme felter. Ved første render: hvis kun gammel `beskrivelse`/`bilder` finnes (legacy data), vis dem som «Avvik som krever tiltak» – konverter ved første endring.

I selve panelet erstattes dagens enkle tekstboks + bildeliste med to klart adskilte underseksjoner med overskrifter:
- "Avvik som krever aktive tiltak" (rød/destructive aksent)
- "Avvik som kan fraviksbehandles" (gul/amber aksent som i dag)

Hver underseksjon har egen `Textarea` og egen bildeopplaster (gjenbruk eksisterende `handleImageUpload`-mønster, men med `tiltak`/`fravik`-suffix i storage-pathen). Tilstandsgrad-velgeren beholdes på toppnivå.

### 2. Preview-rendering – `KonseptPreview.tsx`

Oppdater `TilstandTableRow` (linje 67) til å vise begge kategorier i samme rad: to underblokker under tilstandsgraden, med tydelige overskrifter «Tiltak» og «Fravik», kun de som har innhold rendres. Faller tilbake til legacy `beskrivelse`/`bilder` dersom de nye feltene mangler.

Ingen endringer trengs i de 14 kallstedene (3_1–3_14) – komponenten håndterer det internt.

### 3. Ny oppsummering bakerst – `KonseptPreview.tsx`

Legg til en ny seksjon "Oppsummering av avvik" rett før (eller etter) eksisterende `Sammendrag`/revisjonshistorikk (kun når `documentType === "tilstandsvurdering"`):

- **Del 1 – "Avvik som krever aktive tiltak"**: tabell/liste som itererer gjennom alle `tilstandsvurderinger`-nøkler i rekkefølge, og for hver der `tiltak.beskrivelse` finnes vises: kapittelnummer + label, tilstandsgrad, beskrivelse.
- **Del 2 – "Avvik som kan fraviksbehandles"**: tilsvarende, men for `fravik.beskrivelse`.

Bruker eksisterende `tilstandSectionsTEK17`-rekkefølgen (eksporteres fra `Konsept.tsx` eller dupliseres som konstant). Egen sidebryter (page-break) og `PageFooter` slik andre kapitler gjør.

### 4. Word-eksport – `word-export-chapter3.ts`

Oppdater `tilstandRow()` (linje 173) til å rendre `tiltak` og `fravik` som to underseksjoner i samme tabellcelle, med fete overskrifter og bilder under hver. Faller tilbake til legacy `beskrivelse`/`bilder` ellers.

I hovedeksport-filen (sannsynligvis `Konsept.tsx` `exportToWord` eller en egen kapittel-eksport): legg til en ny seksjon "Oppsummering av avvik" på slutten, med samme to-delte struktur som preview. Itererer over `tilstandsvurderinger` i kapittelrekkefølge.

### 5. Det som ikke endres

- Tilstandsgrad-systemet (NS 3424).
- Bildelagring (samme bucket/struktur).
- Eksisterende lagrede tilstandsvurderinger – legacy felter leses fortsatt og vises som "tiltak" som standard inntil bruker redigerer.
- TEK17/BF85-logikk eller andre kapitler.

### Tekniske detaljer

- Migrering av eksisterende data skjer "lazy" i UI – ingen DB-migrasjon nødvendig fordi `tilstandsvurderinger` lagres som JSON i `fire_concepts`-raden.
- Felles seksjons-konstant (`tilstandSectionsTEK17`) bør eksporteres fra `Konsept.tsx` slik at både `KonseptPreview.tsx` og word-eksporten kan iterere likt.
