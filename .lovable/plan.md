## Mål

Vise kun de §11-13 og §11-14-kravene som faktisk gjelder prosjektets risikoklasse og valg. Erstatte hardkodede setninger med dynamiske kravlinjer, legge til validering av brukerangitte fluktveier, og rydde i Word-eksport. Bruke prinsippet «ingen tabeller med alle alternativer side ved side».

## Endringer

### 1) `src/pages/Konsept.tsx` – nye formData-felter

I `formData`-initialiseringen (sammen med eksisterende rømningsfelter):
- `fluktveiLengdeProsjekt: ""` (string, tall i meter)
- `fluktveiDorTilTrappRK6: ""` (string, tall i meter)
- `romningsveiLengdeProsjekt: ""` (string, tall i meter — for §11-14 punkt 3)
- `friBreddeProsjekt: ""` (string, tall i meter — for §11-14 punkt 4)
- `inkluderReferansetabeller: false` (global innstilling, plasseres i prosjektinnstillinger ved Word-eksport)

Bruker eksisterende `formData.romningsveiTrappeValg` (string[]) til situasjonsvalg.

### 2) `src/pages/Konsept.tsx` – Del A: §11-13 maksimal fluktvei (kap 3.10)

Plassere en ny underseksjon **øverst** i 3.10 (rett etter `border-b-2`-overskriften på linje ~9566, før eksisterende `boenhetKunEttTrapperom`-blokken). Vises bare når `!isBF85Tilstand`.

Logikk:
- Beregn unike RK fra `formData.risikoklasse` + `formData.bygningsdeler[].risikoklasse` (dedup).
- For hver unik RK, render én linje med tilhørende kravtekst:
  - RK1/RK2: «Krav til maksimal fluktvei: 50 m (§ 11-13 Tabell 1, RK 1 og 2).» (én linje, slått sammen hvis begge finnes)
  - RK3/RK5: «Krav til maksimal fluktvei: 30 m.» (én linje hvis enten/begge finnes)
  - RK4: ingen ny tekst her (RK4 er ikke nevnt i kravlisten — beholdes som i dag)
  - RK6: «Krav til maksimal fluktvei: 25 m. I tillegg: avstand fra dør i branncelle til nærmeste trapp eller utgang maksimalt 7,0 m (§ 11-13 figur 4).»
- Under teksten: `Input type=number` «Lengste fluktvei i prosjektet (m)» bundet til `formData.fluktveiLengdeProsjekt`. Beregn strengeste tillatt (min av aktive krav: 50/30/25). Vis `<Alert variant="destructive">` hvis `Number(verdi) > strengeste`.
- Hvis RK6 er aktiv: ekstra `Input type=number` «Maks avstand fra dør til nærmeste trapp (m)» bundet til `formData.fluktveiDorTilTrappRK6`, advarsel hvis > 7,0.
- Nederst i seksjonen: `<Collapsible>` (default lukket) med trigger «Vis referansetabell for alle risikoklasser» som åpner en `<table>` med Tabell 1 fra VTEK § 11-13 (RK1: 50, RK2: 50, RK3: 30, RK4: 30, RK5: 30, RK6: 25).

### 3) `src/pages/Konsept.tsx` – Del B: §11-14 punkt 3 (kap 3.11)

Beholde eksisterende valg-UI (checkbox-gruppen rundt linje 10110-10138 — multi-select; brukerens omtale av «radio-knapper» tolkes som «behold brukervalg», ikke endre til radio). Etter checkbox-gruppen, legge til:
- Et tallinput «Lengste avstand i rømningsvei (m)» bundet til `formData.romningsveiLengdeProsjekt`.
- Render kun den/de aktive kravlinjene basert på valg i `romningsveiTrappeValg`:
  - `"en_trapp"`: «Krav: maksimalt 15 m (§ 11-14 punkt 3a).»
  - `"sammenfallende"`: «Krav: maksimalt 15 m (§ 11-14 punkt 3b).»
  - `"flere_trapper"`: «Krav: maksimalt 30 m (§ 11-14 punkt 3c).»
- Strengeste krav = min av aktive. Vis rød advarsel hvis input > strengeste.

### 4) `src/pages/Konsept.tsx` – Del C: §11-14 punkt 4 fri bredde

Ny blokk i 3.11 (etter Del B). Beregn `kravBredde` basert på RK + bygningstype:
- RK1/RK2/RK4: 0,86 m
- RK3/RK5: 1,16 m
- RK6 + bygningstype «Bolig»/RK6 boligunntak: 0,86 m (med boligunntak-merknad)
- RK6 ellers: 1,16 m

Render kun den ene aktuelle kravlinjen. Bruk eksisterende `persontallAreal`/`persontallKategori` for å beregne persontall P, deretter `strengeste = max(kravBredde, P * 0,01)` m. Vis: «Strengeste krav for ditt prosjekt: X m. Du har angitt Y m.» bundet til ny input `formData.friBreddeProsjekt`. Rød `<Alert>` hvis Y < X.

Erstatte/erstatte eksisterende bredde-tekst i «automatisk inkludert»-listen (linje 10222 + 10240) slik at den henter `kravBredde` fra samme funksjon for konsistens.

### 5) `src/pages/Konsept.tsx` – Del D: Word-eksport globalflagg

Legg til en `<Checkbox>` «Inkluder referansetabeller i rapport» bundet til `formData.inkluderReferansetabeller` i Prosjektinnstillinger-seksjonen (samme sted som andre globale brytere — søk «inkluder» eller plasser nær Word-eksport-knappen).

### 6) `src/lib/word-export-chapter3.ts` – Word-output for §11-13 og §11-14

I 3.10-blokken (rundt linje 1638): Legg til ny rad **Maksimal fluktvei** rett etter «Generelt» (linje 1644). Innhold genereres dynamisk:
- Bygg unike RK-er (samme logikk som i UI).
- Skriv én linje per aktiv kravgruppe (50/30/25).
- Hvis `fluktveiLengdeProsjekt` finnes: legg til linje «Prosjektert lengste fluktvei: X m.» Hvis RK6 og `fluktveiDorTilTrappRK6`: ekstra linje med 7 m-vurdering.
- Ingen tabell med alle alternativer med mindre `formData.inkluderReferansetabeller === true` — da legges referansetabell-rad til som sluttrad.

I 3.11-blokken (rundt linje 1810): Legg til ny rad **Lengde i rømningsvei (§ 11-14 punkt 3)**:
- Vis kun kravlinjen(e) som matcher `romningsveiTrappeValg`.
- Inkluder prosjektert lengde hvis `romningsveiLengdeProsjekt` satt.

I samme blokk, oppdater eksisterende «Dører til rømningsvei»-rad (linje 1736-1781) slik at fri bredde-linjen bruker bare prosjektets `kravBredde` (ikke flere RK-er på rad) med mindre `inkluderReferansetabeller === true`. Legg til ny rad **Fri bredde (§ 11-14 punkt 4)** med kravbredde + persontall-beregning + prosjektert bredde + ev. avvik-flagg.

### 7) `src/components/konsept/KonseptPreview.tsx` – live-preview

Speile endringene fra 3.10 og 3.11:
- 3.10-render (rundt linje 4791-5008): Legg til ny rad/blokk «Maksimal fluktvei» med samme RK-spesifikke logikk, prosjektert verdi og avviksvarsel. Vis referansetabell kun hvis `inkluderReferansetabeller`.
- 3.11-render (rundt linje 5140-5240): Vis kun den aktive bredde-kravlinjen (oppdater linje 5151-5169 til å bruke samme `kravBredde`-funksjon). Legg til kravlinje for §11-14 punkt 3 basert på `romningsveiTrappeValg` + prosjektert lengde.

## Felles hjelpefunksjon

Opprett liten utility i `src/lib/fire-concept-constants.ts`:
```
export function getAktiveRiskKlasser(formData): string[]
export function getFluktveiKrav(rk: string): number | null  // 50/30/25
export function getFriBreddeKrav(rk: string, bygningstype: string): { bredde: number, merknad?: string }
```
Brukes både i Konsept.tsx, KonseptPreview.tsx og word-export-chapter3.ts for å sikre konsistens.

## Utenfor scope
- BF85-tilstandsvurdering (kap 3.10 BF85 §7) – endres ikke.
- Selve §-paragrafens FravikForParagraf / TilstandPanel.
- Eksisterende trapperom-logikk, dør-spesifikasjoner, panikkbeslag osv.
- DB-schema – nye felter lagres i eksisterende `formData`-JSON.
