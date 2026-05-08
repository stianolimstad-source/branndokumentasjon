import { createClient } from 'npm:@supabase/supabase-js@2';
import { getPaddleClient, gatewayFetch, type PaddleEnv } from '../_shared/paddle.ts';

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

    const { environment, action } = await req.json();
    const env = (environment || 'sandbox') as PaddleEnv;
    const act = (action || 'cancel') as 'cancel' | 'resume';

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { data: sub } = await admin
      .from('subscriptions')
      .select('paddle_subscription_id, status')
      .eq('user_id', userId)
      .eq('environment', env)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub?.paddle_subscription_id) throw new Error('Ingen aktivt abonnement funnet');

    const subId = sub.paddle_subscription_id as string;

    if (act === 'cancel') {
      const paddle = getPaddleClient(env);
      await paddle.subscriptions.cancel(subId, { effectiveFrom: 'next_billing_period' });
    } else {
      // Remove scheduled cancellation
      const res = await gatewayFetch(env, `/subscriptions/${subId}`, {
        method: 'PATCH',
        body: JSON.stringify({ scheduled_change: null }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Paddle resume failed: ${text}`);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('cancel-subscription error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
