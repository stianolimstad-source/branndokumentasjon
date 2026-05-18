## Problem

Når brukeren huker av «Tiltaket/bygget har flere risikoklasser eller brannklasser» i et brannkonsept, krasjer siden (blank skjerm). Toggleren legger automatisk til «Bygningsdel 2» med tomme felter, og forhåndsvisningen prøver å lese egenskaper (`.rk` / `.bkl`) på en `[0]`-indeks i en liste som da kan være tom.

## Årsak

Flere steder i `src/components/konsept/KonseptPreview.tsx` (samt et tilsvarende sted i Word-eksport) bygger en `alleDeler`/`materialDeler`/`rorParts`-liste basert på utfylte risiko-/brannklasser. Når disse er tomme blir lista tom, men koden indekserer direkte (`alleDeler[0].bkl`, `rorParts[0].rk`) uten å sjekke `length` — det gir «Cannot read properties of undefined».

Hovedmistenkt: `KonseptPreview.tsx` linje ~2361 (Dørkrav-tabellen) der ytre vilkår tillater rendering så snart `harFlereRisikoklasser && bygningsdeler.length > 0`, men `alleDeler` fylles kun når brannklasse faktisk er satt.

## Endringer

### `src/components/konsept/KonseptPreview.tsx`
- Dørkrav-blokken (rundt linje 2254–2367): legg til `if (alleDeler.length === 0) return null;` etter at lista er bygget, slik at både `else`-grenen (linje 2361) og `getKravForDel(alleDeler[0], …)` aldri kjører på tom liste.
- Branncellebegrensende-blokken (rundt linje 2053–2114) og Heismaskinrom-blokken (rundt linje 2117–2149) og Fyrrom-blokken (rundt linje 2150–2235): allerede returneres `null` ved tom liste i én av dem; verifiser og legg til samme tidlig-retur for `renderValue` i fyrrom.
- Rør-/kanal­isolasjons­blokken (rundt linje 3962–3977): sikre `if (!allParts.length) return null;` før `allParts[0].rk` leses, slik at det også tåler «isMulti=false men allParts tom»-tilfellet.

### `src/lib/word-export-chapter3.ts`
- Linje ~1239 (`rorParts[0].rk`): hopp over avsnittet hvis `rorParts.length === 0` (defensiv, ettersom export også kan trigges fra preview-knapp).

### `src/pages/Konsept.tsx` (toggle-håndtering)
- Linje 3320–3328 (onChange for `harFlereRisikoklasser`): når brukeren huker av og det opprettes en tom «Bygningsdel 2», forhåndsutfyll `risikoklasse` og `brannklasse` med samme verdi som Bygningsdel 1 hvis disse finnes. Dette gir trygge defaults og hindrer at preview ser tomme felter umiddelbart etter avhuking.

## Verifisering

1. Åpne et eksisterende brannkonsept med utfylt risiko-/brannklasse.
2. Huk av «Tiltaket/bygget har flere risikoklasser eller brannklasser» → siden skal ikke krasje, og forhåndsvisning skal vise Bygningsdel 1 + en tom Bygningsdel 2.
3. Tøm risikoklasse/brannklasse på Bygningsdel 1 og bekreft at preview fortsatt rendres uten feil.
4. Bekreft i devtools-console at det ikke kastes «Cannot read properties of undefined» under interaksjonen.
