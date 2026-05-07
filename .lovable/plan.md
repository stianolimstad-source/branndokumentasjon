## Mål
Utvid panikkbeslag-teksten for kraftstasjon (kap. 3.11) med tilleggskrav for rom med høyspentanlegg: beslaget må også kunne benyttes av personer som åler/kryper, dvs. vertikalmontert slik at det kan betjenes uansett høyde.

## Endringer

### 1. `src/components/konsept/KonseptPreview.tsx` (~linje 4507)
Utvid eksisterende kraftstasjon-tekst til:
> "For kraftstasjon må dør i rømningsvei være utført for sikker rømning ved at døren kan åpnes manuelt med ett grep og uten bruk av nøkkel (panikkbeslag iht. NS-EN 1125). For rom med høyspentanlegg skal beslaget være utformet slik at det kan betjenes med kne, albue eller annen kroppsdel, slik at dør kan åpnes uten bruk av hender. Beslaget skal også kunne benyttes av personer som åler eller kryper, og må derfor være vertikalmontert slik at det kan betjenes uansett høyde."

### 2. `src/lib/word-export-chapter3.ts` (~linje 1339)
Speil samme utvidede tekst i Word-eksportens panikkbeslag-rad.

## Filer som endres
- `src/components/konsept/KonseptPreview.tsx`
- `src/lib/word-export-chapter3.ts`
