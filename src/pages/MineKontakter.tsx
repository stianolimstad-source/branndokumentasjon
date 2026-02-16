import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Flame, ArrowLeft, Plus, Users, UserPlus, Trash2, Pencil, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ContactGroup {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  created_at: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  group_id: string | null;
  user_id: string;
  created_at: string;
}

const MineKontakter = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ContactGroup | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Form states
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactGroupId, setContactGroupId] = useState<string>("none");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const [groupsRes, contactsRes] = await Promise.all([
      supabase.from("contact_groups").select("*").order("name"),
      supabase.from("contacts").select("*").order("name"),
    ]);
    if (groupsRes.data) setGroups(groupsRes.data);
    if (contactsRes.data) setContacts(contactsRes.data);
    setLoading(false);
  };

  // Group CRUD
  const openNewGroup = () => {
    setEditingGroup(null);
    setGroupName("");
    setGroupDescription("");
    setShowGroupDialog(true);
  };

  const openEditGroup = (group: ContactGroup) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupDescription(group.description || "");
    setShowGroupDialog(true);
  };

  const saveGroup = async () => {
    if (!groupName.trim() || !user) return;
    if (editingGroup) {
      const { error } = await supabase
        .from("contact_groups")
        .update({ name: groupName.trim(), description: groupDescription.trim() || null })
        .eq("id", editingGroup.id);
      if (error) { toast({ title: "Feil", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Gruppe oppdatert" });
    } else {
      const { error } = await supabase
        .from("contact_groups")
        .insert({ name: groupName.trim(), description: groupDescription.trim() || null, user_id: user.id });
      if (error) { toast({ title: "Feil", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Gruppe opprettet" });
    }
    setShowGroupDialog(false);
    fetchData();
  };

  const deleteGroup = async (id: string) => {
    const { error } = await supabase.from("contact_groups").delete().eq("id", id);
    if (error) { toast({ title: "Feil", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Gruppe slettet" });
    fetchData();
  };

  // Contact CRUD
  const openNewContact = () => {
    setEditingContact(null);
    setContactName("");
    setContactEmail("");
    setContactGroupId("none");
    setShowContactDialog(true);
  };

  const openEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setContactName(contact.name);
    setContactEmail(contact.email);
    setContactGroupId(contact.group_id || "none");
    setShowContactDialog(true);
  };

  const saveContact = async () => {
    if (!contactName.trim() || !contactEmail.trim() || !user) return;
    const data = {
      name: contactName.trim(),
      email: contactEmail.trim(),
      group_id: contactGroupId === "none" ? null : contactGroupId,
      user_id: user.id,
    };
    if (editingContact) {
      const { error } = await supabase.from("contacts").update(data).eq("id", editingContact.id);
      if (error) { toast({ title: "Feil", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Kontakt oppdatert" });
    } else {
      const { error } = await supabase.from("contacts").insert(data);
      if (error) { toast({ title: "Feil", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Kontakt lagt til" });
    }
    setShowContactDialog(false);
    fetchData();
  };

  const deleteContact = async (id: string) => {
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) { toast({ title: "Feil", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Kontakt slettet" });
    fetchData();
  };

  const getGroupName = (groupId: string | null) => {
    if (!groupId) return null;
    return groups.find((g) => g.id === groupId)?.name || null;
  };

  const filteredContacts = contacts.filter((c) => {
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Laster...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link to="/">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                  <Flame className="h-6 w-6 text-primary-foreground" />
                </div>
              </Link>
              <h1 className="text-xl font-bold">Mine kontakter</h1>
            </div>
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tilbake
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
        {/* Groups section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              Grupper
            </h2>
            <Button onClick={openNewGroup} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ny gruppe
            </Button>
          </div>
          {groups.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="py-8 text-center text-muted-foreground">
                Ingen grupper opprettet ennå. Opprett en gruppe for å organisere kontaktene dine.
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group) => {
                const memberCount = contacts.filter((c) => c.group_id === group.id).length;
                return (
                  <Card key={group.id} className="shadow-soft">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditGroup(group)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteGroup(group.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {group.description && (
                        <CardDescription>{group.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <Badge variant="secondary">{memberCount} {memberCount === 1 ? "medlem" : "medlemmer"}</Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Contacts section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <UserPlus className="h-6 w-6" />
              Kontakter
            </h2>
            <Button onClick={openNewContact} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ny kontakt
            </Button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk etter kontakter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredContacts.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="py-8 text-center text-muted-foreground">
                {contacts.length === 0
                  ? "Ingen kontakter lagt til ennå."
                  : "Ingen kontakter matcher søket."}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredContacts.map((contact) => {
                const gName = getGroupName(contact.group_id);
                return (
                  <Card key={contact.id} className="shadow-soft">
                    <CardContent className="py-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                        {gName && <Badge variant="outline" className="text-xs">{gName}</Badge>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditContact(contact)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteContact(contact.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Group dialog */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGroup ? "Rediger gruppe" : "Ny gruppe"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Navn</Label>
              <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="F.eks. Firma AS" />
            </div>
            <div>
              <Label>Beskrivelse (valgfritt)</Label>
              <Input value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} placeholder="Kort beskrivelse" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGroupDialog(false)}>Avbryt</Button>
            <Button onClick={saveGroup} disabled={!groupName.trim()}>Lagre</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingContact ? "Rediger kontakt" : "Ny kontakt"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Navn</Label>
              <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Fullt navn" />
            </div>
            <div>
              <Label>E-post</Label>
              <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="epost@eksempel.no" />
            </div>
            <div>
              <Label>Gruppe (valgfritt)</Label>
              <Select value={contactGroupId} onValueChange={setContactGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg gruppe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ingen gruppe</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactDialog(false)}>Avbryt</Button>
            <Button onClick={saveContact} disabled={!contactName.trim() || !contactEmail.trim()}>Lagre</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MineKontakter;
