import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { AttachedCalculation } from "../BeregningSection";

interface MaterialEntry {
  id: string;
  name: string;
  brannenergiPerKg: number;
  mengdeKg: number;
}

const materialBibliotek = [
  { category: "Tre og cellulose", items: [
    { name: "Tre (gran/furu)", mjPerKg: 17 },
    { name: "Sponplate", mjPerKg: 18 },
    { name: "MDF", mjPerKg: 18 },
    { name: "Papir/papp", mjPerKg: 17 },
    { name: "Bomull/tekstil", mjPerKg: 18 },
  ]},
  { category: "Plast og syntetisk", items: [
    { name: "Polyetylen (PE)", mjPerKg: 44 },
    { name: "Polypropylen (PP)", mjPerKg: 44 },
    { name: "Polystyren (PS/EPS)", mjPerKg: 40 },
    { name: "PVC", mjPerKg: 17 },
    { name: "Polyuretan (PUR)", mjPerKg: 25 },
    { name: "Nylon", mjPerKg: 30 },
    { name: "ABS", mjPerKg: 36 },
  ]},
  { category: "Væsker", items: [
    { name: "Bensin", mjPerKg: 44 },
    { name: "Diesel/fyringsolje", mjPerKg: 42 },
    { name: "Etanol", mjPerKg: 27 },
    { name: "Aceton", mjPerKg: 29 },
  ]},
  { category: "Annet", items: [
    { name: "Gummi", mjPerKg: 32 },
    { name: "Ull", mjPerKg: 21 },
    { name: "Lær", mjPerKg: 19 },
    { name: "Bitumen/asfalt", mjPerKg: 40 },
  ]},
];

interface Props {
  onResult?: (calc: AttachedCalculation) => void;
}

const BrannenergCalculator = ({ onResult }: Props) => {
  const [entries, setEntries] = useState<MaterialEntry[]>([]);
  const [romareal, setRomareal] = useState("");

  const addEntry = (name: string, mjPerKg: number) => {
    setEntries((prev) => [...prev, { id: crypto.randomUUID(), name, brannenergiPerKg: mjPerKg, mengdeKg: 0 }]);
  };

  const addCustomEntry = () => {
    setEntries((prev) => [...prev, { id: crypto.randomUUID(), name: "Egendefinert", brannenergiPerKg: 0, mengdeKg: 0 }]);
  };

  const updateEntry = (id: string, field: keyof MaterialEntry, value: string) => {
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, [field]: field === "name" ? value : parseFloat(value) || 0 } : e));
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const totalBrannenergi = entries.reduce((sum, e) => sum + e.brannenergiPerKg * e.mengdeKg, 0);
  const arealNum = parseFloat(romareal);
  const spesifikkBrannenergi = !isNaN(arealNum) && arealNum > 0 ? totalBrannenergi / arealNum : null;

  const hasResult = entries.some(e => e.mengdeKg > 0);

  useEffect(() => {
    if (hasResult && onResult) {
      onResult({
        id: crypto.randomUUID(),
        type: "brannenergi",
        label: `Brannenergi: ${Math.round(totalBrannenergi)} MJ${spesifikkBrannenergi ? ` (${Math.round(spesifikkBrannenergi)} MJ/m²)` : ""}`,
        inputs: {
          materialer: JSON.stringify(entries.filter(e => e.mengdeKg > 0).map(e => ({ name: e.name, mjPerKg: e.brannenergiPerKg, kg: e.mengdeKg }))),
          ...(romareal ? { romareal_m2: arealNum } : {}),
        },
        results: {
          total_MJ: Math.round(totalBrannenergi),
          ...(spesifikkBrannenergi ? { spesifikk_MJ_m2: Math.round(spesifikkBrannenergi) } : {}),
        },
        kommentar: "",
      });
    }
  }, [totalBrannenergi, spesifikkBrannenergi, hasResult]);

  return (
    <div className="space-y-8">
      {/* Materialbibliotek */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Materialbibliotek</CardTitle>
          <CardDescription>
            Velg materialer for å legge dem til beregningen. Verdiene er veiledende og hentet fra SFPE Handbook of Fire Protection Engineering og NS-EN 1991-1-2 (Eurokode 1).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {materialBibliotek.map((cat) => (
            <div key={cat.category}>
              <p className="text-sm font-medium mb-2">{cat.category}</p>
              <div className="flex flex-wrap gap-1.5">
                {cat.items.map((item) => (
                  <button key={item.name} type="button" onClick={() => addEntry(item.name, item.mjPerKg)}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Plus className="h-3 w-3" />
                    <span>{item.name}</span>
                    <span className="text-muted-foreground">({item.mjPerKg} MJ/kg)</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addCustomEntry} className="mt-2">
            <Plus className="h-4 w-4 mr-1" /> Legg til egendefinert materiale
          </Button>
        </CardContent>
      </Card>

      {/* Beregning */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Brannenergiberegning</CardTitle>
          <CardDescription>Legg inn mengde for hvert materiale og romareal for å beregne total og spesifikk brannenergi.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="romareal-dlg">Romareal (m²)</Label>
            <Input id="romareal-dlg" type="number" step="0.1" placeholder="f.eks. 25" value={romareal} onChange={(e) => setRomareal(e.target.value)} />
            <p className="text-xs text-muted-foreground">Brukes for å beregne spesifikk brannenergi (MJ/m²)</p>
          </div>

          {entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Ingen materialer lagt til ennå. Velg fra biblioteket ovenfor.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_100px_100px_40px] gap-2 text-xs font-medium text-muted-foreground px-1">
                <span>Materiale</span><span>MJ/kg</span><span>Mengde (kg)</span><span></span>
              </div>
              {entries.map((entry) => (
                <div key={entry.id} className="grid grid-cols-[1fr_100px_100px_40px] gap-2 items-center">
                  <Input value={entry.name} onChange={(e) => updateEntry(entry.id, "name", e.target.value)} className="h-9 text-sm" />
                  <Input type="number" value={entry.brannenergiPerKg || ""} onChange={(e) => updateEntry(entry.id, "brannenergiPerKg", e.target.value)} className="h-9 text-sm" />
                  <Input type="number" value={entry.mengdeKg || ""} onChange={(e) => updateEntry(entry.id, "mengdeKg", e.target.value)} className="h-9 text-sm" placeholder="kg" />
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => removeEntry(entry.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {entries.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold">Resultater:</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader><CardTitle className="text-base">Total brannenergi</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{Math.round(totalBrannenergi)} MJ</p>
                    <p className="text-sm text-muted-foreground mt-1">Sum av alle materialer</p>
                  </CardContent>
                </Card>
                <Card className={spesifikkBrannenergi !== null ? "border-primary/30 bg-primary/5" : "border-muted"}>
                  <CardHeader><CardTitle className="text-base">Spesifikk brannenergi</CardTitle></CardHeader>
                  <CardContent>
                    {spesifikkBrannenergi !== null ? (
                      <>
                        <p className="text-2xl font-bold">{Math.round(spesifikkBrannenergi)} MJ/m²</p>
                        <p className="text-sm text-muted-foreground mt-1">Total / romareal ({romareal} m²)</p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Oppgi romareal for å beregne</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                <p className="font-semibold">Grunnlag:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Total brannenergi: Q = Σ (m<sub>i</sub> · H<sub>c,i</sub>)</li>
                  <li>Spesifikk brannenergi: q = Q / A<sub>rom</sub></li>
                  <li>Kalorimetriske verdier fra SFPE Handbook og NS-EN 1991-1-2</li>
                  <li>Faktisk brannenergi kan variere med materialets tilstand, fuktighet og sammensetning</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BrannenergCalculator;
