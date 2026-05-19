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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { KONSEKVENS_FORSLAG, groupKonsekvenserByKategori } from "@/lib/ros-konsekvenser";
import { ArrowLeft, Plus, Save, Trash2, ShieldAlert, FolderOpen, FileText, Download, Lock, Search, Sparkles, Check, GitBranch, X, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import RosPreview, { type RosContent, type RosHendelse, type RosBowTie } from "@/components/ros/RosPreview";
import UploadRosDialog, { type ExtractedRosData } from "@/components/ros/UploadRosDialog";
import RosMatriks, { risikoFarge } from "@/components/ros/RosMatriks";
import { exportRosToWord } from "@/lib/ros-word-export";
import { useCanDownload } from "@/hooks/useCanDownload";
import { resolveDocumentTheme } from "@/lib/document-templates";
import rosNivaaIllustrasjon from "@/assets/ros-detaljeringsnivaa.jpg";

interface ProjectOption { id: string; name: string; address: string | null; }
interface RosRow { id: string; name: string; project_id: string; updated_at: string; }

const EMPTY_CONTENT: RosContent = {
  metadata: { prosjektnavn: "", adresse: "", oppdragsgiver: "", utfortAv: "", dato: "", versjon: "1.0" },
  innledning: { bakgrunn: "", formal: "", omfang: "", avgrensninger: "" },
  metode: { informasjonsinnhenting: "", organisering: "", deltakere: [], skjemaOgSjekklister: "" },
  hendelser: [],
  bowTies: [],
  oppsummering: "",
  revisjonshistorikk: [],
};

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function JumpToPreview({ previewId }: { previewId: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        const el = document.getElementById(previewId);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
      title="Gå til i forhåndsvisning"
      aria-label="Gå til i forhåndsvisning"
    >
      <Eye className="h-3.5 w-3.5" />
    </button>
  );
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
  const [projectId, setProjectId] = useState<string | null>(null);
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

  // Load project list (for create dialog)
  useEffect(() => {
    if (!user) return;
    supabase.from("projects").select("id, name, address").order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setProjects(data as ProjectOption[]); });
  }, [user]);

  // Redirect when no analysis is selected and we're not in create mode
  useEffect(() => {
    if (!user) return;
    if (!rosId && !isNew) {
      navigate("/mine-prosjekter", { replace: true });
    }
  }, [user, rosId, isNew, navigate]);

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
        setProjectId((data as any).project_id ?? null);
        const c = (data.content && typeof data.content === "object" && !Array.isArray(data.content))
          ? { ...EMPTY_CONTENT, ...(data.content as Partial<RosContent>) }
          : EMPTY_CONTENT;
        // Ensure nested defaults
        setContent({
          metadata: { ...EMPTY_CONTENT.metadata, ...(c as any).metadata },
          innledning: { ...EMPTY_CONTENT.innledning, ...(c as any).innledning },
          metode: { ...EMPTY_CONTENT.metode, ...((c as any).metode || {}) },
          hendelser: Array.isArray((c as any).hendelser)
            ? (c as any).hendelser.map((h: any) => ({
                ...h,
                hendelse: h.hendelse || h.beskrivelse || "",
                sarbarhet: h.sarbarhet || "",
                beskrivelseSannsynlighetFor: h.beskrivelseSannsynlighetFor || "",
                beskrivelseRisikoFor: h.beskrivelseRisikoFor || "",
                beskrivelseEtter: h.beskrivelseEtter || "",
                sannsynlighetEtter: h.sannsynlighetEtter ?? h.sannsynlighet ?? 1,
                konsekvensEtter: h.konsekvensEtter ?? h.konsekvens ?? 1,
              }))
            : [],
          oppsummering: (c as any).oppsummering ?? "",
          revisjonshistorikk: Array.isArray((c as any).revisjonshistorikk) ? (c as any).revisjonshistorikk : [],
          bowTies: Array.isArray((c as any).bowTies)
            ? (c as any).bowTies.map((b: any) => ({
                id: b.id || Math.random().toString(36).slice(2, 10),
                navn: String(b.navn || ""),
                beskrivelse: String(b.beskrivelse || ""),
                hendelseIds: Array.isArray(b.hendelseIds) ? b.hendelseIds.filter((x: any) => typeof x === "string") : [],
                konsekvenser: Array.isArray(b.konsekvenser) ? b.konsekvenser.map((x: any) => String(x)) : [],
                fellesBarrierer: String(b.fellesBarrierer || ""),
                felleseBarrierer: Array.isArray(b.felleseBarrierer)
                  ? b.felleseBarrierer
                      .map((x: any) => ({
                        tekst: String(x?.tekst || "").trim(),
                        arsakIds: Array.isArray(x?.arsakIds) ? x.arsakIds.map((y: any) => String(y)) : [],
                        kilde: x?.kilde === "ai" ? "ai" : "manuell",
                      }))
                      .filter((x: any) => x.tekst)
                  : [],
                konsekvensReduserende: Array.isArray(b.konsekvensReduserende)
                  ? b.konsekvensReduserende
                      .map((x: any) => ({
                        tekst: String(x?.tekst || "").trim(),
                        konsekvensIndekser: Array.isArray(x?.konsekvensIndekser)
                          ? x.konsekvensIndekser
                              .map((y: any) => Number(y))
                              .filter((y: number) => Number.isInteger(y) && y >= 0)
                          : [],
                        kilde: x?.kilde === "ai" ? "ai" : "manuell",
                      }))
                      .filter((x: any) => x.tekst)
                  : [],
              }))
            : [],
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
    setProjectId(newProjectId);
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
    navigate(projectId ? `/prosjekt/${projectId}` : "/mine-prosjekter");
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
        id, tittel: "",
        sarbarhet: "", hendelse: "", arsak: "",
        beskrivelseSannsynlighetFor: "", beskrivelseRisikoFor: "",
        sannsynlighet: 1, konsekvens: 1,
        tiltak: "",
        beskrivelseEtter: "",
        sannsynlighetEtter: 1, konsekvensEtter: 1,
        restrisiko: "",
      }],
    }));
    setOpenHendelser((o) => [...o, id]);
  };
  const removeHendelse = (id: string) => {
    setContent((c) => ({
      ...c,
      hendelser: c.hendelser.filter((h) => h.id !== id),
      bowTies: (c.bowTies || []).map((b) => ({
        ...b,
        hendelseIds: b.hendelseIds.filter((hid) => hid !== id),
        felleseBarrierer: (b.felleseBarrierer || [])
          .map((fb) => ({ ...fb, arsakIds: fb.arsakIds.filter((x) => x !== id) }))
          .filter((fb) => fb.arsakIds.length >= 2),
      })),
    }));
    setOpenHendelser((o) => o.filter((x) => x !== id));
  };

  // ----- Bow-tie -----
  const addBowTie = () => {
    const id = makeId();
    setContent((c) => ({
      ...c,
      bowTies: [
        ...(c.bowTies || []),
        { id, navn: "", beskrivelse: "", hendelseIds: [], konsekvenser: [], fellesBarrierer: "", felleseBarrierer: [], konsekvensReduserende: [] },
      ],
    }));
  };
  const updateBowTie = (id: string, patch: Partial<RosBowTie>) => {
    setContent((c) => ({
      ...c,
      bowTies: (c.bowTies || []).map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  };
  const removeBowTie = (id: string) => {
    setContent((c) => ({ ...c, bowTies: (c.bowTies || []).filter((b) => b.id !== id) }));
  };
  const toggleBowTieHendelse = (bowTieId: string, hendelseId: string) => {
    setContent((c) => ({
      ...c,
      bowTies: (c.bowTies || []).map((b) => {
        if (b.id !== bowTieId) return b;
        const exists = b.hendelseIds.includes(hendelseId);
        const nyeIds = exists
          ? b.hendelseIds.filter((x) => x !== hendelseId)
          : [...b.hendelseIds, hendelseId];
        // Hold AI-barrierer i synk når årsaker fjernes
        const nyeBarrierer = (b.felleseBarrierer || [])
          .map((fb) => ({ ...fb, arsakIds: fb.arsakIds.filter((x) => nyeIds.includes(x)) }))
          .filter((fb) => fb.arsakIds.length >= 2);
        return { ...b, hendelseIds: nyeIds, felleseBarrierer: nyeBarrierer };
      }),
    }));
  };

  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [newFellesTekst, setNewFellesTekst] = useState<Record<string, string>>({});
  const [newFellesArsaker, setNewFellesArsaker] = useState<Record<string, string[]>>({});

  const analyzeBarrierer = async (bt: RosBowTie) => {
    const arsaker = bt.hendelseIds
      .map((id) => content.hendelser.find((h) => h.id === id))
      .filter((h): h is RosHendelse => !!h);
    if (arsaker.length < 2) {
      toast({ title: "Trenger minst 2 årsaker", description: "Velg minst to årsaker for å finne felles barrierer.", variant: "destructive" });
      return;
    }
    setAnalyzingId(bt.id);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-bowtie-barriers", {
        body: {
          topphendelse: bt.navn,
          beskrivelse: bt.beskrivelse || "",
          arsaker: arsaker.map((a) => ({
            id: a.id,
            tittel: a.tittel || a.sarbarhet || a.hendelse || "Uten navn",
            tiltak: a.tiltak || "",
          })),
        },
      });
      if (error) throw error;
      const nye = Array.isArray(data?.barrierer)
        ? data.barrierer.map((b: any) => ({
            tekst: String(b.tekst || "").trim(),
            arsakIds: Array.isArray(b.arsakIds) ? b.arsakIds.map((x: any) => String(x)) : [],
            kilde: "ai" as const,
          }))
        : [];
      // Behold manuelle, erstatt AI-genererte
      const beholdt = (bt.felleseBarrierer || []).filter((b) => b.kilde !== "ai");
      updateBowTie(bt.id, { felleseBarrierer: [...nye, ...beholdt] });
      toast({
        title: nye.length > 0 ? `Fant ${nye.length} felles barriere${nye.length === 1 ? "" : "r"}` : "Ingen felles barrierer funnet",
        description: nye.length > 0 ? "Lagt til i diagrammet og tabellen." : "AI fant ingen barrierer som dekker flere årsaker.",
      });
    } catch (e: any) {
      const msg = e?.message || "Kunne ikke analysere barrierer.";
      toast({ title: "AI-analyse feilet", description: msg, variant: "destructive" });
    } finally {
      setAnalyzingId(null);
    }
  };

  const addManuellBarriere = (btId: string) => {
    const tekst = (newFellesTekst[btId] || "").trim();
    const arsakIds = newFellesArsaker[btId] || [];
    if (!tekst || arsakIds.length < 1) {
      toast({ title: "Mangler informasjon", description: "Skriv tekst og velg minst én årsak.", variant: "destructive" });
      return;
    }
    const bt = (content.bowTies || []).find((b) => b.id === btId);
    if (!bt) return;
    updateBowTie(btId, {
      felleseBarrierer: [
        ...(bt.felleseBarrierer || []),
        { tekst, arsakIds, kilde: "manuell" },
      ],
    });
    setNewFellesTekst((s) => ({ ...s, [btId]: "" }));
    setNewFellesArsaker((s) => ({ ...s, [btId]: [] }));
  };

  const removeFellesBarriere = (btId: string, index: number) => {
    const bt = (content.bowTies || []).find((b) => b.id === btId);
    if (!bt) return;
    updateBowTie(btId, {
      felleseBarrierer: (bt.felleseBarrierer || []).filter((_, i) => i !== index),
    });
  };

  // ----- Konsekvensreduserende tiltak -----
  const [analyzingKonsId, setAnalyzingKonsId] = useState<string | null>(null);
  const [newKonsTekst, setNewKonsTekst] = useState<Record<string, string>>({});
  const [newKonsIndekser, setNewKonsIndekser] = useState<Record<string, number[]>>({});

  const analyzeKonsekvensTiltak = async (bt: RosBowTie) => {
    if (bt.konsekvenser.length < 1) {
      toast({ title: "Trenger minst 1 konsekvens", description: "Registrer minst én konsekvens først.", variant: "destructive" });
      return;
    }
    setAnalyzingKonsId(bt.id);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-bowtie-mitigations", {
        body: {
          topphendelse: bt.navn,
          beskrivelse: bt.beskrivelse || "",
          konsekvenser: bt.konsekvenser.map((tekst, i) => ({ id: String(i), tekst })),
        },
      });
      if (error) throw error;
      const nye = Array.isArray(data?.tiltak)
        ? data.tiltak.map((t: any) => ({
            tekst: String(t.tekst || "").trim(),
            konsekvensIndekser: Array.isArray(t.konsekvensIds)
              ? t.konsekvensIds.map((x: any) => Number(x)).filter((n: number) => Number.isInteger(n) && n >= 0 && n < bt.konsekvenser.length)
              : [],
            kilde: "ai" as const,
          }))
        : [];
      const beholdt = (bt.konsekvensReduserende || []).filter((t) => t.kilde !== "ai");
      updateBowTie(bt.id, { konsekvensReduserende: [...nye, ...beholdt] });
      toast({
        title: nye.length > 0 ? `Fant ${nye.length} konsekvensreduserende tiltak` : "Ingen tiltak funnet",
        description: nye.length > 0 ? "Lagt til i diagrammet og tabellen." : "AI fant ingen relevante konsekvensreduserende tiltak.",
      });
    } catch (e: any) {
      toast({ title: "AI-analyse feilet", description: e?.message || "Kunne ikke analysere tiltak.", variant: "destructive" });
    } finally {
      setAnalyzingKonsId(null);
    }
  };

  const addManuellKonsekvensTiltak = (btId: string) => {
    const tekst = (newKonsTekst[btId] || "").trim();
    const indekser = newKonsIndekser[btId] || [];
    if (!tekst || indekser.length < 1) {
      toast({ title: "Mangler informasjon", description: "Skriv tekst og velg minst én konsekvens.", variant: "destructive" });
      return;
    }
    const bt = (content.bowTies || []).find((b) => b.id === btId);
    if (!bt) return;
    updateBowTie(btId, {
      konsekvensReduserende: [
        ...(bt.konsekvensReduserende || []),
        { tekst, konsekvensIndekser: indekser, kilde: "manuell" },
      ],
    });
    setNewKonsTekst((s) => ({ ...s, [btId]: "" }));
    setNewKonsIndekser((s) => ({ ...s, [btId]: [] }));
  };

  const removeKonsekvensTiltak = (btId: string, index: number) => {
    const bt = (content.bowTies || []).find((b) => b.id === btId);
    if (!bt) return;
    updateBowTie(btId, {
      konsekvensReduserende: (bt.konsekvensReduserende || []).filter((_, i) => i !== index),
    });
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
    return projects.find((p) => p.id === projectId)?.name;
  }, [projects, projectId]);

  // ============ CREATE-ONLY VIEW (no rosId, dialog open) ============
  if (!rosId) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <p className="text-sm text-muted-foreground">Åpner…</p>
          <CreateDialog
            open={showCreate}
            onOpenChange={(o) => {
              setShowCreate(o);
              if (!o) navigate(projectFromUrl ? `/prosjekt/${projectFromUrl}` : "/mine-prosjekter");
            }}
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
            <Button variant="ghost" size="sm" onClick={() => navigate(projectId ? `/prosjekt/${projectId}` : "/mine-prosjekter")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Tilbake til prosjekt
            </Button>
            {projectName && <span className="text-sm font-medium truncate">{projectName}</span>}
          </div>
          <div className="flex items-center gap-2">
            <UploadRosDialog onApply={importHendelser} />
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
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-0">
        {/* INPUT */}
        <div className="border-r flex flex-col h-[calc(100vh-117px)]">
          <div className="p-6 space-y-8 overflow-y-auto flex-1">
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
            <div className="flex items-center gap-1"><h2 className="text-lg font-semibold">1. Innledning</h2><JumpToPreview previewId="kap-1" /></div>
            <Area label="Bakgrunn" value={content.innledning.bakgrunn}
              onChange={(v) => setContent((c) => ({ ...c, innledning: { ...c.innledning, bakgrunn: v } }))}
              onGenerate={() => generateBakgrunnText(content.metadata)} />
            <Area label="Formål" value={content.innledning.formal}
              onChange={(v) => setContent((c) => ({ ...c, innledning: { ...c.innledning, formal: v } }))}
              onGenerate={() => generateFormalText(content.metadata)} />
            <Area label="Omfang" value={content.innledning.omfang}
              onChange={(v) => setContent((c) => ({ ...c, innledning: { ...c.innledning, omfang: v } }))} />
            <Area label="Avgrensninger" value={content.innledning.avgrensninger}
              onChange={(v) => setContent((c) => ({ ...c, innledning: { ...c.innledning, avgrensninger: v } }))} />
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-1"><h2 className="text-lg font-semibold">2. Metode</h2><JumpToPreview previewId="kap-2" /></div>
            <p className="text-xs text-muted-foreground">
              5×5-matrisen er forhåndsdefinert. Skalaer for sannsynlighet og konsekvens vises i forhåndsvisningen.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Detaljeringsnivå</label>
              <p className="text-xs text-muted-foreground">
                Velg nivå iht. Beredskapsforskriftens kartleggingskrav.
              </p>
              <img
                src={rosNivaaIllustrasjon}
                alt="Illustrasjon av de tre detaljeringsnivåene i ROS-analyse"
                loading="lazy"
                className="w-full rounded-md border border-border"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {([
                  { n: 1, t: "Nivå 1", d: "Overordnet ROS-analyse" },
                  { n: 2, t: "Nivå 2", d: "Anlegg og aktiviteter" },
                  { n: 3, t: "Nivå 3", d: "Delsystem / komponenter" },
                ] as const).map((x) => {
                  const valgt = content.metadata.nivaa === x.n;
                  return (
                    <button
                      key={x.n}
                      type="button"
                      onClick={() =>
                        setContent((c) => ({
                          ...c,
                          metadata: { ...c.metadata, nivaa: valgt ? undefined : (x.n as 1 | 2 | 3) },
                        }))
                      }
                      className={`text-left rounded-md border px-3 py-2 transition ${
                        valgt
                          ? "border-primary bg-primary/10 ring-1 ring-primary"
                          : "border-border bg-background hover:bg-muted/40"
                      }`}
                    >
                      <div className="text-sm font-semibold">{x.t}</div>
                      <div className="text-xs text-muted-foreground">{x.d}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
              <div>
                <h3 className="text-sm font-semibold">2.3 Planlegging av analysen</h3>
                <p className="text-xs text-muted-foreground">
                  Punkt 1 (formål/omfang) og 2 (S/K-dimensjon) er allerede dekket i kap. 1 og
                  metodeskalaen. Fyll inn de tre siste momentene under.
                </p>
              </div>
              <Area
                label="Informasjonsinnhenting (kilder, tegninger, befaringer, intervjuer, statistikk)"
                value={content.metode?.informasjonsinnhenting || ""}
                onChange={(v) =>
                  setContent((c) => ({ ...c, metode: { ...(c.metode || {}), informasjonsinnhenting: v } }))
                }
              />
              <div className="space-y-2">
                <Label className="text-sm">Organisering av arbeidet — deltakere</Label>
                <p className="text-xs text-muted-foreground">
                  Legg til personene som har deltatt i analysen med navn, stillingstittel og bedrift.
                </p>
                <div className="space-y-2">
                  {(content.metode?.deltakere || []).map((d, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input
                        placeholder="Navn"
                        value={d.navn}
                        onChange={(e) => {
                          const v = e.target.value;
                          setContent((c) => {
                            const list = [...(c.metode?.deltakere || [])];
                            list[idx] = { ...list[idx], navn: v };
                            return { ...c, metode: { ...(c.metode || {}), deltakere: list } };
                          });
                        }}
                      />
                      <Input
                        placeholder="Stillingstittel"
                        value={d.stilling}
                        onChange={(e) => {
                          const v = e.target.value;
                          setContent((c) => {
                            const list = [...(c.metode?.deltakere || [])];
                            list[idx] = { ...list[idx], stilling: v };
                            return { ...c, metode: { ...(c.metode || {}), deltakere: list } };
                          });
                        }}
                      />
                      <Input
                        placeholder="Bedrift"
                        value={d.bedrift || ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setContent((c) => {
                            const list = [...(c.metode?.deltakere || [])];
                            list[idx] = { ...list[idx], bedrift: v };
                            return { ...c, metode: { ...(c.metode || {}), deltakere: list } };
                          });
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setContent((c) => {
                            const list = [...(c.metode?.deltakere || [])];
                            list.splice(idx, 1);
                            return { ...c, metode: { ...(c.metode || {}), deltakere: list } };
                          })
                        }
                        aria-label="Fjern deltaker"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setContent((c) => ({
                      ...c,
                      metode: {
                        ...(c.metode || {}),
                        deltakere: [...(c.metode?.deltakere || []), { navn: "", stilling: "", bedrift: "" }],
                      },
                    }))
                  }
                >
                  <Plus className="h-4 w-4 mr-1" /> Legg til deltaker
                </Button>
              </div>
              <Area
                label="Analyseskjema og sjekklister (5×5-skjema, eventuelle sjekklister/maler)"
                value={content.metode?.skjemaOgSjekklister || ""}
                onChange={(v) =>
                  setContent((c) => ({ ...c, metode: { ...(c.metode || {}), skjemaOgSjekklister: v } }))
                }
              />
            </div>
            <div className="rounded-lg border p-4 bg-muted/30">
              <RosMatriks size="sm" />
            </div>
          </section>



          <section className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1"><h2 className="text-lg font-semibold">3. Hendelser</h2><JumpToPreview previewId="kap-3" /></div>
              <Button size="sm" variant="outline" onClick={addHendelse}>
                <Plus className="h-4 w-4 mr-1" /> Ny hendelse
              </Button>
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
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Slett alle
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Slette alle hendelser?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Dette fjerner alle {content.hendelser.length} hendelser fra analysen. Endringen lagres først når du trykker «Lagre».
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => setContent((c) => ({ ...c, hendelser: [], bowTies: (c.bowTies || []).map((b) => ({ ...b, hendelseIds: [] })) }))}
                        >
                          Slett alle
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <span className="text-xs text-muted-foreground ml-auto">{content.hendelser.length} hendelser</span>
                </div>
                <Accordion type="multiple" value={openHendelser} onValueChange={setOpenHendelser} className="space-y-2">
                  {(() => {
                    const bowTieBruk = new Map<string, string[]>();
                    (content.bowTies || []).forEach((bt, i) => {
                      const navn = bt.navn?.trim() || `Topphendelse ${i + 1}`;
                      bt.hendelseIds.forEach((hid) => {
                        const arr = bowTieBruk.get(hid) || [];
                        arr.push(navn);
                        bowTieBruk.set(hid, arr);
                      });
                    });
                    return content.hendelser.map((h, idx) => {
                    const farge = risikoFarge(h.sannsynlighet, h.konsekvens);
                    const cls = farge === "rod" ? "bg-red-500/85 text-white"
                      : farge === "gul" ? "bg-amber-400/90 text-foreground"
                      : "bg-emerald-500/80 text-white";
                    const sE = h.sannsynlighetEtter ?? h.sannsynlighet;
                    const kE = h.konsekvensEtter ?? h.konsekvens;
                    const fargeEtter = risikoFarge(sE, kE);
                    const clsEtter = fargeEtter === "rod" ? "bg-red-500/85 text-white"
                      : fargeEtter === "gul" ? "bg-amber-400/90 text-foreground"
                      : "bg-emerald-500/80 text-white";
                    const sok = hendelseSok.trim().toLowerCase();
                    const sokTekst = `${h.tittel} ${h.sarbarhet || ""} ${h.hendelse || h.beskrivelse || ""} ${h.arsak}`.toLowerCase();
                    if (sok && !sokTekst.includes(sok)) return null;
                    const bruk = bowTieBruk.get(h.id);
                    return (
                      <AccordionItem key={h.id} value={h.id} className="border rounded-lg px-3 border-b">
                        <div className="flex items-center gap-2">
                          <AccordionTrigger className="flex-1 py-2 hover:no-underline">
                            <div className="flex items-center gap-2 flex-1 min-w-0 text-left">
                              <span className="text-xs font-medium text-muted-foreground shrink-0">#{idx + 1}</span>
                              <span className="truncate text-sm font-medium">
                                {h.tittel || h.sarbarhet || h.hendelse || <span className="italic text-muted-foreground">Uten tittel</span>}
                              </span>
                              {bruk && bruk.length > 0 && (
                                <TooltipProvider delayDuration={200}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge variant="secondary" className="shrink-0 gap-1 px-1.5 py-0 text-[10px] font-medium">
                                        <GitBranch className="h-3 w-3" />
                                        <span className="hidden sm:inline">Bow-tie</span>
                                        {bruk.length > 1 && <span>×{bruk.length}</span>}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <span className="text-xs">Brukt i: {bruk.join(", ")}</span>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              <span className={`ml-auto rounded px-2 py-0.5 text-xs font-semibold shrink-0 ${cls}`}>
                                R {h.sannsynlighet * h.konsekvens}
                              </span>
                              <span className="text-xs text-muted-foreground shrink-0">→</span>
                              <span className={`rounded px-2 py-0.5 text-xs font-semibold shrink-0 ${clsEtter}`}>
                                R {sE * kE}
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
                        <AccordionContent className="pt-2 space-y-3">
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Identifikasjon</p>
                            <Field label="Tittel" value={h.tittel} onChange={(v) => updateHendelse(h.id, { tittel: v })} />
                            <Area label="Sårbarhet" value={h.sarbarhet || ""} onChange={(v) => updateHendelse(h.id, { sarbarhet: v })} rows={2} />
                            <Area label="Hendelse / scenario" value={h.hendelse || h.beskrivelse || ""} onChange={(v) => updateHendelse(h.id, { hendelse: v, beskrivelse: v })} rows={2} />
                            <Area label="Årsak" value={h.arsak} onChange={(v) => updateHendelse(h.id, { arsak: v })} rows={2} />
                          </div>

                          <div className="space-y-2 border-t pt-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Før tiltak</p>
                            <Area label="Beskrivelse av sannsynlighet" value={h.beskrivelseSannsynlighetFor || ""} onChange={(v) => updateHendelse(h.id, { beskrivelseSannsynlighetFor: v })} rows={2} />
                            <Area label="Beskrivelse av risiko / konsekvens" value={h.beskrivelseRisikoFor || ""} onChange={(v) => updateHendelse(h.id, { beskrivelseRisikoFor: v })} rows={2} />
                            <div className="grid grid-cols-3 gap-2 items-end">
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
                              <div>
                                <Label className="text-xs">Risiko (S × K)</Label>
                                <div className={`h-9 rounded-md border flex items-center justify-center text-sm font-semibold ${cls}`}>
                                  {h.sannsynlighet * h.konsekvens}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 border-t pt-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Forebyggende tiltak</p>
                            <Area label="Tiltak" value={h.tiltak} onChange={(v) => updateHendelse(h.id, { tiltak: v })} rows={3} />
                          </div>

                          <div className="space-y-2 border-t pt-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Etter tiltak</p>
                            <Area label="Beskrivelse av risiko og konsekvens etter tiltak" value={h.beskrivelseEtter || ""} onChange={(v) => updateHendelse(h.id, { beskrivelseEtter: v })} rows={2} />
                            <div className="grid grid-cols-3 gap-2 items-end">
                              <div>
                                <Label className="text-xs">Sannsynlighet etter (1–5)</Label>
                                <Select value={String(sE)} onValueChange={(v) => updateHendelse(h.id, { sannsynlighetEtter: Number(v) })}>
                                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {[1,2,3,4,5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Konsekvens etter (1–5)</Label>
                                <Select value={String(kE)} onValueChange={(v) => updateHendelse(h.id, { konsekvensEtter: Number(v) })}>
                                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {[1,2,3,4,5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Risiko etter (S × K)</Label>
                                <div className={`h-9 rounded-md border flex items-center justify-center text-sm font-semibold ${clsEtter}`}>
                                  {sE * kE}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 border-t pt-3">
                            <Area label="Restrisiko" value={h.restrisiko} onChange={(v) => updateHendelse(h.id, { restrisiko: v })} rows={2} />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  });
                  })()}
                </Accordion>
              </>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-1"><h2 className="text-lg font-semibold">4. Bow-tie analyse</h2><JumpToPreview previewId="kap-4" /></div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Definer en uønsket topphendelse og knytt registrerte hendelser som årsaker. Gir oversikt over felles tiltak på tvers.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={addBowTie}>
                <Plus className="h-4 w-4 mr-1" /> Ny topphendelse
              </Button>
            </div>
            {(!content.bowTies || content.bowTies.length === 0) ? (
              <p className="text-sm text-muted-foreground italic">Ingen topphendelser ennå.</p>
            ) : (
              <div className="space-y-3">
                {content.bowTies.map((bt, idx) => (
                  <div key={bt.id} className="border rounded-lg p-3 space-y-3 bg-muted/20">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-medium text-muted-foreground shrink-0 mt-2">#{idx + 1}</span>
                      <div className="flex-1 space-y-2">
                        <Field
                          label="Navn på topphendelse"
                          value={bt.navn}
                          onChange={(v) => updateBowTie(bt.id, { navn: v })}
                        />
                        <Area
                          label="Beskrivelse (valgfri)"
                          value={bt.beskrivelse || ""}
                          onChange={(v) => updateBowTie(bt.id, { beskrivelse: v })}
                          rows={2}
                        />
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Slette topphendelse?</AlertDialogTitle>
                            <AlertDialogDescription>Dette kan ikke angres.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Avbryt</AlertDialogCancel>
                            <AlertDialogAction onClick={() => removeBowTie(bt.id)}>Slett</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    <div className="space-y-2 border-t pt-3">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Årsaker (hendelser fra kap. 3)
                      </Label>
                      {content.hendelser.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">Registrer hendelser først.</p>
                      ) : (
                        <ArsakPicker
                          hendelser={content.hendelser}
                          valgteIds={bt.hendelseIds}
                          onToggle={(hid) => toggleBowTieHendelse(bt.id, hid)}
                        />
                      )}
                    </div>


                    <div className="space-y-2 border-t pt-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Konsekvenser
                        </Label>
                        <KonsekvensPicker
                          valgte={bt.konsekvenser}
                          onAdd={(tekst) =>
                            updateBowTie(bt.id, { konsekvenser: [...bt.konsekvenser, tekst] })
                          }
                        />
                      </div>
                      {bt.konsekvenser.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">Ingen konsekvenser registrert.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {bt.konsekvenser.map((k, i) => (
                            <div key={i} className="flex gap-2">
                              <Input
                                value={k}
                                onChange={(e) => {
                                  const next = [...bt.konsekvenser];
                                  next[i] = e.target.value;
                                  updateBowTie(bt.id, { konsekvenser: next });
                                }}
                                className="h-8 text-sm"
                                placeholder="f.eks. Personskade, materielle skader"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive shrink-0"
                                onClick={() => {
                                  const nyeKons = bt.konsekvenser.filter((_, j) => j !== i);
                                  const nyeTiltak = (bt.konsekvensReduserende || [])
                                    .map((t) => ({
                                      ...t,
                                      konsekvensIndekser: (t.konsekvensIndekser || [])
                                        .filter((ki) => ki !== i)
                                        .map((ki) => (ki > i ? ki - 1 : ki)),
                                    }))
                                    .filter((t) => t.konsekvensIndekser.length > 0);
                                  updateBowTie(bt.id, {
                                    konsekvenser: nyeKons,
                                    konsekvensReduserende: nyeTiltak,
                                  });
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>


                    {/* Felles barrierer (AI + manuell) */}
                    <div className="space-y-2 border-t pt-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Felles barrierer (på tvers av årsaker)
                        </Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={analyzingId === bt.id || bt.hendelseIds.length < 2}
                          onClick={() => analyzeBarrierer(bt)}
                        >
                          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                          {analyzingId === bt.id ? "Analyserer…" : "Analyser med AI"}
                        </Button>
                      </div>
                      {bt.hendelseIds.length < 2 && (
                        <p className="text-xs text-muted-foreground italic">
                          Velg minst to årsaker for å finne felles barrierer.
                        </p>
                      )}

                      {(bt.felleseBarrierer || []).length > 0 && (
                        <div className="space-y-1.5">
                          {(bt.felleseBarrierer || []).map((fb, i) => {
                            const arsakNavn = fb.arsakIds
                              .map((id) => {
                                const a = content.hendelser.find((h) => h.id === id);
                                return a?.tittel || a?.sarbarhet || a?.hendelse || "";
                              })
                              .filter(Boolean);
                            return (
                              <div
                                key={i}
                                className="flex items-start gap-2 rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30 px-2.5 py-2"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">{fb.tekst}</span>
                                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                      {fb.kilde === "ai" ? "AI" : "Manuell"}
                                    </Badge>
                                  </div>
                                  {arsakNavn.length > 0 && (
                                    <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5 italic">
                                      Dekker: {arsakNavn.join(", ")}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive shrink-0"
                                  onClick={() => removeFellesBarriere(bt.id, i)}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Legg til manuell felles barriere */}
                      {bt.hendelseIds.length >= 1 && (
                        <div className="rounded-md border border-dashed p-2 space-y-2">
                          <Input
                            value={newFellesTekst[bt.id] || ""}
                            onChange={(e) => setNewFellesTekst((s) => ({ ...s, [bt.id]: e.target.value }))}
                            placeholder="Legg til egen felles barriere…"
                            className="h-8 text-sm"
                          />
                          <div className="flex items-center gap-2 flex-wrap">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button type="button" variant="outline" size="sm" className="h-7 text-xs">
                                  Velg årsaker ({(newFellesArsaker[bt.id] || []).length})
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-72 p-0" align="start">
                                <Command>
                                  <CommandList>
                                    <CommandEmpty>Ingen årsaker.</CommandEmpty>
                                    <CommandGroup>
                                      {bt.hendelseIds.map((hid) => {
                                        const h = content.hendelser.find((x) => x.id === hid);
                                        if (!h) return null;
                                        const valgt = (newFellesArsaker[bt.id] || []).includes(hid);
                                        return (
                                          <CommandItem
                                            key={hid}
                                            onSelect={() => {
                                              setNewFellesArsaker((s) => {
                                                const cur = s[bt.id] || [];
                                                return {
                                                  ...s,
                                                  [bt.id]: valgt ? cur.filter((x) => x !== hid) : [...cur, hid],
                                                };
                                              });
                                            }}
                                            className="text-sm"
                                          >
                                            <Check className={"h-3.5 w-3.5 mr-2 " + (valgt ? "opacity-100" : "opacity-0")} />
                                            {h.tittel || h.sarbarhet || h.hendelse || "Uten navn"}
                                          </CommandItem>
                                        );
                                      })}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <Button
                              type="button"
                              size="sm"
                              variant="default"
                              className="h-7 text-xs"
                              onClick={() => addManuellBarriere(bt.id)}
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" /> Legg til
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Konsekvensreduserende tiltak (AI + manuell) */}
                    <div className="space-y-2 border-t pt-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Konsekvensreduserende tiltak (etter topphendelse)
                        </Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={analyzingKonsId === bt.id || bt.konsekvenser.length < 1}
                          onClick={() => analyzeKonsekvensTiltak(bt)}
                        >
                          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                          {analyzingKonsId === bt.id ? "Analyserer…" : "Analyser med AI"}
                        </Button>
                      </div>
                      {bt.konsekvenser.length < 1 && (
                        <p className="text-xs text-muted-foreground italic">
                          Registrer minst én konsekvens for å foreslå konsekvensreduserende tiltak.
                        </p>
                      )}

                      {(bt.konsekvensReduserende || []).length > 0 && (
                        <div className="space-y-1.5">
                          {(bt.konsekvensReduserende || []).map((kt, i) => {
                            const konsNavn = kt.konsekvensIndekser
                              .map((ki) => bt.konsekvenser[ki])
                              .filter(Boolean);
                            return (
                              <div
                                key={i}
                                className="flex items-start gap-2 rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/30 px-2.5 py-2"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-sm font-medium text-amber-900 dark:text-amber-100">{kt.tekst}</span>
                                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                      {kt.kilde === "ai" ? "AI" : "Manuell"}
                                    </Badge>
                                  </div>
                                  {konsNavn.length > 0 && (
                                    <div className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5 italic">
                                      Reduserer: {konsNavn.join(", ")}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive shrink-0"
                                  onClick={() => removeKonsekvensTiltak(bt.id, i)}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Legg til manuelt konsekvensreduserende tiltak */}
                      {bt.konsekvenser.length >= 1 && (
                        <div className="rounded-md border border-dashed p-2 space-y-2">
                          <Input
                            value={newKonsTekst[bt.id] || ""}
                            onChange={(e) => setNewKonsTekst((s) => ({ ...s, [bt.id]: e.target.value }))}
                            placeholder="Legg til eget konsekvensreduserende tiltak…"
                            className="h-8 text-sm"
                          />
                          <div className="flex items-center gap-2 flex-wrap">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button type="button" variant="outline" size="sm" className="h-7 text-xs">
                                  Velg konsekvenser ({(newKonsIndekser[bt.id] || []).length})
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-72 p-0" align="start">
                                <Command>
                                  <CommandList>
                                    <CommandEmpty>Ingen konsekvenser.</CommandEmpty>
                                    <CommandGroup>
                                      {bt.konsekvenser.map((k, ki) => {
                                        const valgt = (newKonsIndekser[bt.id] || []).includes(ki);
                                        return (
                                          <CommandItem
                                            key={ki}
                                            onSelect={() => {
                                              setNewKonsIndekser((s) => {
                                                const cur = s[bt.id] || [];
                                                return {
                                                  ...s,
                                                  [bt.id]: valgt ? cur.filter((x) => x !== ki) : [...cur, ki],
                                                };
                                              });
                                            }}
                                            className="text-sm"
                                          >
                                            <Check className={"h-3.5 w-3.5 mr-2 " + (valgt ? "opacity-100" : "opacity-0")} />
                                            {k || `Konsekvens ${ki + 1}`}
                                          </CommandItem>
                                        );
                                      })}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <Button
                              type="button"
                              size="sm"
                              variant="default"
                              className="h-7 text-xs"
                              onClick={() => addManuellKonsekvensTiltak(bt.id)}
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" /> Legg til
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>


                    <div className="space-y-1 border-t pt-3">
                      <Area
                        label="Felles barrierer / tiltak (fritekst, valgfri)"
                        value={bt.fellesBarrierer || ""}
                        onChange={(v) => updateBowTie(bt.id, { fellesBarrierer: v })}
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-1">
              <h2 className="text-lg font-semibold">
                {content.bowTies && content.bowTies.length > 0 ? "5" : "4"}. Oppsummering
              </h2>
              <JumpToPreview previewId="kap-5" />
            </div>
            <Textarea value={content.oppsummering} rows={6}
              onChange={(e) => setContent((c) => ({ ...c, oppsummering: e.target.value }))} />
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <h2 className="text-lg font-semibold">
                  {content.bowTies && content.bowTies.length > 0 ? "6" : "5"}. Revisjonshistorikk
                </h2>
                <JumpToPreview previewId="kap-6" />
              </div>
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
          <div className="border-t bg-background/95 backdrop-blur px-6 py-2 flex items-center justify-end">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-1" /> {saving ? "Lagrer…" : "Lagre"}
            </Button>
          </div>
        </div>

        {/* PREVIEW */}
        <div className="bg-muted/20 overflow-y-auto h-[calc(100vh-117px)]">
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
function Area({
  label,
  value,
  onChange,
  rows = 3,
  onGenerate,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  onGenerate?: () => string;
}) {
  const handleGenerate = () => {
    if (!onGenerate) return;
    if (value.trim() && !window.confirm("Erstatt eksisterende tekst med generert standardtekst?")) return;
    onChange(onGenerate());
  };
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs">{label}</Label>
        {onGenerate && (
          <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleGenerate}>
            <Sparkles className="h-3 w-3 mr-1" />
            Generer tekst
          </Button>
        )}
      </div>
      <Textarea value={value} rows={rows} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function generateBakgrunnText(meta: RosContent["metadata"]): string {
  const navn = meta.prosjektnavn?.trim();
  const adresse = meta.adresse?.trim();
  const objekt = navn && adresse ? `${navn} (${adresse})` : navn || adresse || "tiltaket";
  return (
    `Denne risiko- og sårbarhetsanalysen (ROS-analyse) er utarbeidet for ${objekt}. ` +
    `Analysen skal kartlegge og vurdere uønskede hendelser som kan oppstå knyttet til brann, eksplosjon og andre uhell som påvirker liv, helse, miljø og materielle verdier. ` +
    `ROS-analysen er gjennomført i samsvar med kravene i plan- og bygningsloven, byggteknisk forskrift (TEK17), brann- og eksplosjonsvernloven, samt forskrift om systematisk helse-, miljø- og sikkerhetsarbeid (internkontrollforskriften). ` +
    `Metodikken bygger på NS 5814 «Krav til risikovurderinger», med bruk av en 5×5 risikomatrise for vurdering av sannsynlighet og konsekvens.`
  );
}

function generateFormalText(meta: RosContent["metadata"]): string {
  const navn = meta.prosjektnavn?.trim();
  const objekt = navn ? `for ${navn}` : "for tiltaket";
  return (
    `Formålet med ROS-analysen ${objekt} er å identifisere relevante uønskede hendelser, vurdere sannsynlighet for at de inntreffer og konsekvensene dersom de skjer, samt å foreslå risikoreduserende tiltak. ` +
    `Analysen skal gi beslutningsgrunnlag for prosjektering, bygging og drift, og bidra til at akseptabelt sikkerhetsnivå oppnås i tråd med gjeldende regelverk og anerkjente normer. ` +
    `Resultatene benyttes videre i brannkonseptet og som underlag for organisatoriske og tekniske tiltak gjennom byggets levetid.`
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

function KonsekvensPicker({ valgte, onAdd }: { valgte: string[]; onAdd: (tekst: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const grupper = useMemo(() => groupKonsekvenserByKategori(), []);
  const valgteSet = useMemo(() => new Set(valgte.map((v) => v.trim().toLowerCase())), [valgte]);
  const trimmed = search.trim();
  const finnesAllerede = trimmed && (
    valgteSet.has(trimmed.toLowerCase()) ||
    KONSEKVENS_FORSLAG.some((k) => k.tekst.toLowerCase() === trimmed.toLowerCase())
  );

  const handleAdd = (tekst: string) => {
    onAdd(tekst);
    setSearch("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" /> Legg til
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="end">
        <Command>
          <CommandInput
            placeholder="Søk eller skriv egen konsekvens..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[360px]">
            <CommandEmpty>
              {trimmed ? (
                <button
                  type="button"
                  onClick={() => handleAdd(trimmed)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-sm"
                >
                  <Plus className="h-3 w-3 inline mr-1" /> Legg til «{trimmed}»
                </button>
              ) : (
                <span className="text-xs text-muted-foreground">Skriv for å lage egen konsekvens</span>
              )}
            </CommandEmpty>
            {Object.entries(grupper).map(([kategori, items]) => (
              <CommandGroup key={kategori} heading={kategori}>
                {items.map((k) => {
                  const erValgt = valgteSet.has(k.tekst.toLowerCase());
                  return (
                    <CommandItem
                      key={k.tekst}
                      value={`${kategori} ${k.tekst}`}
                      disabled={erValgt}
                      onSelect={() => !erValgt && handleAdd(k.tekst)}
                      className={erValgt ? "opacity-50" : ""}
                    >
                      <span className="text-sm">{k.tekst}</span>
                      {erValgt && <span className="ml-auto text-xs text-muted-foreground">Valgt</span>}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
            {trimmed && !finnesAllerede && (
              <CommandGroup heading="Egendefinert">
                <CommandItem value={`__custom__${trimmed}`} onSelect={() => handleAdd(trimmed)}>
                  <Plus className="h-3 w-3 mr-2" /> Legg til «{trimmed}»
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ArsakPicker({
  hendelser,
  valgteIds,
  onToggle,
}: {
  hendelser: RosHendelse[];
  valgteIds: string[];
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const valgte = hendelser.filter((h) => valgteIds.includes(h.id));
  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="w-full justify-between">
            <span className="text-xs">
              {valgteIds.length === 0
                ? "Velg årsaker fra hendelsesregisteret"
                : `${valgteIds.length} årsak${valgteIds.length === 1 ? "" : "er"} valgt`}
            </span>
            <Plus className="h-3.5 w-3.5 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[340px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Søk hendelse..." />
            <CommandList className="max-h-[320px]">
              <CommandEmpty>Ingen treff.</CommandEmpty>
              <CommandGroup>
                {hendelser.map((h) => {
                  const selected = valgteIds.includes(h.id);
                  const farge = risikoFarge(h.sannsynlighet, h.konsekvens);
                  const dot = farge === "rod" ? "bg-red-500" : farge === "gul" ? "bg-amber-400" : "bg-emerald-500";
                  const label = h.tittel || h.sarbarhet || h.hendelse || "Uten tittel";
                  return (
                    <CommandItem
                      key={h.id}
                      value={`${label} ${h.sarbarhet || ""} ${h.hendelse || ""}`}
                      onSelect={() => onToggle(h.id)}
                    >
                      <span className={`inline-block h-2 w-2 rounded-full mr-2 ${dot}`} />
                      <span className="text-sm truncate">{label}</span>
                      {selected && <Check className="ml-auto h-4 w-4 text-primary" />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {valgte.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {valgte.map((h) => {
            const farge = risikoFarge(h.sannsynlighet, h.konsekvens);
            const dot = farge === "rod" ? "bg-red-500" : farge === "gul" ? "bg-amber-400" : "bg-emerald-500";
            const label = h.tittel || h.sarbarhet || h.hendelse || "Uten tittel";
            return (
              <span
                key={h.id}
                className="text-xs px-2 py-1 rounded-full border bg-background flex items-center gap-1.5"
              >
                <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />
                {label}
                <button
                  type="button"
                  onClick={() => onToggle(h.id)}
                  className="ml-1 text-muted-foreground hover:text-destructive"
                  aria-label="Fjern"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
