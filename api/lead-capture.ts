import type { VercelRequest, VercelResponse } from '@vercel/node';
import { insert, isSupabaseConfigured, handleError } from './_lib/supabaseRest.js';
import { sendEmail } from './_lib/email.js';

export const maxDuration = 60;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Rate limiting: 5 requests per minute per IP
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (entry && now < entry.resetAt && entry.count >= 5) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please wait a minute before trying again.' });
  }
  rateLimitMap.set(ip, { count: (entry?.count || 0) + 1, resetAt: now + 60000 });

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!isSupabaseConfigured()) {
      return res.status(500).json({ error: 'Server configuration error: Supabase not configured', success: false });
    }

    const {
      type,
      name,
      email,
      work_email,
      company,
      title,
      current_title,
      country,
      source,
      message_summary,
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!email && !work_email) return res.status(400).json({ error: 'Missing email' });

    const leadEmail = work_email || email;
    const isB2B = type === 'b2b';

    // Step 1: Save to appropriate table (best-effort — log but don't fail the lead if DB write fails)
    try {
      if (isB2B) {
        await insert('b2b_leads', {
          name,
          work_email: leadEmail,
          company: company || '',
          title,
          source: source || 'b2b_landing',
          created_at: new Date().toISOString(),
        });
      } else {
        await insert('b2c_leads', {
          name,
          email: leadEmail,
          current_title,
          country,
          source: source || 'b2c_landing',
          message_summary,
          created_at: new Date().toISOString(),
        });
      }
    } catch (dbError) {
      console.warn(`[Lead Capture] ${isB2B ? 'B2B' : 'B2C'} DB save failed:`, dbError);
    }

    // Step 2: Send emails via shared Resend helper
    const [leadNotifyResult, leadCaptureResult] = await Promise.all([
      sendEmail('lead_notify', {
        leadType: isB2B ? 'B2B' : 'B2C',
        name,
        email: leadEmail,
        company,
        title,
        country,
        currentTitle: current_title,
        source,
        messageSummary: message_summary,
      }),
      sendEmail('lead_capture', { name, email: leadEmail }),
    ]);

    return res.status(200).json({
      success: true,
      leadNotifySent: leadNotifyResult.sent,
      leadCaptureSent: leadCaptureResult.sent,
    });
  } catch (err) {
    return handleError(res, 'lead-capture', err);
  }
}
