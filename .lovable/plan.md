## Mål
Utvide risikomatrisen slik at den støtter alle konsekvensdimensjoner, plotter hendelser direkte i cellene, viser før/etter tiltak, og rendres som eget kapittel i preview og Word-eksport.

## 1. `src/components/ros/RosMatriks.tsx`
Utvid komponenten:

- Nye props:
  - `hendelser?: RosHendelse[]`
  - `dimensjon?: KonsekvensDimensjon`
  - `visUsikkerhet?: boolean`
  - `bruk?: "for" | "etter"` (for å velge `sannsynlighet`/`konsekvens` vs `sannsynlighetEtter`/`scoreEtter`)
  - `ider?: Map<string,string>` (for å vise lesbare hendelse-IDer som "H1", "H2"; bygges av kaller)
- Plottelogikk:
  - For hver hendelse: hent `kv = h.konsekvensvurderinger.find(k => k.dimensjon === dimensjon)`. Filtrer bort hendelser uten kv eller uten sannsynlighet (når `bruk="etter"`, krev både `sannsynlighetEtter` og `kv.scoreEtter`).
  - Grupper hendelser per celle `(s,k)`.
  - I hver celle, render små badges med hendelses-ID. Hvis ≥4 i samme celle, vis "+N" og full liste i tooltip.
- Markering per badge:
  - Styrbarhet → bakgrunnsfarge på badge: høy=grønn, medium=gul, lav=rød. Default nøytral hvis ikke satt.
  - Usikkerhet "høy" + `visUsikkerhet` → stiplet ring (`border-dashed`) rundt badge.
  - Tooltip (`HoverCard`/`title`-attr) viser `tittel · S=… · K=…`.
- Beholde `highlight`-prop og dagens cellefarger; fjerne hardkodet «forsyningssikkerhet»-tekst og i stedet vise valgt `dimensjon` i over-tittel.

## 2. `src/pages/RosAnalyse.tsx`
Erstatt dagens enkelte `<RosMatriks size="sm" />` (linje ~1927) med en seksjon:

- Beregn `tilgjengeligeDim` = unike dimensjoner som finnes i minst én hendelses `konsekvensvurderinger`.
- `Tabs` over dimensjoner; default `forsyningssikkerhet` hvis i listen, ellers første. Egen state `valgtDim`.
- To matriser side ved side:
  - «Risiko før tiltak» (`bruk="for"`)
  - «Risiko etter tiltak» (`bruk="etter"`) – skjules hvis ingen hendelser har både `sannsynlighetEtter` og `kv.scoreEtter`.
- Oppsummeringslinje under: tell hendelser per sone (`risikoFarge`) for valgt dimensjon og `bruk="for"`: «X i rød · Y i gul · Z i grønn».
- Bygg `ider`-map én gang fra `content.hendelser` (`H1`, `H2`, …).

## 3. `src/components/ros/RosPreview.tsx`
- Beregn `tilgjengeligeDim` på samme måte.
- Nytt kapittel `id="kap-6-risikobilde"` plassert rett før dagens `kap-6-tiltak` (Tiltaksplan):
  - Tittel: «6. Risikobilde».
  - For hver tilgjengelig dimensjon: vis tittelblokk + før/etter-matriser side ved side (CSS grid, 2 kolonner). Hopp over «etter» om tom.
  - Oppsummeringslinje per dimensjon.
- Renumerér etterfølgende kapitler:
  - Tiltaksplan: 6 → **7** (id endres ikke, men tittel/tekstreferanser oppdateres)
  - Bow-tie: 7 → **8**
  - Oppsummering: 8 → **9**
  - Revisjon: 9 → **10**
- Oppdater alle inline-tekster som refererer til kapittelnumre («se kapittel 6 Tiltaksplan» → 7; «kapittel 7 Bow-tie» → 8; osv.).

## 4. `src/lib/ros-word-export.ts`
- Importer `KONSEKVENS_KRITERIER`/`DIMENSJON_NAVN` og `risikoFarge`.
- Helper `buildRisikoMatriseTabell(hendelser, dim, ider, bruk)` som lager 6×6 `Table`:
  - Topp- og venstre-akse (S/K). Datasceller bruker `shading: { type: ShadingType.CLEAR, fill: <hex> }` (grønn `#10b981`, gul `#f59e0b`, rød `#ef4444`) basert på `risikoFarge(s,k)`.
  - I hver celle: hendelse-IDer som komma-separert tekst. Tomme celler viser bare tallet `s*k` i lys variant.
- Nytt kapittel-blokk `risikobildeBlocks` plassert før `tiltaksplanBlocks`:
  - Per dimensjon i `tilgjengeligeDim`: overskrift «X.Y <dimensjonsnavn>», før/etter-tabeller (etter hoppes om tom), summeringsavsnitt.
- Oppdater dynamisk kapittelnummerering:
  - `risikobildeNr = "6"`, `tiltakNr = "7"`, `bowTieNr = "8"`, `oppsummeringNr = harBowTie ? "9" : "8"`, `revisjonNr = harBowTie ? "10" : "9"`.
  - Innholdsfortegnelsen (linje ~264 «Risikobilde») oppdateres til riktig nummer; legg til Tiltaksplan-linje hvis ikke allerede der.
  - Inline tekstreferanser («se kapittel … Tiltaksplan/Bow-tie») oppdateres.

## 5. Detaljer / kanter
- Ingen DB-endringer.
- Filtrering: hendelser uten kv for valgt dimensjon dukker ikke opp i den matrisen, men telles ikke i oppsummeringen.
- Styrbarhet-farge må ikke kollidere med cellebakgrunn → bruk hvit ramme + tekstfarge svart for kontrast.
- Hvis `tilgjengeligeDim` er tom: skjul hele kapittelet i preview og Word, og vis bare en placeholder i editor («Ingen konsekvensvurderinger registrert ennå.»).

## Filer som endres
- `src/components/ros/RosMatriks.tsx` (utvidet API)
- `src/pages/RosAnalyse.tsx` (tabs + dual matrise + oppsummering)
- `src/components/ros/RosPreview.tsx` (nytt kapittel + renumerering)
- `src/lib/ros-word-export.ts` (nye matrisetabeller + renumerering)
