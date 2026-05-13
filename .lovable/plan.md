## Mål
Under kap. 3.7 «Tekniske installasjoner» for **BF85**-prosjekter skal vi også kunne ta inn de elektriske preaksepterte ytelsene fra TEK17 §11-10 som vurderingsgrunnlag, på samme måte som vi i dag gjør for ventilasjonsanlegg. BF85 sier kun «For elektriske installasjoner vises til gjeldende forskrifter for elektriske anlegg.», og vi kan derfor referere TEK17 §11-10 som preakseptert grunnlag.

I dag finnes elektrisk-raden kun i TEK17-grenen (preview, Word, info-boks). For BF85 finnes ingen checkbox for elektrisk og ingen rad i rapporten.

## Endringer

### 1. `src/pages/Konsept.tsx` – BF85-skjema (kap. 3.7)
- I BF85-grenen (linje ~7438–7493) legges en ny boks **«Elektriske installasjoner er installert / relevant»** under ventilasjons-boksen, som styrer eksisterende `formData.elektriskRelevant`.
  - Når avhuket: liten hjelpe-tekst «BF85 viser til gjeldende forskrifter for elektriske anlegg. TEK17 §11-10 og preaksepterte ytelser legges til grunn som vurderingsgrunnlag.»
- I info-boksen «Følgende krav er automatisk inkludert i rapporten» for BF85 (rundt linje 7625), legg til betinget liste-punkter når `formData.elektriskRelevant`:
  - «Kabler over nedforet himling/hulrom i rømningsvei – krav til brannenergi, sjakt, brannmotstand eller sprinkling»
  - «Kabler med liten brannenergi (< 50 MJ/lm) kan føres ubeskyttet gjennom rømningsvei»

### 2. `src/components/konsept/KonseptPreview.tsx` – BF85-tabell i 3.7
- I BF85-grenen i 3.7-tabellen, etter ventilasjons-rad(er), legg til en `{formData.elektriskRelevant && (<tr>…</tr>)}` med:
  - Tittel: «Elektriske installasjoner»
  - Innledende italic-tekst: *«BF85 viser kun til gjeldende forskrifter for elektriske anlegg. Som vurderingsgrunnlag legges preaksepterte ytelser fra TEK17 §11-10 til grunn:»*
  - Samme `<ul>` som dagens TEK17-rad (kabel-krav, 50 MJ/lm-unntak).
  - Ansvar: RIE.

### 3. `src/lib/word-export-chapter3.ts` – Word-eksport 3.7
- I `if (formData.elektriskRelevant)` (linje ~1235) legg til en innledende linje når `formData.regelverk === "BF85"`: «BF85 viser kun til gjeldende forskrifter for elektriske anlegg. Som vurderingsgrunnlag legges preaksepterte ytelser fra TEK17 §11-10 til grunn:» foran de eksisterende kabel-linjene. For TEK17 fortsetter raden uendret.
- Den eksisterende «hvis ingenting er valgt → Generelt-rad» (linje 1246) tar `elektriskRelevant` med, så ingen endring der.

## Akseptansekriterier
- For BF85-prosjekter vises ny checkbox «Elektriske installasjoner er installert / relevant» i 3.7.
- Når avhuket genererer både preview, Word-rapport og info-boks elektrisk-raden basert på TEK17 §11-10, med tydelig BF85-innledning som forklarer henvisningen.
- For TEK17-prosjekter er rad og oppførsel uendret.
- Ingen endringer på andre kapitler eller `formData`-felter (gjenbruker `elektriskRelevant`).
