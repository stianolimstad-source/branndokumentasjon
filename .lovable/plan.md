## Mål
Legge til ny seksjon "Transformatorrom" i kap. 3.9 for kraftstasjoner (BF85 og TEK17, brannkonsept og tilstandsvurdering). Vises automatisk når bygningstype/bygningsdel er Kraftstasjon (samme `erKraftstasjon`-sjekk som de øvrige radene).

## Tekstinnhold (ny rad)

**Forhold:** Transformatorrom – kraftstasjon
**Ansvar:** RIE

**Løsning:**

Rom med oljefylte transformatorer, slokkespoler og lignende skal være utført med terskel, steinfilter, oljekum eller lignende, slik at oljen ikke kan renne ut av rommet. Rom med mineraloljefylte transformatorer med samlet ytelse over 1600 kVA, skal ha effektivt automatisk brannslokkingsanlegg eller oljegrube eller annen utførelse med samme brannslokkende effekt.

Oljegrube utføres med steinfilter med tykkelse min. 400 millimeter. Det bør nyttes renvasket stein med størrelse 60–90 millimeter, fortrinnsvis elvestein. Oljekum og eventuell tilleggstank skal romme hele oljemengden og eventuell slokkevæske. Dette innebærer at det må være kontroll over hvor mye slokkevæske som kan bli benyttet, særlig i automatiske slokkeanlegg. Det anbefales å tilrettelegge for tømming av oljegrube fra sikkert område, for eksempel rør (OBS! ikke plastrør) som føres ut av anlegget til tank/sluk for oppsug til tankbiler. I anlegg i fjell/under dagen kan en mulig løsning være å plassere oppsamlingstank lavt i anlegget, for eksempel i turbinkjelleren. Der hvor flere transformatorer har felles oljegrube, er det tilstrekkelig at volumet dekker den største transformatoren, dersom en brann ikke kan spre seg mellom transformatorene (jf. FEA-F § 25).

For å unngå at olje sprer seg utenfor transformatorcellen i tilfeller hvor transformatorkassen sprenges, bør transformatorcellen ha så høy terskel eller andre avgrensninger at rommet over steinfilteret kan oppta minst halvparten av transformatorens oljemengde. Dette er særlig viktig hvor en utblåsing kan skje i retning mot utganger, nødutganger eller steder hvor personer oppholder seg.

Dører inn til transformatorcellene og mellom cellene skal minimum være selvlukkende branndører. Der transformatorcellen er adskilt fra resten av anlegget med store porter, bør det monteres dør i porten.

## Vilkår for visning
Vises når bygningstype eller noen av bygningsdelene har "Kraftstasjon" (samme `erKraftstasjon`-sjekk som benyttes for `Nødbelysning – kraftstasjon` og `Redningsrom – kraftstasjon` i kap. 3.9).

## Tekniske endringer

### `src/components/konsept/KonseptPreview.tsx` (kap. 3.9)
Legge til ny `<tr>` rett etter "Redningsrom – kraftstasjon"-blokken (rundt linje 3887), med samme struktur (font-medium på forhold, avsnittsdelt løsning med `<p className="mt-2">`, dørseksjon som siste avsnitt). Ansvar = RIE.

### `src/lib/word-export-chapter3.ts` (kap. 3.9)
Tilsvarende `contentRowMultiLine("Transformatorrom – kraftstasjon", lines, "RIE")` rett etter `Redningsrom – kraftstasjon`-blokken (rundt linje 1221), med samme `erKraftstasjon39`-betingelse.

Ingen endringer i datamodell eller input-side.