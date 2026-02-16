import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SendToKSDialogProps {
  conceptName: string;
  projectId: string | null;
  conceptId: string | null;
  conceptContent: Record<string, any>;
  disabled?: boolean;
}

interface GroupMember {
  user_id: string;
  profile_name: string;
  profile_email: string;
}

const SendToKSDialog = ({ conceptName, projectId, conceptId, conceptContent, disabled }: SendToKSDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (open) {
      fetchColleagues();
    }
  }, [open]);

  const fetchColleagues = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    // Get all group members from groups the user belongs to
    const { data: groupIds } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userData.user.id);

    if (!groupIds || groupIds.length === 0) {
      setMembers([]);
      return;
    }

    const ids = groupIds.map((g) => g.group_id);
    const { data: allMembers } = await supabase
      .from("group_members")
      .select("user_id")
      .in("group_id", ids)
      .neq("user_id", userData.user.id);

    if (!allMembers || allMembers.length === 0) {
      setMembers([]);
      return;
    }

    // Deduplicate user IDs
    const uniqueUserIds = [...new Set(allMembers.map((m) => m.user_id))];

    // Fetch profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", uniqueUserIds);

    const result: GroupMember[] = (profiles || []).map((p) => ({
      user_id: p.id,
      profile_name: p.full_name || "Ukjent",
      profile_email: p.email || "",
    }));

    setMembers(result);
  };

  const handleSend = async () => {
    if (!selectedUserId) return;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    setIsSending(true);

    const description = [
      `Brannkonsept: ${conceptName}`,
      message ? `\nMelding: ${message}` : "",
      projectId ? `\nProsjekt-ID: ${projectId}` : "",
      conceptId ? `\nKonsept-ID: ${conceptId}` : "",
    ].join("");

    // 1. Create the task
    const { data: taskData, error: taskError } = await supabase.from("tasks").insert({
      title: `KS – ${conceptName}`,
      description,
      assigned_to: selectedUserId,
      assigned_by: userData.user.id,
      priority: "normal",
      status: "pending",
    }).select("id").single();

    if (taskError || !taskData) {
      toast({ title: "Feil", description: "Kunne ikke sende til KS", variant: "destructive" });
      setIsSending(false);
      return;
    }

    // 2. Create a frozen snapshot of the concept
    const { error: snapError } = await supabase.from("concept_snapshots").insert({
      concept_id: conceptId,
      task_id: taskData.id,
      snapshot_content: conceptContent,
      snapshot_name: conceptName,
      created_by: userData.user.id,
    });

    if (snapError) {
      toast({ title: "Feil", description: "Kunne ikke lagre øyeblikksbilde", variant: "destructive" });
      setIsSending(false);
      return;
    }

    // 3. Send notification
    await supabase.rpc("create_notification", {
      _user_id: selectedUserId,
      _type: "task_assigned",
      _title: `Ny KS-oppgave: ${conceptName}`,
      _message: message || `Du har fått en KS-oppgave fra en kollega.`,
    });
    toast({ title: "Sendt!", description: "Brannkonseptet er sendt til KS" });
    setSelectedUserId("");
    setMessage("");
    setOpen(false);

    setIsSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="lg" className="flex-1" disabled={disabled}>
          <Send className="h-4 w-4 mr-2" />
          Send til KS
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send «{conceptName || "Brannkonsept"}» til KS</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Velg mottaker</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Velg en kollega..." />
              </SelectTrigger>
              <SelectContent>
                {members.length === 0 ? (
                  <SelectItem value="__none" disabled>
                    Ingen kollegaer funnet
                  </SelectItem>
                ) : (
                  members.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.profile_name} {m.profile_email && `(${m.profile_email})`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Melding (valgfritt)</Label>
            <Textarea
              placeholder="Legg til en beskjed..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSend} disabled={!selectedUserId || isSending}>
            <Send className="h-4 w-4 mr-2" />
            {isSending ? "Sender..." : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendToKSDialog;
