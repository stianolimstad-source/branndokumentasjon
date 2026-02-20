import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileWarning, BarChart3, GitCompare, BookOpen, LogIn, Search, Plus } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";

const analyseTyper = [
  {
    id: "kvalitativ",
    icon: BarChart3,
    title: "Kvalitativ analyse",
    description: "Enklere fraviksanalyse basert på faglig skjønn og kvalitative vurderinger. Egnet for mindre komplekse fravik der risikoen vurderes som lav.",
    detaljer: "Vurdering av fravikets art, kompenserende tiltak, og påvirkningsområder uten formelle beregninger.",
    href: "/fraviksdokumentasjon/kvalitativ",
  },
  {
    id: "komparativ",
    icon: GitCompare,
    title: "Komparativ analyse",
    description: "Sammenligning av den valgte løsningen opp mot preaksepterte ytelser. Dokumenterer at sikkerheten er minst like god.",
    detaljer: "Systematisk sammenstilling av fraviket opp mot referanseløsningen med vurdering av likeverdighet.",
    href: "/fraviksdokumentasjon/komparativ",
  },
  {
    id: "ns3921",
    icon: BookOpen,
    title: "Analyse etter NS 3921",
    description: "Fullstendig risikoanalyse i henhold til NS 3921. Kreves for mer komplekse fravik, typisk i tiltaksklasse 3 og brannklasse 4.",
    detaljer: "Strukturert risikovurdering med identifikasjon av farer, sannsynlighet, konsekvens og risikomatrise.",
    href: "/fraviksdokumentasjon/ns3921",
  },
];

interface Project {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  created_at: string;
}

const Fraviksdokumentasjon = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const selectedProjectId = searchParams.get("project");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Create project dialog
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(searchParams.get("new") === "true");
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectData, setNewProjectData] = useState({ name: "", description: "", address: "" });

  useEffect(() => {
    if (user) loadProjects();
  }, [user]);

  useEffect(() => {
    if (selectedProjectId && projects.length > 0) {
      const found = projects.find(p => p.id === selectedProjectId);
      if (found) setSelectedProject(found);
    }
  }, [selectedProjectId, projects]);

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
    setSelectedProject(project);
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
      setSelectedProject(data);
      setProjects(prev => [data, ...prev]);
      setNewProjectData({ name: "", description: "", address: "" });
      setIsCreateProjectOpen(false);
      setSearchParams({ project: data.id }, { replace: true });
    }
    setIsCreatingProject(false);
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.address || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Not logged in
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <PageHeader title="Fraviksdokumentasjon" subtitle="Velg analysemetode for fraviket" icon={<FileWarning className="h-6 w-6 text-primary-foreground" />} />
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

  // No project selected — show project picker
  if (!selectedProject) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <PageHeader title="Fraviksdokumentasjon" subtitle="Velg eller opprett prosjekt" icon={<FileWarning className="h-6 w-6 text-primary-foreground" />} />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Velg prosjekt</h2>
              <p className="text-muted-foreground">Knytt fraviksdokumentasjonen til et eksisterende prosjekt, eller opprett et nytt.</p>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Søk etter prosjekt..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
              <Button onClick={() => setIsCreateProjectOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Nytt prosjekt
              </Button>
            </div>

            {loadingProjects ? (
              <p className="text-center text-muted-foreground py-8">Laster prosjekter...</p>
            ) : filteredProjects.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="flex flex-col items-center py-12">
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? "Ingen prosjekter matcher søket" : "Du har ingen prosjekter ennå"}
                  </p>
                  <Button onClick={() => setIsCreateProjectOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Opprett prosjekt
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map(project => (
                  <Card
                    key={project.id}
                    className="shadow-soft hover:shadow-medium transition-all cursor-pointer group border-l-4 border-l-transparent hover:border-l-primary"
                    onClick={() => handleSelectProject(project)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{project.name}</CardTitle>
                      {project.address && <CardDescription className="text-xs">{project.address}</CardDescription>}
                    </CardHeader>
                    {project.description && (
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Create Project Dialog */}
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
                  <Textarea id="new-project-desc" placeholder="Kort beskrivelse av prosjektet" value={newProjectData.description} onChange={(e) => setNewProjectData({ ...newProjectData, description: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateProjectOpen(false)}>Avbryt</Button>
                <Button onClick={handleCreateProject} disabled={isCreatingProject}>{isCreatingProject ? "Oppretter..." : "Opprett"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    );
  }

  // Project selected — show analysis type picker
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <PageHeader
        title="Fraviksdokumentasjon"
        subtitle={`Prosjekt: ${selectedProject.name}`}
        icon={<FileWarning className="h-6 w-6 text-primary-foreground" />}
        rightContent={
          <Button variant="outline" size="sm" onClick={() => { setSelectedProject(null); searchParams.delete("project"); setSearchParams(searchParams, { replace: true }); }}>
            Bytt prosjekt
          </Button>
        }
      />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Velg type analyse</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Valg av analysemetode avhenger av fravikets kompleksitet, tiltaksklasse og brannklasse.
            </p>
          </div>

          <div className="grid gap-6">
            {analyseTyper.map((type) => (
              <Link key={type.id} to={`${type.href}?project=${selectedProject.id}`} className="block">
                <Card className="shadow-soft hover:shadow-medium transition-all cursor-pointer group border-l-4 border-l-transparent hover:border-l-primary">
                  <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <type.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{type.title}</CardTitle>
                      <CardDescription>{type.description}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pl-[4.5rem]">
                    <p className="text-sm text-muted-foreground">{type.detaljer}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Fraviksdokumentasjon;
