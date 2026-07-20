/**
 * Email sender — shared helper for any serverless function that needs to
 * send transactional email via Resend. Replaces the previous "call
 * /api/email over HTTP" pattern which broke cross-function in Vercel.
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
  const brandColor = '#c108ab';
  const bgColor = '#0a0a0a';
  const textColor = '#e5e5e5';
  const mutedColor = '#999';
  const accentBg = '#1a1a1a';

  const baseHtml = (content: string) => `
    <div style="font-family: Georgia, serif; background: ${bgColor}; color: ${textColor}; padding: 40px; max-width: 600px; margin: auto;">
      ${content}
    </div>
  `;

  const buttonHtml = (text: string, href: string) => `
    <div style="margin:20px 0;">
      <a href="${href}" style="display:inline-block;padding:12px 24px;background:${brandColor};color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">
        ${text}
      </a>
    </div>
  `;

  const footerHtml = `
    <p style="color:${mutedColor}; font-size:13px; margin-top:24px; padding-top:20px; border-top:1px solid #333;">
      This email was sent to you by LYC Intelligence. You can manage your email preferences in your account settings.
    </p>
    <p style="color:${mutedColor}; font-size:13px;">Best,<br/>The LYC Partners Team</p>
  `;

  switch (type) {
    case 'welcome':
      return {
        subject: 'Welcome to LYC Intelligence',
        html: baseHtml(`
          <h1 style="color: ${textColor}; border-bottom: 2px solid ${brandColor}; padding-bottom: 20px;">LYC Intelligence</h1>
          <p>Hi ${data.name || 'there'},</p>
          <p>Thanks for joining LYC Intelligence! We're thrilled to have you here.</p>
          <p style="margin-top:20px;">Ready to get started? Take our leadership assessment to unlock your full potential:</p>
          ${buttonHtml('Take Assessment', data.assessmentUrl || 'https://lyc-intelligence.app/assessment')}
          ${footerHtml}
        `),
      };

    case 'signup':
      return {
        subject: 'Welcome to DEX AI — Verify Your Email',
        html: baseHtml(`
          <h1 style="color: ${textColor}; border-bottom: 2px solid ${brandColor}; padding-bottom: 20px;">DEX AI</h1>
          <p>Hi ${data.name || 'there'},</p>
          <p>Welcome to DEX AI! Click the link below to verify your email:</p>
          ${buttonHtml('Verify Email', data.verificationUrl || 'https://dex-ai.app/verify')}
          <p>After verification, you'll get 2 free credits/day to continue chatting with Nexus.</p>
          <p style="color:${mutedColor}; font-size:13px; margin-top:24px;">If you didn't create an account with us, please ignore this email.</p>
          ${footerHtml}
        `),
      };

    case 'password_reset':
      return {
        subject: 'Reset your LYC Intelligence password',
        html: baseHtml(`
          <h1 style="color: ${textColor}; border-bottom: 2px solid ${brandColor}; padding-bottom: 20px;">Password Reset</h1>
          <p>Hi ${data.name || 'there'},</p>
          <p>We received a request to reset your password. Click the link below to create a new password:</p>
          ${buttonHtml('Reset Password', data.resetUrl || 'https://lyc-intelligence.app/reset-password')}
          <p style="color:${mutedColor}; font-size:13px; margin-top:24px;">This link expires in 1 hour. If you didn't request this reset, please ignore this email.</p>
          ${footerHtml}
        `),
      };

    case 'password_changed':
      return {
        subject: 'Your password has been changed',
        html: baseHtml(`
          <h1 style="color: ${textColor}; border-bottom: 2px solid ${brandColor}; padding-bottom: 20px;">Password Changed</h1>
          <p>Hi ${data.name || 'there'},</p>
          <p>Your password has been successfully changed.</p>
          <p>If you didn't make this change, please contact our support team immediately.</p>
          ${footerHtml}
        `),
      };

    case 'lead_notify':
      return {
        subject: `[LYC Lead] New ${data.leadType} Lead: ${data.name}`,
        html: baseHtml(`
          <h1 style="color: ${textColor}; border-bottom: 2px solid ${brandColor}; padding-bottom: 20px;">New Lead</h1>
          <div style="margin-top:24px; padding:20px; background:${accentBg}; border:1px solid #333; border-radius:12px;">
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            ${data.company ? `<p><strong>Company:</strong> ${data.company}</p>` : ''}
            ${data.title ? `<p><strong>Title:</strong> ${data.title}</p>` : ''}
            ${data.country ? `<p><strong>Country:</strong> ${data.country}</p>` : ''}
            ${data.currentTitle ? `<p><strong>Current Title:</strong> ${data.currentTitle}</p>` : ''}
            <p><strong>Source:</strong> ${data.source}</p>
            ${data.messageSummary ? `<p><strong>Message Summary:</strong> ${data.messageSummary}</p>` : ''}
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="margin-top:20px;">Follow up within 24 hours!</p>
        `),
      };

    case 'lead_capture':
      return {
        subject: 'Thanks for submitting your info — LYC Intelligence',
        html: baseHtml(`
          <h1 style="color: ${textColor}; border-bottom: 2px solid ${brandColor}; padding-bottom: 20px;">LYC Intelligence</h1>
          <p>Hi ${data.name || 'there'},</p>
          <p>Thanks for your interest! Your assessment is now ready.</p>
          ${buttonHtml('Start Assessment', 'https://lyc-intelligence.app/assessment')}
          ${footerHtml}
        `),
      };

    case 'hot_lead':
      return {
        subject: '🚨 HOT LEAD ALERT: Priority Follow-Up Required',
        html: baseHtml(`
          <h1 style="color: #EF4444; border-bottom: 2px solid ${brandColor}; padding-bottom: 20px;">HOT LEAD</h1>
          <p style="font-size:16px; color:#EF4444; font-weight:bold;">URGENT: Follow up within 15 MINUTES!</p>
          <div style="margin-top:24px; padding:20px; background:${accentBg}; border:1px solid #333; border-radius:12px;">
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Company:</strong> ${data.company}</p>
            <p><strong>Hot Lead Reason:</strong> ${data.reason}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
        `),
      };

    case 'payment_confirmation':
      return {
        subject: `Payment Confirmed — ${data.amount}`,
        html: baseHtml(`
          <h1 style="color: ${textColor}; border-bottom: 2px solid ${brandColor}; padding-bottom: 20px;">Payment Confirmed</h1>
          <p>Hi ${data.name || 'there'},</p>
          <p>Your payment of ${data.amount} has been successfully processed.</p>
          <div style="margin-top:24px; padding:20px; background:${accentBg}; border:1px solid #333; border-radius:12px;">
            <p><strong>Order ID:</strong> ${data.orderId || data.sessionId}</p>
            <p><strong>Payment Method:</strong> ${data.paymentMethod || 'Credit Card'}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            ${data.description ? `<p><strong>Description:</strong> ${data.description}</p>` : ''}
          </div>
          <p style="margin-top:20px;">Thank you for your purchase!</p>
          ${footerHtml}
        `),
      };

    case 'payment_failed':
      return {
        subject: 'Payment Failed — Your LYC Intelligence Membership',
        html: baseHtml(`
          <h1 style="color: #EF4444; border-bottom: 2px solid ${brandColor}; padding-bottom: 20px;">Payment Failed</h1>
          <p>Hi ${data.name || 'there'},</p>
          <p>We were unable to process your recent payment for your LYC Intelligence membership.</p>
          <p>Your membership has been placed on hold. You have 7 days to update your payment method before your account is downgraded.</p>
          ${buttonHtml('Update Payment Method', 'https://lyc-intelligence.app/settings/billing')}
          <p style="color:${mutedColor}; font-size:13px; margin-top:24px;">If you need assistance, please contact support@lyc-partners.ai.</p>
          ${footerHtml}
        `),
      };

    case 'subscription_cancelled':
      return {
        subject: 'Your subscription has been cancelled',
        html: baseHtml(`
          <h1 style="color: ${textColor}; border-bottom: 2px solid ${brandColor}; padding-bottom: 20px;">Subscription Cancelled</h1>
          <p>Hi ${data.name || 'there'},</p>
          <p>We're sorry to see you go. Your subscription has been cancelled and will expire on ${data.expiryDate || 'your next billing date'}.</p>
          <p>You can still access your account with basic features until your subscription expires.</p>
          <p style="margin-top:20px;">If you change your mind, you can re-subscribe at any time:</p>
          ${buttonHtml('Re-subscribe', 'https://lyc-intelligence.app/pricing')}
          ${footerHtml}
        `),
      };

    case 'subscription_upgraded':
      return {
        subject: 'Congratulations — Your subscription has been upgraded',
        html: baseHtml(`
          <h1 style="color: ${textColor}; border-bottom: 2px solid ${brandColor}; padding-bottom: 20px;">Subscription Upgraded</h1>
          <p>Hi ${data.name || 'there'},</p>
          <p>Congratulations! Your subscription has been upgraded to ${data.newTier}.</p>
          <div style="margin-top:24px; padding:20px; background:${accentBg}; border:1px solid #333; border-radius:12px;">
            <p><strong>New Tier:</strong> ${data.newTier}</p>
            <p><strong>New Price:</strong> ${data.newPrice}</p>
            <p><strong>Effective Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <p style="margin-top:20px;">Enjoy your new benefits!</p>
          ${footerHtml}
        `),
      };

    case 'credit_purchase':
      return {
        subject: `Credits Added — +${data.credits} credits`,
        html: baseHtml(`
          <h1 style="color: ${textColor}; border-bottom: 2px solid ${brandColor}; padding-bottom: 20px;">Credits Added</h1>
          <p>Hi ${data.name || 'there'},</p>
          <p>Your credit pack purchase has been processed. You've received <strong>+${data.credits} credits</strong>!</p>
          <div style="margin-top:24px; padding:20px; background:${accentBg}; border:1px solid #333; border-radius:12px;">
            <p><strong>Pack Purchased:</strong> ${data.packName}</p>
            <p><strong>Credits Added:</strong> ${data.credits}</p>
            <p><strong>New Balance:</strong> ${data.newBalance}</p>
            <p><strong>Price:</strong> ${data.price}</p>
          </div>
          <p style="margin-top:20px;">Start using your credits today!</p>
          ${buttonHtml('Go to DEX AI', 'https://lyc-intelligence.app/ai')}
          ${footerHtml}
        `),
      };

    case 'assessment_complete':
      return {
        subject: 'Your Leadership Assessment Results are Ready',
        html: baseHtml(`
          <h1 style="color: ${textColor}; border-bottom: 2px solid ${brandColor}; padding-bottom: 20px;">Assessment Complete</h1>
          <p>Hi ${data.name || 'there'},</p>
          <p>Congratulations on completing your leadership assessment! Your personalized report is ready.</p>
          <div style="margin-top:24px; padding:20px; background:${accentBg}; border:1px solid #333; border-radius:12px;">
            <p><strong>Assessment:</strong> ${data.assessmentName || 'Leadership Assessment'}</p>
            <p><strong>Score:</strong> ${data.score || 'N/A'}</p>
            <p><strong>Date Completed:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          ${buttonHtml('View Report', data.reportUrl || 'https://lyc-intelligence.app/report')}
          ${footerHtml}
        `),
      };

    case 'course_enrollment':
      return {
        subject: `Welcome to ${data.courseName} — Your Course is Ready`,
        html: baseHtml(`
          <h1 style="color: ${textColor}; border-bottom: 2px solid ${brandColor}; padding-bottom: 20px;">Course Enrollment</h1>
          <p>Hi ${data.name || 'there'},</p>
          <p>You've been enrolled in <strong>${data.courseName}</strong>!</p>
          <div style="margin-top:24px; padding:20px; background:${accentBg}; border:1px solid #333; border-radius:12px;">
            <p><strong>Course:</strong> ${data.courseName}</p>
            <p><strong>Enrollment Type:</strong> ${data.enrollmentType || 'Individual'}</p>
            <p><strong>Start Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          ${buttonHtml('Start Learning', data.courseUrl || 'https://lyc-intelligence.app/academy/my-courses')}
          ${footerHtml}
        `),
      };

    case 'coaching_session_reminder':
      return {
        subject: `Reminder: Your coaching session is tomorrow`,
        html: baseHtml(`
          <h1 style="color: ${textColor}; border-bottom: 2px solid ${brandColor}; padding-bottom: 20px;">Session Reminder</h1>
          <p>Hi ${data.name || 'there'},</p>
          <p>Just a friendly reminder that your coaching session is tomorrow!</p>
          <div style="margin-top:24px; padding:20px; background:${accentBg}; border:1px solid #333; border-radius:12px;">
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Time:</strong> ${data.time}</p>
            <p><strong>Coach:</strong> ${data.coachName}</p>
            <p><strong>Topic:</strong> ${data.topic || 'Career Development'}</p>
          </div>
          ${buttonHtml('View Details', data.sessionUrl || 'https://lyc-intelligence.app/coaching/sessions')}
          <p style="color:${mutedColor}; font-size:13px; margin-top:24px;">You can reschedule or cancel your session up to 24 hours before.</p>
          ${footerHtml}
        `),
      };

    case 'council_welcome':
      return {
        subject: 'Welcome to The Council — Your Membership is Active',
        html: baseHtml(`
          <h1 style="color: ${textColor}; border-bottom: 2px solid ${brandColor}; padding-bottom: 20px;">Welcome to The Council</h1>
          <p>Hi ${data.name || 'there'},</p>
          <p>Congratulations on joining The Council! Your membership is now active.</p>
          <div style="margin-top:24px; padding:20px; background:${accentBg}; border:1px solid #333; border-radius:12px;">
            <p><strong>Membership Tier:</strong> ${data.tier}</p>
            <p><strong>Annual Credits:</strong> ${data.councilCredits} credits</p>
            <p><strong>Coaching Sessions:</strong> ${data.coachingSessions} sessions/year</p>
            <p><strong>Daily DEX Credits:</strong> ${data.dailyCredits}</p>
          </div>
          <p style="margin-top:20px;">Start exploring your benefits today:</p>
          ${buttonHtml('Go to Council', 'https://lyc-intelligence.app/council')}
          ${footerHtml}
        `),
      };

    case 'weekly_digest':
      return {
        subject: `Your Weekly LYC Intelligence Digest — ${new Date().toLocaleDateString()}`,
        html: baseHtml(`
          <h1 style="color: ${textColor}; border-bottom: 2px solid ${brandColor}; padding-bottom: 20px;">Weekly Digest</h1>
          <p>Hi ${data.name || 'there'},</p>
          <p>Here's your weekly summary of activity on LYC Intelligence:</p>
          <div style="margin-top:24px; padding:20px; background:${accentBg}; border:1px solid #333; border-radius:12px;">
            ${data.activities?.map((act: any) => `
              <p style="margin:8px 0;">• ${act.message}</p>
            `).join('') || '<p>No activity this week.</p>'}
          </div>
          ${buttonHtml('View All Activity', 'https://lyc-intelligence.app/dashboard')}
          ${footerHtml}
        `),
      };

    case 'team_invite':
      return {
        subject: `You've been invited to LYC Intelligence — ${data.inviterName || 'a colleague'}`,
        html: baseHtml(`
          <h1 style="color: ${textColor}; border-bottom: 2px solid ${brandColor}; padding-bottom: 20px;">LYC Intelligence</h1>
          <p>Hi ${data.name || 'there'},</p>
          <p>${data.inviterName || 'A colleague'} has invited you to join LYC Intelligence as a ${data.role || 'team member'}.</p>
          <div style="margin:20px 0; padding:20px; background:${accentBg}; border:1px solid #333; border-radius:12px;">
            <p style="margin:0;"><strong>Your login credentials:</strong></p>
            <p style="margin:8px 0 0;"><strong>Email:</strong> ${data.email}</p>
            <p style="margin:8px 0 0;"><strong>Temporary Password:</strong> ${data.tempPassword || 'Check with your admin'}</p>
          </div>
          ${buttonHtml('Log In Now', data.loginUrl || 'https://lyc-intelligence.app/login')}
          <p style="color:${mutedColor}; font-size:13px;">Please change your password after first login.</p>
          ${footerHtml}
        `),
      };

    case 'referral_reward':
      return {
        subject: 'Referral Reward — You earned credits!',
        html: baseHtml(`
          <h1 style="color: ${textColor}; border-bottom: 2px solid ${brandColor}; padding-bottom: 20px;">Referral Reward</h1>
          <p>Hi ${data.name || 'there'},</p>
          <p>Congratulations! Your referral ${data.referralName} has signed up, and you've earned <strong>+${data.credits} credits</strong>!</p>
          <div style="margin-top:24px; padding:20px; background:${accentBg}; border:1px solid #333; border-radius:12px;">
            <p><strong>Referral:</strong> ${data.referralName}</p>
            <p><strong>Credits Earned:</strong> ${data.credits}</p>
            <p><strong>New Balance:</strong> ${data.newBalance}</p>
          </div>
          <p style="margin-top:20px;">Keep referring friends to earn more rewards!</p>
          ${buttonHtml('View Referrals', 'https://lyc-intelligence.app/referrals')}
          ${footerHtml}
        `),
      };

    case 'notification_digest':
      return {
        subject: `You have ${data.count} unread notifications`,
        html: baseHtml(`
          <h1 style="color: ${textColor}; border-bottom: 2px solid ${brandColor}; padding-bottom: 20px;">Unread Notifications</h1>
          <p>Hi ${data.name || 'there'},</p>
          <p>You have ${data.count} unread notification${data.count !== 1 ? 's' : ''}:</p>
          <div style="margin-top:24px; padding:20px; background:${accentBg}; border:1px solid #333; border-radius:12px;">
            ${data.notifications?.map((n: any) => `
              <div style="margin:12px 0; padding-bottom:12px; border-bottom:1px solid #333;">
                <p style="margin:0; font-weight:bold;">${n.title}</p>
                <p style="margin:4px 0 0; color:${mutedColor}; font-size:13px;">${n.message}</p>
              </div>
            `).join('')}
          </div>
          ${buttonHtml('View All', 'https://lyc-intelligence.app/notifications')}
          ${footerHtml}
        `),
      };

    case 'upgrade_reminder':
      return {
        subject: 'Your credits are running low — LYC Intelligence',
        html: baseHtml(`
          <h1 style="color: ${textColor}; border-bottom: 2px solid ${brandColor}; padding-bottom: 20px;">LYC Intelligence</h1>
          <p>Hi there,</p>
          <p>Your credits are running low. Consider upgrading to keep using premium features.</p>
          ${buttonHtml('Upgrade Now', 'https://lyc-intelligence.app/pricing')}
          ${footerHtml}
        `),
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
