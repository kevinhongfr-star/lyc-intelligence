/**
 * components/email/UpgradeConfirmationEmail.tsx — #1348 template 5/8.
 *
 * Tone: consultant_update. Not a receipt-first — benefits-first.
 * 6 benefit bullets summarising the newly unlocked tier, then an order
 * reference / receipt line at the bottom. Lens accent is the tier's own.
 */

import React from 'react';
import type { EmailTemplateDefinition, BrandLens } from '@/services/emailEngine';
import { StandardEmailChrome, FONT_STACKS, darken } from './sharedEmailUtils';

export interface UpgradeConfirmationEmailProps {
  recipient_name: string;
  tier_display_name: string;
  previous_tier_display_name?: string;
  upgraded_at?: string | Date;
  benefits: string[];
  order_reference?: string;
  account_url: string;
  lens: BrandLens;
}

const DEFAULT_BENEFITS = [
  'All six dimensions revealed on every completed assessment',
  'Export PDF of any result (branded, A4 / Letter)',
  'Priority AI throughput on NEXUS conversations',
  'Weekly digest summarising NEXUS activity and progress',
  'Share result-by-email to clients and colleagues',
  'Upgrade and cancel any time in your account settings',
];

export const UpgradeConfirmationEmail: React.FC<UpgradeConfirmationEmailProps> = ({
  recipient_name,
  tier_display_name,
  previous_tier_display_name,
  upgraded_at,
  benefits = DEFAULT_BENEFITS,
  order_reference,
  account_url,
  lens,
}) => {
  const accentInk = darken(lens.accent, 0.35);
  return (
    <StandardEmailChrome lens={lens}>
      <tr>
        <td style={{ padding: '32px 40px 16px' }}>
          <p style={{ margin: 0, fontFamily: FONT_STACKS.mono, fontSize: 11, letterSpacing: 4, color: '#6A6A6A' }}>
            {lens.accent_label} · UPGRADE CONFIRMED
          </p>
          <h1 style={{ margin: '16px 0 0', fontFamily: FONT_STACKS.heading, fontSize: 32, lineHeight: 1.15, color: lens.accent, fontWeight: 600 }}>
            Thank you, {recipient_name}.
          </h1>
          <p style={{ margin: '12px 0 0', fontFamily: FONT_STACKS.body, fontSize: 16, lineHeight: 1.55, color: '#1C1C1C' }}>
            You have moved from{' '}
            <strong>{previous_tier_display_name ?? 'Executive Introduction'}</strong> to{' '}
            <strong style={{ color: accentInk }}>{tier_display_name}</strong>. Your new benefits
            are active immediately.
          </p>
        </td>
      </tr>

      <tr>
        <td style={{ padding: '12px 40px 20px' }}>
          <p style={{ margin: 0, fontFamily: FONT_STACKS.mono, fontSize: 11, letterSpacing: 3, color: accentInk }}>
            WHAT CHANGED
          </p>
          <ul style={{ margin: '12px 0 0', padding: 0, listStyle: 'none' }}>
            {benefits.map((b, i) => (
              <li key={i} style={{ marginBottom: 8, paddingLeft: 22, position: 'relative', fontFamily: FONT_STACKS.body, fontSize: 15, lineHeight: 1.55, color: '#1C1C1C' }}>
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 4,
                    width: 12,
                    height: 12,
                    background: lens.accent,
                  }}
                />
                {b}
              </li>
            ))}
          </ul>
        </td>
      </tr>

      <tr>
        <td style={{ padding: '0 40px 32px' }}>
          <a
            href={account_url}
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
            Manage your account
          </a>
          {(order_reference || upgraded_at) && (
            <p style={{ margin: '16px 0 0', fontFamily: FONT_STACKS.mono, fontSize: 11, color: '#6A6A6A', lineHeight: 1.5 }}>
              {order_reference && <>Reference {order_reference}{upgraded_at && ' · '}</>}
              {upgraded_at && <>Effective {formatDate(upgraded_at)}</>}
            </p>
          )}
          <p style={{ margin: '10px 0 0', fontFamily: FONT_STACKS.body, fontSize: 13, color: '#6A6A6A' }}>
            {account_url}
          </p>
        </td>
      </tr>
    </StandardEmailChrome>
  );
};

function formatDate(d: string | Date): string {
  try {
    const x = typeof d === 'string' ? new Date(d) : d;
    return x.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
}

export const UpgradeConfirmationEmailTemplate: EmailTemplateDefinition = {
  kind: 'upgrade_confirmation',
  defaultSubject: 'Upgrade confirmed — welcome to {tier_display_name}',
  defaultPreheader: 'Your new benefits are now active. Here is what changed and what to explore first.',
  defaultFromName: 'LYC Partners',
  render({ variables, brandLens }) {
    let benefits: string[] = DEFAULT_BENEFITS;
    try {
      if (Array.isArray((variables as any).benefits)) benefits = (variables as any).benefits;
    } catch { /* ignore */ }
    return React.createElement(UpgradeConfirmationEmail, {
      recipient_name: String(variables.recipient_name ?? 'there'),
      tier_display_name: String(variables.tier_display_name ?? 'Professional'),
      previous_tier_display_name: (variables.previous_tier_display_name as any) ?? undefined,
      upgraded_at: (variables.upgraded_at as any) ?? undefined,
      benefits,
      order_reference: (variables.order_reference as any) ?? undefined,
      account_url: String(variables.account_url ?? '#'),
      lens: brandLens,
    });
  },
};

export default UpgradeConfirmationEmail;
