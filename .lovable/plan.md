# Reorganisering av kap 3.6 (TEK17 §11-9) etter veilederens struktur A–I

Gjelder kun TEK17-grenen (ikke BF85, som beholdes uendret). Dagens innhold flyttes inn under nye underseksjoner; ingenting fjernes.

## Ny struktur i UI

I `src/pages/Konsept.tsx` innenfor `SectionCollapsible previewId="preview-3-6"` (TEK17-grenen, fra ca. linje 7636 til 7745) erstattes innholdet med 9 underseksjoner bygget på shadcn `Collapsible`:

- **A. Generelt** — kort tekst om at klassifisering gjelder kombinasjon overflate + underlag (alltid synlig, ikke collapsible).
- **B. Innvendige overflater og kledninger** — to tabeller:
  - **Tabell 1A** (RK1–RK5): kolonner BKL 1 / BKL 2 / BKL 3, 7 rader (overflater vegg+tak ≤200 m², >200 m², rømningsvei; gulv branncelle, gulv rømningsvei; kledning vegg+tak branncelle, kledning rømningsvei). Vises kun når `formData.risikoklasse ∈ {RK1..RK5}`. Aktiv BKL-kolonne markeres (samme stil som BF85-tabellen).
  - **Tabell 1B** (RK6): skjerpede krav (A2-s1,d0 / K₂10 A2-s1,d0 osv.), vises kun når `formData.risikoklasse === "RK6"`.
  - Klasser i europeisk + norsk i klammer: `D-s2,d0 [In 2]` osv.
  - De fire eksisterende noteboksene (hulrom `matNote2`, brannfarlig virksomhet `matNote3`, analyse-unntak `matNote4`, samt rom-med-brannfarlig-virksomhet) flyttes inn her uendret.
- **C. Nedforet himling i rømningsvei** — eksisterende `himlingNote1`/`himlingNote2` flyttes inn; legg til presisering at preakseptert ytelse krever A2-s1,d0 [In 1 på begrenset brennbart underlag] med opphengsystem ≥10 min, eller K₂10 A2-s1,d0 [K1-A].
- **D. Isolasjon i bygningsdeler** — eksisterende `isolasjonSandwich` + `isolasjonBrennbar` beholdes; tre nye checkboxer for hvordan brennbar isolasjon kan anvendes:
  - `isoTildekketMurStop` — tildekkes/mures/støpes inn slik at den ikke involveres i brann
  - `isoDokumentertIngenSpredning` — dokumentert at den ikke bidrar til brannspredning
  - `isoTilbakeholdendeLag` — tilstrekkelig tildekkende eller branntilbakeholdende lag
- **E. Utvendige overflater og kledning** — ny seksjon. Viser automatisk gjeldende krav: BKL1 → `D-s3,d0 [Ut 2]`; BKL2/BKL3 → `B-s3,d0 [Ut 1]`; RK6 → `A2-s1,d0 [ubrennbart]` uansett BKL. Eksisterende `ytterkledningDKrav` flyttes inn. Ny checkbox `naboavstandUnder8m` — krav når avstand til nabobygg < 8 m.
- **F. Yttertak** — ny seksjon. Tekst om `BROOF(t2) [Ta]` for BKL 1/2/3, krav til underlag og brannmotstand, krav til takoppbygging. Checkboxer: `tak_broof_t2`, `tak_underlagDokumentert`, `tak_oppbyggingDokumentert`.
- **G. Brannvegg og vinduer i brannvegg** — ny seksjon. Tekst om at vinduer og gjennomføringer i brannvegg må ha samme brannmotstand som veggen (`EI 90 A2-s1,d0` eller `EI 120 A2-s1,d0` avhengig av BKL — beregnes fra `formData.brannklasse`). Checkboxer: `brannvegg_vinduerSammeBrannmotstand`, `brannvegg_gjennomfoerngerSikret`.
- **H. Rør- og kanalisolasjon** — ny seksjon. Tekst: `BL-s1,d0` i rømningsvei; `A2L-s1,d0` i rømningsvei som betjener mer enn én etasje. Checkboxer: `ror_bl_s1d0`, `ror_a2l_s1d0_flerEtasjer`.
- **I. Småhus** — ny seksjon med preaksepterte lempninger for boligbygninger inntil 2 etasjer. Checkboxer: `smahus_lempningOverflater`, `smahus_lempningKledning`, `smahus_lempningTaktekning`.

Hver underseksjon (B–I) er en `Collapsible` med trigger som viser tittel + chevron, default `open=false`. Tilstand holdes i et lokalt `useState<Record<string, boolean>>({})` (ikke i `formData`, kun UI-state).

## Auto-åpning av relevante seksjoner

Ny `useEffect` som basert på `formData.risikoklasse`, `formData.brannklasse`, `formData.bygningstype`, `formData.etasjer` initielt setter `open=true` for:

- B alltid (innvendige overflater er sentralt).
- E hvis `brannklasse ∈ {BKL2, BKL3}` eller `risikoklasse === "RK6"`.
- F alltid (taktekking er obligatorisk vurdering).
- I hvis `bygningstype` inneholder "bolig" / "enebolig" / "rekkehus" / "tomannsbolig" og `parseInt(etasjer) ≤ 2`.
- G/H lukket som default (åpnes manuelt).

Bruker endrer manuelt etter ønske; ingen overstyring etter første render.

## Nye `formData`-felter

Legges til i `formData`-initialiseringen (rundt linje 693–827) og i `useState`-typen. Alle defaultes til `false` eller `""`. Inkluderer feltene listet over for D, E, F, G, H, I.

## Word-eksport (`src/lib/word-export-chapter3.ts`)

Kap 3.6 (linje 1027–1212) refaktoreres slik at hver av delkapittel A–I får sin egen `graySubSectionHeaderRow("A. Generelt")` osv. som underoverskrift. Eksisterende rader fordeles:

- A: dagens "Generelt"-rad.
- B: matNote2/3/4-rader + nye rader fra tabell-strukturen (vegg/tak ≤200, >200, rømningsvei, gulv, kledninger) — bygges på samme måte som dagens "Overflater i brannceller…" / "Kledninger"-blokker, men med ny gruppering.
- C: dagens `himlingNote1/2`-blokk.
- D: dagens `Isolasjon`-blokk + nye linjer for de tre alternativer-checkboxene.
- E: dagens "Utvendige overflater" + ny linje for `naboavstandUnder8m`.
- F: dagens "Taktekning"-blokk under egen overskrift, + nye linjer for underlag/oppbygging.
- G: ny blokk for brannvegg/vinduer/gjennomføringer.
- H: ny blokk for rør- og kanalisolasjon.
- I: ny blokk for småhus-lempninger.

`fravikRowsForParagraf("11-9", fravikList)` og `tilstandRow(...)` beholdes nederst.

`KonseptPreview.tsx` følger samme oppdelingen i HTML-tabellen for kap 3.6 så preview og Word matcher (samme `graySubSectionHeader`-stil).

## Filer som endres

- `src/pages/Konsept.tsx` — UI-refaktor, nye felter, auto-åpne-effekt.
- `src/lib/word-export-chapter3.ts` — A–I underoverskrifter i kap 3.6.
- `src/components/konsept/KonseptPreview.tsx` — speile A–I-strukturen i preview-tabellen.

## Det som IKKE endres

- BF85-grenen av §11-9 (linje 7529–7634) — uendret.
- Eksisterende `matNote*`, `himlingNote*`, `isolasjon*`, `ytterkledningDKrav`-felter — beholdes som er, kun flyttes visuelt.
- Fravik-integrasjon (`FravikForParagraf`) — beholdes nederst i seksjonen.
- Logikk for `getBrannklasse`, risikoklassemapping osv.
