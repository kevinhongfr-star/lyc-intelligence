import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const { data: userData } = await supabase!
      .from('user_profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

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
        'success_url': `${process.env.SITE_URL}/dashboard?success=true`,
        'cancel_url': `${process.env.SITE_URL}/pricing?canceled=true`,
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
    const { data: userData } = await supabase!
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (!userData?.stripe_customer_id) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'customer': userData.stripe_customer_id,
        'return_url': `${process.env.SITE_URL}/dashboard`
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
