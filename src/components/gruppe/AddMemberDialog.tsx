import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  existingUserIds: string[];
  onMemberAdded: () => void;
}

const AddMemberDialog = ({ open, onOpenChange, groupId, existingUserIds, onMemberAdded }: AddMemberDialogProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!email.trim()) return;
    setLoading(true);

    // Secure server-side lookup (returns only id/full_name/email for the matching email)
    const { data: lookupRows, error: profileError } = await supabase
      .rpc("lookup_profile_by_email", { _email: email.trim() });

    if (profileError) {
      toast.error("Feil ved oppslag av bruker");
      setLoading(false);
      return;
    }

    const profile = Array.isArray(lookupRows) ? lookupRows[0] : null;

    if (!profile) {
      toast.error("Ingen bruker funnet med denne e-postadressen. Brukeren må ha en konto først.");
      setLoading(false);
      return;
    }

    if (existingUserIds.includes(profile.id)) {
      toast.error("Brukeren er allerede medlem av gruppen.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("group_members")
      .insert({ group_id: groupId, user_id: profile.id, role: "member" });

    if (insertError) {
      toast.error("Kunne ikke legge til medlem: " + insertError.message);
      setLoading(false);
      return;
    }

    toast.success(`${profile.full_name || profile.email} ble lagt til i gruppen.`);
    setEmail("");
    setLoading(false);
    onOpenChange(false);
    onMemberAdded();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Legg til medlem
          </DialogTitle>
          <DialogDescription>
            Skriv inn e-postadressen til brukeren du vil legge til i gruppen.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="member-email">E-postadresse</Label>
            <Input
              id="member-email"
              type="email"
              placeholder="navn@eksempel.no"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleAdd} disabled={loading || !email.trim()}>
            {loading ? "Legger til..." : "Legg til"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddMemberDialog;
