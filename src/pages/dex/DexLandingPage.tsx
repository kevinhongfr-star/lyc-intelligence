/**
 * V4.2 — DEX AI PRODUCT PAGE (Tier B, teal-first)
 *
 * Route: /dex
 * Research / advisory tool — teal-first, cream background, editorial.
 *
 * Structure per spec:
 *   1. Hero — cream bg, teal accent, display headline, DEX AI wordmark
 *   2. What is DEX AI — 2-column explanation
 *   3. How it works — 3-4 step numbered process, rule lines
 *   4. Capabilities — text-first feature list, mono labels
 *   5. Use cases — 2-3 column, text-only
 *   6. Miles / access preview — 3-tier display
 *   7. CTA — "Begin Executive Introduction" (complimentary messages)
 *
 * Tier B accent: teal-600 primary. Fuchsia sparingly for flagship CTA.
 * All existing CTAs, routes, form targets preserved (/dex/chat, /dex/assess,
 * /dex/credits, /dex/book).
 *
 * V1 rules: 0px radius, no shadows, no cards, thin dividers, mono labels
 * uppercase, serif display, text symbols not icons, no Lucide, no DS tokens.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/seo/SEO';
import { V1 } from '@/styles/v1-tokens';

// ── Branded capabilities (mono labels + serif heading + inter body) ──
const CAPABILITIES = [
  {
    mono: 'CAREER · STRATEGY',
    title: 'Career trajectory mapping',
    desc: 'Placement data from 7,400+ executive mandates means the next move is not a guess. NEXUS surfaces the roles, geographies, and compensation bands where your profile compounds best.',
  },
  {
    mono: 'COMP · BENCHMARK',
    title: 'Compensation benchmarking',
    desc: 'Total compensation mapped across China Mainland, Hong Kong, Singapore, and Southeast Asia. Base, variable, equity, sign-on — the full structure, not just headline numbers.',
  },
  {
    mono: 'CROSS · BORDER',
    title: 'Cross-border transitions',
    desc: 'Shanghai → Singapore. Hong Kong → Mainland. Regional headquarters moves. Cultural codes, stakeholder mapping, and the failure patterns we have seen 100+ times.',
  },
  {
    mono: 'CONFIDENTIAL',
    title: 'Private, non-judgmental advisory',
    desc: 'Your conversations and data are yours. No PII in analytics. A thinking partner for the questions you do not raise in the boardroom.',
  },
];

// ── 3-step How it works ──
const STEPS = [
  {
    n: '01',
    eyebrow: 'EXECUTIVE INTRODUCTION',
    title: 'Begin with 5 complimentary messages.',
    desc: 'No credit card. Start asking about your market position, a specific role, or your next 90-day plan. The conversation is grounded in real placement data immediately.',
  },
  {
    n: '02',
    eyebrow: 'TAKE THE ASSESSMENT',
    title: 'Measure yourself. The conversation gets specific.',
    desc: 'When you take the executive diagnostic, NEXUS reads your structure — archetypes, dimensions, gaps. Follow-ups stop being generic and start being about you.',
  },
  {
    n: '03',
    eyebrow: 'EXTEND AS NEEDED',
    title: 'Miles. Books. Human debriefs.',
    desc: 'Buy miles for more conversations, book deep advisory sessions, or schedule a human debrief with a senior consultant. Every layer compounds on the work already done.',
  },
];

// ── Use cases (text-only, 2 column) ──
const USE_CASES = [
  {
    mono: 'BOARD · READINESS',
    title: 'Preparing for a board role',
    body: 'Map your profile against real board mandates. See the gap dimensions, the directors who made the same transition, and the 90-day reframe most successful candidates use.',
  },
  {
    mono: 'REGIONAL · MOVE',
    title: 'Cross-regional relocation',
    body: 'Compensation parity across Shanghai / Hong Kong / Singapore, cultural codes you need to navigate in the first 6 months, and the mandate types where your profile over-indexes.',
  },
  {
    mono: 'PROMO · NEXT LEVEL',
    title: 'Promotion to next-level executive',
    body: 'From functional lead to C-suite. The capability gaps that appear at step-up, the stakeholder dynamics that sink transitions, and the diagnostic profile your sponsor wants to see.',
  },
  {
    mono: 'EXIT · NEXT CHAPTER',
    title: 'Deciding what comes next',
    body: 'Founder exit. PE-backed role. Board-only portfolio. Retirement. A confidential space to structure the alternatives and model what each one actually means for you.',
  },
];

// ── Miles / access tiers ──
const ACCESS_TIERS = [
  {
    name: 'Executive Introduction',
    price: 'Complimentary',
    detail: '5 messages to experience NEXUS',
    cta: 'Begin Introduction',
    href: '/dex/chat',
    accent: false,
  },
  {
    name: 'Miles Pack',
    price: 'Pay as you go',
    detail: '1 mile per message — buy what you need, never expires',
    cta: 'Get Miles',
    href: '/dex/credits',
    accent: false,
  },
  {
    name: 'Monthly Pro',
    price: 'Subscription',
    detail: '100 mi/month + priority responses + discounted debriefs',
    cta: 'View Plans',
    href: '/dex/credits',
    accent: true, // V1 fuchsia reserved for recommended/recommended entry
  },
];

// ── Sample conversation preview — text-only, bordered preview ──
const SAMPLE_PREVIEW = {
  eyebrow: 'DEX AI · Advisory sample',
  q: 'I am a VP Operations in Shanghai. What should a move to Singapore COO look like comp-wise?',
  a:
    'For Shanghai VP Operations → Singapore COO, base typically adjusts +18–28% depending on the listed company / PE-backed split. Variable moves from roughly 40% of base to 65–85% of base. Equity is the variable — RSUs are standard for SGX-listed, carried interest for PE-backed. The two failure patterns we see: (1) taking the headline comp number without the variable structure, (2) assuming the Singapore market knows Shanghai regional scope the way your current board does — the first 100 days need to establish that explicitly. Want comp bands by industry vertical, or a 90-day positioning frame mapped to your specific profile?',
};

export function DexLandingPage() {
  const ACCENT = V1.teal600; // Tier B: teal-first
  const DARK = V1.bgDark;

  return (
    <div className="v1-scope" style={{ minHeight: '100vh', background: V1.bg, color: V1.text }}>
      <style>{`
        @keyframes v1-fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .dx-enter { animation: v1-fade-up ${V1.durNormal}ms ${V1.ease} both; }
        @media (max-width: 880px) {
          .dx-cap-grid { grid-template-columns: 1fr !important; }
          .dx-uc-grid  { grid-template-columns: 1fr !important; }
          .dx-tier-grid { grid-template-columns: 1fr !important; }
          .dx-two-col   { grid-template-columns: 1fr !important; }
          .dx-step-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <SEO
        title="DEX AI — Executive Advisory for China-APAC Leaders | NEXUS by LYC Partners"
        description="Your always-on advisory for career strategy, compensation benchmarking, and cross-border transitions. Trained on 7,400+ executive mandates across China and APAC."
        path="/dex"
      />

      {/* ── Minimal nav ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `20px ${V1.shellPad}px`,
        background: V1.bg, borderBottom: `1px solid ${V1.border}`,
      }}>
        <Link to="/" className="v1-wordmark" aria-label="home" style={{
          fontFamily: V1.displayFont, fontSize: 22, fontWeight: V1.fwSemibold,
          letterSpacing: V1.trackingTight, color: ACCENT, textDecoration: 'none',
        }}>
          DEX<span style={{ color: V1.text }}>.</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link to="/nexus" className="v1-mono" style={{
            fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
            textTransform: 'uppercase', color: V1.textMuted, textDecoration: 'none',
          }}>
            NEXUS
          </Link>
          <Link to="/login" style={{
            fontFamily: V1.bodyFont, fontSize: V1.textBodySm, fontWeight: V1.fwMedium,
            color: V1.text, textDecoration: 'none',
            borderBottom: `1px solid ${V1.text}`, paddingBottom: 2,
          }}>
            Sign in
          </Link>
        </div>
      </nav>

      <main>
        {/* ── 1. HERO — cream bg, teal accent, display headline, DEX AI wordmark ── */}
        <section
          className="dx-enter"
          style={{
            padding: `${V1.marketingPadY}px ${V1.shellPad}px`,
            maxWidth: V1.shellMax,
            margin: '0 auto',
          }}
        >
          <div style={{ maxWidth: 760 }}>
            {/* Mono eyebrow — teal tier label */}
            <div style={{
              display: 'inline-block',
              fontFamily: V1.monoFont,
              fontSize: V1.textMonoPx,
              fontWeight: V1.fwSemibold,
              letterSpacing: V1.trackingMono,
              textTransform: 'uppercase',
              color: ACCENT,
              borderBottom: `1px solid ${ACCENT}`,
              paddingBottom: 4,
              marginBottom: 24,
            }}>
              Executive Introduction · 5 Complimentary Messages
            </div>

            <h1 style={{
              fontFamily: V1.displayFont,
              fontSize: V1.textDisplay,
              fontWeight: V1.fwSemibold,
              color: V1.text,
              letterSpacing: V1.trackingTight,
              lineHeight: V1.leadingDisplay,
              margin: 0,
            }}>
              Executive advisory for China and APAC leaders.
            </h1>

            <p style={{
              marginTop: 24,
              fontFamily: V1.bodyFont,
              fontSize: V1.textBodyLg,
              color: V1.textSecondary,
              lineHeight: V1.leadingBody,
              maxWidth: 640,
            }}>
              NEXUS is your always-on advisor for career strategy, compensation benchmarking, and cross-border transitions — trained on LYC Partners&rsquo; placement intelligence across 7,400+ executive mandates.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 40 }}>
              {/* Primary: teal-800 bg */}
              <Link to="/dex/chat" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 20px',
                background: V1.teal800, color: V1.onDark,
                fontFamily: V1.monoFont, fontSize: V1.textMonoPx,
                fontWeight: V1.fwMedium, letterSpacing: V1.trackingMono,
                textTransform: 'uppercase',
                textDecoration: 'none',
                transition: `background ${V1.durFast}ms ease`,
              }} onMouseEnter={e => (e.currentTarget.style.background = V1.teal700)}
                 onMouseLeave={e => (e.currentTarget.style.background = V1.teal800)}>
                Begin Introduction →
              </Link>
              {/* Secondary: outline */}
              <Link to="/dex/assess" style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '12px 20px',
                background: 'transparent', color: V1.text,
                border: `1px solid ${V1.borderStrong}`,
                fontFamily: V1.monoFont, fontSize: V1.textMonoPx,
                fontWeight: V1.fwMedium, letterSpacing: V1.trackingMono,
                textTransform: 'uppercase',
                textDecoration: 'none',
                transition: `border-color ${V1.durFast}ms ease, color ${V1.durFast}ms ease`,
              }} onMouseEnter={e => {
                e.currentTarget.style.borderColor = ACCENT;
                e.currentTarget.style.color = ACCENT;
              }}
                 onMouseLeave={e => {
                   e.currentTarget.style.borderColor = V1.borderStrong;
                   e.currentTarget.style.color = V1.text;
                 }}>
                Take the Diagnostic
              </Link>
            </div>
          </div>
        </section>

        {/* ── 2. WHAT IS DEX AI — 2-column explanation ── */}
        <section
          className="dx-enter"
          style={{
            padding: `${V1.marketingPadY}px ${V1.shellPad}px`,
            borderTop: `1px solid ${V1.border}`,
            borderBottom: `1px solid ${V1.border}`,
            background: V1.surfaceAlt,
          }}
        >
          <div style={{ maxWidth: V1.shellMax, margin: '0 auto' }}>
            <div style={{
              fontFamily: V1.monoFont, fontSize: V1.textMonoPx,
              fontWeight: V1.fwSemibold, letterSpacing: V1.trackingMono,
              textTransform: 'uppercase', color: V1.textMuted,
              marginBottom: 12,
            }}>
              What it is
            </div>

            <div
              className="dx-two-col"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 48,
                alignItems: 'start',
              }}
            >
              <div>
                <h2 style={{
                  fontFamily: V1.displayFont,
                  fontSize: V1.textH2,
                  fontWeight: V1.fwSemibold,
                  color: V1.text,
                  letterSpacing: V1.trackingTight,
                  lineHeight: V1.leadingHeading,
                  margin: 0,
                }}>
                  Not a chatbot. A placement-literate advisor.
                </h2>
                <p style={{
                  marginTop: 16,
                  fontFamily: V1.bodyFont,
                  fontSize: V1.textBody,
                  color: V1.textSecondary,
                  lineHeight: V1.leadingBody,
                }}>
                  DEX AI is built on the institutional knowledge of LYC Partners — two decades of retained search across China Mainland, Hong Kong, Singapore, and Southeast Asia. 7,400+ executive mandates. 47 markets. The failure patterns, the comp structures, the hidden selection filters.
                </p>
                <p style={{
                  marginTop: 16,
                  fontFamily: V1.bodyFont,
                  fontSize: V1.textBody,
                  color: V1.textSecondary,
                  lineHeight: V1.leadingBody,
                }}>
                  When you ask a question, you get the answer a senior partner would give you — grounded in real placement history, not improvisation.
                </p>
              </div>

              <div
                className="dx-sample"
                style={{
                  border: `1px solid ${V1.border}`,
                  padding: 28,
                  background: V1.surface,
                }}
              >
                <div style={{
                  fontFamily: V1.monoFont, fontSize: V1.textMonoPx,
                  letterSpacing: V1.trackingMono, textTransform: 'uppercase',
                  color: V1.textMuted, marginBottom: 16,
                }}>
                  {SAMPLE_PREVIEW.eyebrow}
                </div>
                <p style={{
                  fontFamily: V1.bodyFont, fontSize: V1.textBody,
                  color: V1.text, lineHeight: V1.leadingBody,
                  padding: '8px 0', borderTop: `1px solid ${V1.border}`,
                  borderBottom: `1px solid ${V1.border}`,
                  margin: 0,
                }}>
                  <span style={{ color: V1.textMuted, fontFamily: V1.monoFont, fontSize: 11, display: 'block', marginBottom: 4 }}>
                    YOU ·
                  </span>
                  {SAMPLE_PREVIEW.q}
                </p>
                <p style={{
                  fontFamily: V1.bodyFont, fontSize: V1.textBody,
                  color: V1.textSecondary, lineHeight: V1.leadingBody,
                  marginTop: 16, marginBottom: 0,
                }}>
                  <span style={{ color: ACCENT, fontFamily: V1.monoFont, fontSize: 11, display: 'block', marginBottom: 4 }}>
                    DEX ·
                  </span>
                  {SAMPLE_PREVIEW.a}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. HOW IT WORKS — numbered steps, thin dividers ── */}
        <section style={{
          padding: `${V1.marketingPadY}px ${V1.shellPad}px`,
          maxWidth: V1.shellMax, margin: '0 auto',
        }}>
          <div style={{
            fontFamily: V1.monoFont, fontSize: V1.textMonoPx,
            fontWeight: V1.fwSemibold, letterSpacing: V1.trackingMono,
            textTransform: 'uppercase', color: V1.textMuted,
            marginBottom: 12,
          }}>
            How it works
          </div>
          <h2 style={{
            fontFamily: V1.displayFont, fontSize: V1.textH2,
            fontWeight: V1.fwSemibold, color: V1.text,
            letterSpacing: V1.trackingTight,
            lineHeight: V1.leadingHeading,
            margin: '0 0 56px',
          }}>
            Three steps from question to clarity.
          </h2>

          <div
            className="dx-step-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 0,
            }}
          >
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                style={{
                  padding: '32px 32px 32px 0',
                  borderRight: i < STEPS.length - 1 ? `1px solid ${V1.border}` : 'none',
                }}
              >
                <div style={{
                  fontFamily: V1.monoFont,
                  fontSize: V1.textMonoPx,
                  letterSpacing: V1.trackingMono,
                  textTransform: 'uppercase',
                  color: ACCENT,
                  marginBottom: 20,
                }}>
                  {s.n} &nbsp;·&nbsp; {s.eyebrow}
                </div>
                <h3 style={{
                  fontFamily: V1.displayFont,
                  fontSize: V1.textH3,
                  fontWeight: V1.fwSemibold,
                  color: V1.text,
                  letterSpacing: V1.trackingTight,
                  lineHeight: V1.leadingHeading,
                  margin: 0,
                }}>
                  {s.title}
                </h3>
                <p style={{
                  marginTop: 12,
                  fontFamily: V1.bodyFont,
                  fontSize: V1.textBodySm,
                  color: V1.textSecondary,
                  lineHeight: V1.leadingBody,
                }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. CAPABILITIES — mono-label feature list, text-first ── */}
        <section style={{
          padding: `${V1.marketingPadY}px ${V1.shellPad}px`,
          borderTop: `1px solid ${V1.border}`,
          background: V1.surfaceAlt,
        }}>
          <div style={{ maxWidth: V1.shellMax, margin: '0 auto' }}>
            <div style={{
              fontFamily: V1.monoFont, fontSize: V1.textMonoPx,
              fontWeight: V1.fwSemibold, letterSpacing: V1.trackingMono,
              textTransform: 'uppercase', color: V1.textMuted,
              marginBottom: 12,
            }}>
              Capabilities
            </div>
            <h2 style={{
              fontFamily: V1.displayFont, fontSize: V1.textH2,
              fontWeight: V1.fwSemibold, color: V1.text,
              letterSpacing: V1.trackingTight,
              lineHeight: V1.leadingHeading,
              margin: '0 0 48px',
            }}>
              Four dimensions of executive intelligence.
            </h2>

            <div
              className="dx-cap-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 0,
                borderTop: `1px solid ${V1.border}`,
              }}
            >
              {CAPABILITIES.map((c) => (
                <div
                  key={c.title}
                  style={{
                    padding: '28px 32px 28px 0',
                    borderBottom: `1px solid ${V1.border}`,
                    borderRight: `1px solid ${V1.border}`,
                  }}
                >
                  <div style={{
                    fontFamily: V1.monoFont,
                    fontSize: V1.textMonoPx,
                    letterSpacing: V1.trackingMono,
                    textTransform: 'uppercase',
                    color: ACCENT,
                    marginBottom: 12,
                  }}>
                    {c.mono}
                  </div>
                  <h3 style={{
                    fontFamily: V1.displayFont,
                    fontSize: 22,
                    fontWeight: V1.fwSemibold,
                    color: V1.text,
                    letterSpacing: V1.trackingTight,
                    lineHeight: V1.leadingHeading,
                    margin: 0,
                  }}>
                    {c.title}
                  </h3>
                  <p style={{
                    marginTop: 8,
                    fontFamily: V1.bodyFont,
                    fontSize: V1.textBodySm,
                    color: V1.textSecondary,
                    lineHeight: V1.leadingBody,
                  }}>
                    {c.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. USE CASES — 2-column text-only ── */}
        <section style={{
          padding: `${V1.marketingPadY}px ${V1.shellPad}px`,
          maxWidth: V1.shellMax, margin: '0 auto',
        }}>
          <div style={{
            fontFamily: V1.monoFont, fontSize: V1.textMonoPx,
            fontWeight: V1.fwSemibold, letterSpacing: V1.trackingMono,
            textTransform: 'uppercase', color: V1.textMuted,
            marginBottom: 12,
          }}>
            Use cases
          </div>
          <h2 style={{
            fontFamily: V1.displayFont, fontSize: V1.textH2,
            fontWeight: V1.fwSemibold, color: V1.text,
            letterSpacing: V1.trackingTight,
            lineHeight: V1.leadingHeading,
            margin: '0 0 48px',
          }}>
            Where executives use DEX.
          </h2>

          <div
            className="dx-uc-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 48,
            }}
          >
            {USE_CASES.map(uc => (
              <div key={uc.title} style={{
                borderTop: `1px solid ${V1.border}`,
                paddingTop: 24,
              }}>
                <div style={{
                  fontFamily: V1.monoFont,
                  fontSize: V1.textMonoPx,
                  letterSpacing: V1.trackingMono,
                  textTransform: 'uppercase',
                  color: ACCENT,
                  marginBottom: 12,
                }}>
                  {uc.mono}
                </div>
                <h3 style={{
                  fontFamily: V1.displayFont,
                  fontSize: V1.textH3,
                  fontWeight: V1.fwSemibold,
                  color: V1.text,
                  letterSpacing: V1.trackingTight,
                  lineHeight: V1.leadingHeading,
                  margin: 0,
                }}>
                  {uc.title}
                </h3>
                <p style={{
                  marginTop: 8,
                  fontFamily: V1.bodyFont,
                  fontSize: V1.textBodySm,
                  color: V1.textSecondary,
                  lineHeight: V1.leadingBody,
                }}>
                  {uc.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 6. ACCESS TIERS — text comparison format (no cards) ── */}
        <section style={{
          padding: `${V1.marketingPadY}px ${V1.shellPad}px`,
          borderTop: `1px solid ${V1.border}`,
          background: V1.surfaceAlt,
        }}>
          <div style={{ maxWidth: 1040, margin: '0 auto', textAlign: 'center' }}>
            <div style={{
              fontFamily: V1.monoFont, fontSize: V1.textMonoPx,
              fontWeight: V1.fwSemibold, letterSpacing: V1.trackingMono,
              textTransform: 'uppercase', color: V1.textMuted,
              marginBottom: 12,
            }}>
              Access
            </div>
            <h2 style={{
              fontFamily: V1.displayFont, fontSize: V1.textH2,
              fontWeight: V1.fwSemibold, color: V1.text,
              letterSpacing: V1.trackingTight,
              lineHeight: V1.leadingHeading,
              margin: 0,
            }}>
              Miles-based access. Simple.
            </h2>
            <p style={{
              marginTop: 12, marginBottom: 56,
              fontFamily: V1.bodyFont, fontSize: V1.textBodySm,
              color: V1.textMuted, lineHeight: V1.leadingBody,
            }}>
              Begin with 5 complimentary messages. No card required.
            </p>

            <div
              className="dx-tier-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 0,
                borderTop: `1px solid ${V1.border}`,
                borderRight: `1px solid ${V1.border}`,
                background: V1.surface,
              }}
            >
              {ACCESS_TIERS.map(t => (
                <div
                  key={t.name}
                  style={{
                    padding: 40,
                    textAlign: 'left',
                    borderLeft: `1px solid ${V1.border}`,
                    borderBottom: `1px solid ${V1.border}`,
                    outline: t.accent ? `1px solid ${V1.fuchsia600}` : 'none',
                    outlineOffset: -1,
                  }}
                >
                  {t.accent && (
                    <div style={{
                      fontFamily: V1.monoFont,
                      fontSize: V1.textMonoPx,
                      letterSpacing: V1.trackingMono,
                      textTransform: 'uppercase',
                      color: V1.fuchsia600,
                      marginBottom: 16,
                    }}>
                      ★ Recommended
                    </div>
                  )}
                  <h3 style={{
                    fontFamily: V1.displayFont,
                    fontSize: 22,
                    fontWeight: V1.fwSemibold,
                    color: V1.text,
                    letterSpacing: V1.trackingTight,
                    margin: 0,
                  }}>
                    {t.name}
                  </h3>
                  <div style={{
                    marginTop: 8,
                    fontFamily: V1.bodyFont,
                    fontSize: 20,
                    fontWeight: V1.fwSemibold,
                    color: ACCENT,
                  }}>
                    {t.price}
                  </div>
                  <p style={{
                    marginTop: 12,
                    fontFamily: V1.bodyFont,
                    fontSize: V1.textBodySm,
                    color: V1.textSecondary,
                    lineHeight: V1.leadingBody,
                  }}>
                    {t.detail}
                  </p>
                  <Link
                    to={t.href}
                    style={{
                      marginTop: 24,
                      display: 'inline-block',
                      padding: '10px 16px',
                      background: t.accent ? V1.fuchsia600 : 'transparent',
                      color: t.accent ? V1.onDark : V1.text,
                      border: t.accent ? 'none' : `1px solid ${V1.borderStrong}`,
                      fontFamily: V1.monoFont,
                      fontSize: V1.textMonoPx,
                      fontWeight: V1.fwMedium,
                      letterSpacing: V1.trackingMono,
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                    }}
                  >
                    {t.cta} →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7. FINAL CTA — coaching + book session ── */}
        <section style={{
          padding: `${V1.marketingPadY}px ${V1.shellPad}px`,
          background: DARK,
          color: V1.onDark,
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{
              fontFamily: V1.monoFont, fontSize: V1.textMonoPx,
              fontWeight: V1.fwSemibold, letterSpacing: V1.trackingMono,
              textTransform: 'uppercase',
              color: V1.onDarkMuted,
              marginBottom: 12,
            }}>
              Human Depth
            </div>
            <h2 style={{
              fontFamily: V1.displayFont,
              fontSize: V1.textH1,
              fontWeight: V1.fwSemibold,
              color: V1.onDark,
              letterSpacing: V1.trackingTight,
              lineHeight: V1.leadingHeading,
              margin: 0,
            }}>
              Ready for 1-on-1 guidance?
            </h2>
            <p style={{
              marginTop: 16,
              fontFamily: V1.bodyFont,
              fontSize: V1.textBody,
              color: V1.onDarkMuted,
              lineHeight: V1.leadingBody,
              maxWidth: 520,
              margin: '16px auto 0',
            }}>
              Book a confidential coaching session with a senior LYC Partners consultant. One mile per session.
            </p>
            <div style={{ marginTop: 40 }}>
              <Link to="/dex/book" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 20px',
                background: V1.onDark, color: DARK,
                fontFamily: V1.monoFont, fontSize: V1.textMonoPx,
                fontWeight: V1.fwMedium, letterSpacing: V1.trackingMono,
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}>
                Book a Coaching Session →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Minimal footer ── */}
        <footer style={{
          padding: '40px 32px',
          borderTop: `1px solid ${V1.border}`,
          fontFamily: V1.monoFont,
          fontSize: V1.textMonoPx,
          color: V1.textMuted,
          textAlign: 'center',
          letterSpacing: V1.trackingMono,
        }}>
          NEXUS by LYC Partners · All rights reserved.
        </footer>
      </main>
    </div>
  );
}

export default DexLandingPage;
