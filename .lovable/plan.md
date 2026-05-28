# Oppgradere AI-modell i appen

## Nåværende situasjon
Alle 7 edge-funksjoner bruker `google/gemini-2.5-flash` via Lovable AI Gateway.

## Forslag: Bytt til `google/gemini-3-flash-preview`
Dette er Lovables nye standardmodell — raskere, bedre på resonnement og strukturert output (JSON), og samme pris-kategori. Ingen API-nøkkel-endring nødvendig (samme `LOVABLE_API_KEY`).

### Alternativer hvis du ønsker noe annet
- **`google/gemini-3.5-flash`** — enda nyere, sterk på koding/resonnement (litt dyrere)
- **`google/gemini-3.1-pro-preview`** — toppmodell for tyngst resonnement (mye dyrere, tregere) — egnet hvis AI Brannkonsulent skal håndtere mer komplekse TEK17-spørsmål
- **Blandet**: Pro-modell for `tek17-chat` (chat/resonnement) + Flash for parsing/ekstraksjon

## Endringer
Bytt `model: "google/gemini-2.5-flash"` → `model: "google/gemini-3-flash-preview"` i:
1. `supabase/functions/tek17-chat/index.ts`
2. `supabase/functions/parse-fire-concept/index.ts`
3. `supabase/functions/parse-ros-analysis/index.ts`
4. `supabase/functions/analyze-bowtie-barriers/index.ts`
5. `supabase/functions/analyze-bowtie-mitigations/index.ts`
6. `supabase/functions/extract-bowtie-from-konsept/index.ts`
7. `supabase/functions/extract-bowtie-from-ros/index.ts`

Funksjonene deployes automatisk.

## Risiko
Preview-modeller kan endre seg over tid. Hvis du vil ha en stabil ikke-preview-modell, er `google/gemini-2.5-flash` (nåværende) eller `google/gemini-3.5-flash` tryggere valg.

**Hvilken modell vil du gå for?** (Standard-anbefaling: `gemini-3-flash-preview` for alle 7.)
