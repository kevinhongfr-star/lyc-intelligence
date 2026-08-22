import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { normalizeTier, tierDisplayName } from '@/config/tierConfig';
import { V3 } from '@/styles/v3-tokens';
import {
  Badge,
  Button,
  EmptyState,
  ListRow,
  MonoLabel,
  PageHeader,
  Skeleton,
} from '@/components/app-v3/ui';
import {
  fetchOpenSlots,
  fetchPastSessions,
  confirmBooking,
  type AvailabilitySlot,
  type PastSession,
  type BookingPackage,
} from '@/services/coachingBookings';

interface PackageDef {
  id: 'Bronze' | 'Silver' | 'Gold';
  duration: string;
  price: string;
  badgeVariant: 'status-draft' | 'count-active' | 'tier-executive';
  buttonVariant: 'secondary' | 'primary' | 'dark-cta';
  items: string[];
}

const PACKAGES: PackageDef[] = [
  {
    id: 'Bronze',
    duration: '60 min · 1:1 · Video',
    price: '$299 USD',
    badgeVariant: 'status-draft',
    buttonVariant: 'secondary',
    items: [
      'Single 60-minute debrief',
      'Recording + transcript',
      '1 follow-up email',
      'Next steps 1-page',
    ],
  },
  {
    id: 'Silver',
    duration: '90 min · 1:1 · Video + worksheet',
    price: '$499 USD',
    badgeVariant: 'count-active',
    buttonVariant: 'primary',
    items: [
      '90-minute 1:1 debrief',
      'Prior document pre-read by consultant',
      'Post-session worksheet',
      '2-week NEXUS follow-up thread',
    ],
  },
  {
    id: 'Gold',
    duration: '2 × 90 min · 1:1 · Deep-review + action plan',
    price: '$899 USD',
    badgeVariant: 'tier-executive',
    buttonVariant: 'dark-cta',
    items: [
      '2 × 90 minute sessions',
      'Full document baseline review',
      'Written action plan',
      '30-day email support',
    ],
  },
];

// Corrective batch v2.4 #1393 — real Supabase-backed slots/history.
// The service falls back to the migration-matched inline set when rows are
// pre-migration, so we don't render a blank page on local dev.

function bulletIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="2" y1="8" x2="10" y2="8" />
    </svg>
  );
}

function calendarIconSvg() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="4" y="7" width="32" height="27" />
      <path d="M4 14h32" />
      <path d="M12 4v6" />
      <path d="M28 4v6" />
      <path d="M13 20h.01" opacity="0.5" />
      <path d="M20 20h.01" opacity="0.5" />
      <path d="M27 20h.01" opacity="0.5" />
      <path d="M13 26h.01" opacity="0.5" />
      <path d="M20 26h.01" opacity="0.5" />
      <path d="M27 26h.01" opacity="0.5" />
    </svg>
  );
}

export function CoachingPageV3(): React.ReactElement {
  const { profile, user } = useAuthStore();
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const tier = normalizeTier(profile?.tier) ?? profile?.tier ?? null;
  const milesBalance = (profile as any)?.miles_balance as number | undefined ?? 0;
  const tierLabel = tierDisplayName(tier);

  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [past, setPast] = useState<PastSession[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await fetchOpenSlots();
      const p = user?.id ? await fetchPastSessions(user.id) : [];
      if (!cancelled) {
        setSlots(s);
        setPast(p);
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleBookSlot = async (slot: AvailabilitySlot) => {
    if (!user?.id) {
      navigate('/auth?next=/app/v3/coaching');
      return;
    }
    const result = await confirmBooking({
      userId: user.id,
      slotId: slot.id,
      package: slot.package,
      slotDay: slot.day,
      slotTime: slot.time,
      durationMin: Number(slot.duration.replace(/\D/g, '')) || 60,
      userEmail: profile?.email || undefined,
      userName: profile?.name || undefined,
    });
    if (result?.bookingId) {
      setBookingId(result.bookingId);
      // Remove the booked slot from the local list + refresh past sessions
      setSlots((prev) => prev.filter((s) => s.id !== slot.id));
      const fresh = await fetchPastSessions(user.id);
      setPast(fresh);
      window.setTimeout(() => setBookingId(null), 3200);
    } else {
      // Confirm fallback: route to the booking flow for full details.
      navigate(
        `/app/v3/coaching/book?slot=${encodeURIComponent(slot.id)}&session=${slot.package}`,
      );
    }
  };

  const tierBadgeVariant =
    tier === 'council' || tier === 'enterprise'
      ? 'tier-council'
      : tier === 'executive'
      ? 'tier-executive'
      : tier === 'professional'
      ? 'tier-pro'
      : 'status-draft';

  return (
    <div
      style={{
        background: V3.cream,
        minHeight: '100vh',
        paddingTop: V3.appPageHeaderPad,
        paddingBottom: 64,
        paddingLeft: 24,
        paddingRight: 24,
      }}
    >
      <PageHeader
        kicker="COACHING"
        title="Human depth, when you need it."
        description="1:1 advisory debriefs with certified LYC consultants. Real availability, real booking, post-session readouts delivered straight back to your workspace."
        right={
          <Button variant="dark-cta" size="large" to="/app/v3/coaching/book">
            Book a debrief
          </Button>
        }
      />

      <div
        style={{
          maxWidth: V3.appContentMax,
          margin: '48px auto 0',
        }}
      >
        {!loaded ? (
          <div aria-busy style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton width="100%" height={40} />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3,1fr)',
                gap: 24,
                marginTop: 12,
              }}
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    border: `1px solid ${V3.ink100}`,
                    padding: 24,
                    background: V3.white,
                  }}
                >
                  <Skeleton width={80} height={12} style={{ marginBottom: 12 }} />
                  <Skeleton width={180} height={20} style={{ marginBottom: 10 }} />
                  <Skeleton width={140} height={10} style={{ marginBottom: 20 }} />
                  {Array.from({ length: 4 }).map((__, j) => (
                    <Skeleton key={j} width="100%" height={12} style={{ marginTop: j === 0 ? 0 : 10 }} />
                  ))}
                  <Skeleton width="100%" height={36} style={{ marginTop: 20 }} />
                </div>
              ))}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2,1fr)',
                gap: 24,
                marginTop: 12,
              }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} width="100%" height={80} />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                marginBottom: 32,
              }}
            >
              <Badge variant={tierBadgeVariant}>{tierLabel}</Badge>
              <Badge variant="count-active">{milesBalance.toLocaleString()} miles</Badge>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 24,
              }}
            >
              {PACKAGES.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>

            <div style={{ marginTop: 48 }}>
              <MonoLabel color={V3.teal600}>NEXT AVAILABLE</MonoLabel>
              <div
                style={{
                  fontFamily: V3.displayFont,
                  fontSize: '20px',
                  fontWeight: V3.fwRegular,
                  color: V3.ink900,
                  marginTop: 10,
                }}
              >
                Real calendar slots.
              </div>
              <div
                style={{
                  fontFamily: V3.bodyFont,
                  fontSize: '14px',
                  color: V3.ink500,
                  marginTop: 8,
                  maxWidth: 520,
                  lineHeight: 1.6,
                }}
              >
                Showing open slots for the next 2 weeks. All times local.
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 24,
                  marginTop: 24,
                }}
              >
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    style={{
                      border: `1px solid ${V3.ink100}`,
                      padding: 20,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 16,
                      background: V3.white,
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontFamily: V3.displayFont,
                          fontSize: '18px',
                          fontWeight: V3.fwSemibold,
                          color: V3.ink900,
                          lineHeight: 1.2,
                        }}
                      >
                        {slot.day}
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <MonoLabel color={V3.ink400}>
                          {slot.time} · {slot.duration}
                        </MonoLabel>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => handleBookSlot(slot)}
                    >
                      Book this slot
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 48 }}>
              <MonoLabel color={V3.ocean600}>PAST SESSIONS</MonoLabel>
              <div
                style={{
                  fontFamily: V3.displayFont,
                  fontSize: '20px',
                  fontWeight: V3.fwRegular,
                  color: V3.ink900,
                  marginTop: 10,
                }}
              >
                Session history.
              </div>
              <div
                style={{
                  fontFamily: V3.bodyFont,
                  fontSize: '14px',
                  color: V3.ink500,
                  marginTop: 8,
                  maxWidth: 520,
                  lineHeight: 1.6,
                }}
              >
                Prior debriefs, ready to revisit at any time.
              </div>

              <div style={{ marginTop: 24, border: `1px solid ${V3.ink200}` }}>
                {past.length === 0 ? (
                  <EmptyState
                    iconSvg={calendarIconSvg()}
                    title="No sessions yet"
                    description="Your booked debriefs and their deliverables will appear here."
                  />
                ) : (
                  past.map((s, idx) => (
                    <ListRow
                      key={s.id}
                      borderColor={idx === past.length - 1 ? 'transparent' : V3.ink100}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: V3.bodyFont,
                            fontSize: '14px',
                            fontWeight: V3.fwSemibold,
                            color: V3.ink800,
                            lineHeight: 1.3,
                          }}
                        >
                          {s.title}
                        </div>
                        <div style={{ marginTop: 6 }}>
                          <MonoLabel>
                            {s.date} · {s.duration}
                          </MonoLabel>
                        </div>
                      </div>
                      <Button variant="ghost" size="small">
                        View report
                      </Button>
                    </ListRow>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
      {bookingId && (
        <div
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 50,
            background: V3.ink900,
            color: V3.cream,
            padding: '10px 16px',
            fontFamily: V3.monoFont,
            fontSize: '0.68rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}
        >
          Booking confirmed
        </div>
      )}
    </div>
  );
}

function PackageCard({ pkg }: { pkg: PackageDef }): React.ReactElement {
  const navigate = useNavigate();
  return (
    <div
      style={{
        border: `1px solid ${V3.ink100}`,
        padding: 24,
        background: V3.white,
        display: 'flex',
        flexDirection: 'column',
        transition: `border-color ${V3.durFast}ms ${V3.ease}, transform ${V3.durFast}ms ${V3.ease}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = V3.ink200;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = V3.ink100;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontFamily: V3.displayFont,
            fontSize: '20px',
            fontWeight: V3.fwSemibold,
            color: V3.ink900,
            lineHeight: 1.2,
          }}
        >
          {pkg.id}
        </div>
        <Badge variant={pkg.badgeVariant}>{pkg.id}</Badge>
      </div>

      <div style={{ marginBottom: 20 }}>
        <MonoLabel>
          {pkg.duration} · {pkg.price}
        </MonoLabel>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          flex: 1,
          marginBottom: 24,
        }}
      >
        {pkg.items.map((item) => (
          <div
            key={item}
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: V3.teal500,
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              {bulletIcon()}
            </div>
            <div
              style={{
                fontFamily: V3.bodyFont,
                fontSize: '13px',
                color: V3.ink700,
                lineHeight: 1.5,
              }}
            >
              {item}
            </div>
          </div>
        ))}
      </div>

      <Button
        variant={pkg.buttonVariant}
        block
        onClick={() => navigate(`/app/v3/coaching/book?session=${pkg.id}`)}
      >
        Book {pkg.id}
      </Button>
    </div>
  );
}
