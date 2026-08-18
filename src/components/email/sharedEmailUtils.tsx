/**
 * components/email/sharedEmailUtils.ts — #1348 common email helpers.
 *
 * Mirror of the helpers inside ShareResultEmail but exposed so the 7 other
 * email template components don't re-declare them.
 */

export function darken(hex: string, amount: number): string {
  const c = hex.replace('#', '');
  if (c.length !== 6) return hex;
  const n = parseInt(c, 16);
  const r = Math.max(0, Math.round(((n >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((n >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((n & 0xff) * (1 - amount)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function hexWithAlpha(hex: string, alpha: number): string {
  const c = hex.replace('#', '');
  if (c.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function formatDate(iso?: string | Date | null): string {
  try {
    const d = iso ? (iso instanceof Date ? iso : new Date(iso)) : new Date();
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
}

export const FONT_STACKS = {
  mono:    "'IBM Plex Mono', 'Menlo', monospace",
  heading: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif",
  body:    "'DM Sans', Arial, sans-serif",
} as const;

export const EMAIL_WIDTH = 600;

import React from 'react';
import type { BrandLens } from '@/services/emailEngine';

export interface StandardEmailChromeProps {
  lens: BrandLens;
  children: React.ReactNode;
  /** Override outer background — uses #FAFAFA by default. */
  outerBg?: string;
  /** Override body background — uses #FFFFFF by default. */
  bodyBg?: string;
}

/**
 * Shared chrome: 8px brand strip + confidentiality footer. Each template
 * drops its content in. This mirrors ShareResultEmail's shell.
 */
export const StandardEmailChrome: React.FC<StandardEmailChromeProps> = ({
  lens,
  children,
  outerBg = '#FAFAFA',
  bodyBg = '#FFFFFF',
}) => {
  return (
    <table
      role="presentation"
      border={0}
      cellPadding={0}
      cellSpacing={0}
      width="100%"
      style={{ background: outerBg, margin: 0, padding: 0 }}
    >
      <tbody>
        <tr>
          <td align="center" style={{ padding: '32px 0' }}>
            <table
              role="presentation"
              border={0}
              cellPadding={0}
              cellSpacing={0}
              width={String(EMAIL_WIDTH)}
              style={{
                background: bodyBg,
                width: EMAIL_WIDTH,
                maxWidth: EMAIL_WIDTH,
                border: `1px solid #E5E5E5`,
              }}
            >
              <tbody>
                <tr>
                  <td style={{ height: 8, background: lens.accent }} />
                </tr>
                {children}
                <tr>
                  <td
                    style={{
                      padding: '20px 40px 28px',
                      background: outerBg,
                      borderTop: '1px solid #E5E5E5',
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontFamily: FONT_STACKS.body,
                        fontSize: 12,
                        color: '#8C8C8C',
                        lineHeight: 1.55,
                      }}
                    >
                      {lens.confidentiality_banner}
                    </p>
                    <p
                      style={{
                        margin: '10px 0 0',
                        fontFamily: FONT_STACKS.mono,
                        fontSize: 11,
                        color: '#A3A3A3',
                      }}
                    >
                      © {new Date().getFullYear()} LYC PARTNERS · {lens.accent_label}
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default StandardEmailChrome;
