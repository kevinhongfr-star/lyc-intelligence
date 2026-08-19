/**
 * V4.5.3 — BOOKINGS / SESSIONS PAGE
 *
 * Route: /app/bookings (inside LeaderPortalLayout auth guard, but renders
 * its own V1 3-column app shell — same pattern as V4 milestones/documents).
 *
 * 3-column app shell (V1 line-art system):
 *   LEFT (220)  — Workspace / Depth / Human Layer nav groups
 *                 (Bookings active under Human Layer)
 *   MAIN        — Page header, Upcoming sessions section (bordered cards),
 *                 Past sessions section (muted bordered cards)
 *   RIGHT (280) — Coaching hours balance (big serif number + 2px bar),
 *                 "Book a session →" CTA (fuchsia), Cancellation policy
 *
 * All booking logic, calendar, reschedule/cancel placeholders, session
 * catalog, coach roster, and status labels preserved verbatim. Only the
 * rendering surface changes (V1 tokens, mono labels, serif display, text
 * symbols, 0px radius, no shadows, stacked sections not tabs).
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  SESSION_CATALOG,
  type SessionType,
  COACH_ROSTER,
  type CoachRosterEntry,
  type BookingStatus,
  CANCELLATION_FREE_HOURS_BEFORE,
} from '@/config/sessions';
import { SEO } from '@/components/seo/SEO';
import { SkipToContent } from '@/components/a11y/SkipToContent';
import { useAuthStore } from '@/stores/authStore';
import { V1 } from '@/styles/v1-tokens';

interface MockBookingItem {
  id: string;
  sessionSlug: string;
  coachId: string;
  dateIso: string;
  timeSlot: string;
  durationMinutes: number;
  status: BookingStatus;
  notesPlaceholder?: string;
}

const MOCK_UPCOMING: MockBookingItem[] = [
  {
    id: 'BK-ABC123',
    sessionSlug: 'career-30',
    coachId: 'coach_1',
    dateIso: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    timeSlot: '10:00',
    durationMinutes: 30,
    status: 'scheduled',
  },
  {
    id: 'BK-DEF456',
    sessionSlug: 'executive-45',
    coachId: 'coach_2',
    dateIso: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    timeSlot: '14:30',
    durationMinutes: 45,
    status: 'scheduled',
  },
  {
    id: 'BK-GHI789',
    sessionSlug: 'leadership-60',
    coachId: 'coach_3',
    dateIso: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    timeSlot: '11:00',
    durationMinutes: 60,
    status: 'rescheduled',
  },
];

const MOCK_PAST: MockBookingItem[] = [
  {
    id: 'BK-PAST001',
    sessionSlug: 'career-30',
    coachId: 'coach_1',
    dateIso: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    timeSlot: '15:00',
    durationMinutes: 30,
    status: 'completed',
    notesPlaceholder:
      '[Session notes placeholder — post-debrief summary, action items, and coach recommendations will appear here.]',
  },
  {
    id: 'BK-PAST002',
    sessionSlug: 'leadership-60',
    coachId: 'coach_3',
    dateIso: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    timeSlot: '09:30',
    durationMinutes: 60,
    status: 'cancelled',
  },
];

function getSession(slug: string): SessionType {
  return (
    SESSION_CATALOG.find((s) => s.slug === slug) ??
    SESSION_CATALOG[0]
  );
}

function getCoach(id: string): CoachRosterEntry {
  return COACH_ROSTER.find((c) => c.id === id) ?? COACH_ROSTER[0];
}

function formatDateLong(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime12h(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

// V1 status treatment: mono text label + small leading dot. Editorial,
// not color-coded bg. Dot color hints severity (teal = ok, fuchsia =
// changed, ink = cancelled/no-show).
const STATUS_LABELS: Record<BookingStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rescheduled: 'Rescheduled',
  no_show: 'No-show',
};

function statusDotColor(status: BookingStatus): string {
  switch (status) {
    case 'scheduled': return V1.teal600;
    case 'completed': return V1.teal700;
    case 'rescheduled': return V1.fuchsia600;
    case 'cancelled': return V1.ink400;
    case 'no_show': return V1.ink500;
    default: return V1.ink400;
  }
}

// Right-rail: coaching hours balance (presentation-layer numbers; backend
// billing model preserved by HumanDepthPage + AccountSettingsPage).
const COACHING_HOURS_REMAINING = 14;
const COACHING_HOURS_TOTAL = 20;

export function MyBookingsPage() {
  const { user, profile } = useAuthStore();
  const upcomingList = MOCK_UPCOMING;
  const pastList = MOCK_PAST;

  const upcomingRange = formatRangeLabel(MOCK_UPCOMING.map((b) => new Date(b.dateIso)));

  const hoursUsedPct =
    COACHING_HOURS_TOTAL > 0
      ? Math.min(100, ((COACHING_HOURS_TOTAL - COACHING_HOURS_REMAINING) / COACHING_HOURS_TOTAL) * 100)
      : 0;

  return (
    <div className="v1-scope" style={{ minHeight: '100vh', background: V1.bg }}>
      <SEO page="bookings" />
      <style>{`
        @keyframes bk-reveal { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .bk-enter { animation: bk-reveal ${V1.durNormal}ms ${V1.ease} both; }
        .bk-enter-d1 { animation: bk-reveal ${V1.durNormal}ms ${V1.ease} 80ms both; }
        .bk-enter-d2 { animation: bk-reveal ${V1.durNormal}ms ${V1.ease} 160ms both; }
        .v1-scope :focus-visible {
          outline: 2px solid ${V1.teal600} !important;
          outline-offset: 2px;
          border-radius: 0;
        }
        .v1-scope .v1-card-hover {
          transition: border-color ${V1.durFast}ms ${V1.ease};
        }
        .v1-scope .v1-card-hover:hover {
          border-color: ${V1.teal600};
        }
        @media (max-width: 768px) {
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
              <Link to="/nexus/milestones" className="v1-sidebar-link">Milestones</Link>
              <Link to="/nexus/insights" className="v1-sidebar-link">Insights</Link>
              <Link to="/app/documents" className="v1-sidebar-link">Documents</Link>
              <Link to="/nexus/settings" className="v1-sidebar-link">Settings</Link>
            </div>
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Depth</div>
              {['Positioning', 'Influence', 'Transition', 'Enterprise China'].map((area) => (
                <Link to="/nexus/lenses" key={area} className="v1-sidebar-link">
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
              <Link to="/app/bookings" className="v1-sidebar-link v1-active">Bookings</Link>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="v1-appshell-main" id="main-content" tabIndex={-1}>
          <div style={{ padding: V1.shellPad, maxWidth: V1.contentMax, width: '100%' }}>
            {/* ═══ Page header ═══ */}
            <div className="bk-enter" style={{ marginBottom: V1.shellPad }}>
              <div className="v1-eyebrow" style={{ marginBottom: 8 }}>Human layer</div>
              <h1 className="v1-display" style={{
                fontFamily: V1.displayFont, fontSize: V1.textH1,
                margin: '0 0 10px', letterSpacing: V1.trackingTight,
                lineHeight: V1.leadingDisplay, color: V1.text,
                fontWeight: V1.fwRegular,
              }}>
                Your sessions.
              </h1>
              <p style={{
                fontFamily: V1.bodyFont, fontSize: V1.textBodyLg,
                color: V1.textSecondary, margin: 0, lineHeight: V1.leadingBody,
                maxWidth: 560,
              }}>
                Upcoming and past debrief sessions with your coaching roster.
              </p>
            </div>

            {/* ═══ Upcoming section ═══ */}
            <section className="bk-enter bk-enter-d1" style={{ marginBottom: V1.shellPad }} aria-label="Upcoming sessions">
              <SectionLabel
                label="Upcoming"
                meta={upcomingRange}
              />
              {upcomingList.length === 0 ? (
                <EmptySessions
                  title="No upcoming sessions."
                  body="Book a debrief session to put your readout into motion."
                  ctaLabel="Book a session"
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {upcomingList.map((b) => (
                    <UpcomingBookingCard key={b.id} booking={b} />
                  ))}
                </div>
              )}
            </section>

            {/* ═══ Past section ═══ */}
            <section className="bk-enter bk-enter-d2" aria-label="Past sessions">
              <SectionLabel label="Past" meta={`${pastList.length} sessions`} />
              {pastList.length === 0 ? (
                <EmptySessions
                  title="No past sessions."
                  body="Completed and cancelled sessions will appear here."
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pastList.map((b) => (
                    <PastBookingCard key={b.id} booking={b} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>

        {/* ── RIGHT RAIL ── */}
        <aside className="v1-appshell-col" aria-label="Bookings context">
          <div className="v1-sidebar-sticky">
            {/* 1. Coaching hours balance */}
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Coaching hours</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{
                    fontFamily: V1.displayFont, fontSize: 40,
                    color: V1.text, lineHeight: 1, fontWeight: V1.fwRegular,
                  }}>
                    {COACHING_HOURS_REMAINING}
                  </span>
                  <span className="v1-mono" style={{
                    fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
                    textTransform: 'uppercase', color: V1.textMuted,
                  }}>
                    of {COACHING_HOURS_TOTAL} hrs remaining
                  </span>
                </div>
                {/* 2px progress bar (used portion) */}
                <div style={{ height: 2, background: V1.borderSubtle, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${hoursUsedPct}%`,
                    background: V1.teal600,
                  }} />
                </div>
                <div className="v1-mono" style={{
                  fontSize: V1.textCaption, color: V1.textDim,
                  letterSpacing: V1.trackingMono,
                }}>
                  Silver package · renews Aug 1
                </div>
              </div>
            </div>

            {/* 2. Book a session CTA (fuchsia) */}
            <div className="v1-sidebar-section">
              <Link
                to="/nexus/coaching"
                className="v1-btn"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '14px 20px',
                  background: V1.fuchsia600, color: V1.white,
                  border: 'none', fontSize: 15, fontWeight: V1.fwSemibold,
                  fontFamily: V1.bodyFont, textDecoration: 'none',
                  minHeight: 48, cursor: 'pointer',
                  transition: `background ${V1.durFast}ms ${V1.ease}`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = V1.fuchsia700)}
                onMouseLeave={(e) => (e.currentTarget.style.background = V1.fuchsia600)}
              >
                Book a session <span aria-hidden="true">→</span>
              </Link>
            </div>

            {/* 3. Cancellation policy */}
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Cancellation policy</div>
              <p style={{
                fontFamily: V1.bodyFont, fontSize: V1.textCaption,
                color: V1.textSecondary, lineHeight: 1.55, margin: '8px 0 0',
              }}>
                Free to reschedule or cancel up to{' '}
                <span className="v1-mono" style={{
                  letterSpacing: V1.trackingMono,
                  color: V1.text,
                }}>
                  {CANCELLATION_FREE_HOURS_BEFORE} hours
                </span>{' '}
                before your session. Within the window a 50% fee applies.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Helpers + sub-components
// ═══════════════════════════════════════════════════════════════════════

function formatRangeLabel(dates: Date[]): string {
  if (dates.length === 0) return 'no sessions';
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const first = formatDateShort(sorted[0]);
  const last = formatDateShort(sorted[sorted.length - 1]);
  if (first === last) return first;
  return `${first} – ${last}`;
}

function SectionLabel({ label, meta }: { label: string; meta?: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      marginBottom: 16,
    }}>
      <h2 className="v1-display" style={{
        fontFamily: V1.displayFont, fontSize: V1.textH3,
        margin: 0, color: V1.text, fontWeight: V1.fwRegular,
      }}>
        {label}
      </h2>
      {meta && (
        <span className="v1-mono" style={{
          fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
          textTransform: 'uppercase', color: V1.textMuted,
        }}>
          {meta}
        </span>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const dot = statusDotColor(status);
  return (
    <span className="v1-mono" style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
      textTransform: 'uppercase', color: V1.textSecondary,
    }}>
      <span aria-hidden="true" style={{
        width: 6, height: 6, background: dot, display: 'inline-block',
      }} />
      {STATUS_LABELS[status]}
    </span>
  );
}

function DateBlock({ date, muted }: { date: Date; muted?: boolean }) {
  return (
    <div aria-hidden="true" style={{
      width: 56, height: 56, flexShrink: 0,
      background: V1.bg, border: `1px solid ${V1.borderStrong}`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      opacity: muted ? 0.6 : 1,
    }}>
      <span className="v1-mono" style={{
        fontSize: 10, textTransform: 'uppercase', color: V1.textMuted,
        letterSpacing: V1.trackingMono,
      }}>
        {date.toLocaleDateString('en-US', { month: 'short' })}
      </span>
      <span style={{
        fontFamily: V1.displayFont, fontSize: 22,
        color: muted ? V1.textMuted : V1.text,
        lineHeight: 1, fontWeight: V1.fwRegular,
      }}>
        {date.getDate()}
      </span>
    </div>
  );
}

function CoachChip({ coach }: { coach: CoachRosterEntry }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 24, height: 24, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${V1.borderStrong}`,
        background: V1.bg,
        fontFamily: V1.monoFont, fontSize: 10,
        fontWeight: V1.fwSemibold, color: V1.text,
      }} aria-hidden="true">
        {coach.avatarInitials}
      </div>
      <span className="v1-mono" style={{
        fontSize: V1.textCaption, color: V1.textMuted,
        letterSpacing: V1.trackingMono,
      }}>
        with {coach.name}
      </span>
    </div>
  );
}

function UpcomingBookingCard({ booking }: { booking: MockBookingItem }) {
  const session = getSession(booking.sessionSlug);
  const coach = getCoach(booking.coachId);
  const date = new Date(booking.dateIso);
  const now = new Date();
  const hoursDiff = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
  const canCancelFree = hoursDiff >= CANCELLATION_FREE_HOURS_BEFORE;

  return (
    <div className="v1-card-hover" style={{
      border: `1px solid ${V1.border}`,
      padding: 20, background: V1.surface,
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, minWidth: 0 }}>
          <DateBlock date={date} />
          <div style={{ minWidth: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 6, flexWrap: 'wrap',
            }}>
              <h3 className="v1-display" style={{
                fontFamily: V1.displayFont, fontSize: 19,
                color: V1.text, margin: 0, fontWeight: V1.fwRegular,
                lineHeight: 1.3,
              }}>
                {session.displayName}
              </h3>
              <StatusBadge status={booking.status} />
            </div>
            <div className="v1-mono" style={{
              fontSize: V1.textCaption, color: V1.textSecondary,
              letterSpacing: V1.trackingMono, marginBottom: 8,
              textTransform: 'uppercase',
            }}>
              {formatDateLong(date)} · {formatTime12h(booking.timeSlot)} · {booking.durationMinutes} min
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <CoachChip coach={coach} />
              <span style={{ color: V1.border, fontSize: 10 }}>·</span>
              <span className="v1-mono" style={{
                fontSize: V1.textCaption, color: V1.textMuted,
                letterSpacing: V1.trackingMono,
              }}>
                #{booking.id}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap',
        paddingTop: 12, borderTop: `1px solid ${V1.dividerSubtle}`,
      }}>
        <ActionButton
          label="Reschedule"
          variant="secondary"
          onClick={() => alert(`Reschedule ${booking.id} — placeholder`)}
        />
        <ActionButton
          label={canCancelFree ? 'Cancel' : 'Cancel (50% fee)'}
          variant="danger"
          onClick={() => alert(`Cancel ${booking.id} — placeholder`)}
        />
        <ActionButton
          label="Add to calendar"
          variant="outline"
          onClick={() => alert(`Download .ics for ${booking.id} — placeholder`)}
        />
      </div>
    </div>
  );
}

function PastBookingCard({ booking }: { booking: MockBookingItem }) {
  const session = getSession(booking.sessionSlug);
  const coach = getCoach(booking.coachId);
  const date = new Date(booking.dateIso);
  const [showNotes, setShowNotes] = useState(false);
  const isCancelled = booking.status === 'cancelled';

  return (
    <div className="v1-card-hover" style={{
      border: `1px solid ${V1.border}`,
      padding: 20, background: V1.surfaceAlt,
      display: 'flex', flexDirection: 'column', gap: 16,
      opacity: isCancelled ? 0.85 : 1,
    }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, minWidth: 0 }}>
          <DateBlock date={date} muted={isCancelled} />
          <div style={{ minWidth: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 6, flexWrap: 'wrap',
            }}>
              <h3 className="v1-display" style={{
                fontFamily: V1.displayFont, fontSize: 19,
                color: isCancelled ? V1.textMuted : V1.text,
                margin: 0, fontWeight: V1.fwRegular, lineHeight: 1.3,
                textDecoration: isCancelled ? 'line-through' : 'none',
              }}>
                {session.displayName}
              </h3>
              <StatusBadge status={booking.status} />
            </div>
            <div className="v1-mono" style={{
              fontSize: V1.textCaption, color: V1.textMuted,
              letterSpacing: V1.trackingMono, marginBottom: 8,
              textTransform: 'uppercase',
            }}>
              {formatDateShort(date)} · {formatTime12h(booking.timeSlot)} · {booking.durationMinutes} min
            </div>
            <CoachChip coach={coach} />
          </div>
        </div>
      </div>

      {booking.status === 'completed' && booking.notesPlaceholder && (
        <div style={{
          border: `1px solid ${V1.dividerSubtle}`,
          background: V1.surface, overflow: 'hidden',
        }}>
          <button
            onClick={() => setShowNotes((s) => !s)}
            aria-expanded={showNotes}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', padding: '12px 14px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              textAlign: 'left', fontFamily: V1.bodyFont,
              fontSize: V1.textBodySm, fontWeight: V1.fwMedium,
              color: V1.text,
            }}
          >
            <span>Session notes</span>
            <span aria-hidden="true" style={{
              color: V1.textMuted, transition: `transform ${V1.durFast}ms ${V1.ease}`,
              transform: showNotes ? 'rotate(180deg)' : 'rotate(0deg)',
              display: 'inline-block',
            }}>
              ▾
            </span>
          </button>
          {showNotes && (
            <div style={{
              padding: '0 14px 14px',
              borderTop: `1px solid ${V1.dividerSubtle}`,
            }}>
              <p style={{
                fontFamily: V1.bodyFont, fontSize: V1.textBodySm,
                lineHeight: 1.6, color: V1.textSecondary, margin: '12px 0 0',
              }}>
                {booking.notesPlaceholder}
              </p>
            </div>
          )}
        </div>
      )}

      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap',
        paddingTop: 12, borderTop: `1px solid ${V1.dividerSubtle}`,
      }}>
        <ActionButton
          label="Book another"
          variant="primary"
          onClick={() => alert(`Rebook ${session.slug} — open BookingFlow placeholder`)}
        />
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  variant,
}: {
  label: string;
  onClick: () => void;
  variant: 'primary' | 'secondary' | 'outline' | 'danger';
}) {
  const base: React.CSSProperties = {
    fontFamily: V1.bodyFont,
    fontSize: V1.textBodySm,
    fontWeight: V1.fwMedium,
    padding: '8px 14px',
    cursor: 'pointer',
    border: `1px solid`,
    minHeight: 36,
    transition: `background ${V1.durFast}ms ${V1.ease}, color ${V1.durFast}ms ${V1.ease}, border-color ${V1.durFast}ms ${V1.ease}`,
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: V1.teal800, color: V1.white, borderColor: V1.teal800,
    },
    secondary: {
      background: 'transparent', color: V1.text, borderColor: V1.borderStrong,
    },
    outline: {
      background: 'transparent', color: V1.textSecondary, borderColor: V1.borderStrong,
    },
    danger: {
      background: 'transparent', color: V1.fuchsia700, borderColor: V1.fuchsia600,
    },
  };

  const hover: Record<string, React.CSSProperties> = {
    primary:   { background: V1.teal900, borderColor: V1.teal900, color: V1.white },
    secondary: { background: V1.ink50, borderColor: V1.teal600, color: V1.teal800 },
    outline:   { borderColor: V1.teal600, color: V1.teal700 },
    danger:    { background: V1.fuchsia50, borderColor: V1.fuchsia600, color: V1.fuchsia700 },
  };

  return (
    <button
      onClick={onClick}
      style={{ ...base, ...variants[variant] }}
      onMouseEnter={(e) => Object.assign(e.currentTarget.style, hover[variant])}
      onMouseLeave={(e) => Object.assign(e.currentTarget.style, variants[variant])}
    >
      {label}
    </button>
  );
}

function EmptySessions({
  title,
  body,
  ctaLabel,
}: {
  title: string;
  body: string;
  ctaLabel?: string;
}) {
  return (
    <div style={{
      border: `1px dashed ${V1.borderStrong}`, padding: '56px 24px',
      textAlign: 'center', background: V1.surface,
    }}>
      <div aria-hidden="true" style={{
        width: 48, height: 48, margin: '0 auto 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${V1.borderStrong}`,
        color: V1.textMuted, fontFamily: V1.monoFont, fontSize: 18,
      }}>
        ○
      </div>
      <h3 className="v1-display" style={{
        fontFamily: V1.displayFont, fontSize: V1.textH3,
        color: V1.text, fontWeight: V1.fwRegular, margin: '0 0 8px',
      }}>
        {title}
      </h3>
      <p style={{
        fontFamily: V1.bodyFont, fontSize: V1.textBodySm,
        color: V1.textSecondary, margin: '0 auto 20px',
        maxWidth: 420, lineHeight: 1.5,
      }}>
        {body}
      </p>
      {ctaLabel && (
        <Link
          to="/nexus/coaching"
          className="v1-btn v1-btn-primary"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 24px', background: V1.teal800, color: V1.white,
            border: 'none', fontSize: 15, fontWeight: V1.fwSemibold,
            fontFamily: V1.bodyFont, textDecoration: 'none',
            minHeight: 44, cursor: 'pointer',
            transition: `background ${V1.durFast}ms ${V1.ease}`,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = V1.teal900)}
          onMouseLeave={(e) => (e.currentTarget.style.background = V1.teal800)}
        >
          {ctaLabel} <span aria-hidden="true">→</span>
        </Link>
      )}
    </div>
  );
}
