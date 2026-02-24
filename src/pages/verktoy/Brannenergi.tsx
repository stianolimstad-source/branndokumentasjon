import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import BrannenergCalculator from "@/components/fraviksdokumentasjon/calculators/BrannenergCalculator";

const Brannenergi = () => {
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
          <BrannenergCalculator />
        </div>
      </div>
    </div>
  );
};

export default Brannenergi;
