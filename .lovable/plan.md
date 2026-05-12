## Forenkle tilstandsvurdering: automatisk TG 0 når ingen avvik

### Mål
Fjern feltet "Samlet tilstandsgrad for seksjonen". Hvis brukeren ikke legger til noen avvik, settes seksjonen automatisk til TG 0 og det vises informasjonstekst "Det er ikke funnet noen avvik på dette området." både i innputsiden og i rapporten (preview + Word). Når avvik finnes, vises hver enkelt med sin egen TG, og det vises ingen samlet TG for seksjonen.

### Endringer

**1. `src/components/konsept/TilstandsvurderingPanel.tsx` (innputside)**
- Fjern hele blokken med `<Label>Samlet tilstandsgrad for seksjonen</Label>` + `<Select>` for `data.grad`.
- Behold den grønne hjelpeteksten "Det er ikke funnet noen avvik på dette området.", men vis den når både `tiltak.avvik` og `fravik.avvik` er tomme (i stedet for `data.grad === "tg0"`).
- Sett `data.grad = "tg0"` automatisk via `onChange` når begge avvik-listene er tomme (og fjern den når avvik finnes), slik at lagret data fortsatt har en grad å lese ved rapportgenerering.
- Ingen endringer i datastruktur, kategorier, bildeopplasting, fravik-flyt eller eksport-funksjonssignatur.

**2. `src/components/konsept/KonseptPreview.tsx` (rapport-forhåndsvisning)**
- I `TilstandTableRow`:
  - Hvis `tiltak.avvik` og `fravik.avvik` begge er tomme: vis kun header-båndet "Tilstandsvurdering – {sectionLabel}" med `GradBadge` for TG 0, og en grønn informasjonsboks i `Innhold`-området med teksten "Det er ikke funnet noen avvik på dette området."
  - Hvis det finnes avvik: skjul `GradBadge` i header-båndet (samlet grad vises ikke lenger) og behold `KategoriBlokk`-rendring som i dag (hvert avvik beholder sin egen `GradBadge`).
- Juster `tilstandHasContent` slik at en seksjon med tom data fortsatt regnes som "har innhold" hvis seksjonen er aktivert/relevant – eller la nåværende oppførsel stå hvis tom data ikke skal vises (avklares: nåværende oppførsel returnerer `null` når både grad og avvik mangler; siden vi nå auto-setter `grad="tg0"` ved tom innput, vil den uansett vises når brukeren har åpnet panelet).

**3. `src/lib/word-export-chapter3.ts` (Word-rapport)**
- I `tilstandRow`:
  - Behold tidlig retur når `tilstandData` mangler helt (ikke åpnet panel).
  - Hvis `harTiltak === false && harFravik === false`: skriv kun header-bånd "TILSTANDSVURDERING – {sectionLabel}   [TG 0 – Ingen avvik]" + ett grønt avsnitt med teksten "Det er ikke funnet noen avvik på dette området." (grønn shading f.eks. `D1FAE5`, tekstfarge `065F46`).
  - Hvis det finnes avvik: fjern `[${gradLabel}]` fra header-båndet (ingen samlet TG i rapport heller), og rendre kategorier som før.

### Det som ikke endres
- `TilstandData`-interfacet (feltet `grad` beholdes for bakoverkompatibilitet og settes nå automatisk).
- Avvik-strukturen, kategorier (tiltak/fravik), bildeopplasting, fraviksflyt, lagring i Supabase eller andre kapitler/eksporter.
