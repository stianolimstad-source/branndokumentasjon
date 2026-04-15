import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { exportEngagementToWord, type EngagementData, type SenderInfo } from "@/lib/engagement-export";
import PageHeader from "@/components/PageHeader";

const Oppdragsbekreftelse = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const projectIdParam = searchParams.get("project");
  const engagementIdParam = searchParams.get("id");

  const [engagementId, setEngagementId] = useState<string | null>(engagementIdParam);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!engagementIdParam);

  const [engagementNumber, setEngagementNumber] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [scope, setScope] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [timeline, setTimeline] = useState("");
  const [feeDescription, setFeeDescription] = useState("");
  const [feeAmount, setFeeAmount] = useState<number | undefined>(undefined);
  const [conditions, setConditions] = useState("Oppdraget utføres i henhold til avtalt omfang. Eventuelle tilleggsarbeider avtales separat.");
  const [projectId, setProjectId] = useState<string | null>(projectIdParam);

  const [projects, setProjects] = useState<{ id: string; name: string; address: string | null }[]>([]);
  const [profile, setProfile] = useState<SenderInfo>({});
  const [projectName, setProjectName] = useState("");
  const [projectAddress, setProjectAddress] = useState("");

  useEffect(() => {
    if (user) {
      loadProfile();
      loadProjects();
    }
  }, [user]);

  useEffect(() => {
    if (engagementIdParam && user) loadEngagement(engagementIdParam);
  }, [engagementIdParam, user]);

  useEffect(() => {
    const p = projects.find((p) => p.id === projectId);
    setProjectName(p?.name || "");
    setProjectAddress(p?.address || "");
  }, [projectId, projects]);

  const loadProfile = async () => {
    const { data } = await supabase.from("profiles").select("full_name, company, email, phone").eq("id", user!.id).single();
    if (data) setProfile(data);
  };

  const loadProjects = async () => {
    const { data } = await supabase.from("projects").select("id, name, address").eq("user_id", user!.id).order("name");
    if (data) setProjects(data);
  };

  const loadEngagement = async (id: string) => {
    setLoading(true);
    const { data } = await supabase.from("engagements").select("*").eq("id", id).single();
    if (data) {
      setEngagementNumber(data.engagement_number || "");
      setClientName(data.client_name || "");
      setClientCompany(data.client_company || "");
      setClientAddress(data.client_address || "");
      setClientEmail(data.client_email || "");
      setAssignmentDescription(data.assignment_description || "");
      setScope(data.scope || "");
      setDeliverables(data.deliverables || "");
      setTimeline(data.timeline || "");
      setFeeDescription(data.fee_description || "");
      setFeeAmount(data.fee_amount ? Number(data.fee_amount) : undefined);
      setConditions(data.conditions || "");
      setProjectId(data.project_id);
      setEngagementId(data.id);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const engagementData = {
      user_id: user.id,
      project_id: projectId || null,
      engagement_number: engagementNumber || null,
      client_name: clientName || null,
      client_company: clientCompany || null,
      client_address: clientAddress || null,
      client_email: clientEmail || null,
      assignment_description: assignmentDescription || null,
      scope: scope || null,
      deliverables: deliverables || null,
      timeline: timeline || null,
      fee_description: feeDescription || null,
      fee_amount: feeAmount || null,
      conditions,
    };

    if (engagementId) {
      const { error } = await supabase.from("engagements").update(engagementData).eq("id", engagementId);
      if (error) { toast({ title: "Feil", description: "Kunne ikke oppdatere", variant: "destructive" }); setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from("engagements").insert(engagementData).select("id").single();
      if (error || !data) { toast({ title: "Feil", description: "Kunne ikke lagre", variant: "destructive" }); setSaving(false); return; }
      setEngagementId(data.id);
    }

    toast({ title: "Lagret", description: "Oppdragsbekreftelsen er lagret" });
    setSaving(false);
  };

  const handleExportWord = () => {
    const data: EngagementData = {
      engagement_number: engagementNumber,
      client_name: clientName,
      client_company: clientCompany,
      client_address: clientAddress,
      client_email: clientEmail,
      assignment_description: assignmentDescription,
      scope,
      deliverables,
      timeline,
      fee_description: feeDescription,
      fee_amount: feeAmount,
      conditions,
      project_name: projectName,
      project_address: projectAddress,
    };
    exportEngagementToWord(data, profile);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">Laster oppdragsbekreftelse...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <PageHeader
          title="Oppdragsbekreftelse"
          subtitle="Opprett og eksporter oppdragsbekreftelser"
        />

        {/* Project selector */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Prosjekttilknytning (valgfritt)</CardTitle></CardHeader>
          <CardContent>
            <Select value={projectId || "none"} onValueChange={(v) => setProjectId(v === "none" ? null : v)}>
              <SelectTrigger><SelectValue placeholder="Velg prosjekt" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ingen prosjekttilknytning</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Client */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Oppdragsgiver</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Firma</Label><Input value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} placeholder="Firma AS" /></div>
              <div><Label>Kontaktperson</Label><Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ola Nordmann" /></div>
              <div><Label>Adresse</Label><Input value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} placeholder="Gateveien 1, 0000 Oslo" /></div>
              <div><Label>E-post</Label><Input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="ola@firma.no" /></div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Detaljer</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Oppdragsnummer</Label><Input value={engagementNumber} onChange={(e) => setEngagementNumber(e.target.value)} placeholder="OB-2026-001" /></div>
              <div><Label>Honorar (kr)</Label><Input type="number" value={feeAmount || ""} onChange={(e) => setFeeAmount(e.target.value ? Number(e.target.value) : undefined)} placeholder="Totalhonorar" /></div>
              <div><Label>Honorarbeskrivelse</Label><Input value={feeDescription} onChange={(e) => setFeeDescription(e.target.value)} placeholder="F.eks. fastpris, etter medgått tid" /></div>
            </CardContent>
          </Card>
        </div>

        {/* Assignment */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Oppdrag</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Oppdragsbeskrivelse</Label><Textarea value={assignmentDescription} onChange={(e) => setAssignmentDescription(e.target.value)} rows={4} placeholder="Beskriv oppdraget..." /></div>
            <div><Label>Omfang</Label><Textarea value={scope} onChange={(e) => setScope(e.target.value)} rows={3} placeholder="Hva inngår i oppdraget..." /></div>
            <div><Label>Leveranser</Label><Textarea value={deliverables} onChange={(e) => setDeliverables(e.target.value)} rows={3} placeholder="Hva skal leveres..." /></div>
            <div><Label>Tidsplan</Label><Textarea value={timeline} onChange={(e) => setTimeline(e.target.value)} rows={2} placeholder="Forventet tidsramme..." /></div>
          </CardContent>
        </Card>

        {/* Conditions */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Vilkår</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={conditions} onChange={(e) => setConditions(e.target.value)} rows={3} />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleSave} disabled={saving || !user}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Lagrer..." : engagementId ? "Oppdater" : "Lagre"}
          </Button>
          <Button variant="outline" onClick={handleExportWord}>
            <FileText className="h-4 w-4 mr-2" /> Last ned Word
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-2" /> Skriv ut / PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Oppdragsbekreftelse;
