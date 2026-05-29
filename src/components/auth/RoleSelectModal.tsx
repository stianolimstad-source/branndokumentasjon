import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Briefcase, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
}

const RoleSelectModal = ({ open }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState<"engineer" | "customer" | null>(null);

  const handleSelect = async (role: "engineer" | "customer") => {
    if (!user || saving) return;
    setSaving(role);
    const { error } = await supabase
      .from("profiles")
      .update({ role } as any)
      .eq("id", user.id);
    if (error) {
      toast({ title: "Feil", description: "Kunne ikke lagre rolle. Prøv igjen.", variant: "destructive" });
      setSaving(null);
      return;
    }
    window.location.reload();
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-2xl [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">Velkommen til Branndokumentasjon.no</DialogTitle>
          <DialogDescription className="text-base pt-2">
            For å gi deg riktig opplevelse trenger vi å vite om du jobber som branningeniør eller om du er kunde av en branningeniør.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <button
            type="button"
            onClick={() => handleSelect("engineer")}
            disabled={saving !== null}
            className={cn(
              "group flex flex-col items-start gap-3 rounded-lg border-2 border-border bg-card p-6 text-left transition-all",
              "hover:border-primary hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Briefcase className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-lg text-foreground">
                {saving === "engineer" ? "Lagrer..." : "Jeg er branningeniør"}
              </div>
              <p className="text-sm text-muted-foreground">
                Full tilgang til alle verktøy, prosjekter og rapporter.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelect("customer")}
            disabled={saving !== null}
            className={cn(
              "group flex flex-col items-start gap-3 rounded-lg border-2 border-border bg-card p-6 text-left transition-all",
              "hover:border-primary hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <UserIcon className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-lg text-foreground">
                {saving === "customer" ? "Lagrer..." : "Jeg er kunde"}
              </div>
              <p className="text-sm text-muted-foreground">
                Se prosjekter delt med meg og bruk ROS-analyseverktøyet.
              </p>
            </div>
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Du kan endre dette senere i kontoinnstillinger.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default RoleSelectModal;
