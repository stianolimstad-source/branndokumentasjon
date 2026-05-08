# Plan: Mal-farger gjennom hele rapporten + bedre fargevelger

## Mål
1. Når en bedrift velger mal (Klassisk/Moderne/Minimalistisk) skal **alle** farger i rapporten reflektere dette — ikke bare forsiden. Eksempel: kapitteloverskrifter (3.1, 3.2 osv.) som i dag er lyseblå (`bg-blue-100`, `#00a3e0`) skal bli oransje under «Moderne», grå under «Minimalistisk», osv.
2. Fargevalg-feltene under «Dokumentmal for bedriften» skal vise en **ordentlig fargevelger med palett og hex-input** i stedet for OS-ens innebygde glidebryter/fargehjul som er vanskelig å bruke.

## Del 1 — Tematisering av rapportinnhold

**`KonseptPreview.tsx`** (forhåndsvisning på skjerm)
- Bruke `theme.accentColor` som bakgrunn for alle seksjonsoverskrift-rader (`bg-blue-100` → inline `style={{ background: themeAccentSoft }}`). Lager en lys variant av accent (f.eks. 18 % opacitet) for å bevare lesbarheten.
- Erstatte hardkodet `#00a3e0` på kapitteloverskrifter (Kap 4 «Utførelses- og driftsfasen» m.fl.) med `theme.primaryColor`.
- Innføre to hjelpere øverst i komponenten:
  - `themeAccentSoft = hexToRgba(theme.accentColor, 0.18)` — for rad-bakgrunner
  - `themeHeading = theme.primaryColor` — for h2-overskrifter
- Søke gjennom hele filen og bytte ut alle 24 forekomster av `bg-blue-100` og `#00a3e0`.

**`src/lib/word-export-chapter3.ts`** (Word-eksport av kap. 3)
- Erstatte hardkodet lyseblå skygge på seksjonsoverskrift-rader med `theme.accentColor` (lys variant via `tint` eller en utregnet pastell-hex). Funksjonen tar allerede inn et tema/objekt — utvide signaturen ved behov.

**`Konsept.tsx`** (Word-eksport av forsider/øvrige kapitler)
- Bytte gjenværende hardkodede blåtoner i kapitteloverskrifter til `theme.primaryColor`.

**Tilstandsvurdering & Fraviksdokumentasjon**
- Samme prinsipp anvendes der disse modulene har tilsvarende blå seksjonsbakgrunner. Holdes enkelt: kun farge-substitusjoner, ingen layoutendringer.

## Del 2 — Forbedret fargevelger

**Ny komponent `src/components/ui/color-picker.tsx`**
- Popover (shadcn) som åpnes når man klikker på en fargeruta.
- Innhold:
  - Palett med ~12 forhåndsvalgte profesjonelle farger (blå, marinblå, oransje, rød, grønn, grå, sort osv.)
  - Hex-input under paletten for finjustering
  - Liten live-rute som viser valgt farge
- Ingen OS-fargehjul/glidebryter.
- Avhengighet: ingen ekstra pakke nødvendig — bygges med eksisterende Popover/Input.

**`MalvalgPanel.tsx`**
- Bytte ut `<Input type="color" />` for primær- og aksentfarge med den nye `<ColorPicker value={...} onChange={...} />`.
- Beholde hex-tekstfelt ved siden av som i dag, slik at brukere kan lime inn egne koder.

## Tekniske detaljer

- Hex→rgba-hjelper plasseres i `src/lib/utils.ts` (eller lokalt i preview-fil) for å lage pastell-bakgrunner uten å endre `theme.accentColor` selv.
- Ingen DB-/skjema-endringer. Tema-feltet i `contact_groups.template_settings` brukes som før.
- Mørk modus: pastell-bakgrunnen baseres på accent-fargen og fungerer i begge moduser siden tabellinnhold uansett rendres på hvit "papir"-bakgrunn i forhåndsvisningen.

## Hva som ikke endres
- Selve mal-strukturen (Klassisk/Moderne/Minimalistisk forsider) — den ble nettopp ferdigstilt.
- Lagrings-/delings-logikk for maler.
- Oppsett av tilstandsvurdering eller faglig innhold.
