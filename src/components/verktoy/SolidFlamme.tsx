import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import StralingResultat from "./StralingResultat";

const SIGMA = 5.67e-8;

const SolidFlamme = () => {
  const [emissivitet, setEmissivitet] = useState("0.9");
  const [flammeTempC, setFlammeTempC] = useState("1000");
  const [siktfaktor, setSiktfaktor] = useState("");
  const [result, setResult] = useState<{ straling: number; Ef: number; status: "ok" | "warning" | "error" } | null>(null);

  const calculate = () => {
    const eps = parseFloat(emissivitet);
    const TfC = parseFloat(flammeTempC);
    const F12 = parseFloat(siktfaktor);
    if ([eps, TfC, F12].some((v) => isNaN(v)) || F12 < 0 || F12 > 1) return;

    const Tf = TfC + 273.15;
    // Ef = ε · σ · Tf⁴
    const Ef = eps * SIGMA * Math.pow(Tf, 4); // W/m²
    // q_rad ≈ Ef · F12
    const q = Ef * F12;
    const stralingKW = Math.round((q / 1000) * 100) / 100;
    const EfKW = Math.round((Ef / 1000) * 100) / 100;

    let status: "ok" | "warning" | "error" = "ok";
    if (stralingKW > 12.5) status = "error";
    else if (stralingKW > 8) status = "warning";
    setResult({ straling: stralingKW, Ef: EfKW, status });
  };

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle>1) Solid flamme-modell</CardTitle>
        <CardDescription>
          Ofte brukt for objekter/vegger — modellerer flammen som en strålende flate (rektangel/sylinder),
          beregner F₁₂ og ganger med E<sub>f</sub>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted p-4 rounded-lg text-center">
          <p className="font-mono text-sm md:text-base">
            q″<sub>rad</sub> ≈ E<sub>f</sub> · F<sub>12</sub> &nbsp;&nbsp; der &nbsp;&nbsp; E<sub>f</sub> = ε · σ · T<sub>f</sub>⁴
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="sf-emissivitet">ε — Emissivitet [-]</Label>
            <Input id="sf-emissivitet" type="number" step="0.01" placeholder="0.9" value={emissivitet} onChange={(e) => setEmissivitet(e.target.value)} />
            <p className="text-xs text-muted-foreground">Flammen/strålende overflate (ofte 0,8–1,0)</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sf-flammeTemp">T<sub>f</sub> — Flammetemperatur [°C]</Label>
            <Input id="sf-flammeTemp" type="number" placeholder="f.eks. 1000" value={flammeTempC} onChange={(e) => setFlammeTempC(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              = {flammeTempC && !isNaN(parseFloat(flammeTempC)) ? (parseFloat(flammeTempC) + 273.15).toFixed(1) : "—"} K
              &nbsp;(typisk 900–1200 °C i grove modeller)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sf-siktfaktor">F<sub>12</sub> — Siktfaktor (view factor) [-]</Label>
            <Input id="sf-siktfaktor" type="number" step="0.01" min="0" max="1" placeholder="f.eks. 0.15" value={siktfaktor} onChange={(e) => setSiktfaktor(e.target.value)} />
            <p className="text-xs text-muted-foreground">Beregnes ut fra geometri (rektangel/sylinder mot mottaker)</p>
          </div>
        </div>

        <Button onClick={calculate} className="w-full">Beregn stråling</Button>

        {result && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">Resultater:</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-2"><CardTitle className="text-sm">E<sub>f</sub> (emissiv kraft)</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-xl font-bold">{result.Ef} kW/m²</p>
                  <p className="text-sm text-muted-foreground mt-1">Stråling fra flammeflaten</p>
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
                  <p className="text-sm text-muted-foreground mt-1">Ved F₁₂ = {siktfaktor}</p>
                </CardContent>
              </Card>
            </div>

            <StralingResultat straling={result.straling} status={result.status} showCard={false}>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Solid flamme: q″ ≈ E<sub>f</sub> · F₁₂</li>
                <li>E<sub>f</sub> = ε · σ · T<sub>f</sub>⁴</li>
                <li>Kan justeres med τ og (T<sub>f</sub>⁴ − T<sub>o</sub>⁴) for mer nøyaktighet</li>
                <li>Ref. TEK17 § 11-6 og VTEK</li>
              </ul>
            </StralingResultat>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SolidFlamme;
