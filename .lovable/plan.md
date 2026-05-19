## Mål
Legg til en ny seksjon **2.2 Detaljeringsnivå** i kap. 2 i ROS-analysen, basert på Beredskapsforskriften/NVE/Proactima sin 3-trinns nivåinndeling. Brukeren velger i input-skjemaet hvilket nivå analysen dekker (Nivå 1, 2 eller 3), og valgt nivå rendres i preview-kapitlet og Word-eksporten. Eksisterende underkapitler i kap. 2 forskyves: 2.2 Sannsynlighetsskala → 2.3, 2.3 Konsekvensskala → 2.4, 2.4 Risikomatrise → 2.5.

## Datamodell
- Utvid `RosContent.metadata` i `src/components/ros/RosPreview.tsx` med felt `nivaa?: 1 | 2 | 3` (valgfritt for bakoverkompatibilitet; default udefinert = ikke valgt).

## Input — `src/pages/RosAnalyse.tsx`
- I "2. Metode"-seksjonen (linje ~566), legg til en `<Select>` eller radioknapp-gruppe:
  - **Nivå 1 — Overordnet ROS-analyse** (hele virksomheten/anlegget)
  - **Nivå 2 — ROS-analyse av anlegg og aktiviteter**
  - **Nivå 3 — Detaljert ROS-analyse av delsystem/komponenter**
- Skriver til `content.metadata.nivaa`.
- Liten hjelpetekst: "Velg detaljeringsnivå iht. Beredskapsforskriftens kartleggingskrav."
- Oppdater `EMPTY_CONTENT.metadata` (linje 35) med `nivaa: undefined`.

## Preview — `src/components/ros/RosPreview.tsx`
Etter eksisterende 2.1 Analyseprosess legges en ny **2.2 Detaljeringsnivå**:
- Kort introtekst: "Beredskapsforskriften stiller krav om å kartlegge virksomhetens risikopotensiale. Analysens detaljeringsnivå tilpasses formålet. Det skilles mellom tre nivåer:"
- Tre stilrene "kort" side-ved-side (CSS grid 3 kolonner, samme stil som boksene i 2.1):
  - Nivå 1 — Overordnet ROS-analyse — *Helhetsbilde av virksomheten/anlegget*
  - Nivå 2 — ROS-analyse for anlegg og aktiviteter — *Konkretiserer risiko per anlegg/aktivitet*
  - Nivå 3 — Detaljert ROS-analyse av delsystem/komponenter — *Dyptgående på enkeltkomponenter/delsystemer*
- Hvert kort har samme blå farge som boksene i 2.1; det **valgte** nivået utheves med tykkere ramme (`2px solid #DC3545`) + et "Valgt for denne analysen"-merke nederst.
- Hvis `metadata.nivaa` ikke er satt: alle tre kort vises nøytralt + en kursiv note: "Nivå er ikke valgt i input."
- Kilde-footer: "Figur basert på NVE/Proactima — nivåinndeling iht. Beredskapsforskriften."

Renummerer eksisterende h3-er fra 2.2/2.3/2.4 til 2.3/2.4/2.5.

## Word-eksport — `src/lib/ros-word-export.ts`
Etter blokken for "Analyseprosess" i kap. 2 legges:
- `para("Detaljeringsnivå", { bold: true })`
- Tre punkter med samme tekster som over.
- Hvis `metadata.nivaa` er satt: avsluttende linje `para("Valgt for denne analysen: Nivå X — <navn>", { bold: true })`.

## Filer som endres
- `src/components/ros/RosPreview.tsx` — utvid `RosContent.metadata` type + ny 2.2-seksjon + renummerering.
- `src/pages/RosAnalyse.tsx` — input-felt for nivåvalg + oppdatert `EMPTY_CONTENT`.
- `src/lib/ros-word-export.ts` — ny Detaljeringsnivå-bolk i kap. 2.

## Ingen endringer
- Database-skjema (lagres som JSON i eksisterende `content`-felt).
- Kap. 1, 3, 4, 5/6, AI-logikk, RLS.
