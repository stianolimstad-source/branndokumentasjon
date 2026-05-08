import { ReactNode } from "react";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  children: ReactNode;
  feature?: string;
}

const RequireSubscription = ({ children, feature }: Props) => {
  const { user, loading: authLoading } = useAuth();
  const { isActive, loading } = useSubscription();

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isActive) return <>{children}</>;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">Krever abonnement</h2>
        <p className="text-muted-foreground">
          {feature ? `${feature} krever et aktivt abonnement.` : "Denne funksjonen krever et aktivt abonnement."}
          {" "}Start med 14 dagers gratis prøveperiode.
        </p>
        <div className="flex gap-2 justify-center">
          {!user ? (
            <Link to="/auth"><Button>Logg inn</Button></Link>
          ) : (
            <Link to="/abonnement"><Button>Se abonnement</Button></Link>
          )}
          <Link to="/"><Button variant="outline">Til forsiden</Button></Link>
        </div>
      </div>
    </div>
  );
};

export default RequireSubscription;
