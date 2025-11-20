import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, ArrowLeft, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Priskalkulator = () => {
  const [area, setArea] = useState<string>("");
  const [floors, setFloors] = useState<string>("");
  const [riskClass, setRiskClass] = useState<string>("");
  const [fireClass, setFireClass] = useState<string>("");
  const [projectType, setProjectType] = useState<string>("");
  const [complexity, setComplexity] = useState<string>("standard");
  const [result, setResult] = useState<{
    basePrice: number;
    areaPrice: number;
    floorPrice: number;
    complexityPrice: number;
    totalPrice: number;
    priceRange: { min: number; max: number };
  } | null>(null);

  const calculatePrice = () => {
    const areaVal = parseFloat(area);
    const floorsVal = parseFloat(floors);

    if (isNaN(areaVal) || isNaN(floorsVal) || !riskClass || !fireClass || !projectType) {
      return;
    }

    // Base prices per project type (NOK)
    const basePrices: Record<string, number> = {
      konsept: 15000,
      tilstand: 20000,
      fravik: 12000,
      komplett: 35000,
      beregning: 8000,
    };

    // Price per m² based on area size (degressive)
    let pricePerM2 = 50;
    if (areaVal > 5000) pricePerM2 = 30;
    else if (areaVal > 2000) pricePerM2 = 35;
    else if (areaVal > 1000) pricePerM2 = 40;

    // Floor complexity multiplier
    const floorMultiplier = 1 + (floorsVal - 1) * 0.15;

    // Risk and fire class complexity
    const riskMultiplier = 1 + (parseInt(riskClass) - 1) * 0.1;
    const fireMultiplier = 1 + (parseInt(fireClass) - 1) * 0.08;

    // Additional complexity factor
    const complexityMultipliers: Record<string, number> = {
      standard: 1,
      middels: 1.25,
      hoy: 1.5,
    };

    const basePrice = basePrices[projectType] || 15000;
    const areaPrice = areaVal * pricePerM2;
    const floorPrice = basePrice * (floorMultiplier - 1);
    const complexityFactor = riskMultiplier * fireMultiplier * complexityMultipliers[complexity];
    const complexityPrice = (basePrice + areaPrice + floorPrice) * (complexityFactor - 1);

    const totalPrice = Math.round((basePrice + areaPrice + floorPrice + complexityPrice) / 1000) * 1000;
    const priceRange = {
      min: Math.round(totalPrice * 0.85 / 1000) * 1000,
      max: Math.round(totalPrice * 1.15 / 1000) * 1000,
    };

    setResult({
      basePrice,
      areaPrice: Math.round(areaPrice),
      floorPrice: Math.round(floorPrice),
      complexityPrice: Math.round(complexityPrice),
      totalPrice,
      priceRange,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tilbake
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                <Calculator className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">Priskalkulator</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Calculator Card */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Beregn pris for brannteknisk oppdrag</CardTitle>
              <CardDescription>
                Få et estimat basert på byggets egenskaper og oppdragstype
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="area">Byggets areal (m²)</Label>
                  <Input
                    id="area"
                    type="number"
                    placeholder="f.eks. 2500"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="floors">Antall etasjer</Label>
                  <Input
                    id="floors"
                    type="number"
                    placeholder="f.eks. 4"
                    value={floors}
                    onChange={(e) => setFloors(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="riskClass">Risikoklasse</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">RK1 (lavest) til RK6 (høyest) basert på konsekvens</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select value={riskClass} onValueChange={setRiskClass}>
                    <SelectTrigger id="riskClass">
                      <SelectValue placeholder="Velg risikoklasse" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">RK1 - Svært lav</SelectItem>
                      <SelectItem value="2">RK2 - Lav</SelectItem>
                      <SelectItem value="3">RK3 - Middels</SelectItem>
                      <SelectItem value="4">RK4 - Høy</SelectItem>
                      <SelectItem value="5">RK5 - Svært høy</SelectItem>
                      <SelectItem value="6">RK6 - Ekstraordinær</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="fireClass">Brannklasse</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">BKL1 til BKL4 - teknisk kompleksitet</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select value={fireClass} onValueChange={setFireClass}>
                    <SelectTrigger id="fireClass">
                      <SelectValue placeholder="Velg brannklasse" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">BKL1 - Enklest</SelectItem>
                      <SelectItem value="2">BKL2 - Middels</SelectItem>
                      <SelectItem value="3">BKL3 - Kompleks</SelectItem>
                      <SelectItem value="4">BKL4 - Svært kompleks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectType">Type oppdrag</Label>
                  <Select value={projectType} onValueChange={setProjectType}>
                    <SelectTrigger id="projectType">
                      <SelectValue placeholder="Velg oppdragstype" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="konsept">Brannkonsept</SelectItem>
                      <SelectItem value="tilstand">Tilstandsvurdering</SelectItem>
                      <SelectItem value="fravik">Fraviksanalyse</SelectItem>
                      <SelectItem value="komplett">Komplett rapport</SelectItem>
                      <SelectItem value="beregning">Beregning/verktøy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complexity">Ekstra kompleksitet</Label>
                  <Select value={complexity} onValueChange={setComplexity}>
                    <SelectTrigger id="complexity">
                      <SelectValue placeholder="Velg kompleksitet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="middels">Middels (spesielle forhold)</SelectItem>
                      <SelectItem value="hoy">Høy (omfattende utredning)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={calculatePrice} className="w-full">
                Beregn pris
              </Button>

              {result && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-lg">Prisestimat:</h3>

                  <Card className="bg-gradient-primary text-primary-foreground">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm opacity-90 mb-2">Estimert pris</p>
                        <p className="text-4xl font-bold">{result.totalPrice.toLocaleString('nb-NO')} kr</p>
                        <p className="text-sm opacity-90 mt-2">
                          Prisintervall: {result.priceRange.min.toLocaleString('nb-NO')} - {result.priceRange.max.toLocaleString('nb-NO')} kr
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Grunnpris</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{result.basePrice.toLocaleString('nb-NO')} kr</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Basert på oppdragstype
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Arealtillegg</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{result.areaPrice.toLocaleString('nb-NO')} kr</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {area} m² × pris/m²
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Etasjetillegg</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{result.floorPrice.toLocaleString('nb-NO')} kr</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {floors} etasjer
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Kompleksitetstillegg</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{result.complexityPrice.toLocaleString('nb-NO')} kr</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          RK{riskClass}, BKL{fireClass}, {complexity}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                    <p className="font-semibold">Inkludert i prisen:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Befaring og datainnhenting</li>
                      <li>Analyse og vurdering etter gjeldende regelverk</li>
                      <li>Utarbeidelse av rapport/dokumentasjon</li>
                      <li>Møte/gjennomgang med oppdragsgiver</li>
                    </ul>
                    <p className="text-xs mt-3 italic">
                      Dette er et estimat. Endelig pris avtales etter befaring og kartlegging av omfang.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Om priskalkulatoren</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Priskalkulatoren gir et estimat basert på byggets størrelse, kompleksitet og oppdragstype.
                Prisen beregnes ut fra:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Grunnpris per oppdragstype</li>
                <li>Areal (degressiv pris/m²)</li>
                <li>Antall etasjer (kompleksitetsfaktor)</li>
                <li>Risikoklasse og brannklasse</li>
                <li>Ekstra kompleksitetsfaktorer</li>
              </ul>
              <p className="mt-3">
                Estimatet er veiledende. Endelig pris bestemmes etter befaring og detaljert kartlegging av prosjektets omfang.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Priskalkulator;
