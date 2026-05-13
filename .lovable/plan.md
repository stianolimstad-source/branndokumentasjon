## Mål
For tilstandsvurderinger etter BF85 skal kapitlet om "Tilrettelegging for redning av husdyr" (BF85 3.11) tydelig informere om at Byggeforskrift 1985 ikke hadde egne krav til redning av husdyr, og at TEK17 § 11-15 brukes som referanse dersom temaet er relevant for tiltaket.

## Detektering
```ts
const isBF85Tilstand =
  documentType === "tilstandsvurdering" && formData.regelverk === "BF85";
```
(Allerede definert i Konsept.tsx; samme logikk gjenbrukes i preview/word.)

## Endringer

### 1) Skjema – `src/pages/Konsept.tsx` (3.12-blokken, ca. linje 9602–9678)
Når `isBF85Tilstand` er sann:
- Vis et tydelig informasjonsfelt øverst i seksjonen:
  > "Byggeforskrift 1985 hadde ingen egne krav til tilrettelegging for redning av husdyr. Dersom dette er relevant for tiltaket, brukes TEK17 § 11-15 med tilhørende preaksepterte ytelser i VTEK17 som referanse."
- Behold dagens checkbox "Bygget er beregnet for husdyrhold (driftsbygning med husdyrrom)". Hvis avhuket vises automatisk-kravlisten med en ekstra tekst som tydeliggjør at de listede kravene er TEK17 §11-15 brukt som referanse (ikke BF85-krav).
- Hvis ikke avhuket: vis kun info-feltet (ingen krav-liste). Tilstandspanelet vises uansett (uendret).

For TEK17 (`!isBF85Tilstand`) er dagens visning uendret.

### 2) Forhåndsvisning – `src/components/konsept/KonseptPreview.tsx` (3.12-blokk, ca. linje 5384–5474)
Når `isBF85` (eksisterende variabel i preview) er sann:
- Endre seksjonsoverskriften til "3.11 Tilrettelegging for redning av husdyr (TEK17 § 11-15 brukt som referanse)".
- Først ny rad: `Forhold = "Byggeforskrift 1985"`, `Løsning = "Byggeforskrift 1985 hadde ingen egne krav til tilrettelegging for redning av husdyr. TEK17 § 11-15 brukes derfor som referanse dersom dette er relevant for tiltaket."`, `Ansvar = "-"`.
- Hvis `husdyrRedningRelevant` er sann: vis dagens TEK17-rader (Generelt/Utganger/Fri bredde/Rømningsvei/Dør i yttervegg) under en kolonne-header som tydelig angir "Referanse: TEK17 § 11-15 / VTEK17". Hvis ikke relevant: kun info-raden over + eksisterende fallback-tekst fjernes til fordel for info-raden.

For TEK17 er visningen uendret.

### 3) Word-eksport – `src/lib/word-export-chapter3.ts`
3.12 husdyr-blokken finnes i dag ikke som egen seksjon i Word-eksporten. Endring her er minimal:
- Legg til `sectionHeaderRow(isBF85Tilstand310 ? "3.11   Tilrettelegging for redning av husdyr" : "3.12   §11-15 Tilrettelegging for redning av husdyr")` mellom dagens 3.11 og 3.13.
- Hvis BF85-tilstand: én `contentRow("Byggeforskrift 1985", "Byggeforskrift 1985 hadde ingen egne krav til tilrettelegging for redning av husdyr. TEK17 § 11-15 brukes som referanse dersom dette er relevant.", "-")`. Når `husdyrRedningRelevant`: følg opp med samme rader som preview viser, prefiks-merket "Referanse TEK17 § 11-15".
- For TEK17 (uendret oppførsel utover at seksjonen nå eksplisitt eksporteres): vis dagens rader når `husdyrRedningRelevant`. Avslutt med `tilstandRow(formData, "3_12", ...)`.

(Hvis det er ønskelig å holde Word-eksporten 1:1 med dagens funksjon og kun løse BF85-teksten, kan punkt 3 begrenses til å pushe selve BF85-info-raden + tilstand. Bekreft i implementasjon.)

## Avgrensning
- Ingen nye datafelt; ingen migrering.
- Endringer påvirker kun BF85-tilstand. TEK17-tilstand og brannkonsept beholder dagens innhold.

## Akseptkriterier
- I BF85-tilstand viser kapittel 3.11 tydelig at BF85 ikke hadde krav til husdyrredning, og at TEK17 § 11-15 brukes som referanse.
- TEK17-kravene vises kun når brukeren markerer at husdyrhold er relevant, og er merket som referanse.
- Tilstandspanel-funksjonaliteten (kommentar/avvik) er uendret.