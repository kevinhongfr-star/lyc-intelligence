/**
 * Email template system — Issue #36: Email Templates
 *
 * Centralized email template system with React-based email components.
 * Supports transactional, notification, and marketing emails.
 */

import React from 'react';
import ReactDOMServer from 'react-dom/server';

/* ------------------------------------------------------------------ */
/* Layout / Wrapper                                                  */
/* ------------------------------------------------------------------ */

export function EmailLayout({
  children,
  previewText = '',
  unsubscribeUrl = '#',
  privacyUrl = '/privacy',
  preferencesUrl = '#',
}: {
  children: React.ReactNode;
  previewText?: string;
  unsubscribeUrl?: string;
  privacyUrl?: string;
  preferencesUrl?: string;
}) {
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Preview text for email clients */}
      {previewText && (
        <div style={{ display: 'none', fontSize: '1px', color: '#fff', maxHeight: '0', maxWidth: '0', opacity: '0', overflow: 'hidden' }}>
          {previewText}
        </div>
      )}
      <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
        <tbody>
          <tr>
            <td align="center" style={{ backgroundColor: '#FAFAFA', padding: '40px 20px' }}>
            <table width="600" cellPadding={0} cellSpacing={0} role="presentation" style={{ maxWidth: '600px' }}>
              <tbody>
                {/* Header */}
                <tr>
                  <td style={{ backgroundColor: '#1A1A1A', padding: '24px 32px', borderRadius: '8px 8px 0 0' }}>
                    <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
                      <tbody>
                        <tr>
                          <td style={{ fontSize: '20px', fontWeight: 300, color: '#fff', fontFamily: 'Georgia, serif' }}>
                            LYC Intelligence
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
                {/* Body */}
                <tr>
                  <td style={{ backgroundColor: '#fff', padding: '32px', fontSize: '14px', lineHeight: '1.6', color: '#4A4A4A' }}>
                    {children}
                  </td>
                </tr>
                {/* Footer */}
                <tr>
                  <td style={{ backgroundColor: '#FAFAFA', padding: '24px 32px', fontSize: '12px', color: '#9B9B9B', borderRadius: '0 0 8px 8px', borderTop: '1px solid #E5E5E5' }}>
                    <p style={{ margin: '0 0 8px 0' }}>
                      LYC Intelligence · Shanghai, China
                    </p>
                    <p style={{ margin: 0 }}>
                      You are receiving this email because you registered for our services.
                    </p>
                    <p style={{ margin: '8px 0 0 0' }}>
                      <a href={unsubscribeUrl} style={{ color: '#6B6B6B', textDecoration: 'underline' }}>Unsubscribe</a>
                      {' · '}
                      <a href={privacyUrl} style={{ color: '#6B6B6B', textDecoration: 'underline' }}>Privacy Policy</a>
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared components                                                    */
/* ------------------------------------------------------------------ */

export function EmailHeading({ children, size = 'lg', style }: { children: React.ReactNode; size?: 'sm' | 'md' | 'lg'; style?: React.CSSProperties }) {
  const fontSize = size === 'lg' ? '24px' : size === 'md' ? '18px' : '15px';
  return (
    <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 400, color: '#1A1A1A', fontSize, margin: '0 0 16px 0', ...style }}>
      {children}
    </h1>
  );
}

export function EmailButton({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <a
      href={href}
      style={{
        display: 'inline-block',
        padding: '12px 24px',
        backgroundColor: '#1A1A1A',
        color: '#fff',
        textDecoration: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: 500,
      }}
    >
      {children}
    </a>
  );
}

export function EmailDivider() {
  return <hr style={{ border: 'none', borderTop: '1px solid #E5E5E5', margin: '24px 0' }} />;
}

export function EmailSignature({ name = 'The LYC Team' }: { name?: string }) {
  return (
    <div style={{ marginTop: '24px' }}>
      <p style={{ margin: '0 0 4px 0', color: '#1A1A1A' }}>Best regards,</p>
      <p style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: '16px', color: '#1A1A1A' }}>{name}</p>
      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9B9B9B' }}>LYC Intelligence</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Transactional: Welcome email                                     */
/* ------------------------------------------------------------------ */

export function WelcomeEmailTemplate({ name, loginUrl }: { name: string; loginUrl: string }) {
  return (
    <EmailLayout previewText={`Welcome to LYC Intelligence, ${name}!`}>
      <EmailHeading>Welcome aboard, {name} 👋</EmailHeading>
      <p style={{ margin: '0 0 16px 0' }}>
        Thank you for joining LYC Intelligence. We're excited to have you on board.
        Your account has been successfully created and is ready to use.
      </p>
      <p style={{ margin: '0 0 24px 0' }}>
        Here's what you can do next:
      </p>
      <ul style={{ margin: '0 0 24px 0', paddingLeft: '20px' }}>
        <li style={{ marginBottom: '8px' }}>Complete your profile to help us personalize your experience</li>
        <li style={{ marginBottom: '8px' }}>Explore our executive search and coaching services</li>
        <li style={{ marginBottom: '8px' }}>Connect with your dedicated consultant</li>
      </ul>
      <p style={{ margin: '0 0 24px 0' }}>
        <EmailButton href={loginUrl}>Get Started</EmailButton>
      </p>
      <EmailDivider />
      <p style={{ fontSize: '12px', color: '#9B9B9B', margin: 0 }}>
        If you didn't create an account, please ignore this email or contact support.
      </p>
    </EmailLayout>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Transactional: Password reset                                    */
/* ------------------------------------------------------------------ */

export function PasswordResetTemplate({ resetUrl, expiresIn = '24 hours' }: { resetUrl: string; expiresIn?: string }) {
  return (
    <EmailLayout previewText="Reset your LYC Intelligence password">
      <EmailHeading>Reset your password</EmailHeading>
      <p style={{ margin: '0 0 16px 0' }}>
        We received a request to reset the password for your account.
        Click the button below to set a new password.
      </p>
      <p style={{ margin: '0 0 24px 0' }}>
        <EmailButton href={resetUrl}>Reset Password</EmailButton>
      </p>
      <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#6B6B6B' }}>
        This link will expire in {expiresIn}.
      </p>
      <p style={{ margin: 0, fontSize: '13px', color: '#6B6B6B' }}>
        If you didn't request a password reset, you can safely ignore this email.
      </p>
      <EmailDivider />
      <p style={{ fontSize: '12px', color: '#9B9B9B', margin: 0 }}>
        Having trouble? Copy and paste this URL:{' '}
        <a href={resetUrl} style={{ color: '#6B6B6B', wordBreak: 'break-all' }}>{resetUrl}</a>
      </p>
    </EmailLayout>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Notification: New candidate shortlist                          */
/* ------------------------------------------------------------------ */

export function NewCandidateTemplate({
  candidateName,
  mandateTitle,
  viewUrl,
}: {
  candidateName: string;
  mandateTitle: string;
  viewUrl: string;
}) {
  return (
    <EmailLayout previewText={`New candidate: ${candidateName} for ${mandateTitle}`}>
      <EmailHeading>New candidate shortlisted</EmailHeading>
      <p style={{ margin: '0 0 16px 0' }}>
        <strong>{candidateName}</strong> has been shortlisted for the{' '}
        <strong>{mandateTitle}</strong> role.
      </p>
      <div style={{ backgroundColor: '#FAFAFA', padding: '16px', borderRadius: '6px', marginBottom: '24px' }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 500, color: '#1A1A1A' }}>{candidateName}</p>
        <p style={{ margin: 0, fontSize: '13px', color: '#6B6B6B' }}>
          <strong>Role:</strong> {mandateTitle}
        </p>
      </div>
      <p style={{ margin: '0 0 24px 0' }}>
        <EmailButton href={viewUrl}>View Candidate Profile</EmailButton>
      </p>
      <EmailSignature />
    </EmailLayout>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Notification: Interview scheduled                              */
/* ------------------------------------------------------------------ */

export function InterviewScheduledTemplate({
  candidateName,
  interviewType,
  dateTime,
  location,
  calendarUrl,
}: {
  candidateName: string;
  interviewType: string;
  dateTime: string;
  location: string;
  calendarUrl: string;
}) {
  return (
    <EmailLayout previewText={`Interview scheduled: ${candidateName} on ${dateTime}`}>
      <EmailHeading>Interview Scheduled</EmailHeading>
      <p style={{ margin: '0 0 16px 0' }}>
        An interview has been scheduled with <strong>{candidateName}</strong>.
      </p>
      <div style={{ backgroundColor: '#FAFAFA', padding: '20px', borderRadius: '6px', marginBottom: '24px' }}>
        <div style={{ marginBottom: '12px' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Interview Type</p>
          <p style={{ margin: 0, fontWeight: 500, color: '#1A1A1A' }}>{interviewType}</p>
        </div>
        <div style={{ marginBottom: '12px' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date & Time</p>
          <p style={{ margin: 0, fontWeight: 500, color: '#1A1A1A' }}>{dateTime}</p>
        </div>
        <div>
          <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#9B9B9B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</p>
          <p style={{ margin: 0, fontWeight: 500, color: '#1A1A1A' }}>{location}</p>
        </div>
      </div>
      <p style={{ margin: '0 0 24px 0' }}>
        <EmailButton href={calendarUrl}>Add to Calendar</EmailButton>
      </p>
    </EmailLayout>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Marketing: Newsletter / Monthly Digest                         */
/* ------------------------------------------------------------------ */

export function MonthlyDigestTemplate({
  name, articles = [], events = [], unsubscribeUrl, preferencesUrl }: { name: string; articles?: Array<{ title: string; excerpt: string; url: string }>; events?: Array<{ title: string; date: string; url: string }>; unsubscribeUrl?: string; preferencesUrl?: string }) {
  return (
    <EmailLayout previewText="Your monthly intelligence briefing from LYC" unsubscribeUrl={unsubscribeUrl} preferencesUrl={preferencesUrl}>
      <EmailHeading>Monthly Intelligence Digest</EmailHeading>
      <p style={{ margin: '0 0 24px 0' }}>
        Hi {name}, here's your curated briefing for this month —
        leadership insights, events, and intelligence from the LYC community.
      </p>

      {articles.length > 0 && (
        <>
          <h2 style={{ fontSize: '16px', fontFamily: 'Georgia, serif', color: '#1A1A1A', margin: '0 0 16px 0' }}>Featured Insights</h2>
          <div style={{ marginBottom: '24px' }}>
            {articles.map((article, i) => (
              <div key={i} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: i < articles.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                <a href={article.url} style={{ color: '#1A1A1A', textDecoration: 'none', fontWeight: 500 }}>{article.title}</a>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6B6B6B' }}>{article.excerpt}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {events.length > 0 && (
        <>
          <h2 style={{ fontSize: '16px', fontFamily: 'Georgia, serif', color: '#1A1A1A', margin: '0 0 16px 0' }}>Upcoming Events</h2>
          <div style={{ marginBottom: '24px' }}>
            {events.map((event, i) => (
              <div key={i} style={{ marginBottom: '12px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#9B9B9B' }}>{event.date}</p>
                <a href={event.url} style={{ color: '#1A1A1A', textDecoration: 'none', fontWeight: 500 }}>{event.title}</a>
              </div>
            ))}
          </div>
        </>
      )}

      <EmailDivider />
      <p style={{ fontSize: '12px', color: '#9B9B9B', margin: 0 }}>
        Don't want these emails?{' '}
        <a href={unsubscribeUrl || '#'} style={{ color: '#6B6B6B', textDecoration: 'underline' }}>Unsubscribe</a>
        {' '}or{' '}
        <a href={preferencesUrl || '#'} style={{ color: '#6B6B6B', textDecoration: 'underline' }}>manage preferences</a>.
      </p>
    </EmailLayout>
  );
}

/* ------------------------------------------------------------------ */
/* 6. Transactional: Certificate earned                                    */
/* ------------------------------------------------------------------ */

export function CertificateEarnedTemplate({
  name,
  courseTitle,
  certificateUrl,
  score,
}: {
  name: string;
  courseTitle: string;
  certificateUrl: string;
  score: number;
}) {
  return (
    <EmailLayout previewText={`Congratulations on completing ${courseTitle}!`}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ width: '60px', height: '60px', backgroundColor: '#FEF3C7', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          🏆
        </div>
      </div>
      <EmailHeading style={{ textAlign: 'center' }}>Congratulations, {name}!</EmailHeading>
      <p style={{ margin: '0 0 8px 0', textAlign: 'center' }}>
        You've successfully completed <strong>{courseTitle}</strong>.
      </p>
      <p style={{ margin: '0 0 24px 0', textAlign: 'center', color: '#6B6B6B' }}>
        Final Score: <strong>{score}%</strong>
      </p>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <EmailButton href={certificateUrl}>View Your Certificate</EmailButton>
      </div>
      <EmailDivider />
      <p style={{ fontSize: '13px', color: '#6B6B6B', textAlign: 'center', margin: 0 }}>
        Share your achievement on LinkedIn and add it to your professional profile.
      </p>
    </EmailLayout>
  );
}

/* ------------------------------------------------------------------ */
/* Template registry (for backend use)                                  */
/* ------------------------------------------------------------------ */

export const EMAIL_TEMPLATES = {
  'welcome': WelcomeEmailTemplate,
  'password_reset': PasswordResetTemplate,
  'new_candidate': NewCandidateTemplate,
  'interview_scheduled': InterviewScheduledTemplate,
  'monthly_digest': MonthlyDigestTemplate,
  'certificate_earned': CertificateEarnedTemplate,
} as const;

export type TemplateName = keyof typeof EMAIL_TEMPLATES;

/* ------------------------------------------------------------------ */
/* Render helper (returns HTML string)                               */
/* ------------------------------------------------------------------ */

export function renderEmailToString(templateName: TemplateName, props: Record<string, any>): string {
  const TemplateComponent = EMAIL_TEMPLATES[templateName];
  if (!TemplateComponent) {
    console.error(`[renderEmailToString] Unknown template: ${templateName}`);
    return '';
  }
  const element = React.createElement(TemplateComponent as React.ComponentType<any>, props);
  return ReactDOMServer.renderToStaticMarkup(element);
}
