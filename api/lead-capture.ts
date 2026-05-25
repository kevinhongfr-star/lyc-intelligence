import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, name, company, source = 'unknown' } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });

    // Step 1: Save to appropriate table
    const table = source === 'b2b' ? 'b2b_leads' : 'b2c_leads';
    const data = source === 'b2b' 
      ? { email, name, company, source, created_at: new Date().toISOString() }
      : { email, source, created_at: new Date().toISOString() };

    const { error: dbError } = await supabase.from(table).insert(data);
    if (dbError) console.warn('[Lead Capture] DB save failed:', dbError);

    // Step 2: Send welcome email (only if Resend key exists)
    let emailSent = false;
    if (RESEND_API_KEY) {
      try {
        const subject = source === 'b2b' 
          ? "Thanks for requesting a TRIDENT Match — LYC Partners" 
          : "Thanks for trying LYC Intelligence";
        const html = source === 'b2b'
          ? `
            <div style="font-family:Georgia,serif;background:#0a0a0a;color:#e5e5e5;padding:40px;max-width:600px;margin:auto;">
              <h1 style="color:#e5e5e5;border-bottom:2px solid #c108ab;padding-bottom:20px;">LYC Intelligence</h1>
              <p>Hi ${name || 'there'},</p>
              <p>Thanks for requesting a TRIDENT Match. A member of our team will reach out shortly at ${email}.</p>
              <p>Best,<br/>The LYC Partners Team</p>
            </div>
          `
          : `
            <div style="font-family:Georgia,serif;background:#0a0a0a;color:#e5e5e5;padding:40px;max-width:600px;margin:auto;">
              <h1 style="color:#e5e5e5;border-bottom:2px solid #c108ab;padding-bottom:20px;">LYC Intelligence</h1>
              <p>Hi there,</p>
              <p>Thanks for trying LYC Intelligence. We're glad you're here.</p>
              <p>Try our free Leadership Assessment: <a href="https://lyc-intelligence.app/assessment" style="color:#c108ab;">lyc-intelligence.app/assessment</a></p>
              <p>Best,<br/>The LYC Partners Team</p>
            </div>
          `;

        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'noreply@lyc-partners.ai',
            to: email,
            subject,
            html
          })
        });
        emailSent = emailRes.ok;
        if (!emailRes.ok) console.warn('[Lead Capture] Email send failed:', await emailRes.text());
      } catch (e) {
        console.warn('[Lead Capture] Email error:', e);
      }
    }

    res.status(200).json({ success: true, emailSent, savedToDb: !dbError });
  } catch (e) {
    console.error('[Lead Capture] Error:', e);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
