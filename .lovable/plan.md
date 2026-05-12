## Problem

I kap. 3.5 ("Brannceller") for BF85-konsepter vises ikke radene "Dørkrav (Tabell 30:75)" i rapporten, selv når brukeren har huket av dører under "Dører i branncellebegrensende konstruksjoner".

Årsaken er i `src/components/konsept/KonseptPreview.tsx` linje 2043:

```ts
formData.dorPlasseringer.length > 0 && (formData.brannklasse || (harFlereRisikoklasser && bygningsdeler.length > 0))
```

`formData.brannklasse` er et TEK17-felt. BF85 bruker `formData.bygningsbrannklasse`, som ikke inngår i betingelsen — derfor faller hele dørkrav-blokken bort for BF85.

I tillegg ønsker brukeren et nytt valg "Branncelle – branncelle" i listen over dørplasseringer for BF85.

## Endring

### 1. `src/components/konsept/KonseptPreview.tsx` (linje 2043)

Utvid render-betingelsen slik at BF85 også kvalifiserer:

```ts
formData.dorPlasseringer?.length > 0 && (
  formData.brannklasse ||
  formData.bygningsbrannklasse ||
  (formData.harFlereRisikoklasser && formData.bygningsdeler?.length > 0)
)
```

Resten av BF85-grenen (linje 2045–2076) er allerede korrekt — den leser `bygningsbrannklasse` direkte. Ingen videre endringer der.

### 2. Nytt dørvalg "Branncelle – branncelle"

**`src/pages/Konsept.tsx`** (BF85-listen ~linje 5369–5378): Legg til som nytt valg, plassert logisk i listen (foreslår mellom `bf85_branncelle_korridor` og `bf85_loft_trapperom`):

```ts
{ id: "bf85_branncelle_branncelle", label: "Branncelle – branncelle" },
```

**`src/components/konsept/KonseptPreview.tsx`** (BF85 `bf85DorKravMap` ~linje 2048–2058): Legg til tilsvarende oppslag. Iht. BF85 Kap. 30:33/Tabell 30:41 har dør mellom to brannceller samme krav som branncelle–korridor (halvparten av veggens motstand):

```ts
bf85_branncelle_branncelle: {
  label: "Branncelle – branncelle",
  bbk12: "B 30 (EI 30-Sa)",
  bbk34: "B 15 (EI 15-Sa)"
},
```

Brukeren bør verifisere brannmotstandsverdiene før produksjonsbruk — disse er foreslått basert på samme logikk som "Branncelle – korridor"-raden i eksisterende kart.

### 3. Word-eksport

`src/lib/word-export-chapter3.ts` linje 584 har samme guard. Speil samme utvidelse av betingelsen (`|| formData.bygningsbrannklasse`) og legg `bf85_branncelle_branncelle` inn i tilsvarende kart i den filen, så Word-rapporten matcher preview.

## Ikke endret

- BF85-tabellverdier for eksisterende dørtyper.
- TEK17-grenen (linje 2079+).
- Inputlisten for TEK17 (kun BF85-listen utvides).

## Spørsmål

Stemmer det at "Branncelle – branncelle" skal følge samme dørkrav som "Branncelle – korridor" (B 30 i BBK 1–2, B 15 i BBK 3–4)? Bekreft før implementasjon, eller oppgi ønskede verdier.
