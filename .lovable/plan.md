## Flere avvik per kategori i tilstandsvurdering

I dag har hver §-seksjon én beskrivelse + bilder for "Avvik som krever aktive tiltak" og én for "Avvik som kan fraviksbehandles". Tilstandsgrad settes på hele seksjonen.

Endring: Hver kategori skal være en liste av avvik. Et avvik = `{ tilstandsgrad, beskrivelse, bilder[] }`. Bruker trykker "Legg til avvik" for å opprette nytt, og kan slette/redigere hver enkelt.

### Datamodell (`TilstandsvurderingPanel.tsx`)

Utvid `TilstandKategori`:

```ts
interface TilstandAvvik {
  id: string;            // crypto.randomUUID()
  grad: TilstandGrad;    // egen grad per avvik
  beskrivelse: string;
  bilder: TilstandBilde[];
}

interface TilstandKategori {
  beskrivelse: string;          // beholdes (bakoverkompat / fri tekst)
  bilder: TilstandBilde[];      // beholdes (bakoverkompat)
  avvik?: TilstandAvvik[];      // NYTT
}
```

Seksjonens `data.grad` beholdes (overordnet seksjons-TG), men oppleves nå som "samlet vurdering". Hvert avvik har sin egen TG som vises som farget chip.

### Migrering

`ensureKategorier` utvides: hvis legacy `beskrivelse`/`bilder` finnes uten `avvik`, opprett ett initialt avvik med seksjonens `data.grad` som start-grad. Eksisterende felter beholdes urørt for visning av eldre data.

### UI (`TilstandsvurderingPanel.tsx`)

I `renderKategori`:
- Render liste av avvik-kort (kategori-farget border) med:
  - Header: "Avvik N" + TG-chip + slett-knapp
  - Select for tilstandsgrad (samme `gradLabels` som i dag)
  - Textarea for beskrivelse
  - Bildeopplasting (samme flyt, men koblet til avvik-id i path: `${user.id}/${sectionKey}/${kind}/${avvikId}/...`)
- "Legg til avvik"-knapp under listen som appender nytt tomt avvik
- Tom-tilstand viser kort hjelpetekst

Den eksisterende seksjons-TG øverst beholdes som "Samlet tilstandsgrad for seksjonen".

### Forhåndsvisning (`KonseptPreview.tsx`)

`KategoriBlokk` itererer over `kategori.avvik` (etter samme migrering som panelet). Hvert avvik rendres som egen blokk:
- "Avvik N – TG X (label)"
- Beskrivelse
- Bilder med bildetekst

Hvis listen er tom faller den tilbake til legacy `beskrivelse`/`bilder` slik at gamle dokumenter ser likt ut.

### Word-eksport (`word-export-chapter3.ts`)

`getTilstandKategorier` + render-funksjonen utvides til å iterere over `avvik[]` på samme måte: én underblokk per avvik med "Avvik N – Tilstandsgrad: …", beskrivelse og bilder. Legacy felter beholdes som fallback.

### Det som ikke endres

- Seksjonsstrukturen i kap. 3, navnene på de to kategoriene, og resten av rapportflyten.
- Eksisterende lagrede tilstandsvurderinger fortsetter å rendre (via fallback).
- Ingen DB-endringer (alt ligger i `fire_concepts.tilstandsvurderinger` JSON).
