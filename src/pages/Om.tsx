import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Users,
  FileText,
  ClipboardCheck,
  FileWarning,
  Calculator,
  ShieldCheck,
  BookOpen,
  Mail,
  LogIn,
} from "lucide-react";

const sections = [
  {
    icon: Users,
    title: "For hvem?",
    text: "Branndokumentasjon.no er utviklet for brannrådgivere, branntekniske prosjekterende og rådgivende ingeniører som jobber med brannprosjektering, tilstandsvurderinger og brannteknisk dokumentasjon. Verktøyet egner seg både for selvstendige rådgivere og rådgiverfirmaer som ønsker å effektivisere arbeidsflyten og heve kvaliteten på leveransene.",
  },
  {
    icon: FileText,
    title: "Brannkonsept etter TEK17",
    text: "Lag komplette brannkonsepter forankret i TEK17, VTEK og relevante byggforskrifter. Appen genererer strukturerte kapitler om bæreevne, brannspredning, branncellearealer, rømning, slokkeanlegg, manuell slokking og innsatsmannskap – med automatisk sammenstilling av krav på tvers av flere bygningsdeler.",
  },
  {
    icon: ClipboardCheck,
    title: "Tilstandsvurdering av eksisterende bygg",
    text: "Utfør branntekniske tilstandsvurderinger etter NS 3424, med støtte for både moderne TEK-bygg og eldre bygg etter Byggeforskrift 1985 (BF85). Bilder med EXIF-rotasjon, tilstandsgrader og kapittelstruktur håndteres automatisk i rapporten.",
  },
  {
    icon: FileWarning,
    title: "Fraviksdokumentasjon",
    text: "Kvalitative og kvantitative fraviksanalyser etter Byggforsk 321.026, med integrerte beregningsverktøy (stråling, flammehøyde, brannenergi, persontall, brannmotstand m.m.) som dokumenteres direkte inn i analysen.",
  },
  {
    icon: Calculator,
    title: "Beregningsverktøy",
    text: "Et bibliotek av branntekniske beregningsverktøy: Solid Flame stråling, Heskestad flammehøyde, brannmotstand etter additiv komponentmetode, brannareal og røykventilasjon etter HO-3/2000, eksplosjonsavlastning, brensellagring etter DSB, og mer.",
  },
  {
    icon: ShieldCheck,
    title: "Samarbeid og kvalitetssikring",
    text: "Del prosjekter med kollegaer og grupper, tildel oppgaver, og kjør egen- og sidemannskontroll med snapshot. Logoer og maler kan tilpasses per gruppe slik at ferdig Word-/PDF-dokumentasjon får riktig profil.",
  },
  {
    icon: BookOpen,
    title: "Eksempelkatalog",
    text: "Bla i en katalog av verifiserte løsninger for branntekniske konstruksjoner og brannfarlige stoffer, med referanser til SINTEF, Norgips og andre relevante kilder.",
  },
];

const Om = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Om Branndokumentasjon.no</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Branndokumentasjon.no er et komplett digitalt verktøy laget av en
            brannrådgiver for brannrådgivere. Appen samler hele arbeidsflyten – fra
            brannkonseptet starter, via beregninger og fraviksanalyser, til ferdig
            dokumentasjon leveres til kunde.
          </p>
        </div>

        <div className="space-y-6">
          {sections.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="shadow-soft">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-soft mt-8 bg-primary/5 border-primary/20">
          <CardContent className="py-6 text-center space-y-4">
            <p className="text-lg font-medium">
              Vil du prøve verktøyet eller har spørsmål?
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/auth">
                <Button>
                  <LogIn className="h-4 w-4 mr-2" />
                  Opprett konto
                </Button>
              </Link>
              <Link to="/kontakt">
                <Button variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Kontakt oss
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Om;
