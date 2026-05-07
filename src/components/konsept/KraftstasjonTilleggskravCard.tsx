import { ReactNode } from "react";
import { Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface KraftstasjonTilleggskravCardProps {
  kapittel: string;
  visible: boolean;
  children: ReactNode;
  kildeTekst?: string;
}

/**
 * Visuelt skille mellom generelle BF85/TEK17-krav og tilleggskrav for kraftstasjoner.
 * Vises kun når bygningstype/bygningsdel er Kraftstasjon.
 */
export const KraftstasjonTilleggskravCard = ({
  kapittel,
  visible,
  children,
  kildeTekst = "Veiledning om brannsikkerhet i kraftstasjoner",
}: KraftstasjonTilleggskravCardProps) => {
  if (!visible) return null;

  return (
    <div className="mt-4 rounded-lg border border-primary/40 bg-primary/5 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold text-primary">
            Tilleggskrav for kraftstasjon – kap. {kapittel}
          </h4>
          <Badge variant="outline" className="border-primary/40 text-primary text-[10px]">
            Kraftstasjon
          </Badge>
        </div>
        <span className="text-[11px] text-muted-foreground italic">
          Kilde: {kildeTekst}
        </span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
};

export default KraftstasjonTilleggskravCard;
