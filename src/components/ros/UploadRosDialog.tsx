import React, { useRef, useState } from "react";
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

export type ExtractedHendelse = Omit<RosHendelse, "id"> & { prosjekt?: string };

export interface ExtractedRosData {
  metadata: { prosjektnavn?: string; adresse?: string; oppdragsgiver?: string };
  hendelser: ExtractedHendelse[];
}

interface Props {
  onApply: (data: ExtractedRosData, mode: "append" | "replace") => void;
}

async function readPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  try {
    const pdfjs: any = await import("pdfjs-dist");
    const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const pdf = await pdfjs.getDocument({ data: buffer }).promise;
    let out = "";
    const maxPages = Math.min(pdf.numPages, 200);
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      out += content.items.map((it: any) => (typeof it.str === "string" ? it.str : "")).join(" ") + "\n";
      if (out.length > 100000) break;
    }
    if (out.trim().length > 50) {
      console.log(`[UploadRosDialog] pdfjs extracted ${out.length} chars`);
      return out.substring(0, 100000);
    }
  } catch (e) {
    console.warn("[UploadRosDialog] pdfjs failed, falling back to regex", e);
  }

  // Fallback: regex over raw bytes
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
  return text.substring(0, 100000);
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
      if (resp?.errorType === "payment_required" || resp?.errorType === "rate_limited") {
        throw new Error(resp.error);
      }
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
                        <th className="px-2 py-2 w-14 text-center">R før</th>
                        <th className="px-2 py-2 w-14 text-center">R etter</th>
                        <th className="px-2 py-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const groups = new Map<string, number[]>();
                        data.hendelser.forEach((h, i) => {
                          const key = (h.prosjekt || "").trim();
                          if (!groups.has(key)) groups.set(key, []);
                          groups.get(key)!.push(i);
                        });
                        const hasMultiple = groups.size > 1 || (groups.size === 1 && !groups.has(""));
                        const toggleGroup = (idxs: number[]) => {
                          const allOn = idxs.every((i) => selected.has(i));
                          setSelected((prev) => {
                            const n = new Set(prev);
                            if (allOn) idxs.forEach((i) => n.delete(i));
                            else idxs.forEach((i) => n.add(i));
                            return n;
                          });
                        };
                        const renderRow = (i: number) => {
                          const h = data.hendelser[i];
                        const farge = risikoFarge(h.sannsynlighet, h.konsekvens);
                        const sE = h.sannsynlighetEtter ?? h.sannsynlighet;
                        const kE = h.konsekvensEtter ?? h.konsekvens;
                        const fargeE = risikoFarge(sE, kE);
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
                                <div className="line-clamp-2">{h.tittel || h.sarbarhet || h.hendelse || "(uten tittel)"}</div>
                              </td>
                              <td className="px-2 py-2 text-center">
                                <span className={`inline-flex items-center justify-center min-w-7 px-1.5 py-0.5 rounded text-xs font-semibold ${RISK_BG[farge]}`}>
                                  {h.sannsynlighet * h.konsekvens}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-center">
                                <span className={`inline-flex items-center justify-center min-w-7 px-1.5 py-0.5 rounded text-xs font-semibold ${RISK_BG[fargeE]}`}>
                                  {sE * kE}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-muted-foreground">
                                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </td>
                            </tr>
                            {isOpen && (
                              <tr key={`exp-${i}`} className="bg-muted/30 border-t">
                                <td></td>
                                <td colSpan={5} className="px-3 py-3 text-xs space-y-2">
                                  {h.sarbarhet && (
                                    <div><span className="font-semibold">Sårbarhet: </span><span className="text-muted-foreground whitespace-pre-wrap">{h.sarbarhet}</span></div>
                                  )}
                                  {(h.hendelse || h.beskrivelse) && (
                                    <div><span className="font-semibold">Hendelse: </span><span className="text-muted-foreground whitespace-pre-wrap">{h.hendelse || h.beskrivelse}</span></div>
                                  )}
                                  {h.arsak && (
                                    <div><span className="font-semibold">Årsak: </span><span className="text-muted-foreground whitespace-pre-wrap">{h.arsak}</span></div>
                                  )}
                                  {h.beskrivelseSannsynlighetFor && (
                                    <div><span className="font-semibold">Beskr. sannsynlighet (før): </span><span className="text-muted-foreground whitespace-pre-wrap">{h.beskrivelseSannsynlighetFor}</span></div>
                                  )}
                                  {h.beskrivelseRisikoFor && (
                                    <div><span className="font-semibold">Beskr. risiko (før): </span><span className="text-muted-foreground whitespace-pre-wrap">{h.beskrivelseRisikoFor}</span></div>
                                  )}
                                  {h.tiltak && (
                                    <div><span className="font-semibold">Forebyggende tiltak: </span><span className="text-muted-foreground whitespace-pre-wrap">{h.tiltak}</span></div>
                                  )}
                                  {h.beskrivelseEtter && (
                                    <div><span className="font-semibold">Beskr. etter tiltak: </span><span className="text-muted-foreground whitespace-pre-wrap">{h.beskrivelseEtter}</span></div>
                                  )}
                                  {h.restrisiko && (
                                    <div><span className="font-semibold">Restrisiko: </span><span className="text-muted-foreground whitespace-pre-wrap">{h.restrisiko}</span></div>
                                  )}
                                </td>
                              </tr>
                            )}
                            </>
                          );
                        };
                        return Array.from(groups.entries()).map(([key, idxs]) => {
                          const selectedCount = idxs.filter((i) => selected.has(i)).length;
                          const allOn = selectedCount === idxs.length;
                          return (
                            <React.Fragment key={`grp-${key || "_"}`}>
                              {hasMultiple && (
                                <tr className="bg-accent/50 border-t sticky">
                                  <td className="px-2 py-2">
                                    <Checkbox
                                      checked={allOn}
                                      onCheckedChange={() => toggleGroup(idxs)}
                                      aria-label={`Velg alle i ${key || "uten prosjekt"}`}
                                    />
                                  </td>
                                  <td colSpan={5} className="px-2 py-2 text-xs font-semibold uppercase tracking-wide">
                                    {key || "Uten prosjekt"}
                                    <span className="ml-2 text-muted-foreground font-normal normal-case">
                                      ({selectedCount}/{idxs.length} valgt)
                                    </span>
                                  </td>
                                </tr>
                              )}
                              {idxs.map((i) => renderRow(i))}
                            </React.Fragment>
                          );
                        });
                      })()}
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
