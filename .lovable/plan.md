## Mål
Legge til et fritt kommentarfelt under 2.1 Bygningsinformasjon (både brannkonsept og tilstandsvurdering, TEK17 og BF85). Teksten skal vises i forhåndsvisningen og i Word-eksporten rett under selve bygningsdata-tabellen.

## Endringer

### 1. `src/pages/Konsept.tsx`
- Legg til `bygningsinfoKommentar: ""` i `formData`-state (ved siden av `etasjerUnderBakken`).
- I bygningsdata-skjemaet (under "Hvorav under bakken"-feltet, ca. linje 3112–3160), legg til en `Textarea` med label "Kommentar / utfyllende informasjon" – `rows={3}`, placeholder f.eks. "Frivillig: kort utfyllende info som tas med under tabellen i rapporten".
- Gjelder uavhengig av om det er TEK17 eller BF85 (feltet ligger på toppnivå i samme seksjon).

### 2. `src/components/konsept/KonseptPreview.tsx`
- Rett under hver av de tre bygningsdata-tabellene under 2.1 (linje 558, 613/623, 740), legg til:
  ```
  {formData.bygningsinfoKommentar && (
    <p className="text-xs whitespace-pre-wrap mb-3">{formData.bygningsinfoKommentar}</p>
  )}
  ```
- Vises ikke når feltet er tomt.

### 3. `src/lib/word-export-chapter3.ts`
- I de tre Word-tabell-blokkene som genererer 2.1-tabellene, legg til en `Paragraph` rett etter tabellen som skriver ut `formData.bygningsinfoKommentar` (kun hvis satt). Bruk samme stil som annen brødtekst i kapittelet.

Ingen endringer i beregninger eller annen logikk.

## Filer som endres
- `src/pages/Konsept.tsx`
- `src/components/konsept/KonseptPreview.tsx`
- `src/lib/word-export-chapter3.ts`
