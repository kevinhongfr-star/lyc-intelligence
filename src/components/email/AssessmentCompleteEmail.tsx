/**
 * components/email/AssessmentCompleteEmail.tsx — #1348 template 2/8.
 *
 * Sent when: an assessment completes and the AI summary job finishes (or
 * a synchronous template-fallback run finishes). Recipient sees their
 * overall score, score-level pill, 3-dimension Executive Introduction
 * preview, and a CTA to open the full result.
 */

import React from 'react';
import type { EmailTemplateDefinition, BrandLens } from '@/services/emailEngine';
import { StandardEmailChrome, FONT_STACKS, darken, formatDate, hexWithAlpha } from './sharedEmailUtils';
import { scoreToReportLevel } from '@/types/reportTokens';

export interface AssessmentCompleteEmailProps {
  recipient_name: string;
  assessment_title: string;
  overall_score: number;
  completed_at: string | Date;
  share_url: string;
  /** Dimension preview — 3 shown if Executive Introduction tier. */
  dimension_preview?: Array<{ label: string; score: number; summary?: string }>;
  lens: BrandLens;
}

export const AssessmentCompleteEmail: React.FC<AssessmentCompleteEmailProps> = ({
  recipient_name,
  assessment_title,
  overall_score,
  completed_at,
  share_url,
  dimension_preview,
  lens,
}) => {
  const lvl = scoreToReportLevel(overall_score);
  const accentInk = darken(lens.accent, 0.35);
  return (
    <StandardEmailChrome lens={lens}>
      <tr>
        <td style={{ padding: '32px 40px 16px' }}>
          <p style={{ margin: 0, fontFamily: FONT_STACKS.mono, fontSize: 11, letterSpacing: 4, color: '#6A6A6A' }}>
            {lens.accent_label} · ASSESSMENT COMPLETE
          </p>
          <h1 style={{ margin: '16px 0 0', fontFamily: FONT_STACKS.heading, fontSize: 32, lineHeight: 1.15, color: lens.accent, fontWeight: 600 }}>
            {assessment_title}
          </h1>
          <p style={{ margin: '8px 0 0', fontFamily: FONT_STACKS.body, fontSize: 15, lineHeight: 1.5, color: '#525252' }}>
            Prepared for <strong style={{ color: '#1C1C1C' }}>{recipient_name}</strong> · {formatDate(completed_at)}
          </p>
        </td>
      </tr>

      <tr>
        <td style={{ padding: '16px 40px' }}>
          <table role="presentation" border={0} cellPadding={0} cellSpacing={0} width="100%">
            <tbody>
              <tr>
                <td style={{ width: 110, verticalAlign: 'middle', fontFamily: FONT_STACKS.heading, fontSize: 64, lineHeight: 1, color: '#0E0E0E', fontWeight: 600 }}>
                  {overall_score}
                </td>
                <td style={{ verticalAlign: 'middle' }}>
                  <p
                    style={{
                      margin: 0,
                      padding: '4px 10px',
                      display: 'inline-block',
                      fontFamily: FONT_STACKS.mono,
                      fontSize: 12,
                      color: lvl.color,
                      border: `1px solid ${hexWithAlpha(lvl.color, 0.2)}`,
                      background: hexWithAlpha(lvl.color, 0.06),
                    }}
                  >
                    {lvl.label.toUpperCase()} LEVEL
                  </p>
                  <p style={{ margin: '10px 0 0', fontFamily: FONT_STACKS.body, fontSize: 14, color: '#525252', lineHeight: 1.5 }}>
                    {dimension_preview ? `${dimension_preview.length} dimensions previewed — open the result for the full picture.`
                                          : 'Open the result to see all six dimensions, insights, and suggested next steps.'}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>

      {dimension_preview && dimension_preview.length > 0 && (
        <tr>
          <td style={{ padding: '8px 40px 20px' }}>
            <p style={{ margin: 0, fontFamily: FONT_STACKS.mono, fontSize: 11, letterSpacing: 3, color: accentInk }}>
              DIMENSION PREVIEW
            </p>
            {dimension_preview.map((d, i) => (
              <div
                key={i}
                style={{ marginTop: 12, padding: '12px 14px', background: '#FAFAFA', border: '1px solid #E5E5E5', borderLeft: `3px solid ${lens.accent}` }}
              >
                <p style={{ margin: 0, fontFamily: FONT_STACKS.heading, fontSize: 17, fontWeight: 600, color: '#0E0E0E' }}>
                  <span style={{ display: 'inline-block', marginRight: 10, color: lens.accent }}>{d.score}</span>
                  {d.label}
                </p>
                {d.summary && (
                  <p style={{ margin: '6px 0 0', fontFamily: FONT_STACKS.body, fontSize: 14, color: '#525252', lineHeight: 1.5 }}>
                    {d.summary}
                  </p>
                )}
              </div>
            ))}
          </td>
        </tr>
      )}

      <tr>
        <td style={{ padding: '8px 40px 32px' }}>
          <a
            href={share_url}
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
            Open your result
          </a>
          <p style={{ margin: '10px 0 0', fontFamily: FONT_STACKS.body, fontSize: 13, color: '#6A6A6A' }}>
            {share_url}
          </p>
        </td>
      </tr>
    </StandardEmailChrome>
  );
};

export const AssessmentCompleteEmailTemplate: EmailTemplateDefinition = {
  kind: 'assessment_complete',
  defaultSubject: 'Your {assessment_title} assessment result is ready',
  defaultPreheader: 'See your score, dimension breakdown, and NEXUS insights inside.',
  defaultFromName: 'LYC Partners',
  render({ variables, brandLens }) {
    let preview: AssessmentCompleteEmailProps['dimension_preview'];
    try {
      preview = Array.isArray((variables as any).dimension_preview) ? (variables as any).dimension_preview : undefined;
    } catch { /* ignore */ }
    return React.createElement(AssessmentCompleteEmail, {
      recipient_name: String(variables.recipient_name ?? 'there'),
      assessment_title: String(variables.assessment_title ?? 'LYC Assessment'),
      overall_score: Number(variables.overall_score ?? 0),
      completed_at: (variables.completed_at as any) ?? new Date(),
      share_url: String(variables.share_url ?? '#'),
      dimension_preview: preview,
      lens: brandLens,
    });
  },
};

export default AssessmentCompleteEmail;
