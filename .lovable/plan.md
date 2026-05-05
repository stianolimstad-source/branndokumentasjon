## Mål
Brannenergi-verktøyet skal få to modi:
1. **Materialbasert** (dagens) — beregner Q fra materialer og spesifikk brannenergi per gulvareal.
2. **Per omhyllingsflate (Tabell 43)** — velger virksomhetstype fra Byggforsks Tabell 43 (statistiske verdier MJ/m² golvflate), og beregner brannenergi per omhyllingsflate.

## Tabell 43 (fra opplastet bilde)
Liste over virksomheter med MJ/m² golvflate. Verdier i parentes gjelder lager. Implementeres som array i komponenten:

```
Aluminiumsforedling 200, Antikvitetsbutikk 700, Apotek inkl. lager 800,
Bakeri 200, Bibliotek 2000, Bilforretning 200, Elektroindustri 600,
Flyhangar 200, Fotobutikk 300, Frisør 300, Glassproduksjon 100,
Jernbanestasjon 800, Kafé 400, Kantine 300, Kino 300, Klesbutikk 600,
Klesproduksjon 500, Kraftstasjon 600, Laboratorier (elektronikk 200, kjemisk 500, metallurgi 200),
Madrassproduksjon 500, Malingbutikk 1000, Malingproduksjon 4200,
Maskinfabrikk 200, Museum 300, Møbelforretning 400,
Papirproduksjon 800 (lager 1100), Plastproduksjon 2000,
Postkontor 400, Produksjon av elektrisk utstyr 400, Restaurant 300,
Sjokoladeproduksjon 1000 (lager 6000), Skoproduksjon 500,
Teater 300, Teppebutikk 800, Teppeprodusent 600 (lager 1700),
Trykkeri 1000, Vaskeri 200, Våpenproduksjon 300
```

For virksomheter med lagerverdi: vis et tilleggsvalg "Normal / Lager".

## Modus 2 — UI og logikk
Felt:
- **Virksomhet**: `Select` med Tabell 43-liste (label viser navn + MJ/m²).
- **Bruk**: kun synlig hvis virksomhet har lagerverdi → `Normal` / `Lager`.
- **Gulvareal (m²)**: `Input number`.
- **Omhyllingsflate** med to faner:
  - **Beregn (ca. fra høyde)**: input "Byggehøyde (m)", bruker forenklet formel `A_omh ≈ 2·areal + 4·√areal · høyde` (samme som omhyllingsflate-verktøyet i forenklet modus). Viser beregnet verdi som "≈ X m²".
  - **Oppgi manuelt**: input "Omhyllingsflate (m²)" med hjelpetekst om å bruke det dedikerte omhyllingsflate-verktøyet.

Beregning:
- `Q_total = q_gulv · A_gulv` (MJ)
- `q_omh = Q_total / A_omhylling` (MJ/m²)

Resultatkort:
- Total brannenergi (MJ)
- Omhyllingsflate (m²) — merket "≈" hvis beregnet
- Spesifikk per omhyllingsflate (MJ/m²)

`AttachedCalculation`-objektet inneholder metode, virksomhet, bruks_type, q_gulv, gulvareal, omhyllingsflate-modus, omhyllingsflate, total og spesifikk per omhylling — slik at det er fullt sporbart i fravikdokumentasjon.

## Modus 1 (materialbasert)
Uendret logikk, men plasseres i `<TabsContent value="materiale">`. Eksisterende `useEffect` for `onResult` flyttes inn i felles useEffect som velger riktig basert på aktiv modus.

## Endring
- `src/components/fraviksdokumentasjon/calculators/BrannenergCalculator.tsx`:
  - Legg til `Tabs` rundt hele innholdet ("Materialbasert" / "Per omhyllingsflate (Tabell 43)").
  - Legg til konstant `virksomhetsTabell` med data fra Tabell 43.
  - Legg til state for omhylling-modus, virksomhet, bruks-type, gulvareal, byggehøyde, manuell omhylling.
  - Slå sammen `onResult`-useEffect for begge modus.

Ingen endringer i `Verktoy.tsx`, `Brannenergi.tsx` eller `BeregningSection.tsx` — komponenten brukes likt begge steder (som verktøy-side og som dialog i fravik).

## Filer som endres
- `src/components/fraviksdokumentasjon/calculators/BrannenergCalculator.tsx`
