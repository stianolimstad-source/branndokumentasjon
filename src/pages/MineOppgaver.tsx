import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import { CheckCircle, Clock, AlertCircle, User, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_by: string;
  assigned_to: string;
  group_id: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }> = {
  pending: { label: "Ventende", variant: "secondary", icon: Clock },
  in_progress: { label: "Pågår", variant: "default", icon: AlertCircle },
  completed: { label: "Fullført", variant: "outline", icon: CheckCircle },
};

const priorityConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  low: { label: "Lav", variant: "outline" },
  normal: { label: "Normal", variant: "secondary" },
  high: { label: "Høy", variant: "destructive" },
};

const MineOppgaver = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"assigned" | "created">("assigned");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchTasks();
  }, [user, filter]);

  const fetchTasks = async () => {
    if (!user) return;
    setLoading(true);

    const query = supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter === "assigned") {
      query.eq("assigned_to", user.id);
    } else {
      query.eq("assigned_by", user.id);
    }

    const { data, error } = await query;
    if (error) {
      toast({ title: "Feil", description: "Kunne ikke hente oppgaver", variant: "destructive" });
      setLoading(false);
      return;
    }

    setTasks(data || []);

    // Fetch profiles for assigned_by users
    const userIds = [...new Set((data || []).map((t) => (filter === "assigned" ? t.assigned_by : t.assigned_to)))];
    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);
      const map: Record<string, Profile> = {};
      (profileData || []).forEach((p) => (map[p.id] = p));
      setProfiles(map);
    }

    setLoading(false);
  };

  const updateStatus = async (taskId: string, newStatus: string) => {
    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", taskId);
    if (error) {
      toast({ title: "Feil", description: "Kunne ikke oppdatere status", variant: "destructive" });
      return;
    }
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) {
      toast({ title: "Feil", description: "Kunne ikke slette oppgaven", variant: "destructive" });
      return;
    }
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    toast({ title: "Slettet", description: "Oppgaven ble slettet" });
  };

  const getProfileName = (userId: string) => {
    const p = profiles[userId];
    return p?.full_name || p?.email || "Ukjent bruker";
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <PageHeader title="Mine oppgaver" />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === "assigned" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("assigned")}
          >
            Tildelt meg
          </Button>
          <Button
            variant={filter === "created" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("created")}
          >
            Opprettet av meg
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center py-12">Laster oppgaver…</p>
        ) : tasks.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {filter === "assigned"
                  ? "Du har ingen tildelte oppgaver."
                  : "Du har ikke opprettet noen oppgaver ennå."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const sc = statusConfig[task.status] || statusConfig.pending;
              const pc = priorityConfig[task.priority] || priorityConfig.normal;
              const StatusIcon = sc.icon;

              return (
                <Card
                  key={task.id}
                  className="shadow-soft cursor-pointer hover:shadow-medium transition-shadow"
                  onClick={() => {
                    // Extract project and concept IDs from description
                    const projMatch = task.description?.match(/Prosjekt-ID:\s*([^\s\n]+)/);
                    const concMatch = task.description?.match(/Konsept-ID:\s*([^\s\n]+)/);
                    if (projMatch && concMatch) {
                      navigate(`/ks-gjennomgang?task=${task.id}&concept=${concMatch[1]}&project=${projMatch[1]}`);
                    }
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <StatusIcon className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <CardTitle className="text-base">{task.title}</CardTitle>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {task.description.split("\n").find((l) => l.startsWith("Brannkonsept:")) || task.description.split("\n")[0]}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Badge variant={pc.variant}>{pc.label}</Badge>
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>
                          {filter === "assigned" ? "Fra: " : "Til: "}
                          {getProfileName(filter === "assigned" ? task.assigned_by : task.assigned_to)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {task.due_date && (
                          <span>Frist: {new Date(task.due_date).toLocaleDateString("nb-NO")}</span>
                        )}
                        {filter === "assigned" && task.status !== "completed" && (
                          <div className="flex gap-1 ml-2">
                            {task.status === "pending" && (
                              <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => updateStatus(task.id, "in_progress")}>
                                Start
                              </Button>
                            )}
                            <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => updateStatus(task.id, "completed")}>
                              Fullfør
                            </Button>
                          </div>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Slette oppgave?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Er du sikker på at du vil slette «{task.title}»? Dette kan ikke angres.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Avbryt</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteTask(task.id)}>Slett</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MineOppgaver;
