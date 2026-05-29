import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
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
      message_summary
    } = req.body;
    
    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!email && !work_email) return res.status(400).json({ error: 'Missing email' });

    const leadEmail = work_email || email;
    const isB2B = type === 'b2b';

    // Step 1: Save to appropriate table
    if (isB2B) {
      const { error: dbError } = await supabase.from('b2b_leads').insert({
        name,
        work_email: leadEmail,
        company: company || '',
        title,
        source: source || 'b2b_landing',
        created_at: new Date().toISOString()
      });
      if (dbError) console.warn('[Lead Capture] B2B DB save failed:', dbError);
    } else {
      const { error: dbError } = await supabase.from('b2c_leads').insert({
        name,
        email: leadEmail,
        current_title,
        country,
        source: source || 'b2c_landing',
        message_summary,
        created_at: new Date().toISOString()
      });
      if (dbError) console.warn('[Lead Capture] B2C DB save failed:', dbError);
    }

    // Step 2: Send emails via /api/email
    let leadNotifySent = false;
    let leadCaptureSent = false;

    try {
      // Notify consultant
      await fetch('https://www.lyc-intelligence.app/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lead_notify',
          data: {
            leadType: isB2B ? 'B2B' : 'B2C',
            name,
            email: leadEmail,
            company,
            title,
            country,
            currentTitle: current_title,
            source,
            messageSummary: message_summary
          }
        })
      });
      leadNotifySent = true;
    } catch (e) {
      console.warn('[Lead Capture] lead_notify email failed:', e);
    }

    try {
      // Confirmation to lead
      await fetch('https://www.lyc-intelligence.app/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lead_capture',
          data: { name, email: leadEmail }
        })
      });
      leadCaptureSent = true;
    } catch (e) {
      console.warn('[Lead Capture] lead_capture email failed:', e);
    }

    res.status(200).json({
      success: true,
      leadNotifySent,
      leadCaptureSent
    });
  } catch (e) {
    console.error('[Lead Capture] Error:', e);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
