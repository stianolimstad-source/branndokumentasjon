

## Mål
Krav til innmelding til DSB (§ 12) skal beregnes automatisk ut fra de planlagte mengdene som er fylt inn under «Planlagt lagret mengde i bygget», i stedet for å være en ren statisk tabell. Brukeren skal umiddelbart se om planlagt lager utløser innmeldingsplikt — og for hvilken stoffgruppe.

## Logikk — gruppering mot DSB-grenser
Tre stoffgrupper med hver sin grense (uendret kilde, `INNMELDINGS_GRENSER` i `src/lib/brensellagring-krav.ts`):

| Gruppe | Summerer planlagte mengder fra | Grense |
|---|---|---|
| Brannfarlig væske kat 1 og 2 | `vaeske_kat1` + `vaeske_kat2` | 6 000 L |
| Brannfarlig væske kat 3 | `vaeske_kat3` | 12 000 L |
| Diesel og fyringsoljer | `diesel_fyringsolje` | 100 000 L |

Gass (kat 1/2) og aerosoler omfattes ikke av disse tre væske-grensene og rapporteres som «ikke vurdert mot væskegrensene». Hvis gass/aerosoler senere skal vurderes mot egne grenser, beholdes plass i UI for å utvide.

For hver gruppe regnes:
- `sum` (L) basert på `plannedAmounts`
- `status`: `over` (sum ≥ grense) → innmeldingspliktig, `under` (0 < sum < grense) → ikke pliktig, `ingen` (sum = 0) → ikke aktuelt
- `gjenstaende`: grense − sum (vises kun ved `under`)

Samlet status `trengerInnmelding = true` hvis minst én gruppe er `over`.

## UI-endringer i «Innmelding»-fanen
Filen: `src/pages/Brensellagring.tsx`, `TabsContent value="innmelding"` (linje ~1152).

1. Beholde info-boksen øverst, men oppdatere teksten til å vise **automatisk konklusjon**:
   - Grønn boks (`bg-emerald-500/10`, `CheckCircle2`): «Ingen innmeldingsplikt utløst basert på planlagte mengder.»
   - Rød/oransje boks (`bg-destructive/10`, `AlertTriangle`): «Anlegget er innmeldingspliktig til DSB iht. § 12. Følgende stoffgruppe(r) overskrider grensen: …»
   - Nøytral boks når ingen mengder er fylt inn: «Fyll inn planlagte mengder under «Planlagt lagret mengde i bygget» for å vurdere innmeldingsplikt.» med en knapp/lenke som scroller til kortet.

2. Erstatte den eksisterende tabellen med en **vurderingstabell** med kolonner:
   - Stoffgruppe
   - Planlagt mengde (sum L)
   - Innmeldingsgrense (L)
   - Status (badge: «Innmeldingspliktig» rød / «Under grense» grønn / «Ikke aktuelt» grå)
   - Margin (kun når `under`: «X L til grensen»)

3. Ved overskridelse: kort liste «Hva må gjøres» med standardpunkter (melding sendes inn senest 3 mnd før idriftsettelse, skjema via Altinn, krav til informasjon i søknaden) — vises kun når `trengerInnmelding`.

4. Fjerne det eksisterende `valgtStoff` / `tankMengde`-relaterte oppslaget i denne fanen (input-feltene er allerede fjernet — `getInnmeldingsStatus`/`innmeldingsStatus`-bruken renses opp i samme slengen).

## Inkludering i dokumentet
Beholde samme mønster som andre seksjoner:
- Ny «Legg til i dokument»-knapp (`innmeldingInkludert`) i kortet.
- Tekstboks for kommentar (`innmeldingKommentar`).
- Når aktiv legges seksjonen «Innmeldingsplikt til DSB» inn i `BrensellagringPreview.tsx` med:
  - Kort konklusjon (innmeldingspliktig ja/nei + hvilke stoffgrupper).
  - Vurderingstabell (samme kolonner som i UI).
  - Eventuell kommentar.
  - Fotnote: «Forskrift om håndtering av brannfarlig, reaksjonsfarlig og trykksatt stoff (FBRT) § 12».

## State og persistens
Nye felter i `Brensellagring.tsx`:
- `innmeldingInkludert: boolean`
- `innmeldingKommentar: string`

Lagres i `docContent` og leses tilbake i `useEffect`-en som henter eksisterende dokument (samme mønster som `plannedAmounts` / `brannenergiInkludert`).

## Filer som endres
1. **`src/pages/Brensellagring.tsx`** — ny beregningsfunksjon `evaluerInnmelding(plannedAmounts)`, oppdatert UI i Innmelding-tab, ny state og persistens, propagering til preview. Fjerner ubrukte `valgtStoff`/`tankMengde`/`innmeldingsStatus`-rester.
2. **`src/components/brensellagring/BrensellagringPreview.tsx`** — ny prop-blokk og rendering av innmelding-seksjonen, ny entry i `BRENSEL_SECTIONS`/`sections`-listen.

Ingen endringer i `src/lib/brensellagring-krav.ts` (grensene gjenbrukes som de er).

