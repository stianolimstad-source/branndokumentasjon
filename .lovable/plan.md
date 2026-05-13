## Mål
Når bygningstype (eller en bygningsdel) er **Kraftstasjon**, skal teksten for «Brannspjeld i seksjoneringsvegg» (`ventKrav9`) erstattes med en kraftstasjon-spesifikk formulering som krever automatisk lukkende spjeld og forbyr smeltesikring. Gjelder både BF85- og TEK17-prosjekter, både i nettleser-preview, info-boksene under skjemaet og Word-eksport.

## Ny tekst for `ventKrav9` ved kraftstasjon
> «Kanal som føres gjennom seksjoneringsvegg/brannvegg, må ha automatisk lukkende brannspjeld med minimum samme brannmotstand som seksjoneringsveggen. Spjeld med smeltesikring er ikke tillatt i kraftstasjoner – det skal benyttes automatiske spjeld som sikrer rask avstengning og hindrer røykspredning før temperaturen er blitt høy.»

For ikke-kraftstasjon beholdes dagens tekst uendret.

## Detektering av kraftstasjon
Samme mønster som ellers i koden:
```ts
const erKraftstasjon =
  (formData.bygningstype || "").toLowerCase().includes("kraftstasjon")
  || (formData.bygningsdeler || []).some((d: any) =>
       (d.bygningstype || "").toLowerCase().includes("kraftstasjon"));
```

## Filer som endres

### 1. `src/components/konsept/KonseptPreview.tsx`
- Linje ~3836 (BF85-gren) og ~3865 (TEK17-gren): bytt ut `ventKrav9`-`<li>` med en kraftstasjon-conditional tekst (ny tekst over hvis `erKraftstasjon`, ellers eksisterende tekst).

### 2. `src/lib/word-export-chapter3.ts`
- Linje ~1174–1175: samme conditional på `formData.ventKrav9`-grenen i ventilasjonsraden, slik at Word-rapporten matcher preview.
- Den eksisterende «Ventilasjonsanlegg – kraftstasjon»-raden (linje 1266) beholdes uendret – den utfyller, men skal ikke duplisere brannspjeld-teksten.

### 3. `src/pages/Konsept.tsx` (info-bokser «Følgende krav er automatisk inkludert i rapporten»)
- Linje ~7657 (BF85-gren) og ~7679 (TEK17-gren): når `formData.ventKrav9` og kraftstasjon, vis kort variant: «Brannspjeld i seksjoneringsvegg – automatisk lukkende, smeltesikring ikke tillatt (kraftstasjon).» Ellers dagens «Brannspjeld i seksjoneringsvegg».
- Linje ~7751 (oppsummeringspunkt om Ventilasjonsanlegg) berøres ikke – det er allerede korrekt formulert.

## Akseptansekriterier
- Med bygningstype/-del som inneholder «kraftstasjon» og `ventKrav9` aktiv: preview, info-boks og Word-eksport viser den nye teksten om automatisk lukkende brannspjeld og forbud mot smeltesikring – både for BF85 og TEK17.
- For alle andre bygningstyper er teksten uendret.
- Ingen endringer i logikk for andre `ventKrav*` eller andre kapitler.
