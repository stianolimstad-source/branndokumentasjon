## Plan: Riktig rekkefølge og eget areal for brannenergi i hele bygget

Jeg oppdaterer dokumentet «Lagring av brannfarlig stoff» slik at inputtsiden følger samme rekkefølge som rapporten, og slik at beregningen for hele bygget ikke lenger bruker salgslokalets areal.

## Hva som endres

### 1. Bytte rekkefølge på inputtsiden

I dag kommer:

```text
Brannenergi i salgslokalet
Brannenergi i hele bygget
```

Jeg bytter dette til:

```text
Brannenergi i hele bygget
Brannenergi i salgslokalet
```

Dette gjør at inputtsiden samsvarer med rapportrekkefølgen.

### 2. Eget areal/dimensjonsgrunnlag for hele bygget

Jeg legger til et separat arealgrunnlag for «Brannenergi i hele bygget», uavhengig av etasjene/målene som brukes for salgslokalet.

Ny input i seksjonen «Brannenergi i hele bygget»:

```text
Areal / omhyllingsflate for hele bygget
```

Med egne felt for hele bygget, for eksempel:

- Byggets gulvareal (m²)
- Byggets omhyllingsflate (m²)

Dette brukes bare til beregningen for hele bygget.

### 3. Beholde eksisterende salgslokaleareal

Eksisterende etasje-/målskjema beholdes for «Brannenergi i salgslokalet» og presiseres som:

```text
Innvendige mål for salgslokalet
```

Dette arealet skal fortsatt brukes til:

- brannenergi i salgslokalet
- overskridelsesvurdering mot DSB sine mengder for salgslokale, der relevant

### 4. Oppdatere beregningslogikken

Etter endringen blir logikken:

```text
Brannenergi i hele bygget
→ bruker total mengde brannfarlig stoff
→ bruker eget gulvareal og egen omhyllingsflate for hele bygget
→ sammenlignes mot grense fra brannkonsept

Brannenergi i salgslokalet
→ bruker mengde utover DSB-veiledningen i salgslokalet
→ bruker salgslokalets mål/areal
```

Dette hindrer at brannenergien for hele bygget feilaktig beregnes med salgslokalets areal.

## Rapport og Word-eksport

Jeg oppdaterer også rapportforhåndsvisning og Word-eksport slik at «Brannenergi i hele bygget» bruker det nye bygningsarealet/omhyllingsflaten.

Rapporten vil fortsatt vise «Brannenergi i hele bygget» før «Brannenergi i salgslokalet».

## Lagring

Ingen databaseendring er nødvendig. Nye felt lagres i eksisterende dokumentinnhold, for eksempel:

```ts
byggBrannenergiGulvarealM2
byggBrannenergiOmhyllingsflateM2
```

Eksisterende dokumenter håndteres bakoverkompatibelt:

- gamle dokumenter åpnes som før
- hvis de nye bygningsarealene mangler, vises feltene tomme
- salgslokalets eksisterende mål beholdes uendret

## Filer som endres

- `src/pages/Brensellagring.tsx`
  - flytte «Brannenergi i hele bygget» før «Brannenergi i salgslokalet»
  - legge til egne arealfelt for hele bygget
  - lagre/laste de nye feltene
  - bruke riktig arealgrunnlag i beregningen
  - sende de nye verdiene til forhåndsvisning og Word-eksport

- `src/components/brensellagring/BrensellagringPreview.tsx`
  - bruke hele byggets egne arealer i beregningen for «Brannenergi i hele bygget»
  - beholde salgslokalets mål i beregningen for «Brannenergi i salgslokalet»

- `src/lib/brensellagring-word-export.ts`
  - bruke hele byggets egne arealer i Word-rapportens beregning
  - sikre samme beregningsgrunnlag som forhåndsvisningen

## Resultat

Etter endringen blir dokumentet faglig tydeligere:

```text
Hele bygget:
Total mengde + hele byggets areal/omhyllingsflate

Salgslokalet:
Mengde utover DSB-veiledningen + salgslokalets areal/omhyllingsflate
```