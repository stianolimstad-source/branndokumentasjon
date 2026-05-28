## Mål
Legg inn dokumentasjon på at relevante paragrafer i Forskrift om beredskap i kraftforsyningen (BFK) er vurdert som et nytt kapittel 3 i ROS-analysen, mellom «Metode» (kap. 2) og «Hendelser» (nå kap. 4). Etterfølgende kapitler renumereres.

## 1. Ny fil: `src/lib/ros-beredskapsforskrift.ts`

Eksporterer:
- `BfkVurderingStatus = "vurdert" | "ikke_aktuell" | "ikke_vurdert"`
- `BfkParagraf { id, navn, utdrag, kategori }` med kategori-union `"ros" | "personell" | "drift" | "sikring" | "informasjon"`
- `BFK_PARAGRAFER: BfkParagraf[]` — alle 21 paragrafene fra spesifikasjonen (§ 1-3, § 3-1, § 3-2, § 3-4, § 3-5, § 3-6, § 3-7, § 3-8, § 4-5, § 5-1, § 5-2, § 5-4, § 5-5, § 5-6, § 5-7, § 6-1, § 6-2, § 6-3, § 6-4, § 6-5, § 6-6) med korrekt kategori og utdragstekst.
- Hjelpekonstant `BFK_KATEGORI_LABEL: Record<kategori, string>` for visning (ROS-krav, Personell og kompetanse, Drift og gjenoppretting, Fysisk sikring, Informasjon og samband).
- Hjelpefunksjon `lagDefaultBfkVurderinger(): BfkVurdering[]` som returnerer én oppføring per paragraf med status `"ikke_vurdert"`, tom begrunnelse og tomt `hendelseIds`-array.

## 2. Datamodell: `src/components/ros/RosPreview.tsx`

- Importer `BfkVurderingStatus` fra `@/lib/ros-beredskapsforskrift`.
- Ny eksportert interface:
  ```ts
  export interface BfkVurdering {
    paragrafId: string;
    status: BfkVurderingStatus;
    begrunnelse: string;
    hendelseIds: string[];
  }
  ```
- I `RosContent`, legg til valgfritt felt:
  ```ts
  beredskapsforskrift?: BfkVurdering[];
  ```

## 3. Auto-initialisering i `src/pages/RosAnalyse.tsx`

I last/initialiseringen av `content` (etter eksisterende `migrerBeregninger`-kall): hvis `content.beredskapsforskrift` er `undefined` eller tomt, sett det til `lagDefaultBfkVurderinger()` slik at brukeren ser alle paragrafer fra start. Dette skal også trigge lagring slik at det persisterer.

## 4. Ny UI-seksjon i `RosAnalyse.tsx` (mellom linje 1268 og 1272)

Ny `<section>` med tittel «3. Beredskapsforskriftens krav» (`JumpToPreview previewId="kap-3-bfk"`).

Innhold:
- Innledende paragraf med teksten fra spesifikasjonen.
- Fremdriftsindikator: «{vurdert+ikke_aktuell} av {totalt} paragrafer vurdert ({prosent}% ferdig)» + `<Progress>`-komponent.
- Filter-knapprad (`useState<"alle"|"ikke_vurdert"|"vurdert"|"ikke_aktuell">`): «Alle», «Ikke vurdert», «Vurdert», «Ikke aktuell» (Button variant skifter mellom default/outline basert på aktivt filter).
- Liste gruppert etter kategori (rekkefølge: ros, personell, drift, sikring, informasjon) med `<h3>` undertittel per kategori (bruk `BFK_KATEGORI_LABEL`). Skjul gruppen hvis ingen paragrafer matcher filteret.
- Hver paragraf rendres som `<Card>`:
  - Header: paragrafens `navn` + utdrag i italic, `text-sm text-muted-foreground`.
  - `<Select>` for status (tre options: Ikke vurdert, Vurdert, Ikke aktuell).
  - Hvis status = `"vurdert"`: `<Textarea rows={3}>` for begrunnelse med placeholder fra spesifikasjonen + multi-select dropdown (bruk `Popover` + `Checkbox`-liste fra `content.hendelser`, viser `{id-kort} – {tittel}`) for `hendelseIds`.
  - Hvis status = `"ikke_aktuell"`: `<Textarea rows={3}>` for forklaring.
  - Visuell ramme via `className`:
    - `border-destructive` hvis `ikke_vurdert`
    - `border-yellow-500` hvis `vurdert` med tom `begrunnelse`
    - `border-green-600` hvis `vurdert` med begrunnelse, eller `ikke_aktuell`
- Hjelpere: `updateBfk(paragrafId, patch)` muterer `content.beredskapsforskrift` via `setContent`.

## 5. Renumerering i `RosAnalyse.tsx`

- Linje 1274: «3. Hendelser» → «4. Hendelser» (behold `previewId="kap-3"` for å unngå brutte ankere — eller bytt til `kap-4` konsekvent; foretrekker konsekvent renumerering: oppdater både preview-id og editor-id).
- Linje 1721: «4. Beregninger» → «5. Beregninger».
- Øvrige etterfølgende H2-overskrifter (Bow-tie, Oppsummering, Revisjonshistorikk) renumereres tilsvarende — gå gjennom `<h2>`-er fra linje 1851 og utover.

## 6. Preview-renumerering i `RosPreview.tsx`

- Nytt kapittel: «3. Beredskapsforskriftens krav» rendres mellom kap. 2 Metode (linje 452-) og eksisterende «3. Hendelsesregister».
- Innhold:
  - Innledende avsnitt.
  - Tabell med kolonner: Paragraf | Status | Begrunnelse | Tilknyttede hendelser (id-kort, komma-separert via `byggIder`-mappingen).
  - Grupper rader visuelt etter kategori (rad med kategori-tittel før paragrafene), eller bare sortert etter kategori.
- Renumerer eksisterende kapitler: Hendelsesregister 3→4, Beregningsgrunnlag 4→5, og oppdater all intern referansetekst som «(kap. 3)», «kapittel 4 Beregningsgrunnlag», «kapittel 3» (linje 728, 1079, 1209). Eksisterende dynamisk nummerering (linje 610) utvides så den tar høyde for BFK-kapittelet.
- Behold ankre konsistent (`kap-3-bfk`, `kap-4` for hendelser, `kap-5` for beregninger).

## 7. Word-eksport: `src/lib/ros-word-export.ts`

- Sett inn nytt kapittel etter linje 233 (`2. Metode`): `buildSectionHeading(theme, "3. Beredskapsforskriftens krav")` + innledningsavsnitt + tabell (`docx Table`) med samme 4 kolonner som preview, gruppert/sortert etter kategori. Status-tekst på norsk: «Vurdert» / «Ikke aktuell» / «Ikke vurdert».
- Renumerer: «3. Hendelsesregister» → «4. Hendelsesregister» (linje 732), oppdater `beregningNr`-beregning (linje 610) til å starte fra 5 i stedet for 4, og tilpass referansetekster (linje 329, 689, 801) tilsvarende. Bow-tie/Oppsummering/Revisjon nummereres automatisk via samme dynamiske beregning.

## 8. Filer som endres
- **Ny:** `src/lib/ros-beredskapsforskrift.ts`
- **Endret:** `src/components/ros/RosPreview.tsx` (interface + nytt kapittel + renumerering)
- **Endret:** `src/pages/RosAnalyse.tsx` (auto-init + ny editor-seksjon + renumerering)
- **Endret:** `src/lib/ros-word-export.ts` (nytt kapittel + renumerering)

Ingen DB-endringer (lagres i samme JSON-kolonne som resten av `RosContent`).
