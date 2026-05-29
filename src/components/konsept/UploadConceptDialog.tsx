import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ExtractedKapittel3 {
  tilretteleggingLedd1a?: boolean | null;
  tilretteleggingLedd2a?: boolean | null;
  tilretteleggingLedd2b?: boolean | null;
  tilretteleggingLedd3?: boolean | null;
  brannalarmTalevarsling?: boolean | null;
  slokkeBrannslange?: boolean | null;
  slokkeHandslukker?: boolean | null;
  romningsvei?: string;
  romningsveiSvalgang?: boolean | null;
  romningsveiKorridorOver30m?: boolean | null;
  romningsveiPanikkbeslag?: boolean | null;
  romningsveiKommentar?: string;
  husdyrRedningRelevant?: boolean | null;
  husdyrTyper?: string;
  husdyrRedningKommentar?: string;
  universellUtforming?: boolean | null;
}

export interface ExtractedData {
  oppdragsgiver?: string;
  prosjektnavn?: string;
  adresse?: string;
  gnr?: string;
  bnr?: string;
  kommune?: string;
  tiltakstype?: string;
  tiltaksbeskrivelse?: string;
  bygningstype?: string;
  areal?: string;
  etasjer?: string;
  tiltakshaver?: string;
  ansvarligSoker?: string;
  risikoklasse?: string;
  brannklasse?: string;
  prosjekteringsmetode?: string;
  avgrensning?: string;
  tilleggskrav?: string;
  bygningshoyde?: string;
  regelverk?: string;
  bygningsbrannklasse?: string;
  byggeaar?: string;
  kapittel3?: ExtractedKapittel3;
}

interface UploadConceptDialogProps {
  onDataExtracted: (data: ExtractedData) => void;
  documentType?: "brannkonsept" | "tilstandsvurdering";
}

// Norske labels for metadata-felter
const META_LABELS: Record<string, string> = {
  oppdragsgiver: "Oppdragsgiver",
  prosjektnavn: "Prosjektnavn",
  adresse: "Adresse",
  gnr: "Gnr",
  bnr: "Bnr",
  kommune: "Kommune",
  tiltakstype: "Tiltakstype",
  tiltaksbeskrivelse: "Tiltaksbeskrivelse",
  bygningstype: "Bygningstype",
  areal: "Areal (BRA)",
  etasjer: "Antall etasjer",
  tiltakshaver: "Tiltakshaver",
  ansvarligSoker: "Ansvarlig søker",
  risikoklasse: "Risikoklasse",
  brannklasse: "Brannklasse",
  prosjekteringsmetode: "Prosjekteringsmetode",
  avgrensning: "Avgrensning",
  tilleggskrav: "Tilleggskrav",
  bygningshoyde: "Bygningshøyde",
  regelverk: "Regelverk",
  bygningsbrannklasse: "Bygningsbrannklasse",
  byggeaar: "Byggeår",
};

const KAP3_LABELS: Record<string, string> = {
  tilretteleggingLedd1a: "§11-12 1.ledd a (tilrettelegging slokking)",
  tilretteleggingLedd2a: "§11-12 2.ledd a (sprinkler)",
  tilretteleggingLedd2b: "§11-12 2.ledd b (boligsprinkler)",
  tilretteleggingLedd3: "§11-12 3.ledd (annen automatisk slokking)",
  brannalarmTalevarsling: "§11-12 Brannalarm/talevarsling",
  slokkeBrannslange: "§11-14 Brannslange",
  slokkeHandslukker: "§11-14 Håndslokker",
  romningsvei: "§11-11 Antall rømningsveier",
  romningsveiSvalgang: "§11-11 Svalgang",
  romningsveiKorridorOver30m: "§11-11 Korridor over 30 m",
  romningsveiPanikkbeslag: "§11-11 Panikkbeslag",
  romningsveiKommentar: "§11-11 Kommentar",
  husdyrRedningRelevant: "§11-15 Husdyr relevant",
  husdyrTyper: "§11-15 Husdyrtyper",
  husdyrRedningKommentar: "§11-15 Kommentar",
  universellUtforming: "Universell utforming (kap. 2)",
};

const formatValue = (v: unknown): string => {
  if (v === true) return "Ja";
  if (v === false) return "Nei";
  if (v === null || v === undefined) return "";
  return String(v);
};

export const UploadConceptDialog = ({ onDataExtracted, documentType = "brannkonsept" }: UploadConceptDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<"idle" | "reading" | "analyzing" | "review" | "done" | "error">("idle");
  const [fileName, setFileName] = useState("");
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [selectedMeta, setSelectedMeta] = useState<Set<string>>(new Set());
  const [selectedKap3, setSelectedKap3] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetAll = () => {
    setStatus("idle");
    setIsProcessing(false);
    setFileName("");
    setExtracted(null);
    setSelectedMeta(new Set());
    setSelectedKap3(new Set());
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const readPdfWithPdfjs = async (buffer: ArrayBuffer): Promise<string> => {
    const pdfjs: any = await import("pdfjs-dist");
    const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const loadingTask = pdfjs.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;
    let out = "";
    const maxPages = Math.min(pdf.numPages, 200);
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strs = content.items.map((it: any) => (typeof it.str === "string" ? it.str : "")).filter(Boolean);
      out += strs.join(" ") + "\n";
      if (out.length > 100000) break;
    }
    return out;
  };

  const readFileAsText = async (file: File): Promise<string> => {
    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      return await file.text();
    }

    const buffer = await file.arrayBuffer();

    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      try {
        const text = await readPdfWithPdfjs(buffer);
        if (text.trim().length > 50) {
          console.log(`[UploadConceptDialog] pdfjs extracted ${text.length} chars`);
          return text.substring(0, 100000);
        }
        console.warn("[UploadConceptDialog] pdfjs returned little text, falling back to regex");
      } catch (e) {
        console.warn("[UploadConceptDialog] pdfjs failed, falling back to regex", e);
      }
    }

    // Fallback: regex over raw bytes (works for some unencrypted/uncompressed PDFs)
    const bytes = new Uint8Array(buffer);
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const rawText = decoder.decode(bytes);
    let text = "";
    const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
    let match;
    while ((match = streamRegex.exec(rawText)) !== null) {
      const readable = match[1].replace(/[^\x20-\x7E\xC0-\xFF\n\r\tæøåÆØÅ]/g, " ").replace(/\s+/g, " ").trim();
      if (readable.length > 10) text += readable + "\n";
    }
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    while ((match = tjRegex.exec(rawText)) !== null) text += match[1] + " ";
    if (text.trim().length < 100) {
      text = rawText.replace(/[^\x20-\x7E\xC0-\xFF\n\r\tæøåÆØÅ]/g, " ").replace(/\s+/g, " ");
    }
    return text.substring(0, 100000);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({ title: "For stor fil", description: "Maks filstørrelse er 10 MB", variant: "destructive" });
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    const allowedExtensions = [".pdf", ".docx", ".txt"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
      toast({ title: "Ugyldig filtype", description: "Last opp PDF, Word (.docx) eller tekstfil", variant: "destructive" });
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);
    setStatus("reading");

    try {
      const text = await readFileAsText(file);
      console.log(`[UploadConceptDialog] sending ${text.length} chars to parse-fire-concept (documentType=${documentType})`);

      if (text.trim().length < 20) {
        throw new Error("Kunne ikke lese innhold fra filen. Prøv med en annen fil eller et annet format.");
      }

      setStatus("analyzing");

      const { data, error } = await supabase.functions.invoke("parse-fire-concept", {
        body: { documentText: text, documentType },
      });

      // supabase-js sets `error` on non-2xx but `data` still has the JSON body
      if (data?.errorType === "payment_required" || data?.errorType === "rate_limited") {
        throw new Error(data.error);
      }
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const result = data?.data as ExtractedData | undefined;
      if (!result) throw new Error("Ingen data returnert fra analyse");

      // Beregn hvilke felter som har data (filtrer ut TEK17-/BF85-spesifikke felter)
      const hiddenForDocType = documentType === "tilstandsvurdering"
        ? new Set(["risikoklasse", "brannklasse"])
        : new Set(["bygningsbrannklasse"]);
      const metaKeys = Object.keys(META_LABELS).filter((k) => {
        if (hiddenForDocType.has(k)) return false;
        const v = (result as any)[k];
        return v !== null && v !== undefined && String(v).trim() !== "";
      });
      const kap3 = (result.kapittel3 ?? {}) as Record<string, unknown>;
      const kap3Keys = Object.keys(KAP3_LABELS).filter((k) => {
        const v = kap3[k];
        return v === true || v === false || (typeof v === "string" && v.trim() !== "");
      });

      if (metaKeys.length === 0 && kap3Keys.length === 0) {
        setStatus("error");
        toast({
          title: "Fant ingen data i dokumentet",
          description: "AI klarte ikke å hente ut informasjon fra filen. Hvis dette er en skannet PDF uten tekstlag, må innholdet fylles inn manuelt. Prøv eventuelt et annet format (Word/tekst).",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      setExtracted(result);
      setSelectedMeta(new Set(metaKeys));
      setSelectedKap3(new Set(kap3Keys));
      setStatus("review");
      setIsProcessing(false);
    } catch (err: any) {
      console.error("Upload error:", err);
      setStatus("error");
      toast({
        title: "Feil ved analyse",
        description: err.message || "Kunne ikke analysere dokumentet",
        variant: "destructive",
      });
      setIsProcessing(false);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleApplySelected = () => {
    if (!extracted) return;

    const filtered: ExtractedData = {};
    for (const k of selectedMeta) {
      (filtered as any)[k] = (extracted as any)[k];
    }
    if (selectedKap3.size > 0) {
      const k3src = (extracted.kapittel3 ?? {}) as Record<string, unknown>;
      const k3out: Record<string, unknown> = {};
      for (const k of selectedKap3) k3out[k] = k3src[k];
      filtered.kapittel3 = k3out as ExtractedKapittel3;
    }

    onDataExtracted(filtered);

    const totalSelected = selectedMeta.size + selectedKap3.size;
    const docLabel = documentType === "tilstandsvurdering" ? "tilstandsvurderingen" : "brannkonseptet";
    toast({
      title: "Felter fylt inn",
      description: `${totalSelected} felt(er) ble forhåndsutfylt i ${docLabel}. Allerede utfylte felter ble ikke overskrevet.`,
    });

    setStatus("done");
    setTimeout(() => {
      setOpen(false);
      resetAll();
    }, 1200);
  };

  const toggleMeta = (k: string, checked: boolean) => {
    setSelectedMeta((prev) => {
      const next = new Set(prev);
      if (checked) next.add(k); else next.delete(k);
      return next;
    });
  };
  const toggleKap3 = (k: string, checked: boolean) => {
    setSelectedKap3((prev) => {
      const next = new Set(prev);
      if (checked) next.add(k); else next.delete(k);
      return next;
    });
  };

  const metaKeysFound = extracted
    ? Object.keys(META_LABELS).filter((k) => {
        const v = (extracted as any)[k];
        return v !== null && v !== undefined && String(v).trim() !== "";
      })
    : [];
  const kap3KeysFound = extracted
    ? Object.keys(KAP3_LABELS).filter((k) => {
        const v = ((extracted.kapittel3 ?? {}) as Record<string, unknown>)[k];
        return v === true || v === false || (typeof v === "string" && v.trim() !== "");
      })
    : [];

  const allMetaSelected = metaKeysFound.length > 0 && metaKeysFound.every((k) => selectedMeta.has(k));
  const allKap3Selected = kap3KeysFound.length > 0 && kap3KeysFound.every((k) => selectedKap3.has(k));

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isProcessing) { setOpen(v); if (!v) resetAll(); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          {documentType === "tilstandsvurdering"
            ? "Last opp eksisterende tilstandsvurdering"
            : "Last opp eksisterende konsept"}
        </Button>
      </DialogTrigger>
      <DialogContent className={status === "review" ? "sm:max-w-2xl" : "sm:max-w-md"}>
        <DialogHeader>
          <DialogTitle>
            {status === "review"
              ? "Velg hva som skal fylles inn"
              : documentType === "tilstandsvurdering"
                ? "Last opp eksisterende tilstandsvurdering"
                : "Last opp eksisterende brannkonsept"}
          </DialogTitle>
          <DialogDescription>
            {status === "review"
              ? "AI har funnet følgende informasjon i dokumentet. Huk av hvilke felter du vil bruke. Allerede utfylte felter overskrives ikke."
              : `Last opp et eksisterende ${documentType === "tilstandsvurdering" ? "tilstandsvurderingsdokument" : "brannkonsept eller forprosjekt"} (PDF, Word eller tekstfil). Metadata og enkelte felt i kapittel 3 hentes ut automatisk.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {status === "idle" && (
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">Klikk for å velge fil</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, Word (.docx) eller tekstfil, maks 10 MB</p>
            </div>
          )}

          {status === "reading" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Leser {fileName}...</p>
            </div>
          )}

          {status === "analyzing" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Analyserer dokument med AI...</p>
              <p className="text-xs text-muted-foreground">Dette kan ta 10-30 sekunder</p>
            </div>
          )}

          {status === "review" && extracted && (
            <div className="space-y-4">
              <ScrollArea className="h-[420px] pr-3">
                <div className="space-y-5">
                  {metaKeysFound.length > 0 && (
                    <section>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold">Metadata (kap. 1 & 2)</h4>
                        <button
                          type="button"
                          className="text-xs text-primary hover:underline"
                          onClick={() =>
                            setSelectedMeta(allMetaSelected ? new Set() : new Set(metaKeysFound))
                          }
                        >
                          {allMetaSelected ? "Fjern alle" : "Velg alle"}
                        </button>
                      </div>
                      <ul className="space-y-1.5">
                        {metaKeysFound.map((k) => {
                          const val = formatValue((extracted as any)[k]);
                          return (
                            <li key={k} className="flex items-start gap-2 text-sm">
                              <Checkbox
                                id={`meta-${k}`}
                                checked={selectedMeta.has(k)}
                                onCheckedChange={(c) => toggleMeta(k, !!c)}
                                className="mt-0.5"
                              />
                              <label htmlFor={`meta-${k}`} className="flex-1 cursor-pointer leading-tight">
                                <span className="font-medium">{META_LABELS[k]}:</span>{" "}
                                <span className="text-muted-foreground" title={val}>
                                  {val.length > 140 ? val.substring(0, 140) + "…" : val}
                                </span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  )}

                  {kap3KeysFound.length > 0 && (
                    <section>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold">Kapittel 3 — branntekniske tiltak</h4>
                        <button
                          type="button"
                          className="text-xs text-primary hover:underline"
                          onClick={() =>
                            setSelectedKap3(allKap3Selected ? new Set() : new Set(kap3KeysFound))
                          }
                        >
                          {allKap3Selected ? "Fjern alle" : "Velg alle"}
                        </button>
                      </div>
                      <ul className="space-y-1.5">
                        {kap3KeysFound.map((k) => {
                          const v = ((extracted.kapittel3 ?? {}) as Record<string, unknown>)[k];
                          const val = formatValue(v);
                          return (
                            <li key={k} className="flex items-start gap-2 text-sm">
                              <Checkbox
                                id={`k3-${k}`}
                                checked={selectedKap3.has(k)}
                                onCheckedChange={(c) => toggleKap3(k, !!c)}
                                className="mt-0.5"
                              />
                              <label htmlFor={`k3-${k}`} className="flex-1 cursor-pointer leading-tight">
                                <span className="font-medium">{KAP3_LABELS[k]}:</span>{" "}
                                <span className="text-muted-foreground" title={val}>
                                  {val.length > 140 ? val.substring(0, 140) + "…" : val}
                                </span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  )}
                </div>
              </ScrollArea>

              <div className="flex items-center justify-between pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  {selectedMeta.size + selectedKap3.size} av {metaKeysFound.length + kap3KeysFound.length} valgt
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setOpen(false); resetAll(); }}>
                    Avbryt
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApplySelected}
                    disabled={selectedMeta.size + selectedKap3.size === 0}
                  >
                    Fyll inn valgte felter
                  </Button>
                </div>
              </div>
            </div>
          )}

          {status === "done" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <p className="text-sm font-medium text-green-700">Ferdig! Feltene er fylt ut.</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm font-medium text-destructive">Kunne ikke analysere dokumentet</p>
              <Button variant="outline" size="sm" onClick={resetAll}>
                Prøv igjen
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
