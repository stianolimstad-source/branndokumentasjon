import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Calculator, FileText, BookOpen, ClipboardCheck, FileWarning, Plus, FolderOpen, ShieldCheck, BarChart3, GitCompare, Shield, LayoutDashboard, Warehouse, Receipt } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardPanel from "@/components/dashboard/DashboardPanel";

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
      href: "tilstand-dialog",
    },
    {
      icon: FileWarning,
      title: "Fraviksdokumentasjon",
      description: "Generer formelle fraviksanalyser og tiltak",
      href: "fravik-dialog",
    },
    {
      icon: Warehouse,
      title: "Brannfarlig lagring",
      description: "Krav til lagring av brennbar væske basert på type og mengde",
      href: "/brensellagring",
    },
    {
      icon: Receipt,
      title: "Tilbud",
      description: "Lag og eksporter profesjonelle pristilbud til kunder",
      href: "/tilbud",
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
      href: "/eksempelkatalog",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle overflow-x-hidden">

      {/* Hero / Dashboard Section */}
      <section className="container mx-auto px-4 py-16">
        {user ? (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl sm:text-3xl font-bold">Velkommen tilbake</h2>
              <Link to="/dashboard">
                <Button variant="outline" size="sm">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Fullt dashboard
                </Button>
              </Link>
            </div>
            <DashboardPanel />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-balance">
              Ditt komplette branntekniske dokumentasjonsverktøy
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground">
              Komplett verktøykasse for konsepter, vurderinger og beregninger. 
              Spar tid og forbedre kvaliteten på dine leveranser.
            </p>
          </div>
        )}
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => {
            if (feature.href === "dialog" || feature.href === "fravik-dialog" || feature.href === "tilstand-dialog") {
              const handleClick = () => {
                if (feature.href === "dialog") setShowConceptDialog(true);
                else if (feature.href === "tilstand-dialog") setShowTilstandDialog(true);
                else setShowFravikDialog(true);
              };
              return (
                <Card
                  key={feature.title}
                  className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer group"
                  onClick={handleClick}
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
        <div className="max-w-6xl mx-auto mt-8 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30">
          <p className="text-sm text-amber-800 dark:text-amber-200 text-center">
            <strong>Merk:</strong> Dette verktøyet er under utvikling. Alle dokumenter og beregninger som genereres kan inneholde feil og må kontrolleres og godkjennes av personer med tilstrekkelig kompetanse.
          </p>
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

      {/* Tilstandsvurdering choice dialog */}
      <Dialog open={showTilstandDialog} onOpenChange={setShowTilstandDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tilstandsvurdering</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <Button
              size="lg"
              className="justify-start h-auto py-4 px-5"
              onClick={() => { setShowTilstandDialog(false); navigate("/tilstandsvurdering?new=true"); }}
            >
              <Plus className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Start ny tilstandsvurdering</p>
                <p className="text-sm text-primary-foreground/70 font-normal">Opprett en ny vurdering for et prosjekt</p>
              </div>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="justify-start h-auto py-4 px-5"
              onClick={() => { setShowTilstandDialog(false); navigate("/mine-prosjekter"); }}
            >
              <FolderOpen className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Mine prosjekter</p>
                <p className="text-sm text-muted-foreground font-normal">Se og rediger eksisterende tilstandsvurderinger</p>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showFravikDialog} onOpenChange={setShowFravikDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Velg type fraviksvurdering</DialogTitle>
            <DialogDescription>Velg metode for fraviksdokumentasjonen</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => { setShowFravikDialog(false); navigate("/fraviksdokumentasjon/kvalitativ?new=true"); }}
            >
              <CardHeader className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-orange-500" />
                  <div>
                    <CardTitle className="text-sm">Kvalitativ analyse</CardTitle>
                    <CardDescription className="text-xs">Vurdering basert på faglig skjønn og erfaring</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:border-primary transition-colors opacity-60">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <GitCompare className="h-5 w-5 text-blue-500" />
                  <div>
                    <CardTitle className="text-sm">Komparativ analyse</CardTitle>
                    <CardDescription className="text-xs">Sammenligning med preaksepterte ytelser – Kommer snart</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:border-primary transition-colors opacity-60">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <div>
                    <CardTitle className="text-sm">Analyse etter NS 3921</CardTitle>
                    <CardDescription className="text-xs">Risikobasert analyse iht. norsk standard – Kommer snart</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
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
