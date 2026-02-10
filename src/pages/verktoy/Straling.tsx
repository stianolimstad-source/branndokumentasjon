import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const SIGMA = 5.67e-8; // Stefan-Boltzmann constant [W/m²K⁴]

const Straling = () => {
  const [emissivitet, setEmissivitet] = useState("0.9");
  const [transmisjon, setTransmisjon] = useState("1.0");
  const [siktfaktor, setSiktfaktor] = useState("");
  const [flammeTemp, setFlammeTemp] = useState("");
  const [objektTemp, setObjektTemp] = useState("293");
  const [result, setResult] = useState<{
    straling: number;
    status: "ok" | "warning" | "error";
  } | null>(null);

  const calculate = () => {
    const eps = parseFloat(emissivitet);
    const tau = parseFloat(transmisjon);
    const F12 = parseFloat(siktfaktor);
    const Tf = parseFloat(flammeTemp);
    const To = parseFloat(objektTemp);

    if ([eps, tau, F12, Tf, To].some((v) => isNaN(v)) || F12 < 0 || F12 > 1) return;

    // q_rad = ε · τ · σ · F12 · (Tf⁴ - To⁴)
    const q = eps * tau * SIGMA * F12 * (Math.pow(Tf, 4) - Math.pow(To, 4));
    const stralingKW = Math.round((q / 1000) * 100) / 100; // Convert W/m² to kW/m²

    let status: "ok" | "warning" | "error" = "ok";
    if (stralingKW > 12.5) status = "error";
    else if (stralingKW > 8) status = "warning";

    setResult({ straling: stralingKW, status });
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
              <h1 className="text-xl font-bold">Strålingsberegning</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Flate-til-flate strålingsberegning</CardTitle>
              <CardDescription>
                Stefan–Boltzmann med siktfaktor. Beregner strålingsvarmefluksen q″<sub>rad</sub> mot et objekt.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Formula display */}
              <div className="bg-muted p-4 rounded-lg text-center">
                <p className="font-mono text-sm md:text-base">
                  q″<sub>rad</sub> = ε · τ · σ · F<sub>12</sub> · (T<sub>f</sub>⁴ − T<sub>o</sub>⁴)
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="emissivitet">ε — Emissivitet [-]</Label>
                  <Input id="emissivitet" type="number" step="0.01" placeholder="0.9" value={emissivitet} onChange={(e) => setEmissivitet(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Flammen/strålende overflate (ofte 0,8–1,0)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transmisjon">τ — Transmisjon i luft [-]</Label>
                  <Input id="transmisjon" type="number" step="0.01" placeholder="1.0" value={transmisjon} onChange={(e) => setTransmisjon(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Ofte ≈ 1 for kort avstand og «ren» luft</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siktfaktor">F<sub>12</sub> — Siktfaktor (view factor) [-]</Label>
                  <Input id="siktfaktor" type="number" step="0.01" min="0" max="1" placeholder="f.eks. 0.15" value={siktfaktor} onChange={(e) => setSiktfaktor(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Fra brann (1) til objekt (2), verdi 0–1</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flammeTemp">T<sub>f</sub> — Flammetemperatur [K]</Label>
                  <Input id="flammeTemp" type="number" placeholder="f.eks. 1273" value={flammeTemp} onChange={(e) => setFlammeTemp(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Effektiv flammetemperatur (1000°C ≈ 1273 K)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objektTemp">T<sub>o</sub> — Objekttemperatur [K]</Label>
                  <Input id="objektTemp" type="number" placeholder="293" value={objektTemp} onChange={(e) => setObjektTemp(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Omgivelsestemperatur (20°C ≈ 293 K)</p>
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
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold">Resultater:</h3>
                  <Card className={
                    result.status === "ok" ? "border-green-500 bg-green-50 dark:bg-green-950" :
                    result.status === "warning" ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950" :
                    "border-red-500 bg-red-50 dark:bg-red-950"
                  }>
                    <CardHeader><CardTitle className="text-base">Mottatt stråling q″<sub>rad</sub></CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{result.straling} kW/m²</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        ({(result.straling * 1000).toFixed(0)} W/m²)
                      </p>
                    </CardContent>
                  </Card>

                  <div className={`p-4 rounded-lg ${
                    result.status === "ok" ? "bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100" :
                    result.status === "warning" ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100" :
                    "bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100"
                  }`}>
                    <p className="font-semibold mb-1">
                      {result.status === "ok" && "✓ Strålingsnivået er akseptabelt"}
                      {result.status === "warning" && "⚠ Strålingsnivået nærmer seg grensen"}
                      {result.status === "error" && "✗ Strålingsnivået overskrider grenseverdien"}
                    </p>
                    <p className="text-sm">
                      {result.status === "ok" && "Under 8 kW/m² — ingen spesiell beskyttelse nødvendig."}
                      {result.status === "warning" && "Mellom 8–12,5 kW/m² — vurder tiltak for å redusere stråling."}
                      {result.status === "error" && "Over 12,5 kW/m² — tiltak for brannspredning er påkrevd."}
                    </p>
                  </div>

                  <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                    <p className="font-semibold">Grunnlag:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Stefan–Boltzmann: q″ = ε·τ·σ·F₁₂·(T<sub>f</sub>⁴ − T<sub>o</sub>⁴)</li>
                      <li>Grenseverdi: 12,5 kW/m² for brannspredning til annen bygning</li>
                      <li>8 kW/m² som anbefalt varselgrense</li>
                      <li>Nøkkelen er å finne fornuftig F₁₂ for geometrien</li>
                      <li>Ref. TEK17 § 11-6 og VTEK</li>
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

export default Straling;
