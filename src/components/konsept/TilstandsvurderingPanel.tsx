import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type TilstandGrad = "tg0" | "tg1" | "tg2" | "tg3" | "tgiu" | "";

export interface TilstandBilde {
  url: string;
  beskrivelse: string;
}

export interface TilstandKategori {
  beskrivelse: string;
  bilder: TilstandBilde[];
}

export interface TilstandData {
  grad: TilstandGrad;
  // Legacy (beholdt for bakoverkompat – vises som "tiltak" inntil bruker redigerer)
  beskrivelse: string;
  bilder: TilstandBilde[];
  // Nye kategorier
  tiltak?: TilstandKategori;
  fravik?: TilstandKategori;
}

export const emptyKategori = (): TilstandKategori => ({ beskrivelse: "", bilder: [] });

export const emptyTilstand = (): TilstandData => ({
  grad: "",
  beskrivelse: "",
  bilder: [],
  tiltak: emptyKategori(),
  fravik: emptyKategori(),
});

const gradLabels: Record<string, { label: string; color: string }> = {
  tg0: { label: "TG 0 – Ingen avvik", color: "bg-green-100 text-green-800 border-green-300" },
  tg1: { label: "TG 1 – Mindre avvik", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  tg2: { label: "TG 2 – Vesentlige avvik", color: "bg-orange-100 text-orange-800 border-orange-300" },
  tg3: { label: "TG 3 – Store avvik", color: "bg-red-100 text-red-800 border-red-300" },
  tgiu: { label: "TG IU – Ikke undersøkt", color: "bg-gray-100 text-gray-800 border-gray-300" },
};

interface TilstandsvurderingPanelProps {
  sectionKey: string;
  sectionLabel: string;
  data: TilstandData;
  onChange: (data: TilstandData) => void;
}

const normalize = (bilder: any[]): TilstandBilde[] =>
  (bilder || []).map((b: any) => (typeof b === "string" ? { url: b, beskrivelse: "" } : b));

/**
 * Lazy-migrate legacy fields into new tiltak/fravik structure.
 * Legacy `beskrivelse` + `bilder` flyttes til `tiltak` (krever aktive tiltak)
 * dersom verken `tiltak` eller `fravik` er satt.
 */
const ensureKategorier = (data: TilstandData): { tiltak: TilstandKategori; fravik: TilstandKategori } => {
  const harNye = !!(data.tiltak || data.fravik);
  const harLegacy = !!(data.beskrivelse || (data.bilder && data.bilder.length > 0));
  if (!harNye && harLegacy) {
    return {
      tiltak: { beskrivelse: data.beskrivelse || "", bilder: normalize(data.bilder) },
      fravik: emptyKategori(),
    };
  }
  return {
    tiltak: data.tiltak ? { beskrivelse: data.tiltak.beskrivelse || "", bilder: normalize(data.tiltak.bilder) } : emptyKategori(),
    fravik: data.fravik ? { beskrivelse: data.fravik.beskrivelse || "", bilder: normalize(data.fravik.bilder) } : emptyKategori(),
  };
};

const TilstandsvurderingPanel = ({ sectionKey, sectionLabel, data, onChange }: TilstandsvurderingPanelProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState<"tiltak" | "fravik" | null>(null);

  const { tiltak, fravik } = ensureKategorier(data);

  const updateKategori = (kind: "tiltak" | "fravik", patch: Partial<TilstandKategori>) => {
    const next: TilstandData = {
      ...data,
      tiltak,
      fravik,
      // Tøm legacy så de ikke dukker opp dobbelt etter migrering
      beskrivelse: "",
      bilder: [],
    };
    next[kind] = { ...next[kind]!, ...patch };
    onChange(next);
  };

  const handleImageUpload = async (kind: "tiltak" | "fravik", e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    setUploading(kind);
    const newImages: TilstandBilde[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${sectionKey}/${kind}/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from("tilstandsvurdering-images")
        .upload(path, file);

      if (!error) {
        const { data: urlData } = supabase.storage
          .from("tilstandsvurdering-images")
          .getPublicUrl(path);
        newImages.push({ url: urlData.publicUrl, beskrivelse: "" });
      }
    }

    if (newImages.length > 0) {
      const current = kind === "tiltak" ? tiltak : fravik;
      updateKategori(kind, { bilder: [...current.bilder, ...newImages] });
    }
    setUploading(null);
    e.target.value = "";
  };

  const removeImage = (kind: "tiltak" | "fravik", index: number) => {
    const current = kind === "tiltak" ? tiltak : fravik;
    updateKategori(kind, { bilder: current.bilder.filter((_, i) => i !== index) });
  };

  const updateImageBeskrivelse = (kind: "tiltak" | "fravik", index: number, beskrivelse: string) => {
    const current = kind === "tiltak" ? tiltak : fravik;
    const updated = current.bilder.map((b, i) => (i === index ? { ...b, beskrivelse } : b));
    updateKategori(kind, { bilder: updated });
  };

  const renderKategori = (
    kind: "tiltak" | "fravik",
    label: string,
    helpText: string,
    accent: { wrapper: string; chip: string },
  ) => {
    const k = kind === "tiltak" ? tiltak : fravik;
    return (
      <div className={`p-3 rounded-md border ${accent.wrapper}`}>
        <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${accent.chip}`}>{label}</p>
        <p className="text-[11px] text-muted-foreground mb-2">{helpText}</p>
        <Label className="text-xs font-medium mb-1 block">Beskrivelse</Label>
        <Textarea
          value={k.beskrivelse}
          onChange={(e) => updateKategori(kind, { beskrivelse: e.target.value })}
          placeholder={kind === "tiltak"
            ? "Beskriv avvik som krever aktive tiltak for å settes tilbake til riktig stand..."
            : "Beskriv avvik som vurderes som akseptabelt og kan fraviksbehandles..."}
          rows={3}
          className="bg-background"
        />

        <div className="mt-3">
          <Label className="text-xs font-medium mb-1 block">Bilder</Label>
          <div className="space-y-2 mb-2">
            {k.bilder.map((bilde, i) => (
              <div key={i} className="flex gap-3 items-start p-2 rounded-md border bg-background">
                <div className="relative group shrink-0">
                  <img src={bilde.url} alt={`${label} ${i + 1}`} className="w-20 h-20 object-cover rounded border" />
                  <button
                    type="button"
                    onClick={() => removeImage(kind, i)}
                    className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="text-xs font-medium mb-1 block">Bildebeskrivelse</Label>
                  <Input
                    value={bilde.beskrivelse}
                    onChange={(e) => updateImageBeskrivelse(kind, i, e.target.value)}
                    placeholder="Beskriv hva bildet viser..."
                    className="text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            <label>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleImageUpload(kind, e)} disabled={uploading !== null} />
              <Button type="button" variant="outline" size="sm" className="cursor-pointer" asChild disabled={uploading !== null}>
                <span>
                  {uploading === kind ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <ImagePlus className="h-3 w-3 mr-1" />}
                  {uploading === kind ? "Laster opp..." : "Ta bilde"}
                </span>
              </Button>
            </label>
            <label>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(kind, e)} disabled={uploading !== null} />
              <Button type="button" variant="outline" size="sm" className="cursor-pointer" asChild disabled={uploading !== null}>
                <span>
                  {uploading === kind ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <ImagePlus className="h-3 w-3 mr-1" />}
                  {uploading === kind ? "Laster opp..." : "Velg fra galleri"}
                </span>
              </Button>
            </label>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-3 p-4 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-700 space-y-3">
      <Label className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
        Tilstandsvurdering – {sectionLabel}
      </Label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-medium mb-1 block">Tilstandsgrad</Label>
          <Select value={data.grad} onValueChange={(val) => onChange({ ...data, grad: val as TilstandGrad })}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Velg tilstandsgrad..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(gradLabels).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {data.grad && (
          <div className="flex items-end">
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${gradLabels[data.grad]?.color || ""}`}>
              {gradLabels[data.grad]?.label}
            </span>
          </div>
        )}
      </div>

      {renderKategori(
        "tiltak",
        "Avvik som krever aktive tiltak",
        "Avvik som må utbedres / settes tilbake til riktig stand.",
        { wrapper: "border-red-300 bg-red-50/60 dark:bg-red-950/20 dark:border-red-800", chip: "text-red-800 dark:text-red-300" },
      )}

      {renderKategori(
        "fravik",
        "Avvik som kan fraviksbehandles",
        "Avvik som vurderes akseptable og dokumenteres som fravik (kvalitativ analyse e.l.).",
        { wrapper: "border-amber-300 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-800", chip: "text-amber-800 dark:text-amber-300" },
      )}
    </div>
  );
};

export default TilstandsvurderingPanel;
