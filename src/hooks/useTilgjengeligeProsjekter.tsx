import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export type Prosjekttilgang = {
  id: string;
  name: string;
  kategori: "personlig" | "delt";
  engineerNavn?: string;
  created_at: string;
};

export function useTilgjengeligeProsjekter(_forRosEdit = false) {
  const { user } = useAuth();
  const [prosjekter, setProsjekter] = useState<Prosjekttilgang[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setProsjekter([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    // 1. Egne prosjekter
    const { data: egne } = await supabase
      .from("projects")
      .select("id, name, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // 2. Delte prosjekter via gruppe eller direkte kontakt
    // Hent grupper jeg er medlem av
    const { data: minGruppemedlemskap } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", user.id);
    const gruppeIds = (minGruppemedlemskap || []).map((g: any) => g.group_id);

    // Hent kontakter knyttet til meg
    const { data: mineKontakter } = await supabase
      .from("contacts")
      .select("id")
      .eq("linked_user_id", user.id);
    const kontaktIds = (mineKontakter || []).map((c: any) => c.id);

    let shares: any[] = [];
    if (gruppeIds.length > 0) {
      const { data } = await supabase
        .from("project_shares")
        .select("project_id, shared_by")
        .in("group_id", gruppeIds);
      shares = shares.concat(data || []);
    }
    if (kontaktIds.length > 0) {
      const { data } = await supabase
        .from("project_shares")
        .select("project_id, shared_by")
        .in("contact_id", kontaktIds);
      shares = shares.concat(data || []);
    }

    // Dedupliser share-prosjekter, og hent prosjektdetaljer + eier-navn
    const egneIds = new Set((egne || []).map((p: any) => p.id));
    const shareMap = new Map<string, string>(); // project_id -> shared_by
    shares.forEach((s) => {
      if (!egneIds.has(s.project_id) && !shareMap.has(s.project_id)) {
        shareMap.set(s.project_id, s.shared_by);
      }
    });

    let delte: Prosjekttilgang[] = [];
    if (shareMap.size > 0) {
      const sharedProjectIds = Array.from(shareMap.keys());
      const ownerIds = Array.from(new Set(Array.from(shareMap.values())));
      const [{ data: sharedProjects }, { data: ownerProfiles }] = await Promise.all([
        supabase.from("projects").select("id, name, created_at").in("id", sharedProjectIds),
        supabase.from("profiles").select("id, full_name").in("id", ownerIds),
      ]);
      const navnMap = new Map<string, string>();
      (ownerProfiles || []).forEach((p: any) => navnMap.set(p.id, p.full_name || "ukjent"));
      delte = (sharedProjects || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        kategori: "delt" as const,
        engineerNavn: navnMap.get(shareMap.get(p.id) || "") || "ukjent",
        created_at: p.created_at,
      }));
    }

    const personlige: Prosjekttilgang[] = (egne || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      kategori: "personlig" as const,
      created_at: p.created_at,
    }));

    const samlet = [...personlige, ...delte].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    setProsjekter(samlet);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { prosjekter, loading, refetch: fetchAll };
}
