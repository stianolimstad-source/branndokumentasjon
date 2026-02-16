import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2, Users, User, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ShareProjectDialogProps {
  projectId: string;
  projectName: string;
}

interface ShareEntry {
  id: string;
  group_id: string | null;
  contact_id: string | null;
  group_name?: string;
  contact_name?: string;
  contact_email?: string;
}

interface Group {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
}

const ShareProjectDialog = ({ projectId, projectName }: ShareProjectDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [shares, setShares] = useState<ShareEntry[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [shareType, setShareType] = useState<"group" | "contact">("group");
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    if (open) {
      fetchShares();
      fetchGroupsAndContacts();
    }
  }, [open]);

  const fetchShares = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("project_shares")
      .select("id, group_id, contact_id")
      .eq("project_id", projectId);

    if (error) {
      setIsLoading(false);
      return;
    }

    // Enrich with names
    const enriched: ShareEntry[] = [];
    for (const share of data || []) {
      const entry: ShareEntry = { ...share };
      if (share.group_id) {
        const { data: g } = await supabase
          .from("contact_groups")
          .select("name")
          .eq("id", share.group_id)
          .single();
        entry.group_name = g?.name || "Ukjent gruppe";
      }
      if (share.contact_id) {
        const { data: c } = await supabase
          .from("contacts")
          .select("name, email")
          .eq("id", share.contact_id)
          .single();
        entry.contact_name = c?.name || "Ukjent kontakt";
        entry.contact_email = c?.email;
      }
      enriched.push(entry);
    }
    setShares(enriched);
    setIsLoading(false);
  };

  const fetchGroupsAndContacts = async () => {
    const [groupsRes, contactsRes] = await Promise.all([
      supabase.from("contact_groups").select("id, name"),
      supabase.from("contacts").select("id, name, email"),
    ]);
    setGroups(groupsRes.data || []);
    setContacts(contactsRes.data || []);
  };

  const handleShare = async () => {
    if (!selectedId) return;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    // Check for duplicates
    const isDuplicate = shares.some(
      (s) =>
        (shareType === "group" && s.group_id === selectedId) ||
        (shareType === "contact" && s.contact_id === selectedId)
    );
    if (isDuplicate) {
      toast({ title: "Allerede delt", description: "Prosjektet er allerede delt med denne.", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("project_shares").insert({
      project_id: projectId,
      shared_by: userData.user.id,
      group_id: shareType === "group" ? selectedId : null,
      contact_id: shareType === "contact" ? selectedId : null,
    });

    if (error) {
      toast({ title: "Feil", description: "Kunne ikke dele prosjektet", variant: "destructive" });
    } else {
      toast({ title: "Delt!", description: `Prosjektet er nå delt` });
      setSelectedId("");
      fetchShares();
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    const { error } = await supabase.from("project_shares").delete().eq("id", shareId);
    if (error) {
      toast({ title: "Feil", description: "Kunne ikke fjerne deling", variant: "destructive" });
    } else {
      setShares((prev) => prev.filter((s) => s.id !== shareId));
    }
  };

  const availableGroups = groups.filter((g) => !shares.some((s) => s.group_id === g.id));
  const availableContacts = contacts.filter((c) => !shares.some((s) => s.contact_id === c.id));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Del
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Del «{projectName}»</DialogTitle>
        </DialogHeader>

        {/* Add new share */}
        <div className="space-y-3 border-b pb-4">
          <div className="flex gap-2">
            <Select value={shareType} onValueChange={(v) => { setShareType(v as "group" | "contact"); setSelectedId(""); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="group">Gruppe</SelectItem>
                <SelectItem value="contact">Kontakt</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Velg..." />
              </SelectTrigger>
              <SelectContent>
                {shareType === "group"
                  ? availableGroups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))
                  : availableContacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
              </SelectContent>
            </Select>

            <Button size="icon" onClick={handleShare} disabled={!selectedId}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Current shares */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Laster...</p>
          ) : shares.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Prosjektet er ikke delt med noen ennå.
            </p>
          ) : (
            shares.map((share) => (
              <div key={share.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  {share.group_id ? (
                    <Users className="h-4 w-4 text-primary" />
                  ) : (
                    <User className="h-4 w-4 text-primary" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {share.group_name || share.contact_name}
                    </p>
                    {share.contact_email && (
                      <p className="text-xs text-muted-foreground">{share.contact_email}</p>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveShare(share.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareProjectDialog;
