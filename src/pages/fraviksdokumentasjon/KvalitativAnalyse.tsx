import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Download, Save, ArrowLeft, Search, LogIn } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import KvalitativPreview from "@/components/fraviksdokumentasjon/KvalitativPreview";
import FravikEntryForm, { FravikEntry, emptyFravik } from "@/components/fraviksdokumentasjon/FravikEntryForm";
import { exportKvalitativWord } from "@/lib/kvalitativ-word-export";
import { useCanDownload } from "@/hooks/useCanDownload";


interface Project {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  created_at: string;
}

const KvalitativAnalyse = () => {
  const { user, loading: authLoading } = useAuth();
  const canDownload = useCanDownload();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("project");
  const conceptId = searchParams.get("concept");
  const isNew = searchParams.get("new") === "true";

  const [sammendrag, setSammendrag] = useState("");
  const [dokumentNavn, setDokumentNavn] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedConceptId, setSavedConceptId] = useState<string | null>(conceptId);
  const [fravikEntries, setFravikEntries] = useState<FravikEntry[]>([emptyFravik()]);
  const [activeFravikIndex, setActiveFravikIndex] = useState(0);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<{ full_name?: string; company?: string; title?: string; education?: string } | null>(null);
  const [projectData, setProjectData] = useState<{ name?: string; address?: string | null } | null>(null);

  // Fetch user profile (logo + info)
  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("logo_url, full_name, company, title, education").eq("id", user.id).single().then(({ data }) => {
        if (data) {
          setLogoUrl((data as any).logo_url || null);
          setProfileData({ full_name: (data as any).full_name, company: (data as any).company, title: (data as any).title, education: (data as any).education });
        }
      });
    }
  }, [user]);

  // Fetch project info
  useEffect(() => {
    if (projectId) {
      supabase.from("projects").select("name, address").eq("id", projectId).single().then(({ data }) => {
        if (data) setProjectData({ name: data.name, address: data.address });
      });
    }
  }, [projectId]);

  // Project picker dialog state
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectData, setNewProjectData] = useState({ name: "", description: "", address: "" });

  // Load existing concept
  useEffect(() => {
    if (conceptId && user) loadConcept(conceptId);
  }, [conceptId, user]);

  // Show project picker dialog when no project is selected
  useEffect(() => {
    if (user && !projectId && !authLoading) {
      loadProjects();
      setShowProjectPicker(true);
    }
  }, [user, projectId, authLoading]);

  const loadProjects = async () => {
    setLoadingProjects(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setProjects(data);
    setLoadingProjects(false);
  };

  const handleSelectProject = (project: Project) => {
    setShowProjectPicker(false);
    setSearchParams({ project: project.id }, { replace: true });
  };

  const handleCreateProject = async () => {
    if (!newProjectData.name.trim()) {
      toast({ title: "Mangler navn", description: "Vennligst skriv inn et prosjektnavn", variant: "destructive" });
      return;
    }
    setIsCreatingProject(true);
    const { data, error } = await supabase
      .from("projects")
      .insert({ name: newProjectData.name, description: newProjectData.description || null, address: newProjectData.address || null, user_id: user!.id })
      .select()
      .single();
    if (error) {
      toast({ title: "Feil", description: "Kunne ikke opprette prosjekt", variant: "destructive" });
    } else if (data) {
      toast({ title: "Prosjekt opprettet", description: `"${data.name}" er opprettet` });
      setNewProjectData({ name: "", description: "", address: "" });
      setIsCreateProjectOpen(false);
      setShowProjectPicker(false);
      setSearchParams({ project: data.id }, { replace: true });
    }
    setIsCreatingProject(false);
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
    (p.address || "").toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
    (p.description || "").toLowerCase().includes(projectSearchQuery.toLowerCase())
  );

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
      setSammendrag(c.sammendrag || "");
      // Support both old single-fravik format and new multi-fravik format
      if (c.fravikEntries && Array.isArray(c.fravikEntries)) {
        setFravikEntries(c.fravikEntries);
      } else {
        // Migrate old format to new
        setFravikEntries([{
          id: crypto.randomUUID(),
          navn: c.navn || "",
          funksjonskrav: c.funksjonskrav || "",
          preakseptertYtelse: c.preakseptertYtelse || "",
          hensiktYtelse: c.hensiktYtelse || "",
          fravikBeskrivelse: c.fravikBeskrivelse || "",
          tiltak: c.tiltak || [{ id: crypto.randomUUID(), beskrivelse: "", funksjonalitet: "", palitelighet: "", robusthet: "", vedlikehold: "", andreEffekter: "" }],
          fraviketOmrader: c.fraviketOmrader || [],
          tiltakOmrader: c.tiltakOmrader || [],
          innvirkningBeskrivelse: c.innvirkningBeskrivelse || "",
          sammenligning: c.sammenligning || "",
          maleparametre: c.maleparametre || "",
          visReferanser: c.visReferanser !== false,
          referanser: c.referanser || "",
          konklusjon: c.konklusjon || "",
          konklusjonFritekst: c.konklusjonFritekst || "",
          begrunnelseKonklusjon: c.begrunnelseKonklusjon || "",
          beregninger: c.beregninger || [],
        }]);
      }
    }
  };

  const handleSave = async () => {
    if (!user || !projectId) return;
    if (!dokumentNavn.trim()) {
      toast({ title: "Mangler navn", description: "Gi dokumentet et navn før du lagrer", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const content = JSON.parse(JSON.stringify({ fravikEntries, sammendrag, type: "kvalitativ" }));

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

  const addFravik = () => {
    setFravikEntries(prev => [...prev, emptyFravik()]);
    setActiveFravikIndex(fravikEntries.length);
  };

  const removeFravik = (index: number) => {
    if (fravikEntries.length <= 1) return;
    setFravikEntries(prev => prev.filter((_, i) => i !== index));
    setActiveFravikIndex(prev => Math.min(prev, fravikEntries.length - 2));
  };

  const updateFravik = (index: number, updated: FravikEntry) => {
    setFravikEntries(prev => prev.map((f, i) => i === index ? updated : f));
  };

  // Not logged in
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto shadow-medium">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <LogIn className="h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="text-xl mb-2">Logg inn for å fortsette</CardTitle>
              <CardDescription className="text-center mb-6">Du må være innlogget for å opprette fraviksdokumentasjon.</CardDescription>
              <Link to="/auth"><Button><LogIn className="h-4 w-4 mr-2" />Logg inn</Button></Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Always render the main form — project picker is a dialog
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/mine-prosjekter">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake
          </Link>
        </Button>
      </div>

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
                  <div className="space-y-6">
                    {/* Dokumentnavn */}
                    <div className="space-y-2">
                      <Label htmlFor="dokument-name" className="text-sm font-semibold">Navn på dokumentet *</Label>
                      <Input id="dokument-name" placeholder="f.eks. Fraviksdokumentasjon – Storgata 1" value={dokumentNavn} onChange={(e) => setDokumentNavn(e.target.value)} />
                    </div>

                    {/* Sammendrag */}
                    <div className="space-y-2">
                      <Label htmlFor="sammendrag" className="text-sm font-semibold">Sammendrag</Label>
                      <Textarea
                        id="sammendrag"
                        placeholder="Generell informasjon om fraviksdokumentasjonen..."
                        value={sammendrag}
                        onChange={(e) => setSammendrag(e.target.value)}
                        rows={4}
                      />
                    </div>

                    {/* Fravik tabs */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {fravikEntries.map((_, i) => (
                          <div key={fravikEntries[i].id} className="flex items-center">
                            <Button
                              variant={activeFravikIndex === i ? "default" : "outline"}
                              size="sm"
                              onClick={() => setActiveFravikIndex(i)}
                              className="rounded-r-none"
                            >
                              Fravik {i + 1}{fravikEntries[i].navn ? ` – ${fravikEntries[i].navn}` : ""}
                            </Button>
                            {fravikEntries.length > 1 && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant={activeFravikIndex === i ? "default" : "outline"}
                                    size="sm"
                                    className="rounded-l-none border-l-0 px-1.5"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Slette fravik {i + 1}?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Er du sikker på at du vil fjerne dette fraviket? Alle data i fraviket vil bli slettet.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => removeFravik(i)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Slett
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addFravik}>
                          <Plus className="h-3 w-3 mr-1" />
                          Legg til fravik
                        </Button>
                      </div>
                    </div>

                    {/* Active fravik form */}
                    {fravikEntries[activeFravikIndex] && (
                      <FravikEntryForm
                        key={fravikEntries[activeFravikIndex].id}
                        fravik={fravikEntries[activeFravikIndex]}
                        index={activeFravikIndex}
                        onChange={(updated) => updateFravik(activeFravikIndex, updated)}
                      />
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <div className="flex-shrink-0 border-t bg-background p-4">
                <Button className="w-full" onClick={handleSave} disabled={isSaving || !projectId || !dokumentNavn.trim()}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Lagrer..." : "Lagre"}
                </Button>
              </div>
            </Card>

            {/* Preview */}
            <Card className="shadow-medium flex flex-col overflow-hidden lg:sticky lg:top-4">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Forhåndsvisning</CardTitle>
                    <CardDescription>Fraviksdokumentasjonen oppdateres i sanntid</CardDescription>
                  </div>
                  {canDownload && (
                    <Button variant="outline" size="sm" onClick={async () => {
                      const { resolveDocumentTheme } = await import("@/lib/document-templates");
                      const theme = await resolveDocumentTheme(projectId, logoUrl, user?.id);
                      await exportKvalitativWord(fravikEntries, dokumentNavn, logoUrl, projectData, profileData, sammendrag, theme);
                    }}>
                      <Download className="h-4 w-4 mr-2" />
                      Last ned Word
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full max-h-[calc(100vh-280px)]">
                  <div className="px-6 pb-6">
                    <KvalitativPreview fravikEntries={fravikEntries} logoUrl={logoUrl} projectData={projectData} profileData={profileData} sammendrag={sammendrag} />
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>

      {/* Project picker dialog */}
      <Dialog open={showProjectPicker} onOpenChange={(open) => { if (!open && !projectId) navigate("/"); else setShowProjectPicker(open); }}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Velg prosjekt</DialogTitle>
            <DialogDescription>Knytt fraviksdokumentasjonen til et prosjekt</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Søk etter prosjekt..." value={projectSearchQuery} onChange={(e) => setProjectSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Button size="sm" onClick={() => setIsCreateProjectOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Nytt
            </Button>
          </div>
          <ScrollArea className="flex-1 max-h-[50vh] mt-3">
            {loadingProjects ? (
              <p className="text-center text-muted-foreground py-8">Laster prosjekter...</p>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">{projectSearchQuery ? "Ingen prosjekter matcher søket" : "Du har ingen prosjekter ennå"}</p>
                <Button onClick={() => setIsCreateProjectOpen(true)}><Plus className="h-4 w-4 mr-2" /> Opprett prosjekt</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProjects.map(project => (
                  <Card key={project.id} className="shadow-soft hover:shadow-medium transition-all cursor-pointer group border-l-4 border-l-transparent hover:border-l-primary" onClick={() => handleSelectProject(project)}>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm">{project.name}</CardTitle>
                      {project.address && <CardDescription className="text-xs">{project.address}</CardDescription>}
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Create project dialog */}
      <Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Opprett nytt prosjekt</DialogTitle>
            <DialogDescription>Fyll inn informasjon om prosjektet</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-project-name">Prosjektnavn *</Label>
              <Input id="new-project-name" placeholder="f.eks. Nybygg Storgata 1" value={newProjectData.name} onChange={(e) => setNewProjectData({ ...newProjectData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-project-address">Adresse</Label>
              <Input id="new-project-address" placeholder="f.eks. Storgata 1, 0001 Oslo" value={newProjectData.address} onChange={(e) => setNewProjectData({ ...newProjectData, address: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-project-desc">Beskrivelse</Label>
              <Textarea id="new-project-desc" placeholder="Kort beskrivelse" value={newProjectData.description} onChange={(e) => setNewProjectData({ ...newProjectData, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateProjectOpen(false)}>Avbryt</Button>
            <Button onClick={handleCreateProject} disabled={isCreatingProject}>{isCreatingProject ? "Oppretter..." : "Opprett"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KvalitativAnalyse;
