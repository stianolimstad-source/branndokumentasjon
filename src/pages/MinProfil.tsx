import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Flame } from "lucide-react";

const MinProfil = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    company: "",
    title: "",
    phone: "",
    education: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      fetchProfile();
    }
  }, [user, loading]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user!.id)
      .single();

    if (data) {
      setProfile({
        full_name: data.full_name || "",
        email: data.email || user!.email || "",
        company: data.company || "",
        title: (data as any).title || "",
        phone: (data as any).phone || "",
        education: (data as any).education || "",
      });
    } else {
      setProfile((p) => ({ ...p, email: user!.email || "" }));
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: profile.full_name,
        email: profile.email,
        company: profile.company,
        title: profile.title,
        phone: profile.phone,
        education: profile.education,
        updated_at: new Date().toISOString(),
      } as any);

    setSaving(false);
    if (error) {
      toast({ title: "Feil", description: "Kunne ikke lagre profil", variant: "destructive" });
    } else {
      toast({ title: "Lagret", description: "Profilen din er oppdatert" });
    }
  };

  const update = (key: string, value: string) => setProfile((p) => ({ ...p, [key]: value }));

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link to="/">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                  <Flame className="h-6 w-6 text-primary-foreground" />
                </div>
              </Link>
              <h1 className="text-xl font-bold">Min profil</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link to="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Tilbake
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Personlig informasjon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Fullt navn</Label>
                <Input id="full_name" value={profile.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Ola Nordmann" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-post</Label>
                <Input id="email" value={profile.email} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" value={profile.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+47 123 45 678" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Stillingstittel</Label>
                <Input id="title" value={profile.title} onChange={(e) => update("title", e.target.value)} placeholder="Brannrådgiver" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Firma</Label>
              <Input id="company" value={profile.company} onChange={(e) => update("company", e.target.value)} placeholder="Firmanavn AS" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="education">Utdannelse</Label>
              <Textarea id="education" value={profile.education} onChange={(e) => update("education", e.target.value)} placeholder="F.eks. M.Sc. Brannteknikk, NTNU" rows={3} />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Lagrer..." : "Lagre profil"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MinProfil;
