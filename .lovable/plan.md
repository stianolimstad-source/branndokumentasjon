## Mål
Legg til kraftstasjon-spesifikt krav om at dører til og i rømningsvei alltid skal slå ut i rømningsretning, i kapitlet om rømningsvei i tilstandsvurderinger (både TEK17 og BF85). For BF85 erstatter dette teksten i §:75 når valgt bygningstype/bygningsdel er Kraftstasjon.

## Detektering
Bruk samme mønster som ellers i koden:
```ts
const erKraftstasjon =
  (formData.bygningstype || "").toLowerCase().includes("kraftstasjon")
  || (formData.bygningsdeler || []).some((d: any) =>
       (d.bygningstype || "").toLowerCase().includes("kraftstasjon"));
```

## Ny tekst (kraftstasjon)
> "Dører til og i rømningsvei skal alltid slå ut i rømningsretning. Dette gjelder uavhengig av persontallet som skal evakuere via denne utgangen."

## Endringer

### 1) BF85 tilstand 3.10 – §:75 erstattes for kraftstasjon
Filer: `src/pages/Konsept.tsx`, `src/components/konsept/KonseptPreview.tsx`, `src/lib/word-export-chapter3.ts`

Alle tre stedene definerer i dag samme `{ id: "75", title: "§:75 Dør i rømningsveg", field: "bf85_romning_75_dor", text: "..." }` rad. Endre `text` (og evt. `title` til "§:75 Dør i rømningsveg – kraftstasjon") dynamisk når `erKraftstasjon` er true, slik at den nye teksten over vises som §:75-grunnlaget. Felt-id (`bf85_romning_75_dor`) beholdes så lagrede vurderinger ikke mistes.

### 2) TEK17 tilstand 3.11 (§ 11-14 Rømningsvei) – tilleggskrav for kraftstasjon
Filer: `src/pages/Konsept.tsx` (skjema rundt linje 9388–9591), `src/components/konsept/KonseptPreview.tsx` (3.11-blokken), `src/lib/word-export-chapter3.ts` (3.11-eksporten).

- Skjema: Vis et `KraftstasjonTilleggskravCard` (samme komponent brukt i 3.5/3.7) under listen over automatisk-inkluderte krav i 3.11 når `erKraftstasjon` er true, med kapittel "3.11" og en `<li>` som lister den nye dør-regelen. Dette gjør den synlig for både TEK17-tilstand og brannkonsept (3.11-blokken er felles), uten å endre BF85-grenen som har sin egen behandling i 3.10.
- Listen "Følgende krav er automatisk inkludert i rapporten" (TEK17-grenen, ca. linje 9547–9561): legg til `<li>` "Dører til og i rømningsvei slår alltid ut i rømningsretning (kraftstasjon, uavhengig av persontall)" når `erKraftstasjon`.
- KonseptPreview.tsx: i tilsvarende 3.11-rendringsblokk, legg til samme punkt i den automatiske kravslisten når `erKraftstasjon`.
- word-export-chapter3.ts: i 3.11-seksjonen, push en ny `contentRow("Dører i rømningsvei – kraftstasjon", "Dører til og i rømningsvei skal alltid slå ut i rømningsretning. Dette gjelder uavhengig av persontallet som skal evakuere via denne utgangen.", "ARK")` når `erKraftstasjon`.

### 3) Avgrensning
- Ingen nye datafelt; ingen migrering nødvendig.
- BF85 brannkonsept (ikke tilstand) bruker §:75-listen samme sted, så endringen slår automatisk inn også der når kraftstasjon er valgt – konsistent med ønsket regel.
- Eksisterende underliggende kraftstasjon-krav (panikkbeslag, dør med vindu, dør til høyspenningsrom, utadslående dør til teknisk rom) berøres ikke.

## Akseptkriterier
- BF85-tilstand 3.10 viser ny tekst i §:75-raden når kraftstasjon er valgt; ellers uendret.
- TEK17-tilstand 3.11 viser et tydelig kraftstasjon-tilleggskravkort med dør-regelen, og samme regel kommer med i forhåndsvisning og Word-eksport.
- Ingen endring for andre bygningstyper.