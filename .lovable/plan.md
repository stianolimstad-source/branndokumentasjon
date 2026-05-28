# Mål
Erstatte ustrukturert fritekst-tiltak per hendelse med en strukturert tiltaksplan som har ansvarlig, frist, status, effekt/kostnad og kobling til hendelser. Tiltaksplanen blir nytt kapittel **6** (mellom Beregninger og Bow-tie). Etterfølgende kapitler renumereres.

## 1. Datamodell — `src/components/ros/RosPreview.tsx`

Nye eksporter:
```ts
export type RosTiltakStatus = "foreslatt" | "besluttet" | "under_arbeid" | "gjennomfort" | "forkastet";
export type RosTiltakKategori = "sannsynlighetsreduserende" | "konsekvensreduserende";
export type Vurdering = "lav" | "medium" | "hoy";

export interface RosTiltak {
  id: string;
  tittel: string;
  beskrivelse: string;
  kategori: RosTiltakKategori;
  ansvarlig: string;
  frist: string;            // ISO-dato
  status: RosTiltakStatus;
  kostnadVurdering?: Vurdering;
  effektVurdering?: Vurdering;
  hendelseIds: string[];
  kommentar?: string;
}
```
Utvid `RosContent` med `tiltaksplan?: RosTiltak[]`.

Hjelpere (samme fil eller `src/lib/ros-tiltak.ts`):
- `TILTAK_STATUS_LABEL`, `TILTAK_STATUS_BADGE_VARIANT`, `TILTAK_KATEGORI_LABEL`, `VURDERING_LABEL`.
- `byggTiltakIder(tiltaksplan)` → `Map<id, "T1" | "T2" | ...>`.
- `sorterTiltakEtterPrioritet(tiltak)` (besluttet/under_arbeid + høy effekt øverst, deretter frist).
- `erFristPassert(tiltak)` (frist < i dag og status ∉ {gjennomført, forkastet}).

## 2. Ny editor-seksjon — `src/pages/RosAnalyse.tsx`

Plasseres mellom «5. Beregninger» (linje ~1970) og «X. Bow-tie analyse» (linje ~2103). Tittel: **«6. Tiltaksplan»**, `JumpToPreview previewId="kap-6-tiltak"`.

Innhold:
- Innledende paragraf: «Strukturert oversikt over tiltak som skal gjennomføres for å redusere risiko. Hvert tiltak har ansvarlig person, frist for gjennomføring og status.»
- **Filter-knapprad** (`useState<"alle" | RosTiltakStatus>`): Alle, Foreslått, Besluttet, Under arbeid, Gjennomført, Forkastet (variant skifter default/outline).
- **Sortering-dropdown** (`Select`): Frist (default), Status, Effekt, Kostnad.
- **Tabell** (`<Table>`) med kolonner: ID (T{n}), Tittel, Kategori, Ansvarlig, Frist, Status, Effekt, Kostnad, Hendelser, Slett. Rader er klikkbare — ekspanderer (egen `expandedTiltak` state) til en detaljrad under med:
  - `<Textarea>` for full beskrivelse,
  - `<Textarea>` for kommentar,
  - `<Popover>` + `Checkbox`-liste over `content.hendelser` for multi-select av `hendelseIds`,
  - `<Select>` for kategori.
- **Status-celle**: `<Badge>` med fargekoding (grå/blå/gul/grønn/lyserød) via variant + className-overstyring fra design-tokens.
- **Frist-celle**: lokal dato; rød tekst hvis `erFristPassert(t)`.
- **Effekt/Kostnad-celler**: kompakt `<Select>` Lav/Medium/Høy. Effekt = grønn ramme/badge ved Høy, Kostnad = rød ramme/badge ved Høy.
- **«Legg til nytt tiltak»-knapp** under tabellen åpner en `<Dialog>` med skjema (tittel, beskrivelse, kategori, ansvarlig, frist via `<Input type="date">`, status, effekt, kostnad, hendelser, kommentar). Lagre legger til i `content.tiltaksplan`.
- Helper `updateTiltak(id, patch)`, `deleteTiltak(id)` (med `AlertDialog`-bekreftelse iht. memory), `addTiltak(partial)`.

## 3. Kobling fra hendelse → tiltak (`RosAnalyse.tsx`)

I hver hendelse-accordion (linje ~1729 hvor `foreslatteTiltak` rendres), etter Textarea:
- Liste «Tilknyttede tiltak i tiltaksplanen»: filtrer `content.tiltaksplan` på `hendelseIds.includes(h.id)`. Vis kompakt rad: `T{n} – {tittel} ({status-badge}, frist {dato})`.
- Lenke «Gå til tiltaksplanen» som scroller til `#kap-6-tiltak-editor` (anchor på section).
- Hvis `h.foreslatteTiltak` er fylt og hendelsen ikke har noen tilknyttede tiltak: vis knapp **«Konverter til strukturert tiltak»**. Klikk oppretter `RosTiltak` med:
  - `tittel`: første linje av `foreslatteTiltak` trunkert til ~80 tegn,
  - `beskrivelse`: hele teksten,
  - `kategori`: `"sannsynlighetsreduserende"`,
  - `status`: `"foreslatt"`, tom `ansvarlig`, frist = i dag + 90 dager (ISO),
  - `hendelseIds: [h.id]`.
  Toast: «Tiltak opprettet i tiltaksplanen».

## 4. Renumerering

`RosAnalyse.tsx`:
- «6. Bow-tie analyse» → **«7. Bow-tie analyse»** (`previewId="kap-7"`, linje 2103).
- Oppsummering: dynamisk uttrykk linje 2520 oppdateres til `bowTies?.length > 0 ? "8" : "7"`, `previewId="kap-8"`.
- Revisjonshistorikk: tilsvarende +1.
- Eventuelle referansetekster («se kapittel 6/7») oppdateres.

`RosPreview.tsx`:
- Nytt kapittel **«6. Tiltaksplan»** (`<section id="kap-6-tiltak">`) etter `kap-5` (linje 1219-) og før `kap-6` (linje 1296):
  - Innledning + tabell med kolonner: ID, Tittel, Kategori, Ansvarlig, Frist, Status, Effekt, Kostnad, Hendelser, Kommentar.
  - Sortert via `sorterTiltakEtterPrioritet`.
  - Passerte frister rendres med `color: hsl(var(--destructive))`.
  - Statusbadger via inline-style mapping.
- Renumerer: Bow-tie 6→7 (`id="kap-7"`, h2 og referanser linje 1296-1299), Oppsummering 7/8 (linje 1404-1405), Revisjon tilsvarende. Oppdater intern tekst «kap. 4», «kapittel 5» etc. der nødvendig.
- I «4. Hendelsesregister» (rad-rendering rundt linje 1092): under `foreslatteTiltak`-kolonnen vis kompakt liste over tilknyttede tiltak (`T{n} – tittel [status]`).

## 5. Word-eksport — `src/lib/ros-word-export.ts`

- Nytt kapittel **«6. Tiltaksplan»** plassert etter Beregningsgrunnlag-blokken (rundt linje 750+, før `bowTieBlocks`):
  - `buildSectionHeading(theme, "6. Tiltaksplan")` + innledning + `docx` Table med samme kolonner som preview, sortert etter prioritet.
  - Passerte frister: rød fyll/skrift via cell shading (`ShadingType.CLEAR` med `fill: "FCE4E4"`).
  - Status-tekst norsk: «Foreslått»/«Besluttet»/«Under arbeid»/«Gjennomført»/«Forkastet».
- I Hendelsesregister-tabellen (linje ~656): etter `foreslatteTiltak`-cellen, legg til en mini sub-tabell per hendelse som lister tilknyttede tiltak (`ID | Tittel | Status`). Implementeres som nested `Table` inne i cellen, eller som ekstra rad under hver hendelse.
- Renumerer: `bowTieNr` += 1, `beregningNr` uendret (5), `oppsummeringNr` += 1, referansetekster (linje 689, 801) oppdateres.

## 6. Filer
- **Endret:** `src/components/ros/RosPreview.tsx` (interface + nytt kapittel + renumerering + tilknyttede-tiltak i hendelsestabell)
- **Endret:** `src/pages/RosAnalyse.tsx` (ny seksjon + dialog + kobling fra hendelse + renumerering)
- **Endret:** `src/lib/ros-word-export.ts` (nytt kapittel + sub-tabell per hendelse + renumerering)
- **(Valgfritt ny):** `src/lib/ros-tiltak.ts` for konstanter/hjelpere — alternativt holdes alt i `RosPreview.tsx` for konsistens med BFK-mønsteret.

Ingen DB-endringer (lagres i samme JSON som resten av `RosContent`).
