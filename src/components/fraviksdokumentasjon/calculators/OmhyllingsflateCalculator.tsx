import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AttachedCalculation } from "../BeregningSection";

interface Props {
  onResult?: (calc: AttachedCalculation) => void;
  onValueChange?: (totalOmhylling: number | null, modus: "noyaktig" | "forenklet") => void;
}

type Mode = "noyaktig" | "forenklet";

const OmhyllingsflateCalculator = ({ onResult, onValueChange }: Props) => {
  const [mode, setMode] = useState<Mode>("noyaktig");

  // Nøyaktig
  const [lengde, setLengde] = useState("");
  const [bredde, setBredde] = useState("");
  const [hoyde, setHoyde] = useState("");

  // Forenklet
  const [areal, setAreal] = useState("");
  const [hoydeF, setHoydeF] = useState("");

  const [result, setResult] = useState<{ gulvareal: number; takareal: number; veggflate: number; totalOmhylling: number; modus: Mode } | null>(null);

  const round2 = (n: number) => Math.round(n * 100) / 100;

  const calculateNoyaktig = () => {
    const L = parseFloat(lengde);
    const B = parseFloat(bredde);
    const H = parseFloat(hoyde);
    if (isNaN(L) || isNaN(B) || isNaN(H) || L <= 0 || B <= 0 || H <= 0) return;
    const gulvareal = L * B;
    const takareal = L * B;
    const veggflate = 2 * (L * H) + 2 * (B * H);
    setResult({
      gulvareal: round2(gulvareal),
      takareal: round2(takareal),
      veggflate: round2(veggflate),
      totalOmhylling: round2(gulvareal + takareal + veggflate),
      modus: "noyaktig",
    });
  };

  const calculateForenklet = () => {
    const A = parseFloat(areal);
    const H = parseFloat(hoydeF);
    if (isNaN(A) || isNaN(H) || A <= 0 || H <= 0) return;
    const s = Math.sqrt(A);
    const gulvareal = A;
    const takareal = A;
    const veggflate = 4 * s * H;
    setResult({
      gulvareal: round2(gulvareal),
      takareal: round2(takareal),
      veggflate: round2(veggflate),
      totalOmhylling: round2(gulvareal + takareal + veggflate),
      modus: "forenklet",
    });
  };

  useEffect(() => {
    if (result && onResult) {
      const erForenklet = result.modus === "forenklet";
      onResult({
        id: crypto.randomUUID(),
        type: "omhyllingsflate",
        label: erForenklet
          ? `Omhyllingsflate (ca.): ${result.totalOmhylling} m²`
          : `Omhyllingsflate: ${result.totalOmhylling} m²`,
        inputs: erForenklet
          ? { modus: "forenklet (ca.)", areal_m2: parseFloat(areal), hoyde_m: parseFloat(hoydeF) }
          : { modus: "nøyaktig", lengde_m: parseFloat(lengde), bredde_m: parseFloat(bredde), hoyde_m: parseFloat(hoyde) },
        results: {
          gulvareal_m2: result.gulvareal,
          takareal_m2: result.takareal,
          veggflate_m2: result.veggflate,
          total_omhylling_m2: result.totalOmhylling,
        },
        kommentar: erForenklet ? "Forenklet beregning som antar tilnærmet kvadratisk grunnflate." : "",
      });
    }
  }, [result]);

  const erForenklet = result?.modus === "forenklet";

  return (
    <div className="space-y-8">
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Omhyllingsflateberegning</CardTitle>
          <CardDescription>
            Beregn total omhyllingsflate for en branncelle (gulv, tak og vegger).
            Bruk nøyaktig modus når dimensjonene er kjent, eller forenklet modus for et ca.-tall basert på gulvareal og høyde.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={mode} onValueChange={(v) => { setMode(v as Mode); setResult(null); }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="noyaktig">Nøyaktig (L × B × H)</TabsTrigger>
              <TabsTrigger value="forenklet">Forenklet (areal + høyde)</TabsTrigger>
            </TabsList>

            <TabsContent value="noyaktig" className="space-y-6 pt-4">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="lengde-dlg">Lengde (m)</Label>
                  <Input id="lengde-dlg" type="number" step="0.1" placeholder="f.eks. 10" value={lengde} onChange={(e) => setLengde(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bredde-dlg">Bredde (m)</Label>
                  <Input id="bredde-dlg" type="number" step="0.1" placeholder="f.eks. 8" value={bredde} onChange={(e) => setBredde(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hoyde-dlg">Høyde (m)</Label>
                  <Input id="hoyde-dlg" type="number" step="0.1" placeholder="f.eks. 3" value={hoyde} onChange={(e) => setHoyde(e.target.value)} />
                </div>
              </div>
              <Button onClick={calculateNoyaktig} className="w-full">Beregn omhyllingsflate</Button>
            </TabsContent>

            <TabsContent value="forenklet" className="space-y-6 pt-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="areal-dlg">Gulvareal (m²)</Label>
                  <Input id="areal-dlg" type="number" step="1" placeholder="f.eks. 200" value={areal} onChange={(e) => setAreal(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hoyde-f-dlg">Høyde (m)</Label>
                  <Input id="hoyde-f-dlg" type="number" step="0.1" placeholder="f.eks. 3" value={hoydeF} onChange={(e) => setHoydeF(e.target.value)} />
                </div>
              </div>
              <Button onClick={calculateForenklet} className="w-full">Beregn ca. omhyllingsflate</Button>
            </TabsContent>
          </Tabs>

          {result && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Resultater:</h3>
                {erForenklet && <Badge variant="secondary">Ca.-verdi</Badge>}
              </div>
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
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Veggflate{erForenklet ? " (ca.)" : ""}</CardTitle></CardHeader>
                  <CardContent><p className="text-xl font-bold">{result.veggflate} m²</p></CardContent>
                </Card>
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Total omhylling{erForenklet ? " (ca.)" : ""}</CardTitle></CardHeader>
                  <CardContent><p className="text-xl font-bold">{erForenklet ? "≈ " : ""}{result.totalOmhylling} m²</p></CardContent>
                </Card>
              </div>

              <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                <p className="font-semibold">Grunnlag:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>A<sub>t</sub> = gulv + tak + vegger</li>
                  {erForenklet ? (
                    <>
                      <li>Forenklet modus antar tilnærmet kvadratisk grunnflate: sidelengde s = √areal</li>
                      <li>Veggflate ≈ 4 · √areal · høyde</li>
                      <li>Resultatet er en ca.-verdi og bør verifiseres mot faktiske dimensjoner ved nøyere analyse</li>
                    </>
                  ) : (
                    <li>Forutsetter rektangulær branncelle uten åpninger</li>
                  )}
                  <li>Brukes for beregning av brannenergi per omhyllingsflate (MJ/m²)</li>
                  <li>Ref. TEK17 § 11-3 og NS-EN 1991-1-2</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OmhyllingsflateCalculator;
