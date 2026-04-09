import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Flame, AlertTriangle, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getBrensellagringKrav, BrenselType } from "@/lib/brensellagring-krav";

const Brensellagring = () => {
  const navigate = useNavigate();
  const [brenselType, setBrenselType] = useState<BrenselType | "">("");
  const [mengde, setMengde] = useState("");

  const mengdeNum = parseFloat(mengde) || 0;
  const result = brenselType ? getBrensellagringKrav(brenselType as BrenselType, mengdeNum) : null;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <section className="container mx-auto px-3 sm:px-4 py-4 sm:py-12">
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" size="sm" className="mb-3 sm:mb-4" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Tilbake
          </Button>

          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold">Lagring av brannfarlig materiale</h2>
            <p className="text-muted-foreground mt-1">
              Krav til lagring av brennbar væske iht. VTEK § 11-8 Tabell 4
            </p>
          </div>

          <Card className="shadow-soft mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Velg brenseltype og mengde
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type brensel</Label>
                  <Select value={brenselType} onValueChange={(v) => setBrenselType(v as BrenselType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fyringsparafin">Fyringsparafin</SelectItem>
                      <SelectItem value="lett_fyringsolje">Lett fyringsolje</SelectItem>
                      <SelectItem value="begge">Begge (kombinasjon)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mengde (liter)</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="F.eks. 3000"
                    value={mengde}
                    onChange={(e) => setMengde(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {result && (
            <>
              {result.feilmelding ? (
                <Card className="shadow-soft border-amber-300 dark:border-amber-700">
                  <CardContent className="py-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800 dark:text-amber-200">{result.feilmelding}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : result.romType && result.krav.length > 0 ? (
                <Card className="shadow-soft">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">Krav – {result.romType}</CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {brenselType === "fyringsparafin" ? "Fyringsparafin" : brenselType === "lett_fyringsolje" ? "Lett fyringsolje" : "Kombinasjon"} – {mengdeNum.toLocaleString("nb-NO")} liter
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left py-2 px-3 font-medium">Kategori</th>
                            <th className="text-left py-2 px-3 font-medium">Krav</th>
                            <th className="text-left py-2 px-3 font-medium w-20">Ansvar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.krav.map((k, i) => (
                            <tr key={i} className="border-t">
                              <td className="py-2 px-3 font-medium">{k.kategori}</td>
                              <td className="py-2 px-3">{k.tekst}</td>
                              <td className="py-2 px-3 text-muted-foreground">{k.ansvar}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Brensellagring;
