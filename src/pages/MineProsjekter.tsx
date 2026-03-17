import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FolderOpen, Search, Building } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getDefaultBuildingImage } from "@/lib/building-images";

interface Project {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

const MineProsjekter = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [projects, setProjects] = useState<Project[]>([]);
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
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Feil", description: "Kunne ikke hente prosjekter", variant: "destructive" });
    } else {
      setProjects((data || []) as Project[]);
    }
    setIsLoading(false);
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      toast({ title: "Mangler navn", description: "Vennligst skriv inn et prosjektnavn", variant: "destructive" });
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
      toast({ title: "Feil", description: "Kunne ikke opprette prosjekt", variant: "destructive" });
    } else if (data) {
      toast({ title: "Prosjekt opprettet", description: `"${newProject.name}" er nå opprettet` });
      setNewProject({ name: "", description: "", address: "" });
      setIsCreateOpen(false);
      navigate(`/prosjekt/${data.id}`);
    }
    setIsCreating(false);
  };

  if (loading) {
    return <div className="min-h-screen bg-gradient-subtle flex items-center justify-center"><p className="text-muted-foreground">Laster...</p></div>;
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold">Mine prosjekter</h2>
              <p className="text-muted-foreground mt-1">Administrer og organiser dine branntekniske prosjekter</p>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Nytt prosjekt</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Opprett nytt prosjekt</DialogTitle>
                  <DialogDescription>Fyll inn informasjon om prosjektet</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-name">Prosjektnavn *</Label>
                    <Input id="project-name" placeholder="f.eks. Nybygg Storgata 1" value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-address">Adresse</Label>
                    <Input id="project-address" placeholder="f.eks. Storgata 1, 0001 Oslo" value={newProject.address} onChange={(e) => setNewProject({ ...newProject, address: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-description">Beskrivelse</Label>
                    <Textarea id="project-description" placeholder="Kort beskrivelse av prosjektet" value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Avbryt</Button>
                  <Button onClick={handleCreateProject} disabled={isCreating}>{isCreating ? "Oppretter..." : "Opprett prosjekt"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search and Sort */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Søk etter prosjekt..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "newest" | "oldest")}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Nyeste først</SelectItem>
                <SelectItem value="oldest">Eldste først</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-12"><p className="text-muted-foreground">Laster prosjekter...</p></div>
          ) : projects.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                  <FolderOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle className="text-xl mb-2">Ingen prosjekter ennå</CardTitle>
                <CardDescription className="text-center max-w-sm mb-6">Opprett ditt første prosjekt for å komme i gang med brannteknisk dokumentasjon.</CardDescription>
                <Button onClick={() => setIsCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />Opprett prosjekt</Button>
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProjects.map((project) => (
                <Link key={project.id} to={`/prosjekt/${project.id}`} className="block group">
                  <Card className="shadow-soft hover:shadow-medium transition-all overflow-hidden h-full">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={project.image_url || defaultBuilding}
                        alt={project.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base line-clamp-1">{project.name}</CardTitle>
                      {project.address && (
                        <CardDescription className="line-clamp-1">{project.address}</CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default MineProsjekter;
