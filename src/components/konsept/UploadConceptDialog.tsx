import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
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

export const UploadConceptDialog = ({ onDataExtracted, documentType = "brannkonsept" }: UploadConceptDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<"idle" | "reading" | "analyzing" | "done" | "error">("idle");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readFileAsText = async (file: File): Promise<string> => {
    // For text-based files
    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      return await file.text();
    }

    // For PDF files, we extract text client-side using a simple approach
    // Since we can't use pdf.js easily, we'll send raw content and let AI handle it
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    // Try to extract readable text from PDF binary
    let text = "";
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const rawText = decoder.decode(bytes);
    
    // Extract text between stream markers in PDF
    const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
    let match;
    while ((match = streamRegex.exec(rawText)) !== null) {
      const chunk = match[1];
      // Filter for printable characters
      const readable = chunk.replace(/[^\x20-\x7E\xC0-\xFF\n\r\t]/g, " ").replace(/\s+/g, " ").trim();
      if (readable.length > 10) {
        text += readable + "\n";
      }
    }

    // Also try to extract text objects (Tj, TJ operators)
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    while ((match = tjRegex.exec(rawText)) !== null) {
      text += match[1] + " ";
    }

    // Fallback: just grab all readable text
    if (text.trim().length < 100) {
      text = rawText.replace(/[^\x20-\x7E\xC0-\xFF\n\r\tæøåÆØÅ]/g, " ").replace(/\s+/g, " ");
    }

    return text.substring(0, 60000);
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
      
      if (text.trim().length < 20) {
        throw new Error("Kunne ikke lese innhold fra filen. Prøv med en annen fil eller et annet format.");
      }

      setStatus("analyzing");

      const { data, error } = await supabase.functions.invoke("parse-fire-concept", {
        body: { documentText: text, documentType },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const extracted = data?.data;
      if (!extracted) throw new Error("Ingen data returnert fra analyse");

      setStatus("done");

      // Count top-level metadata fields (string/number) with non-empty value
      const metaCount = Object.entries(extracted).filter(
        ([k, v]) => k !== "kapittel3" && v !== null && v !== undefined && String(v).trim() !== ""
      ).length;
      // Count kap. 3 fields with explicit value (true/false/non-empty string)
      const kap3 = (extracted?.kapittel3 ?? {}) as Record<string, unknown>;
      const kap3Count = Object.values(kap3).filter(
        (v) => v === true || v === false || (typeof v === "string" && v.trim() !== "")
      ).length;

      const docLabel = documentType === "tilstandsvurdering" ? "tilstandsvurderingen" : "brannkonseptet";
      toast({
        title: "Dokument analysert",
        description: kap3Count > 0
          ? `${metaCount} metadatafelt og ${kap3Count} felt i kapittel 3 ble forhåndsutfylt i ${docLabel}. Tomme felter beholdes — eksisterende verdier overskrives ikke.`
          : `${metaCount} metadatafelt ble forhåndsutfylt i ${docLabel}. Tomme felter beholdes — eksisterende verdier overskrives ikke.`,
      });

      onDataExtracted(extracted);

      setTimeout(() => {
        setOpen(false);
        setStatus("idle");
        setIsProcessing(false);
        setFileName("");
      }, 1500);

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

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isProcessing) { setOpen(v); setStatus("idle"); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          Last opp eksisterende konsept
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Last opp eksisterende brannkonsept</DialogTitle>
          <DialogDescription>
            Last opp et eksisterende brannkonsept eller forprosjekt (PDF, Word eller tekstfil). 
            Informasjonen vil bli hentet ut og fylt inn automatisk.
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
              <Button variant="outline" size="sm" onClick={() => { setStatus("idle"); setIsProcessing(false); }}>
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
