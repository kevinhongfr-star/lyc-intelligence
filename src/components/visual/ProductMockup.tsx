/**
 * #1370 — CSS-illustrated product UI mockups.
 *
 * Premium products have visual assets. Rather than static screenshots (which
 * blur, add HTTP weight, and cause CLS), these are pure CSS/HTML mockups that
 * render crisply at any resolution, use brand fonts/colors, and load instantly.
 *
 * Zero border radius, Crimson Pro / DM Sans / IBM Plex Mono, #C108AB accent.
 */

import React from 'react';

const ACCENT = '#C108AB';
const INK = '#0F1115';
const WHITE = '#FFFFFF';
const G100 = '#F9FAFB';
const G200 = '#F3F4F6';
const G300 = '#E5E7EB';
const G400 = '#9CA3AF';
const G600 = '#4B5563';
const G800 = '#1F2937';

const mono: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  fontWeight: 500,
};

const serif: React.CSSProperties = {
  fontFamily: "'Crimson Pro', Georgia, serif",
};

const sans: React.CSSProperties = {
  fontFamily: "'DM Sans', system-ui, sans-serif",
};

// ── Result Page Mockup ──────────────────────────────────────────────
export function ResultMockup({ style }: { style?: React.CSSProperties }) {
  const dims = [
    { label: 'Strategic Vision', score: 82, color: ACCENT },
    { label: 'Execution Discipline', score: 67, color: G600 },
    { label: 'Stakeholder Influence', score: 91, color: ACCENT },
    { label: 'Cultural Adaptability', score: 74, color: G600 },
  ];

  return (
    <div
      style={{
        background: WHITE,
        border: `1px solid ${G300}`,
        boxShadow: '0 8px 32px rgba(15,17,21,0.08)',
        overflow: 'hidden',
        ...style,
      }}
      role="img"
      aria-label="Sample assessment result page showing score and dimension breakdown"
    >
      {/* Header bar */}
      <div style={{ background: INK, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ ...mono, color: WHITE, opacity: 0.7 }}>LYC Intelligence · Results</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <div style={{ width: 8, height: 8, background: G400, opacity: 0.3 }} />
          <div style={{ width: 8, height: 8, background: G400, opacity: 0.3 }} />
          <div style={{ width: 8, height: 8, background: G400, opacity: 0.3 }} />
        </div>
      </div>

      {/* Score hero */}
      <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${G200}` }}>
        <span style={{ ...mono, color: G400 }}>Assessment Complete</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
          <span style={{ ...serif, fontSize: 28, fontWeight: 700, color: INK }}>78</span>
          <span style={{ ...sans, fontSize: 12, color: G400 }}>/ 100 Composite</span>
        </div>
        <div style={{ ...sans, fontSize: 11, color: G600, marginTop: 4 }}>
          Archetype: <strong style={{ color: ACCENT }}>Cross-Bridge Operator</strong>
        </div>
      </div>

      {/* Dimensions */}
      <div style={{ padding: '14px 20px' }}>
        <span style={{ ...mono, color: G400, marginBottom: 10, display: 'block' }}>Dimensions</span>
        {dims.map((d, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ ...sans, fontSize: 10, color: G800 }}>{d.label}</span>
              <span style={{ ...mono, fontSize: 9, color: d.color }}>{d.score}</span>
            </div>
            <div style={{ height: 4, background: G200, overflow: 'hidden' }}>
              <div style={{ width: `${d.score}%`, height: '100%', background: d.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Key insight */}
      <div style={{ padding: '10px 20px 16px', background: G100, borderTop: `1px solid ${G200}` }}>
        <span style={{ ...mono, color: G400 }}>Key Insight</span>
        <p style={{ ...sans, fontSize: 10, color: G600, marginTop: 4, lineHeight: 1.5, margin: 0 }}>
          Your influence scores rank in the top decile of APAC executives, but execution
          discipline lags behind peers in similar transitions.
        </p>
      </div>
    </div>
  );
}

// ── NEXUS Chat Mockup ───────────────────────────────────────────────
export function NexusChatMockup({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: WHITE,
        border: `1px solid ${G300}`,
        boxShadow: '0 8px 32px rgba(15,17,21,0.08)',
        overflow: 'hidden',
        ...style,
      }}
      role="img"
      aria-label="Sample NEXUS AI chat conversation"
    >
      {/* Header */}
      <div style={{ background: INK, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 8, height: 8, background: ACCENT }} />
        <span style={{ ...mono, color: WHITE, opacity: 0.8 }}>NEXUS AI</span>
        <span style={{ ...mono, color: G400, opacity: 0.5, marginLeft: 'auto' }}>Online</span>
      </div>

      {/* Messages */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 180 }}>
        {/* User message */}
        <div style={{ alignSelf: 'flex-end', maxWidth: '70%' }}>
          <div style={{ background: G200, padding: '8px 12px', ...sans, fontSize: 11, color: INK }}>
            I'm moving from a functional VP role to country GM — what should I test for?
          </div>
        </div>
        {/* NEXUS reply */}
        <div style={{ alignSelf: 'flex-start', maxWidth: '75%' }}>
          <div style={{ border: `1px solid ${G300}`, padding: '8px 12px', ...sans, fontSize: 11, color: G800, lineHeight: 1.5 }}>
            For a functional-to-enterprise transition, I'd start with <strong style={{ color: ACCENT }}>PRISM</strong> to benchmark
            your market positioning, then <strong style={{ color: ACCENT }}>BRIDGE</strong> for China-specific leadership gaps.
            Want me to walk you through what each covers?
          </div>
        </div>
        {/* Typing indicator */}
        <div style={{ alignSelf: 'flex-start', display: 'flex', gap: 3, padding: '6px 12px' }}>
          <div style={{ width: 5, height: 5, background: G400, opacity: 0.4 }} />
          <div style={{ width: 5, height: 5, background: G400, opacity: 0.6 }} />
          <div style={{ width: 5, height: 5, background: G400, opacity: 0.8 }} />
        </div>
      </div>

      {/* Input bar */}
      <div style={{ borderTop: `1px solid ${G200}`, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, background: G100, padding: '6px 10px', ...sans, fontSize: 10, color: G400 }}>
          Ask NEXUS about your career…
        </div>
        <div style={{ width: 24, height: 24, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ ...sans, fontSize: 10, color: WHITE, fontWeight: 700 }}>→</span>
        </div>
      </div>
    </div>
  );
}

// ── Catalog Mockup ──────────────────────────────────────────────────
export function CatalogMockup({ style }: { style?: React.CSSProperties }) {
  const items = [
    { code: 'PRISM', label: 'Career & Professional Branding', price: '$99' },
    { code: 'SPARK', label: 'AI Leadership Readiness', price: '$149' },
    { code: 'FORGE', label: 'Sales Excellence', price: '$99' },
    { code: 'BRIDGE', label: 'China Leadership Readiness', price: '$149' },
  ];
  return (
    <div
      style={{
        background: WHITE,
        border: `1px solid ${G300}`,
        boxShadow: '0 8px 32px rgba(15,17,21,0.08)',
        overflow: 'hidden',
        ...style,
      }}
      role="img"
      aria-label="Sample assessment catalog showing available assessments"
    >
      <div style={{ background: INK, padding: '10px 16px' }}>
        <span style={{ ...mono, color: WHITE, opacity: 0.7 }}>6 Leadership Assessments</span>
      </div>
      <div style={{ padding: '12px' }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 12px',
              borderBottom: i < items.length - 1 ? `1px solid ${G200}` : 'none',
              gap: 10,
            }}
          >
            <div style={{ width: 28, height: 28, background: G100, border: `1px solid ${G300}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ ...mono, fontSize: 8, color: G600, fontWeight: 600 }}>{item.code.slice(0, 2)}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...serif, fontSize: 12, fontWeight: 700, color: INK }}>{item.code}</div>
              <div style={{ ...sans, fontSize: 9, color: G400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</div>
            </div>
            <span style={{ ...mono, fontSize: 9, color: ACCENT, fontWeight: 600 }}>{item.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
