## Mål

På malen "Klassisk" skal den blå linjen øverst på forsiden av brannkonseptet være dobbelt så tykk (strekke seg lenger ned på siden).

## Endringer

Topplinjen rendres med `height: 18` to steder. Endres til `height: 36`:

1. **`src/components/konsept/KonseptPreview.tsx`** (linje 233)
   - `<div style={{ background: primary, height: 18 }} />` → `height: 36`
   - Dette er forhåndsvisningen av selve brannkonseptet.

2. **`src/components/gruppe/MalForhandsvisning.tsx`** (linje 81)
   - Samme endring, slik at malvalg-forhåndsvisningen matcher.

## Ikke berørt

- Word-eksporten (`src/lib/document-templates.ts`) har ingen topplinje for Klassisk-malen i dag — kun "moderne" har en dekorativ linje. Endrer ikke dette med mindre du ønsker det.
- "Moderne" og "Minimalistisk" maler beholdes uendret.
