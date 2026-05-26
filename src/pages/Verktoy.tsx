import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, MoveVertical, Box, Users, Zap, Shield, Maximize, Wind, Bot, Activity, Lock, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useIsFullAccess } from "@/hooks/useIsFullAccess";


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
  {
    icon: Wind,
    title: "Røykventilasjon",
    description: "Beregn nødvendig åpningsareal for termisk røykventilasjon (HO-3/2000)",
    href: "/verktoy/roykventilasjon",
  },
  {
    icon: Activity,
    title: "Brannsimulering",
    description: "Forenklet to-sonemodell for brannvekst, røykutvikling og røyklagshøyde i tidlig fase.",
    href: "/verktoy/brannsimulering",
    locked: true,
  },
  {
    icon: AlertTriangle,
    title: "Trafoeksplosjon",
    description: "Vurder omfang og barrierer ved eksplosjon i oljefylt krafttrafo (vannkraft, transmisjon).",
    href: "/verktoy/trafoeksplosjon",
    locked: true,
  },
  {
    icon: Bot,
    title: "AI Brannkonsulent",
    description: "Still spørsmål om branntekniske krav fra TEK17, VTEK17 og BF85",
    href: "/tek17-assistent",
    locked: true,
  },
] as const;

const Verktoy = () => {
  const isFullAccess = useIsFullAccess();
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
            {tools.map((tool) => {
              const isLocked = (tool as any).locked && !isFullAccess;
              if (isLocked) {
                return (
                  <Card key={tool.title} className="shadow-soft relative overflow-hidden opacity-75 cursor-not-allowed h-full" title="Under utvikling – tilgang begrenset">
                    <CardHeader>
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-3">
                        <tool.icon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <CardTitle className="text-base text-muted-foreground">{tool.title}</CardTitle>
                      <CardDescription className="text-sm">{tool.description}</CardDescription>
                    </CardHeader>
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 backdrop-blur-[1px]">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background border shadow-medium">
                        <Lock className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <p className="mt-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Under utvikling</p>
                    </div>
                  </Card>
                );
              }
              return (
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
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verktoy;
