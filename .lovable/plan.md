## Mål
Gjøre det mulig å laste opp en eksisterende ROS-analyse (Excel, PDF eller Word) og automatisk hente ut alle hendelser inn i den åpne ROS-analysen.

## Brukerflyt
1. På inputsiden i ROS-analyse legges en knapp **"Last opp eksisterende ROS"** (ved siden av "Legg til hendelse").
2. Bruker velger fil (.xlsx, .xls, .pdf, .docx, .txt — maks 10 MB).
3. Filen leses i nettleseren til ren tekst (Excel via SheetJS, PDF via samme stream-uttrekk som `UploadConceptDialog`, Word/Txt direkte).
4. Tekst sendes til en ny edge-funksjon `parse-ros-analysis` som bruker Lovable AI (`google/gemini-2.5-flash`) og returnerer JSON.
5. Bruker får en bekreftelsesdialog: "Fant N hendelser. Legg til / Erstatt eksisterende?".
6. Valgte hendelser legges inn i `content.hendelser` med nye id-er, og accordions åpnes automatisk for de nye.
7. Toast viser status; eventuelle metadata (prosjektnavn, adresse, oppdragsgiver) tilbys å fylle inn hvis felt er tomme.

## Datauttrekk (per hendelse)
AI-en bes returnere:
```
{
  hendelser: [{
    tittel, beskrivelse, arsak,
    sannsynlighet (1-5), konsekvens (1-5),
    tiltak, restrisiko
  }],
  metadata: { prosjektnavn, adresse, oppdragsgiver }
}
```
- Mapper de typiske kolonnene fra eksempelet: *Sårbarhet/Hendelse → tittel*, *Beskrivelse av sannsynlighet/konsekvens → beskrivelse*, *Forebyggende og avhjelpende tiltak → tiltak*, *Sannsynlighet/Konsekvens (etter tiltak) → restrisiko (kort tekst)*, S/K-tall mappes til 1–5 (klamper utenfor området).
- Hvis S/K mangler men det finnes tekst som "Liten/Moderat/Alvorlig", bruker AI-en en fast oversetting (Liten=2, Moderat=3, Alvorlig=4, Katastrofal=5; Sjelden=2, Sannsynlig=3, osv.).

## Tekniske endringer

**Ny fil:** `supabase/functions/parse-ros-analysis/index.ts`
- Speiler `parse-fire-concept` (CORS, Lovable AI, JSON-response).
- System-prompt forklarer ROS-strukturen og 5×5-skalaen, krever rent JSON.
- Trunkerer input til ~80k tegn.
- `verify_jwt = false` (samme som parse-fire-concept).

**Ny komponent:** `src/components/ros/UploadRosDialog.tsx`
- Basert på `UploadConceptDialog`.
- Støtter også .xlsx/.xls via dynamisk import av `xlsx` (SheetJS) — konverterer alle ark til CSV-tekst før sending.
- Props: `onHendelserExtracted(hendelser, metadata)`.
- Viser idle/lesing/analyserer/ferdig/feil-status, og en oppsummeringsdialog med "Legg til" / "Erstatt" / "Avbryt".

**Endringer i `src/pages/RosAnalyse.tsx`:**
- Importer ny dialog; render knapp i hendelses-toolbar (kun når en analyse er åpen).
- Callback legger til hendelser i `content.hendelser`, oppdaterer `openHendelser`, og fyller tomme metadata-felt.

**Avhengighet:** legg til `xlsx` (SheetJS) via `bun add xlsx`.

## Utenfor scope
- Ingen endring i datamodell, lagring, RLS, RosPreview eller Word-eksport.
- Ingen automatisk sammenligning/dedup av eksisterende hendelser (bare ren append/replace).
- Ingen OCR for skannede PDF-er — kun tekstbasert uttrekk.
