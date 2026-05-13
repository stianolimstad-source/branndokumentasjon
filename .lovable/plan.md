## Mål

I tilstandsvurderinger med BF85: erstatt det TEK17-baserte innholdet i kap. **3.10 og 3.11** med ett samlet BF85-kapittel basert på BF85 **§:7 Rømningsveg** (punktene :71–:75), uten henvisninger til andre BF85-kapitler. Hver paragraf får et fritekstfelt for vurdering.

## Omfang

Gjelder kun når `documentType === "tilstandsvurdering"` OG `regelverk === "BF85"`. TEK17-tilstandsvurderinger og ordinære brannkonsept er uendret.

## Endringer

### 1. Datamodell (`src/pages/Konsept.tsx`, init av `formData` ca. linje 815–830)

Fem nye fritekstfelt (default `""`):

- `bf85_romning_71_generelt: string`
- `bf85_romning_72_antall: string`
- `bf85_romning_73_bredde: string`
- `bf85_romning_74_golvbelegg: string`
- `bf85_romning_75_dor: string`

### 2. UI-struktur (`src/pages/Konsept.tsx`)

**Kap. 3.10 (linje 8848–9323):** Når BF85-tilstand, skjul hele dagens innhold (alle TEK17-baserte avhukinger som `boenhetKunEttTrapperom`, `lavtByggverkEnRomningsretning`, `romningsvinduRelevant`, `branncelleStortAntallPersoner`, `sporadiskOpphold`, `takterrasseRelevant`, trapperomslogikk osv.) og vis i stedet det nye BF85 §7-innholdet (se under). Eksisterende state-felter beholdes i datamodellen, de blir bare ikke renderet for BF85.

**Kap. 3.11 (fra linje 9324):** Når BF85-tilstand, skjul hele blokken (kollapser/header vises ikke) — alt rømnings-innhold ligger nå i 3.10.

**Headertittel for 3.10 i BF85-modus** endres til:
> «3.10 Rømningsveg (BF85 §7)»

**Innhold for 3.10 i BF85-modus** (kun fritekstfelt + faste regelavsnitt):

For hver av :71–:75 vises:
- Underoverskrift (f.eks. «§:71 Generelt»)
- Fast regelavsnitt (sitat fra BF85, omskrevet uten henvisninger til andre kapitler — særlig fjern «Se kap, 31 til 39» fra :72)
- `<Textarea>` koblet til tilhørende `bf85_romning_*`-felt med placeholder «Vurdering / observasjoner …»

Regelavsnitt (eksakt tekst i UI og rapport):

- **:71 Generelt** — «Rømningsveg skal på en oversiktlig måte føre til det fri uten lommer, retningsforandringer e.l. som kan hindre personer fra å komme ut under brann. Rømningsveg skal være egen branncelle. Heis og rulletrapp skal ikke regnes som rømningsveg. Rullebånd for personbefordring kan inngå i rømningsveg dersom det beveger seg i rømningsretningen eller stoppes automatisk ved brannalarm.»
- **:72 Antall rømningsveger** — «Antall rømningsveger er avhengig av bygningens bruk, antall etasjer og antall mennesker.» (henvisning til kap. 31–39 fjernes)
- **:73 Bredde i rømningsveg** — «Fri bredde i rømningsveg skal minst være 10 mm pr. person og ikke mindre enn 900 mm.»
- **:74 Golvbelegg** — «Golvbelegg skal være klasse G.»
- **:75 Dør i rømningsveg** — «Dør i rømningsveg i bygning skal slå ut i rømningsretningen. Dette krav gjelder ikke dør til boenhet. Dør skal utføres som angitt i Tabell 30:75. Kravene gjelder ikke for utgangsdør til det fri.»

### 3. Preview (`src/components/konsept/KonseptPreview.tsx`)

I 3.10-tabellen for BF85-tilstand: erstatt dagens TEK17-rader med fem rader (én per :71–:75) som viser regelavsnitt + brukerens fritekstvurdering (hvis utfylt). 3.11-blokken renderes ikke i BF85-tilstand.

### 4. Word-eksport (`src/lib/word-export-chapter3.ts`)

Tilsvarende: 3.10 i BF85-tilstand eksporterer fem avsnitt (overskrift + regeltekst + vurdering). 3.11 hoppes over for BF85.

### 5. Innholdsfortegnelse / sidebar

I `previewSections`/innholdsfortegnelsen (linje 1577–1578 og 1980–1981): når BF85-tilstand, fjern «3.11 Rømningsvei» og endre etiketten for «3.10» til «3.10 Rømningsveg (BF85 §7)».

## Akseptansekriterier

- BF85-tilstandsvurdering viser kun BF85 §:71–:75 i kap. 3.10, med fritekstfelt per punkt.
- Kap. 3.11 vises ikke for BF85-tilstand (verken i editor, preview, sidebar eller Word).
- Ingen henvisninger til «kap. 31–39» eller andre BF85-kapitler i regeltekstene.
- TEK17-tilstand og brannkonsept er uendret — alle eksisterende TEK17-felter og logikk i 3.10/3.11 beholdes for de modusene.
