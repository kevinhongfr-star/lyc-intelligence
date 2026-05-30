
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, AuthedRequest } from '../_lib/auth';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const CONSULTANT_EMAIL = process.env.CONSULTANT_EMAIL || 'contact@lyc-partners.ai';

const renderEmailTemplate = (type: string, data: any) => {
  switch (type) {
    case 'welcome':
      return {
        subject: 'Welcome to LYC Intelligence',
        html: `
          <div style="font-family: Georgia, serif; background: #FFFFFF; color: #333333; padding: 40px; max-width: 600px; margin: auto;">
            <h1 style="color: #333333; border-bottom: 2px solid #00897B; padding-bottom: 20px;">LYC Intelligence</h1>
            <p>Hi ${data.name || 'there'},</p>
            <p>Thanks for trying LYC Intelligence! We're glad you're here.</p>
            <p style="margin-top:20px;">Ready to get started? Take our leadership assessment here:</p>
            <div style="margin:20px 0;">
              <a href="https://lyc-intelligence.app/assessment" style="display:inline-block;padding:12px 24px;background:#c108ab;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">
                Take Assessment
              </a>
            </div>
            <p>Best,<br/>The LYC Partners Team</p>
          </div>
        `
      };
    case 'lead_notify':
      return {
        subject: `[LYC Lead] New ${data.leadType} Lead: ${data.name}`,
        html: `
          <div style="font-family: Georgia, serif; background: #FFFFFF; color: #333333; padding: 40px; max-width: 600px; margin: auto;">
            <h1 style="color: #333333; border-bottom: 2px solid #00897B; padding-bottom: 20px;">New Lead</h1>
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            ${data.company ? `<p><strong>Company:</strong> ${data.company}</p>` : ''}
            ${data.title ? `<p><strong>Title:</strong> ${data.title}</p>` : ''}
            ${data.country ? `<p><strong>Country:</strong> ${data.country}</p>` : ''}
            ${data.currentTitle ? `<p><strong>Current Title:</strong> ${data.currentTitle}</p>` : ''}
            <p><strong>Source:</strong> ${data.source}</p>
            ${data.messageSummary ? `<p><strong>Message Summary:</strong> ${data.messageSummary}</p>` : ''}
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p>Follow up within 24 hours!</p>
          </div>
        `
      };
    case 'lead_capture':
      return {
        subject: 'Thanks for submitting your info — LYC Intelligence',
        html: `
          <div style="font-family: Georgia, serif; background: #FFFFFF; color: #333333; padding: 40px; max-width: 600px; margin: auto;">
            <h1 style="color: #333333; border-bottom: 2px solid #00897B; padding-bottom: 20px;">LYC Intelligence</h1>
            <p>Hi ${data.name || 'there'},</p>
            <p>Thanks for your interest! Your assessment is now ready.</p>
            <div style="margin:20px 0;">
              <a href="https://lyc-intelligence.app/assessment" style="display:inline-block;padding:12px 24px;background:#c108ab;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">
                Start Assessment
              </a>
            </div>
            <p>Best,<br/>The LYC Partners Team</p>
          </div>
        `
      };
    case 'hot_lead':
      return {
        subject: '🚨 HOT LEAD ALERT: Priority Follow-Up Required',
        html: `
          <div style="font-family: Georgia, serif; background: #FFFFFF; color: #333333; padding: 40px; max-width: 600px; margin: auto;">
            <h1 style="color: #EF4444; border-bottom: 2px solid #00897B; padding-bottom: 20px;">HOT LEAD</h1>
            <p style="font-size:16px; color:#EF4444; font-weight:bold;">URGENT: Follow up within 15 MINUTES!</p>
            <div style="margin-top:24px; padding:20px; background:#F5F5F5; border:1px solid #E5E5E5; border-radius:12px;">
              <p><strong>Name:</strong> ${data.name}</p>
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Company:</strong> ${data.company}</p>
              <p><strong>Hot Lead Reason:</strong> ${data.reason}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
          </div>
        `
      };
    case 'upgrade_reminder':
      return {
        subject: 'Your credits are running low — LYC Intelligence',
        html: `
          <div style="font-family: Georgia, serif; background: #FFFFFF; color: #333333; padding: 40px; max-width: 600px; margin: auto;">
            <h1 style="color: #333333; border-bottom: 2px solid #00897B; padding-bottom: 20px;">LYC Intelligence</h1>
            <p>Hi there,</p>
            <p>Your credits are running low. Consider upgrading to keep using premium features.</p>
            <div style="margin:20px 0;">
              <a href="https://lyc-intelligence.app/pricing" style="display:inline-block;padding:12px 24px;background:#c108ab;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">
                Upgrade Now
              </a>
            </div>
            <p>Best,<br/>The LYC Partners Team</p>
          </div>
        `
      };
    default:
      return {
        subject: 'Update from LYC Intelligence',
        html: '<p>Hi there!</p>'
      };
  }
};

export default async function handler(req: AuthedRequest, res: VercelResponse) {
  if (!(await requireAuth(req, res))) return;
  const userId = req.userId!;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, data } = req.body;

  if (!type || !data) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let sent = false;

  if (!RESEND_API_KEY) {
    // Log to console as fallback — operator must configure RESEND_API_KEY
    console.log('[LEAD]', JSON.stringify({ type, data, timestamp: new Date().toISOString() }));
    return res.status(200).json({ sent: false, fallback: 'logged_to_console' });
  }

  if (RESEND_API_KEY) {
    try {
      const email = renderEmailTemplate(type, data);
      const to = type === 'lead_notify' || type === 'hot_lead' ? CONSULTANT_EMAIL : data.email;

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'noreply@lyc-partners.ai',
          to,
          subject: email.subject,
          html: email.html,
        }),
      });

      if (emailRes.ok) {
        sent = true;
      } else {
        const text = await emailRes.text();
        console.warn('[Email API] Send failed:', text);
      }
    } catch (e) {
      console.warn('[Email API] Error:', e);
    }
  }

  return res.status(200).json({ sent });
}
