/**
 * V4.5.5 — /NEXUS PRODUCT LANDING PAGE (V1 re-skin)
 *
 * Route: /nexus
 * Product-focused landing. "/" is the Board Brief / brand story.
 * /nexus is "see the product" — chat preview, how it works, lenses,
 * membership tiers, dark teal final CTA, minimal footer.
 *
 * V1 rules: 0px radius, no shadows, no gradients, rule lines, mono labels,
 * serif display, cream background, teal primary, fuchsia accent sparingly
 * (recommended/flagship only — used here for the "Professional" tier badge +
 * the complimentary-baseline CTA marker).
 *
 * All copy, links, and tracking stay the same.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/seo/SEO';
import { ASSESSMENT_CATALOG } from '@/assessments/catalog';
import { trackCTA } from '@/analytics/eventTracker';
import { V1 } from '@/styles/v1-tokens';

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

// ── How it works (3 steps) ──
const STEPS = [
  {
    n: '01',
    title: 'Take a lens.',
    body: 'Start with the complimentary CPI baseline or any of the 6 executive assessments. ~15 minutes, instant results.',
  },
  {
    n: '02',
    title: 'NEXUS analyzes.',
    body: 'Your results are parsed into dimensions, archetypes, and patterns — and connected to every other assessment you take.',
  },
  {
    n: '03',
    title: 'Discuss with NEXUS.',
    body: 'Ask NEXUS about positioning, transitions, board readiness, team dynamics. The conversation is grounded in your measurement — not improvised.',
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

// ── Pricing context — 3 tiers as cards ──
const PRICING_CONTEXT = [
  {
    tier: 'Executive Introduction',
    blurb: 'Basic NEXUS access + 1 complimentary assessment.',
    features: ['1 complimentary assessment', 'Basic NEXUS chat', 'Standard readouts', 'No credit card required'],
    accent: false,
    ctaLabel: 'Start complimentary',
    ctaHref: '/assessment/cpi',
  },
  {
    tier: 'Professional',
    blurb: 'Full NEXUS access + all 6 assessments.',
    features: ['All 6 assessments', 'Full NEXUS chat', 'Advanced analysis', 'Composite scoring', 'Cross-assessment memory'],
    accent: true,
    ctaLabel: 'See membership',
    ctaHref: '/pricing',
  },
  {
    tier: 'Executive',
    blurb: 'Priority NEXUS + advanced insights + PDF reports.',
    features: ['Everything in Professional', 'Priority NEXUS', 'PDF reports', 'Human Depth add-ons', 'Coaching hours included'],
    accent: false,
    ctaLabel: 'See membership',
    ctaHref: '/pricing',
  },
];

// ── Chat preview — static mock of a NEXUS exchange ──
const CHAT_PREVIEW = {
  eyebrow: 'NEXUS · Conversation',
  userMsg: 'What does my CPI score mean for a board role?',
  nexusMsg:
    'Your composite is 72/100 — Strong. Stakeholder Influence is your leading dimension (84). For a board role, the gap is Cross-border Adaptability (61). Two directors I\u2019ve placed with similar profiles used their first 90 days on the board to reframe governance questions as stakeholder questions. Want me to map that approach to your specific context?',
};

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
    <div className="v1-scope" style={{ minHeight: '100vh', background: V1.bg, color: V1.text }}>
      <style>{`
        @keyframes v1-fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .nx-enter { animation: v1-fade-up ${V1.durNormal}ms ${V1.ease} both; }
        @media (max-width: 880px) {
          .nx-hero-grid { grid-template-columns: 1fr !important; }
          .nx-cap-grid { grid-template-columns: 1fr 1fr !important; }
          .nx-diag-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .nx-tier-grid { grid-template-columns: 1fr !important; }
          .nx-diff-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 540px) {
          .nx-cap-grid { grid-template-columns: 1fr !important; }
          .nx-diag-grid { grid-template-columns: 1fr 1fr !important; }
          .nx-step-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <SEO
        title="NEXUS — Executive Intelligence System | NEXUS by LYC Partners"
        description="Your always-on intelligence partner for leadership, career, and organizational decisions. Built on two decades of executive search methodology. 6 assessments, analysis, and advisory in one system."
        path="/nexus"
      />

      {/* ── Minimal nav: wordmark + sign-in link ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `20px ${V1.shellPad}px`,
        background: V1.bg, borderBottom: `1px solid ${V1.border}`,
      }}>
        <Link to="/" className="v1-wordmark" aria-label="NEXUS home">
          NEXUS<span className="v1-dot">.</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link to="/pricing" className="v1-mono" style={{
            fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
            textTransform: 'uppercase', color: V1.textMuted, textDecoration: 'none',
          }}>
            Membership
          </Link>
          <Link to="/login" style={{
            fontFamily: V1.bodyFont, fontSize: V1.textBodySm, fontWeight: V1.fwMedium,
            color: V1.text, textDecoration: 'none',
            borderBottom: `1px solid ${V1.text}`,
            paddingBottom: 2,
          }}>
            Sign in
          </Link>
        </div>
      </nav>

      <main>
        {/* ── 1. HERO: product headline + chat preview card ── */}
        <section className="nx-enter" style={{
          padding: `${V1.marketingPadY}px ${V1.shellPad}px ${V1.marketingPadYSm}px`,
        }}>
          <div className="nx-hero-grid" style={{
            maxWidth: 1120, margin: '0 auto',
            display: 'grid', gridTemplateColumns: '1.05fr 0.95fr',
            gap: 56, alignItems: 'center',
          }}>
            <div>
              <div className="v1-mono" style={{
                fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
                textTransform: 'uppercase', color: V1.textMuted, marginBottom: 16,
              }}>
                Executive Intelligence System
              </div>
              <h1 style={{
                fontFamily: V1.displayFont, fontSize: V1.textDisplay, color: V1.text,
                fontWeight: V1.fwRegular, letterSpacing: V1.trackingTight,
                lineHeight: V1.leadingDisplay, margin: '0 0 20px',
              }}>
                Meet NEXUS.
              </h1>
              <p style={{
                fontFamily: V1.bodyFont, fontSize: V1.textBodyLg, color: V1.textSecondary,
                lineHeight: 1.55, margin: '0 0 32px', maxWidth: 480,
              }}>
                Your always-on intelligence partner for leadership, career, and organizational decisions. Built on two decades of LYC executive search methodology.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                <Link
                  to="/assessment/cpi"
                  onClick={() => trackCTA({ location: 'nexus_landing_hero', label: 'Start with a Complimentary Assessment', destination: '/assessment/cpi' })}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    minHeight: 48, padding: '14px 24px',
                    background: V1.teal800, color: V1.white,
                    border: 'none', fontFamily: V1.bodyFont, fontSize: 15, fontWeight: V1.fwSemibold,
                    textDecoration: 'none', boxSizing: 'border-box',
                    transition: `background ${V1.durFast}ms ${V1.ease}`,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = V1.teal900)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = V1.teal800)}
                >
                  Start with a complimentary assessment →
                </Link>
                <a
                  href="#capabilities"
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    minHeight: 48, padding: '14px 24px',
                    background: 'transparent', color: V1.text,
                    border: `1px solid ${V1.borderStrong}`, fontFamily: V1.bodyFont,
                    fontSize: 15, fontWeight: V1.fwMedium, textDecoration: 'none',
                    boxSizing: 'border-box',
                    transition: `border-color ${V1.durFast}ms ${V1.ease}, color ${V1.durFast}ms ${V1.ease}`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = V1.teal600; e.currentTarget.style.color = V1.teal700; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = V1.borderStrong; e.currentTarget.style.color = V1.text; }}
                >
                  See what it can do
                </a>
              </div>
              <div className="v1-mono" style={{
                fontSize: V1.textCaption, letterSpacing: V1.trackingMono,
                textTransform: 'uppercase', color: V1.textDim, marginTop: 16,
              }}>
                Executive Introduction · No credit card required
              </div>
            </div>

            {/* ── Chat preview card ── */}
            <div style={{
              border: `1px solid ${V1.border}`, background: V1.surface,
              padding: 24,
            }}>
              <div className="v1-mono" style={{
                fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
                textTransform: 'uppercase', color: V1.textMuted, marginBottom: 20,
              }}>
                {CHAT_PREVIEW.eyebrow}
              </div>

              {/* User message — right-aligned bubble */}
              <div style={{
                display: 'flex', justifyContent: 'flex-end', marginBottom: 16,
              }}>
                <div style={{
                  maxWidth: '78%', padding: '12px 16px',
                  background: V1.teal50, color: V1.text,
                  fontFamily: V1.bodyFont, fontSize: V1.textBodySm, lineHeight: 1.5,
                }}>
                  {CHAT_PREVIEW.userMsg}
                </div>
              </div>

              {/* NEXUS message — left-aligned with rule bar */}
              <div style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
              }}>
                <div className="v1-mono" style={{
                  fontSize: V1.textCaption, color: V1.teal700,
                  fontWeight: V1.fwSemibold, letterSpacing: V1.trackingMono,
                  flexShrink: 0, paddingTop: 12,
                }}>
                  NEXUS
                </div>
                <div style={{
                  flex: 1, paddingTop: 12,
                  borderTop: `1px solid ${V1.borderSubtle}`,
                  fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.textSecondary,
                  lineHeight: 1.6,
                }}>
                  {CHAT_PREVIEW.nexusMsg}
                </div>
              </div>

              {/* Mock input row */}
              <div style={{
                marginTop: 24, padding: '12px 16px',
                border: `1px solid ${V1.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 12,
              }}>
                <span style={{
                  fontFamily: V1.bodyFont, fontSize: V1.textBodySm,
                  color: V1.textDim,
                }}>
                  Ask NEXUS anything…
                </span>
                <span className="v1-mono" style={{
                  fontSize: V1.textCaption, letterSpacing: V1.trackingMono,
                  color: V1.textMuted, textTransform: 'uppercase',
                }}>
                  Send →
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. WHAT NEXUS CAN DO (capabilities, 4 cards) ── */}
        <section id="capabilities" style={{
          padding: `${V1.marketingPadY}px ${V1.shellPad}px`,
          borderTop: `1px solid ${V1.border}`,
        }}>
          <div style={{ maxWidth: 1120, margin: '0 auto' }}>
            <div style={{ marginBottom: 48 }}>
              <div className="v1-mono" style={{
                fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
                textTransform: 'uppercase', color: V1.textMuted, marginBottom: 12,
              }}>
                Capabilities
              </div>
              <h2 style={{
                fontFamily: V1.displayFont, fontSize: V1.textH1, color: V1.text,
                fontWeight: V1.fwRegular, letterSpacing: V1.trackingTight,
                lineHeight: V1.leadingHeading, margin: 0,
              }}>
                What NEXUS can do.
              </h2>
            </div>
            <div className="nx-cap-grid" style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24,
            }}>
              {CAPABILITIES.map((cap) => (
                <div key={cap.title} style={{
                  border: `1px solid ${V1.border}`,
                  background: V1.surface, padding: 28,
                  display: 'flex', flexDirection: 'column',
                }}>
                  <div className="v1-mono" style={{
                    fontSize: V1.textCaption, letterSpacing: V1.trackingMono,
                    textTransform: 'uppercase', color: V1.teal700, marginBottom: 16,
                    fontWeight: V1.fwSemibold,
                  }}>
                    {cap.icon}
                  </div>
                  <h3 style={{
                    fontFamily: V1.displayFont, fontSize: 22, color: V1.text,
                    fontWeight: V1.fwRegular, letterSpacing: V1.trackingTight,
                    lineHeight: V1.leadingHeading, margin: '0 0 10px',
                  }}>
                    {cap.title}
                  </h3>
                  <p style={{
                    fontFamily: V1.bodyFont, fontSize: V1.textBodySm,
                    color: V1.textSecondary, lineHeight: 1.55, margin: 0,
                  }}>
                    {cap.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. HOW IT WORKS (3 steps) ── */}
        <section style={{
          padding: `${V1.marketingPadY}px ${V1.shellPad}px`,
          background: V1.surfaceAlt, borderTop: `1px solid ${V1.border}`,
          borderBottom: `1px solid ${V1.border}`,
        }}>
          <div style={{ maxWidth: 1120, margin: '0 auto' }}>
            <div style={{ marginBottom: 48 }}>
              <div className="v1-mono" style={{
                fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
                textTransform: 'uppercase', color: V1.textMuted, marginBottom: 12,
              }}>
                How it works
              </div>
              <h2 style={{
                fontFamily: V1.displayFont, fontSize: V1.textH1, color: V1.text,
                fontWeight: V1.fwRegular, letterSpacing: V1.trackingTight,
                lineHeight: V1.leadingHeading, margin: 0,
              }}>
                Measure. Analyze. Discuss.
              </h2>
            </div>
            <div className="nx-step-grid" style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0,
              borderTop: `1px solid ${V1.border}`,
            }}>
              {STEPS.map((s, i) => (
                <div key={s.n} style={{
                  padding: '32px 28px',
                  borderRight: i < STEPS.length - 1 ? `1px solid ${V1.border}` : 'none',
                  background: V1.bg,
                }}>
                  <div className="v1-mono" style={{
                    fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
                    textTransform: 'uppercase', color: V1.teal600, marginBottom: 16,
                    fontWeight: V1.fwSemibold,
                  }}>
                    Step {s.n}
                  </div>
                  <h3 style={{
                    fontFamily: V1.displayFont, fontSize: V1.textH3, color: V1.text,
                    fontWeight: V1.fwRegular, letterSpacing: V1.trackingTight,
                    lineHeight: V1.leadingHeading, margin: '0 0 12px',
                  }}>
                    {s.title}
                  </h3>
                  <p style={{
                    fontFamily: V1.bodyFont, fontSize: V1.textBodySm,
                    color: V1.textSecondary, lineHeight: 1.6, margin: 0,
                  }}>
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. HOW IT'S DIFFERENT ── */}
        <section style={{ padding: `${V1.marketingPadY}px ${V1.shellPad}px` }}>
          <div style={{ maxWidth: 920, margin: '0 auto' }}>
            <div style={{ marginBottom: 48, textAlign: 'center' }}>
              <div className="v1-mono" style={{
                fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
                textTransform: 'uppercase', color: V1.textMuted, marginBottom: 12,
              }}>
                How it&rsquo;s different
              </div>
              <h2 style={{
                fontFamily: V1.displayFont, fontSize: V1.textH1, color: V1.text,
                fontWeight: V1.fwRegular, letterSpacing: V1.trackingTight,
                lineHeight: V1.leadingHeading, margin: 0,
              }}>
                Not a wrapper around a chatbot.
              </h2>
            </div>
            <div className="nx-diff-grid" style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32,
            }}>
              {DIFFERENTIATORS.map((d) => (
                <div key={d.title} style={{
                  borderLeft: `2px solid ${V1.teal600}`, paddingLeft: 24,
                }}>
                  <h3 style={{
                    fontFamily: V1.displayFont, fontSize: 20, color: V1.text,
                    fontWeight: V1.fwRegular, letterSpacing: V1.trackingTight,
                    lineHeight: V1.leadingHeading, margin: '0 0 10px',
                  }}>
                    {d.title}
                  </h3>
                  <p style={{
                    fontFamily: V1.bodyFont, fontSize: V1.textBodySm,
                    color: V1.textSecondary, lineHeight: 1.6, margin: 0,
                  }}>
                    {d.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. LENSES PREVIEW (6 assessments) ── */}
        <section style={{
          padding: `${V1.marketingPadY}px ${V1.shellPad}px`,
          background: V1.surfaceAlt, borderTop: `1px solid ${V1.border}`,
          borderBottom: `1px solid ${V1.border}`,
        }}>
          <div style={{ maxWidth: 1120, margin: '0 auto' }}>
            <div style={{ marginBottom: 40, textAlign: 'center' }}>
              <div className="v1-mono" style={{
                fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
                textTransform: 'uppercase', color: V1.textMuted, marginBottom: 12,
              }}>
                Works with every assessment
              </div>
              <h2 style={{
                fontFamily: V1.displayFont, fontSize: V1.textH2, color: V1.text,
                fontWeight: V1.fwRegular, letterSpacing: V1.trackingTight,
                lineHeight: V1.leadingHeading, margin: '0 0 8px',
              }}>
                All 6 lenses, one intelligence layer.
              </h2>
              <Link to="/assessments" className="v1-mono" style={{
                fontSize: V1.textCaption, letterSpacing: V1.trackingMono,
                textTransform: 'uppercase', color: V1.teal700,
                textDecoration: 'none',
                borderBottom: `1px solid ${V1.teal600}`, paddingBottom: 2,
              }}>
                See all lenses →
              </Link>
            </div>
            <div className="nx-diag-grid" style={{
              display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12,
            }}>
              {Object.values(ASSESSMENT_CATALOG).map((a) => (
                <a
                  key={a.code}
                  href={`/assessment/${a.code.toLowerCase()}`}
                  style={{
                    border: `1px solid ${V1.border}`,
                    background: V1.surface, padding: '24px 12px',
                    textAlign: 'center', textDecoration: 'none',
                    transition: `border-color ${V1.durFast}ms ${V1.ease}`,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = V1.teal600)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = V1.border)}
                >
                  <div style={{
                    fontFamily: V1.displayFont, fontSize: 22, color: V1.text,
                    fontWeight: V1.fwRegular, letterSpacing: V1.trackingTight,
                  }}>
                    {a.code}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6. MEMBERSHIP / PRICING (3 tiers as cards) ── */}
        <section style={{ padding: `${V1.marketingPadY}px ${V1.shellPad}px` }}>
          <div style={{ maxWidth: 1120, margin: '0 auto' }}>
            <div style={{ marginBottom: 48, textAlign: 'center' }}>
              <div className="v1-mono" style={{
                fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
                textTransform: 'uppercase', color: V1.textMuted, marginBottom: 12,
              }}>
                Membership
              </div>
              <h2 style={{
                fontFamily: V1.displayFont, fontSize: V1.textH2, color: V1.text,
                fontWeight: V1.fwRegular, letterSpacing: V1.trackingTight,
                lineHeight: V1.leadingHeading, margin: 0,
              }}>
                NEXUS access, by tier.
              </h2>
            </div>
            <div className="nx-tier-grid" style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0,
              border: `1px solid ${V1.border}`, background: V1.surface,
            }}>
              {PRICING_CONTEXT.map((p, i) => (
                <div key={p.tier} style={{
                  padding: 32,
                  borderRight: i < PRICING_CONTEXT.length - 1 ? `1px solid ${V1.border}` : 'none',
                  background: p.accent ? V1.fuchsia50 : V1.surface,
                  display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                  }}>
                    <span className="v1-mono" style={{
                      fontSize: V1.textCaption, letterSpacing: V1.trackingMono,
                      textTransform: 'uppercase', color: V1.textMuted,
                    }}>
                      {p.accent ? 'Recommended' : `Tier 0${i + 1}`}
                    </span>
                    {p.accent && (
                      <span style={{
                        width: 6, height: 6, background: V1.fuchsia600, display: 'inline-block',
                      }} aria-hidden="true" />
                    )}
                  </div>
                  <h3 style={{
                    fontFamily: V1.displayFont, fontSize: 26, color: p.accent ? V1.fuchsia700 : V1.text,
                    fontWeight: V1.fwRegular, letterSpacing: V1.trackingTight,
                    lineHeight: V1.leadingHeading, margin: '0 0 8px',
                  }}>
                    {p.tier}
                  </h3>
                  <p style={{
                    fontFamily: V1.bodyFont, fontSize: V1.textBodySm,
                    color: V1.textSecondary, lineHeight: 1.55, margin: '0 0 24px',
                  }}>
                    {p.blurb}
                  </p>
                  <ul style={{
                    listStyle: 'none', margin: 0, padding: 0,
                    display: 'flex', flexDirection: 'column', gap: 10,
                    flex: 1,
                  }}>
                    {p.features.map((f) => (
                      <li key={f} style={{
                        display: 'flex', gap: 10, alignItems: 'flex-start',
                        fontFamily: V1.bodyFont, fontSize: V1.textBodySm,
                        color: V1.text, lineHeight: 1.5,
                      }}>
                        <span aria-hidden="true" style={{
                          flexShrink: 0, width: 6, height: 6,
                          background: V1.teal600, marginTop: 8,
                        }} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={p.ctaHref}
                    onClick={() => trackCTA({ location: 'nexus_landing_tier', label: p.ctaLabel, destination: p.ctaHref })}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      minHeight: 48, padding: '14px 24px', marginTop: 24,
                      background: p.accent ? V1.teal800 : 'transparent',
                      color: p.accent ? V1.white : V1.text,
                      border: p.accent ? 'none' : `1px solid ${V1.borderStrong}`,
                      fontFamily: V1.bodyFont, fontSize: 15, fontWeight: V1.fwSemibold,
                      textDecoration: 'none', boxSizing: 'border-box',
                      transition: `background ${V1.durFast}ms ${V1.ease}, border-color ${V1.durFast}ms ${V1.ease}`,
                    }}
                    onMouseEnter={(e) => {
                      if (p.accent) e.currentTarget.style.background = V1.teal900;
                      else { e.currentTarget.style.borderColor = V1.teal600; e.currentTarget.style.color = V1.teal700; }
                    }}
                    onMouseLeave={(e) => {
                      if (p.accent) e.currentTarget.style.background = V1.teal800;
                      else { e.currentTarget.style.borderColor = V1.borderStrong; e.currentTarget.style.color = V1.text; }
                    }}
                  >
                    {p.ctaLabel} →
                  </Link>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <Link to="/pricing" className="v1-mono" style={{
                fontSize: V1.textCaption, letterSpacing: V1.trackingMono,
                textTransform: 'uppercase', color: V1.teal700, textDecoration: 'none',
                borderBottom: `1px solid ${V1.teal600}`, paddingBottom: 2,
              }}>
                See full pricing & feature comparison →
              </Link>
            </div>
          </div>
        </section>

        {/* ── 7. FAQ ── */}
        <section style={{
          padding: `${V1.marketingPadY}px ${V1.shellPad}px`,
          background: V1.surfaceAlt, borderTop: `1px solid ${V1.border}`,
          borderBottom: `1px solid ${V1.border}`,
        }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <h2 style={{
              fontFamily: V1.displayFont, fontSize: V1.textH2, color: V1.text,
              fontWeight: V1.fwRegular, letterSpacing: V1.trackingTight,
              lineHeight: V1.leadingHeading, textAlign: 'center', margin: '0 0 40px',
            }}>
              Frequently asked questions
            </h2>
            <div style={{
              borderTop: `1px solid ${V1.border}`,
              background: V1.surface,
            }}>
              {FAQ.map((item, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={i} style={{
                    borderBottom: `1px solid ${V1.border}`,
                  }}>
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      style={{
                        width: '100%', textAlign: 'left',
                        background: 'transparent', border: 'none',
                        padding: '20px 24px', cursor: 'pointer',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        gap: 16,
                      }}
                    >
                      <span style={{
                        fontFamily: V1.bodyFont, fontSize: V1.textBody, color: V1.text,
                        fontWeight: V1.fwMedium,
                      }}>
                        {item.q}
                      </span>
                      <span className="v1-mono" style={{
                        fontSize: V1.textBody, color: V1.teal700, flexShrink: 0,
                        fontWeight: V1.fwSemibold,
                      }}>
                        {isOpen ? '\u2212' : '+'}
                      </span>
                    </button>
                    {isOpen && (
                      <div style={{ padding: '0 24px 24px' }}>
                        <p style={{
                          fontFamily: V1.bodyFont, fontSize: V1.textBodySm,
                          color: V1.textSecondary, lineHeight: 1.65, margin: 0,
                        }}>
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

        {/* ── 8. FINAL CTA — dark teal ── */}
        <section style={{
          padding: `${V1.marketingPadY}px ${V1.shellPad}px`,
          background: V1.teal900, color: V1.onDark,
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <div className="v1-mono" style={{
              fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
              textTransform: 'uppercase', color: V1.onDarkMuted, marginBottom: 16,
            }}>
              The full version
            </div>
            <h2 style={{
              fontFamily: V1.displayFont, fontSize: 40, color: V1.onDark,
              fontWeight: V1.fwRegular, letterSpacing: V1.trackingTight,
              lineHeight: V1.leadingHeading, margin: '0 0 20px',
            }}>
              Start with a complimentary CPI baseline.
            </h2>
            <p style={{
              fontFamily: V1.bodyFont, fontSize: V1.textBody, color: V1.onDarkMuted,
              lineHeight: 1.6, margin: '0 0 32px', maxWidth: 480,
              marginLeft: 'auto', marginRight: 'auto',
            }}>
              Take the flagship assessment, then let NEXUS walk you through what your results actually mean — and what to do next.
            </p>
            <Link
              to="/assessment/cpi"
              onClick={() => trackCTA({ location: 'nexus_landing_try', label: 'Start Complimentary CPI Baseline', destination: '/assessment/cpi' })}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                minHeight: 52, padding: '16px 36px',
                background: V1.white, color: V1.teal900,
                border: 'none', fontFamily: V1.bodyFont, fontSize: 15, fontWeight: V1.fwSemibold,
                textDecoration: 'none', boxSizing: 'border-box',
                transition: `background ${V1.durFast}ms ${V1.ease}`,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = V1.teal50)}
              onMouseLeave={(e) => (e.currentTarget.style.background = V1.white)}
            >
              Start your complimentary baseline →
            </Link>
            <div className="v1-mono" style={{
              fontSize: V1.textCaption, letterSpacing: V1.trackingMono,
              textTransform: 'uppercase', color: V1.onDarkMuted, marginTop: 16,
            }}>
              ~15 minutes · Executive Introduction · No credit card
            </div>
          </div>
        </section>

        {/* ── 9. Footer (minimal) ── */}
        <footer style={{
          padding: '40px 32px',
          background: V1.bg, borderTop: `1px solid ${V1.border}`,
          textAlign: 'center',
        }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}>
            <Link to="/" className="v1-wordmark" aria-label="NEXUS home">
              NEXUS<span className="v1-dot">.</span>
            </Link>
            <div className="v1-mono" style={{
              fontSize: V1.textCaption, letterSpacing: V1.trackingMono,
              textTransform: 'uppercase', color: V1.textMuted,
            }}>
              Executive Intelligence System
            </div>
            <div style={{
              display: 'flex', gap: 24, marginTop: 8,
            }}>
              <Link to="/pricing" className="v1-mono" style={{
                fontSize: V1.textCaption, letterSpacing: V1.trackingMono,
                textTransform: 'uppercase', color: V1.textMuted, textDecoration: 'none',
              }}>
                Membership
              </Link>
              <Link to="/terms" className="v1-mono" style={{
                fontSize: V1.textCaption, letterSpacing: V1.trackingMono,
                textTransform: 'uppercase', color: V1.textMuted, textDecoration: 'none',
              }}>
                Terms
              </Link>
              <Link to="/privacy" className="v1-mono" style={{
                fontSize: V1.textCaption, letterSpacing: V1.trackingMono,
                textTransform: 'uppercase', color: V1.textMuted, textDecoration: 'none',
              }}>
                Privacy
              </Link>
            </div>
            <div style={{
              fontFamily: V1.bodyFont, fontSize: V1.textCaption,
              color: V1.textDim, marginTop: 8,
            }}>
              © 2026 LYC Partners
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
