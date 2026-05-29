# Last opp eksisterende dokument i brannkonsept og tilstandsvurdering — inkl. kapittel 3

## Bakgrunn

`UploadConceptDialog` + edge-funksjonen `parse-fire-concept` finnes allerede, men:
- Knappen er gjemt inne i metadata-seksjonen og vises kun før dokumentet er lagret (`!conceptId && !isDemoMode`).
- AI-prompten henter kun ut prosjekt-/bygningsmetadata. Den vet ingenting om tilstandsvurdering (BF85, byggeår, bygningsbrannklasse) og rører ikke kapittel 3.
- ROS har til sammenligning knappen i toppbaren, alltid synlig.

Brukeren vil ha samme flyt i brannkonsept/tilstandsvurdering, og i tillegg forsøke å fylle ut deler av kapittel 3 automatisk.

## Del 1 — Synliggjøre og dele knappen (lik ROS)

Filer: `src/pages/Konsept.tsx`, `src/components/konsept/UploadConceptDialog.tsx`.

- Flytte `<UploadConceptDialog />` opp i den sticky toppbaren i `Konsept.tsx` (samme posisjon som `<UploadRosDialog />` i `RosAnalyse.tsx`, ved siden av slett-knappen).
- Fjerne `!conceptId`-betingelsen — også eksisterende dokumenter skal kunne berikes. Tomme felter fra AI overskriver aldri eksisterende verdier; kun ikke-tomme felter mappes inn (gjeldende oppførsel beholdes).
- Dynamisk tittel/etikett basert på `documentType`: «Last opp eksisterende brannkonsept» vs. «Last opp eksisterende tilstandsvurdering».
- Sende `documentType` med i `invoke("parse-fire-concept", { body: { documentText, documentType } })`.

## Del 2 — Utvide metadata-uttrekk (begge dokumenttyper)

Filer: `supabase/functions/parse-fire-concept/index.ts`, `UploadConceptDialog.tsx`, `Konsept.tsx`.

Legge til i JSON-skjema + prompt:
- `regelverk` ("TEK17" | "TEK10" | "TEK97" | "BF85") — viktig for tilstandsvurdering.
- `bygningsbrannklasse` ("A" | "B" | "C") — BF85.
- `byggeaar` (4-sifret årstall).

Prompten skreddersys på `documentType`: ved `tilstandsvurdering` skal AI lete etter eldre regelverk, byggeår, branncellevegger angitt som B30/B60/A60 i stedet for EI 30/EI 60 osv.

Mappe nye felter i `onDataExtracted`-handleren i `Konsept.tsx`. Behold prinsippet om å aldri overskrive utfylte felter.

## Del 3 — Kapittel 3-uttrekk (whitelist + konservativ)

Mål: fylle inn det AI med høy sikkerhet kan lese rett ut av et eksisterende dokument, uten å overstyre den eksisterende §-automatikken (sprinkler => seksjonering => RK6 etc.). Vi henter altså _inngangsvariabler_, ikke utdata.

### 3a. Hva som inkluderes (whitelist)

For hvert §11-x-område trekker vi ut **boolean «finnes»-flagg** og **fritekst-kommentarer** — ikke detaljerte bygningsdel-tabeller (de er multi-part og avhengige av valgt regelverk).

Felter som mappes (alle valgfrie, mappes kun hvis AI returnerer verdi):

§11-12 / §11-14 Aktive tiltak (binærflagg)
- `tilretteleggingLedd1a` — automatisk vannbasert slokkeanlegg (sprinkler)
- `tilretteleggingLedd2a` — brannalarmanlegg
- `tilretteleggingLedd2b` — røykvarslere
- `brannalarmTalevarsling` — talevarsling
- `tilretteleggingLedd3` — ledesystem
- `slokkeBrannslange`, `slokkeHandslukker`

§11-11 Rømning
- `romningsvei` (1 eller 2)
- `romningsveiSvalgang`, `romningsveiKorridorOver30m`, `romningsveiPanikkbeslag` (boolean)
- `romningsveiKommentar` (fritekst)

§11-15 Husdyr
- `husdyrRedningRelevant` (boolean), `husdyrTyper`, `husdyrRedningKommentar`

Universell utforming (kap. 2)
- `universellUtforming` (boolean)

Fritekstkommentarer per §-område (legges i eksisterende «kommentar»-felter der de finnes; ellers droppes):
- `bf85Brannbelastning`, `roykKontrollKravTekst`, `trapperomKravTekst`, osv.

### 3b. Hva som IKKE inkluderes (eksplisitt skip)

- `bygningsdeler[]` (multi-part bygninger) — for komplekst, krever egen UI-flyt for å oversette deler.
- Avledede felter som settes av automatikk: brannklasse, RK6/RK4-konsekvenser av sprinkler, branncellevegg-koder, EI-verdier i tabeller.
- Fravik (`fravik[]`), bilder, vedlegg, scopeImage.
- QA-status, revisjonshistorikk.

Begrunnelse skrives som kommentar i koden slik at senere utvidelser kan ta dette steg for steg.

### 3c. Implementasjon i edge-funksjonen

- Utvide JSON-skjema med en `kapittel3`-undernøkkel som speiler whitelisten over.
- I prompten: be modellen returnere `null` / utelate felt der den ikke har eksplisitt belegg. Eksplisitt «ikke gjett».
- Bytt fra `temperature: 0.1` til `response_format: { type: "json_object" }` + samme prompt — mer robust JSON-parsing.
- Bytte modell til `google/gemini-2.5-pro` (allerede valgt) — egnet for stor inputkontekst.

### 3d. Mapping i `Konsept.tsx`

I `onDataExtracted`:
- Iterere over en whitelist-tabell `{ aiKey -> formDataKey }` for kap. 3.
- Skrive verdien kun hvis:
  1. AI returnerte en ikke-tom verdi, OG
  2. eksisterende `formData[key]` er tom/false (aldri overskrive brukerens valg).
- Vise i success-toast hvor mange felter som ble fylt ut, og hvilket nivå («metadata + 7 felter i kapittel 3»).

## Del 4 — UX og tilbakemelding

- Etter analyse: vis liste over hvilke seksjoner som ble berørt, gruppert som «Metadata», «Kapittel 1–2», «Kapittel 3 (delvis)».
- Vise tydelig disclaimer i dialogen: «Kapittel 3 fylles ut delvis og må alltid kontrolleres manuelt. Avledede verdier (brannklasse, branncellevegger osv.) regnes ut automatisk basert på dine valg.»
- Behold eksisterende «overskriver aldri utfylte felter»-oppførsel.

## Del 5 — Verifisering

- Manuelt test 1: tomt nytt brannkonsept + et eksempel-PDF → metadata + flere §11-flagg fylles inn.
- Manuelt test 2: åpne eksisterende konsept og last opp samme dokument → ingen utfylte felter blir overskrevet.
- Manuelt test 3: tilstandsvurdering med BF85-dokument → `regelverk = "BF85"`, `bygningsbrannklasse` og `byggeaar` plukkes opp.
- Sjekke edge function-logger for JSON-parse-feil.

## Filer som endres

- `src/pages/Konsept.tsx` — flytte knapp, utvidet mapping for metadata + kap. 3 whitelist.
- `src/components/konsept/UploadConceptDialog.tsx` — sende `documentType`, dynamisk tekst, vis seksjons-disclaimer + utvidet result-toast.
- `supabase/functions/parse-fire-concept/index.ts` — utvidet JSON-skjema, dokumenttype-aware system-prompt, `response_format: json_object`, kap. 3-whitelist.

## Risiko / forbehold

- AI vil til tider gjette feil på binærflagg (f.eks. forveksle prosjektert mot eksisterende sprinkler). Derfor: kun ikke-tomme felter mappes, og brukerens egne valg overskrives aldri. Disclaimer i UI gjør forventningen tydelig.
- Multi-part bygninger (`bygningsdeler[]`) håndteres ikke i denne omgang — kan tas som egen oppfølger med en match-flyt (velg hvilken del AI sine funn skal gjelde for).
