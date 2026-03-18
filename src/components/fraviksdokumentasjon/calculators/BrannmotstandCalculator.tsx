import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2, ArrowUp, ArrowDown, Shield, Info } from "lucide-react";
import { AttachedCalculation } from "../BeregningSection";
import {
  layerMaterials,
  massiveWallTypes,
  calculateLightWallResistance,
  lookupMassiveWallResistance,
  WallLayer,
  CalculationResult,
} from "@/lib/brannmotstand-data";

interface Props {
  onResult?: (calc: AttachedCalculation) => void;
}

const BrannmotstandCalculator = ({ onResult }: Props) => {
  const [tab, setTab] = useState<"lett" | "massiv">("lett");

  // ── Lett vegg state ──
  const [layers, setLayers] = useState<(WallLayer & { id: string })[]>([
    { id: crypto.randomUUID(), materialId: "branngips", thickness: 15 },
    { id: crypto.randomUUID(), materialId: "steinull", thickness: 150 },
    { id: crypto.randomUUID(), materialId: "branngips", thickness: 15 },
  ]);

  // ── Massiv vegg state ──
  const [massiveType, setMassiveType] = useState("betong_normal");
  const [massiveThickness, setMassiveThickness] = useState(100);

  const [result, setResult] = useState<CalculationResult | null>(null);

  const calculate = useCallback(() => {
    let res: CalculationResult | null = null;
    if (tab === "lett") {
      if (layers.length === 0) return;
      res = calculateLightWallResistance(layers);
    } else {
      res = lookupMassiveWallResistance(massiveType, massiveThickness);
    }
    setResult(res);
    if (res && onResult) {
      onResult({
        id: crypto.randomUUID(),
        type: "brannmotstand" as any,
        label: `Brannmotstand: ${res.fireClass} (${res.totalMinutes} min) – ${res.method}`,
        inputs: tab === "lett"
          ? { antall_lag: layers.length, metode: "Komponentadditivmetoden" }
          : { type: massiveType, tykkelse_mm: massiveThickness },
        results: {
          brannklasse: res.fireClass,
          minutter: res.totalMinutes,
        },
        kommentar: "",
      });
    }
  }, [tab, layers, massiveType, massiveThickness, onResult]);

  const addLayer = () => {
    setLayers([...layers, { id: crypto.randomUUID(), materialId: "gips_a", thickness: 12.5 }]);
  };

  const removeLayer = (id: string) => {
    setLayers(layers.filter((l) => l.id !== id));
  };

  const updateLayer = (id: string, field: "materialId" | "thickness", value: string | number) => {
    setLayers(layers.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const moveLayer = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= layers.length) return;
    const newLayers = [...layers];
    [newLayers[index], newLayers[newIndex]] = [newLayers[newIndex], newLayers[index]];
    setLayers(newLayers);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            Brannmotstand i konstruksjoner
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Beregn estimert brannmotstandstid (EI) for vegger og skillevegger.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => { setTab(v as "lett" | "massiv"); setResult(null); }}>
            <TabsList className="w-full">
              <TabsTrigger value="lett" className="flex-1">Lett konstruksjon</TabsTrigger>
              <TabsTrigger value="massiv" className="flex-1">Massiv konstruksjon</TabsTrigger>
            </TabsList>

            {/* ── Lett konstruksjon ── */}
            <TabsContent value="lett" className="space-y-4 mt-4">
              <div className="bg-muted/50 p-3 rounded-lg flex items-start gap-2">
                <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Bygg opp veggen lag for lag fra brannsiden (øverst) til usiden (nederst).
                  Beregningen baseres på komponentadditivmetoden iht. EN 1995-1-2 Annex E.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Veggoppbygning (fra brannside →)</Label>
                  <Button variant="outline" size="sm" onClick={addLayer}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Legg til lag
                  </Button>
                </div>

                {layers.map((layer, idx) => {
                  const mat = layerMaterials.find((m) => m.id === layer.materialId);
                  return (
                    <div key={layer.id} className="flex items-center gap-2 p-2 border rounded-lg bg-background">
                      <div className="flex flex-col gap-0.5">
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveLayer(idx, -1)} disabled={idx === 0}>
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveLayer(idx, 1)} disabled={idx === layers.length - 1}>
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="text-xs text-muted-foreground w-5 text-center shrink-0">{idx + 1}</span>
                      <Select value={layer.materialId} onValueChange={(v) => updateLayer(layer.id, "materialId", v)}>
                        <SelectTrigger className="flex-1 min-w-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem disabled value="__header_plate">── Plater ──</SelectItem>
                          {layerMaterials.filter((m) => m.category === "plate").map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                          ))}
                          <SelectItem disabled value="__header_iso">── Isolasjon ──</SelectItem>
                          {layerMaterials.filter((m) => m.category === "isolasjon").map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                          ))}
                          <SelectItem disabled value="__header_luft">── Annet ──</SelectItem>
                          {layerMaterials.filter((m) => m.category === "luft").map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-1 shrink-0">
                        {mat?.category !== "luft" ? (
                          <>
                            <Input
                              type="number"
                              value={layer.thickness}
                              onChange={(e) => updateLayer(layer.id, "thickness", parseFloat(e.target.value) || 0)}
                              className="w-20 text-right"
                              min={0}
                              step={0.5}
                            />
                            <span className="text-xs text-muted-foreground">mm</span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground w-24 text-center">fast bidrag</span>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeLayer(layer.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  );
                })}

                {layers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {layerMaterials
                      .filter((m) => m.category === "plate")
                      .slice(0, 3)
                      .map((m) => (
                        <Button
                          key={m.id}
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() =>
                            setLayers([
                              ...layers,
                              { id: crypto.randomUUID(), materialId: m.id, thickness: m.standardThicknesses[1] || m.standardThicknesses[0] },
                            ])
                          }
                        >
                          + {m.name.split(" ")[0]} {m.name.split(" ").pop()}
                        </Button>
                      ))}
                  </div>
                )}
              </div>

              <Button className="w-full" onClick={calculate} disabled={layers.length === 0}>
                Beregn brannmotstand
              </Button>
            </TabsContent>

            {/* ── Massiv konstruksjon ── */}
            <TabsContent value="massiv" className="space-y-4 mt-4">
              <div className="bg-muted/50 p-3 rounded-lg flex items-start gap-2">
                <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Tabellverdier for massive konstruksjoner basert på EN 1992-1-2, EN 1996-1-2 og SINTEF Byggforsk.
                  Viser krav for både ikke-bærende (EI) og bærende (REI) vegger.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Konstruksjonstype</Label>
                <Select value={massiveType} onValueChange={setMassiveType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {massiveWallTypes.map((w) => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Referansetabell */}
              {(() => {
                const wt = massiveWallTypes.find((w) => w.id === massiveType);
                if (!wt) return null;
                return (
                  <div className="space-y-3">
                    {/* EI-tabell (ikke-bærende) */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-muted/50 px-3 py-2">
                        <p className="text-sm font-semibold">EI – Ikke-bærende vegger</p>
                      </div>
                      <table className="w-full text-sm">
                        <thead className="bg-muted/30">
                          <tr>
                            <th className="text-left px-3 py-1.5 font-medium">Tykkelse (mm)</th>
                            <th className="text-left px-3 py-1.5 font-medium">Brannmotstand</th>
                          </tr>
                        </thead>
                        <tbody>
                          {wt.thicknessTable.map((row) => (
                            <tr key={row.thickness} className="border-t">
                              <td className="px-3 py-1.5">{row.thickness} mm</td>
                              <td className="px-3 py-1.5 font-medium">EI {row.minutes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* REI-tabell (bærende) */}
                    {wt.thicknessTableREI && (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-muted/50 px-3 py-2">
                          <p className="text-sm font-semibold">REI – Bærende vegger</p>
                        </div>
                        <table className="w-full text-sm">
                          <thead className="bg-muted/30">
                            <tr>
                              <th className="text-left px-3 py-1.5 font-medium">Tykkelse (mm)</th>
                              <th className="text-left px-3 py-1.5 font-medium">Brannmotstand</th>
                            </tr>
                          </thead>
                          <tbody>
                            {wt.thicknessTableREI.map((row) => (
                              <tr key={row.thickness} className="border-t">
                                <td className="px-3 py-1.5">{row.thickness} mm</td>
                                <td className="px-3 py-1.5 font-medium">REI {row.minutes}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {wt.notes && (
                      <p className="text-xs text-muted-foreground px-3 py-1 italic">{wt.notes}</p>
                    )}
                  </div>
                );
              })()}

              <div className="bg-muted p-3 rounded-lg text-xs space-y-1">
                <p className="text-muted-foreground italic">
                  Merk: Beregningen gir en estimert brannmotstandstid. Faktisk brannmotstand kan avhenge av
                  utførelse, skjøter, gjennomføringer og testdokumentasjon. For prosjektering bør
                  dokumenterte løsninger og produktsertifikater benyttes.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* ── Resultat ── */}
      {result && (
        <Card className={
          result.totalMinutes >= 60
            ? "border-green-500 bg-green-50 dark:bg-green-950"
            : result.totalMinutes >= 30
            ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950"
            : "border-red-500 bg-red-50 dark:bg-red-950"
        }>
          <CardHeader>
            <CardTitle className="text-base">Resultat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold">{result.fireClass}</span>
              <span className="text-lg text-muted-foreground">({result.totalMinutes} minutter)</span>
            </div>

            {/* Lagvis oppbygning */}
            {result.layerBreakdown.length > 1 && (
              <div className="space-y-1">
                <p className="text-sm font-semibold">Bidrag per lag:</p>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-3 py-1.5 font-medium">Lag</th>
                        <th className="text-right px-3 py-1.5 font-medium">Tykkelse</th>
                        <th className="text-right px-3 py-1.5 font-medium">k<sub>pos</sub></th>
                        <th className="text-right px-3 py-1.5 font-medium">Bidrag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.layerBreakdown.map((row, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-1.5">{row.materialName}</td>
                          <td className="px-3 py-1.5 text-right">{row.thickness} mm</td>
                          <td className="px-3 py-1.5 text-right">{row.kPos}</td>
                          <td className="px-3 py-1.5 text-right font-medium">{row.contribution} min</td>
                        </tr>
                      ))}
                      <tr className="border-t bg-muted/30 font-semibold">
                        <td className="px-3 py-1.5" colSpan={3}>Sum</td>
                        <td className="px-3 py-1.5 text-right">{result.totalMinutes} min</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="bg-muted p-3 rounded-lg text-xs space-y-1">
              <p className="font-semibold">Metode: {result.method}</p>
              <p className="font-semibold mt-1">Referanser:</p>
              <ul className="list-disc ml-4">
                {result.references.map((ref, i) => (
                  <li key={i}>{ref}</li>
                ))}
              </ul>
              <p className="mt-2 text-muted-foreground italic">
                Merk: Beregningen gir en estimert brannmotstandstid. Faktisk brannmotstand kan avhenge av
                utførelse, skjøter, gjennomføringer og testdokumentasjon. For prosjektering bør
                dokumenterte løsninger og produktsertifikater benyttes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Produktbeskrivelser ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            Materialguide
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Oversikt over materialer brukt i beregningen, med beskrivelse og vanlige tykkelser.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Plater */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-2">Plater og kledninger</h4>
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="gips_a">
                <AccordionTrigger className="text-sm py-2">Gipsplate Type A (standard)</AccordionTrigger>
                <AccordionContent className="text-xs space-y-1 text-muted-foreground">
                  <p>Standard gipsplate (EN 520) med gipskjerne og kartongforing. Brukes i innvendige vegger og himlinger under normale forhold. Gir moderat brannbeskyttelse.</p>
                  <p><span className="font-medium text-foreground">Standardtykkelse:</span> 12,5 mm (også tilgjengelig i 9,5 og 15 mm)</p>
                  <p><span className="font-medium text-foreground">Brannbidrag:</span> ca. 1,25 min/mm</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="branngips">
                <AccordionTrigger className="text-sm py-2">Branngips (Type F/DF)</AccordionTrigger>
                <AccordionContent className="text-xs space-y-1 text-muted-foreground">
                  <p>Brannklassifisert gipsplate (EN 520) med glassfiberarmert gipskjerne som gir forbedret brannmotstand og strukturell integritet ved høye temperaturer. Type DF har i tillegg redusert vannabsorpsjon for bruk i fuktutsatte områder. Brannegenskapene er identiske for begge typer.</p>
                  <p><span className="font-medium text-foreground">Standardtykkelse:</span> 15 mm (også tilgjengelig i 12,5 og 18 mm)</p>
                  <p><span className="font-medium text-foreground">Brannbidrag:</span> ca. 1,5 min/mm</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="kryssfiner">
                <AccordionTrigger className="text-sm py-2">Kryssfiner</AccordionTrigger>
                <AccordionContent className="text-xs space-y-1 text-muted-foreground">
                  <p>Plater bygget opp av krysslimte tresjikt. Brennbart materiale, men gir et visst brannbeskyttende bidrag gjennom forkulling. Lavere brannbidrag enn gipsplater.</p>
                  <p><span className="font-medium text-foreground">Standardtykkelse:</span> 15 mm (også tilgjengelig i 9, 12, 18 og 21 mm). Bak gips er 12 mm mest vanlig.</p>
                  <p><span className="font-medium text-foreground">Brannbidrag:</span> ca. 0,5 min/mm</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="sponplate">
                <AccordionTrigger className="text-sm py-2">Sponplate</AccordionTrigger>
                <AccordionContent className="text-xs space-y-1 text-muted-foreground">
                  <p>Plate av sammenpressede trespon og lim. Brennbart materiale med noe lavere brannbidrag enn kryssfiner. Brukes i undergolv, innredninger og ikke-bærende vegger.</p>
                  <p><span className="font-medium text-foreground">Standardtykkelse:</span> 12 mm (også tilgjengelig i 16, 19 og 22 mm)</p>
                  <p><span className="font-medium text-foreground">Brannbidrag:</span> ca. 0,45 min/mm</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="fibersement">
                <AccordionTrigger className="text-sm py-2">Fibersementplate</AccordionTrigger>
                <AccordionContent className="text-xs space-y-1 text-muted-foreground">
                  <p>Ubrennbar plate av sement og fiberarmering. God brannmotstand tilsvarende gipsplater, men også egnet for utendørs bruk og fuktige miljøer.</p>
                  <p><span className="font-medium text-foreground">Standardtykkelse:</span> 8 mm (også tilgjengelig i 6, 10 og 12 mm)</p>
                  <p><span className="font-medium text-foreground">Brannbidrag:</span> ca. 1,3 min/mm</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Isolasjon */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-2">Isolasjon</h4>
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="steinull">
                <AccordionTrigger className="text-sm py-2">Steinull (≥ 26 kg/m³)</AccordionTrigger>
                <AccordionContent className="text-xs space-y-1 text-muted-foreground">
                  <p>Ubrennbar mineralullsisolasjon laget av steinbasert råmateriale. Standard densitet for veggsisolering. Smelter ikke og bidrar til brannmotstand ved å forsinke varmetransporten gjennom konstruksjonen.</p>
                  <p><span className="font-medium text-foreground">Standardtykkelse:</span> 150 mm for yttervegger, 70 mm for innervegger (tilgjengelig fra 45 til 250 mm)</p>
                  <p><span className="font-medium text-foreground">Brannbidrag:</span> ca. 0,2 min/mm</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="steinull_hd">
                <AccordionTrigger className="text-sm py-2">Steinull høydensitet (≥ 50 kg/m³)</AccordionTrigger>
                <AccordionContent className="text-xs space-y-1 text-muted-foreground">
                  <p>Steinull med økt densitet som gir bedre brannbeskyttelse per mm. Brukes typisk i brannklassifiserte konstruksjoner der man ønsker høyere ytelse med begrenset tykkelse.</p>
                  <p><span className="font-medium text-foreground">Standardtykkelse:</span> 50 mm (også tilgjengelig fra 30 til 100 mm)</p>
                  <p><span className="font-medium text-foreground">Brannbidrag:</span> ca. 0,25 min/mm</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="glassull">
                <AccordionTrigger className="text-sm py-2">Glassull (≥ 15 kg/m³)</AccordionTrigger>
                <AccordionContent className="text-xs space-y-1 text-muted-foreground">
                  <p>Mineralullsisolasjon av glass. Ubrennbar, men smelter ved lavere temperatur enn steinull (ca. 600 °C vs. 1000 °C). Gir dermed lavere brannbidrag, men er et kostnadseffektivt alternativ for konstruksjoner med lavere brannkrav.</p>
                  <p><span className="font-medium text-foreground">Standardtykkelse:</span> 150 mm for yttervegger, 70 mm for innervegger (tilgjengelig fra 45 til 200 mm)</p>
                  <p><span className="font-medium text-foreground">Brannbidrag:</span> ca. 0,1 min/mm</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Luftspalte */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-2">Annet</h4>
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="luftspalte">
                <AccordionTrigger className="text-sm py-2">Luftspalte (tom)</AccordionTrigger>
                <AccordionContent className="text-xs space-y-1 text-muted-foreground">
                  <p>Tom luftspalte i konstruksjonen. Gir et fast bidrag på 5 minutter uavhengig av bredde, da stille luft har begrenset isolasjonseffekt. Luftspalter kan også gi uønsket brannspredning ved konveksjon dersom de ikke er brannstopp.</p>
                  <p><span className="font-medium text-foreground">Fast bidrag:</span> 5 min</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrannmotstandCalculator;
