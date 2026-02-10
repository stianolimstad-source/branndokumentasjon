import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const Synsfaktor = () => {
  const [hv, setHv] = useState("");
  const [bv, setBv] = useState("");
  const [r, setR] = useState("");
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const Hv = parseFloat(hv);
    const Bv = parseFloat(bv);
    const R = parseFloat(r);
    if ([Hv, Bv, R].some((v) => isNaN(v)) || R <= 0) return;

    const x = Hv / (2 * R);
    const y = Bv / (2 * R);

    const term1 = (x / Math.sqrt(1 + x * x)) * Math.atan(y / Math.sqrt(1 + x * x));
    const term2 = (y / Math.sqrt(1 + y * y)) * Math.atan(x / Math.sqrt(1 + y * y));

    const F12 = (1 / 90) * Math.abs(term1 + term2);
    const rounded = Math.round(F12 * 10000) / 10000;
    setResult(rounded);
  };

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle>Synsfaktor F<sub>1→2</sub> (rektangulær åpning)</CardTitle>
        <CardDescription>
          Beregner synsfaktor (view factor / konfigurasjons­faktor) fra en rektangulær strålende flate
          til et parallelt punkt, f.eks. vindu/åpning mot motstående fasade.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted p-4 rounded-lg text-center">
          <p className="font-mono text-sm md:text-base">
            F<sub>1→2</sub> = (1/90) · | (x/√(1+x²)) · arctan(y/√(1+x²)) + (y/√(1+y²)) · arctan(x/√(1+y²)) |
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            x = H<sub>v</sub> / 2R &nbsp;&nbsp; y = B<sub>v</sub> / 2R
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="sf-hv">H<sub>v</sub> — Høyde vindusåpning [m]</Label>
            <Input id="sf-hv" type="number" step="0.1" placeholder="f.eks. 1.2" value={hv} onChange={(e) => setHv(e.target.value)} />
            <p className="text-xs text-muted-foreground">Høyden på den strålende flaten / vindusåpningen</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sf-bv">B<sub>v</sub> — Bredde vindusåpning [m]</Label>
            <Input id="sf-bv" type="number" step="0.1" placeholder="f.eks. 2.0" value={bv} onChange={(e) => setBv(e.target.value)} />
            <p className="text-xs text-muted-foreground">Bredden på den strålende flaten / vindusåpningen</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sf-r">R — Avstand [m]</Label>
            <Input id="sf-r" type="number" step="0.1" placeholder="f.eks. 4.0" value={r} onChange={(e) => setR(e.target.value)} />
            <p className="text-xs text-muted-foreground">Avstand mellom strålende og mottakende flate</p>
          </div>
        </div>

        <Button onClick={calculate} className="w-full">Beregn synsfaktor</Button>

        {result !== null && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">Resultat:</h3>
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">F<sub>1→2</sub> (synsfaktor)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{result}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  x = {hv && r ? (parseFloat(hv) / (2 * parseFloat(r))).toFixed(4) : "—"}, 
                  y = {bv && r ? (parseFloat(bv) / (2 * parseFloat(r))).toFixed(4) : "—"}
                </p>
              </CardContent>
            </Card>
            <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
              <p className="font-semibold">Merknad:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Denne verdien kan brukes direkte som F₁₂ i strålingsmodellene over</li>
                <li>Forutsetter parallelle, sentrerte flater</li>
                <li>Ref. TEK17 § 11-6 og VTEK</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Synsfaktor;
