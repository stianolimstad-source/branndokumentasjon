## Mål

For tilstandsvurderinger etter BF 85 hvor bygningstype er satt til "kraftstasjon" og brukeren huker av for brannslange i kap. 3.12 Manuell slokking, skal det vises en kraftstasjons-spesifikk DSB-tekst i stedet for dagens TEK17-tekst (NS-EN 671, RK-referanser, plassering i trapperom, slangelengde 30 m osv.).

Ny tekst (DSB-veiledning kraftstasjoner):

> "Der det er mulighet for tilgang på slokkevann, bør det installeres anlegg for montering av brannslanger. Brannslangen bør fortrinnsvis være på trommel med senterinnføring av vannet, slik at bare nødvendig del av slangelengden rulles ut i det enkelte brukstilfellet. Innvendig diameter må være minst 19 mm, og slangene må ikke være lenger enn 30 meter.
>
> Det bør brukes kuleventil, og kranene bør prøves jevnlig for å sikre at de ikke har satt seg fast."

## Endringer

### 1) `src/components/konsept/KonseptPreview.tsx` (~linje 5541–5620)

I IIFE-en som rendrer Brannslange-/Håndslokker-rader og de etterfølgende TEK17-radene (Antall, Plassering, Brannslange i trapperom, Slangelengde, Merking):

- Beregn `isBF85`, `erKraftstasjon` (allerede tilgjengelig fra forrige IIFE – løft opp eller dupliser lokal logikk).
- Hvis `isBF85 && erKraftstasjon`:
  - Hvis `slokkeBrannslange`: render én ny rad "Brannslange (kraftstasjon)" med DSB-teksten (to avsnitt) og `RIBr` som ansvar. Avslutt med kursiv kildelinje: "Kilde: DSB sin veiledning om brannvern i kraftstasjoner."
  - Hopp over de TEK17-spesifikke radene: dagens "Brannslange"-rad (5550), samt "Antall og dekningsområde", "Plassering", "Brannslange i trapperom", "Slangelengde" og "Merking av slokkeutstyr" når disse kun gjelder brannslange. Behold "Håndslokker"-raden hvis `slokkeHandslukker` er huket av (inntil videre uendret – ikke berørt av denne forespørselen).
- Ellers: behold dagens TEK17-logikk uendret.

### 2) `src/lib/word-export-chapter3.ts` (~linje 1796–1823)

Speil samme logikk i Word-eksporten:

- Behold dagens BF85+industri/kraftstasjon "Generelt"-rad og "Manuelt slokkeutstyr – kraftstasjon"-rad.
- Etter disse: hvis `isBF85Tilstand310 && erKraftstasjonSlok && formData.slokkeBrannslange`, legg til `contentRow("Brannslange (kraftstasjon)", "<DSB-tekst, to avsnitt> (Kilde: DSB sin veiledning om brannvern i kraftstasjoner.)", "RIBr")`.
- For BF85+kraftstasjon: ikke skriv ut TEK17-brannslange-rader. (Det finnes pr. i dag ingen tilsvarende TEK17-brannslangerader i word-export-grenen for `isBF85Tilstand310 && erIndustriSlok` – kun "Generelt" og DSB-raden – så endringen begrenser seg til å legge til den nye raden.)

### 3) `src/pages/Konsept.tsx` – kravbekreftelses-boks (~linje 9740–9809)

I BF 85-grenen, når brukeren huker av for brannslange og `erKraftstasjon`:

- Erstatt dagens generiske "Brannslange – plasseres slik at den dekker alle rom; maks 30 m …"-bullet med DSB-spesifikke bullets:
  - "Brannslange bør være på trommel med senterinnføring av vann."
  - "Innvendig diameter minst 19 mm."
  - "Slangelengde maks 30 m."
  - "Bruk kuleventil; kranene prøves jevnlig."
  - Tilføy under-tekst: "Kilde: DSB-veiledning om brannvern i kraftstasjoner."
- For BF 85 + industri (ikke kraftstasjon) og BF 85 + andre: behold nåværende bullet uendret.

## Avgrensning

- Endrer kun brannslange-innholdet for BF 85 + kraftstasjon i kap. 3.12 (forhåndsvisning, Word-eksport og input-boks).
- Håndslokker-rad og øvrige bygningstyper er uendret.
- TEK17-grenen er uendret.

## Akseptkriterier

- BF 85 + kraftstasjon + brannslange huket: Forhåndsvisning og Word viser én kraftstasjons-rad med DSB-teksten og `RIBr` som ansvar. Ingen TEK17-rader om plassering/trapperom/slangelengde/merking vises.
- Kravbekreftelses-boksen viser DSB-bullets med innvendig diameter 19 mm, kuleventil osv.
- BF 85 + industri (ikke kraftstasjon): ingen endring i brannslange-tekst.
- TEK17-konsepter: helt uendret.
