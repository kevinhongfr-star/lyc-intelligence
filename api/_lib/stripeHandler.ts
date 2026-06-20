import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const STRIPE_PRICES = {
  basic: process.env.STRIPE_PRICE_BASIC || '',
  pro: process.env.STRIPE_PRICE_PRO || '',
  council: process.env.STRIPE_PRICE_COUNCIL || ''
};
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

const TIER_CREDITS = {
  basic: 50,
  pro: 200,
  council: 999999
};

// POST /api/stripe/checkout - Create checkout session
export async function handleStripe(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    return handleCheckout(req, res);
  } else if (req.method === 'GET') {
    return handlePortal(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleCheckout(req: VercelRequest, res: VercelResponse) {
  const { tier } = req.body;

  if (!tier || !STRIPE_PRICES[tier as keyof typeof STRIPE_PRICES]) {
    return res.status(400).json({ error: 'Invalid tier' });
  }

  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get user email from database
    const { data: userData } = await supabase!
      .from('user_profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create Stripe checkout session
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'payment_method_types[0]': 'card',
        'line_items[0][price]': STRIPE_PRICES[tier as keyof typeof STRIPE_PRICES],
        'line_items[0][quantity]': '1',
        'mode': 'subscription',
        'success_url': `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?success=true`,
        'cancel_url': `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?canceled=true`,
        'customer_email': userData.email,
        'metadata[user_id]': userId,
        'metadata[tier]': tier
      })
    });

    const session = await response.json();

    if (session.error) {
      throw new Error(session.error.message);
    }

    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error('[Stripe] Checkout error:', e);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}

async function handlePortal(req: VercelRequest, res: VercelResponse) {
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get Stripe customer ID from database
    const { data: userData } = await supabase!
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (!userData?.stripe_customer_id) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    // Create Stripe portal session
    const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'customer': userData.stripe_customer_id,
        'return_url': `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`
      })
    });

    const session = await response.json();

    if (session.error) {
      throw new Error(session.error.message);
    }

    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error('[Stripe] Portal error:', e);
    return res.status(500).json({ error: 'Failed to create portal session' });
  }
}

// POST /api/stripe/webhook - Handle Stripe webhooks
export async function webhookHandler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'] as string;
  
  try {
    // Verify webhook signature
    const stripeEvent = req.body; // In production, use stripe.webhooks.constructEvent
    
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

  if (!userId) {
    // Find user by Stripe customer ID
    const { data: userData } = await supabase!
      .from('user_profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (!userData) {
      console.error('[Stripe] User not found for customer:', customerId);
      return;
    }
  }

  const finalUserId = userId || (await supabase!
    .from('user_profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single())?.data?.id;

  if (!finalUserId) return;

  // Update user tier
  await supabase!
    .from('user_profiles')
    .update({ tier, updated_at: new Date().toISOString() })
    .eq('id', finalUserId);

  // Grant tier credits
  const tierCredits = tier === 'free' ? 0 : TIER_CREDITS[tier as keyof typeof TIER_CREDITS] || 0;
  
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

    // Add to balance (read-then-update since Supabase JS SDK has no raw SQL)
    const { data: currentCredits } = await supabase!
      .from('credits')
      .select('balance, total_earned')
      .eq('user_id', finalUserId)
      .single();

    await supabase!
      .from('credits')
      .update({
        balance: (currentCredits?.balance || 0) + tierCredits,
        total_earned: (currentCredits?.total_earned || 0) + tierCredits
      })
      .eq('user_id', finalUserId);
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  const customerId = subscription.customer;

  // Find user and revert to free tier
  const { data: userData } = await supabase!
    .from('user_profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!userData) return;

  await supabase!
    .from('user_profiles')
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
  
  // Find user
  const { data: userData } = await supabase!
    .from('user_profiles')
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!userData) return;

  // Log payment failure (in production, send warning email)
  console.log('[Stripe] Payment failed for user:', userData.email);

  // Add grace period flag (7 days)
  await supabase!
    .from('user_profiles')
    .update({ 
      payment_grace_period: true,
      grace_period_expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })
    .eq('id', userData.id);
}

async function handlePaymentSucceeded(invoice: any) {
  const customerId = invoice.customer;
  
  // Clear grace period if it was set
  await supabase!
    .from('user_profiles')
    .update({ 
      payment_grace_period: false,
      grace_period_expires: null
    })
    .eq('stripe_customer_id', customerId);
}
