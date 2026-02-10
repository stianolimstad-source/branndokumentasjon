import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Omhyllingsflate = () => {
  const [lengde, setLengde] = useState("");
  const [bredde, setBredde] = useState("");
  const [hoyde, setHoyde] = useState("");
  const [result, setResult] = useState<{
    gulvareal: number;
    takareal: number;
    veggflate: number;
    totalOmhylling: number;
  } | null>(null);

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

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/verktoy">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Alle verktøy
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                <Flame className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">Omhyllingsflate</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Omhyllingsflateberegning</CardTitle>
              <CardDescription>
                Beregn total omhyllingsflate for en branncelle (gulv, tak og vegger).
                Brukes blant annet ved vurdering av brannenergi per omhyllingsflate.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="lengde">Lengde (m)</Label>
                  <Input id="lengde" type="number" step="0.1" placeholder="f.eks. 10" value={lengde} onChange={(e) => setLengde(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bredde">Bredde (m)</Label>
                  <Input id="bredde" type="number" step="0.1" placeholder="f.eks. 8" value={bredde} onChange={(e) => setBredde(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hoyde">Høyde (m)</Label>
                  <Input id="hoyde" type="number" step="0.1" placeholder="f.eks. 3" value={hoyde} onChange={(e) => setHoyde(e.target.value)} />
                </div>
              </div>

              <Button onClick={calculate} className="w-full">Beregn omhyllingsflate</Button>

              {result && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold">Resultater:</h3>
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

                  <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                    <p className="font-semibold">Grunnlag:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>A<sub>t</sub> = gulv + tak + vegger</li>
                      <li>Forutsetter rektangulær branncelle uten åpninger</li>
                      <li>Brukes for beregning av brannenergi per omhyllingsflate (MJ/m²)</li>
                      <li>Ref. TEK17 § 11-3 og NS-EN 1991-1-2</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Omhyllingsflate;
