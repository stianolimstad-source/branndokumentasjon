## Mål
Legg til automatisk innhold i kap. 3.7 (Tekniske installasjoner) for kraftstasjoner i både brannkonsept og tilstandsvurdering — for både TEK17 og BF85.

## Tekst som skal legges til

**Underoverskrift:** "Rom for høyspenningsanlegg"

**Innhold:**
> Foran spenningsførende deler i apparatanlegg skal det anbringes dør, plate eller lignende beskyttelse, (jf. FEA-F § 39).

**Ansvar:** RIE

## Hvor

### 1. `src/components/konsept/KonseptPreview.tsx` (kap. 3.7)
Legg til en ny `<tr>`-rad i 3.7-tabellen, conditional på `erKraftstasjon` (samme helper-mønster: sjekker `bygningstype` og `bygningsdeler`). Vises uavhengig av TEK17/BF85. Tilstandsvurdering bruker samme komponent, så endringen dekker begge.

### 2. `src/lib/word-export-chapter3.ts` (kap. 3.7)
Speil samme rad i Word-eksport.

## Filer som endres
- `src/components/konsept/KonseptPreview.tsx`
- `src/lib/word-export-chapter3.ts`

Ingen nye form-felt — utløses automatisk av kraftstasjon-bygningstype.
