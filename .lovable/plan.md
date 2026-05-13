## Mål
For BF85-tilstandsvurderinger i kapittel 3.7: gi brukeren en checkbox for om ventilasjonsanlegg er relevant. Dersom denne ikke hukes av, skal rapporten/preview vise at ventilasjonsanlegg ikke er installert.

## Endringer

### 1. `src/pages/Konsept.tsx` – inputskjema, BF85-grenen i 3.7 (~linje 7383–7398)
- Legg til en `ventilasjonRelevant`-checkbox i BF85-grenen (i dag finnes denne kun i TEK17-grenen).
- Når `ventilasjonRelevant` er true, vis toggle-alternativene `ventKrav5`–`ventKrav9` (samme som TEK17-grenen allerede har).
- `:1332 Avtrekk`-checkbox beholdes uendret.

### 2. `src/components/konsept/KonseptPreview.tsx` – preview, BF85-grenen i 3.7 (~linje 3807–3841)
- Når `formData.ventilasjonRelevant` er false og regelverk er BF85: legg til en tabellrad:
  - Forhold: «Ventilasjonsanlegg»
  - Løsning: «Ventilasjonsanlegg er ikke installert.»
  - Ansvar: «RIV»
- Når `ventilasjonRelevant` er true: behold eksisterende TEK17-baserte kravliste (allerede implementert).
- `:1332 Avtrekk`-rad beholdes uendret.

### 3. `src/lib/word-export-chapter3.ts` – Word-eksport, seksjon 3.7 (~linje 1158–1178)
- Etter dagens `if (formData.ventilasjonRelevant)`-blokk, legg til en `else if`-gren:
  - Hvis `!formData.ventilasjonRelevant && formData.regelverk === "BF85"`: legg til en rad med «Ventilasjonsanlegg» / «Ventilasjonsanlegg er ikke installert.» / «RIV».

## Tekniske detaljer
- Ingen nye state-felt nødvendig – `ventilasjonRelevant` eksisterer allerede.
- Påvirker både `/konsept` og `/tilstandsvurdering` (samme komponent).
- Word-eksport følger preview-strukturen.
