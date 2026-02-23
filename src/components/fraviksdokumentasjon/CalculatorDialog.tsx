import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { AttachedCalculation } from "./BeregningSection";

// Lazy-loaded calculator content components
import StralingCalculator from "./calculators/StralingCalculator";
import FlammehoydeCalculator from "./calculators/FlammehoydeCalculator";
import BrannenergCalculator from "./calculators/BrannenergCalculator";
import PersontallCalculator from "./calculators/PersontallCalculator";
import OmhyllingsflateCalculator from "./calculators/OmhyllingsflateCalculator";

export type CalculatorType = "straling" | "flammehoyde" | "brannenergi" | "persontall" | "omhyllingsflate";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: CalculatorType;
  onImport: (calc: AttachedCalculation) => void;
}

const calculatorComponents: Record<CalculatorType, React.FC<{ onResult: (calc: AttachedCalculation) => void }>> = {
  straling: StralingCalculator,
  flammehoyde: FlammehoydeCalculator,
  brannenergi: BrannenergCalculator,
  persontall: PersontallCalculator,
  omhyllingsflate: OmhyllingsflateCalculator,
};

const titles: Record<CalculatorType, string> = {
  straling: "Strålingsberegning",
  flammehoyde: "Flammehøyde",
  brannenergi: "Brannenergi",
  persontall: "Persontallsberegning",
  omhyllingsflate: "Omhyllingsflate",
};

const CalculatorDialog = ({ open, onOpenChange, type, onImport }: Props) => {
  const [pendingCalc, setPendingCalc] = useState<AttachedCalculation | null>(null);
  const Calculator = calculatorComponents[type];

  const handleImport = () => {
    if (pendingCalc) {
      onImport(pendingCalc);
      setPendingCalc(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setPendingCalc(null); onOpenChange(v); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{titles[type]}</DialogTitle>
        </DialogHeader>
        <Calculator onResult={setPendingCalc} />
        {pendingCalc && (
          <div className="sticky bottom-0 bg-background border-t pt-3 mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground truncate">{pendingCalc.label}</p>
            <Button onClick={handleImport} size="sm">
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Importer til fravik
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CalculatorDialog;
