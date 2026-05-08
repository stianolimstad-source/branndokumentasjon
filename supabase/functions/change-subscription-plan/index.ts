import { createClient } from 'npm:@supabase/supabase-js@2';
import { gatewayFetch, type PaddleEnv } from '../_shared/paddle.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Not authenticated');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) throw new Error('Not authenticated');
    const userId = claimsData.claims.sub as string;

    const { environment, newPriceId } = await req.json();
    if (!newPriceId) throw new Error('newPriceId is required');
    const env = (environment || 'sandbox') as PaddleEnv;

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { data: sub } = await admin
      .from('subscriptions')
      .select('paddle_subscription_id, price_id, status')
      .eq('user_id', userId)
      .eq('environment', env)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub?.paddle_subscription_id) throw new Error('Ingen aktivt abonnement funnet');
    if (sub.price_id === newPriceId) throw new Error('Du er allerede på denne planen');

    // Resolve external_id -> Paddle price id
    const priceRes = await gatewayFetch(env, `/prices?external_id=${encodeURIComponent(newPriceId)}`);
    const priceData = await priceRes.json();
    if (!priceData.data?.length) throw new Error(`Price not found: ${newPriceId}`);
    const paddlePriceId = priceData.data[0].id as string;

    // Upgrade (monthly -> yearly) bills immediately with proration.
    // Downgrade (yearly -> monthly) takes effect at next renewal.
    const isUpgrade = sub.price_id === 'branndok_pro_monthly' && newPriceId === 'branndok_pro_yearly';
    const prorationBillingMode = isUpgrade ? 'prorated_immediately' : 'do_not_bill';

    const res = await gatewayFetch(env, `/subscriptions/${sub.paddle_subscription_id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        items: [{ price_id: paddlePriceId, quantity: 1 }],
        proration_billing_mode: prorationBillingMode,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Paddle update failed: ${text}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('change-subscription-plan error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
