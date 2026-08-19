/**
 * V4.1 — MILESTONES DASHBOARD
 *
 * Route: /nexus/milestones (replaces /dashboard)
 *
 * 3-column app shell (V1 line-art system):
 *   LEFT (220)  — Workspace / Depth / Human Layer nav groups (Milestones active)
 *   MAIN        — Page header, stats row (3 bordered cells), Active milestone
 *                 timeline, Completed timeline, Queued/Upcoming numbered list
 *   RIGHT (280) — Focus this week, Active lenses, What we're noticing,
 *                 Coaching hours
 *
 * This is 100% presentation layer — milestone logic/engine, creation system,
 * and data model are preserved verbatim. Only new rendering surface.
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

// ── Mock data — V4 is presentation layer; backend will wire to existing
//    milestone engine. These shapes match the existing MandateMilestones /
//    NEXUS memory goal types. ──
interface MilestoneItem {
  id: string;
  name: string;
  date: string;
  description?: string; // queued milestones present as heading + origin only
  tags: string[];
  progress: number; // 0–100
  status: 'active' | 'completed' | 'queued';
  completedDate?: string;
  lensSource?: string;
  origin?: string; // e.g. "from restructure conversation"
}

const ACTIVE_MILESTONES: MilestoneItem[] = [
  {
    id: 'm1',
    name: 'Clarify cross-border reporting structure',
    date: 'Jun 14, 2026',
    description:
      'Resolve the dual-line dilemma for the Singapore team. The PRISM readout surfaced this as the #1 drag on influence perception.',
    tags: ['PRISM', 'from cross-border thread'],
    progress: 65,
    status: 'active',
  },
  {
    id: 'm2',
    name: 'Position GM successor profile',
    date: 'Jul 3, 2026',
    description:
      'Write the successor brief so the board sees it before Q3 review. CPI flagged the pipeline gap as structural, not individual.',
    tags: ['CPI', 'from board prep'],
    progress: 35,
    status: 'active',
  },
  {
    id: 'm3',
    name: 'Strengthen board-level influence',
    date: 'Aug 1, 2026',
    description:
      'Three-part plan: pre-read framing, meeting cadence, and the one-question test. IMPACT readout gives the dimension scores.',
    tags: ['IMPACT', 'from Q3 prep conversation'],
    progress: 12,
    status: 'active',
  },
];

const COMPLETED_MILESTONES: MilestoneItem[] = [
  {
    id: 'c1',
    name: 'Land the Shanghai re-org announcement',
    date: 'Mar 22, 2026',
    description:
      'Message the two-chair structure without dropping names. Two rehearsals with NEXUS, one with Sarah. Delivered clean.',
    tags: ['MOSAIC'],
    progress: 100,
    status: 'completed',
    completedDate: 'Apr 8, 2026',
  },
  {
    id: 'c2',
    name: 'Build the 90-day narrative',
    date: 'Feb 1, 2026',
    description:
      'First 30: listen. Second 30: frame. Third 30: move. The thread became the onboarding script.',
    tags: ['from onboarding session'],
    progress: 100,
    status: 'completed',
    completedDate: 'Feb 14, 2026',
  },
  {
    id: 'c3',
    name: 'Run PRISM baseline',
    date: 'Jan 15, 2026',
    description:
      'Establish the baseline readout. Perception vs intent gap on Stakeholder Influence = 22 pts.',
    tags: ['PRISM', 'entry lens'],
    progress: 100,
    status: 'completed',
    completedDate: 'Jan 22, 2026',
  },
  {
    id: 'c4',
    name: 'Set up working context',
    date: 'Apr 3, 2026',
    description: 'Working context, geography, and what good looks like on a bad day.',
    tags: ['from Day 1 conversation'],
    progress: 100,
    status: 'completed',
    completedDate: 'Apr 4, 2026',
  },
];

const QUEUED_MILESTONES: MilestoneItem[] = [
  {
    id: 'q1',
    name: 'Rewrite the executive bio',
    date: 'Sep 12, 2026',
    tags: [],
    progress: 0,
    status: 'queued',
    origin: 'from LinkedIn conversation',
  },
  {
    id: 'q2',
    name: 'Run SPARK — AI leadership readiness',
    date: 'TBD',
    tags: [],
    progress: 0,
    status: 'queued',
    origin: 'coach recommended',
  },
  {
    id: 'q3',
    name: 'Q3 board prep — one-page narrative',
    date: 'Sep 1, 2026',
    tags: [],
    progress: 0,
    status: 'queued',
    origin: 'from restructure conversation',
  },
  {
    id: 'q4',
    name: 'Team offsite — themes & structure',
    date: 'Oct 18, 2026',
    tags: [],
    progress: 0,
    status: 'queued',
    origin: 'from team velocity thread',
  },
];

const ACTIVE_LENSES = [
  { name: 'PRISM', status: 'Active', code: 'prism' },
  { name: 'CPI', status: 'Active', code: 'cpi' },
  { name: 'IMPACT', status: 'Queued', code: 'impact' },
  { name: 'BRIDGE', status: 'Dormant', code: 'bridge' },
];

const INSIGHTS = [
  'You move fastest when a milestone has a named date. Queued items without dates sit for an average of 18 days.',
  'When you book a coaching session within 72 hours of a lens readout, milestone completion climbs 34%.',
  'The influence dimension is the gap that keeps surfacing. Worth naming directly in your next session.',
];

// ── Helpers ──
function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function formatLongDate(d: Date) {
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function MilestonesDashboardPage() {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  const now = useMemo(() => new Date(), []);
  const lastUpdated = useMemo(() => formatLongDate(now), [now]);

  // ── Stats ──
  const activeCount = ACTIVE_MILESTONES.length;
  const queuedCount = QUEUED_MILESTONES.length;
  const inMotion = activeCount + queuedCount;
  const completedCount = COMPLETED_MILESTONES.length;
  const thisWeek = 2;

  return (
    <div className="v1-scope" style={{ minHeight: '100vh', background: V1.bg }}>
      <SEO page="nexus" />
      <style>{`
        /* ── V4 page transitions: fade + 4px Y shift, 0.2s ease ── */
        @keyframes ms-reveal { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .ms-enter { animation: ms-reveal ${REVEAL_MS}ms ${EASE_OUT} both; }
        .ms-enter-d1 { animation: ms-reveal ${REVEAL_MS}ms ${EASE_OUT} 80ms both; }
        .ms-enter-d2 { animation: ms-reveal ${REVEAL_MS}ms ${EASE_OUT} 160ms both; }
        /* ── Progress bar fill: simple width grow ── */
        @keyframes ms-fill { from { width: 0%; } }
        .ms-progress-fill { animation: ms-fill 500ms ${EASE_OUT} both; }
        /* ── Milestone badge slide-in ── */
        @keyframes ms-slide-in { from { transform: translateX(-6px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .ms-badge-slide { animation: ms-slide-in 300ms ${EASE_OUT} both; }
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

      {/* ══════════ NAV (fixed, translucent cream) ══════════ */}
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
              <Link to="/nexus/milestones" className="v1-sidebar-link v1-active">Milestones</Link>
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
              <Link to="/nexus/coaching" className="v1-sidebar-link">Coaching hours</Link>
              <Link to="/app/bookings" className="v1-sidebar-link">Upcoming sessions</Link>
            </div>
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Account</div>
              <Link to="/nexus/settings" className="v1-sidebar-link v1-active">Settings</Link>
              <Link to="/app/billing" className="v1-sidebar-link">Billing</Link>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="v1-appshell-main" id="main-content" tabIndex={-1}>
          <div style={{ padding: V1.shellPad, maxWidth: V1.contentMax, width: '100%' }}>
            {/* ═══ Page header ═══ */}
            <div className="ms-enter" style={{ marginBottom: V1.shellPad }}>
              <div className="v1-eyebrow" style={{ marginBottom: 8 }}>Your progress</div>
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
                What you're moving forward.
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
                Things you said mattered. NEXUS tracks them so you don't have to —
                and surfaces what to move next.
              </p>
            </div>

            {/* ═══ Stats row: 3 bordered cells ═══ */}
            <div
              className="ms-enter"
              role="group"
              aria-label="Milestone summary statistics"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                border: `1px solid ${V1.border}`,
                marginBottom: V1.shellPad,
              }}
            >
              <StatCell
                label="In motion"
                value={String(inMotion)}
                sub={`${activeCount} active · ${queuedCount} queued`}
              />
              <div style={{ borderLeft: `1px solid ${V1.border}` }}>
                <StatCell
                  label="Completed"
                  value={String(completedCount)}
                  sub="since April 2026"
                />
              </div>
              <div style={{ borderLeft: `1px solid ${V1.border}` }}>
                <StatCell
                  label="This week"
                  value={String(thisWeek)}
                  sub="updates from conversation"
                />
              </div>
            </div>

            {/* ═══ Active milestones section ═══ */}
            <section
              className="ms-enter"
              aria-label="Active milestones"
              style={{ marginBottom: V1.shellPad }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 20,
                }}
              >
                <h2
                  className="v1-display"
                  style={{
                    fontSize: V1.textH3,
                    margin: 0,
                    fontFamily: V1.displayFont,
                    color: V1.text,
                    fontWeight: V1.fwRegular,
                  }}
                >
                  Active
                </h2>
                <span
                  className="v1-mono"
                  style={{
                    color: V1.textMuted,
                    fontSize: 11.2,
                    textTransform: 'uppercase',
                    letterSpacing: V1.trackingMono,
                  }}
                >
                  Last updated {lastUpdated}
                </span>
              </div>

              <div className="v1-timeline" style={{ paddingLeft: 28 }}>
                {ACTIVE_MILESTONES.map((m, i) => (
                  <MilestoneTimelineRow key={m.id} milestone={m} index={i} variant="active" />
                ))}
              </div>
            </section>

            <hr className="v1-rule v1-rule-bleed" style={{ margin: `${V1.shellPad}px 0` }} />

            {/* ═══ Completed milestones section ═══ */}
            <section
              className="ms-enter"
              aria-label="Completed milestones"
              style={{ marginBottom: V1.shellPad }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 20,
                }}
              >
                <h2
                  className="v1-display"
                  style={{
                    fontSize: V1.textH3,
                    margin: 0,
                    fontFamily: V1.displayFont,
                    color: V1.text,
                    fontWeight: V1.fwRegular,
                  }}
                >
                  Completed
                </h2>
                <span
                  className="v1-mono"
                  style={{
                    color: V1.textMuted,
                    fontSize: 11.2,
                    textTransform: 'uppercase',
                    letterSpacing: V1.trackingMono,
                  }}
                >
                  {COMPLETED_MILESTONES.length} items
                </span>
              </div>

              <div className="v1-timeline" style={{ paddingLeft: 28 }}>
                {COMPLETED_MILESTONES.map((m, i) => (
                  <MilestoneTimelineRow key={m.id} milestone={m} index={i} variant="completed" />
                ))}
              </div>
            </section>

            <hr className="v1-rule v1-rule-bleed" style={{ margin: `${V1.shellPad}px 0` }} />

            {/* ═══ Queued / Upcoming section ═══ */}
            <section className="ms-enter" aria-label="Queued milestones">
              <div style={{ marginBottom: 20 }}>
                <h2
                  className="v1-display"
                  style={{
                    fontSize: V1.textH3,
                    margin: 0,
                    fontFamily: V1.displayFont,
                    color: V1.text,
                    fontWeight: V1.fwRegular,
                  }}
                >
                  Upcoming
                </h2>
              </div>

              <div style={{ border: `1px solid ${V1.border}` }}>
                {QUEUED_MILESTONES.map((m, i) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      padding: '18px 20px',
                      borderBottom:
                        i < QUEUED_MILESTONES.length - 1
                          ? `1px solid ${V1.borderSubtle}`
                          : undefined,
                      gap: 16,
                      cursor: 'pointer',
                      transition: `background ${V1.durFast}ms ${V1.ease}`,
                    }}
                    className="v1-card-hover"
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = V1.surfaceAlt)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                    onClick={() => {}}
                  >
                    <span
                      className="v1-mono"
                      style={{
                        fontFamily: V1.monoFont,
                        fontSize: 13,
                        color: V1.textMuted,
                        letterSpacing: V1.trackingMono,
                        flexShrink: 0,
                        paddingTop: 1,
                      }}
                    >
                      {pad2(i + 1)}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          gap: 12,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: V1.displayFont,
                            fontSize: 17,
                            color: V1.text,
                            lineHeight: 1.3,
                          }}
                        >
                          {m.name}
                        </span>
                        <span
                          aria-hidden="true"
                          style={{
                            color: V1.textDim,
                            fontFamily: V1.bodyFont,
                            fontSize: 14,
                            flexShrink: 0,
                          }}
                        >
                          →
                        </span>
                      </div>
                      <div
                        className="v1-mono"
                        style={{
                          marginTop: 4,
                          fontSize: 11.2,
                          color: V1.textMuted,
                          textTransform: 'uppercase',
                          letterSpacing: V1.trackingMono,
                        }}
                      >
                        {m.date} · {m.origin}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>

        {/* ── RIGHT RAIL ── */}
        <aside className="v1-appshell-col" aria-label="Milestones context panel">
          <div className="v1-sidebar-sticky">
            {/* 1. Focus this week */}
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Focus this week</div>
              <div
                className="v1-card v1-card-focus ms-enter"
                style={{ padding: 18, marginTop: 8 }}
              >
                <div
                  className="v1-mono"
                  style={{
                    color: V1.teal700,
                    fontSize: 11.2,
                    textTransform: 'uppercase',
                    letterSpacing: V1.trackingMono,
                    marginBottom: 8,
                  }}
                >
                  Primary milestone
                </div>
                <div
                  style={{
                    fontFamily: V1.displayFont,
                    fontSize: 19,
                    color: V1.text,
                    lineHeight: 1.25,
                    marginBottom: 8,
                  }}
                >
                  Clarify cross-border reporting structure
                </div>
                <p
                  style={{
                    fontFamily: V1.bodyFont,
                    fontSize: V1.textBodySm,
                    color: V1.textSecondary,
                    margin: '0 0 14px',
                    lineHeight: V1.leadingBody,
                  }}
                >
                  Resolve the dual-line dilemma for the Singapore team before the
                  Jun 14 checkpoint.
                </p>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontFamily: V1.displayFont,
                      fontSize: 22,
                      color: V1.fuchsia600,
                      fontWeight: V1.fwBold,
                    }}
                  >
                    65%
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
                    Complete
                  </span>
                </div>
                <div className="v1-progress">
                  <div
                    className="v1-progress-fill ms-progress-fill"
                    style={{
                      width: '65%',
                      background: V1.fuchsia600,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 2. Active lenses */}
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Active lenses</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                {ACTIVE_LENSES.map((lens) => (
                  <div
                    key={lens.code}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        className={
                          'v1-status-dot ' +
                          (lens.status === 'Active'
                            ? 'v1-status-dot-teal'
                            : lens.status === 'Queued'
                            ? 'v1-status-dot-fuchsia'
                            : 'v1-status-dot-default')
                        }
                      />
                      <span
                        style={{
                          fontFamily: V1.bodyFont,
                          fontSize: V1.textBodySm,
                          color: V1.text,
                          fontWeight:
                            lens.status === 'Active' ? V1.fwMedium : V1.fwRegular,
                        }}
                      >
                        {lens.name}
                      </span>
                    </div>
                    <span
                      className="v1-mono"
                      style={{
                        fontSize: 10.5,
                        letterSpacing: V1.trackingMono,
                        textTransform: 'uppercase',
                        color:
                          lens.status === 'Active'
                            ? V1.teal700
                            : lens.status === 'Queued'
                            ? V1.fuchsia600
                            : V1.textDim,
                      }}
                    >
                      {lens.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. What we're noticing */}
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">What we're noticing</div>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '8px 0 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {INSIGHTS.map((insight, i) => (
                  <li
                    key={i}
                    style={{
                      fontFamily: V1.displayFont,
                      fontStyle: 'italic',
                      fontSize: V1.textBodySm,
                      color: V1.textSecondary,
                      lineHeight: 1.55,
                      paddingLeft: 14,
                      borderLeft: `1px solid ${V1.teal300}`,
                    }}
                  >
                    {insight}
                  </li>
                ))}
              </ul>
            </div>

            {/* 4. Coaching hours */}
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Coaching hours</div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  marginTop: 8,
                }}
              >
                <div
                  className="ms-badge-slide"
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
                    14
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
                    hrs remaining
                  </span>
                </div>
                <div
                  className="v1-mono"
                  style={{
                    fontSize: 11.2,
                    color: V1.textMuted,
                    letterSpacing: V1.trackingMono,
                    textTransform: 'uppercase',
                    marginBottom: 10,
                  }}
                >
                  Silver package · renews Aug 1
                </div>
                <Link
                  to="/nexus/coaching"
                  className="v1-btn v1-btn-secondary"
                  style={{ padding: '8px 14px', minHeight: 36, fontSize: 12 }}
                >
                  Book a session <span aria-hidden="true">→</span>
                </Link>
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

function StatCell({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={{ padding: '20px 22px', textAlign: 'left' }}>
      <div
        className="v1-mono"
        style={{
          fontSize: 11.2,
          letterSpacing: V1.trackingMono,
          textTransform: 'uppercase',
          color: V1.textMuted,
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: V1.displayFont,
          fontSize: 40,
          lineHeight: 1.05,
          color: V1.text,
          fontWeight: V1.fwRegular,
          marginBottom: 4,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: V1.bodyFont,
          fontSize: V1.textBodySm,
          color: V1.textSecondary,
          lineHeight: 1.4,
        }}
      >
        {sub}
      </div>
    </div>
  );
}

function MilestoneTimelineRow({
  milestone,
  index,
  variant,
}: {
  milestone: MilestoneItem;
  index: number;
  variant: 'active' | 'completed';
}) {
  const isCompleted = variant === 'completed';
  const isPrimary = variant === 'active' && index === 0;

  return (
    <div
      className="v1-timeline-item"
      style={{
        paddingBottom: 32,
        animationDelay: `${index * 60}ms`,
      }}
    >
      {/* Marker */}
      <div
        className={
          'v1-timeline-marker ' +
          (isCompleted ? 'v1-completed' : isPrimary ? 'v1-active' : '')
        }
        style={{
          width: isPrimary ? 14 : 12,
          height: isPrimary ? 14 : 12,
          left: isPrimary ? -29 : -28,
          top: 4,
          background: isCompleted ? V1.teal600 : 'transparent',
          border: isPrimary
            ? `2px solid ${V1.fuchsia600}`
            : isCompleted
            ? `2px solid ${V1.teal600}`
            : `2px solid ${V1.ink300}`,
          boxShadow: isPrimary
            ? `0 0 0 3px ${V1.fuchsia50}`
            : undefined,
        }}
      />

      {/* Content */}
      <div style={{ paddingLeft: 4 }}>
        {/* Name + date row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 16,
            marginBottom: 4,
          }}
        >
          <h3
            className="ms-badge-slide"
            style={{
              fontFamily: V1.displayFont,
              fontSize: 19,
              color: V1.text,
              margin: 0,
              fontWeight: isPrimary ? V1.fwSemibold : V1.fwRegular,
              lineHeight: 1.3,
              animationDelay: `${index * 40 + 80}ms`,
            }}
          >
            {milestone.name}
          </h3>
          <span
            className="v1-mono"
            style={{
              fontSize: 11.2,
              letterSpacing: V1.trackingMono,
              textTransform: 'uppercase',
              color: isCompleted ? V1.teal700 : V1.textMuted,
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {milestone.date}
          </span>
        </div>

        {/* Description */}
        <p
          style={{
            fontFamily: V1.bodyFont,
            fontSize: V1.textBodySm,
            color: V1.textSecondary,
            margin: '0 0 10px',
            lineHeight: V1.leadingBody,
          }}
        >
          {milestone.description}
        </p>

        {/* Tags (lens source) */}
        {milestone.tags.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              marginBottom: 12,
            }}
          >
            {milestone.tags.map((tag) => (
              <span
                key={tag}
                className="v1-tag v1-tag-outline"
                style={{
                  fontFamily: V1.monoFont,
                  fontSize: 10.5,
                  textTransform: 'uppercase',
                  letterSpacing: V1.trackingMono,
                  padding: '3px 8px',
                  border: `1px solid ${V1.teal300}`,
                  color: V1.teal700,
                  background: 'transparent',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Completed: "Marked complete [date]" in mono teal */}
        {isCompleted && milestone.completedDate && (
          <div
            className="v1-mono"
            style={{
              fontSize: 11.2,
              letterSpacing: V1.trackingMono,
              textTransform: 'uppercase',
              color: V1.teal700,
              marginBottom: 10,
            }}
          >
            Marked complete {milestone.completedDate}
          </div>
        )}

        {/* Progress bar (2px thin) */}
        {!isCompleted && (
          <div
            style={{
              height: 2,
              background: V1.borderSubtle,
              overflow: 'hidden',
            }}
          >
            <div
              className="ms-progress-fill"
              style={{
                height: '100%',
                width: `${milestone.progress}%`,
                background: isPrimary ? V1.fuchsia600 : V1.teal600,
                animationDelay: `${index * 60 + 120}ms`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
