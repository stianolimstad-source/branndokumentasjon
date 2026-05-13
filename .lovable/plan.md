## Mål
I rapporten kap. 3.7 for BF85 angir BF85 kun «Anlegget skal være slik utført at det ikke medfører økt risiko for brann» – som er åpent for tolkning. Legg til TEK17 §11-10 sine preaksepterte krav til ventilasjonsanlegg som vurderingsgrunnlag i BF85-rapporten.

## Endring

Fil: `src/components/konsept/KonseptPreview.tsx` (BF85-blokken i 3.7, linje ~3807–3822)

Inne i `isBF85` ? -grenen, etter den eksisterende `:1332 Avtrekk`-raden, legg til en ny rad «Ventilasjonsanlegg» som vises når `formData.ventilasjonRelevant` er huket. Innhold:

- Innledende kursiv merknad:
  > BF85 stiller kun det generelle kravet om at anlegget ikke skal medføre økt risiko for brann. Som vurderingsgrunnlag legges preaksepterte ytelser fra TEK17 §11-10 til grunn:
- Deretter samme `<ul>`-liste som TEK17-grenen viser (linje 3829–3839), inkludert toggles for `ventKrav5`, `ventKrav6`, `ventKrav7`, `ventKrav8`, `ventKrav9`.
- Ansvar: «RIV».

Dagens `:1332 Avtrekk`-rad beholdes uendret.

## Tekniske detaljer
- Gjenbruker eksisterende state-felt og toggles fra TEK17-grenen – ingen endringer i input-skjema eller datamodell.
- Påvirker både `/konsept` og `/tilstandsvurdering` (samme komponent).
- Word-eksport følger preview-strukturen, så ingen separat eksport-endring.
