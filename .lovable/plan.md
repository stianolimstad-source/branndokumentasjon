## Mål

Når regelverk = BF85, skal kap. 3.14 (Atkomst for brannvesenet / Slokkemannskap) inkludere et automatisk avsnitt om Tabell 30:512 "Ikke-bærende ytterveggers brannmotstand", med tekst tilpasset valgt bygningsbrannklasse (1–4). Hele tabellen skal ikke vises.

## Innhold som skal genereres

Avsnittet vises kun ved BF85, og baseres på `formData.bygningsbrannklasse`:

- BBK 1: «Ikke-bærende yttervegger som kan rekkes for slokking fra utsiden skal utføres minst i klasse B 30. Vegger som ikke kan rekkes for slokking fra utsiden skal utføres minst i klasse A 30.»
- BBK 2: «… B 30 / A 30.» (samme som BBK 1)
- BBK 3: «… B 30 / A 30. For bygninger i inntil 2 etasjer kan vegger utføres helt i ubrennbare materialer uten hensyn til deres brannmotstand.»
- BBK 4: «… B 15 / B 15. For bygninger i inntil 2 etasjer kan vegger utføres helt i ubrennbare materialer uten hensyn til deres brannmotstand.»

Overskrift på avsnittet: «Ikke-bærende ytterveggers brannmotstand (Tabell 30:512)».

## Endringer

1. `src/lib/bf85-constants.ts`
   - Ny hjelper `getYtterveggBrannmotstandBF85(bygningsbrannklasse: string): { tekst: string } | null` som returnerer ferdig formatert tekst per klasse (null hvis ugyldig).

2. `src/pages/Konsept.tsx` (3.14-blokken, ~9391–9495)
   - Når `formData.regelverk === "BF85"` og `bygningsbrannklasse` er satt: vis et lite info-avsnitt nederst i 3.14 med overskriften og generert tekst (read-only, samme stil som «automatisk inkludert»-boksen).

3. `src/components/konsept/KonseptPreview.tsx` (3.14-renderingen, ~5347)
   - Samme betingelse: legg inn en rad/avsnitt i 3.14-tabellen med overskrift «Ikke-bærende ytterveggers brannmotstand (Tabell 30:512)» og den genererte teksten.

4. `src/pages/Konsept.tsx` Word-eksport for 3.14 (~1951 og rundt)
   - Speil samme tekst i Word-output når BF85.

Ingen endringer på datamodellen, ingen nye checkboxes — kravet trigges kun av valgt bygningsbrannklasse og regelverk.
