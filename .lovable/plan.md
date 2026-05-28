## Mål
Legge inn strukturert dokumentasjon av befaringsgrunnlaget (NS 3424) som ny seksjon **1.2 Befarings- og analysegrunnlag** i tilstandsvurderinger, og forskyve eksisterende **1.2 Avgrensning av vurderingen** til **1.3**.

## Endringer

### 1) `src/pages/Konsept.tsx` – formData defaults
I `formData`-initialiseringen (sammen med `avgrensning`, `tilstandsvurderinger` osv.) legges nye felter til:
- `ns3424Nivaa: "1"`
- `befaringsdato: new Date().toISOString().slice(0,10)`
- `befaringsdeltakere: ""`
- `befaringsmetode: ""`
- `gjennomgaattDokumentasjon: ""`
- `begrensninger: [] as string[]`
- `andreBegrensninger: ""`

### 2) `src/pages/Konsept.tsx` – ny UI-seksjon (kun for tilstandsvurdering)
Rundt linje ~3195 (der «1.2 Avgrensning av vurderingen»-feltet for tilstandsvurdering ligger):

- Sett inn ny seksjon **før** Avgrensning, med tittel **«1.2 Befarings- og analysegrunnlag»**. Inneholder:
  - **Select «NS 3424 nivå»** med tre alternativer (Nivå 1/2/3 + beskrivelser). Default «1».
  - **Date-input «Befaringsdato»**. Default i dag.
  - **Textarea «Befaringsdeltakere»** (rows=2) med oppgitt placeholder.
  - **Textarea «Befaringsmetode og omfang»** (rows=3) med oppgitt placeholder. Vis ekstra hjelpetekst om destruktive undersøkelser / laboratorieanalyser når `ns3424Nivaa` er «2» eller «3».
  - **Textarea «Dokumentasjon gjennomgått»** (rows=3).
  - **Checkbox-liste «Begrensninger i vurderingen»** med de fem oppgitte alternativene (toggler verdier i `begrensninger`-arrayet) + fritekstfelt «Andre begrensninger».

- Endre overskriften på neste blokk fra **«1.2 Avgrensning av vurderingen»** til **«1.3 Avgrensning av vurderingen»**. Etterfølgende kap. 1-overskrifter (Prosjekteringsmetode, Regelverk osv. for tilstandsvurdering) renummeres tilsvarende dersom de eksisterer i samme gren.

- Liten **info-boks** øverst i tilstandsvurderingens innholdsoversikt (innholds-/oversiktspanelet for §-vurderingene) med teksten: «Befaringsgrunnlag og begrensninger dokumentert i kap 1.2».

### 3) `src/pages/Konsept.tsx` – Word-eksport
- **Linje ~1966**: Bytt hardkodet «NS 3424 nivå 1»-setning med dynamisk tekst basert på `formData.ns3424Nivaa`, inkl. beskrivende tekst for valgt nivå.
- **Linje ~2054** (innholdsfortegnelse, tilstandsvurdering-grenen): Legg til `«    1.2 Befarings- og analysegrunnlag»` og forskyv eksisterende «1.2 Avgrensning…» til «1.3 …».
- **Linje ~2250** (kap. 1-tekst for tilstandsvurdering): Før «1.2 Avgrensning…», legg til ny seksjon:
  - Overskrift «1.2 Befarings- og analysegrunnlag».
  - Tabell med rader: Befaringsdato, Befaringsdeltakere, NS 3424-nivå, Befaringsmetode, Dokumentasjon gjennomgått.
  - Hvis `begrensninger.length > 0 || andreBegrensninger`: undertittel «Begrensninger i vurderingen» + punktliste (kombinasjon av valgte checkboxer og fritekst).
- Endre overskriften under til «1.3 Avgrensning av vurderingen».

### 4) `src/components/konsept/KonseptPreview.tsx` – live-preview
- **Linje ~530**: Bytt hardkodet «NS 3424 nivå 1»-setning med dynamisk tekst fra `formData.ns3424Nivaa`.
- **Linje ~602** (innholdsfortegnelse): Sett inn «1.2 Befarings- og analysegrunnlag» og endre eksisterende «1.2 Avgrensning…» til «1.3 …».
- **Linje ~838** (kap. 1-render for tilstandsvurdering): Render ny seksjon «1.2 Befarings- og analysegrunnlag» (tabell + ev. begrensninger-liste) før «Avgrensning», og endre Avgrensning-overskrift til «1.3».

## Utenfor scope
- `TilstandsvurderingPanel` og §-vurderingene endres ikke.
- Brannkonsept-grenen endres ikke.
- Ingen DB-schemaendringer; nye felter lagres som del av eksisterende `formData`-JSON.
