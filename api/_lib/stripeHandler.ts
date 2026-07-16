/**
 * Stripe integration handler — raw fetch() only, no SDK.
 * 
 * Routes:
 *   POST /api/stripe/checkout         → Create checkout session (subscription OR credit pack)
 *   GET  /api/stripe/portal           → Create billing portal session
 *   POST /api/stripe/webhook          → Handle Stripe webhooks
 *   POST /api/stripe/checkout-credit  → Create one-time credit pack checkout
 *   POST /api/stripe/checkout-subscription → Create subscription checkout (Council tiers)
 * 
 * Env vars required:
 *   STRIPE_SECRET_KEY         — Stripe secret key
 *   STRIPE_WEBHOOK_SECRET     — Webhook signing secret
 *   STRIPE_PRICE_BASIC        — Price ID for basic tier
 *   STRIPE_PRICE_PRO          — Price ID for pro tier
 *   STRIPE_PACK_STARTER       — Credit pack 10 credits (USD)
 *   STRIPE_PACK_PROFESSIONAL  — Credit pack 50 credits (USD)
 *   STRIPE_PACK_ENTERPRISE    — Credit pack 150 credits (USD)
 *   STRIPE_PACK_STARTER_CNY   — Credit pack 10 credits (CNY)
 *   STRIPE_PACK_PROFESSIONAL_CNY — Credit pack 50 credits (CNY)
 *   STRIPE_PACK_ENTERPRISE_CNY — Credit pack 150 credits (CNY)
 *   STRIPE_COUNCIL_FOUNDING   — Council Founding tier (annual)
 *   STRIPE_COUNCIL_INDIVIDUAL — Council Individual tier (annual)
 *   STRIPE_COUNCIL_CORPORATE  — Council Corporate tier (annual)
 *   STRIPE_COUNCIL_PE_PARTNER — Council PE Partner tier (annual)
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
  currency: 'USD' | 'CNY';
}

interface SubscriptionTier {
  id: string;
  name: string;
  priceId: string;
  currency: 'USD' | 'CNY';
  price: number;
  councilCreditsPerYear: number;
  coachingSessionsPerYear: number;
  dailyDexCredits: number;
  memberSeats: number;
}

function getCurrencyFromLocale(locale: string | undefined): 'USD' | 'CNY' {
  if (!locale) return 'USD';
  const normalized = locale.toLowerCase();
  if (normalized.includes('zh') || normalized.includes('cn') || normalized.includes('chinese')) {
    return 'CNY';
  }
  return 'USD';
}

function getCreditPackCatalog(currency: 'USD' | 'CNY'): Record<string, CreditPack> {
  const isCNY = currency === 'CNY';
  return {
    starter: {
      credits: 10,
      price: isCNY ? 79 : 9.99,
      priceId: isCNY ? process.env.STRIPE_PACK_STARTER_CNY || '' : process.env.STRIPE_PACK_STARTER || '',
      currency,
    },
    professional: {
      credits: 50,
      price: isCNY ? 319 : 39.99,
      priceId: isCNY ? process.env.STRIPE_PACK_PROFESSIONAL_CNY || '' : process.env.STRIPE_PACK_PROFESSIONAL || '',
      currency,
    },
    enterprise: {
      credits: 150,
      price: isCNY ? 799 : 99.99,
      priceId: isCNY ? process.env.STRIPE_PACK_ENTERPRISE_CNY || '' : process.env.STRIPE_PACK_ENTERPRISE || '',
      currency,
    },
  };
}

function getCouncilSubscriptionTiers(currency: 'USD' | 'CNY'): Record<string, SubscriptionTier> {
  const isCNY = currency === 'CNY';
  return {
    founding: {
      id: 'founding',
      name: 'Council Founding',
      priceId: isCNY ? process.env.STRIPE_COUNCIL_FOUNDING || '' : process.env.STRIPE_COUNCIL_FOUNDING_USD || '',
      currency,
      price: isCNY ? 2800 : 350,
      councilCreditsPerYear: 12,
      coachingSessionsPerYear: 12,
      dailyDexCredits: 5,
      memberSeats: 1,
    },
    individual: {
      id: 'individual',
      name: 'Council Individual',
      priceId: isCNY ? process.env.STRIPE_COUNCIL_INDIVIDUAL || '' : process.env.STRIPE_COUNCIL_INDIVIDUAL_USD || '',
      currency,
      price: isCNY ? 3800 : 475,
      councilCreditsPerYear: 12,
      coachingSessionsPerYear: 12,
      dailyDexCredits: 5,
      memberSeats: 1,
    },
    corporate: {
      id: 'corporate',
      name: 'Council Corporate',
      priceId: isCNY ? process.env.STRIPE_COUNCIL_CORPORATE || '' : process.env.STRIPE_COUNCIL_CORPORATE_USD || '',
      currency,
      price: isCNY ? 12000 : 1500,
      councilCreditsPerYear: 48,
      coachingSessionsPerYear: 48,
      dailyDexCredits: 25,
      memberSeats: 5,
    },
    'pe-partner': {
      id: 'pe-partner',
      name: 'Council PE Partner',
      priceId: isCNY ? process.env.STRIPE_COUNCIL_PE_PARTNER || '' : process.env.STRIPE_COUNCIL_PE_PARTNER_USD || '',
      currency,
      price: isCNY ? 25000 : 3125,
      councilCreditsPerYear: 100,
      coachingSessionsPerYear: 100,
      dailyDexCredits: 50,
      memberSeats: 3,
    },
  };
}

function getPackByPriceId(lookupPriceId: string): CreditPack | null {
  for (const currency of ['USD', 'CNY'] as const) {
    const catalog = getCreditPackCatalog(currency);
    for (const key of Object.keys(catalog)) {
      const pack = catalog[key];
      if (pack.priceId && pack.priceId === lookupPriceId) {
        return pack;
      }
    }
  }
  return null;
}

function getSubscriptionTierByPriceId(lookupPriceId: string): SubscriptionTier | null {
  for (const currency of ['USD', 'CNY'] as const) {
    const tiers = getCouncilSubscriptionTiers(currency);
    for (const key of Object.keys(tiers)) {
      const tier = tiers[key];
      if (tier.priceId && tier.priceId === lookupPriceId) {
        return tier;
      }
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
    if (action === 'checkout-subscription' && req.method === 'POST') {
      return handleSubscriptionCheckout(req, res);
    }
    if (action === 'checkout-course' && req.method === 'POST') {
      return handleCourseCheckout(req, res);
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
  const { priceId, successUrl, cancelUrl, locale } = req.body || {};

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

    const tier = getSubscriptionTierByPriceId(priceId);
    const mode = tier ? 'subscription' : 'payment';

    const session = await stripeApi('POST', '/v1/checkout/sessions', {
      customer: customerId,
      'payment_method_types[0]': 'card',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      mode,
      success_url: successUrl || `${req.headers.origin}/dashboard?success=true`,
      cancel_url: cancelUrl || `${req.headers.origin}/settings?canceled=true`,
      'metadata[user_id]': user.id,
      'metadata[tier_id]': tier?.id || '',
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

async function handleCreditPackCheckout(req: VercelRequest, res: VercelResponse) {
  const { packKey, successUrl, cancelUrl, locale } = req.body || {};

  if (!packKey) {
    return res.status(400).json({ error: 'packKey is required (starter, professional, enterprise)' });
  }

  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ error: error || 'Unauthorized' });
  }

  const currency = getCurrencyFromLocale(locale);
  const catalog = getCreditPackCatalog(currency);
  const pack = catalog[packKey];
  
  if (!pack || !pack.priceId) {
    return res.status(400).json({ error: `Invalid credit pack for ${currency}` });
  }

  try {
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
      currency,
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
      pack: { key: packKey, credits: pack.credits, price: pack.price, currency },
    });
  } catch (e: any) {
    console.error('[Stripe] Credit pack checkout error:', e);
    return res.status(500).json({
      error: 'Failed to create credit pack checkout',
      details: e?.message,
    });
  }
}

async function handleSubscriptionCheckout(req: VercelRequest, res: VercelResponse) {
  const { tierId, successUrl, cancelUrl, locale } = req.body || {};

  if (!tierId) {
    return res.status(400).json({ error: 'tierId is required (founding, individual, corporate, pe-partner)' });
  }

  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ error: error || 'Unauthorized' });
  }

  const currency = getCurrencyFromLocale(locale);
  const tiers = getCouncilSubscriptionTiers(currency);
  const tier = tiers[tierId];

  if (!tier || !tier.priceId) {
    return res.status(400).json({ error: `Invalid subscription tier for ${currency}` });
  }

  try {
    const profile = await db.selectOne('profiles', {
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

    const metadata: Record<string, string> = {
      user_id: user.id,
      tier_id: tierId,
      currency,
      council_credits: String(tier.councilCreditsPerYear),
      coaching_sessions: String(tier.coachingSessionsPerYear),
      daily_dex_credits: String(tier.dailyDexCredits),
      member_seats: String(tier.memberSeats),
    };

    const session = await stripeApi('POST', '/v1/checkout/sessions', {
      customer: customerId,
      'payment_method_types[0]': 'card',
      'line_items[0][price]': tier.priceId,
      'line_items[0][quantity]': '1',
      mode: 'subscription',
      success_url: successUrl || `${req.headers.origin}/dashboard?success=true`,
      cancel_url: cancelUrl || `${req.headers.origin}/council/membership?canceled=true`,
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
      tier: { id: tierId, name: tier.name, price: tier.price, currency },
    });
  } catch (e: any) {
    console.error('[Stripe] Subscription checkout error:', e);
    return res.status(500).json({
      error: 'Failed to create subscription checkout',
      details: e?.message,
    });
  }
}

async function handleCourseCheckout(req: VercelRequest, res: VercelResponse) {
  const {
    courseId,
    enrollmentType = 'individual',
    teamEmails = [],
    discountCode,
    successUrl,
    cancelUrl,
    locale,
  } = req.body || {};

  if (!courseId) {
    return res.status(400).json({ error: 'courseId is required' });
  }

  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ error: error || 'Unauthorized' });
  }

  const currency = getCurrencyFromLocale(locale);

  try {
    const course = await db.selectOne('lms_courses', {
      column: 'id',
      value: courseId,
      select: 'id, title, slug, price_cny, price_usd, team_price_cny, team_price_usd, team_max_seats',
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const isTeam = enrollmentType === 'team';
    const priceAmount = isTeam
      ? (currency === 'CNY' ? course.team_price_cny : course.team_price_usd)
      : (currency === 'CNY' ? course.price_cny : course.price_usd);

    if (!priceAmount) {
      return res.status(400).json({ error: `Price not available for ${currency}` });
    }

    const profile = await db.selectOne('profiles', {
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

    const unitAmount = Math.round(priceAmount * 100);
    const currencyLower = currency.toLowerCase();

    const metadata: Record<string, string> = {
      user_id: user.id,
      course_id: courseId,
      course_title: course.title,
      course_slug: course.slug,
      enrollment_type: enrollmentType,
      currency,
    };
    if (isTeam && teamEmails?.length) {
      metadata.team_emails = JSON.stringify(teamEmails.filter(Boolean));
      metadata.team_seat_count = String(teamEmails.filter(Boolean).length);
    }
    if (discountCode) metadata.discount_code = discountCode;
    if (profile?.organization_id) metadata.org_id = profile.organization_id;

    const session = await stripeApi('POST', '/v1/checkout/sessions', {
      customer: customerId,
      'payment_method_types[0]': 'card',
      'line_items[0][price_data][currency]': currencyLower,
      'line_items[0][price_data][product_data][name]': isTeam
        ? `${course.title} — Team Enrollment`
        : course.title,
      'line_items[0][price_data][unit_amount]': String(unitAmount),
      'line_items[0][quantity]': '1',
      mode: 'payment',
      success_url: successUrl || `${req.headers.origin}/academy/my-courses?enrolled=true`,
      cancel_url: cancelUrl || `${req.headers.origin}/academy/course/${course.slug}?canceled=true`,
      ...Object.fromEntries(
        Object.entries(metadata).map(([k, v]) => [`metadata[${k}]`, v])
      ),
    });

    if (session.error) {
      throw new Error(session.error.message);
    }

    return res.status(200).json({
      checkoutUrl: session.url,
      sessionId: session.id,
      course: {
        id: courseId,
        title: course.title,
        price: priceAmount,
        currency,
        enrollmentType,
      },
    });
  } catch (e: any) {
    console.error('[Stripe] Course checkout error:', e);
    return res.status(500).json({
      error: 'Failed to create course checkout',
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
  const amountPaid = invoice.amount_paid / 100;

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
      description: `Subscription payment received`,
      stripe_session_id: invoice.id,
    });

    console.log(`[Stripe] Payment logged for user ${profile.id}`);
  } catch (e) {
    console.error('[Stripe] Failed to log payment:', e);
  }
}

async function handleInvoicePaymentFailed(invoice: any): Promise<void> {
  const customerId = invoice.customer;

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
        subject: 'Payment Failed - Your LYC Intelligence Council Membership',
        html: `<p>Hello,</p>
          <p>We were unable to process your recent payment for your LYC Intelligence Council membership.</p>
          <p>Your membership has been placed on hold. You have 7 days to update your payment method before your account is downgraded to Member.</p>
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

async function handleCheckoutSessionCompleted(session: any): Promise<void> {
  if (!session) return;

  const mode: string = session.mode;
  const metadata: Record<string, string> | null = session.metadata || null;
  const packKey = metadata?.pack_key;
  const userId = metadata?.user_id;
  const orgId = metadata?.org_id;
  const sessionId = session.id;

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

  if (mode === 'payment' && metadata?.course_id && userId) {
    try {
      const courseId = metadata.course_id;
      const enrollmentType = metadata.enrollment_type || 'individual';
      const teamEmails = metadata.team_emails ? JSON.parse(metadata.team_emails) : [];

      const existing = await db.selectOne('lms_enrollments', {
        column: 'stripe_session_id',
        value: sessionId,
        select: 'id',
      });
      if (existing) {
        console.log(`[Stripe] Course enrollment already exists for session ${sessionId}`);
        return;
      }

      const enrollUsers: { userId: string; email: string }[] = [{ userId, email: '' }];

      if (enrollmentType === 'team' && teamEmails.length > 0) {
        for (const email of teamEmails) {
          const existingUser = await db.selectOne('profiles', {
            column: 'email',
            value: email,
            select: 'id, email',
          });
          if (existingUser && existingUser.id !== userId) {
            enrollUsers.push({ userId: existingUser.id, email });
          }
        }
      }

      for (const enrollee of enrollUsers) {
        const alreadyEnrolled = await db.selectOne('lms_enrollments', {
          column: 'course_id',
          value: courseId,
          select: 'id',
        });
        if (!alreadyEnrolled) {
          await db.insert('lms_enrollments', {
            user_id: enrollee.userId,
            course_id: courseId,
            enrollment_type: enrollmentType,
            status: 'active',
            progress_percent: 0,
            enrolled_at: new Date().toISOString(),
            stripe_session_id: sessionId,
          });
        }
      }

      console.log(`[Stripe] Course enrollment created: course=${courseId}, user=${userId}, type=${enrollmentType}`);
    } catch (e: any) {
      console.error('[Stripe] Failed to create course enrollment:', e);
    }
    return;
  }

  console.log('[Stripe] checkout.session.completed (subscription):', session.id);
}

async function handleSubscriptionUpdate(subscription: any) {
  const customerId = subscription.customer;
  const status = subscription.status;
  const subscriptionId = subscription.id;

  const priceId = subscription.items?.data?.[0]?.price?.id;
  const tierData = getSubscriptionTierByPriceId(priceId);
  
  let tier = 'member';
  let councilTier: string | null = null;
  
  if (tierData) {
    tier = `council-${tierData.id}`;
    councilTier = tierData.id;
  } else if (priceId === process.env.STRIPE_PRICE_PRO) {
    tier = 'pro';
  } else if (priceId === process.env.STRIPE_PRICE_BASIC) {
    tier = 'basic';
  }

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
    if (councilTier) {
      updates.council_tier = councilTier;
    }
    await grantDailyCreditsForTier(profile.id, tier, councilTier);
    await grantAnnualCouncilCredits(profile.id, councilTier);
  } else if (status === 'canceled') {
    updates.tier = 'member';
    updates.council_tier = null;
    await grantDailyCreditsForTier(profile.id, 'member', null);
  } else if (status === 'past_due') {
    updates.tier = tier;
    if (councilTier) {
      updates.council_tier = councilTier;
    }
  }

  await db.update('profiles', { column: 'id', value: profile.id }, updates);
}

async function grantDailyCreditsForTier(userId: string, tier: string, councilTier: string | null): Promise<void> {
  let dailyCredits = 2;
  let tierLabel = tier;

  if (tier.startsWith('council-')) {
    const tiers = getCouncilSubscriptionTiers('CNY');
    const councilData = tiers[councilTier || 'individual'];
    dailyCredits = councilData?.dailyDexCredits || 5;
    tierLabel = `council-${councilTier}`;
  }
  
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
        tier: tierLabel,
        updated_at: new Date().toISOString(),
      });

      await db.insert('credit_transactions', {
        user_id: userId,
        amount: dailyCredits,
        transaction_type: 'earn_credit',
        description: `Daily DEX AI credits (${tierLabel})`,
      });
    } else {
      await db.insert('credits', {
        user_id: userId,
        balance: dailyCredits,
        total_earned: dailyCredits,
        total_spent: 0,
        tier: tierLabel,
        created_at: new Date().toISOString(),
      });

      await db.insert('credit_transactions', {
        user_id: userId,
        amount: dailyCredits,
        transaction_type: 'earn_credit',
        description: `Initial DEX AI credits (${tierLabel})`,
      });
    }
  } catch (e) {
    console.error('[Stripe] Failed to grant daily credits:', e);
  }
}

async function grantAnnualCouncilCredits(userId: string, councilTier: string | null): Promise<void> {
  if (!councilTier) return;

  const tiers = getCouncilSubscriptionTiers('CNY');
  const tierData = tiers[councilTier];
  
  if (!tierData) return;

  try {
    const councilCredits = tierData.councilCreditsPerYear;

    await db.insert('v2_council_credits', {
      user_id: userId,
      balance: councilCredits,
      total_earned: councilCredits,
      total_spent: 0,
      tier: councilTier,
      created_at: new Date().toISOString(),
    });

    await db.insert('v2_council_transactions', {
      user_id: userId,
      amount: councilCredits,
      transaction_type: 'earn',
      description: `Annual Council Credits allocation (${councilTier})`,
      created_at: new Date().toISOString(),
    });

    console.log(`[Stripe] Council credits granted: ${userId} +${councilCredits} (${councilTier})`);
  } catch (e) {
    console.error('[Stripe] Failed to grant Council credits:', e);
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
    council_tier: null,
    stripe_subscription_status: 'canceled',
  });

  await grantDailyCreditsForTier(profile.id, 'member', null);
}

export async function webhookHandler(req: VercelRequest, res: VercelResponse) {
  return handleStripe(req, res);
}
