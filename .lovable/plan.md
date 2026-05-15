## Mål

I inputpanelet for kap. 3.13 (BF85-numrering = "Atkomst for brannvesenet", rendret som SectionCollapsible `preview-3-14` i `src/pages/Konsept.tsx` ~linje 9911) skal alle TEK17-spesifikke avhuk skjules når `formData.regelverk === "BF85"` (dvs. `isBF85Tilstand`). Forhåndsvisning og Word-eksport for BF85 bruker uansett faste §:91/§:92/§:94/§:95-tekster og leser ikke disse feltene.

## Endring

### `src/pages/Konsept.tsx` (~linje 9916–9965)

Wrap hele checkbox-gruppen (de 6 avhukene) i en betinget render slik at den kun vises for ikke-BF85:

- `hoyderedskapRelevant` – "Tilgjengelighet for høyderedskap (inntil 8 etasjer)"
- `byggOver23m` – "Øverste gulv er høyere enn 23 meter over terreng"
- `slangeutlegg50m` – "Alle deler av etasje kan nås med maks 50 m slangeutlegg"
- `harRadiokommunikasjon` – "Krav til radiokommunikasjon for nødetater"
- `harUniversalnokkel` – "Bygget har mer enn 50 rom (krav til universalnøkkel / nøkkelskap)"
- `stortAntallPersonerSlokke` – "Stort antall personer – tilgjengelig atkomst for brannvesenet"

Konkret: pakk `<div className="space-y-2 mb-3"> ... </div>` (linje 9916–9965) inn i `{!isBF85Tilstand && ( ... )}`.

Den eksisterende `oppstillingsplassKrav`-textarean på linje 9981 vises i dag betinget av `(formData.hoyderedskapRelevant || formData.byggOver23m)`. Når avhukene skjules for BF85, vil disse to verdiene fortsatt kunne være `true` fra tidligere (default `hoyderedskapRelevant: false`, men `byggOver23m` kan være satt). Utvid betingelsen til `!isBF85Tilstand && (formData.hoyderedskapRelevant || formData.byggOver23m)` slik at oppstillingsplass-textarean også skjules for BF85.

## Avgrensning

- Kun UI/inputsiden endres. State, defaults, forhåndsvisning og Word-eksport berøres ikke.
- "Tilrettelegging for rednings- og slokkemannskap"-textarea (`redningsmannskap`) og "Krav til utforming av kjørevei" (`kjoreveiKrav`) beholdes som i dag – brukeren ba kun om at *knappene* (checkboxene) tas bort.
- Info-boksen "Følgende krav er automatisk inkludert i rapporten" (linje 9991+) er allerede BF85-tilpasset og endres ikke.

## Akseptkriterier

- BF85-tilstandsvurdering: De 6 TEK17-avhukene og oppstillingsplass-textarean vises ikke i kap. 3.13-input.
- TEK17-konsept: Inputpanelet er uendret.
