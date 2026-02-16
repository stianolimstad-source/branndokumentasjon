import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Shield, User, FolderOpen, Building, FileText, ChevronDown, ChevronRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
}

interface MemberProfile {
  email: string | null;
  full_name: string | null;
}

interface FireConcept {
  id: string;
  name: string;
  status: string;
}

interface SharedProject {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  shared_by_name: string | null;
  fire_concepts: FireConcept[];
}

const GruppeDetalj = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState<string | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, MemberProfile>>({});
  const [sharedProjects, setSharedProjects] = useState<SharedProject[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && id) {
      fetchGroupData();
    }
  }, [user, id]);

  const fetchGroupData = async () => {
    setLoading(true);

    const [groupRes, membersRes, sharesRes] = await Promise.all([
      supabase.from("contact_groups").select("*").eq("id", id!).single(),
      supabase.from("group_members").select("*").eq("group_id", id!),
      supabase.from("project_shares").select("id, project_id, shared_by").eq("group_id", id!),
    ]);

    if (groupRes.data) {
      setGroupName(groupRes.data.name);
      setGroupDescription(groupRes.data.description);
    }

    if (membersRes.data) {
      setMembers(membersRes.data);

      const userIds = membersRes.data.map((m) => m.user_id);
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", userIds);
        if (profiles) {
          const map: Record<string, MemberProfile> = {};
          profiles.forEach((p) => {
            map[p.id] = { email: p.email, full_name: p.full_name };
          });
          setMemberProfiles(map);
        }
      }
    }

    // Fetch shared projects
    if (sharesRes.data && sharesRes.data.length > 0) {
      const projectIds = sharesRes.data.map((s: any) => s.project_id);
      const sharedByIds = [...new Set(sharesRes.data.map((s: any) => s.shared_by))];

      const [projectsRes, sharedByProfilesRes, conceptsRes] = await Promise.all([
        supabase.from("projects").select("id, name, address, description").in("id", projectIds),
        supabase.from("profiles").select("id, full_name, email").in("id", sharedByIds),
        supabase.from("fire_concepts").select("id, name, status, project_id").in("project_id", projectIds),
      ]);

      const profileMap = new Map(
        (sharedByProfilesRes.data || []).map((p: any) => [p.id, p.full_name || p.email])
      );
      const shareByMap = new Map(
        sharesRes.data.map((s: any) => [s.project_id, s.shared_by])
      );

      const conceptsByProject = new Map<string, FireConcept[]>();
      (conceptsRes.data || []).forEach((c: any) => {
        const list = conceptsByProject.get(c.project_id) || [];
        list.push({ id: c.id, name: c.name, status: c.status });
        conceptsByProject.set(c.project_id, list);
      });

      setSharedProjects(
        (projectsRes.data || []).map((p: any) => ({
          ...p,
          shared_by_name: profileMap.get(shareByMap.get(p.id)) || null,
          fire_concepts: conceptsByProject.get(p.id) || [],
        }))
      );
    } else {
      setSharedProjects([]);
    }

    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Laster...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <PageHeader title={groupName} subtitle={groupDescription || undefined} />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Tabs defaultValue="medlemmer">
          <TabsList className="mb-6">
            <TabsTrigger value="medlemmer" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Medlemmer ({members.length})
            </TabsTrigger>
            <TabsTrigger value="delt" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Delte prosjekter og dokumenter
            </TabsTrigger>
          </TabsList>

          <TabsContent value="medlemmer">
            {members.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="py-8 text-center text-muted-foreground">
                  Ingen medlemmer ennå.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {members.map((member) => {
                  const profile = memberProfiles[member.user_id];
                  const isCurrentUser = member.user_id === user?.id;
                  return (
                    <Card key={member.id} className="shadow-soft">
                      <CardContent className="py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {profile?.full_name || profile?.email || "Ukjent bruker"}
                              {isCurrentUser && (
                                <span className="text-muted-foreground text-sm ml-2">(deg)</span>
                              )}
                            </p>
                            {profile?.email && (
                              <p className="text-sm text-muted-foreground">{profile.email}</p>
                            )}
                          </div>
                        </div>
                        {member.role === "admin" && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            Admin
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="delt">
            {sharedProjects.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="py-8 text-center text-muted-foreground">
                  Ingen delte prosjekter eller dokumenter ennå.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {sharedProjects.map((project) => {
                  const isExpanded = expandedProjects.has(project.id);
                  return (
                    <Card key={project.id} className="shadow-soft">
                      <CardContent className="py-4">
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => {
                            setExpandedProjects((prev) => {
                              const next = new Set(prev);
                              if (next.has(project.id)) next.delete(project.id);
                              else next.add(project.id);
                              return next;
                            });
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <Building className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{project.name}</p>
                              {project.address && (
                                <p className="text-sm text-muted-foreground">{project.address}</p>
                              )}
                              {project.shared_by_name && (
                                <p className="text-xs text-muted-foreground">Delt av {project.shared_by_name}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="text-xs">{project.fire_concepts.length} dokument{project.fire_concepts.length !== 1 ? "er" : ""}</span>
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="mt-4 ml-13 space-y-2 border-l-2 border-muted pl-4">
                            {project.fire_concepts.length === 0 ? (
                              <p className="text-sm text-muted-foreground">Ingen dokumenter i dette prosjektet.</p>
                            ) : (
                              project.fire_concepts.map((concept) => (
                                <Link
                                  key={concept.id}
                                  to={`/konsept?concept=${concept.id}&view=true`}
                                  className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                                >
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{concept.name}</span>
                                  <Badge variant="outline" className="text-xs ml-auto">
                                    {concept.status === "draft" ? "Utkast" : concept.status}
                                  </Badge>
                                </Link>
                              ))
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GruppeDetalj;
