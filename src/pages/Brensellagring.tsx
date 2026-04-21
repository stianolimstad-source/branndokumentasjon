import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ArrowLeft, Flame, AlertTriangle, Info, Shield, Ruler, FileText, Save,
  Droplets, ChevronDown, Cylinder, PipetteIcon, Gauge, ClipboardCheck, FolderOpen, ExternalLink, Eye, Building, Check, Plus, Search, FileDown, FilePlus2, Warehouse,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/lib/brensellagring-krav";
import BrensellagringPreview, { BRENSEL_SECTIONS, BrenselSectionKey } from "@/components/brensellagring/BrensellagringPreview";
import { Checkbox } from "@/components/ui/checkbox";

interface ProjectOption {
  id: string;
  name: string;
  address: string | null;
}

const Brensellagring = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectIdFromUrl = searchParams.get("project");
  const conceptIdFromUrl = searchParams.get("concept");
  const bygningstypeFromUrl = searchParams.get("bygningstype") as BygningsType | null;
  const { user } = useAuth();
  const { toast } = useToast();

  // Project selection (driven by URL param)
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectIdFromUrl);

  // Redirect to home if no project or document is selected
  useEffect(() => {
    if (!projectIdFromUrl && !conceptIdFromUrl) {
      navigate("/", { replace: true });
    }
  }, [projectIdFromUrl, conceptIdFromUrl, navigate]);


  // VTEK byggkrav (bygningstype kommer fra URL — valgt på forsiden)
  const [valgtBygningstype, setValgtBygningstype] = useState<BygningsType | "">(bygningstypeFromUrl || "");
  const [brenselType, setBrenselType] = useState<BrenselType | "">("");
  const [mengde, setMengde] = useState("");

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const prosjektNavn = selectedProject?.name || "";
  const adresse = selectedProject?.address || "";

  const valgtBygg = BYGNINGSTYPER.find((b) => b.id === valgtBygningstype) || null;
  const [expandedBrensel, setExpandedBrensel] = useState<string | null>(null);

  // ===== Tab-relevans per bygningstype =====
  // Bygg som typisk har tankanlegg (innendørs eller utendørs)
  const TANK_BYGG: BygningsType[] = ["verksted", "fyrrom", "tankrom", "lager"];
  // Bygg som kan utløse innmeldingsplikt til DSB
  const INNMELDING_BYGG: BygningsType[] = ["verksted", "fyrrom", "tankrom", "lager", "salgslokale", "forretning"];

  type TabKey = "beliggenhet" | "tanker" | "oppsamling" | "roer" | "kontroll" | "innmelding" | "dokumentasjon";

  const isTabRelevant = (tab: TabKey): boolean => {
    // Ingen bygg valgt → vis alt (uendret oppførsel)
    if (!valgtBygningstype) return true;
    switch (tab) {
      case "kontroll":
        return true;
      case "beliggenhet":
      case "dokumentasjon":
      case "tanker":
      case "oppsamling":
      case "roer":
        return TANK_BYGG.includes(valgtBygningstype as BygningsType);
      case "innmelding":
        return INNMELDING_BYGG.includes(valgtBygningstype as BygningsType);
      default:
        return true;
    }
  };

  const visTankBeliggenhet = !valgtBygningstype || TANK_BYGG.includes(valgtBygningstype as BygningsType);

  const [activeTab, setActiveTab] = useState<TabKey>("beliggenhet");
  // Hvis valgt fane blir irrelevant ved bytte av bygningstype → fall tilbake til beliggenhet
  useEffect(() => {
    if (!isTabRelevant(activeTab)) {
      setActiveTab("beliggenhet");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valgtBygningstype]);

  // DSB stykkgods – salgslokale
  const [salgslokaleInkludert, setSalgslokaleInkludert] = useState(false);
  const [salgslokaleKommentar, setSalgslokaleKommentar] = useState("");

  // Tankanlegg – innmelding
  const [valgtStoff, setValgtStoff] = useState("");
  const [tankMengde, setTankMengde] = useState("");

  // Section visibility for preview
  const [visibleSections, setVisibleSections] = useState<Set<BrenselSectionKey>>(
    new Set()
  );

  // Selected individual krav items per category (index-based keys like "beliggenhet_0")
  const [selectedKravIds, setSelectedKravIds] = useState<Set<string>>(new Set());

  const toggleKrav = (id: string) => {
    setSelectedKravIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isKravSelected = (id: string) => selectedKravIds.has(id);

  const KravItemButton = ({ id }: { id: string }) => {
    const selected = isKravSelected(id);
    return (
      <Button
        variant={selected ? "default" : "ghost"}
        size="sm"
        className={`h-6 w-6 p-0 shrink-0 ${selected ? "" : "text-muted-foreground hover:text-primary"}`}
        onClick={() => toggleKrav(id)}
        title={selected ? "Fjern fra dokument" : "Legg til i dokument"}
      >
        {selected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
      </Button>
    );
  };

  const toggleSection = (key: BrenselSectionKey) => {
    setVisibleSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Map tabs to document sections
  const TAB_SECTION_MAP: Record<string, { keys: BrenselSectionKey[]; label: string }> = {
    
    beliggenhet: { keys: ["avstander", "beliggenhet"], label: "Avstander & beliggenhet" },
    tanker: { keys: ["tankkrav"], label: "Tankkrav" },
    oppsamling: { keys: ["oppsamling"], label: "Oppsamling" },
    kontroll: { keys: ["kontroll"], label: "Kontroll" },
    dokumentasjon: { keys: ["dokumentasjon"], label: "Dokumentasjonskrav" },
    roer: { keys: ["konstruksjon"], label: "Konstruksjonskrav" },
  };

  const isTabInDocument = (tabKey: string) => {
    const mapping = TAB_SECTION_MAP[tabKey];
    if (!mapping) return false;
    return mapping.keys.every(k => visibleSections.has(k));
  };

  const toggleTabInDocument = (tabKey: string) => {
    const mapping = TAB_SECTION_MAP[tabKey];
    if (!mapping) return;
    setVisibleSections(prev => {
      const next = new Set(prev);
      const allIn = mapping.keys.every(k => next.has(k));
      mapping.keys.forEach(k => allIn ? next.delete(k) : next.add(k));
      return next;
    });
  };

  const DocToggleButton = ({ tabKey }: { tabKey: string }) => {
    const inDoc = isTabInDocument(tabKey);
    return (
      <Button
        variant={inDoc ? "default" : "outline"}
        size="sm"
        className="h-7 text-xs gap-1.5"
        onClick={() => toggleTabInDocument(tabKey)}
      >
        {inDoc ? <Check className="h-3.5 w-3.5" /> : <FilePlus2 className="h-3.5 w-3.5" />}
        {inDoc ? "I dokumentet" : "Legg til i dokument"}
      </Button>
    );
  };

  // Fetch projects
  useEffect(() => {
    if (user) {
      supabase
        .from('projects')
        .select('id, name, address')
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) setProjects(data as ProjectOption[]);
        });
    }
  }, [user]);

  useEffect(() => {
    if (!user || !conceptIdFromUrl) return;

    supabase
      .from('fire_concepts')
      .select('project_id, content')
      .eq('id', conceptIdFromUrl)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) return;

        const content = (data.content as {
          bygningstype?: BygningsType;
          visibleSections?: BrenselSectionKey[];
          selectedKrav?: string[];
          salgslokaleInkludert?: boolean;
          salgslokaleKommentar?: string;
          documentType?: string;
          type?: string;
        } | null) ?? null;

        if (data.project_id) {
          setSelectedProjectId(data.project_id);
        }

        if (!content || (content.documentType !== "brensellagring" && content.type !== "brensellagring")) {
          return;
        }

        setValgtBygningstype(content.bygningstype || bygningstypeFromUrl || "");
        setVisibleSections(new Set(content.visibleSections || []));
        setSelectedKravIds(new Set(content.selectedKrav || []));
        setSalgslokaleInkludert(content.salgslokaleInkludert ?? false);
        setSalgslokaleKommentar(content.salgslokaleKommentar ?? "");
      });
  }, [user, conceptIdFromUrl, bygningstypeFromUrl]);

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveDocument = async () => {
    if (!user) {
      toast({ title: "Ikke innlogget", description: "Du må være innlogget for å lagre.", variant: "destructive" });
      return;
    }
    if (!selectedProjectId) {
      toast({ title: "Mangler prosjekt", description: "Dokumentet er ikke koblet til et prosjekt. Gå tilbake til forsiden og start på nytt.", variant: "destructive" });
      return;
    }
    if (!valgtBygningstype && selectedKravIds.size === 0) {
      toast({ title: "Ingen data", description: "Velg bygningstype eller krav før du kan lagre", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const docContent = {
      type: "brensellagring",
      documentType: "brensellagring",
      bygningstype: valgtBygningstype,
      visibleSections: Array.from(visibleSections),
      selectedKrav: Array.from(selectedKravIds),
      salgslokaleInkludert,
      salgslokaleKommentar,
    };
    const docName = `Brensellagring – ${valgtBygg?.navn || valgtBygningstype}`;
    let error;
    if (conceptIdFromUrl) {
      // Update existing document
      ({ error } = await supabase
        .from('fire_concepts')
        .update({
          name: docName,
          content: docContent,
        })
        .eq('id', conceptIdFromUrl));
    } else {
      // Create new document
      ({ error } = await supabase
        .from('fire_concepts')
        .insert({
          name: docName,
          project_id: selectedProjectId,
          user_id: user.id,
          content: docContent,
          status: 'draft',
        }));
    }
    if (error) {
      toast({ title: "Feil", description: "Kunne ikke lagre dokumentet", variant: "destructive" });
    } else {
      toast({ title: "Lagret", description: `"${docName}" er lagret i prosjektet` });
    }
    setIsSaving(false);
  };

  const mengdeNum = parseFloat(mengde) || 0;
  const result = brenselType ? getBrensellagringKrav(brenselType as BrenselType, mengdeNum) : null;

  const tankMengdeNum = parseFloat(tankMengde) || 0;
  const innmeldingsStatus = valgtStoff && tankMengdeNum > 0 ? getInnmeldingsStatus(valgtStoff, tankMengdeNum) : null;
  const valgtStoffInfo = STOFF_KATALOG.find((s) => s.id === valgtStoff);

  return (
<div className="min-h-screen bg-gradient-subtle">
      <div className="w-full px-4 py-6">
        <div className="max-w-[1800px] mx-auto">
          <Button
            variant="ghost"
            size="sm"
            className="mb-3 sm:mb-4"
            onClick={() => selectedProjectId ? navigate(`/prosjekt/${selectedProjectId}`) : navigate("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Tilbake
          </Button>

          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Lagring av brannfarlig stoff</h2>
              <p className="text-muted-foreground mt-1">
                Basert på DSB Temaveiledning om oppbevaring av farlig stoff (Kapittel 1 – Atmosfæriske tanker) og VTEK § 11-8
              </p>
            </div>
            {selectedProject && (
              <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-soft">
                <Building className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{selectedProject.name}</p>
                  {selectedProject.address && (
                    <p className="text-xs text-muted-foreground truncate">{selectedProject.address}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-6 lg:h-[calc(100vh-200px)]">
            {/* ===== LEFT: All content ===== */}
            <div className="min-w-0 space-y-10 lg:overflow-y-auto lg:pr-4 lg:text-base">

          {/* Bygningstype velger */}
          <Card className="shadow-soft mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-primary" />
                Bygningstype
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Bygningstype / romtype</Label>
                <Select value={valgtBygningstype} onValueChange={(v) => { setValgtBygningstype(v as BygningsType); setExpandedBrensel(null); }}>
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

          {/* ============================================================== */}
          {/* TABS – DSB Temaveiledning innhold                               */}
          {/* ============================================================== */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="space-y-6">
            {valgtBygningstype && (
              <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-accent/30 border border-accent text-sm">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-muted-foreground">
                    Viser kun krav som er relevante for <span className="font-medium text-foreground">{valgtBygg?.navn}</span>.
                    Generelle krav (beliggenhet, kontroll, dokumentasjon) vises alltid.
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild className="shrink-0 h-8 text-xs">
                  <a href="/eksempelkatalog/brannfarlige-stoffer" target="_blank" rel="noopener noreferrer">
                    <Flame className="h-3.5 w-3.5 mr-1" />
                    Slå opp stoffdata
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </div>
            )}
            <TabsList className={`grid w-full h-auto gap-1 ${
              [isTabRelevant("beliggenhet"), isTabRelevant("tanker"), isTabRelevant("oppsamling"), isTabRelevant("roer"), isTabRelevant("kontroll"), isTabRelevant("innmelding"), isTabRelevant("dokumentasjon")].filter(Boolean).length >= 6
                ? "grid-cols-2 sm:grid-cols-4 lg:grid-cols-7"
                : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            }`}>
              {isTabRelevant("beliggenhet") && (
                <TabsTrigger value="beliggenhet" className="text-xs py-2">
                  <Ruler className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
                  Beliggenhet
                </TabsTrigger>
              )}
              {isTabRelevant("tanker") && (
                <TabsTrigger value="tanker" className="text-xs py-2">
                  <Cylinder className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
                  Tanker
                </TabsTrigger>
              )}
              {isTabRelevant("oppsamling") && (
                <TabsTrigger value="oppsamling" className="text-xs py-2">
                  <Droplets className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
                  Oppsamling
                </TabsTrigger>
              )}
              {isTabRelevant("roer") && (
                <TabsTrigger value="roer" className="text-xs py-2">
                  <PipetteIcon className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
                  Rør & ventiler
                </TabsTrigger>
              )}
              {isTabRelevant("kontroll") && (
                <TabsTrigger value="kontroll" className="text-xs py-2">
                  <Gauge className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
                  Kontroll
                </TabsTrigger>
              )}
              {isTabRelevant("innmelding") && (
                <TabsTrigger value="innmelding" className="text-xs py-2">
                  <FileText className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
                  Innmelding
                </TabsTrigger>
              )}
              {isTabRelevant("dokumentasjon") && (
                <TabsTrigger value="dokumentasjon" className="text-xs py-2">
                  <FolderOpen className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
                  Dokumentasjon
                </TabsTrigger>
              )}
            </TabsList>

            {/* ============ TAB: Beliggenhet & utforming ============ */}
            <TabsContent value="beliggenhet" className="space-y-4">
              <Card className="shadow-soft">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Ruler className="h-5 w-5 text-primary" />
                      Beliggenhet og utforming (§ 15.1)
                    </CardTitle>
                    <DocToggleButton tabKey="beliggenhet" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Krav til plassering, branngater, inngjerding og rømningsveier
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {BELIGGENHET_KRAV.map((krav, i) => (
                      <div key={i} className={`p-4 rounded-lg flex items-start gap-3 ${isKravSelected(`beliggenhet_${i}`) ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/30"}`}>
                        <KravItemButton id={`beliggenhet_${i}`} />
                        <div>
                          <h4 className="font-medium mb-1">{krav.tittel}</h4>
                          <p className="text-sm text-muted-foreground">{krav.beskrivelse}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {visTankBeliggenhet && (
              <>
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
              </>
              )}
            </TabsContent>

            {/* ============ TAB: Tanker ============ */}
            <TabsContent value="tanker" className="space-y-4">
              <Card className="shadow-soft">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Cylinder className="h-5 w-5 text-primary" />
                      Krav til tanker (§ 15.2)
                    </CardTitle>
                    <DocToggleButton tabKey="tanker" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Utførelse, fundament, korrosjonsbeskyttelse og flammesikring
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {TANK_KRAV.map((krav, i) => (
                      <div key={i} className={`p-4 rounded-lg flex items-start gap-3 ${isKravSelected(`tank_${i}`) ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/30"}`}>
                        <KravItemButton id={`tank_${i}`} />
                        <div>
                          <h4 className="font-medium mb-1">{krav.tittel}</h4>
                          <p className="text-sm text-muted-foreground">{krav.beskrivelse}</p>
                        </div>
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
                      <div key={i} className={`p-4 rounded-lg flex items-start gap-3 ${isKravSelected(`pumpe_${i}`) ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/30"}`}>
                        <KravItemButton id={`pumpe_${i}`} />
                        <div>
                          <h4 className="font-medium mb-1">{krav.tittel}</h4>
                          <p className="text-sm text-muted-foreground">{krav.beskrivelse}</p>
                        </div>
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
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Droplets className="h-5 w-5 text-blue-500" />
                      Oppsamling og overfyllingsvern (§ 15.3)
                    </CardTitle>
                    <DocToggleButton tabKey="oppsamling" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Krav til oppsamlingsbasseng, drenering, overfyllingsvarsel og oljeutskiller
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {OPPSAMLING_KRAV.map((krav, i) => (
                      <div key={i} className={`p-4 rounded-lg flex items-start gap-3 ${isKravSelected(`oppsamling_${i}`) ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/30"}`}>
                        <KravItemButton id={`oppsamling_${i}`} />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{krav.tittel}</h4>
                            {krav.paragraf && (
                              <Badge variant="outline" className="text-xs">{krav.paragraf}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{krav.beskrivelse}</p>
                        </div>
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
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <PipetteIcon className="h-5 w-5 text-primary" />
                      Rørledninger (§ 15.4)
                    </CardTitle>
                    <DocToggleButton tabKey="roer" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {ROERLEDNING_KRAV.map((krav, i) => (
                      <div key={i} className={`p-4 rounded-lg flex items-start gap-3 ${isKravSelected(`roer_${i}`) ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/30"}`}>
                        <KravItemButton id={`roer_${i}`} />
                        <div>
                          <h4 className="font-medium mb-1">{krav.tittel}</h4>
                          <p className="text-sm text-muted-foreground">{krav.beskrivelse}</p>
                        </div>
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
                      <div key={i} className={`p-4 rounded-lg flex items-start gap-3 ${isKravSelected(`ventil_${i}`) ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/30"}`}>
                        <KravItemButton id={`ventil_${i}`} />
                        <div>
                          <h4 className="font-medium mb-1">{krav.tittel}</h4>
                          <p className="text-sm text-muted-foreground">{krav.beskrivelse}</p>
                        </div>
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
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Gauge className="h-5 w-5 text-primary" />
                      Kontroll og tilstandskontroll (§ 9)
                    </CardTitle>
                    <DocToggleButton tabKey="kontroll" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Krav til kontrollintervaller og systematisk tilstandskontroll
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-center py-2.5 px-2 font-medium w-10">Dok.</th>
                          <th className="text-left py-2.5 px-3 font-medium">Kontrolltype</th>
                          <th className="text-left py-2.5 px-3 font-medium">Beskrivelse</th>
                          <th className="text-left py-2.5 px-3 font-medium w-36">Intervall</th>
                        </tr>
                      </thead>
                      <tbody>
                        {KONTROLL_KRAV.map((krav, i) => (
                          <tr key={i} className={`border-t ${isKravSelected(`kontroll_${i}`) ? "bg-primary/5" : ""}`}>
                            <td className="py-2 px-2 text-center"><KravItemButton id={`kontroll_${i}`} /></td>
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
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FolderOpen className="h-5 w-5 text-primary" />
                      Dokumentasjonskrav (§ 13)
                    </CardTitle>
                    <DocToggleButton tabKey="dokumentasjon" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Dokumentasjon som skal være tilgjengelig gjennom anleggets levetid
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-center py-2.5 px-2 font-medium w-10">Dok.</th>
                          <th className="text-left py-2.5 px-3 font-medium">Type dokumentasjon</th>
                          <th className="text-left py-2.5 px-3 font-medium w-32">Referanse</th>
                        </tr>
                      </thead>
                      <tbody>
                        {DOKUMENTASJON_KRAV.map((dok, i) => (
                          <tr key={i} className={`border-t ${isKravSelected(`dok_${i}`) ? "bg-primary/5" : ""}`}>
                            <td className="py-2 px-2 text-center"><KravItemButton id={`dok_${i}`} /></td>
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

        {/* ============================================================== */}
        {/* LAGRING I BYGNING – tillatte mengder, krav, stykkgods           */}
        {/* ============================================================== */}
        <div className="mt-10 pt-8 border-t">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h3 className="text-xl font-bold">Lagring i bygning</h3>
              <p className="text-sm text-muted-foreground">
                DSB Temaveiledning Kap. 3 (stykkgods) og VTEK § 11-8 (tanklagring)
              </p>
            </div>
          </div>

          <div className="space-y-6">

              {/* SALGSLOKALE: DSB-tabell – fast tabell, kan legges til i dokumentet */}
              {valgtBygningstype === "salgslokale" && (
                <Card className="shadow-soft">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">
                          Største tillatte mengder i salgslokaler – DSB Temaveiledning Kap. 3
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          Mengdegrensene avhenger av salgslokalets areal.
                        </p>
                      </div>
                      <Button
                        variant={salgslokaleInkludert ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs gap-1.5 shrink-0"
                        onClick={() => setSalgslokaleInkludert((v) => !v)}
                      >
                        {salgslokaleInkludert ? <Check className="h-3.5 w-3.5" /> : <FilePlus2 className="h-3.5 w-3.5" />}
                        {salgslokaleInkludert ? "I dokumentet" : "Legg til i dokument"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left py-2.5 px-3 font-medium">Salgslokalets areal</th>
                            <th className="text-left py-2.5 px-3 font-medium">Aerosoler</th>
                            <th className="text-left py-2.5 px-3 font-medium">Brannfarlig gass</th>
                            <th className="text-left py-2.5 px-3 font-medium">Br.f. væske kat. 1 og 2</th>
                            <th className="text-left py-2.5 px-3 font-medium">Br.f. væske kat. 3</th>
                          </tr>
                        </thead>
                        <tbody>
                          {STYKKGODS_GRENSER.map((g, i) => (
                            <tr key={i} className="border-t">
                              <td className="py-2 px-3">{g.arealBeskrivelse}</td>
                              <td className="py-2 px-3">{g.aerosoler} L</td>
                              <td className="py-2 px-3">{g.brannfarligGass}</td>
                              <td className="py-2 px-3">{g.brannfarligVaeskeKat1og2} L</td>
                              <td className="py-2 px-3">{g.brannfarligVaeskeKat3.toLocaleString("nb-NO")} L</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="salgslokale-kommentar" className="text-sm">
                        Kommentar (valgfritt)
                      </Label>
                      <Textarea
                        id="salgslokale-kommentar"
                        placeholder="Legg til en prosjektspesifikk kommentar som vises under tabellen i dokumentet (f.eks. faktisk areal, tiltak, avvik …)."
                        value={salgslokaleKommentar}
                        onChange={(e) => setSalgslokaleKommentar(e.target.value)}
                        className="min-h-[80px] text-sm"
                      />
                    </div>

                    {/* Vis krav-knapper per kategori */}
                    {valgtBygg && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        <span className="text-xs text-muted-foreground self-center mr-1">Konstruksjonskrav:</span>
                        {valgtBygg.grenser
                          .filter((g) => g.romKrav.length > 0 && (g.maksLiter !== null || g.maksKg))
                          .map((g) => (
                            <Button
                              key={g.brenselType}
                              variant={expandedBrensel === g.brenselType ? "default" : "outline"}
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => setExpandedBrensel(expandedBrensel === g.brenselType ? null : g.brenselType)}
                            >
                              {g.brenselNavn}
                            </Button>
                          ))}
                      </div>
                    )}

                    <div className="p-2 bg-muted/30 rounded-lg text-xs text-muted-foreground">
                      <p><strong>Kilde:</strong> DSB Temaveiledning, Kapittel 3 – Oppbevaring av brannfarlig stoff i transport- og brukeremballasje (stykkgods), § 6.</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ANDRE BYGNINGSTYPER: Standard tabell over tillatte mengder */}
              {valgtBygg && valgtBygningstype !== "salgslokale" && (
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

              {/* Utfyllende konstruksjonskrav (felles for begge tilfeller) */}
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
            </div>
          </div>

        <p className="text-xs text-muted-foreground mt-8 text-center">
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

            </div>

            {/* ===== RIGHT: Document preview (always visible) ===== */}
            <div className="hidden lg:flex lg:flex-col lg:min-w-0 lg:h-full">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-semibold text-muted-foreground">Forhåndsvisning</h4>
                </div>
                <Button
                  size="sm"
                  onClick={handleSaveDocument}
                  disabled={isSaving || !selectedProjectId || (!valgtBygningstype && selectedKravIds.size === 0 && !salgslokaleInkludert)}
                  className="h-8"
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  {isSaving ? "Lagrer..." : "Lagre"}
                </Button>
              </div>
              <div className="flex-1 min-h-0 bg-muted/30 rounded-xl p-3 overflow-auto">
                <BrensellagringPreview
                  valgtBygg={valgtBygg}
                  prosjektNavn={prosjektNavn || undefined}
                  adresse={adresse || undefined}
                  visibleSections={visibleSections}
                  selectedKravIds={selectedKravIds}
                  salgslokaleInkludert={salgslokaleInkludert && valgtBygningstype === "salgslokale"}
                  salgslokaleKommentar={salgslokaleKommentar}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Brensellagring;
