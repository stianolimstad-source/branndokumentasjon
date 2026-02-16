import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flame, Plus, FolderOpen, ArrowLeft, FileText, Trash2, Building, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

interface FireConcept {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

const MineProsjekter = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [conceptsByProject, setConceptsByProject] = useState<Record<string, FireConcept[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    address: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const filteredProjects = useMemo(() => {
    let result = projects.filter((p) => {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.address?.toLowerCase().includes(q) ?? false) ||
        (p.description?.toLowerCase().includes(q) ?? false)
      );
    });
    result.sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? db - da : da - db;
    });
    return result;
  }, [projects, searchQuery, sortOrder]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    setIsLoading(true);
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (projectsError) {
      toast({
        title: "Feil",
        description: "Kunne ikke hente prosjekter",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    setProjects(projectsData || []);

    // Fetch concepts for each project
    if (projectsData && projectsData.length > 0) {
      const { data: conceptsData, error: conceptsError } = await supabase
        .from('fire_concepts')
        .select('id, name, status, created_at, project_id')
        .in('project_id', projectsData.map(p => p.id))
        .order('created_at', { ascending: false });

      if (!conceptsError && conceptsData) {
        const grouped: Record<string, FireConcept[]> = {};
        conceptsData.forEach((concept: any) => {
          if (!grouped[concept.project_id]) {
            grouped[concept.project_id] = [];
          }
          grouped[concept.project_id].push(concept);
        });
        setConceptsByProject(grouped);
      }
    }

    setIsLoading(false);
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      toast({
        title: "Mangler navn",
        description: "Vennligst skriv inn et prosjektnavn",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    const { error } = await supabase
      .from('projects')
      .insert({
        name: newProject.name,
        description: newProject.description || null,
        address: newProject.address || null,
        user_id: user!.id,
      });

    if (error) {
      toast({
        title: "Feil",
        description: "Kunne ikke opprette prosjekt",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Prosjekt opprettet",
        description: `"${newProject.name}" er nå opprettet`,
      });
      setNewProject({ name: "", description: "", address: "" });
      setIsCreateOpen(false);
      fetchProjects();
    }
    setIsCreating(false);
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Er du sikker på at du vil slette "${projectName}"? Alle brannkonsepter i prosjektet vil også bli slettet.`)) {
      return;
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      toast({
        title: "Feil",
        description: "Kunne ikke slette prosjekt",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Prosjekt slettet",
        description: `"${projectName}" er slettet`,
      });
      fetchProjects();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <p className="text-muted-foreground">Laster...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link to="/" className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                  <Flame className="h-6 w-6 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold">BrannRådgiver Pro</h1>
              </Link>
            </div>
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tilbake
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold">Mine prosjekter</h2>
              <p className="text-muted-foreground mt-1">
                Administrer og organiser dine branntekniske prosjekter
              </p>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nytt prosjekt
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Opprett nytt prosjekt</DialogTitle>
                  <DialogDescription>
                    Fyll inn informasjon om prosjektet
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-name">Prosjektnavn *</Label>
                    <Input
                      id="project-name"
                      placeholder="f.eks. Nybygg Storgata 1"
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-address">Adresse</Label>
                    <Input
                      id="project-address"
                      placeholder="f.eks. Storgata 1, 0001 Oslo"
                      value={newProject.address}
                      onChange={(e) => setNewProject({ ...newProject, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-description">Beskrivelse</Label>
                    <Textarea
                      id="project-description"
                      placeholder="Kort beskrivelse av prosjektet"
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Avbryt
                  </Button>
                  <Button onClick={handleCreateProject} disabled={isCreating}>
                    {isCreating ? "Oppretter..." : "Opprett prosjekt"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search and Sort */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søk etter prosjekt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "newest" | "oldest")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Nyeste først</SelectItem>
                <SelectItem value="oldest">Eldste først</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Laster prosjekter...</p>
            </div>
          ) : projects.length === 0 ? (
            /* Empty State */
            <Card className="shadow-soft">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                  <FolderOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle className="text-xl mb-2">Ingen prosjekter ennå</CardTitle>
                <CardDescription className="text-center max-w-sm mb-6">
                  Opprett ditt første prosjekt for å komme i gang med brannteknisk dokumentasjon.
                </CardDescription>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Opprett prosjekt
                </Button>
              </CardContent>
            </Card>
          ) : filteredProjects.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Ingen prosjekter matcher søket ditt</p>
              </CardContent>
            </Card>
          ) : (
            /* Projects List */
            <div className="space-y-4">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="shadow-soft hover:shadow-medium transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mt-1">
                          <Building className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          {project.address && (
                            <p className="text-sm text-muted-foreground">{project.address}</p>
                          )}
                          {project.description && (
                            <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteProject(project.id, project.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>
                          {conceptsByProject[project.id]?.length || 0} brannkonsept
                          {(conceptsByProject[project.id]?.length || 0) !== 1 ? "er" : ""}
                        </span>
                      </div>
                      <Link to={`/konsept?project=${project.id}`}>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Nytt brannkonsept
                        </Button>
                      </Link>
                    </div>
                    
                    {conceptsByProject[project.id] && conceptsByProject[project.id].length > 0 && (
                      <div className="mt-4 space-y-2">
                        {conceptsByProject[project.id].map((concept) => (
                          <div
                            key={concept.id}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">{concept.name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                concept.status === 'draft' 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {concept.status === 'draft' ? 'Utkast' : 'Ferdig'}
                              </span>
                            </div>
                            <Link to={`/konsept?project=${project.id}&concept=${concept.id}`}>
                              <Button variant="ghost" size="sm">
                                Åpne
                              </Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default MineProsjekter;
