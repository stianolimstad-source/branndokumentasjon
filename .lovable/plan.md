## Plan: Flere etasjer for brannenergi i hele bygget

Jeg oppdaterer dokumentet «Lagring av brannfarlig stoff» slik at brannenergien for hele bygget kan beregnes med flere etasjer, på samme måte som salgslokalet. Samtidig må den eksisterende build-feilen i `Brensellagring.tsx` ryddes.

## Hva som endres

### 1. Fikse gjeldende build-feil

Det ligger fortsatt en JSX-strukturfeil rundt brannenergi-/kontrollseksjonene i `src/pages/Brensellagring.tsx`. Før funksjonsendringen fullføres rydder jeg opp i denne blokken slik at siden bygger igjen.

### 2. Erstatte enkeltfeltene for hele bygget med etasjer

Dagens felt:

```text
Byggets gulvareal (m²)
Byggets omhyllingsflate (m²)
```

endres til en etasjeliste for hele bygget:

```text
Etasje / bygningsdel
Lengde
Bredde
Høyde
```

Brukeren kan legge til og fjerne flere etasjer, for eksempel:

```text
1. etasje: 40 m x 25 m x 4 m
2. etasje: 35 m x 20 m x 3 m
Kjeller: 30 m x 18 m x 3 m
```

### 3. Beregne samlet areal og omhyllingsflate for hele bygget

For hver gyldige etasje beregnes:

```text
Gulvareal = lengde × bredde
Omhyllingsflate = 2 × (lengde × bredde) + 2 × (lengde × høyde) + 2 × (bredde × høyde)
```

Deretter summeres dette for hele bygget:

```text
Hele byggets gulvareal = sum gulvareal for alle etasjer
Hele byggets omhyllingsflate = sum omhyllingsflate for alle etasjer
```

Dette brukes bare for «Brannenergi i hele bygget».

### 4. Beholde salgslokalets egne etasjer uendret

Eksisterende etasjeliste for salgslokalet beholdes separat og brukes fortsatt kun til:

- brannenergi i salgslokalet
- vurdering av salgslokalets egne mål/areal

Det blir altså to uavhengige dimensjonsgrunnlag:

```text
Hele bygget
→ egne etasjer / mål
→ total mengde brannfarlig stoff

Salgslokalet
→ egne etasjer / mål
→ mengde utover DSB-veiledningen i salgslokalet
```

### 5. Bakoverkompatibel lagring

Eksisterende dokumenter med de gamle feltene håndteres slik:

- hvis nye bygningsetasjer finnes, brukes de
- hvis bare gamle enkeltfelt finnes, vises de som én konvertert etasje/arealgrunnlag der det lar seg gjøre
- gamle salgslokale-etasjer påvirkes ikke

Ingen databaseendring er nødvendig. Nye data lagres i eksisterende dokumentinnhold, for eksempel:

```ts
byggBrannenergiEtasjer: [
  { id, navn, lengde, bredde, hoyde }
]
```

### 6. Oppdatere rapport og Word-eksport

Rapportforhåndsvisningen og Word-eksporten oppdateres slik at «Brannenergi i hele bygget» viser:

- tabell med etasjer/bygningsdeler
- sum gulvareal
- sum omhyllingsflate
- total brannenergi for hele bygget
- spesifikk brannenergi mot grense fra brannkonsept

## Filer som endres

- `src/pages/Brensellagring.tsx`
  - fikse JSX/build-feilen
  - legge til egne etasjer for hele bygget
  - oppdatere lagring/lasting
  - oppdatere beregning og input-UI
  - sende nye data til preview og Word-eksport

- `src/components/brensellagring/BrensellagringPreview.tsx`
  - støtte flere etasjer for hele bygget
  - vise tabell og summer i rapporten

- `src/lib/brensellagring-word-export.ts`
  - støtte flere etasjer for hele bygget i Word-rapporten
  - bruke samme beregningsgrunnlag som forhåndsvisningen

## Resultat

Etter endringen kan hele bygget modelleres med flere ulike etasjer, samtidig som salgslokalet fortsatt har sitt eget separate arealgrunnlag:

```text
Brannenergi i hele bygget:
Total mengde + hele byggets etasjer/omhyllingsflate

Brannenergi i salgslokalet:
Mengde utover DSB + salgslokalets etasjer/omhyllingsflate
```