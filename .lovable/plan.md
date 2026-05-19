
## Mål

I bow-tie-seksjonene "Felles barrierer" og "Konsekvensreduserende tiltak" skal vi tilby **to tydelige AI-knapper**:

1. **"Hent fra brannkonsept (kap. 3)"** — AI leser brannkonseptet som er knyttet til samme prosjekt, plukker ut allerede definerte tiltak fra kapittel 3 (§11-4 til §11-17), og matcher dem mot årsakene/konsekvensene i bow-tien.
2. **"Foreslå nye tiltak (AI)"** — dagens AI-knapp, men tydeligere merket. Foreslår *nye* barrierer/tiltak som ikke allerede ligger i kap. 3.

## Endringer

### 1. Hent brannkonsept i `RosAnalyse.tsx`

- Når ROS-analysen åpnes og `projectId` er kjent, hent siste `fire_concepts`-rad for prosjektet (`select content`, `order created_at desc`, `limit 1`).
- Lagre i `useState` (kan være `null` hvis prosjektet ikke har konsept).
- Brukes som input til nye edge functions.

### 2. To nye edge functions

**`extract-bowtie-from-concept`** (én function som dekker både barrierer og tiltak via `type`-felt):
- Input: `{ type: "barrier" | "mitigation", topphendelse, beskrivelse, arsaker?, konsekvenser?, konseptKap3 }`
- Bygger en kompakt tekstrepresentasjon av kap. 3 (alle aktive seksjoner §11-4…§11-17 med tiltakstekster fra konseptets `content.chapter3` / `kapittel3` struktur).
- Ber Lovable AI om å plukke ut eksisterende tiltak fra kap. 3 som virker forebyggende (for `barrier`) eller konsekvensreduserende (for `mitigation`), og knytte dem til riktige årsak-/konsekvens-id-er.
- Hver returnert post inkluderer `kildeRef` (f.eks. "§11-12 Brannalarmanlegg") slik at brukeren ser hvor den kommer fra.
- Returnerer samme JSON-struktur som dagens funksjoner, med ekstra `kildeRef`-felt.

Eksisterende `analyze-bowtie-barriers` og `analyze-bowtie-mitigations` beholdes som de er, men system-prompten utvides med en seksjon: *"Følgende tiltak er allerede dekket av brannkonseptet kap. 3 — ikke gjenta disse, foreslå nye/utfyllende"*. Den får `konseptKap3` som ekstra input.

### 3. UI i `RosPreview`/`RosAnalyse` (bow-tie-seksjonen)

For både "Felles barrierer" og "Konsekvensreduserende tiltak":

```text
[ Sparkles  Hent fra kap. 3 ]   [ Wand2  Foreslå nye (AI) ]
```

- Knappene plasseres side om side over listen.
- "Hent fra kap. 3" er disabled (med tooltip) hvis prosjektet ikke har et brannkonsept.
- Egen `analyzingSource: "kap3" | "ai" | null` per bow-tie, slik at riktig knapp viser spinner.
- AI-genererte rader får badge "AI" som i dag; kap.3-rader får badge "Kap. 3 §11-x" (klikkbar tooltip viser kildeRef).
- `kilde`-typen utvides: `"manuell" | "ai" | "kap3"`. Erstattelseslogikken endres slik at "Hent fra kap. 3" kun bytter ut tidligere `kap3`-rader, og "Foreslå nye" kun bytter ut tidligere `ai`-rader. Manuelle rader berøres aldri.

### 4. Datamodell

I `RosBowTie.felleseBarrierer[]` og `konsekvensReduserende[]` legges til valgfritt felt:
```ts
kildeRef?: string; // f.eks. "§11-12 Brannalarmanlegg"
```
Bakoverkompatibelt — eksisterende lagrede analyser leses fortsatt korrekt.

## Tekniske detaljer

- `fire_concepts.content` er JSONB. Vi må sjekke faktisk feltstruktur for kap. 3 (mest sannsynlig `content.kapittel3` eller per-paragraf nøkler som `paragraf_11_4`, `paragraf_11_12` osv.). Edge functionen normaliserer dette til en flat liste `{ paragraf, tittel, tiltakstekst }` før den sendes til AI.
- Bruker `google/gemini-2.5-flash` (samme modell som dagens to functions) for konsistens og lav kostnad.
- CORS + 429/402-håndtering kopieres fra eksisterende functions.
- Ingen DB-skjemaendringer.

## Hva som *ikke* gjøres

- Ingen endring av kapittel 3-redigeringen i konseptet.
- Ingen automatisk synkronisering tilbake fra bow-tien til konseptet.
- Ingen endring av Word-eksport (badges vises kun i UI; eksisterende eksportlogikk fungerer videre).
