import React, { useState } from 'react';
import {
  SESSION_CATALOG,
  type SessionType,
  COACH_ROSTER,
  type CoachRosterEntry,
  type BookingStatus,
  CANCELLATION_FREE_HOURS_BEFORE,
} from '@/config/sessions';
import { DS } from '@/tokens';

type Tab = 'upcoming' | 'past';

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

const INFO = '#2563EB';
const SUCCESS = '#16A34A';
const WARNING = '#CA8A04';
const ERROR = '#DC2626';
const INK = '#0F1115';

const STATUS_STYLES: Record<BookingStatus, { bg: string; color: string; label: string }> = {
  scheduled:   { bg: `${INFO}12`,    color: INFO,    label: 'Scheduled' },
  completed:   { bg: `${SUCCESS}12`, color: SUCCESS, label: 'Completed' },
  cancelled:   { bg: `${ERROR}12`,   color: ERROR,   label: 'Cancelled' },
  rescheduled: { bg: `${WARNING}12`, color: WARNING, label: 'Rescheduled' },
  no_show:     { bg: `${INK}10`,     color: INK,     label: 'No-show' },
};

export function MyBookingsPage() {
  const [tab, setTab] = useState<Tab>('upcoming');

  const upcomingList = MOCK_UPCOMING;
  const pastList = MOCK_PAST;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
      {/* Admin booking management — placeholder for admin view where team ops can see/edit all org bookings, filter by coach/status/date, and manually schedule */}

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 28,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: DS.headingFont,
              fontSize: 32,
              fontWeight: 600,
              color: DS.text,
              margin: '0 0 6px',
            }}
          >
            My Sessions
          </h1>
          <p
            style={{
              fontFamily: DS.bodyFont,
              fontSize: 15,
              color: DS.muted,
              margin: 0,
              maxWidth: 520,
              lineHeight: 1.5,
            }}
          >
            View and manage your upcoming and past debrief sessions.
          </p>
        </div>

        <button
          onClick={() => alert('Open BookingFlow — placeholder')}
          style={{
            fontFamily: DS.bodyFont,
            fontSize: 15,
            fontWeight: 600,
            color: DS.bg,
            background: DS.accent,
            border: 'none',
            padding: '12px 22px',
            cursor: 'pointer',
            transition: DS.transition,
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = DS.accentDark;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = DS.accent;
          }}
        >
          + Book New Session
        </button>
      </div>

      <div
        style={{
          borderBottom: `1px solid ${DS.border}`,
          marginBottom: 24,
          display: 'flex',
          gap: 0,
        }}
      >
        <TabButton
          label="Upcoming"
          count={upcomingList.length}
          active={tab === 'upcoming'}
          onClick={() => setTab('upcoming')}
        />
        <TabButton
          label="Past"
          count={pastList.length}
          active={tab === 'past'}
          onClick={() => setTab('past')}
        />
      </div>

      {tab === 'upcoming' ? (
        upcomingList.length === 0 ? (
          <EmptyState
            title="No upcoming sessions"
            description="Book a debrief session to get started with 1:1 coaching."
            ctaLabel="Book a Session"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {upcomingList.map((b) => (
              <UpcomingBookingCard key={b.id} booking={b} />
            ))}
          </div>
        )
      ) : pastList.length === 0 ? (
        <EmptyState
          title="No past sessions"
          description="Your completed and cancelled sessions will appear here."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pastList.map((b) => (
            <PastBookingCard key={b.id} booking={b} />
          ))}
        </div>
      )}
    </div>
  );
}

function TabButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        background: 'transparent',
        border: 'none',
        padding: '12px 20px',
        fontFamily: DS.bodyFont,
        fontSize: 14,
        fontWeight: active ? 600 : 400,
        color: active ? DS.text : DS.muted,
        cursor: 'pointer',
        transition: DS.transition,
        marginBottom: -1,
      }}
    >
      {label}
      <span
        style={{
          marginLeft: 6,
          fontFamily: DS.monoFont,
          fontSize: 11,
          padding: '1px 6px',
          background: active ? `${DS.accent}16` : DS.bgAlt,
          color: active ? DS.accent : DS.muted,
        }}
      >
        {count}
      </span>
      {active && (
        <div
          style={{
            position: 'absolute',
            bottom: -1,
            left: 16,
            right: 16,
            height: 2,
            background: DS.accent,
          }}
        />
      )}
    </button>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: DS.monoFont,
        fontSize: 10,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        background: style.bg,
        color: style.color,
        fontWeight: 600,
      }}
    >
      {style.label}
    </span>
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
    <div
      style={{
        border: `1px solid ${DS.border}`,
        background: DS.card,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        transition: DS.transition,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, minWidth: 0 }}>
          <div
            style={{
              width: 56,
              height: 56,
              flexShrink: 0,
              background: DS.bgAlt,
              border: `1px solid ${DS.border}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: DS.monoFont,
                fontSize: 10,
                textTransform: 'uppercase',
                color: DS.muted,
                letterSpacing: '0.05em',
              }}
            >
              {date.toLocaleDateString('en-US', { month: 'short' })}
            </span>
            <span
              style={{
                fontFamily: DS.headingFont,
                fontSize: 22,
                fontWeight: 600,
                color: DS.text,
                lineHeight: 1,
              }}
            >
              {date.getDate()}
            </span>
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 4,
                flexWrap: 'wrap',
              }}
            >
              <h3
                style={{
                  fontFamily: DS.headingFont,
                  fontSize: 17,
                  fontWeight: 600,
                  color: DS.text,
                  margin: 0,
                }}
              >
                {session.displayName}
              </h3>
              <StatusBadge status={booking.status} />
            </div>
            <div
              style={{
                fontFamily: DS.bodyFont,
                fontSize: 14,
                color: DS.textSecondary,
                marginBottom: 4,
              }}
            >
              {formatDateLong(date)} · {formatTime12h(booking.timeSlot)} ({booking.durationMinutes} min)
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: DS.bgAlt,
                  fontFamily: DS.headingFont,
                  fontSize: 10,
                  fontWeight: 600,
                  color: DS.text,
                  borderRadius: '9999px',
                }}
              >
                {coach.avatarInitials}
              </div>
              <span
                style={{
                  fontFamily: DS.bodyFont,
                  fontSize: 13,
                  color: DS.muted,
                }}
              >
                with {coach.name}
              </span>
              <span
                style={{
                  fontFamily: DS.monoFont,
                  fontSize: 11,
                  padding: '2px 8px',
                  background: DS.bgAlt,
                  color: DS.muted,
                }}
              >
                #{booking.id}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          paddingTop: 12,
          borderTop: `1px solid ${DS.border}`,
        }}
      >
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
          label="Add to Calendar"
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

  return (
    <div
      style={{
        border: `1px solid ${DS.border}`,
        background: booking.status === 'cancelled' ? `${DS.bgAlt}88'` : DS.card,
        opacity: booking.status === 'cancelled' ? 0.9 : 1,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        transition: DS.transition,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, minWidth: 0 }}>
          <div
            style={{
              width: 56,
              height: 56,
              flexShrink: 0,
              background: DS.bgAlt,
              border: `1px solid ${DS.border}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: booking.status === 'cancelled' ? 0.6 : 1,
            }}
          >
            <span
              style={{
                fontFamily: DS.monoFont,
                fontSize: 10,
                textTransform: 'uppercase',
                color: DS.muted,
                letterSpacing: '0.05em',
              }}
            >
              {date.toLocaleDateString('en-US', { month: 'short' })}
            </span>
            <span
              style={{
                fontFamily: DS.headingFont,
                fontSize: 22,
                fontWeight: 600,
                color: booking.status === 'cancelled' ? DS.muted : DS.text,
                lineHeight: 1,
                textDecoration: booking.status === 'cancelled' ? 'line-through' : 'none',
              }}
            >
              {date.getDate()}
            </span>
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 4,
                flexWrap: 'wrap',
              }}
            >
              <h3
                style={{
                  fontFamily: DS.headingFont,
                  fontSize: 17,
                  fontWeight: 600,
                  color: booking.status === 'cancelled' ? DS.muted : DS.text,
                  margin: 0,
                  textDecoration: booking.status === 'cancelled' ? 'line-through' : 'none',
                }}
              >
                {session.displayName}
              </h3>
              <StatusBadge status={booking.status} />
            </div>
            <div
              style={{
                fontFamily: DS.bodyFont,
                fontSize: 14,
                color: DS.muted,
                marginBottom: 4,
              }}
            >
              {formatDateShort(date)}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: DS.bgAlt,
                  fontFamily: DS.headingFont,
                  fontSize: 10,
                  fontWeight: 600,
                  color: DS.text,
                  borderRadius: '9999px',
                }}
              >
                {coach.avatarInitials}
              </div>
              <span
                style={{
                  fontFamily: DS.bodyFont,
                  fontSize: 13,
                  color: DS.muted,
                }}
              >
                with {coach.name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {booking.status === 'completed' && booking.notesPlaceholder && (
        <div
          style={{
            border: `1px solid ${DS.border}`,
            background: DS.bgAlt,
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => setShowNotes((s) => !s)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span
              style={{
                fontFamily: DS.bodyFont,
                fontSize: 13,
                fontWeight: 600,
                color: DS.text,
              }}
            >
              Session notes
            </span>
            <span
              style={{
                fontFamily: DS.bodyFont,
                fontSize: 13,
                color: DS.muted,
                transition: DS.transition,
                transform: showNotes ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              ▾
            </span>
          </button>
          {showNotes && (
            <div
              style={{
                padding: '0 14px 14px',
                borderTop: `1px solid ${DS.border}`,
              }}
            >
              <p
                style={{
                  fontFamily: DS.bodyFont,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: DS.textSecondary,
                  margin: '12px 0 0',
                }}
              >
                {booking.notesPlaceholder}
              </p>
            </div>
          )}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          paddingTop: 12,
          borderTop: `1px solid ${DS.border}`,
        }}
      >
        {booking.status === 'completed' && (
          <ActionButton
            label="Rebook same type"
            variant="primary"
            onClick={() => alert(`Rebook ${session.slug} — open BookingFlow placeholder`)}
          />
        )}
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
    fontFamily: DS.bodyFont,
    fontSize: 13,
    fontWeight: 500,
    padding: '8px 14px',
    cursor: 'pointer',
    border: '1px solid',
    transition: DS.transition,
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: DS.accent,
      color: DS.bg,
      borderColor: DS.accent,
    },
    secondary: {
      background: DS.bgDark,
      color: DS.bg,
      borderColor: DS.bgDark,
    },
    outline: {
      background: 'transparent',
      color: DS.textSecondary,
      borderColor: DS.borderStrong,
    },
    danger: {
      background: 'transparent',
      color: ERROR,
      borderColor: `${ERROR}44`,
    },
  };

  const hover: Record<string, React.CSSProperties> = {
    primary:   { background: DS.accentDark,  borderColor: DS.accentDark,  color: DS.bg },
    secondary: { background: DS.text,       borderColor: DS.text,       color: DS.bg },
    outline:   { borderColor: DS.accent,    color: DS.accent },
    danger:    { background: `${ERROR}0F`,  borderColor: ERROR },
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

function EmptyState({
  title,
  description,
  ctaLabel,
}: {
  title: string;
  description: string;
  ctaLabel?: string;
}) {
  return (
    <div
      style={{
        padding: '64px 24px',
        textAlign: 'center',
        border: `1px dashed ${DS.border}`,
        background: DS.card,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          margin: '0 auto 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: DS.bgAlt,
          fontFamily: DS.headingFont,
          fontSize: 24,
          color: DS.muted,
        }}
      >
        ○
      </div>
      <h3
        style={{
          fontFamily: DS.headingFont,
          fontSize: 18,
          fontWeight: 600,
          color: DS.text,
          margin: '0 0 8px',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: DS.bodyFont,
          fontSize: 14,
          color: DS.muted,
          margin: '0 auto 20px',
          maxWidth: 420,
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
      {ctaLabel && (
        <button
          onClick={() => alert('Open BookingFlow — placeholder')}
          style={{
            fontFamily: DS.bodyFont,
            fontSize: 14,
            fontWeight: 600,
            color: DS.bg,
            background: DS.accent,
            border: 'none',
            padding: '10px 22px',
            cursor: 'pointer',
            transition: DS.transition,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = DS.accentDark;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = DS.accent;
          }}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
