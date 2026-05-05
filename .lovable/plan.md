## Mål
I § 3.3 for BF85 (både brannkonsept og tilstandsvurdering) skal det være mulig å markere at nabobygg ikke er relevant (langt unna), slik at man slipper å fylle inn gesimshøyder og avstand.

## Endring i `src/pages/Konsept.tsx` (rundt linje 4118–4236, BF85-grenen i § 3.3)

1. **Nytt state-felt**: `nabobyggIkkeRelevant: false` i `formData` (initialiseres ved siden av `avstandNabobygg`).

2. **Ny knapp/bryter** øverst i BF85-blokken, før spørsmålet om brannvegg:
   - Tekst: "Er nabobygg relevant for vurderingen?"
   - To alternativer (Select eller toggle): "Ja" / "Nei – ligger langt unna"
   - Når "Nei" velges: vis en grønn info-boks: *"Nabobygg er vurdert som ikke relevant pga. stor avstand. Krav til branncellevegg / avstand mot nabo er ikke aktuelt."* og skjul resten av BF85-feltene (brannvegg-spørsmål, gesimshøyder, avstand, gruppe-unntak).

3. **Betinget rendering**: Pakk eksisterende BF85-innhold (linje 4121–4235) i `{!formData.nabobyggIkkeRelevant && (...)}`.

## Endring i forhåndsvisning og Word-eksport
- `src/components/konsept/KonseptPreview.tsx`: I § 3.3 BF85-grenen, vis kort tekst om at nabobygg ikke er relevant istedenfor avstandsberegning når flagget er satt.
- `src/lib/word-export-chapter3.ts` (eller tilsvarende kap. 3-eksport): tilsvarende tekst i Word-rapporten.

## Filer som endres
- `src/pages/Konsept.tsx`
- `src/components/konsept/KonseptPreview.tsx`
- `src/lib/word-export-chapter3.ts`
