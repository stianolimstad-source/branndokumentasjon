import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FolderOpen, ClipboardCheck, FileText, TrendingUp, ArrowLeft, Plus, ExternalLink } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalProjects: 0, totalConcepts: 0, pendingTasks: 0, completedTasks: 0 });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }

    const fetchAll = async () => {
      setLoading(true);
      const [projRes, concRes, rosRes, taskRes, compRes] = await Promise.all([
        supabase.from("projects").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(20),
        supabase.from("fire_concepts").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(20),
        supabase.from("ros_analyses").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(20),
        supabase.from("tasks").select("*").eq("assigned_to", user.id).order("created_at", { ascending: false }).limit(20),
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("assigned_to", user.id).eq("status", "completed"),
      ]);

      setProjects(projRes.data ?? []);
      const merged = [
        ...((concRes.data ?? []) as any[]).map((c) => ({ ...c, _kind: c.name?.startsWith("Brensellagring") ? "brensel" : c.name?.toLowerCase?.().includes("tilstand") ? "tilstand" : "konsept" })),
        ...((rosRes.data ?? []) as any[]).map((r) => ({ ...r, _kind: "ros" })),
      ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      setConcepts(merged);
      setTasks(taskRes.data ?? []);

      const pending = (taskRes.data ?? []).filter((t: any) => t.status !== "completed");
      setStats({
        totalProjects: projRes.data?.length ?? 0,
        totalConcepts: (concRes.data?.length ?? 0) + (rosRes.data?.length ?? 0),
        pendingTasks: pending.length,
        completedTasks: compRes.count ?? 0,
      });
      setLoading(false);
    };
    fetchAll();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-lg" />)}
            </div>
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  const priorityLabel = (p: string) => p === "high" ? "Høy" : p === "normal" ? "Normal" : "Lav";
  const statusLabel = (s: string) => {
    if (s === "pending") return "Venter";
    if (s === "in_progress") return "Pågår";
    if (s === "completed") return "Fullført";
    return s;
  };
  const statusVariant = (s: string) => {
    if (s === "completed") return "default";
    if (s === "in_progress") return "secondary";
    return "outline";
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <h2 className="text-3xl font-bold">Dashboard</h2>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.totalProjects}</p>
                <p className="text-sm text-muted-foreground">Prosjekter</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.totalConcepts}</p>
                <p className="text-sm text-muted-foreground">Konsepter</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
                <ClipboardCheck className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.pendingTasks}</p>
                <p className="text-sm text-muted-foreground">Ventende oppgaver</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.completedTasks}</p>
                <p className="text-sm text-muted-foreground">Fullførte oppgaver</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Mine prosjekter</CardTitle>
                <CardDescription>Oversikt over alle dine prosjekter</CardDescription>
              </div>
              <Button size="sm" onClick={() => navigate("/mine-prosjekter")}>
                <Plus className="h-4 w-4 mr-1" /> Nytt prosjekt
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Ingen prosjekter ennå. Opprett ditt første prosjekt for å komme i gang.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Navn</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Sist oppdatert</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">{p.address || "–"}</TableCell>
                      <TableCell className="text-muted-foreground">{format(new Date(p.updated_at), "d. MMM yyyy", { locale: nb })}</TableCell>
                      <TableCell>
                        <Link to={`/prosjekt/${p.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Concepts & Tasks side by side */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Siste konsepter</CardTitle>
              <CardDescription>Dine nylig oppdaterte brannkonsepter</CardDescription>
            </CardHeader>
            <CardContent>
              {concepts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Ingen konsepter ennå</p>
              ) : (
                <ul className="space-y-3">
                  {concepts.slice(0, 10).map((c) => (
                    <li key={c.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(c.updated_at), "d. MMM yyyy", { locale: nb })}</p>
                      </div>
                      <Badge variant={c.status === "draft" ? "secondary" : "default"} className="text-xs">
                        {c.status === "draft" ? "Utkast" : c.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Oppgaver</CardTitle>
                  <CardDescription>Oppgaver tildelt deg</CardDescription>
                </div>
                <Link to="/mine-oppgaver">
                  <Button variant="ghost" size="sm" className="text-xs">Se alle</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Ingen oppgaver</p>
              ) : (
                <ul className="space-y-3">
                  {tasks.slice(0, 10).map((t) => (
                    <li key={t.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{t.title}</p>
                        {t.due_date && (
                          <p className="text-xs text-muted-foreground">Frist: {format(new Date(t.due_date), "d. MMM yyyy", { locale: nb })}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusVariant(t.status) as any} className="text-xs">{statusLabel(t.status)}</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
