## Problem
TEK17-tilsvarende info som ble lagt til under BBK-velgeren i kap. 2 vises ikke tydelig nok, og finnes ikke i forhåndsvisningen i det hele tatt.

## Løsning

### 1. Inputside – `src/pages/Konsept.tsx` (rundt linje 3776–3791)
Beholder eksisterende info-boks men gjør den tydeligere:
- Større padding, sterkere bakgrunn (`bg-blue-50 dark:bg-blue-950/30`, border)
- Tekst i `text-foreground` (ikke muted) slik at den faktisk synes
- Tydeligere overskrift "Tilsvarende klassifisering etter TEK17"

Mapping:
- BBK 1 → BKL 3
- BBK 2 → BKL 2
- BBK 3 → BKL 1
- BBK 4 → ingen direkte tilsvarende brannklasse i TEK17

Risikoklasse hentes fra `bygningsTypeRisikoklasseMap[formData.bygningstype]`.

### 2. Forhåndsvisning – `src/components/konsept/KonseptPreview.tsx`

**Tilstandsvurdering-grenen (linje 629–633):** Utvid raden for "Bygningsbrannklasse" med en ny rad rett under:
> **Tilsvarende etter TEK17:** Brannklasse {x}, Risikoklasse {y} ({bygningstype})
> *Veiledende mapping – BF85 og TEK17 har ulike inndelingsprinsipper.*

**Brannkonsept BF85-grenen (linje 706–715):** Samme tilleggsrad i tabellen for "Bygningsbrannklasse (BF85)".

Begge bruker samme mapping som inputsiden. Vises kun når `formData.bygningsbrannklasse` er satt.

## Ingen endring
- Ingen DB- eller skjemaendringer.
- Ingen påvirkning på beregninger.
- Word-eksport kan oppdateres senere ved behov; ikke del av dette punktet.