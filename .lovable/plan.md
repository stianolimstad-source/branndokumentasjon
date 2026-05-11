## Problem
I kap. 3.5 Brannceller i tilstandsvurdering etter BF85 vises «p. Tekniske rom som betjener flere andre brannceller…» med hele TEK17-teksten i listen man huker av. For BF85 ønsker brukeren at dette punktet skal være kortet ned til kun «p. Tekniske rom og ventilasjonsrom», siden det i BF85-konteksten ikke er TEK17 sin definisjon som er relevant.

## Løsning
Bruk en kortere label for `tekniske_rom`-punktet når `formData.regelverk === "BF85"`. Endringen gjøres kun i visning – `id`-en og lagret data forblir uendret, slik at vi unngår migrasjon.

### 1. Inputside – `src/pages/Konsept.tsx` (linje 4942–4961)
I `branncelleTyperListe.map(...)` brukes `type.label` direkte. Lag en hjelpefunksjon (inline) som returnerer `"p. Tekniske rom og ventilasjonsrom"` når `formData.regelverk === "BF85"` og `type.id === "tekniske_rom"`, ellers `type.label`. Erstatt `{type.label}` med dette resultatet.

### 2. Forhåndsvisning – `src/components/konsept/KonseptPreview.tsx` (linje 1928–1941)
I tabellen «Følgende rom/lokaler skal være egne brannceller» rendres `type.label` for hver valgte typeId. Bruk samme betingelse: hvis `formData.regelverk === "BF85"` og `typeId === "tekniske_rom"`, vis «p. Tekniske rom og ventilasjonsrom», ellers `type.label`.

## Ingen endringer
- Ingen DB-/skjemaendringer.
- Eget «Tekniske rom A 60»-avsnitt under (linje 1709 i preview) berøres ikke – det er fortsatt korrekt for BF85.
- Word-eksport berøres ikke i denne omgang.
- TEK17-visningen er uendret.
