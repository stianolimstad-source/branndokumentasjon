## Endringer i `src/components/verktoy/TrafoEksplosjonTool.tsx`

### 1. Utvid SCENARIOER med kortslutnings-uttrykk

Legg til felt `uttrykk` på hvert objekt i `SCENARIOER`-arrayet (linje 17–22):

- Lavt: «Tilsvarer ca. 15 kA × 500 V × 200 ms eller 25 kA × 500 V × 120 ms. Typisk distribusjonstrafo med fungerende primærvern.»
- Sannsynlig: «Tilsvarer ca. 25 kA × 1000 V × 160 ms eller 20 kA × 1000 V × 200 ms. Typisk 132 kV regional trafo med primærvern.»
- Høyt: «Tilsvarer ca. 35 kA × 1000 V × 230 ms eller 25 kA × 1000 V × 320 ms. Typisk 132 kV-trafo der primærvern svikter og reservevern utløser.»
- Worst case: «Tilsvarer ca. 40 kA × 2000 V × 190 ms eller 30 kA × 2000 V × 250 ms. Lang bue og tregt reservevern på stor trafo.»

### 2. Oppdater scenario-knappenes Tooltip

Endre `<TooltipContent>{s.beskrivelse}</TooltipContent>` (linje 385) til en `max-w-xs`-versjon med dagens beskrivelse på første linje (fet) og det nye `uttrykk` som ny avsnitt under.

### 3. Feedback-linje i Kortslutnings-fanen

I resultatboksen (linje 429–435), under `{E_kortslutning.toFixed(2)} MJ`, legg til en hjelpefunksjon `scenarioFeedback(mj)` som returnerer:

- `< 1`: «Tilsvarer under Lavt-scenariet»
- `1–3`: «Tilsvarer Lavt-scenariet»
- `3–6`: «Tilsvarer Sannsynlig-scenariet»
- `6–12`: «Tilsvarer Høyt-scenariet»
- `12–20`: «Tilsvarer Worst case-scenariet»
- `> 20`: «Overskrider Worst case – sjekk at I_k og klareringstid er realistiske for ditt anlegg»

Rendres som liten linje (`text-xs text-muted-foreground italic`) under U×I×t-linjen.

### 4. Warning-alert ved E > 30 MJ

Rett under resultatboksen (utenfor den, i samme `TabsContent`): hvis `E_kortslutning > 30`, vis `<Alert variant="warning">` med ikon (`AlertTriangle`) og tekst:

«Beregnet buenergi er svært høy. Verifiser at kortslutningsstrømmen er hentet fra riktig spenningsside, og at klareringstiden reflekterer faktiske reléinnstillinger – ikke teoretiske worst case.»

Importer `Alert`, `AlertDescription` fra `@/components/ui/alert` hvis ikke allerede importert; `AlertTriangle` fra `lucide-react` (sjekk eksisterende import).

## Filer

- `src/components/verktoy/TrafoEksplosjonTool.tsx` (eneste fil som endres)
