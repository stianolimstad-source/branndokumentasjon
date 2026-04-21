import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, ClipboardCheck, FileText, ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DashboardStats {
  totalProjects: number;
  totalConcepts: number;
  pendingTasks: number;
  completedTasks: number;
  recentProjects: { id: string; name: string; updated_at: string }[];
  recentConcepts: { id: string; name: string; project_id: string; status: string; updated_at: string }[];
  pendingTasksList: { id: string; title: string; status: string; priority: string; due_date: string | null }[];
}

const DashboardPanel = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      setLoading(true);
      const [projectsRes, conceptsRes, pendingTasksRes, completedTasksRes] = await Promise.all([
        supabase.from("projects").select("id, name, updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(5),
        supabase.from("fire_concepts").select("id, name, project_id, status, updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(5),
        supabase.from("tasks").select("id, title, status, priority, due_date").eq("assigned_to", user.id).in("status", ["pending", "in_progress"]).order("created_at", { ascending: false }).limit(5),
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("assigned_to", user.id).eq("status", "completed"),
      ]);

      const totalProjectsRes = await supabase.from("projects").select("id", { count: "exact", head: true }).eq("user_id", user.id);
      const totalConceptsRes = await supabase.from("fire_concepts").select("id", { count: "exact", head: true }).eq("user_id", user.id);

      setStats({
        totalProjects: totalProjectsRes.count ?? 0,
        totalConcepts: totalConceptsRes.count ?? 0,
        pendingTasks: pendingTasksRes.data?.length ?? 0,
        completedTasks: completedTasksRes.count ?? 0,
        recentProjects: (projectsRes.data ?? []) as any,
        recentConcepts: (conceptsRes.data ?? []) as any,
        pendingTasksList: (pendingTasksRes.data ?? []) as any,
      });
      setLoading(false);
    };
    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6"><div className="h-12 bg-muted rounded" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const priorityColor = (p: string) => {
    if (p === "high") return "destructive";
    if (p === "normal") return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-6">
      {/* Quick lists */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Recent projects */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Siste prosjekter</CardTitle>
              <Link to="/mine-prosjekter">
                <Button variant="ghost" size="sm" className="text-xs h-7">
                  Se alle <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {stats.recentProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ingen prosjekter ennå</p>
            ) : (
              <ul className="space-y-2">
                {stats.recentProjects.slice(0, 3).map((p) => (
                  <li key={p.id}>
                    <Link to={`/prosjekt/${p.id}`} className="text-sm hover:text-primary transition-colors line-clamp-1">
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent concepts */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Siste dokumenter</CardTitle>
              <Link to="/mine-prosjekter">
                <Button variant="ghost" size="sm" className="text-xs h-7">
                  Se alle <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {stats.recentConcepts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ingen konsepter ennå</p>
            ) : (
              <ul className="space-y-2">
                {stats.recentConcepts.slice(0, 3).map((c) => {
                  const isBrensel = c.name?.startsWith("Brensellagring");
                  const href = isBrensel
                    ? `/brensellagring?project=${c.project_id}&doc=${c.id}`
                    : `/konsept?project=${c.project_id}&concept=${c.id}`;
                  return (
                  <li key={c.id} className="flex items-center justify-between gap-2">
                    <Link to={href} className="text-sm hover:text-primary transition-colors line-clamp-1">
                      {c.name}
                    </Link>
                    <Badge variant={c.status === "draft" ? "secondary" : "default"} className="text-[10px] shrink-0">
                      {c.status === "draft" ? "Utkast" : c.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Pending tasks */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Ventende oppgaver</CardTitle>
              <Link to="/mine-oppgaver">
                <Button variant="ghost" size="sm" className="text-xs h-7">
                  Se alle <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {stats.pendingTasksList.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ingen ventende oppgaver</p>
            ) : (
              <ul className="space-y-2">
                {stats.pendingTasksList.slice(0, 3).map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2">
                    <Link to="/mine-oppgaver" className="text-sm hover:text-primary transition-colors line-clamp-1">
                      {t.title}
                    </Link>
                    <Badge variant={priorityColor(t.priority) as any} className="text-[10px] shrink-0">
                      {t.priority === "high" ? "Høy" : t.priority === "normal" ? "Normal" : "Lav"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPanel;
