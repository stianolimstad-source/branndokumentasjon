import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Trash2, Plus, ChevronDown, ChevronUp, Flame, MoveVertical, Zap, Calculator } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export interface AttachedCalculation {
  id: string;
  type: "straling" | "flammehoyde" | "brannenergi";
  label: string;
  inputs: Record<string, string | number>;
  results: Record<string, string | number>;
  kommentar: string;
}

const SIGMA = 5.67e-8;

const calculatorTypes = [
  { type: "straling" as const, label: "Strålingsberegning", icon: Flame, desc: "Solid flamme-modell" },
  { type: "flammehoyde" as const, label: "Flammehøyde", icon: MoveVertical, desc: "Heskestads korrelasjon" },
  { type: "brannenergi" as const, label: "Brannenergi", icon: Zap, desc: "Total og spesifikk" },
];

interface Props {
  beregninger: AttachedCalculation[];
  onChange: (beregninger: AttachedCalculation[]) => void;
}

// --- Strålingsberegning mini-calculator ---
const StralingCalculator = ({ onAdd }: { onAdd: (calc: AttachedCalculation) => void }) => {
  const [emissivitet, setEmissivitet] = useState("0.9");
  const [flammeTempC, setFlammeTempC] = useState("1000");
  const [siktfaktor, setSiktfaktor] = useState("");
  const [hv, setHv] = useState("");
  const [bv, setBv] = useState("");
  const [r, setR] = useState("");
  const [kommentar, setKommentar] = useState("");
  const [result, setResult] = useState<{ straling: number; Ef: number } | null>(null);

  const calculateSynsfaktor = () => {
    const Hv = parseFloat(hv), Bv = parseFloat(bv), R = parseFloat(r);
    if ([Hv, Bv, R].some(v => isNaN(v)) || R <= 0) return;
    const x = Hv / (2 * R), y = Bv / (2 * R);
    const toDeg = (rad: number) => rad * (180 / Math.PI);
    const term1 = (x / Math.sqrt(1 + x * x)) * toDeg(Math.atan(y / Math.sqrt(1 + x * x)));
    const term2 = (y / Math.sqrt(1 + y * y)) * toDeg(Math.atan(x / Math.sqrt(1 + y * y)));
    const F12 = (1 / 90) * Math.abs(term1 + term2);
    setSiktfaktor((Math.round(F12 * 10000) / 10000).toString());
  };

  const calculate = () => {
    const eps = parseFloat(emissivitet), TfC = parseFloat(flammeTempC), F12 = parseFloat(siktfaktor);
    if ([eps, TfC, F12].some(v => isNaN(v)) || F12 < 0 || F12 > 1) return;
    const Tf = TfC + 273.15;
    const Ef = eps * SIGMA * Math.pow(Tf, 4);
    const q = Ef * F12;
    setResult({ straling: Math.round((q / 1000) * 100) / 100, Ef: Math.round((Ef / 1000) * 100) / 100 });
  };

  const handleAdd = () => {
    if (!result) return;
    onAdd({
      id: crypto.randomUUID(),
      type: "straling",
      label: `Stråling: ${result.straling} kW/m²`,
      inputs: {
        emissivitet: parseFloat(emissivitet),
        flammetemperatur_C: parseFloat(flammeTempC),
        siktfaktor: parseFloat(siktfaktor),
        ...(hv ? { hoyde_m: parseFloat(hv) } : {}),
        ...(bv ? { bredde_m: parseFloat(bv) } : {}),
        ...(r ? { avstand_m: parseFloat(r) } : {}),
      },
      results: { straling_kW_m2: result.straling, Ef_kW_m2: result.Ef },
      kommentar,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">ε — Emissivitet</Label>
          <Input type="number" step="0.01" value={emissivitet} onChange={e => setEmissivitet(e.target.value)} className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tf — Temp [°C]</Label>
          <Input type="number" value={flammeTempC} onChange={e => setFlammeTempC(e.target.value)} className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">F₁₂ — Siktfaktor</Label>
          <Input type="number" step="0.0001" min="0" max="1" value={siktfaktor} onChange={e => setSiktfaktor(e.target.value)} className="h-8 text-xs" />
        </div>
      </div>

      {/* Synsfaktor helper */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="text-xs w-full justify-start">
            <Calculator className="h-3 w-3 mr-1" /> Beregn F₁₂ fra geometri
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 rounded-md">
            <div className="space-y-1">
              <Label className="text-xs">Hv [m]</Label>
              <Input type="number" step="0.1" value={hv} onChange={e => setHv(e.target.value)} className="h-7 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Bv [m]</Label>
              <Input type="number" step="0.1" value={bv} onChange={e => setBv(e.target.value)} className="h-7 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">R [m]</Label>
              <Input type="number" step="0.1" value={r} onChange={e => setR(e.target.value)} className="h-7 text-xs" />
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={calculateSynsfaktor} className="w-full mt-2 text-xs h-7">
            Beregn og sett F₁₂
          </Button>
        </CollapsibleContent>
      </Collapsible>

      <Button size="sm" onClick={calculate} className="w-full">Beregn stråling</Button>

      {result && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-md bg-primary/5 border border-primary/20 text-center">
              <p className="text-xs text-muted-foreground">Ef</p>
              <p className="font-bold text-sm">{result.Ef} kW/m²</p>
            </div>
            <div className={`p-2 rounded-md text-center border ${
              result.straling > 12.5 ? "bg-destructive/10 border-destructive/30" :
              result.straling > 8 ? "bg-yellow-500/10 border-yellow-500/30" :
              "bg-green-500/10 border-green-500/30"
            }`}>
              <p className="text-xs text-muted-foreground">q″rad</p>
              <p className="font-bold text-sm">{result.straling} kW/m²</p>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Kommentar (valgfri)</Label>
            <Textarea value={kommentar} onChange={e => setKommentar(e.target.value)} placeholder="F.eks. beregning for fasade mot nord..." className="min-h-[50px] text-xs" />
          </div>
          <Button size="sm" variant="default" onClick={handleAdd} className="w-full">
            <Plus className="h-3 w-3 mr-1" /> Legg til i fraviket
          </Button>
        </div>
      )}
    </div>
  );
};

// --- Flammehøyde mini-calculator ---
const FlammehoydeCalculator = ({ onAdd }: { onAdd: (calc: AttachedCalculation) => void }) => {
  const [branneffekt, setBranneffekt] = useState("");
  const [diameter, setDiameter] = useState("");
  const [kommentar, setKommentar] = useState("");
  const [result, setResult] = useState<{ flammehoyde: number; flammetipp: number; D: number } | null>(null);

  const calculate = () => {
    const Q = parseFloat(branneffekt), D = parseFloat(diameter);
    if (isNaN(Q) || Q <= 0 || isNaN(D) || D <= 0) return;
    const Lf = 0.235 * Math.pow(Q, 0.4) - 1.02 * D;
    const flammehoyde = Math.max(0, Math.round(Lf * 100) / 100);
    const flammetipp = Math.round(flammehoyde * 1.5 * 100) / 100;
    setResult({ flammehoyde, flammetipp, D });
  };

  const handleAdd = () => {
    if (!result) return;
    onAdd({
      id: crypto.randomUUID(),
      type: "flammehoyde",
      label: `Flammehøyde: ${result.flammehoyde} m`,
      inputs: { branneffekt_kW: parseFloat(branneffekt), diameter_m: parseFloat(diameter) },
      results: { flammehoyde_m: result.flammehoyde, flammetipp_m: result.flammetipp },
      kommentar,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Q̇ — Branneffekt [kW]</Label>
          <Input type="number" placeholder="f.eks. 3000" value={branneffekt} onChange={e => setBranneffekt(e.target.value)} className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">D — Diameter [m]</Label>
          <Input type="number" step="0.1" placeholder="f.eks. 2" value={diameter} onChange={e => setDiameter(e.target.value)} className="h-8 text-xs" />
        </div>
      </div>

      <Button size="sm" onClick={calculate} className="w-full">Beregn flammehøyde</Button>

      {result && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-md bg-primary/5 border border-primary/20 text-center">
              <p className="text-xs text-muted-foreground">Lf (gj.snitt)</p>
              <p className="font-bold text-sm">{result.flammehoyde} m</p>
            </div>
            <div className="p-2 rounded-md bg-muted border text-center">
              <p className="text-xs text-muted-foreground">Flammetipp</p>
              <p className="font-bold text-sm">{result.flammetipp} m</p>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Kommentar (valgfri)</Label>
            <Textarea value={kommentar} onChange={e => setKommentar(e.target.value)} placeholder="F.eks. brannscenario for åpent kontor..." className="min-h-[50px] text-xs" />
          </div>
          <Button size="sm" variant="default" onClick={handleAdd} className="w-full">
            <Plus className="h-3 w-3 mr-1" /> Legg til i fraviket
          </Button>
        </div>
      )}
    </div>
  );
};

// --- Brannenergi mini-calculator ---
const BrannengiCalculator = ({ onAdd }: { onAdd: (calc: AttachedCalculation) => void }) => {
  const [materialer, setMaterialer] = useState<{ name: string; mjPerKg: number; kg: number }[]>([]);
  const [romareal, setRomareal] = useState("");
  const [kommentar, setKommentar] = useState("");

  const addMaterial = () => setMaterialer(prev => [...prev, { name: "", mjPerKg: 0, kg: 0 }]);

  const quickMaterials = [
    { name: "Tre (gran/furu)", mjPerKg: 17 },
    { name: "Polyetylen (PE)", mjPerKg: 44 },
    { name: "Papir/papp", mjPerKg: 17 },
    { name: "Polyuretan (PUR)", mjPerKg: 25 },
  ];

  const total = materialer.reduce((s, m) => s + m.mjPerKg * m.kg, 0);
  const arealNum = parseFloat(romareal);
  const spesifikk = !isNaN(arealNum) && arealNum > 0 ? total / arealNum : null;
  const hasResult = materialer.some(m => m.kg > 0);

  const handleAdd = () => {
    if (!hasResult) return;
    onAdd({
      id: crypto.randomUUID(),
      type: "brannenergi",
      label: `Brannenergi: ${Math.round(total)} MJ${spesifikk ? ` (${Math.round(spesifikk)} MJ/m²)` : ""}`,
      inputs: {
        materialer: JSON.stringify(materialer.filter(m => m.kg > 0).map(m => ({ name: m.name, mjPerKg: m.mjPerKg, kg: m.kg }))),
        ...(romareal ? { romareal_m2: arealNum } : {}),
      },
      results: {
        total_MJ: Math.round(total),
        ...(spesifikk ? { spesifikk_MJ_m2: Math.round(spesifikk) } : {}),
      },
      kommentar,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {quickMaterials.map(m => (
          <button key={m.name} type="button" onClick={() => setMaterialer(prev => [...prev, { ...m, kg: 0 }])}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-xs hover:bg-accent transition-colors">
            <Plus className="h-2.5 w-2.5" /> {m.name}
          </button>
        ))}
        <button type="button" onClick={addMaterial}
          className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-0.5 text-xs hover:bg-accent transition-colors">
          <Plus className="h-2.5 w-2.5" /> Egendefinert
        </button>
      </div>

      {materialer.length > 0 && (
        <div className="space-y-1">
          {materialer.map((m, i) => (
            <div key={i} className="grid grid-cols-[1fr_60px_60px_28px] gap-1 items-center">
              <Input value={m.name} onChange={e => { const n = [...materialer]; n[i].name = e.target.value; setMaterialer(n); }} className="h-7 text-xs" />
              <Input type="number" value={m.mjPerKg || ""} onChange={e => { const n = [...materialer]; n[i].mjPerKg = parseFloat(e.target.value) || 0; setMaterialer(n); }} className="h-7 text-xs" placeholder="MJ/kg" />
              <Input type="number" value={m.kg || ""} onChange={e => { const n = [...materialer]; n[i].kg = parseFloat(e.target.value) || 0; setMaterialer(n); }} className="h-7 text-xs" placeholder="kg" />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMaterialer(prev => prev.filter((_, j) => j !== i))}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-xs">Romareal [m²] (valgfri)</Label>
        <Input type="number" step="0.1" value={romareal} onChange={e => setRomareal(e.target.value)} className="h-7 text-xs" placeholder="f.eks. 25" />
      </div>

      {hasResult && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-md bg-primary/5 border border-primary/20 text-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-bold text-sm">{Math.round(total)} MJ</p>
            </div>
            {spesifikk !== null && (
              <div className="p-2 rounded-md bg-primary/5 border border-primary/20 text-center">
                <p className="text-xs text-muted-foreground">Spesifikk</p>
                <p className="font-bold text-sm">{Math.round(spesifikk)} MJ/m²</p>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Kommentar (valgfri)</Label>
            <Textarea value={kommentar} onChange={e => setKommentar(e.target.value)} placeholder="F.eks. branncelle B2.1..." className="min-h-[50px] text-xs" />
          </div>
          <Button size="sm" variant="default" onClick={handleAdd} className="w-full">
            <Plus className="h-3 w-3 mr-1" /> Legg til i fraviket
          </Button>
        </div>
      )}
    </div>
  );
};

// --- Main section ---
const BeregningSection = ({ beregninger, onChange }: Props) => {
  const [activeCalc, setActiveCalc] = useState<"straling" | "flammehoyde" | "brannenergi" | null>(null);

  const addCalc = (calc: AttachedCalculation) => {
    onChange([...beregninger, calc]);
    setActiveCalc(null);
  };

  const removeCalc = (id: string) => {
    onChange(beregninger.filter(b => b.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="border-b-2 border-foreground/20 pb-2">
        <Label className="text-base font-extrabold text-foreground">Beregninger</Label>
      </div>

      {/* Existing attached calculations */}
      {beregninger.length > 0 && (
        <div className="space-y-2">
          {beregninger.map(calc => {
            const typeInfo = calculatorTypes.find(c => c.type === calc.type);
            const Icon = typeInfo?.icon || Calculator;
            return (
              <div key={calc.id} className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30">
                <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{calc.label}</p>
                  {calc.kommentar && <p className="text-xs text-muted-foreground mt-0.5">{calc.kommentar}</p>}
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.entries(calc.results).map(([key, val]) => (
                      <span key={key} className="text-xs bg-background px-1.5 py-0.5 rounded border">
                        {key.replace(/_/g, " ")}: <strong>{val}</strong>
                      </span>
                    ))}
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Fjerne beregning?</AlertDialogTitle>
                      <AlertDialogDescription>Er du sikker på at du vil fjerne denne beregningen fra fraviket?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Avbryt</AlertDialogCancel>
                      <AlertDialogAction onClick={() => removeCalc(calc.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Fjern</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            );
          })}
        </div>
      )}

      {/* Calculator selector */}
      {!activeCalc ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Legg til en beregning fra verktøyene:</p>
          <div className="flex flex-wrap gap-2">
            {calculatorTypes.map(ct => (
              <Button key={ct.type} variant="outline" size="sm" onClick={() => setActiveCalc(ct.type)} className="text-xs">
                <ct.icon className="h-3.5 w-3.5 mr-1.5" />
                {ct.label}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <Card className="border-primary/20">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                {React.createElement(calculatorTypes.find(c => c.type === activeCalc)!.icon, { className: "h-4 w-4" })}
                {calculatorTypes.find(c => c.type === activeCalc)!.label}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setActiveCalc(null)} className="text-xs h-7">
                Avbryt
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {activeCalc === "straling" && <StralingCalculator onAdd={addCalc} />}
            {activeCalc === "flammehoyde" && <FlammehoydeCalculator onAdd={addCalc} />}
            {activeCalc === "brannenergi" && <BrannengiCalculator onAdd={addCalc} />}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BeregningSection;
