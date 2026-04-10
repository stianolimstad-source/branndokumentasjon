

## Analyse

`ventKrav9` (brannspjeld i seksjoneringsvegg) har standardverdi `true` i `formData` (linje 648). Det betyr at den alltid er forhåndshuket av, uansett om prosjektet faktisk krever seksjonering.

## Plan

**Endring i `src/pages/Konsept.tsx`:**

1. Endre standardverdien for `ventKrav9` fra `true` til `false`.
2. Legge til automatisk aktivering av `ventKrav9` basert på om seksjonering faktisk er påkrevd — dvs. når `isSeksjoneringRequired()` returnerer `true` eller prosjektet er sykehus/pleieinstitusjon (`erSykehusPleieinstitusjon`).
3. Brukeren kan fortsatt manuelt huke av/på, men standardverdien vil reflektere faktiske prosjektkrav.

Dette sikrer at brannspjeld-kravet kun vises når det er relevant for prosjektet.

