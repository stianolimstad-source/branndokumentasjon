import { ReactNode } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useIsFullAccess } from "@/hooks/useIsFullAccess";

interface Props {
  children: ReactNode;
}

const RequireFullAccess = ({ children }: Props) => {
  const isFullAccess = useIsFullAccess();

  if (isFullAccess) return <>{children}</>;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">Under utvikling</h2>
        <p className="text-muted-foreground">
          Denne delen er foreløpig låst. Den er under utvikling og krever utvidet tilgang for testing.
        </p>
        <Link to="/">
          <Button>Tilbake til forsiden</Button>
        </Link>
      </div>
    </div>
  );
};

export default RequireFullAccess;
