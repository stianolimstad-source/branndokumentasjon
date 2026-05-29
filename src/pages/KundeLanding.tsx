import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, ShieldCheck, Sparkles, ArrowRight, ArrowLeft } from "lucide-react";

const KundeLanding = () => {
  const navigate = useNavigate();

  const handleBytt = () => {
    localStorage.removeItem("branndok_selected_role");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 pt-6">
        <button
          onClick={handleBytt}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Tilbake til rollevalg
        </button>
      </div>

      <section className="container mx-auto px-4 py-12 sm:py-20">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
            For kunder av branningeniører
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground">
            Få oversikt og bruk våre verktøy
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link to="/auth?rolle=customer&mode=signup">
              <Button size="lg" className="w-full sm:w-auto">
                Registrer deg gratis
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Logg inn
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="shadow-soft">
            <CardHeader>
              <FolderOpen className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Delte prosjekter</CardTitle>
              <CardDescription>
                Se prosjekter din branningeniør har delt med deg, samlet på ett sted.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="shadow-soft">
            <CardHeader>
              <ShieldCheck className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Egne ROS-analyser</CardTitle>
              <CardDescription>
                Opprett og rediger dine egne risiko- og sårbarhetsanalyser.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="shadow-soft">
            <CardHeader>
              <Sparkles className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Gratis å bruke</CardTitle>
              <CardDescription>
                Som kunde er det helt gratis å registrere seg og komme i gang.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

    </div>
  );
};

export default KundeLanding;
