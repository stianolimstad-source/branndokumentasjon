import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, FileText, Download, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { exportQuoteToWord, type QuoteLine, type QuoteData, type SenderInfo } from "@/lib/tilbud-export";
import PageHeader from "@/components/PageHeader";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
}

const emptyLine = (): LineItem => ({
  id: crypto.randomUUID(),
  description: "",
  quantity: 1,
  unit: "stk",
  unit_price: 0,
});

const Tilbud = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const projectIdParam = searchParams.get("project");
  const quoteIdParam = searchParams.get("id");

  const [quoteId, setQuoteId] = useState<string | null>(quoteIdParam);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!quoteIdParam);

  // Form state
  const [quoteNumber, setQuoteNumber] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientCompany, setRecipientCompany] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [validityDate, setValidityDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Betaling innen 14 dager etter fakturadato");
  const [conditions, setConditions] = useState("Eventuelle tillegg faktureres etter medgått tid. Alle priser er eks. mva.");
  const [includeMva, setIncludeMva] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(projectIdParam);
  const [lines, setLines] = useState<LineItem[]>([emptyLine()]);

  // Loaded data
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
    if (quoteIdParam && user) loadQuote(quoteIdParam);
  }, [quoteIdParam, user]);

  useEffect(() => {
    const p = projects.find((p) => p.id === projectId);
    setProjectName(p?.name || "");
    setProjectAddress(p?.address || "");
  }, [projectId, projects]);

  const loadProfile = async () => {
    const { data } = await supabase.from("profiles").select("full_name, company, email, phone, logo_url").eq("id", user!.id).single();
    if (data) setProfile(data);
  };

  const loadProjects = async () => {
    const { data } = await supabase.from("projects").select("id, name, address").eq("user_id", user!.id).order("name");
    if (data) setProjects(data);
  };

  const loadQuote = async (id: string) => {
    setLoading(true);
    const { data: q } = await supabase.from("quotes").select("*").eq("id", id).single();
    if (q) {
      setQuoteNumber(q.quote_number || "");
      setRecipientName(q.recipient_name || "");
      setRecipientCompany(q.recipient_company || "");
      setRecipientAddress(q.recipient_address || "");
      setRecipientEmail(q.recipient_email || "");
      setValidityDate(q.validity_date || "");
      setPaymentTerms(q.payment_terms || "");
      setConditions(q.conditions || "");
      setIncludeMva(q.include_mva);
      setProjectId(q.project_id);
      setQuoteId(q.id);

      const { data: lineData } = await supabase
        .from("quote_lines")
        .select("*")
        .eq("quote_id", id)
        .order("sort_order");
      if (lineData && lineData.length > 0) {
        setLines(lineData.map((l) => ({
          id: l.id,
          description: l.description,
          quantity: Number(l.quantity),
          unit: l.unit || "stk",
          unit_price: Number(l.unit_price),
        })));
      }
    }
    setLoading(false);
  };

  const updateLine = (id: string, field: keyof LineItem, value: string | number) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const removeLine = (id: string) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)));
  };

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
  const mva = includeMva ? subtotal * 0.25 : 0;
  const total = subtotal + mva;

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK" }).format(n);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const quoteData = {
      user_id: user.id,
      project_id: projectId || null,
      quote_number: quoteNumber || null,
      recipient_name: recipientName || null,
      recipient_company: recipientCompany || null,
      recipient_address: recipientAddress || null,
      recipient_email: recipientEmail || null,
      validity_date: validityDate || null,
      payment_terms: paymentTerms,
      conditions,
      include_mva: includeMva,
    };

    let savedQuoteId = quoteId;

    if (quoteId) {
      const { error } = await supabase.from("quotes").update(quoteData).eq("id", quoteId);
      if (error) { toast({ title: "Feil", description: "Kunne ikke oppdatere tilbudet", variant: "destructive" }); setSaving(false); return; }
      // Delete old lines and re-insert
      await supabase.from("quote_lines").delete().eq("quote_id", quoteId);
    } else {
      const { data, error } = await supabase.from("quotes").insert(quoteData).select("id").single();
      if (error || !data) { toast({ title: "Feil", description: "Kunne ikke lagre tilbudet", variant: "destructive" }); setSaving(false); return; }
      savedQuoteId = data.id;
      setQuoteId(data.id);
    }

    // Insert lines
    const lineInserts = lines.map((l, i) => ({
      quote_id: savedQuoteId!,
      description: l.description,
      quantity: l.quantity,
      unit: l.unit,
      unit_price: l.unit_price,
      sort_order: i,
    }));
    await supabase.from("quote_lines").insert(lineInserts);

    toast({ title: "Lagret", description: "Tilbudet er lagret" });
    setSaving(false);
  };

  const handleExportWord = () => {
    const data: QuoteData = {
      quote_number: quoteNumber,
      recipient_name: recipientName,
      recipient_company: recipientCompany,
      recipient_address: recipientAddress,
      recipient_email: recipientEmail,
      validity_date: validityDate,
      payment_terms: paymentTerms,
      conditions,
      include_mva: includeMva,
      project_name: projectName,
      project_address: projectAddress,
      lines: lines.map((l) => ({ id: l.id, description: l.description, quantity: l.quantity, unit: l.unit, unit_price: l.unit_price })),
    };
    exportQuoteToWord(data, profile);
  };

  const handleExportPdf = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">Laster tilbud...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        <PageHeader
          title="Tilbudsgenerator"
          subtitle="Opprett og eksporter profesjonelle tilbud"
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
          {/* Recipient */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Mottaker</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Firma</Label><Input value={recipientCompany} onChange={(e) => setRecipientCompany(e.target.value)} placeholder="Firma AS" /></div>
              <div><Label>Kontaktperson</Label><Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Ola Nordmann" /></div>
              <div><Label>Adresse</Label><Input value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} placeholder="Gateveien 1, 0000 Oslo" /></div>
              <div><Label>E-post</Label><Input value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="ola@firma.no" /></div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Tilbudsdetaljer</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Tilbudsnummer</Label><Input value={quoteNumber} onChange={(e) => setQuoteNumber(e.target.value)} placeholder="T-2026-001" /></div>
              <div><Label>Gyldig til</Label><Input type="date" value={validityDate} onChange={(e) => setValidityDate(e.target.value)} /></div>
              <div className="flex items-center gap-2">
                <Switch id="mva" checked={includeMva} onCheckedChange={setIncludeMva} />
                <Label htmlFor="mva">Inkluder MVA (25%)</Label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Price lines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Prislinjer</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setLines((prev) => [...prev, emptyLine()])}>
              <Plus className="h-4 w-4 mr-1" /> Legg til linje
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Header row */}
            <div className="hidden md:grid md:grid-cols-[1fr_80px_80px_120px_120px_40px] gap-2 text-xs font-medium text-muted-foreground px-1">
              <span>Beskrivelse</span><span>Antall</span><span>Enhet</span><span>Enhetspris</span><span>Sum</span><span />
            </div>
            {lines.map((line) => (
              <div key={line.id} className="grid grid-cols-1 md:grid-cols-[1fr_80px_80px_120px_120px_40px] gap-2 items-center">
                <Input
                  value={line.description}
                  onChange={(e) => updateLine(line.id, "description", e.target.value)}
                  placeholder="Beskrivelse av tjeneste"
                />
                <Input
                  type="number"
                  min={0}
                  value={line.quantity}
                  onChange={(e) => updateLine(line.id, "quantity", Number(e.target.value))}
                />
                <Input
                  value={line.unit}
                  onChange={(e) => updateLine(line.id, "unit", e.target.value)}
                  placeholder="stk"
                />
                <Input
                  type="number"
                  min={0}
                  value={line.unit_price}
                  onChange={(e) => updateLine(line.id, "unit_price", Number(e.target.value))}
                />
                <div className="text-sm font-medium text-right pr-1">
                  {formatCurrency(line.quantity * line.unit_price)}
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeLine(line.id)} disabled={lines.length <= 1}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}

            <Separator />
            <div className="flex flex-col items-end gap-1 text-sm">
              <div className="flex gap-4"><span className="text-muted-foreground">Sum eks. mva:</span><span className="font-medium w-28 text-right">{formatCurrency(subtotal)}</span></div>
              {includeMva && (
                <div className="flex gap-4"><span className="text-muted-foreground">MVA 25%:</span><span className="font-medium w-28 text-right">{formatCurrency(mva)}</span></div>
              )}
              <div className="flex gap-4 text-base"><span className="font-semibold">Totalt{includeMva ? " inkl. mva" : ""}:</span><span className="font-bold w-28 text-right">{formatCurrency(total)}</span></div>
            </div>
          </CardContent>
        </Card>

        {/* Conditions */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Betingelser</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Betalingsvilkår</Label><Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} /></div>
            <div><Label>Øvrige betingelser</Label><Textarea value={conditions} onChange={(e) => setConditions(e.target.value)} rows={3} /></div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleSave} disabled={saving || !user}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Lagrer..." : quoteId ? "Oppdater tilbud" : "Lagre tilbud"}
          </Button>
          <Button variant="outline" onClick={handleExportWord}>
            <FileText className="h-4 w-4 mr-2" /> Last ned Word
          </Button>
          <Button variant="outline" onClick={handleExportPdf}>
            <Download className="h-4 w-4 mr-2" /> Skriv ut / PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Tilbud;
