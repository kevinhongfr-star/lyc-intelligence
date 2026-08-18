/**
 * components/email/ShareResultEmail.tsx — #62/#1343 template 8/8: share-result email.
 *
 * Used by #1348 Email Engine. Rendered output should be flat, SendCloud-safe:
 *   • 600px outer width (email-css layer handles it; we also inline widths)
 *   • No CSS custom properties (they strip in many clients)
 *   • Color palette hardcoded inline so we don't depend on external CSS
 *   • System serif headings (DejaVu Serif / Georgia / Times) fall back to Georgia; DM Sans → Arial/sans-serif
 *
 * Content: recipient greeting, score hero mini, 3 strengths (or 1 for EI tier),
 * share CTA to open in browser, footer confidentiality.
 */

import React from 'react';
import type { AssessmentResultData } from '@/types/reportTemplates';
import { DIAGNOSTIC_ACCENTS, scoreToReportLevel, CONFIDENTIALITY_STATEMENTS } from '@/types/reportTokens';

export interface ShareResultEmailProps {
  data: AssessmentResultData;
  /** Optional note added by the sharing user (appears top of the body). */
  senderNote?: string | null;
  /** Person sharing — default is data.recipient.name. */
  senderName?: string | null;
  /** Open-in-browser URL — mandatory for CTA. */
  shareUrl: string;
}

export const ShareResultEmail: React.FC<ShareResultEmailProps> = ({
  data,
  senderNote,
  senderName,
  shareUrl,
}) => {
  const slug = data.definition.assessment_id as keyof typeof DIAGNOSTIC_ACCENTS;
  const accent = DIAGNOSTIC_ACCENTS[slug]?.accent ?? '#C108AB';
  const accentInk = darken(accent, 0.35);
  const overall = data.result.overall_score ?? 0;
  const lvl = scoreToReportLevel(overall);
  const from = senderName || data.recipient.name || 'A LYC Partner';

  return (
    <table
      role="presentation"
      border={0}
      cellPadding={0}
      cellSpacing={0}
      width="100%"
      style={{ background: '#FAFAFA', margin: 0, padding: 0 }}
    >
      <tbody>
        <tr>
          <td align="center" style={{ padding: '32px 0' }}>
            <table
              role="presentation"
              border={0}
              cellPadding={0}
              cellSpacing={0}
              width="600"
              style={{
                background: '#FFFFFF',
                width: 600,
                maxWidth: 600,
                border: `1px solid #E5E5E5`,
              }}
            >
              <tbody>
                {/* Brand strip */}
                <tr>
                  <td style={{ height: 8, background: accent }} />
                </tr>

                {/* Header */}
                <tr>
                  <td style={{ padding: '32px 40px 16px' }}>
                    <p
                      style={{
                        margin: 0,
                        fontFamily: "'IBM Plex Mono', 'Menlo', monospace",
                        fontSize: 11,
                        letterSpacing: 4,
                        color: '#6A6A6A',
                      }}
                    >
                      LYC PARTNERS · EXECUTIVE ASSESSMENT
                    </p>
                    <h1
                      style={{
                        margin: '16px 0 0',
                        fontFamily: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif",
                        fontSize: 32,
                        lineHeight: 1.15,
                        color: accent,
                        fontWeight: 600,
                      }}
                    >
                      {data.definition.title}
                    </h1>
                    <p
                      style={{
                        margin: '8px 0 0',
                        fontFamily: "'DM Sans', Arial, sans-serif",
                        fontSize: 16,
                        lineHeight: 1.5,
                        color: '#525252',
                      }}
                    >
                      {data.definition.subtitle}
                    </p>
                  </td>
                </tr>

                {/* Sender note */}
                {senderNote ? (
                  <tr>
                    <td style={{ padding: '16px 40px' }}>
                      <div
                        style={{
                          padding: '16px 20px',
                          background: '#FAFAFA',
                          borderLeft: `4px solid ${accent}`,
                          border: `1px solid #E5E5E5`,
                        }}
                      >
                        <p style={{ margin: 0, fontFamily: "'DM Sans', Arial, sans-serif", fontSize: 13, color: accentInk, letterSpacing: 1 }}>
                          NOTE FROM {from.toUpperCase()}
                        </p>
                        <p
                          style={{
                            margin: '8px 0 0',
                            fontFamily: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif",
                            fontSize: 18,
                            lineHeight: 1.4,
                            color: '#0E0E0E',
                          }}
                        >
                          {senderNote}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td style={{ padding: '8px 40px 16px' }}>
                      <p
                        style={{
                          margin: 0,
                          fontFamily: "'DM Sans', Arial, sans-serif",
                          fontSize: 16,
                          lineHeight: 1.55,
                          color: '#1C1C1C',
                        }}
                      >
                        <strong style={{ fontWeight: 600 }}>{from}</strong> has shared their{' '}
                        <strong>{data.definition.title}</strong> assessment result with you.
                        Open it in the browser to see the full report.
                      </p>
                    </td>
                  </tr>
                )}

                {/* Score block */}
                <tr>
                  <td style={{ padding: '16px 40px' }}>
                    <table role="presentation" border={0} cellPadding={0} cellSpacing={0} width="100%">
                      <tbody>
                        <tr>
                          <td
                            style={{
                              width: 110,
                              verticalAlign: 'middle',
                              fontFamily: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif",
                              fontSize: 64,
                              lineHeight: 1,
                              color: '#0E0E0E',
                              fontWeight: 600,
                            }}
                          >
                            {overall}
                          </td>
                          <td style={{ verticalAlign: 'middle' }}>
                            <p
                              style={{
                                margin: 0,
                                padding: '4px 10px',
                                display: 'inline-block',
                                fontFamily: "'IBM Plex Mono', 'Menlo', monospace",
                                fontSize: 12,
                                color: lvl.color,
                                border: `1px solid ${hexWithAlpha(lvl.color, 0.2)}`,
                                background: hexWithAlpha(lvl.color, 0.06),
                              }}
                            >
                              {lvl.label.toUpperCase()} LEVEL
                            </p>
                            <p style={{ margin: '10px 0 0', fontFamily: "'DM Sans', Arial, sans-serif", fontSize: 14, color: '#525252', lineHeight: 1.5 }}>
                              Prepared for <strong style={{ color: '#1C1C1C' }}>{data.recipient.name}</strong>
                              <span style={{ color: '#A3A3A3' }}> · {formatDate(data.result.completed_at)}</span>
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>

                {/* Strengths summary */}
                {data.aiInsights?.strengths?.[0] ? (
                  <tr>
                    <td style={{ padding: '8px 40px 20px' }}>
                      <p
                        style={{
                          margin: 0,
                          fontFamily: "'IBM Plex Mono', 'Menlo', monospace",
                          fontSize: 11,
                          letterSpacing: 3,
                          color: accentInk,
                        }}
                      >
                        {data.aiInsights.strengths.length > 1 ? 'HIGHLIGHTED STRENGTHS' : 'KEY STRENGTH'}
                      </p>
                      {data.aiInsights.strengths.slice(0, 3).map((s, i) => (
                        <div
                          key={i}
                          style={{
                            marginTop: 10,
                            padding: '12px 14px',
                            background: '#FAFAFA',
                            border: `1px solid #E5E5E5`,
                            borderLeft: `3px solid ${accent}`,
                          }}
                        >
                          <p style={{ margin: 0, fontFamily: "'DM Sans', Arial, sans-serif", fontSize: 15, lineHeight: 1.5, color: '#1C1C1C' }}>
                            <span
                              aria-hidden="true"
                              style={{
                                display: 'inline-block',
                                marginRight: 8,
                                width: 20,
                                height: 20,
                                lineHeight: '20px',
                                textAlign: 'center',
                                fontFamily: "'IBM Plex Mono', 'Menlo', monospace",
                                fontSize: 11,
                                color: '#FFFFFF',
                                background: accent,
                              }}
                            >
                              {i + 1}
                            </span>
                            {s}
                          </p>
                        </div>
                      ))}
                    </td>
                  </tr>
                ) : null}

                {/* CTA */}
                <tr>
                  <td style={{ padding: '8px 40px 32px' }}>
                    <table role="presentation" border={0} cellPadding={0} cellSpacing={0} width="100%">
                      <tbody>
                        <tr>
                          <td align="left">
                            <a
                              href={shareUrl}
                              style={{
                                display: 'inline-block',
                                padding: '14px 26px',
                                fontFamily: "'DM Sans', Arial, sans-serif",
                                fontSize: 15,
                                fontWeight: 600,
                                color: '#FFFFFF',
                                background: accent,
                                textDecoration: 'none',
                              }}
                            >
                              Open the full report
                            </a>
                            <p style={{ margin: '10px 0 0', fontFamily: "'DM Sans', Arial, sans-serif", fontSize: 13, color: '#6A6A6A' }}>
                              {shareUrl}
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>

                {/* Footer confidentiality */}
                <tr>
                  <td style={{ padding: '20px 40px 28px', background: '#FAFAFA', borderTop: '1px solid #E5E5E5' }}>
                    <p style={{ margin: 0, fontFamily: "'DM Sans', Arial, sans-serif", fontSize: 12, color: '#8C8C8C', lineHeight: 1.55 }}>
                      {CONFIDENTIALITY_STATEMENTS.forClient}
                    </p>
                    <p style={{ margin: '10px 0 0', fontFamily: "'IBM Plex Mono', 'Menlo', monospace", fontSize: 11, color: '#A3A3A3' }}>
                      © {new Date().getFullYear()} LYC PARTNERS · {slug.toUpperCase()}
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

/* ── helpers (kept local to avoid coupling) ───────────────────────── */

function formatDate(iso?: string | null): string {
  try {
    const d = iso ? new Date(iso) : new Date();
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
}

function darken(hex: string, amount: number): string {
  const c = hex.replace('#', '');
  if (c.length !== 6) return hex;
  const n = parseInt(c, 16);
  const r = Math.max(0, Math.round(((n >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((n >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((n & 0xff) * (1 - amount)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function hexWithAlpha(hex: string, alpha: number): string {
  const c = hex.replace('#', '');
  if (c.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default ShareResultEmail;
