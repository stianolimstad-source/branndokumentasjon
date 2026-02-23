import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AttachedCalculation } from "../BeregningSection";

interface Props {
  onResult: (calc: AttachedCalculation) => void;
}

const OmhyllingsflateCalculator = ({ onResult }: Props) => {
  const [lengde, setLengde] = useState("");
  const [bredde, setBredde] = useState("");
  const [hoyde, setHoyde] = useState("");
  const [result, setResult] = useState<{ gulvareal: number; takareal: number; veggflate: number; totalOmhylling: number } | null>(null);

  const calculate = () => {
    const L = parseFloat(lengde);
    const B = parseFloat(bredde);
    const H = parseFloat(hoyde);
    if (isNaN(L) || isNaN(B) || isNaN(H) || L <= 0 || B <= 0 || H <= 0) return;
    const gulvareal = L * B;
    const takareal = L * B;
    const veggflate = 2 * (L * H) + 2 * (B * H);
    const totalOmhylling = gulvareal + takareal + veggflate;
    setResult({
      gulvareal: Math.round(gulvareal * 100) / 100,
      takareal: Math.round(takareal * 100) / 100,
      veggflate: Math.round(veggflate * 100) / 100,
      totalOmhylling: Math.round(totalOmhylling * 100) / 100,
    });
  };

  useEffect(() => {
    if (result) {
      onResult({
        id: crypto.randomUUID(),
        type: "omhyllingsflate",
        label: `Omhyllingsflate: ${result.totalOmhylling} m²`,
        inputs: { lengde_m: parseFloat(lengde), bredde_m: parseFloat(bredde), hoyde_m: parseFloat(hoyde) },
        results: { gulvareal_m2: result.gulvareal, takareal_m2: result.takareal, veggflate_m2: result.veggflate, total_omhylling_m2: result.totalOmhylling },
        kommentar: "",
      });
    }
  }, [result]);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label>Lengde (m)</Label>
          <Input type="number" step="0.1" placeholder="f.eks. 10" value={lengde} onChange={(e) => setLengde(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Bredde (m)</Label>
          <Input type="number" step="0.1" placeholder="f.eks. 8" value={bredde} onChange={(e) => setBredde(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Høyde (m)</Label>
          <Input type="number" step="0.1" placeholder="f.eks. 3" value={hoyde} onChange={(e) => setHoyde(e.target.value)} />
        </div>
      </div>

      <Button onClick={calculate} className="w-full">Beregn omhyllingsflate</Button>

      {result && (
        <div className="space-y-4 pt-4 border-t">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Gulvareal</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold">{result.gulvareal} m²</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Takareal</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold">{result.takareal} m²</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Veggflate</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold">{result.veggflate} m²</p></CardContent>
            </Card>
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Total omhylling</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold">{result.totalOmhylling} m²</p></CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default OmhyllingsflateCalculator;
