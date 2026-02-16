import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Shield, User, FolderOpen } from "lucide-react";
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

const GruppeDetalj = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState<string | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, MemberProfile>>({});
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

    const [groupRes, membersRes] = await Promise.all([
      supabase.from("contact_groups").select("*").eq("id", id!).single(),
      supabase.from("group_members").select("*").eq("group_id", id!),
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
            <Card className="shadow-soft">
              <CardContent className="py-8 text-center text-muted-foreground">
                Ingen delte prosjekter eller dokumenter ennå.
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GruppeDetalj;
