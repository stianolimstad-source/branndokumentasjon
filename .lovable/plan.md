## Mål
For tilstandsvurderinger: lås kapittel 2–6 inntil regelverk er valgt i kap. 1. Gjelder ikke brannkonsept.

## Endringer i `src/pages/Konsept.tsx`

For hver `<AccordionItem value="kap2|kap3|kap4|kap5|kap6">` (linjer ca. 3039, 3898, 9152, 9200, og kap6):

1. Beregn `regelverkLocked = documentType === "tilstandsvurdering" && !formData.regelverk`.
2. På `AccordionItem`: legg til `disabled={regelverkLocked}` og betinget className for redusert opacity (`opacity-60`).
3. På `AccordionTrigger`: bytt ut bare når låst – vis i tillegg en `Lock`-ikon (lucide-react) og hjelpetekst: *"Velg regelverk i kap. 1 for å låse opp"*.
4. Skjul `AccordionContent` når låst (rendrer ingenting / `forceMount={false}`), eller alternativt ikke åpne (Radix Accordion respekterer ikke `disabled` på Item, så vi løser det ved å:
   - sette `value` i `Accordion` slik at låste kapitler ikke kan settes som åpne
   - styrer via `onValueChange`: blokker bytte til kap2-6 hvis låst).

### Implementasjon
Konverter Accordion fra ukontrollert til kontrollert (`type="multiple"`, `value`/`onValueChange`). I `onValueChange` filtreres låste kapitler ut. AccordionTrigger får en `Lock`-ikon + tooltip-tekst når låst, og hover/cursor settes til `not-allowed`.

## Ingen endring
- Brannkonsept-modus er uberørt.
- Kap. 1 (med regelverk-velgeren) og sammendrag-seksjonen forblir åpne.
- Ingen DB-/skjemaendringer.