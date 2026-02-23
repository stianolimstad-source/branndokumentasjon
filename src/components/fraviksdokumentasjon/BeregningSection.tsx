import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Trash2, Plus, Flame, MoveVertical, Zap, Calculator, Users, Box } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export interface AttachedCalculation {
  id: string;
  type: "straling" | "flammehoyde" | "brannenergi" | "persontall" | "omhyllingsflate";
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
  { type: "persontall" as const, label: "Persontallsberegning", icon: Users, desc: "Basert på areal og brukskategori" },
  { type: "omhyllingsflate" as const, label: "Omhyllingsflate", icon: Box, desc: "Gulv, tak og vegger" },
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

// --- Persontall mini-calculator ---
const persontallCategories = [
  { value: "forretning", label: "Forretning/butikk", factor: 3, unit: "m²/person" },
  { value: "kontor", label: "Kontor", factor: 10, unit: "m²/person" },
  { value: "skole", label: "Skole/undervisning", factor: 2, unit: "m²/person" },
  { value: "barnehage", label: "Barnehage", factor: 4, unit: "m²/person" },
  { value: "forsamling", label: "Forsamlingslokale", factor: 0.6, unit: "m²/person" },
  { value: "servering", label: "Servering/restaurant", factor: 1.4, unit: "m²/person" },
  { value: "lager", label: "Lager", factor: 30, unit: "m²/person" },
  { value: "industri", label: "Industri/verksted", factor: 10, unit: "m²/person" },
];

const PersontallCalculator = ({ onAdd }: { onAdd: (calc: AttachedCalculation) => void }) => {
  const [areal, setAreal] = useState("");
  const [kategori, setKategori] = useState("");
  const [kommentar, setKommentar] = useState("");
  const [result, setResult] = useState<{ persontall: number; factor: number; kategoriLabel: string } | null>(null);

  const calculate = () => {
    const A = parseFloat(areal);
    const cat = persontallCategories.find(c => c.value === kategori);
    if (isNaN(A) || A <= 0 || !cat) return;
    const persontall = Math.ceil(A / cat.factor);
    setResult({ persontall, factor: cat.factor, kategoriLabel: cat.label });
  };

  const handleAdd = () => {
    if (!result) return;
    const cat = persontallCategories.find(c => c.value === kategori)!;
    onAdd({
      id: crypto.randomUUID(),
      type: "persontall",
      label: `Persontall: ${result.persontall} personer`,
      inputs: { areal_m2: parseFloat(areal), kategori: result.kategoriLabel, faktor_m2_per_person: result.factor },
      results: { persontall: result.persontall },
      kommentar,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Areal [m²]</Label>
          <Input type="number" placeholder="f.eks. 500" value={areal} onChange={e => setAreal(e.target.value)} className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Brukskategori</Label>
          <Select value={kategori} onValueChange={setKategori}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Velg kategori" /></SelectTrigger>
            <SelectContent>
              {persontallCategories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label} ({cat.factor} {cat.unit})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button size="sm" onClick={calculate} className="w-full">Beregn persontall</Button>
      {result && (
        <div className="space-y-3">
          <div className="p-2 rounded-md bg-primary/5 border border-primary/20 text-center">
            <p className="text-xs text-muted-foreground">Dimensjonerende persontall</p>
            <p className="font-bold text-sm">{result.persontall} personer</p>
            <p className="text-xs text-muted-foreground">{areal} m² ÷ {result.factor} m²/person</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Kommentar (valgfri)</Label>
            <Textarea value={kommentar} onChange={e => setKommentar(e.target.value)} placeholder="F.eks. persontall for kontoretasje 2..." className="min-h-[50px] text-xs" />
          </div>
          <Button size="sm" variant="default" onClick={handleAdd} className="w-full">
            <Plus className="h-3 w-3 mr-1" /> Legg til i fraviket
          </Button>
        </div>
      )}
    </div>
  );
};

// --- Omhyllingsflate mini-calculator ---
const OmhyllingsflateCalculator = ({ onAdd }: { onAdd: (calc: AttachedCalculation) => void }) => {
  const [lengde, setLengde] = useState("");
  const [bredde, setBredde] = useState("");
  const [hoyde, setHoyde] = useState("");
  const [kommentar, setKommentar] = useState("");
  const [result, setResult] = useState<{ gulvareal: number; takareal: number; veggflate: number; totalOmhylling: number } | null>(null);

  const calculate = () => {
    const L = parseFloat(lengde), B = parseFloat(bredde), H = parseFloat(hoyde);
    if ([L, B, H].some(v => isNaN(v) || v <= 0)) return;
    const gulvareal = Math.round(L * B * 100) / 100;
    const takareal = Math.round(L * B * 100) / 100;
    const veggflate = Math.round((2 * (L * H) + 2 * (B * H)) * 100) / 100;
    const totalOmhylling = Math.round((gulvareal + takareal + veggflate) * 100) / 100;
    setResult({ gulvareal, takareal, veggflate, totalOmhylling });
  };

  const handleAdd = () => {
    if (!result) return;
    onAdd({
      id: crypto.randomUUID(),
      type: "omhyllingsflate",
      label: `Omhyllingsflate: ${result.totalOmhylling} m²`,
      inputs: { lengde_m: parseFloat(lengde), bredde_m: parseFloat(bredde), hoyde_m: parseFloat(hoyde) },
      results: { gulvareal_m2: result.gulvareal, takareal_m2: result.takareal, veggflate_m2: result.veggflate, total_omhylling_m2: result.totalOmhylling },
      kommentar,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Lengde [m]</Label>
          <Input type="number" step="0.1" placeholder="f.eks. 10" value={lengde} onChange={e => setLengde(e.target.value)} className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Bredde [m]</Label>
          <Input type="number" step="0.1" placeholder="f.eks. 8" value={bredde} onChange={e => setBredde(e.target.value)} className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Høyde [m]</Label>
          <Input type="number" step="0.1" placeholder="f.eks. 3" value={hoyde} onChange={e => setHoyde(e.target.value)} className="h-8 text-xs" />
        </div>
      </div>
      <Button size="sm" onClick={calculate} className="w-full">Beregn omhyllingsflate</Button>
      {result && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-md bg-muted border text-center">
              <p className="text-xs text-muted-foreground">Gulvareal</p>
              <p className="font-bold text-sm">{result.gulvareal} m²</p>
            </div>
            <div className="p-2 rounded-md bg-muted border text-center">
              <p className="text-xs text-muted-foreground">Veggflate</p>
              <p className="font-bold text-sm">{result.veggflate} m²</p>
            </div>
          </div>
          <div className="p-2 rounded-md bg-primary/5 border border-primary/20 text-center">
            <p className="text-xs text-muted-foreground">Total omhylling</p>
            <p className="font-bold text-sm">{result.totalOmhylling} m²</p>
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeCalc, setActiveCalc] = useState<"straling" | "flammehoyde" | "brannenergi" | "persontall" | "omhyllingsflate" | null>(null);

  const addCalc = (calc: AttachedCalculation) => {
    onChange([...beregninger, calc]);
    setActiveCalc(null);
    setDialogOpen(false);
  };

  const removeCalc = (id: string) => {
    onChange(beregninger.filter(b => b.id !== id));
  };

  return (
    <div className="space-y-2">
      {/* Attached calculations list */}
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

      {/* Add calculation button */}
      <Button variant="outline" size="sm" onClick={() => { setDialogOpen(true); setActiveCalc(null); }} className="text-xs">
        <Calculator className="h-3.5 w-3.5 mr-1.5" />
        Legg til beregning
      </Button>

      {/* Calculator dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Legg til beregning</DialogTitle>
          </DialogHeader>

          {!activeCalc ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Velg beregningsverktøy:</p>
              <div className="space-y-2">
                {calculatorTypes.map(ct => (
                  <button key={ct.type} onClick={() => setActiveCalc(ct.type)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 hover:bg-accent transition-colors text-left">
                    <ct.icon className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{ct.label}</p>
                      <p className="text-xs text-muted-foreground">{ct.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <Button variant="ghost" size="sm" onClick={() => setActiveCalc(null)} className="text-xs mb-3">
                ← Tilbake
              </Button>
              {activeCalc === "straling" && <StralingCalculator onAdd={addCalc} />}
              {activeCalc === "flammehoyde" && <FlammehoydeCalculator onAdd={addCalc} />}
              {activeCalc === "brannenergi" && <BrannengiCalculator onAdd={addCalc} />}
              {activeCalc === "persontall" && <PersontallCalculator onAdd={addCalc} />}
              {activeCalc === "omhyllingsflate" && <OmhyllingsflateCalculator onAdd={addCalc} />}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BeregningSection;
