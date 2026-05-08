import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Loader2, Sparkles, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  TEMPLATE_OPTIONS,
  FONT_OPTIONS,
  TemplateId,
  TemplateSettings,
  buildResolvedTheme,
  buildCoverPage,
  buildHeader,
  buildFooter,
  buildSectionHeading,
  defaultDocStyles,
  fetchLogoBuffer,
  getTemplateDefaults,
} from "@/lib/document-templates";
import MalForhandsvisning from "./MalForhandsvisning";

interface Props {
  groupId: string;
  groupName: string;
  logoUrl: string | null;
  profileLogoUrl?: string | null;
  initial: TemplateSettings;
  onSaved?: (s: TemplateSettings) => void;
}

const ensureHash = (c: string) => (c.startsWith("#") ? c : `#${c}`);

export default function MalvalgPanel({ groupId, groupName, logoUrl, profileLogoUrl, initial, onSaved }: Props) {
  const { toast } = useToast();
  const [template, setTemplate] = useState<TemplateId>(initial.template ?? "klassisk");
  const [primary, setPrimary] = useState(ensureHash(initial.primary_color ?? "#1A4D8C"));
  const [accent, setAccent] = useState(ensureHash(initial.accent_color ?? "#3B82F6"));
  const [font, setFont] = useState(initial.font_family ?? "Calibri");
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    setTemplate(initial.template ?? "klassisk");
    setPrimary(ensureHash(initial.primary_color ?? "#1A4D8C"));
    setAccent(ensureHash(initial.accent_color ?? "#3B82F6"));
    setFont(initial.font_family ?? "Calibri");
  }, [initial.template, initial.primary_color, initial.accent_color, initial.font_family]);

  const handleSave = async () => {
    setSaving(true);
    const settings: TemplateSettings = {
      template,
      primary_color: primary,
      accent_color: accent,
      font_family: font,
    };
    const { error } = await supabase
      .from("contact_groups")
      .update({ template_settings: settings } as any)
      .eq("id", groupId);
    setSaving(false);
    if (error) {
      toast({ title: "Kunne ikke lagre", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Mal lagret", description: "Bedriftens dokumenter bruker nå dette utseendet." });
    onSaved?.(settings);
  };

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const { Document, Packer } = await import("docx");
      const { saveAs } = await import("file-saver");
      const theme = buildResolvedTheme(
        { template, primary_color: primary, accent_color: accent, font_family: font },
        logoUrl,
        groupName,
      );
      const logo = await fetchLogoBuffer(logoUrl);
      const cover = buildCoverPage(theme, {
        title: "Eksempeldokument",
        subtitle: "Forhåndsvisning av valgt mal",
        projectName: "Demo Prosjekt AS – Kontorbygg",
        date: new Date().toLocaleDateString("nb-NO"),
        authorLine: "Utarbeidet av brannrådgiver",
        logo,
      });
      const doc = new Document({
        styles: defaultDocStyles(theme),
        sections: [
          {
            headers: { default: buildHeader(theme, { logo, documentLabel: "Eksempel" }) },
            footers: { default: buildFooter(theme) },
            children: [
              ...cover,
              buildSectionHeading(theme, "1. Innledning"),
              new (await import("docx")).Paragraph({
                children: [
                  new (await import("docx")).TextRun({
                    text: "Dette er et eksempel på hvordan dokumenter eksportert fra plattformen vil se ut med den valgte malen. Innholdet i ekte dokumenter genereres automatisk basert på prosjektdata.",
                    font: theme.fontFamily,
                    size: 22,
                  }),
                ],
              }),
              buildSectionHeading(theme, "2. Eksempelseksjon", 2),
              new (await import("docx")).Paragraph({
                children: [
                  new (await import("docx")).TextRun({
                    text: "Overskrifter, farger og skrifttype tilpasses automatisk i alle dokumenter du eksporterer fra denne bedriften.",
                    font: theme.fontFamily,
                    size: 22,
                  }),
                ],
              }),
            ],
          },
        ],
      });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `mal-forhandsvisning-${template}.docx`);
    } catch (e: any) {
      toast({ title: "Forhåndsvisning feilet", description: e?.message ?? "", variant: "destructive" });
    } finally {
      setPreviewing(false);
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Dokumentmal for bedriften
        </CardTitle>
        <CardDescription>
          Velg hvordan brannkonsept, tilstandsvurderinger og fraviksdokumentasjon skal se ut for medlemmer i denne gruppen.
          Det faglige innholdet er likt — kun det visuelle uttrykket endres.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template cards */}
        <div className="grid sm:grid-cols-3 gap-3">
          {TEMPLATE_OPTIONS.map((t) => {
            const selected = template === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTemplate(t.id);
                  const d = getTemplateDefaults(t.id);
                  setPrimary(d.primary_color);
                  setAccent(d.accent_color);
                  setFont(d.font_family);
                }}
                className={`text-left rounded-lg border-2 p-4 transition ${
                  selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{t.name}</span>
                  {selected && <Check className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground">{t.description}</p>
                {/* Mini-swatch */}
                <div className="mt-3 flex gap-1">
                  <div
                    className="h-6 flex-1 rounded"
                    style={{
                      background:
                        t.id === "klassisk"
                          ? "#1A4D8C"
                          : t.id === "moderne"
                            ? "#0F172A"
                            : "#111111",
                    }}
                  />
                  <div
                    className="h-6 flex-1 rounded"
                    style={{
                      background:
                        t.id === "klassisk"
                          ? "#3B82F6"
                          : t.id === "moderne"
                            ? "#F97316"
                            : "#555555",
                    }}
                  />
                  <div className="h-6 flex-1 rounded bg-white border" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Color + font customization */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Primærfarge</Label>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                className="h-10 w-14 p-1 cursor-pointer"
              />
              <Input
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                className="font-mono uppercase"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Aksentfarge</Label>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="h-10 w-14 p-1 cursor-pointer"
              />
              <Input
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="font-mono uppercase"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Skrifttype</Label>
            <Select value={font} onValueChange={setFont}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((f) => (
                  <SelectItem key={f} value={f} style={{ fontFamily: f }}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Live preview */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <Label>Forhåndsvisning</Label>
            <span className="text-xs text-muted-foreground">
              Bla gjennom for å se hele malen — endelig layout vises i Word.
            </span>
          </div>
          <div className="rounded-lg bg-muted/40 p-6 max-h-[80vh] overflow-y-auto">
            <MalForhandsvisning
              template={template}
              primary={primary}
              accent={accent}
              font={font}
              logoUrl={logoUrl ?? profileLogoUrl ?? null}
              groupName={groupName}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
            Lagre mal
          </Button>
          <Button variant="outline" onClick={handlePreview} disabled={previewing}>
            {previewing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Forhåndsvis i Word
          </Button>
        </div>

        <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Trenger dere noe helt eget?</p>
          Vi kan lage en skreddersydd mal som speiler bedriftens eksisterende grafiske profil — egen forside, skrifter,
          fargekoder, topp-/bunntekst. Ta kontakt så lager vi den på bestilling.
        </div>
      </CardContent>
    </Card>
  );
}
