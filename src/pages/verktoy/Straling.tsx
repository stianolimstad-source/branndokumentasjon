import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const SIGMA = 5.67e-8; // Stefan-Boltzmann constant [W/m²K⁴]

const Straling = () => {
  // Stefan-Boltzmann state
  const [emissivitet, setEmissivitet] = useState("0.9");
  const [transmisjon, setTransmisjon] = useState("1.0");
  const [siktfaktor, setSiktfaktor] = useState("");
  const [flammeTempC, setFlammeTempC] = useState("1000");
  const [objektTempC, setObjektTempC] = useState("20");
  const [result, setResult] = useState<{
    straling: number;
    status: "ok" | "warning" | "error";
  } | null>(null);

  // Punktkilde state
  const [pkHRR, setPkHRR] = useState("");
  const [pkChi, setPkChi] = useState("0.3");
  const [pkR, setPkR] = useState("");
  const [pkCosTheta, setPkCosTheta] = useState("1.0");
  const [pkResult, setPkResult] = useState<{
    straling: number;
    status: "ok" | "warning" | "error";
  } | null>(null);

  const calculate = () => {
    const eps = parseFloat(emissivitet);
    const tau = parseFloat(transmisjon);
    const F12 = parseFloat(siktfaktor);
    const Tf = parseFloat(flammeTempC) + 273.15;
    const To = parseFloat(objektTempC) + 273.15;

    if ([eps, tau, F12, Tf, To].some((v) => isNaN(v)) || F12 < 0 || F12 > 1) return;

    // q_rad = ε · τ · σ · F12 · (Tf⁴ - To⁴)
    const q = eps * tau * SIGMA * F12 * (Math.pow(Tf, 4) - Math.pow(To, 4));
    const stralingKW = Math.round((q / 1000) * 100) / 100; // Convert W/m² to kW/m²

    let status: "ok" | "warning" | "error" = "ok";
    if (stralingKW > 12.5) status = "error";
    else if (stralingKW > 8) status = "warning";

    setResult({ straling: stralingKW, status });
  };
  const calculatePunktkilde = () => {
    const Q = parseFloat(pkHRR); // W
    const chi = parseFloat(pkChi);
    const r = parseFloat(pkR);
    const cosTheta = parseFloat(pkCosTheta);

    if ([Q, chi, r, cosTheta].some((v) => isNaN(v)) || r <= 0) return;

    // q_rad(r) = (χr · Q̇) / (4π r²) · cos θ
    const q = (chi * Q * 1000 * cosTheta) / (4 * Math.PI * r * r); // HRR input in kW, convert to W
    const stralingKW = Math.round((q / 1000) * 100) / 100;

    let status: "ok" | "warning" | "error" = "ok";
    if (stralingKW > 12.5) status = "error";
    else if (stralingKW > 8) status = "warning";

    setPkResult({ straling: stralingKW, status });
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
                  <Label htmlFor="flammeTemp">T<sub>f</sub> — Flammetemperatur [°C]</Label>
                  <Input id="flammeTemp" type="number" placeholder="f.eks. 1000" value={flammeTempC} onChange={(e) => setFlammeTempC(e.target.value)} />
                  <p className="text-xs text-muted-foreground">
                    = {flammeTempC && !isNaN(parseFloat(flammeTempC)) ? (parseFloat(flammeTempC) + 273.15).toFixed(1) : "—"} K
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objektTemp">T<sub>o</sub> — Objekttemperatur [°C]</Label>
                  <Input id="objektTemp" type="number" placeholder="20" value={objektTempC} onChange={(e) => setObjektTempC(e.target.value)} />
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

                  <div className="bg-muted p-4 rounded-lg text-sm space-y-3">
                    <p className="font-semibold">Grenseverdier for strålingsintensitet:</p>
                    <div className="space-y-2">
                      {[
                        { kw: "< 2,5", desc: "Ingen risiko for antennelse selv ved langvarig eksponering. Trygg avstand for personer.", color: "text-green-700 dark:text-green-400" },
                        { kw: "2,5", desc: "Grense for smerte ved eksponering av hud i mer enn noen sekunder.", color: "text-green-700 dark:text-green-400" },
                        { kw: "4,0", desc: "Kritisk grense for personer som ikke kan søke ly. Brannskade ved langvarig eksponering.", color: "text-yellow-700 dark:text-yellow-400" },
                        { kw: "8,0", desc: "Spontan antennelse av trevirke ved langvarig eksponering. Anbefalt varselgrense for nabobygninger.", color: "text-yellow-700 dark:text-yellow-400" },
                        { kw: "12,5", desc: "Grenseverdi iht. TEK17 § 11-6 / VTEK for brannspredning mellom bygninger. Tiltak påkrevd over denne verdien.", color: "text-orange-700 dark:text-orange-400" },
                        { kw: "20", desc: "Antennelse av trevirke uten pilotflamme ved kort eksponeringstid.", color: "text-red-700 dark:text-red-400" },
                        { kw: "> 30", desc: "Umiddelbar antennelse av de fleste brennbare materialer. Svært farlig for personer.", color: "text-red-700 dark:text-red-400" },
                      ].map((row) => (
                        <div key={row.kw} className="flex gap-3 items-start">
                          <span className={`font-mono font-semibold whitespace-nowrap min-w-[5rem] text-right ${row.color}`}>
                            {row.kw} kW/m²
                          </span>
                          <span className="text-muted-foreground">{row.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                    <p className="font-semibold">Grunnlag for beregningen:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Stefan–Boltzmann: q″ = ε·τ·σ·F₁₂·(T<sub>f</sub>⁴ − T<sub>o</sub>⁴)</li>
                      <li>Nøkkelen er å finne fornuftig F₁₂ for geometrien</li>
                      <li>Ref. TEK17 § 11-6 og VTEK</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Punktkildemodell */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Forenklet punktkildemodell</CardTitle>
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
                  <Label htmlFor="pkHRR">Q̇ — HRR / branneffekt [kW]</Label>
                  <Input id="pkHRR" type="number" placeholder="f.eks. 3000" value={pkHRR} onChange={(e) => setPkHRR(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Brannens varmeavgivelse i kilowatt</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pkChi">χ<sub>r</sub> — Radiativ fraksjon [-]</Label>
                  <Input id="pkChi" type="number" step="0.01" placeholder="0.3" value={pkChi} onChange={(e) => setPkChi(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Ofte ~0,2–0,4 for hydrokarbonbranner; lavere for ventilerte</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pkR">r — Avstand [m]</Label>
                  <Input id="pkR" type="number" step="0.1" placeholder="f.eks. 4" value={pkR} onChange={(e) => setPkR(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Fra «kilden» til treffpunkt</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pkCosTheta">cos θ — Vinkelfaktor [-]</Label>
                  <Input id="pkCosTheta" type="number" step="0.01" min="0" max="1" placeholder="1.0" value={pkCosTheta} onChange={(e) => setPkCosTheta(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Sett cos θ = 1 hvis flaten vender rett mot brannen</p>
                </div>
              </div>

              <Button onClick={calculatePunktkilde} className="w-full">Beregn stråling</Button>

              {pkResult && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold">Resultater:</h3>
                  <Card className={
                    pkResult.status === "ok" ? "border-green-500 bg-green-50 dark:bg-green-950" :
                    pkResult.status === "warning" ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950" :
                    "border-red-500 bg-red-50 dark:bg-red-950"
                  }>
                    <CardHeader><CardTitle className="text-base">Mottatt stråling q″<sub>rad</sub></CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{pkResult.straling} kW/m²</p>
                      <p className="text-sm text-muted-foreground mt-1">Ved {pkR} m avstand</p>
                    </CardContent>
                  </Card>

                  <div className={`p-4 rounded-lg ${
                    pkResult.status === "ok" ? "bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100" :
                    pkResult.status === "warning" ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100" :
                    "bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100"
                  }`}>
                    <p className="font-semibold mb-1">
                      {pkResult.status === "ok" && "✓ Strålingsnivået er akseptabelt"}
                      {pkResult.status === "warning" && "⚠ Strålingsnivået nærmer seg grensen"}
                      {pkResult.status === "error" && "✗ Strålingsnivået overskrider grenseverdien"}
                    </p>
                    <p className="text-sm">
                      {pkResult.status === "ok" && "Under 8 kW/m² — ingen spesiell beskyttelse nødvendig."}
                      {pkResult.status === "warning" && "Mellom 8–12,5 kW/m² — vurder tiltak."}
                      {pkResult.status === "error" && "Over 12,5 kW/m² — tiltak for brannspredning påkrevd."}
                    </p>
                  </div>

                  <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                    <p className="font-semibold">Grunnlag:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Punktkildemodell: q″ = (χ<sub>r</sub>·Q̇) / (4πr²) · cos θ</li>
                      <li>Forutsetter at brannen kan modelleres som en punktkilde</li>
                      <li>Best egnet for avstand {'>'} 2× branndiameter</li>
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
