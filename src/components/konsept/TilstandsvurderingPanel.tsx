import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type TilstandGrad = "tg0" | "tg1" | "tg2" | "tg3" | "tgiu" | "";

export interface TilstandBilde {
  url: string;
  beskrivelse: string;
}

export interface TilstandAvvik {
  id: string;
  grad: TilstandGrad;
  beskrivelse: string;
  bilder: TilstandBilde[];
}

export interface TilstandKategori {
  beskrivelse: string;
  bilder: TilstandBilde[];
  avvik?: TilstandAvvik[];
}

export interface TilstandData {
  grad: TilstandGrad;
  // Legacy (beholdt for bakoverkompat)
  beskrivelse: string;
  bilder: TilstandBilde[];
  // Kategorier
  tiltak?: TilstandKategori;
  fravik?: TilstandKategori;
}

export const emptyKategori = (): TilstandKategori => ({ beskrivelse: "", bilder: [], avvik: [] });

export const emptyTilstand = (): TilstandData => ({
  grad: "",
  beskrivelse: "",
  bilder: [],
  tiltak: emptyKategori(),
  fravik: emptyKategori(),
});

const newAvvik = (grad: TilstandGrad = ""): TilstandAvvik => ({
  id: (typeof crypto !== "undefined" && "randomUUID" in crypto)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  grad,
  beskrivelse: "",
  bilder: [],
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
 * Lazy-migrate legacy fields into new tiltak/fravik+avvik struktur.
 * Hvis verken `tiltak`/`fravik` finnes men `beskrivelse`/`bilder` gjør det,
 * flyttes legacy-data til ett initialt avvik under "tiltak".
 */
const ensureKategorier = (data: TilstandData): { tiltak: TilstandKategori; fravik: TilstandKategori } => {
  const harNye = !!(data.tiltak || data.fravik);
  const harLegacy = !!(data.beskrivelse || (data.bilder && data.bilder.length > 0));

  const normalizeKategori = (k: TilstandKategori | undefined): TilstandKategori => {
    if (!k) return emptyKategori();
    const avvik = Array.isArray(k.avvik) ? k.avvik.map(a => ({ ...a, bilder: normalize(a.bilder) })) : [];
    // Migrer kategori-nivå legacy beskrivelse/bilder til ett avvik dersom avvik er tomt
    if (avvik.length === 0 && (k.beskrivelse || (k.bilder && k.bilder.length > 0))) {
      avvik.push({
        ...newAvvik(data.grad),
        beskrivelse: k.beskrivelse || "",
        bilder: normalize(k.bilder),
      });
    }
    return { beskrivelse: k.beskrivelse || "", bilder: normalize(k.bilder), avvik };
  };

  if (!harNye && harLegacy) {
    return {
      tiltak: {
        beskrivelse: "",
        bilder: [],
        avvik: [{
          ...newAvvik(data.grad),
          beskrivelse: data.beskrivelse || "",
          bilder: normalize(data.bilder),
        }],
      },
      fravik: emptyKategori(),
    };
  }
  return {
    tiltak: normalizeKategori(data.tiltak),
    fravik: normalizeKategori(data.fravik),
  };
};

const TilstandsvurderingPanel = ({ sectionKey, sectionLabel, data, onChange }: TilstandsvurderingPanelProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState<string | null>(null); // "tiltak:<id>" | "fravik:<id>"

  const { tiltak, fravik } = ensureKategorier(data);

  const writeKategorier = (next: { tiltak: TilstandKategori; fravik: TilstandKategori }) => {
    onChange({
      ...data,
      tiltak: next.tiltak,
      fravik: next.fravik,
      // Tøm legacy så de ikke dukker opp dobbelt etter migrering
      beskrivelse: "",
      bilder: [],
    });
  };

  const updateAvvik = (kind: "tiltak" | "fravik", avvikId: string, patch: Partial<TilstandAvvik>) => {
    const current = kind === "tiltak" ? tiltak : fravik;
    const updated: TilstandKategori = {
      ...current,
      avvik: (current.avvik || []).map(a => a.id === avvikId ? { ...a, ...patch } : a),
    };
    writeKategorier({
      tiltak: kind === "tiltak" ? updated : tiltak,
      fravik: kind === "fravik" ? updated : fravik,
    });
  };

  const addAvvik = (kind: "tiltak" | "fravik") => {
    const current = kind === "tiltak" ? tiltak : fravik;
    const updated: TilstandKategori = {
      ...current,
      avvik: [...(current.avvik || []), newAvvik()],
    };
    writeKategorier({
      tiltak: kind === "tiltak" ? updated : tiltak,
      fravik: kind === "fravik" ? updated : fravik,
    });
  };

  const removeAvvik = (kind: "tiltak" | "fravik", avvikId: string) => {
    const current = kind === "tiltak" ? tiltak : fravik;
    const updated: TilstandKategori = {
      ...current,
      avvik: (current.avvik || []).filter(a => a.id !== avvikId),
    };
    writeKategorier({
      tiltak: kind === "tiltak" ? updated : tiltak,
      fravik: kind === "fravik" ? updated : fravik,
    });
  };

  const handleImageUpload = async (kind: "tiltak" | "fravik", avvikId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    const uploadKey = `${kind}:${avvikId}`;
    setUploading(uploadKey);
    const newImages: TilstandBilde[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${sectionKey}/${kind}/${avvikId}/${crypto.randomUUID()}.${ext}`;

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
      const avvik = (current.avvik || []).find(a => a.id === avvikId);
      if (avvik) {
        updateAvvik(kind, avvikId, { bilder: [...avvik.bilder, ...newImages] });
      }
    }
    setUploading(null);
    e.target.value = "";
  };

  const removeImage = (kind: "tiltak" | "fravik", avvikId: string, index: number) => {
    const current = kind === "tiltak" ? tiltak : fravik;
    const avvik = (current.avvik || []).find(a => a.id === avvikId);
    if (!avvik) return;
    updateAvvik(kind, avvikId, { bilder: avvik.bilder.filter((_, i) => i !== index) });
  };

  const updateImageBeskrivelse = (kind: "tiltak" | "fravik", avvikId: string, index: number, beskrivelse: string) => {
    const current = kind === "tiltak" ? tiltak : fravik;
    const avvik = (current.avvik || []).find(a => a.id === avvikId);
    if (!avvik) return;
    updateAvvik(kind, avvikId, {
      bilder: avvik.bilder.map((b, i) => i === index ? { ...b, beskrivelse } : b),
    });
  };

  const renderAvvikKort = (
    kind: "tiltak" | "fravik",
    avvik: TilstandAvvik,
    index: number,
    accentChip: string,
  ) => {
    const uploadKey = `${kind}:${avvik.id}`;
    const isUploading = uploading === uploadKey;
    return (
      <div key={avvik.id} className="p-3 rounded-md border bg-background space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] font-bold uppercase tracking-wide ${accentChip}`}>Avvik {index + 1}</span>
            {avvik.grad && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${gradLabels[avvik.grad]?.color || ""}`}>
                {gradLabels[avvik.grad]?.label}
              </span>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-destructive hover:text-destructive"
            onClick={() => removeAvvik(kind, avvik.id)}
          >
            <Trash2 className="h-3 w-3 mr-1" /> Slett
          </Button>
        </div>

        <div>
          <Label className="text-xs font-medium mb-1 block">Tilstandsgrad</Label>
          <Select value={avvik.grad} onValueChange={(val) => updateAvvik(kind, avvik.id, { grad: val as TilstandGrad })}>
            <SelectTrigger className="bg-background h-9">
              <SelectValue placeholder="Velg tilstandsgrad..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(gradLabels).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs font-medium mb-1 block">Beskrivelse</Label>
          <Textarea
            value={avvik.beskrivelse}
            onChange={(e) => updateAvvik(kind, avvik.id, { beskrivelse: e.target.value })}
            placeholder={kind === "tiltak"
              ? "Beskriv avviket og hvilke tiltak som kreves..."
              : "Beskriv avviket og hvorfor det vurderes som akseptabelt fravik..."}
            rows={3}
            className="bg-background"
          />
        </div>

        <div>
          <Label className="text-xs font-medium mb-1 block">Bilder</Label>
          <div className="space-y-2 mb-2">
            {avvik.bilder.map((bilde, i) => (
              <div key={i} className="flex gap-3 items-start p-2 rounded-md border bg-muted/30">
                <div className="relative group shrink-0">
                  <img src={bilde.url} alt={`Avvik ${index + 1} bilde ${i + 1}`} className="w-20 h-20 object-cover rounded border" />
                  <button
                    type="button"
                    onClick={() => removeImage(kind, avvik.id, i)}
                    className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="text-xs font-medium mb-1 block">Bildebeskrivelse</Label>
                  <Input
                    value={bilde.beskrivelse}
                    onChange={(e) => updateImageBeskrivelse(kind, avvik.id, i, e.target.value)}
                    placeholder="Beskriv hva bildet viser..."
                    className="text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            <label>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleImageUpload(kind, avvik.id, e)} disabled={isUploading} />
              <Button type="button" variant="outline" size="sm" className="cursor-pointer" asChild disabled={isUploading}>
                <span>
                  {isUploading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <ImagePlus className="h-3 w-3 mr-1" />}
                  {isUploading ? "Laster opp..." : "Ta bilde"}
                </span>
              </Button>
            </label>
            <label>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(kind, avvik.id, e)} disabled={isUploading} />
              <Button type="button" variant="outline" size="sm" className="cursor-pointer" asChild disabled={isUploading}>
                <span>
                  {isUploading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <ImagePlus className="h-3 w-3 mr-1" />}
                  {isUploading ? "Laster opp..." : "Velg fra galleri"}
                </span>
              </Button>
            </label>
          </div>
        </div>
      </div>
    );
  };

  const renderKategori = (
    kind: "tiltak" | "fravik",
    label: string,
    helpText: string,
    accentChip: string,
  ) => {
    const k = kind === "tiltak" ? tiltak : fravik;
    const liste = k.avvik || [];
    return (
      <div>
        <Label className={`text-xs font-semibold uppercase tracking-wide mb-1 block ${accentChip}`}>{label}</Label>
        <p className="text-[11px] text-muted-foreground mb-2">{helpText}</p>

        {liste.length === 0 ? (
          <p className="text-[11px] italic text-muted-foreground mb-2">Ingen avvik registrert i denne kategorien.</p>
        ) : (
          <div className="space-y-2 mb-2">
            {liste.map((a, i) => renderAvvikKort(kind, a, i, accentChip))}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addAvvik(kind)}
          className="bg-background"
        >
          <Plus className="h-3 w-3 mr-1" /> Legg til avvik
        </Button>
      </div>
    );
  };

  return (
    <div className="mt-4 p-4 border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg space-y-4">
      <div>
        <Label className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1 block">
          Tilstandsvurdering – {sectionLabel}
        </Label>
      </div>

      <div>
        <Label className="text-xs font-medium mb-1 block">Samlet tilstandsgrad for seksjonen</Label>
        <Select value={data.grad} onValueChange={(val) => onChange({ ...data, grad: val as TilstandGrad })}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Velg samlet tilstandsgrad..." />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(gradLabels).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {data.grad === "tg0" && (
          <p className="text-xs mt-2 text-green-800 dark:text-green-300 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md px-3 py-2">
            Det er ikke funnet noen avvik på dette området.
          </p>
        )}
      </div>

      {renderKategori(
        "tiltak",
        "Avvik som krever aktive tiltak",
        "Avvik som må utbedres / settes tilbake til riktig stand. Legg til ett kort per avvik med egen tilstandsgrad.",
        "text-red-800 dark:text-red-300",
      )}

      {renderKategori(
        "fravik",
        "Avvik som kan fraviksbehandles",
        "Avvik som vurderes akseptable og dokumenteres som fravik (kvalitativ analyse e.l.). Legg til ett kort per avvik med egen tilstandsgrad.",
        "text-amber-800 dark:text-amber-300",
      )}
    </div>
  );
};

export default TilstandsvurderingPanel;
