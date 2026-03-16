import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Calculator, FileText, BookOpen, ClipboardCheck, FileWarning, Plus, FolderOpen, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showConceptDialog, setShowConceptDialog] = useState(false);
  const [showTilstandDialog, setShowTilstandDialog] = useState(false);
  const [showFravikDialog, setShowFravikDialog] = useState(false);

  const features = [
    {
      icon: FileText,
      title: "Brannkonsepter",
      description: "Generer profesjonelle brannkonsepter basert på prosjektdata",
      href: "dialog",
    },
    {
      icon: Calculator,
      title: "Beregningsverktøy",
      description: "Interaktive verktøy for rømning, røyk og brannlast",
      href: "/verktoy",
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
      href: "fravik-dialog",
    },
    {
      icon: ShieldCheck,
      title: "Sikkerhetsrutiner",
      description: "Rutiner og maler for kvalitetssikring ved prosjektering",
      href: "/sikkerhetsrutiner",
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

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Ditt komplette branntekniske dokumentasjonsverktøy
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
          {features.map((feature) => {
            if (feature.href === "#") {
              return (
                <Card
                  key={feature.title}
                  className="shadow-soft transition-shadow group opacity-60 cursor-not-allowed"
                >
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4 transition-colors">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            }
            if (feature.href === "dialog" || feature.href === "fravik-dialog") {
              return (
                <Card
                  key={feature.title}
                  className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer group"
                  onClick={() => feature.href === "dialog" ? setShowConceptDialog(true) : setShowFravikDialog(true)}
                >
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            }
            return (
              <Link key={feature.title} to={feature.href} className="block">
                <Card className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer group">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Brannkonsept choice dialog */}
      <Dialog open={showConceptDialog} onOpenChange={setShowConceptDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Brannkonsepter</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <Button
              size="lg"
              className="justify-start h-auto py-4 px-5"
              onClick={() => { setShowConceptDialog(false); navigate("/konsept?new=true"); }}
            >
              <Plus className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Start nytt brannkonsept</p>
                <p className="text-sm text-primary-foreground/70 font-normal">Opprett et nytt konsept for et prosjekt</p>
              </div>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="justify-start h-auto py-4 px-5"
              onClick={() => { setShowConceptDialog(false); navigate("/mine-prosjekter"); }}
            >
              <FolderOpen className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Mine prosjekter</p>
                <p className="text-sm text-muted-foreground font-normal">Se og rediger eksisterende brannkonsepter</p>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fraviksdokumentasjon choice dialog */}
      <Dialog open={showFravikDialog} onOpenChange={setShowFravikDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fraviksdokumentasjon</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <Button
              size="lg"
              className="justify-start h-auto py-4 px-5"
              onClick={() => { setShowFravikDialog(false); navigate("/fraviksdokumentasjon/kvalitativ?new=true"); }}
            >
              <Plus className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Kvalitativ analyse</p>
                <p className="text-sm text-primary-foreground/70 font-normal">Fraviksanalyse basert på faglig skjønn</p>
              </div>
            </Button>
            <Button
              size="lg"
              className="justify-start h-auto py-4 px-5 opacity-60 cursor-not-allowed"
              disabled
            >
              <Plus className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Komparativ analyse</p>
                <p className="text-sm text-primary-foreground/70 font-normal">Kommer snart</p>
              </div>
            </Button>
            <Button
              size="lg"
              className="justify-start h-auto py-4 px-5 opacity-60 cursor-not-allowed"
              disabled
            >
              <Plus className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Analyse etter NS 3921</p>
                <p className="text-sm text-primary-foreground/70 font-normal">Kommer snart</p>
              </div>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="justify-start h-auto py-4 px-5"
              onClick={() => { setShowFravikDialog(false); navigate("/mine-prosjekter"); }}
            >
              <FolderOpen className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Mine prosjekter</p>
                <p className="text-sm text-muted-foreground font-normal">Se og rediger eksisterende fraviksdokumenter</p>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* News Section Placeholder */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold mb-6">Nyheter og oppdateringer</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <a href="https://brennaktuelt.no" target="_blank" rel="noopener noreferrer" className="block">
              <Card className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer group">
                <CardHeader>
                  <CardDescription>brennaktuelt.no</CardDescription>
                  <CardTitle className="text-lg">Branntekniske nyheter</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Siste nytt om regelverk, produkter og bransjeoppdateringer fra Brennaktuelt.
                  </p>
                </CardContent>
              </Card>
            </a>
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
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="text-center md:text-left space-y-1">
              <p className="font-medium text-foreground">Olimstad Brannrådgivning AS</p>
              <p>Utviklet av Stian Olimstad</p>
            </div>
            <div className="flex flex-col items-center md:items-end gap-1">
              <a href="mailto:stianolimstad@gmail.com" className="hover:text-foreground transition-colors">
                stianolimstad@gmail.com
              </a>
              <a href="tel:+4790701285" className="hover:text-foreground transition-colors">
                907 01 285
              </a>
              <a href="https://www.linkedin.com/in/stian-olimstad-86863121a/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                LinkedIn
              </a>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">Branndokumentasjon.no – Regelverksforankret dokumentasjon for brannsikkerhet</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
