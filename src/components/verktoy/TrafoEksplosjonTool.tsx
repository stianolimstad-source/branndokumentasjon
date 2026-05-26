import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { beregn, type TrafoInput, type Status, type Resultat } from "@/lib/trafo-eksplosjon";
import { TRAFO_CASES } from "@/lib/trafo-cases";

const SCENARIOER = [
  { navn: "Lavt", verdi: 1.5, beskrivelse: "Primærvern OK, kort bue" },
  { navn: "Sannsynlig", verdi: 4.0, beskrivelse: "Primærvern OK, middels bue" },
  { navn: "Høyt", verdi: 8.0, beskrivelse: "Primærvern feiler, reservevern utløser" },
  { navn: "Worst case", verdi: 15.0, beskrivelse: "Lang bue og tregt reservevern" },
];

const REFERANSE_TESTER = [
  { mj: 0.65, forklaring: "Lav testenergi, kort bue" },
  { mj: 1.28, forklaring: "Lav-middels test" },
  { mj: 2.64, forklaring: "Referansetest brukt for skalering av trykkbølge" },
  { mj: 5, forklaring: "Elastisk tankkapasitet (benchmark)" },
  { mj: 6.3, forklaring: "Middels-høy test" },
  { mj: 17.3, forklaring: "Høyeste testenergi, lang bue" },
];


const defaultInput: TrafoInput = {
  oljevolum_L: 25000,
  tanktype: "conservator",
  spenning_kV: 132,
  effekt_MVA: 100,
  buenergi_MJ: 4,
  tankkapasitet_MJ: 5,
  plassering: "innendørs",
  avstand_personell_m: 15,
  avstand_maskinhall_m: 25,
  basseng_areal_m2: 40,
  barrierer: {
    bucholtz: true,
    differensialvern: true,
    dga: false,
    temperaturovervaking: true,
    bristeskive: true,
    aktiv_trykkavlastning: false,
    brannmur_EI: 120,
    deluge_vannspray: false,
    oljegruve: true,
    avstand_standard: false,
  },
};

const StatusIcon = ({ s }: { s: Status }) => {
  if (s === "ok") return <CheckCircle2 className="h-5 w-5 text-green-600" />;
  if (s === "warning") return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
  return <XCircle className="h-5 w-5 text-red-600" />;
};

const statusKlasse = (s: Status) =>
  s === "ok"
    ? "border-green-500 bg-green-50 dark:bg-green-950"
    : s === "warning"
    ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950"
    : "border-red-500 bg-red-50 dark:bg-red-950";

const beregnTankkapasitet = (oljevolum_L: number, tanktype: TrafoInput["tanktype"], spenning_kV: number): number => {
  const grunn = (oljevolum_L / 1000) * 0.2;
  const tankF = tanktype === "conservator" ? 1.0 : tanktype === "corrugated" ? 0.85 : 0.7;
  const spF = spenning_kV > 220 ? 1.3 : spenning_kV >= 132 ? 1.0 : 0.8;
  return Math.max(1.0, grunn * tankF * spF);
};

const TrafoEksplosjonTool = () => {
  const [input, setInput] = useState<TrafoInput>(defaultInput);
  const [tankkapManuellOverstyrt, setTankkapManuellOverstyrt] = useState(false);
  const [buMetode, setBuMetode] = useState<"scenario" | "kortslutning" | "manuell">("scenario");
  const [ik_kA, setIk] = useState(30);
  const [uBue_V, setUBue] = useState(1000);
  const [tKlar_ms, setT] = useState(100);
  const res: Resultat = useMemo(() => beregn(input), [input]);

  const upd = <K extends keyof TrafoInput>(k: K, v: TrafoInput[K]) => setInput((p) => ({ ...p, [k]: v }));
  const updB = <K extends keyof TrafoInput["barrierer"]>(k: K, v: TrafoInput["barrierer"][K]) =>
    setInput((p) => ({ ...p, barrierer: { ...p.barrierer, [k]: v } }));

  const autoTankkap = useMemo(
    () => beregnTankkapasitet(input.oljevolum_L, input.tanktype, input.spenning_kV),
    [input.oljevolum_L, input.tanktype, input.spenning_kV]
  );

  useEffect(() => {
    if (!tankkapManuellOverstyrt) {
      setInput((p) => ({ ...p, tankkapasitet_MJ: +autoTankkap.toFixed(2) }));
    }
  }, [autoTankkap, tankkapManuellOverstyrt]);

  const E_kortslutning = (uBue_V * ik_kA * tKlar_ms) / 1e6; // MJ
  useEffect(() => {
    if (buMetode === "kortslutning") {
      setInput((p) => ({ ...p, buenergi_MJ: +E_kortslutning.toFixed(2) }));
    }
  }, [buMetode, E_kortslutning]);

  return (
    <div className="space-y-6">
      {/* INPUT */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Trafo og olje</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Oljevolum (L)</Label>
              <Input type="number" value={input.oljevolum_L} onChange={(e) => upd("oljevolum_L", +e.target.value)} />
            </div>
            <div>
              <Label>Tanktype</Label>
              <Select value={input.tanktype} onValueChange={(v) => upd("tanktype", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="corrugated">Corrugated (riflet)</SelectItem>
                  <SelectItem value="conservator">Conservator</SelectItem>
                  <SelectItem value="hermetic">Hermetisk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Spenning (kV)</Label>
                <Input type="number" value={input.spenning_kV} onChange={(e) => upd("spenning_kV", +e.target.value)} />
              </div>
              <div>
                <Label>Effekt (MVA)</Label>
                <Input type="number" value={input.effekt_MVA} onChange={(e) => upd("effekt_MVA", +e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Buenergi</Label>
                <span className="text-sm text-muted-foreground">
                  Brukes: <strong className="text-foreground">{input.buenergi_MJ.toFixed(2)} MJ</strong>
                </span>
              </div>
              <Tabs value={buMetode} onValueChange={(v) => setBuMetode(v as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="scenario">Scenario</TabsTrigger>
                  <TabsTrigger value="kortslutning">Kortslutning</TabsTrigger>
                  <TabsTrigger value="manuell">Manuell</TabsTrigger>
                </TabsList>

                <TabsContent value="scenario" className="pt-3">
                  <TooltipProvider delayDuration={200}>
                    <div className="grid grid-cols-2 gap-2">
                      {SCENARIOER.map((s) => {
                        const aktiv = Math.abs(input.buenergi_MJ - s.verdi) < 0.01;
                        return (
                          <Tooltip key={s.navn}>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                size="sm"
                                variant={aktiv ? "default" : "outline"}
                                onClick={() => upd("buenergi_MJ", s.verdi)}
                                className="flex flex-col h-auto py-2"
                              >
                                <span className="font-semibold">{s.navn}</span>
                                <span className="text-xs opacity-80">{s.verdi.toFixed(1)} MJ</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{s.beskrivelse}</TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </TooltipProvider>
                </TabsContent>

                <TabsContent value="kortslutning" className="pt-3 space-y-3">
                  <div>
                    <Label className="text-xs">Kortslutningsstrøm I_k (kA)</Label>
                    <Input type="number" value={ik_kA} onChange={(e) => setIk(+e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Buespenning U_bue</Label>
                    <Select value={String(uBue_V)} onValueChange={(v) => setUBue(+v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="500">Kort bue — 500 V</SelectItem>
                        <SelectItem value="1000">Middels bue — 1000 V</SelectItem>
                        <SelectItem value="2000">Lang bue — 2000 V</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Klareringstid t_klar</Label>
                    <Select value={String(tKlar_ms)} onValueChange={(v) => setT(+v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60">Primærvern hurtig — 60 ms</SelectItem>
                        <SelectItem value="100">Primærvern normalt — 100 ms</SelectItem>
                        <SelectItem value="300">Reservevern — 300 ms</SelectItem>
                        <SelectItem value="500">Reservevern langsomt — 500 ms</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="rounded-md border bg-muted/50 p-3 text-center">
                    <div className="text-xs text-muted-foreground">E = U · I · t</div>
                    <div className="text-2xl font-bold mt-1">{E_kortslutning.toFixed(2)} MJ</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {uBue_V} V × {ik_kA} kA × {tKlar_ms} ms
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="manuell" className="pt-3 space-y-3">
                  <Input
                    type="number"
                    step="0.01"
                    value={input.buenergi_MJ}
                    onChange={(e) => upd("buenergi_MJ", +e.target.value)}
                  />
                  <div className="rounded-md border p-2">
                    <div className="text-xs font-semibold mb-1.5">Referansetester (PLOS One 2015)</div>
                    <TooltipProvider delayDuration={200}>
                      <div className="flex flex-wrap gap-1">
                        {REFERANSE_TESTER.map((r) => (
                          <Tooltip key={r.mj}>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="outline"
                                className="cursor-pointer"
                                onClick={() => upd("buenergi_MJ", r.mj)}
                              >
                                {r.mj} MJ
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>{r.forklaring}</TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </TooltipProvider>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <div>
              <Label>Tankkapasitet elastisk (MJ)</Label>
              <Input type="number" step="0.1" value={input.tankkapasitet_MJ} onChange={(e) => upd("tankkapasitet_MJ", +e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Plassering</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Plassering</Label>
              <Select value={input.plassering} onValueChange={(v) => upd("plassering", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="innendørs">Innendørs</SelectItem>
                  <SelectItem value="utendørs">Utendørs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Avstand til personell/utstyr (m)</Label>
              <Input type="number" value={input.avstand_personell_m} onChange={(e) => upd("avstand_personell_m", +e.target.value)} />
            </div>
            <div>
              <Label>Avstand til maskinhall/kontrollbygg (m)</Label>
              <Input type="number" value={input.avstand_maskinhall_m} onChange={(e) => upd("avstand_maskinhall_m", +e.target.value)} />
            </div>
            <div>
              <Label>Oljegruve / bassengareal (m²)</Label>
              <Input type="number" value={input.basseng_areal_m2} onChange={(e) => upd("basseng_areal_m2", +e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Eksisterende barrierer</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {([
              ["bucholtz", "Bucholtz-vern"],
              ["differensialvern", "Differensialvern (87T)"],
              ["dga", "DGA gass-i-olje-analyse"],
              ["temperaturovervaking", "Temperaturovervåking"],
              ["bristeskive", "Bristeskive (PRV)"],
              ["aktiv_trykkavlastning", "Aktivt trykkavlastningssystem"],
              ["deluge_vannspray", "Deluge / vannspray"],
              ["oljegruve", "Oljegruve m/avskiller"],
              ["avstand_standard", "Avstand iht. IEEE 979 / NEK 440"],
            ] as const).map(([k, lbl]) => (
              <label key={k} className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={input.barrierer[k] as boolean} onCheckedChange={(v) => updB(k as any, !!v)} />
                {lbl}
              </label>
            ))}
            <div className="pt-2">
              <Label>Brannmur</Label>
              <Select value={String(input.barrierer.brannmur_EI)} onValueChange={(v) => updB("brannmur_EI", +v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Ingen</SelectItem>
                  <SelectItem value="60">EI 60</SelectItem>
                  <SelectItem value="120">EI 120</SelectItem>
                  <SelectItem value="240">EI 240</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RESULTAT */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className={statusKlasse(res.tank.status)}>
          <CardHeader className="flex flex-row items-center gap-2"><StatusIcon s={res.tank.status} /><CardTitle className="text-base">Tank / eksplosjonsrisiko</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>{res.tank.tekst}</p>
            <p className="text-muted-foreground">Estimert gassvolum: <strong>{res.gass_L.toFixed(0)} L</strong> (80 cm³/kJ).</p>
          </CardContent>
        </Card>

        <Card className={statusKlasse(res.trykkbolge.status)}>
          <CardHeader className="flex flex-row items-center gap-2"><StatusIcon s={res.trykkbolge.status} /><CardTitle className="text-base">Trykkbølge</CardTitle></CardHeader>
          <CardContent className="text-sm">
            <p>{res.trykkbolge.tekst}</p>
          </CardContent>
        </Card>

        <Card className={statusKlasse(res.fragmenter.status)}>
          <CardHeader className="flex flex-row items-center gap-2"><StatusIcon s={res.fragmenter.status} /><CardTitle className="text-base">Fragmenter / projektiler</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>{res.fragmenter.tekst}</p>
            <p className="text-muted-foreground">
              Soner: 80–90 % ≤ {res.fragmenter.soner.p80_m.toFixed(0)} m · ytterspekter ≤ {res.fragmenter.soner.ytter_m.toFixed(0)} m · ekstrem ≤ {res.fragmenter.soner.ekstrem_m.toFixed(0)} m.
            </p>
          </CardContent>
        </Card>

        <Card className={statusKlasse(res.oljebrann.status)}>
          <CardHeader className="flex flex-row items-center gap-2"><StatusIcon s={res.oljebrann.status} /><CardTitle className="text-base">Oljebrann / stråling</CardTitle></CardHeader>
          <CardContent className="text-sm">
            <p>{res.oljebrann.tekst}</p>
          </CardContent>
        </Card>

        <Card className={statusKlasse(res.bleve.innenfor_personell || res.bleve.innenfor_maskinhall ? "error" : "ok")}>
          <CardHeader className="flex flex-row items-center gap-2">
            <StatusIcon s={res.bleve.innenfor_personell || res.bleve.innenfor_maskinhall ? "error" : "ok"} />
            <CardTitle className="text-base">BLEVE worst case</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>Fatal stråling antas innenfor <strong>{res.bleve.fatal_radius_m.toFixed(0)} m</strong> ved fyrball med hele oljemengden.</p>
            {(res.bleve.innenfor_personell || res.bleve.innenfor_maskinhall) && (
              <p className="text-red-700 dark:text-red-300 mt-1">Personell og/eller maskinhall ligger innenfor sonen.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Sannsynlighet (CIGRE TB 537)</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>Trafobrann: ~<strong>{res.sannsynlighet.aarlig_pct} %/år</strong>.</p>
            <p>Kumulert over 40 års levetid: ~<strong>{res.sannsynlighet.levetid40_pct} %</strong>.</p>
          </CardContent>
        </Card>
      </div>

      {/* SONEKART */}
      <Card>
        <CardHeader><CardTitle className="text-base">Soneoversikt (skjematisk)</CardTitle></CardHeader>
        <CardContent>
          <Soneskisse res={res} input={input} />
        </CardContent>
      </Card>

      {/* ANBEFALINGER */}
      <Card>
        <CardHeader><CardTitle className="text-base">Barriereanbefalinger</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {res.anbefalinger.map((a, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-md border ${a.oppfylt ? "bg-green-50 dark:bg-green-950 border-green-300" : a.prioritet === "kritisk" ? "bg-red-50 dark:bg-red-950 border-red-300" : "bg-yellow-50 dark:bg-yellow-950 border-yellow-300"}`}>
                {a.oppfylt ? <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" /> : <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />}
                <div className="flex-1 text-sm">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant="outline" className="text-xs">{a.kategori}</Badge>
                    <Badge variant={a.prioritet === "kritisk" ? "destructive" : "secondary"} className="text-xs">{a.prioritet}</Badge>
                  </div>
                  <p>{a.tekst}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* HENDELSESSTIGE */}
      <Card>
        <CardHeader><CardTitle className="text-base">Hendelsesstige</CardTitle></CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm list-decimal pl-5">
            <li><strong>Indre feil</strong> → Bucholtz / differensialvern utløses.</li>
            <li><strong>Hurtig trykkstigning</strong> → bristeskive / aktiv trykkavlastning åpner.</li>
            <li><strong>Tankbrudd</strong> → oljelekkasje fanges i oljegruve, antenning gir pølbrann.</li>
            <li><strong>Brann</strong> → deluge/vannspray + passiv brannmur begrenser spredning.</li>
            <li><strong>Eskalering</strong> → fragmenter og varmestråling truer maskinhall/kontrollrom.</li>
          </ol>
        </CardContent>
      </Card>

      {/* CASES + KILDER */}
      <Accordion type="single" collapsible>
        <AccordionItem value="cases">
          <AccordionTrigger>Referansecases ({TRAFO_CASES.length})</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              {TRAFO_CASES.map((c) => (
                <div key={c.sted} className="border rounded p-3 text-sm">
                  <div className="font-semibold">{c.sted} ({c.aar})</div>
                  <div className="text-muted-foreground text-xs mb-1">{c.anlegg}</div>
                  <p><strong>Hendelse:</strong> {c.hva}</p>
                  <p><strong>Konsekvens:</strong> {c.konsekvens}</p>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="kilder">
          <AccordionTrigger>Kilder og standarder</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>CIGRE TB 537 (2013) — Guide for Transformer Fire Safety Practices</li>
              <li>NFPA 850 — Recommended Practice for Fire Protection for Electric Generating Plants</li>
              <li>IEEE 979 (2012) — Guide for Substation Fire Protection</li>
              <li>EN 61936-1 / NEK 440 — Power installations exceeding 1 kV AC</li>
              <li>PLOS One (2015) — Eksperimentelle data buenergi/gassproduksjon</li>
              <li>ASME (2022) — Trykkbølge- og BLEVE-case for innendørs trafo</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-3">
              Verdiene er forenklede ingeniøranslag basert på skalering av referansetester. Skal verifiseres mot primærkilder og prosjektspesifikke forutsetninger før bruk i prosjektering.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

const Soneskisse = ({ res, input }: { res: Resultat; input: TrafoInput }) => {
  const maxR = Math.max(
    res.fragmenter.soner.ekstrem_m,
    res.bleve.fatal_radius_m,
    input.avstand_maskinhall_m,
    input.avstand_personell_m,
  ) * 1.1;
  const W = 700, H = 220, cx = 30, cy = H / 2;
  const sc = (m: number) => cx + (m / maxR) * (W - cx - 20);
  const linje = (x: number, color: string, label: string, y = cy) => (
    <g key={label}>
      <line x1={x} x2={x} y1={20} y2={H - 20} stroke={color} strokeDasharray="4 3" />
      <text x={x + 3} y={y - 6} fontSize="10" fill={color}>{label}</text>
    </g>
  );
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <line x1={cx} x2={W - 10} y1={cy} y2={cy} stroke="hsl(var(--border))" />
      <circle cx={cx} cy={cy} r={6} fill="hsl(var(--destructive))" />
      <text x={cx - 4} y={cy + 22} fontSize="10" fill="hsl(var(--foreground))">Trafo</text>
      {linje(sc(20), "#dc2626", "20 m (100 % trykk)", cy - 8)}
      {linje(sc(78), "#f59e0b", "78 m (50 % trykk)", cy + 28)}
      {linje(sc(res.fragmenter.soner.p80_m), "#a855f7", `${res.fragmenter.soner.p80_m.toFixed(0)} m frag 80 %`, cy - 24)}
      {linje(sc(res.bleve.fatal_radius_m), "#b91c1c", `${res.bleve.fatal_radius_m.toFixed(0)} m BLEVE`, cy + 44)}
      {linje(sc(input.avstand_personell_m), "#16a34a", `${input.avstand_personell_m} m personell`, cy - 40)}
      {linje(sc(input.avstand_maskinhall_m), "#2563eb", `${input.avstand_maskinhall_m} m maskinhall`, cy + 60)}
    </svg>
  );
};

export default TrafoEksplosjonTool;
