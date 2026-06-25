/**
 * Server-side API route for NEXUS webhook signing.
 * Handles signing operations securely on the server.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { getUserFromRequest } from '../_lib/adminAuth.js';

const NEXUS_WEBHOOK_SECRET = process.env.NEXUS_WEBHOOK_SECRET || '';
const NEXUS_API_SECRET = process.env.NEXUS_API_SECRET || '';

function signPayload(payload: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return hmac.digest('hex');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Auth check
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { payload, type } = req.body;

    if (!payload) {
      return res.status(400).json({ error: 'Missing payload' });
    }

    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const secret = type === 'webhook' ? NEXUS_WEBHOOK_SECRET : NEXUS_API_SECRET;

    if (!secret) {
      return res.status(500).json({ error: 'NEXUS secret not configured' });
    }

    const signature = signPayload(payloadStr, secret);

    return res.status(200).json({ signature });
  } catch (err: any) {
    console.error('[NEXUS Sign API]', err);
    return res.status(500).json({ error: err.message || 'Signing failed' });
  }
}
