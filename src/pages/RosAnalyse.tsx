import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Plus, Save, Trash2, ShieldAlert, FolderOpen, FileText, Download, Lock, Search } from "lucide-react";
import RosPreview, { type RosContent, type RosHendelse } from "@/components/ros/RosPreview";
import UploadRosDialog, { type ExtractedRosData } from "@/components/ros/UploadRosDialog";
import RosMatriks, { risikoFarge } from "@/components/ros/RosMatriks";
import { exportRosToWord } from "@/lib/ros-word-export";
import { useCanDownload } from "@/hooks/useCanDownload";
import { resolveDocumentTheme } from "@/lib/document-templates";

interface ProjectOption { id: string; name: string; address: string | null; }
interface RosRow { id: string; name: string; project_id: string; updated_at: string; }

const EMPTY_CONTENT: RosContent = {
  metadata: { prosjektnavn: "", adresse: "", oppdragsgiver: "", utfortAv: "", dato: "", versjon: "1.0" },
  innledning: { bakgrunn: "", formal: "", omfang: "", avgrensninger: "" },
  hendelser: [],
  oppsummering: "",
  revisjonshistorikk: [],
};

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function RosAnalyse() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const projectFromUrl = params.get("project");
  const rosId = params.get("id");
  const isNew = params.get("new") === "true";

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [analyses, setAnalyses] = useState<RosRow[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newProjectId, setNewProjectId] = useState<string>("");
  const [content, setContent] = useState<RosContent>(EMPTY_CONTENT);
  const [currentName, setCurrentName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [exporting, setExporting] = useState(false);
  const canDownload = useCanDownload();
  const [openHendelser, setOpenHendelser] = useState<string[]>([]);
  const [hendelseSok, setHendelseSok] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [firmaNavn, setFirmaNavn] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);

  // Load profile (logo, company, name) for live preview + export
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, company, logo_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setLogoUrl((data as any).logo_url || null);
        setFirmaNavn((data as any).company || null);
        setFullName(data.full_name || null);
      });
  }, [user]);

  // Load project list + ROS list for landing
  useEffect(() => {
    if (!user) return;
    supabase.from("projects").select("id, name, address").order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setProjects(data as ProjectOption[]); });
    supabase.from("ros_analyses").select("id, name, project_id, updated_at")
      .order("updated_at", { ascending: false })
      .then(({ data }) => { if (data) setAnalyses(data as RosRow[]); });
  }, [user]);

  // Open "create new" dialog automatically when ?new=true
  useEffect(() => {
    if (isNew && !rosId) {
      setShowCreate(true);
      if (projectFromUrl) setNewProjectId(projectFromUrl);
    }
  }, [isNew, rosId, projectFromUrl]);

  // Load existing ROS analyse
  useEffect(() => {
    if (!rosId || !user) return;
    setLoadingDoc(true);
    supabase.from("ros_analyses").select("*").eq("id", rosId).maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          toast({ title: "Kunne ikke åpne ROS-analyse", variant: "destructive" });
          setLoadingDoc(false);
          return;
        }
        setCurrentName(data.name);
        const c = (data.content && typeof data.content === "object" && !Array.isArray(data.content))
          ? { ...EMPTY_CONTENT, ...(data.content as Partial<RosContent>) }
          : EMPTY_CONTENT;
        // Ensure nested defaults
        setContent({
          metadata: { ...EMPTY_CONTENT.metadata, ...(c as any).metadata },
          innledning: { ...EMPTY_CONTENT.innledning, ...(c as any).innledning },
          hendelser: Array.isArray((c as any).hendelser) ? (c as any).hendelser : [],
          oppsummering: (c as any).oppsummering ?? "",
          revisjonshistorikk: Array.isArray((c as any).revisjonshistorikk) ? (c as any).revisjonshistorikk : [],
        });
        setLoadingDoc(false);
      });
  }, [rosId, user, toast]);

  const handleCreate = async () => {
    if (!user || !newName.trim() || !newProjectId) return;
    const project = projects.find((p) => p.id === newProjectId);
    const seed: RosContent = {
      ...EMPTY_CONTENT,
      metadata: {
        ...EMPTY_CONTENT.metadata,
        prosjektnavn: project?.name ?? "",
        adresse: project?.address ?? "",
        dato: new Date().toISOString().slice(0, 10),
      },
    };
    const { data, error } = await supabase.from("ros_analyses")
      .insert({ name: newName.trim(), project_id: newProjectId, user_id: user.id, content: seed as any })
      .select("id").single();
    if (error || !data) {
      toast({ title: "Kunne ikke opprette", description: error?.message, variant: "destructive" });
      return;
    }
    setShowCreate(false);
    setNewName("");
    setNewProjectId("");
    setParams({ id: data.id });
  };

  const handleSave = async () => {
    if (!rosId) return;
    setSaving(true);
    const { error } = await supabase.from("ros_analyses")
      .update({ content: content as any, name: currentName })
      .eq("id", rosId);
    setSaving(false);
    if (error) {
      toast({ title: "Lagring feilet", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lagret" });
    }
  };

  const handleDelete = async () => {
    if (!rosId) return;
    const { error } = await supabase.from("ros_analyses").delete().eq("id", rosId);
    if (error) {
      toast({ title: "Sletting feilet", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Slettet" });
    navigate("/ros-analyse");
  };

  const handleExportWord = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, company, logo_url")
        .eq("id", user.id)
        .maybeSingle();
      const projectId = analyses.find((a) => a.id === rosId)?.project_id ?? null;
      const logoUrl = (profile as any)?.logo_url || null;
      const theme = await resolveDocumentTheme(projectId, logoUrl, user.id);
      await exportRosToWord({
        analyseName: currentName || "ROS-analyse",
        content,
        sender: {
          full_name: profile?.full_name || null,
          email: profile?.email || null,
          company: (profile as any)?.company || null,
        },
        logoUrl,
        theme,
      });
      toast({ title: "Lastet ned", description: "ROS-analysen er lastet ned som Word-fil" });
    } catch (e: any) {
      toast({ title: "Eksport feilet", description: e?.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };
  // ----- Hendelser -----
  const updateHendelse = (id: string, patch: Partial<RosHendelse>) => {
    setContent((c) => ({
      ...c,
      hendelser: c.hendelser.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    }));
  };
  const addHendelse = () => {
    const id = makeId();
    setContent((c) => ({
      ...c,
      hendelser: [...c.hendelser, {
        id, tittel: "", beskrivelse: "", arsak: "",
        sannsynlighet: 1, konsekvens: 1, tiltak: "", restrisiko: "",
      }],
    }));
    setOpenHendelser((o) => [...o, id]);
  };
  const removeHendelse = (id: string) => {
    setContent((c) => ({ ...c, hendelser: c.hendelser.filter((h) => h.id !== id) }));
    setOpenHendelser((o) => o.filter((x) => x !== id));
  };
  const importHendelser = (data: ExtractedRosData, mode: "append" | "replace") => {
    const nye: RosHendelse[] = data.hendelser.map((h) => ({ ...h, id: makeId() }));
    setContent((c) => ({
      ...c,
      metadata: {
        ...c.metadata,
        prosjektnavn: c.metadata.prosjektnavn || data.metadata.prosjektnavn || "",
        adresse: c.metadata.adresse || data.metadata.adresse || "",
        oppdragsgiver: c.metadata.oppdragsgiver || data.metadata.oppdragsgiver || "",
      },
      hendelser: mode === "replace" ? nye : [...c.hendelser, ...nye],
    }));
    setOpenHendelser([]);
  };

  // ----- Revisjon -----
  const addRevisjon = () => {
    setContent((c) => ({
      ...c,
      revisjonshistorikk: [
        ...c.revisjonshistorikk,
        { versjon: c.metadata.versjon || "1.0", dato: new Date().toISOString().slice(0, 10), utfortAv: "", endring: "" },
      ],
    }));
  };
  const updateRevisjon = (i: number, patch: Partial<typeof content.revisjonshistorikk[number]>) => {
    setContent((c) => ({
      ...c,
      revisjonshistorikk: c.revisjonshistorikk.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    }));
  };
  const removeRevisjon = (i: number) => {
    setContent((c) => ({ ...c, revisjonshistorikk: c.revisjonshistorikk.filter((_, idx) => idx !== i) }));
  };

  const projectName = useMemo(() => {
    const pid = analyses.find((a) => a.id === rosId)?.project_id;
    return projects.find((p) => p.id === pid)?.name;
  }, [analyses, projects, rosId]);

  // ============ LANDING ============
  if (!rosId) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4 mr-1" /> Tilbake
              </Link>
              <h1 className="text-2xl font-bold mt-2 flex items-center gap-2">
                <ShieldAlert className="h-6 w-6 text-primary" /> ROS-analyse
              </h1>
              <p className="text-sm text-muted-foreground">Brannrelatert risiko- og sårbarhetsanalyse (5×5).</p>
            </div>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" /> Ny ROS-analyse
            </Button>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3">Mine ROS-analyser</h2>
            {analyses.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
                Ingen ROS-analyser ennå. Klikk «Ny ROS-analyse» for å starte.
              </CardContent></Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {analyses.map((a) => {
                  const proj = projects.find((p) => p.id === a.project_id);
                  return (
                    <Card key={a.id} className="hover:shadow-medium transition-shadow cursor-pointer"
                      onClick={() => setParams({ id: a.id })}>
                      <CardHeader>
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-2">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-base">{a.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{proj?.name ?? "Ukjent prosjekt"}</p>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <CreateDialog
            open={showCreate}
            onOpenChange={setShowCreate}
            projects={projects}
            newName={newName}
            setNewName={setNewName}
            newProjectId={newProjectId}
            setNewProjectId={setNewProjectId}
            onCreate={handleCreate}
          />
        </div>
      </div>
    );
  }

  // ============ EDITOR ============
  if (loadingDoc) {
    return <div className="container mx-auto p-8 text-sm text-muted-foreground">Laster…</div>;
  }
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b sticky top-[65px] z-30 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="sm" onClick={() => navigate("/ros-analyse")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Mine ROS-analyser
            </Button>
            <Input
              value={currentName}
              onChange={(e) => setCurrentName(e.target.value)}
              className="h-8 max-w-xs"
            />
            {projectName && <span className="text-xs text-muted-foreground hidden md:inline">· {projectName}</span>}
          </div>
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Slette ROS-analyse?</AlertDialogTitle>
                  <AlertDialogDescription>Dette kan ikke angres.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Slett</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportWord}
              disabled={exporting || !canDownload}
              title={canDownload ? "Last ned som Word" : "Krever aktivt abonnement"}
            >
              {canDownload ? <Download className="h-4 w-4 mr-1" /> : <Lock className="h-4 w-4 mr-1" />}
              {exporting ? "Eksporterer…" : "Word"}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-1" /> {saving ? "Lagrer…" : "Lagre"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-0">
        {/* INPUT */}
        <div className="border-r p-6 space-y-8 overflow-y-auto">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Metadata</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prosjektnavn" value={content.metadata.prosjektnavn}
                onChange={(v) => setContent((c) => ({ ...c, metadata: { ...c.metadata, prosjektnavn: v } }))} />
              <Field label="Adresse" value={content.metadata.adresse}
                onChange={(v) => setContent((c) => ({ ...c, metadata: { ...c.metadata, adresse: v } }))} />
              <Field label="Oppdragsgiver" value={content.metadata.oppdragsgiver}
                onChange={(v) => setContent((c) => ({ ...c, metadata: { ...c.metadata, oppdragsgiver: v } }))} />
              <Field label="Utført av" value={content.metadata.utfortAv}
                onChange={(v) => setContent((c) => ({ ...c, metadata: { ...c.metadata, utfortAv: v } }))} />
              <Field label="Dato" type="date" value={content.metadata.dato}
                onChange={(v) => setContent((c) => ({ ...c, metadata: { ...c.metadata, dato: v } }))} />
              <Field label="Versjon" value={content.metadata.versjon}
                onChange={(v) => setContent((c) => ({ ...c, metadata: { ...c.metadata, versjon: v } }))} />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">1. Innledning</h2>
            <Area label="Bakgrunn" value={content.innledning.bakgrunn}
              onChange={(v) => setContent((c) => ({ ...c, innledning: { ...c.innledning, bakgrunn: v } }))} />
            <Area label="Formål" value={content.innledning.formal}
              onChange={(v) => setContent((c) => ({ ...c, innledning: { ...c.innledning, formal: v } }))} />
            <Area label="Omfang" value={content.innledning.omfang}
              onChange={(v) => setContent((c) => ({ ...c, innledning: { ...c.innledning, omfang: v } }))} />
            <Area label="Avgrensninger" value={content.innledning.avgrensninger}
              onChange={(v) => setContent((c) => ({ ...c, innledning: { ...c.innledning, avgrensninger: v } }))} />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">2. Metode</h2>
            <p className="text-xs text-muted-foreground">
              5×5-matrisen er forhåndsdefinert. Skalaer for sannsynlighet og konsekvens vises i forhåndsvisningen.
            </p>
            <div className="rounded-lg border p-4 bg-muted/30">
              <RosMatriks size="sm" />
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-semibold">3. Hendelser</h2>
              <div className="flex items-center gap-2">
                <UploadRosDialog onApply={importHendelser} />
                <Button size="sm" variant="outline" onClick={addHendelse}>
                  <Plus className="h-4 w-4 mr-1" /> Ny hendelse
                </Button>
              </div>
            </div>
            {content.hendelser.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Ingen hendelser ennå.</p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={hendelseSok}
                      onChange={(e) => setHendelseSok(e.target.value)}
                      placeholder="Søk i hendelser…"
                      className="h-8 pl-7 text-xs"
                    />
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 text-xs"
                    onClick={() => setOpenHendelser(content.hendelser.map((h) => h.id))}>
                    Utvid alle
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 text-xs"
                    onClick={() => setOpenHendelser([])}>
                    Lukk alle
                  </Button>
                  <span className="text-xs text-muted-foreground ml-auto">{content.hendelser.length} hendelser</span>
                </div>
                <Accordion type="multiple" value={openHendelser} onValueChange={setOpenHendelser} className="space-y-2">
                  {content.hendelser.map((h, idx) => {
                    const farge = risikoFarge(h.sannsynlighet, h.konsekvens);
                    const cls = farge === "rod" ? "bg-red-500/85 text-white"
                      : farge === "gul" ? "bg-amber-400/90 text-foreground"
                      : "bg-emerald-500/80 text-white";
                    const sok = hendelseSok.trim().toLowerCase();
                    if (sok && !`${h.tittel} ${h.beskrivelse} ${h.arsak}`.toLowerCase().includes(sok)) return null;
                    return (
                      <AccordionItem key={h.id} value={h.id} className="border rounded-lg px-3 border-b">
                        <div className="flex items-center gap-2">
                          <AccordionTrigger className="flex-1 py-2 hover:no-underline">
                            <div className="flex items-center gap-2 flex-1 min-w-0 text-left">
                              <span className="text-xs font-medium text-muted-foreground shrink-0">#{idx + 1}</span>
                              <span className="truncate text-sm font-medium">
                                {h.tittel || <span className="italic text-muted-foreground">Uten tittel</span>}
                              </span>
                              <span className={`ml-auto rounded px-2 py-0.5 text-xs font-semibold shrink-0 ${cls}`}>
                                {h.sannsynlighet}×{h.konsekvens} = {h.sannsynlighet * h.konsekvens}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-destructive shrink-0"
                            onClick={(e) => { e.stopPropagation(); removeHendelse(h.id); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <AccordionContent className="pt-2 space-y-2">
                          <Field label="Tittel" value={h.tittel} onChange={(v) => updateHendelse(h.id, { tittel: v })} />
                          <Area label="Beskrivelse" value={h.beskrivelse} onChange={(v) => updateHendelse(h.id, { beskrivelse: v })} rows={2} />
                          <Area label="Årsak" value={h.arsak} onChange={(v) => updateHendelse(h.id, { arsak: v })} rows={2} />
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Sannsynlighet (1–5)</Label>
                              <Select value={String(h.sannsynlighet)} onValueChange={(v) => updateHendelse(h.id, { sannsynlighet: Number(v) })}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {[1,2,3,4,5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Konsekvens (1–5)</Label>
                              <Select value={String(h.konsekvens)} onValueChange={(v) => updateHendelse(h.id, { konsekvens: Number(v) })}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {[1,2,3,4,5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <Area label="Tiltak" value={h.tiltak} onChange={(v) => updateHendelse(h.id, { tiltak: v })} rows={2} />
                          <Area label="Restrisiko" value={h.restrisiko} onChange={(v) => updateHendelse(h.id, { restrisiko: v })} rows={2} />
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </>
            )}
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">4. Oppsummering</h2>
            <Textarea value={content.oppsummering} rows={6}
              onChange={(e) => setContent((c) => ({ ...c, oppsummering: e.target.value }))} />
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">5. Revisjonshistorikk</h2>
              <Button size="sm" variant="outline" onClick={addRevisjon}>
                <Plus className="h-4 w-4 mr-1" /> Ny revisjon
              </Button>
            </div>
            {content.revisjonshistorikk.length === 0 && (
              <p className="text-sm text-muted-foreground italic">Ingen revisjoner ennå.</p>
            )}
            <div className="space-y-3">
              {content.revisjonshistorikk.map((r, i) => (
                <div key={i} className="border rounded-lg p-3 space-y-2">
                  <div className="flex justify-end">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeRevisjon(i)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Field label="Versjon" value={r.versjon} onChange={(v) => updateRevisjon(i, { versjon: v })} />
                    <Field label="Dato" type="date" value={r.dato} onChange={(v) => updateRevisjon(i, { dato: v })} />
                    <Field label="Utførende" value={r.utfortAv} onChange={(v) => updateRevisjon(i, { utfortAv: v })} />
                  </div>
                  <Area label="Endring" value={r.endring} onChange={(v) => updateRevisjon(i, { endring: v })} rows={2} />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* PREVIEW */}
        <div className="bg-muted/20 overflow-y-auto">
          <RosPreview content={content} logoUrl={logoUrl} firmaNavn={firmaNavn} utarbeidetAv={content.metadata.utfortAv || fullName || ""} />
        </div>
      </div>
    </div>
  );
}

// ----- Small input helpers -----
function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input value={value} type={type} onChange={(e) => onChange(e.target.value)} className="h-9" />
    </div>
  );
}
function Area({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Textarea value={value} rows={rows} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

// ----- Create dialog -----
function CreateDialog({
  open, onOpenChange, projects, newName, setNewName, newProjectId, setNewProjectId, onCreate,
}: {
  open: boolean; onOpenChange: (o: boolean) => void;
  projects: ProjectOption[];
  newName: string; setNewName: (s: string) => void;
  newProjectId: string; setNewProjectId: (s: string) => void;
  onCreate: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ny ROS-analyse</DialogTitle>
          <DialogDescription>ROS-analysen knyttes til et eksisterende prosjekt.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Navn *</Label>
            <Input placeholder="f.eks. ROS-analyse brann – Storgata 1" value={newName} onChange={(e) => setNewName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Prosjekt *</Label>
            <Select value={newProjectId} onValueChange={setNewProjectId}>
              <SelectTrigger><SelectValue placeholder="Velg prosjekt" /></SelectTrigger>
              <SelectContent>
                {projects.length === 0 ? (
                  <div className="px-2 py-3 text-xs text-muted-foreground">
                    Ingen prosjekter. Opprett et i <Link to="/mine-prosjekter" className="underline">Mine prosjekter</Link>.
                  </div>
                ) : projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={onCreate} disabled={!newName.trim() || !newProjectId}>
            <FolderOpen className="h-4 w-4 mr-1" /> Opprett
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
