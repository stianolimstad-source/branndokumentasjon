## Fjern «over 3 plan»-fravik fra rapport

Sjekkboksen og advarselen på innputsiden beholdes. Fravik-teksten skal kun fjernes fra forhåndsvisningen og Word-eksporten – brukeren beskriver dette selv i tilstandsvurderingen på slutten av kapittelet.

### Endringer

**1. `src/components/konsept/KonseptPreview.tsx`** (rad «Brannceller over flere plan»)
- Fjern blokken `{formData.branncellerFlerePlanOver3 && (...)}` som ble lagt til i forrige iterasjon.

**2. `src/lib/word-export-chapter3.ts`** (samme rad)
- Fjern `if (formData.branncellerFlerePlanOver3) { lines.push(...) }`-grenen.
- Tilbakestill `if`-betingelsen til `formData.branncellerFlerePlanRelevant && branncellerFlerePlanKrav.length > 0` (slik den var før), siden raden ikke lenger trenger å rendres når det kun er over3 som er satt.

### Det som ikke endres

- Sjekkboksen «Branncellen strekker seg over flere enn 3 plan» og den røde varselboksen i `Konsept.tsx` beholdes som i dag.
- `formData.branncellerFlerePlanOver3` beholdes i datamodellen (brukes fortsatt for UI-varselet).
