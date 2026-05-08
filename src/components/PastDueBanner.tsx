import { useSubscription } from "@/hooks/useSubscription";
import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

export function PastDueBanner() {
  const { status } = useSubscription();
  if (status !== "past_due") return null;
  return (
    <div className="w-full bg-yellow-100 dark:bg-yellow-900/30 border-b border-yellow-300 dark:border-yellow-700 px-4 py-2 text-center text-sm text-yellow-900 dark:text-yellow-100 flex items-center justify-center gap-2">
      <AlertTriangle className="h-4 w-4" />
      <span>
        Siste betaling mislyktes. Oppdater betalingsmåten for å beholde tilgangen.{" "}
        <Link to="/abonnement" className="underline font-medium">
          Gå til abonnement
        </Link>
      </span>
    </div>
  );
}
