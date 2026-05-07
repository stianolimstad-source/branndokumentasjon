## Mål
Legge til ny rad "Ventilasjonsanlegg – brannspjeld" i kap. 3.7 for kraftstasjoner (BF85 og TEK17, brannkonsept og tilstandsvurdering). Vises automatisk når bygningstype/bygningsdel er Kraftstasjon, plassert rett etter "Kabler (kulverter, sjakter og kabeltunneler) – kraftstasjon".

## Tekstinnhold (ny rad)

**Forhold:** Ventilasjonsanlegg – kraftstasjon  
**Ansvar:** RIV  
**Løsning:** I ventilasjonsanlegget skal det ikke benyttes brannspjeld med smeltesikring. Det skal brukes automatiske spjeld som sikrer rask avstengning og hindrer røykspredning før temperaturen er blitt høy.

## Vilkår for visning
Samme `erKraftstasjon37`-sjekk som benyttes for de eksisterende kraftstasjon-radene i kap. 3.7.

## Tekniske endringer

### `src/components/konsept/KonseptPreview.tsx` (kap. 3.7)
Inne i eksisterende `erKraftstasjon37`-IIFE, legge til en tredje `<tr>` rett etter "Kabler"-raden. Ansvar = RIV.

### `src/lib/word-export-chapter3.ts` (kap. 3.7)
Inne i samme `erKraftstasjon37`-blokk, legge til `rows.push(contentRow("Ventilasjonsanlegg – kraftstasjon", "...", "RIV"));` rett etter Kabler-raden.

Ingen endringer i datamodell eller input-side.
