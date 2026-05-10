import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TEMPLATE_OPTIONS, TemplateId, getTemplateDefaults, DEFAULT_EXTRAS } from "@/lib/document-templates";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  existingCount: number;
  onCreated: (id: string) => void;
}

export default function NyMalDialog({ open, onOpenChange, groupId, existingCount, onCreated }: Props) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [base, setBase] = useState<TemplateId>("klassisk");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName("");
    setBase("klassisk");
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({ title: "Gi malen et navn", variant: "destructive" });
      return;
    }
    setSaving(true);
    const d = getTemplateDefaults(base);
    const { data, error } = await supabase
      .from("group_templates" as any)
      .insert({
        group_id: groupId,
        name: name.trim(),
        base_template: base,
        primary_color: d.primary_color,
        accent_color: d.accent_color,
        font_family: d.font_family,
        settings: DEFAULT_EXTRAS,
        is_default: existingCount === 0, // first template auto-becomes default
        sort_order: existingCount,
      } as any)
      .select("id")
      .single();
    setSaving(false);
    if (error) {
      toast({ title: "Kunne ikke opprette mal", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Mal opprettet" });
    reset();
    onCreated((data as any).id);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ny mal</DialogTitle>
          <DialogDescription>
            Gi malen et navn og velg hvilken baselayout du vil ta utgangspunkt i. Du justerer farger, font og
            layout-detaljer i neste steg.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-tpl-name">Navn</Label>
            <Input
              id="new-tpl-name"
              placeholder="F.eks. Standard rapport"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Start fra preset</Label>
            <div className="grid sm:grid-cols-3 gap-2">
              {TEMPLATE_OPTIONS.map((t) => {
                const selected = base === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setBase(t.id)}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Avbryt
          </Button>
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Opprett mal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
