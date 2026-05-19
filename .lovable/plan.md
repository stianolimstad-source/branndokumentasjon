# Bow-tie: liggende ark + synlig scrollbar (ROS-analyse)

Bow-tie-seksjonen i forhåndsvisningen (`src/components/ros/RosPreview.tsx`) er allerede plassert på liggende ark via `landscapePageStyle`, men selve diagrammet og barriere-tabellen blir bredere enn arket når det er mange årsaker/konsekvenser/barrierer. Vi gjenbruker samme mønster som i kapittel 3: indre scrollbar container + sticky proxy-scrollbar nederst med tydelig styling.

## Endringer

### `src/components/ros/RosPreview.tsx` – kap. 4 Bow-tie
- Bekreft at hele bow-tie-seksjonen er pakket inn i `landscapePageStyle` (allerede tilfelle – ingen endring nødvendig).
- For hver bow-tie (innenfor `.map((bt, idx) => ...)`):
  - Pakk diagrammet (`gridTemplateColumns`-blokken) **og** «Barrierer / tiltak»-tabellen inn i ett felles scroll-wrapper-`div`:
    - `ref={btScrollRefs.current[idx]}`, `onScroll` synker med proxy
    - `className="ros-h-scroll-hidden"`, `style={{ overflowX: "auto" }}`
    - Inni: et indre `div` med `minWidth: 1100` slik at innholdet alltid har en kjent bredde å rulle innenfor.
  - Rett under: sticky proxy-scrollbar med samme styling som i kap. 3 (`className="ros-h-scroll"`, `position: sticky`, `bottom: 16`, mørk thumb, lys track, skygge, border-radius), som inneholder `<div style={{ width: 1100, height: 1 }} />`.
- Legg til state/refs for å holde ett par scroll-refs per bow-tie (array av refs) og synkroniser tabell↔proxy i begge retninger (samme `handleTableScroll` / `handleProxyScroll`-mønster som kap. 3, men per index).

### Ingen endringer i Word-eksport
`src/lib/ros-word-export.ts` bruker allerede `PageOrientation.LANDSCAPE` for bow-tie-seksjonen, så Word-dokumentet er uberørt.

## Resultat
- Bow-tie vises på liggende A4-ark (uendret).
- Når diagrammet/tabellen er bredere enn arket, kan brukeren scrolle horisontalt med en tydelig, sticky scrollbar nederst – identisk visuelt med kapittel 3.
