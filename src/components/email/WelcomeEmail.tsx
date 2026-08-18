/**
 * components/email/WelcomeEmail.tsx — #1348 template 1/8: welcome email.
 *
 * Sent when: onboarding email verification passes, immediately after
 * signup. Copy: "Executive Introduction" phrasing instead of "free".
 * Structure: brand strip → hero → 2-card benefits grid → big CTA to first
 * assessment → footer confidentiality.
 */

import React from 'react';
import type { EmailTemplateDefinition, BrandLens } from '@/services/emailEngine';
import { StandardEmailChrome, FONT_STACKS, darken } from './sharedEmailUtils';

export interface WelcomeEmailProps {
  recipient_name: string;
  cta_url: string;
  /** The user's tier label — "Executive Introduction" is canonical. */
  tier_display_name: string;
  /** Optional preheader (passed from pipeline). */
  preheader?: string;
  lens: BrandLens;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  recipient_name,
  cta_url,
  tier_display_name,
  lens,
}) => {
  const accentInk = darken(lens.accent, 0.35);
  return (
    <StandardEmailChrome lens={lens}>
      <tr>
        <td style={{ padding: '32px 40px 16px' }}>
          <p
            style={{
              margin: 0,
              fontFamily: FONT_STACKS.mono,
              fontSize: 11,
              letterSpacing: 4,
              color: '#6A6A6A',
            }}
          >
            {tier_display_name.toUpperCase()} · WELCOME
          </p>
          <h1
            style={{
              margin: '16px 0 0',
              fontFamily: FONT_STACKS.heading,
              fontSize: 32,
              lineHeight: 1.15,
              color: lens.accent,
              fontWeight: 600,
            }}
          >
            Welcome, {recipient_name}.
          </h1>
          <p
            style={{
              margin: '12px 0 0',
              fontFamily: FONT_STACKS.body,
              fontSize: 16,
              lineHeight: 1.55,
              color: '#1C1C1C',
            }}
          >
            Your Executive Introduction is a complimentary starting point. Begin
            with a diagnostic assessment that surfaces patterns rather than
            scores, then continue the conversation inside NEXUS.
          </p>
        </td>
      </tr>

      <tr>
        <td style={{ padding: '12px 40px' }}>
          <table role="presentation" border={0} cellPadding={0} cellSpacing={0} width="100%">
            <tbody>
              <tr>
                <td style={{ width: '50%', paddingRight: 12, verticalAlign: 'top' }}>
                  <div style={{ padding: '16px 18px', background: '#FAFAFA', border: '1px solid #E5E5E5' }}>
                    <p style={{ margin: 0, fontFamily: FONT_STACKS.mono, fontSize: 10, letterSpacing: 3, color: accentInk }}>
                      ASSESSMENTS
                    </p>
                    <p style={{ margin: '8px 0 0', fontFamily: FONT_STACKS.heading, fontSize: 20, fontWeight: 600, color: '#0E0E0E' }}>
                      Six diagnostics, one framework.
                    </p>
                    <p style={{ margin: '6px 0 0', fontFamily: FONT_STACKS.body, fontSize: 14, lineHeight: 1.5, color: '#525252' }}>
                      Start with PRISM or pick the diagnostic that best matches your current focus.
                    </p>
                  </div>
                </td>
                <td style={{ width: '50%', paddingLeft: 12, verticalAlign: 'top' }}>
                  <div style={{ padding: '16px 18px', background: '#FAFAFA', border: '1px solid #E5E5E5' }}>
                    <p style={{ margin: 0, fontFamily: FONT_STACKS.mono, fontSize: 10, letterSpacing: 3, color: accentInk }}>
                      NEXUS
                    </p>
                    <p style={{ margin: '8px 0 0', fontFamily: FONT_STACKS.heading, fontSize: 20, fontWeight: 600, color: '#0E0E0E' }}>
                      Continue the conversation.
                    </p>
                    <p style={{ margin: '6px 0 0', fontFamily: FONT_STACKS.body, fontSize: 14, lineHeight: 1.5, color: '#525252' }}>
                      NEXUS has full context of every result — bring a question, get a grounded response.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>

      <tr>
        <td style={{ padding: '24px 40px 32px' }}>
          <a
            href={cta_url}
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
            Start your first assessment
          </a>
          <p style={{ margin: '10px 0 0', fontFamily: FONT_STACKS.body, fontSize: 13, color: '#6A6A6A' }}>
            {cta_url}
          </p>
        </td>
      </tr>
    </StandardEmailChrome>
  );
};

export const WelcomeEmailTemplate: EmailTemplateDefinition = {
  kind: 'welcome',
  defaultSubject: 'Welcome to LYC Partners — next steps with NEXUS',
  defaultPreheader: 'Your Executive Introduction assessment is complimentary and ready to start.',
  defaultFromName: 'LYC Partners',
  render({ variables, brandLens }) {
    return React.createElement(WelcomeEmail, {
      recipient_name: String(variables.recipient_name ?? 'there'),
      cta_url: String(variables.cta_url ?? '#'),
      tier_display_name: String(variables.tier_display_name ?? 'Executive Introduction'),
      lens: brandLens,
    });
  },
  variableCheck(vars) {
    const issues = [];
    if (!vars.cta_url) issues.push({ severity: 'warn', code: 'MISSING_VAR', message: 'welcome email missing cta_url' });
    if (!vars.recipient_name) issues.push({ severity: 'warn', code: 'MISSING_VAR', message: 'welcome email missing recipient_name' });
    return issues;
  },
};

export default WelcomeEmail;
