import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import StralingResultat from "@/components/verktoy/StralingResultat";
import { AttachedCalculation } from "../BeregningSection";

const SIGMA = 5.67e-8;

interface Props {
  onResult: (calc: AttachedCalculation) => void;
}

const StralingCalculator = ({ onResult }: Props) => {
  const [emissivitet, setEmissivitet] = useState("0.9");
  const [flammeTempC, setFlammeTempC] = useState("1000");
  const [siktfaktor, setSiktfaktor] = useState("");
  const [result, setResult] = useState<{ straling: number; Ef: number; status: "ok" | "warning" | "error" } | null>(null);
  const [hv, setHv] = useState("");
  const [bv, setBv] = useState("");
  const [r, setR] = useState("");
  const [synsfaktorOpen, setSynsfaktorOpen] = useState(false);

  const calculateSynsfaktor = () => {
    const Hv = parseFloat(hv);
    const Bv = parseFloat(bv);
    const R = parseFloat(r);
    if ([Hv, Bv, R].some((v) => isNaN(v)) || R <= 0) return;
    const x = Hv / (2 * R);
    const y = Bv / (2 * R);
    const toDeg = (rad: number) => rad * (180 / Math.PI);
    const term1 = (x / Math.sqrt(1 + x * x)) * toDeg(Math.atan(y / Math.sqrt(1 + x * x)));
    const term2 = (y / Math.sqrt(1 + y * y)) * toDeg(Math.atan(x / Math.sqrt(1 + y * y)));
    const F12 = (1 / 90) * Math.abs(term1 + term2);
    setSiktfaktor((Math.round(F12 * 10000) / 10000).toString());
  };

  const calculate = () => {
    const eps = parseFloat(emissivitet);
    const TfC = parseFloat(flammeTempC);
    const F12 = parseFloat(siktfaktor);
    if ([eps, TfC, F12].some((v) => isNaN(v)) || F12 < 0 || F12 > 1) return;
    const Tf = TfC + 273.15;
    const Ef = eps * SIGMA * Math.pow(Tf, 4);
    const q = Ef * F12;
    const stralingKW = Math.round((q / 1000) * 100) / 100;
    const EfKW = Math.round((Ef / 1000) * 100) / 100;
    let status: "ok" | "warning" | "error" = "ok";
    if (stralingKW > 12.5) status = "error";
    else if (stralingKW > 8) status = "warning";
    setResult({ straling: stralingKW, Ef: EfKW, status });
  };

  useEffect(() => {
    if (result) {
      onResult({
        id: crypto.randomUUID(),
        type: "straling",
        label: `Stråling: ${result.straling} kW/m²`,
        inputs: {
          emissivitet: parseFloat(emissivitet),
          flammetemperatur_C: parseFloat(flammeTempC),
          siktfaktor: parseFloat(siktfaktor),
          ...(hv ? { hoyde_m: parseFloat(hv) } : {}),
          ...(bv ? { bredde_m: parseFloat(bv) } : {}),
          ...(r ? { avstand_m: parseFloat(r) } : {}),
        },
        results: { straling_kW_m2: result.straling, Ef_kW_m2: result.Ef },
        kommentar: "",
      });
    }
  }, [result]);

  return (
    <div className="space-y-6">
      <div className="bg-muted p-4 rounded-lg text-center">
        <p className="font-mono text-sm md:text-base">
          q″<sub>rad</sub> ≈ E<sub>f</sub> · F<sub>12</sub> &nbsp;&nbsp; der &nbsp;&nbsp; E<sub>f</sub> = ε · σ · T<sub>f</sub>⁴
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="sf-emissivitet-dlg">ε — Emissivitet [-]</Label>
          <Input id="sf-emissivitet-dlg" type="number" step="0.01" placeholder="0.9" value={emissivitet} onChange={(e) => setEmissivitet(e.target.value)} />
          <p className="text-xs text-muted-foreground">Flammen/strålende overflate (ofte 0,8–1,0)</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sf-flammeTemp-dlg">T<sub>f</sub> — Flammetemperatur [°C]</Label>
          <Input id="sf-flammeTemp-dlg" type="number" placeholder="f.eks. 1000" value={flammeTempC} onChange={(e) => setFlammeTempC(e.target.value)} />
          <p className="text-xs text-muted-foreground">
            = {flammeTempC && !isNaN(parseFloat(flammeTempC)) ? (parseFloat(flammeTempC) + 273.15).toFixed(1) : "—"} K
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sf-siktfaktor-dlg">F<sub>12</sub> — Siktfaktor [-]</Label>
          <Input id="sf-siktfaktor-dlg" type="number" step="0.0001" min="0" max="1" placeholder="f.eks. 0.15" value={siktfaktor} onChange={(e) => setSiktfaktor(e.target.value)} />
        </div>
      </div>

      <Collapsible open={synsfaktorOpen} onOpenChange={setSynsfaktorOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span>Beregn F<sub>12</sub> fra geometri</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${synsfaktorOpen ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg border border-border space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>H<sub>v</sub> — Høyde [m]</Label>
                <Input type="number" step="0.1" placeholder="f.eks. 1.2" value={hv} onChange={(e) => setHv(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>B<sub>v</sub> — Bredde [m]</Label>
                <Input type="number" step="0.1" placeholder="f.eks. 2.0" value={bv} onChange={(e) => setBv(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>R — Avstand [m]</Label>
                <Input type="number" step="0.1" placeholder="f.eks. 4.0" value={r} onChange={(e) => setR(e.target.value)} />
              </div>
            </div>
            <Button variant="secondary" onClick={calculateSynsfaktor} className="w-full">Beregn og sett F₁₂</Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Button onClick={calculate} className="w-full">Beregn stråling</Button>

      {result && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold">Resultater:</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2"><CardTitle className="text-sm">E<sub>f</sub> (emissiv kraft)</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{result.Ef} kW/m²</p>
              </CardContent>
            </Card>
            <Card className={
              result.status === "ok" ? "border-green-500 bg-green-50 dark:bg-green-950" :
              result.status === "warning" ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950" :
              "border-red-500 bg-red-50 dark:bg-red-950"
            }>
              <CardHeader className="pb-2"><CardTitle className="text-sm">q″<sub>rad</sub> mottatt</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{result.straling} kW/m²</p>
              </CardContent>
            </Card>
          </div>
          <StralingResultat straling={result.straling} status={result.status} showCard={false}>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Solid flamme: q″ ≈ E<sub>f</sub> · F₁₂</li>
              <li>E<sub>f</sub> = ε · σ · T<sub>f</sub>⁴</li>
            </ul>
          </StralingResultat>
        </div>
      )}
    </div>
  );
};

export default StralingCalculator;
