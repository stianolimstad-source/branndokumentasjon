## Mål
For tilstandsvurderinger etter BF 85 av **industribygg** skal "Generelt"-raden i kap. 3.12 (Slokkingsredskap og slokkingsvann / Manuell slokking) bytte ut TEK17-teksten med BF85-teksten:

> "Bygningsrådet kan kreve brannslanger og manuelt slokkeutstyr."

For **kraftstasjon** (egen bygningstype, BF85) skal det i tillegg legges inn DSB-veiledningens krav:

> "Det skal utplasseres hensiktsmessig og tilstrekkelig manuelt slokkeutstyr som skal kunne brukes i alle rom i anlegget. Med manuelt slokkeutstyr menes alt slokkeutstyr som betjenes av personell, dvs. brannslanger og transportable slokkeapparater av ulik utforming og for ulike bruksområder. Utstyret må være avpasset etter den brann som ventes å oppstå."

For andre bygningstyper enn industri/kraftstasjon (BF85), og for TEK17, beholdes dagens generelt-tekst uendret.

## Endringer

### 1) Forhåndsvisning – `src/components/konsept/KonseptPreview.tsx` (~linje 5502–5509)
Erstatt den faste "Generelt"-raden med en betinget rendering basert på `isBF85`, `bygningstype` (også fra `bygningsdeler`):

- Regn ut `erBF85Industri` (= BF85 og bygningstype/bygningsdeler inneholder "industri" eller "kraftstasjon").
- Regn ut `erKraftstasjon` (BF85 og bygningstype/bygningsdeler inneholder "kraftstasjon").
- Hvis `erBF85Industri` (men ikke kraftstasjon): vis BF85-teksten ("Bygningsrådet kan kreve brannslanger og manuelt slokkeutstyr.") med ansvar `RIBr`.
- Hvis `erKraftstasjon`: vis BF85-teksten + ekstra rad "Manuelt slokkeutstyr – kraftstasjon" med DSB-teksten over (ansvar `RIBr`, kilde DSB-veiledningen i italic kommentar slik som ellers i kraftstasjon-rader).
- Ellers: behold dagens TEK17-baserte generelt-tekst.

### 2) Word-eksport – `src/lib/word-export-chapter3.ts` (~linje 1796–1800)
Speiler logikken fra forhåndsvisningen:

```ts
const lcBT = (formData.bygningstype || "").toLowerCase();
const delerBT = (formData.bygningsdeler || []).map((d:any)=> (d.bygningstype||"").toLowerCase());
const erKraftstasjonSlok = lcBT.includes("kraftstasjon") || delerBT.some(b => b.includes("kraftstasjon"));
const erIndustriSlok = lcBT.includes("industri") || delerBT.some(b => b.includes("industri")) || erKraftstasjonSlok;

if (isBF85Tilstand310 && erIndustriSlok) {
  rows.push(contentRow("Generelt", "Bygningsrådet kan kreve brannslanger og manuelt slokkeutstyr.", "RIBr"));
  if (erKraftstasjonSlok) {
    rows.push(contentRow(
      "Manuelt slokkeutstyr – kraftstasjon",
      "Det skal utplasseres hensiktsmessig og tilstrekkelig manuelt slokkeutstyr ... Utstyret må være avpasset etter den brann som ventes å oppstå.",
      "RIBr"
    ));
  }
} else {
  rows.push(contentRow("Generelt", "Byggverk skal være tilrettelagt for effektiv manuell slokking av brann.", "RIV"));
}
```

## Avgrensning
- Kun `Generelt`-raden i kap. 3.12 (BF85 / 3.13 TEK17) endres. Eksisterende rader for brannslange, håndslokker, plassering, merking osv. styres fortsatt av brukerens valg og er uendret.
- TEK17 og BF85 for ikke-industri (bolig, kontor, skole osv.) er uendret.

## Akseptkriterier
- BF85 + bygningstype Industri (og ikke kraftstasjon): "Generelt"-raden viser "Bygningsrådet kan kreve brannslanger og manuelt slokkeutstyr." Både i forhåndsvisning og Word.
- BF85 + bygningstype Kraftstasjon: "Generelt"-raden viser BF85-teksten, og det legges til en egen rad med DSB-teksten for kraftstasjon. Både i forhåndsvisning og Word.
- BF85 + andre bygningstyper, og TEK17: uendret.
