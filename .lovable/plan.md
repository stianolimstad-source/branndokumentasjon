## Mål
Legge til et kommentar-felt for alle tilstandsvurderinger slik at brukeren kan dokumentere vurderingen også når det ikke er funnet avvik (TG 0).

## Endringer

### 1. `src/components/konsept/TilstandsvurderingPanel.tsx`
- Legge til `kommentar?: string` i `TilstandData`-interface.
- Oppdatere `emptyTilstand()` med `kommentar: ""`.
- Legge til et `<Textarea>`-felt for kommentar som alltid er synlig, plassert over kategoriene (tiltak/fravik) og under TG 0-infoboksen.
- Feltet skal ha label «Kommentar til tilstanden» og placeholder som indikerer at det er valgfritt.

### 2. `src/components/konsept/KonseptPreview.tsx`
- Legge til `kommentar?: string` i `TilstandData`-interface (egen kopi i denne filen).
- I `TilstandTableRow`: vise kommentar-teksten når `data.kommentar` finnes, også ved `ingenAvvik`. Plasseres under TG 0-boksen eller som egen seksjon i tilstandsbåndet.
- Oppdatere `tilstandHasContent()` og `tilstandIsActive()` til å sjekke `!!data.kommentar`, slik at en kommentar alene gjør at tilstandsvurderingen vises.

### 3. `src/lib/word-export-chapter3.ts`
- I `tilstandRow()`: etter «Det er ikke funnet noen avvik»-blokken, sjekke `tilstandData.kommentar` og rendre den som et vanlig avsnitt før kategoriene.
- Kommentar rendres også når avvik finnes (etter TG 0-meldingen, før kategori-blokkene).

## Akseptansekriterier
- Tekstfelt for kommentar vises i alle tilstandsvurderingspaneler (kap. 3.1–3.14 for TEK17, 3.1–3.13 for BF85).
- Kommentaren er synlig i forhåndsvisning selv når tilstandsgrad er TG 0 og ingen avvik er registrert.
- Kommentaren eksporteres med i Word-eksporten.
- Eksisterende tilstandsvurderinger uten kommentar fungerer uendret (bakoverkompatibel).
