import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileWarning, BarChart3, GitCompare, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";

const analyseTyper = [
  {
    id: "kvalitativ",
    icon: BarChart3,
    title: "Kvalitativ analyse",
    description: "Enklere fraviksanalyse basert på faglig skjønn og kvalitative vurderinger. Egnet for mindre komplekse fravik der risikoen vurderes som lav.",
    detaljer: "Vurdering av fravikets art, kompenserende tiltak, og påvirkningsområder uten formelle beregninger.",
    href: "/fraviksdokumentasjon/kvalitativ",
  },
  {
    id: "komparativ",
    icon: GitCompare,
    title: "Komparativ analyse",
    description: "Sammenligning av den valgte løsningen opp mot preaksepterte ytelser. Dokumenterer at sikkerheten er minst like god.",
    detaljer: "Systematisk sammenstilling av fraviket opp mot referanseløsningen med vurdering av likeverdighet.",
    href: "/fraviksdokumentasjon/komparativ",
  },
  {
    id: "ns3921",
    icon: BookOpen,
    title: "Analyse etter NS 3921",
    description: "Fullstendig risikoanalyse i henhold til NS 3921. Kreves for mer komplekse fravik, typisk i tiltaksklasse 3 og brannklasse 4.",
    detaljer: "Strukturert risikovurdering med identifikasjon av farer, sannsynlighet, konsekvens og risikomatrise.",
    href: "/fraviksdokumentasjon/ns3921",
  },
];

const Fraviksdokumentasjon = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <PageHeader
        title="Fraviksdokumentasjon"
        subtitle="Velg analysemetode for fraviket"
        icon={<FileWarning className="h-6 w-6 text-primary-foreground" />}
      />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Velg type analyse</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Valg av analysemetode avhenger av fravikets kompleksitet, tiltaksklasse og brannklasse. 
              For enklere fravik holder det ofte med en kvalitativ analyse, mens mer komplekse fravik krever analyse etter NS 3921.
            </p>
          </div>

          <div className="grid gap-6">
            {analyseTyper.map((type) => (
              <Link key={type.id} to={type.href} className="block">
                <Card className="shadow-soft hover:shadow-medium transition-all cursor-pointer group border-l-4 border-l-transparent hover:border-l-primary">
                  <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <type.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{type.title}</CardTitle>
                      <CardDescription>{type.description}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pl-[4.5rem]">
                    <p className="text-sm text-muted-foreground">{type.detaljer}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Fraviksdokumentasjon;
