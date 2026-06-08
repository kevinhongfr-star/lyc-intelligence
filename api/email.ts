import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendEmail } from './_lib/email';

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { type, data } = req.body;
    if (!type || !data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await sendEmail(type, data);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[email] Unhandled error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      sent: false,
      details: process.env.NODE_ENV === 'development' ? String(err?.message || err) : undefined,
    });
  }
}
