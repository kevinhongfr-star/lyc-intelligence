/**
 * Stripe integration handler — raw fetch() only, no SDK.
 * 
 * Routes:
 *   POST /api/stripe/checkout         → Create checkout session (subscription OR credit pack)
 *   GET  /api/stripe/portal           → Create billing portal session
 *   POST /api/stripe/webhook          → Handle Stripe webhooks
 *   POST /api/stripe/checkout-credit  → Create one-time credit pack checkout
 * 
 * Env vars required:
 *   STRIPE_SECRET_KEY         — Stripe secret key
 *   STRIPE_WEBHOOK_SECRET     — Webhook signing secret
 *   STRIPE_PRICE_BASIC        — Price ID for basic tier
 *   STRIPE_PRICE_PRO          — Price ID for pro tier
 *   STRIPE_PACK_STARTER       — Credit pack 100 credits
 *   STRIPE_PACK_PROFESSIONAL  — Credit pack 500 credits
 *   STRIPE_PACK_ENTERPRISE    — Credit pack 1500 credits
 *   STRIPE_PACK_COUNCIL       — Credit pack 5000 credits (annual council)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'crypto';
import * as db from './supabaseRest.js';
import { getUserFromRequest } from './adminAuth.js';
import { applyCreditPackPurchase, type CreditPackPurchase } from './creditsHandler.js';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

interface CreditPack {
  credits: number;
  price: number;
  priceId: string;
}

/**
 * Credit pack price catalog. Values are Stripe Price IDs, looked up from
 * environment variables so they can be swapped without a code deploy.
 */
function getCreditPackCatalog(): Record<string, CreditPack> {
  return {
    starter: {
      credits: 10,
      price: 9.99,
      priceId: process.env.STRIPE_PACK_STARTER || '',
    },
    professional: {
      credits: 50,
      price: 39.99,
      priceId: process.env.STRIPE_PACK_PROFESSIONAL || '',
    },
    enterprise: {
      credits: 150,
      price: 99.99,
      priceId: process.env.STRIPE_PACK_ENTERPRISE || '',
    },
    council: {
      credits: 12,
      price: 179.99,
      priceId: process.env.STRIPE_PACK_COUNCIL || '',
    },
  };
}

/**
 * Reverse lookup: given a Stripe price id, return the matching pack
 * (credits amount) so the webhook handler knows how much to credit.
 */
function getPackByPriceId(lookupPriceId: string): CreditPack | null {
  const catalog = getCreditPackCatalog();
  for (const key of Object.keys(catalog)) {
    const pack = catalog[key];
    if (pack.priceId && pack.priceId === lookupPriceId) {
      return pack;
    }
  }
  return null;
}

function isStripeConfigured(): boolean {
  return Boolean(STRIPE_SECRET_KEY);
}

async function stripeApi(method: string, endpoint: string, body?: Record<string, unknown>): Promise<any> {
  const response = await fetch(`https://api.stripe.com${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body ? new URLSearchParams(body as any).toString() : undefined,
  });
  return response.json();
}

export async function handleStripe(req: VercelRequest, res: VercelResponse) {
  if (!isStripeConfigured()) {
    return res.status(503).json({ error: 'Stripe not configured' });
  }

  const pathArr = (req.query.path as string[]) || [];
  const action = pathArr[0] || '';

  try {
    if (action === 'checkout' && req.method === 'POST') {
      return handleCheckout(req, res);
    }
    if (action === 'checkout-credit' && req.method === 'POST') {
      return handleCreditPackCheckout(req, res);
    }
    if (action === 'portal' && req.method === 'GET') {
      return handlePortal(req, res);
    }
    if (action === 'webhook' && req.method === 'POST') {
      return handleWebhook(req, res);
    }

    return res.status(404).json({ error: `Unknown Stripe route: ${action}` });
  } catch (err: any) {
    console.error('[Stripe] Error:', err);
    return res.status(500).json({ error: 'Stripe error', details: err?.message });
  }
}

async function handleCheckout(req: VercelRequest, res: VercelResponse) {
  const { priceId, successUrl, cancelUrl } = req.body || {};

  if (!priceId) {
    return res.status(400).json({ error: 'priceId is required' });
  }

  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ error: error || 'Unauthorized' });
  }

  try {
    let profile = await db.selectOne('profiles', {
      column: 'id',
      value: user.id,
      select: 'id,email,stripe_customer_id,organization_id',
    });

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripeApi('POST', '/v1/customers', {
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;

      await db.update('profiles', { column: 'id', value: user.id }, {
        stripe_customer_id: customerId,
      });
    }

    const session = await stripeApi('POST', '/v1/checkout/sessions', {
      customer: customerId,
      'payment_method_types[0]': 'card',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      mode: 'subscription',
      success_url: successUrl || `${req.headers.origin}/dashboard?success=true`,
      cancel_url: cancelUrl || `${req.headers.origin}/settings?canceled=true`,
      'metadata[user_id]': user.id,
    });

    if (session.error) {
      throw new Error(session.error.message);
    }

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (e: any) {
    console.error('[Stripe] Checkout error:', e);
    return res.status(500).json({ error: 'Failed to create checkout session', details: e?.message });
  }
}

/**
 * One-time checkout for a credit pack purchase. Uses mode='payment'
 * (not subscription) and attaches org + user metadata so the webhook can
 * reconcile the balance correctly.
 */
async function handleCreditPackCheckout(req: VercelRequest, res: VercelResponse) {
  const { packKey, successUrl, cancelUrl } = req.body || {};

  if (!packKey) {
    return res.status(400).json({ error: 'packKey is required (starter, professional, enterprise, council)' });
  }

  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ error: error || 'Unauthorized' });
  }

  const catalog = getCreditPackCatalog();
  const pack = catalog[packKey];
  if (!pack || !pack.priceId) {
    return res.status(400).json({ error: 'Invalid credit pack' });
  }

  try {
    // Look up (or create) a Stripe customer and the user's org id.
    const profile = await db.selectOne('profiles', {
      column: 'id',
      value: user.id,
      select: 'id,email,stripe_customer_id,organization_id',
    });

    let customerId = profile?.stripe_customer_id;
    const orgId: string = profile?.organization_id;

    if (!customerId) {
      const customer = await stripeApi('POST', '/v1/customers', {
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;

      await db.update('profiles', { column: 'id', value: user.id }, {
        stripe_customer_id: customerId,
      });
    }

    const metadata: Record<string, string> = {
      user_id: user.id,
      pack_key: packKey,
      credits: String(pack.credits),
    };
    if (orgId) metadata.org_id = orgId;

    const session = await stripeApi('POST', '/v1/checkout/sessions', {
      customer: customerId,
      'payment_method_types[0]': 'card',
      'line_items[0][price]': pack.priceId,
      'line_items[0][quantity]': '1',
      mode: 'payment',
      success_url: successUrl || `${req.headers.origin}/credits?success=true`,
      cancel_url: cancelUrl || `${req.headers.origin}/credits?canceled=true`,
      ...Object.fromEntries(
        Object.entries(metadata).map(([k, v]) => [`metadata[${k}]`, v])
      ),
    });

    if (session.error) {
      throw new Error(session.error.message);
    }

    return res.status(200).json({
      url: session.url,
      sessionId: session.id,
      pack: { key: packKey, credits: pack.credits, price: pack.price },
    });
  } catch (e: any) {
    console.error('[Stripe] Credit pack checkout error:', e);
    return res.status(500).json({
      error: 'Failed to create credit pack checkout',
      details: e?.message,
    });
  }
}

async function handlePortal(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ error: error || 'Unauthorized' });
  }

  try {
    const profile = await db.selectOne('profiles', {
      column: 'id',
      value: user.id,
      select: 'id,stripe_customer_id',
    });

    if (!profile?.stripe_customer_id) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const session = await stripeApi('POST', '/v1/billing_portal/sessions', {
      customer: profile.stripe_customer_id,
      return_url: `${req.headers.origin}/settings`,
    });

    if (session.error) {
      throw new Error(session.error.message);
    }

    return res.status(200).json({ url: session.url });
  } catch (e: any) {
    console.error('[Stripe] Portal error:', e);
    return res.status(500).json({ error: 'Failed to create portal session', details: e?.message });
  }
}

async function handleWebhook(req: VercelRequest, res: VercelResponse) {
  try {
    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    let rawBody: string;
    if (typeof (req as any).rawBody === 'string') {
      rawBody = (req as any).rawBody;
    } else if (Buffer.isBuffer((req as any).rawBody)) {
      rawBody = (req as any).rawBody.toString('utf8');
    } else {
      rawBody = JSON.stringify(req.body);
    }

    if (STRIPE_WEBHOOK_SECRET) {
      const sigParts: Record<string, string> = {};
      for (const part of signature.split(',')) {
        const [k, v] = part.split('=');
        if (k && v !== undefined) sigParts[k] = v;
      }
      const timestamp = sigParts['t'];
      const sig = sigParts['v1'];
      if (!timestamp || !sig) {
        return res.status(400).json({ error: 'Invalid signature format' });
      }
      const expectedSig = createHmac('sha256', STRIPE_WEBHOOK_SECRET)
        .update(`${timestamp}.${rawBody}`)
        .digest('hex');
      if (sig !== expectedSig) {
        return res.status(400).json({ error: 'Invalid signature' });
      }
      const timestampNum = parseInt(timestamp, 10);
      if (Math.abs(Date.now() / 1000 - timestampNum) > 300) {
        return res.status(400).json({ error: 'Signature expired' });
      }
    }

    const event = req.body as any;

    if (!event || !event.type) {
      return res.status(400).json({ error: 'Invalid webhook event' });
    }

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (e: any) {
    console.error('[Stripe Webhook] Error:', e);
    return res.status(400).json({ error: 'Webhook error' });
  }
}

async function handleInvoicePaymentSucceeded(invoice: any): Promise<void> {
  const customerId = invoice.customer;
  const amountPaid = invoice.amount_paid / 100; // Convert cents to dollars

  const profile = await db.selectOne('profiles', {
    column: 'stripe_customer_id',
    value: customerId,
    select: 'id, email',
  });

  if (!profile) {
    console.error('[Stripe] Profile not found for invoice customer:', customerId);
    return;
  }

  try {
    await db.insert('credit_transactions', {
      user_id: profile.id,
      amount: 0,
      transaction_type: 'earn_credit',
      description: `Subscription payment received: $${amountPaid}`,
      stripe_session_id: invoice.id,
    });

    console.log(`[Stripe] Payment logged for user ${profile.id}: $${amountPaid}`);
  } catch (e) {
    console.error('[Stripe] Failed to log payment:', e);
  }
}

async function handleInvoicePaymentFailed(invoice: any): Promise<void> {
  const customerId = invoice.customer;
  const paymentIntent = invoice.payment_intent;

  const profile = await db.selectOne('profiles', {
    column: 'stripe_customer_id',
    value: customerId,
    select: 'id, email, tier, stripe_subscription_status',
  });

  if (!profile) {
    console.error('[Stripe] Profile not found for failed payment:', customerId);
    return;
  }

  await db.update('profiles', { column: 'id', value: profile.id }, {
    stripe_subscription_status: 'past_due',
  });

  console.log(`[Stripe] Payment failed for user ${profile.id} (${profile.email}) - status set to past_due`);

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'LYC Intelligence <support@lycintelligence.com>',
        to: profile.email,
        subject: 'Payment Failed - Your LYC Intelligence Subscription',
        html: `<p>Hello,</p>
          <p>We were unable to process your recent payment for your LYC Intelligence Council subscription.</p>
          <p>Your subscription has been placed on hold. You have 7 days to update your payment method before your account is downgraded to Member.</p>
          <p>Please update your payment details here: https://app.lycintelligence.com/settings/billing</p>
          <p>Thank you,</p>
          <p>The LYC Intelligence Team</p>`,
      }),
    });
    console.log(`[Stripe] Warning email sent to ${profile.email}`);
  } catch (e) {
    console.error('[Stripe] Failed to send payment failure email:', e);
  }
}

/**
 * Handle completed checkout sessions.
 * - mode='payment' with pack_key metadata → apply as credit pack purchase
 * - mode='subscription' → handled by customer.subscription.* events
 */
async function handleCheckoutSessionCompleted(session: any): Promise<void> {
  if (!session) return;

  const mode: string = session.mode;
  const metadata: Record<string, string> | null = session.metadata || null;
  const packKey = metadata?.pack_key;
  const userId = metadata?.user_id;
  const orgId = metadata?.org_id;
  const sessionId = session.id;

  // IDEMPOTENCY CHECK: Check if this session was already processed
  try {
    const existingTx = await db.selectOne('v2_credit_transactions', {
      column: 'idempotency_key',
      value: `stripe_session:${sessionId}`,
      select: 'id',
    });
    
    if (existingTx) {
      console.log(`[Stripe] Session ${sessionId} already processed, skipping`);
      return;
    }
  } catch (e) {
    // Table might not exist yet, continue without idempotency check
  }

  if (mode === 'payment' && packKey && userId) {
    const lineItems = session.line_items?.data || [];
    let priceId: string | null = metadata?.price_id || null;

    if (!priceId && lineItems.length > 0) {
      priceId = lineItems[0]?.price?.id || null;
    }

    const pack = priceId ? getPackByPriceId(priceId) : null;
    const credits = pack ? pack.credits : Number(metadata?.credits || 0);

    if (credits <= 0) {
      console.error('[Stripe] Credit pack checkout completed but credits amount is 0 or unknown');
      return;
    }

    const purchase: CreditPackPurchase = {
      priceId: priceId || packKey,
      credits,
      sessionId,
      userId,
      orgId: orgId || null,
    };

    const result = await applyCreditPackPurchase(purchase);
    if (!result.success) {
      console.error('[Stripe] applyCreditPackPurchase failed:', result.error);
    } else {
      console.log(`[Stripe] Credit pack applied to ${result.source}: +${credits} credits`);
    }
    return;
  }

  console.log('[Stripe] checkout.session.completed (non-pack):', session.id);
}

async function handleSubscriptionUpdate(subscription: any) {
  const customerId = subscription.customer;
  const status = subscription.status;
  const subscriptionId = subscription.id;

  const priceId = subscription.items?.data?.[0]?.price?.id;
  let tier = 'member';
  if (priceId === process.env.STRIPE_PRICE_COUNCIL) tier = 'council';
  else if (priceId === process.env.STRIPE_PRICE_PRO) tier = 'pro';
  else if (priceId === process.env.STRIPE_PRICE_BASIC) tier = 'basic';

  const profile = await db.selectOne('profiles', {
    column: 'stripe_customer_id',
    value: customerId,
    select: 'id, organization_id',
  });

  if (!profile) {
    console.error('[Stripe] User not found for customer:', customerId);
    return;
  }

  const updates: Record<string, unknown> = {
    stripe_subscription_status: status,
    stripe_subscription_id: subscriptionId,
  };

  if (status === 'active') {
    updates.tier = tier;
    await grantDailyCreditsForTier(profile.id, tier);
  } else if (status === 'canceled') {
    updates.tier = 'member';
    await grantDailyCreditsForTier(profile.id, 'member');
  } else if (status === 'past_due') {
    updates.tier = tier;
  }

  await db.update('profiles', { column: 'id', value: profile.id }, updates);
}

async function grantDailyCreditsForTier(userId: string, tier: string): Promise<void> {
  const dailyCredits = tier === 'council' ? 5 : 2;
  
  try {
    const creditData = await db.selectOne('credits', {
      column: 'user_id',
      value: userId,
      select: 'balance, total_earned',
    });

    if (creditData) {
      const newBalance = Number(creditData.balance || 0) + dailyCredits;
      const newTotalEarned = Number(creditData.total_earned || 0) + dailyCredits;

      await db.update('credits', { column: 'user_id', value: userId }, {
        balance: newBalance,
        total_earned: newTotalEarned,
        tier,
        updated_at: new Date().toISOString(),
      });

      await db.insert('credit_transactions', {
        user_id: userId,
        amount: dailyCredits,
        transaction_type: 'earn_credit',
        description: `Daily credit allocation (${tier} tier)`,
      });
    } else {
      await db.insert('credits', {
        user_id: userId,
        balance: dailyCredits,
        total_earned: dailyCredits,
        total_spent: 0,
        tier,
        created_at: new Date().toISOString(),
      });

      await db.insert('credit_transactions', {
        user_id: userId,
        amount: dailyCredits,
        transaction_type: 'earn_credit',
        description: `Initial credit allocation (${tier} tier)`,
      });
    }
  } catch (e) {
    console.error('[Stripe] Failed to grant daily credits:', e);
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  const customerId = subscription.customer;

  const profile = await db.selectOne('profiles', {
    column: 'stripe_customer_id',
    value: customerId,
    select: 'id',
  });

  if (!profile) return;

  await db.update('profiles', { column: 'id', value: profile.id }, {
    tier: 'member',
    stripe_subscription_status: 'canceled',
  });

  await grantDailyCreditsForTier(profile.id, 'member');
}

export async function webhookHandler(req: VercelRequest, res: VercelResponse) {
  return handleStripe(req, res);
}
