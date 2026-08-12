/**
 * #1325 — Consultant-facing results summary.
 *
 * Executive summary view for consultants: NOT the full assessment report.
 * Surfaces the headline verdict, key talking points, strengths/gaps, and
 * recommended discussion topics so the consultant can walk into the debrief
 * prepared in 60 seconds.
 *
 * Brand rules: zero border radius, Crimson Pro headings, DM Sans body,
 * IBM Plex Mono labels, single accent #C108AB, premium tone.
 */
import React from 'react';
import {
  ArrowRight, ArrowUpRight, Check, AlertTriangle, MessageSquare,
  Sparkles, FileText, TrendingUp, Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export interface StrengthGapItem {
  label: string;
  /** Optional short evidence/detail line. */
  detail?: string;
}

export interface TalkingPoint {
  title: string;
  body: string;
}

export interface ConsultantResultsSummaryProps {
  /** Candidate display name. */
  candidateName: string;
  /** Assessment instrument name/code (e.g. "CPI"). */
  assessmentName: string;
  /** When the assessment was completed. */
  completedAt?: string;
  /** One- or two-sentence headline verdict for the consultant. */
  executiveSummary: string;
  /** Overall fit/positioning label, e.g. "Strong Fit" or "High Potential". */
  headlineLabel?: string;
  /** Key talking points for the debrief conversation. */
  talkingPoints: TalkingPoint[];
  /** Top strengths to affirm. */
  strengths: StrengthGapItem[];
  /** Gaps or risk flags to probe. */
  gaps: StrengthGapItem[];
  /** Recommended discussion topics / next-step prompts. */
  discussionTopics: string[];
  /** Optional URL to the full report. */
  fullReportUrl?: string;
  /** Loading state — renders a branded skeleton. */
  loading?: boolean;
}

const DS = {
  headingFont: "'Crimson Pro', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  monoFont: "'IBM Plex Mono', 'Courier New', monospace",
  accent: '#C108AB',
  accentHover: '#A00790',
  ink: '#0A0A12',
  textSecondary: '#2B2B3A',
  muted: '#616170',
  border: '#E9E7E1',
  bgAlt: '#F7F6F3',
  success: '#1A7A4A',
  warn: '#B45309',
  radius: '0px',
};

const TRANSITION = '200ms cubic-bezier(0.4, 0, 0.2, 1)';

export function ConsultantResultsSummary({
  candidateName,
  assessmentName,
  completedAt,
  executiveSummary,
  headlineLabel,
  talkingPoints,
  strengths,
  gaps,
  discussionTopics,
  fullReportUrl,
  loading,
}: ConsultantResultsSummaryProps) {
  if (loading) {
    return (
      <div
        style={{
          border: `1px solid ${DS.border}`,
          background: '#FFFFFF',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
          fontFamily: DS.bodyFont,
          color: DS.muted,
        }}
      >
        <Loader2 size={22} className="animate-spin" style={{ color: DS.accent }} />
        <span style={{ fontSize: '13px' }}>Preparing the executive summary…</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header / verdict banner */}
      <section
        style={{
          border: `1px solid ${DS.border}`,
          background: '#FFFFFF',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${DS.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: DS.monoFont,
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: DS.accent,
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <FileText size={12} /> Executive summary
            </div>
            <h2
              style={{
                margin: 0,
                fontFamily: DS.headingFont,
                fontSize: '24px',
                fontWeight: 700,
                color: DS.ink,
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
              }}
            >
              {candidateName}
              <span
                style={{
                  fontFamily: DS.bodyFont,
                  fontSize: '14px',
                  fontWeight: 500,
                  color: DS.muted,
                  marginLeft: '10px',
                  letterSpacing: 0,
                }}
              >
                · {assessmentName}
              </span>
            </h2>
            {completedAt && (
              <p
                style={{
                  margin: '6px 0 0 0',
                  fontFamily: DS.monoFont,
                  fontSize: '10px',
                  color: DS.muted,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                Completed {completedAt}
              </p>
            )}
          </div>

          {headlineLabel && (
            <div
              style={{
                padding: '8px 14px',
                background: `${DS.accent}12`,
                border: `1px solid ${DS.accent}40`,
                color: DS.accent,
                fontFamily: DS.monoFont,
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
              }}
            >
              {headlineLabel}
            </div>
          )}
        </div>

        <div style={{ padding: '24px' }}>
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: DS.muted,
              marginBottom: '10px',
            }}
          >
            The verdict, in brief
          </div>
          <p
            style={{
              margin: 0,
              fontFamily: DS.headingFont,
              fontSize: '19px',
              fontWeight: 500,
              color: DS.ink,
              lineHeight: 1.5,
              letterSpacing: '-0.005em',
            }}
          >
            {executiveSummary}
          </p>
        </div>
      </section>

      {/* Key talking points */}
      <section
        style={{
          border: `1px solid ${DS.border}`,
          background: '#FFFFFF',
        }}
      >
        <SectionHeader
          icon={<MessageSquare size={12} />}
          eyebrow="For the debrief"
          title="Key talking points"
        />
        <div style={{ padding: '0 24px 20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {talkingPoints.length === 0 ? (
            <EmptyHint>No talking points synthesized yet.</EmptyHint>
          ) : (
            talkingPoints.map((tp, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '28px 1fr',
                  gap: '12px',
                  padding: '14px 16px',
                  background: DS.bgAlt,
                  border: `1px solid ${DS.border}`,
                }}
              >
                <span
                  style={{
                    fontFamily: DS.monoFont,
                    fontSize: '11px',
                    fontWeight: 700,
                    color: DS.accent,
                    letterSpacing: '0.12em',
                    paddingTop: '2px',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h4
                    style={{
                      margin: '0 0 4px 0',
                      fontFamily: DS.headingFont,
                      fontSize: '16px',
                      fontWeight: 700,
                      color: DS.ink,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {tp.title}
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: DS.bodyFont,
                      fontSize: '13px',
                      color: DS.textSecondary,
                      lineHeight: 1.6,
                    }}
                  >
                    {tp.body}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Strengths + Gaps — two columns */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '20px',
        }}
      >
        {/* Strengths */}
        <div style={{ border: `1px solid ${DS.border}`, background: '#FFFFFF' }}>
          <SectionHeader
            icon={<Check size={12} />}
            iconColor={DS.success}
            eyebrow="Affirm these"
            title="Strengths"
          />
          <div style={{ padding: '0 24px 20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {strengths.length === 0 ? (
              <EmptyHint>No strengths flagged.</EmptyHint>
            ) : (
              strengths.map((s, i) => (
                <StrengthGapRow key={`s-${i}`} item={s} kind="strength" />
              ))
            )}
          </div>
        </div>

        {/* Gaps */}
        <div style={{ border: `1px solid ${DS.border}`, background: '#FFFFFF' }}>
          <SectionHeader
            icon={<AlertTriangle size={12} />}
            iconColor={DS.warn}
            eyebrow="Probe these"
            title="Gaps & risks"
          />
          <div style={{ padding: '0 24px 20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {gaps.length === 0 ? (
              <EmptyHint>No gaps flagged.</EmptyHint>
            ) : (
              gaps.map((g, i) => (
                <StrengthGapRow key={`g-${i}`} item={g} kind="gap" />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Recommended discussion topics */}
      <section
        style={{
          border: `1px solid ${DS.border}`,
          background: '#FFFFFF',
        }}
      >
        <SectionHeader
          icon={<TrendingUp size={12} />}
          eyebrow="Open the conversation with"
          title="Recommended discussion topics"
        />
        <div style={{ padding: '0 24px 20px 24px' }}>
          {discussionTopics.length === 0 ? (
            <EmptyHint>No discussion topics yet.</EmptyHint>
          ) : (
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {discussionTopics.map((topic, i) => (
                <li
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '8px 1fr',
                    gap: '12px',
                    alignItems: 'flex-start',
                    padding: '8px 0',
                    borderBottom:
                      i < discussionTopics.length - 1 ? `1px solid ${DS.border}` : 'none',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      background: DS.accent,
                      marginTop: '7px',
                    }}
                  />
                  <span
                    style={{
                      fontFamily: DS.bodyFont,
                      fontSize: '13.5px',
                      color: DS.textSecondary,
                      lineHeight: 1.55,
                    }}
                  >
                    {topic}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Footer CTA → full report */}
      {fullReportUrl && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            paddingTop: '4px',
          }}
        >
          <Link
            to={fullReportUrl}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              background: 'transparent',
              border: `1px solid ${DS.ink}`,
              color: DS.ink,
              fontFamily: DS.bodyFont,
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              transition: `background-color ${TRANSITION}, color ${TRANSITION}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = DS.ink;
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = DS.ink;
            }}
          >
            Open full report <ArrowUpRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────────────── */

function SectionHeader({
  icon,
  iconColor = DS.accent,
  eyebrow,
  title,
}: {
  icon: React.ReactNode;
  iconColor?: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div
      style={{
        padding: '16px 24px',
        borderBottom: `1px solid ${DS.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: DS.monoFont,
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: iconColor,
        }}
      >
        {icon}
        {eyebrow}
      </div>
      <h3
        style={{
          margin: 0,
          fontFamily: DS.headingFont,
          fontSize: '18px',
          fontWeight: 700,
          color: DS.ink,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h3>
    </div>
  );
}

function StrengthGapRow({
  item,
  kind,
}: {
  item: StrengthGapItem;
  kind: 'strength' | 'gap';
}) {
  const isStrength = kind === 'strength';
  const color = isStrength ? DS.success : DS.warn;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '18px 1fr',
        gap: '10px',
        alignItems: 'flex-start',
      }}
    >
      <span
        style={{
          width: '18px',
          height: '18px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `${color}14`,
          color,
          marginTop: '1px',
        }}
      >
        {isStrength ? <Check size={11} /> : <AlertTriangle size={11} />}
      </span>
      <div>
        <p
          style={{
            margin: 0,
            fontFamily: DS.bodyFont,
            fontSize: '13px',
            fontWeight: 600,
            color: DS.ink,
            lineHeight: 1.45,
          }}
        >
          {item.label}
        </p>
        {item.detail && (
          <p
            style={{
              margin: '2px 0 0 0',
              fontFamily: DS.bodyFont,
              fontSize: '12px',
              color: DS.muted,
              lineHeight: 1.5,
            }}
          >
            {item.detail}
          </p>
        )}
      </div>
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: 0,
        padding: '8px 0',
        fontFamily: DS.bodyFont,
        fontSize: '13px',
        color: DS.muted,
        fontStyle: 'italic',
      }}
    >
      {children}
    </p>
  );
}

export default ConsultantResultsSummary;
