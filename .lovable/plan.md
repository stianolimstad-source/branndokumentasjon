

## Mål
Legge til en automatisk beregning av omtrentlig brannenergi i bygget, basert på allerede oppgitte planlagte mengder. Brannenergien angis både totalt (MJ) og per m² omhyllingsflate (MJ/m²) — sistnevnte krever at brukeren oppgir byggets innvendige mål (lengde, bredde, høyde).

## Plassering
Et nytt kort **"Brannenergi i bygget"** plasseres i `src/pages/Brensellagring.tsx` **direkte under** kortet *"Planlagt lagret mengde i bygget"*, slik at det er en naturlig forlengelse av samme datagrunnlag. Kortet er kun synlig når minst én planlagt mengde er fylt inn.

## Inndata (nye felter)
Tre tallfelt for å beregne omhyllingsflate (samme tilnærming som `OmhyllingsflateCalculator.tsx`):
- **Lengde (m)**
- **Bredde (m)**
- **Høyde (m)**

Omhyllingsflate beregnes som `A_t = 2·(L·B) + 2·(L·H) + 2·(B·H)` (gulv + tak + vegger). Hvis ett av feltene mangler vises kun total brannenergi (MJ), ikke spesifikk (MJ/m²).

## Beregningsgrunnlag — kalorimetriske verdier
Standardverdier hentet fra SFPE Handbook og NS-EN 1991-1-2, omregnet til praktiske enheter for hver kategori:

| Kategori | Enhet inn | Energi-tetthet | Kommentar |
|---|---|---|---|
| Brannfarlig gass kat 1 | kg | **46 MJ/kg** | Propan/butan/hydrogen |
| Brannfarlig gass kat 2 | kg | **22 MJ/kg** | Ammoniakk (konservativ) |
| Brannfarlig væske kat 1 | liter | **32 MJ/L** | Bensin (44 MJ/kg × 0,74 kg/L) |
| Brannfarlig væske kat 2 | liter | **36 MJ/L** | Parafin/jet A-1 |
| Brannfarlig væske kat 3 | liter | **36 MJ/L** | Smøreolje/terpentin |
| Diesel / fyringsolje | liter | **36 MJ/L** | 42,5 MJ/kg × 0,84 kg/L |
| Aerosoler | liter | **20 MJ/L** | Drivgass + innhold (sjablongverdi) |

Verdiene defineres i en konstant `ENERGITETTHET` øverst i `Brensellagring.tsx`.

## Resultatvisning i kortet
- **Total brannenergi**: Σ (mengde × energitetthet) → vises som `X MJ` (avrundet til nærmeste 100 MJ ved >10 000).
- **Spesifikk brannenergi**: Total / A_t → `Y MJ/m²` (kun når L, B, H er gyldige).
- En liten oppdelt tabell viser bidraget per kategori (kategori, mengde, MJ/kg eller MJ/L, sum MJ) for transparens.
- En info-boks med formel og kilde (SFPE / NS-EN 1991-1-2) samt presisering: *"Verdien er en sjablong-beregning og ivaretar ikke fukt, sammensetning eller emballasje. Brukes kun til indikativ vurdering."*

## Inkludering i dokument
Samme mønster som planlagte mengder og salgslokale-tabellen:
- En "Legg til i dokument"-knapp (`brannenergiInkludert`).
- En `Textarea` for kommentar (`brannenergiKommentar`).
- Når aktiv, legges en ny seksjon **"Brannenergi i bygget"** inn i forhåndsvisningen (`BrensellagringPreview.tsx`) over de øvrige kravseksjonene, med:
  - Tabell over byggets dimensjoner og omhyllingsflate.
  - Tabell over bidrag per kategori.
  - Total brannenergi og MJ/m².
  - Eventuell kommentar.
  - Fotnote med kildereferanser.

## State og persistens
Nye state-variabler i `Brensellagring.tsx`:
- `byggDim: { lengde: string; bredde: string; hoyde: string }`
- `brannenergiInkludert: boolean`
- `brannenergiKommentar: string`

Disse legges til i `docContent` ved lagring og leses tilbake i `useEffect`-en som henter eksisterende dokument (samme mønster som `plannedAmounts`).

## Filer som endres
1. **`src/pages/Brensellagring.tsx`** — nytt kort, ny state, persistens, propagering til preview.
2. **`src/components/brensellagring/BrensellagringPreview.tsx`** — ny prop-blokk og rendering av brannenergi-seksjonen, ny entry i `sections`-listen rett etter `planlagt`.

Ingen endringer i datafiler, ruter eller andre komponenter.

