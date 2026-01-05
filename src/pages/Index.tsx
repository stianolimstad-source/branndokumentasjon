import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Calculator, FileText, BookOpen, ClipboardCheck, FileWarning, Banknote } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const features = [
    {
      icon: FileText,
      title: "Brannkonsepter",
      description: "Generer profesjonelle brannkonsepter basert på prosjektdata",
      href: "/konsept",
    },
    {
      icon: Calculator,
      title: "Beregningsverktøy",
      description: "Interaktive verktøy for rømning, røyk og brannlast",
      href: "/verktoy",
    },
    {
      icon: Banknote,
      title: "Priskalkulator",
      description: "Beregn pris for branntekniske oppdrag",
      href: "/priskalkulator",
    },
    {
      icon: ClipboardCheck,
      title: "Tilstandsvurdering",
      description: "Lag rapporter og risikoanalyser med bilder",
      href: "#",
    },
    {
      icon: FileWarning,
      title: "Fraviksdokumentasjon",
      description: "Generer formelle fraviksanalyser og tiltak",
      href: "#",
    },
    {
      icon: BookOpen,
      title: "Eksempelkatalog",
      description: "Bibliotek med løsninger og konstruksjoner",
      href: "#",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                <Flame className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">BrannRådgiver Pro</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Profesjonell brannteknisk rådgivning
          </h2>
          <p className="text-xl text-muted-foreground">
            Komplett verktøykasse for konsepter, vurderinger og beregninger. 
            Spar tid og forbedre kvaliteten på dine leveranser.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => (
            <Card 
              key={feature.title} 
              className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer group"
              onClick={() => feature.href !== "#" && (window.location.href = feature.href)}
            >
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* News Section Placeholder */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold mb-6">Nyheter og oppdateringer</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardDescription>Kommer snart</CardDescription>
                <CardTitle className="text-lg">Branntekniske nyheter</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Her vil du finne siste nytt om regelverk, produkter og bransjeoppdateringer.
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardHeader>
                <CardDescription>Kommer snart</CardDescription>
                <CardTitle className="text-lg">Produktinformasjon</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Oversikt over godkjente produkter og løsninger for brannsikkerhet.
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardHeader>
                <CardDescription>Kommer snart</CardDescription>
                <CardTitle className="text-lg">Regelverksendringer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Oppdateringer om TEK, VTEK og andre relevante forskrifter.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>BrannRådgiver Pro - Regelverksforankret dokumentasjon for brannsikkerhet</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
