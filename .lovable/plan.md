## Mål
I oppsummeringen i opplastingsdialogen skal eldre bygg (BF85 / tilstandsvurdering) vise **Bygningsbrannklasse** i stedet for de TEK17-spesifikke **Risikoklasse** og **Brannklasse**, slik at oppsummeringen samsvarer med det som faktisk importeres til skjemaet.

## Endring
Kun frontend, i `src/components/konsept/UploadConceptDialog.tsx`:

1. Når `documentType === "tilstandsvurdering"`:
   - Skjul `risikoklasse` og `brannklasse` fra listen over metadata-felter som vises og kan velges (de hører til TEK17 og brukes ikke i BF85-flyten).
   - Vis `bygningsbrannklasse` (eksisterer allerede i `META_LABELS` og `ExtractedData`) — AI henter feltet allerede ut i dag, det blir bare ikke vist i oppsummeringen.
2. For `documentType === "brannkonsept"` beholdes dagens visning uendret (Risikoklasse + Brannklasse vises, Bygningsbrannklasse skjules siden den ikke er relevant for TEK17-konsept).
3. Teknisk: bygg en `visibleMetaKeys`-liste basert på `documentType` og bruk den både til `metaKeysFound`, "Velg alle"-logikken og selve listevisningen. Ingen endringer i edge function, datamodell eller `Konsept.tsx`.

## Resultat
Når man laster opp et BF85-dokument vil oppsummeringen vise f.eks. `Bygningsbrannklasse: BKL3` i stedet for `Risikoklasse: RK2` + `Brannklasse: BKL3`, og samsvare med det som faktisk fylles inn i skjemaet ved import.
