## Endring – BF85 brannventilasjon (røykventilasjon)

### Bakgrunn

I dag huker systemet automatisk av kravet "Brannventilasjon (Røykventilasjon)" når BF85-bygget har flere enn 2 etasjer, og checkboxen låses (`disabled`). Mange eldre bygg mangler dette, så den automatiske avhukingen må fjernes. Når brukeren ikke huker av (men kravet egentlig gjelder), skal det markeres som avvik. Selve vurderingen av avviket skrives i tilstandsvurderingen sist i kapittelet (eksisterende felt – ingen ny logikk der).

### 1. Fjern auto-checking i `src/pages/Konsept.tsx`

- Linjer 1226–1241 (`useEffect` som auto-legger/fjerner `bf85_royk_brannventilasjon`): Slettes helt. Brukeren bestemmer selv.
- Linje 6151–6186 (BF85-grenen i editoren):
  - Fjern `disabled={isAutoSet}` på checkboxen.
  - Fjern den blå "Automatisk satt basert på X etasjer"-meldingen.
  - Når `etasjer > 2` og checkbox **ikke** er huket av: vis et tydelig advarsels-/avvikspanel (f.eks. `border-l-2 border-destructive`, tekst i `text-destructive`):  
    > "Avvik: Bygg med flere enn 2 etasjer skal ha brannventilasjon i trapperom etter BF85 §78. Beskriv vurdering i tilstandsvurderingen nederst i kapittelet."
  - Behold hjelpeteksten/regelteksten ved siden av selve checkboxen.

### 2. Marker avvik i preview – `src/components/konsept/KonseptPreview.tsx`

Linje 2518–2566 (Røykkontroll-rad): Legg til ekstra rendering for BF85 når `etasjer > 2` og kravet **ikke** er aktivt (verken via `roykKontrollKravTekst` eller `roykKontrollKrav.includes("bf85_royk_brannventilasjon")`):

- Vis en egen rad i tabellen med samme venstrekolonne ("Brannventilasjon (Røykventilasjon)") og høyre "ARK/RIV", men midtcellen markert som avvik. Forslag til tekst:  
  > "Avvik: Bygget har flere enn 2 etasjer. Etter BF85 §78 skal trapperom ha brannventilasjon. Vurdering er beskrevet i tilstandsvurderingen i slutten av kapittelet."
- Cellen kan ha `text-destructive font-medium` for å skille seg ut.

Hvis kravet er huket av (eller fritekst er fylt ut), beholdes nåværende rendering uendret.

### 3. Word-eksport

`src/lib/word-export-chapter3.ts` har i dag ikke `bf85_royk_brannventilasjon` i `roykKravMap` (linje 717–727). Legg til:

- Map-oppføring `bf85_royk_brannventilasjon` med samme to varianter (over 8 / inntil 8 etasjer) som preview/editor bruker.
- Ny gate: når `formData.regelverk === "BF85"`, `etasjer > 2`, og kravet ikke er aktivt → render avvikslinjen i samme rad/format som preview.

### Det som ikke endres

- TEK17-røykkontroll-logikk.
- Tilstandsvurderingsfeltet sist i kapittelet (brukeren skriver vurderingen der manuelt – allerede støttet).
- Andre BF85-auto-krav.
