/**
 * Email sender — shared helper for any serverless function that needs to
 * send transactional email via Resend. Replaces the previous "call
 * /api/email over HTTP" pattern which broke cross-function in Vercel.
 *
 * Templates are kept in sync with the original api/email.ts handlers.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const CONSULTANT_EMAIL = process.env.CONSULTANT_EMAIL || 'contact@lyc-partners.ai';

const SEND_TIMEOUT_MS = 7000;

async function fetchWithTimeout(url: string, options: any, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function renderEmail(type: string, data: any): { subject: string; html: string } | null {
  switch (type) {
    case 'welcome':
      return {
        subject: 'Welcome to LYC Intelligence',
        html: `
          <div style="font-family: Georgia, serif; background: #0a0a0a; color: #e5e5e5; padding: 40px; max-width: 600px; margin: auto;">
            <h1 style="color: #e5e5e5; border-bottom: 2px solid #c108ab; padding-bottom: 20px;">LYC Intelligence</h1>
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
        `,
      };
    case 'signup':
      return {
        subject: 'Welcome to DEX AI — Verify Your Email',
        html: `
          <div style="font-family: Georgia, serif; background: #0a0a0a; color: #e5e5e5; padding: 40px; max-width: 600px; margin: auto;">
            <h1 style="color: #e5e5e5; border-bottom: 2px solid #c108ab; padding-bottom: 20px;">DEX AI</h1>
            <p>Hi ${data.name || 'there'},</p>
            <p>Welcome to DEX AI! Click the link below to verify your email:</p>
            <div style="margin:20px 0;">
              <a href="${data.verificationUrl || 'https://dex-ai.app/verify'}" style="display:inline-block;padding:12px 24px;background:#c108ab;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">
                Verify Email
              </a>
            </div>
            <p>After verification, you'll get 2 free credits/day to continue chatting with Nexus.</p>
            <p style="color:#999; font-size:13px; margin-top:24px;">If you didn't create an account with us, please ignore this email.</p>
            <p>Best,<br/>The DEX AI Team</p>
          </div>
        `,
      };
    case 'lead_notify':
      return {
        subject: `[LYC Lead] New ${data.leadType} Lead: ${data.name}`,
        html: `
          <div style="font-family: Georgia, serif; background: #0a0a0a; color: #e5e5e5; padding: 40px; max-width: 600px; margin: auto;">
            <h1 style="color: #e5e5e5; border-bottom: 2px solid #c108ab; padding-bottom: 20px;">New Lead</h1>
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
        `,
      };
    case 'lead_capture':
      return {
        subject: 'Thanks for submitting your info — LYC Intelligence',
        html: `
          <div style="font-family: Georgia, serif; background: #0a0a0a; color: #e5e5e5; padding: 40px; max-width: 600px; margin: auto;">
            <h1 style="color: #e5e5e5; border-bottom: 2px solid #c108ab; padding-bottom: 20px;">LYC Intelligence</h1>
            <p>Hi ${data.name || 'there'},</p>
            <p>Thanks for your interest! Your assessment is now ready.</p>
            <div style="margin:20px 0;">
              <a href="https://lyc-intelligence.app/assessment" style="display:inline-block;padding:12px 24px;background:#c108ab;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">
                Start Assessment
              </a>
            </div>
            <p>Best,<br/>The LYC Partners Team</p>
          </div>
        `,
      };
    case 'hot_lead':
      return {
        subject: '🚨 HOT LEAD ALERT: Priority Follow-Up Required',
        html: `
          <div style="font-family: Georgia, serif; background: #0a0a0a; color: #e5e5e5; padding: 40px; max-width: 600px; margin: auto;">
            <h1 style="color: #EF4444; border-bottom: 2px solid #c108ab; padding-bottom: 20px;">HOT LEAD</h1>
            <p style="font-size:16px; color:#EF4444; font-weight:bold;">URGENT: Follow up within 15 MINUTES!</p>
            <div style="margin-top:24px; padding:20px; background:#1a1a1a; border:1px solid #333; border-radius:12px;">
              <p><strong>Name:</strong> ${data.name}</p>
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Company:</strong> ${data.company}</p>
              <p><strong>Hot Lead Reason:</strong> ${data.reason}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
          </div>
        `,
      };
    case 'upgrade_reminder':
      return {
        subject: 'Your credits are running low — LYC Intelligence',
        html: `
          <div style="font-family: Georgia, serif; background: #0a0a0a; color: #e5e5e5; padding: 40px; max-width: 600px; margin: auto;">
            <h1 style="color: #e5e5e5; border-bottom: 2px solid #c108ab; padding-bottom: 20px;">LYC Intelligence</h1>
            <p>Hi there,</p>
            <p>Your credits are running low. Consider upgrading to keep using premium features.</p>
            <div style="margin:20px 0;">
              <a href="https://lyc-intelligence.app/pricing" style="display:inline-block;padding:12px 24px;background:#c108ab;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">
                Upgrade Now
              </a>
            </div>
            <p>Best,<br/>The LYC Partners Team</p>
          </div>
        `,
      };
    case 'team_invite':
      return {
        subject: \`You've been invited to LYC Intelligence — \${data.inviterName || 'a colleague'}\`,
        html: \`
          <div style="font-family: Georgia, serif; background: #0a0a0a; color: #e5e5e5; padding: 40px; max-width: 600px; margin: auto;">
            <h1 style="color: #e5e5e5; border-bottom: 2px solid #c108ab; padding-bottom: 20px;">LYC Intelligence</h1>
            <p>Hi \${data.name || 'there'},</p>
            <p>\${data.inviterName || 'A colleague'} has invited you to join LYC Intelligence as a \${data.role || 'team member'}.</p>
            <div style="margin:20px 0; padding:20px; background:#1a1a1a; border:1px solid #333; border-radius:12px;">
              <p style="margin:0;"><strong>Your login credentials:</strong></p>
              <p style="margin:8px 0 0;"><strong>Email:</strong> \${data.email}</p>
              <p style="margin:8px 0 0;"><strong>Temporary Password:</strong> \${data.tempPassword || 'Check with your admin'}</p>
            </div>
            <div style="margin:20px 0;">
              <a href="https://lyc-intelligence.vercel.app/login" style="display:inline-block;padding:12px 24px;background:#c108ab;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">
                Log In Now
              </a>
            </div>
            <p style="color:#999; font-size:13px;">Please change your password after first login.</p>
            <p>Best,<br/>The LYC Partners Team</p>
          </div>
        \`,
      };
    default:
      return null;
  }
}

export interface SendResult {
  sent: boolean;
  fallback?: 'logged_to_console' | 'no_template' | 'error';
  error?: string;
}

/**
 * Send a transactional email via Resend. Returns sent=true on success.
 * If RESEND_API_KEY is missing, logs to console (operator fallback) and
 * returns sent=false with fallback='logged_to_console'.
 */
export async function sendEmail(type: string, data: any): Promise<SendResult> {
  const template = renderEmail(type, data);
  if (!template) {
    console.warn(`[Email] Unknown template type: ${type}`);
    return { sent: false, fallback: 'no_template' };
  }

  if (!RESEND_API_KEY) {
    console.log('[LEAD]', JSON.stringify({ type, data, timestamp: new Date().toISOString() }));
    return { sent: false, fallback: 'logged_to_console' };
  }

  const to = type === 'lead_notify' || type === 'hot_lead' ? CONSULTANT_EMAIL : data.email;

  try {
    const res = await fetchWithTimeout('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@lyc-partners.ai',
        to,
        subject: template.subject,
        html: template.html,
      }),
    }, SEND_TIMEOUT_MS);

    if (res.ok) {
      return { sent: true };
    }
    const text = await res.text().catch(() => '');
    console.warn('[Email] Resend send failed:', res.status, text);
    return { sent: false, fallback: 'error', error: `Resend ${res.status}` };
  } catch (e: any) {
    console.warn('[Email] Send error:', e?.message || e);
    return { sent: false, fallback: 'error', error: String(e?.message || e) };
  }
}
