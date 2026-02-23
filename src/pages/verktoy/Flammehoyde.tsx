import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Flame, ArrowLeft, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const Flammehoyde = () => {
  const [branneffekt, setBranneffekt] = useState("");
  const [kildeType, setKildeType] = useState<"rund" | "rektangulær">("rund");
  const [diameter, setDiameter] = useState("");
  const [areal, setAreal] = useState("");
  const [result, setResult] = useState<{
    flammehoyde: number;
    flammetipp: number;
    rawLf: number;
    D: number;
  } | null>(null);

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
              <div className="bg-muted p-4 rounded-lg text-center">
                <p className="font-mono text-sm md:text-base">
                  L<sub>f</sub> = 0.235 · Q̇<sup>2/5</sup> − 1.02 · D
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="branneffekt">Q̇ — Branneffekt (kW)</Label>
                  <Input id="branneffekt" type="number" placeholder="f.eks. 3000" value={branneffekt} onChange={(e) => setBranneffekt(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Total branneffekt / HRR i kilowatt</p>
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Typiske verdier:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: "Papirkurv", kw: 100 },
                        { label: "Stol (polstret)", kw: 300 },
                        { label: "Kontorstol", kw: 500 },
                        { label: "Sofa", kw: 2000 },
                        { label: "Seng (madrass)", kw: 1000 },
                        { label: "Juletre", kw: 500 },
                        { label: "Kontor (10 m²)", kw: 3000 },
                        { label: "Bolig (rom)", kw: 5000 },
                        { label: "Butikk/lager", kw: 10000 },
                        { label: "Poolbrann (1 m²)", kw: 2000 },
                      ].map((ex) => (
                        <button
                          key={ex.label}
                          type="button"
                          onClick={() => setBranneffekt(String(ex.kw))}
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <span>{ex.label}</span>
                          <span className="text-muted-foreground">({ex.kw})</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground italic">
                      Verdiene er veiledende og basert på SFPE Handbook of Fire Protection Engineering og Enclosure Fire Dynamics (Karlsson & Quintiere). Faktisk HRR avhenger av materiale, ventilasjon og geometri.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>D — Karakteristisk diameter</Label>
                  <RadioGroup value={kildeType} onValueChange={(v) => setKildeType(v as "rund" | "rektangulær")} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="rund" id="rund" />
                      <Label htmlFor="rund" className="font-normal cursor-pointer">Rund kilde</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="rektangulær" id="rektangulær" />
                      <Label htmlFor="rektangulær" className="font-normal cursor-pointer">Rektangulær kilde</Label>
                    </div>
                  </RadioGroup>

                  {kildeType === "rund" ? (
                    <div className="space-y-2">
                      <Input id="diameter" type="number" step="0.1" placeholder="f.eks. 2" value={diameter} onChange={(e) => setDiameter(e.target.value)} />
                      <p className="text-xs text-muted-foreground">Faktisk diameter (m)</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input id="areal" type="number" step="0.1" placeholder="f.eks. 10" value={areal} onChange={(e) => setAreal(e.target.value)} />
                      <p className="text-xs text-muted-foreground">Brannareal A (m²) → D = √(4A/π){areal && !isNaN(parseFloat(areal)) && parseFloat(areal) > 0 ? ` = ${(Math.sqrt((4 * parseFloat(areal)) / Math.PI)).toFixed(2)} m` : ""}</p>
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
                      <div className="text-sm">
                        <p className="font-semibold text-amber-800 dark:text-amber-200">Uttrykket gir negativt resultat ({result.rawLf} m)</p>
                        <p className="text-amber-700 dark:text-amber-300 mt-1">
                          Ved lav Q̇ eller stor D kan formelen gi negativt tall. Dette tolkes som at flammetoppen ikke strekker seg over kanten på den idealiserte måten. L<sub>f</sub> settes til 0.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="border-primary/30 bg-primary/5">
                      <CardHeader><CardTitle className="text-base">Gjennomsnittlig flammehøyde</CardTitle></CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{result.flammehoyde} m</p>
                        <p className="text-sm text-muted-foreground mt-1">L<sub>f</sub> (mean flame height)</p>
                        {kildeType === "rektangulær" && <p className="text-xs text-muted-foreground mt-1">Ekvivalent D = {result.D} m</p>}
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
                      <li>Heskestads korrelasjon: L<sub>f</sub> = 0.235·Q̇<sup>2/5</sup> − 1.02·D</li>
                      <li>Flammetipp estimert som 1.5 × gjennomsnittlig flammehøyde</li>
                      {kildeType === "rektangulær" && <li>Ekvivalent diameter: D = √(4A/π)</li>}
                    </ul>
                  </div>

                  <div className="bg-muted p-4 rounded-lg text-sm space-y-3">
                    <p className="font-semibold">Når passer denne modellen?</p>
                    <div>
                      <p className="text-muted-foreground font-medium mb-1">Passer ofte greit for:</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                        <li>Poolbranner / brann i væske-/brannareal</li>
                        <li>«Vanlige» frie flammer over et areal (turbulent diffusjonsflamme)</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium mb-1">Ikke ideell for:</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                        <li>Jetflammer (høy hastighet, trykklekkasje)</li>
                        <li>Sterkt ventilasjonskontrollerte rombranner</li>
                        <li>Flammer som påvirkes mye av vind/strømning/innkapsling</li>
                      </ul>
                    </div>
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
