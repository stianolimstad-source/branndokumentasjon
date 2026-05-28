import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ExternalLink, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProsjektFravik } from "@/hooks/useFravikForProsjekt";

interface Props {
  paragrafId: string; // f.eks. "11-7"
  projectId: string | null;
  konseptId: string | null;
  fravikList: ProsjektFravik[];
  firstFravikConceptId: string | null;
  hasFravikDokument: boolean;
  refresh: () => void;
}

const statusVariant = (status: string): "secondary" | "default" | "destructive" => {
  if (status === "akseptert") return "default";
  if (status === "avvist") return "destructive";
  return "secondary";
};

const firstLine = (s: string) => (s || "").split("\n")[0].trim();

const FravikForParagraf: React.FC<Props> = ({
  paragrafId, projectId, konseptId, fravikList, firstFravikConceptId, hasFravikDokument, refresh,
}) => {
  const navigate = useNavigate();
  const matching = fravikList.filter(f => f.paragrafIds.includes(paragrafId));

  const handleOpprett = () => {
    if (!projectId) return;
    const params = new URLSearchParams();
    params.set("project", projectId);
    if (hasFravikDokument && firstFravikConceptId) {
      params.set("concept", firstFravikConceptId);
    } else {
      params.set("new", "true");
    }
    params.set("tekParagraf", paragrafId);
    params.set("newFravik", "1");
    if (konseptId) params.set("fromKonsept", konseptId);
    navigate(`/fraviksdokumentasjon/kvalitativ?${params.toString()}`);
  };

  const handleOpen = (f: ProsjektFravik) => {
    const params = new URLSearchParams();
    if (projectId) params.set("project", projectId);
    params.set("concept", f.conceptId);
    if (konseptId) params.set("fromKonsept", konseptId);
    navigate(`/fraviksdokumentasjon/kvalitativ?${params.toString()}#fravik-${f.fravikId}`);
  };

  return (
    <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-sm font-semibold text-foreground">Fravik fra preakseptert ytelse</div>
            <p className="text-xs text-muted-foreground mt-1">
              Når preakseptert ytelse ikke kan oppfylles, må fraviket dokumenteres med tilstrekkelig ytelse og dokumentasjon iht. SAK 10 § 9-1.
            </p>
          </div>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={refresh} title="Oppdater fravikliste">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {matching.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Ingen fravik registrert for § {paragrafId}.</p>
      ) : (
        <ul className="space-y-1.5">
          {matching.map((f) => (
            <li key={f.fravikId} className="flex items-center gap-2 rounded border bg-background px-2 py-1.5 text-xs">
              <Badge variant="outline" className="font-mono text-[10px]">F{f.index}</Badge>
              <span className="flex-1 truncate">
                {f.navn || firstLine(f.fravikBeskrivelse) || <span className="text-muted-foreground italic">Uten tittel</span>}
              </span>
              <Badge variant={statusVariant(f.status)} className="text-[10px] capitalize">{f.status}</Badge>
              <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={() => handleOpen(f)}>
                <ExternalLink className="h-3 w-3 mr-1" /> Åpne
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="pt-1">
        <Button type="button" variant="outline" size="sm" onClick={handleOpprett} disabled={!projectId}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Opprett fravik fra § {paragrafId}
        </Button>
      </div>
    </div>
  );
};

export default FravikForParagraf;
