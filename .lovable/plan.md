## Endringer

### 1. `src/pages/Konsept.tsx`
- Linje 11141–11151: Fjern hele `<label>`-blokken (avkrysningsboksen «Inkluder referansetabeller i rapport» og tilhørende `title`-tekst). Behold `Last ned Word`-knappen og kollaps `flex flex-col`-wrapperen til bare knappen.
- Linje 577: Behold `inkluderReferansetabeller: false` i `formData`-init, men legg til kommentar:  
  `// @deprecated – referansetabeller vises kun i editor-collapsibles, aldri i preview/Word.`
- Linje 9470 (og andre tilsvarende collapsible-triggere i kap 3 som åpner referansetabeller for arbeidet): endre etiketten til  
  «Vis full referansetabell (kun i editor)».  
  Søk gjennom hele filen etter alle Collapsible-triggere som åpner referansetabell-innhold og bruk samme tekst.

### 2. `src/components/konsept/KonseptPreview.tsx`
Fjern all `formData.inkluderReferansetabeller`-gatet rendering på linjene 1496, 2123, 3304, 4048, 4906, 5443. Slett selve `{formData.inkluderReferansetabeller && ...}`-uttrykkene (inkl. IIFE-blokkene på 4048 og evt. 4906/5443) slik at preview aldri rendrer referansetabeller.

Rydd opp imports på linje 6: fjern de symbolene som ikke lenger brukes (`referanseBaereevne`, `referanseSeksjonering`, `referanseBrannceller`, `getMaterialerReferanseTabell`, `ReferanseTabell`). Hvis `ReferanseTabellRow`-komponenten bare ble brukt av disse blokkene, fjern også definisjonen.

### 3. `src/lib/word-export-chapter3.ts`
Fjern alle if-grener som sjekker `formData.inkluderReferansetabeller` (linjene 513, 695, 1075, 1315, 1725, 1827, 1959). Word-eksporten skal aldri produsere referansetabell-rader.

Rydd opp imports på linje 6 og `referanseTabellRow`-helperen (linje ~138) hvis den ikke lenger brukes.

### 4. Beholdes
- `formData.inkluderReferansetabeller` (default `false`) som deprecated felt – kompatibilitet for eksisterende lagrede prosjekter.
- Alle editor-Collapsibles i kap 3 som viser referansetabeller som arbeidsverktøy.
- Den eksisterende konditionelle hovedteksten (kun det som gjelder prosjektets BKL/RK).
- `src/lib/tek17/referansetabeller.ts` (brukes fortsatt av editor-collapsibles).

## Testkriterier
1. Åpne et brannkonsept → avkrysningsboksen i kap 1 er borte.
2. Klikk «Vis full referansetabell (kun i editor)» under en §-seksjon → tabellen åpnes som hjelp i editoren.
3. Forhåndsvisning viser kun det aktuelle kravet, ingen referansetabeller.
4. Word-nedlasting inneholder ingen referansetabeller.
5. Samme oppførsel for `documentType === "tilstandsvurdering"`.

## Filer som endres
- `src/pages/Konsept.tsx`
- `src/components/konsept/KonseptPreview.tsx`
- `src/lib/word-export-chapter3.ts`
