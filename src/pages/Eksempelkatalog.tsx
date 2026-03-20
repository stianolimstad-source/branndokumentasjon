import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Layers, FileWarning, Package, Settings } from "lucide-react";

const categories = [
  {
    icon: Layers,
    title: "Branncellevegger",
    description: "Eksempler på branncellevegger, gjennomføringer og detaljer for ulike brannklasser og motstandskrav.",
    href: "/eksempelkatalog/branncellevegger",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10 group-hover:bg-orange-500/20",
  },
  {
    icon: FileWarning,
    title: "Fravik",
    description: "Eksempler på vanlige fravik, kompenserende tiltak og dokumentasjonsgrunnlag for ulike prosjekttyper.",
    href: "/eksempelkatalog/fravik",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10 group-hover:bg-amber-500/20",
  },
  {
    icon: Package,
    title: "Branntekniske produkter",
    description: "Oversikt over godkjente produkter, konstruksjoner og løsninger med referanser til dokumentasjon og sertifisering.",
    href: "/eksempelkatalog/produkter",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10 group-hover:bg-blue-500/20",
  },
  {
    icon: Settings,
    title: "Branntekniske installasjoner",
    description: "Veiledning for valg av installasjoner i ulike scenarier — sprinkler, alarmanlegg, røykventilasjon, nødlys og ledesystem.",
    href: "/eksempelkatalog/installasjoner",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10 group-hover:bg-emerald-500/20",
  },
];

const Eksempelkatalog = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Eksempelkatalog</h2>
            <p className="text-muted-foreground">
              Bibliotek med løsninger, konstruksjoner og eksempler for brannteknisk prosjektering.
              Bruk katalogen som oppslagsverk og inspirasjon — eller legg til egne notater og favoritter.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {categories.map((cat) => (
              <Link key={cat.title} to={cat.href} className="block">
                <Card className="shadow-soft hover:shadow-medium transition-all cursor-pointer group h-full">
                  <CardHeader>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${cat.bgColor} mb-3 transition-colors`}>
                      <cat.icon className={`h-6 w-6 ${cat.color}`} />
                    </div>
                    <CardTitle className="text-lg">{cat.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {cat.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>

          <Card className="shadow-soft border-dashed">
            <CardContent className="py-6">
              <p className="text-sm text-muted-foreground text-center">
                Katalogen utvides fortløpende med nye eksempler, produkter og løsninger.
                Har du forslag? Ta kontakt — vi bygger dette sammen.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Eksempelkatalog;
