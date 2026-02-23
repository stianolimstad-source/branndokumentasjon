import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AttachedCalculation } from "../BeregningSection";

const categories = [
  { value: "forretning", label: "Forretning/butikk", factor: 3, unit: "m²/person" },
  { value: "kontor", label: "Kontor", factor: 10, unit: "m²/person" },
  { value: "skole", label: "Skole/undervisning", factor: 2, unit: "m²/person" },
  { value: "barnehage", label: "Barnehage", factor: 4, unit: "m²/person" },
  { value: "forsamling", label: "Forsamlingslokale", factor: 0.6, unit: "m²/person" },
  { value: "servering", label: "Servering/restaurant", factor: 1.4, unit: "m²/person" },
  { value: "lager", label: "Lager", factor: 30, unit: "m²/person" },
  { value: "industri", label: "Industri/verksted", factor: 10, unit: "m²/person" },
];

interface Props {
  onResult: (calc: AttachedCalculation) => void;
}

const PersontallCalculator = ({ onResult }: Props) => {
  const [areal, setAreal] = useState("");
  const [kategori, setKategori] = useState("");
  const [result, setResult] = useState<{ persontall: number; factor: number; kategoriLabel: string } | null>(null);

  const calculate = () => {
    const A = parseFloat(areal);
    const cat = categories.find((c) => c.value === kategori);
    if (isNaN(A) || A <= 0 || !cat) return;
    setResult({ persontall: Math.ceil(A / cat.factor), factor: cat.factor, kategoriLabel: cat.label });
  };

  useEffect(() => {
    if (result) {
      onResult({
        id: crypto.randomUUID(),
        type: "persontall",
        label: `Persontall: ${result.persontall} personer`,
        inputs: { areal_m2: parseFloat(areal), kategori: result.kategoriLabel, faktor_m2_per_person: result.factor },
        results: { persontall: result.persontall },
        kommentar: "",
      });
    }
  }, [result]);

  return (
    <div className="space-y-8">
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Persontallsberegning</CardTitle>
          <CardDescription>
            Beregn dimensjonerende persontall basert på areal og brukskategori.
            Brukes for dimensjonering av rømningsveier og branntekniske tiltak.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="areal-dlg">Areal (m²)</Label>
              <Input id="areal-dlg" type="number" placeholder="f.eks. 500" value={areal} onChange={(e) => setAreal(e.target.value)} />
              <p className="text-xs text-muted-foreground">Netto gulvareal for rommet/sonen</p>
            </div>
            <div className="space-y-2">
              <Label>Brukskategori</Label>
              <Select value={kategori} onValueChange={setKategori}>
                <SelectTrigger><SelectValue placeholder="Velg kategori" /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label} ({cat.factor} {cat.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Velg type bruk for arealet</p>
            </div>
          </div>

          <Button onClick={calculate} className="w-full">Beregn persontall</Button>

          {result && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold">Resultater:</h3>
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader><CardTitle className="text-base">Dimensjonerende persontall</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{result.persontall} personer</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {areal} m² ÷ {result.factor} m²/person ({result.kategoriLabel})
                  </p>
                </CardContent>
              </Card>

              <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                <p className="font-semibold">Faktorer per brukskategori:</p>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-muted-foreground">
                  {categories.map((cat) => (
                    <div key={cat.value} className={`flex justify-between ${cat.value === kategori ? "font-semibold text-foreground" : ""}`}>
                      <span>{cat.label}</span>
                      <span>{cat.factor} {cat.unit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                <p className="font-semibold">Grunnlag:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Basert på VTEK til TEK17 § 11-12</li>
                  <li>Faktorer er veiledende verdier</li>
                  <li>Vurder alltid spesielle forhold som møblering og bruk</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PersontallCalculator;
