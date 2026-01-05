import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Flame, ArrowLeft, FileDown, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from "docx";
import { saveAs } from "file-saver";

const Konsept = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedConcept, setGeneratedConcept] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    bygningstype: "",
    risikoklasse: "",
    brannklasse: "",
    etasjer: "",
    areal: "",
    baeresystem: "",
    roemning: "",
    seksjonering: "",
    installasjoner: "",
    fravik: "",
  });

  const handleGenerate = () => {
    setIsGenerating(true);
    
    // Simulate generation
    setTimeout(() => {
      const concept = generateConceptText(formData);
      setGeneratedConcept(concept);
      setIsGenerating(false);
      toast({
        title: "Brannkonsept generert",
        description: "Dokumentet er klart for eksport",
      });
    }, 2000);
  };

  const generateConceptText = (data: typeof formData) => {
    return `# BRANNKONSEPT

## 1. PROSJEKTINFORMASJON

**Bygningstype:** ${data.bygningstype || "Ikke angitt"}
**Risikoklasse:** ${data.risikoklasse || "Ikke angitt"}
**Brannklasse:** ${data.brannklasse || "Ikke angitt"}
**Etasjer:** ${data.etasjer || "Ikke angitt"}
**Bruttoareal:** ${data.areal || "Ikke angitt"} m²

## 2. BRANNSTRATEGI

Dette brannkonseptet er utarbeidet i henhold til TEK17 og relevante standarder. Bygningen skal sikres mot brann gjennom en kombinasjon av forebyggende, konstruktive og tekniske tiltak.

### 2.1 Bærende konstruksjoner
**Bæresystem:** ${data.baeresystem || "Ikke angitt"}

Bærende konstruksjoner skal utformes i henhold til brannklasse ${data.brannklasse || "[angis]"} og ha tilstrekkelig brannmotstand for å sikre stabilitet under brann.

### 2.2 Brannseksjonering
**Seksjoneringsløsning:** ${data.seksjonering || "Ikke angitt"}

Bygningen skal deles inn i brannceller med tilstrekkelig brannmotstand for å hindre brannspredning. Brannskiller skal ha minimum REI-ytelse i henhold til byggets risikoklasse.

### 2.3 Rømning
**Rømningsløsning:** ${data.roemning || "Ikke angitt"}

Rømningsveier skal være oversiktlige, lett tilgjengelige og tilstrekkelig dimensjonert. Det skal være minst to uavhengige rømningsveier fra alle oppholdsrom.

### 2.4 Tekniske installasjoner
**Installasjoner:** ${data.installasjoner || "Ikke angitt"}

Tekniske brannsikringstiltak dimensjoneres i henhold til byggets risikoklasse og bruk.

${data.fravik ? `### 2.5 Fravik og kompenserende tiltak\n\n${data.fravik}` : ""}

## 3. REGELVERK OG REFERANSER

- TEK17 - Forskrift om tekniske krav til byggverk
- VTEK - Veiledning til teknisk forskrift
- NS 3901 - Risikobasert dimensjonering av brannsikkerhet i byggverk
- NS-EN 1991-1-2 - Eurocode 1: Laster på konstruksjoner - Del 1-2: Allmenne laster - Brannpåvirkning

## 4. KONKLUSJON

Ved å følge anbefalingene og tiltakene beskrevet i dette brannkonseptet, vil bygningen ha et tilfredsstillende sikkerhetsnivå mot brann i samsvar med gjeldende regelverk.

---
*Generert av BrannRådgiver Pro*
`;
  };

  const exportToWord = async () => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: "BRANNKONSEPT",
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "1. PROSJEKTINFORMASJON", bold: true, size: 28 }),
              ],
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Bygningstype: ", bold: true }),
                new TextRun({ text: formData.bygningstype || "Ikke angitt" }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Risikoklasse: ", bold: true }),
                new TextRun({ text: formData.risikoklasse || "Ikke angitt" }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Brannklasse: ", bold: true }),
                new TextRun({ text: formData.brannklasse || "Ikke angitt" }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Etasjer: ", bold: true }),
                new TextRun({ text: formData.etasjer || "Ikke angitt" }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Bruttoareal: ", bold: true }),
                new TextRun({ text: `${formData.areal || "Ikke angitt"} m²` }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "2. BRANNSTRATEGI", bold: true, size: 28 }),
              ],
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              text: "Dette brannkonseptet er utarbeidet i henhold til TEK17 og relevante standarder. Bygningen skal sikres mot brann gjennom en kombinasjon av forebyggende, konstruktive og tekniske tiltak.",
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "2.1 Bærende konstruksjoner", bold: true, size: 24 }),
              ],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Bæresystem: ", bold: true }),
                new TextRun({ text: formData.baeresystem || "Ikke angitt" }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              text: `Bærende konstruksjoner skal utformes i henhold til brannklasse ${formData.brannklasse || "[angis]"} og ha tilstrekkelig brannmotstand for å sikre stabilitet under brann.`,
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "2.2 Brannseksjonering", bold: true, size: 24 }),
              ],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Seksjoneringsløsning: ", bold: true }),
                new TextRun({ text: formData.seksjonering || "Ikke angitt" }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              text: "Bygningen skal deles inn i brannceller med tilstrekkelig brannmotstand for å hindre brannspredning. Brannskiller skal ha minimum REI-ytelse i henhold til byggets risikoklasse.",
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "2.3 Rømning", bold: true, size: 24 }),
              ],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Rømningsløsning: ", bold: true }),
                new TextRun({ text: formData.roemning || "Ikke angitt" }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              text: "Rømningsveier skal være oversiktlige, lett tilgjengelige og tilstrekkelig dimensjonert. Det skal være minst to uavhengige rømningsveier fra alle oppholdsrom.",
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "2.4 Tekniske installasjoner", bold: true, size: 24 }),
              ],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Installasjoner: ", bold: true }),
                new TextRun({ text: formData.installasjoner || "Ikke angitt" }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              text: "Tekniske brannsikringstiltak dimensjoneres i henhold til byggets risikoklasse og bruk.",
              spacing: { after: 200 },
            }),
            ...(formData.fravik ? [
              new Paragraph({
                children: [
                  new TextRun({ text: "2.5 Fravik og kompenserende tiltak", bold: true, size: 24 }),
                ],
                spacing: { before: 200, after: 100 },
              }),
              new Paragraph({
                text: formData.fravik,
                spacing: { after: 200 },
              }),
            ] : []),
            new Paragraph({
              children: [
                new TextRun({ text: "3. REGELVERK OG REFERANSER", bold: true, size: 28 }),
              ],
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              text: "• TEK17 - Forskrift om tekniske krav til byggverk",
              spacing: { after: 50 },
            }),
            new Paragraph({
              text: "• VTEK - Veiledning til teknisk forskrift",
              spacing: { after: 50 },
            }),
            new Paragraph({
              text: "• NS 3901 - Risikobasert dimensjonering av brannsikkerhet i byggverk",
              spacing: { after: 50 },
            }),
            new Paragraph({
              text: "• NS-EN 1991-1-2 - Eurocode 1: Laster på konstruksjoner - Del 1-2: Allmenne laster - Brannpåvirkning",
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "4. KONKLUSJON", bold: true, size: 28 }),
              ],
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              text: "Ved å følge anbefalingene og tiltakene beskrevet i dette brannkonseptet, vil bygningen ha et tilfredsstillende sikkerhetsnivå mot brann i samsvar med gjeldende regelverk.",
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Generert av BrannRådgiver Pro", italics: true, size: 20 }),
              ],
              alignment: AlignmentType.CENTER,
              border: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
              },
              spacing: { before: 200 },
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "brannkonsept.docx");
    
    toast({
      title: "Dokument lastet ned",
      description: "Brannkonseptet er eksportert som Word-fil",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tilbake
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                <Flame className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">Generer Brannkonsept</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Input Form */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Prosjektinformasjon</CardTitle>
              <CardDescription>
                Fyll inn nødvendig informasjon for å generere brannkonseptet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="bygningstype">Bygningstype</Label>
                <Select onValueChange={(value) => setFormData({...formData, bygningstype: value})}>
                  <SelectTrigger id="bygningstype">
                    <SelectValue placeholder="Velg bygningstype" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bolig">Boligbygg</SelectItem>
                    <SelectItem value="kontor">Kontorbygg</SelectItem>
                    <SelectItem value="skole">Skole/barnehage</SelectItem>
                    <SelectItem value="industri">Industribygg</SelectItem>
                    <SelectItem value="lager">Lagerbygg</SelectItem>
                    <SelectItem value="handelsbygg">Handelsbygg</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="risikoklasse">Risikoklasse</Label>
                  <Select onValueChange={(value) => setFormData({...formData, risikoklasse: value})}>
                    <SelectTrigger id="risikoklasse">
                      <SelectValue placeholder="RK" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RK1">RK 1</SelectItem>
                      <SelectItem value="RK2">RK 2</SelectItem>
                      <SelectItem value="RK3">RK 3</SelectItem>
                      <SelectItem value="RK4">RK 4</SelectItem>
                      <SelectItem value="RK5">RK 5</SelectItem>
                      <SelectItem value="RK6">RK 6</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brannklasse">Brannklasse</Label>
                  <Select onValueChange={(value) => setFormData({...formData, brannklasse: value})}>
                    <SelectTrigger id="brannklasse">
                      <SelectValue placeholder="BKL" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BKL1">BKL 1</SelectItem>
                      <SelectItem value="BKL2">BKL 2</SelectItem>
                      <SelectItem value="BKL3">BKL 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="etasjer">Antall etasjer</Label>
                  <Input 
                    id="etasjer" 
                    type="number" 
                    placeholder="f.eks. 3"
                    onChange={(e) => setFormData({...formData, etasjer: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="areal">Bruttoareal (m²)</Label>
                  <Input 
                    id="areal" 
                    type="number" 
                    placeholder="f.eks. 1200"
                    onChange={(e) => setFormData({...formData, areal: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="baeresystem">Bæresystem</Label>
                <Input 
                  id="baeresystem" 
                  placeholder="f.eks. Limtrebæring, stålbæring, betong"
                  onChange={(e) => setFormData({...formData, baeresystem: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roemning">Rømningsløsning</Label>
                <Textarea 
                  id="roemning" 
                  placeholder="Beskriv rømningsveier og kapasitet"
                  onChange={(e) => setFormData({...formData, roemning: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seksjonering">Seksjonering</Label>
                <Textarea 
                  id="seksjonering" 
                  placeholder="Beskriv brannceller og seksjoner"
                  onChange={(e) => setFormData({...formData, seksjonering: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="installasjoner">Tekniske installasjoner</Label>
                <Textarea 
                  id="installasjoner" 
                  placeholder="f.eks. Sprinkler, brannalarm, ventilasjon"
                  onChange={(e) => setFormData({...formData, installasjoner: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fravik">Fravik og kompenserende tiltak (valgfritt)</Label>
                <Textarea 
                  id="fravik" 
                  placeholder="Beskriv eventuelle fravik og kompenserende tiltak"
                  onChange={(e) => setFormData({...formData, fravik: e.target.value})}
                />
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? "Genererer..." : "Generer brannkonsept"}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Output */}
          <div className="space-y-4">
            <Card className="shadow-medium">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Generert konsept</CardTitle>
                    <CardDescription>
                      Forhåndsvisning av brannkonseptet
                    </CardDescription>
                  </div>
                  {generatedConcept && (
                    <Button variant="outline" size="sm" onClick={exportToWord}>
                      <Download className="h-4 w-4 mr-2" />
                      Last ned Word
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {generatedConcept ? (
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
                      {generatedConcept}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileDown className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Fyll ut skjemaet og klikk "Generer brannkonsept" for å se resultatet her</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Konsept;
