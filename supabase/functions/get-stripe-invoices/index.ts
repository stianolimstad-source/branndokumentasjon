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
    const email = (claimsData.claims as any).email as string | undefined;

    const { environment } = await req.json();
    const env = (environment === "live" ? "live" : "sandbox") as StripeEnv;

    const stripe = createStripeClient(env);

    // Find customer ids: subscriptions metadata → customers metadata → email fallback
    const customerIds = new Set<string>();
    if (/^[a-zA-Z0-9_-]+$/.test(userId)) {
      try {
        const subs = await stripe.subscriptions.search({
          query: `metadata['userId']:'${userId}'`,
          limit: 100,
        });
        for (const s of subs.data) {
          const c = typeof s.customer === "string" ? s.customer : s.customer?.id;
          if (c) customerIds.add(c);
        }
      } catch (_) { /* ignore */ }
      try {
        const customers = await stripe.customers.search({
          query: `metadata['userId']:'${userId}'`,
          limit: 100,
        });
        for (const c of customers.data) customerIds.add(c.id);
      } catch (_) { /* ignore */ }
    }
    if (customerIds.size === 0 && email) {
      const byEmail = await stripe.customers.list({ email, limit: 100 });
      for (const c of byEmail.data) customerIds.add(c.id);
    }

    // Fallback: look up customer id stored locally on subscriptions row
    if (customerIds.size === 0) {
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data: rows } = await admin
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", userId)
        .eq("environment", env);
      for (const r of rows ?? []) {
        if ((r as any).stripe_customer_id) customerIds.add((r as any).stripe_customer_id);
      }
    }

    const invoices: any[] = [];
    for (const customerId of customerIds) {
      const list = await stripe.invoices.list({ customer: customerId, limit: 100 });
      for (const inv of list.data) {
        // Only include invoices the user actually paid (skip $0 / drafts)
        if (!inv.amount_paid || inv.amount_paid === 0) continue;
        const line = inv.lines?.data?.[0];
        invoices.push({
          id: inv.id,
          number: inv.number,
          status: inv.status,
          amount_paid: inv.amount_paid / 100,
          currency: inv.currency,
          created: inv.created ? new Date(inv.created * 1000).toISOString() : null,
          hosted_invoice_url: inv.hosted_invoice_url,
          pdf_url: inv.invoice_pdf,
          description: (line as any)?.description ?? null,
        });
      }
    }

    invoices.sort((a, b) => (b.created ?? "").localeCompare(a.created ?? ""));

    return new Response(JSON.stringify({ invoices }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("get-stripe-invoices error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
