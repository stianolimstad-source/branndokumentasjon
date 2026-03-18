import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import BrannmotstandCalculator from "@/components/fraviksdokumentasjon/calculators/BrannmotstandCalculator";

const Brannmotstand = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/verktoy">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Alle verktøy
          </Link>
        </Button>
        <div className="max-w-4xl mx-auto">
          <BrannmotstandCalculator />
        </div>
      </div>
    </div>
  );
};

export default Brannmotstand;
