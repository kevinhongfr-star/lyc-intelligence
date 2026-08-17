import React, { useMemo, useState } from 'react';
import {
  SESSION_CATALOG,
  type SessionType,
  calculateSessionPrice,
  formatSessionPrice,
  getCoachesForType,
  getComplimentaryAllocation,
  getComplimentaryCreditValue,
  allocationCoversSession,
  CANCELLATION_FREE_HOURS_BEFORE,
  type CoachRosterEntry,
  type BookingStatus,
} from '@/config/sessions';
import { tierMeets, tierDisplayName, type TierKey } from '@/config/tiers';
import { DS } from '@/tokens';

export interface BookingFlowProps {
  initialSessionSlug?: string;
  onComplete?: (bookingRef: string) => void;
  onClose?: () => void;
}

type BookingStep = 1 | 2 | 3 | 4;

interface MockBooking {
  id: string;
  session: SessionType;
  coach: CoachRosterEntry;
  dateIso: string;
  timeSlot: string;
  status: BookingStatus;
  tier: TierKey;
  billingCycle: 'monthly' | 'annual';
}

const MOCK_CURRENT_USER = {
  tier: 'executive' as TierKey,
  billingCycle: 'annual' as const,
  currency: 'USD' as const,
};

const MOCK_COMPLIMENTARY_USAGE = {
  allocatedCount: 1,
  usedCount: 0,
};

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];

function generateAvailabilityDates(days: number): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function seededRandom(seed: number): boolean {
  const x = Math.sin(seed) * 10000;
  return (x - Math.floor(x)) < 0.2;
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

function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

function getWeekdayInitial(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
}

export function BookingFlow({ initialSessionSlug, onComplete, onClose }: BookingFlowProps) {
  const [step, setStep] = useState<BookingStep>(1);
  const [selectedSessionSlug, setSelectedSessionSlug] = useState<string | null>(
    initialSessionSlug ?? null,
  );
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);
  const [useComplimentary, setUseComplimentary] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bookingRef, setBookingRef] = useState<string | null>(null);

  const userTier = MOCK_CURRENT_USER.tier;
  const billingCycle = MOCK_CURRENT_USER.billingCycle;
  const currency = MOCK_CURRENT_USER.currency;
  const timezone = detectTimezone();

  const availabilityDates = useMemo(() => generateAvailabilityDates(60), []);

  const selectedSession = useMemo(() => {
    if (!selectedSessionSlug) return null;
    return SESSION_CATALOG.find((s) => s.slug === selectedSessionSlug) ?? null;
  }, [selectedSessionSlug]);

  const coachesForSession = useMemo(() => {
    if (!selectedSession) return [];
    return getCoachesForType(selectedSession.coachType);
  }, [selectedSession]);

  const selectedCoach = useMemo(() => {
    if (!selectedCoachId) return coachesForSession[0] ?? null;
    return coachesForSession.find((c) => c.id === selectedCoachId) ?? coachesForSession[0] ?? null;
  }, [selectedCoachId, coachesForSession]);

  const complimentaryAllocation = useMemo(
    () => getComplimentaryAllocation(userTier),
    [userTier],
  );

  const hasAvailableComplimentary = useMemo(() => {
    if (!complimentaryAllocation) return false;
    if (!selectedSession?.eligibleForComplimentary) return false;
    const coverage = allocationCoversSession(complimentaryAllocation, selectedSession);
    const remaining = MOCK_COMPLIMENTARY_USAGE.allocatedCount - MOCK_COMPLIMENTARY_USAGE.usedCount;
    return remaining > 0 && coverage !== 'none';
  }, [complimentaryAllocation, selectedSession]);

  const priceBreakdown = useMemo(() => {
    if (!selectedSession) return null;
    const complimentaryCreditAmount = useComplimentary
      ? getComplimentaryCreditValue(userTier, currency)
      : 0;
    return calculateSessionPrice({
      session: selectedSession,
      userTier,
      billingCycle,
      currency,
      applyComplimentaryCredit: useComplimentary,
      complimentaryCreditAmount,
    });
  }, [selectedSession, userTier, billingCycle, currency, useComplimentary]);

  const cpiGatedOut = useMemo(() => {
    if (!selectedSession?.isCpiFlagship) return false;
    return !tierMeets(userTier, selectedSession.requiredTier);
  }, [selectedSession, userTier]);

  const canProceedStep1 = selectedSession !== null && !cpiGatedOut;
  const canProceedStep2 = selectedDate !== null && selectedTime !== null;

  function goNext() {
    setError(null);
    if (step === 1 && canProceedStep1) setStep(2);
    else if (step === 2 && canProceedStep2) setStep(3);
  }

  function goBack() {
    setError(null);
    if (step === 1) onClose?.();
    else setStep((s) => (s - 1) as BookingStep);
  }

  function handleConfirmBooking() {
    setSubmitting(true);
    setError(null);
    setTimeout(() => {
      const rand = Math.random();
      if (rand < 0.1) {
        setError('This time slot was just booked — please pick another');
        setSubmitting(false);
        return;
      }
      if (rand < 0.15) {
        setError('Payment failed. Please check your card or try another method.');
        setSubmitting(false);
        return;
      }
      const ref = `BK-${Date.now().toString(36).toUpperCase()}`;
      setBookingRef(ref);
      setStep(4);
      setSubmitting(false);
      onComplete?.(ref);
    }, 900);
  }

  function handleSelectNextAvailable() {
    for (const date of availabilityDates) {
      const dateSeed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
      for (const slot of TIME_SLOTS) {
        const hour = parseInt(slot.split(':')[0], 10);
        const minute = parseInt(slot.split(':')[1], 10);
        const now = new Date();
        const slotTime = new Date(date);
        slotTime.setHours(hour, minute, 0, 0);
        if (slotTime <= now) continue;
        const slotSeed = dateSeed + hour * 60 + minute;
        if (seededRandom(slotSeed)) continue;
        setSelectedDate(date);
        setSelectedTime(slot);
        return;
      }
    }
  }

  function isSlotBooked(date: Date, slot: string): boolean {
    const dateSeed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
    const hour = parseInt(slot.split(':')[0], 10);
    const minute = parseInt(slot.split(':')[1], 10);
    const slotSeed = dateSeed + hour * 60 + minute;
    return seededRandom(slotSeed);
  }

  function isSlotPast(date: Date, slot: string): boolean {
    const hour = parseInt(slot.split(':')[0], 10);
    const minute = parseInt(slot.split(':')[1], 10);
    const slotTime = new Date(date);
    slotTime.setHours(hour, minute, 0, 0);
    return slotTime <= new Date();
  }

  function handleDownloadIcs() {
    alert(`Booking #${bookingRef}: .ics download placeholder`);
  }

  function handleAddGoogleCalendar() {
    alert(`Booking #${bookingRef}: Add to Google Calendar placeholder`);
  }

  const steps = [
    { label: 'Session', status: step >= 1 ? (step > 1 ? 'completed' : 'active') : 'upcoming' },
    { label: 'Date & Time', status: step >= 2 ? (step > 2 ? 'completed' : 'active') : 'upcoming' },
    { label: 'Confirm', status: step >= 3 ? (step > 3 ? 'completed' : 'active') : 'upcoming' },
  ] as const;

  return (
    <div
      style={{
        background: DS.bg,
        border: `1px solid ${DS.border}`,
        maxWidth: 720,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${DS.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            fontFamily: DS.headingFont,
            fontSize: 20,
            fontWeight: 600,
            color: DS.text,
          }}
        >
          Book a Debrief Session
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              fontFamily: DS.bodyFont,
              fontSize: 14,
              color: DS.muted,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        )}
      </div>

      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${DS.border}` }}>
        <ol style={{ display: 'flex', alignItems: 'flex-start', width: '100%', listStyle: 'none', padding: 0, margin: 0 }}>
          {steps.map((s, i) => (
            <li
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                {i > 0 && (
                  <div
                    style={{
                      height: 2,
                      flex: 1,
                      marginLeft: -2,
                      background: s.status === 'completed' ? DS.accent : DS.border,
                    }}
                  />
                )}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: DS.monoFont,
                    fontSize: 13,
                    fontWeight: 600,
                    background: s.status === 'upcoming' ? DS.bgAlt : DS.accent,
                    color: s.status === 'upcoming' ? DS.muted : DS.bg,
                    outline: s.status === 'active' ? `4px solid ${DS.accent}22` : 'none',
                  }}
                >
                  {s.status === 'completed' ? '✓' : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div
                    style={{
                      height: 2,
                      flex: 1,
                      marginRight: -2,
                      background:
                        steps[i + 1].status === 'completed' || s.status === 'completed'
                          ? DS.accent
                          : DS.border,
                    }}
                  />
                )}
              </div>
              <div style={{ marginTop: 8, textAlign: 'center' }}>
                <p
                  style={{
                    fontFamily: DS.bodyFont,
                    fontSize: 12,
                    fontWeight: 500,
                    color: s.status === 'upcoming' ? DS.muted : DS.text,
                    margin: 0,
                  }}
                >
                  {s.label}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div style={{ padding: 24 }}>
        {step === 1 && (
          <Step1SessionSelection
            sessions={SESSION_CATALOG}
            selectedSlug={selectedSessionSlug}
            onSelect={(slug) => {
              setSelectedSessionSlug(slug);
              setSelectedCoachId(null);
              setUseComplimentary(false);
            }}
            userTier={userTier}
            billingCycle={billingCycle}
            currency={currency}
            coachesForSession={coachesForSession}
            selectedCoachId={selectedCoach?.id ?? null}
            onSelectCoach={setSelectedCoachId}
            hasAvailableComplimentary={hasAvailableComplimentary}
            useComplimentary={useComplimentary}
            onToggleComplimentary={setUseComplimentary}
            complimentaryAllocation={complimentaryAllocation}
            complimentaryRemaining={
              MOCK_COMPLIMENTARY_USAGE.allocatedCount - MOCK_COMPLIMENTARY_USAGE.usedCount
            }
          />
        )}

        {step === 2 && selectedSession && (
          <Step2DateTime
            availabilityDates={availabilityDates}
            timeSlots={TIME_SLOTS}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onSelectDate={setSelectedDate}
            onSelectTime={setSelectedTime}
            timezone={timezone}
            sessionDuration={selectedSession.durationMinutes}
            isSlotBooked={isSlotBooked}
            isSlotPast={isSlotPast}
            onSelectNextAvailable={handleSelectNextAvailable}
          />
        )}

        {step === 3 && selectedSession && selectedCoach && selectedDate && selectedTime && (
          <Step3Review
            session={selectedSession}
            coach={selectedCoach}
            date={selectedDate}
            time={selectedTime}
            timezone={timezone}
            priceBreakdown={priceBreakdown!}
            currency={currency}
            onConfirm={handleConfirmBooking}
            submitting={submitting}
            error={error}
          />
        )}

        {step === 4 && bookingRef && selectedSession && selectedDate && selectedTime && (
          <Step4Success
            bookingRef={bookingRef}
            session={selectedSession}
            date={selectedDate}
            time={selectedTime}
            onDownloadIcs={handleDownloadIcs}
            onAddGoogleCalendar={handleAddGoogleCalendar}
            onClose={onClose}
          />
        )}
      </div>

      {step < 4 && (
        <div
          style={{
            padding: '16px 24px',
            borderTop: `1px solid ${DS.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <button
            onClick={goBack}
            style={{
              fontFamily: DS.bodyFont,
              fontSize: 14,
              fontWeight: 500,
              color: DS.textSecondary,
              background: 'transparent',
              border: `1px solid ${DS.border}`,
              padding: '10px 20px',
              cursor: 'pointer',
              transition: DS.transition,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = DS.borderStrong;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = DS.border;
            }}
          >
            {step === 1 ? (onClose ? 'Cancel' : '') : 'Back'}
          </button>

          {step < 3 ? (
            <button
              onClick={goNext}
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              style={{
                fontFamily: DS.bodyFont,
                fontSize: 15,
                fontWeight: 600,
                color:
                  step === 1 ? (!canProceedStep1 ? DS.muted : DS.bg) : !canProceedStep2 ? DS.muted : DS.bg,
                background:
                  step === 1
                    ? !canProceedStep1
                      ? DS.bgAlt
                      : DS.accent
                    : !canProceedStep2
                      ? DS.bgAlt
                      : DS.accent,
                border: 'none',
                padding: '12px 28px',
                cursor:
                  step === 1
                    ? !canProceedStep1
                      ? 'default'
                      : 'pointer'
                    : !canProceedStep2
                      ? 'default'
                      : 'pointer',
                transition: DS.transition,
              }}
              onMouseEnter={(e) => {
                const disabled = step === 1 ? !canProceedStep1 : !canProceedStep2;
                if (!disabled) e.currentTarget.style.background = DS.accentDark;
              }}
              onMouseLeave={(e) => {
                const disabled = step === 1 ? !canProceedStep1 : !canProceedStep2;
                if (!disabled) e.currentTarget.style.background = DS.accent;
              }}
            >
              Next
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

/* ── Step 1: Session Selection ─────────────────────────────────────── */

interface Step1Props {
  sessions: SessionType[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
  userTier: TierKey;
  billingCycle: 'monthly' | 'annual';
  currency: 'USD' | 'CNY';
  coachesForSession: CoachRosterEntry[];
  selectedCoachId: string | null;
  onSelectCoach: (id: string) => void;
  hasAvailableComplimentary: boolean;
  useComplimentary: boolean;
  onToggleComplimentary: (v: boolean) => void;
  complimentaryAllocation: ReturnType<typeof getComplimentaryAllocation>;
  complimentaryRemaining: number;
}

function Step1SessionSelection(p: Step1Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2
          style={{
            fontFamily: DS.headingFont,
            fontSize: 22,
            fontWeight: 600,
            color: DS.text,
            margin: '0 0 4px',
          }}
        >
          Choose a session type
        </h2>
        <p
          style={{
            fontFamily: DS.bodyFont,
            fontSize: 14,
            color: DS.muted,
            margin: 0,
          }}
        >
          Select the debrief session that fits your needs.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 12,
        }}
      >
        {p.sessions.map((session) => {
          const breakdown = calculateSessionPrice({
            session,
            userTier: p.userTier,
            billingCycle: p.billingCycle,
            currency: p.currency,
          });
          const isSelected = p.selectedSlug === session.slug;
          const gated = session.isCpiFlagship && !tierMeets(p.userTier, session.requiredTier);

          return (
            <button
              key={session.slug}
              onClick={() => !gated && p.onSelect(session.slug)}
              disabled={gated}
              style={{
                textAlign: 'left',
                background: isSelected ? DS.card : DS.bg,
                border: isSelected
                  ? `2px solid ${DS.accent}`
                  : gated
                    ? `1px solid ${DS.border}`
                    : `1px solid ${DS.border}`,
                padding: 16,
                cursor: gated ? 'not-allowed' : 'pointer',
                opacity: gated ? 0.7 : 1,
                transition: DS.transition,
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!gated && !isSelected) e.currentTarget.style.background = DS.cardHover;
              }}
              onMouseLeave={(e) => {
                if (!gated && !isSelected) e.currentTarget.style.background = DS.bg;
              }}
            >
              {session.isCpiFlagship && (
                <div
                  style={{
                    position: 'absolute',
                    top: -1,
                    left: -1,
                    right: -1,
                    background: gated ? DS.muted : DS.bgDark,
                    color: DS.bg,
                    fontFamily: DS.monoFont,
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    padding: '5px 0',
                  }}
                >
                  {gated
                    ? `Council-only · ${tierDisplayName(session.requiredTier)}+ required`
                    : `${tierDisplayName(session.requiredTier)} Tier Flagship`}
                </div>
              )}

              <div style={{ marginTop: session.isCpiFlagship ? 36 : 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: DS.headingFont,
                      fontSize: 16,
                      fontWeight: 600,
                      color: DS.text,
                      marginBottom: 4,
                    }}
                  >
                    {session.displayName}
                  </div>
                  <div
                    style={{
                      fontFamily: DS.bodyFont,
                      fontSize: 13,
                      color: DS.muted,
                      marginBottom: 8,
                      lineHeight: 1.4,
                    }}
                  >
                    {session.shortDescriptor}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: DS.monoFont,
                        fontSize: 11,
                        padding: '2px 8px',
                        background: DS.bgAlt,
                        color: DS.textSecondary,
                      }}
                    >
                      {session.durationMinutes} min
                    </span>
                    {breakdown.hasAnyDiscount && (
                      <span
                        style={{
                          fontFamily: DS.monoFont,
                          fontSize: 11,
                          padding: '2px 8px',
                          background: `${DS.accent}14`,
                          color: DS.accent,
                        }}
                      >
                        Save {breakdown.totalSavingsPercent}%
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {breakdown.hasAnyDiscount ? (
                    <>
                      <div
                        style={{
                          fontFamily: DS.bodyFont,
                          fontSize: 12,
                          color: DS.muted,
                          textDecoration: 'line-through',
                        }}
                      >
                        {formatSessionPrice(breakdown.basePrice, p.currency)}
                      </div>
                      <div
                        style={{
                          fontFamily: DS.headingFont,
                          fontSize: 20,
                          fontWeight: 600,
                          color: DS.text,
                        }}
                      >
                        {formatSessionPrice(breakdown.finalPrice, p.currency)}
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        fontFamily: DS.headingFont,
                        fontSize: 20,
                        fontWeight: 600,
                        color: DS.text,
                      }}
                    >
                      {formatSessionPrice(breakdown.finalPrice, p.currency)}
                    </div>
                  )}
                </div>
              </div>

              {gated && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 10,
                    background: DS.bgAlt,
                    fontFamily: DS.bodyFont,
                    fontSize: 12,
                    color: DS.textSecondary,
                  }}
                >
                  Upgrade to {tierDisplayName(session.requiredTier)} to book this session.{' '}
                  <a
                    href="/pricing"
                    style={{ color: DS.accent, textDecoration: 'underline' }}
                  >
                    View tiers →
                  </a>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {p.selectedSlug && p.coachesForSession.length > 1 && (
        <div
          style={{
            padding: 16,
            border: `1px solid ${DS.border}`,
            background: DS.card,
          }}
        >
          <div
            style={{
              fontFamily: DS.bodyFont,
              fontSize: 13,
              fontWeight: 600,
              color: DS.text,
              marginBottom: 10,
            }}
          >
            Select your coach
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {p.coachesForSession.map((coach) => (
              <label
                key={coach.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 10,
                  border:
                    p.selectedCoachId === coach.id
                      ? `2px solid ${DS.accent}`
                      : `1px solid ${DS.border}`,
                  background: p.selectedCoachId === coach.id ? DS.cardHover : DS.bg,
                  cursor: 'pointer',
                  transition: DS.transition,
                }}
              >
                <input
                  type="radio"
                  name="coach"
                  checked={p.selectedCoachId === coach.id}
                  onChange={() => p.onSelectCoach(coach.id)}
                  style={{ accentColor: DS.accent }}
                />
                <div
                  style={{
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: DS.bgAlt,
                    fontFamily: DS.headingFont,
                    fontSize: 13,
                    fontWeight: 600,
                    color: DS.text,
                    borderRadius: '9999px',
                  }}
                >
                  {coach.avatarInitials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: DS.bodyFont,
                      fontSize: 14,
                      fontWeight: 500,
                      color: DS.text,
                    }}
                  >
                    {coach.name}
                  </div>
                  <div
                    style={{
                      fontFamily: DS.bodyFont,
                      fontSize: 12,
                      color: DS.muted,
                    }}
                  >
                    {coach.timezone}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {p.hasAvailableComplimentary && p.selectedSlug && (
        <div
          style={{
            padding: 14,
            border: `1px solid ${DS.accent}44`,
            background: `${DS.accent}0A`,
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={p.useComplimentary}
              onChange={(e) => p.onToggleComplimentary(e.target.checked)}
              style={{ accentColor: DS.accent, marginTop: 2 }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: DS.bodyFont,
                  fontSize: 14,
                  fontWeight: 600,
                  color: DS.text,
                }}
              >
                Use your free session this month
              </div>
              <div
                style={{
                  fontFamily: DS.bodyFont,
                  fontSize: 12,
                  color: DS.muted,
                  marginTop: 2,
                }}
              >
                {p.complimentaryRemaining} of {p.complimentaryAllocation?.count ?? 0} complimentary sessions remaining this cycle
                {p.complimentaryAllocation?.coversSessionSlug === p.selectedSlug
                  ? ' — fully covers this session'
                  : ' — partial credit will be applied'}
              </div>
            </div>
          </label>
        </div>
      )}
    </div>
  );
}

/* ── Step 2: Date & Time Selection ──────────────────────────────────── */

interface Step2Props {
  availabilityDates: Date[];
  timeSlots: string[];
  selectedDate: Date | null;
  selectedTime: string | null;
  onSelectDate: (d: Date) => void;
  onSelectTime: (t: string) => void;
  timezone: string;
  sessionDuration: number;
  isSlotBooked: (d: Date, t: string) => boolean;
  isSlotPast: (d: Date, t: string) => boolean;
  onSelectNextAvailable: () => void;
}

function Step2DateTime(p: Step2Props) {
  const weeks: Date[][] = [];
  const weekStartsOn = 0;
  let currentWeek: Date[] = [];
  const firstDate = p.availabilityDates[0];
  const firstDayOfWeek = firstDate.getDay();
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(null as unknown as Date);
  }
  for (const d of p.availabilityDates) {
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(d);
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null as unknown as Date);
    weeks.push(currentWeek);
  }

  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  function sameDay(a: Date | null, b: Date | null): boolean {
    if (!a || !b) return false;
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2
          style={{
            fontFamily: DS.headingFont,
            fontSize: 22,
            fontWeight: 600,
            color: DS.text,
            margin: '0 0 4px',
          }}
        >
          Pick a date & time
        </h2>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <p
            style={{
              fontFamily: DS.bodyFont,
              fontSize: 14,
              color: DS.muted,
              margin: 0,
            }}
          >
            Timezone: {p.timezone}
          </p>
          <button
            onClick={p.onSelectNextAvailable}
            style={{
              fontFamily: DS.bodyFont,
              fontSize: 12,
              fontWeight: 500,
              color: DS.accent,
              background: 'transparent',
              border: `1px solid ${DS.accent}44`,
              padding: '6px 12px',
              cursor: 'pointer',
              transition: DS.transition,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${DS.accent}10`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Next available →
          </button>
        </div>
      </div>

      <div
        style={{
          padding: 12,
          border: `1px solid ${DS.border}`,
          background: DS.card,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 4,
            marginBottom: 8,
          }}
        >
          {weekdays.map((d, i) => (
            <div
              key={i}
              style={{
                textAlign: 'center',
                fontFamily: DS.monoFont,
                fontSize: 11,
                color: DS.muted,
                padding: '6px 0',
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {weeks.map((week, wi) => (
          <div
            key={wi}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 4,
              marginBottom: 4,
            }}
          >
            {week.map((day, di) => {
              if (!day) {
                return <div key={di} />;
              }
              const isSelected = sameDay(p.selectedDate, day);
              const isToday = sameDay(new Date(), day);

              return (
                <button
                  key={di}
                  onClick={() => p.onSelectDate(day)}
                  style={{
                    aspectRatio: '1 / 1',
                    background: isSelected ? DS.accent : isToday ? DS.bgAlt : 'transparent',
                    border: isSelected ? 'none' : isToday ? `1px solid ${DS.accent}` : `1px solid transparent`,
                    color: isSelected ? DS.bg : isToday ? DS.accent : DS.text,
                    fontFamily: DS.bodyFont,
                    fontSize: 13,
                    fontWeight: isSelected ? 600 : 400,
                    cursor: 'pointer',
                    transition: DS.transition,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = DS.bgAlt;
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = isToday ? DS.bgAlt : 'transparent';
                  }}
                >
                  <span style={{ fontSize: 10, fontFamily: DS.monoFont, opacity: isSelected ? 0.9 : 0.6 }}>
                    {getWeekdayInitial(day)}
                  </span>
                  <span>{day.getDate()}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div
            style={{
              fontFamily: DS.bodyFont,
              fontSize: 13,
              fontWeight: 600,
              color: DS.text,
            }}
          >
            {p.selectedDate ? formatDateLong(p.selectedDate) : 'Select a date above'}
          </div>
          <span
            style={{
              fontFamily: DS.monoFont,
              fontSize: 11,
              padding: '2px 8px',
              background: DS.bgAlt,
              color: DS.textSecondary,
            }}
          >
            {p.sessionDuration} min
          </span>
        </div>

        {p.selectedDate ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
              gap: 8,
            }}
          >
            {p.timeSlots.map((slot) => {
              const booked = p.isSlotBooked(p.selectedDate!, slot);
              const past = p.isSlotPast(p.selectedDate!, slot);
              const selected = p.selectedTime === slot;
              const disabled = booked || past;

              return (
                <button
                  key={slot}
                  onClick={() => !disabled && p.onSelectTime(slot)}
                  disabled={disabled}
                  style={{
                    padding: '10px 8px',
                    fontFamily: DS.bodyFont,
                    fontSize: 13,
                    fontWeight: selected ? 600 : 400,
                    background: disabled
                      ? DS.bgAlt
                      : selected
                        ? DS.accent
                        : DS.bg,
                    border: selected
                      ? `1px solid ${DS.accent}`
                      : `1px solid ${disabled ? DS.border : DS.borderStrong}`,
                    color: disabled
                      ? DS.mutedDim
                      : selected
                        ? DS.bg
                        : DS.text,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: DS.transition,
                    textDecoration: booked ? 'line-through' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!disabled && !selected) e.currentTarget.style.borderColor = DS.accent;
                  }}
                  onMouseLeave={(e) => {
                    if (!disabled && !selected) e.currentTarget.style.borderColor = DS.borderStrong;
                  }}
                >
                  {formatTime12h(slot)}
                </button>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              border: `1px dashed ${DS.border}`,
              color: DS.muted,
              fontFamily: DS.bodyFont,
              fontSize: 14,
            }}
          >
            Select a date to view available times
          </div>
        )}

        {p.selectedDate && (
          <div
            style={{
              marginTop: 12,
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              fontFamily: DS.monoFont,
              fontSize: 11,
              color: DS.muted,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 12, display: 'inline-block', background: DS.bg, border: `1px solid ${DS.borderStrong}` }} />
              Available
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 12, display: 'inline-block', background: DS.accent }} />
              Selected
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 12, display: 'inline-block', background: DS.bgAlt, border: `1px solid ${DS.border}` }} />
              Booked
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Step 3: Review & Payment ───────────────────────────────────────── */

const ERROR = '#DC2626';
const SUCCESS = '#16A34A';

interface Step3Props {
  session: SessionType;
  coach: CoachRosterEntry;
  date: Date;
  time: string;
  timezone: string;
  priceBreakdown: ReturnType<typeof calculateSessionPrice>;
  currency: 'USD' | 'CNY';
  onConfirm: () => void;
  submitting: boolean;
  error: string | null;
}

function Step3Review(p: Step3Props) {
  const [paymentMethod, setPaymentMethod] = useState('card_on_file');

  const isFree = p.priceBreakdown.isFullyComplimentary;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2
          style={{
            fontFamily: DS.headingFont,
            fontSize: 22,
            fontWeight: 600,
            color: DS.text,
            margin: '0 0 4px',
          }}
        >
          Review your booking
        </h2>
        <p
          style={{
            fontFamily: DS.bodyFont,
            fontSize: 14,
            color: DS.muted,
            margin: 0,
          }}
        >
          Please confirm the details below.
        </p>
      </div>

      {p.error && (
        <div
          style={{
            padding: 12,
            background: '#FEF2F2',
            border: `1px solid ${ERROR}33`,
            fontFamily: DS.bodyFont,
            fontSize: 13,
            color: ERROR,
          }}
        >
          {p.error}
        </div>
      )}

      <div
        style={{
          border: `1px solid ${DS.border}`,
          background: DS.card,
        }}
      >
        <div style={{ padding: 20, borderBottom: `1px solid ${DS.border}` }}>
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: DS.eyebrow,
              marginBottom: 12,
            }}
          >
            Booking Summary
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SummaryRow label="Session" value={p.session.displayName} />
            <SummaryRow label="Duration" value={`${p.session.durationMinutes} minutes`} />
            <SummaryRow
              label="Date & Time"
              value={`${formatDateLong(p.date)} · ${formatTime12h(p.time)}`}
              sub={p.timezone}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
                paddingTop: 14,
                borderTop: `1px dashed ${DS.border}`,
              }}
            >
              <span
                style={{
                  fontFamily: DS.bodyFont,
                  fontSize: 13,
                  color: DS.muted,
                  flexShrink: 0,
                }}
              >
                Coach
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: DS.bgAlt,
                    fontFamily: DS.headingFont,
                    fontSize: 11,
                    fontWeight: 600,
                    color: DS.text,
                    borderRadius: '9999px',
                  }}
                >
                  {p.coach.avatarInitials}
                </div>
                <span
                  style={{
                    fontFamily: DS.bodyFont,
                    fontSize: 14,
                    color: DS.text,
                    fontWeight: 500,
                  }}
                >
                  {p.coach.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: 20, borderBottom: `1px solid ${DS.border}`, background: DS.bgAlt }}>
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: DS.eyebrow,
              marginBottom: 12,
            }}
          >
            Pricing
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontFamily: DS.bodyFont,
                  fontSize: 13,
                  color: DS.muted,
                }}
              >
                Base price
              </span>
              <span
                style={{
                  fontFamily: DS.bodyFont,
                  fontSize: 13,
                  color: DS.textSecondary,
                  textDecoration: p.priceBreakdown.hasAnyDiscount ? 'line-through' : 'none',
                }}
              >
                {formatSessionPrice(p.priceBreakdown.basePrice, p.currency)}
              </span>
            </div>

            {p.priceBreakdown.tierDiscountPercent > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontFamily: DS.bodyFont,
                    fontSize: 13,
                    color: DS.muted,
                  }}
                >
                  {p.priceBreakdown.tierDiscountLabel} (tier discount)
                </span>
                <span
                  style={{
                    fontFamily: DS.bodyFont,
                    fontSize: 13,
                    color: SUCCESS,
                  }}
                >
                  −{formatSessionPrice(Math.round(p.priceBreakdown.tierDiscountAmount), p.currency)}
                </span>
              </div>
            )}

            {p.priceBreakdown.annualDiscountPercent > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontFamily: DS.bodyFont,
                    fontSize: 13,
                    color: DS.muted,
                  }}
                >
                  {p.priceBreakdown.annualDiscountLabel}
                </span>
                <span
                  style={{
                    fontFamily: DS.bodyFont,
                    fontSize: 13,
                    color: SUCCESS,
                  }}
                >
                  −{formatSessionPrice(Math.round(p.priceBreakdown.annualDiscountAmount), p.currency)}
                </span>
              </div>
            )}

            {p.priceBreakdown.complimentaryCreditAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontFamily: DS.bodyFont,
                    fontSize: 13,
                    color: DS.muted,
                  }}
                >
                  Complimentary session credit
                </span>
                <span
                  style={{
                    fontFamily: DS.bodyFont,
                    fontSize: 13,
                    color: SUCCESS,
                  }}
                >
                  −{formatSessionPrice(Math.round(p.priceBreakdown.complimentaryCreditAmount), p.currency)}
                </span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 12,
                marginTop: 4,
                borderTop: `1px solid ${DS.border}`,
              }}
            >
              <span
                style={{
                  fontFamily: DS.bodyFont,
                  fontSize: 14,
                  fontWeight: 600,
                  color: DS.text,
                }}
              >
                Total
              </span>
              <span
                style={{
                  fontFamily: DS.headingFont,
                  fontSize: 24,
                  fontWeight: 600,
                  color: isFree ? SUCCESS : DS.text,
                }}
              >
                {isFree ? 'Complimentary' : formatSessionPrice(p.priceBreakdown.finalPrice, p.currency)}
              </span>
            </div>
          </div>
        </div>

        {!isFree && (
          <div style={{ padding: 20 }}>
            <div
              style={{
                fontFamily: DS.monoFont,
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: DS.eyebrow,
                marginBottom: 12,
              }}
            >
              Payment Method
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  border:
                    paymentMethod === 'card_on_file'
                      ? `2px solid ${DS.accent}`
                      : `1px solid ${DS.border}`,
                  background: paymentMethod === 'card_on_file' ? DS.cardHover : DS.bg,
                  cursor: 'pointer',
                  transition: DS.transition,
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'card_on_file'}
                  onChange={() => setPaymentMethod('card_on_file')}
                  style={{ accentColor: DS.accent }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: DS.bodyFont,
                      fontSize: 14,
                      fontWeight: 500,
                      color: DS.text,
                    }}
                  >
                    Card on file (Stripe)
                  </div>
                  <div
                    style={{
                      fontFamily: DS.monoFont,
                      fontSize: 12,
                      color: DS.muted,
                    }}
                  >
                    •••• 4242
                  </div>
                </div>
              </label>

              <button
                onClick={() => alert('Add new card — placeholder')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: 12,
                  background: 'transparent',
                  border: `1px dashed ${DS.borderStrong}`,
                  fontFamily: DS.bodyFont,
                  fontSize: 13,
                  color: DS.textSecondary,
                  cursor: 'pointer',
                  transition: DS.transition,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = DS.accent;
                  e.currentTarget.style.color = DS.accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = DS.borderStrong;
                  e.currentTarget.style.color = DS.textSecondary;
                }}
              >
                + Add new card
              </button>
            </div>
          </div>
        )}

        {isFree && (
          <div
            style={{
              padding: 16,
              margin: 20,
              background: `${SUCCESS}10`,
              border: `1px solid ${SUCCESS}33`,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: DS.bodyFont,
                fontSize: 14,
                fontWeight: 600,
                color: SUCCESS,
              }}
            >
              ✓ No payment needed
            </div>
            <div
              style={{
                fontFamily: DS.bodyFont,
                fontSize: 12,
                color: DS.muted,
                marginTop: 4,
              }}
            >
              This session is covered by your complimentary allocation.
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          padding: 14,
          background: DS.bgAlt,
          border: `1px solid ${DS.border}`,
        }}
      >
        <div
          style={{
            fontFamily: DS.monoFont,
            fontSize: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: DS.eyebrow,
            marginBottom: 6,
          }}
        >
          Cancellation Policy
        </div>
        <p
          style={{
            fontFamily: DS.bodyFont,
            fontSize: 12,
            lineHeight: 1.5,
            color: DS.textSecondary,
            margin: 0,
          }}
        >
          Cancel up to {CANCELLATION_FREE_HOURS_BEFORE}h before for full refund · Late cancel = 50% · No-show = 100%
        </p>
      </div>

      <button
        onClick={p.onConfirm}
        disabled={p.submitting}
        style={{
          fontFamily: DS.bodyFont,
          fontSize: 16,
          fontWeight: 600,
          color: p.submitting ? DS.muted : DS.bg,
          background: p.submitting ? DS.bgAlt : DS.accent,
          border: 'none',
          padding: '16px 24px',
          cursor: p.submitting ? 'default' : 'pointer',
          transition: DS.transition,
        }}
        onMouseEnter={(e) => {
          if (!p.submitting) e.currentTarget.style.background = DS.accentDark;
        }}
        onMouseLeave={(e) => {
          if (!p.submitting) e.currentTarget.style.background = DS.accent;
        }}
      >
        {p.submitting
          ? 'Processing...'
          : isFree
            ? 'Confirm Booking'
            : `Confirm & Pay ${formatSessionPrice(p.priceBreakdown.finalPrice, p.currency)}`}
      </button>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
      <span
        style={{
          fontFamily: DS.bodyFont,
          fontSize: 13,
          color: DS.muted,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <div style={{ textAlign: 'right' }}>
        <div
          style={{
            fontFamily: DS.bodyFont,
            fontSize: 14,
            fontWeight: 500,
            color: DS.text,
          }}
        >
          {value}
        </div>
        {sub && (
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: 11,
              color: DS.muted,
              marginTop: 2,
            }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Step 4: Success ────────────────────────────────────────────────── */

interface Step4Props {
  bookingRef: string;
  session: SessionType;
  date: Date;
  time: string;
  onDownloadIcs: () => void;
  onAddGoogleCalendar: () => void;
  onClose?: () => void;
}

function Step4Success(p: Step4Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '24px 0',
        gap: 20,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `${SUCCESS}15`,
          color: SUCCESS,
          fontFamily: DS.headingFont,
          fontSize: 32,
          fontWeight: 700,
        }}
      >
        ✓
      </div>

      <div>
        <h2
          style={{
            fontFamily: DS.headingFont,
            fontSize: 26,
            fontWeight: 600,
            color: DS.text,
            margin: '0 0 6px',
          }}
        >
          Booking confirmed!
        </h2>
        <p
          style={{
            fontFamily: DS.bodyFont,
            fontSize: 14,
            color: DS.muted,
            margin: 0,
          }}
        >
          Reference: <span style={{ fontFamily: DS.monoFont, color: DS.textSecondary }}>#{p.bookingRef}</span>
        </p>
      </div>

      <div
        style={{
          width: '100%',
          padding: 16,
          border: `1px solid ${DS.border}`,
          background: DS.bgAlt,
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: DS.bodyFont, fontSize: 13, color: DS.muted }}>Session</span>
            <span style={{ fontFamily: DS.bodyFont, fontSize: 13, color: DS.text, fontWeight: 500 }}>
              {p.session.displayName}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: DS.bodyFont, fontSize: 13, color: DS.muted }}>Date</span>
            <span style={{ fontFamily: DS.bodyFont, fontSize: 13, color: DS.text }}>
              {formatDateLong(p.date)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: DS.bodyFont, fontSize: 13, color: DS.muted }}>Time</span>
            <span style={{ fontFamily: DS.bodyFont, fontSize: 13, color: DS.text }}>
              {formatTime12h(p.time)} ({p.session.durationMinutes} min)
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
        <button
          onClick={p.onDownloadIcs}
          style={{
            flex: 1,
            minWidth: 160,
            fontFamily: DS.bodyFont,
            fontSize: 14,
            fontWeight: 500,
            color: DS.text,
            background: DS.bg,
            border: `1px solid ${DS.borderStrong}`,
            padding: '12px 16px',
            cursor: 'pointer',
            transition: DS.transition,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = DS.accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = DS.borderStrong;
          }}
        >
          Download .ics
        </button>
        <button
          onClick={p.onAddGoogleCalendar}
          style={{
            flex: 1,
            minWidth: 160,
            fontFamily: DS.bodyFont,
            fontSize: 14,
            fontWeight: 500,
            color: DS.text,
            background: DS.bg,
            border: `1px solid ${DS.borderStrong}`,
            padding: '12px 16px',
            cursor: 'pointer',
            transition: DS.transition,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = DS.accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = DS.borderStrong;
          }}
        >
          Add to Google Calendar
        </button>
      </div>

      {p.onClose && (
        <button
          onClick={p.onClose}
          style={{
            fontFamily: DS.bodyFont,
            fontSize: 14,
            fontWeight: 600,
            color: DS.bg,
            background: DS.bgDark,
            border: 'none',
            padding: '12px 28px',
            cursor: 'pointer',
            transition: DS.transition,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = DS.text;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = DS.bgDark;
          }}
        >
          Done
        </button>
      )}
    </div>
  );
}
