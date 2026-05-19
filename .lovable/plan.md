## Mål
La AI analysere de tilkoblede årsakene (hendelsene fra kap. 3) i hver bow-tie og finne hvilke barrierer/tiltak som går igjen på tvers. Disse felles barrierene skal vises:
1. Visuelt i bow-tie-diagrammet i forhåndsvisningen (mellom årsaker og topphendelsen — der preventive barrierer hører hjemme).
2. I editor-siden under «Barrierer / tiltak» med kilde-merking.

## Datamodell

### `src/components/ros/RosPreview.tsx` — `RosBowTie`
Legge til:
```ts
felleseBarrierer?: { tekst: string; arsakIds: string[]; kilde?: "ai" | "manuell" }[];
```
Eksisterende `fellesBarrierer: string` (fritekst) beholdes for bakoverkompatibilitet og vises som «manuell» rad.

### `src/pages/RosAnalyse.tsx`
- `addBowTie` initialiserer `felleseBarrierer: []`.
- Load-mapping (linje ~145) leser eksisterende verdier defensivt.

## Edge function

### Ny: `supabase/functions/analyze-bowtie-barriers/index.ts`
- POST body: `{ topphendelse: string, beskrivelse?: string, arsaker: { id: string, tittel: string, tiltak: string }[] }`
- Kaller Lovable AI Gateway (`google/gemini-2.5-flash`) med system-prompt på norsk:
  > Du er ekspert på brannrisiko og bow-tie-analyse. Identifiser barrierer/tiltak som forebygger flere av disse årsakene (felles preventive barrierer). Returner JSON: `{ barrierer: [{ tekst: string, arsakIds: string[] }] }`. Bare ta med barrierer som dekker minst 2 årsaker. Tekst skal være kort (≤80 tegn), handlings­orientert.
- `response_format: { type: "json_object" }`, lest fra `LOVABLE_API_KEY`.
- Returnerer `{ barrierer: [...] }` med klassisk feilhåndtering (402/429 videreført til klient).

### `supabase/config.toml`
Ingen endring nødvendig (default `verify_jwt = true` er greit — kallet skjer fra innlogget bruker).

## UI-endringer

### `src/pages/RosAnalyse.tsx`
- Importere `supabase.functions.invoke`.
- Ny state per bow-tie: `analyzingId: string | null`.
- I bow-tie-kortet (etter Konsekvenser-blokken, før Felles barrierer fritekst): seksjon **«Felles barrierer (AI)»** med:
  - Knapp «Analyser felles barrierer» (`Sparkles`-ikon) → kaller edge function med `bt.navn`, `bt.beskrivelse` og årsakenes `{id, tittel, tiltak}`. Disabled hvis `hendelseIds.length < 2`.
  - Spinner mens analysen kjører.
  - Liste over `bt.felleseBarrierer`: hver rad viser tekst + små «chips» med tilknyttede årsakers titler + slett-knapp.
  - Mulighet til å legge til manuell felles barriere (Input + Plus-knapp) — lagres med `kilde: "manuell"`.
- Toast ved suksess/feil (402 → «Tomt for AI-kreditter», 429 → «Prøv igjen senere»).

### `src/components/ros/RosPreview.tsx`
- Endre bow-tie-diagram fra 3-kolonners grid til 5-kolonners: **Årsaker → Barrierer → Topphendelse → Konsekvenser**. (Praktisk: `gridTemplateColumns: "1fr 12px 180px 200px 12px 1fr"` med små «kobling»-streker, eller enklere `1fr 200px 200px 1fr`.)
  - Barriere-kolonnen: vertikalt stablede grønne kort (`background: #ecfdf5`, `border: 1px solid #10b981`) med tekst + liten footer som lister tilknyttede årsaker (forkortet, f.eks. «Dekker: Trafo 1, Generator 2»).
  - Tom-tilstand: skjul kolonnen helt hvis ingen barrierer.
- I «Barrierer / tiltak»-tabellen under diagrammet: prepend rader for `felleseBarrierer` med kilde = «Felles barriere (AI)» eller «Felles barriere» når manuell. Bevare eksisterende rader (per-årsak `tiltak` + gammel `fellesBarrierer`-fritekst).

### `src/lib/ros-word-export.ts`
- Speile samme struktur: en «Felles barrierer»-rad-gruppe i Word-tabellen for kap. 4 (sjekk eksisterende mapping og legg til).

## Verifisering
1. Opprett bow-tie med ≥2 årsaker som har overlappende tiltak (f.eks. «sprinkleranlegg», «brannalarm»).
2. Klikk «Analyser felles barrierer» → liste fylles med AI-foreslåtte barrierer + årsakstilknytning.
3. Forhåndsvisningen viser barrierene som grønne kort i midt-kolonnen, før topphendelsen.
4. Tabellen «Barrierer / tiltak» under diagrammet inkluderer felles barrierene øverst.
5. Word-eksport viser samme felles barrierer.
6. Slett en årsak → felles barrierer som refererte den får arsakIds filtrert (cleanup i `removeHendelse`).
