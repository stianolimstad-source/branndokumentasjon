## Mål
Legg til valg "Kraftstasjon under fjell / under dagen" i innledningen (der bygningstype settes) for kraftstasjoner. I kap. 3.9 vises kun gjeldende krav basert på dette valget.

## Nytt felt
- **Felt:** `kraftstasjonUnderFjell` (boolean, default `false`)
- **Plassering UI:** I innledning/metadata-seksjonen der bygningstype velges. Vises kun når bygningstype = "Kraftstasjon" (eller en bygningsdel er kraftstasjon).
- **Kontroll:** Switch/checkbox med label "Kraftstasjon under fjell eller under dagen".
- **Persistens:** Lagres i `fire_concepts` metadata (samme mønster som øvrige toggles).

## Logikk i kap. 3.9 (Nødbelysning – kraftstasjon)

Raden vises kun når bygget er kraftstasjon. Innholdet tilpasses:

**Hvis `kraftstasjonUnderFjell = true`:**
> Stasjoner i fjell og under dagen skal ha nødlysanlegg, (jf. FEA-F § 26).
>
> Kraftstasjoner og andre større stasjoner med høyspenningsanlegg skal være forsynt med nødbelysning som forsynes fra en kilde som er uavhengig av høyspenningsanlegget (nødstrøm), (jf. FEA-F § 25).
>
> Nødbelysning basert på kraftforsyning fra sentral batteribank eller aggregat er ikke tilfredsstillende alene. Det anbefales derfor i tillegg å montere nødbelysning bestående av håndlykter med batterier under kontinuerlig ladning, opphengt på sentrale steder. Disse vil også være praktiske ved innsats i anlegget.

**Hvis `kraftstasjonUnderFjell = false`:**
> Kraftstasjoner og andre større stasjoner med høyspenningsanlegg skal være forsynt med nødbelysning som forsynes fra en kilde som er uavhengig av høyspenningsanlegget (nødstrøm), (jf. FEA-F § 25).
>
> Nødbelysning basert på kraftforsyning fra sentral batteribank eller aggregat er ikke tilfredsstillende alene. Det anbefales derfor i tillegg å montere nødbelysning bestående av håndlykter med batterier under kontinuerlig ladning, opphengt på sentrale steder. Disse vil også være praktiske ved innsats i anlegget.

**Forhold:** "Nødbelysning – kraftstasjon" · **Ansvar:** RIE

## Filer som endres
- Innledning/metadata-skjema (der bygningstype velges) — legg til ny switch
- `src/components/konsept/KonseptPreview.tsx` — ny conditional `<tr>` i 3.9 med tekst-variant basert på `kraftstasjonUnderFjell`
- `src/lib/word-export-chapter3.ts` — speil samme rad i Word-eksport
- Type-definisjon for fire concept-data utvides med `kraftstasjonUnderFjell?: boolean`

Ingen nye krav for tilstandsvurdering — bruker samme komponent og dekkes automatisk for både TEK17 og BF85.
