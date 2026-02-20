import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileWarning, Plus, Trash2, ChevronDown, ChevronUp, Download, Save, ArrowLeft } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import KvalitativPreview from "@/components/fraviksdokumentasjon/KvalitativPreview";

const hovedomrader = [
  {
    id: "A", label: "A – Brannforløp",
    delomrader: [
      { id: "a", label: "a – Antennelse" }, { id: "b", label: "b – Eksplosjon" },
      { id: "c", label: "c – Utvikling av brann" }, { id: "d", label: "d – Spredning av brann" },
      { id: "e", label: "e – Strukturell kollaps" }, { id: "f", label: "f – Spredning til nabobygning" },
    ],
  },
  {
    id: "B", label: "B – Rømning og redning",
    delomrader: [
      { id: "g", label: "g – Deteksjon og varsling" }, { id: "h", label: "h – Reaksjon" },
      { id: "i", label: "i – Forflytning til sikkert sted" }, { id: "j", label: "j – Assistert evakuering" },
    ],
  },
  {
    id: "C", label: "C – Verdier",
    delomrader: [
      { id: "k", label: "k – Mennesker" }, { id: "l", label: "l – Dyr" },
      { id: "m", label: "m – Økonomiske verdier" }, { id: "n", label: "n – Kulturhistoriske verdier" },
      { id: "o", label: "o – Miljøskader" }, { id: "p", label: "p – Samfunnsfunksjon" },
    ],
  },
  {
    id: "D", label: "D – Tilrettelegging og sikkerhet for slokkemannskaper",
    delomrader: [
      { id: "q", label: "q – Innsatstid" }, { id: "r", label: "r – Tilrettelegging rundt bygningen" },
      { id: "s", label: "s – Tilrettelegging i bygningen" }, { id: "t", label: "t – Annet teknisk utstyr for slokkeinnsats" },
      { id: "u", label: "u – Bemanning og kompetanse" },
    ],
  },
];

interface KompenserendeTiltak {
  id: string;
  beskrivelse: string;
  funksjonalitet: string;
  palitelighet: string;
  robusthet: string;
  vedlikehold: string;
  andreEffekter: string;
}

const emptyTiltak = (): KompenserendeTiltak => ({
  id: crypto.randomUUID(),
  beskrivelse: "",
  funksjonalitet: "",
  palitelighet: "",
  robusthet: "",
  vedlikehold: "",
  andreEffekter: "",
});

const KvalitativAnalyse = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("project");
  const conceptId = searchParams.get("concept");

  const [dokumentNavn, setDokumentNavn] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedConceptId, setSavedConceptId] = useState<string | null>(conceptId);

  const [funksjonskrav, setFunksjonskrav] = useState("");
  const [preakseptertYtelse, setPreakseptertYtelse] = useState("");
  const [hensiktYtelse, setHensiktYtelse] = useState("");
  const [fravikBeskrivelse, setFravikBeskrivelse] = useState("");
  const [tiltak, setTiltak] = useState<KompenserendeTiltak[]>([emptyTiltak()]);
  const [fraviketOmrader, setFraviketOmrader] = useState<string[]>([]);
  const [tiltakOmrader, setTiltakOmrader] = useState<string[]>([]);
  const [sammenligning, setSammenligning] = useState("");
  const [maleparametre, setMaleparametre] = useState("");
  const [referanser, setReferanser] = useState("");
  const [konklusjon, setKonklusjon] = useState<"tilstrekkelig" | "komparativ" | "risikoanalyse" | "">("");
  const [begrunnelseKonklusjon, setBegrunnelseKonklusjon] = useState("");
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});

  // Load existing concept
  useEffect(() => {
    if (conceptId && user) loadConcept(conceptId);
  }, [conceptId, user]);

  const loadConcept = async (id: string) => {
    const { data, error } = await supabase
      .from("fire_concepts")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return;

    setDokumentNavn(data.name);
    const c = data.content as any;
    if (c) {
      setFunksjonskrav(c.funksjonskrav || "");
      setPreakseptertYtelse(c.preakseptertYtelse || "");
      setHensiktYtelse(c.hensiktYtelse || "");
      setFravikBeskrivelse(c.fravikBeskrivelse || "");
      setTiltak(c.tiltak || [emptyTiltak()]);
      setFraviketOmrader(c.fraviketOmrader || []);
      setTiltakOmrader(c.tiltakOmrader || []);
      setSammenligning(c.sammenligning || "");
      setMaleparametre(c.maleparametre || "");
      setReferanser(c.referanser || "");
      setKonklusjon(c.konklusjon || "");
      setBegrunnelseKonklusjon(c.begrunnelseKonklusjon || "");
    }
  };

  const handleSave = async () => {
    if (!user || !projectId) return;
    if (!dokumentNavn.trim()) {
      toast({ title: "Mangler navn", description: "Gi dokumentet et navn før du lagrer", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const content = JSON.parse(JSON.stringify({ funksjonskrav, preakseptertYtelse, hensiktYtelse, fravikBeskrivelse, tiltak, fraviketOmrader, tiltakOmrader, sammenligning, maleparametre, referanser, konklusjon, begrunnelseKonklusjon, type: "kvalitativ" }));

    if (savedConceptId) {
      const { error } = await supabase.from("fire_concepts").update({ name: dokumentNavn, content, status: "draft" }).eq("id", savedConceptId);
      if (error) toast({ title: "Feil", description: "Kunne ikke oppdatere", variant: "destructive" });
      else toast({ title: "Lagret", description: "Dokumentet er oppdatert" });
    } else {
      const { data, error } = await supabase.from("fire_concepts").insert([{ project_id: projectId, user_id: user.id, name: dokumentNavn, content, status: "draft" }]).select().single();
      if (error) toast({ title: "Feil", description: "Kunne ikke lagre", variant: "destructive" });
      else if (data) {
        setSavedConceptId(data.id);
        toast({ title: "Lagret", description: "Dokumentet er lagret" });
        navigate(`/fraviksdokumentasjon/kvalitativ?project=${projectId}&concept=${data.id}`, { replace: true });
      }
    }
    setIsSaving(false);
  };

  const toggleOmrade = (id: string, type: "fravik" | "tiltak") => {
    const setter = type === "fravik" ? setFraviketOmrader : setTiltakOmrader;
    setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const addTiltak = () => setTiltak((prev) => [...prev, emptyTiltak()]);
  const removeTiltak = (id: string) => setTiltak((prev) => prev.filter((t) => t.id !== id));
  const updateTiltak = (id: string, field: keyof KompenserendeTiltak, value: string) => {
    setTiltak((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const formData = {
    funksjonskrav, preakseptertYtelse, hensiktYtelse, fravikBeskrivelse,
    tiltak, fraviketOmrader, tiltakOmrader,
    sammenligning, maleparametre, referanser,
    konklusjon, begrunnelseKonklusjon,
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to={projectId ? `/fraviksdokumentasjon?project=${projectId}` : "/fraviksdokumentasjon"}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Tilbake
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                  <FileWarning className="h-6 w-6 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold">Kvalitativ analyse</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {projectId && dokumentNavn && (
                <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Lagrer..." : "Lagre"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="w-full px-4 py-6">
        <div className="max-w-[1800px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-6 lg:h-[calc(100vh-200px)]">

            {/* Input Form */}
            <Card className="shadow-medium flex flex-col overflow-hidden">
              <CardHeader className="flex-shrink-0">
                <CardTitle>Inndata</CardTitle>
                <CardDescription>Fyll ut feltene for å generere fraviksdokumentasjonen</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full px-6 pb-6">
                  <div className="space-y-8">

                    {/* Dokumentnavn */}
                    <div className="space-y-2">
                      <Label htmlFor="dokument-name" className="text-sm font-semibold">Navn på dokumentet *</Label>
                      <Input id="dokument-name" placeholder="f.eks. Fravik brannmotstand EI60 → EI30" value={dokumentNavn} onChange={(e) => setDokumentNavn(e.target.value)} />
                    </div>

                    {/* Dokumentasjonsbehov */}
                    <div className="space-y-4">
                      <div className="border-b-2 border-foreground/20 pb-2">
                        <Label className="text-base font-extrabold text-foreground">Vurdering av dokumentasjonsbehov</Label>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="funksjonskrav" className="text-xs font-medium">Funksjonskravet i TEK17</Label>
                        <Textarea id="funksjonskrav" placeholder="F.eks. § 11-8 (1): Byggverk skal ha bæresystem og brannceller som gjør at bygningen..." value={funksjonskrav} onChange={(e) => setFunksjonskrav(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="preakseptert" className="text-xs font-medium">Preakseptert ytelse som det fravikes fra</Label>
                        <Textarea id="preakseptert" placeholder="Beskriv den preaksepterte ytelsen i veiledningen til TEK17..." value={preakseptertYtelse} onChange={(e) => setPreakseptertYtelse(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hensikt" className="text-xs font-medium">Opprinnelig hensikt med den preaksepterte ytelsen</Label>
                        <Textarea id="hensikt" placeholder="Beskriv hensikten/intensjonen bak kravet..." value={hensiktYtelse} onChange={(e) => setHensiktYtelse(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fravik" className="text-xs font-medium">Beskrivelse av fraviket</Label>
                        <Textarea id="fravik" placeholder="Beskriv det konkrete fraviket fra preakseptert ytelse..." value={fravikBeskrivelse} onChange={(e) => setFravikBeskrivelse(e.target.value)} />
                      </div>
                    </div>

                    {/* Kompenserende tiltak */}
                    <div className="space-y-4">
                      <div className="border-b-2 border-foreground/20 pb-2">
                        <Label className="text-base font-extrabold text-foreground">Kompenserende tiltak</Label>
                      </div>
                      {tiltak.map((t, index) => (
                        <div key={t.id} className="space-y-3 p-4 border rounded-lg relative">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm">Tiltak {index + 1}</h4>
                            {tiltak.length > 1 && (
                              <Button variant="ghost" size="icon" onClick={() => removeTiltak(t.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Beskrivelse av tiltaket</Label>
                            <Textarea placeholder="F.eks. automatisk slokkeanlegg, branngardin, røykventilasjon..." value={t.beskrivelse} onChange={(e) => updateTiltak(t.id, "beskrivelse", e.target.value)} />
                          </div>
                          <Collapsible open={showComments[`tiltak-${t.id}`]} onOpenChange={(open) => setShowComments(prev => ({ ...prev, [`tiltak-${t.id}`]: open }))}>
                            <CollapsibleTrigger asChild>
                              <Button variant="outline" size="sm" className="text-xs">
                                {showComments[`tiltak-${t.id}`] ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                                Vurdering av tiltakets egenskaper
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-3 mt-3">
                              {[
                                { key: "funksjonalitet" as const, label: "Funksjonalitet", placeholder: "Vil tiltaket påvirkes av andre forhold?" },
                                { key: "palitelighet" as const, label: "Pålitelighet", placeholder: "Vil tiltaket fungere når det trengs?" },
                                { key: "robusthet" as const, label: "Robusthet og fleksibilitet", placeholder: "Kan andre forhold hindre tiltakets funksjon?" },
                                { key: "vedlikehold" as const, label: "Behov for oppfølging og vedlikehold", placeholder: "Vil tiltaket fungere ved manglende vedlikehold?" },
                                { key: "andreEffekter" as const, label: "Mulige andre effekter", placeholder: "Kan tiltaket ha utilsiktede negative effekter?" },
                              ].map(field => (
                                <div key={field.key} className="space-y-1">
                                  <Label className="text-xs">{field.label}</Label>
                                  <Textarea placeholder={field.placeholder} value={t[field.key]} onChange={(e) => updateTiltak(t.id, field.key, e.target.value)} className="min-h-[60px]" />
                                </div>
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      ))}
                      <Button variant="outline" onClick={addTiltak} className="w-full">
                        <Plus className="h-4 w-4 mr-2" /> Legg til tiltak
                      </Button>
                    </div>

                    {/* Innvirkningsområder */}
                    <div className="space-y-4">
                      <div className="border-b-2 border-foreground/20 pb-2">
                        <Label className="text-base font-extrabold text-foreground">Fravikets områder for innvirkning</Label>
                      </div>
                      <p className="text-xs text-muted-foreground">Velg hvilke delområder fraviket og tiltaket virker inn på (tabell 641).</p>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-xs text-destructive">Fravikets områder</h4>
                          {hovedomrader.map(h => (
                            <div key={h.id} className="space-y-1">
                              <p className="text-xs font-medium">{h.label}</p>
                              <div className="space-y-0.5 pl-2">
                                {h.delomrader.map(d => (
                                  <div key={d.id} className="flex items-center gap-2">
                                    <Checkbox id={`fravik-${d.id}`} checked={fraviketOmrader.includes(d.id)} onCheckedChange={() => toggleOmrade(d.id, "fravik")} />
                                    <Label htmlFor={`fravik-${d.id}`} className="text-xs font-normal cursor-pointer">{d.label}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-3">
                          <h4 className="font-semibold text-xs text-primary">Tiltakets områder</h4>
                          {hovedomrader.map(h => (
                            <div key={h.id} className="space-y-1">
                              <p className="text-xs font-medium">{h.label}</p>
                              <div className="space-y-0.5 pl-2">
                                {h.delomrader.map(d => (
                                  <div key={d.id} className="flex items-center gap-2">
                                    <Checkbox id={`tiltak-${d.id}`} checked={tiltakOmrader.includes(d.id)} onCheckedChange={() => toggleOmrade(d.id, "tiltak")} />
                                    <Label htmlFor={`tiltak-${d.id}`} className="text-xs font-normal cursor-pointer">{d.label}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Kvalitativ analyse */}
                    <div className="space-y-4">
                      <div className="border-b-2 border-foreground/20 pb-2">
                        <Label className="text-base font-extrabold text-foreground">Kvalitativ analyse</Label>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sammenligning" className="text-xs font-medium">Sammenligning av fravik og kompenserende tiltak</Label>
                        <Textarea id="sammenligning" placeholder="Beskriv hvordan fravik og tiltak sammenliknes mht. brannforløp, rømningsforhold, verdier..." value={sammenligning} onChange={(e) => setSammenligning(e.target.value)} className="min-h-[100px]" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maleparametre" className="text-xs font-medium">Måleparametre</Label>
                        <Textarea id="maleparametre" placeholder="F.eks. avstand (m), rømningstid (min), branneffekt (MW), brannmotstand (min)..." value={maleparametre} onChange={(e) => setMaleparametre(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="referanser" className="text-xs font-medium">Referanser og dokumentasjon</Label>
                        <Textarea id="referanser" placeholder="Testrapporter, forskningsartikler, standarder, fagbøker..." value={referanser} onChange={(e) => setReferanser(e.target.value)} />
                      </div>
                    </div>

                    {/* Konklusjon */}
                    <div className="space-y-4">
                      <div className="border-b-2 border-foreground/20 pb-2">
                        <Label className="text-base font-extrabold text-foreground">Konklusjon – behov for videre analyse</Label>
                      </div>
                      <div className="space-y-2">
                        {[
                          { value: "tilstrekkelig" as const, label: "Kvalitativ analyse er tilstrekkelig", desc: "Beskyttelsesnivået er minst like høyt som preakseptert." },
                          { value: "komparativ" as const, label: "Behov for komparativ analyse", desc: "Tiltak virker inn på andre områder enn fraviket." },
                          { value: "risikoanalyse" as const, label: "Behov for risikoanalyse etter NS 3901", desc: "Fraviket er komplekst eller tiltak har lavere robusthet/pålitelighet." },
                        ].map(opt => (
                          <div
                            key={opt.value}
                            onClick={() => setKonklusjon(opt.value)}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                              konklusjon === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                            }`}
                          >
                            <p className="font-medium text-xs">{opt.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="begrunnelse" className="text-xs font-medium">Begrunnelse</Label>
                        <Textarea id="begrunnelse" placeholder="Begrunn konklusjonen..." value={begrunnelseKonklusjon} onChange={(e) => setBegrunnelseKonklusjon(e.target.value)} className="min-h-[80px]" />
                      </div>
                    </div>

                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card className="shadow-medium flex flex-col overflow-hidden lg:sticky lg:top-4">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Forhåndsvisning</CardTitle>
                    <CardDescription>Fraviksdokumentasjonen oppdateres i sanntid</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Last ned Word
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full max-h-[calc(100vh-280px)]">
                  <div className="px-6 pb-6">
                    <KvalitativPreview formData={formData} />
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
};

export default KvalitativAnalyse;
