import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Flame, MoveVertical, Zap, Calculator, Users, Box, ExternalLink } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useNavigate, useSearchParams } from "react-router-dom";

export interface AttachedCalculation {
  id: string;
  type: "straling" | "flammehoyde" | "brannenergi" | "persontall" | "omhyllingsflate";
  label: string;
  inputs: Record<string, string | number>;
  results: Record<string, string | number>;
  kommentar: string;
}

const calculatorTypes = [
  { type: "straling" as const, label: "Strålingsberegning", icon: Flame, desc: "Solid flamme-modell", href: "/verktoy/straling" },
  { type: "flammehoyde" as const, label: "Flammehøyde", icon: MoveVertical, desc: "Heskestads korrelasjon", href: "/verktoy/flammehoyde" },
  { type: "brannenergi" as const, label: "Brannenergi", icon: Zap, desc: "Total og spesifikk", href: "/verktoy/brannenergi" },
  { type: "persontall" as const, label: "Persontallsberegning", icon: Users, desc: "Basert på areal og brukskategori", href: "/verktoy/persontall" },
  { type: "omhyllingsflate" as const, label: "Omhyllingsflate", icon: Box, desc: "Gulv, tak og vegger", href: "/verktoy/omhyllingsflate" },
];

interface Props {
  beregninger: AttachedCalculation[];
  onChange: (beregninger: AttachedCalculation[]) => void;
  fravikIndex: number;
}

const BeregningSection = ({ beregninger, onChange, fravikIndex }: Props) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const removeCalc = (id: string) => {
    onChange(beregninger.filter(b => b.id !== id));
  };

  const handleNavigateToTool = (href: string) => {
    // Save return context to sessionStorage
    const returnUrl = window.location.pathname + window.location.search;
    sessionStorage.setItem("fravik-return", JSON.stringify({ returnUrl, fravikIndex }));
    navigate(href);
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
              <div key={calc.id} className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30">
                <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{calc.label}</p>
                  {calc.kommentar && <p className="text-xs text-muted-foreground mt-0.5">{calc.kommentar}</p>}
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
            );
          })}
        </div>
      )}

      {/* Import buttons */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">Gå til beregningsverktøyet, utfør beregningen, og send resultatet tilbake hit:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {calculatorTypes.map(ct => (
            <button
              key={ct.type}
              onClick={() => handleNavigateToTool(ct.href)}
              className="flex items-center gap-2 p-2.5 rounded-lg border hover:border-primary/50 hover:bg-accent transition-colors text-left"
            >
              <ct.icon className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{ct.label}</p>
                <p className="text-xs text-muted-foreground truncate">{ct.desc}</p>
              </div>
              <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BeregningSection;
