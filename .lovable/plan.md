## Mål
Legge til at dører til rom for høyspenningsanlegg skal ha selvlukker. Gjelder kraftstasjoner (BF85 og TEK17, brannkonsept og tilstandsvurdering), kap. 3.5.

## Tekst
> Dører til rom for høyspenningsanlegg skal ha selvlukker.

## Vilkår for visning
Vises automatisk når bygningstype eller noen av bygningsdelene har "Kraftstasjon" (samme `erKraftstasjon`-sjekk som benyttes i øvrige kraftstasjon-rader).

## Tekniske endringer

### `src/components/konsept/KonseptPreview.tsx` (kap. 3.5)
Legge til en ny `<tr>` rett etter den eksisterende "Dører i rømningsvei – kraftstasjon"-raden:
- Forhold: "Dør til rom for høyspenningsanlegg – kraftstasjon"
- Løsning: teksten over
- Ansvar: "ARK"

### `src/lib/word-export-chapter3.ts` (kap. 3.5)
Tilsvarende `contentRow(...)` direkte etter den eksisterende kraftstasjon-rad-blokken, med samme betingelse.

Ingen endringer i datamodell eller input-side.
