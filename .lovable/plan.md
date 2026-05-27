# Bredere beregningsdialog + rediger-knapp

## Problem
Trafoeksplosjons-verktøyet (og andre kalkulatorer) åpnes i en dialog som er for smal (`max-w-4xl`), så feltene blir trange. Det finnes heller ingen måte å endre parametrene på en allerede importert beregning – man må slette og legge inn på nytt.

## Endringer

### 1. Utvid kalkulator-dialogen
**Fil:** `src/components/fraviksdokumentasjon/CalculatorDialog.tsx`
- Endre `DialogContent`-klassen fra `max-w-4xl max-h-[90vh]` til `max-w-[95vw] xl:max-w-6xl max-h-[92vh]` slik at verktøy som TrafoEksplosjon, Brannmotstand og Brannenergi får god plass på store skjermer og fyller bredden på mindre skjermer.

### 2. Rediger-knapp på beregningskort i ROS-analysen
**Fil:** `src/pages/RosAnalyse.tsx` (beregningskapittelet, ca. linje 1370–1400)
- Legg til en blyant-ikon-knapp (`Pencil` fra lucide-react) ved siden av slette-knappen på hvert beregningskort.
- Klikk åpner `CalculatorDialog` med riktig `type` og en ny `editingId`-state slik at importen skal **erstatte** den eksisterende beregningen i stedet for å legge til en ny.
- Behold `id`, `hendelseIds` og `kommentar` fra den opprinnelige beregningen når den erstattes.

**Implementasjon (skissert):**
```tsx
const [editingBeregning, setEditingBeregning] = useState<RosBeregning | null>(null);

const handleImport = (calc: AttachedCalculation) => {
  if (editingBeregning) {
    updateBeregning(editingBeregning.id, {
      ...calc,
      id: editingBeregning.id,
      hendelseIds: editingBeregning.hendelseIds,
      kommentar: editingBeregning.kommentar,
    });
    setEditingBeregning(null);
  } else {
    addBeregning(calc);
  }
};
```
`CalculatorDialog`-instansen bruker `type={openCalcType || editingBeregning?.type}` og `onImport={handleImport}`.

### 3. Forhåndsutfylling for trafoeksplosjon
**Fil:** `src/components/fraviksdokumentasjon/CalculatorDialog.tsx` og `src/components/fraviksdokumentasjon/calculators/TrafoEksplosjonCalculator.tsx`
- Legg til valgfri `initialInputs?: Record<string, unknown>`-prop på `CalculatorDialog` og videresend til kalkulatorkomponenten.
- I `TrafoEksplosjonCalculator`: hvis `initialInputs` er gitt, merge inn i `useState`-initialverdien for `input` (slik at brukeren ser sine forrige verdier ved redigering). Andre kalkulatorer beholdes uendret i denne omgangen – rediger-knappen fungerer for alle, men forhåndsutfylling støttes først for trafoeksplosjon (det er denne brukeren spør om).

## Filer som endres
- `src/components/fraviksdokumentasjon/CalculatorDialog.tsx`
- `src/components/fraviksdokumentasjon/calculators/TrafoEksplosjonCalculator.tsx`
- `src/pages/RosAnalyse.tsx`

Ingen endringer i datamodell, Word-eksport eller backend.
