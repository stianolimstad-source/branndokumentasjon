## Mål

I kap. 3.5 «Brannceller over flere plan» (BF85): når «Brannceller over flere plan er relevant» er huket av, skal brukeren velge **under** eller **over 800 m²** for samlet areal av branncellen(e) over flere plan. Ved valg «over 800 m²» skal det automatisk komme et krav om **automatisk slokkeanlegg** i kap. 3.9 – uavhengig av om bygningstypen er industri.

## Endringer

### 1. Datamodell (`src/pages/Konsept.tsx`, init av `formData`)

Nytt felt:
- `branncellerFlerePlanAreal: "" | "under800" | "over800"` (default `""`)

Initialiseres samme sted som `branncellerFlerePlanRelevant` / `branncellerFlerePlanOver3`.

### 2. UI i kap. 3.5 (`src/pages/Konsept.tsx`, ca. linje 6686–6720)

Inne i `{formData.branncellerFlerePlanRelevant && (...)}`-blokken, like ved `branncellerFlerePlanOver3`, legges en ny under-blokk (vises kun for BF85, dvs. tilstandsvurdering, siden TEK17-flyten ikke har dette behovet i dag):

- Tittel: «Samlet areal av branncellen over flere plan»
- To radio-knapper (Radio Group): `under800` («Under 800 m²») og `over800` («Over 800 m²»)
- Når `over800` velges:
  - Info-boks (amber): «ℹ︎ BF85 krever automatisk slokkeanlegg når branncelle over flere plan har samlet areal > 800 m². Kravet legges automatisk inn i kap. 3.9.»

Når brukeren tar bort hake på `branncellerFlerePlanRelevant` skal `branncellerFlerePlanAreal` nullstilles (samme mønster som dagens reset av `branncellerFlerePlanKrav` / `branncellerFlerePlanOver3`).

### 3. Kobling til kap. 3.9 (`src/pages/Konsept.tsx`, ca. linje 8050–8081)

Industri-blokken refaktoreres lett slik at trigger for «automatisk slokkeanlegg»-kravet utvides:

Trigger vises (BF85) hvis **enten**:
- bygningstype inneholder «industri» (dagens regel), **eller**
- `branncellerFlerePlanRelevant && branncellerFlerePlanAreal === "over800"` (ny regel).

Når den nye triggeren slår inn:
- Forhåndsavhukes ikke tvunget, men `bf85_39_industri_slokkeanlegg` settes automatisk til `true` første gang `over800` velges (samme mønster som andre auto-suggest), og en info-boks viser hvorfor: «Kravet er foreslått fordi branncelle over flere plan > 800 m² er valgt i kap. 3.5.» Brukeren kan fortsatt skru av.
- Etiketten justeres til generisk tekst: «Automatisk slokkeanlegg: Branncelle over flere plan med samlet areal > 800 m² skal ha automatisk slokkeanlegg.» (industri-spesifikk hjelpetekst beholdes når industri-trigger gjelder).

Ingen nye flagg utover gjenbruk av `bf85_39_industri_slokkeanlegg` – dette holder preview/Word-eksport (allerede implementert) uendret.

### 4. Preview (`src/components/konsept/KonseptPreview.tsx`)

- Kap. 3.5-tabellraden for «Brannceller over flere plan» får en ekstra linje når `branncellerFlerePlanAreal` er satt: «Samlet areal: under 800 m²» / «Samlet areal: over 800 m² – krever automatisk slokkeanlegg».
- Kap. 3.9-raden for «Automatisk slokkeanlegg – industri» (linje 4133) får etikett endret til «Automatisk slokkeanlegg» og beskrivelsen blir kontekstavhengig (industri vs. branncelle > 800 m²).

### 5. Word-eksport (`src/lib/word-export-chapter3.ts`)

- I 3.5 BF85-grenen (linje ~917–929): Legg til en ekstra linje i «Brannceller over flere plan»-raden når `branncellerFlerePlanAreal` er satt, med samme tekst som preview.
- I 3.9 BF85-grenen (linje ~1331): Etikett/tekst justeres på samme måte som preview – ingen ny rad, samme `bf85_39_industri_slokkeanlegg`-flagg.

## Akseptansekriterier

- BF85 + `branncellerFlerePlanRelevant`: Ny under/over 800 m²-radio vises i kap. 3.5.
- Velges «over 800 m²»: Info-boks i 3.5, og kravet «Automatisk slokkeanlegg» dukker opp i kap. 3.9 uavhengig av bygningstype, med begrunnelse.
- Velges «under 800 m²» (eller ingen): Ingen automatisk effekt på 3.9 fra denne triggeren (industri-triggeren virker fortsatt selvstendig).
- TEK17-prosjekter: Uendret oppførsel.
- Preview og Word-rapport speiler endringene.

## Spørsmål

1. Skal valget «over 800 m²» **forhåndsavhuke** `bf85_39_industri_slokkeanlegg` automatisk (som planen foreslår), eller bare vise et varsel og la brukeren huke av selv?
2. Skal under/over-valget også vises for **TEK17**-prosjekter (i dag har ikke TEK17 noe BF85-spesifikt 3.9-krav å koble på)? Planen forutsetter «kun BF85».
