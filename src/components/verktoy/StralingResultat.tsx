import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StralingResultatProps {
  straling: number;
  status: "ok" | "warning" | "error";
  extraInfo?: string;
  showCard?: boolean;
  children?: ReactNode;
}

const StralingResultat = ({ straling, status, extraInfo, showCard = true, children }: StralingResultatProps) => {
  return (
    <div className="space-y-4 pt-4 border-t">
      <h3 className="font-semibold">Resultater:</h3>

      {showCard && (
        <Card className={
          status === "ok" ? "border-green-500 bg-green-50 dark:bg-green-950" :
          status === "warning" ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950" :
          "border-red-500 bg-red-50 dark:bg-red-950"
        }>
          <CardHeader><CardTitle className="text-base">Mottatt stråling q″<sub>rad</sub></CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{straling} kW/m²</p>
            {extraInfo && <p className="text-sm text-muted-foreground mt-1">{extraInfo}</p>}
          </CardContent>
        </Card>
      )}

      <div className={`p-4 rounded-lg ${
        status === "ok" ? "bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100" :
        status === "warning" ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100" :
        "bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100"
      }`}>
        <p className="font-semibold mb-1">
          {status === "ok" && "✓ Strålingsnivået er akseptabelt"}
          {status === "warning" && "⚠ Strålingsnivået nærmer seg grensen"}
          {status === "error" && "✗ Strålingsnivået overskrider grenseverdien"}
        </p>
        <p className="text-sm">
          {status === "ok" && "Under 8 kW/m² — ingen spesiell beskyttelse nødvendig."}
          {status === "warning" && "Mellom 8–12,5 kW/m² — vurder tiltak for å redusere stråling."}
          {status === "error" && "Over 12,5 kW/m² — tiltak for brannspredning er påkrevd."}
        </p>
      </div>

      {children && (
        <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
          <p className="font-semibold">Grunnlag:</p>
          {children}
        </div>
      )}
    </div>
  );
};

export default StralingResultat;
