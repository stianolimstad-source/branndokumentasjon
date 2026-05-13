## Mål

Utvide BF85 kapittel 3.9 «Tiltak for å påvirke rømnings- og redningstider» med to nye regler i tillegg til dagens skole-spesifikke `:16 Brannalarmanlegg`:

1. **Kontorbygg – risikobasert brannalarm:** «Det er ikke krav til brannalarmanlegg, men for kontor der hvor det kreves (risikobasert) skal brannalarmen varsle alle.»
2. **Industribygg – automatisk slokkeanlegg:** «Det kreves automatisk slokkeanlegg i industribygg som er åpen i flere plan med et samlet areal over 800 m².»

Reglene skal kun vises for BF85-prosjekter, og kun når bygningstypen er relevant (kontor / industri).

## Endringer

### 1. `src/pages/Konsept.tsx` – BF85-skjema (kap. 3.9, ca. linje 8001–8026)

Etter dagens skole-blokk (`:16 Brannalarmanlegg` + sprinkler) legges det til to nye betingede blokker:

**A. Kontor – risikobasert brannalarm**
- Vises når `formData.regelverk === "BF85"` og bygningstype (på prosjekt eller minst én bygningsdel) inneholder «kontor».
- Ny checkbox `bf85_39_kontor_brannalarm` (boolean, default `false`):
  - Label: *«Risikobasert krav til brannalarm (kontor): Det er ikke generelt krav til brannalarmanlegg i kontorbygg etter BF85, men der det kreves ut fra risikovurdering skal brannalarmen varsle alle i bygget.»*
- Ingen fri tekst – ren toggle.

**B. Industri – automatisk slokkeanlegg**
- Vises når `formData.regelverk === "BF85"` og bygningstype inneholder «industri».
- Hjelpetekst (italic, muted) over checkbox: *«BF85 krever automatisk slokkeanlegg i industribygg som er åpne over flere plan med samlet areal > 800 m².»*
- Ny checkbox `bf85_39_industri_slokkeanlegg` (boolean):
  - Label: *«Automatisk slokkeanlegg (industribygg, åpen flere plan, samlet areal > 800 m²)»*
- Auto-forslag: Når bygningsdata oppfyller (etasjer > 1 OG bra > 800), vises et varsel («ℹ︎ Bygget oppfyller kriteriene – kravet bør avhukes») – men endelig valg ligger hos bruker (BF85 har ikke automatisk åpen/lukket-detektor). Ingen tvunget toggle, ingen fravik-blokk.

Begge plasseres inne i den eksisterende BF85-`<div className="p-3 bg-muted/50 ...">`-boksen (eller i en parallell boks rett under, slik at skole-spesifikke felter forblir gated på «skole»).

### 2. `src/components/konsept/KonseptPreview.tsx` – BF85-tabellen i 3.9 (ca. linje 4106–4123)

Etter dagens to BF85-rader (`bf85_16_brannalarmanlegg`, `bf85_sprinkler_installert`) legges to nye betingede rader:

```
{isBF85 && formData.bf85_39_kontor_brannalarm && (
  <tr>
    <td>Brannalarm – kontor (risikobasert)</td>
    <td>Det er ikke generelt krav til brannalarmanlegg etter BF85. For kontorbygg
        der brannalarm kreves ut fra risikovurdering skal alarmen varsle alle
        personer i bygget.</td>
    <td>RIE</td>
  </tr>
)}
{isBF85 && formData.bf85_39_industri_slokkeanlegg && (
  <tr>
    <td>Automatisk slokkeanlegg – industri</td>
    <td>Industribygg som er åpne over flere plan med samlet areal > 800 m²
        skal ha automatisk slokkeanlegg.</td>
    <td>RIV</td>
  </tr>
)}
```

### 3. `src/lib/word-export-chapter3.ts` – Word-eksport (rundt linje 1357 / BF85-grenen i 3.9)

Speile preview-radene i Word-eksporten. I den eksisterende BF85-blokken for 3.9 (etter `bf85_16_brannalarmanlegg` og sprinkler) legges:

- `if (formData.bf85_39_kontor_brannalarm) rows.push(contentRow("Brannalarm – kontor (risikobasert)", "...", "RIE"));`
- `if (formData.bf85_39_industri_slokkeanlegg) rows.push(contentRow("Automatisk slokkeanlegg – industri", "...", "RIV"));`

Samme tekst som i preview, ingen tilleggsformatering.

### 4. Datamodell

To nye boolske felter i `formData`-typen som brukes i Konsept-skjemaet:

- `bf85_39_kontor_brannalarm: boolean` (default `false`)
- `bf85_39_industri_slokkeanlegg: boolean` (default `false`)

Initialiseres som `false` der `formData` settes opp / persist‐lastes (samme sted som dagens `bf85_16_brannalarmanlegg`).

## Akseptansekriterier

- BF85 + bygningstype «kontor»: Ny checkbox vises i 3.9. Avhuket → ny rad i preview og Word-rapport.
- BF85 + bygningstype «industri»: Ny checkbox vises i 3.9 (med 800 m²/flere plan-hjelpetekst). Avhuket → ny rad i preview og Word-rapport. Når bygget faktisk har > 1 etasje og bra > 800 m² vises en informativ påminnelse om at kravet bør være på.
- TEK17-prosjekter: Ingen UI- eller rapport-endring.
- BF85-skole-blokken (`:16 Brannalarmanlegg`, sprinkler) er uendret.
- Ingen endring i andre kapitler eller eksisterende felter.

## Spørsmål til avklaring

1. Skal industri-kravet auto-aktiveres (forhåndsavhuket) når etasjer > 1 og bra > 800, eller alltid kreve manuell avhuking med info-varsel? Planen over bruker «manuell + info-varsel». Ok?
2. Skal kontor-checkboxen også vises for bygninger med kombinert bruk (f.eks. «kontor/lager») – dvs. matche delstreng «kontor» hvor som helst i bygningstypen? Planen forutsetter ja.