/**
 * W1-T3 — DebriefLandingPage.tsx
 *
 * Debrief sessions landing page at route /debrief.
 *
 * Structure:
 *  - Hero: headline + subhead + CTA to booking flow
 *  - 4 session cards in grid (render SessionCard for each in SESSION_CATALOG)
 *  - "How it works": 3 steps — Book, Meet, Action plan
 *  - Coach roster: COACH_ROSTER from sessions.ts
 *  - FAQ: 8-10 placeholder questions
 *  - Tier-benefit callout strip
 *  - Final CTA section
 *
 * Brand rules:
 *  - Radius = 0 everywhere
 *  - Font trio: serif headings, sans body, mono labels
 *  - Inline style objects (no Tailwind)
 *  - ONE accent: fuchsia ACCENT from tokens
 *  - All data from sessions.ts / tiers.ts config — no hardcoded numbers
 *  - All copy = placeholders mapped with "[Emily: ... — placeholder]"
 */
import React, { useEffect, useState } from 'react';
import { DS, ACCENT } from '@/tokens';
import {
  SESSION_CATALOG,
  COACH_ROSTER,
  type SessionType,
  COACH_TYPES,
  getComplimentaryAllocation,
} from '@/config/sessions';
import { tierDisplayName, TIERS } from '@/config/tiers';
import { SessionCard } from '@/components/debrief/SessionCard';
import { SEO } from '@/components/seo/SEO';
import { UnifiedFooter } from '@/components/layout/UnifiedFooter';
import { ChevronDown, ArrowRight } from 'lucide-react';

// ── FAQ (placeholder copy — Emily TBD) ───────────────────────────

const DEBRIEF_FAQ = [
  {
    q: '[Emily: FAQ Q1 — placeholder. e.g. "What is a human debrief session?"]',
    a: '[Emily: FAQ A1 — placeholder. Answer describing what debrief sessions are, how they differ from diagnostics, and what outcomes participants can expect.]',
  },
  {
    q: '[Emily: FAQ Q2 — placeholder. e.g. "How do I book a session?"]',
    a: '[Emily: FAQ A2 — placeholder. Walkthrough of the booking flow: selecting session type, choosing coach, picking a time slot, confirming payment or complimentary credit.]',
  },
  {
    q: '[Emily: FAQ Q3 — placeholder. e.g. "Who are the coaches?"]',
    a: '[Emily: FAQ A3 — placeholder. Description of coach credentials, certification process, specialisations (career, executive, leadership, CPI specialists), and APAC regional expertise.]',
  },
  {
    q: '[Emily: FAQ Q4 — placeholder. e.g. "What is the cancellation policy?"]',
    a: '[Emily: FAQ A4 — placeholder. Explanation of 24-hour free cancellation window, 50% charge for late cancellations within 24 hours, and 100% no-show policy.]',
  },
  {
    q: '[Emily: FAQ Q5 — placeholder. e.g. "What are complimentary sessions?"]',
    a: '[Emily: FAQ A5 — placeholder. Explanation of Executive tier complimentary 30-minute sessions (1/month) and Council tier complimentary 60-minute sessions (2/month), including billing cycle reset and no-rollover rules.]',
  },
  {
    q: '[Emily: FAQ Q6 — placeholder. e.g. "What is the CPI Deep-Dive session?"]',
    a: '[Emily: FAQ A6 — placeholder. Description of the 90-minute Council-only flagship CPI session, including bundled CPI diagnostic, pipeline health review, and China leadership context delivered by certified CPI specialists.]',
  },
  {
    q: '[Emily: FAQ Q7 — placeholder. e.g. "Can I upgrade or downgrade session lengths?"]',
    a: '[Emily: FAQ A7 — placeholder. Explanation of session upgrade paths, partial complimentary credit for longer sessions, and how tier discounts apply to upgrade pricing.]',
  },
  {
    q: '[Emily: FAQ Q8 — placeholder. e.g. "How does tier discounting work?"]',
    a: '[Emily: FAQ A8 — placeholder. Explanation of tier session discounts (Explorer 0% → Starter 10% → Pro 15% → Executive 20% → Council 25%), plus annual plan stacking bonus of +10% on top.]',
  },
  {
    q: '[Emily: FAQ Q9 — placeholder. e.g. "What happens after my session?"]',
    a: '[Emily: FAQ A9 — placeholder. Description of post-session deliverables: written action summary, prioritised next steps, any diagnostic reports bundled with the session, and follow-up booking options.]',
  },
  {
    q: '[Emily: FAQ Q10 — placeholder. e.g. "Which sessions am I eligible for?"]',
    a: '[Emily: FAQ A10 — placeholder. Eligibility overview: Explorer/Starter/Pro/Executive have access to Career 30, Executive 45, and Leadership 60 sessions. Council tier additionally unlocks the CPI Deep-Dive 90 flagship. Council-only gating is soft, not hard.]',
  },
];

// ── "How it works" 3-step placeholders ───────────────────────────

const HOW_IT_WORKS_STEPS = [
  {
    mono: '01 · Book',
    title: '[Emily: Step 1 title — placeholder. "Choose your session type and time."]',
    body: '[Emily: Step 1 body — placeholder. Select the session length and coach type that match your current goal. Pick from available coach time slots in your timezone. Pay or use your complimentary allocation.]',
  },
  {
    mono: '02 · Meet',
    title: '[Emily: Step 2 title — placeholder. "1:1 video session with your coach."]',
    body: '[Emily: Step 2 body — placeholder. Join a structured 1:1 video debrief. Your coach comes prepared with context from your profile and any relevant diagnostics. The session is recorded if you wish, with your consent.]',
  },
  {
    mono: '03 · Action Plan',
    title: '[Emily: Step 3 title — placeholder. "Written action summary and next steps."]',
    body: '[Emily: Step 3 body — placeholder. Receive a written debrief document with prioritised actions within 24–72 hours, depending on session type. Book a follow-up session when you are ready for the next level of depth.]',
  },
];

// ── INLINE STYLE CONSTANTS (matching LandingTemplate patterns) ───

const COLOR_BG_DARK = DS.bgDark;
const COLOR_TEXT_ON_DARK = DS.bg;
const COLOR_MUTED_ON_DARK = 'rgba(255,255,255,0.62)';

const EYEBROW_MONO: React.CSSProperties = {
  fontFamily: DS.monoFont,
  fontSize: 10,
  letterSpacing: '0.24em',
  color: DS.muted,
  textTransform: 'uppercase',
  marginBottom: 12,
  fontWeight: 600,
};

const SECTION_TITLE: React.CSSProperties = {
  fontFamily: DS.headingFont,
  fontSize: 'clamp(28px, 3.6vw, 40px)',
  fontWeight: 700,
  letterSpacing: '-0.015em',
  margin: 0,
  color: DS.text,
  lineHeight: 1.15,
};

const SECTION_LEAD: React.CSSProperties = {
  fontFamily: DS.bodyFont,
  color: DS.textSecondary,
  maxWidth: 620,
  marginTop: 12,
  lineHeight: 1.6,
};

export function DebriefLandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const execAlloc = getComplimentaryAllocation('executive');
  const councilAlloc = getComplimentaryAllocation('council');

  const handleBookClick = (session: SessionType) => {
    // Placeholder: would navigate to booking flow
    console.log('[Debrief] Book session clicked:', session.slug);
  };

  return (
    <div style={{ minHeight: '100vh', background: DS.bg, color: DS.text }}>
      <SEO
        page="landing"
        title="[Emily: SEO title — placeholder. Debrief Sessions | LYC Intelligence]"
        description="[Emily: SEO meta description — placeholder. 1:1 human debrief sessions with certified career, executive, leadership, and CPI coaches. Tier-discounted pricing, complimentary session allocations, and APAC expertise.]"
        path="/debrief"
      />

      <style>{`
        [data-debrief-page="root"] .debrief-session-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }
        [data-debrief-page="root"] .debrief-how-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        [data-debrief-page="root"] .debrief-coach-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
        }
        @media (max-width: 900px) {
          [data-debrief-page="root"] .debrief-how-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <main data-debrief-page="root">
        {/* ══════════════════════════════════════════
            1. HERO
            ══════════════════════════════════════════ */}
        <section style={{ background: COLOR_BG_DARK }}>
          <div
            style={{
              maxWidth: 1200,
              margin: '0 auto',
              padding: '96px 32px',
            }}
          >
            <div style={{ maxWidth: 720 }}>
              <div
                style={{
                  background: ACCENT,
                  color: DS.bg,
                  fontFamily: DS.monoFont,
                  fontSize: 10,
                  letterSpacing: '0.20em',
                  padding: '4px 10px',
                  display: 'inline-block',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  marginBottom: 20,
                }}
              >
                HUMAN DEBRIEF · STREAM 3
              </div>

              <div
                style={{
                  fontFamily: DS.monoFont,
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  color: DS.muted,
                  textTransform: 'uppercase',
                  marginBottom: 10,
                  fontWeight: 500,
                }}
              >
                [Emily: Hero eyebrow — placeholder. e.g. "1:1 COACHING · 4 SESSION TYPES"]
              </div>

              <h1
                style={{
                  fontFamily: DS.headingFont,
                  fontSize: 'clamp(40px, 6vw, 68px)',
                  fontWeight: 700,
                  color: COLOR_TEXT_ON_DARK,
                  lineHeight: 1.08,
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                [Emily: Debrief hero headline — placeholder]
              </h1>

              <p
                style={{
                  fontFamily: DS.bodyFont,
                  fontSize: 'clamp(15px, 1.5vw, 17px)',
                  color: COLOR_MUTED_ON_DARK,
                  lineHeight: 1.55,
                  maxWidth: 620,
                  marginTop: 18,
                }}
              >
                [Emily: Debrief hero subhead — placeholder. Description of human debrief sessions, what they enable, coach certifications, tier benefits, and APAC regional focus.]
              </p>

              <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
                <a
                  href="/debrief/book"
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
                    gap: 8,
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: `background ${DS.transition}`,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = DS.accentHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
                >
                  Book a Session <ArrowRight style={{ width: 14, height: 14 }} />
                </a>
                <a
                  href="#session-types"
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
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    textDecoration: 'none',
                    transition: `background ${DS.transition}`,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  Explore Session Types
                </a>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  fontFamily: DS.monoFont,
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: COLOR_MUTED_ON_DARK,
                  marginTop: 40,
                }}
              >
                <span>
                  [Emily: Hero meta 1 — placeholder. e.g. "4 Session Types"]
                </span>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                <span>
                  [Emily: Hero meta 2 — placeholder. e.g. "{COACH_ROSTER.length} Certified Coaches"]
                </span>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                <span>
                  [Emily: Hero meta 3 — placeholder. e.g. "APAC Timezones"]
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            2. SESSION TYPE CARDS (4 from SESSION_CATALOG)
            ══════════════════════════════════════════ */}
        <section id="session-types" style={{ background: DS.bg, padding: '96px 32px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div
                style={{
                  fontFamily: DS.monoFont,
                  fontSize: 10,
                  letterSpacing: '0.24em',
                  color: DS.muted,
                  textTransform: 'uppercase',
                  marginBottom: 12,
                  fontWeight: 600,
                }}
              >
                [Emily: Session cards eyebrow — placeholder. e.g. "FOUR SESSION FORMATS"]
              </div>
              <h2 style={{ ...SECTION_TITLE, textAlign: 'center', margin: '0 auto' }}>
                [Emily: Session cards H2 — placeholder. e.g. "Pick the session that matches your goal."]
              </h2>
              <p style={{ ...SECTION_LEAD, margin: '12px auto 0', textAlign: 'center' }}>
                [Emily: Session cards lead paragraph — placeholder. Overview of four session types, coach specialisations, duration options, and tier pricing benefits.]
              </p>
            </div>

            <div className="debrief-session-grid">
              {SESSION_CATALOG.map((session) => (
                <SessionCard
                  key={session.slug}
                  session={session}
                  showCta={true}
                  onBookClick={handleBookClick}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            3. TIER-BENEFIT CALLOUT STRIP
            ══════════════════════════════════════════ */}
        <section style={{ background: DS.bgAlt, padding: '48px 32px', borderTop: `1px solid ${DS.border}`, borderBottom: `1px solid ${DS.border}` }}>
          <div
            style={{
              maxWidth: 1120,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 32,
              alignItems: 'start',
            }}
          >
            <div style={{ display: 'flex', gap: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  background: `${ACCENT}14`,
                  border: `1px solid ${ACCENT}40`,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: DS.monoFont,
                    fontSize: 14,
                    fontWeight: 700,
                    color: ACCENT,
                  }}
                >
                  E
                </span>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: DS.headingFont,
                    fontSize: 18,
                    fontWeight: 600,
                    color: DS.text,
                    marginBottom: 4,
                  }}
                >
                  {tierDisplayName('executive')} tier
                </div>
                <div
                  style={{
                    fontFamily: DS.bodyFont,
                    fontSize: 14,
                    color: DS.textSecondary,
                    lineHeight: 1.55,
                  }}
                >
                  [Emily: Executive tier callout — placeholder. Includes 1 free 30-min session/month]
                </div>
                {execAlloc && (
                  <div
                    style={{
                      marginTop: 8,
                      fontFamily: DS.monoFont,
                      fontSize: 11,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: ACCENT,
                      fontWeight: 600,
                    }}
                  >
                    {execAlloc.count} × {execAlloc.coversDurationMinutes}min / month · Complimentary
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  background: `${ACCENT}14`,
                  border: `1px solid ${ACCENT}40`,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: DS.monoFont,
                    fontSize: 14,
                    fontWeight: 700,
                    color: ACCENT,
                  }}
                >
                  C
                </span>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: DS.headingFont,
                    fontSize: 18,
                    fontWeight: 600,
                    color: DS.text,
                    marginBottom: 4,
                  }}
                >
                  {tierDisplayName('council')} tier
                </div>
                <div
                  style={{
                    fontFamily: DS.bodyFont,
                    fontSize: 14,
                    color: DS.textSecondary,
                    lineHeight: 1.55,
                  }}
                >
                  [Emily: Council tier callout — placeholder. Includes 2 free 60-min sessions/month + CPI Deep-Dive access]
                </div>
                {councilAlloc && (
                  <div
                    style={{
                      marginTop: 8,
                      fontFamily: DS.monoFont,
                      fontSize: 11,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: ACCENT,
                      fontWeight: 600,
                    }}
                  >
                    {councilAlloc.count} × {councilAlloc.coversDurationMinutes}min / month · Complimentary
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  background: `${ACCENT}14`,
                  border: `1px solid ${ACCENT}40`,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: DS.monoFont,
                    fontSize: 14,
                    fontWeight: 700,
                    color: ACCENT,
                  }}
                >
                  %
                </span>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: DS.headingFont,
                    fontSize: 18,
                    fontWeight: 600,
                    color: DS.text,
                    marginBottom: 4,
                  }}
                >
                  [Emily: Tier discount callout title — placeholder. e.g. "Tier pricing discounts"]
                </div>
                <div
                  style={{
                    fontFamily: DS.bodyFont,
                    fontSize: 14,
                    color: DS.textSecondary,
                    lineHeight: 1.55,
                  }}
                >
                  [Emily: Tier discount callout body — placeholder. Tier session discounts scale with membership (10%→25%). Annual plan stacks +10% extra on top of tier pricing.]
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontFamily: DS.monoFont,
                    fontSize: 11,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: ACCENT,
                    fontWeight: 600,
                  }}
                >
                  {tierDisplayName('starter')} 10% · {tierDisplayName('professional')} 15% · {tierDisplayName('executive')} 20% · {tierDisplayName('council')} 25% · +10% Annual
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            4. "HOW IT WORKS" — 3 steps
            ══════════════════════════════════════════ */}
        <section id="how-it-works" style={{ background: DS.bg, padding: '96px 32px' }}>
          <div style={{ maxWidth: 1120, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={EYEBROW_MONO}>
                [Emily: How-it-works eyebrow — placeholder. e.g. "HOW IT WORKS"]
              </div>
              <h2 style={{ ...SECTION_TITLE, textAlign: 'center', margin: '0 auto' }}>
                [Emily: How-it-works H2 — placeholder. e.g. "From booking to action plan in three steps."]
              </h2>
              <p style={{ ...SECTION_LEAD, margin: '12px auto 0', textAlign: 'center' }}>
                [Emily: How-it-works lead paragraph — placeholder. Summary of the three-step process: select session, meet coach, receive written action plan.]
              </p>
            </div>

            <div className="debrief-how-grid">
              {HOW_IT_WORKS_STEPS.map((step, i) => (
                <div
                  key={i}
                  style={{
                    background: DS.card,
                    border: `1px solid ${DS.border}`,
                    padding: 28,
                    boxShadow: DS.shadow,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: -18,
                      left: 28,
                      width: 36,
                      height: 36,
                      background: ACCENT,
                      color: DS.bg,
                      fontFamily: DS.monoFont,
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {i + 1}
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <div
                      style={{
                        fontFamily: DS.monoFont,
                        fontSize: 10,
                        letterSpacing: '0.2em',
                        color: ACCENT,
                        textTransform: 'uppercase',
                        marginBottom: 10,
                      }}
                    >
                      {step.mono}
                    </div>
                    <h3
                      style={{
                        fontFamily: DS.headingFont,
                        fontSize: 20,
                        fontWeight: 600,
                        color: DS.text,
                        margin: '0 0 12px',
                        lineHeight: 1.3,
                      }}
                    >
                      {step.title}
                    </h3>
                    <p
                      style={{
                        fontFamily: DS.bodyFont,
                        fontSize: 14,
                        color: DS.textSecondary,
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            5. COACH ROSTER
            ══════════════════════════════════════════ */}
        <section id="coach-roster" style={{ background: DS.bgAlt, padding: '96px 32px' }}>
          <div style={{ maxWidth: 1120, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div
                style={{
                  fontFamily: DS.monoFont,
                  fontSize: 10,
                  letterSpacing: '0.24em',
                  color: DS.muted,
                  textTransform: 'uppercase',
                  marginBottom: 12,
                  fontWeight: 600,
                }}
              >
                [Emily: Coach roster eyebrow — placeholder. e.g. "YOUR COACHES"]
              </div>
              <h2 style={{ ...SECTION_TITLE, textAlign: 'center', margin: '0 auto' }}>
                [Emily: Coach roster H2 — placeholder. e.g. "Certified coaches, real APAC executive experience."]
              </h2>
              <p style={{ ...SECTION_LEAD, margin: '12px auto 0', textAlign: 'center' }}>
                [Emily: Coach roster lead paragraph — placeholder. Coach certifications, backgrounds, specialisations, and APAC timezone coverage.]
              </p>
            </div>

            <div className="debrief-coach-grid">
              {COACH_ROSTER.map((coach) => {
                const coachTypeMeta = COACH_TYPES[coach.type];
                return (
                  <div
                    key={coach.id}
                    style={{
                      background: DS.card,
                      border: `1px solid ${DS.border}`,
                      padding: 24,
                      boxShadow: DS.shadow,
                      display: 'flex',
                      flexDirection: 'column',
                      transition: DS.transition,
                    }}
                  >
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          background: DS.bgDark,
                          color: DS.bg,
                          borderRadius: '9999px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: DS.headingFont,
                          fontSize: 18,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {coach.avatarInitials}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: DS.headingFont,
                            fontSize: 17,
                            fontWeight: 600,
                            color: DS.text,
                            lineHeight: 1.25,
                          }}
                        >
                          {coach.name}
                        </div>
                        <div
                          style={{
                            fontFamily: DS.monoFont,
                            fontSize: 10,
                            letterSpacing: '0.16em',
                            textTransform: 'uppercase',
                            color: ACCENT,
                            marginTop: 4,
                          }}
                        >
                          {coachTypeMeta.displayName}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        fontFamily: DS.bodyFont,
                        fontSize: 13,
                        color: DS.textSecondary,
                        lineHeight: 1.6,
                        marginBottom: 16,
                      }}
                    >
                      {coach.bioPlaceholder}
                    </div>

                    <div
                      style={{
                        marginTop: 'auto',
                        paddingTop: 16,
                        borderTop: `1px solid ${DS.border}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: DS.monoFont,
                          fontSize: 10,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          color: DS.muted,
                        }}
                      >
                        {coach.timezone}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: 6,
                          flexWrap: 'wrap',
                        }}
                      >
                        {coach.canDeliver.map((ct) => (
                          <span
                            key={ct}
                            style={{
                              fontFamily: DS.monoFont,
                              fontSize: 9,
                              letterSpacing: '0.12em',
                              textTransform: 'uppercase',
                              color: DS.muted,
                              padding: '3px 8px',
                              background: DS.bgAlt,
                              border: `1px solid ${DS.border}`,
                            }}
                          >
                            {ct.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            6. MID-PAGE CTA
            ══════════════════════════════════════════ */}
        <section style={{ background: DS.bg, padding: '56px 32px', textAlign: 'center' }}>
          <a
            href="/debrief/book"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '16px 32px',
              background: ACCENT,
              color: DS.bg,
              fontFamily: DS.bodyFont,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              border: `1px solid ${ACCENT}`,
              transition: `background ${DS.transition}`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = DS.accentHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
          >
            [Emily: Mid-page CTA label — placeholder. e.g. "Start Booking Your Session"] <ArrowRight style={{ width: 14, height: 14 }} />
          </a>
        </section>

        {/* ══════════════════════════════════════════
            7. FAQ
            ══════════════════════════════════════════ */}
        <section id="faq" style={{ background: DS.bgAlt, padding: '96px 32px' }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div
                style={{
                  fontFamily: DS.monoFont,
                  fontSize: 10,
                  letterSpacing: '0.24em',
                  color: DS.muted,
                  textTransform: 'uppercase',
                  marginBottom: 12,
                  fontWeight: 600,
                }}
              >
                [Emily: FAQ eyebrow — placeholder. e.g. "FREQUENTLY ASKED"]
              </div>
              <h2 style={{ ...SECTION_TITLE, textAlign: 'center', margin: '0 auto' }}>
                [Emily: FAQ H2 — placeholder. e.g. "Questions about debrief sessions."]
              </h2>
              <p style={{ ...SECTION_LEAD, margin: '12px auto 0', textAlign: 'center' }}>
                [Emily: FAQ lead paragraph — placeholder. Booking, pricing, coaches, cancellations, complimentary sessions, and the CPI deep-dive.]
              </p>
            </div>

            <div>
              {DEBRIEF_FAQ.map((item, i) => {
                const open = openFaq === i;
                return (
                  <div
                    key={i}
                    style={{
                      borderBottom: `1px solid ${DS.border}`,
                      background: open ? DS.card : 'transparent',
                      transition: `background ${DS.transition}`,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : i)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        padding: '24px 16px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: `background ${DS.transition}`,
                        gap: 16,
                      }}
                      onMouseEnter={(e) => {
                        if (!open) e.currentTarget.style.background = DS.card;
                      }}
                      onMouseLeave={(e) => {
                        if (!open) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span
                        style={{
                          fontFamily: DS.headingFont,
                          fontSize: 17,
                          fontWeight: 600,
                          color: DS.text,
                          lineHeight: 1.4,
                        }}
                      >
                        {item.q}
                      </span>
                      <ChevronDown
                        size={20}
                        color={open ? ACCENT : DS.muted}
                        style={{
                          flexShrink: 0,
                          marginTop: 2,
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
                      <p
                        style={{
                          fontFamily: DS.bodyFont,
                          fontSize: 15,
                          color: DS.textSecondary,
                          lineHeight: 1.65,
                          padding: '0 16px 28px',
                          margin: 0,
                        }}
                      >
                        {item.a}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            8. FINAL CTA
            ══════════════════════════════════════════ */}
        <section
          id="final-cta"
          style={{
            background: COLOR_BG_DARK,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at 50% 40%, ${ACCENT}0F 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              maxWidth: 720,
              margin: '0 auto',
              padding: '112px 32px',
              position: 'relative',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: DS.monoFont,
                fontSize: 10,
                letterSpacing: '0.22em',
                color: DS.muted,
                textTransform: 'uppercase',
                marginBottom: 16,
                fontWeight: 600,
              }}
            >
              [Emily: Final CTA eyebrow — placeholder. e.g. "READY TO BOOK?"]
            </div>
            <h2
              style={{
                fontFamily: DS.headingFont,
                fontSize: 'clamp(28px, 4vw, 44px)',
                fontWeight: 700,
                color: COLOR_TEXT_ON_DARK,
                lineHeight: 1.15,
                letterSpacing: '-0.015em',
                margin: 0,
              }}
            >
              [Emily: Final CTA H2 — placeholder. e.g. "Book your first debrief session."]
            </h2>
            <p
              style={{
                fontFamily: DS.bodyFont,
                color: COLOR_MUTED_ON_DARK,
                fontSize: 15,
                lineHeight: 1.6,
                marginTop: 20,
                maxWidth: 560,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              [Emily: Final CTA subtext — placeholder. Call to action encouraging users to book their session. Mentions tier discounts, complimentary allocations, 24h cancellation policy, certified coaches, and written action plans.]
            </p>

            <div style={{ marginTop: 32 }}>
              <a
                href="/debrief/book"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '20px 40px',
                  background: ACCENT,
                  color: DS.bg,
                  border: `1px solid ${ACCENT}`,
                  fontFamily: DS.bodyFont,
                  fontSize: 14,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  textDecoration: 'none',
                  minHeight: 52,
                  transition: `background ${DS.transition}`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = DS.accentHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
              >
                [Emily: Final CTA button label — placeholder. e.g. "Book Your Debrief Session"] <ArrowRight style={{ width: 14, height: 14 }} />
              </a>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 24,
                marginTop: 28,
              }}
            >
              {[
                '[Emily: Final meta 1 — placeholder. e.g. "TIER DISCOUNTS APPLIED"]',
                '[Emily: Final meta 2 — placeholder. e.g. "COMPLIMENTARY SESSIONS"]',
                '[Emily: Final meta 3 — placeholder. e.g. "24H CANCELLATION POLICY"]',
              ].map((t, i, arr) => (
                <React.Fragment key={t}>
                  <span
                    style={{
                      fontFamily: DS.monoFont,
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: DS.mutedDim,
                    }}
                  >
                    {t}
                  </span>
                  {i < arr.length - 1 && (
                    <span style={{ color: DS.mutedDim }}>·</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            <a
              href="/pricing"
              style={{
                display: 'inline-block',
                marginTop: 20,
                fontFamily: DS.monoFont,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: DS.mutedDim,
                textDecoration: 'underline',
                textUnderlineOffset: 4,
                transition: DS.transition,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = DS.bg)}
              onMouseLeave={(e) => (e.currentTarget.style.color = DS.mutedDim)}
            >
              [Emily: Final CTA secondary link — placeholder. e.g. "See all pricing tiers →"]
            </a>
          </div>
        </section>

        <UnifiedFooter />
      </main>
    </div>
  );
}

export default DebriefLandingPage;
