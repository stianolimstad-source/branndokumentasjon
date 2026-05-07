## Mål
Legg til tilleggskrav for kraftstasjoner i kap. 3.11 (TEK17 §11-14 og BF85 Kap. 30:7): For rom med høyspentanlegg skal panikkbeslaget være utformet slik at det kan åpnes med kne, albue eller annen kroppsdel (ikke krav om bruk av hånd).

## Endringer

### 1. `src/components/konsept/KonseptPreview.tsx` (~linje 4498, panikkbeslag-blokken)
Når `erKraftstasjon === true`, utvid eksisterende panikkbeslag-tekst med en ekstra setning:
> "For rom med høyspentanlegg skal beslaget være utformet slik at det kan betjenes med kne, albue eller annen kroppsdel, slik at dør kan åpnes uten bruk av hender."

Gjelder både TEK17- og BF85-grenen (samme `erKraftstasjon`-conditional).

### 2. `src/lib/word-export-chapter3.ts`
Speil samme tekst i Word-eksporten der panikkbeslag-raden eksporteres for kap. 3.11. Hvis raden ikke finnes ennå, legg til samme conditional.

## Filer som endres
- `src/components/konsept/KonseptPreview.tsx`
- `src/lib/word-export-chapter3.ts` (ved behov)

Ingen nye skjemafelter — kravet er automatisk når kraftstasjon er valgt.
