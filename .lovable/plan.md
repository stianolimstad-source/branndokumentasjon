## Plan: Komplettere ROS-analysen med planleggingstrinnene fra Figur 6

De fem planleggingsmomentene fra det opplastede dokumentet er delvis dekket:

| Punkt | Status i dag |
|---|---|
| 1. Definere formål og omfang | Dekket (1.2 Formål, 1.3 Omfang) |
| 2. Valg av konsekvens- og sannsynlighetsdimensjon | Dekket (2. Metode – 5×5-matrise med S- og K-skala) |
| 3. Informasjonsinnhenting | **Mangler** |
| 4. Organisering av arbeidet | **Mangler** |
| 5. Klargjøring av analyseskjema og sjekklister | **Delvis** (skjema vises, men ikke beskrevet eksplisitt) |

### Ny seksjon: 2.3 Planlegging av analysen

Legges inn i kap. 2 i preview og Word-eksport, rett etter «2.2 Detaljeringsnivå» og før sannsynlighets-/konsekvensskala. Innholdet skal speile Figur 6 (Planlegging → Risiko- og sårbarhetsvurdering → Risikohåndtering) og liste opp de fem punktene som inngår i planleggingsfasen.

Tre felt blir redigerbare i input-skjemaet (kap. 1/Metode-fane):

- **Informasjonsinnhenting** — kilder, tegninger, befaringer, intervjuer, statistikk
- **Organisering av arbeidet** — deltakere/roller (oppdragsgiver, brannrådgiver, driftsansvarlig, m.m.), møter, ansvar
- **Analyseskjema og sjekklister** — hvilket skjema som brukes (5×5-matrise), eventuelle sjekklister/maler

Punkt 1 og 2 vises som referanse til kapittel 1 / kap. 2.1 slik at brukeren ser sammenhengen, uten dobbeltskriving.

### Endringer som må gjøres

**Datamodell** (`src/components/ros/RosPreview.tsx`)
- Utvide `RosContent` med `metode?: { informasjonsinnhenting?: string; organisering?: string; skjemaOgSjekklister?: string }`.

**Input-skjema** (`src/pages/RosAnalyse.tsx`)
- Legge til tre `Textarea`-felt under en ny gruppe «Planlegging av analysen» i metode-/innledningsfanen. Default-tekst som hjelper brukeren i gang.
- Persistere i samme `content`-JSON som lagres i Supabase i dag (ingen DB-endring nødvendig — feltet ligger inne i `content`-JSONB).

**Preview** (`src/components/ros/RosPreview.tsx`)
- Ny `2.3 Planlegging av analysen`-blokk: kort intro + nummerert liste 1–5 (med kryssreferanser til 1.2/1.3 og 2.1 for punkt 1–2) + tekstblokker for punkt 3–5.
- Liten figur/diagram-boks med de tre fasene (Planlegging / Risiko- og sårbarhetsvurdering / Risikohåndtering) i samme visuelle stil som dagens flytdiagram i 2.1 — gjenbruker eksisterende boks-/pilstiler, ingen nytt bilde.

**Word-eksport** (`src/lib/ros-word-export.ts`)
- Speile ny 2.3-seksjon med samme rekkefølge og tekster (Paragraph + bullet list), slik at Word matcher preview.

**Parse-funksjon** (`supabase/functions/parse-ros-analysis/index.ts`)
- Utvide AI-prompt slik at den også prøver å hente ut `informasjonsinnhenting`, `organisering` og `skjemaOgSjekklister` fra opplastede ROS-dokumenter.

### Filer som endres

- `src/components/ros/RosPreview.tsx` (type + ny seksjon)
- `src/pages/RosAnalyse.tsx` (tre nye input-felt)
- `src/lib/ros-word-export.ts` (ny 2.3-seksjon i Word)
- `supabase/functions/parse-ros-analysis/index.ts` (AI-parsing av nye felt)

Ingen DB-migrering — nye felt lagres som del av eksisterende `content` JSONB.
