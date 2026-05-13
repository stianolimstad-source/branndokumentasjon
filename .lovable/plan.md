## Mål
I BF85-tilstandsvurdering, kap. 3.5: Når «Brannceller over flere plan er relevant» IKKE er huket av, men bygget har 2+ etasjer, skal rapporten vise en beskrivende avviksrad — analogt med løsningen for brannventilasjon.

## Endring

Fil: `src/components/konsept/KonseptPreview.tsx` (rundt linje 2944–2977)

Erstatt dagens betingelse `{formData.branncellerFlerePlanRelevant && (() => { ... })()}` med en blokk som dekker tre tilfeller når `regelverk === "BF85"`:

1. **Relevant huket av** → vis dagens standardrad (uendret innhold).
2. **Relevant ikke huket + etasjer ≥ 2** → vis avviksrad:
   - Forhold: «Brannceller over flere plan»
   - Løsning (rød/uthevet): «⚠ Bygget har {etasjer} etasjer, men det er ikke dokumentert om brannceller strekker seg over flere plan. Etter BF85 kan brannceller ha åpen forbindelse over inntil tre plan, forutsatt at branncellen er tilrettelagt for at rømning og slokking av brann kan skje på en rask og effektiv måte. Manglende vurdering må dokumenteres som fravik.»
   - Ansvar: RIBr
3. **Relevant ikke huket + etasjer < 2** → ingen rad (returner `null`).

For ikke-BF85 (TEK17) beholdes dagens oppførsel uendret (vis kun når `branncellerFlerePlanRelevant` er huket).

## Tekniske detaljer
- Etasjeantall hentes fra `formData.etasjer` (samme felt som brukes i brannventilasjons-løsningen).
- Endringen er isolert til én preview-blokk; ingen state-mutasjon eller migrering.
- Ingen endringer i input-siden (`Konsept.tsx`) eller Word-eksport — Word-rapport følger preview-strukturen via eksisterende eksportlogikk.
- Påvirker kun `/tilstandsvurdering` med BF85; TEK17-konsept uendret.
