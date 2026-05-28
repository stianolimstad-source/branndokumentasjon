# § 11-1 Overordnet brannstrategi – ny seksjon 2.3

Filer: `src/pages/Konsept.tsx`, `src/components/konsept/KonseptPreview.tsx`.

Gjelder både brannkonsept (kap 2) og tilstandsvurdering (kap 1 har egen «1.5 Tilleggskrav»-sti — beholdes uendret). Endringen treffer kun grenene som i dag har «2.3 Tilleggskrav» som siste underseksjon i kap 2.

## 1. Datamodell (`src/pages/Konsept.tsx`)

I `formData` legges fire nye Textarea-felter:

- `overordnetMaterialer: string`
- `overordnetBrannspredning: string`
- `overordnetRoemning: string`
- `overordnetRednings: string`

Default-tekstene lagres som konstanter (én pr. felt) i toppen av filen, slik at både `formData`-init, «Hent default-tekst»-knappen og prefill ved opprettelse kan bruke samme kilde:

```ts
const DEFAULT_OVERORDNET = {
  materialer: "Materialer og produkter velges iht. § 11-9 ...",
  brannspredning: "Byggverket er delt inn i branncelle og brannseksjoner ...",
  roemning: "Rømningsveier, ledesystem og deteksjon ...",
  rednings: "Byggverket er tilrettelagt for utvendig og innvendig innsats ...",
};
```

Ved opprettelse av nytt konsept initialiseres feltene med default-tekstene. Eksisterende konsepter laster det som er lagret; tomme felter vises som tomme (brukeren henter default via knapp).

## 2. UI – ny `SectionCollapsible` i kap 2

Plasseres mellom dagens 2.2 Grunnlagsdokumenter og dagens 2.3 Tilleggskrav (som omdøpes til **2.4 Tilleggskrav**).

- Tittel: «2.3 § 11-1 Overordnet brannstrategi».
- Innledende `text-xs text-muted-foreground`-hjelpetekst som spesifisert.
- Fire blokker, hver med:
  - `Label` (a/b/c/d som spesifisert)
  - `text-xs text-muted-foreground` hjelpetekst
  - `Textarea` med `rows={4}` og `min-h-[100px]`, bundet til tilsvarende `formData`-felt
  - Liten `Button variant="ghost" size="sm"` «Hent default-tekst» som setter feltet til default-konstant

Label-en på «2.3 Tilleggskrav»-seksjonen oppdateres til «2.4 Tilleggskrav».

## 3. Word-eksport (`src/pages/Konsept.tsx`)

I brannkonsept-grenen (rundt linje 2280–2433):

- Etter 2.2 Grunnlagsdokumenter og før 2.3 Tilleggskrav: legg inn ny blokk «2.3 § 11-1 Overordnet brannstrategi» med:
  - Tittel-paragraf (bold, size 24) lik øvrige underseksjoner i kap 2
  - Fire underseksjoner med subtittel (bold, size 22) «a. Materialer og produkter», «b. Bygnings- og installasjonsdeler – begrensning av brannspredning», «c. Rask og sikker rømning», «d. Rednings- og slokkeinnsats», hver fulgt av innholdsparagraf med tilhørende verdi (eller default hvis tom).
- «2.3 Tilleggskrav fra tiltakshaver, myndigheter eller bruker» omdøpes til «2.4 Tilleggskrav fra tiltakshaver, myndigheter eller bruker».
- Innholdsfortegnelse (linje ~2005–2007): legg til «    2.3 § 11-1 Overordnet brannstrategi» og endre «2.3 Tilleggskrav…» til «2.4 Tilleggskrav…».

Tilstandsvurdering-grenen (kap 1) endres ikke.

## 4. Live-preview (`src/components/konsept/KonseptPreview.tsx`)

To steder må oppdateres (brannkonsept-greinene rundt linje 1097–1122 og 882–907 som relevant):

- Innholdsfortegnelse (linje 540–541 og 582–583): legg til «2.3 § 11-1 Overordnet brannstrategi» og forskyv «Tilleggskrav» til 2.4.
- Render-seksjonen: etter «2.2 Grunnlagsdokumenter» legges inn ny `<h3>2.3 § 11-1 Overordnet brannstrategi</h3>` med fire `<h4>`-underseksjoner og tilhørende tekst (`whitespace-pre-wrap`, fallback til default-tekst hvis tom). Endre eksisterende «2.3 Tilleggskrav» til «2.4 Tilleggskrav».

Default-tekstene importeres/dupliseres som konstant i preview-filen (samme strenger som i Konsept.tsx) slik at fallback er konsistent.

## 5. Persistens

De fire feltene følger automatisk eksisterende lagringsmekanisme (hele `formData` lagres som JSONB i `fire_concepts.data`). Ingen migrasjon nødvendig.

## Filer som endres

- `src/pages/Konsept.tsx`
- `src/components/konsept/KonseptPreview.tsx`
