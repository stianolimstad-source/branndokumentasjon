
# Fikse import fra tilstandsrapport (PDF) i brannkonsept/tilstandsvurdering

## Hva som faktisk skjer i dag

Opplastingsdialogen kjører, kaller `parse-fire-concept`, og mapper resultatet inn — den delen virker. Problemet ligger i **PDF-tekstuttrekket på klienten** i `UploadConceptDialog.readFileAsText`:

- Den leser PDF-en som en byte-buffer og kjører regex etter `stream...endstream` og `(...)Tj` i råteksten.
- Moderne PDF-er (også de fleste tilstandsrapporter) bruker `FlateDecode`-komprimerte content streams. Da gir regex-en kun binær støy, og fallback-en sender bare ulesbar tekst til AI-en.
- AI-en returnerer da tom JSON, `setIfEmpty` setter ingenting, og brukeren ser at "ingenting ble importert".

ROS-flyten føles bedre fordi ROS-analyser ofte lastes opp som Excel (`.xlsx`), som leses ordentlig av `exceljs`. PDF-uttrekket der har nøyaktig samme svakhet.

## Mål

1. Få ordentlig tekst ut av PDF-en for tilstandsrapport + brannkonsept.
2. Beholde dagens "overskriver aldri utfylte felter"-oppførsel.
3. Gi tydelig tilbakemelding når AI ikke finner noe, i stedet for stille "ferdig".

## Tilnærming

### Del 1 — Bytte til ordentlig PDF-parsing klient-side

Filer: `src/components/konsept/UploadConceptDialog.tsx` (og samme oppgradering for `src/components/ros/UploadRosDialog.tsx` slik at PDF-ROS også blir bedre).

- Installere `pdfjs-dist` og bruke den til å hente ut tekst side for side (`getDocument` → `page.getTextContent()` → join `item.str`).
- Sette `GlobalWorkerOptions.workerSrc` til en URL som Vite kan løse (importere worker fra `pdfjs-dist/build/pdf.worker.min.mjs?url`).
- Beholde dagens regex-heuristikk som **fallback** hvis pdfjs feiler (skannede PDF-er uten tekstlag vil fortsatt gi lite — det aksepterer vi i denne omgang).
- Begrense til 100k tegn før vi sender (gir AI nok kontekst uten å sprenge token-budsjettet).

### Del 2 — Bedre prompt-bruk av tilgjengelig tekst

Fil: `supabase/functions/parse-fire-concept/index.ts`

- Øke `documentText.substring(...)` fra 50 000 til 100 000 tegn (lengre tilstandsrapporter blir kuttet i dag).
- I prompten: legge til eksplisitt instruksjon om at tilstandsrapporter ofte har en "Bygningsopplysninger"-/"Generelt om bygget"-seksjon (byggeår, antall etasjer, BRA, gnr/bnr, bygningstype) og en "Brannteknisk tilstand"-/"Avvik"-seksjon — be modellen lete der.
- Bytte modell-default til `google/gemini-2.5-pro` (allerede satt) men vurdere `google/gemini-3-flash-preview` som raskere/billigere alternativ — beholder 2.5-pro for nå siden den håndterer stor kontekst godt.

### Del 3 — Tydeligere UX når AI ikke finner noe

Fil: `src/components/konsept/UploadConceptDialog.tsx`

- I `handleFileSelect`: hvis `metaCount + kap3Count === 0`, vise advarsel-toast ("Vi fant ikke noe brukbar informasjon i dokumentet. Prøv en annen fil eller fyll inn manuelt.") i stedet for grønn suksess.
- Logge det rå antallet tegn vi sendte til AI til konsollen, slik at det er lett å feilsøke neste gang.

### Del 4 — Verifisering

- Manuelt: laste opp Flatenfoss-tilstandsrapporten igjen og sjekke at minst byggeår, adresse, gnr/bnr, areal og bygningstype kommer inn.
- Sjekke konsoll-loggen for antall tegn ekstrahert (skal være tusenvis, ikke ~0).
- Verifisere at allerede utfylte felter (f.eks. valgt regelverk) ikke blir overskrevet.
- Kontrollere at brannkonsept-flyten fortsatt fungerer som før.

## Filer som endres

- `src/components/konsept/UploadConceptDialog.tsx` — pdfjs-basert tekstuttrekk + tydelig "fant ingenting"-toast.
- `src/components/ros/UploadRosDialog.tsx` — samme pdfjs-oppgradering for konsistens.
- `supabase/functions/parse-fire-concept/index.ts` — utvidet kontekstlengde og tilstandsrapport-spesifikk hint i prompt.
- `package.json` — legge til `pdfjs-dist` (kun ny dep).

## Avgrensninger

- Skannede PDF-er uten tekstlag vil fortsatt gi lite. OCR krever en egen flyt og er ikke med i denne runden — kan vurderes som oppfølger hvis behovet melder seg.
- Vi rører ikke datamodellen eller kapittel 3-whitelisten — bare selve uttrekks- og feedback-laget.
