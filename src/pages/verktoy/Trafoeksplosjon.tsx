import TrafoEksplosjonTool from "@/components/verktoy/TrafoEksplosjonTool";

const Trafoeksplosjon = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Trafoeksplosjon — risiko og barrierer</h2>
            <p className="text-muted-foreground">
              Vurder omfang av en eksplosjon i en oljefylt krafttrafo (typisk vannkraftstasjon)
              og foreslå barrierer for å oppnå best mulig utfall. Basert på CIGRE TB 537,
              NFPA 850, IEEE 979, EN 61936-1 / NEK 440 og forsøksdata (PLOS One 2015, ASME 2022).
            </p>
          </div>
          <TrafoEksplosjonTool />
        </div>
      </div>
    </div>
  );
};

export default Trafoeksplosjon;
