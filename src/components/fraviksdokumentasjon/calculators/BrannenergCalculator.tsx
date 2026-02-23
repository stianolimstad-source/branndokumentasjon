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
    { name: "Tre (gran/furu)", mjPerKg: 17 }, { name: "Sponplate", mjPerKg: 18 },
    { name: "Papir/papp", mjPerKg: 17 }, { name: "Bomull/tekstil", mjPerKg: 18 },
  ]},
  { category: "Plast og syntetisk", items: [
    { name: "Polyetylen (PE)", mjPerKg: 44 }, { name: "Polystyren (PS/EPS)", mjPerKg: 40 },
    { name: "PVC", mjPerKg: 17 }, { name: "Polyuretan (PUR)", mjPerKg: 25 },
  ]},
  { category: "Væsker", items: [
    { name: "Bensin", mjPerKg: 44 }, { name: "Diesel/fyringsolje", mjPerKg: 42 },
    { name: "Etanol", mjPerKg: 27 },
  ]},
];

interface Props {
  onResult: (calc: AttachedCalculation) => void;
}

const BrannenergCalculator = ({ onResult }: Props) => {
  const [entries, setEntries] = useState<MaterialEntry[]>([]);
  const [romareal, setRomareal] = useState("");

  const addEntry = (name: string, mjPerKg: number) => {
    setEntries((prev) => [...prev, { id: crypto.randomUUID(), name, brannenergiPerKg: mjPerKg, mengdeKg: 0 }]);
  };

  const updateEntry = (id: string, field: keyof MaterialEntry, value: string) => {
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, [field]: field === "name" ? value : parseFloat(value) || 0 } : e));
  };

  const removeEntry = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));

  const totalBrannenergi = entries.reduce((sum, e) => sum + e.brannenergiPerKg * e.mengdeKg, 0);
  const arealNum = parseFloat(romareal);
  const spesifikkBrannenergi = !isNaN(arealNum) && arealNum > 0 ? totalBrannenergi / arealNum : null;

  const hasResult = entries.some(e => e.mengdeKg > 0);

  useEffect(() => {
    if (hasResult) {
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
    <div className="space-y-6">
      {/* Material library */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Materialbibliotek</Label>
        {materialBibliotek.map((cat) => (
          <div key={cat.category}>
            <p className="text-xs font-medium text-muted-foreground mb-1">{cat.category}</p>
            <div className="flex flex-wrap gap-1.5">
              {cat.items.map((item) => (
                <button key={item.name} type="button" onClick={() => addEntry(item.name, item.mjPerKg)}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Plus className="h-3 w-3" /><span>{item.name}</span><span className="text-muted-foreground">({item.mjPerKg})</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => addEntry("Egendefinert", 0)} className="mt-1">
          <Plus className="h-3 w-3 mr-1" /> Egendefinert materiale
        </Button>
      </div>

      {/* Calculation */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Romareal (m²)</Label>
          <Input type="number" step="0.1" placeholder="f.eks. 25" value={romareal} onChange={(e) => setRomareal(e.target.value)} />
        </div>

        {entries.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground text-sm">Velg materialer fra biblioteket ovenfor.</p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_80px_80px_36px] gap-2 text-xs font-medium text-muted-foreground">
              <span>Materiale</span><span>MJ/kg</span><span>kg</span><span></span>
            </div>
            {entries.map((entry) => (
              <div key={entry.id} className="grid grid-cols-[1fr_80px_80px_36px] gap-2 items-center">
                <Input value={entry.name} onChange={(e) => updateEntry(entry.id, "name", e.target.value)} className="h-8 text-xs" />
                <Input type="number" value={entry.brannenergiPerKg || ""} onChange={(e) => updateEntry(entry.id, "brannenergiPerKg", e.target.value)} className="h-8 text-xs" />
                <Input type="number" value={entry.mengdeKg || ""} onChange={(e) => updateEntry(entry.id, "mengdeKg", e.target.value)} className="h-8 text-xs" placeholder="kg" />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeEntry(entry.id)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {hasResult && (
          <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Total brannenergi</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold">{Math.round(totalBrannenergi)} MJ</p></CardContent>
            </Card>
            {spesifikkBrannenergi !== null && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Spesifikk brannenergi</CardTitle></CardHeader>
                <CardContent><p className="text-xl font-bold">{Math.round(spesifikkBrannenergi)} MJ/m²</p></CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrannenergCalculator;
