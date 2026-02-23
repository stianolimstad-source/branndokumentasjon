import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertTriangle } from "lucide-react";
import { AttachedCalculation } from "../BeregningSection";

interface Props {
  onResult: (calc: AttachedCalculation) => void;
}

const FlammehoydeCalculator = ({ onResult }: Props) => {
  const [branneffekt, setBranneffekt] = useState("");
  const [kildeType, setKildeType] = useState<"rund" | "rektangulær">("rund");
  const [diameter, setDiameter] = useState("");
  const [areal, setAreal] = useState("");
  const [result, setResult] = useState<{ flammehoyde: number; flammetipp: number; rawLf: number; D: number } | null>(null);

  const getD = (): number | null => {
    if (kildeType === "rund") {
      const d = parseFloat(diameter);
      return isNaN(d) || d <= 0 ? null : d;
    } else {
      const A = parseFloat(areal);
      if (isNaN(A) || A <= 0) return null;
      return Math.sqrt((4 * A) / Math.PI);
    }
  };

  const calculate = () => {
    const Q = parseFloat(branneffekt);
    const D = getD();
    if (isNaN(Q) || Q <= 0 || D === null) return;
    const Lf = 0.235 * Math.pow(Q, 0.4) - 1.02 * D;
    const rawLf = Math.round(Lf * 100) / 100;
    const flammehoyde = Math.max(0, rawLf);
    const flammetipp = Math.round(flammehoyde * 1.5 * 100) / 100;
    setResult({ flammehoyde, flammetipp, rawLf, D: Math.round(D * 100) / 100 });
  };

  useEffect(() => {
    if (result) {
      onResult({
        id: crypto.randomUUID(),
        type: "flammehoyde",
        label: `Flammehøyde: ${result.flammehoyde} m`,
        inputs: { branneffekt_kW: parseFloat(branneffekt), diameter_m: result.D },
        results: { flammehoyde_m: result.flammehoyde, flammetipp_m: result.flammetipp },
        kommentar: "",
      });
    }
  }, [result]);

  const typicalValues = [
    { label: "Papirkurv", kw: 100 }, { label: "Stol (polstret)", kw: 300 },
    { label: "Kontorstol", kw: 500 }, { label: "Sofa", kw: 2000 },
    { label: "Seng (madrass)", kw: 1000 }, { label: "Kontor (10 m²)", kw: 3000 },
    { label: "Bolig (rom)", kw: 5000 }, { label: "Butikk/lager", kw: 10000 },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-muted p-4 rounded-lg text-center">
        <p className="font-mono text-sm md:text-base">
          L<sub>f</sub> = 0.235 · Q̇<sup>2/5</sup> − 1.02 · D
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label>Q̇ — Branneffekt (kW)</Label>
          <Input type="number" placeholder="f.eks. 3000" value={branneffekt} onChange={(e) => setBranneffekt(e.target.value)} />
          <div className="flex flex-wrap gap-1.5">
            {typicalValues.map((ex) => (
              <button key={ex.label} type="button" onClick={() => setBranneffekt(String(ex.kw))}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs hover:bg-accent hover:text-accent-foreground transition-colors">
                <span>{ex.label}</span><span className="text-muted-foreground">({ex.kw})</span>
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Label>D — Karakteristisk diameter</Label>
          <RadioGroup value={kildeType} onValueChange={(v) => setKildeType(v as "rund" | "rektangulær")} className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="rund" id="rund-dlg" />
              <Label htmlFor="rund-dlg" className="font-normal cursor-pointer">Rund kilde</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="rektangulær" id="rekt-dlg" />
              <Label htmlFor="rekt-dlg" className="font-normal cursor-pointer">Rektangulær kilde</Label>
            </div>
          </RadioGroup>
          {kildeType === "rund" ? (
            <Input type="number" step="0.1" placeholder="Diameter (m)" value={diameter} onChange={(e) => setDiameter(e.target.value)} />
          ) : (
            <div className="space-y-1">
              <Input type="number" step="0.1" placeholder="Areal (m²)" value={areal} onChange={(e) => setAreal(e.target.value)} />
              <p className="text-xs text-muted-foreground">
                D = √(4A/π){areal && !isNaN(parseFloat(areal)) && parseFloat(areal) > 0 ? ` = ${(Math.sqrt((4 * parseFloat(areal)) / Math.PI)).toFixed(2)} m` : ""}
              </p>
            </div>
          )}
        </div>
      </div>

      <Button onClick={calculate} className="w-full">Beregn flammehøyde</Button>

      {result && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold">Resultater:</h3>
          {result.rawLf < 0 && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300">Negativt resultat ({result.rawLf} m) — L<sub>f</sub> settes til 0.</p>
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader><CardTitle className="text-base">Gjennomsnittlig flammehøyde</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{result.flammehoyde} m</p></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Flammetipp</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{result.flammetipp} m</p></CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlammehoydeCalculator;
