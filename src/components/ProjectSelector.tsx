import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Plus, AlertCircle, FolderOpen, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";

interface Project {
  id: string;
  name: string;
  address: string | null;
}

interface ExistingConcept {
  id: string;
  name: string;
  status: string;
  updated_at: string;
}

interface ProjectSelectorProps {
  selectedProjectId: string | null;
  onProjectSelect: (projectId: string) => void;
  onConceptNameChange: (name: string) => void;
  onConceptSelect?: (conceptId: string, projectId: string) => void;
  conceptName: string;
}

export const ProjectSelector = ({
  selectedProjectId,
  onProjectSelect,
  onConceptNameChange,
  onConceptSelect,
  conceptName,
}: ProjectSelectorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [existingConcepts, setExistingConcepts] = useState<ExistingConcept[]>([]);
  const [showConceptChoice, setShowConceptChoice] = useState(false);
  const [choiceMade, setChoiceMade] = useState(false);
  
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    address: "",
  });

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, address')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Feil",
        description: "Kunne ikke hente prosjekter",
        variant: "destructive",
      });
    } else {
      setProjects(data || []);
    }
    setIsLoading(false);
  };

  const handleProjectSelect = async (projectId: string) => {
    setChoiceMade(false);
    setShowConceptChoice(false);
    onProjectSelect(projectId);

    // Check for existing concepts
    const { data, error } = await supabase
      .from('fire_concepts')
      .select('id, name, status, updated_at')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false });

    if (!error && data && data.length > 0) {
      setExistingConcepts(data);
      setShowConceptChoice(true);
    } else {
      setExistingConcepts([]);
      setShowConceptChoice(false);
      setChoiceMade(true);
    }
  };

  const handleGoToExisting = () => {
    if (existingConcepts.length > 0 && selectedProjectId) {
      const mostRecent = existingConcepts[0];
      setShowConceptChoice(false);
      if (onConceptSelect) {
        onConceptSelect(mostRecent.id, selectedProjectId);
      } else {
        navigate(`/konsept?project=${selectedProjectId}&concept=${mostRecent.id}`);
      }
    }
  };

  const handleStartNew = () => {
    setShowConceptChoice(false);
    setChoiceMade(true);
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
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: newProject.name,
        description: newProject.description || null,
        address: newProject.address || null,
        user_id: user!.id,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Feil",
        description: "Kunne ikke opprette prosjekt",
        variant: "destructive",
      });
    } else if (data) {
      toast({
        title: "Prosjekt opprettet",
        description: `"${newProject.name}" er nå opprettet`,
      });
      setNewProject({ name: "", description: "", address: "" });
      setIsCreateOpen(false);
      fetchProjects();
      onProjectSelect(data.id);
      setChoiceMade(true);
    }
    setIsCreating(false);
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  if (isLoading) {
    return (
      <Card className="shadow-soft">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Laster prosjekter...</p>
        </CardContent>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card className="shadow-soft border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
            <FolderOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg mb-2">Ingen prosjekter</CardTitle>
          <CardDescription className="text-center max-w-sm mb-4">
            Du må opprette et prosjekt før du kan lage brannkonsepter.
          </CardDescription>
          <div className="flex gap-2">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Opprett prosjekt
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
            <Link to="/mine-prosjekter">
              <Button variant="outline">
                Gå til Mine prosjekter
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft mb-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Velg prosjekt</CardTitle>
        </div>
        <CardDescription>
          Brannkonseptet vil bli lagret under valgt prosjekt
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Select value={selectedProjectId || ""} onValueChange={handleProjectSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Velg et prosjekt" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <span>{project.name}</span>
                      {project.address && (
                        <span className="text-muted-foreground text-xs">
                          - {project.address}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Nytt
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
                  <Label htmlFor="new-project-name">Prosjektnavn *</Label>
                  <Input
                    id="new-project-name"
                    placeholder="f.eks. Nybygg Storgata 1"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-project-address">Adresse</Label>
                  <Input
                    id="new-project-address"
                    placeholder="f.eks. Storgata 1, 0001 Oslo"
                    value={newProject.address}
                    onChange={(e) => setNewProject({ ...newProject, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-project-description">Beskrivelse</Label>
                  <Textarea
                    id="new-project-description"
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

        {/* Popup dialog when project has existing concepts */}
        <AlertDialog open={showConceptChoice && !!selectedProjectId} onOpenChange={(open) => {
          if (!open) {
            setShowConceptChoice(false);
            setChoiceMade(true);
          }
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eksisterende brannkonsept funnet</AlertDialogTitle>
              <AlertDialogDescription>
                Dette prosjektet har {existingConcepts.length} eksisterende brannkonsept{existingConcepts.length !== 1 ? "er" : ""}:
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-1.5 py-2">
              {existingConcepts.map((concept) => (
                <div key={concept.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <span>{concept.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    concept.status === 'draft' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {concept.status === 'draft' ? 'Utkast' : 'Ferdig'}
                  </span>
                </div>
              ))}
            </div>
            <AlertDialogFooter>
              <Button variant="outline" onClick={handleStartNew}>
                <Plus className="h-4 w-4 mr-2" />
                Start nytt brannkonsept
              </Button>
              <Button onClick={handleGoToExisting}>
                <FileText className="h-4 w-4 mr-2" />
                Åpne siste konsept
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {selectedProjectId && choiceMade && (
          <div className="space-y-2">
            <Label htmlFor="concept-name">Navn på brannkonseptet *</Label>
            <Input
              id="concept-name"
              placeholder="f.eks. Brannkonsept rev. A"
              value={conceptName}
              onChange={(e) => onConceptNameChange(e.target.value)}
            />
          </div>
        )}

        {selectedProject && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-primary" />
              <span className="font-medium">{selectedProject.name}</span>
            </div>
            {selectedProject.address && (
              <p className="text-sm text-muted-foreground mt-1">{selectedProject.address}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
