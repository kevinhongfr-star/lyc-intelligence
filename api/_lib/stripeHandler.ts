/**
 * Stripe integration handler — raw fetch() only, no SDK.
 * 
 * Routes:
 *   POST /api/stripe/checkout    → Create checkout session
 *   GET  /api/stripe/portal      → Create billing portal session
 *   POST /api/stripe/webhook     → Handle Stripe webhooks
 * 
 * Env vars required:
 *   STRIPE_SECRET_KEY    — Stripe secret key
 *   STRIPE_PRICE_BASIC   — Price ID for basic tier
 *   STRIPE_PRICE_PRO     — Price ID for pro tier
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as db from './supabaseRest.js';
import { getUserFromRequest } from './adminAuth.js';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

function isStripeConfigured(): boolean {
  return Boolean(STRIPE_SECRET_KEY);
}

async function stripeApi(method: string, endpoint: string, body?: Record<string, any>): Promise<any> {
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
    // Check if user already has a Stripe customer
    let profile = await db.selectOne('profiles', {
      column: 'id',
      value: user.id,
      select: 'id,email,stripe_customer_id',
    });

    let customerId = profile?.stripe_customer_id;

    // Create customer if needed
    if (!customerId) {
      const customer = await stripeApi('POST', '/v1/customers', {
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;

      // Save customer ID to profile
      await db.update('profiles', { column: 'id', value: user.id }, {
        stripe_customer_id: customerId,
      });
    }

    // Create checkout session
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
    // In production, verify webhook signature with STRIPE_WEBHOOK_SECRET
    // For now, just process the event
    const event = req.body;

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_failed':
        console.log('[Stripe Webhook] Payment failed:', event.data.object.customer);
        break;
      case 'invoice.payment_succeeded':
        console.log('[Stripe Webhook] Payment succeeded:', event.data.object.customer);
        break;
    }

    return res.status(200).json({ received: true });
  } catch (e: any) {
    console.error('[Stripe Webhook] Error:', e);
    return res.status(400).json({ error: 'Webhook error' });
  }
}

async function handleSubscriptionUpdate(subscription: any) {
  const customerId = subscription.customer;
  const status = subscription.status;
  
  // Determine tier from price
  const priceId = subscription.items?.data?.[0]?.price?.id;
  let tier = 'free';
  // Map price IDs to tiers (configure via env vars)
  if (priceId === process.env.STRIPE_PRICE_PRO) tier = 'pro';
  else if (priceId === process.env.STRIPE_PRICE_BASIC) tier = 'basic';

  // Find user by customer ID
  const profile = await db.selectOne('profiles', {
    column: 'stripe_customer_id',
    value: customerId,
    select: 'id',
  });

  if (!profile) {
    console.error('[Stripe] User not found for customer:', customerId);
    return;
  }

  // Update tier and subscription status
  const updates: any = {
    stripe_subscription_status: status,
  };
  
  if (status === 'active') {
    updates.tier = tier;
  } else if (status === 'canceled' || status === 'past_due') {
    updates.tier = 'free';
  }

  await db.update('profiles', { column: 'id', value: profile.id }, updates);
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
    tier: 'free',
    stripe_subscription_status: 'canceled',
  });
}

export async function webhookHandler(req: VercelRequest, res: VercelResponse) {
  return handleStripe(req, res);
}
