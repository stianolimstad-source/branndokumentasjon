import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Shield, User, FolderOpen, Building, FileText, ChevronDown, ChevronRight, UserPlus, ArrowLeft, Upload, Trash2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

import AddMemberDialog from "@/components/gruppe/AddMemberDialog";
import MalvalgPanel from "@/components/gruppe/MalvalgPanel";
import { TemplateSettings } from "@/lib/document-templates";
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
  const [groupLogoUrl, setGroupLogoUrl] = useState<string | null>(null);
  const [templateSettings, setTemplateSettings] = useState<TemplateSettings>({});
  const [profileLogoUrl, setProfileLogoUrl] = useState<string | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, MemberProfile>>({});
  const [sharedProjects, setSharedProjects] = useState<SharedProject[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = members.some((m) => m.user_id === user?.id && m.role === "admin");

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
      setGroupLogoUrl((groupRes.data as any).logo_url || null);
      setTemplateSettings(((groupRes.data as any).template_settings || {}) as TemplateSettings);
    }

    // Fetch user's own profile logo
    if (user) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("logo_url")
        .eq("id", user.id)
        .single();
      setProfileLogoUrl((profileData as any)?.logo_url || null);
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !id) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Velg en bildefil (PNG, JPG, SVG)");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `groups/${id}/logo.${ext}`;
    await supabase.storage.from("company-logos").remove([filePath]);
    const { error: uploadError } = await supabase.storage.from("company-logos").upload(filePath, file, { upsert: true });
    if (uploadError) {
      toast.error("Kunne ikke laste opp logo");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("company-logos").getPublicUrl(filePath);
    await supabase.from("contact_groups").update({ logo_url: urlData.publicUrl } as any).eq("id", id);
    setGroupLogoUrl(urlData.publicUrl);
    setUploading(false);
    toast.success("Logo lastet opp");
  };

  const handleUseProfileLogo = async () => {
    if (!profileLogoUrl || !id) return;
    await supabase.from("contact_groups").update({ logo_url: profileLogoUrl } as any).eq("id", id);
    setGroupLogoUrl(profileLogoUrl);
    toast.success("Profillogo brukt for gruppen");
  };

  const handleRemoveLogo = async () => {
    if (!id) return;
    setUploading(true);
    const { data: files } = await supabase.storage.from("company-logos").list(`groups/${id}`);
    if (files?.length) {
      await supabase.storage.from("company-logos").remove(files.map((f) => `groups/${id}/${f.name}`));
    }
    await supabase.from("contact_groups").update({ logo_url: null } as any).eq("id", id);
    setGroupLogoUrl(null);
    setUploading(false);
    toast.success("Logo fjernet");
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
      <div className="container mx-auto px-4 py-3">
        <Link to="/mine-kontakter">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til grupper
          </Button>
        </Link>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-4 mb-6">
          {groupLogoUrl && (
            <div className="h-14 w-14 rounded-lg border bg-white flex items-center justify-center p-1 shrink-0">
              <img src={groupLogoUrl} alt="Gruppelogo" className="max-h-full max-w-full object-contain" />
            </div>
          )}
          <div>
            <h2 className="text-3xl font-bold">{groupName}</h2>
            {groupDescription && <p className="text-muted-foreground mt-1">{groupDescription}</p>}
          </div>
        </div>

        <Tabs defaultValue="medlemmer">
          <TabsList className="mb-6">
            <TabsTrigger value="medlemmer" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Medlemmer ({members.length})
            </TabsTrigger>
            <TabsTrigger value="delt" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Delte prosjekter
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="innstillinger" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Logo
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="medlemmer">
            {isAdmin && (
              <div className="mb-4 flex justify-end">
                <Button onClick={() => setShowAddMember(true)} size="sm" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Legg til medlem
                </Button>
              </div>
            )}
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
                        <div className="flex items-center gap-2">
                          {member.role === "admin" && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              Admin
                            </Badge>
                          )}
                          {isCurrentUser && member.role !== "admin" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={async () => {
                                const { error } = await supabase
                                  .from("group_members")
                                  .delete()
                                  .eq("id", member.id);
                                if (error) {
                                  toast.error("Kunne ikke forlate gruppen");
                                } else {
                                  toast.success("Du har forlatt gruppen");
                                  navigate("/mine-kontakter");
                                }
                              }}
                            >
                              Forlat gruppe
                            </Button>
                          )}
                          {isAdmin && !isCurrentUser && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={async () => {
                                const { error } = await supabase
                                  .from("group_members")
                                  .delete()
                                  .eq("id", member.id);
                                if (error) {
                                  toast.error("Kunne ikke fjerne medlem");
                                } else {
                                  toast.success("Medlem fjernet");
                                  fetchGroupData();
                                }
                              }}
                            >
                              Fjern
                            </Button>
                          )}
                        </div>
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

          {isAdmin && (
            <TabsContent value="innstillinger">
              <Card className="shadow-soft">
                <CardContent className="py-6 space-y-4">
                  <h3 className="font-semibold">Gruppelogo</h3>
                  <p className="text-sm text-muted-foreground">
                    Logoen vises på gruppesiden og kan brukes i dokumenter.
                  </p>

                  {groupLogoUrl ? (
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-40 border rounded-md flex items-center justify-center bg-white p-2">
                        <img src={groupLogoUrl} alt="Gruppelogo" className="max-h-full max-w-full object-contain" />
                      </div>
                      <Button variant="outline" size="sm" onClick={handleRemoveLogo} disabled={uploading}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Fjern
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? "Laster opp..." : "Last opp logo"}
                      </Button>
                      {profileLogoUrl && (
                        <Button variant="outline" onClick={handleUseProfileLogo}>
                          <User className="h-4 w-4 mr-2" />
                          Bruk logo fra min profil
                        </Button>
                      )}
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </CardContent>
              </Card>

              <div className="mt-6">
                <MalvalgPanel
                  groupId={id!}
                  groupName={groupName}
                  logoUrl={groupLogoUrl}
                  initial={templateSettings}
                  onSaved={(s) => setTemplateSettings(s)}
                />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      <AddMemberDialog
        open={showAddMember}
        onOpenChange={setShowAddMember}
        groupId={id!}
        existingUserIds={members.map((m) => m.user_id)}
        onMemberAdded={fetchGroupData}
      />
    </div>
  );
};

export default GruppeDetalj;
