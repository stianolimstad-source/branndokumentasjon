## Endring: Marker manglende brannvegg/seksjonering i eksisterende bygg

I tilstandsvurderingen for både BF85 og TEK17 (kap. 3.4) trenger vi en mulighet til å registrere at brannvegg (BF85) eller seksjoneringsvegg (TEK17) **ikke er til stede** i bygget, selv om regelverket krever det. Mange eldre bygg mangler dette, og avviket må synliggjøres i rapporten.

### Inputside (`src/pages/Konsept.tsx`, kap. 3.4 ca. linje 4512–4915)

Legg til ett nytt felt øverst i kap. 3.4-seksjonen, kun synlig når dokumenttypen er **tilstandsvurdering**:

- Checkbox med tekst (dynamisk):
  - BF85: «Brannvegg er ikke etablert i bygget (avvik fra Kap. 30:6)»
  - TEK17: «Seksjoneringsvegg er ikke etablert i bygget (avvik fra § 11-7)»
- Når avhuket: vis et lite kommentarfelt («Kommentar / begrunnelse») og en valgfri tilstandsgrad-pille (TG2/TG3 anbefales).

State: nye felter `manglerSeksjonering: boolean` og `manglerSeksjoneringKommentar: string` i `formData`.

Når avhuket skal de eksisterende beregnings-/krav-blokkene (Tabell 32:12, 34:23, TEK17-tiltak/brannenergi-velgere osv.) fortsatt vises slik at krav er dokumentert – men det legges en tydelig rød advarselsboks over dem: «⚠ Avvik: Brannvegg/seksjonering mangler i bygget – krav iht. regelverk er ikke oppfylt.»

### Rapport / preview (`src/components/konsept/KonseptPreview.tsx`, kap. 3.4)

I kap. 3.4 i rapporten:
- Hvis `manglerSeksjonering` er sant: vis en avviksboks/rad øverst i kapitlet med teksten «Brannvegg/seksjonering er ikke etablert i bygget. Iht. [BF85 Kap. 30:6 / TEK17 § 11-7] kreves dette. Dette utgjør et avvik fra regelverket.» + brukerens kommentar dersom utfylt.
- Krav-tabellen vises som før (slik at leser ser hva som *skulle* vært på plass).

### Hva endres ikke
- Logikken som beregner krav (areal vs. tiltak vs. brannenergi) endres ikke.
- Word-eksport følger preview-rendringen automatisk.
- Konseptmodus (ikke tilstandsvurdering) er uendret – feltet vises kun i tilstandsvurdering.
