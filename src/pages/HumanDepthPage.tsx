/**
 * V4.2 — HUMAN DEPTH / COACHING HOURS PAGE
 *
 * Route: /nexus/coaching (inside app shell, left nav "Human Layer" →
 * "Coaching hours" active)
 *
 * 3-column app shell (V1 line-art system):
 *   LEFT (220)  — Workspace / Depth / Human Layer nav (Coaching hours active)
 *   MAIN        — Page header, hour package grid (Bronze/Silver/Gold,
 *                 Silver = RECOMMENDED fuchsia badge), coach profiles
 *                 (2-column grid, bordered cells), How-it-works numbered rows
 *   RIGHT (280) — Your balance (hrs + progress + renew), Upcoming sessions,
 *                 NEXUS recommends, Confidentiality note
 *
 * Human coaching packages are COMPLETELY SEPARATE from AI subscription
 * tiers (Explorer/Starter/Pro/Executive/Council). This is the add-on layer.
 *
 * This is 100% UI layer — hooks into the existing booking system
 * (coachingService.ts session.create → /api/coaching/*, BookDebriefPage).
 */
import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '@/components/seo/SEO';
import { SkipToContent } from '@/components/a11y/SkipToContent';
import { useAuthStore } from '@/stores/authStore';
import { V1 } from '@/styles/v1-tokens';

// ── V1 motion ──
const EASE_OUT = V1.ease;
const REVEAL_MS = V1.durNormal;

// ── Canon coaching package data — V4 spec locked ──
// Bronze: $1,200 / 5 hrs ($240/hr)
// Silver: $3,800 / 20 hrs ($190/hr) — RECOMMENDED
// Gold:   $8,000 / 50 hrs ($160/hr)
interface CoachingPackage {
  id: 'bronze' | 'silver' | 'gold';
  name: string;
  price: number;
  hours: number;
  perHour: number;
  description: string;
  features: string[];
  recommended: boolean;
  ctaLabel: string;
}

const COACHING_PACKAGES: CoachingPackage[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    price: 1200,
    hours: 5,
    perHour: 240,
    description:
      'A short runway for a specific decision or transition. Five focused hours.',
    features: [
      '5 coaching hours',
      'Any of the 4 coaches',
      'NEXUS pre-read & session prep',
      'Outcomes written back to milestones',
      '6-month expiration',
    ],
    recommended: false,
    ctaLabel: 'Choose Bronze',
  },
  {
    id: 'silver',
    name: 'Silver',
    price: 3800,
    hours: 20,
    perHour: 190,
    description:
      'The working cadence. Twenty hours across a quarter — the sweet spot for real movement.',
    features: [
      '20 coaching hours',
      'Priority booking across all coaches',
      'NEXUS pre-read + session summaries',
      'Dedicated session note-taker (optional)',
      '12-month expiration',
      'Quarterly check-in from your lead coach',
    ],
    recommended: true,
    ctaLabel: 'Choose Silver',
  },
  {
    id: 'gold',
    name: 'Gold',
    price: 8000,
    hours: 50,
    perHour: 160,
    description:
      'Embedded depth. Fifty hours across a year — continuity for high-stakes transitions.',
    features: [
      '50 coaching hours',
      'Direct coach calendar access',
      'Custom session agendas + pre-reads',
      'Board-level prep support',
      '18-month expiration',
      'Concierge booking + rescheduling',
      'Off-hours availability window',
    ],
    recommended: false,
    ctaLabel: 'Choose Gold',
  },
];

// ── Coach profiles (4 canon coaches) ──
interface Coach {
  id: string;
  name: string;
  initials: string;
  title: string;
  focus: string;
  tags: string[];
}

const COACHES: Coach[] = [
  {
    id: 'kevin',
    name: 'Kevin Hong',
    initials: 'KH',
    title: 'Lead Coach · Cross-Border',
    focus:
      'China-to-global leadership, board-level positioning, and dual-reporting structure. Former regional CEO at a US Fortune 500.',
    tags: ['Cross-border', 'Board', 'CPI'],
  },
  {
    id: 'sarah',
    name: 'Sarah Chen',
    initials: 'SC',
    title: 'Coach · Talent & Transition',
    focus:
      'Succession, pipeline, and 90-day landing. Runs the CPI debrief practice. 12 years in retained search at the partner level.',
    tags: ['Pipeline', 'Succession', 'CPI'],
  },
  {
    id: 'raphael',
    name: 'Raphael Mendes',
    initials: 'RM',
    title: 'Coach · Strategic Impact',
    focus:
      'Stakeholder influence, organizational redesign, and complex mandate leadership. Previously COO of a 300-person scale-up.',
    tags: ['Influence', 'IMPACT', 'Org design'],
  },
  {
    id: 'lina',
    name: 'Lina Wang',
    initials: 'LW',
    title: 'Coach · AI & Leadership',
    focus:
      'AI-augmented leadership, technical exec onboarding, and founder-to-CEO transitions. SPARK methodology lead.',
    tags: ['SPARK', 'AI leadership', 'Founder'],
  },
];

// ── How it works (3 steps) ──
const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'You book. NEXUS prepares.',
    body:
      'Pick your coach, time, and topic. Forty-eight hours before, NEXUS reads the relevant threads, milestones, and lens readouts and writes a one-page brief — only for you and them.',
  },
  {
    step: 2,
    title: 'The session stays between you and them.',
    body:
      'NEXUS is not in the room. The conversation is confidential, unrecorded, and governed by the coaching agreement. Notes are opt-in and controlled by you.',
  },
  {
    step: 3,
    title: 'Outcomes land back in your milestones.',
    body:
      'After each session, you and the coach agree on what to carry forward. NEXUS writes agreed outcomes into your milestones so the thread is continuous.',
  },
];

// ── Upcoming sessions mock ──
const UPCOMING_SESSIONS = [
  {
    coach: 'Kevin Hong',
    topic: 'Singapore reporting structure',
    date: 'Jun 21, 2026',
    time: '10:00 AM SGT',
  },
  {
    coach: 'Sarah Chen',
    topic: 'CPI debrief — Q3 board prep',
    date: 'Jul 2, 2026',
    time: '3:00 PM HKT',
  },
];

// ── Helpers ──
function formatPrice(n: number) {
  return '$' + n.toLocaleString('en-US');
}

export function HumanDepthPage() {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  const [selectedPkg, setSelectedPkg] = useState<'bronze' | 'silver' | 'gold'>('silver');

  // Coaching balance mock
  const balanceHours = 14;
  const totalHours = 20;
  const percentUsed = Math.round(((totalHours - balanceHours) / totalHours) * 100);

  return (
    <div className="v1-scope" style={{ minHeight: '100vh', background: V1.bg }}>
      <SEO page="nexus" />
      <style>{`
        /* ── V4 page transitions: fade + 4px Y shift, 0.2s ease ── */
        @keyframes hd-reveal { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .hd-enter { animation: hd-reveal ${REVEAL_MS}ms ${EASE_OUT} both; }
        .hd-enter-d1 { animation: hd-reveal ${REVEAL_MS}ms ${EASE_OUT} 80ms both; }
        .hd-enter-d2 { animation: hd-reveal ${REVEAL_MS}ms ${EASE_OUT} 160ms both; }
        /* ── Progress bar fill: simple width grow ── */
        @keyframes hd-fill { from { width: 0%; } }
        .hd-progress-fill { animation: hd-fill 500ms ${EASE_OUT} both; }
        /* ── Accessibility: V4-specified TEAL focus ring scoped ── */
        .v1-scope :focus-visible {
          outline: 2px solid ${V1.teal600} !important;
          outline-offset: 2px;
          border-radius: 0;
        }
        /* ── Micro-interactions: subtle bg shift 0.15s, NO shadow/lift ── */
        .v1-scope .v1-btn {
          transition: background ${V1.durFast}ms ${EASE_OUT},
                      color ${V1.durFast}ms ${EASE_OUT},
                      border-color ${V1.durFast}ms ${EASE_OUT};
        }
        .v1-scope .v1-btn-secondary:hover {
          background: ${V1.ink50};
          color: ${V1.teal800};
          border-color: ${V1.teal600};
        }
        /* ── Card hover: border color shift only (no shadow, no lift) ── */
        .v1-scope .v1-card-hover {
          transition: border-color ${V1.durFast}ms ${EASE_OUT},
                      background ${V1.durFast}ms ${EASE_OUT};
        }
        .v1-scope .v1-card-hover:hover {
          border-color: ${V1.teal600};
          background: ${V1.cream};
        }
        /* ── Sidebar link micro hover ── */
        .v1-scope .v1-sidebar-link {
          transition: color ${V1.durFast}ms ${EASE_OUT},
                      background ${V1.durFast}ms ${EASE_OUT},
                      border-left-color ${V1.durFast}ms ${EASE_OUT};
        }
        .v1-scope .v1-sidebar-link:hover:not(.v1-active) {
          color: ${V1.teal700};
          background: ${V1.ink50};
        }
        /* ── Responsive: mobile touch targets ≥44px ── */
        @media (max-width: 768px) {
          .v1-scope .v1-btn { min-height: 44px; min-width: 44px; }
          .v1-scope .v1-appshell-main > div { padding: 20px 16px; }
        }
      `}</style>

      <SkipToContent />

      {/* ══════════ NAV ══════════ */}
      <nav className="v1-nav" aria-label="Primary">
        <div className="v1-nav-inner">
          <Link to="/" className="v1-wordmark" aria-label="NEXUS home">
            NEXUS<span className="v1-dot">.</span>
          </Link>
          <div className="v1-nav-links v1-hidden-mobile">
            <Link to="/nexus/chat">Chat</Link>
            <Link to="/nexus/lenses">Lenses</Link>
            <Link to="/nexus/milestones">Milestones</Link>
          </div>
          <div className="v1-nav-cta">
            {!user ? (
              <Link to="/login" className="v1-btn v1-btn-secondary">Sign in</Link>
            ) : (
              <span className="v1-avatar v1-avatar-sm" title={profile?.name || user?.email || ''}>
                {(profile?.name || user?.email || 'U').slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </nav>

      {/* ══════════ 3-COLUMN APP SHELL ══════════ */}
      <div
        className="v1-appshell"
        style={{ marginTop: V1.navHeight, minHeight: `calc(100vh - ${V1.navHeight}px)` }}
      >
        {/* ── LEFT SIDEBAR ── */}
        <aside className="v1-appshell-col" aria-label="Workspace navigation">
          <div className="v1-sidebar-sticky">
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Workspace</div>
              <Link to="/nexus/chat" className="v1-sidebar-link">Chat</Link>
              <Link to="/nexus/lenses" className="v1-sidebar-link">Lenses</Link>
              <Link to="/nexus/milestones" className="v1-sidebar-link">Milestones</Link>
              <Link to="/nexus/insights" className="v1-sidebar-link">Insights</Link>
              <Link to="/app/documents" className="v1-sidebar-link">Documents</Link>
              <Link to="/nexus/settings" className="v1-sidebar-link">Settings</Link>
            </div>
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Depth</div>
              {['Positioning', 'Influence', 'Transition', 'Enterprise China'].map((area) => (
                <Link
                  to="/nexus/lenses"
                  key={area}
                  className="v1-sidebar-link"
                >
                  {area}
                  <span className="v1-sidebar-meta">practice</span>
                </Link>
              ))}
              <Link to="/nexus/lenses" className="v1-sidebar-link">
                All eleven lenses <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Human Layer</div>
              <Link to="/nexus/coaching" className="v1-sidebar-link v1-active">Coaching hours</Link>
              <Link to="/app/bookings" className="v1-sidebar-link">Upcoming sessions</Link>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="v1-appshell-main" id="main-content" tabIndex={-1}>
          <div style={{ padding: V1.shellPad, maxWidth: V1.contentMax, width: '100%' }}>
            {/* ═══ Page header ═══ */}
            <div className="hd-enter" style={{ marginBottom: V1.shellPad }}>
              <div className="v1-eyebrow" style={{ marginBottom: 8 }}>Human depth layer</div>
              <h1
                className="v1-display"
                style={{
                  fontSize: V1.textH1,
                  margin: '0 0 10px',
                  letterSpacing: V1.trackingTight,
                  lineHeight: V1.leadingDisplay,
                  fontFamily: V1.displayFont,
                  color: V1.text,
                  fontWeight: V1.fwRegular,
                }}
              >
                When you need a person on the other side.
              </h1>
              <p
                style={{
                  fontFamily: V1.bodyFont,
                  fontSize: V1.textBodyLg,
                  color: V1.textSecondary,
                  margin: 0,
                  lineHeight: V1.leadingBody,
                  maxWidth: 560,
                }}
              >
                NEXUS does daily work. Humans do judgment work. Buy coaching hours
                as an add-on — completely separate from your NEXUS subscription.
              </p>
            </div>

            {/* ═══ Coaching hour packages (3-column grid) ═══ */}
            <section className="hd-enter" aria-label="Coaching packages" style={{ marginBottom: V1.shellPad }}>
              <h2
                className="v1-display"
                style={{
                  fontSize: V1.textH3,
                  margin: '0 0 20px',
                  fontFamily: V1.displayFont,
                  color: V1.text,
                  fontWeight: V1.fwRegular,
                }}
              >
                Coaching hour packages
              </h2>

              <div
                role="radiogroup"
                aria-label="Select a coaching package"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 0,
                  border: `1px solid ${V1.border}`,
                }}
              >
                {COACHING_PACKAGES.map((pkg, i) => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    selected={selectedPkg === pkg.id}
                    first={i === 0}
                    onSelect={() => {
                      setSelectedPkg(pkg.id);
                      navigate('/debrief/book');
                    }}
                  />
                ))}
              </div>
            </section>

            <hr className="v1-rule v1-rule-bleed" style={{ margin: `${V1.shellPad}px 0` }} />

            {/* ═══ Coach profiles (2-column grid, bordered cells) ═══ */}
            <section className="hd-enter" aria-label="Coaches" style={{ marginBottom: V1.shellPad }}>
              <h2
                className="v1-display"
                style={{
                  fontSize: V1.textH3,
                  margin: '0 0 20px',
                  fontFamily: V1.displayFont,
                  color: V1.text,
                  fontWeight: V1.fwRegular,
                }}
              >
                The coaches
              </h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 0,
                  border: `1px solid ${V1.border}`,
                }}
              >
                {COACHES.map((coach, i) => (
                  <CoachCard
                    key={coach.id}
                    coach={coach}
                    top={i < 2}
                    left={i % 2 === 0}
                    onBook={() => navigate('/debrief/book')}
                  />
                ))}
              </div>
            </section>

            <hr className="v1-rule v1-rule-bleed" style={{ margin: `${V1.shellPad}px 0` }} />

            {/* ═══ How it works (numbered rows) ═══ */}
            <section className="hd-enter" aria-label="How coaching works">
              <h2
                className="v1-display"
                style={{
                  fontSize: V1.textH3,
                  margin: '0 0 20px',
                  fontFamily: V1.displayFont,
                  color: V1.text,
                  fontWeight: V1.fwRegular,
                }}
              >
                How it works
              </h2>

              <div style={{ border: `1px solid ${V1.border}` }}>
                {HOW_IT_WORKS.map((row, i) => (
                  <div
                    key={row.step}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 20,
                      padding: '22px 24px',
                      borderBottom:
                        i < HOW_IT_WORKS.length - 1
                          ? `1px solid ${V1.borderSubtle}`
                          : undefined,
                    }}
                  >
                    <div
                      style={{
                        flexShrink: 0,
                        width: 36,
                        height: 36,
                        border: `1px solid ${V1.borderStrong}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: V1.monoFont,
                        fontSize: 14,
                        color: V1.teal700,
                        letterSpacing: V1.trackingMono,
                      }}
                    >
                      0{row.step}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3
                        style={{
                          fontFamily: V1.displayFont,
                          fontSize: 19,
                          color: V1.text,
                          margin: '0 0 6px',
                          fontWeight: V1.fwMedium,
                        }}
                      >
                        {row.title}
                      </h3>
                      <p
                        style={{
                          fontFamily: V1.bodyFont,
                          fontSize: V1.textBodySm,
                          color: V1.textSecondary,
                          margin: 0,
                          lineHeight: V1.leadingBody,
                        }}
                      >
                        {row.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>

        {/* ── RIGHT RAIL ── */}
        <aside className="v1-appshell-col" aria-label="Coaching context panel">
          <div className="v1-sidebar-sticky">
            {/* 1. Your balance */}
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Your balance</div>
              <div style={{ marginTop: 8 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 6,
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontFamily: V1.displayFont,
                      fontSize: 40,
                      color: V1.text,
                      lineHeight: 1,
                      fontWeight: V1.fwRegular,
                    }}
                  >
                    {balanceHours}
                  </span>
                  <span
                    className="v1-mono"
                    style={{
                      fontSize: 11.2,
                      color: V1.textMuted,
                      letterSpacing: V1.trackingMono,
                      textTransform: 'uppercase',
                    }}
                  >
                    hrs of {totalHours}
                  </span>
                </div>
                <div className="v1-progress" style={{ marginBottom: 8 }}>
                  <div
                    className="v1-progress-fill hd-progress-fill"
                    style={{
                      width: `${100 - percentUsed}%`,
                      background: V1.teal600,
                    }}
                  />
                </div>
                <div
                  className="v1-mono"
                  style={{
                    fontSize: 11.2,
                    color: V1.textMuted,
                    letterSpacing: V1.trackingMono,
                    textTransform: 'uppercase',
                  }}
                >
                  Silver package · renews Aug 1, 2026
                </div>
              </div>
            </div>

            {/* 2. Upcoming sessions */}
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Upcoming sessions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                {UPCOMING_SESSIONS.map((session, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '12px 0',
                      borderTop: i === 0 ? undefined : `1px solid ${V1.borderSubtle}`,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: V1.bodyFont,
                        fontSize: V1.textBodySm,
                        color: V1.text,
                        fontWeight: V1.fwMedium,
                        marginBottom: 2,
                      }}
                    >
                      {session.coach}
                    </div>
                    <div
                      style={{
                        fontFamily: V1.bodyFont,
                        fontSize: 13,
                        color: V1.textSecondary,
                        marginBottom: 4,
                      }}
                    >
                      {session.topic}
                    </div>
                    <div
                      className="v1-mono"
                      style={{
                        fontSize: 10.5,
                        color: V1.textMuted,
                        letterSpacing: V1.trackingMono,
                        textTransform: 'uppercase',
                      }}
                    >
                      {session.date} · {session.time}
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/app/bookings"
                className="v1-btn v1-btn-link"
                style={{ marginTop: 8, padding: 0, fontSize: 13, minHeight: 'auto' }}
              >
                View all sessions <span aria-hidden="true">→</span>
              </Link>
            </div>

            {/* 3. NEXUS recommends */}
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">NEXUS recommends</div>
              <div style={{ marginTop: 8 }}>
                <p
                  style={{
                    fontFamily: V1.displayFont,
                    fontStyle: 'italic',
                    fontSize: V1.textBodySm,
                    color: V1.textSecondary,
                    margin: '0 0 12px',
                    lineHeight: 1.55,
                    paddingLeft: 14,
                    borderLeft: `1px solid ${V1.teal300}`,
                  }}
                >
                  The CPI readout is sharp, and the Q3 board is five weeks out. A
                  60-minute debrief with Sarah now — before the narrative solidifies
                  — would change how this lands.
                </p>
                <Link
                  to="/debrief/book"
                  className="v1-btn v1-btn-primary"
                  style={{
                    padding: '8px 14px',
                    minHeight: 36,
                    fontSize: 12,
                    background: V1.fuchsia600,
                    borderColor: V1.fuchsia600,
                  }}
                >
                  Book Sarah · 60 min <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>

            {/* 4. Confidentiality */}
            <div className="v1-sidebar-section">
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    color: V1.teal600,
                    marginTop: 1,
                    flexShrink: 0,
                    fontSize: 14,
                    lineHeight: 1,
                  }}
                >
                  ◆
                </span>
                <p
                  style={{
                    fontFamily: V1.bodyFont,
                    fontSize: 12,
                    color: V1.textMuted,
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  All sessions are covered by a two-way coaching confidentiality
                  agreement. Session notes are stored end-to-end encrypted. Nothing
                  is shared with LYC without your explicit written consent.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════

function PackageCard({
  pkg,
  selected,
  first,
  onSelect,
}: {
  pkg: CoachingPackage;
  selected: boolean;
  first: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      style={{
        position: 'relative',
        padding: '28px 24px 24px',
        borderLeft: !first ? `1px solid ${V1.border}` : undefined,
        background: selected ? `${V1.teal50}40` : 'transparent',
        border: selected ? `1px solid ${pkg.recommended ? V1.fuchsia600 : V1.teal600}` : undefined,
        margin: selected ? -1 : 0,
        cursor: 'pointer',
        transition: `border-color ${V1.durNormal}ms ${V1.ease}, background ${V1.durNormal}ms ${V1.ease}`,
      }}
      className="v1-card-hover"
    >
      {/* Recommended badge (fuchsia, top-right) */}
      {pkg.recommended && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: V1.fuchsia600,
            color: V1.white,
            padding: '5px 12px',
            fontFamily: V1.monoFont,
            fontSize: 10,
            letterSpacing: V1.trackingMono,
            textTransform: 'uppercase',
            lineHeight: 1.2,
          }}
        >
          Recommended
        </div>
      )}

      {/* Tier name */}
      <div
        className="v1-mono"
        style={{
          fontSize: 11.2,
          letterSpacing: V1.trackingMono,
          textTransform: 'uppercase',
          color: pkg.recommended ? V1.fuchsia600 : V1.textMuted,
          marginBottom: 10,
        }}
      >
        {pkg.name}
      </div>

      {/* Price */}
      <div style={{ marginBottom: 4 }}>
        <span
          style={{
            fontFamily: V1.displayFont,
            fontSize: 36,
            color: V1.text,
            lineHeight: 1.05,
            fontWeight: V1.fwRegular,
          }}
        >
          {formatPrice(pkg.price)}
        </span>
        <span
          style={{
            fontFamily: V1.bodyFont,
            fontSize: V1.textBodySm,
            color: V1.textSecondary,
            marginLeft: 4,
          }}
        >
          · {pkg.hours} hrs
        </span>
      </div>

      {/* Per-hour rate */}
      <div
        className="v1-mono"
        style={{
          fontSize: 11.2,
          letterSpacing: V1.trackingMono,
          textTransform: 'uppercase',
          color: V1.textMuted,
          marginBottom: 16,
        }}
      >
        {formatPrice(pkg.perHour)}/hr
      </div>

      {/* Description */}
      <p
        style={{
          fontFamily: V1.bodyFont,
          fontSize: V1.textBodySm,
          color: V1.textSecondary,
          margin: '0 0 16px',
          lineHeight: V1.leadingBody,
        }}
      >
        {pkg.description}
      </p>

      {/* Feature list (dash bullets) */}
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: '0 0 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {pkg.features.map((f) => (
          <li
            key={f}
            style={{
              fontFamily: V1.bodyFont,
              fontSize: V1.textBodySm,
              color: V1.textSecondary,
              display: 'flex',
              gap: 8,
              lineHeight: 1.4,
            }}
          >
            <span aria-hidden="true" style={{ color: V1.teal600, flexShrink: 0 }}>
              —
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        className={
          pkg.recommended
            ? 'v1-btn v1-btn-primary'
            : 'v1-btn v1-btn-secondary'
        }
        style={{
          width: '100%',
          background: pkg.recommended ? V1.fuchsia600 : undefined,
          borderColor: pkg.recommended ? V1.fuchsia600 : undefined,
          fontSize: 13,
          minHeight: 40,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        {pkg.ctaLabel} <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}

function CoachCard({
  coach,
  top,
  left,
  onBook,
}: {
  coach: Coach;
  top: boolean;
  left: boolean;
  onBook: () => void;
}) {
  return (
    <div
      style={{
        padding: 22,
        borderRight: left ? `1px solid ${V1.borderSubtle}` : undefined,
        borderBottom: !top ? undefined : `1px solid ${V1.borderSubtle}`,
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
        transition: `background ${V1.durFast}ms ${V1.ease}`,
      }}
      className="v1-card-hover"
      onMouseEnter={(e) => (e.currentTarget.style.background = V1.surfaceAlt)}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Avatar (initials, square) */}
      <div
        aria-hidden="true"
        style={{
          flexShrink: 0,
          width: 56,
          height: 56,
          background: V1.teal900,
          color: V1.white,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: V1.displayFont,
          fontSize: 22,
          fontWeight: V1.fwSemibold,
          letterSpacing: 0.5,
        }}
      >
        {coach.initials}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name + title */}
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              fontFamily: V1.displayFont,
              fontSize: 19,
              color: V1.text,
              lineHeight: 1.25,
              marginBottom: 2,
            }}
          >
            {coach.name}
          </div>
          <div
            className="v1-mono"
            style={{
              fontSize: 10.5,
              letterSpacing: V1.trackingMono,
              textTransform: 'uppercase',
              color: V1.textMuted,
            }}
          >
            {coach.title}
          </div>
        </div>

        {/* Focus description */}
        <p
          style={{
            fontFamily: V1.bodyFont,
            fontSize: V1.textBodySm,
            color: V1.textSecondary,
            margin: '0 0 12px',
            lineHeight: V1.leadingBody,
          }}
        >
          {coach.focus}
        </p>

        {/* Tags (teal) */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginBottom: 12,
          }}
        >
          {coach.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontFamily: V1.monoFont,
                fontSize: 10.5,
                textTransform: 'uppercase',
                letterSpacing: V1.trackingMono,
                padding: '3px 8px',
                background: V1.teal600,
                color: V1.white,
                lineHeight: 1.2,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Book link */}
        <Link
          to="/debrief/book"
          onClick={(e) => {
            e.preventDefault();
            onBook();
          }}
          style={{
            fontFamily: V1.bodyFont,
            fontSize: V1.textBodySm,
            color: V1.teal700,
            textDecoration: 'none',
            fontWeight: V1.fwMedium,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          Book a session <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
