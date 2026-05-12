## Problem
Innholdet «Kap. 30:63 – Branncelleinndeling» (innledning + bygningsdel-krav + tre kulepunkter om form/innredning, sjakter og dørkrav) vises allerede i forhåndsvisningen og i rapporten for BF85 i kap. 3.5. På inputsiden kommer denne informasjonen etter avhukingslisten – brukeren ønsker at den vises **først**, slik at man leser regelgrunnlaget før man velger relevante branncelletyper.

## Endring

### `src/pages/Konsept.tsx` (kap. 3.5, rundt linje 4934–4942)
Like etter `<SectionCollapsible … previewId="preview-3-5" …>`-tittelen og før `<Label>Relevante branncelle-typer …</Label>` med checkbox-listen, legg inn en betinget visnings-boks som kun rendres når `formData.regelverk === "BF85"`. Boksen skal speile innholdet som allerede står i `KonseptPreview.tsx` linje 1697–1704 (Kap. 30:63), men i en lese-stil tilpasset inputsiden:

- Tittel: «Kap. 30:63 – Branncelleinndeling»
- Innledning: «Bygning skal inndeles på hensiktsmessig måte i brannceller med konstruksjon etter Tabell 30:41.»
- «Ikke-bærende branncellebegrensende bygningsdel: **{krav.branncellebegrensende}**»
- Kulepunkter:
  - Brannceller må ikke ha form eller innredning som gjør varsling og rømning ved brann vanskelig.
  - Sjakter som ikke ligger i tilknytning til trapperom skal utføres som egne brannceller.
  - Dører i branncellebegrensende vegger skal ha minst 1/2 av veggens brannmotstand – dvs. minst **{krav.dorKrav}**.

Verdiene `branncellebegrensende` og `dorKrav` hentes fra samme `bf85KravMap`-logikk som i preview (basert på `formData.bygningsbrannklasse`) slik at A 60 / A 30 oppdateres riktig per BBK 1–4. Hvis `bygningsbrannklasse` ikke er satt enda, vises `[velg BBK]` som plassholder.

Stylingen følger eksisterende info-bokser i filen (`bg-accent/30 border border-accent rounded p-3 text-xs` med fet tittel), tilsvarende blokken på linje 4910.

## Hva endres ikke
- Forhåndsvisning og Word-rapport er uendret – samme innhold står der allerede.
- Ingen endringer i datamodell, lagring eller `branncelleTyperListe`.
- TEK17-visning på inputsiden berøres ikke.
