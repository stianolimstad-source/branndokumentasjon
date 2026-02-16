import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import { CheckCircle, XCircle, Clock, MessageSquare, Save } from "lucide-react";

// Define the sections/chapters that match the fire concept structure
const sections = [
  { key: "kap1_1", label: "1.1 Informasjon om tiltaket" },
  { key: "kap1_2", label: "1.2 Ansvarsoppgave (SAK 10)" },
  { key: "kap1_3", label: "1.3 Prosjekteringsmetode" },
  { key: "kap1_4", label: "1.4 Avgrensning av tiltak" },
  { key: "kap2_1", label: "2.1 Grunnlagsdokumenter" },
  { key: "kap2_2", label: "2.2 Beskrivelse av bygning og forutsetninger" },
  { key: "kap2_3", label: "2.3 Tilleggskrav" },
  { key: "kap3_1", label: "3.1 § 11-4 Bæreevne og stabilitet" },
  { key: "kap3_2", label: "3.2 § 11-5 Sikkerhet ved eksplosjon" },
  { key: "kap3_3", label: "3.3 § 11-6 Brannspredning mellom byggverk" },
  { key: "kap3_4", label: "3.4 § 11-7 Brannseksjoner" },
  { key: "kap3_5", label: "3.5 § 11-8 Brannceller" },
  { key: "kap3_6", label: "3.6 § 11-9 Materialer og produkter" },
  { key: "kap3_7", label: "3.7 § 11-10 Tekniske installasjoner" },
  { key: "kap3_8", label: "3.8 § 11-11 Generelle krav om rømning" },
  { key: "kap3_9", label: "3.9 § 11-12 Tiltak for rømnings-/redningstider" },
  { key: "kap3_10", label: "3.10 § 11-13 Utgang fra branncelle" },
  { key: "kap3_11", label: "3.11 § 11-14 Rømningsvei" },
  { key: "kap3_12", label: "3.12 § 11-16 Manuell slokking" },
  { key: "kap3_13", label: "3.13 § 11-17 Rednings- og slokkemannskap" },
  { key: "kap4_1", label: "4.1 Utførelsesfasen" },
  { key: "kap4_2", label: "4.2 Driftsfasen" },
  { key: "kap5", label: "5. Revisjonshistorikk" },
  { key: "kap6", label: "6. Litteraturhenvisninger" },
];

interface Checkpoint {
  section_key: string;
  status: "pending" | "ok" | "feil";
  comment: string;
}

const KSGjennomgang = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get("task");
  const conceptId = searchParams.get("concept");
  const projectId = searchParams.get("project");

  const [conceptData, setConceptData] = useState<any>(null);
  const [taskData, setTaskData] = useState<any>(null);
  const [checkpoints, setCheckpoints] = useState<Record<string, Checkpoint>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && taskId && conceptId) {
      fetchData();
    }
  }, [user, taskId, conceptId]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch concept, task, and existing checkpoints in parallel
    const [conceptRes, taskRes, checkpointRes] = await Promise.all([
      supabase.from("fire_concepts").select("*").eq("id", conceptId!).single(),
      supabase.from("tasks").select("*").eq("id", taskId!).single(),
      supabase.from("qa_checkpoints").select("*").eq("task_id", taskId!).eq("concept_id", conceptId!),
    ]);

    if (conceptRes.data) setConceptData(conceptRes.data);
    if (taskRes.data) setTaskData(taskRes.data);

    // Initialize checkpoints
    const initial: Record<string, Checkpoint> = {};
    sections.forEach((s) => {
      initial[s.key] = { section_key: s.key, status: "pending", comment: "" };
    });

    // Overlay saved checkpoints
    if (checkpointRes.data) {
      checkpointRes.data.forEach((cp: any) => {
        if (initial[cp.section_key]) {
          initial[cp.section_key] = {
            section_key: cp.section_key,
            status: cp.status,
            comment: cp.comment || "",
          };
        }
      });
    }

    setCheckpoints(initial);
    setLoading(false);
  };

  const updateCheckpoint = (key: string, field: "status" | "comment", value: string) => {
    setCheckpoints((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const toggleComment = (key: string) => {
    setShowComments((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveCheckpoints = async () => {
    if (!user || !taskId || !conceptId) return;
    setSaving(true);

    // Upsert all checkpoints
    const upserts = Object.values(checkpoints).map((cp) => ({
      task_id: taskId,
      concept_id: conceptId,
      reviewer_id: user.id,
      section_key: cp.section_key,
      status: cp.status,
      comment: cp.comment || null,
    }));

    // Delete existing and insert fresh (simpler than upsert with composite key)
    await supabase.from("qa_checkpoints").delete().eq("task_id", taskId).eq("concept_id", conceptId);
    const { error } = await supabase.from("qa_checkpoints").insert(upserts);

    if (error) {
      toast({ title: "Feil", description: "Kunne ikke lagre sjekkpunkter", variant: "destructive" });
    } else {
      toast({ title: "Lagret", description: "Sjekkpunktene er lagret" });
    }
    setSaving(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok": return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "feil": return <XCircle className="h-5 w-5 text-destructive" />;
      default: return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ok": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">OK</Badge>;
      case "feil": return <Badge variant="destructive">Feil/mangel</Badge>;
      default: return <Badge variant="secondary">Ikke vurdert</Badge>;
    }
  };

  const conceptContent = conceptData?.content as Record<string, any> | null;
  const conceptName = conceptData?.name || "Brannkonsept";

  // Stats
  const total = sections.length;
  const okCount = Object.values(checkpoints).filter((c) => c.status === "ok").length;
  const feilCount = Object.values(checkpoints).filter((c) => c.status === "feil").length;
  const pendingCount = total - okCount - feilCount;

  if (authLoading || !user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <PageHeader title="Kvalitetssikring" />
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Laster brannkonsept…</p>
        </div>
      </div>
    );
  }

  if (!conceptData) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <PageHeader title="Kvalitetssikring" />
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Kunne ikke finne brannkonseptet.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/mine-oppgaver")}>
            Tilbake til oppgaver
          </Button>
        </div>
      </div>
    );
  }

  // Group sections by chapter
  const chapters = [
    { title: "1. Innledning", keys: sections.filter((s) => s.key.startsWith("kap1")) },
    { title: "2. Grunnlag og forutsetninger", keys: sections.filter((s) => s.key.startsWith("kap2")) },
    { title: "3. Branntekniske ytelseskrav", keys: sections.filter((s) => s.key.startsWith("kap3")) },
    { title: "4. Utførelses- og driftsfasen", keys: sections.filter((s) => s.key.startsWith("kap4")) },
    { title: "5. Revisjonshistorikk", keys: sections.filter((s) => s.key === "kap5") },
    { title: "6. Litteraturhenvisninger", keys: sections.filter((s) => s.key === "kap6") },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <PageHeader title="Kvalitetssikring (KS)" />

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header info */}
        <Card className="shadow-soft mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{conceptName}</CardTitle>
            {taskData?.description && (
              <p className="text-sm text-muted-foreground mt-1">{taskData.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>{okCount} OK</span>
              </div>
              <div className="flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-destructive" />
                <span>{feilCount} Feil/mangel</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{pendingCount} Ikke vurdert</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Open concept in read-only view */}
        {projectId && conceptId && (
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => window.open(`/konsept?project=${projectId}&concept=${conceptId}&view=true`, "_blank")}
            >
              Åpne brannkonseptet i lesevisning
            </Button>
          </div>
        )}

        {/* Checkpoint sections */}
        <Accordion type="multiple" defaultValue={chapters.map((_, i) => `ch${i}`)} className="space-y-3">
          {chapters.map((chapter, ci) => (
            <AccordionItem key={ci} value={`ch${ci}`} className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 bg-muted/50 hover:bg-muted/80 font-semibold">
                <div className="flex items-center gap-3 w-full">
                  <span>{chapter.title}</span>
                  <div className="ml-auto flex gap-1 mr-2">
                    {chapter.keys.map((s) => {
                      const cp = checkpoints[s.key];
                      return (
                        <span key={s.key} className={`w-2.5 h-2.5 rounded-full ${
                          cp?.status === "ok" ? "bg-green-500" :
                          cp?.status === "feil" ? "bg-destructive" :
                          "bg-muted-foreground/30"
                        }`} />
                      );
                    })}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-3 space-y-3">
                {chapter.keys.map((section) => {
                  const cp = checkpoints[section.key];
                  const hasComment = cp?.comment && cp.comment.length > 0;
                  const isCommentVisible = showComments[section.key] || hasComment;

                  return (
                    <div key={section.key} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          {getStatusIcon(cp?.status || "pending")}
                          <span className="font-medium text-sm">{section.label}</span>
                        </div>
                        {getStatusBadge(cp?.status || "pending")}
                      </div>

                      <RadioGroup
                        value={cp?.status || "pending"}
                        onValueChange={(val) => updateCheckpoint(section.key, "status", val)}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ok" id={`${section.key}-ok`} />
                          <Label htmlFor={`${section.key}-ok`} className="text-sm cursor-pointer">OK</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="feil" id={`${section.key}-feil`} />
                          <Label htmlFor={`${section.key}-feil`} className="text-sm cursor-pointer">Feil/mangel</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="pending" id={`${section.key}-pending`} />
                          <Label htmlFor={`${section.key}-pending`} className="text-sm cursor-pointer">Ikke vurdert</Label>
                        </div>
                      </RadioGroup>

                      {!isCommentVisible ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => toggleComment(section.key)}
                        >
                          <MessageSquare className="h-3.5 w-3.5 mr-1" />
                          + Kommentar
                        </Button>
                      ) : (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Kommentar</Label>
                          <Textarea
                            placeholder="Skriv en kommentar til dette punktet…"
                            value={cp?.comment || ""}
                            onChange={(e) => updateCheckpoint(section.key, "comment", e.target.value)}
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Save button */}
        <div className="sticky bottom-4 mt-6">
          <Button onClick={saveCheckpoints} disabled={saving} size="lg" className="w-full shadow-lg">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Lagrer…" : "Lagre sjekkpunkter"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default KSGjennomgang;
