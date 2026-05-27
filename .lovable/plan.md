## Mål

Fjern påtvunget `forsyningssikkerhet`-rad. Brukeren skal selv legge til dimensjoner per hendelse (inkl. forsyningssikkerhet). Eksisterende data migreres trygt; nye hendelser starter med tom liste.

---

## Endring 1 — `src/components/ros/RosPreview.tsx`

**`migrerHendelse` (linje 63–78):**
- Hvis `konsekvensvurderinger` har innhold → returner som er (uten å tvinge forsyningssikkerhet inn).
- Hvis tom og `h.konsekvens` er satt (legacy) → returner med én forsyningssikkerhet-rad bygget fra `h.konsekvens` / `h.konsekvensEtter` / `h.beskrivelseRisikoFor` (samme som dagens fallback).
- Hvis tom og ingen `h.konsekvens` → returner med `konsekvensvurderinger: []`.

**Hendelsestabellen (linje 883–908):**
- Finn `forsyning = hm.konsekvensvurderinger?.find(k => k.dimensjon === "forsyningssikkerhet")` (kan være `undefined`).
- Hvis ikke til stede: vis tomme/`—`-celler for K, R, K-etter, R-etter; bruk nøytral cellestil (ikke `riskCellStyle`). Begrunnelsecellen viser `h.beskrivelseRisikoFor || ""`.

**Sub-tabell konsekvensvurderinger (linje 909–958):**
- Hvis `hm.konsekvensvurderinger.length === 0` → vis i stedet en `<tr>` med kursiv tekst «Ingen konsekvensdimensjoner vurdert».
- Ellers uendret.

---

## Endring 2 — `src/pages/RosAnalyse.tsx`

**`oppdaterKonsekvensvurdering` (linje 299–313):**
- Behold sync med `h.konsekvens` / `h.konsekvensEtter` kun når dimensjonen er `forsyningssikkerhet` OG raden faktisk finnes i `konsekvensvurderinger`. (Dagens kode er allerede ok – kjører kun fra map-callbacken på eksisterende rad.)

**`leggTilDimensjon` (linje 314–317):**
- Hvis ny rad er `forsyningssikkerhet`: sett også `h.konsekvens = 1`, `h.konsekvensEtter = undefined` (eller `1`) for konsistens med matrise/tabell.

**`fjernDimensjon` (linje 318–322):**
- Fjern guard `if (dimensjon === "forsyningssikkerhet") return;`.
- Hvis dimensjonen som fjernes er `forsyningssikkerhet`: sett også `konsekvens: 0`/`undefined` og `konsekvensEtter: undefined` i samme `updateHendelse`-kall.

**Sletteknapp-UI (linje 1126–1131):**
- Fjern `{kv.dimensjon !== "forsyningssikkerhet" && (...)}` – vis Trash-knappen for alle dimensjoner.

**«Legg til dimensjon»-dropdown (linje 1189–1209):**
- Ingen endring nødvendig: bruker allerede `ALLE_DIMENSJONER` filtrert mot `brukte`. Forsyningssikkerhet dukker automatisk opp når den ikke er lagt til.

**`addHendelse` (linje 323–340):**
- Endre `sannsynlighet: 1, konsekvens: 1` → fjern `konsekvens` (eller sett `konsekvens: 0`), behold `sannsynlighet: 1`.
- Sett `konsekvensvurderinger: []`.
- Tilsvarende: ikke initialiser `konsekvensEtter`.

---

## Endring 3 — `src/components/ros/RosMatriks.tsx`

- Oppdater info-tekst til: «Viser konsekvensdimensjonen forsyningssikkerhet for hendelser som har denne dimensjonen vurdert. Hendelser uten forsyningssikkerhet-vurdering vises ikke i matrisen.»
- Komponenten plotter ikke individuelle hendelser i dag (kun `highlight`-prop). Ingen filtreringsendring i selve komponenten er nødvendig; dokumenter i kommentar at evt. fremtidig per-hendelse-plotting må filtrere på `kv.dimensjon === "forsyningssikkerhet"`.

---

## Endring 4 — `src/lib/ros-word-export.ts`

**Hendelses-rad-rendering (rundt linje 643–684):**
- Etter `const hm = migrerHendelse(h)`, finn `forsyning = hm.konsekvensvurderinger?.find(...)`. Hvis ikke til stede, render K/R/K-etter/R-etter-cellene som «—» uten risikoskygge (samme pattern som i preview).

**Sub-tabell (linje 665–684):**
- Endre betingelsen: render alltid en sub-blokk hvis det er noe verdt å vise. Hvis `kvs.length === 0` → render i stedet et avsnitt med kursiv tekst «Ingen konsekvensdimensjoner vurdert» (i den eksisterende innrykkede `F7F9FC`-cellen) i stedet for `buildKonsekvensSubTabell`.
- Sub-tabell forblir uendret når `kvs.length > 0`.

---

## Filer som endres

- `src/components/ros/RosPreview.tsx`
- `src/pages/RosAnalyse.tsx`
- `src/components/ros/RosMatriks.tsx`
- `src/lib/ros-word-export.ts`

Ingen datamigrering, ingen DB-endringer. Eksisterende `konsekvensvurderinger`-array i Supabase berøres ikke.
