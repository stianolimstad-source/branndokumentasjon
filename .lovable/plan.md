## Mål
Under ventilasjonsanlegg, både i BF85- og TEK17-flyten, skal det – kun når bygningstype/-del er **Kraftstasjon** – legges til en note om at det ved bruk av **steng-inne-prinsipp** må benyttes **automatiske brannspjeld** (smeltesikring ikke tillatt). Hjemmel: DSB sin veiledning om brannvern i kraftstasjoner.

## Tekst som legges til
> «Dersom det benyttes steng-inne-prinsipp for ventilasjonsanlegget, må det benyttes automatiske brannspjeld. Brannspjeld med smeltesikring er ikke tillatt. Jf. DSB sin veiledning om brannvern i kraftstasjoner.»

Teksten formuleres som en betinget setning – ingen ny UI-bryter for "steng inne" innføres (bruker har ikke bedt om det).

## Detektering av kraftstasjon
Samme mønster som ellers:
```ts
const erKraftstasjon =
  (formData.bygningstype || "").toLowerCase().includes("kraftstasjon")
  || (formData.bygningsdeler || []).some((d: any) =>
       (d.bygningstype || "").toLowerCase().includes("kraftstasjon"));
```

## Filer som endres

### 1. `src/lib/word-export-chapter3.ts`
- Linje ~1270, eksisterende rad **«Ventilasjonsanlegg – kraftstasjon»**: utvid teksten med ny setning om steng-inne-prinsipp + automatiske brannspjeld. Raden vises allerede kun når `erKraftstasjon37` er true, så ingen ny gating trengs. Gjelder både BF85 og TEK17 siden raden legges til i kapittel 3.7-blokken som kjøres for begge regelverk.

### 2. `src/components/konsept/KonseptPreview.tsx`
- Linje ~4003, tabellraden **«Ventilasjonsanlegg – kraftstasjon»** i 3.7-seksjonen: legg til samme tilleggssetning i innholds-cellen, slik at preview matcher Word-eksport.

### 3. `src/pages/Konsept.tsx` (info-boks "Følgende krav er automatisk inkludert i rapporten")
- I både BF85- og TEK17-grenen (rundt linje 7657 / 7679): når `erKraftstasjon` er sann, legg til et kort punkt: **«Steng-inne-prinsipp ventilasjon – automatiske brannspjeld kreves (kraftstasjon).»**

## Akseptansekriterier
- Med kraftstasjon valgt: preview, info-boks og Word-eksport viser den nye setningen om steng-inne-prinsipp og automatiske brannspjeld – både for BF85 og TEK17.
- For andre bygningstyper er ventilasjonsteksten uendret.
- Ingen ny UI-bryter, ingen endring i annen ventilasjonslogikk.
