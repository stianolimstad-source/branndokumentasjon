## Mål
Legge til et automatisk krav under kap. 3.8 (Rømning og redning) for kraftstasjoner: Ved større besøk fra grupper, skoleelever, konserter eller lignende arrangement i fjellhall skal godkjenning fra lokalt brannvesen foreligge.

## Når skal raden vises
Når ett av følgende stemmer:
- `formData.bygningstype` inneholder "kraftstasjon", eller
- en av `formData.bygningsdeler` har `bygningstype` som inneholder "kraftstasjon".

Raden vises uavhengig av TEK17/BF85 (samme tilleggskrav), og uavhengig av om kraftstasjonen er under fjell – men teksten formuleres som arrangement "i fjellhall/kraftstasjon".

## Endringer

### 1. `src/components/konsept/KonseptPreview.tsx` (kap. 3.8, etter linje 3647)
Legge til ny rad rett etter eksisterende «Kommentar»-rad i 3.8:

- Forhold: "Arrangement og besøk – kraftstasjon"
- Løsning: "Ved større besøk fra grupper, skoleelever, konserter eller lignende arrangement i fjellhall/kraftstasjon skal godkjenning fra lokalt brannvesen foreligge før arrangementet avholdes."
- Ansvar: "Tiltakshaver/Driftsansvarlig"

Raden pakkes inn i `KraftstasjonTilleggskravCard`-stil eller, for å passe inn i tabellen, vises som en vanlig `<tr>` med samme markørstil som de øvrige kraftstasjon-radene i kap. 3.7 (gult/primary-fargekoding er ikke nødvendig – det holder med tydelig "– kraftstasjon"-suffix i Forhold-kolonnen, slik som i 3.7-radene).

### 2. `src/lib/word-export-chapter3.ts` (etter linje 1148)
Legge til samme rad i Word-eksporten via `contentRow(...)`, med samme betingelse for kraftstasjon, slik at HTML- og Word-output er identisk.

## Ingen endringer
- Ingen DB-/skjema-endringer.
- Ingen nye felt i `formData`.
- Ingen endringer for andre bygningstyper.