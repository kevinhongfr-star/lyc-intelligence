/**
 * NexusLandingPage — W4-1 / W4-3 / #1295
 *
 * The NEXUS landing page at /nexus. Answers "what is NEXUS?" and "how is it
 * different from ChatGPT?" — premium, dark aesthetic, ocean blue accent.
 *
 * Brand rules:
 *  - Zero border radius everywhere (#1349).
 *  - System serif headings, DM Sans body, IBM Plex Mono labels.
 *  - NEXUS accent = OCEAN / deep blue (#1E4D8C) — one accent per page.
 *  - "complimentary assessment" not "free" · "Executive Introduction" not "free tier".
 *  - Premium not SaaS — confident, specific, no hype.
 *  - Gradients/glows only subtle (2-8% opacity), never structural.
 */
import React, { useState } from 'react';
import { SEO } from '@/components/seo/SEO';
import { DS, OCEAN } from '@/tokens';
import { ASSESSMENT_CATALOG } from '@/assessments/catalog';
import { trackCTA } from '@/analytics/eventTracker';

const ACCENT = OCEAN;
const ACCENT_DARK = '#163E70';
const ACCENT_LIGHT = '#3A6BA8';

// ── Capability cards ──
const CAPABILITIES = [
  {
    icon: 'ASSESS',
    title: 'Assessments',
    desc: '6 leadership assessments with instant results and a NEXUS debrief that connects the dots.',
  },
  {
    icon: 'ANALYZE',
    title: 'Analysis',
    desc: 'Deep dives into your assessment results — pattern recognition across dimensions and archetypes.',
  },
  {
    icon: 'ADVISE',
    title: 'Advisory',
    desc: 'Framework-based guidance for leadership challenges, transitions, and board readiness.',
  },
  {
    icon: 'CONNECT',
    title: 'Integration',
    desc: 'Connects insights across all your assessments over time — your profile compounds, it doesn\u2019t reset.',
  },
];

// ── Differentiators ──
const DIFFERENTIATORS = [
  {
    title: 'Not generic AI.',
    body: 'Built on two decades of LYC executive search methodology — 500+ placements across 47 markets. The institutional knowledge is in the system, not bolted on.',
  },
  {
    title: 'Not just chat.',
    body: 'Assessments, analysis, and conversation in one surface. You don\u2019t describe your leadership to NEXUS — you measure it, then discuss what the measurement means.',
  },
  {
    title: 'Assessment-literate.',
    body: 'Uses validated leadership models (Score Match, composite scores, dimension/archetype mapping). Guidance is grounded in real diagnostic structure, not improvised.',
  },
  {
    title: 'Privacy-first.',
    body: 'Your assessment results and conversations are yours. No PII in analytics, no chat content in error reports, no training on your data.',
  },
];

// ── Pricing context ──
const PRICING_CONTEXT = [
  {
    tier: 'Executive Introduction',
    nexus: 'Basic NEXUS access + 1 complimentary assessment',
    accent: false,
  },
  {
    tier: 'Professional',
    nexus: 'Full NEXUS access + all 6 assessments',
    accent: true,
  },
  {
    tier: 'Executive',
    nexus: 'Priority NEXUS + advanced insights + PDF reports',
    accent: false,
  },
];

// ── FAQ ──
const FAQ = [
  {
    q: 'Is NEXUS just another AI chatbot?',
    a: 'No. NEXUS is a multi-agent executive intelligence system built on LYC\u2019s executive search methodology. It combines validated leadership assessments, pattern analysis, and assessment-literate advisory — not just open-ended conversation.',
  },
  {
    q: 'What can NEXUS help me with?',
    a: 'Leadership positioning, career transitions, board readiness, cross-border executive moves, team dynamics, and organizational culture. It works best when you\u2019ve taken an assessment — the conversation gets specific fast.',
  },
  {
    q: 'Is my data private?',
    a: 'Yes. Your assessment results and chat content are never sent to analytics or error-monitoring services. Analytics use anonymous hashed IDs only. No PII — no names, emails, chat content, or assessment results leave your session unscrubbed.',
  },
  {
    q: 'How is NEXUS different from ChatGPT?',
    a: 'ChatGPT is a general-purpose language model. NEXUS is grounded in executive search methodology and carries LYC\u2019s institutional knowledge — 500+ placements across 47 markets. It knows the frameworks, the failure patterns, and the questions most executives skip.',
  },
];

export function NexusLandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <SEO
        title="NEXUS — Executive Intelligence System | LYC Intelligence"
        description="Your always-on intelligence partner for leadership, career, and organizational decisions. Built on two decades of executive search methodology. 6 assessments, analysis, and advisory in one system."
        path="/nexus"
      />
      <main style={{ background: DS.bgDark, color: DS.bg, minHeight: '100vh' }}>
        {/* ── 1. HERO ── */}
        <section style={{ position: 'relative', overflow: 'hidden', padding: '120px 32px 80px' }}>
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at 30% 20%, ${ACCENT}14 0%, transparent 60%)`,
              pointerEvents: 'none',
            }}
          />
          <div style={{ maxWidth: 1080, margin: '0 auto', position: 'relative', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 48, alignItems: 'center' }} className="nx-hero-grid">
            <div>
              <div style={{ fontFamily: DS.monoFont, fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase', color: ACCENT_LIGHT, fontWeight: 600, marginBottom: 16 }}>
                Executive Intelligence System
              </div>
              <h1 style={{ fontFamily: DS.headingFont, fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.025em', margin: 0, color: DS.bg }}>
                Meet NEXUS.
              </h1>
              <p style={{ fontFamily: DS.bodyFont, fontSize: 'clamp(16px, 1.6vw, 19px)', color: 'rgba(255,255,255,0.72)', lineHeight: 1.55, marginTop: 20, maxWidth: 480 }}>
                Your always-on intelligence partner for leadership, career, and organizational decisions. Built on two decades of LYC executive search methodology.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 36 }}>
                <a
                  href="/assessment/cpi"
                  onClick={() => trackCTA({ location: 'nexus_landing_hero', label: 'Start with a Complimentary Assessment', destination: '/assessment/cpi' })}
                  style={{
                    background: ACCENT,
                    color: DS.bg,
                    border: `1px solid ${ACCENT}`,
                    fontFamily: DS.bodyFont,
                    fontSize: 13,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    padding: '16px 28px',
                    minHeight: 48,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    textDecoration: 'none',
                    transition: DS.transition,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_DARK)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
                >
                  Start with a Complimentary Assessment
                </a>
                <a
                  href="#capabilities"
                  style={{
                    background: 'transparent',
                    color: DS.bg,
                    border: `1px solid rgba(255,255,255,0.3)`,
                    fontFamily: DS.bodyFont,
                    fontSize: 13,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    padding: '16px 24px',
                    minHeight: 48,
                    display: 'inline-flex',
                    alignItems: 'center',
                    textDecoration: 'none',
                    transition: DS.transition,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = DS.bg)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)')}
                >
                  See What It Can Do
                </a>
              </div>
              <p style={{ fontFamily: DS.monoFont, fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 16, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Executive Introduction · No credit card required
              </p>
            </div>

            {/* NEXUS system visualization — pure SVG, multi-agent nodes */}
            <div style={{ display: 'flex', justifyContent: 'center' }} className="nx-hero-visual">
              <svg viewBox="0 0 400 400" style={{ width: '100%', maxWidth: 360, height: 'auto' }} aria-hidden="true">
                {/* Outer ring */}
                <circle cx="200" cy="200" r="180" fill="none" stroke={`${ACCENT}33`} strokeWidth="1" />
                <circle cx="200" cy="200" r="130" fill="none" stroke={`${ACCENT}22`} strokeWidth="1" strokeDasharray="4 6" />
                {/* Connection lines from center to nodes */}
                {[0, 72, 144, 216, 288].map((angle) => {
                  const rad = (angle * Math.PI) / 180;
                  const x2 = 200 + Math.cos(rad) * 130;
                  const y2 = 200 + Math.sin(rad) * 130;
                  return <line key={angle} x1="200" y1="200" x2={x2} y2={y2} stroke={`${ACCENT}40`} strokeWidth="1" />;
                })}
                {/* Center node — NEXUS core */}
                <circle cx="200" cy="200" r="40" fill={`${ACCENT}1A`} stroke={ACCENT} strokeWidth="1.5" />
                <text x="200" y="195" textAnchor="middle" fontFamily={DS.monoFont} fontSize="9" fill={ACCENT_LIGHT} letterSpacing="0.2em">NEXUS</text>
                <text x="200" y="210" textAnchor="middle" fontFamily={DS.monoFont} fontSize="7" fill="rgba(255,255,255,0.4)" letterSpacing="0.15em">CORE</text>
                {/* Agent nodes */}
                {['ASSESS', 'ANALYZE', 'ADVISE', 'CONNECT', 'MEMORY'].map((label, i) => {
                  const angle = i * 72;
                  const rad = (angle * Math.PI) / 180;
                  const x = 200 + Math.cos(rad) * 130;
                  const y = 200 + Math.sin(rad) * 130;
                  return (
                    <g key={label}>
                      <circle cx={x} cy={y} r="22" fill={`${ACCENT}12`} stroke={`${ACCENT}66`} strokeWidth="1" />
                      <text x={x} y={y + 3} textAnchor="middle" fontFamily={DS.monoFont} fontSize="6.5" fill="rgba(255,255,255,0.7)" letterSpacing="0.1em">{label}</text>
                    </g>
                  );
                })}
                {/* Data points floating */}
                <circle cx="80" cy="120" r="2" fill={ACCENT_LIGHT} opacity="0.6" />
                <circle cx="340" cy="150" r="2" fill={ACCENT_LIGHT} opacity="0.5" />
                <circle cx="100" cy="320" r="2" fill={ACCENT_LIGHT} opacity="0.4" />
                <circle cx="320" cy="300" r="2" fill={ACCENT_LIGHT} opacity="0.5" />
              </svg>
            </div>
          </div>
        </section>

        {/* ── 2. WHAT IS NEXUS? ── */}
        <section style={{ padding: '80px 32px', background: DS.bgDark }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div style={{ fontFamily: DS.monoFont, fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase', color: ACCENT_LIGHT, fontWeight: 600, marginBottom: 16 }}>
              What is NEXUS?
            </div>
            <p style={{ fontFamily: DS.headingFont, fontSize: 'clamp(22px, 2.6vw, 28px)', fontWeight: 600, lineHeight: 1.35, color: DS.bg, letterSpacing: '-0.01em', margin: 0 }}>
              Not a chatbot. A multi-agent executive intelligence system.
            </p>
            <p style={{ fontFamily: DS.bodyFont, fontSize: 16, color: 'rgba(255,255,255,0.66)', lineHeight: 1.7, marginTop: 20 }}>
              NEXUS is built on LYC executive search methodology — two decades of placing C-suite leaders across 47 markets. It combines assessments, analysis, and conversation in one surface, so you don\u2019t have to describe your leadership to it. You measure it, then discuss what the measurement means. Think of it as having a leadership advisor available 24/7 — one that already knows the frameworks, the failure patterns, and the questions most executives skip.
            </p>
          </div>
        </section>

        {/* ── 3. WHAT NEXUS CAN DO ── */}
        <section id="capabilities" style={{ padding: '80px 32px', background: '#0F1118' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>
            <div style={{ marginBottom: 48 }}>
              <div style={{ fontFamily: DS.monoFont, fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase', color: ACCENT_LIGHT, fontWeight: 600, marginBottom: 12 }}>
                Capabilities
              </div>
              <h2 style={{ fontFamily: DS.headingFont, fontSize: 'clamp(28px, 3.5vw, 36px)', fontWeight: 700, color: DS.bg, letterSpacing: '-0.02em', margin: 0 }}>
                What NEXUS can do.
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }} className="nx-cap-grid">
              {CAPABILITIES.map((cap) => (
                <div
                  key={cap.title}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid rgba(255,255,255,0.08)`,
                    padding: '32px 24px',
                    transition: DS.transition,
                  }}
                >
                  <div style={{ fontFamily: DS.monoFont, fontSize: 10, letterSpacing: '0.2em', color: ACCENT_LIGHT, marginBottom: 16, fontWeight: 600 }}>
                    {cap.icon}
                  </div>
                  <h3 style={{ fontFamily: DS.headingFont, fontSize: 20, fontWeight: 600, color: DS.bg, margin: 0, marginBottom: 10, letterSpacing: '-0.01em' }}>
                    {cap.title}
                  </h3>
                  <p style={{ fontFamily: DS.bodyFont, fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55, margin: 0 }}>
                    {cap.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. HOW IT'S DIFFERENT ── */}
        <section style={{ padding: '80px 32px', background: DS.bgDark }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div style={{ marginBottom: 48, textAlign: 'center' }}>
              <div style={{ fontFamily: DS.monoFont, fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase', color: ACCENT_LIGHT, fontWeight: 600, marginBottom: 12 }}>
                How it\u2019s different
              </div>
              <h2 style={{ fontFamily: DS.headingFont, fontSize: 'clamp(28px, 3.5vw, 36px)', fontWeight: 700, color: DS.bg, letterSpacing: '-0.02em', margin: 0 }}>
                Not a wrapper around a chatbot.
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }} className="nx-diff-grid">
              {DIFFERENTIATORS.map((d) => (
                <div key={d.title} style={{ borderLeft: `2px solid ${ACCENT}`, paddingLeft: 24 }}>
                  <h3 style={{ fontFamily: DS.headingFont, fontSize: 18, fontWeight: 600, color: DS.bg, margin: 0, marginBottom: 8 }}>
                    {d.title}
                  </h3>
                  <p style={{ fontFamily: DS.bodyFont, fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0 }}>
                    {d.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. DIAGNOSTICS GRID ── */}
        <section style={{ padding: '80px 32px', background: '#0F1118' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>
            <div style={{ marginBottom: 40, textAlign: 'center' }}>
              <div style={{ fontFamily: DS.monoFont, fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase', color: ACCENT_LIGHT, fontWeight: 600, marginBottom: 12 }}>
                Works with every assessment
              </div>
              <h2 style={{ fontFamily: DS.headingFont, fontSize: 'clamp(26px, 3vw, 32px)', fontWeight: 700, color: DS.bg, letterSpacing: '-0.02em', margin: 0 }}>
                All 6 assessments, one intelligence layer.
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }} className="nx-diag-grid">
              {Object.values(ASSESSMENT_CATALOG).map((a) => (
                <a
                  key={a.code}
                  href={`/assessment/${a.code.toLowerCase()}`}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid rgba(255,255,255,0.08)`,
                    padding: '20px 12px',
                    textAlign: 'center',
                    textDecoration: 'none',
                    transition: DS.transition,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${ACCENT}66`; e.currentTarget.style.background = `${ACCENT}0A`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                >
                  <div style={{ fontFamily: DS.headingFont, fontSize: 15, fontWeight: 600, color: DS.bg, letterSpacing: '0.02em' }}>
                    {a.code}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6. PRICING TIER CONTEXT ── */}
        <section style={{ padding: '80px 32px', background: DS.bgDark }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div style={{ marginBottom: 32, textAlign: 'center' }}>
              <div style={{ fontFamily: DS.monoFont, fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase', color: ACCENT_LIGHT, fontWeight: 600, marginBottom: 12 }}>
                Pricing
              </div>
              <h2 style={{ fontFamily: DS.headingFont, fontSize: 'clamp(26px, 3vw, 32px)', fontWeight: 700, color: DS.bg, letterSpacing: '-0.02em', margin: 0 }}>
                NEXUS access, by tier.
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'rgba(255,255,255,0.06)' }}>
              {PRICING_CONTEXT.map((p) => (
                <div
                  key={p.tier}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 24,
                    background: p.accent ? `${ACCENT}14` : DS.bgDark,
                    borderLeft: p.accent ? `2px solid ${ACCENT}` : '2px solid transparent',
                    padding: '20px 24px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ fontFamily: DS.headingFont, fontSize: 16, fontWeight: 600, color: p.accent ? ACCENT_LIGHT : DS.bg, minWidth: 180 }}>
                    {p.tier}
                  </div>
                  <div style={{ fontFamily: DS.bodyFont, fontSize: 14, color: 'rgba(255,255,255,0.66)', flex: 1 }}>
                    {p.nexus}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <a
                href="/pricing"
                style={{
                  fontFamily: DS.monoFont,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: ACCENT_LIGHT,
                  textDecoration: 'underline',
                  textUnderlineOffset: 4,
                }}
              >
                See full pricing →
              </a>
            </div>
          </div>
        </section>

        {/* ── 7. TRY NEXUS ── */}
        <section style={{ padding: '96px 32px', background: '#0F1118', position: 'relative', overflow: 'hidden' }}>
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at 50% 50%, ${ACCENT}12 0%, transparent 60%)`,
              pointerEvents: 'none',
            }}
          />
          <div style={{ maxWidth: 620, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
            <h2 style={{ fontFamily: DS.headingFont, fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 700, color: DS.bg, letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0 }}>
              Start with a complimentary CPI baseline.
            </h2>
            <p style={{ fontFamily: DS.bodyFont, fontSize: 16, color: 'rgba(255,255,255,0.66)', lineHeight: 1.6, marginTop: 18, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
              Take the flagship assessment, then let NEXUS walk you through what your results actually mean — and what to do next.
            </p>
            <div style={{ marginTop: 32 }}>
              <a
                href="/assessment/cpi"
                onClick={() => trackCTA({ location: 'nexus_landing_try', label: 'Start Complimentary CPI Baseline', destination: '/assessment/cpi' })}
                style={{
                  background: ACCENT,
                  color: DS.bg,
                  border: `1px solid ${ACCENT}`,
                  fontFamily: DS.bodyFont,
                  fontSize: 14,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  padding: '18px 36px',
                  minHeight: 52,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  textDecoration: 'none',
                  transition: DS.transition,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_DARK)}
                onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
              >
                Start Your Complimentary Baseline
              </a>
            </div>
            <p style={{ fontFamily: DS.monoFont, fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 16, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              ~15 minutes · Executive Introduction · No credit card
            </p>
          </div>
        </section>

        {/* ── 8. FAQ ── */}
        <section style={{ padding: '80px 32px 120px', background: DS.bgDark }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <h2 style={{ fontFamily: DS.headingFont, fontSize: 'clamp(26px, 3vw, 32px)', fontWeight: 700, color: DS.bg, letterSpacing: '-0.02em', textAlign: 'center', marginBottom: 40 }}>
              Frequently asked questions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'rgba(255,255,255,0.06)' }}>
              {FAQ.map((item, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={i} style={{ background: DS.bgDark }}>
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        padding: '20px 24px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 16,
                      }}
                    >
                      <span style={{ fontFamily: DS.headingFont, fontSize: 16, fontWeight: 600, color: DS.bg }}>
                        {item.q}
                      </span>
                      <span style={{ fontFamily: DS.monoFont, fontSize: 14, color: ACCENT_LIGHT, flexShrink: 0 }}>
                        {isOpen ? '\u2212' : '+'}
                      </span>
                    </button>
                    {isOpen && (
                      <div style={{ padding: '0 24px 24px' }}>
                        <p style={{ fontFamily: DS.bodyFont, fontSize: 14.5, color: 'rgba(255,255,255,0.66)', lineHeight: 1.65, margin: 0 }}>
                          {item.a}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
