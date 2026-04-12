

## Plan: Synkroniser trapperomskrav i 3.10 med 3.5 for flere bygningsdeler

### Problem
Seksjon 3.10 bruker kun primær risikoklasse for trapperomskrav, mens seksjon 3.5 allerede beregner Tr-type per bygningsdel. Ved flere bygningsdeler med ulike trapperomskrav mangler det et spørsmål om trapperommene går gjennom begge bygningsdeler.

### Løsning

**1. Ny formData-felter**
- `trapperomGarGjennomAlleDeler: boolean` — om trapperommene fysisk går gjennom flere bygningsdeler
- Legges til i initialFormData (~linje 590-området)

**2. Seksjon 3.10 UI (linje ~8200-8277)**
Erstatte den nåværende logikken som kun sjekker primær RK med:
- Beregne Tr-type per bygningsdel (samme `trapperomTypeMap` som i 3.5)
- Sammenligne Tr-typene på tvers av bygningsdeler
- **Hvis ulike krav**: Vise et spørsmål: "Går trapperommene gjennom flere bygningsdeler?"
  - **Ja**: Bruke det strengeste kravet (Tr 3 > Tr 2 > Tr 1) for alle trapperom
  - **Nei**: Vise krav per bygningsdel separat
- **Hvis like krav**: Ingen ekstra spørsmål, vise ett felles krav
- Oppdatere RK4-logikken til å også sjekke bygningsdeler (noen deler kan ha RK4, andre ikke)
- Vise per-del info i oppsummeringsboksen (likt 3.5-formatet)

**3. Rapport og Word-eksport**
- `KonseptPreview.tsx`: Oppdatere trapperom-raden i 3.10 til å vise per-del eller strengeste krav basert på `trapperomGarGjennomAlleDeler`
- `word-export-chapter3.ts`: Tilsvarende logikk i eksporten

### Filer som endres
1. `src/pages/Konsept.tsx` — formData + UI-logikk i seksjon 3.10
2. `src/components/konsept/KonseptPreview.tsx` — rapport-visning
3. `src/lib/word-export-chapter3.ts` — Word-eksport

### Teknisk detalj
Strengeste Tr-type beregnes med enkel rangering:
```text
Tr 3 (strengest) > Tr 2 > Tr 1 (mildest)
```
Samme `trapperomTypeMap` som allerede brukes i 3.5 gjenbrukes for konsistens.

