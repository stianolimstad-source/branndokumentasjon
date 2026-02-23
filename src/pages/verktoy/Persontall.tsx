import { Button } from "@/components/ui/button";
import { Flame, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import PersontallCalculator from "@/components/fraviksdokumentasjon/calculators/PersontallCalculator";

const Persontall = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/verktoy">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Alle verktøy
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                <Flame className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">Persontallsberegning</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <PersontallCalculator />
        </div>
      </div>
    </div>
  );
};

export default Persontall;
