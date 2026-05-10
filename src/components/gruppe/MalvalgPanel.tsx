import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ColorPicker } from "@/components/ui/color-picker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Check, Loader2, Sparkles, Download, Plus, Trash2, Star, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  TEMPLATE_OPTIONS,
  FONT_OPTIONS,
  TemplateId,
  TemplateSettings,
  TemplateExtras,
  DEFAULT_EXTRAS,
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

interface GroupTemplateRow {
  id: string;
  name: string;
  base_template: TemplateId;
  primary_color: string;
  accent_color: string;
  font_family: string;
  settings: TemplateExtras;
  is_default: boolean;
  sort_order: number;
}

const ensureHash = (c: string) => (c.startsWith("#") ? c : `#${c}`);

export default function MalvalgPanel({ groupId, groupName, logoUrl, profileLogoUrl, initial, onSaved }: Props) {
  const { toast } = useToast();

  // List of saved custom templates for this group
  const [templates, setTemplates] = useState<GroupTemplateRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<GroupTemplateRow | null>(null);

  // Editor state — bound to currently active template
  const [name, setName] = useState("");
  const [template, setTemplate] = useState<TemplateId>(initial.template ?? "klassisk");
  const [primary, setPrimary] = useState(ensureHash(initial.primary_color ?? "#1A4D8C"));
  const [accent, setAccent] = useState(ensureHash(initial.accent_color ?? "#3B82F6"));
  const [font, setFont] = useState(initial.font_family ?? "Calibri");
  const [extras, setExtras] = useState<TemplateExtras>({ ...DEFAULT_EXTRAS, ...(initial.extras ?? {}) });

  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const loadTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("group_templates" as any)
      .select("id, name, base_template, primary_color, accent_color, font_family, settings, is_default, sort_order")
      .eq("group_id", groupId)
      .order("is_default", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setLoading(false);
    if (error) {
      toast({ title: "Kunne ikke laste maler", description: error.message, variant: "destructive" });
      return;
    }
    const rows = (data ?? []) as unknown as GroupTemplateRow[];
    setTemplates(rows);
    // Auto-select default or first row
    if (rows.length > 0) {
      const def = rows.find((r) => r.is_default) ?? rows[0];
      loadIntoEditor(def);
    } else {
      setActiveId(null);
    }
  };

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const loadIntoEditor = (row: GroupTemplateRow) => {
    setActiveId(row.id);
    setName(row.name);
    setTemplate(row.base_template);
    setPrimary(ensureHash(row.primary_color));
    setAccent(ensureHash(row.accent_color));
    setFont(row.font_family);
    setExtras({ ...DEFAULT_EXTRAS, ...(row.settings ?? {}) });
  };

  const handleSave = async () => {
    if (!activeId) {
      toast({ title: "Velg eller opprett en mal først", variant: "destructive" });
      return;
    }
    if (!name.trim()) {
      toast({ title: "Malen må ha et navn", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("group_templates" as any)
      .update({
        name: name.trim(),
        base_template: template,
        primary_color: primary,
        accent_color: accent,
        font_family: font,
        settings: extras,
      } as any)
      .eq("id", activeId);

    if (!error) {
      // Mirror onto contact_groups.template_settings if this is the default — keeps backward compat
      const row = templates.find((t) => t.id === activeId);
      if (row?.is_default) {
        const settings: TemplateSettings = {
          template,
          primary_color: primary,
          accent_color: accent,
          font_family: font,
          extras,
        };
        await supabase.from("contact_groups").update({ template_settings: settings } as any).eq("id", groupId);
        onSaved?.(settings);
      }
    }
    setSaving(false);
    if (error) {
      toast({ title: "Kunne ikke lagre", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Mal lagret" });
    await loadTemplates();
  };

  const handleSetDefault = async (row: GroupTemplateRow) => {
    // Clear existing default, then set this one. Partial unique index requires no overlap.
    const { error: clearErr } = await supabase
      .from("group_templates" as any)
      .update({ is_default: false } as any)
      .eq("group_id", groupId)
      .eq("is_default", true);
    if (clearErr) {
      toast({ title: "Kunne ikke endre standard", description: clearErr.message, variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("group_templates" as any)
      .update({ is_default: true } as any)
      .eq("id", row.id);
    if (error) {
      toast({ title: "Kunne ikke sette som standard", description: error.message, variant: "destructive" });
      return;
    }
    // Mirror to contact_groups for backward compatibility
    const settings: TemplateSettings = {
      template: row.base_template,
      primary_color: row.primary_color,
      accent_color: row.accent_color,
      font_family: row.font_family,
      extras: row.settings,
    };
    await supabase.from("contact_groups").update({ template_settings: settings } as any).eq("id", groupId);
    onSaved?.(settings);
    toast({ title: `"${row.name}" er nå standard` });
    await loadTemplates();
  };

  const handleDelete = async (row: GroupTemplateRow) => {
    const { error } = await supabase.from("group_templates" as any).delete().eq("id", row.id);
    if (error) {
      toast({ title: "Kunne ikke slette", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Mal slettet" });
    setConfirmDelete(null);
    await loadTemplates();
  };

  const handleCreate = async () => {
    setCreating(true);
    const d = getTemplateDefaults("klassisk");
    // Find next available "Ny mal" name
    const existingNames = new Set(templates.map((t) => t.name));
    let candidate = "Ny mal";
    let i = 2;
    while (existingNames.has(candidate)) {
      candidate = `Ny mal ${i++}`;
    }
    const { data, error } = await supabase
      .from("group_templates" as any)
      .insert({
        group_id: groupId,
        name: candidate,
        base_template: "klassisk",
        primary_color: d.primary_color,
        accent_color: d.accent_color,
        font_family: d.font_family,
        settings: DEFAULT_EXTRAS,
        is_default: templates.length === 0,
        sort_order: templates.length,
      } as any)
      .select("id, name, base_template, primary_color, accent_color, font_family, settings, is_default, sort_order")
      .single();
    setCreating(false);
    if (error) {
      toast({ title: "Kunne ikke opprette mal", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Mal opprettet" });
    await loadTemplates();
    if (data) {
      loadIntoEditor(data as unknown as GroupTemplateRow);
      // Focus name input shortly after render
      setTimeout(() => {
        const el = document.getElementById("tpl-name") as HTMLInputElement | null;
        el?.focus();
        el?.select();
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
    }
  };

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const { Document, Packer } = await import("docx");
      const { saveAs } = await import("file-saver");
      const theme = buildResolvedTheme(
        { template, primary_color: primary, accent_color: accent, font_family: font, extras },
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
                    text: "Dette er et eksempel på hvordan dokumenter eksportert fra plattformen vil se ut med den valgte malen.",
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
      saveAs(blob, `mal-forhandsvisning-${(name || template).replace(/\s+/g, "-")}.docx`);
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
          Bedriftens dokumentmaler
        </CardTitle>
        <CardDescription>
          Lag og lagre flere egne maler. Malen som er markert som <strong>standard</strong> brukes på alle dokumenter
          eksportert fra prosjekter delt med bedriften.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium">Mine maler</Label>
            <Button size="sm" variant="outline" onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4 mr-1" /> Ny mal
            </Button>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Laster maler…
            </div>
          ) : templates.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Ingen egne maler ennå. Klikk <span className="font-medium text-foreground">«Ny mal»</span> for å lage den
              første — du kan ta utgangspunkt i en av de tre ferdige presetene.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {templates.map((t) => {
                const selected = activeId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => loadIntoEditor(t)}
                    className={`text-left rounded-lg border-2 p-3 transition relative ${
                      selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-semibold truncate">{t.name}</span>
                        {t.is_default && (
                          <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[10px]">
                            <Star className="h-3 w-3 fill-current" /> Standard
                          </Badge>
                        )}
                      </div>
                      {selected && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground capitalize">
                      Basert på {t.base_template}
                    </p>
                    <div className="mt-2 flex gap-1">
                      <div className="h-5 flex-1 rounded" style={{ background: ensureHash(t.primary_color) }} />
                      <div className="h-5 flex-1 rounded" style={{ background: ensureHash(t.accent_color) }} />
                      <div className="h-5 flex-1 rounded bg-white border" />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {!t.is_default && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetDefault(t);
                          }}
                          className="text-[11px] underline text-muted-foreground hover:text-foreground"
                        >
                          Sett som standard
                        </span>
                      )}
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(t);
                        }}
                        className="text-[11px] underline text-destructive/80 hover:text-destructive ml-auto"
                      >
                        Slett
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {activeId && (
          <>
            <Separator />

            <div className="space-y-2">
              <Label htmlFor="tpl-name" className="flex items-center gap-2">
                <Pencil className="h-4 w-4" /> Navn på mal
              </Label>
              <Input id="tpl-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Baselayout</Label>
              <div className="grid sm:grid-cols-3 gap-2">
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
                      className={`text-left rounded-lg border-2 p-3 transition ${
                        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">{t.name}</span>
                        {selected && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{t.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Primærfarge</Label>
                <div className="flex items-center gap-2">
                  <ColorPicker value={primary} onChange={setPrimary} />
                  <Input value={primary} onChange={(e) => setPrimary(ensureHash(e.target.value))} className="font-mono uppercase" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Aksentfarge</Label>
                <div className="flex items-center gap-2">
                  <ColorPicker value={accent} onChange={setAccent} />
                  <Input value={accent} onChange={(e) => setAccent(ensureHash(e.target.value))} className="font-mono uppercase" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Skrifttype</Label>
                <Select value={font} onValueChange={setFont}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((f) => (
                      <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-medium">Layout-tilpasninger</Label>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Topplinje på forside</Label>
                  <Select
                    value={extras.topbar_height ?? "thick"}
                    onValueChange={(v) => setExtras({ ...extras, topbar_height: v as any })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">Av</SelectItem>
                      <SelectItem value="thin">Tynn</SelectItem>
                      <SelectItem value="thick">Tykk</SelectItem>
                      <SelectItem value="extra">Ekstra tykk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Logoplassering i topptekst</Label>
                  <Select
                    value={extras.logo_position ?? "right"}
                    onValueChange={(v) => setExtras({ ...extras, logo_position: v as any })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Venstre</SelectItem>
                      <SelectItem value="center">Sentrert</SelectItem>
                      <SelectItem value="right">Høyre</SelectItem>
                      <SelectItem value="hidden">Skjul</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Datoformat</Label>
                  <Select
                    value={extras.date_format ?? "no-short"}
                    onValueChange={(v) => setExtras({ ...extras, date_format: v as any })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-short">10.05.2026</SelectItem>
                      <SelectItem value="no-long">10. mai 2026</SelectItem>
                      <SelectItem value="iso">2026-05-10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Avstand før tittel (forside)</Label>
                  <Select
                    value={extras.cover_spacing ?? "standard"}
                    onValueChange={(v) => setExtras({ ...extras, cover_spacing: v as any })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Liten</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="large">Stor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 pt-2">
                <div className="flex items-center justify-between rounded-md border p-3">
                  <Label htmlFor="footer-company" className="text-xs">Vis bedriftsnavn i bunntekst</Label>
                  <Switch
                    id="footer-company"
                    checked={extras.footer_show_company ?? true}
                    onCheckedChange={(v) => setExtras({ ...extras, footer_show_company: v })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <Label htmlFor="footer-page" className="text-xs">Vis sidetall</Label>
                  <Switch
                    id="footer-page"
                    checked={extras.footer_show_page ?? true}
                    onCheckedChange={(v) => setExtras({ ...extras, footer_show_page: v })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <Label htmlFor="footer-date" className="text-xs">Vis dato</Label>
                  <Switch
                    id="footer-date"
                    checked={extras.footer_show_date ?? true}
                    onCheckedChange={(v) => setExtras({ ...extras, footer_show_date: v })}
                  />
                </div>
              </div>
            </div>

            {/* Live preview */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label>Forhåndsvisning</Label>
                <span className="text-xs text-muted-foreground">Eksempel — endelig innhold kommer fra prosjektet.</span>
              </div>
              <div className="rounded-lg bg-muted/40 p-6 max-h-[80vh] overflow-y-auto">
                <MalForhandsvisning
                  template={template}
                  primary={primary}
                  accent={accent}
                  font={font}
                  logoUrl={logoUrl ?? profileLogoUrl ?? null}
                  groupName={groupName}
                  extras={extras}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                Lagre endringer
              </Button>
              <Button variant="outline" onClick={handlePreview} disabled={previewing}>
                {previewing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Forhåndsvis i Word
              </Button>
            </div>
          </>
        )}

        <div className="rounded-lg border bg-primary/5 p-4 text-sm text-muted-foreground">
          Medlemmer i denne bedriften kan velge bedriftens standardmal fra <span className="font-medium text-foreground">Min profil → Dokumentmal</span>.
        </div>
      </CardContent>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slette malen "{confirmDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Dette kan ikke angres. Dokumenter som allerede er eksportert berøres ikke.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Slett mal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
