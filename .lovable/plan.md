## Endring: Fjern Kap. 30:63 fra BF85-tabellen i rapporten

Bakgrunn: Teksten «Kap. 30:63 – Branncelleinndeling» vises nå øverst på inputsiden (før valg av brannceller). Raden i rapporttabellen under «BF85 branncellekrav – bygningsbrannklasse 1» (og 2–4) er dermed overflødig og skal fjernes.

### Endringer

**`src/components/konsept/KonseptPreview.tsx`**
- Fjern `<tr>`-blokken for «Kap. 30:63 – Branncelleinndeling» (ca. linje 1694–1714).
- Forenkle `bf85KravMap` til kun å inneholde `tekniskeRom`, siden `branncellebegrensende` og `dorKrav` ikke lenger brukes i tabellen.
- Øvrige rader i tabellen (Tekniske rom, Loft/kjeller, Takflater) beholdes uendret.

### Hva endres ikke
- Tekstblokken øverst på inputsiden (`src/pages/Konsept.tsx`, linje ~4949) beholdes.
- Word-eksport (rendres fra preview-HTML) får automatisk endringen.