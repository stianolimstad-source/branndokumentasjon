import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import StralingResultat from "./StralingResultat";

const SIGMA = 5.67e-8;

const StefanBoltzmann = () => {
  const [emissivitet, setEmissivitet] = useState("0.9");
  const [transmisjon, setTransmisjon] = useState("1.0");
  const [siktfaktor, setSiktfaktor] = useState("");
  const [flammeTempC, setFlammeTempC] = useState("1000");
  const [objektTempC, setObjektTempC] = useState("20");
  const [result, setResult] = useState<{ straling: number; status: "ok" | "warning" | "error" } | null>(null);

  const calculate = () => {
    const eps = parseFloat(emissivitet);
    const tau = parseFloat(transmisjon);
    const F12 = parseFloat(siktfaktor);
    const Tf = parseFloat(flammeTempC) + 273.15;
    const To = parseFloat(objektTempC) + 273.15;
    if ([eps, tau, F12, Tf, To].some((v) => isNaN(v)) || F12 < 0 || F12 > 1) return;

    const q = eps * tau * SIGMA * F12 * (Math.pow(Tf, 4) - Math.pow(To, 4));
    const stralingKW = Math.round((q / 1000) * 100) / 100;

    let status: "ok" | "warning" | "error" = "ok";
    if (stralingKW > 12.5) status = "error";
    else if (stralingKW > 8) status = "warning";
    setResult({ straling: stralingKW, status });
  };

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle>1) Flate-til-flate (Stefan–Boltzmann + siktfaktor)</CardTitle>
        <CardDescription>
          Mest generell modell. Beregner strålingsvarmefluksen q″<sub>rad</sub> mot et objekt.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted p-4 rounded-lg text-center">
          <p className="font-mono text-sm md:text-base">
            q″<sub>rad</sub> = ε · τ · σ · F<sub>12</sub> · (T<sub>f</sub>⁴ − T<sub>o</sub>⁴)
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="sb-emissivitet">ε — Emissivitet [-]</Label>
            <Input id="sb-emissivitet" type="number" step="0.01" placeholder="0.9" value={emissivitet} onChange={(e) => setEmissivitet(e.target.value)} />
            <p className="text-xs text-muted-foreground">Flammen/strålende overflate (ofte 0,8–1,0)</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sb-transmisjon">τ — Transmisjon i luft [-]</Label>
            <Input id="sb-transmisjon" type="number" step="0.01" placeholder="1.0" value={transmisjon} onChange={(e) => setTransmisjon(e.target.value)} />
            <p className="text-xs text-muted-foreground">Ofte ≈ 1 for kort avstand og «ren» luft</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sb-siktfaktor">F<sub>12</sub> — Siktfaktor [-]</Label>
            <Input id="sb-siktfaktor" type="number" step="0.01" min="0" max="1" placeholder="f.eks. 0.15" value={siktfaktor} onChange={(e) => setSiktfaktor(e.target.value)} />
            <p className="text-xs text-muted-foreground">Fra brann (1) til objekt (2), verdi 0–1</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sb-flammeTemp">T<sub>f</sub> — Flammetemperatur [°C]</Label>
            <Input id="sb-flammeTemp" type="number" placeholder="f.eks. 1000" value={flammeTempC} onChange={(e) => setFlammeTempC(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              = {flammeTempC && !isNaN(parseFloat(flammeTempC)) ? (parseFloat(flammeTempC) + 273.15).toFixed(1) : "—"} K
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sb-objektTemp">T<sub>o</sub> — Objekttemperatur [°C]</Label>
            <Input id="sb-objektTemp" type="number" placeholder="20" value={objektTempC} onChange={(e) => setObjektTempC(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              = {objektTempC && !isNaN(parseFloat(objektTempC)) ? (parseFloat(objektTempC) + 273.15).toFixed(1) : "—"} K
            </p>
          </div>
          <div className="space-y-2 flex items-end">
            <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground w-full">
              <p>σ = 5,67 · 10⁻⁸ W/m²K⁴</p>
              <p className="mt-1">Stefan–Boltzmann konstant (fast verdi)</p>
            </div>
          </div>
        </div>

        <Button onClick={calculate} className="w-full">Beregn stråling</Button>

        {result && (
          <StralingResultat straling={result.straling} status={result.status} extraInfo={`Ved F₁₂ = ${siktfaktor}`}>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Stefan–Boltzmann: q″ = ε·τ·σ·F₁₂·(T<sub>f</sub>⁴ − T<sub>o</sub>⁴)</li>
              <li>Nøkkelen er å finne fornuftig F₁₂ for geometrien</li>
              <li>Ref. TEK17 § 11-6 og VTEK</li>
            </ul>
          </StralingResultat>
        )}
      </CardContent>
    </Card>
  );
};

export default StefanBoltzmann;
