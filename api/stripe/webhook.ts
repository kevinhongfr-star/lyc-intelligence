import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

const TIER_CREDITS: Record<string, number> = {
  basic: 50,
  pro: 200,
  council: 999999
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'] as string;

  try {
    const stripeEvent = req.body;

    switch (stripeEvent.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(stripeEvent.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(stripeEvent.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(stripeEvent.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(stripeEvent.data.object);
        break;
    }

    return res.status(200).json({ received: true });
  } catch (e) {
    console.error('[Stripe Webhook] Error:', e);
    return res.status(400).json({ error: 'Webhook error' });
  }
}

async function handleSubscriptionUpdate(subscription: any) {
  const customerId = subscription.customer;
  const tier = subscription.metadata?.tier || 'free';
  const userId = subscription.metadata?.user_id;

  let finalUserId = userId;

  if (!finalUserId) {
    const { data: userData } = await supabase!
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (!userData) {
      console.error('[Stripe] User not found for customer:', customerId);
      return;
    }
    finalUserId = userData.id;
  }

  // Update user tier
  await supabase!
    .from('profiles')
    .update({ tier, updated_at: new Date().toISOString() })
    .eq('id', finalUserId);

  // Grant tier credits
  const tierCredits = tier === 'free' ? 0 : TIER_CREDITS[tier] || 0;

  if (tierCredits > 0) {
    await supabase!
      .from('credits')
      .update({
        tier,
        tier_credits_per_month: tierCredits,
        billing_period_start: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('user_id', finalUserId);

    // Record tier grant transaction
    await supabase!
      .from('credit_transactions')
      .insert({
        user_id: finalUserId,
        amount: tierCredits,
        transaction_type: 'tier_grant',
        description: `${tierCredits} credits from ${tier} subscription`
      });

    // Add to balance using RPC or manual read-update (supabase!.sql is not valid)
    // Read current balance first
    const { data: creditData } = await supabase!
      .from('credits')
      .select('balance, total_earned')
      .eq('user_id', finalUserId)
      .single();

    if (creditData) {
      await supabase!
        .from('credits')
        .update({
          balance: creditData.balance + tierCredits,
          total_earned: creditData.total_earned + tierCredits
        })
        .eq('user_id', finalUserId);
    }
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  const customerId = subscription.customer;

  const { data: userData } = await supabase!
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!userData) return;

  await supabase!
    .from('profiles')
    .update({ tier: 'free', updated_at: new Date().toISOString() })
    .eq('id', userData.id);

  await supabase!
    .from('credits')
    .update({
      tier: 'free',
      tier_credits_per_month: 0,
      billing_period_start: null,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userData.id);
}

async function handlePaymentFailed(invoice: any) {
  const customerId = invoice.customer;

  const { data: userData } = await supabase!
    .from('profiles')
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!userData) return;

  console.log('[Stripe] Payment failed for user:', userData.email);

  await supabase!
    .from('profiles')
    .update({
      payment_grace_period: true,
      grace_period_expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })
    .eq('id', userData.id);
}

async function handlePaymentSucceeded(invoice: any) {
  const customerId = invoice.customer;

  await supabase!
    .from('profiles')
    .update({
      payment_grace_period: false,
      grace_period_expires: null
    })
    .eq('stripe_customer_id', customerId);
}
