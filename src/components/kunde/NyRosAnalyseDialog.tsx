import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTilgjengeligeProsjekter } from "@/hooks/useTilgjengeligeProsjekter";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NyRosAnalyseDialog = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { prosjekter, loading } = useTilgjengeligeProsjekter(true);

  const [rosNavn, setRosNavn] = useState("");
  const [valgtProsjektId, setValgtProsjektId] = useState<string>("");
  const [nyttProsjektNavn, setNyttProsjektNavn] = useState("Min ROS-analyse");
  const [submitting, setSubmitting] = useState(false);

  const personlige = prosjekter.filter((p) => p.kategori === "personlig");
  const delte = prosjekter.filter((p) => p.kategori === "delt");
  const ingenProsjekter = !loading && prosjekter.length === 0;

  useEffect(() => {
    if (!open) {
      setRosNavn("");
      setValgtProsjektId("");
      setNyttProsjektNavn("Min ROS-analyse");
    }
  }, [open]);

  const handleOpprett = async () => {
    if (!user) return;
    if (!rosNavn.trim()) {
      toast({ title: "Mangler navn", description: "Skriv inn et navn på ROS-analysen", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    let projectId = valgtProsjektId;

    if (ingenProsjekter) {
      if (!nyttProsjektNavn.trim()) {
        toast({ title: "Mangler prosjektnavn", variant: "destructive" });
        setSubmitting(false);
        return;
      }
      const { data: nyttProsjekt, error: pErr } = await supabase
        .from("projects")
        .insert({
          name: nyttProsjektNavn.trim(),
          user_id: user.id,
          created_by_role: "customer",
        } as any)
        .select("id")
        .single();
      if (pErr || !nyttProsjekt) {
        toast({ title: "Kunne ikke opprette prosjekt", description: pErr?.message, variant: "destructive" });
        setSubmitting(false);
        return;
      }
      projectId = nyttProsjekt.id;
    }

    if (!projectId) {
      toast({ title: "Velg prosjekt", description: "Velg hvilket prosjekt ROS-analysen skal ligge i", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    const { data: nyRos, error: rErr } = await supabase
      .from("ros_analyses")
      .insert({
        name: rosNavn.trim(),
        project_id: projectId,
        user_id: user.id,
        created_by: user.id,
        content: {} as any,
      } as any)
      .select("id")
      .single();

    if (rErr || !nyRos) {
      toast({ title: "Kunne ikke opprette ROS-analyse", description: rErr?.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    onOpenChange(false);
    navigate(`/ros-analyse?id=${nyRos.id}`);
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Opprett ny ROS-analyse</DialogTitle>
          <DialogDescription>Gi analysen et navn og velg hvilket prosjekt den skal ligge i.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="ros-navn">Navn på ROS-analysen</Label>
            <Input
              id="ros-navn"
              placeholder="f.eks. ROS for vårt anlegg"
              value={rosNavn}
              onChange={(e) => setRosNavn(e.target.value)}
            />
          </div>

          {ingenProsjekter ? (
            <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
              <p className="text-sm text-muted-foreground">
                Du har ingen prosjekter ennå. Vi oppretter et prosjekt for deg automatisk.
              </p>
              <Label htmlFor="prosjekt-navn">Prosjektnavn</Label>
              <Input
                id="prosjekt-navn"
                value={nyttProsjektNavn}
                onChange={(e) => setNyttProsjektNavn(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Hvilket prosjekt skal den ligge i?</Label>
              <Select value={valgtProsjektId} onValueChange={setValgtProsjektId}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg prosjekt" />
                </SelectTrigger>
                <SelectContent>
                  {personlige.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Mine prosjekter</SelectLabel>
                      {personlige.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {delte.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Delt med meg</SelectLabel>
                      {delte.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} {p.engineerNavn ? `– ${p.engineerNavn}` : ""}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={handleOpprett} disabled={submitting || loading}>
            {submitting ? "Oppretter…" : "Opprett"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NyRosAnalyseDialog;
