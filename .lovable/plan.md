## Endring: Fjern duplisert Kap. 30:63 fra BBK-boksen, gjeninnsett i rapport

Bakgrunn: Kap. 30:63 vises i dag både øverst på inputsiden (riktig plassering) OG inne i den blå «BF85 branncellekrav – Bygningsbrannklasse 1»-boksen midt på siden (duplikat). Den skal fjernes fra boksen, men teksten skal fortsatt komme frem i starten av Kap. 3.5 i rapporten.

### Endringer

**`src/pages/Konsept.tsx`** (ca. linje 5053–5067)
- Fjern hele `{/* :63 Branncelleinndeling – alltid synlig */}`-blokken fra BBK-krav-boksen. Boksen beholder Kap. 30:33, 30:64 og 30:65.

**`src/components/konsept/KonseptPreview.tsx`** (ca. linje 1686–1696)
- Gjeninnsett Kap. 30:63-raden som første rad i BF85-tabellen i Kap. 3.5.
- Utvid `bf85KravMap` til å inneholde `branncellebegrensende` og `dorKrav` igjen (per BBK 1–4) i tillegg til `tekniskeRom`.
- Rad: «Kap. 30:63 – Branncelleinndeling» / innledningstekst + tre kulepunkter (samme tekst som vises på inputsiden) / «ARK/RIBr».

### Hva endres ikke
- Tekstblokken øverst på inputsiden beholdes.
- Word-eksport (rendres fra preview) får automatisk endringen.
- Øvrige rader (Tekniske rom, Loft/kjeller, Takflater) uendret.