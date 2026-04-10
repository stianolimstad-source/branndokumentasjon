import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ArrowLeft, Flame, AlertTriangle, Info, Shield, Ruler, FileText,
  Droplets, ChevronDown, Cylinder, PipetteIcon, Gauge, ClipboardCheck, FolderOpen, ExternalLink, Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getBrensellagringKrav,
  BrenselType,
  STOFF_KATALOG,
  INNMELDINGS_GRENSER,
  SIKKERHETSAVSTANDER,
  INTERNE_AVSTANDER_KAT12,
  OPPSAMLING_KRAV,
  TANK_KRAV,
  BELIGGENHET_KRAV,
  ROERLEDNING_KRAV,
  VENTIL_KRAV,
  KONTROLL_KRAV,
  DOKUMENTASJON_KRAV,
  PUMPE_KRAV,
  getInnmeldingsStatus,
  BYGNINGSTYPER,
  BygningsType,
  STYKKGODS_GRENSER,
  getStykkgodsGrense,
} from "@/lib/brensellagring-krav";
import BrensellagringPreview, { BRENSEL_SECTIONS, BrenselSectionKey } from "@/components/brensellagring/BrensellagringPreview";
import { Checkbox } from "@/components/ui/checkbox";

const Brensellagring = () => {
  const navigate = useNavigate();

  // VTEK byggkrav
  const [valgtBygningstype, setValgtBygningstype] = useState<BygningsType | "">("");
  const [brenselType, setBrenselType] = useState<BrenselType | "">("");
  const [mengde, setMengde] = useState("");
  const [prosjektNavn, setProsjektNavn] = useState("");
  const [adresse, setAdresse] = useState("");

  const valgtBygg = BYGNINGSTYPER.find((b) => b.id === valgtBygningstype) || null;
  const [expandedBrensel, setExpandedBrensel] = useState<string | null>(null);

  // DSB stykkgods – areal
  const [arealInput, setArealInput] = useState("");

  // Tankanlegg – innmelding
  const [valgtStoff, setValgtStoff] = useState("");
  const [tankMengde, setTankMengde] = useState("");
  const [stoffKategoriFilter, setStoffKategoriFilter] = useState<string>("alle");

  // Section visibility for preview
  const [visibleSections, setVisibleSections] = useState<Set<BrenselSectionKey>>(
    new Set(BRENSEL_SECTIONS.map(s => s.key))
  );

  const toggleSection = (key: BrenselSectionKey) => {
    setVisibleSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const mengdeNum = parseFloat(mengde) || 0;
  const result = brenselType ? getBrensellagringKrav(brenselType as BrenselType, mengdeNum) : null;

  const tankMengdeNum = parseFloat(tankMengde) || 0;
  const innmeldingsStatus = valgtStoff && tankMengdeNum > 0 ? getInnmeldingsStatus(valgtStoff, tankMengdeNum) : null;
  const valgtStoffInfo = STOFF_KATALOG.find((s) => s.id === valgtStoff);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <section className="container mx-auto px-3 sm:px-4 py-4 sm:py-12">
        <div className="max-w-5xl mx-auto">
          <Button variant="ghost" size="sm" className="mb-3 sm:mb-4" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Tilbake
          </Button>

          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold">Lagring av brannfarlig stoff</h2>
            <p className="text-muted-foreground mt-1">
              Basert på DSB Temaveiledning om oppbevaring av farlig stoff (Kapittel 1 – Atmosfæriske tanker) og VTEK § 11-8
            </p>
          </div>

          {/* ============================================================== */}
          {/* TABS – DSB Temaveiledning innhold                               */}
          {/* ============================================================== */}
          <Tabs defaultValue="stoffdata" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 h-auto gap-1">
              <TabsTrigger value="stoffdata" className="text-xs py-2">
                <Flame className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
                Stoffdata
              </TabsTrigger>
              <TabsTrigger value="beliggenhet" className="text-xs py-2">
                <Ruler className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
                Beliggenhet
              </TabsTrigger>
              <TabsTrigger value="tanker" className="text-xs py-2">
                <Cylinder className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
                Tanker
              </TabsTrigger>
              <TabsTrigger value="oppsamling" className="text-xs py-2">
                <Droplets className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
                Oppsamling
              </TabsTrigger>
              <TabsTrigger value="roer" className="text-xs py-2">
                <PipetteIcon className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
                Rør & ventiler
              </TabsTrigger>
              <TabsTrigger value="kontroll" className="text-xs py-2">
                <Gauge className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
                Kontroll
              </TabsTrigger>
              <TabsTrigger value="innmelding" className="text-xs py-2">
                <FileText className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
                Innmelding
              </TabsTrigger>
              <TabsTrigger value="dokumentasjon" className="text-xs py-2">
                <FolderOpen className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
                Dokumentasjon
              </TabsTrigger>
            </TabsList>

            {/* ============ TAB: Stoffdata ============ */}
            <TabsContent value="stoffdata" className="space-y-4">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    Tekniske data – brannfarlige væsker (§ 4.1)
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Typiske verdier iht. DSB Temaveiledning tabell 4.1</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-3">
                    <Label className="text-sm font-medium whitespace-nowrap">Filtrer på kategori:</Label>
                    <Select value={stoffKategoriFilter} onValueChange={setStoffKategoriFilter}>
                      <SelectTrigger className="w-[240px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alle">Alle kategorier</SelectItem>
                        <SelectItem value="kat1">Kategori 1</SelectItem>
                        <SelectItem value="kat2">Kategori 2</SelectItem>
                        <SelectItem value="kat3">Kategori 3</SelectItem>
                        <SelectItem value="diesel_fyringsolje">Diesel / fyringsolje</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left py-2.5 px-3 font-medium">Stoff</th>
                          <th className="text-left py-2.5 px-3 font-medium">Kategori</th>
                          <th className="text-left py-2.5 px-3 font-medium">Flammepunkt</th>
                          <th className="text-left py-2.5 px-3 font-medium">Densitet</th>
                          <th className="text-left py-2.5 px-3 font-medium">Brennverdi</th>
                          <th className="text-left py-2.5 px-3 font-medium">Viskositet</th>
                          <th className="text-left py-2.5 px-3 font-medium">Dest.intervall</th>
                        </tr>
                      </thead>
                      <tbody>
                        {STOFF_KATALOG.filter((s) => stoffKategoriFilter === "alle" || s.kategori === stoffKategoriFilter).map((stoff) => (
                          <tr key={stoff.id} className="border-t">
                            <td className="py-2 px-3 font-medium">{stoff.navn}</td>
                            <td className="py-2 px-3">
                              <Badge variant="outline" className="text-xs whitespace-nowrap">
                                {stoff.kategori === "kat1" ? "Kat. 1" : stoff.kategori === "kat2" ? "Kat. 2" : stoff.kategori === "kat3" ? "Kat. 3" : "Diesel/fyringsolje"}
                              </Badge>
                            </td>
                            <td className="py-2 px-3">{stoff.flammepunkt}</td>
                            <td className="py-2 px-3">{stoff.densitet}</td>
                            <td className="py-2 px-3">{stoff.nedreBrennverdi}</td>
                            <td className="py-2 px-3">{stoff.viskositet}</td>
                            <td className="py-2 px-3">{stoff.destillasjonsintervall}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 p-3 bg-muted/30 rounded-lg text-sm space-y-1.5">
                    <p className="font-medium">Kategorier iht. GHS/DSB:</p>
                    <p><strong>Kategori 1:</strong> Flammepunkt &lt; 23 °C og startkokepunkt ≤ 35 °C (f.eks. bensin)</p>
                    <p><strong>Kategori 2:</strong> Flammepunkt &lt; 23 °C og startkokepunkt &gt; 35 °C (f.eks. aceton)</p>
                    <p><strong>Kategori 3:</strong> Flammepunkt ≥ 23 °C og ≤ 60 °C (f.eks. parafin, JetA1)</p>
                    <p><strong>Diesel/fyringsoljer:</strong> Flammepunkt &gt; 60 °C</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============ TAB: Beliggenhet & utforming ============ */}
            <TabsContent value="beliggenhet" className="space-y-4">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Ruler className="h-5 w-5 text-primary" />
                    Beliggenhet og utforming (§ 15.1)
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Krav til plassering, branngater, inngjerding og rømningsveier
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {BELIGGENHET_KRAV.map((krav, i) => (
                      <div key={i} className="p-4 bg-muted/30 rounded-lg">
                        <h4 className="font-medium mb-1">{krav.tittel}</h4>
                        <p className="text-sm text-muted-foreground">{krav.beskrivelse}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Sikkerhetsavstander */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg">Sikkerhetsavstander – tank til objekt (§ 15.11)</CardTitle>
                  <p className="text-sm text-muted-foreground">Veiledende minsteavstander mellom tank og nærliggende objekter</p>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left py-2.5 px-3 font-medium">Objekt</th>
                          <th className="text-left py-2.5 px-3 font-medium">Kat. 1 & 2</th>
                          <th className="text-left py-2.5 px-3 font-medium">Kat. 3</th>
                          <th className="text-left py-2.5 px-3 font-medium">Diesel/fyringsolje</th>
                        </tr>
                      </thead>
                      <tbody>
                        {SIKKERHETSAVSTANDER.map((rad, i) => (
                          <tr key={i} className="border-t">
                            <td className="py-2 px-3 font-medium">{rad.objekt}</td>
                            <td className="py-2 px-3">{rad.kat1og2}</td>
                            <td className="py-2 px-3">{rad.kat3}</td>
                            <td className="py-2 px-3">{rad.dieselFyringsolje}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Interne avstander */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg">Interne avstander – kat. 1 & 2 (meter)</CardTitle>
                  <p className="text-sm text-muted-foreground">Veiledende minsteavstander mellom anleggsdeler (f.eks. bensin)</p>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left py-2.5 px-3 font-medium">Fra / Til</th>
                          <th className="text-left py-2.5 px-3 font-medium">Fyrhus</th>
                          <th className="text-left py-2.5 px-3 font-medium">Fyllep. kai</th>
                          <th className="text-left py-2.5 px-3 font-medium">Fyllep. bil/tog</th>
                          <th className="text-left py-2.5 px-3 font-medium">Pumpehus</th>
                          <th className="text-left py-2.5 px-3 font-medium">Kontor</th>
                          <th className="text-left py-2.5 px-3 font-medium">Hydrant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {INTERNE_AVSTANDER_KAT12.map((rad, i) => (
                          <tr key={i} className="border-t">
                            <td className="py-2 px-3 font-medium">{rad.fra}</td>
                            <td className="py-2 px-3">{rad.fyrhus}</td>
                            <td className="py-2 px-3">{rad.fylleplassKai}</td>
                            <td className="py-2 px-3">{rad.fylleplassBilTog}</td>
                            <td className="py-2 px-3">{rad.pumpehus}</td>
                            <td className="py-2 px-3">{rad.kontor}</td>
                            <td className="py-2 px-3">{rad.hydrant}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Kilde: DSB Temaveiledning § 15.11. Avstander kan økes/reduseres basert på risikovurdering.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============ TAB: Tanker ============ */}
            <TabsContent value="tanker" className="space-y-4">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Cylinder className="h-5 w-5 text-primary" />
                    Krav til tanker (§ 15.2)
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Utførelse, fundament, korrosjonsbeskyttelse og flammesikring
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {TANK_KRAV.map((krav, i) => (
                      <div key={i} className="p-4 bg-muted/30 rounded-lg">
                        <h4 className="font-medium mb-1">{krav.tittel}</h4>
                        <p className="text-sm text-muted-foreground">{krav.beskrivelse}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Pumper */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Pumper og pumperom (§ 15.6)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {PUMPE_KRAV.map((krav, i) => (
                      <div key={i} className="p-4 bg-muted/30 rounded-lg">
                        <h4 className="font-medium mb-1">{krav.tittel}</h4>
                        <p className="text-sm text-muted-foreground">{krav.beskrivelse}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============ TAB: Oppsamling & overfylling ============ */}
            <TabsContent value="oppsamling" className="space-y-4">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-blue-500" />
                    Oppsamling og overfyllingsvern (§ 15.3)
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Krav til oppsamlingsbasseng, drenering, overfyllingsvarsel og oljeutskiller
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {OPPSAMLING_KRAV.map((krav, i) => (
                      <div key={i} className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{krav.tittel}</h4>
                          {krav.paragraf && (
                            <Badge variant="outline" className="text-xs">{krav.paragraf}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{krav.beskrivelse}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============ TAB: Rør & ventiler ============ */}
            <TabsContent value="roer" className="space-y-4">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PipetteIcon className="h-5 w-5 text-primary" />
                    Rørledninger (§ 15.4)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {ROERLEDNING_KRAV.map((krav, i) => (
                      <div key={i} className="p-4 bg-muted/30 rounded-lg">
                        <h4 className="font-medium mb-1">{krav.tittel}</h4>
                        <p className="text-sm text-muted-foreground">{krav.beskrivelse}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg">Ventiler (§ 15.5)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {VENTIL_KRAV.map((krav, i) => (
                      <div key={i} className="p-4 bg-muted/30 rounded-lg">
                        <h4 className="font-medium mb-1">{krav.tittel}</h4>
                        <p className="text-sm text-muted-foreground">{krav.beskrivelse}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============ TAB: Kontroll ============ */}
            <TabsContent value="kontroll" className="space-y-4">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-primary" />
                    Kontroll og tilstandskontroll (§ 9)
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Krav til kontrollintervaller og systematisk tilstandskontroll
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left py-2.5 px-3 font-medium">Kontrolltype</th>
                          <th className="text-left py-2.5 px-3 font-medium">Beskrivelse</th>
                          <th className="text-left py-2.5 px-3 font-medium w-36">Intervall</th>
                        </tr>
                      </thead>
                      <tbody>
                        {KONTROLL_KRAV.map((krav, i) => (
                          <tr key={i} className="border-t">
                            <td className="py-2 px-3 font-medium">{krav.tittel}</td>
                            <td className="py-2 px-3 text-muted-foreground">{krav.beskrivelse}</td>
                            <td className="py-2 px-3">
                              {krav.intervall && <Badge variant="secondary" className="text-xs">{krav.intervall}</Badge>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 p-3 bg-muted/30 rounded-lg text-sm space-y-1.5">
                    <p className="font-medium">Generelt skal systematisk tilstandskontroll omfatte:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                      <li>Visuell kontroll av tanker og rørføringer</li>
                      <li>Korrosjonskontroll</li>
                      <li>Tetthetsprøving, evt. trykkprøving</li>
                      <li>Kontroll av viktige komponenter</li>
                      <li>Testing av sikkerhetsfunksjoner og -kritisk utstyr</li>
                      <li>Gjennomgang av dokumentasjon om reparasjoner og endringer</li>
                      <li>Kontrollrapport med avvik, tiltak og tidspunkt for neste kontroll</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============ TAB: Innmelding ============ */}
            <TabsContent value="innmelding" className="space-y-4">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Innmeldingsplikt til DSB (§ 12)
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Sjekk om mengden krever innmelding til Direktoratet for samfunnssikkerhet og beredskap
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Velg stoff</Label>
                      <Select value={valgtStoff} onValueChange={setValgtStoff}>
                        <SelectTrigger>
                          <SelectValue placeholder="Velg stoff..." />
                        </SelectTrigger>
                        <SelectContent>
                          {STOFF_KATALOG.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.navn}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Mengde (liter)</Label>
                      <Input type="number" min={0} placeholder="F.eks. 5000" value={tankMengde} onChange={(e) => setTankMengde(e.target.value)} />
                    </div>
                  </div>

                  {innmeldingsStatus && valgtStoffInfo && (
                    <Card className={`mt-2 ${innmeldingsStatus.trengerInnmelding ? "border-amber-400 dark:border-amber-600" : "border-green-400 dark:border-green-600"}`}>
                      <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                          {innmeldingsStatus.trengerInnmelding ? (
                            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Info className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="space-y-1">
                            <p className="font-medium">
                              {innmeldingsStatus.trengerInnmelding ? "Innmeldingsplikt til DSB" : "Ingen innmeldingsplikt"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {valgtStoffInfo.navn} ({valgtStoffInfo.kategoriNavn}) – Innmeldingsgrense: {innmeldingsStatus.grenseTekst}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Din mengde: {tankMengdeNum.toLocaleString("nb-NO")} liter
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="border rounded-lg overflow-hidden mt-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left py-2.5 px-3 font-medium">Stoffgruppe</th>
                          <th className="text-left py-2.5 px-3 font-medium">Stoffer</th>
                          <th className="text-left py-2.5 px-3 font-medium">Innmeldingsmengde fra</th>
                        </tr>
                      </thead>
                      <tbody>
                        {INNMELDINGS_GRENSER.map((g, i) => (
                          <tr key={i} className="border-t">
                            <td className="py-2 px-3 font-medium">{g.kategori}</td>
                            <td className="py-2 px-3">{g.stoffer}</td>
                            <td className="py-2 px-3">{g.grenseTekst}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============ TAB: Dokumentasjon ============ */}
            <TabsContent value="dokumentasjon" className="space-y-4">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-primary" />
                    Dokumentasjonskrav (§ 13)
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Dokumentasjon som skal være tilgjengelig gjennom anleggets levetid
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left py-2.5 px-3 font-medium">Type dokumentasjon</th>
                          <th className="text-left py-2.5 px-3 font-medium w-32">Referanse</th>
                        </tr>
                      </thead>
                      <tbody>
                        {DOKUMENTASJON_KRAV.map((dok, i) => (
                          <tr key={i} className="border-t">
                            <td className="py-2 px-3">{dok.type}</td>
                            <td className="py-2 px-3">
                              <Badge variant="outline" className="text-xs">{dok.referanse}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Omfanget avhenger av anleggets størrelse og kompleksitet. Dokumentasjonen skal inngå som del av internkontroll (IK-forskriften § 5).
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* ============================================================== */}
        {/* LAGRING I BYGNING – DSB Kap. 3 (stykkgods) + VTEK § 11-8       */}
        {/* Split-screen med forhåndsvisning                                */}
        {/* ============================================================== */}
        <div className="mt-10 pt-8 border-t">
          <div className="flex items-center gap-2 mb-6 max-w-5xl mx-auto">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h3 className="text-xl font-bold">Lagring i bygning</h3>
              <p className="text-sm text-muted-foreground">
                DSB Temaveiledning Kap. 3 (stykkgods) og VTEK § 11-8 (tanklagring)
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* ===== LEFT: Input form ===== */}
            <div className="w-full lg:w-[440px] lg:flex-shrink-0 space-y-6">
              {/* Prosjektinfo */}
              <Card className="shadow-soft">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Prosjektinfo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Prosjektnavn</Label>
                    <Input placeholder="F.eks. Varmeanlegg Fjordheim" value={prosjektNavn} onChange={(e) => setProsjektNavn(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Adresse</Label>
                    <Input placeholder="F.eks. Strandveien 12, 1234 Oslo" value={adresse} onChange={(e) => setAdresse(e.target.value)} />
                  </div>
                </CardContent>
              </Card>

              {/* Bygningstype velger */}
              <Card className="shadow-soft">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-primary" />
                    Tanklagring i bygning – VTEK § 11-8
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Bygningstype / romtype</Label>
                    <Select value={valgtBygningstype} onValueChange={(v) => { setValgtBygningstype(v as BygningsType); setExpandedBrensel(null); setShowPreview(true); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg bygningstype..." />
                      </SelectTrigger>
                      <SelectContent>
                        {BYGNINGSTYPER.map((b) => (
                          <SelectItem key={b.id} value={b.id}>{b.navn}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Vis tillatte mengder */}
              {valgtBygg && (
                <Card className="shadow-soft">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Tillatte mengder – {valgtBygg.navn}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">{valgtBygg.beskrivelse}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left py-2 px-3 font-medium text-xs">Brenseltype</th>
                            <th className="text-left py-2 px-3 font-medium text-xs">Maks mengde</th>
                            <th className="text-left py-2 px-3 font-medium text-xs w-20">Detaljer</th>
                          </tr>
                        </thead>
                        <tbody>
                          {valgtBygg.grenser.map((g) => (
                            <tr key={g.brenselType} className="border-t">
                              <td className="py-2 px-3 font-medium text-xs">{g.brenselNavn}</td>
                              <td className="py-2 px-3">
                                {g.maksLiter === null && !g.maksKg ? (
                                  <Badge variant="outline" className="text-destructive border-destructive/30 text-xs">Ikke tillatt</Badge>
                                ) : g.maksKg ? (
                                  <Badge variant="secondary" className="font-mono text-xs">
                                    {g.maksKg.toLocaleString("nb-NO")} kg
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="font-mono text-xs">
                                    {g.maksLiter!.toLocaleString("nb-NO")} L
                                  </Badge>
                                )}
                              </td>
                              <td className="py-2 px-3">
                                {(g.maksLiter !== null || g.maksKg) && g.romKrav.length > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs px-2"
                                    onClick={() => setExpandedBrensel(expandedBrensel === g.brenselType ? null : g.brenselType)}
                                  >
                                    {expandedBrensel === g.brenselType ? "Skjul" : "Vis krav"}
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Utfyllende konstruksjonskrav */}
              {expandedBrensel && valgtBygg && (() => {
                const grense = valgtBygg.grenser.find((g) => g.brenselType === expandedBrensel);
                if (!grense || grense.romKrav.length === 0) return null;
                return (
                  <Card className="shadow-soft border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        Konstruksjonskrav – {grense.brenselNavn}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Maks {grense.maksKg ? `${grense.maksKg} kg` : `${grense.maksLiter?.toLocaleString("nb-NO")} liter`} i {valgtBygg.navn.toLowerCase()}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="text-left py-2 px-3 font-medium text-xs">Kategori</th>
                              <th className="text-left py-2 px-3 font-medium text-xs">Krav</th>
                              <th className="text-left py-2 px-3 font-medium text-xs w-16">Ansvar</th>
                              <th className="text-left py-2 px-3 font-medium text-xs">Ref.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {grense.romKrav.map((k, i) => (
                              <tr key={i} className="border-t">
                                <td className="py-2 px-3 font-medium text-xs">{k.kategori}</td>
                                <td className="py-2 px-3 text-xs">{k.tekst}</td>
                                <td className="py-2 px-3 text-xs text-muted-foreground">{k.ansvar}</td>
                                <td className="py-2 px-3 text-xs">
                                  {k.referanse ? (
                                    <a
                                      href={k.referanse.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-primary hover:underline"
                                    >
                                      {k.referanse.label}
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  ) : "–"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* DSB Kap. 3: Stykkgods */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-3 w-full text-left group mb-2">
                    <h4 className="text-sm font-semibold">Stykkgods – mengdegrenser etter areal (DSB Kap. 3)</h4>
                    <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto transition-transform group-data-[state=open]:rotate-180" />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3">
                  <Card className="shadow-soft">
                    <CardContent className="pt-4 space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm">Areal på salgs-/lagerlokale (m²)</Label>
                        <Input
                          type="number"
                          min={0}
                          placeholder="F.eks. 500"
                          value={arealInput}
                          onChange={(e) => setArealInput(e.target.value)}
                        />
                      </div>

                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="text-left py-2 px-2 font-medium">Areal</th>
                              <th className="text-left py-2 px-2 font-medium">Aerosoler</th>
                              <th className="text-left py-2 px-2 font-medium">Br.f. gass</th>
                              <th className="text-left py-2 px-2 font-medium">Kat 1&2</th>
                              <th className="text-left py-2 px-2 font-medium">Kat 3</th>
                            </tr>
                          </thead>
                          <tbody>
                            {STYKKGODS_GRENSER.map((g, i) => {
                              const arealNum = parseFloat(arealInput) || 0;
                              const isActive = arealNum > 0 && getStykkgodsGrense(arealNum) === g;
                              return (
                                <tr key={i} className={`border-t ${isActive ? "bg-primary/10 font-semibold" : ""}`}>
                                  <td className="py-2 px-2">{g.arealBeskrivelse}</td>
                                  <td className="py-2 px-2">{g.aerosoler} L</td>
                                  <td className="py-2 px-2">{g.brannfarligGass}</td>
                                  <td className="py-2 px-2">{g.brannfarligVaeskeKat1og2} L</td>
                                  <td className="py-2 px-2">{g.brannfarligVaeskeKat3.toLocaleString("nb-NO")} L</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {parseFloat(arealInput) > 0 && (() => {
                        const grense = getStykkgodsGrense(parseFloat(arealInput));
                        return (
                          <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-lg text-xs space-y-1">
                            <p className="font-semibold">For areal {parseFloat(arealInput).toLocaleString("nb-NO")} m² ({grense.arealBeskrivelse}):</p>
                            <ul className="list-disc list-inside space-y-0.5">
                              <li>Aerosoler: maks <strong>{grense.aerosoler} liter</strong></li>
                              <li>Brannfarlig gass: maks <strong>{grense.brannfarligGass}</strong></li>
                              <li>Brannfarlig væske kat. 1 og 2: maks <strong>{grense.brannfarligVaeskeKat1og2} liter</strong></li>
                              <li>Brannfarlig væske kat. 3: maks <strong>{grense.brannfarligVaeskeKat3.toLocaleString("nb-NO")} liter</strong></li>
                            </ul>
                          </div>
                        );
                      })()}

                      <div className="p-2 bg-muted/30 rounded-lg text-xs text-muted-foreground">
                        <p><strong>Kilde:</strong> DSB Temaveiledning, Kapittel 3 – Oppbevaring av brannfarlig stoff i transport- og brukeremballasje (stykkgods), § 6.</p>
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* ===== RIGHT: Document preview ===== */}
            <div className="flex-1 min-w-0">
              <div className="sticky top-4">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-semibold text-muted-foreground">Forhåndsvisning – Kravdokument</h4>
                </div>
                <div className="bg-muted/30 rounded-xl p-4 overflow-y-auto max-h-[calc(100vh-120px)]">
                  <BrensellagringPreview
                    valgtBygg={valgtBygg}
                    prosjektNavn={prosjektNavn || undefined}
                    adresse={adresse || undefined}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-8 text-center max-w-5xl mx-auto">
          Kilde: DSB Temaveiledning om oppbevaring av farlig stoff (Kap. 1 & 3) og VTEK § 11-8.
          <br />
          <a
            href="https://www.dsb.no/farlige-stoffer/farlige-stoffer/veiledning/temaveiledning-om-oppbevaring-av-farlig-stoff/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            Les hele veiledningen på dsb.no
          </a>
        </p>
      </section>
    </div>
  );
};

export default Brensellagring;
