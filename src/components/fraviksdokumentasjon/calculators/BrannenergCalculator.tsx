import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AttachedCalculation } from "../BeregningSection";
import OmhyllingsflateCalculator from "./OmhyllingsflateCalculator";

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

// Tabell 43: Statistiske verdier for variabel karakteristisk spesifikk
// brannenergi per m² golvflate (MJ/m²). Verdier i parentes gjelder lager.
const virksomhetsTabell: { name: string; mjPerM2: number; lagerMjPerM2?: number }[] = [
  { name: "Aluminiumsforedling", mjPerM2: 200 },
  { name: "Antikvitetsbutikk", mjPerM2: 700 },
  { name: "Apotek inkl. lager", mjPerM2: 800 },
  { name: "Bakeri", mjPerM2: 200 },
  { name: "Bibliotek", mjPerM2: 2000 },
  { name: "Bilforretning", mjPerM2: 200 },
  { name: "Elektroindustri", mjPerM2: 600 },
  { name: "Flyhangar", mjPerM2: 200 },
  { name: "Fotobutikk", mjPerM2: 300 },
  { name: "Frisør", mjPerM2: 300 },
  { name: "Glassproduksjon", mjPerM2: 100 },
  { name: "Jernbanestasjon", mjPerM2: 800 },
  { name: "Kafé", mjPerM2: 400 },
  { name: "Kantine", mjPerM2: 300 },
  { name: "Kino", mjPerM2: 300 },
  { name: "Klesbutikk", mjPerM2: 600 },
  { name: "Klesproduksjon", mjPerM2: 500 },
  { name: "Kraftstasjon", mjPerM2: 600 },
  { name: "Laboratorier, elektronikk", mjPerM2: 200 },
  { name: "Laboratorier, kjemisk", mjPerM2: 500 },
  { name: "Laboratorier, metallurgi", mjPerM2: 200 },
  { name: "Madrassproduksjon", mjPerM2: 500 },
  { name: "Malingbutikk", mjPerM2: 1000 },
  { name: "Malingproduksjon", mjPerM2: 4200 },
  { name: "Maskinfabrikk", mjPerM2: 200 },
  { name: "Museum", mjPerM2: 300 },
  { name: "Møbelforretning", mjPerM2: 400 },
  { name: "Papirproduksjon", mjPerM2: 800, lagerMjPerM2: 1100 },
  { name: "Plastproduksjon", mjPerM2: 2000 },
  { name: "Postkontor", mjPerM2: 400 },
  { name: "Produksjon av elektrisk utstyr", mjPerM2: 400 },
  { name: "Restaurant", mjPerM2: 300 },
  { name: "Sjokoladeproduksjon", mjPerM2: 1000, lagerMjPerM2: 6000 },
  { name: "Skoproduksjon", mjPerM2: 500 },
  { name: "Teater", mjPerM2: 300 },
  { name: "Teppebutikk", mjPerM2: 800 },
  { name: "Teppeprodusent", mjPerM2: 600, lagerMjPerM2: 1700 },
  { name: "Trykkeri", mjPerM2: 1000 },
  { name: "Vaskeri", mjPerM2: 200 },
  { name: "Våpenproduksjon", mjPerM2: 300 },
];

interface Props {
  onResult?: (calc: AttachedCalculation) => void;
}

const BrannenergCalculator = ({ onResult }: Props) => {
  const [mode, setMode] = useState<"materiale" | "omhylling">("materiale");

  // Materialbasert
  const [entries, setEntries] = useState<MaterialEntry[]>([]);
  const [romareal, setRomareal] = useState("");

  // Per omhyllingsflate
  const [virksomhetKey, setVirksomhetKey] = useState<string>("");
  const [bruksType, setBruksType] = useState<"normal" | "lager">("normal");
  const [gulvareal, setGulvareal] = useState("");
  const [omhFraVerktoy, setOmhFraVerktoy] = useState<{ value: number; modus: "noyaktig" | "forenklet" } | null>(null);

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

  // Materialbasert
  const totalBrannenergi = entries.reduce((sum, e) => sum + e.brannenergiPerKg * e.mengdeKg, 0);
  const arealNum = parseFloat(romareal);
  const spesifikkBrannenergi = !isNaN(arealNum) && arealNum > 0 ? totalBrannenergi / arealNum : null;
  const hasMaterialResult = entries.some(e => e.mengdeKg > 0);

  // Per omhyllingsflate
  const valgtVirksomhet = virksomhetsTabell.find(v => v.name === virksomhetKey);
  const qGulv = valgtVirksomhet
    ? (bruksType === "lager" && valgtVirksomhet.lagerMjPerM2 ? valgtVirksomhet.lagerMjPerM2 : valgtVirksomhet.mjPerM2)
    : null;
  const gulvarealNum = parseFloat(gulvareal);
  const hoydeNum = parseFloat(bygghoyde);
  const omhyllingManuellNum = parseFloat(omhyllingManuell);
  const beregnetOmhylling = (!isNaN(gulvarealNum) && gulvarealNum > 0 && !isNaN(hoydeNum) && hoydeNum > 0)
    ? Math.round((2 * gulvarealNum + 4 * Math.sqrt(gulvarealNum) * hoydeNum) * 100) / 100
    : null;
  const omhyllingsflate = omhyllingMode === "beregn"
    ? beregnetOmhylling
    : (!isNaN(omhyllingManuellNum) && omhyllingManuellNum > 0 ? omhyllingManuellNum : null);
  const totalMjOmh = qGulv !== null && !isNaN(gulvarealNum) && gulvarealNum > 0 ? qGulv * gulvarealNum : null;
  const spesifikkPerOmhylling = totalMjOmh !== null && omhyllingsflate ? totalMjOmh / omhyllingsflate : null;
  const hasOmhResult = qGulv !== null && totalMjOmh !== null && spesifikkPerOmhylling !== null;

  useEffect(() => {
    if (!onResult) return;
    if (mode === "materiale" && hasMaterialResult) {
      onResult({
        id: crypto.randomUUID(),
        type: "brannenergi",
        label: `Brannenergi: ${Math.round(totalBrannenergi)} MJ${spesifikkBrannenergi ? ` (${Math.round(spesifikkBrannenergi)} MJ/m²)` : ""}`,
        inputs: {
          metode: "materialbasert",
          materialer: JSON.stringify(entries.filter(e => e.mengdeKg > 0).map(e => ({ name: e.name, mjPerKg: e.brannenergiPerKg, kg: e.mengdeKg }))),
          ...(romareal ? { romareal_m2: arealNum } : {}),
        },
        results: {
          total_MJ: Math.round(totalBrannenergi),
          ...(spesifikkBrannenergi ? { spesifikk_MJ_m2_gulv: Math.round(spesifikkBrannenergi) } : {}),
        },
        kommentar: "",
      });
    } else if (mode === "omhylling" && hasOmhResult) {
      const omhEtikett = omhyllingMode === "beregn" ? "ca. " : "";
      onResult({
        id: crypto.randomUUID(),
        type: "brannenergi",
        label: `Brannenergi (omhyllingsflate): ${Math.round(spesifikkPerOmhylling!)} MJ/m² (${omhEtikett}${Math.round(omhyllingsflate!)} m² omhylling)`,
        inputs: {
          metode: "per omhyllingsflate (Tabell 43)",
          virksomhet: valgtVirksomhet!.name,
          bruks_type: bruksType,
          q_gulv_MJ_m2: qGulv!,
          gulvareal_m2: gulvarealNum,
          omhyllingsflate_modus: omhyllingMode === "beregn" ? "beregnet (ca.)" : "manuelt oppgitt",
          omhyllingsflate_m2: omhyllingsflate!,
          ...(omhyllingMode === "beregn" ? { byggehoyde_m: hoydeNum } : {}),
        },
        results: {
          total_MJ: Math.round(totalMjOmh!),
          spesifikk_MJ_m2_omhylling: Math.round(spesifikkPerOmhylling!),
        },
        kommentar: omhyllingMode === "beregn"
          ? "Omhyllingsflate beregnet forenklet (antar tilnærmet kvadratisk grunnflate)."
          : "",
      });
    }
  }, [
    mode,
    totalBrannenergi, spesifikkBrannenergi, hasMaterialResult,
    hasOmhResult, totalMjOmh, spesifikkPerOmhylling, omhyllingsflate, qGulv, gulvarealNum, hoydeNum, omhyllingMode, bruksType, virksomhetKey,
  ]);

  return (
    <div className="space-y-6">
      <Tabs value={mode} onValueChange={(v) => setMode(v as "materiale" | "omhylling")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="materiale">Materialbasert</TabsTrigger>
          <TabsTrigger value="omhylling">Per omhyllingsflate (Tabell 43)</TabsTrigger>
        </TabsList>

        <TabsContent value="materiale" className="space-y-6 pt-4">
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
        </TabsContent>

        <TabsContent value="omhylling" className="space-y-6 pt-4">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Brannenergi per omhyllingsflate</CardTitle>
              <CardDescription>
                Velg virksomhetstype fra Tabell 43 (statistiske verdier for variabel karakteristisk spesifikk brannenergi per m² golvflate).
                Brannenergi per omhyllingsflate beregnes som total brannenergi delt på total omhyllingsflate.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Virksomhet (Tabell 43)</Label>
                  <Select value={virksomhetKey} onValueChange={setVirksomhetKey}>
                    <SelectTrigger><SelectValue placeholder="Velg virksomhet..." /></SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {virksomhetsTabell.map(v => (
                        <SelectItem key={v.name} value={v.name}>
                          {v.name} — {v.mjPerM2} MJ/m²{v.lagerMjPerM2 ? ` (lager: ${v.lagerMjPerM2})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {valgtVirksomhet?.lagerMjPerM2 && (
                  <div className="space-y-2">
                    <Label>Bruk</Label>
                    <Select value={bruksType} onValueChange={(v) => setBruksType(v as "normal" | "lager")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal ({valgtVirksomhet.mjPerM2} MJ/m²)</SelectItem>
                        <SelectItem value="lager">Lager ({valgtVirksomhet.lagerMjPerM2} MJ/m²)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gulvareal-omh">Gulvareal (m²)</Label>
                <Input id="gulvareal-omh" type="number" step="1" placeholder="f.eks. 200" value={gulvareal} onChange={(e) => setGulvareal(e.target.value)} />
              </div>

              <div className="space-y-3 border-t pt-4">
                <Label>Omhyllingsflate</Label>
                <Tabs value={omhyllingMode} onValueChange={(v) => setOmhyllingMode(v as "manuell" | "beregn")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="beregn">Beregn (ca. fra høyde)</TabsTrigger>
                    <TabsTrigger value="manuell">Oppgi manuelt</TabsTrigger>
                  </TabsList>
                  <TabsContent value="beregn" className="pt-3 space-y-2">
                    <Label htmlFor="bygghoyde-omh">Byggehøyde (m)</Label>
                    <Input id="bygghoyde-omh" type="number" step="0.1" placeholder="f.eks. 3" value={bygghoyde} onChange={(e) => setBygghoyde(e.target.value)} />
                    <p className="text-xs text-muted-foreground">
                      Forenklet: A<sub>omh</sub> ≈ 2·areal + 4·√areal · høyde (antar tilnærmet kvadratisk grunnflate).
                    </p>
                    {beregnetOmhylling !== null && (
                      <p className="text-sm">Beregnet omhyllingsflate: <strong>≈ {beregnetOmhylling} m²</strong></p>
                    )}
                  </TabsContent>
                  <TabsContent value="manuell" className="pt-3 space-y-2">
                    <Label htmlFor="omh-manuell">Omhyllingsflate (m²)</Label>
                    <Input id="omh-manuell" type="number" step="1" placeholder="f.eks. 520" value={omhyllingManuell} onChange={(e) => setOmhyllingManuell(e.target.value)} />
                    <p className="text-xs text-muted-foreground">
                      Bruk Omhyllingsflate-verktøyet (Verktøy → Omhyllingsflate) for nøyaktig beregning, og lim inn verdien her.
                    </p>
                  </TabsContent>
                </Tabs>
              </div>

              {hasOmhResult && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold">Resultater:</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card className="border-primary/30 bg-primary/5">
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Total brannenergi</CardTitle></CardHeader>
                      <CardContent>
                        <p className="text-xl font-bold">{Math.round(totalMjOmh!)} MJ</p>
                        <p className="text-xs text-muted-foreground mt-1">{qGulv} MJ/m² · {gulvarealNum} m²</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Omhyllingsflate</CardTitle></CardHeader>
                      <CardContent>
                        <p className="text-xl font-bold">{omhyllingMode === "beregn" ? "≈ " : ""}{Math.round(omhyllingsflate!)} m²</p>
                        <p className="text-xs text-muted-foreground mt-1">{omhyllingMode === "beregn" ? "Beregnet (ca.)" : "Oppgitt"}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-primary/30 bg-primary/5">
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Spesifikk per omhylling</CardTitle></CardHeader>
                      <CardContent>
                        <p className="text-xl font-bold">{Math.round(spesifikkPerOmhylling!)} MJ/m²</p>
                        <p className="text-xs text-muted-foreground mt-1">Total / omhyllingsflate</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                    <p className="font-semibold">Grunnlag:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Spesifikk brannenergi per golvflate (q<sub>gulv</sub>) hentet fra Tabell 43 — statistiske gjennomsnittsverdier per virksomhetstype</li>
                      <li>Total brannenergi: Q = q<sub>gulv</sub> · A<sub>gulv</sub></li>
                      <li>Spesifikk brannenergi per omhyllingsflate: q<sub>omh</sub> = Q / A<sub>omhylling</sub></li>
                      <li>Ved branntekniske beregninger må karakteristisk verdi etableres iht. NS-EN 1991-1-2</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BrannenergCalculator;
