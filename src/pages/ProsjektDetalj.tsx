import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Trash2, Building, Users, User, Share2, CheckCircle2, Clock, ClipboardCheck, FileWarning, ArrowLeft, ImagePlus, BarChart3, GitCompare, Shield } from "lucide-react";
import ShareProjectDialog from "@/components/prosjekt/ShareProjectDialog";
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

interface FireConcept {
  id: string;
  name: string;
  status: string;
  created_at: string;
  contentType?: string;
}

interface ShareInfo {
  id: string;
  group_id: string | null;
  contact_id: string | null;
  group_name?: string;
  contact_name?: string;
}

interface KSStatus {
  total: number;
  completed: number;
  hasFeil: boolean;
}

const TOTAL_KS_SECTIONS = 24;

const ProsjektDetalj = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [concepts, setConcepts] = useState<FireConcept[]>([]);
  const [shares, setShares] = useState<ShareInfo[]>([]);
  const [ksStatus, setKsStatus] = useState<Record<string, KSStatus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [primaryBygningstype, setPrimaryBygningstype] = useState<string | null>(null);
  const [showFravikPicker, setShowFravikPicker] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && id) fetchProject();
  }, [user, id]);

  const fetchProject = async () => {
    setIsLoading(true);
    const { data: proj, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id!)
      .single();

    if (error || !proj) {
      toast({ title: "Feil", description: "Kunne ikke hente prosjekt", variant: "destructive" });
      navigate('/mine-prosjekter');
      return;
    }
    setProject(proj as Project);

    const [conceptsRes, sharesRes] = await Promise.all([
      supabase.from('fire_concepts').select('id, name, status, created_at, project_id, content').eq('project_id', id!).order('created_at', { ascending: false }),
      supabase.from('project_shares').select('id, project_id, group_id, contact_id').eq('project_id', id!),
    ]);

    if (!conceptsRes.error && conceptsRes.data) {
      const mapped: FireConcept[] = conceptsRes.data.map((c: any) => ({
        ...c,
        contentType: c.content?.type || c.content?.documentType || undefined,
      }));
      setConcepts(mapped);
      
      // Get primary building type for default image
      const firstWithType = conceptsRes.data.find((c: any) => c.content?.bygningstype);
      if (firstWithType) setPrimaryBygningstype((firstWithType as any).content.bygningstype);

      const conceptIds = mapped.map(c => c.id);
      if (conceptIds.length > 0) {
        const { data: ksData } = await supabase
          .from('qa_checkpoints')
          .select('concept_id, status')
          .in('concept_id', conceptIds)
          .eq('review_type', 'sidemannskontroll');
        if (ksData) {
          const statusMap: Record<string, KSStatus> = {};
          ksData.forEach((cp: any) => {
            if (!statusMap[cp.concept_id]) statusMap[cp.concept_id] = { total: 0, completed: 0, hasFeil: false };
            statusMap[cp.concept_id].total++;
            if (cp.status !== 'pending') statusMap[cp.concept_id].completed++;
            if (cp.status === 'feil') statusMap[cp.concept_id].hasFeil = true;
          });
          setKsStatus(statusMap);
        }
      }
    }

    if (!sharesRes.error && sharesRes.data && sharesRes.data.length > 0) {
      const groupIds = [...new Set(sharesRes.data.filter(s => s.group_id).map(s => s.group_id!))];
      const contactIds = [...new Set(sharesRes.data.filter(s => s.contact_id).map(s => s.contact_id!))];
      const [groupsRes, contactsRes] = await Promise.all([
        groupIds.length > 0 ? supabase.from('contact_groups').select('id, name').in('id', groupIds) : Promise.resolve({ data: [] as any[] }),
        contactIds.length > 0 ? supabase.from('contacts').select('id, name').in('id', contactIds) : Promise.resolve({ data: [] as any[] }),
      ]);
      const groupMap = new Map((groupsRes.data || []).map((g: any) => [g.id, g.name]));
      const contactMap = new Map((contactsRes.data || []).map((c: any) => [c.id, c.name]));
      setShares(sharesRes.data.map((s: any) => ({
        ...s,
        group_name: s.group_id ? groupMap.get(s.group_id) : undefined,
        contact_name: s.contact_id ? contactMap.get(s.contact_id) : undefined,
      })));
    } else {
      setShares([]);
    }

    setIsLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !project) return;
    setIsUploading(true);

    const ext = file.name.split('.').pop();
    const path = `${project.id}/cover.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('tilstandsvurdering-images')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Feil", description: "Kunne ikke laste opp bilde", variant: "destructive" });
      setIsUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('tilstandsvurdering-images').getPublicUrl(path);
    const imageUrl = urlData.publicUrl + `?t=${Date.now()}`;

    await supabase.from('projects').update({ image_url: imageUrl }).eq('id', project.id);
    setProject({ ...project, image_url: imageUrl });
    setIsUploading(false);
    toast({ title: "Bilde oppdatert", description: "Prosjektbildet er lastet opp" });
  };

  const handleDeleteConcept = async (conceptId: string, conceptName: string) => {
    const { error } = await supabase.from('fire_concepts').delete().eq('id', conceptId);
    if (error) {
      toast({ title: "Feil", description: "Kunne ikke slette", variant: "destructive" });
    } else {
      toast({ title: "Slettet", description: `"${conceptName}" er slettet` });
      fetchProject();
    }
  };

  if (loading || isLoading) {
    return <div className="min-h-screen bg-gradient-subtle flex items-center justify-center"><p className="text-muted-foreground">Laster...</p></div>;
  }
  if (!user || !project) return null;

  const brannkonsepter = concepts.filter(c => !c.contentType || c.contentType === "brannkonsept");
  const tilstandsvurderinger = concepts.filter(c => c.contentType === "tilstandsvurdering");
  const fraviksdokumenter = concepts.filter(c => c.contentType === "kvalitativ" || c.contentType === "komparativ" || c.contentType === "risikoanalyse");
  const brensellagringDocs = concepts.filter(c => c.contentType === "brensellagring");

  const ConceptRow = ({ concept, icon: Icon, iconColor, linkTo }: { concept: FireConcept; icon: any; iconColor: string; linkTo: string }) => {
    const ks = ksStatus[concept.id];
    const ksComplete = ks && ks.completed >= TOTAL_KS_SECTIONS;
    const ksStarted = ks && ks.total > 0;
    return (
      <div className="flex items-center justify-between gap-2 p-2 sm:p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0 flex-1">
          <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 ${iconColor}`} />
          <span className="text-xs sm:text-sm font-medium truncate">{concept.name}</span>
          <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded whitespace-nowrap ${concept.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
            {concept.status === 'draft' ? 'Utkast' : 'Ferdig'}
          </span>
          {concept.contentType && !["brannkonsept", "tilstandsvurdering"].includes(concept.contentType) && (
            <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded bg-orange-100 text-orange-800 capitalize whitespace-nowrap">{concept.contentType}</span>
          )}
          {ksComplete ? (
            <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700 text-white text-[10px] sm:text-xs"><CheckCircle2 className="h-3 w-3" />KS</Badge>
          ) : ksStarted ? (
            <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 text-[10px] sm:text-xs"><Clock className="h-3 w-3" />{ks.completed}/{TOTAL_KS_SECTIONS}</Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <Link to={linkTo}><Button variant="ghost" size="sm" className="h-7 px-2 text-xs sm:h-8 sm:px-3 sm:text-sm">Åpne</Button></Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="mx-4 max-w-[calc(100vw-2rem)]">
              <AlertDialogHeader>
                <AlertDialogTitle>Slette "{concept.name}"?</AlertDialogTitle>
                <AlertDialogDescription>Denne handlingen kan ikke angres.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDeleteConcept(concept.id, concept.name)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Slett</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <section className="container mx-auto px-3 sm:px-4 py-4 sm:py-12">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" size="sm" className="mb-3 sm:mb-4" onClick={() => navigate('/mine-prosjekter')}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Tilbake
          </Button>

          {/* Project header with image */}
          <Card className="shadow-soft mb-4 sm:mb-6">
            <div className="relative">
              <img
                src={project.image_url || getDefaultBuildingImage(primaryBygningstype)}
                alt={project.name}
                className="w-full h-32 sm:h-48 object-cover rounded-t-lg"
              />
              <label className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                <Button size="sm" variant="secondary" className="pointer-events-none text-xs sm:text-sm" asChild={false}>
                  <span className="flex items-center gap-1.5">
                    <ImagePlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {isUploading ? "Laster opp..." : "Endre bilde"}
                  </span>
                </Button>
              </label>
            </div>
            <CardHeader className="p-3 sm:p-6">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg sm:text-2xl truncate">{project.name}</CardTitle>
                  {project.address && <p className="text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1 truncate">{project.address}</p>}
                  {project.description && <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">{project.description}</p>}
                </div>
                <ShareProjectDialog projectId={project.id} projectName={project.name} />
              </div>
            </CardHeader>
          </Card>

          {/* Brannkonsepter */}
          <Card className="shadow-soft mb-3 sm:mb-4">
            <CardHeader className="p-3 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <CardTitle className="text-sm sm:text-lg truncate">Brannkonsepter ({brannkonsepter.length})</CardTitle>
                </div>
                <Link to={`/konsept?project=${project.id}`}>
                  <Button size="sm" className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3 whitespace-nowrap"><Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />Nytt</Button>
                </Link>
              </div>
            </CardHeader>
            {brannkonsepter.length > 0 && (
              <CardContent className="space-y-2 px-3 sm:px-6 pb-3 sm:pb-6 pt-0">
                {brannkonsepter.map(c => (
                  <ConceptRow key={c.id} concept={c} icon={FileText} iconColor="text-primary" linkTo={`/konsept?project=${project.id}&concept=${c.id}`} />
                ))}
              </CardContent>
            )}
          </Card>

          {/* Tilstandsvurderinger */}
          <Card className="shadow-soft mb-3 sm:mb-4">
            <CardHeader className="p-3 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 flex-shrink-0" />
                  <CardTitle className="text-sm sm:text-lg truncate">Tilstandsvurderinger ({tilstandsvurderinger.length})</CardTitle>
                </div>
                <Link to={`/tilstandsvurdering?project=${project.id}`}>
                  <Button size="sm" variant="outline" className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3 whitespace-nowrap"><Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />Ny</Button>
                </Link>
              </div>
            </CardHeader>
            {tilstandsvurderinger.length > 0 && (
              <CardContent className="space-y-2 px-3 sm:px-6 pb-3 sm:pb-6 pt-0">
                {tilstandsvurderinger.map(c => (
                  <ConceptRow key={c.id} concept={c} icon={ClipboardCheck} iconColor="text-amber-600" linkTo={`/tilstandsvurdering?project=${project.id}&concept=${c.id}`} />
                ))}
              </CardContent>
            )}
          </Card>

          {/* Fraviksdokumenter */}
          <Card className="shadow-soft mb-3 sm:mb-4">
            <CardHeader className="p-3 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <FileWarning className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 flex-shrink-0" />
                  <CardTitle className="text-sm sm:text-lg truncate">Fraviksdokumenter ({fraviksdokumenter.length})</CardTitle>
                </div>
                <Button size="sm" variant="outline" className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3 whitespace-nowrap" onClick={() => setShowFravikPicker(true)}><Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />Nytt</Button>
              </div>
            </CardHeader>
            {fraviksdokumenter.length > 0 && (
              <CardContent className="space-y-2 px-3 sm:px-6 pb-3 sm:pb-6 pt-0">
                {fraviksdokumenter.map(c => (
                  <ConceptRow key={c.id} concept={c} icon={FileWarning} iconColor="text-orange-500" linkTo={`/fraviksdokumentasjon/${c.contentType}?project=${project.id}&concept=${c.id}`} />
                ))}
              </CardContent>
            )}
          </Card>

          {/* Shares */}
          {shares.length > 0 && (
            <Card className="shadow-soft">
              <CardHeader className="p-3 sm:p-6">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Share2 className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  <CardTitle className="text-sm sm:text-lg">Delt med</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6 pt-0">
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {shares.map(share => (
                    <span key={share.id} className="inline-flex items-center gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-primary/10 text-primary">
                      {share.group_id ? <Users className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      {share.group_name || share.contact_name}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Fraviksvurdering type picker */}
      <Dialog open={showFravikPicker} onOpenChange={setShowFravikPicker}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Velg type fraviksvurdering</DialogTitle>
            <DialogDescription>Velg metode for fraviksdokumentasjonen</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => {
                setShowFravikPicker(false);
                navigate(`/fraviksdokumentasjon/kvalitativ?project=${project.id}&new=true`);
              }}
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
            <Card
              className="cursor-pointer hover:border-primary transition-colors opacity-60"
              onClick={() => {
                toast({ title: "Kommer snart", description: "Komparativ analyse er under utvikling" });
              }}
            >
              <CardHeader className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <GitCompare className="h-5 w-5 text-blue-500" />
                  <div>
                    <CardTitle className="text-sm">Komparativ analyse</CardTitle>
                    <CardDescription className="text-xs">Sammenligning med preaksepterte ytelser</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
            <Card
              className="cursor-pointer hover:border-primary transition-colors opacity-60"
              onClick={() => {
                toast({ title: "Kommer snart", description: "Analyse etter NS 3921 er under utvikling" });
              }}
            >
              <CardHeader className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <div>
                    <CardTitle className="text-sm">Analyse etter NS 3921</CardTitle>
                    <CardDescription className="text-xs">Risikobasert analyse iht. norsk standard</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProsjektDetalj;
