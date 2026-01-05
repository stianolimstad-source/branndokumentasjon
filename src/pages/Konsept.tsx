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
      setGeneratedConcept("generated");
      setIsGenerating(false);
      toast({
        title: "Brannkonsept generert",
        description: "Dokumentet er klart for eksport",
      });
    }, 1500);
  };

  const renderPreview = () => {
    return (
      <div className="bg-white text-black p-8 rounded-lg shadow-inner font-serif text-sm" style={{ minHeight: '600px' }}>
        <h1 className="text-xl font-bold text-center mb-6 pb-4">
          BRANNKONSEPT
        </h1>
        
        {/* Innholdsfortegnelse */}
        <section className="mb-6">
          <h2 className="font-bold mb-3">Innholdsfortegnelse</h2>
          <div className="space-y-1 text-xs">
            <p><span className="font-bold">1.</span> Innledning</p>
            <p className="ml-4">1.1 Informasjon om tiltaket</p>
            <p className="ml-4">1.2 Ansvarsoppgave i henhold til byggesaksforskriften (SAK 10)</p>
            <p className="ml-4">1.3 Avgrensning av tiltak</p>
            <p className="ml-4">1.4 Gjeldende regelverk</p>
            <p><span className="font-bold">2.</span> Grunnlag og forutsetninger for brannteknisk prosjektering</p>
            <p className="ml-4">2.1 Grunnlagsdokumenter</p>
            <p className="ml-4">2.2 Beskrivelse av bygning og branntekniske forutsetninger</p>
            <p className="ml-4">2.3 Tilleggskrav fra tiltakshaver, myndigheter eller bruker</p>
            <p><span className="font-bold">3.</span> Beskrivelse av branntekniske ytelseskrav</p>
            <p className="ml-4">3.1 § 11-4 Bæreevne og stabilitet</p>
            <p className="ml-4">3.2 § 11-5 Sikkerhet ved eksplosjon</p>
            <p className="ml-4">3.3 § 11-6 Tiltak mot brannspredning mellom byggverk</p>
            <p className="ml-4">3.4 § 11-7 Brannseksjoner</p>
            <p className="ml-4">3.5 § 11-8 Brannceller</p>
            <p className="ml-4">3.6 § 11-9 Materialer og produkters egenskaper ved brann</p>
            <p className="ml-4">3.7 § 11-10 Tekniske installasjoner</p>
            <p className="ml-4">3.8 § 11-11 Generelle krav om rømning og redning</p>
            <p className="ml-4">3.9 § 11-12 Tiltak for å påvirke rømnings- og redningstider</p>
            <p className="ml-4">3.10 § 11-13 Utgang fra branncelle</p>
            <p className="ml-4">3.11 § 11-14 Rømningsvei</p>
            <p className="ml-4">3.12 § 11-16 Tilrettelegging for manuell slokking</p>
            <p className="ml-4">3.13 § 11-17 Tilrettelegging for rednings- og slokkemannskap</p>
            <p><span className="font-bold">4.</span> Utførelses- og driftsfasen</p>
            <p className="ml-4">4.1 Utførelsesfasen</p>
            <p className="ml-4">4.2 Driftsfasen</p>
            <p><span className="font-bold">5.</span> Revisjonshistorikk</p>
            <p><span className="font-bold">6.</span> Litteraturhenvisninger</p>
          </div>
        </section>

        <hr className="my-6 border-gray-300" />

        {/* 1. Innledning */}
        <section className="mb-6">
          <h2 className="font-bold mb-3">1. Innledning</h2>
          
          <h3 className="font-semibold mb-2">1.1 Informasjon om tiltaket</h3>
          <div className="ml-4 mb-3 space-y-1">
            <p><span className="font-semibold">Bygningstype:</span> {formData.bygningstype || "[Angis]"}</p>
            <p><span className="font-semibold">Bruttoareal:</span> {formData.areal || "[Angis]"} m²</p>
            <p><span className="font-semibold">Antall etasjer:</span> {formData.etasjer || "[Angis]"}</p>
          </div>

          <h3 className="font-semibold mb-2">1.2 Ansvarsoppgave i henhold til byggesaksforskriften (SAK 10)</h3>
          <p className="ml-4 mb-3">[Ansvarsrett og tiltaksklasse angis her]</p>

          <h3 className="font-semibold mb-2">1.3 Avgrensning av tiltak</h3>
          <p className="ml-4 mb-3">[Avgrensning beskrives]</p>

          <h3 className="font-semibold mb-2">1.4 Gjeldende regelverk</h3>
          <ul className="ml-4 mb-3 list-disc list-inside">
            <li>TEK17 - Forskrift om tekniske krav til byggverk</li>
            <li>VTEK17 - Veiledning til teknisk forskrift</li>
          </ul>
        </section>

        {/* 2. Grunnlag og forutsetninger */}
        <section className="mb-6">
          <h2 className="font-bold mb-3">2. Grunnlag og forutsetninger for brannteknisk prosjektering</h2>
          
          <h3 className="font-semibold mb-2">2.1 Grunnlagsdokumenter</h3>
          <p className="ml-4 mb-3">[Liste over tegninger og dokumenter]</p>

          <h3 className="font-semibold mb-2">2.2 Beskrivelse av bygning og branntekniske forutsetninger</h3>
          <div className="ml-4 mb-3 space-y-1">
            <p><span className="font-semibold">Risikoklasse:</span> {formData.risikoklasse || "[Angis]"}</p>
            <p><span className="font-semibold">Brannklasse:</span> {formData.brannklasse || "[Angis]"}</p>
            <p><span className="font-semibold">Bæresystem:</span> {formData.baeresystem || "[Angis]"}</p>
          </div>

          <h3 className="font-semibold mb-2">2.3 Tilleggskrav fra tiltakshaver, myndigheter eller bruker</h3>
          <p className="ml-4 mb-3">[Eventuelle tilleggskrav beskrives]</p>
        </section>

        {/* 3. Branntekniske ytelseskrav */}
        <section className="mb-6">
          <h2 className="font-bold mb-3">3. Beskrivelse av branntekniske ytelseskrav</h2>
          
          <h3 className="font-semibold mb-2">3.1 § 11-4 Bæreevne og stabilitet</h3>
          <p className="ml-4 mb-3">Bærende konstruksjoner skal dimensjoneres for å opprettholde stabilitet under brann i henhold til brannklasse {formData.brannklasse || "[angis]"}.</p>

          <h3 className="font-semibold mb-2">3.2 § 11-5 Sikkerhet ved eksplosjon</h3>
          <p className="ml-4 mb-3">[Vurdering av eksplosjonsfare]</p>

          <h3 className="font-semibold mb-2">3.3 § 11-6 Tiltak mot brannspredning mellom byggverk</h3>
          <p className="ml-4 mb-3">[Avstandskrav og tiltak beskrives]</p>

          <h3 className="font-semibold mb-2">3.4 § 11-7 Brannseksjoner</h3>
          <p className="ml-4 mb-3">{formData.seksjonering || "[Seksjonering beskrives]"}</p>

          <h3 className="font-semibold mb-2">3.5 § 11-8 Brannceller</h3>
          <p className="ml-4 mb-3">[Branncelleinndeling beskrives]</p>

          <h3 className="font-semibold mb-2">3.6 § 11-9 Materialer og produkters egenskaper ved brann</h3>
          <p className="ml-4 mb-3">[Krav til materialer beskrives]</p>

          <h3 className="font-semibold mb-2">3.7 § 11-10 Tekniske installasjoner</h3>
          <p className="ml-4 mb-3">{formData.installasjoner || "[Installasjoner beskrives]"}</p>

          <h3 className="font-semibold mb-2">3.8 § 11-11 Generelle krav om rømning og redning</h3>
          <p className="ml-4 mb-3">{formData.roemning || "[Rømningsforhold beskrives]"}</p>

          <h3 className="font-semibold mb-2">3.9 § 11-12 Tiltak for å påvirke rømnings- og redningstider</h3>
          <p className="ml-4 mb-3">[Tiltak beskrives]</p>

          <h3 className="font-semibold mb-2">3.10 § 11-13 Utgang fra branncelle</h3>
          <p className="ml-4 mb-3">[Utganger beskrives]</p>

          <h3 className="font-semibold mb-2">3.11 § 11-14 Rømningsvei</h3>
          <p className="ml-4 mb-3">[Rømningsveier beskrives]</p>

          <h3 className="font-semibold mb-2">3.12 § 11-16 Tilrettelegging for manuell slokking</h3>
          <p className="ml-4 mb-3">[Slokkeutstyr beskrives]</p>

          <h3 className="font-semibold mb-2">3.13 § 11-17 Tilrettelegging for rednings- og slokkemannskap</h3>
          <p className="ml-4 mb-3">[Tilrettelegging beskrives]</p>
        </section>

        {/* 4. Utførelses- og driftsfasen */}
        <section className="mb-6">
          <h2 className="font-bold mb-3">4. Utførelses- og driftsfasen</h2>
          
          <h3 className="font-semibold mb-2">4.1 Utførelsesfasen</h3>
          <p className="ml-4 mb-3">[Krav til utførelse beskrives]</p>

          <h3 className="font-semibold mb-2">4.2 Driftsfasen</h3>
          <p className="ml-4 mb-3">[Krav til drift og vedlikehold beskrives]</p>
        </section>

        {/* 5. Revisjonshistorikk */}
        <section className="mb-6">
          <h2 className="font-bold mb-3">5. Revisjonshistorikk</h2>
          <p className="ml-4">[Revisjonslogg]</p>
        </section>

        {/* 6. Litteraturhenvisninger */}
        <section className="mb-6">
          <h2 className="font-bold mb-3">6. Litteraturhenvisninger</h2>
          <ul className="ml-4 list-disc list-inside">
            <li>TEK17 - Forskrift om tekniske krav til byggverk</li>
            <li>VTEK17 - Veiledning til teknisk forskrift</li>
            <li>NS 3901 - Krav til risikovurdering av brann i byggverk</li>
          </ul>
        </section>

        {formData.fravik && (
          <section className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h2 className="font-bold mb-3">Fravik og kompenserende tiltak</h2>
            <p className="ml-4">{formData.fravik}</p>
          </section>
        )}
      </div>
    );
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
            
            // 1. Innledning
            new Paragraph({
              children: [new TextRun({ text: "1. Innledning", bold: true, size: 28 })],
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "1.1 Informasjon om tiltaket", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Bygningstype: ", bold: true }),
                new TextRun({ text: formData.bygningstype || "[Angis]" }),
              ],
              spacing: { after: 50 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Bruttoareal: ", bold: true }),
                new TextRun({ text: `${formData.areal || "[Angis]"} m²` }),
              ],
              spacing: { after: 50 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Antall etasjer: ", bold: true }),
                new TextRun({ text: formData.etasjer || "[Angis]" }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "1.2 Ansvarsoppgave i henhold til byggesaksforskriften (SAK 10)", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: "[Ansvarsrett og tiltaksklasse angis her]",
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "1.3 Avgrensning av tiltak", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: "[Avgrensning beskrives]",
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "1.4 Gjeldende regelverk", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: "• TEK17 - Forskrift om tekniske krav til byggverk",
              spacing: { after: 50 },
            }),
            new Paragraph({
              text: "• VTEK17 - Veiledning til teknisk forskrift",
              spacing: { after: 100 },
            }),

            // 2. Grunnlag og forutsetninger
            new Paragraph({
              children: [new TextRun({ text: "2. Grunnlag og forutsetninger for brannteknisk prosjektering", bold: true, size: 28 })],
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "2.1 Grunnlagsdokumenter", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: "[Liste over tegninger og dokumenter]",
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "2.2 Beskrivelse av bygning og branntekniske forutsetninger", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Risikoklasse: ", bold: true }),
                new TextRun({ text: formData.risikoklasse || "[Angis]" }),
              ],
              spacing: { after: 50 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Brannklasse: ", bold: true }),
                new TextRun({ text: formData.brannklasse || "[Angis]" }),
              ],
              spacing: { after: 50 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Bæresystem: ", bold: true }),
                new TextRun({ text: formData.baeresystem || "[Angis]" }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "2.3 Tilleggskrav fra tiltakshaver, myndigheter eller bruker", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: "[Eventuelle tilleggskrav beskrives]",
              spacing: { after: 100 },
            }),

            // 3. Branntekniske ytelseskrav
            new Paragraph({
              children: [new TextRun({ text: "3. Beskrivelse av branntekniske ytelseskrav", bold: true, size: 28 })],
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "3.1 § 11-4 Bæreevne og stabilitet", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: `Bærende konstruksjoner skal dimensjoneres for å opprettholde stabilitet under brann i henhold til brannklasse ${formData.brannklasse || "[angis]"}.`,
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "3.2 § 11-5 Sikkerhet ved eksplosjon", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: "[Vurdering av eksplosjonsfare]",
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "3.3 § 11-6 Tiltak mot brannspredning mellom byggverk", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: "[Avstandskrav og tiltak beskrives]",
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "3.4 § 11-7 Brannseksjoner", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: formData.seksjonering || "[Seksjonering beskrives]",
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "3.5 § 11-8 Brannceller", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: "[Branncelleinndeling beskrives]",
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "3.6 § 11-9 Materialer og produkters egenskaper ved brann", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: "[Krav til materialer beskrives]",
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "3.7 § 11-10 Tekniske installasjoner", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: formData.installasjoner || "[Installasjoner beskrives]",
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "3.8 § 11-11 Generelle krav om rømning og redning", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: formData.roemning || "[Rømningsforhold beskrives]",
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "3.9 § 11-12 Tiltak for å påvirke rømnings- og redningstider", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: "[Tiltak beskrives]",
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "3.10 § 11-13 Utgang fra branncelle", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: "[Utganger beskrives]",
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "3.11 § 11-14 Rømningsvei", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: "[Rømningsveier beskrives]",
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "3.12 § 11-16 Tilrettelegging for manuell slokking", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: "[Slokkeutstyr beskrives]",
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "3.13 § 11-17 Tilrettelegging for rednings- og slokkemannskap", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: "[Tilrettelegging beskrives]",
              spacing: { after: 100 },
            }),

            // 4. Utførelses- og driftsfasen
            new Paragraph({
              children: [new TextRun({ text: "4. Utførelses- og driftsfasen", bold: true, size: 28 })],
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "4.1 Utførelsesfasen", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: "[Krav til utførelse beskrives]",
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "4.2 Driftsfasen", bold: true, size: 24 })],
              spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
              text: "[Krav til drift og vedlikehold beskrives]",
              spacing: { after: 100 },
            }),

            // 5. Revisjonshistorikk
            new Paragraph({
              children: [new TextRun({ text: "5. Revisjonshistorikk", bold: true, size: 28 })],
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              text: "[Revisjonslogg]",
              spacing: { after: 100 },
            }),

            // 6. Litteraturhenvisninger
            new Paragraph({
              children: [new TextRun({ text: "6. Litteraturhenvisninger", bold: true, size: 28 })],
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              text: "• TEK17 - Forskrift om tekniske krav til byggverk",
              spacing: { after: 50 },
            }),
            new Paragraph({
              text: "• VTEK17 - Veiledning til teknisk forskrift",
              spacing: { after: 50 },
            }),
            new Paragraph({
              text: "• NS 3901 - Krav til risikovurdering av brann i byggverk",
              spacing: { after: 100 },
            }),

            // Fravik (if any)
            ...(formData.fravik ? [
              new Paragraph({
                children: [new TextRun({ text: "Fravik og kompenserende tiltak", bold: true, size: 28 })],
                spacing: { before: 400, after: 200 },
              }),
              new Paragraph({
                text: formData.fravik,
                spacing: { after: 200 },
              }),
            ] : []),
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
                  renderPreview()
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
