import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { extractParagrafIds } from "@/lib/fravik-paragraf";

export type FravikStatus = "foreslått" | "akseptert";

export interface ProsjektFravik {
  conceptId: string;
  conceptName: string;
  contentType: string;
  fravikId: string;
  index: number; // 1-basert nummerering innen dokumentet
  navn: string;
  fravikBeskrivelse: string;
  konklusjon: string;
  paragrafIds: string[];
  status: FravikStatus;
}

const KVALITATIV_TYPES = new Set(["kvalitativ", "komparativ", "risikoanalyse"]);

export const useFravikForProsjekt = (projectId: string | null | undefined) => {
  const [fravikList, setFravikList] = useState<ProsjektFravik[]>([]);
  const [hasFravikDokument, setHasFravikDokument] = useState(false);
  const [firstFravikConceptId, setFirstFravikConceptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!projectId) {
      setFravikList([]);
      setHasFravikDokument(false);
      setFirstFravikConceptId(null);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("fire_concepts")
      .select("id, name, content")
      .eq("project_id", projectId);

    if (error || !data) {
      setLoading(false);
      return;
    }

    const flat: ProsjektFravik[] = [];
    let foundFraviksdok = false;
    let firstId: string | null = null;

    for (const row of data as any[]) {
      const content = row.content || {};
      const contentType: string | undefined = content.type || content.contentType;
      if (!contentType || !KVALITATIV_TYPES.has(contentType)) continue;
      foundFraviksdok = true;
      if (!firstId) firstId = row.id;

      const entries: any[] = Array.isArray(content.fravikEntries) ? content.fravikEntries : [];
      entries.forEach((e, idx) => {
        const paragrafIds = extractParagrafIds(e.funksjonskrav);
        const status: FravikStatus = e.konklusjon ? "akseptert" : "foreslått";
        flat.push({
          conceptId: row.id,
          conceptName: row.name,
          contentType,
          fravikId: e.id,
          index: idx + 1,
          navn: e.navn || "",
          fravikBeskrivelse: e.fravikBeskrivelse || "",
          konklusjon: e.konklusjon || "",
          paragrafIds,
          status,
        });
      });
    }

    setFravikList(flat);
    setHasFravikDokument(foundFraviksdok);
    setFirstFravikConceptId(firstId);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  return { fravikList, hasFravikDokument, firstFravikConceptId, loading, refresh: load };
};
