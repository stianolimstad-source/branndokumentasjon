import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Upload, Trash2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const MinProfil = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    company: "",
    title: "",
    phone: "",
    education: "",
  });
  const [themedGroups, setThemedGroups] = useState<{ id: string; name: string }[]>([]);
  const [defaultTemplateGroupId, setDefaultTemplateGroupId] = useState<string>("none");
  const [savingTemplate, setSavingTemplate] = useState(false);

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
      setLogoUrl((data as any).logo_url || null);
    } else {
      setProfile((p) => ({ ...p, email: user!.email || "" }));
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Ugyldig fil", description: "Velg en bildefil (PNG, JPG, SVG)", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const filePath = `${user.id}/logo-${Date.now()}.${ext}`;

    const { data: existingFiles } = await supabase.storage.from("company-logos").list(user.id);
    if (existingFiles?.length) {
      await supabase.storage.from("company-logos").remove(existingFiles.map((f) => `${user.id}/${f.name}`));
    }

    const { error: uploadError } = await supabase.storage
      .from("company-logos")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Feil", description: "Kunne ikke laste opp logo", variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("company-logos").getPublicUrl(filePath);
    const newUrl = `${urlData.publicUrl}?v=${Date.now()}`;

    await supabase.from("profiles").update({ logo_url: newUrl } as any).eq("id", user.id);
    setLogoUrl(newUrl);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploading(false);
    toast({ title: "Logo lastet opp", description: "Logoen vil vises i rapporter og dokumenter" });
  };

  const handleLogoRemove = async () => {
    if (!user) return;
    setUploading(true);

    // List and remove all files in user's folder
    const { data: files } = await supabase.storage.from("company-logos").list(user.id);
    if (files?.length) {
      await supabase.storage.from("company-logos").remove(files.map((f) => `${user.id}/${f.name}`));
    }

    await supabase.from("profiles").update({ logo_url: null } as any).eq("id", user.id);
    setLogoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploading(false);
    toast({ title: "Logo fjernet" });
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
      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <div className="mb-2">
          <h2 className="text-3xl font-bold">Min profil</h2>
          <p className="text-muted-foreground mt-1">Administrer din profilinformasjon og firmalogo</p>
        </div>
        {/* Logo section */}
        <Card>
          <CardHeader>
            <CardTitle>Firmalogo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Logoen vil vises på alle rapporter og dokumenter som genereres.
            </p>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <div className="flex items-center gap-4">
                  <div className="h-20 w-40 border rounded-md flex items-center justify-center bg-white p-2">
                    <img src={logoUrl} alt="Firmalogo" className="max-h-full max-w-full object-contain" />
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogoRemove} disabled={uploading}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Fjern
                  </Button>
                </div>
              ) : (
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Laster opp..." : "Last opp logo"}
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
          </CardContent>
        </Card>

        {/* Profile info */}
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
