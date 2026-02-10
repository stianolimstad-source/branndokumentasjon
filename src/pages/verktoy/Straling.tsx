import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Straling = () => {
  const [branneffekt, setBranneffekt] = useState("");
  const [avstand, setAvstand] = useState("");
  const [bredde, setBredde] = useState("");
  const [hoyde, setHoyde] = useState("");
  const [result, setResult] = useState<{
    straling: number;
    status: "ok" | "warning" | "error";
  } | null>(null);

  const calculate = () => {
    const Q = parseFloat(branneffekt); // kW
    const d = parseFloat(avstand); // m
    const W = parseFloat(bredde); // m
    const H = parseFloat(hoyde); // m

    if (isNaN(Q) || isNaN(d) || isNaN(W) || isNaN(H) || d <= 0 || W <= 0 || H <= 0) return;

    // Simplified point source radiation model: q = Q / (4 * π * d²)
    // With radiation fraction χ ≈ 0.3
    const chi = 0.3;
    const q = (chi * Q) / (4 * Math.PI * d * d);
    const straling = Math.round(q * 100) / 100;

    let status: "ok" | "warning" | "error" = "ok";
    if (straling > 12.5) status = "error";
    else if (straling > 8) status = "warning";

    setResult({ straling, status });
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
              <CardTitle>Strålingsberegning</CardTitle>
              <CardDescription>
                Beregn strålingsnivå (kW/m²) fra brann mot fasade eller nabobygning.
                Basert på forenklet punktkildemodell.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="branneffekt">Branneffekt (kW)</Label>
                  <Input id="branneffekt" type="number" placeholder="f.eks. 3000" value={branneffekt} onChange={(e) => setBranneffekt(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Total branneffekt i kilowatt</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avstand">Avstand (m)</Label>
                  <Input id="avstand" type="number" step="0.1" placeholder="f.eks. 4" value={avstand} onChange={(e) => setAvstand(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Avstand fra brannkilde til mottaker</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bredde">Åpningsbredde (m)</Label>
                  <Input id="bredde" type="number" step="0.1" placeholder="f.eks. 2" value={bredde} onChange={(e) => setBredde(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Bredde på stråleflaten/åpning</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hoyde">Åpningshøyde (m)</Label>
                  <Input id="hoyde" type="number" step="0.1" placeholder="f.eks. 1.5" value={hoyde} onChange={(e) => setHoyde(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Høyde på stråleflaten/åpning</p>
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
                    <CardHeader><CardTitle className="text-base">Mottatt stråling</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{result.straling} kW/m²</p>
                      <p className="text-sm text-muted-foreground mt-1">Ved {avstand} m avstand</p>
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
                      {result.status === "ok" && "Under 8 kW/m² - ingen spesiell beskyttelse nødvendig."}
                      {result.status === "warning" && "Mellom 8-12.5 kW/m² - vurder tiltak for å redusere stråling."}
                      {result.status === "error" && "Over 12.5 kW/m² - tiltak for brannspredning er påkrevd."}
                    </p>
                  </div>

                  <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                    <p className="font-semibold">Grunnlag:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Forenklet punktkildemodell med strålingsfaktor χ = 0.3</li>
                      <li>Grenseverdi: 12.5 kW/m² for brannspredning til annen bygning</li>
                      <li>8 kW/m² som anbefalt varselgrense</li>
                      <li>Basert på TEK17 § 11-6 og VTEK</li>
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
