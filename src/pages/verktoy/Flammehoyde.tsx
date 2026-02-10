import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Flammehoyde = () => {
  const [branneffekt, setBranneffekt] = useState("");
  const [diameter, setDiameter] = useState("");
  const [result, setResult] = useState<{
    flammehoyde: number;
    flammetipp: number;
  } | null>(null);

  const calculate = () => {
    const Q = parseFloat(branneffekt); // kW
    const D = parseFloat(diameter); // m

    if (isNaN(Q) || isNaN(D) || Q <= 0 || D <= 0) return;

    // Heskestad correlation: L_f = 0.235 * Q^(2/5) - 1.02 * D
    const Lf = 0.235 * Math.pow(Q, 0.4) - 1.02 * D;
    const flammehoyde = Math.max(0, Math.round(Lf * 100) / 100);

    // Flame tip (intermittent): approximately 1.5x mean flame height
    const flammetipp = Math.round(flammehoyde * 1.5 * 100) / 100;

    setResult({ flammehoyde, flammetipp });
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
              <h1 className="text-xl font-bold">Flammehøyde</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Flammehøydeberegning</CardTitle>
              <CardDescription>
                Beregn gjennomsnittlig flammehøyde basert på Heskestads korrelasjon.
                Brukes for vurdering av brannspredning til overliggende etasjer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="branneffekt">Branneffekt (kW)</Label>
                  <Input id="branneffekt" type="number" placeholder="f.eks. 3000" value={branneffekt} onChange={(e) => setBranneffekt(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Total branneffekt i kilowatt (HRR)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diameter">Branndiameter (m)</Label>
                  <Input id="diameter" type="number" step="0.1" placeholder="f.eks. 2" value={diameter} onChange={(e) => setDiameter(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Ekvivalent diameter på brannarealet</p>
                </div>
              </div>

              <Button onClick={calculate} className="w-full">Beregn flammehøyde</Button>

              {result && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold">Resultater:</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="border-primary/30 bg-primary/5">
                      <CardHeader><CardTitle className="text-base">Gjennomsnittlig flammehøyde</CardTitle></CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{result.flammehoyde} m</p>
                        <p className="text-sm text-muted-foreground mt-1">L<sub>f</sub> (mean flame height)</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle className="text-base">Flammetipp (intermittent)</CardTitle></CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{result.flammetipp} m</p>
                        <p className="text-sm text-muted-foreground mt-1">Maks flammeutstrekning</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                    <p className="font-semibold">Grunnlag:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Heskestads korrelasjon: L<sub>f</sub> = 0.235·Q<sup>2/5</sup> − 1.02·D</li>
                      <li>Flammetipp estimert som 1.5 × gjennomsnittlig flammehøyde</li>
                      <li>Gjelder for aksesymmetriske branner i friluft</li>
                      <li>Vurder ventilasjonskontrollert brann ved innendørs bruk</li>
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

export default Flammehoyde;
