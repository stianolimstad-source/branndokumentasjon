## Mål
Legge til ny rad "Kabler (kulverter, sjakter og kabeltunneler)" i kap. 3.7 for kraftstasjoner (BF85 og TEK17, brannkonsept og tilstandsvurdering). Vises automatisk når bygningstype/bygningsdel er Kraftstasjon, plassert rett etter eksisterende "Rom for høyspenningsanlegg"-rad (samme `erKraftstasjon37`-sjekk).

## Tekstinnhold (ny rad)

**Forhold:** Kabler (kulverter, sjakter og kabeltunneler) – kraftstasjon  
**Ansvar:** RIE

**Løsning** (avsnitt + punktlister):

Kabler skal være forlagt slik at de er beskyttet mot skade fra brann, trykkpåkjenninger mv.

Kabler for nødkraftanlegg, styringsanlegg og samband mellom stasjonsinngang og redningsrom skal være forlagt adskilt fra hverandre og adskilt fra andre kabler. Med adskilt menes et lysbuebeskyttende mekanisk skille. Likeverdig med dette godtas "brannsikker" kabel (jf. FEA-F §26).

Nedenfor er listet eksempler på sannsynlighet og/eller konsekvensreduserende tiltak:
- Ulike kabeltyper bør skilles på forskjellige kabelstiger for å unngå at brann i en kraftkabel skader andre kabler
- Kabelforlegning i kabelkanaler/kabeltunneler som brukes som rømningsveier og/eller friskluftinntak bør seksjoneres

Unngå å legge viktige kabler nærmest taket da temperaturen ved brann normalt blir høyest der. Hovedregelen ved plassering av ulike kabeltyper på forskjellige kabelstiger over hverandre er at man legger kraftkabler på øverste stige og styre-/kontrollkabler på nederste stige. I kabelkulverter/-kanaler og andre større forlegninger med mange kabelstiger over hverandre, bør man sørge for at man har en avstand på minst 300 mm mellom stigene.
- Det legges bare ett lag kraftkabler på hyller og kabelbroer. Mellom kraftkablene bør det dessuten være en avstand på ca. halvparten av kabelens diameter
- Horisontale avskjerminger med en plate av samme bredde som kabelstigen og plassert like under
- Store og høye vertikale forlegninger bør seksjoneres. I tillegg må det fokuseres mot god festing
- Kabelstiger bør kuttes på begge sider av gjennomføringer for å unngå varmegjennomgang og bevegelse gjennom brannskillet
- Kabler bør føres utenom brannfarlige områder
- Lange kabelkulverter bør deles opp ved hjelp av brannsikre vegger og brannklassifiserte gjennomføringer. Dersom ventilasjon av rom eller forhold gjør det nødvendig, kan branndører settes i åpen stilling på holdemagnet tilkoblet brannalarmanlegg
- Kablers brannmotstand kan økes ved å påføre kabler brannhemmende maling

## Vilkår for visning
Samme `erKraftstasjon37`-sjekk som benyttes for "Rom for høyspenningsanlegg" (linje 3460-3473 i KonseptPreview, linje 1070-1080 i word-export-chapter3).

## Tekniske endringer

### `src/components/konsept/KonseptPreview.tsx` (kap. 3.7)
Legge til ny `<tr>` rett etter "Rom for høyspenningsanlegg"-blokken (rundt linje 3473), inne i samme `erKraftstasjon37`-IIFE eller som ny IIFE rett etter. Bruker `<p>`-avsnitt og `<ul className="list-disc pl-4">` for punktlister, samme styling som øvrige flertekst-rader. Ansvar = RIE.

### `src/lib/word-export-chapter3.ts` (kap. 3.7)
Legge til `contentRowMultiLine("Kabler (kulverter, sjakter og kabeltunneler) – kraftstasjon", lines, "RIE")` rett etter "Rom for høyspenningsanlegg"-raden (rundt linje 1079), inne i samme `erKraftstasjon37`-blokk. Bruker `•`-prefiks for punktlister, blanke linjer som avsnittsskille (samme mønster som Transformatorrom).

Ingen endringer i datamodell eller input-side.
