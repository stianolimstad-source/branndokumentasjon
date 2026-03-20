import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, MoveVertical, Box, Users, Zap, Shield, Maximize } from "lucide-react";
import { Link } from "react-router-dom";


const tools = [
  {
    icon: Flame,
    title: "Strålingsberegning",
    description: "Beregn strålingsnivå fra brann mot fasade eller nabobygning",
    href: "/verktoy/straling",
  },
  {
    icon: MoveVertical,
    title: "Flammehøyde",
    description: "Beregn flammehøyde basert på branneffekt og åpningsgeometri",
    href: "/verktoy/flammehoyde",
  },
  {
    icon: Box,
    title: "Omhyllingsflate",
    description: "Beregn omhyllingsflate for branncellevurdering",
    href: "/verktoy/omhyllingsflate",
  },
  {
    icon: Users,
    title: "Persontallsberegning",
    description: "Beregn persontall basert på areal og brukskategori",
    href: "/verktoy/persontall",
  },
  {
    icon: Zap,
    title: "Brannenergi",
    description: "Beregn total og spesifikk brannenergi basert på materialer og mengder",
    href: "/verktoy/brannenergi",
  },
  {
    icon: Shield,
    title: "Brannmotstand",
    description: "Beregn brannmotstandstid (EI) for vegger basert på oppbygning og materialer",
    href: "/verktoy/brannmotstand",
  },
  {
    icon: Maximize,
    title: "Brannareal",
    description: "Finn brannareal over tid basert på brannbelastning og brannveksttid (HO-3/2000)",
    href: "/verktoy/brannareal",
  },
];

const Verktoy = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Velg beregningsverktøy</h2>
            <p className="text-muted-foreground">
              Interaktive verktøy for branntekniske beregninger basert på norske forskrifter.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <Link key={tool.title} to={tool.href} className="block">
                <Card className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer group h-full">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-3 group-hover:bg-primary/20 transition-colors">
                      <tool.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-base">{tool.title}</CardTitle>
                    <CardDescription className="text-sm">{tool.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verktoy;
