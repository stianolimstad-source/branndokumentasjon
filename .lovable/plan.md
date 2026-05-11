## Mål
Når BF85 er valgt i tilstandsvurdering og bygningsbrannklasse er satt i kap. 2, vis en liten info-boks rett under select-feltet som viser hva valget tilsvarer i TEK17 (brannklasse + risikoklasse).

## Mapping (BF85 → TEK17)

**Brannklasse (BKL) – fra valgt bygningsbrannklasse:**
BF85 har omvendt nummerering av TEK17 (BBK 1 = strengest).
- BBK 1 → BKL 3
- BBK 2 → BKL 2
- BBK 3 → BKL 1
- BBK 4 → ingen direkte tilsvarende (mindre/uklassifiserte bygg under TEK17 sin BKL 1)

**Risikoklasse (RK):** slås opp via eksisterende `bygningsTypeRisikoklasseMap[formData.bygningstype]`. Hvis bygningstype mangler, utelates RK fra teksten.

## Endring i `src/pages/Konsept.tsx`
Etter `<Select>` for bygningsbrannklasse (rundt linje 3776, innenfor `</div>`), legg til en liten info-boks (`bg-muted/50`, `text-xs`, padding) som viser:

> **Tilsvarende i TEK17:** Brannklasse {bkl}, Risikoklasse {rk} ({bygningstype})
> *Mappingen er veiledende – BF85 og TEK17 har ulike inndelingsprinsipper.*

For BBK 4: vis "ingen direkte tilsvarende brannklasse i TEK17".

Vises kun når `formData.regelverk === "BF85"` og `formData.bygningsbrannklasse` er satt.

## Ingen endring
- Ingen DB- eller skjemaendringer.
- Ingen påvirkning på beregninger eller rapporteksport – ren visningsinformasjon i UI.
- Brannkonsept-modus uberørt.