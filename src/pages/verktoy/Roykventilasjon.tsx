import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Info, Calculator } from "lucide-react";
import { abKolonner, getUniqueH, getHValuesForH, lookupAv, roykventTabell } from "@/lib/roykventilasjon-data";

// Inline the Brannareal mini-tool for the dialog
const belastningKategorier = [
  { label: "Under 50 MJ/m²", tg: 300, tgLabel: "300 s (5 min)", eksempler: "Kirke, idrettshall, kantine" },
  { label: "50–200 MJ/m²", tg: 225, tgLabel: "225 s (3,75 min)", eksempler: "Mekanisk verksted, teater, skole, kontor, bolig, garasje" },
  { label: "200–400 MJ/m²", tg: 150, tgLabel: "150 s (2,50 min)", eksempler: "Restaurant, klesbutikk" },
  { label: "Over 400 MJ/m²", tg: 75, tgLabel: "75–150 s (vurderes spesielt)", eksempler: "Trevarefabrikk, høylager" },
];

const brannarealtabell = [
  { tid: 3.0, tidLabel: "3,0 min", verdier: { 75: 12, 150: 3, 225: 1, 300: 1 } as Record<number, number | null> },
  { tid: 5.0, tidLabel: "5,0 min", verdier: { 75: 32, 150: 8, 225: 4, 300: 2 } as Record<number, number | null> },
  { tid: 7.5, tidLabel: "7,5 min", verdier: { 75: 72, 150: 18, 225: 8, 300: 5 } as Record<number, number | null> },
  { tid: 10.0, tidLabel: "10,0 min", verdier: { 75: null, 150: 32, 225: 14, 300: 8 } as Record<number, number | null> },
  { tid: 15.0, tidLabel: "15,0 min", verdier: { 75: null, 150: 72, 225: 32, 300: 18 } as Record<number, number | null> },
];

const BrannArealDialog = ({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSelect: (ab: number) => void;
}) => {
  const [bel, setBel] = useState("");
  const [tid, setTid] = useState("");

  const valgtKat = belastningKategorier.find((b) => String(b.tg) === bel);
  const valgtTid = brannarealtabell.find((r) => String(r.tid) === tid);
  const tgNum = bel ? parseInt(bel) : null;
  const resultat = valgtTid && tgNum ? valgtTid.verdier[tgNum] : undefined;

  const handleUse = () => {
    if (resultat && resultat > 0) {
      // Find closest Ab column
      const closest = abKolonner.reduce((prev, curr) =>
        Math.abs(curr - resultat) < Math.abs(prev - resultat) ? curr : prev
      );
      onSelect(closest);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Beregn brannareal (HO-3/2000)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Spesifikk brannbelastning</Label>
            <Select value={bel} onValueChange={setBel}>
              <SelectTrigger><SelectValue placeholder="Velg brannbelastning" /></SelectTrigger>
              <SelectContent>
                {belastningKategorier.map((k) => (
                  <SelectItem key={k.tg} value={String(k.tg)}>
                    {k.label} → tg = {k.tgLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {valgtKat && <p className="text-xs text-muted-foreground">Eks.: {valgtKat.eksempler}</p>}
          </div>
          <div className="space-y-2">
            <Label>Tid etter brannstart / innsatstid</Label>
            <Select value={tid} onValueChange={setTid}>
              <SelectTrigger><SelectValue placeholder="Velg tid" /></SelectTrigger>
              <SelectContent>
                {brannarealtabell.map((r) => (
                  <SelectItem key={r.tid} value={String(r.tid)}>{r.tidLabel}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {resultat !== undefined && resultat !== null && (
            <div className="bg-primary/10 p-3 rounded-lg">
              <p className="text-sm">Beregnet brannareal: <strong>{resultat} m²</strong></p>
              <p className="text-xs text-muted-foreground mt-1">
                Nærmeste tabellverdi for A<sub>b</sub>: {abKolonner.reduce((prev, curr) =>
                  Math.abs(curr - resultat) < Math.abs(prev - resultat) ? curr : prev
                )} m²
              </p>
              <Button size="sm" className="mt-2" onClick={handleUse}>
                Bruk dette brannarealet
              </Button>
            </div>
          )}
          {resultat === null && bel && tid && (
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-lg text-sm text-yellow-900 dark:text-yellow-100">
              Må vurderes spesielt for denne kombinasjonen.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Roykventilasjon = () => {
  const [selectedH, setSelectedH] = useState("");
  const [selectedh, setSelectedh] = useState("");
  const [selectedAb, setSelectedAb] = useState("");
  const [showBrannArealDialog, setShowBrannArealDialog] = useState(false);

  const uniqueH = getUniqueH();
  const hVerdier = selectedH ? getHValuesForH(parseInt(selectedH)) : [];
  const resultat = selectedH && selectedh && selectedAb
    ? lookupAv(parseInt(selectedH), parseInt(selectedh), parseInt(selectedAb))
    : undefined;

  // Get rows for selected H for the sub-table
  const currentRows = selectedH ? roykventTabell.filter((r) => r.H === parseInt(selectedH)) : [];

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
              <CardDescription>Velg romhøyde, ønsket røykfri sone og brannareal for oppslag i tabellen.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Høyde H (m)</Label>
                  <Select value={selectedH} onValueChange={(v) => { setSelectedH(v); setSelectedh(""); }}>
                    <SelectTrigger><SelectValue placeholder="Velg høyde" /></SelectTrigger>
                    <SelectContent>
                      {uniqueH.map((h) => (
                        <SelectItem key={h} value={String(h)}>{h} m</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Romhøyde / takhøyde</p>
                </div>

                <div className="space-y-2">
                  <Label>Røykfri sone h (m)</Label>
                  <Select value={selectedh} onValueChange={setSelectedh} disabled={!selectedH}>
                    <SelectTrigger><SelectValue placeholder="Velg røykfri sone" /></SelectTrigger>
                    <SelectContent>
                      {hVerdier.map((hv) => (
                        <SelectItem key={hv} value={String(hv)}>{hv} m</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Fri høyde under røyklaget</p>
                </div>

                <div className="space-y-2">
                  <Label>Brannareal A<sub>b</sub> (m²)</Label>
                  <Select value={selectedAb} onValueChange={setSelectedAb}>
                    <SelectTrigger><SelectValue placeholder="Velg brannareal" /></SelectTrigger>
                    <SelectContent>
                      {abKolonner.map((ab) => (
                        <SelectItem key={ab} value={String(ab)}>{ab} m²</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <p className="font-semibold">Verdi ikke tilgjengelig for denne kombinasjonen.</p>
                  ) : (
                    <div>
                      <p className="text-sm font-medium">Nødvendig åpningsareal A<sub>v</sub>:</p>
                      <p className="text-3xl font-bold mt-1">{resultat} m²</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        H = {selectedH} m, røykfri sone h = {selectedh} m, brannareal A<sub>b</sub> = {selectedAb} m²
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visuell tabell for valgt H */}
          {selectedH && currentRows.length > 0 && (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-base">Tabell for H = {selectedH} m</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-3 font-medium">h (m)</th>
                        {abKolonner.map((ab) => (
                          <th key={ab} className="text-right py-2 px-2 font-medium">
                            {ab}
                          </th>
                        ))}
                      </tr>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-1 pr-3 text-xs text-muted-foreground font-normal">Røykfri sone</th>
                        {abKolonner.map((ab) => (
                          <th key={ab} className="text-right py-1 px-2 text-xs text-muted-foreground font-normal">m²</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentRows.map((row) => (
                        <tr key={row.h} className={`border-b border-border/50 ${
                          String(row.h) === selectedh ? "bg-primary/10 font-medium" : ""
                        }`}>
                          <td className="py-2 pr-3">{row.h}</td>
                          {row.values.map((val, i) => {
                            const isSelected = String(row.h) === selectedh && String(abKolonner[i]) === selectedAb;
                            return (
                              <td key={i} className={`text-right py-2 px-2 ${
                                isSelected ? "bg-primary/20 font-bold rounded" : ""
                              }`}>
                                {val === null ? "—" : val}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Verdier: Nødvendig åpningsareal A<sub>v</sub> (m²). Kolonnene viser brannareal A<sub>b</sub> (m²).
                </p>
              </CardContent>
            </Card>
          )}

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
              <p className="font-medium text-foreground">
                Referanse: Melding HO-3/2000 — Røykventilasjon.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Brannareal-dialog */}
      <BrannArealDialog
        open={showBrannArealDialog}
        onOpenChange={setShowBrannArealDialog}
        onSelect={(ab) => setSelectedAb(String(ab))}
      />
    </div>
  );
};

export default Roykventilasjon;
