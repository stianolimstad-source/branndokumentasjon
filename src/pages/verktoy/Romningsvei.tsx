import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Romningsvei = () => {
  const [width, setWidth] = useState("");
  const [persons, setPersons] = useState("");
  const [result, setResult] = useState<{
    minWidth: number;
    capacity: number;
    status: "ok" | "warning" | "error";
  } | null>(null);

  const calculateEvacuation = () => {
    const w = parseFloat(width);
    const p = parseFloat(persons);
    if (isNaN(w) || isNaN(p) || w <= 0 || p <= 0) return;

    const minWidth = Math.ceil((p / 150) * 1.2 * 10) / 10;
    const capacity = Math.floor((w / 1.2) * 150);

    let status: "ok" | "warning" | "error" = "ok";
    if (w < minWidth) status = "error";
    else if (w < minWidth * 1.2) status = "warning";

    setResult({ minWidth, capacity, status });
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
              <h1 className="text-xl font-bold">Rømningsveibredde</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Rømningsveibredde og kapasitet</CardTitle>
              <CardDescription>
                Beregn nødvendig bredde på rømningsveier basert på antall personer,
                eller finn kapasitet for en gitt bredde
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="width">Bredde på rømningsvei (m)</Label>
                  <Input id="width" type="number" step="0.1" placeholder="f.eks. 1.8" value={width} onChange={(e) => setWidth(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Minimum 0.9m for en person, 1.2m per 150 personer</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="persons">Antall personer</Label>
                  <Input id="persons" type="number" placeholder="f.eks. 200" value={persons} onChange={(e) => setPersons(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Totalt antall personer som skal kunne rømme</p>
                </div>
              </div>

              <Button onClick={calculateEvacuation} className="w-full">Beregn</Button>

              {result && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold">Resultater:</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className={
                      result.status === "ok" ? "border-green-500 bg-green-50 dark:bg-green-950" :
                      result.status === "warning" ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950" :
                      "border-red-500 bg-red-50 dark:bg-red-950"
                    }>
                      <CardHeader><CardTitle className="text-base">Minimum bredde</CardTitle></CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{result.minWidth} m</p>
                        <p className="text-sm text-muted-foreground mt-1">For {persons} personer</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle className="text-base">Kapasitet</CardTitle></CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{result.capacity} personer</p>
                        <p className="text-sm text-muted-foreground mt-1">Ved {width} m bredde</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className={`p-4 rounded-lg ${
                    result.status === "ok" ? "bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100" :
                    result.status === "warning" ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100" :
                    "bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100"
                  }`}>
                    <p className="font-semibold mb-1">
                      {result.status === "ok" && "✓ Bredden er tilstrekkelig"}
                      {result.status === "warning" && "⚠ Bredden er på minimumsgrensen"}
                      {result.status === "error" && "✗ Bredden er utilstrekkelig"}
                    </p>
                    <p className="text-sm">
                      {result.status === "ok" && "Rømningsveien oppfyller kravene til bredde."}
                      {result.status === "warning" && "Vurder å øke bredden for bedre margin."}
                      {result.status === "error" && `Øk bredden til minimum ${result.minWidth}m.`}
                    </p>
                  </div>

                  <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                    <p className="font-semibold">Grunnlag for beregningen:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Minimum bredde: 0.9m for én person</li>
                      <li>Kapasitet: 150 personer per 1.2m bredde</li>
                      <li>Basert på TEK17 § 11-12 og VTEK</li>
                      <li>Dette er en forenklet beregning - vurder alltid prosjektspesifikke forhold</li>
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

export default Romningsvei;
