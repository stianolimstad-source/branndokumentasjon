import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Check, Loader2, XCircle, RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment } from "@/lib/paddle";
import { useToast } from "@/hooks/use-toast";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

const FEATURES = [
  "Ubegrensede prosjekter",
  "Brannkonsept etter TEK17/VTEK",
  "Tilstandsvurdering med bilder",
  "Fraviksdokumentasjon (kvalitativ analyse)",
  "Brensellagring (DSB)",
  "Alle beregningsverktøy",
  "Eksport til Word og PDF",
  "AI-assistert utfylling",
];

const Abonnement = () => {
  const { user, loading: authLoading } = useAuth();
  const { isActive, loading, status, currentPeriodEnd, cancelAtPeriodEnd, refresh } = useSubscription();
  const { openCheckout, loading: checkoutLoading } = usePaddleCheckout();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    if (params.get("checkout") === "success") {
      toast({ title: "Takk for kjøpet!", description: "Abonnementet aktiveres innen få sekunder." });
      const t = setInterval(() => refresh(), 2000);
      setTimeout(() => clearInterval(t), 20000);
      params.delete("checkout");
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAction = async (action: "cancel" | "resume") => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription", {
        body: { environment: getPaddleEnvironment(), action },
      });
      if (error || !data?.ok) {
        toast({
          title: "Feil",
          description: action === "cancel" ? "Kunne ikke si opp abonnementet." : "Kunne ikke gjenoppta abonnementet.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: action === "cancel" ? "Abonnementet er sagt opp" : "Abonnementet er gjenopptatt",
        description: action === "cancel"
          ? "Du beholder tilgang ut inneværende periode."
          : "Abonnementet vil fornyes som vanlig.",
      });
      // Webhook oppdaterer DB; poll noen ganger som backup
      const t = setInterval(() => refresh(), 2000);
      setTimeout(() => clearInterval(t), 15000);
    } finally {
      setActionLoading(false);
      setConfirmCancel(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <PaymentTestModeBanner />
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Abonnement</h1>
          <p className="text-muted-foreground">Full tilgang til alle verktøy. 14 dagers gratis prøveperiode.</p>
        </div>

        {authLoading || loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : !user ? (
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <CardTitle>Logg inn for å abonnere</CardTitle>
              <CardDescription>Du må være innlogget for å starte abonnementet.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/auth"><Button>Logg inn</Button></Link>
            </CardContent>
          </Card>
        ) : isActive ? (
          <Card className="max-w-xl mx-auto">
            <CardHeader>
              <CardTitle>Du har aktivt abonnement</CardTitle>
              <CardDescription>
                Status: <span className="font-medium">{statusLabel(status)}</span>
                {currentPeriodEnd && (
                  <> · {cancelAtPeriodEnd ? "utløper" : "fornyes"} {new Date(currentPeriodEnd).toLocaleDateString("nb-NO")}</>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2">
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />{f}
                  </li>
                ))}
              </ul>
              {status !== "owner" && (
                cancelAtPeriodEnd ? (
                  <Button onClick={() => runAction("resume")} variant="outline" className="w-full" disabled={actionLoading}>
                    {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
                    Gjenoppta abonnement
                  </Button>
                ) : (
                  <Button onClick={() => setConfirmCancel(true)} variant="outline" className="w-full" disabled={actionLoading}>
                    {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                    Si opp abonnement
                  </Button>
                )
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <PlanCard
              title="Månedlig"
              price="$9"
              period="/mnd"
              priceId="branndok_pro_monthly"
              onSelect={openCheckout}
              loading={checkoutLoading}
            />
            <PlanCard
              title="Årlig"
              price="$90"
              period="/år"
              badge="Spar ~17%"
              priceId="branndok_pro_yearly"
              onSelect={openCheckout}
              loading={checkoutLoading}
              recommended
            />
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-8">
          Pristabellen er foreløpig satt opp som plassholder. Endelig pris settes før lansering.
        </p>
      </div>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Si opp abonnement?</AlertDialogTitle>
            <AlertDialogDescription>
              Du beholder tilgang ut inneværende periode
              {currentPeriodEnd && <> frem til {new Date(currentPeriodEnd).toLocaleDateString("nb-NO")}</>}.
              Du kan gjenoppta abonnementet når som helst før det utløper.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); runAction("cancel"); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Si opp
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function statusLabel(status: string | null) {
  switch (status) {
    case "trialing": return "Prøveperiode";
    case "active": return "Aktivt";
    case "past_due": return "Forfalt betaling";
    case "canceled": return "Oppsagt";
    case "owner": return "Eier (full tilgang)";
    default: return status ?? "—";
  }
}

interface PlanCardProps {
  title: string;
  price: string;
  period: string;
  priceId: string;
  badge?: string;
  recommended?: boolean;
  loading: boolean;
  onSelect: (priceId: string) => void;
}

const PlanCard = ({ title, price, period, priceId, badge, recommended, loading, onSelect }: PlanCardProps) => (
  <Card className={recommended ? "border-primary shadow-medium" : ""}>
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {badge && <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">{badge}</span>}
      </div>
      <div className="flex items-baseline gap-1 pt-2">
        <span className="text-4xl font-bold">{price}</span>
        <span className="text-muted-foreground">{period}</span>
      </div>
      <CardDescription>14 dagers gratis prøveperiode</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <ul className="space-y-2">
        {FEATURES.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary" />{f}
          </li>
        ))}
      </ul>
      <Button className="w-full" onClick={() => onSelect(priceId)} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start gratis prøveperiode"}
      </Button>
    </CardContent>
  </Card>
);

export default Abonnement;
