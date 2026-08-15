import React, { useState } from 'react';
import { DS, TEAL, TEAL as ACCENT } from '@/tokens';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { SEO } from '@/components/seo/SEO';
import { Users, Target, TrendingUp, Briefcase, ChevronDown } from 'lucide-react';

const COLOR_BG = DS.bgDark;
const COLOR_TEXT_ON_DARK = DS.bg;
const COLOR_MUTED_ON_DARK = 'rgba(255,255,255,0.62)';
const ACCENT_DARKER = '#' + '007064';

const CPI_DIMENSIONS = [
  { slug: 'strategic_orientation', name: 'Strategic Orientation', short: 'Strategic', desc: 'Long-horizon framing and trade-off discipline. Future-back thinking over tactical reaction.', weight: '22%', weightNote: '' },
  { slug: 'cross_border', name: 'Cross-Border Adaptability', short: 'Cross-Border', desc: 'Agility across cultures, markets, and organizational structures. Spanning boundaries without losing clarity.', weight: '20%', weightNote: '' },
  { slug: 'stakeholder', name: 'Stakeholder Influence', short: 'Stakeholder', desc: 'Mobilizing ecosystem actors without formal authority. Coalition-building and incentive alignment.', weight: '20%', weightNote: '' },
  { slug: 'execution', name: 'Execution Discipline', short: 'Execution', desc: 'Reliable delivery through structure, cadence, and prioritization. Operates through volatility.', weight: '20%', weightNote: '' },
  { slug: 'presence', name: 'Leadership Presence', short: 'Presence', desc: 'Composure, narrative, and inspiration under pressure. Visible in high-stakes moments.', weight: '18%', weightNote: '' },
  { slug: 'self_awareness', name: 'Self-Awareness Quotient', short: 'Self-Awareness', desc: 'Accurate read of one\'s own operating patterns, blind spots, and impact on others. The meta-dimension.', weight: 'Meta', weightNote: 'Meta-dimension, scored through variance' },
];

const CPI_ARCHETYPES = [
  { slug: 'strategist', name: 'Strategic Architect', tagline: 'Systemic thinker with future-back orientation.', code: 'A1' },
  { slug: 'operator', name: 'Precision Operator', tagline: 'Reliable delivery through structure and cadence.', code: 'A2' },
  { slug: 'builder', name: 'Influential Builder', tagline: 'Coalition-based mobilizer of people and plans.', code: 'A3' },
  { slug: 'executor', name: 'Confident Executor', tagline: 'Inspires confident, decisive execution.', code: 'A4' },
  { slug: 'catalyst', name: 'Cross-Border Catalyst', tagline: 'Bridges cultures, markets, and operating silos.', code: 'A5' },
  { slug: 'balanced', name: 'Balanced Collaborative', tagline: 'High floor across all dimensions. Stable integrator.', code: 'A6' },
];

const FAQ_ITEMS = [
  { q: 'What is CPI?', a: 'CPI (Core Professional Insight) is the flagship LYC executive self-awareness assessment. It measures 6 dimensions of professional operation, determines your primary and secondary archetype, and produces a composite 0-100 profile with dimension-level detail.' },
  { q: 'How long does it take?', a: 'The self-assessment layer takes approximately 15 minutes. Executive Introduction users receive a complete complimentary baseline including composite score, dimension breakdown, primary + secondary archetype, and NEXUS follow-up integration.' },
  { q: 'Is my data private?', a: 'Yes. CPI results are private to your LYC Intelligence account. We do not sell personal information. Assessment data is never used to train public-facing models or shared with third parties outside LYC Intelligence / LYC Partners unless explicitly authorized.' },
  { q: 'What do I get with Executive Introduction?', a: 'Executive Introduction (the no-cost entry tier) includes one complimentary CPI baseline, basic NEXUS access (5 introductory messages), the core report, and pricing upgrade options for the professional deep-dive layers, multi-rater 360, or consultant debrief.' },
];

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function HexIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <polygon
        points="20,3 36,12 36,28 20,37 4,28 4,12"
        fill="none"
        stroke={ACCENT}
        strokeWidth="1.5"
      />
    </svg>
  );
}

function CheckMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" fill="none">
      <path d="M4 10.5L8.5 15L16 6" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CpiFlagshipLanding() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <SEO
        page="landing"
        title="CPI — Core Professional Insight | LYC Intelligence"
        description="The flagship executive self-awareness assessment by LYC Partners. 6 dimensions, 6 archetypes, 3 layers of depth. Built on two decades of C-suite executive search methodology."
      />
      <main data-cpi-page>
        <style>{`
          @keyframes cpiDrawIn {
            from { stroke-dashoffset: 1200; }
            to { stroke-dashoffset: 0; }
          }
          [data-cpi-page] .bg-accent { background: ${ACCENT} !important; border-color: ${ACCENT} !important; }
          @media (max-width: 768px) {
            [data-cpi-page] .cpi-hero-grid { grid-template-columns: 1fr !important; }
            [data-cpi-page] .cpi-3layer-svg { display: none !important; }
            [data-cpi-page] .cpi-3layer-stack { display: grid !important; }
          }
          @media (max-width: 480px) {
            [data-cpi-page] .cpi-stats-row { flex-direction: column !important; }
            [data-cpi-page] .cpi-stats-divider { width: 80px !important; height: 1px !important; margin: 20px auto !important; }
            [data-cpi-page] .cpi-final-btn { width: 100% !important; }
          }
        `}</style>

        {/* 1. HERO SECTION */}
        <section id="cpi-hero" style={{ background: COLOR_BG }}>
          <div className="cpi-hero-grid mx-auto" style={{ maxWidth: 1200, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.05fr)', gap: 56, padding: '96px 32px' }}>
            <div>
              <div style={{ background: ACCENT, color: DS.bg, fontFamily: DS.monoFont, fontSize: 10, letterSpacing: '0.20em', padding: '4px 10px', display: 'inline-block', textTransform: 'uppercase' }}>
                LYC FLAGSHIP ASSESSMENT
              </div>
              <h1 style={{ fontFamily: DS.headingFont, fontSize: 'clamp(40px, 6vw, 68px)', fontWeight: 700, color: COLOR_TEXT_ON_DARK, lineHeight: 1.08, letterSpacing: '-0.02em', maxWidth: 580, marginTop: 28, margin: 0, marginTop: 28 }}>
                CPI — Core Professional Insight
              </h1>
              <p style={{ fontFamily: DS.bodyFont, fontSize: 'clamp(15px, 1.5vw, 17px)', color: COLOR_MUTED_ON_DARK, lineHeight: 1.55, maxWidth: 540, marginTop: 18 }}>
                The flagship executive self-awareness assessment. 6 dimensions. 6 archetypes. 3 layers of depth.
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
                <a
                  href="/assessment/cpi/take"
                  style={{
                    background: ACCENT,
                    color: DS.bg,
                    border: `1px solid ${ACCENT}`,
                    fontFamily: DS.bodyFont,
                    fontSize: 13,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    padding: '14px 22px',
                    minHeight: 44,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: `background ${DS.transition}`,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_DARKER)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
                >
                  Start Your Complimentary Baseline
                </a>
                <button
                  type="button"
                  onClick={() => scrollToId('cpi-methodology')}
                  style={{
                    background: 'transparent',
                    color: COLOR_TEXT_ON_DARK,
                    border: '1px solid rgba(255,255,255,0.2)',
                    fontFamily: DS.bodyFont,
                    fontSize: 13,
                    fontWeight: 600,
                    padding: '14px 22px',
                    minHeight: 44,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: `background ${DS.transition}`,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  See How It Works
                </button>
              </div>
            </div>

            <div>
              <svg viewBox="0 0 560 560" style={{ maxWidth: '100%', display: 'block' }} aria-label="CPI 6-dimensional leadership framework — Strategic Orientation, Cross-Border Adaptability, Stakeholder Influence, Execution Discipline, Leadership Presence, Self-Awareness Quotient">
                <defs>
                  <style>{`
                    .cpi-radar-ring { stroke: rgba(255,255,255,0.1); stroke-width: 1; fill: none; }
                    .cpi-radar-axis { stroke: rgba(255,255,255,0.08); stroke-width: 1; }
                    .cpi-radar-polygon { stroke-dasharray: 1200; stroke-dashoffset: 0; animation: cpiDrawIn 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                    .cpi-dim-label { fill: rgba(255,255,255,0.75); font-family: ${DS.bodyFont}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; }
                  `}</style>
                </defs>
                <g transform="translate(280, 280)">
                  <circle className="cpi-radar-ring" r="40" />
                  <circle className="cpi-radar-ring" r="80" />
                  <circle className="cpi-radar-ring" r="120" />
                  <circle className="cpi-radar-ring" r="160" />
                  <circle className="cpi-radar-ring" r="200" />

                  {CPI_DIMENSIONS.map((_, i) => {
                    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                    const x = Math.cos(angle) * 210;
                    const y = Math.sin(angle) * 210;
                    return <line key={i} className="cpi-radar-axis" x1="0" y1="0" x2={x} y2={y} />;
                  })}

                  <polygon
                    className="cpi-radar-polygon"
                    points={CPI_DIMENSIONS.map((_, i) => {
                      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                      const values = [175, 130, 120, 145, 155, 165];
                      const r = values[i];
                      return `${Math.cos(angle) * r},${Math.sin(angle) * r}`;
                    }).join(' ')}
                    fill={`${ACCENT}2E`}
                    stroke={ACCENT}
                    strokeWidth="2"
                  />

                  {CPI_DIMENSIONS.map((dim, i) => {
                    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                    const highlight = i === 0 || i === 5;
                    const values = [175, 130, 120, 145, 155, 165];
                    const r = values[i];
                    const px = Math.cos(angle) * r;
                    const py = Math.sin(angle) * r;
                    const lx = Math.cos(angle) * 240;
                    const ly = Math.sin(angle) * 240;
                    return (
                      <g key={dim.slug}>
                        <circle cx={px} cy={py} r={highlight ? 5 : 3.5} fill={highlight ? ACCENT : 'rgba(255,255,255,0.5)'} stroke={highlight ? ACCENT : 'rgba(255,255,255,0.3)'} strokeWidth="1.5" />
                        <text
                          className="cpi-dim-label"
                          x={lx}
                          y={ly}
                          textAnchor={Math.abs(lx) < 10 ? 'middle' : (lx > 0 ? 'start' : 'end')}
                          dominantBaseline={Math.abs(ly) < 10 ? 'middle' : (ly > 0 ? 'hanging' : 'alphabetic')}
                        >
                          {dim.short}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>
          </div>
        </section>

        {/* 2. WHAT YOU'LL DISCOVER */}
        <section id="cpi-discover" style={{ background: DS.bg, padding: '96px 32px' }}>
          <div style={{ maxWidth: 1120, margin: '0 auto' }}>
            <div style={{ fontFamily: DS.monoFont, fontSize: 10, letterSpacing: '0.24em', color: DS.muted, textTransform: 'uppercase', marginBottom: 12 }}>
              WHAT YOU WALK AWAY WITH
            </div>
            <h2 style={{ fontFamily: DS.headingFont, fontSize: 'clamp(28px, 3.6vw, 40px)', fontWeight: 700, color: DS.text, margin: 0 }}>
              Six dimensions of professional self-awareness
            </h2>
            <p style={{ fontFamily: DS.bodyFont, color: DS.textSecondary, maxWidth: 620, lineHeight: 1.6, marginTop: 12 }}>
              Most executive assessments stop at 3 dimensions. CPI uses 6 — structured to reveal blind spots, not to label a personality type.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginTop: 48 }}>
              {CPI_DIMENSIONS.map((dim) => {
                const highlighted = dim.slug === 'strategic_orientation' || dim.slug === 'self_awareness';
                return (
                  <Card key={dim.slug} variant="flat" interactive={false} style={{ borderLeft: highlighted ? `3px solid ${ACCENT}` : `1px solid ${DS.cardBorder}`, padding: 0 }}>
                    <CardContent style={{ padding: 24 }}>
                      <CardTitle style={{ fontSize: 18, fontWeight: 600, color: DS.text }}>{dim.name}</CardTitle>
                      <div style={{ fontFamily: DS.monoFont, fontSize: 9, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.18em', marginTop: 6 }}>
                        {dim.short}
                      </div>
                      <CardDescription style={{ fontSize: 14, color: DS.textSecondary, lineHeight: 1.55, marginTop: 10 }}>
                        {dim.desc}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3. METHODOLOGY */}
        <section id="cpi-methodology" style={{ background: DS.bgAlt, padding: '96px 32px' }}>
          <div style={{ maxWidth: 1120, margin: '0 auto' }}>
            <div style={{ fontFamily: DS.monoFont, fontSize: 10, letterSpacing: '0.24em', color: DS.muted, textTransform: 'uppercase', marginBottom: 12 }}>
              HOW IT WORKS
            </div>
            <h2 style={{ fontFamily: DS.headingFont, fontSize: 'clamp(28px, 3.6vw, 40px)', fontWeight: 700, color: DS.text, margin: 0 }}>
              Three layers, one complete picture.
            </h2>
            <p style={{ fontFamily: DS.bodyFont, color: DS.textSecondary, maxWidth: 620, marginTop: 12, lineHeight: 1.6 }}>
              The depth is the difference. Most assessments are a single self-response snapshot. CPI layers three signals so the profile reflects reality, not a mood.
            </p>

            {/* 3A. 3-LAYER MODEL */}
            <div style={{ marginTop: 56 }}>
              <svg className="cpi-3layer-svg" viewBox="0 0 1100 340" style={{ maxWidth: '100%', display: 'block' }}>
                <defs>
                  <marker id="cpi-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill={ACCENT} />
                  </marker>
                </defs>

                {[0, 1, 2].map((i) => {
                  const x = 40 + i * 350;
                  const layers = [
                    { mono: '01 · Self-Assessment', title: 'Your own view of your professional profile.', body: 'How you rate your professional operating patterns across 6 dimensions — the self-view baseline.' },
                    { mono: '02 · Multi-Rater', title: 'How colleagues and teams see you.', body: 'Organizational version: optional 360° input from peers, reports, and supervisors — benchmarked against your self-view.' },
                    { mono: '03 · Deep Analysis', title: 'Patterns, blind spots, archetype matching.', body: 'Composite scoring, dimension variance analysis, archetype classification, and blind-spot triangulation.' },
                  ];
                  const l = layers[i];
                  return (
                    <g key={i}>
                      <rect x={x} y="40" width="310" height="260" fill={DS.bg} stroke={DS.cardBorder} strokeWidth="1" />
                      <circle cx={x + 155} cy="28" r="18" fill={ACCENT} />
                      <text x={x + 155} y="34" textAnchor="middle" fill={DS.bg} fontFamily={DS.monoFont} fontSize="12" fontWeight="600">{i + 1}</text>
                      <text x={x + 24} y="88" fill={ACCENT} fontFamily={DS.monoFont} fontSize="10" letterSpacing="0.2em" textTransform="uppercase">{l.mono}</text>
                      <foreignObject x={x + 24} y="110" width="262" height="160">
                        <div xmlns="http://www.w3.org/1999/xhtml" style={{ fontFamily: DS.bodyFont }}>
                          <h4 style={{ fontFamily: DS.headingFont, fontSize: 18, fontWeight: 600, color: DS.text, margin: 0, lineHeight: 1.35 }}>{l.title}</h4>
                          <p style={{ fontSize: 14, color: DS.textSecondary, lineHeight: 1.55, marginTop: 12, margin: 0, marginTop: 12 }}>{l.body}</p>
                        </div>
                      </foreignObject>
                    </g>
                  );
                })}

                <line x1="350" y1="170" x2="390" y2="170" stroke={ACCENT} strokeWidth="2" markerEnd="url(#cpi-arrow)" />
                <line x1="700" y1="170" x2="740" y2="170" stroke={ACCENT} strokeWidth="2" markerEnd="url(#cpi-arrow)" />
              </svg>

              <div className="cpi-3layer-stack" style={{ display: 'none', gap: 16, gridTemplateColumns: '1fr' }}>
                {[
                  { mono: '01 · Self-Assessment', title: 'Your own view of your professional profile.', body: 'How you rate your professional operating patterns across 6 dimensions — the self-view baseline.', idx: 1 },
                  { mono: '02 · Multi-Rater', title: 'How colleagues and teams see you.', body: 'Organizational version: optional 360° input from peers, reports, and supervisors — benchmarked against your self-view.', idx: 2 },
                  { mono: '03 · Deep Analysis', title: 'Patterns, blind spots, archetype matching.', body: 'Composite scoring, dimension variance analysis, archetype classification, and blind-spot triangulation.', idx: 3 },
                ].map((l) => (
                  <Card key={l.idx} variant="flat" interactive={false}>
                    <CardContent style={{ padding: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 36, height: 36, background: ACCENT, color: DS.bg, fontFamily: DS.monoFont, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{l.idx}</div>
                        <div style={{ fontFamily: DS.monoFont, fontSize: 10, letterSpacing: '0.2em', color: ACCENT, textTransform: 'uppercase' }}>{l.mono}</div>
                      </div>
                      <CardTitle style={{ fontSize: 18, fontWeight: 600, color: DS.text, marginTop: 16 }}>{l.title}</CardTitle>
                      <CardDescription style={{ fontSize: 14, color: DS.textSecondary, lineHeight: 1.55, marginTop: 10 }}>{l.body}</CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* 3B. 6 DIM BREAKDOWN */}
            <div style={{ marginTop: 88 }}>
              <div style={{ fontFamily: DS.monoFont, fontSize: 10, letterSpacing: '0.24em', color: DS.muted, textTransform: 'uppercase', marginBottom: 12 }}>
                DIMENSION WEIGHTING
              </div>
              <h3 style={{ fontFamily: DS.headingFont, fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, color: DS.text, margin: 0 }}>
                How each dimension contributes to your composite.
              </h3>
              <p style={{ fontFamily: DS.bodyFont, color: DS.textSecondary, maxWidth: 620, marginTop: 12, lineHeight: 1.6 }}>
                Dimension weights reflect real-world leadership trade-offs observed across two decades of C-suite placements.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginTop: 40 }}>
                {CPI_DIMENSIONS.map((dim) => (
                  <Card key={dim.slug} variant="flat" interactive={false}>
                    <CardContent style={{ padding: 24 }}>
                      <CardTitle style={{ fontSize: 18, fontWeight: 600, color: DS.text }}>{dim.name}</CardTitle>
                      <div style={{ fontFamily: DS.monoFont, fontSize: 11, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 6 }}>
                        {dim.short} {dim.weight ? `× ${dim.weight}` : ''}
                      </div>
                      {dim.weightNote && (
                        <div style={{ fontFamily: DS.monoFont, fontSize: 10, color: DS.muted, marginTop: 4 }}>
                          {dim.weightNote}
                        </div>
                      )}
                      <CardDescription style={{ fontSize: 14, color: DS.textSecondary, lineHeight: 1.55, marginTop: 10 }}>
                        {dim.desc}
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* 3C. 6 ARCHETYPES OVERVIEW */}
            <div style={{ marginTop: 88 }}>
              <div style={{ fontFamily: DS.monoFont, fontSize: 10, letterSpacing: '0.24em', color: DS.muted, textTransform: 'uppercase', marginBottom: 12 }}>
                DISCOVER YOUR OPERATING PATTERN
              </div>
              <h3 style={{ fontFamily: DS.headingFont, fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, color: DS.text, margin: 0 }}>
                Six archetypes of executive operation.
              </h3>
              <p style={{ fontFamily: DS.bodyFont, color: DS.textSecondary, maxWidth: 720, marginTop: 12, lineHeight: 1.6 }}>
                Your archetype isn't a personality type — it's a professional operating pattern derived from your dimension profile. Most leaders show one primary and one secondary archetype.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginTop: 40 }}>
                {CPI_ARCHETYPES.map((a) => (
                  <Card key={a.slug} variant="flat" interactive={false} style={{ textAlign: 'center' }}>
                    <CardContent style={{ padding: 24 }}>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                        <HexIcon size={32} />
                      </div>
                      <div style={{ fontFamily: DS.monoFont, fontSize: 22, color: ACCENT, fontWeight: 600 }}>{a.code}</div>
                      <CardTitle style={{ fontSize: 16, fontWeight: 600, color: DS.text, marginTop: 4 }}>{a.name}</CardTitle>
                      <CardDescription style={{ fontSize: 12, color: DS.textSecondary, lineHeight: 1.45, marginTop: 8, maxWidth: 170, marginLeft: 'auto', marginRight: 'auto' }}>
                        {a.tagline}
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* 3D. SCORING MODEL */}
            <div style={{ marginTop: 88 }}>
              <div style={{ fontFamily: DS.monoFont, fontSize: 10, letterSpacing: '0.24em', color: DS.muted, textTransform: 'uppercase', marginBottom: 12 }}>
                SCORING
              </div>
              <h3 style={{ fontFamily: DS.headingFont, fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, color: DS.text, margin: 0 }}>
                A score you can use, not just read.
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, marginTop: 40, alignItems: 'center' }}>
                <div style={{ gridColumn: 'span 1' }}>
                  <svg viewBox="0 0 400 220" style={{ maxWidth: '100%', display: 'block' }} aria-label="CPI composite score 0-100 illustration">
                    <g transform="translate(200, 200)">
                      <path d="M -160 0 A 160 160 0 0 1 160 0" fill="none" stroke={DS.border} strokeWidth="20" strokeLinecap="butt" />
                      <path d="M -160 0 A 160 160 0 0 1 160 0" fill="none" stroke={ACCENT} strokeWidth="20" strokeLinecap="butt"
                        strokeDasharray={`${Math.PI * 160} ${Math.PI * 160}`}
                        strokeDashoffset={Math.PI * 160 * 0.24} />
                      {[0, 1, 2, 3, 4, 5].map((i) => {
                        const t = i / 5;
                        const angle = Math.PI * (1 - t);
                        const r = 160;
                        const rIn = 135;
                        const x1 = Math.cos(angle) * r;
                        const y1 = -Math.sin(angle) * r;
                        const x2 = Math.cos(angle) * rIn;
                        const y2 = -Math.sin(angle) * rIn;
                        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={DS.mutedDim} strokeWidth="2" />;
                      })}
                      <text x="0" y="-40" textAnchor="middle" fontFamily={DS.headingFont} fontSize="48" fontWeight="700" fill={DS.text}>76</text>
                      <text x="0" y="-8" textAnchor="middle" fontFamily={DS.monoFont} fontSize="11" fill={DS.muted} letterSpacing="0.15em" textTransform="uppercase">COMPOSITE SCORE</text>
                      <text x="-170" y="20" textAnchor="middle" fontFamily={DS.monoFont} fontSize="10" fill={DS.mutedDim}>0</text>
                      <text x="170" y="20" textAnchor="middle" fontFamily={DS.monoFont} fontSize="10" fill={DS.mutedDim}>100</text>
                    </g>
                  </svg>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                  <Card variant="flat" interactive={false}>
                    <CardContent style={{ padding: 24 }}>
                      <div style={{ fontFamily: DS.monoFont, fontSize: 10, letterSpacing: '0.2em', color: ACCENT, textTransform: 'uppercase' }}>OVERALL</div>
                      <CardTitle style={{ fontSize: 17, fontWeight: 600, marginTop: 8 }}>Composite score 0–100</CardTitle>
                      <CardDescription style={{ fontSize: 14, marginTop: 8, lineHeight: 1.55 }}>A single aligned number capturing your full dimensional profile, benchmarked against real executive populations.</CardDescription>
                    </CardContent>
                  </Card>
                  <Card variant="flat" interactive={false}>
                    <CardContent style={{ padding: 24 }}>
                      <div style={{ fontFamily: DS.monoFont, fontSize: 10, letterSpacing: '0.2em', color: ACCENT, textTransform: 'uppercase' }}>DIMENSIONS</div>
                      <CardTitle style={{ fontSize: 17, fontWeight: 600, marginTop: 8 }}>Individual dimension scores</CardTitle>
                      <CardDescription style={{ fontSize: 14, marginTop: 8, lineHeight: 1.55 }}>Six independent 0–100 dimension scores with written interpretation. See exactly where you stand on each axis.</CardDescription>
                    </CardContent>
                  </Card>
                  <Card variant="flat" interactive={false}>
                    <CardContent style={{ padding: 24 }}>
                      <div style={{ fontFamily: DS.monoFont, fontSize: 10, letterSpacing: '0.2em', color: ACCENT, textTransform: 'uppercase' }}>ARCHETYPE</div>
                      <CardTitle style={{ fontSize: 17, fontWeight: 600, marginTop: 8 }}>Archetype match strength</CardTitle>
                      <CardDescription style={{ fontSize: 14, marginTop: 8, lineHeight: 1.55 }}>Primary + secondary archetype classification with match confidence and pattern explanations tied to real operating behaviors.</CardDescription>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. WHO IT'S FOR */}
        <section id="cpi-who" style={{ background: DS.bg, padding: '96px 32px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ fontFamily: DS.monoFont, fontSize: 10, letterSpacing: '0.24em', color: DS.muted, textTransform: 'uppercase', marginBottom: 12 }}>
              WHO USES CPI
            </div>
            <h2 style={{ fontFamily: DS.headingFont, fontSize: 'clamp(28px, 3.6vw, 40px)', fontWeight: 700, color: DS.text, margin: 0 }}>
              Built for senior leaders and serious growth.
            </h2>
            <p style={{ fontFamily: DS.bodyFont, color: DS.textSecondary, maxWidth: 620, marginTop: 12, lineHeight: 1.6 }}>
              CPI serves executives and high-potential leaders across four core use cases.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginTop: 48 }}>
              {[
                { icon: Users, title: 'Senior Leaders & Executives', desc: 'Self-awareness baseline for C-suite and high-potential managers.' },
                { icon: Target, title: 'Promotion Readiness', desc: 'Pre-promotion diagnostic to close gaps before stepping up.' },
                { icon: TrendingUp, title: 'Leadership Development', desc: 'Long-form development program anchor with measurable progression.' },
                { icon: Briefcase, title: 'Transition & Change', desc: 'Career pivots, new role integration, cross-border moves.' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} style={{ display: 'flex', gap: 20 }}>
                    <div style={{ flexShrink: 0, color: ACCENT }}>
                      <Icon size={24} strokeWidth={1.75} />
                    </div>
                    <div>
                      <h4 style={{ fontFamily: DS.headingFont, fontSize: 18, fontWeight: 600, color: DS.text, margin: 0 }}>{item.title}</h4>
                      <p style={{ fontFamily: DS.bodyFont, fontSize: 14, color: DS.textSecondary, lineHeight: 1.55, marginTop: 6, margin: 0, marginTop: 6 }}>{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. LYC CREDIBILITY */}
        <section id="cpi-credibility" style={{ background: COLOR_BG, padding: '96px 32px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 64 }}>
              <div>
                <div style={{ fontFamily: DS.monoFont, fontSize: 10, letterSpacing: '0.24em', color: DS.mutedDim, textTransform: 'uppercase', marginBottom: 12 }}>
                  CREDIBILITY
                </div>
                <h2 style={{ fontFamily: DS.headingFont, fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 700, color: COLOR_TEXT_ON_DARK, lineHeight: 1.15, margin: 0 }}>
                  Built on executive search methodology.
                </h2>
                <p style={{ fontFamily: DS.bodyFont, color: COLOR_MUTED_ON_DARK, lineHeight: 1.65, marginTop: 16 }}>
                  CPI was developed by LYC Partners, the executive search firm that places C-suite leaders across Asia. Our frameworks have been refined across hundreds of searches and validated against real leadership performance data.
                </p>
                <p style={{ fontFamily: DS.bodyFont, color: COLOR_MUTED_ON_DARK, lineHeight: 1.65, marginTop: 16 }}>
                  This isn't a content library repackaged as an assessment. Every dimension weight, archetype profile, and question reflects trade-offs LYC consultants have observed in real placements over two decades.
                </p>
                <a
                  href="https://lyc-partners.ai"
                  target="_blank"
                  rel="noopener"
                  style={{
                    color: ACCENT,
                    fontFamily: DS.bodyFont,
                    fontSize: 13,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.16em',
                    borderBottom: `1px solid ${ACCENT}`,
                    paddingBottom: 2,
                    marginTop: 28,
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  Visit LYC Partners →
                </a>
              </div>

              <div>
                <img src="/brand/lyc_wordmark_reverse.svg" alt="LYC Partners" style={{ maxWidth: 180, marginBottom: 48 }} />

                <div className="cpi-stats-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  {[
                    { num: '6', label: 'Dimensions', sub: 'of professional self-awareness' },
                    { num: '6', label: 'ARCHETYPES', sub: 'distinct operating patterns' },
                    { num: '3', label: 'LAYERS', sub: 'of depth and analysis' },
                  ].map((s, i) => (
                    <React.Fragment key={s.label}>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ fontFamily: DS.headingFont, fontSize: 48, fontWeight: 700, color: COLOR_TEXT_ON_DARK, lineHeight: 1 }}>{s.num}</div>
                        <div style={{ fontFamily: DS.monoFont, fontSize: 10, color: ACCENT, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 8 }}>{s.label}</div>
                        <div style={{ fontFamily: DS.bodyFont, fontSize: 13, color: COLOR_MUTED_ON_DARK, marginTop: 6 }}>{s.sub}</div>
                      </div>
                      {i < 2 && (
                        <div
                          className="cpi-stats-divider"
                          style={{
                            width: 1,
                            height: 72,
                            background: DS.mutedDim,
                            opacity: 0.25,
                            flexShrink: 0,
                            margin: '0 16px',
                          }}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 88 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} style={{ border: '1px solid rgba(255,255,255,0.12)', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: DS.monoFont, fontSize: 9, color: DS.mutedDim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      Reserved
                    </span>
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: DS.monoFont, fontSize: 10, color: DS.mutedDim, marginTop: 16, textAlign: 'center', fontStyle: 'italic' }}>
                Client logos — reserved for executive teams and programs
              </p>
            </div>
          </div>
        </section>

        {/* 6. WHAT MAKES CPI DIFFERENT */}
        <section id="cpi-different" style={{ background: DS.bgAlt, padding: '96px 32px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ fontFamily: DS.monoFont, fontSize: 10, letterSpacing: '0.24em', color: DS.muted, textTransform: 'uppercase', marginBottom: 12 }}>
              WHAT SETS IT APART
            </div>
            <h2 style={{ fontFamily: DS.headingFont, fontSize: 'clamp(28px, 3.6vw, 40px)', fontWeight: 700, color: DS.text, margin: 0 }}>
              Not another personality quiz.
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginTop: 40 }}>
              {[
                'Not a personality test — it\'s professional insight. No 4-letter labels. A dimensional executive profile tied to real leadership outcomes.',
                'Multi-rater 360° capability (organizational version). Compare self-view with how the people around you actually experience your leadership.',
                'Three layers of depth. Most assessments stop at one self-reported layer. CPI adds multi-rater triangulation and archetype pattern analysis.',
                'Built by executive search professionals. Refined across hundreds of C-suite placements with LYC Partners.',
              ].map((pt, i) => (
                <Card key={i} variant="flat" interactive={false}>
                  <CardContent style={{ padding: 24 }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ marginTop: 2 }}><CheckMark /></div>
                      <p style={{ fontFamily: DS.bodyFont, fontSize: 15, color: DS.text, lineHeight: 1.6, margin: 0 }}>{pt}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 7. MID-PAGE CTA */}
        <section style={{ background: DS.bg, padding: '56px 32px', textAlign: 'center' }}>
          <a
            href="/assessment/cpi/take"
            style={{
              background: ACCENT,
              color: DS.bg,
              border: `1px solid ${ACCENT}`,
              fontFamily: DS.bodyFont,
              fontSize: 13,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              padding: '16px 32px',
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              transition: `background ${DS.transition}`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_DARKER)}
            onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
          >
            Start Your Complimentary Baseline →
          </a>
        </section>

        {/* 8. FINAL CTA */}
        <section id="cpi-final-cta" style={{ background: COLOR_BG, position: 'relative', overflow: 'hidden' }}>
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at 50% 40%, ${ACCENT}0F 0%, transparent 70%)`,
              pointerEvents: 'none',
              opacity: 1,
            }}
          />
          <div style={{ maxWidth: 680, margin: '0 auto', padding: '112px 32px', position: 'relative', textAlign: 'center' }}>
            <h2 style={{ fontFamily: DS.headingFont, fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: COLOR_TEXT_ON_DARK, lineHeight: 1.15, letterSpacing: '-0.015em', margin: 0 }}>
              Know where you stand. In 15 minutes.
            </h2>
            <p style={{ fontFamily: DS.bodyFont, color: COLOR_MUTED_ON_DARK, fontSize: 15, lineHeight: 1.6, marginTop: 20, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
              Your complimentary CPI baseline covers the self-assessment layer, a composite score, your primary + secondary archetype, and integration with NEXUS for follow-up.
            </p>
            <div style={{ marginTop: 32 }}>
              <a
                href="/assessment/cpi/take"
                className="cpi-final-btn"
                style={{
                  background: ACCENT,
                  color: DS.bg,
                  border: `1px solid ${ACCENT}`,
                  fontFamily: DS.bodyFont,
                  fontSize: 14,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  padding: '20px 40px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  transition: `background ${DS.transition}`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_DARKER)}
                onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
              >
                Get Your Complimentary CPI Baseline
              </a>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 24, marginTop: 28 }}>
              {['COMPLIMENTARY BASELINE', 'TAKES ~15 MINUTES', 'NO CREDIT CARD REQUIRED', 'EXECUTIVE INTRODUCTION TIER'].map((t, i) => (
                <React.Fragment key={t}>
                  <span style={{ fontFamily: DS.monoFont, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: DS.mutedDim }}>{t}</span>
                  {i < 3 && <span style={{ color: DS.mutedDim }}>·</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* 9. FAQ */}
        <section id="cpi-faq" style={{ background: DS.bg, padding: '96px 32px' }}>
          <div style={{ maxWidth: 780, margin: '0 auto' }}>
            <div style={{ fontFamily: DS.monoFont, fontSize: 10, letterSpacing: '0.24em', color: DS.muted, textTransform: 'uppercase', marginBottom: 12 }}>
              FREQUENTLY ASKED
            </div>
            <h2 style={{ fontFamily: DS.headingFont, fontSize: 'clamp(28px, 3.6vw, 40px)', fontWeight: 700, color: DS.text, margin: 0 }}>
              Questions about CPI.
            </h2>

            <div style={{ marginTop: 40 }}>
              {FAQ_ITEMS.map((item, i) => {
                const open = openFaq === i;
                return (
                  <div key={i} style={{ borderBottom: `1px solid ${DS.cardBorder}` }}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : i)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '24px 8px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: `background ${DS.transition}`,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = DS.bgAlt)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ fontFamily: DS.headingFont, fontSize: 17, fontWeight: 600, color: DS.text, lineHeight: 1.4 }}>{item.q}</span>
                      <ChevronDown
                        size={20}
                        color={open ? ACCENT : DS.muted}
                        style={{
                          flexShrink: 0,
                          marginLeft: 16,
                          transition: `transform ${DS.transition}`,
                          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      />
                    </button>
                    <div
                      style={{
                        maxHeight: open ? 400 : 0,
                        overflow: 'hidden',
                        transition: `max-height ${DS.transition}`,
                      }}
                    >
                      <p style={{ fontFamily: DS.bodyFont, fontSize: 15, color: DS.textSecondary, lineHeight: 1.65, padding: '0 8px 24px', margin: 0 }}>
                        {item.a}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 10. CPI FOR TEAMS — secondary B2B path (#1377 / W2-8)
            Primary message above is B2C / individual. This block is clearly
            labeled as a separate organizational offering and uses a contact
            CTA (not direct sign-up) so it never muddies the B2C flow. */}
        <section id="cpi-for-teams" style={{ background: DS.bgAlt, padding: '80px 32px' }}>
          <div style={{ maxWidth: 920, margin: '0 auto' }}>
            <div
              style={{
                background: DS.bg,
                border: `1px solid ${DS.cardBorder}`,
                borderLeft: `3px solid ${ACCENT}`,
                padding: '40px 40px',
              }}
            >
              <div style={{ fontFamily: DS.monoFont, fontSize: 10, letterSpacing: '0.24em', color: DS.muted, textTransform: 'uppercase', marginBottom: 14, fontWeight: 600 }}>
                ALSO AVAILABLE FOR TEAMS &amp; ORGANIZATIONS
              </div>
              <h2 style={{ fontFamily: DS.headingFont, fontSize: 'clamp(24px, 3vw, 30px)', fontWeight: 700, color: DS.text, lineHeight: 1.2, letterSpacing: '-0.015em', margin: 0 }}>
                CPI for Teams — the organizational version.
              </h2>
              <p style={{ fontFamily: DS.bodyFont, fontSize: 15, color: DS.textSecondary, lineHeight: 1.65, marginTop: 16, maxWidth: 640 }}>
                The same CPI instrument, configured for executive teams and
                leadership programs. Adds multi-rater 360° capability so each
                leader's self-view is benchmarked against how peers, reports, and
                supervisors actually experience their leadership — surfaced as
                team-level patterns, blind-spot triangulation, and cohort
                benchmarks rather than a single individual report.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                {[
                  'Multi-rater 360° input benchmarked against self-view',
                  'Team-level blind-spot and variance analysis',
                  'Cohort benchmarks for leadership programs',
                  'Consultant-led debrief and development planning',
                ].map((point) => (
                  <li key={point} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ marginTop: 2 }}><CheckMark /></span>
                    <span style={{ fontFamily: DS.bodyFont, fontSize: 14, color: DS.text, lineHeight: 1.55 }}>{point}</span>
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                <a
                  href="mailto:partners@lyc-partners.ai?subject=CPI%20for%20Teams%20inquiry"
                  style={{
                    background: 'transparent',
                    color: DS.text,
                    border: `1px solid ${DS.text}`,
                    fontFamily: DS.bodyFont,
                    fontSize: 13,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    padding: '14px 22px',
                    minHeight: 44,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                    transition: `background ${DS.transition}`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = DS.text; e.currentTarget.style.color = DS.bg; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = DS.text; }}
                >
                  Talk to us about CPI for Teams
                </a>
                <span style={{ fontFamily: DS.monoFont, fontSize: 11, color: DS.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Separate organizational offering · Not the individual sign-up
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default CpiFlagshipLanding;
