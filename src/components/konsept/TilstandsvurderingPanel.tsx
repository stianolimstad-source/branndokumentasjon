import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type TilstandGrad = "tg0" | "tg1" | "tg2" | "tg3" | "tgiu" | "";

export interface TilstandData {
  grad: TilstandGrad;
  beskrivelse: string;
  bilder: string[]; // URLs
}

export const emptyTilstand = (): TilstandData => ({
  grad: "",
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

const TilstandsvurderingPanel = ({ sectionKey, sectionLabel, data, onChange }: TilstandsvurderingPanelProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    setUploading(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${sectionKey}/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from("tilstandsvurdering-images")
        .upload(path, file);

      if (!error) {
        const { data: urlData } = supabase.storage
          .from("tilstandsvurdering-images")
          .getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      }
    }

    if (newUrls.length > 0) {
      onChange({ ...data, bilder: [...data.bilder, ...newUrls] });
    }
    setUploading(false);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    onChange({ ...data, bilder: data.bilder.filter((_, i) => i !== index) });
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

      <div>
        <Label className="text-xs font-medium mb-1 block">Beskrivelse av tilstand</Label>
        <Textarea
          value={data.beskrivelse}
          onChange={(e) => onChange({ ...data, beskrivelse: e.target.value })}
          placeholder="Beskriv den faktiske tilstanden..."
          rows={3}
          className="bg-background"
        />
      </div>

      <div>
        <Label className="text-xs font-medium mb-1 block">Bilder</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {data.bilder.map((url, i) => (
            <div key={i} className="relative group">
              <img src={url} alt={`Tilstand ${i + 1}`} className="w-20 h-20 object-cover rounded border" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <label>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            <Button type="button" variant="outline" size="sm" className="cursor-pointer" asChild disabled={uploading}>
              <span>
                {uploading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <ImagePlus className="h-3 w-3 mr-1" />}
                {uploading ? "Laster opp..." : "Ta bilde"}
              </span>
            </Button>
          </label>
          <label>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
            <Button type="button" variant="outline" size="sm" className="cursor-pointer" asChild disabled={uploading}>
              <span>
                {uploading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <ImagePlus className="h-3 w-3 mr-1" />}
                {uploading ? "Laster opp..." : "Velg fra galleri"}
              </span>
            </Button>
          </label>
        </div>
      </div>
    </div>
  );
};

export default TilstandsvurderingPanel;
