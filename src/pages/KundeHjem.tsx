import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ShieldAlert, FolderOpen } from "lucide-react";
import { useTilgjengeligeProsjekter, type Prosjekttilgang } from "@/hooks/useTilgjengeligeProsjekter";
import NyRosAnalyseDialog from "@/components/kunde/NyRosAnalyseDialog";

const formatDato = (iso: string) =>
  new Date(iso).toLocaleDateString("nb-NO", { day: "2-digit", month: "short", year: "numeric" });

const ProsjektKort = ({ p }: { p: Prosjekttilgang }) => (
  <Link to={`/prosjekt/${p.id}`} className="block group">
    <Card className="shadow-soft hover:shadow-medium transition-all h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base line-clamp-2">{p.name}</CardTitle>
          {p.kategori === "personlig" ? (
            <Badge variant="secondary">Personlig</Badge>
          ) : (
            <Badge variant="outline">Delt</Badge>
          )}
        </div>
        <CardDescription>
          {p.kategori === "delt" && p.engineerNavn
            ? `Delt av ${p.engineerNavn}`
            : `Opprettet ${formatDato(p.created_at)}`}
        </CardDescription>
      </CardHeader>
    </Card>
  </Link>
);

const KundeHjem = () => {
  const { prosjekter, loading } = useTilgjengeligeProsjekter();
  const [nyRosOpen, setNyRosOpen] = useState(false);

  const personlige = prosjekter.filter((p) => p.kategori === "personlig");
  const delte = prosjekter.filter((p) => p.kategori === "delt");

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Hjem</h1>
              <p className="text-muted-foreground mt-1">
                Opprett ROS-analyser og se prosjekter delt med deg av din branningeniør.
              </p>
            </div>
            <Button size="lg" onClick={() => setNyRosOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ny ROS-analyse
            </Button>
          </div>

          {/* Mine prosjekter */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Mine prosjekter</h2>
            </div>
            {loading ? (
              <p className="text-sm text-muted-foreground">Laster…</p>
            ) : personlige.length === 0 ? (
              <p className="text-sm italic text-muted-foreground">
                Du har ikke opprettet egne prosjekter ennå.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {personlige.map((p) => <ProsjektKort key={p.id} p={p} />)}
              </div>
            )}
          </section>

          {/* Delt med meg */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Delt med meg</h2>
            </div>
            {loading ? (
              <p className="text-sm text-muted-foreground">Laster…</p>
            ) : delte.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  Ingen prosjekter er delt med deg ennå. Når en branningeniør deler et prosjekt med
                  din e-postadresse vil det dukke opp her.
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {delte.map((p) => <ProsjektKort key={p.id} p={p} />)}
              </div>
            )}
          </section>
        </div>
      </section>

      <NyRosAnalyseDialog open={nyRosOpen} onOpenChange={setNyRosOpen} />
    </div>
  );
};

export default KundeHjem;
