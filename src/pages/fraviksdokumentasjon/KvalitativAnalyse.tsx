import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileWarning, Plus, Trash2, Download, Save, ArrowLeft } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import KvalitativPreview from "@/components/fraviksdokumentasjon/KvalitativPreview";
import FravikEntryForm, { FravikEntry, emptyFravik } from "@/components/fraviksdokumentasjon/FravikEntryForm";
import { exportKvalitativWord } from "@/lib/kvalitativ-word-export";

const KvalitativAnalyse = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("project");
  const conceptId = searchParams.get("concept");

  const [dokumentNavn, setDokumentNavn] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedConceptId, setSavedConceptId] = useState<string | null>(conceptId);
  const [fravikEntries, setFravikEntries] = useState<FravikEntry[]>([emptyFravik()]);
  const [activeFravikIndex, setActiveFravikIndex] = useState(0);

  // Load existing concept
  useEffect(() => {
    if (conceptId && user) loadConcept(conceptId);
  }, [conceptId, user]);

  const loadConcept = async (id: string) => {
    const { data, error } = await supabase
      .from("fire_concepts")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return;

    setDokumentNavn(data.name);
    const c = data.content as any;
    if (c) {
      // Support both old single-fravik format and new multi-fravik format
      if (c.fravikEntries && Array.isArray(c.fravikEntries)) {
        setFravikEntries(c.fravikEntries);
      } else {
        // Migrate old format to new
        setFravikEntries([{
          id: crypto.randomUUID(),
          funksjonskrav: c.funksjonskrav || "",
          preakseptertYtelse: c.preakseptertYtelse || "",
          hensiktYtelse: c.hensiktYtelse || "",
          fravikBeskrivelse: c.fravikBeskrivelse || "",
          tiltak: c.tiltak || [{ id: crypto.randomUUID(), beskrivelse: "", funksjonalitet: "", palitelighet: "", robusthet: "", vedlikehold: "", andreEffekter: "" }],
          fraviketOmrader: c.fraviketOmrader || [],
          tiltakOmrader: c.tiltakOmrader || [],
          sammenligning: c.sammenligning || "",
          maleparametre: c.maleparametre || "",
          visReferanser: c.visReferanser !== false,
          referanser: c.referanser || "",
          konklusjon: c.konklusjon || "",
          begrunnelseKonklusjon: c.begrunnelseKonklusjon || "",
        }]);
      }
    }
  };

  const handleSave = async () => {
    if (!user || !projectId) return;
    if (!dokumentNavn.trim()) {
      toast({ title: "Mangler navn", description: "Gi dokumentet et navn før du lagrer", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const content = JSON.parse(JSON.stringify({ fravikEntries, type: "kvalitativ" }));

    if (savedConceptId) {
      const { error } = await supabase.from("fire_concepts").update({ name: dokumentNavn, content, status: "draft" }).eq("id", savedConceptId);
      if (error) toast({ title: "Feil", description: "Kunne ikke oppdatere", variant: "destructive" });
      else toast({ title: "Lagret", description: "Dokumentet er oppdatert" });
    } else {
      const { data, error } = await supabase.from("fire_concepts").insert([{ project_id: projectId, user_id: user.id, name: dokumentNavn, content, status: "draft" }]).select().single();
      if (error) toast({ title: "Feil", description: "Kunne ikke lagre", variant: "destructive" });
      else if (data) {
        setSavedConceptId(data.id);
        toast({ title: "Lagret", description: "Dokumentet er lagret" });
        navigate(`/fraviksdokumentasjon/kvalitativ?project=${projectId}&concept=${data.id}`, { replace: true });
      }
    }
    setIsSaving(false);
  };

  const addFravik = () => {
    setFravikEntries(prev => [...prev, emptyFravik()]);
    setActiveFravikIndex(fravikEntries.length);
  };

  const removeFravik = (index: number) => {
    if (fravikEntries.length <= 1) return;
    setFravikEntries(prev => prev.filter((_, i) => i !== index));
    setActiveFravikIndex(prev => Math.min(prev, fravikEntries.length - 2));
  };

  const updateFravik = (index: number, updated: FravikEntry) => {
    setFravikEntries(prev => prev.map((f, i) => i === index ? updated : f));
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to={projectId ? `/fraviksdokumentasjon?project=${projectId}` : "/fraviksdokumentasjon"}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Tilbake
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                  <FileWarning className="h-6 w-6 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold">Kvalitativ analyse</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full px-4 py-6">
        <div className="max-w-[1800px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-6 lg:h-[calc(100vh-200px)]">

            {/* Input Form */}
            <Card className="shadow-medium flex flex-col overflow-hidden">
              <CardHeader className="flex-shrink-0">
                <CardTitle>Inndata</CardTitle>
                <CardDescription>Fyll ut feltene for å generere fraviksdokumentasjonen</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full px-6 pb-6">
                  <div className="space-y-6">
                    {/* Dokumentnavn */}
                    <div className="space-y-2">
                      <Label htmlFor="dokument-name" className="text-sm font-semibold">Navn på dokumentet *</Label>
                      <Input id="dokument-name" placeholder="f.eks. Fraviksdokumentasjon – Storgata 1" value={dokumentNavn} onChange={(e) => setDokumentNavn(e.target.value)} />
                    </div>

                    {/* Fravik tabs */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {fravikEntries.map((_, i) => (
                          <div key={fravikEntries[i].id} className="flex items-center">
                            <Button
                              variant={activeFravikIndex === i ? "default" : "outline"}
                              size="sm"
                              onClick={() => setActiveFravikIndex(i)}
                              className="rounded-r-none"
                            >
                              Fravik {i + 1}
                            </Button>
                            {fravikEntries.length > 1 && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant={activeFravikIndex === i ? "default" : "outline"}
                                    size="sm"
                                    className="rounded-l-none border-l-0 px-1.5"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Slette fravik {i + 1}?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Er du sikker på at du vil fjerne dette fraviket? Alle data i fraviket vil bli slettet.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => removeFravik(i)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Slett
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addFravik}>
                          <Plus className="h-3 w-3 mr-1" />
                          Legg til fravik
                        </Button>
                      </div>
                    </div>

                    {/* Active fravik form */}
                    {fravikEntries[activeFravikIndex] && (
                      <FravikEntryForm
                        key={fravikEntries[activeFravikIndex].id}
                        fravik={fravikEntries[activeFravikIndex]}
                        index={activeFravikIndex}
                        onChange={(updated) => updateFravik(activeFravikIndex, updated)}
                      />
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <div className="flex-shrink-0 border-t bg-background p-4">
                <Button className="w-full" onClick={handleSave} disabled={isSaving || !projectId || !dokumentNavn.trim()}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Lagrer..." : "Lagre"}
                </Button>
              </div>
            </Card>

            {/* Preview */}
            <Card className="shadow-medium flex flex-col overflow-hidden lg:sticky lg:top-4">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Forhåndsvisning</CardTitle>
                    <CardDescription>Fraviksdokumentasjonen oppdateres i sanntid</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => exportKvalitativWord(fravikEntries, dokumentNavn)}>
                    <Download className="h-4 w-4 mr-2" />
                    Last ned Word
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full max-h-[calc(100vh-280px)]">
                  <div className="px-6 pb-6">
                    <KvalitativPreview fravikEntries={fravikEntries} />
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
};

export default KvalitativAnalyse;
