import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Calculator, FileText, BookOpen, ClipboardCheck, FileWarning, Plus, FolderOpen, ShieldCheck, ShieldAlert, BarChart3, GitCompare, Shield, LayoutDashboard, Warehouse, Receipt, Handshake, Building, Search, Check, ArrowLeft, Lock, Info } from "lucide-react";
import { useIsFullAccess } from "@/hooks/useIsFullAccess";
import { BYGNINGSTYPER } from "@/lib/brensellagring-krav";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import KundeHjem from "@/pages/KundeHjem";
import { useSubscription } from "@/hooks/useSubscription";
import DashboardPanel from "@/components/dashboard/DashboardPanel";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProjectOption { id: string; name: string; address: string | null; }

const Index = () => {
  const { user, loading } = useAuth();
  const { isCustomer, loading: roleLoading } = useUserRole();
  const { isActive: isSubActive } = useSubscription();
  const navigate = useNavigate();

  const { toast } = useToast();
  const [showConceptDialog, setShowConceptDialog] = useState(false);
  const [showTilstandDialog, setShowTilstandDialog] = useState(false);
  const [showFravikDialog, setShowFravikDialog] = useState(false);
  const [showBrensellagringDialog, setShowBrensellagringDialog] = useState(false);

  // Project picker state for Brensellagring
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "", address: "" });
  useEffect(() => {
    if (!user || !showBrensellagringDialog) return;
    supabase
      .from("projects")
      .select("id, name, address")
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setProjects(data as ProjectOption[]); });
  }, [user, showBrensellagringDialog]);

  useEffect(() => {
    if (!showBrensellagringDialog) setProjectSearchQuery("");
  }, [showBrensellagringDialog]);

  const handleSelectProjectForBrensel = (projectId: string) => {
    setShowBrensellagringDialog(false);
    navigate(`/brensellagring?project=${projectId}`);
  };

  const handleCreateProjectAndOpen = async () => {
    if (!newProject.name.trim() || !user) return;
    setIsCreatingProject(true);
    const { data, error } = await supabase
      .from("projects")
      .insert({ name: newProject.name, description: newProject.description || null, address: newProject.address || null, user_id: user.id })
      .select("id, name, address")
      .single();
    if (error) {
      toast({ title: "Feil", description: "Kunne ikke opprette prosjekt", variant: "destructive" });
    } else if (data) {
      setNewProject({ name: "", description: "", address: "" });
      setIsCreateProjectOpen(false);
      setShowBrensellagringDialog(false);
      navigate(`/brensellagring?project=${data.id}`);
    }
    setIsCreatingProject(false);
  };


  const features = [
    {
      icon: FileText,
      title: "Brannkonsepter",
      description: "Generer profesjonelle brannkonsepter basert på prosjektdata",
      href: "dialog",
    },
    {
      icon: Calculator,
      title: "Beregningsverktøy",
      description: "Interaktive verktøy for rømning, røyk og brannlast",
      href: "/verktoy",
    },
    {
      icon: ClipboardCheck,
      title: "Tilstandsvurdering",
      description: "Lag rapporter og risikoanalyser med bilder",
      href: "tilstand-dialog",
    },
    {
      icon: FileWarning,
      title: "Fraviksdokumentasjon",
      description: "Generer formelle fraviksanalyser og tiltak",
      href: "fravik-dialog",
    },
    {
      icon: ShieldAlert,
      title: "ROS-analyse",
      description: "Brannrelatert risiko- og sårbarhetsanalyse (5×5)",
      href: "/mine-prosjekter",
    },
    {
      icon: Warehouse,
      title: "Brannfarlig lagring",
      description: "Krav til lagring av brennbar væske basert på type og mengde",
      href: "brensellagring-dialog",
    },
    {
      icon: Receipt,
      title: "Tilbud",
      description: "Lag og eksporter profesjonelle pristilbud til kunder",
      href: "/tilbud",
      locked: true,
    },
    {
      icon: Handshake,
      title: "Oppdragsbekreftelse",
      description: "Lag formelle oppdragsbekreftelser med omfang og vilkår",
      href: "/oppdragsbekreftelse",
      locked: true,
    },
    {
      icon: ShieldCheck,
      title: "Sikkerhetsrutiner",
      description: "Rutiner og maler for kvalitetssikring ved prosjektering",
      href: "/sikkerhetsrutiner",
      locked: true,
    },
    {
      icon: BookOpen,
      title: "Eksempelkatalog",
      description: "Bibliotek med løsninger og konstruksjoner",
      href: "/eksempelkatalog",
      locked: true,
    },
  ] as const;

  const isFullAccess = useIsFullAccess();

  if (user && roleLoading) {
    return <div className="min-h-screen bg-gradient-subtle flex items-center justify-center"><p className="text-muted-foreground">Laster...</p></div>;
  }
  if (user && isCustomer) {
    return <KundeHjem />;
  }
  const handleBytt = () => {
    localStorage.removeItem("branndok_selected_role");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle overflow-x-hidden">
      {!user && (
        <div className="container mx-auto px-4 pt-6">
          <button
            onClick={handleBytt}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Tilbake til rollevalg
          </button>
        </div>
      )}

      {/* Hero / Dashboard Section */}
      <section className="container mx-auto px-3 sm:px-4 py-8 sm:py-16">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-2xl sm:text-3xl font-bold">Velkommen tilbake</h2>
              <Link to="/dashboard" className="self-start sm:self-auto">
                <Button variant="outline" size="sm">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Fullt dashboard
                </Button>
              </Link>
            </div>
            <DashboardPanel />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-balance">
              Ditt komplette branntekniske dokumentasjonsverktøy
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground">
              Komplett verktøykasse for konsepter, vurderinger og beregninger. 
              Spar tid og forbedre kvaliteten på dine leveranser.
            </p>
            <div className="pt-2">
              <Link to="/om">
                <Button variant="outline" size="sm">
                  <Info className="h-4 w-4 mr-2" />
                  Mer info
                </Button>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-3 sm:px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => {
            if (feature.href === "dialog" || feature.href === "fravik-dialog" || feature.href === "tilstand-dialog" || feature.href === "brensellagring-dialog") {
              const handleClick = () => {
                if (feature.href === "dialog") {
                  if (!isSubActive) { navigate("/konsept"); return; }
                  setShowConceptDialog(true);
                }
                else if (feature.href === "tilstand-dialog") {
                  if (!isSubActive) { navigate("/tilstandsvurdering"); return; }
                  setShowTilstandDialog(true);
                }
                else if (feature.href === "brensellagring-dialog") {
                  if (!isSubActive) { navigate("/brensellagring"); return; }
                  setShowBrensellagringDialog(true);
                }
                else {
                  if (!isSubActive) { navigate("/fraviksdokumentasjon/kvalitativ"); return; }
                  setShowFravikDialog(true);
                }
              };
              return (
                <Card
                  key={feature.title}
                  className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer group"
                  onClick={handleClick}
                >
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            }
            const isLocked = (feature as any).locked && !isFullAccess;
            if (isLocked) {
              return (
                <Card
                  key={feature.title}
                  className="shadow-soft relative overflow-hidden opacity-75 cursor-not-allowed"
                  title="Under utvikling – tilgang begrenset"
                >
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-4">
                      <feature.icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-muted-foreground">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 backdrop-blur-[1px]">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background border shadow-medium">
                      <Lock className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <p className="mt-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Under utvikling</p>
                  </div>
                </Card>
              );
            }
            return (
              <Link key={feature.title} to={feature.href} className="block">
                <Card className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer group">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
        <div className="max-w-6xl mx-auto mt-8 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30">
          <p className="text-sm text-amber-800 dark:text-amber-200 text-center">
            <strong>Merk:</strong> Dette verktøyet er under utvikling. Alle dokumenter og beregninger som genereres kan inneholde feil og må kontrolleres og godkjennes av personer med tilstrekkelig kompetanse.
          </p>
        </div>
      </section>

      {/* Brannkonsept choice dialog */}
      <Dialog open={showConceptDialog} onOpenChange={setShowConceptDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Brannkonsepter</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <Button
              size="lg"
              className="justify-start h-auto py-4 px-5"
              onClick={() => { setShowConceptDialog(false); navigate("/konsept?new=true"); }}
            >
              <Plus className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Start nytt brannkonsept</p>
                <p className="text-sm text-primary-foreground/70 font-normal">Opprett et nytt konsept for et prosjekt</p>
              </div>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="justify-start h-auto py-4 px-5"
              onClick={() => { setShowConceptDialog(false); navigate("/mine-prosjekter"); }}
            >
              <FolderOpen className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Mine prosjekter</p>
                <p className="text-sm text-muted-foreground font-normal">Se og rediger eksisterende brannkonsepter</p>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tilstandsvurdering choice dialog */}
      <Dialog open={showTilstandDialog} onOpenChange={setShowTilstandDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tilstandsvurdering</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <Button
              size="lg"
              className="justify-start h-auto py-4 px-5"
              onClick={() => { setShowTilstandDialog(false); navigate("/tilstandsvurdering?new=true"); }}
            >
              <Plus className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Start ny tilstandsvurdering</p>
                <p className="text-sm text-primary-foreground/70 font-normal">Opprett en ny vurdering for et prosjekt</p>
              </div>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="justify-start h-auto py-4 px-5"
              onClick={() => { setShowTilstandDialog(false); navigate("/mine-prosjekter"); }}
            >
              <FolderOpen className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Mine prosjekter</p>
                <p className="text-sm text-muted-foreground font-normal">Se og rediger eksisterende tilstandsvurderinger</p>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Brensellagring – velg prosjekt */}
      <Dialog open={showBrensellagringDialog} onOpenChange={setShowBrensellagringDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Velg prosjekt</DialogTitle>
            <DialogDescription>Lagring av brannfarlig stoff knyttes til et prosjekt</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søk prosjekt..."
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Plus className="h-4 w-4 mr-1" />Nytt
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Opprett nytt prosjekt</DialogTitle>
                    <DialogDescription>Fyll inn informasjon om prosjektet</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Prosjektnavn *</Label>
                      <Input placeholder="f.eks. Nybygg Storgata 1" value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Adresse</Label>
                      <Input placeholder="f.eks. Storgata 1, 0001 Oslo" value={newProject.address} onChange={(e) => setNewProject({ ...newProject, address: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Beskrivelse</Label>
                      <Textarea placeholder="Kort beskrivelse" value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateProjectOpen(false)}>Avbryt</Button>
                    <Button onClick={handleCreateProjectAndOpen} disabled={isCreatingProject}>{isCreatingProject ? "Oppretter..." : "Opprett og åpne"}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="max-h-[320px] overflow-y-auto space-y-1.5 pr-1">
              {projects
                .filter(p => {
                  if (!projectSearchQuery.trim()) return true;
                  const q = projectSearchQuery.toLowerCase();
                  return p.name.toLowerCase().includes(q) || (p.address?.toLowerCase().includes(q) ?? false);
                })
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProjectForBrensel(p.id)}
                    className="flex items-center gap-2.5 w-full text-left rounded-lg border p-2.5 transition-colors hover:bg-accent/50 border-border"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Building className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      {p.address && <p className="text-xs text-muted-foreground truncate">{p.address}</p>}
                    </div>
                  </button>
                ))}
              {projects.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">Ingen prosjekter ennå. Opprett ett med "Nytt".</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showFravikDialog} onOpenChange={setShowFravikDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Velg type fraviksvurdering</DialogTitle>
            <DialogDescription>Velg metode for fraviksdokumentasjonen</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => { setShowFravikDialog(false); navigate("/fraviksdokumentasjon/kvalitativ?new=true"); }}
            >
              <CardHeader className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-orange-500" />
                  <div>
                    <CardTitle className="text-sm">Kvalitativ analyse</CardTitle>
                    <CardDescription className="text-xs">Vurdering basert på faglig skjønn og erfaring</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:border-primary transition-colors opacity-60">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <GitCompare className="h-5 w-5 text-blue-500" />
                  <div>
                    <CardTitle className="text-sm">Komparativ analyse</CardTitle>
                    <CardDescription className="text-xs">Sammenligning med preaksepterte ytelser – Kommer snart</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:border-primary transition-colors opacity-60">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <div>
                    <CardTitle className="text-sm">Analyse etter NS 3921</CardTitle>
                    <CardDescription className="text-xs">Risikobasert analyse iht. norsk standard – Kommer snart</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* News Section Placeholder */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold mb-6">Nyheter og oppdateringer</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <a href="https://brennaktuelt.no" target="_blank" rel="noopener noreferrer" className="block">
              <Card className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer group">
                <CardHeader>
                  <CardDescription>brennaktuelt.no</CardDescription>
                  <CardTitle className="text-lg">Branntekniske nyheter</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Siste nytt om regelverk, produkter og bransjeoppdateringer fra Brennaktuelt.
                  </p>
                </CardContent>
              </Card>
            </a>
            <Card className="shadow-soft">
              <CardHeader>
                <CardDescription>Kommer snart</CardDescription>
                <CardTitle className="text-lg">Produktinformasjon</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Oversikt over godkjente produkter og løsninger for brannsikkerhet.
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardHeader>
                <CardDescription>Kommer snart</CardDescription>
                <CardTitle className="text-lg">Regelverksendringer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Oppdateringer om TEK, VTEK og andre relevante forskrifter.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="text-center md:text-left space-y-1">
              <p className="font-medium text-foreground">Olimstad Brannrådgivning AS</p>
              <p>Utviklet av Stian Olimstad</p>
            </div>
            <div className="flex flex-col items-center md:items-end gap-1">
              <a href="mailto:stian.olimstad@olimstadbrannrådgivning.no" className="hover:text-foreground transition-colors">
                stian.olimstad@olimstadbrannrådgivning.no
              </a>
              <a href="tel:+4790701285" className="hover:text-foreground transition-colors">
                907 01 285
              </a>
              <a href="https://www.linkedin.com/in/stian-olimstad-86863121a/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                LinkedIn
              </a>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-4 text-xs text-muted-foreground">
            <Link to="/vilkar" className="hover:text-foreground transition-colors">Vilkår</Link>
            <span>·</span>
            <Link to="/refusjon" className="hover:text-foreground transition-colors">Refusjonspolicy</Link>
            <span>·</span>
            <Link to="/personvern" className="hover:text-foreground transition-colors">Personvern</Link>
            <span>·</span>
            <Link to="/abonnement" className="hover:text-foreground transition-colors">Abonnement</Link>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">Branndokumentasjon.no – Regelverksforankret dokumentasjon for brannsikkerhet</p>
        </div>
      </footer>

    </div>
  );
};

export default Index;
