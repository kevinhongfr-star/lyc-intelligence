import type { VercelRequest, VercelResponse } from '@vercel/node';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { to, subject, html, text, mandateId, contactId } = req.body;
  if (!to || !subject) return res.status(400).json({ error: 'Missing required fields: to, subject' });
  if (!RESEND_API_KEY) return res.status(500).json({ error: 'RESEND_API_KEY not configured' });

  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'LYC Intelligence <noreply@lyc-intelligence.vercel.app>',
        to: Array.isArray(to) ? to : [to],
        subject,
        html: html || `<pre>${text || ''}</pre>`,
        text: text || '',
      }),
    });
    const emailData = await emailRes.json();
    if (!emailRes.ok) return res.status(502).json({ error: 'Email delivery failed', details: emailData });

    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      fetch(`${SUPABASE_URL}/rest/v1/ai_generations`, {
        method: 'POST',
        headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: '3cf508f5-dd29-4d1c-846b-6633b616f9c6', tool_type: 'email', contact_id: contactId || null, mandate_id: mandateId || null, input_params: JSON.stringify({ to, subject }), output_text: `Email sent: ${emailData.id}`, confidence: null, model: 'resend', tokens_used: null }),
      }).catch(() => {});
    }
    return res.status(200).json({ success: true, emailId: emailData.id });
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
