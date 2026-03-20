import BrannArealTool from "@/components/verktoy/BrannArealTool";

const Brannareal = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Brannareal</h2>
            <p className="text-muted-foreground">
              Beregn brannareal over tid basert på spesifikk brannbelastning og brannveksttid (t<sub>g</sub>).
              Ref. Melding HO-3/2000, Tabell 7-1 og 7-2.
            </p>
          </div>
          <BrannArealTool />
        </div>
      </div>
    </div>
  );
};

export default Brannareal;
