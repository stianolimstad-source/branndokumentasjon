import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Loader2, XCircle, RotateCcw, ArrowUpCircle, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
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

const MONTHLY_ID = "pro_monthly";
const YEARLY_ID = "pro_yearly";

type CardState =
  | { kind: "purchase" }
  | { kind: "current"; statusText: string }
  | { kind: "switch"; target: "to_yearly" | "to_monthly" }
  | { kind: "locked"; reason: string };

const Abonnement = () => {
  const { user, loading: authLoading } = useAuth();
  const { isActive, loading, status, priceId, currentPeriodEnd, cancelAtPeriodEnd, refresh } = useSubscription();
  const { openCheckout, closeCheckout, isOpen: checkoutOpen, checkoutElement, loading: checkoutLoading } = useStripeCheckout();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmSwitch, setConfirmSwitch] = useState<null | "to_yearly" | "to_monthly">(null);

  useEffect(() => {
    if (params.get("checkout") === "success") {
      toast({ title: "Takk for kjøpet!", description: "Abonnementet aktiveres innen få sekunder." });
      const t = setInterval(() => refresh(), 2000);
      setTimeout(() => clearInterval(t), 20000);
      params.delete("checkout");
      params.delete("session_id");
      setParams(params, { replace: true });
      closeCheckout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAction = async (action: "cancel" | "resume") => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription", {
        body: { environment: getStripeEnvironment(), action },
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
      const t = setInterval(() => refresh(), 2000);
      setTimeout(() => clearInterval(t), 15000);
    } finally {
      setActionLoading(false);
      setConfirmCancel(false);
    }
  };

  const runSwitch = async (target: "to_yearly" | "to_monthly") => {
    if (actionLoading) return;
    setActionLoading(true);
    setConfirmSwitch(null);
    try {
      const newPriceId = target === "to_yearly" ? YEARLY_ID : MONTHLY_ID;
      const { data, error } = await supabase.functions.invoke("change-subscription-plan", {
        body: { environment: getStripeEnvironment(), newPriceId },
      });
      if (error || !data?.ok) {
        toast({
          title: "Feil",
          description: "Kunne ikke bytte plan. Prøv igjen senere.",
          variant: "destructive",
        });
        return;
      }
      const isTrial = status === "trialing";
      toast({
        title: target === "to_yearly" ? "Byttet til årlig plan" : "Byttet til månedlig plan",
        description: isTrial
          ? "Den nye planen aktiveres når prøveperioden utløper."
          : target === "to_yearly"
            ? "Endringen trer i kraft umiddelbart. Differansen er pro-ratert."
            : "Endringen trer i kraft ved neste fornyelse.",
      });
      await refresh();
      const t = setInterval(() => refresh(), 2000);
      setTimeout(() => clearInterval(t), 15000);
    } finally {
      setActionLoading(false);
    }
  };

  const periodLabel = currentPeriodEnd
    ? `${cancelAtPeriodEnd ? "utløper" : "fornyes"} ${new Date(currentPeriodEnd).toLocaleDateString("nb-NO")}`
    : "";

  const stateFor = (cardPlan: typeof MONTHLY_ID | typeof YEARLY_ID): CardState => {
    if (!isActive || status === "owner") return { kind: "purchase" };
    if (priceId === cardPlan) {
      const statusText = [statusLabel(status), periodLabel].filter(Boolean).join(" · ");
      return { kind: "current", statusText };
    }
    if (cardPlan === YEARLY_ID && priceId === MONTHLY_ID) {
      return { kind: "switch", target: "to_yearly" };
    }
    if (cardPlan === MONTHLY_ID && priceId === YEARLY_ID) {
      if (status === "trialing") return { kind: "switch", target: "to_monthly" };
      return {
        kind: "locked",
        reason: "Du har allerede betalt for et helt år. Du kan bytte til månedlig ved neste fornyelse.",
      };
    }
    return { kind: "purchase" };
  };

  const switchDescription = confirmSwitch === "to_yearly"
    ? status === "trialing"
      ? `Du er i prøveperiode. Den årlige planen aktiveres når prøveperioden utløper${currentPeriodEnd ? ` ${new Date(currentPeriodEnd).toLocaleDateString("nb-NO")}` : ""}. Ingen ekstra fakturering skjer nå.`
      : "Endringen trer i kraft umiddelbart. Differansen mellom månedlig og årlig pris pro-rateres for resten av inneværende periode, slik at du kun betaler differansen nå."
    : status === "trialing"
      ? `Du er i prøveperiode. Den månedlige planen aktiveres når prøveperioden utløper${currentPeriodEnd ? ` ${new Date(currentPeriodEnd).toLocaleDateString("nb-NO")}` : ""}.`
      : "Endringen trer i kraft ved neste fornyelse.";

  const showManage = isActive && status !== "owner";

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
          <>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <PlanCard
                title="Månedlig"
                price="500 kr"
                period="/mnd"
                priceId={MONTHLY_ID}
                state={{ kind: "purchase" }}
                onPurchase={(id) => openCheckout(id)}
                onSwitch={() => {}}
                actionLoading={false}
                checkoutLoading={checkoutLoading}
              />
              <PlanCard
                title="Årlig"
                price="5 000 kr"
                period="/år"
                badge="Spar ~17%"
                priceId={YEARLY_ID}
                state={{ kind: "purchase" }}
                onPurchase={(id) => openCheckout(id)}
                onSwitch={() => {}}
                actionLoading={false}
                checkoutLoading={checkoutLoading}
                recommended
              />
            </div>
            <Card className="max-w-md mx-auto text-center">
              <CardHeader>
                <CardTitle>Logg inn for å abonnere</CardTitle>
                <CardDescription>Du må være innlogget for å starte abonnementet.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/auth"><Button>Logg inn</Button></Link>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-6">
              <PlanCard
                title="Månedlig"
                price="500 kr"
                period="/mnd"
                priceId={MONTHLY_ID}
                state={stateFor(MONTHLY_ID)}
                onPurchase={(id) => openCheckout(id)}
                onSwitch={(t) => setConfirmSwitch(t)}
                actionLoading={actionLoading}
                checkoutLoading={checkoutLoading}
              />
              <PlanCard
                title="Årlig"
                price="5 000 kr"
                period="/år"
                badge="Spar ~17%"
                priceId={YEARLY_ID}
                state={stateFor(YEARLY_ID)}
                onPurchase={(id) => openCheckout(id)}
                onSwitch={(t) => setConfirmSwitch(t)}
                actionLoading={actionLoading}
                checkoutLoading={checkoutLoading}
                recommended
              />
            </div>

            {status === "owner" && (
              <Card className="mt-6 max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle>Eier (full tilgang)</CardTitle>
                  <CardDescription>Du har full tilgang til alle verktøy uten abonnement.</CardDescription>
                </CardHeader>
              </Card>
            )}

            {showManage && (
              <Card className="mt-6 max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle>Administrer abonnement</CardTitle>
                  <CardDescription>
                    Status: <span className="font-medium">{statusLabel(status)}</span>
                    {currentPeriodEnd && <> · {periodLabel}</>}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {cancelAtPeriodEnd ? (
                    <Button onClick={() => runAction("resume")} variant="outline" className="w-full" disabled={actionLoading}>
                      {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
                      Gjenoppta abonnement
                    </Button>
                  ) : (
                    <Button onClick={() => setConfirmCancel(true)} variant="outline" className="w-full" disabled={actionLoading}>
                      {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                      Si opp abonnement
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        <p className="text-center text-xs text-muted-foreground mt-8">
          Priser er oppgitt inkl. mva. Selger: Olimstad Brannrådgivning AS.
        </p>
      </div>

      <Dialog open={checkoutOpen} onOpenChange={(o) => !o && closeCheckout()}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Fullfør bestilling</DialogTitle>
          </DialogHeader>
          <div className="p-2 sm:p-4 max-h-[80vh] overflow-y-auto">
            {checkoutElement}
          </div>
        </DialogContent>
      </Dialog>

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

      <AlertDialog open={confirmSwitch !== null} onOpenChange={(o) => !o && setConfirmSwitch(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmSwitch === "to_yearly" ? "Bytt til årlig plan?" : "Bytt til månedlig plan?"}
            </AlertDialogTitle>
            <AlertDialogDescription>{switchDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); if (confirmSwitch) runSwitch(confirmSwitch); }}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Bekreft bytte
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
  state: CardState;
  checkoutLoading: boolean;
  actionLoading: boolean;
  onPurchase: (priceId: string) => void;
  onSwitch: (target: "to_yearly" | "to_monthly") => void;
}

const PlanCard = ({ title, price, period, priceId, badge, recommended, state, checkoutLoading, actionLoading, onPurchase, onSwitch }: PlanCardProps) => {
  const isCurrent = state.kind === "current";
  return (
    <Card className={`${recommended ? "border-primary shadow-medium" : ""} ${isCurrent ? "ring-2 ring-primary" : ""}`}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{title}</CardTitle>
          <div className="flex items-center gap-2">
            {isCurrent && (
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary text-primary-foreground">
                Din plan
              </span>
            )}
            {badge && <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">{badge}</span>}
          </div>
        </div>
        <div className="flex items-baseline gap-1 pt-2">
          <span className="text-4xl font-bold">{price}</span>
          <span className="text-muted-foreground">{period}</span>
        </div>
        <CardDescription>
          {state.kind === "current" ? state.statusText : "14 dagers gratis prøveperiode"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />{f}
            </li>
          ))}
        </ul>

        {state.kind === "purchase" && (
          <Button className="w-full" onClick={() => onPurchase(priceId)} disabled={checkoutLoading}>
            {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start gratis prøveperiode"}
          </Button>
        )}

        {state.kind === "current" && (
          <Button className="w-full" variant="secondary" disabled>
            <Check className="h-4 w-4 mr-2" />
            Din nåværende plan
          </Button>
        )}

        {state.kind === "switch" && (
          <Button
            className="w-full"
            onClick={() => onSwitch(state.target)}
            disabled={actionLoading}
            variant={state.target === "to_yearly" ? "default" : "outline"}
          >
            {actionLoading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : state.target === "to_yearly"
                ? <><ArrowUpCircle className="h-4 w-4 mr-2" />Bytt til årlig (spar ~17%)</>
                : <>Bytt til månedlig</>}
          </Button>
        )}

        {state.kind === "locked" && (
          <div className="space-y-2">
            <Button className="w-full" variant="outline" disabled>
              <Lock className="h-4 w-4 mr-2" />
              Tilgjengelig ved neste fornyelse
            </Button>
            <p className="text-xs text-muted-foreground text-center">{state.reason}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Abonnement;
