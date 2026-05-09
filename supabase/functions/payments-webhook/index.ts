import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

async function notify(userId: string, type: string, title: string, message: string) {
  try {
    await getSupabase().from("notifications").insert({ user_id: userId, type, title, message });
  } catch (e) {
    console.error("notify error", e);
  }
}

async function findUserIdBySubscription(subscriptionId: string): Promise<string | null> {
  const { data } = await getSupabase()
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();
  return (data?.user_id as string) ?? null;
}

function periodFields(subscription: any) {
  const item = subscription.items?.data?.[0];
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  const priceId = item?.price?.lookup_key
    || item?.price?.metadata?.lovable_external_id
    || item?.price?.id;
  const productId = item?.price?.product;
  return { periodStart, periodEnd, priceId, productId };
}

async function handleSubscriptionCreated(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }
  const { periodStart, periodEnd, priceId, productId } = periodFields(subscription);

  await getSupabase().from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      product_id: productId,
      price_id: priceId,
      status: subscription.status,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );

  await notify(
    userId,
    "subscription_started",
    subscription.status === "trialing" ? "Prøveperiode startet" : "Abonnement aktivert",
    subscription.status === "trialing"
      ? "Velkommen! Du har nå 14 dagers gratis prøveperiode."
      : "Takk for kjøpet! Abonnementet ditt er aktivt.",
  );
}

async function handleSubscriptionUpdated(subscription: any, env: StripeEnv) {
  const { periodStart, periodEnd, priceId, productId } = periodFields(subscription);

  await getSupabase()
    .from("subscriptions")
    .update({
      status: subscription.status,
      product_id: productId,
      price_id: priceId,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);

  if (subscription.status === "past_due") {
    const userId = await findUserIdBySubscription(subscription.id);
    if (userId) {
      await notify(
        userId,
        "payment_past_due",
        "Betaling mislyktes",
        "Vi fikk ikke gjennomført fornyelse av abonnementet. Oppdater betalingsmåten for å unngå tap av tilgang.",
      );
    }
  }
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);

  const userId = await findUserIdBySubscription(subscription.id);
  if (userId) {
    await notify(
      userId,
      "subscription_canceled",
      "Abonnement oppsagt",
      "Abonnementet er sagt opp. Du beholder tilgang ut inneværende betalingsperiode.",
    );
  }
}

async function handleInvoicePaymentFailed(invoice: any, env: StripeEnv) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;
  const userId = await findUserIdBySubscription(subscriptionId);
  if (!userId) return;

  await getSupabase()
    .from("subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscriptionId)
    .eq("environment", env);

  await notify(
    userId,
    "payment_failed",
    "Betaling mislyktes",
    "En betaling ble avvist. Oppdater betalingsmåten for å beholde tilgangen.",
  );
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    console.error("Webhook received with invalid env:", rawEnv);
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  const env: StripeEnv = rawEnv;

  try {
    const event = await verifyWebhook(req, env);
    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object, env);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object, env);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object, env);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object, env);
        break;
      default:
        console.log("Unhandled event:", event.type);
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
