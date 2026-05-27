## Mål
Knytt branntekniske beregninger til hver ROS-hendelse, og vis dem i forhåndsvisningen.

## Endringer

### 1. `src/components/ros/RosPreview.tsx`
- Importer `AttachedCalculation` fra `@/components/fraviksdokumentasjon/BeregningSection`.
- Utvid `RosHendelse`-interfacet med valgfritt felt `beregninger?: AttachedCalculation[]`.
- I hendelsestabellen (rundt linje 827, `content.hendelser.map`): etter den eksisterende `<tr>` for hendelsen, render en ekstra `<tr>` som spenner alle kolonner (`colSpan`) **bare hvis `h.beregninger?.length`**. Innholdet er en kompakt boks:
  - Tittel: `Beregningsgrunnlag (X beregninger)`
  - Liste per beregning: lite ikon (samme `calculatorTypes`-mapping som i `BeregningSection` — gjenbruk gjennom lokal map fra `type` → `lucide-react`-ikon), label, og chips for `results` i samme stil som i `BeregningSection` (`nøkkel: verdi`).
  - Hvis `kommentar` finnes, vis den i kursiv under chipsene.
  - Boksen styles inline med samme PDF-vennlige paletten som resten av previewen (lys bakgrunn, `border: 1px solid #e2e8f0`, små fontstørrelser ≈ 9–10px).
- Vis ingenting hvis det ikke finnes beregninger.

### 2. `src/pages/RosAnalyse.tsx`
- Importer `BeregningSection` fra `@/components/fraviksdokumentasjon/BeregningSection`.
- I hendelse-editoren (rundt linje 1084, mellom seksjonen «Forebyggende tiltak» og «Etter tiltak»/«Restrisiko»): legg inn en ny blokk **etter tiltak-feltet og før restrisiko-feltet** (eller etter «Etter tiltak»-blokken, men før restrisiko). Plassering i samsvar med brukerens spesifikasjon: under «Tiltak», før «Restrisiko».
  - Liten overskrift «Tilknyttede beregninger» (samme typografi som de andre `uppercase tracking-wide`-overskriftene).
  - Hjelpetekst: «Knytt branntekniske beregninger til hendelsen for å dokumentere sannsynlighet- og konsekvensvurderingen».
  - `<BeregningSection beregninger={h.beregninger || []} onChange={(beregninger) => updateHendelse(h.id, { beregninger })} fravikIndex={index} />` (bruker eksisterende `index` fra `.map`).
- Konstruksjon av nye `RosHendelse`-objekter:
  - Linje ~301 (manuell ny hendelse): legg til `beregninger: []`.
  - Linjer ~386, ~426, ~547 (AI-generert / kap. 3-hentede hendelser): legg til `beregninger: []`.
  - Linje ~616 (`data.hendelser.map(...)` ved import): bevar evt. eksisterende `h.beregninger`, ellers `[]`.

## Tekniske notater
- `AttachedCalculation` har felter `id`, `type`, `label`, `inputs`, `results`, `kommentar` — disse brukes som de er.
- Word-eksport av ROS-rapport berøres ikke i denne omgangen (kun preview + skjema).
- Ingen endringer i datalagring/DB nødvendig — feltet serialiseres automatisk som del av `RosContent`-JSON.
