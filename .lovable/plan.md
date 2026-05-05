## Mål
I omhyllingsflate-verktøyet skal brukeren kunne velge mellom to beregningsmodi:
1. **Nøyaktig** (dagens) — lengde, bredde, høyde
2. **Forenklet (ca.)** — kun areal (m²) og høyde (m)

Brukes når man ikke kjenner eksakte dimensjoner, men har gulvareal fra tegninger.

## Formler (forenklet modus)
Antar tilnærmet kvadratisk grunnflate:
- Sidelengde: `s = √areal`
- Gulvareal = areal
- Takareal = areal
- Veggflate ≈ `4 · s · h = 4 · √areal · h`
- Total omhyllingsflate ≈ `2 · areal + 4 · √areal · h`

Resultatet merkes tydelig som "ca."-verdi.

## Endring i `src/components/fraviksdokumentasjon/calculators/OmhyllingsflateCalculator.tsx`
- Legg til en `Tabs`-komponent (eller to RadioGroup-knapper) øverst: "Nøyaktig" / "Forenklet (ca.)".
- Forenklet modus viser to felt: `Areal (m²)` og `Høyde (m)`.
- Felles `result`-state og resultatkort gjenbrukes. I forenklet modus vises en liten badge/tekst "ca." ved totalverdien, og label i AttachedCalculation blir `"Omhyllingsflate (ca.): X m²"`.
- `inputs` i `AttachedCalculation` reflekterer hvilken modus som ble brukt (areal_m2 + hoyde_m, eller lengde/bredde/høyde) slik at det er sporbart i fraviksdokumentasjon.
- Grunnlag-boksen får en ekstra linje i forenklet modus som forklarer antakelsen (kvadratisk grunnflate).

Ingen endringer kreves i `Verktoy.tsx`, `Omhyllingsflate.tsx`, `BeregningSection.tsx` eller `CalculatorDialog.tsx` — komponenten brukes likt begge steder.

## Filer som endres
- `src/components/fraviksdokumentasjon/calculators/OmhyllingsflateCalculator.tsx`
