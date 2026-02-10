import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import StralingResultat from "./StralingResultat";

const Punktkilde = () => {
  const [hrr, setHrr] = useState("");
  const [chi, setChi] = useState("0.3");
  const [r, setR] = useState("");
  const [cosTheta, setCosTheta] = useState("1.0");
  const [result, setResult] = useState<{ straling: number; status: "ok" | "warning" | "error" } | null>(null);

  const calculate = () => {
    const Q = parseFloat(hrr);
    const chiR = parseFloat(chi);
    const dist = parseFloat(r);
    const cosT = parseFloat(cosTheta);
    if ([Q, chiR, dist, cosT].some((v) => isNaN(v)) || dist <= 0) return;

    // q_rad(r) = (χr · Q̇) / (4π r²) · cos θ   — Q in kW → W
    const q = (chiR * Q * 1000 * cosT) / (4 * Math.PI * dist * dist);
    const stralingKW = Math.round((q / 1000) * 100) / 100;

    let status: "ok" | "warning" | "error" = "ok";
    if (stralingKW > 12.5) status = "error";
    else if (stralingKW > 8) status = "warning";
    setResult({ straling: stralingKW, status });
  };

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle>2) Forenklet punktkildemodell</CardTitle>
        <CardDescription>
          Superpraktisk i brann — beregner stråling som fraksjon av HRR (varmeavgivelse).
          Ofte den raskeste veien til kW/m² når du kjenner/estimerer Q̇.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted p-4 rounded-lg text-center">
          <p className="font-mono text-sm md:text-base">
            q″<sub>rad</sub>(r) = (χ<sub>r</sub> · Q̇) / (4π r²) · cos θ
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="pk-hrr">Q̇ — HRR / branneffekt [kW]</Label>
            <Input id="pk-hrr" type="number" placeholder="f.eks. 3000" value={hrr} onChange={(e) => setHrr(e.target.value)} />
            <p className="text-xs text-muted-foreground">Brannens varmeavgivelse i kilowatt</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pk-chi">χ<sub>r</sub> — Radiativ fraksjon [-]</Label>
            <Input id="pk-chi" type="number" step="0.01" placeholder="0.3" value={chi} onChange={(e) => setChi(e.target.value)} />
            <p className="text-xs text-muted-foreground">Ofte ~0,2–0,4 for hydrokarbonbranner; lavere for ventilerte</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pk-r">r — Avstand [m]</Label>
            <Input id="pk-r" type="number" step="0.1" placeholder="f.eks. 4" value={r} onChange={(e) => setR(e.target.value)} />
            <p className="text-xs text-muted-foreground">Fra «kilden» til treffpunkt</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pk-cosTheta">cos θ — Vinkelfaktor [-]</Label>
            <Input id="pk-cosTheta" type="number" step="0.01" min="0" max="1" placeholder="1.0" value={cosTheta} onChange={(e) => setCosTheta(e.target.value)} />
            <p className="text-xs text-muted-foreground">Sett cos θ = 1 hvis flaten vender rett mot brannen</p>
          </div>
        </div>

        <Button onClick={calculate} className="w-full">Beregn stråling</Button>

        {result && (
          <StralingResultat straling={result.straling} status={result.status} extraInfo={`Ved ${r} m avstand`}>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Punktkildemodell: q″ = (χ<sub>r</sub>·Q̇) / (4πr²) · cos θ</li>
              <li>Forutsetter at brannen kan modelleres som en punktkilde</li>
              <li>Best egnet for avstand {'>'} 2× branndiameter</li>
              <li>Ref. TEK17 § 11-6 og VTEK</li>
            </ul>
          </StralingResultat>
        )}
      </CardContent>
    </Card>
  );
};

export default Punktkilde;
