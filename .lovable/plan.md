## Mål

Når `documentType === "tilstandsvurdering"` OG `regelverk === "BF85"`: siden 3.10 og 3.11 er slått sammen til ett kapittel (3.10 Rømningsveg BF85 §7), skal de etterfølgende kapitlene i kap. 3 forskyves med ett nummer:

| TEK17-nr | BF85-tilstand-nr | Tema |
|---|---|---|
| 3.12 | 3.11 | Tilrettelegging for redning av husdyr |
| 3.13 | 3.12 | Tilrettelegging for manuell slokking |
| 3.14 | 3.13 | Tilrettelegging for rednings- og slokkemannskap |

TEK17-tilstand og brannkonsept beholder dagens nummerering.

## Endringer

### 1. `src/components/konsept/KonseptPreview.tsx`

- **Innholdsfortegnelse for BF85-tilstand** (linje ~533–538 / ~564–569): vis kun ett rømnings-kapittel («3.10 Rømningsveg (BF85 §7)») og renumrer husdyr→3.11, manuell slokking→3.12, slokkemannskap→3.13. TEK17-listen er uendret.
- **Tabell-headere i preview** (kap. 3.12/3.13/3.14, linjene rundt 5340 og videre): når BF85-tilstand, vis `{sp}.11`, `{sp}.12`, `{sp}.13` i stedet for `.12/.13/.14` i overskriftsraden. Selve innholdsradene er uendret.
- **Tilstandsrad-etiketter** (`TilstandTableRow sectionLabel=...`): oppdater visningstekst for husdyr/manuell/slokkemannskap til «3.11 …», «3.12 …», «3.13 …» når BF85-tilstand. Datalageret (`tilstandsvurderinger["3_12"]` osv.) beholdes uendret — kun visningsetiketten endres.

### 2. `src/lib/word-export-chapter3.ts`

- `sectionHeaderRow(...)` for kap. 3.12, 3.13, 3.14 (linjene ~1719, 1735, og husdyr-headeren over): legg til BF85-tilstand-gren som skriver «3.11 …», «3.12 …», «3.13 …» (henholdsvis husdyr / manuell slokking / rednings- og slokkemannskap, uten §-referanser slik vi allerede gjør for BF85).
- Tilsvarende for `tilstandRow(...)`-etikettene (linje ~1733, ~1755 og husdyr): bruk de nye numrene i BF85-tilstand-modus.

### 3. `src/pages/Konsept.tsx`

- `previewSections`/sidebar (linje ~1577–1578 og ~1980–1981 området, og kap. 3.12–3.14 oppføringer): når BF85-tilstand, renumrer sidebar-etiketter for husdyr/manuell/slokkemannskap til 3.11/3.12/3.13. Anchor-IDer (f.eks. `#kap-3-12`) beholdes — kun visningstekst endres for å unngå brutte interne lenker.
- Editor-overskriftene for de tre kapitlene: vis `3.11`/`3.12`/`3.13` når BF85-tilstand, ellers uendret.

## Tekniske detaljer

- Ingen endringer i datamodellen eller nøklene (`3_12`, `3_13`, `3_14` beholdes som interne nøkler/anker — bare label-strenger oppdateres).
- All renumrering skjer kun bak `documentType === "tilstandsvurdering" && regelverk === "BF85"`-vakt. TEK17 og brannkonsept er uendret.
- Ingen endringer i RLS, datalagring, ruter eller backend.

## Akseptansekriterier

- BF85-tilstand viser i editor, sidebar, innholdsfortegnelse, preview-tabell og Word-eksport: 3.10 Rømningsveg (BF85 §7) → 3.11 Husdyr → 3.12 Manuell slokking → 3.13 Slokkemannskap. Ingen «3.14» og ingen separat «3.11 Rømningsvei».
- TEK17-tilstand og brannkonsept beholder dagens nummerering 3.10–3.14 uendret.
- Eksisterende tilstandsvurderingsdata under nøklene `3_12`/`3_13`/`3_14` vises fortsatt korrekt under sine nye numre.
