/**
 * components/email/PasswordResetEmail.tsx — #1348 template 4/8.
 *
 * Voice: crisis tone (voice engine) — brief, calm, no "compromised".
 * Standard magic link with explicit 30-minute expiry + "you didn't request
 * this? ignore" paragraph.
 */

import React from 'react';
import type { EmailTemplateDefinition, BrandLens } from '@/services/emailEngine';
import { StandardEmailChrome, FONT_STACKS } from './sharedEmailUtils';

export interface PasswordResetEmailProps {
  recipient_email: string;
  reset_url: string;
  expires_in_minutes?: number;
  lens: BrandLens;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({
  recipient_email,
  reset_url,
  expires_in_minutes = 30,
  lens,
}) => (
  <StandardEmailChrome lens={lens}>
    <tr>
      <td style={{ padding: '32px 40px 16px' }}>
        <p style={{ margin: 0, fontFamily: FONT_STACKS.mono, fontSize: 11, letterSpacing: 4, color: '#6A6A6A' }}>
          PASSWORD RESET
        </p>
        <h1 style={{ margin: '16px 0 0', fontFamily: FONT_STACKS.heading, fontSize: 32, lineHeight: 1.15, color: lens.accent, fontWeight: 600 }}>
          Reset your password
        </h1>
      </td>
    </tr>
    <tr>
      <td style={{ padding: '16px 40px' }}>
        <p style={{ margin: 0, fontFamily: FONT_STACKS.body, fontSize: 16, lineHeight: 1.55, color: '#1C1C1C' }}>
          We received a password reset request for{' '}
          <strong>{recipient_email}</strong>. Click below to set a new password.
          This link is valid for {expires_in_minutes} minutes.
        </p>
      </td>
    </tr>
    <tr>
      <td style={{ padding: '16px 40px 20px' }}>
        <a
          href={reset_url}
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
          Set a new password
        </a>
        <p style={{ margin: '10px 0 0', fontFamily: FONT_STACKS.body, fontSize: 13, color: '#6A6A6A' }}>
          {reset_url}
        </p>
      </td>
    </tr>
    <tr>
      <td style={{ padding: '0 40px 32px' }}>
        <p style={{ margin: 0, fontFamily: FONT_STACKS.body, fontSize: 14, color: '#525252', lineHeight: 1.55 }}>
          If you did not request this reset, you can safely ignore this email — your
          password will not change.
        </p>
      </td>
    </tr>
  </StandardEmailChrome>
);

export const PasswordResetEmailTemplate: EmailTemplateDefinition = {
  kind: 'password_reset',
  defaultSubject: 'Reset your LYC Partners password',
  defaultPreheader: 'Click the link below to set a new password. This link expires in 30 minutes.',
  defaultFromName: 'LYC Partners',
  render({ variables, brandLens }) {
    return React.createElement(PasswordResetEmail, {
      recipient_email: String(variables.recipient_email ?? ''),
      reset_url: String(variables.reset_url ?? '#'),
      expires_in_minutes: (variables.expires_in_minutes as any) ?? undefined,
      lens: brandLens,
    });
  },
  variableCheck(vars) {
    const issues = [];
    if (!vars.reset_url) issues.push({ severity: 'warn', code: 'MISSING_VAR', message: 'password_reset missing reset_url' });
    return issues;
  },
};

export default PasswordResetEmail;
