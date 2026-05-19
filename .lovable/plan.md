## Mål
"Hent fra kap. 3"-knappene i bow-tie skal hente fra **ROS-analysens** kapittel 3 ("3. Hendelser"), ikke fra brannkonseptet. Hvis ingen tiltak finnes i kap. 3, brukes "Foreslå nye (AI)" som før.

## Endringer

### 1. Ny edge-funksjon: `supabase/functions/extract-bowtie-from-ros/index.ts`
- Input: `{ type: "barrier" | "mitigation", topphendelse, beskrivelse, hendelserKap3: [{id, tittel, tiltak, beskrivelseEtter}], konsekvenser? }`
- Bruker Lovable AI Gateway (`google/gemini-2.5-flash`) til å klassifisere og trekke ut tiltak fra `tiltak`-fritekstfeltet på hver kap-3-hendelse:
  - `barrier`: forebyggende tiltak → knyttes til `arsakIds` (hendelse-id-er)
  - `mitigation`: konsekvensreduserende tiltak (sprinkler, alarm, seksjonering, evakuering, slokkemannskap …) → knyttes til `konsekvensIds`
- `kildeRef` settes til hendelsens tittel (f.eks. "Brann i transformator").
- Tidlig-retur med tom liste hvis alle `tiltak`-felt er blanke (sparer AI-kall).
- Returnerer samme JSON-form som dagens funksjon: `{ barrierer: [...] }` / `{ tiltak: [...] }`.

### 2. `src/pages/RosAnalyse.tsx`
- Bygg `hendelserKap3` fra `bt.hendelseIds → content.hendelser` (id, tittel, tiltak, beskrivelseEtter).
- Endre `extractBarriererFraKonsept` og `extractKonsTiltakFraKonsept` til å kalle `extract-bowtie-from-ros` med den nye payloaden i stedet for `konseptContent`.
- Fjern `konseptContent`-avhengighet på de to knappene: `disabled` baseres kun på henholdsvis `hendelseIds.length < 1` / `konsekvenser.length < 1`.
- Oppdater tooltips: "Hent tiltak som er ført opp på hendelsene i ROS-analysens kap. 3".
- Toast ved tomt resultat: "Ingen [barrierer|konsekvensreduserende tiltak] funnet i kap. 3 — prøv 'Foreslå nye (AI)'."
- Fjern hjelpetekstene "Ingen brannkonsept tilknyttet prosjektet …" under begge knappene.
- `konseptContent`-state og useEffect-hentingen fjernes (brukes ikke andre steder).

### 3. Badge-rendering (uendret kode)
Eksisterende `kt.kildeRef ? \`Kap. 3 ${kt.kildeRef}\` : "Kap. 3"` fortsetter å fungere — innholdet i `kildeRef` blir nå hendelsesnavn i stedet for §-nummer.

### 4. Ikke berørt
- `extract-bowtie-from-konsept` beholdes (ubrukt fra ROS-flyten, kan fjernes senere).
- AI-forslag (`analyze-bowtie-barriers`, `analyze-bowtie-mitigations`), datamodell, Word-eksport og matrise/kriterier er uendret.
