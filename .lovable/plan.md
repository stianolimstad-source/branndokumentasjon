## Mål
"Følgende krav er automatisk inkludert i rapporten"-boksen (`bg-accent/30 border border-accent`) i kap. 3.12 Manuell slokking i tilstandsvurdering etter BF 85 viser i dag TEK17-krav (RK 3/5/6 brannslange, RK 1/2/4 håndslokker, NS-EN 671/3-7, dekningsradius 15/25 m, BF85 Kap. 30:91/93). Dette stemmer ikke med rapporten som faktisk genereres for BF 85, og må synkroniseres med samme logikk som ble lagt inn i `KonseptPreview.tsx` og `word-export-chapter3.ts`.

## Endring – `src/pages/Konsept.tsx` (~linje 9730–9812)

Splitt rendering av kravbekreftelses-boksen i to grener basert på `formData.regelverk === "BF85"` og `isBF85Tilstand`.

### A) BF 85-grenen (kun når `regelverk === "BF85"`)

Beregn:
```ts
const lcBT = (formData.bygningstype || "").toLowerCase();
const delerBT = (formData.bygningsdeler || []).map((d:any) => (d.bygningstype||"").toLowerCase());
const erKraftstasjon = lcBT.includes("kraftstasjon") || delerBT.some(b => b.includes("kraftstasjon"));
const erIndustri = lcBT.includes("industri") || delerBT.some(b => b.includes("industri")) || erKraftstasjon;
```

Vis følgende i boksen:

- Header: "✓ Følgende krav er automatisk inkludert i rapporten:"
- Kursiv kilde-note (erstatter dagens "Kap. 30:91/93"-tekst):
  - Hvis `erKraftstasjon`: "Vurderingen baseres på BF 85 og DSBs veiledning til kraftstasjoner."
  - Ellers hvis `erIndustri`: "Vurderingen baseres på BF 85 (industri – bygningsrådets skjønn)."
  - Ellers: "BF 85 stiller ikke spesifikke krav til manuelt slokkeutstyr for denne bygningstypen. Bygningsrådet kan likevel kreve dette."

- Underseksjon "Generelt" (alltid):
  - Hvis `erIndustri` (inkl. kraftstasjon): én bullet "Bygningsrådet kan kreve brannslanger og manuelt slokkeutstyr."
  - Ellers: ingen "Generelt"-bullet (eller samme tekst i kursiv hvis vi ønsker konsistens).

- Underseksjon "Manuelt slokkeutstyr – kraftstasjon" (kun hvis `erKraftstasjon`):
  - Bullet med DSB-teksten: "Det skal utplasseres hensiktsmessig og tilstrekkelig manuelt slokkeutstyr som skal kunne brukes i alle rom i anlegget. Med manuelt slokkeutstyr menes alt slokkeutstyr som betjenes av personell, dvs. brannslanger og transportable slokkeapparater av ulik utforming og for ulike bruksområder. Utstyret må være avpasset etter den brann som ventes å oppstå."

- Brukerens egne valg (uendret logikk, men uten RK-tekst):
  - Hvis `formData.slokkeBrannslange` huket: bullet "Brannslange – plasseres slik at den dekker alle rom; maks 30 m ved fullt uttrekk; skal ikke plasseres i trapperom."
  - Hvis `formData.slokkeHandslukker` huket: bullet "Håndslokker – min. 6 kg ABC-pulver eller 9 liter skum/vann; plasseres tilgjengelig og merket."
  - (Fjern RK-referanser, NS-EN 671/3-7 og dekningsradius 15/25 m for BF 85 – disse er TEK17-spesifikke.)

- Generelle krav (alltid, BF 85-versjon, kort):
  - "Slokkeutstyr skal være lett tilgjengelig og dekke alle rom"
  - "Plassering skal være tydelig markert med skilt"
  - "Tilvisningsskilt skal stå på tvers av ferdselsretningen"

- Footer: "Du kan endre valgene med knappene ovenfor."

### B) TEK17-grenen (uendret)

Behold dagens innhold (RK-spesifikke krav, NS-EN 671/3-7 osv.) når `regelverk !== "BF85"`. Fjern også dagens BF85-italic-blokk (linje 9771–9773), siden den nå håndteres i grein A.

Tilsvarende skal ledeteksten over checkboxene (`kravTekst`, ~linje 9696–9700) tilpasses BF 85: vis i stedet "BF 85 spesifiserer ikke type slokkeutstyr – velg hva som skal benyttes." når `regelverk === "BF85"`.

## Avgrensning
- Endrer kun innholdet i kravbekreftelses-boksen (input-siden) for kap. 3.12 BF 85 / 3.13 TEK17 Manuell slokking.
- Forhåndsvisning, Word-eksport og andre bygningstyper er ikke berørt – de matcher allerede denne logikken.
- Bestående checkbox-state (`slokkeBrannslange`, `slokkeHandslukker`) og fritekstfeltene endres ikke.

## Akseptkriterier
- BF 85 + Industri: boksen viser BF85-noten + "Bygningsrådet kan kreve brannslanger og manuelt slokkeutstyr." Ingen RK-referanser eller NS-EN-numre.
- BF 85 + Kraftstasjon: i tillegg vises DSB-bulleten med kraftstasjons-teksten.
- BF 85 + andre bygningstyper: boksen viser kort note om at BF 85 ikke stiller spesifikke krav.
- TEK17: boksen er uendret.
- Brukerens egne valg av brannslange/håndslokker vises fortsatt som bullets, men uten TEK17-spesifikke RK-/standardreferanser når BF 85 er valgt.
