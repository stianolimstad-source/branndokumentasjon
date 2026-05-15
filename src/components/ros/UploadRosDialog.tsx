import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, FileSpreadsheet, Loader2, CheckCircle, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { risikoFarge } from "@/components/ros/RosMatriks";
import type { RosHendelse } from "@/components/ros/RosPreview";

const RISK_BG: Record<"gronn" | "gul" | "rod", string> = {
  gronn: "bg-emerald-500/80 text-white",
  gul: "bg-amber-400/90 text-foreground",
  rod: "bg-red-500/85 text-white",
};

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
  const ExcelJS = (await import("exceljs")).default;
  const buf = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  let out = "";
  wb.eachSheet((ws) => {
    out += `# Ark: ${ws.name}\n`;
    ws.eachRow({ includeEmpty: false }, (row) => {
      const vals = (row.values as any[]).slice(1).map((v) => {
        if (v == null) return "";
        if (typeof v === "object") {
          if ("text" in v) return String(v.text);
          if ("result" in v) return String(v.result);
          if ("richText" in v) return v.richText.map((r: any) => r.text).join("");
          if (v instanceof Date) return v.toISOString().slice(0, 10);
        }
        return String(v);
      });
      out += vals.join("|") + "\n";
    });
    out += "\n";
  });
  return out.substring(0, 120000);
}

export const UploadRosDialog = ({ onApply }: Props) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "reading" | "analyzing" | "review" | "error">("idle");
  const [fileName, setFileName] = useState("");
  const [data, setData] = useState<ExtractedRosData | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStatus("idle");
    setFileName("");
    setData(null);
    setSelected(new Set());
    setExpanded(null);
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
      setSelected(new Set(result.hendelser.map((_, i) => i)));
      setExpanded(null);
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

  const toggleAll = () => {
    if (!data) return;
    if (selected.size === data.hendelser.length) setSelected(new Set());
    else setSelected(new Set(data.hendelser.map((_, i) => i)));
  };

  const toggleOne = (i: number) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  };

  const apply = (mode: "append" | "replace") => {
    if (!data) return;
    const valgte = data.hendelser.filter((_, i) => selected.has(i));
    if (valgte.length === 0) return;
    onApply({ ...data, hendelser: valgte }, mode);
    toast({
      title: mode === "append" ? "Hendelser lagt til" : "Hendelser erstattet",
      description: `${valgte.length} hendelser ble importert.`,
    });
    setOpen(false);
    reset();
  };

  const allSelected = data ? selected.size === data.hendelser.length && data.hendelser.length > 0 : false;

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
      <DialogContent className="sm:max-w-3xl">
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
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle className="h-5 w-5" />
                  <p className="text-sm font-medium">
                    Fant {data.hendelser.length} hendelser i {fileName}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">{selected.size} av {data.hendelser.length} valgt</p>
              </div>

              <div className="border rounded-md overflow-hidden">
                <div className="max-h-[60vh] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/80 backdrop-blur z-10 text-xs uppercase tracking-wide">
                      <tr>
                        <th className="px-2 py-2 w-10 text-left">
                          <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Velg alle" />
                        </th>
                        <th className="px-2 py-2 w-10 text-left">#</th>
                        <th className="px-2 py-2 text-left">Tittel</th>
                        <th className="px-2 py-2 w-12 text-center">S</th>
                        <th className="px-2 py-2 w-12 text-center">K</th>
                        <th className="px-2 py-2 w-14 text-center">R</th>
                        <th className="px-2 py-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.hendelser.map((h, i) => {
                        const farge = risikoFarge(h.sannsynlighet, h.konsekvens);
                        const isOpen = expanded === i;
                        const isSelected = selected.has(i);
                        return (
                          <>
                            <tr
                              key={`row-${i}`}
                              className={`border-t hover:bg-accent/40 cursor-pointer ${isSelected ? "" : "opacity-60"}`}
                              onClick={() => setExpanded(isOpen ? null : i)}
                            >
                              <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                                <Checkbox checked={isSelected} onCheckedChange={() => toggleOne(i)} aria-label={`Velg hendelse ${i + 1}`} />
                              </td>
                              <td className="px-2 py-2 text-muted-foreground">{i + 1}</td>
                              <td className="px-2 py-2 font-medium">
                                <div className="line-clamp-2">{h.tittel || "(uten tittel)"}</div>
                              </td>
                              <td className="px-2 py-2 text-center">{h.sannsynlighet}</td>
                              <td className="px-2 py-2 text-center">{h.konsekvens}</td>
                              <td className="px-2 py-2 text-center">
                                <span className={`inline-flex items-center justify-center min-w-7 px-1.5 py-0.5 rounded text-xs font-semibold ${RISK_BG[farge]}`}>
                                  {h.sannsynlighet * h.konsekvens}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-muted-foreground">
                                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </td>
                            </tr>
                            {isOpen && (
                              <tr key={`exp-${i}`} className="bg-muted/30 border-t">
                                <td></td>
                                <td colSpan={6} className="px-3 py-3 text-xs space-y-2">
                                  {h.beskrivelse && (
                                    <div><span className="font-semibold">Beskrivelse: </span><span className="text-muted-foreground whitespace-pre-wrap">{h.beskrivelse}</span></div>
                                  )}
                                  {h.arsak && (
                                    <div><span className="font-semibold">Årsak: </span><span className="text-muted-foreground whitespace-pre-wrap">{h.arsak}</span></div>
                                  )}
                                  {h.tiltak && (
                                    <div><span className="font-semibold">Tiltak: </span><span className="text-muted-foreground whitespace-pre-wrap">{h.tiltak}</span></div>
                                  )}
                                  {h.restrisiko && (
                                    <div><span className="font-semibold">Restrisiko: </span><span className="text-muted-foreground whitespace-pre-wrap">{h.restrisiko}</span></div>
                                  )}
                                  {!h.beskrivelse && !h.arsak && !h.tiltak && !h.restrisiko && (
                                    <p className="italic text-muted-foreground">Ingen utfyllende informasjon.</p>
                                  )}
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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
            <Button variant="secondary" onClick={() => apply("replace")} disabled={selected.size === 0}>
              Erstatt med valgte ({selected.size})
            </Button>
            <Button onClick={() => apply("append")} disabled={selected.size === 0}>
              Legg til valgte ({selected.size})
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UploadRosDialog;
