## Mål
Legge til ny rad "Dører til teknisk rom" i kap. 3.5 for kraftstasjoner (BF85 og TEK17, brannkonsept og tilstandsvurdering). Vises automatisk når bygningstype/bygningsdel er Kraftstasjon, sammen med de øvrige kraftstasjon-spesifikke dørradene.

## Tekstinnhold (ny rad)

**Forhold:** Dører til teknisk rom – kraftstasjon  
**Løsning:** Dører til teknisk rom skal være utadslående for å sikre rømningsveier.  
**Ansvar:** ARK

## Vilkår for visning
Samme `erKraftstasjonDor`-sjekk som benyttes for de eksisterende kraftstasjon-radene i kap. 3.5 (bygningstype eller bygningsdel inneholder "Kraftstasjon").

## Tekniske endringer

### `src/components/konsept/KonseptPreview.tsx` (kap. 3.5)
Inne i eksisterende `erKraftstasjonDor`-blokk (rundt linje 1934), legge til en tredje `<tr>` rett etter "Dør til rom for høyspenningsanlegg – kraftstasjon". Samme styling: `font-medium` implisitt via td-layout, ansvar = ARK.

### `src/lib/word-export-chapter3.ts` (kap. 3.5)
Inne i samme `erKraftstasjonDor`-blokk (rundt linje 584), legge til `rows.push(contentRow("Dører til teknisk rom – kraftstasjon", "Dører til teknisk rom skal være utadslående for å sikre rømningsveier.", "ARK"));` rett etter høyspenningsanlegg-raden.

Ingen endringer i datamodell eller input-side.
