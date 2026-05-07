## Mål
Legge til anbefaling om dører med vindu i rømningsvei for kraftstasjoner (både BF85 og TEK17, brannkonsept og tilstandsvurdering). Vises i kap. 3.5 i tilknytning til "Dørkrav".

## Tekst som legges inn
> For dører i rømningsvei anbefales det dører med vindu for å kunne oppdage personell, røyk eller brann.

## Vilkår for visning
Vises automatisk når `bygningstype` eller noen `bygningsdeler[].bygningstype` inneholder "Kraftstasjon" (samme `erKraftstasjon`-sjekk som brukes andre steder i preview/word-export). Ingen nye formfelt.

## Tekniske endringer

### `src/components/konsept/KonseptPreview.tsx` (kap. 3.5, etter "Dørkrav"-raden ~linje 1928)
Legge til en ny `<tr>` rett etter den eksisterende dørkrav-raden (gjelder både BF85- og TEK17-greinene):
- Forhold-celle: "Dører i rømningsvei – kraftstasjon"
- Løsning-celle: anbefalingsteksten over.
- Ansvar-celle: "ARK"

Raden rendres betinget på `erKraftstasjon`-sjekken.

### `src/lib/word-export-chapter3.ts` (kap. 3.5, etter dørkrav-blokken)
Tilsvarende `contentRow("Dører i rømningsvei – kraftstasjon", "<tekst>", "ARK")` som legges til når `erKraftstasjon` er sann, slik at Word-eksporten matcher previewen.

Ingen endringer i datamodell, og ingen endringer på input-siden (gjelder automatisk for kraftstasjon).
