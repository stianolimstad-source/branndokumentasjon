import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Info, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { STOFF_KATALOG, VaeskeKategori } from "@/lib/brensellagring-krav";

type FilterKey = "alle" | "alle_vaesker" | "alle_gasser" | VaeskeKategori;

const FILTRE: { key: FilterKey; label: string }[] = [
  { key: "alle", label: "Alle" },
  { key: "alle_vaesker", label: "Alle væsker" },
  { key: "alle_gasser", label: "Alle gasser" },
  { key: "kat1", label: "Væske – Kat. 1" },
  { key: "kat2", label: "Væske – Kat. 2" },
  { key: "kat3", label: "Væske – Kat. 3" },
  { key: "diesel_fyringsolje", label: "Diesel / fyringsolje" },
  { key: "gass_kat1", label: "Gass – Kat. 1" },
  { key: "gass_kat2", label: "Gass – Kat. 2" },
];

const kategoriBadge = (k: VaeskeKategori): string => {
  switch (k) {
    case "kat1": return "Væske Kat. 1";
    case "kat2": return "Væske Kat. 2";
    case "kat3": return "Væske Kat. 3";
    case "diesel_fyringsolje": return "Diesel/fyr.olje";
    case "gass_kat1": return "Gass Kat. 1";
    case "gass_kat2": return "Gass Kat. 2";
  }
};

const BrannfarligeStoffer = () => {
  const [filter, setFilter] = useState<FilterKey>("alle");
  const [query, setQuery] = useState("");

  const stoffer = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STOFF_KATALOG.filter((s) => {
      // Kategori-filter
      if (filter === "alle_vaesker" && s.tilstand !== "væske") return false;
      if (filter === "alle_gasser" && s.tilstand !== "gass") return false;
      if (
        filter !== "alle" &&
        filter !== "alle_vaesker" &&
        filter !== "alle_gasser" &&
        s.kategori !== filter
      )
        return false;
      // Søk
      if (!q) return true;
      return (
        s.navn.toLowerCase().includes(q) ||
        s.eksempler.toLowerCase().includes(q) ||
        s.kategoriNavn.toLowerCase().includes(q)
      );
    });
  }, [filter, query]);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link to="/eksempelkatalog">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Tilbake til eksempelkatalog
            </Link>
          </Button>

          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10 shrink-0">
              <FlaskConical className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-1">Brannfarlige stoffer</h2>
              <p className="text-muted-foreground max-w-3xl">
                Oppslagsverk over vanlige brannfarlige væsker og gasser med tekniske data
                (flammepunkt, densitet, brennverdi, eksplosjonsgrenser m.m.) iht. GHS/CLP og
                DSB Temaveiledning om oppbevaring av farlig stoff.
              </p>
            </div>
          </div>

          {/* Kategori-info */}
          <Card className="shadow-soft border-l-4 border-l-primary">
            <CardContent className="py-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm space-y-1.5">
                  <p className="font-medium">Kategorier iht. GHS/CLP og DSB:</p>
                  <p><strong>Væske kat. 1:</strong> Flammepunkt &lt; 23 °C og startkokepunkt ≤ 35 °C (f.eks. bensin, pentan)</p>
                  <p><strong>Væske kat. 2:</strong> Flammepunkt &lt; 23 °C og startkokepunkt &gt; 35 °C (f.eks. aceton, toluen)</p>
                  <p><strong>Væske kat. 3:</strong> Flammepunkt ≥ 23 °C og ≤ 60 °C (f.eks. parafin, white spirit)</p>
                  <p><strong>Diesel/fyringsoljer:</strong> Flammepunkt &gt; 60 °C</p>
                  <p><strong>Gass kat. 1:</strong> LEL ≤ 13 % eller eksplosjonsområde ≥ 12 prosentpoeng (f.eks. propan, hydrogen)</p>
                  <p><strong>Gass kat. 2:</strong> Eksplosjonsområde i luft, men ikke kat. 1 (f.eks. ammoniakk)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filter + søk */}
          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filtrer og søk</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søk etter stoff (navn, kategori, bruksområde)…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {FILTRE.map((f) => (
                  <Button
                    key={f.key}
                    variant={filter === f.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(f.key)}
                    className="text-xs"
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Viser <span className="font-medium text-foreground">{stoffer.length}</span> av {STOFF_KATALOG.length} stoffer
              </p>
            </CardContent>
          </Card>

          {/* Tabell */}
          <Card className="shadow-soft">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stoff</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Flammepunkt</TableHead>
                      <TableHead>Densitet</TableHead>
                      <TableHead>Brennverdi</TableHead>
                      <TableHead>Eksp.grenser</TableHead>
                      <TableHead>Selvant.</TableHead>
                      <TableHead>Bruksområde</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stoffer.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.navn}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            {kategoriBadge(s.kategori)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{s.flammepunkt}</TableCell>
                        <TableCell className="text-sm">{s.densitet}</TableCell>
                        <TableCell className="text-sm">{s.nedreBrennverdi}</TableCell>
                        <TableCell className="text-sm">{s.eksplosjonsgrenser || "–"}</TableCell>
                        <TableCell className="text-sm">{s.selvantennelse || "–"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{s.eksempler}</TableCell>
                      </TableRow>
                    ))}
                    {stoffer.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          Ingen stoffer matcher søket. Prøv et annet søkeord eller filter.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground text-center">
            Kilder: DSB Temaveiledning om oppbevaring av farlig stoff (§ 4.1), GHS/CLP, GESTIS, NFPA, PubChem.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BrannfarligeStoffer;
