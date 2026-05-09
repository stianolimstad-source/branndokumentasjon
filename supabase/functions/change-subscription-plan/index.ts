import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) throw new Error("Not authenticated");
    const userId = claimsData.claims.sub as string;

    const { environment, newPriceId } = await req.json();
    if (!newPriceId || !/^[a-zA-Z0-9_-]+$/.test(newPriceId)) throw new Error("Invalid newPriceId");
    const env = (environment === "live" ? "live" : "sandbox") as StripeEnv;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: sub } = await admin
      .from("subscriptions")
      .select("stripe_subscription_id, price_id, status")
      .eq("user_id", userId)
      .eq("environment", env)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub?.stripe_subscription_id) throw new Error("Ingen aktivt abonnement funnet");
    if (sub.price_id === newPriceId) {
      return new Response(JSON.stringify({ ok: true, alreadyOnPlan: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = createStripeClient(env);

    // Resolve human-readable price -> Stripe price id
    const prices = await stripe.prices.list({ lookup_keys: [newPriceId as string] });
    if (!prices.data.length) throw new Error(`Price not found: ${newPriceId}`);
    const stripePriceId = prices.data[0].id;

    const subscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id as string);
    const itemId = subscription.items.data[0].id;
    const currentPriceId = subscription.items.data[0].price.id;

    const isUpgrade = sub.price_id === "pro_monthly" && newPriceId === "pro_yearly";
    const isDowngrade = sub.price_id === "pro_yearly" && newPriceId === "pro_monthly";

    if (isDowngrade && subscription.status !== "trialing") {
      // Schedule downgrade for next renewal: keep yearly until period end, then switch to monthly.
      // Cancel any existing schedule first to avoid conflicts.
      if (subscription.schedule) {
        try {
          await stripe.subscriptionSchedules.release(subscription.schedule as string);
        } catch (e) {
          console.warn("Could not release existing schedule:", e);
        }
      }
      const schedule = await stripe.subscriptionSchedules.create({
        from_subscription: sub.stripe_subscription_id as string,
      });
      const currentPhase = schedule.phases[0];
      await stripe.subscriptionSchedules.update(schedule.id, {
        end_behavior: "release",
        phases: [
          {
            items: [{ price: currentPriceId, quantity: 1 }],
            start_date: currentPhase.start_date,
            end_date: currentPhase.end_date,
          },
          {
            items: [{ price: stripePriceId, quantity: 1 }],
            iterations: 1,
          },
        ],
      });
    } else {
      // Trial OR upgrade: change immediately. Upgrades after trial are pro-rated.
      const prorationBehavior = subscription.status === "trialing"
        ? "none"
        : isUpgrade
          ? "create_prorations"
          : "none";
      await stripe.subscriptions.update(sub.stripe_subscription_id as string, {
        items: [{ id: itemId, price: stripePriceId }],
        proration_behavior: prorationBehavior,
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("change-subscription-plan error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
