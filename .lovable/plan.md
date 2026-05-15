## Endring: Tittel = kun Sårbarhet ved import

Per nå settes `tittel` ved import til `"{sarbarhet} – {hendelse}"`, som blir veldig langt. Vi forenkler slik at tittelen kun blir sårbarheten, men den forblir et fritt redigerbart felt i editoren.

### Endringer

**1. `supabase/functions/parse-ros-analysis/index.ts`**
- I `clean`-mappingen: endre `tittelFromParts` fra `[sarbarhet, hendelse].join(" – ")` til kun `sarbarhet`.
- Fallback-rekkefølge: `h.tittel || sarbarhet || hendelse` (beholder eksisterende eksplisitt tittel hvis dokumentet hadde en, ellers sårbarhet, ellers hendelse).
- Fjerner `.slice(0, 300)` ikke nødvendig, men beholdes som sikring.

**2. `src/components/ros/UploadRosDialog.tsx`**
- Visningen i import-tabellen viser allerede `h.tittel || h.sarbarhet || h.hendelse` — ingen endring nødvendig, men resultatet blir nå konsist.

**3. Ingen endringer** i `RosPreview.tsx`, `RosAnalyse.tsx` eller `ros-word-export.ts`. Tittelfeltet i editoren er allerede redigerbart, så brukeren kan justere fritt etter import.

### Effekt
- Nye importer får korte titler (f.eks. "Trafo 1 havarerer" i stedet for "Trafo 1 havarerer – Oljebrann ved intern feil…").
- Eksisterende lagrede analyser påvirkes ikke (kan redigeres manuelt ved behov).
- Hele hendelse-/scenariobeskrivelsen ligger fortsatt i `hendelse`-feltet og vises i editoren under «Før tiltak».
