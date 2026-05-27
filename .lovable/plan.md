# Fremheving av beregningsseksjon i RosAnalyse

Kun visuelle/strukturelle endringer i `src/pages/RosAnalyse.tsx`. Ingen logikkendringer.

## Endringer

### 1. Imports
- Legg `Calculator` til i `lucide-react`-importen (linje 21).
- `Card`, `CardContent` og `Badge` er allerede importert.

### 2. Flytt og restyle seksjonen "Tilknyttede beregninger"
Fjern dagens blokk på linje 1120–1128 og sett den inn rett etter "Forebyggende tiltak"-blokken (etter linje 1087), altså før "Etter tiltak"-blokken (linje 1089).

Ny markup:

```tsx
<Card className="border-2 border-primary/30 bg-primary/5">
  <CardContent className="pt-4 space-y-2">
    <div className="flex items-center gap-2">
      <Calculator className="h-4 w-4 text-primary" />
      <p className="text-sm font-bold">Tilknyttede beregninger</p>
    </div>
    <p className="text-xs text-muted-foreground">
      Knytt branntekniske beregningsverktøy til hendelsen – f.eks. trafoeksplosjon,
      strålingsberegning eller flammehøyde. Importerte beregninger blir med i Word-rapporten.
    </p>
    <BeregningSection
      beregninger={h.beregninger || []}
      onChange={(beregninger) => updateHendelse(h.id, { beregninger })}
      fravikIndex={idx}
    />
  </CardContent>
</Card>
```

Den gamle `<div className="space-y-2 border-t pt-3">`-wrapperen droppes; Card-en står som egen visuell blokk i `AccordionContent`-stacken.

### 3. Badge på AccordionTrigger
I trigger-blokken (linje 1004–1034), rett etter Bow-tie-badgen (etter linje 1025), legg til:

```tsx
{(h.beregninger?.length ?? 0) > 0 && (
  <Badge variant="secondary" className="shrink-0 text-xs">
    {h.beregninger!.length} {h.beregninger!.length === 1 ? "beregning" : "beregninger"}
  </Badge>
)}
```

Plasseres før risiko-pillen (`ml-auto` på risiko-spanen sørger fortsatt for høyrejustering av S×K-tallene).

## Filer som endres
- `src/pages/RosAnalyse.tsx`
