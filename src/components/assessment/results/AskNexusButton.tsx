import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

interface Props {
  /** The dimension or finding this question is about */
  dimension: string;
  /** The pre-filled question to send into NEXUS */
  question: string;
  /** The assessment code this question originates from (e.g. "PRISM") */
  assessmentCode: string;
  /** Accent color for the page — defaults to LYC crimson */
  accent?: string;
}

/**
 * AskNexusButton — "Ask NEXUS about this" CTA for dimension scorecards and
 * key insights (#1324). Clicking navigates to /nexus/chat with the question
 * pre-filled via the `q` query param.
 *
 * Brand rules: zero border radius, DM Sans, 200ms hover transition, single
 * accent color. Premium, not SaaS.
 */
export function AskNexusButton({
  dimension,
  question,
  assessmentCode,
  accent = '#C108AB',
}: Props) {
  const navigate = useNavigate();

  const handleClick = () => {
    const q = encodeURIComponent(question);
    navigate(`/nexus/chat?q=${q}&code=${encodeURIComponent(assessmentCode)}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Ask NEXUS about ${dimension}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontSize: 12,
        fontWeight: 500,
        color: accent,
        background: 'transparent',
        border: `1px solid ${accent}`,
 
        cursor: 'pointer',
        minHeight: 32,
        transition: 'background 200ms cubic-bezier(0.4,0,0.2,1), color 200ms cubic-bezier(0.4,0,0.2,1)',
        lineHeight: 1,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = accent;
        e.currentTarget.style.color = '#FFFFFF';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = accent;
      }}
    >
      <Sparkles style={{ width: 13, height: 13 }} />
      Ask NEXUS about this
    </button>
  );
}
