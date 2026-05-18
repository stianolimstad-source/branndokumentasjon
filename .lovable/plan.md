## Mål
Når en opplastet ROS-analyse inneholder hendelser fra flere prosjekter, skal hendelsene grupperes per prosjekt i gjennomgangs-dialogen, slik at brukeren enkelt kan velge/avvelge alle hendelser i ett prosjekt om gangen.

## Endringer

### 1. `supabase/functions/parse-ros-analysis/index.ts`
- Utvid AI-prompt og JSON-skjema med felt `prosjekt` per hendelse (kort prosjekt-/anleggsnavn hentet fra rad/seksjons-header, f.eks. "Trafostasjon A").
- AI instrueres til å detektere prosjektskillelinjer (overskrifter, kolonne "Anlegg/Prosjekt", arkfaner i Excel) og fylle inn `prosjekt` for hver hendelse. Hvis bare ett prosjekt finnes, settes feltet tomt.
- Sanitering: ta vare på `prosjekt` som string (trimmet, maks 80 tegn) i `clean`-mapping.

### 2. `src/components/ros/UploadRosDialog.tsx`
- Utvid `ExtractedHendelse` med valgfritt `prosjekt?: string`.
- I review-tabellen: gruppér `data.hendelser` etter `prosjekt` (fallback "Uten prosjekt" hvis blandet, eller ingen gruppering hvis alle er tomme/like).
- Render én seksjons-header-rad per gruppe med:
  - Prosjektnavn
  - Antall hendelser i gruppen + antall valgte
  - Checkbox for å velge/avvelge alle i gruppen
  - Sammenslå-/utvid-knapp (valgfritt — start med alle åpne)
- Behold eksisterende per-rad checkbox, ekspandering og "Velg alle"-toppcheckbox (som nå styrer på tvers av alle grupper).
- Ingen endring i `onApply` — `prosjekt` blir bare metadata for visning og forsvinner ved import (eller kan eventuelt prependes til `tittel` i en senere iterasjon — ikke i denne).

## Ikke endret
- Database/RLS, edge-funksjons-kontrakt utover ett nytt valgfritt felt, eksisterende import-flyt, eller `RosPreview`.
