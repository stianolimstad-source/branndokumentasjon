import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Info } from "lucide-react";

/**
 * Tabell 7-1: Brannbelastning → brannveksttid (tg)
 */
const belastningKategorier = [
  { label: "Under 50 MJ/m²", tg: 300, tgLabel: "300 s (5 min)", eksempler: "Kirke, idrettshall, kantine" },
  { label: "50–200 MJ/m²", tg: 225, tgLabel: "225 s (3,75 min)", eksempler: "Mekanisk verksted, teater, skole, kontor, bolig, garasje" },
  { label: "200–400 MJ/m²", tg: 150, tgLabel: "150 s (2,50 min)", eksempler: "Restaurant, klesbutikk" },
  { label: "Over 400 MJ/m²", tg: 75, tgLabel: "75–150 s (vurderes spesielt)", eksempler: "Trevarefabrikk, høylager" },
];

/**
 * Tabell 7-2: Brannareal (m²) over tid avhengig av brannveksttid (tg)
 * Rows: time in minutes, Cols: tg values (75, 150, 225, 300)
 */
const brannarealtabell: { tid: number; tidLabel: string; verdier: Record<number, number | null> }[] = [
  { tid: 3.0, tidLabel: "3,0 min", verdier: { 75: 12, 150: 3, 225: 1, 300: 1 } },
  { tid: 5.0, tidLabel: "5,0 min", verdier: { 75: 32, 150: 8, 225: 4, 300: 2 } },
  { tid: 7.5, tidLabel: "7,5 min", verdier: { 75: 72, 150: 18, 225: 8, 300: 5 } },
  { tid: 10.0, tidLabel: "10,0 min", verdier: { 75: null, 150: 32, 225: 14, 300: 8 } },
  { tid: 15.0, tidLabel: "15,0 min", verdier: { 75: null, 150: 72, 225: 32, 300: 18 } },
];

const Brannareal = () => {
  const [belastning, setBelastning] = useState<string>("");
  const [tid, setTid] = useState<string>("");

  const valgtKategori = belastningKategorier.find((b) => String(b.tg) === belastning);
  const valgtTid = brannarealtabell.find((r) => String(r.tid) === tid);
  const tgNum = belastning ? parseInt(belastning) : null;
  const resultat = valgtTid && tgNum ? valgtTid.verdier[tgNum] : undefined;

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

          {/* Kalkulator */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Finn brannareal</CardTitle>
              <CardDescription>
                Velg brannbelastning og tid for å slå opp brannareal fra tabellen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Spesifikk brannbelastning (MJ/m²)</Label>
                  <Select value={belastning} onValueChange={setBelastning}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg brannbelastning" />
                    </SelectTrigger>
                    <SelectContent>
                      {belastningKategorier.map((k) => (
                        <SelectItem key={k.tg} value={String(k.tg)}>
                          {k.label} → t<sub>g</sub> = {k.tgLabel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {valgtKategori && (
                    <p className="text-xs text-muted-foreground">
                      Eksempler: {valgtKategori.eksempler}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Tid etter brannstart</Label>
                  <Select value={tid} onValueChange={setTid}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg tid" />
                    </SelectTrigger>
                    <SelectContent>
                      {brannarealtabell.map((r) => (
                        <SelectItem key={r.tid} value={String(r.tid)}>
                          {r.tidLabel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Resultat */}
              {belastning && tid && (
                <div className={`p-4 rounded-lg ${
                  resultat === null || resultat === undefined
                    ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100"
                    : "bg-primary/10 text-foreground"
                }`}>
                  {resultat === null ? (
                    <div>
                      <p className="font-semibold">⚠ Må vurderes spesielt</p>
                      <p className="text-sm mt-1">
                        For høylager / meget rask brannvekst (t<sub>g</sub> = 75 s) er det ikke angitt brannareal
                        etter {valgtTid?.tidLabel}. Forholdene må vurderes spesielt.
                      </p>
                    </div>
                  ) : resultat !== undefined ? (
                    <div>
                      <p className="text-sm font-medium">Brannareal etter {valgtTid?.tidLabel}:</p>
                      <p className="text-3xl font-bold mt-1">{resultat} m²</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Med brannveksttid t<sub>g</sub> = {belastning} s ({valgtKategori?.label})
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabell 7-1 */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Tabell 7-1: Brannbelastning, brannveksttid og typiske lokaler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-medium">Brannbelastning (MJ/m²)</th>
                      <th className="text-left py-2 pr-4 font-medium">Brannveksttid t<sub>g</sub></th>
                      <th className="text-left py-2 font-medium">Eksempler på lokaler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {belastningKategorier.map((k) => (
                      <tr key={k.tg} className={`border-b border-border/50 ${String(k.tg) === belastning ? "bg-primary/10 font-medium" : ""}`}>
                        <td className="py-2 pr-4">{k.label}</td>
                        <td className="py-2 pr-4">{k.tgLabel}</td>
                        <td className="py-2 text-muted-foreground">{k.eksempler}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-xs text-muted-foreground space-y-1">
                <p>
                  Veksttid t<sub>g</sub> betyr at brannen avgir en effekt på 1 000 kW etter t<sub>g</sub> sekunder
                  (etter 450 s har branneffekten nådd 4 000 kW).
                </p>
                <p>
                  Betegnelsen «normal» dekker tilfeller hvor spesifikk brannbelastning ligger mellom 50 og 200 MJ/m².
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tabell 7-2 */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Tabell 7-2: Brannareal (m²) over tid avhengig av brannveksttid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-medium">Tid (min)</th>
                      <th className="text-right py-2 px-3 font-medium">t<sub>g</sub> = 75 s</th>
                      <th className="text-right py-2 px-3 font-medium">t<sub>g</sub> = 150 s</th>
                      <th className="text-right py-2 px-3 font-medium">t<sub>g</sub> = 225 s</th>
                      <th className="text-right py-2 px-3 font-medium">t<sub>g</sub> = 300 s</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brannarealtabell.map((r) => (
                      <tr
                        key={r.tid}
                        className={`border-b border-border/50 ${
                          String(r.tid) === tid && belastning ? "bg-primary/10 font-medium" : ""
                        }`}
                      >
                        <td className="py-2 pr-4">{r.tidLabel}</td>
                        {[75, 150, 225, 300].map((tg) => {
                          const isSelected = String(r.tid) === tid && String(tg) === belastning;
                          const val = r.verdier[tg];
                          return (
                            <td
                              key={tg}
                              className={`text-right py-2 px-3 ${
                                isSelected ? "bg-primary/20 font-bold rounded" : ""
                              }`}
                            >
                              {val === null ? "—" : `${val} m²`}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Forklaring */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Om brannveksttid og brannareal
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                Brannveksttid (t<sub>g</sub>) er tiden det tar for brannen å nå en effekt på 1 000 kW.
                Internasjonalt brukes fire kategorier: ultra rask (75 s), rask (150 s), normal (225 s) og langsom (300 s).
              </p>
              <p>
                For forhold i høylager skjer utviklingen ultra raskt (t<sub>g</sub> = 75 s). Forholdene må vurderes
                spesielt, derfor er det ikke angitt brannareal etter 7,5 minutter for denne kategorien.
              </p>
              <p>
                Langsom brannbelastning (t<sub>g</sub> = 600 s) vil kunne opptre i lokaler med moderat spesifikk
                brannbelastning (under 200 MJ/m²), men der materialene har utpreget brannhemmende egenskaper.
              </p>
              <p className="font-medium text-foreground">
                Referanse: Melding HO-3/2000 — Røykventilasjon, Kap. 7.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Brannareal;
