## Visuell oppgradering av tilstandsvurderingen i rapporten

### Bakgrunn
I dag rendres tilstandsvurderingen som én lysegul rad nederst i hvert kapittel-tabell, med liten tekst (10 px) og en enkel brun overskrift. Den drukner i tabellen.

### Endringer – HTML-forhåndsvisning (`KonseptPreview.tsx`, `TilstandTableRow` + `KategoriBlokk`)

1. **Tydelig header-bånd**
   - Eget gult bånd øverst i raden med mørkere bakgrunn (`#FCD34D`) og mørkere brun tekst (`#78350F`)
   - Større tittel: «TILSTANDSVURDERING» i 12 px / 700, etterfulgt av seksjonslabel i normal vekt
   - Samlet TG vises som "pille"/badge til høyre i båndet (farget etter grad)

2. **Innhold med mer luft**
   - Lys gul innholds-bakgrunn (`#FEF3C7`) beholdes
   - Tekststørrelse heves fra 10 → 11 px for beskrivelse, 11 px / 600 for avvik-overskrift
   - Mer padding (12 px i stedet for 8 px)

3. **Kategori-blokker som "kort"**
   - Hver kategori ("Aktive tiltak" / "Fraviksbehandles") får hvit bakgrunn, rundede hjørner, 1 px kant i kategorifargen og 4 px venstre stripe
   - Kategori-tittel som mini-header med farget bakgrunn

4. **Avvik som badge-rader**
   - "Avvik N" vises som rund badge i kategorifargen, med TG-badge ved siden i fargen til den graden (grønn/gul/oransje/rød)
   - Beskrivelse i normalvekt under

### Endringer – Word-eksport (`word-export-chapter3.ts`, `tilstandRow`)

Word kan ikke gjøre alt det samme, men kan etterligne uttrykket:

1. **Header-paragraf** med solid gul shading (`FCD34D`), bold 22-pt tekst og seksjonslabel
2. **Samlet tilstandsgrad** vises som egen paragraf med solid fargeshading bak gradlabel
3. **Kategori-overskrifter** får solid shading (lys rød / lys oransje) og 22-pt bold tekst
4. **Avvik-overskrifter** beholdes, men "Avvik N – TG X" får farget shading bak hele linjen i kategorifargen
5. Litt mer `spacing.before/after` mellom blokkene

### Tekniske detaljer
- Filer: `src/components/konsept/KonseptPreview.tsx` (linjer ~96–144), `src/lib/word-export-chapter3.ts` (linjer ~225–317)
- Ingen endring i datastruktur eller logikk — kun visuell rendering
- Innput-siden (`TilstandsvurderingPanel.tsx`) endres ikke

### Resultat
Tilstandsvurderingen blir et tydelig, "merket" felt i både PDF-forhåndsvisning og Word-rapport, slik at lesere umiddelbart ser at dette er en formell vurdering med tilhørende avvik.