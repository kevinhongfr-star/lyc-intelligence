/**
 * components/email/WeeklyDigestEmail.tsx — #1348 template 6/8.
 *
 * Triggered by scheduled:weekly-digest (Monday 9am local). 3 sections:
 *   1. Activity summary table (assessments + NEXUS sessions + share counts)
 *   2. Headline: one sentence per completed result ("Notable patterns this week")
 *   3. Suggested action: "Bring this to NEXUS" CTA + open dashboard button
 */

import React from 'react';
import type { EmailTemplateDefinition, BrandLens } from '@/services/emailEngine';
import { StandardEmailChrome, FONT_STACKS, darken, formatDate } from './sharedEmailUtils';

export interface WeeklyDigestResultItem {
  title: string;
  diagnostic: string;
  completed_at: string | Date;
  score: number;
  one_line: string;
}
export interface WeeklyDigestNexusItem {
  topic: string;
  turns: number;
  last_message: string;
  continue_url: string;
}

export interface WeeklyDigestEmailProps {
  recipient_name: string;
  week_label: string;               // e.g. "Week of Mon 3 Feb"
  summary_counts: {
    assessments_completed: number;
    nexus_sessions: number;
    shares_sent: number;
    insights_generated: number;
  };
  results?: WeeklyDigestResultItem[];
  nexus?: WeeklyDigestNexusItem[];
  dashboard_url: string;
  lens: BrandLens;
}

export const WeeklyDigestEmail: React.FC<WeeklyDigestEmailProps> = ({
  recipient_name,
  week_label,
  summary_counts,
  results,
  nexus,
  dashboard_url,
  lens,
}) => {
  const accentInk = darken(lens.accent, 0.35);
  return (
    <StandardEmailChrome lens={lens}>
      <tr>
        <td style={{ padding: '32px 40px 16px' }}>
          <p style={{ margin: 0, fontFamily: FONT_STACKS.mono, fontSize: 11, letterSpacing: 4, color: '#6A6A6A' }}>
            WEEKLY DIGEST · {week_label.toUpperCase()}
          </p>
          <h1 style={{ margin: '16px 0 0', fontFamily: FONT_STACKS.heading, fontSize: 32, lineHeight: 1.15, color: lens.accent, fontWeight: 600 }}>
            Your week, {recipient_name}.
          </h1>
          <p style={{ margin: '12px 0 0', fontFamily: FONT_STACKS.body, fontSize: 16, lineHeight: 1.55, color: '#1C1C1C' }}>
            A short written report of what happened inside LYC Partners this week and
            what NEXUS would recommend next.
          </p>
        </td>
      </tr>

      <tr>
        <td style={{ padding: '16px 40px' }}>
          <table role="presentation" border={0} cellPadding={0} cellSpacing={0} width="100%">
            <tbody>
              <tr>
                {[
                  { label: 'ASSESSMENTS', n: summary_counts.assessments_completed },
                  { label: 'NEXUS SESSIONS', n: summary_counts.nexus_sessions },
                  { label: 'SHARES SENT', n: summary_counts.shares_sent },
                  { label: 'AI INSIGHTS', n: summary_counts.insights_generated },
                ].map((c, i) => (
                  <td key={i} style={{ width: '25%', paddingRight: i === 3 ? 0 : 8 }}>
                    <div style={{ padding: '14px 12px', background: '#FAFAFA', border: '1px solid #E5E5E5', borderTop: `3px solid ${lens.accent}` }}>
                      <p style={{ margin: 0, fontFamily: FONT_STACKS.mono, fontSize: 10, letterSpacing: 3, color: accentInk }}>
                        {c.label}
                      </p>
                      <p style={{ margin: '8px 0 0', fontFamily: FONT_STACKS.heading, fontSize: 30, fontWeight: 600, color: '#0E0E0E', lineHeight: 1 }}>
                        {c.n}
                      </p>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </td>
      </tr>

      {results && results.length > 0 && (
        <tr>
          <td style={{ padding: '16px 40px 12px' }}>
            <p style={{ margin: 0, fontFamily: FONT_STACKS.mono, fontSize: 11, letterSpacing: 3, color: accentInk }}>
              COMPLETED ASSESSMENTS
            </p>
            {results.map((r, i) => (
              <div key={i} style={{ marginTop: 12, padding: '14px 16px', background: '#FAFAFA', border: '1px solid #E5E5E5', borderLeft: `3px solid ${lens.accent}` }}>
                <p style={{ margin: 0, fontFamily: FONT_STACKS.heading, fontSize: 18, fontWeight: 600, color: '#0E0E0E' }}>
                  {r.title}
                  <span style={{ marginLeft: 10, fontFamily: FONT_STACKS.mono, fontSize: 12, color: lens.accent }}>
                    {r.diagnostic.toUpperCase()} · {r.score}
                  </span>
                </p>
                <p style={{ margin: '6px 0 0', fontFamily: FONT_STACKS.body, fontSize: 14, lineHeight: 1.5, color: '#525252' }}>
                  {r.one_line}
                </p>
                <p style={{ margin: '4px 0 0', fontFamily: FONT_STACKS.mono, fontSize: 11, color: '#8C8C8C' }}>
                  {formatDate(r.completed_at)}
                </p>
              </div>
            ))}
          </td>
        </tr>
      )}

      {nexus && nexus.length > 0 && (
        <tr>
          <td style={{ padding: '8px 40px 12px' }}>
            <p style={{ margin: 0, fontFamily: FONT_STACKS.mono, fontSize: 11, letterSpacing: 3, color: accentInk }}>
              NEXUS SESSIONS THIS WEEK
            </p>
            {nexus.map((n, i) => (
              <div key={i} style={{ marginTop: 12, padding: '14px 16px', border: '1px solid #E5E5E5' }}>
                <p style={{ margin: 0, fontFamily: FONT_STACKS.heading, fontSize: 17, fontWeight: 600, color: '#0E0E0E' }}>
                  {n.topic} <span style={{ fontFamily: FONT_STACKS.mono, fontSize: 11, color: '#6A6A6A' }}>· {n.turns} turns</span>
                </p>
                <p style={{ margin: '6px 0 0', fontFamily: FONT_STACKS.body, fontSize: 14, color: '#525252', lineHeight: 1.5 }}>
                  Last: {n.last_message}
                </p>
                <p style={{ margin: '8px 0 0', fontFamily: FONT_STACKS.body, fontSize: 13 }}>
                  <a href={n.continue_url} style={{ color: lens.accent, textDecoration: 'none', fontWeight: 600 }}>
                    Continue in NEXUS →
                  </a>
                </p>
              </div>
            ))}
          </td>
        </tr>
      )}

      <tr>
        <td style={{ padding: '12px 40px 32px' }}>
          <a
            href={dashboard_url}
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
            Open your dashboard
          </a>
          <p style={{ margin: '10px 0 0', fontFamily: FONT_STACKS.body, fontSize: 13, color: '#6A6A6A' }}>
            {dashboard_url}
          </p>
        </td>
      </tr>
    </StandardEmailChrome>
  );
};

export const WeeklyDigestEmailTemplate: EmailTemplateDefinition = {
  kind: 'weekly_digest',
  defaultSubject: 'Your weekly LYC Partners digest',
  defaultPreheader: 'Highlights from your week inside LYC Partners — NEXUS conversations and progress.',
  defaultFromName: 'LYC Partners',
  render({ variables, brandLens }) {
    let results: WeeklyDigestResultItem[] | undefined;
    let nexus: WeeklyDigestNexusItem[] | undefined;
    try { results = Array.isArray((variables as any).results) ? (variables as any).results : undefined; } catch { /* ignore */ }
    try { nexus = Array.isArray((variables as any).nexus) ? (variables as any).nexus : undefined; } catch { /* ignore */ }
    return React.createElement(WeeklyDigestEmail, {
      recipient_name: String(variables.recipient_name ?? 'there'),
      week_label: String(variables.week_label ?? 'This week'),
      summary_counts: (variables as any).summary_counts ?? { assessments_completed: 0, nexus_sessions: 0, shares_sent: 0, insights_generated: 0 },
      results,
      nexus,
      dashboard_url: String(variables.dashboard_url ?? '#'),
      lens: brandLens,
    });
  },
};

export default WeeklyDigestEmail;
