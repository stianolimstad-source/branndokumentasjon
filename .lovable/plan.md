## Mål
Flytt raden **«Ventilasjonsanlegg – kraftstasjon»** i kapittel 3.7 opp slik at den kommer rett etter den ordinære **«Ventilasjonsanlegg»**-raden, i stedet for å havne nederst sammen med de andre kraftstasjons-radene. Gjør det enklere å se alle ventilasjonskravene samlet. Gjelder både preview og Word-eksport.

«Rom for høyspenningsanlegg» og «Kabler (kulverter, sjakter og kabeltunneler) – kraftstasjon» blir værende i den nederste kraftstasjons-blokken (de hører ikke til ventilasjon).

## Filer som endres

### 1. `src/lib/word-export-chapter3.ts`
- Rett etter den ordinære ventilasjons-raden (linje ~1181, etter `rows.push(contentRowMultiLine("Ventilasjonsanlegg", ventLines, "RIV"));`): legg inn en `if (erKraftstasjon)`-blokk som pusher `contentRow("Ventilasjonsanlegg – kraftstasjon", "...", "RIV")` med dagens tekst.
- Fjern den samme `rows.push(contentRow("Ventilasjonsanlegg – kraftstasjon", ...))` fra kraftstasjons-blokken nederst (linje ~1270). De to andre kraftstasjons-radene (Rom for høyspenningsanlegg og Kabler) beholdes uendret.
- Vurder også å vise raden når `formData.regelverk === "BF85"` og ventilasjon ikke er valgt – nei, vi beholder dagens gating: vises kun når kraftstasjon er valgt og 3.7 har innhold (samme adferd som i dag, bare flyttet posisjon).

### 2. `src/components/konsept/KonseptPreview.tsx`
- Finn ventilasjons-raden i 3.7-tabellen (rett etter den ordinære «Ventilasjonsanlegg»-raden) og sett inn en `{erKraftstasjon && (<tr>…Ventilasjonsanlegg – kraftstasjon…</tr>)}` der.
- Fjern den tilsvarende `<tr>` (linje ~4002–4006) fra den nederste kraftstasjons-IIFE-blokken. La de to andre radene være.

## Akseptansekriterier
- I 3.7 vises radene i denne rekkefølgen ved kraftstasjon: Ventilasjonsanlegg → **Ventilasjonsanlegg – kraftstasjon** → (evt. Vann/avløp, Rør-/kanalisolasjon, Elektrisk) → Rom for høyspenningsanlegg → Kabler … → Kommentar.
- Tekstinnhold i kraftstasjons-raden er uendret.
- For ikke-kraftstasjon prosjekter er kapittelet uendret.
- Word-eksport og preview matcher hverandre.
