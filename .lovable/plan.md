## Endring: Organisering av arbeidet → liste med navn og stillingstittel

I dag er "Organisering av arbeidet" et fritekstfelt under 2.3 Planlegging av analysen. Endres til en strukturert deltakerliste der hver rad har **Navn** og **Stillingstittel** (med valgfri "rolle i analysen" hvis ønskelig — bekreft).

### 1. Datamodell (`RosPreview.tsx`)
Utvid `metode`:
```ts
metode?: {
  informasjonsinnhenting?: string;
  organisering?: string; // beholdes for bakoverkompatibilitet (gammel fritekst vises hvis deltakere er tom)
  deltakere?: { navn: string; stilling: string }[];
  skjemaOgSjekklister?: string;
}
```

### 2. Input-skjema (`RosAnalyse.tsx`)
Erstatt `Area` for "Organisering av arbeidet" med en liten tabell/liste:
- Kolonner: Navn, Stillingstittel
- Knapper: "+ Legg til deltaker", slett-ikon per rad
- Lagres i `content.metode.deltakere`

### 3. Preview (`RosPreview.tsx`)
Punkt 4 "Organisering av arbeidet" rendrer:
- Liten tabell med Navn | Stillingstittel hvis `deltakere` har innhold
- Fallback til gammel `organisering`-tekst, ellers "Ikke utfylt".

### 4. Word-eksport (`ros-word-export.ts`)
Samme: tabell med Navn / Stillingstittel under punkt 4. Fallback til fritekst.

### Filer som endres
- `src/components/ros/RosPreview.tsx`
- `src/pages/RosAnalyse.tsx`
- `src/lib/ros-word-export.ts`

Ingen DB-migrering (felter ligger i eksisterende `content` JSONB).
