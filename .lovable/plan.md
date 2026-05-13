## Mål
Korriger logikken for «Brannceller over flere plan» i rapporten:

1. Når «Brannceller over flere plan er relevant» IKKE er huket av → ingen rad i rapporten (uavhengig av etasjeantall og regelverk).
2. Når «relevant» ER huket og «Branncellen strekker seg over flere enn 3 plan» er huket → vis tydelig avviks-tekst i rapporten.

## Endring

Fil: `src/components/konsept/KonseptPreview.tsx` (linje ~2944–2998)

a) Fjern BF85-blokken som viser avviksrad når «relevant» ikke er huket (linje 2950–2963). Erstatt hele IIFE-en slik at:
   - Hvis `!formData.branncellerFlerePlanRelevant` → returnér `null`.
   - Ellers vis dagens standardrad med RK 3/6-fravikstekstene (uendret).

b) Inne i den eksisterende standardraden (når «relevant» er huket): legg til en ny rød/uthevet linje når `formData.branncellerFlerePlanOver3 === true`:

> ⚠ Fravik: Branncellen strekker seg over flere enn 3 plan. Etter {BF85: «BF85» / TEK17: «preaksepterte ytelser i VTEK17 §11-8»} kan brannceller ha åpen forbindelse over inntil tre plan. Avvik fra dette må dokumenteres som fravik i tilstandsvurderingen.

Linjen vises i samme `<td>` som den eksisterende beskrivelsen, under eventuell RK 3/6-advarsel. Gjelder både TEK17 og BF85, siden inputfeltet finnes for begge.

## Tekniske detaljer
- Bruker eksisterende state-felt `branncellerFlerePlanRelevant` og `branncellerFlerePlanOver3` fra `Konsept.tsx`.
- Ingen endringer i input-siden eller i Word-eksport (Word følger preview-strukturen).
- Påvirker både `/konsept` og `/tilstandsvurdering`.
