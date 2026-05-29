import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTilgjengeligeProsjekter } from "@/hooks/useTilgjengeligeProsjekter";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rosId: string;
  currentProjectId: string;
  onMoved: (newProjectId: string) => void;
}

const FlyttRosDialog = ({ open, onOpenChange, rosId, currentProjectId, onMoved }: Props) => {
  const { toast } = useToast();
  const { prosjekter, loading } = useTilgjengeligeProsjekter(true);
  const [valgtId, setValgtId] = useState<string>("");
  const [flytter, setFlytter] = useState(false);

  const tilgjengelige = useMemo(
    () => prosjekter.filter((p) => p.id !== currentProjectId),
    [prosjekter, currentProjectId]
  );
  const personlige = tilgjengelige.filter((p) => p.kategori === "personlig");
  const delte = tilgjengelige.filter((p) => p.kategori === "delt");
  const nåværende = prosjekter.find((p) => p.id === currentProjectId);
  const målProsjekt = tilgjengelige.find((p) => p.id === valgtId);

  const handleFlytt = async () => {
    if (!valgtId) {
      toast({ title: "Velg et mål-prosjekt", variant: "destructive" });
      return;
    }
    setFlytter(true);
    const { error } = await supabase
      .from("ros_analyses")
      .update({ project_id: valgtId })
      .eq("id", rosId);
    setFlytter(false);
    if (error) {
      toast({ title: "Kunne ikke flytte ROS-analysen", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Flyttet", description: "ROS-analysen er flyttet til nytt prosjekt" });
    onMoved(valgtId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Flytt ROS-analyse</DialogTitle>
          <DialogDescription>
            Velg hvilket prosjekt analysen skal flyttes til.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="text-sm text-muted-foreground">
            Nåværende prosjekt: <span className="font-medium text-foreground">{nåværende?.name || "—"}</span>
          </div>
          <div className="space-y-2">
            <Label>Mål-prosjekt</Label>
            <Select value={valgtId} onValueChange={setValgtId}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Laster prosjekter…" : "Velg prosjekt"} />
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

          {målProsjekt?.kategori === "delt" && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              Når du flytter ROS-en til dette prosjektet vil branningeniør{" "}
              <span className="font-medium">{målProsjekt.engineerNavn}</span> også få tilgang til den.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={handleFlytt} disabled={flytter || !valgtId}>
            {flytter ? "Flytter…" : "Flytt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FlyttRosDialog;
