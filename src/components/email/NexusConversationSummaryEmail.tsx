/**
 * components/email/NexusConversationSummaryEmail.tsx — #1348 template 7/8.
 *
 * Triggered when: a long-running NEXUS session wraps (user clicks "email me
 * a summary" or the session-complete hook fires). Contents:
 *   • 3-line agenda / context recap
 *   • Key takeaways list (bulleted)
 *   • Suggested next actions, each with a "reopen in NEXUS" CTA
 *   • Timestamp + session id
 */

import React from 'react';
import type { EmailTemplateDefinition, BrandLens } from '@/services/emailEngine';
import { StandardEmailChrome, FONT_STACKS, darken, formatDate } from './sharedEmailUtils';

export interface NexusConversationSummaryEmailProps {
  recipient_name: string;
  session_topic: string;
  session_reference_code: string;
  started_at?: string | Date;
  ended_at?: string | Date;
  messages_total?: number;
  agenda?: string[];
  key_takeaways: string[];
  next_actions: Array<{ label: string; reopen_url: string }>;
  reopen_all_url: string;
  lens: BrandLens;
}

export const NexusConversationSummaryEmail: React.FC<NexusConversationSummaryEmailProps> = ({
  recipient_name,
  session_topic,
  session_reference_code,
  started_at,
  ended_at,
  messages_total,
  agenda,
  key_takeaways,
  next_actions,
  reopen_all_url,
  lens,
}) => {
  const accentInk = darken(lens.accent, 0.35);
  return (
    <StandardEmailChrome lens={lens}>
      <tr>
        <td style={{ padding: '32px 40px 16px' }}>
          <p style={{ margin: 0, fontFamily: FONT_STACKS.mono, fontSize: 11, letterSpacing: 4, color: '#6A6A6A' }}>
            NEXUS · SESSION SUMMARY
          </p>
          <h1 style={{ margin: '16px 0 0', fontFamily: FONT_STACKS.heading, fontSize: 32, lineHeight: 1.15, color: lens.accent, fontWeight: 600 }}>
            {session_topic}
          </h1>
          <p style={{ margin: '8px 0 0', fontFamily: FONT_STACKS.mono, fontSize: 11, color: '#6A6A6A' }}>
            Session {session_reference_code}
            {started_at && ` · ${formatDate(started_at)}`}
            {messages_total && ` · ${messages_total} messages`}
            {ended_at && ` · closed ${formatDate(ended_at)}`}
          </p>
        </td>
      </tr>

      {agenda && agenda.length > 0 && (
        <tr>
          <td style={{ padding: '12px 40px 8px' }}>
            <p style={{ margin: 0, fontFamily: FONT_STACKS.mono, fontSize: 11, letterSpacing: 3, color: accentInk }}>
              DISCUSSION
            </p>
            <div style={{ marginTop: 10, padding: '14px 16px', background: '#FAFAFA', border: '1px solid #E5E5E5' }}>
              {agenda.map((a, i) => (
                <p key={i} style={{ margin: i === 0 ? 0 : '8px 0 0', fontFamily: FONT_STACKS.body, fontSize: 15, lineHeight: 1.55, color: '#1C1C1C' }}>
                  {a}
                </p>
              ))}
            </div>
          </td>
        </tr>
      )}

      <tr>
        <td style={{ padding: '12px 40px 8px' }}>
          <p style={{ margin: 0, fontFamily: FONT_STACKS.mono, fontSize: 11, letterSpacing: 3, color: accentInk }}>
            KEY TAKEAWAYS
          </p>
          <ul style={{ margin: '10px 0 0', padding: 0, listStyle: 'none' }}>
            {key_takeaways.map((k, i) => (
              <li
                key={i}
                style={{
                  marginBottom: 8,
                  paddingLeft: 22,
                  position: 'relative',
                  fontFamily: FONT_STACKS.body,
                  fontSize: 15,
                  lineHeight: 1.55,
                  color: '#1C1C1C',
                }}
              >
                <span aria-hidden style={{ position: 'absolute', left: 0, top: 4, width: 12, height: 12, background: lens.accent }} />
                {k}
              </li>
            ))}
          </ul>
        </td>
      </tr>

      <tr>
        <td style={{ padding: '12px 40px 20px' }}>
          <p style={{ margin: 0, fontFamily: FONT_STACKS.mono, fontSize: 11, letterSpacing: 3, color: accentInk }}>
            SUGGESTED NEXT ACTIONS
          </p>
          <table role="presentation" border={0} cellPadding={0} cellSpacing={0} width="100%" style={{ marginTop: 10 }}>
            <tbody>
              {next_actions.map((na, i) => (
                <tr key={i}>
                  <td style={{ padding: '10px 12px', borderBottom: i === next_actions.length - 1 ? 'none' : '1px solid #E5E5E5', verticalAlign: 'middle' }}>
                    <p style={{ margin: 0, fontFamily: FONT_STACKS.heading, fontSize: 16, fontWeight: 600, color: '#0E0E0E' }}>
                      {na.label}
                    </p>
                  </td>
                  <td align="right" style={{ padding: '10px 0', width: 140, borderBottom: i === next_actions.length - 1 ? 'none' : '1px solid #E5E5E5', verticalAlign: 'middle' }}>
                    <a href={na.reopen_url} style={{ fontFamily: FONT_STACKS.body, fontSize: 13, fontWeight: 600, color: lens.accent, textDecoration: 'none' }}>
                      REOPEN →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </td>
      </tr>

      <tr>
        <td style={{ padding: '0 40px 32px' }}>
          <a
            href={reopen_all_url}
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
            Continue the conversation with NEXUS
          </a>
          <p style={{ margin: '10px 0 0', fontFamily: FONT_STACKS.body, fontSize: 13, color: '#6A6A6A' }}>
            {reopen_all_url}
          </p>
          <p style={{ margin: '10px 0 0', fontFamily: FONT_STACKS.body, fontSize: 13, color: '#8C8C8C' }}>
            Prepared for <strong style={{ color: '#1C1C1C' }}>{recipient_name}</strong>.
          </p>
        </td>
      </tr>
    </StandardEmailChrome>
  );
};

export const NexusConversationSummaryEmailTemplate: EmailTemplateDefinition = {
  kind: 'nexus_conversation_summary',
  defaultSubject: 'Your NEXUS conversation summary',
  defaultPreheader: 'A written record of your recent NEXUS session — key takeaways and suggested follow-ups.',
  defaultFromName: 'LYC Partners · NEXUS',
  render({ variables, brandLens }) {
    let key_takeaways: string[] = [];
    let next_actions: NexusConversationSummaryEmailProps['next_actions'] = [];
    let agenda: string[] | undefined;
    try {
      if (Array.isArray((variables as any).key_takeaways)) key_takeaways = (variables as any).key_takeaways;
      if (Array.isArray((variables as any).next_actions)) next_actions = (variables as any).next_actions;
      if (Array.isArray((variables as any).agenda)) agenda = (variables as any).agenda;
    } catch { /* ignore */ }
    return React.createElement(NexusConversationSummaryEmail, {
      recipient_name: String(variables.recipient_name ?? 'there'),
      session_topic: String(variables.session_topic ?? 'NEXUS conversation'),
      session_reference_code: String(variables.session_reference_code ?? '—'),
      started_at: (variables.started_at as any) ?? undefined,
      ended_at: (variables.ended_at as any) ?? undefined,
      messages_total: (variables.messages_total as any) ?? undefined,
      agenda,
      key_takeaways,
      next_actions,
      reopen_all_url: String(variables.reopen_all_url ?? '#'),
      lens: brandLens,
    });
  },
  variableCheck(vars) {
    const issues = [];
    if (!Array.isArray((vars as any).key_takeaways) || !(vars as any).key_takeaways.length) {
      issues.push({ severity: 'warn', code: 'MISSING_VAR', message: 'nexus_conversation_summary has no key_takeaways' });
    }
    return issues;
  },
};

export default NexusConversationSummaryEmail;
