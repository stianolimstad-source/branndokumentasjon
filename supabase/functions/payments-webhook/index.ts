import { createClient } from 'npm:@supabase/supabase-js@2';
import { verifyWebhook, EventName, type PaddleEnv } from '../_shared/paddle.ts';

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
  }
  return _supabase;
}

async function notify(userId: string, type: string, title: string, message: string) {
  try {
    await getSupabase().from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
    });
  } catch (e) {
    console.error('notify error', e);
  }
}

async function findUserIdBySubscription(subscriptionId: string): Promise<string | null> {
  const { data } = await getSupabase()
    .from('subscriptions')
    .select('user_id')
    .eq('paddle_subscription_id', subscriptionId)
    .maybeSingle();
  return (data?.user_id as string) ?? null;
}

async function findUserIdByCustomer(customerId: string): Promise<string | null> {
  const { data } = await getSupabase()
    .from('subscriptions')
    .select('user_id')
    .eq('paddle_customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.user_id as string) ?? null;
}

async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, customData } = data;
  const userId = customData?.userId;
  if (!userId) {
    console.error('No userId in customData');
    return;
  }
  const item = items[0];
  const priceId = item.price.importMeta?.externalId;
  const productId = item.product.importMeta?.externalId;
  if (!priceId || !productId) {
    console.warn('Skipping subscription: missing importMeta.externalId', {
      rawPriceId: item.price.id,
      rawProductId: item.product.id,
    });
    return;
  }
  await getSupabase().from('subscriptions').upsert({
    user_id: userId,
    paddle_subscription_id: id,
    paddle_customer_id: customerId,
    product_id: productId,
    price_id: priceId,
    status,
    current_period_start: currentBillingPeriod?.startsAt,
    current_period_end: currentBillingPeriod?.endsAt,
    environment: env,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'paddle_subscription_id' });

  await notify(
    userId,
    'subscription_started',
    status === 'trialing' ? 'Prøveperiode startet' : 'Abonnement aktivert',
    status === 'trialing'
      ? 'Velkommen! Du har nå 14 dagers gratis prøveperiode.'
      : 'Takk for kjøpet! Abonnementet ditt er aktivt.'
  );
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const { id, status, currentBillingPeriod, scheduledChange, items } = data;
  const update: Record<string, any> = {
    status,
    current_period_start: currentBillingPeriod?.startsAt,
    current_period_end: currentBillingPeriod?.endsAt,
    cancel_at_period_end: scheduledChange?.action === 'cancel',
    updated_at: new Date().toISOString(),
  };
  // Sync price/product on plan change
  const item = items?.[0];
  const priceId = item?.price?.importMeta?.externalId;
  const productId = item?.product?.importMeta?.externalId;
  if (priceId) update.price_id = priceId;
  if (productId) update.product_id = productId;

  await getSupabase().from('subscriptions')
    .update(update)
    .eq('paddle_subscription_id', id)
    .eq('environment', env);

  // Notify on past_due
  if (status === 'past_due') {
    const userId = await findUserIdBySubscription(id);
    if (userId) {
      await notify(
        userId,
        'payment_past_due',
        'Betaling mislyktes',
        'Vi fikk ikke gjennomført fornyelse av abonnementet. Oppdater betalingsmåten i kundeportalen for å unngå tap av tilgang.'
      );
    }
  }
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  await getSupabase().from('subscriptions')
    .update({ status: 'canceled', updated_at: new Date().toISOString() })
    .eq('paddle_subscription_id', data.id)
    .eq('environment', env);

  const userId = await findUserIdBySubscription(data.id);
  if (userId) {
    await notify(
      userId,
      'subscription_canceled',
      'Abonnement oppsagt',
      'Abonnementet er sagt opp. Du beholder tilgang ut inneværende betalingsperiode.'
    );
  }
}

async function handleTransactionPaymentFailed(data: any, env: PaddleEnv) {
  const customerId = data.customerId;
  if (!customerId) return;
  const userId = await findUserIdByCustomer(customerId);
  if (!userId) return;

  // Mark related subscription past_due if applicable
  if (data.subscriptionId) {
    await getSupabase().from('subscriptions')
      .update({ status: 'past_due', updated_at: new Date().toISOString() })
      .eq('paddle_subscription_id', data.subscriptionId)
      .eq('environment', env);
  }

  await notify(
    userId,
    'payment_failed',
    'Betaling mislyktes',
    'En betaling ble avvist. Oppdater betalingsmåten i kundeportalen for å beholde tilgangen.'
  );
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const url = new URL(req.url);
  const env = (url.searchParams.get('env') || 'sandbox') as PaddleEnv;
  try {
    const event = await verifyWebhook(req, env);
    switch (event.eventType) {
      case EventName.SubscriptionCreated:
        await handleSubscriptionCreated(event.data, env);
        break;
      case EventName.SubscriptionUpdated:
        await handleSubscriptionUpdated(event.data, env);
        break;
      case EventName.SubscriptionCanceled:
        await handleSubscriptionCanceled(event.data, env);
        break;
      case EventName.TransactionPaymentFailed:
        await handleTransactionPaymentFailed(event.data, env);
        break;
      default:
        console.log('Unhandled event:', event.eventType);
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Webhook error:', e);
    return new Response('Webhook error', { status: 400 });
  }
});
