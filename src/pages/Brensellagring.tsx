import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Flame, AlertTriangle, Info, Shield, Ruler, FileText, Droplets } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getBrensellagringKrav,
  BrenselType,
  STOFF_KATALOG,
  INNMELDINGS_GRENSER,
  SIKKERHETSAVSTANDER,
  INTERNE_AVSTANDER_KAT12,
  OPPSAMLING_KRAV,
  getInnmeldingsStatus,
} from "@/lib/brensellagring-krav";

const Brensellagring = () => {
  const navigate = useNavigate();

  // VTEK byggkrav
  const [brenselType, setBrenselType] = useState<BrenselType | "">("");
  const [mengde, setMengde] = useState("");

  // Tankanlegg – innmelding
  const [valgtStoff, setValgtStoff] = useState("");
  const [tankMengde, setTankMengde] = useState("");

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
              Basert på DSB Temaveiledning om oppbevaring av farlig stoff og VTEK § 11-8
            </p>
          </div>

          <Tabs defaultValue="stoffdata" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto gap-1">
              <TabsTrigger value="stoffdata" className="text-xs sm:text-sm py-2">
                <Flame className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                Stoffdata
              </TabsTrigger>
              <TabsTrigger value="byggkrav" className="text-xs sm:text-sm py-2">
                <Shield className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                Byggkrav
              </TabsTrigger>
              <TabsTrigger value="avstander" className="text-xs sm:text-sm py-2">
                <Ruler className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                Avstander
              </TabsTrigger>
              <TabsTrigger value="innmelding" className="text-xs sm:text-sm py-2">
                <FileText className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                Innmelding
              </TabsTrigger>
              <TabsTrigger value="oppsamling" className="text-xs sm:text-sm py-2">
                <Droplets className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                Oppsamling
              </TabsTrigger>
            </TabsList>

            {/* ============ TAB: Stoffdata ============ */}
            <TabsContent value="stoffdata" className="space-y-4">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    Tekniske data – brannfarlige væsker
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Typiske verdier iht. DSB Temaveiledning § 4.1</p>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left py-2.5 px-3 font-medium">Stoff</th>
                          <th className="text-left py-2.5 px-3 font-medium">Kategori</th>
                          <th className="text-left py-2.5 px-3 font-medium">Flammepunkt</th>
                          <th className="text-left py-2.5 px-3 font-medium">Densitet</th>
                          <th className="text-left py-2.5 px-3 font-medium">Brennverdi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {STOFF_KATALOG.map((stoff) => (
                          <tr key={stoff.id} className="border-t">
                            <td className="py-2 px-3 font-medium">{stoff.navn}</td>
                            <td className="py-2 px-3">
                              <Badge variant="outline" className="text-xs whitespace-nowrap">
                                {stoff.kategori === "kat1"
                                  ? "Kat. 1"
                                  : stoff.kategori === "kat2"
                                  ? "Kat. 2"
                                  : stoff.kategori === "kat3"
                                  ? "Kat. 3"
                                  : "Diesel/fyringsolje"}
                              </Badge>
                            </td>
                            <td className="py-2 px-3">{stoff.flammepunkt}</td>
                            <td className="py-2 px-3">{stoff.densitet}</td>
                            <td className="py-2 px-3">{stoff.nedreBrennverdi}</td>
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

            {/* ============ TAB: Byggkrav (VTEK) ============ */}
            <TabsContent value="byggkrav" className="space-y-4">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Lagring i bygning – VTEK § 11-8 Tabell 4
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Krav til rom for lagring av brennbar væske i bygninger
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type brensel</Label>
                      <Select value={brenselType} onValueChange={(v) => setBrenselType(v as BrenselType)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Velg type..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fyringsparafin">Fyringsparafin</SelectItem>
                          <SelectItem value="lett_fyringsolje">Lett fyringsolje</SelectItem>
                          <SelectItem value="begge">Begge (kombinasjon)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Mengde (liter)</Label>
                      <Input
                        type="number"
                        min={0}
                        placeholder="F.eks. 3000"
                        value={mengde}
                        onChange={(e) => setMengde(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {result && (
                <>
                  {result.feilmelding ? (
                    <Card className="shadow-soft border-amber-300 dark:border-amber-700">
                      <CardContent className="py-6">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-amber-800 dark:text-amber-200">{result.feilmelding}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : result.romType && result.krav.length > 0 ? (
                    <Card className="shadow-soft">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Info className="h-5 w-5 text-primary" />
                          <CardTitle className="text-lg">Krav – {result.romType}</CardTitle>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {brenselType === "fyringsparafin" ? "Fyringsparafin" : brenselType === "lett_fyringsolje" ? "Lett fyringsolje" : "Kombinasjon"} – {mengdeNum.toLocaleString("nb-NO")} liter
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-muted/50">
                                <th className="text-left py-2 px-3 font-medium">Kategori</th>
                                <th className="text-left py-2 px-3 font-medium">Krav</th>
                                <th className="text-left py-2 px-3 font-medium w-20">Ansvar</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.krav.map((k, i) => (
                                <tr key={i} className="border-t">
                                  <td className="py-2 px-3 font-medium">{k.kategori}</td>
                                  <td className="py-2 px-3">{k.tekst}</td>
                                  <td className="py-2 px-3 text-muted-foreground">{k.ansvar}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  ) : null}
                </>
              )}
            </TabsContent>

            {/* ============ TAB: Sikkerhetsavstander ============ */}
            <TabsContent value="avstander" className="space-y-4">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Ruler className="h-5 w-5 text-primary" />
                    Sikkerhetsavstander – tankanlegg (§ 15.11)
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Veiledende minsteavstander mellom tank og nærliggende objekter
                  </p>
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

              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg">Interne avstander – kat. 1 & 2 (meter)</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Veiledende minsteavstander mellom anleggsdeler (f.eks. bensin)
                  </p>
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
                            <SelectItem key={s.id} value={s.id}>
                              {s.navn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Mengde (liter)</Label>
                      <Input
                        type="number"
                        min={0}
                        placeholder="F.eks. 5000"
                        value={tankMengde}
                        onChange={(e) => setTankMengde(e.target.value)}
                      />
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
                              {innmeldingsStatus.trengerInnmelding
                                ? "Innmeldingsplikt til DSB"
                                : "Ingen innmeldingsplikt"}
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

            {/* ============ TAB: Oppsamling & overfylling ============ */}
            <TabsContent value="oppsamling" className="space-y-4">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-blue-500" />
                    Oppsamling og overfyllingsvern (§ 15.3)
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Krav til oppsamlingsbasseng, drenering og tiltak mot overfylling
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {OPPSAMLING_KRAV.map((krav, i) => (
                      <div key={i} className="p-4 bg-muted/30 rounded-lg">
                        <h4 className="font-medium mb-1">{krav.tittel}</h4>
                        <p className="text-sm text-muted-foreground">{krav.beskrivelse}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 border rounded-lg bg-primary/5">
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <Info className="h-4 w-4 text-primary" />
                      Flammesikring av tanker
                    </h4>
                    <div className="text-sm space-y-2 text-muted-foreground">
                      <p>
                        <strong>Kat. 1 & 2 (flammepunkt &lt; 10 °C over lagringstemperatur):</strong> Krever
                        trykk/vakuumventil, flytetak eller annen godkjent flammesikring.
                      </p>
                      <p>
                        <strong>Kat. 3 / diesel / fyringsolje (flammepunkt ≥ 10 °C over lagringstemperatur):</strong> Ingen
                        særlige krav til flammesikring.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <p className="text-xs text-muted-foreground mt-8 text-center">
            Kilde: DSB Temaveiledning om oppbevaring av farlig stoff og VTEK § 11-8.
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
        </div>
      </section>
    </div>
  );
};

export default Brensellagring;
