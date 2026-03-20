import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Info, Calculator } from "lucide-react";
import { abKolonner, getUniqueH, interpolateAv, roykventTabell } from "@/lib/roykventilasjon-data";
import BrannArealTool from "@/components/verktoy/BrannArealTool";

const Roykventilasjon = () => {
  const [hInput, setHInput] = useState("");
  const [hSmallInput, setHSmallInput] = useState("");
  const [abInput, setAbInput] = useState("");
  const [showBrannArealDialog, setShowBrannArealDialog] = useState(false);

  const H = hInput ? parseFloat(hInput) : null;
  const h = hSmallInput ? parseFloat(hSmallInput) : null;
  const Ab = abInput ? parseFloat(abInput) : null;

  const isInterpolated = useMemo(() => {
    if (!H || !h) return false;
    const uniqueH = getUniqueH();
    if (!uniqueH.includes(H)) return true;
    const hVals = roykventTabell.filter((r) => r.H === H).map((r) => r.h);
    if (!hVals.includes(h)) return true;
    if (Ab && !abKolonner.includes(Ab)) return true;
    return false;
  }, [H, h, Ab]);

  const resultat = H && h && Ab && h < H && h > 0 && Ab > 0
    ? interpolateAv(H, h, Ab)
    : undefined;

  // Find bracketing H values for showing reference tables
  const uniqueH = getUniqueH();
  const bracketH = useMemo(() => {
    if (!H) return [];
    if (uniqueH.includes(H)) return [H];
    const sorted = [...uniqueH].sort((a, b) => a - b);
    const lo = sorted.filter((v) => v < H).pop();
    const hi = sorted.find((v) => v > H);
    return [lo, hi].filter((v): v is number => v !== undefined);
  }, [H, uniqueH]);

  const handleBrannArealSelect = (brannareal: number) => {
    setAbInput(String(brannareal));
    setShowBrannArealDialog(false);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Røykventilasjon — Nødvendig åpningsareal</h2>
            <p className="text-muted-foreground">
              Finn nødvendig åpningsareal (A<sub>v</sub>) for termisk røykventilasjon basert på romhøyde,
              røykfri sone og brannareal. Ref. Melding HO-3/2000.
            </p>
          </div>

          {/* Kalkulator */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Finn nødvendig åpningsareal A<sub>v</sub></CardTitle>
              <CardDescription>Oppgi romhøyde, ønsket røykfri sone og brannareal. Verdier mellom tabellpunkter interpoleres automatisk.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Høyde H (m)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="f.eks. 15"
                    value={hInput}
                    onChange={(e) => setHInput(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Romhøyde / takhøyde (tabellverdier: {uniqueH.join(", ")})</p>
                </div>

                <div className="space-y-2">
                  <Label>Røykfri sone h (m)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="f.eks. 7"
                    value={hSmallInput}
                    onChange={(e) => setHSmallInput(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Fri høyde under røyklaget (må være mindre enn H)</p>
                  {H && h && h >= H && (
                    <p className="text-xs text-destructive">Røykfri sone må være lavere enn romhøyden.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Brannareal A<sub>b</sub> (m²)</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Skriv inn brannareal"
                    value={abInput}
                    onChange={(e) => setAbInput(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-1"
                    onClick={() => setShowBrannArealDialog(true)}
                  >
                    <Calculator className="h-3.5 w-3.5 mr-1.5" />
                    Beregn brannareal fra brannbelastning
                  </Button>
                </div>
              </div>

              {/* Resultat */}
              {resultat !== undefined && (
                <div className={`p-4 rounded-lg ${
                  resultat === null
                    ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100"
                    : "bg-primary/10 text-foreground"
                }`}>
                  {resultat === null ? (
                    <p className="font-semibold">Verdien er utenfor tabellens gyldighetsområde for denne kombinasjonen.</p>
                  ) : (
                    <div>
                      <p className="text-sm font-medium">Nødvendig åpningsareal A<sub>v</sub>:</p>
                      <p className="text-3xl font-bold mt-1">{Math.round(resultat * 10) / 10} m²</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        H = {hInput} m, røykfri sone h = {hSmallInput} m, brannareal A<sub>b</sub> = {abInput} m²
                      </p>
                      {isInterpolated && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          ⓘ Verdien er interpolert mellom tabellverdier.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Forklaring */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Om termisk røykventilasjon
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                Termisk røykventilasjon benytter oppdriften i varme røykgasser til å lede røyken ut gjennom
                åpninger i tak eller øvre del av vegger. Tabellen gir nødvendig samlet åpningsareal (A<sub>v</sub>)
                for å opprettholde en røykfri sone av angitt høyde.
              </p>
              <p>
                <strong>H</strong> er romhøyden (fra gulv til tak). <strong>h</strong> er høyden på den røykfrie sonen
                målt fra gulv. Differansen (H − h) er tykkelsen på røyklaget.
              </p>
              <p>
                <strong>A<sub>b</sub></strong> (brannareal) er det arealet brannen dekker på et gitt tidspunkt.
                Bruk «Beregn brannareal»-knappen for å finne dette basert på brannbelastning og innsatstid.
              </p>
              <p>
                Verdier som ikke finnes direkte i tabellen interpoleres lineært mellom de nærmeste tabellpunktene
                for H, h og A<sub>b</sub>. Interpolerte verdier er merket med ⓘ.
              </p>
              <p className="font-medium text-foreground">
                Referanse: Melding HO-3/2000 — Røykventilasjon.
              </p>
            </CardContent>
          </Card>

          {/* Hovedtabell — samlet som i HO-3/2000 */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Tabell: Nødvendig åpningsareal A<sub>v</sub> (m²)</CardTitle>
              <CardDescription>Melding HO-3/2000. Kolonner viser brannareal A<sub>b</sub> (m²).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="sticky top-0 bg-background z-10">
                    <tr className="border-b-2 border-border">
                      <th rowSpan={2} className="text-left py-2 pr-2 font-semibold w-16">H (m)</th>
                      <th rowSpan={2} className="text-left py-2 pr-2 font-semibold w-16">h (m)</th>
                      <th colSpan={abKolonner.length} className="text-center py-1 font-semibold border-b border-border">
                        Brannareal A<sub>b</sub> (m²)
                      </th>
                    </tr>
                    <tr className="border-b-2 border-border">
                      {abKolonner.map((ab) => (
                        <th key={ab} className="text-right py-1.5 px-2 font-semibold text-xs">{ab}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueH.map((tableH) => {
                      const rows = roykventTabell.filter((r) => r.H === tableH);
                      return rows.map((row, rowIdx) => (
                        <tr
                          key={`${row.H}-${row.h}`}
                          className={`border-b border-border/40 ${
                            rowIdx === 0 ? "border-t-2 border-t-border" : ""
                          } hover:bg-muted/50 transition-colors`}
                        >
                          {rowIdx === 0 && (
                            <td
                              rowSpan={rows.length}
                              className="py-1.5 pr-2 font-semibold text-foreground align-top border-r border-border/40"
                            >
                              {tableH}
                            </td>
                          )}
                          <td className="py-1.5 pr-2 text-muted-foreground">{row.h}</td>
                          {row.values.map((val, i) => (
                            <td key={i} className="text-right py-1.5 px-2 tabular-nums">
                              {val === null ? "—" : val}
                            </td>
                          ))}
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Full brannareal-verktøy i dialog */}
      <Dialog open={showBrannArealDialog} onOpenChange={setShowBrannArealDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Beregn brannareal — HO-3/2000</DialogTitle>
          </DialogHeader>
          <BrannArealTool onSelectResult={handleBrannArealSelect} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Roykventilasjon;
