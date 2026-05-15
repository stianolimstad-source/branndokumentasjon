import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, FileSpreadsheet, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { RosHendelse } from "@/components/ros/RosPreview";

export type ExtractedHendelse = Omit<RosHendelse, "id">;

export interface ExtractedRosData {
  metadata: { prosjektnavn?: string; adresse?: string; oppdragsgiver?: string };
  hendelser: ExtractedHendelse[];
}

interface Props {
  onApply: (data: ExtractedRosData, mode: "append" | "replace") => void;
}

async function readPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder("utf-8", { fatal: false });
  const raw = decoder.decode(bytes);
  let text = "";
  const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
  let m;
  while ((m = streamRegex.exec(raw)) !== null) {
    const r = m[1].replace(/[^\x20-\x7E\xC0-\xFF\n\r\tæøåÆØÅ]/g, " ").replace(/\s+/g, " ").trim();
    if (r.length > 10) text += r + "\n";
  }
  const tj = /\(([^)]*)\)\s*Tj/g;
  while ((m = tj.exec(raw)) !== null) text += m[1] + " ";
  if (text.trim().length < 100) {
    text = raw.replace(/[^\x20-\x7E\xC0-\xFF\n\r\tæøåÆØÅ]/g, " ").replace(/\s+/g, " ");
  }
  return text.substring(0, 80000);
}

async function readExcelText(file: File): Promise<string> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  let out = "";
  for (const name of wb.SheetNames) {
    out += `# Ark: ${name}\n`;
    const ws = wb.Sheets[name];
    out += XLSX.utils.sheet_to_csv(ws, { FS: "|", blankrows: false }) + "\n\n";
  }
  return out.substring(0, 120000);
}

export const UploadRosDialog = ({ onApply }: Props) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "reading" | "analyzing" | "review" | "error">("idle");
  const [fileName, setFileName] = useState("");
  const [data, setData] = useState<ExtractedRosData | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStatus("idle");
    setFileName("");
    setData(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "For stor fil", description: "Maks 10 MB", variant: "destructive" });
      return;
    }
    setFileName(file.name);
    setStatus("reading");
    try {
      const ext = file.name.toLowerCase().split(".").pop() || "";
      let text = "";
      if (ext === "xlsx" || ext === "xls") text = await readExcelText(file);
      else if (ext === "pdf") text = await readPdfText(file);
      else text = await file.text();

      if (text.trim().length < 20) throw new Error("Kunne ikke lese innhold fra filen.");

      setStatus("analyzing");
      const { data: resp, error } = await supabase.functions.invoke("parse-ros-analysis", {
        body: { documentText: text },
      });
      if (error) throw error;
      if (resp?.error) throw new Error(resp.error);
      const result: ExtractedRosData = resp?.data;
      if (!result || !Array.isArray(result.hendelser)) throw new Error("Ingen hendelser funnet.");

      setData(result);
      setStatus("review");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      toast({
        title: "Feil ved analyse",
        description: err?.message || "Kunne ikke analysere filen",
        variant: "destructive",
      });
    }
  };

  const apply = (mode: "append" | "replace") => {
    if (!data) return;
    onApply(data, mode);
    toast({
      title: mode === "append" ? "Hendelser lagt til" : "Hendelser erstattet",
      description: `${data.hendelser.length} hendelser ble importert.`,
    });
    setOpen(false);
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && (status === "reading" || status === "analyzing")) return;
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Last opp eksisterende ROS
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Last opp eksisterende ROS-analyse</DialogTitle>
          <DialogDescription>
            Last opp Excel (.xlsx), PDF, Word (.docx) eller tekstfil. Hendelser blir hentet ut automatisk.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {status === "idle" && (
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">Klikk for å velge fil</p>
              <p className="text-xs text-muted-foreground mt-1">Excel, PDF, Word eller tekst, maks 10 MB</p>
            </div>
          )}

          {(status === "reading" || status === "analyzing") && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">
                {status === "reading" ? `Leser ${fileName}…` : "Analyserer med AI…"}
              </p>
              {status === "analyzing" && (
                <p className="text-xs text-muted-foreground">Dette kan ta 15–60 sekunder for store filer</p>
              )}
            </div>
          )}

          {status === "review" && data && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <p className="text-sm font-medium">
                  Fant {data.hendelser.length} hendelser i {fileName}
                </p>
              </div>
              <div className="max-h-64 overflow-y-auto border rounded-md divide-y">
                {data.hendelser.slice(0, 50).map((h, i) => (
                  <div key={i} className="p-2 text-xs">
                    <div className="font-medium truncate">{i + 1}. {h.tittel || "(uten tittel)"}</div>
                    <div className="text-muted-foreground">
                      S={h.sannsynlighet} · K={h.konsekvens} · R={h.sannsynlighet * h.konsekvens}
                    </div>
                  </div>
                ))}
                {data.hendelser.length > 50 && (
                  <div className="p-2 text-xs text-muted-foreground italic">
                    + {data.hendelser.length - 50} flere…
                  </div>
                )}
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm font-medium text-destructive">Kunne ikke analysere filen</p>
              <Button variant="outline" size="sm" onClick={reset}>Prøv igjen</Button>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.pdf,.docx,.txt,.csv"
            onChange={handleFile}
            className="hidden"
          />
        </div>

        {status === "review" && (
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setOpen(false); reset(); }}>Avbryt</Button>
            <Button variant="secondary" onClick={() => apply("replace")}>Erstatt eksisterende</Button>
            <Button onClick={() => apply("append")}>Legg til</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UploadRosDialog;
