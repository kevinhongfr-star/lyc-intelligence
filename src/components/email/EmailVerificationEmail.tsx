/**
 * components/email/EmailVerificationEmail.tsx — #1348 template 3/8.
 *
 * Simple magic-link email. No scorecard, no diagnostic accents — brand
 * neutral (uses lens accent passed via pipeline, typically the default LYC
 * magenta). Verbiage is brief per the voice engine: 1 paragraph, clear CTA,
 * explicit 24 hour expiry.
 */

import React from 'react';
import type { EmailTemplateDefinition, BrandLens } from '@/services/emailEngine';
import { StandardEmailChrome, FONT_STACKS } from './sharedEmailUtils';

export interface EmailVerificationEmailProps {
  recipient_email: string;
  verify_url: string;
  /** Human-expires-in string, e.g. "24 hours" */
  expires_in_human?: string;
  lens: BrandLens;
}

export const EmailVerificationEmail: React.FC<EmailVerificationEmailProps> = ({
  recipient_email,
  verify_url,
  expires_in_human = '24 hours',
  lens,
}) => (
  <StandardEmailChrome lens={lens}>
    <tr>
      <td style={{ padding: '32px 40px 16px' }}>
        <p style={{ margin: 0, fontFamily: FONT_STACKS.mono, fontSize: 11, letterSpacing: 4, color: '#6A6A6A' }}>
          VERIFY YOUR EMAIL
        </p>
        <h1 style={{ margin: '16px 0 0', fontFamily: FONT_STACKS.heading, fontSize: 32, lineHeight: 1.15, color: lens.accent, fontWeight: 600 }}>
          Confirm your email address
        </h1>
      </td>
    </tr>
    <tr>
      <td style={{ padding: '16px 40px' }}>
        <p style={{ margin: 0, fontFamily: FONT_STACKS.body, fontSize: 16, lineHeight: 1.55, color: '#1C1C1C' }}>
          You created a LYC Partners account with{' '}
          <strong>{recipient_email}</strong>. Click the link below to activate
          your account. This link expires in {expires_in_human}.
        </p>
      </td>
    </tr>
    <tr>
      <td style={{ padding: '16px 40px 32px' }}>
        <a
          href={verify_url}
          style={{
            display: 'inline-block',
            padding: '14px 26px',
            fontFamily: FONT_STACKS.body,
            fontSize: 15,
            fontWeight: 600,
            color: '#FFFFFF',
            background: lens.accent,
            textDecoration: 'none',
          }}
        >
          Verify email address
        </a>
        <p style={{ margin: '10px 0 0', fontFamily: FONT_STACKS.body, fontSize: 13, color: '#6A6A6A' }}>
          {verify_url}
        </p>
      </td>
    </tr>
  </StandardEmailChrome>
);

export const EmailVerificationEmailTemplate: EmailTemplateDefinition = {
  kind: 'email_verification',
  defaultSubject: 'Verify your email to continue',
  defaultPreheader: 'Verify your LYC Partners email address by clicking the link below.',
  defaultFromName: 'LYC Partners',
  render({ variables, brandLens }) {
    return React.createElement(EmailVerificationEmail, {
      recipient_email: String(variables.recipient_email ?? ''),
      verify_url: String(variables.verify_url ?? '#'),
      expires_in_human: (variables.expires_in_human as any) ?? undefined,
      lens: brandLens,
    });
  },
  variableCheck(vars) {
    const issues = [];
    if (!vars.verify_url) issues.push({ severity: 'warn', code: 'MISSING_VAR', message: 'email_verification missing verify_url' });
    if (!vars.recipient_email) issues.push({ severity: 'warn', code: 'MISSING_VAR', message: 'email_verification missing recipient_email' });
    return issues;
  },
};

export default EmailVerificationEmail;
