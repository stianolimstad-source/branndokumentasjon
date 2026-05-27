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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { CheckCircle2, AlertTriangle, XCircle, ArrowDown, HelpCircle, Printer } from "lucide-react";
import { beregn, beregnDriftsfaktor, type TrafoInput, type Status, type Resultat } from "@/lib/trafo-eksplosjon";
import { TRAFO_CASES } from "@/lib/trafo-cases";

const SCENARIOER = [
  {
    navn: "Lavt",
    verdi: 1.5,
    beskrivelse: "Primærvern OK, kort bue",
    uttrykk: "Tilsvarer ca. 15 kA × 500 V × 200 ms eller 25 kA × 500 V × 120 ms. Typisk distribusjonstrafo med fungerende primærvern.",
  },
  {
    navn: "Sannsynlig",
    verdi: 4.0,
    beskrivelse: "Primærvern OK, middels bue",
    uttrykk: "Tilsvarer ca. 25 kA × 1000 V × 160 ms eller 20 kA × 1000 V × 200 ms. Typisk 132 kV regional trafo med primærvern.",
  },
  {
    navn: "Høyt",
    verdi: 8.0,
    beskrivelse: "Primærvern feiler, reservevern utløser",
    uttrykk: "Tilsvarer ca. 35 kA × 1000 V × 230 ms eller 25 kA × 1000 V × 320 ms. Typisk 132 kV-trafo der primærvern svikter og reservevern utløser.",
  },
  {
    navn: "Worst case",
    verdi: 15.0,
    beskrivelse: "Lang bue og tregt reservevern",
    uttrykk: "Tilsvarer ca. 40 kA × 2000 V × 190 ms eller 30 kA × 2000 V × 250 ms. Lang bue og tregt reservevern på stor trafo.",
  },
];

function scenarioFeedback(mj: number): string {
  if (mj < 1) return "Tilsvarer under Lavt-scenariet";
  if (mj < 3) return "Tilsvarer Lavt-scenariet";
  if (mj < 6) return "Tilsvarer Sannsynlig-scenariet";
  if (mj < 12) return "Tilsvarer Høyt-scenariet";
  if (mj <= 20) return "Tilsvarer Worst case-scenariet";
  return "Overskrider Worst case – sjekk at I_k og klareringstid er realistiske for ditt anlegg";
}

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
  oljetype: "mineralolje",
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
    rom_ventilasjon: false,
    
  },
  drift: {
    alder_aar: 20,
    maaneder_siden_dga: 12,
    overlast_historisk: false,
  },
};

const LabelWithHelp = ({ label, help, className }: { label: string; help: React.ReactNode; className?: string }) => (
  <div className={`flex items-center gap-1.5 ${className ?? ""}`}>
    <Label>{label}</Label>
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex" aria-label="Hjelp">
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs leading-relaxed">{help}</TooltipContent>
    </Tooltip>
  </div>
);

const HelpIcon = ({ help }: { help: React.ReactNode }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button type="button" className="inline-flex" aria-label="Hjelp">
        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </TooltipTrigger>
    <TooltipContent className="max-w-xs text-xs leading-relaxed">{help}</TooltipContent>
  </Tooltip>
);

const H = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-1 last:mb-0"><strong>{children}</strong></p>
);

const HELP = {
  oljevolum: (
    <div>
      <p className="mb-1"><strong>Spør kunden om:</strong> typeskilt eller produsentens datablad.</p>
      <p className="mb-1"><strong>Typiske verdier:</strong> småkraft 2 000–10 000 L, regionalt anlegg 15 000–40 000 L, store generatortrafoer 50 000–100 000 L.</p>
      <p><strong>Hvor finne det:</strong> står ofte angitt på typeskiltet som «Oil weight» (kg) – del på 0,88 for å få liter.</p>
    </div>
  ),
  tanktype: (
    <div>
      <p>Conservator har separat oljebeholder over hovedtanken og er vanlig på nye/store krafttrafoer. Hermetisk er lukket uten luftkontakt, vanligere på mellomstore. Corrugated har riflet vegg som ekspanderer med trykk – typisk på distribusjons- og mindre nettstasjonstrafoer. Sjekk visuelt eller på datablad.</p>
    </div>
  ),
  oljetype: (
    <div>
      <p className="mb-1"><strong>Typiske verdier:</strong> eldre trafoer (før ca. 2000) bruker mineralolje. Naturlig ester (FR3) og syntetisk ester (Midel 7131) er vanligere på nye eller spesielle installasjoner.</p>
      <p><strong>Hvor finne det:</strong> sjekk oljebeholder, siste DGA-rapport eller leverandørens datablad. Ved tvil: anta mineralolje (konservativt).</p>
    </div>
  ),
  spenning: (
    <div>
      <p className="mb-1"><strong>Spør kunden om:</strong> høyspentsiden (HV) av trafoen, ikke generator-/lavspentsiden.</p>
      <p><strong>Typiske verdier:</strong> 22 kV (distribusjon), 66 kV (regional), 132 kV (regional/sentralnett), 300 kV og 420 kV (transmisjon, store kraftverk).</p>
    </div>
  ),
  effekt: (
    <div>
      <p className="mb-1"><strong>Hvor finne det:</strong> typeskilt eller datablad.</p>
      <p><strong>Typiske verdier:</strong> småkraft 1–15 MVA, mellomstore vannkraftstasjoner 15–150 MVA, store generatortrafoer 150–600 MVA, de største norske (Sima, Tonstad, Aurland) opp mot 1100 MVA.</p>
    </div>
  ),
  buenergi: (
    <div>
      <p className="mb-1">Avhenger av kortslutningsstrøm, buespenning og klareringstid. For typisk norsk vannkraft ligger realistisk worst case mellom 3 og 25 MJ avhengig av trafostørrelse.</p>
      <p>Bruk «Scenario» hvis du ikke har detaljert vernedata. Bruk «Kortslutning» hvis du har I_k fra nettselskap og kjenner reléverntider fra eier.</p>
    </div>
  ),
  tankkapasitet: (
    <div>
      <p>Auto-beregnes konservativt fra oljevolum, tanktype og spenning. Overstyr bare hvis trafoleverandøren har dokumentert høyere tankkapasitet via IEC 60076-test eller fullskala-arctest. Be om dette dokumentet hvis det finnes.</p>
    </div>
  ),
  plassering: (
    <div>
      <p>Innendørs = trafocelle i fjell, bygg eller egen tilbygg. Utendørs = stativ på fundament eller transportabel oppstilling. Generatortrafoer for norske vannkraftverk er ofte innendørs på grunn av klima og snølast.</p>
    </div>
  ),
  avstand_personell: (
    <div>
      <p>Mål til nærmeste sted hvor personell ferdes regelmessig: driftsoperatør, kontrollrom-vindu, gangvei mellom utstyr, lasterampe. Bruk verste relevante avstand. Ikke regn med tilfeldig besøk.</p>
    </div>
  ),
  avstand_maskinhall: (
    <div>
      <p>Mål til nærmeste vegg på bygning med høy verdi (maskinhall, kontrollrom, hjelpetrafoer, kabelgater). Hvis trafoen står inne i maskinhallen, sett avstanden til avstanden til neste branncelle / brannmur.</p>
    </div>
  ),
  basseng: (
    <div>
      <p className="mb-1"><strong>Hvor finne det:</strong> mål eller hent fra branntegning.</p>
      <p>NFPA 850 krever minimum 110 % av oljemengden + slokkevannmengde. Verktøyet sjekker dette automatisk og varsler om underdimensjonering.</p>
    </div>
  ),
  ik: (
    <div>
      <p className="mb-1"><strong>Hvor finne det:</strong> nettselskapets kortslutningsanalyse for tilkoblingspunktet.</p>
      <p><strong>Typiske verdier:</strong> 22 kV distribusjon 5–15 kA, 132 kV regional 15–30 kA, 300/420 kV transmisjon 30–60 kA. På generatorlavsiden av en GSU-trafo: 20–40 kA ved 11–22 kV.</p>
    </div>
  ),
  ubue: (
    <div>
      <p>Velg etter feiltype: Kort bue (500 V) for turn-to-turn eller mindre indre feil, Middels (1000 V) som standard antakelse for vikling-til-jord, Lang (2000 V) for full vikling-til-tank eller bristet gjennomføring.</p>
    </div>
  ),
  tklar: (
    <div>
      <p>Spør kunden eller relévernfirma om reléinnstillinger. Primærvern hurtig (60 ms) krever moderne differensialvern + rask effektbryter. Primærvern normalt (100 ms) er typisk for norsk vannkraft. Reservevern (300–500 ms) brukes hvis primærvern svikter eller for vurdering av verste reelle utfall.</p>
    </div>
  ),
  alder: (
    <div>
      <p><strong>Hvor finne det:</strong> typeskilt eller idriftsettingsår.</p>
    </div>
  ),
  dga_maaneder: (
    <div>
      <p><strong>Hvor finne det:</strong> siste analyserapport (typisk 6–24 mnd intervall).</p>
    </div>
  ),
  overlast: (
    <div>
      <p>Spør kunden om trafoen har vært kjørt over skiltverdi i lengre perioder, f.eks. ved produksjonstopper eller utfall av annen kapasitet.</p>
    </div>
  ),
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
  const updD = <K extends keyof TrafoInput["drift"]>(k: K, v: TrafoInput["drift"][K]) =>
    setInput((p) => ({ ...p, drift: { ...p.drift, [k]: v } }));
  const driftsfaktor = useMemo(() => beregnDriftsfaktor(input.drift), [input.drift]);

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
      {/* VEILEDNING */}
      <Accordion type="single" collapsible defaultValue="veiledning">
        <AccordionItem value="veiledning">
          <AccordionTrigger>Slik bruker du verktøyet</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 text-sm leading-relaxed">
              <section>
                <h4 className="font-semibold mb-1">Hva verktøyet gjør</h4>
                <p>
                  Verktøyet gir en overordnet screening av eksplosjons- og brannrisiko ved en oljefylt
                  krafttrafo, typisk for en vannkraftstasjon. Det er ment som grunnlag for tidlig
                  risikovurdering og diskusjon med oppdragsgiver – ikke som erstatning for detaljert
                  prosjektering eller leverandørspesifikke analyser. Verdiene er forenklede
                  ingeniøranslag basert på CIGRE TB 537, NFPA 850, IEEE 979, EN 61936-1 og forsøksdata
                  fra PLOS One og ASME.
                </p>
              </section>
              <section>
                <h4 className="font-semibold mb-1">Slik fyller du ut</h4>
                <p>
                  Start til venstre med trafo og olje – oljevolum og spenning får du fra typeskilt
                  eller datablad. Tankkapasiteten beregnes automatisk, men kan overstyres hvis
                  leverandøren har dokumentert høyere kapasitet. For buenergi: bruk fanen «Scenario»
                  hvis du ikke har detaljert verninformasjon; bruk «Kortslutning» hvis du har
                  kortslutningsstrøm fra nettselskapet og kjenner reléverntidene. I midten legger du
                  inn plassering og avstander fra trafoen til personellsoner, maskinhall og
                  oljegruve. Til høyre huker du av de barrierer som faktisk finnes på anlegget –
                  disse påvirker beregningene direkte.
                </p>
              </section>
              <section>
                <h4 className="font-semibold mb-1">Slik tolker du resultatene</h4>
                <p>
                  De seks resultatboksene representerer hver sin uavhengige risiko. Grønn betyr at
                  risikoen er innenfor akseptable grenser gitt antakelsene. Gul betyr at situasjonen
                  ligger i usikkerhetssonen – tallene er innenfor spredningen i forsøksdataene, og du
                  bør vurdere tiltak eller verifisering. Rød betyr at risikoen klart overstiger
                  terskelverdiene. Det er normalt at noen bokser er grønne mens andre er røde – en
                  hendelse kan være trygg på ett område og kritisk på et annet samtidig.
                </p>
              </section>
              <section>
                <h4 className="font-semibold mb-1">Iterativ vurdering</h4>
                <p>
                  Verktøyet er bygget for å vurderes iterativt. Hvis noen bokser er røde, prøv å hake
                  av flere barrierer for å se hvilke tiltak som faktisk reduserer risikoen
                  tilstrekkelig. Sammenlign deretter listen i «Barriereanbefalinger» nederst med
                  dagens situasjon – den viser hvilke barrierer som er kritiske gitt risikobildet, og
                  hvilke som mangler. Avslutt med å notere alle antakelser du har brukt (særlig
                  buenergi-modus og verdiene i kortslutningsfanen) i rapporten din slik at andre kan
                  etterprøve vurderingen.
                </p>
              </section>
              <section>
                <h4 className="font-semibold mb-2">Referanseverdier – typiske norske vannkraftstasjoner</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Anleggstype</TableHead>
                      <TableHead>Effekt</TableHead>
                      <TableHead>Spenning HV</TableHead>
                      <TableHead>Oljevolum</TableHead>
                      <TableHead>Kortslutningsstrøm I_k</TableHead>
                      <TableHead>Buenergi typisk worst case</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Småkraft (mindre enn 10 MW)</TableCell>
                      <TableCell>1–15 MVA</TableCell>
                      <TableCell>22 eller 66 kV</TableCell>
                      <TableCell>2 000–10 000 L</TableCell>
                      <TableCell>5–15 kA</TableCell>
                      <TableCell>0,5–3 MJ</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Mellomstor stasjon (10–100 MW)</TableCell>
                      <TableCell>15–150 MVA</TableCell>
                      <TableCell>66 eller 132 kV</TableCell>
                      <TableCell>10 000–30 000 L</TableCell>
                      <TableCell>15–30 kA</TableCell>
                      <TableCell>2–8 MJ</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Stort kraftverk (100–300 MW)</TableCell>
                      <TableCell>150–300 MVA</TableCell>
                      <TableCell>132 eller 300 kV</TableCell>
                      <TableCell>30 000–70 000 L</TableCell>
                      <TableCell>30–50 kA</TableCell>
                      <TableCell>5–15 MJ</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Storkraftverk (over 300 MW)</TableCell>
                      <TableCell>300–1100 MVA</TableCell>
                      <TableCell>300 eller 420 kV</TableCell>
                      <TableCell>50 000–100 000 L</TableCell>
                      <TableCell>40–60 kA</TableCell>
                      <TableCell>10–25 MJ</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <p className="mt-2 text-xs text-muted-foreground">
                  Tallene er typiske intervaller for nye/moderne norske anlegg. Eldre trafoer kan ha
                  vesentlig høyere buenergi-eksponering på grunn av langsommere reléinnstillinger og
                  lavere kortslutningsbidrag fra nettet. Sjekk konkrete prosjektverdier mot leverandør
                  og nettselskap.
                </p>
              </section>
              <p className="text-xs text-muted-foreground pt-2 border-t">
                Verktøyet erstatter ikke en fullstendig risikovurdering eller branntekniske analyser
                etter NS-EN 1991-1-2 / preaksepterte ytelser. Verdier skal verifiseres mot
                primærkilder og prosjektspesifikke forutsetninger før bruk i prosjektering.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* INPUT */}
      <TooltipProvider delayDuration={200}>
      <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Trafo og olje</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <LabelWithHelp label="Oljevolum (L)" help={HELP.oljevolum} />
              <Input type="number" value={input.oljevolum_L} onChange={(e) => upd("oljevolum_L", +e.target.value)} />
            </div>
            <div>
              <LabelWithHelp label="Tanktype" help={HELP.tanktype} />
              <Select value={input.tanktype} onValueChange={(v) => upd("tanktype", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="corrugated">Corrugated (riflet)</SelectItem>
                  <SelectItem value="conservator">Conservator</SelectItem>
                  <SelectItem value="hermetic">Hermetisk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <LabelWithHelp label="Oljetype" help={HELP.oljetype} />
              <Select value={input.oljetype} onValueChange={(v) => upd("oljetype", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mineralolje">Mineralolje</SelectItem>
                  <SelectItem value="naturlig_ester">Naturlig ester (FR3)</SelectItem>
                  <SelectItem value="syntetisk_ester">Syntetisk ester (Midel 7131)</SelectItem>
                  <SelectItem value="silikonolje">Silikonolje</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <LabelWithHelp label="Spenning (kV)" help={HELP.spenning} />
                <Input type="number" value={input.spenning_kV} onChange={(e) => upd("spenning_kV", +e.target.value)} />
              </div>
              <div>
                <LabelWithHelp label="Effekt (MVA)" help={HELP.effekt} />
                <Input type="number" value={input.effekt_MVA} onChange={(e) => upd("effekt_MVA", +e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <LabelWithHelp label="Buenergi" help={HELP.buenergi} />
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
                          <TooltipContent className="max-w-xs space-y-1">
                            <p className="font-semibold">{s.beskrivelse}</p>
                            <p className="text-xs opacity-90">{s.uttrykk}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="kortslutning" className="pt-3 space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs">Kortslutningsstrøm I_k (kA)</Label>
                      <HelpIcon help={HELP.ik} />
                    </div>
                    <Input type="number" value={ik_kA} onChange={(e) => setIk(+e.target.value)} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs">Buespenning U_bue</Label>
                      <HelpIcon help={HELP.ubue} />
                    </div>
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
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs">Klareringstid t_klar</Label>
                      <HelpIcon help={HELP.tklar} />
                    </div>
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
                    <div className="text-xs text-muted-foreground italic mt-1">
                      {scenarioFeedback(E_kortslutning)}
                    </div>
                  </div>
                  {E_kortslutning > 30 && (
                    <Alert variant="warning">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Beregnet buenergi er svært høy. Verifiser at kortslutningsstrømmen er hentet fra riktig spenningsside, og at klareringstiden reflekterer faktiske reléinnstillinger – ikke teoretiske worst case.
                      </AlertDescription>
                    </Alert>
                  )}
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
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <LabelWithHelp label="Tankkapasitet elastisk (MJ)" help={HELP.tankkapasitet} />
                {tankkapManuellOverstyrt && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => {
                      setTankkapManuellOverstyrt(false);
                      upd("tankkapasitet_MJ", +autoTankkap.toFixed(2));
                    }}
                  >
                    Beregn automatisk
                  </Button>
                )}
              </div>
              <Input
                type="number"
                step="0.1"
                value={input.tankkapasitet_MJ}
                onChange={(e) => {
                  setTankkapManuellOverstyrt(true);
                  upd("tankkapasitet_MJ", +e.target.value);
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Auto-beregnet fra oljevolum, tanktype og spenning. Overstyr hvis trafoleverandøren har testet høyere kapasitet.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Plassering</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <LabelWithHelp label="Plassering" help={HELP.plassering} />
              <Select value={input.plassering} onValueChange={(v) => upd("plassering", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="innendørs">Innendørs</SelectItem>
                  <SelectItem value="utendørs">Utendørs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <LabelWithHelp label="Avstand til personell/utstyr (m)" help={HELP.avstand_personell} />
              <Input type="number" value={input.avstand_personell_m} onChange={(e) => upd("avstand_personell_m", +e.target.value)} />
            </div>
            <div>
              <LabelWithHelp label="Avstand til maskinhall/kontrollbygg (m)" help={HELP.avstand_maskinhall} />
              <Input type="number" value={input.avstand_maskinhall_m} onChange={(e) => upd("avstand_maskinhall_m", +e.target.value)} />
            </div>
            <div>
              <LabelWithHelp label="Oljegruve / bassengareal (m²)" help={HELP.basseng} />
              <Input type="number" value={input.basseng_areal_m2} onChange={(e) => upd("basseng_areal_m2", +e.target.value)} />
              {input.basseng_areal_m2 < res.containment_paakrevd_m2 && (
                <Alert variant="warning" className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Oljegruven bør være minst {Math.ceil(res.containment_paakrevd_m2)} m² for å romme 110 % av oljemengden iht. NFPA 850. Underdimensjonert containment medfører risiko for spredning av brennende olje utover anlegget.
                  </AlertDescription>
                </Alert>
              )}
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
              ["rom_ventilasjon", "Romventilasjon (hydrogenavlasting)"],
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

        <Card>
          <CardHeader>
            <div className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">Driftstilstand</CardTitle>
              <span className="text-xs text-muted-foreground">
                Driftsfaktor: ×{driftsfaktor.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <LabelWithHelp label="Trafoens alder (år)" help={HELP.alder} />
              <Input
                type="number"
                value={input.drift.alder_aar}
                onChange={(e) => updD("alder_aar", +e.target.value)}
              />
            </div>
            <div>
              <LabelWithHelp label="Måneder siden siste DGA-analyse" help={HELP.dga_maaneder} />
              <Input
                type="number"
                value={input.drift.maaneder_siden_dga}
                onChange={(e) => updD("maaneder_siden_dga", +e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={input.drift.overlast_historisk}
                onCheckedChange={(v) => updD("overlast_historisk", !!v)}
              />
              <span>Trafoen har hatt historisk overlast utover skiltverdi</span>
              <HelpIcon help={HELP.overlast} />
            </label>
          </CardContent>
        </Card>
      </div>
      </TooltipProvider>


      {res.hydrogen_advarsel && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Innendørs plassering uten dedikert romventilasjon: hydrogen og andre brennbare gasser fra buespaltet olje kan akkumulere og gi sekundær gasseksplosjon. Vurder ventilasjon dimensjonert iht. CIGRE TB 537.
          </AlertDescription>
        </Alert>
      )}

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
            <p className="whitespace-pre-line">{res.oljebrann.tekst}</p>
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

        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Standardoppfyllelse</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-3">
            <div className="text-center">
              <div
                className={`text-4xl font-bold ${
                  res.compliance.prosent >= 85
                    ? "text-green-600 dark:text-green-500"
                    : res.compliance.prosent >= 60
                    ? "text-yellow-600 dark:text-yellow-500"
                    : "text-red-600 dark:text-red-500"
                }`}
              >
                {res.compliance.prosent.toFixed(0)} %
              </div>
              <div className="text-xs text-muted-foreground">
                {res.compliance.oppfylt_antall} av {res.compliance.totalt_antall} krav oppfylt
              </div>
            </div>
            <div className="space-y-1">
              {res.compliance.krav.map((k) => (
                <div key={k.navn} className="flex items-start gap-2 rounded-md border bg-muted/40 px-3 py-2">
                  {k.oppfylt ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{k.navn}</span>
                      <Badge variant="outline" className="text-xs">{k.standard}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{k.kommentar}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground pt-2 border-t">
              {res.compliance.oppfylt_antall} av {res.compliance.totalt_antall} anbefalte tiltak iht. NFPA 850, IEEE 979 og CIGRE TB 537 er oppfylt.
            </p>
          </CardContent>
        </Card>

        <Card>

          <CardHeader><CardTitle className="text-base">Sannsynlighet (CIGRE TB 537)</CardTitle></CardHeader>
          <CardContent className="text-sm">
            <div className="space-y-1">
              {[
                { label: "Intern feil (per år)", val: res.sannsynlighet.intern_feil_aarlig_pct },
                { label: "Arc gitt feil", val: res.sannsynlighet.arc_gitt_feil_pct },
                { label: "Tankbrudd gitt arc", val: res.sannsynlighet.tankbrudd_gitt_arc_pct },
                { label: "Brann gitt brudd", val: res.sannsynlighet.brann_gitt_brudd_pct },
                { label: "Eskalering gitt brann", val: res.sannsynlighet.eskalering_gitt_brann_pct },
              ].map((row, i, arr) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
                    <span className="text-foreground">{row.label}</span>
                    <span className="font-semibold tabular-nums">{row.val.toFixed(1)} %</span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="flex justify-center text-muted-foreground py-0.5">
                      <ArrowDown className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total årlig eskaleringssannsynlighet</span>
                <span className="text-lg font-bold tabular-nums">
                  {res.sannsynlighet.total_eskalering_aarlig_pct.toFixed(3)} %
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Kumulert over 40 år</span>
                <span className="text-lg font-bold tabular-nums">
                  {res.sannsynlighet.total_levetid40_pct.toFixed(1)} %
                </span>
              </div>
            </div>
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
    res.trykkbolge.r20_m,
    res.trykkbolge.r78_m,
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
      {linje(sc(res.trykkbolge.r20_m), "#dc2626", `${res.trykkbolge.r20_m.toFixed(0)} m (100 % trykk)`, cy - 8)}
      {linje(sc(res.trykkbolge.r78_m), "#f59e0b", `${res.trykkbolge.r78_m.toFixed(0)} m (50 % trykk)`, cy + 28)}
      {linje(sc(res.fragmenter.soner.p80_m), "#a855f7", `${res.fragmenter.soner.p80_m.toFixed(0)} m frag 80 %`, cy - 24)}
      {linje(sc(res.bleve.fatal_radius_m), "#b91c1c", `${res.bleve.fatal_radius_m.toFixed(0)} m BLEVE`, cy + 44)}
      {linje(sc(input.avstand_personell_m), "#16a34a", `${input.avstand_personell_m} m personell`, cy - 40)}
      {linje(sc(input.avstand_maskinhall_m), "#2563eb", `${input.avstand_maskinhall_m} m maskinhall`, cy + 60)}
    </svg>
  );
};

export default TrafoEksplosjonTool;
