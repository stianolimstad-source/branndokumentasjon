import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Flame, MoveVertical, Zap, Calculator, Users, Box, Shield } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import CalculatorDialog, { CalculatorType } from "./CalculatorDialog";

export interface AttachedCalculation {
  id: string;
  type: "straling" | "flammehoyde" | "brannenergi" | "persontall" | "omhyllingsflate";
  label: string;
  inputs: Record<string, string | number>;
  results: Record<string, string | number>;
  kommentar: string;
}

const calculatorTypes = [
  { type: "straling" as const, label: "Strålingsberegning", icon: Flame, desc: "Solid flamme-modell" },
  { type: "flammehoyde" as const, label: "Flammehøyde", icon: MoveVertical, desc: "Heskestads korrelasjon" },
  { type: "brannenergi" as const, label: "Brannenergi", icon: Zap, desc: "Total og spesifikk" },
  { type: "persontall" as const, label: "Persontallsberegning", icon: Users, desc: "Basert på areal og brukskategori" },
  { type: "omhyllingsflate" as const, label: "Omhyllingsflate", icon: Box, desc: "Gulv, tak og vegger" },
];

interface Props {
  beregninger: AttachedCalculation[];
  onChange: (beregninger: AttachedCalculation[]) => void;
  fravikIndex: number;
}

const BeregningSection = ({ beregninger, onChange, fravikIndex }: Props) => {
  const [openCalc, setOpenCalc] = useState<CalculatorType | null>(null);

  const removeCalc = (id: string) => {
    onChange(beregninger.filter(b => b.id !== id));
  };

  const updateKommentar = (id: string, kommentar: string) => {
    onChange(beregninger.map(b => b.id === id ? { ...b, kommentar } : b));
  };

  const handleImport = (calc: AttachedCalculation) => {
    onChange([...beregninger, calc]);
  };

  return (
    <div className="space-y-2">
      {/* Attached calculations list */}
      {beregninger.length > 0 && (
        <div className="space-y-2">
          {beregninger.map(calc => {
            const typeInfo = calculatorTypes.find(c => c.type === calc.type);
            const Icon = typeInfo?.icon || Calculator;
            return (
              <div key={calc.id} className="p-3 border rounded-lg bg-muted/30 space-y-2">
                <div className="flex items-start gap-3">
                  <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold">{calc.label}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {Object.entries(calc.results).map(([key, val]) => (
                        <span key={key} className="text-xs bg-background px-1.5 py-0.5 rounded border">
                          {key.replace(/_/g, " ")}: <strong>{val}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Fjerne beregning?</AlertDialogTitle>
                        <AlertDialogDescription>Er du sikker på at du vil fjerne denne beregningen fra fraviket?</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removeCalc(calc.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Fjern</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <Textarea
                  placeholder="Legg til kommentar til beregningen..."
                  value={calc.kommentar}
                  onChange={(e) => updateKommentar(calc.id, e.target.value)}
                  className="text-xs min-h-[60px]"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Calculator buttons - open as dialog */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">Åpne et beregningsverktøy og importer resultatet direkte:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {calculatorTypes.map(ct => (
            <button
              key={ct.type}
              onClick={() => setOpenCalc(ct.type)}
              className="flex items-center gap-2 p-2.5 rounded-lg border hover:border-primary/50 hover:bg-accent transition-colors text-left"
            >
              <ct.icon className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{ct.label}</p>
                <p className="text-xs text-muted-foreground truncate">{ct.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Calculator dialog */}
      {openCalc && (
        <CalculatorDialog
          open={!!openCalc}
          onOpenChange={(open) => { if (!open) setOpenCalc(null); }}
          type={openCalc}
          onImport={handleImport}
        />
      )}
    </div>
  );
};

export default BeregningSection;
