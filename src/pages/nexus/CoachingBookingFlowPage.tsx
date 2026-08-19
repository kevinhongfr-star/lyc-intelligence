import React, { useState } from 'react';
import { V1 } from '@/styles/v1-tokens';

type Step = 1 | 2 | 3 | 4;

interface Coach {
  id: string;
  name: string;
  focus: string;
  sessions: number;
  bio: string;
}

interface SessionType {
  id: string;
  durationLabel: string;
  name: string;
  description: string;
  hours: number;
  price: string;
  recommended?: boolean;
}

const COACHES: Coach[] = [
  {
    id: 'c1',
    name: 'Elena Vasquez',
    focus: 'Executive presence & storytelling',
    sessions: 142,
    bio: 'Former C-suite communications lead. Specializes in keynote preparation, boardroom persuasion, and narrative structure for high-stakes presentations.',
  },
  {
    id: 'c2',
    name: 'Marcus Chen',
    focus: 'Leadership & team dynamics',
    sessions: 98,
    bio: '20-year engineering leadership track. Works with first-time managers and senior leaders on org design, feedback systems, and hiring.',
  },
  {
    id: 'c3',
    name: 'Priya Ramakrishnan',
    focus: 'Career strategy & transitions',
    sessions: 217,
    bio: 'Executive recruiter turned coach. Deep expertise in level changes, cross-functional moves, interview performance, and offer negotiation.',
  },
  {
    id: 'c4',
    name: 'James Whitaker',
    focus: 'Performance & accountability',
    sessions: 84,
    bio: 'Olympic performance consultant turned executive coach. Focuses on operating rhythm, decision-making, and avoiding burnout at senior levels.',
  },
];

const SESSION_TYPES: SessionType[] = [
  {
    id: 's1',
    durationLabel: '30 MIN',
    name: '30-min check-in',
    description: 'Quick pulse, agenda-setting, or answer.',
    hours: 0.5,
    price: '$120',
  },
  {
    id: 's2',
    durationLabel: '60 MIN',
    name: '60-min debrief',
    description: 'Deep-dive on a single readout or topic.',
    hours: 1,
    price: '$240',
    recommended: true,
  },
  {
    id: 's3',
    durationLabel: '90 MIN',
    name: '90-min deep dive',
    description: 'Full strategy session with written notes.',
    hours: 1.5,
    price: '$360',
  },
];

const TIME_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM',
  '1:00 PM', '2:00 PM', '3:00 PM',
  '4:00 PM', '5:00 PM', '6:00 PM',
];

function CoachingBookingFlowPage() {
  const [step, setStep] = useState<Step>(1);
  const [selectedCoach, setSelectedCoach] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>('s2');
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<'hours' | 'card'>('hours');
  const [monthOffset, setMonthOffset] = useState(0);

  const coach = COACHES.find((c) => c.id === selectedCoach) || null;
  const sessionType = SESSION_TYPES.find((s) => s.id === selectedSession) || null;

  const canAdvance = () => {
    if (step === 1) return !!selectedCoach;
    if (step === 2) return !!selectedSession;
    if (step === 3) return !!selectedDate && !!selectedTime;
    return true;
  };

  const advance = () => {
    if (step < 4 && canAdvance()) setStep((step + 1) as Step);
  };
  const back = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  const monthLabels = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
  const displayMonth = monthLabels[monthOffset] || 'Sep';
  const nextMonth = monthLabels[monthOffset + 1] || 'Oct';
  const prevMonth = monthLabels[monthOffset - 1] || 'Aug';

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const buildDays = () => {
    const days: (number | null)[] = [];
    const startOffset = 2;
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= 30; d++) days.push(d);
    while (days.length < 35) days.push(null);
    return days;
  };
  const days = buildDays();

  const progressSteps = [
    { n: 1, label: 'Coach' },
    { n: 2, label: 'Session' },
    { n: 3, label: 'Schedule' },
    { n: 4, label: 'Confirm' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: 32,
        padding: 32,
        background: V1.cream,
        minHeight: '100vh',
        fontFamily: V1.bodyFont,
      }}
    >
      <div style={{ flex: 1, maxWidth: 760 }}>
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: 11,
              letterSpacing: V1.trackingMono,
              textTransform: 'uppercase',
              color: V1.teal600,
              marginBottom: 8,
            }}
          >
            Book a session
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 40 }}>
          {progressSteps.map((s, i) => (
            <React.Fragment key={s.n}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: s.n < 4 ? 0 : 1 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    border: `1px solid ${s.n <= step ? V1.teal800 : V1.ink300}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: V1.monoFont,
                    fontSize: 12,
                    color: s.n <= step ? V1.teal800 : V1.ink400,
                    background: V1.white,
                  }}
                >
                  {s.n}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontFamily: V1.monoFont,
                    fontSize: 10.4,
                    letterSpacing: V1.trackingMono,
                    textTransform: 'uppercase',
                    color: s.n <= step ? V1.ink800 : V1.ink400,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.label}
                </div>
              </div>
              {s.n < 4 && (
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: s.n < step ? V1.teal800 : V1.ink100,
                    marginTop: 12,
                    marginLeft: 12,
                    marginRight: 12,
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {step > 1 && (
          <button
            onClick={back}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: V1.monoFont,
              fontSize: 13,
              color: V1.ink500,
              marginBottom: 16,
            }}
          >
            ← Back
          </button>
        )}

        {step === 1 && (
          <div>
            <h1
              style={{
                fontFamily: V1.displayFont,
                fontSize: 30,
                letterSpacing: V1.trackingTight,
                lineHeight: 1.1,
                color: V1.ink900,
                margin: 0,
              }}
            >
              Select your coach
            </h1>
            <p
              style={{
                fontFamily: V1.displayFont,
                fontStyle: 'italic',
                fontSize: 16,
                color: V1.ink600,
                margin: '8px 0 28px',
              }}
            >
              All coaches are senior partners trained in the NEXUS method.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
              }}
            >
              {COACHES.map((c) => {
                const isSelected = selectedCoach === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCoach(c.id)}
                    style={{
                      border: isSelected ? `2px solid ${V1.teal600}` : `1px solid ${V1.ink200}`,
                      background: isSelected ? V1.teal50 : V1.white,
                      padding: 20,
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    {isSelected && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 12,
                          right: 14,
                          fontFamily: V1.monoFont,
                          color: V1.teal600,
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        ✓
                      </div>
                    )}
                    <div
                      style={{
                        fontFamily: V1.displayFont,
                        fontSize: 20,
                        color: V1.ink900,
                        fontWeight: 600,
                        marginBottom: 6,
                      }}
                    >
                      {c.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span
                        style={{
                          fontFamily: V1.monoFont,
                          fontSize: 11,
                          letterSpacing: V1.trackingMono,
                          textTransform: 'uppercase',
                          color: V1.ink500,
                        }}
                      >
                        Focus
                      </span>
                      <span style={{ fontSize: 13, color: V1.ink700 }}>·</span>
                      <span style={{ fontSize: 14, color: V1.ink700 }}>{c.focus}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span
                        style={{
                          fontFamily: V1.monoFont,
                          fontSize: 11,
                          letterSpacing: V1.trackingMono,
                          textTransform: 'uppercase',
                          color: V1.ink500,
                        }}
                      >
                        {c.sessions}+ sessions
                      </span>
                    </div>
                    <p
                      style={{
                        fontFamily: V1.bodyFont,
                        fontSize: 14,
                        lineHeight: 1.6,
                        color: V1.ink600,
                        margin: 0,
                      }}
                    >
                      {c.bio}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1
              style={{
                fontFamily: V1.displayFont,
                fontSize: 30,
                letterSpacing: V1.trackingTight,
                lineHeight: 1.1,
                color: V1.ink900,
                margin: 0,
              }}
            >
              Choose a session type
            </h1>
            <p
              style={{
                fontFamily: V1.displayFont,
                fontStyle: 'italic',
                fontSize: 16,
                color: V1.ink600,
                margin: '8px 0 28px',
              }}
            >
              Pick the format that best matches what you need today.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {SESSION_TYPES.map((s) => {
                const isSelected = selectedSession === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSession(s.id)}
                    style={{
                      border: isSelected ? `2px solid ${V1.teal600}` : `1px solid ${V1.ink200}`,
                      background: isSelected ? V1.teal50 : V1.white,
                      padding: 20,
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    {isSelected && s.recommended && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 12,
                          right: 14,
                          fontFamily: V1.monoFont,
                          fontSize: 10.4,
                          letterSpacing: V1.trackingMono,
                          textTransform: 'uppercase',
                          background: V1.fuchsia50,
                          color: V1.fuchsia600,
                          padding: '4px 8px',
                        }}
                      >
                        Recommended
                      </div>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 10,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: V1.monoFont,
                          fontSize: 11.2,
                          letterSpacing: V1.trackingMono,
                          textTransform: 'uppercase',
                          background: V1.teal50,
                          color: V1.teal700,
                          padding: '4px 8px',
                        }}
                      >
                        {s.durationLabel}
                      </div>
                      <div
                        style={{
                          fontFamily: V1.displayFont,
                          fontSize: 20,
                          color: V1.ink900,
                          fontWeight: 600,
                        }}
                      >
                        {s.name}
                      </div>
                    </div>
                    <p
                      style={{
                        fontFamily: V1.bodyFont,
                        fontSize: 15,
                        lineHeight: 1.6,
                        color: V1.ink600,
                        margin: '0 0 12px',
                      }}
                    >
                      {s.description}
                    </p>
                    <div
                      style={{
                        textAlign: 'right',
                        fontFamily: V1.monoFont,
                        fontSize: 13,
                        color: V1.ink700,
                      }}
                    >
                      {s.hours} coaching {s.hours === 1 ? 'hour' : 'hours'} · {s.price}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1
              style={{
                fontFamily: V1.displayFont,
                fontSize: 30,
                letterSpacing: V1.trackingTight,
                lineHeight: 1.1,
                color: V1.ink900,
                margin: 0,
              }}
            >
              Pick a date &amp; time
            </h1>
            <p
              style={{
                fontFamily: V1.displayFont,
                fontStyle: 'italic',
                fontSize: 16,
                color: V1.ink600,
                margin: '8px 0 28px',
              }}
            >
              All times shown in your local timezone.
            </p>

            <div
              style={{
                border: `1px solid ${V1.ink100}`,
                background: V1.white,
                padding: 16,
                marginBottom: 28,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <button
                  onClick={() => setMonthOffset(Math.max(0, monthOffset - 1))}
                  disabled={monthOffset === 0}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: monthOffset === 0 ? 'default' : 'pointer',
                    fontFamily: V1.monoFont,
                    fontSize: 13,
                    color: monthOffset === 0 ? V1.ink300 : V1.ink700,
                    opacity: monthOffset === 0 ? 0.5 : 1,
                  }}
                >
                  ← {prevMonth}
                </button>
                <div
                  style={{
                    fontFamily: V1.displayFont,
                    fontSize: 18,
                    color: V1.ink900,
                    fontWeight: 600,
                  }}
                >
                  {displayMonth} 2026
                </div>
                <button
                  onClick={() => setMonthOffset(monthOffset + 1)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontFamily: V1.monoFont,
                    fontSize: 13,
                    color: V1.ink700,
                  }}
                >
                  {nextMonth} →
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 4,
                  marginBottom: 8,
                }}
              >
                {dayLabels.map((d) => (
                  <div
                    key={d}
                    style={{
                      fontFamily: V1.monoFont,
                      fontSize: 10.4,
                      letterSpacing: V1.trackingMono,
                      textTransform: 'uppercase',
                      textAlign: 'center',
                      padding: '8px 0',
                      color: V1.ink400,
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 4,
                }}
              >
                {days.map((d, i) => {
                  if (d === null) return <div key={i} />;
                  const isAvailable = d <= 28 && d !== 6 && d !== 13 && d !== 20;
                  const isToday = d === 19 && monthOffset === 0;
                  const isSelected = selectedDate === d;
                  const dayOfWeek = (i - 2 + 7) % 7;
                  const isWeekend = dayOfWeek >= 5;
                  return (
                    <button
                      key={i}
                      onClick={() => isAvailable && setSelectedDate(d)}
                      disabled={!isAvailable}
                      style={{
                        width: 40,
                        height: 40,
                        border: `1px solid ${isSelected ? V1.teal600 : V1.ink100}`,
                        background: isSelected ? V1.teal600 : V1.white,
                        color: isSelected
                          ? V1.white
                          : !isAvailable
                            ? V1.ink300
                            : isToday
                              ? V1.teal700
                              : isWeekend
                                ? V1.ink500
                                : V1.ink900,
                        fontFamily: V1.bodyFont,
                        fontSize: 14,
                        cursor: isAvailable ? 'pointer' : 'default',
                        fontWeight: isToday ? 600 : 400,
                      }}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                fontFamily: V1.monoFont,
                fontSize: 11.2,
                letterSpacing: V1.trackingMono,
                textTransform: 'uppercase',
                color: V1.ink500,
                marginBottom: 12,
              }}
            >
              Available times
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
              }}
            >
              {TIME_SLOTS.map((t) => {
                const isSelected = selectedTime === t;
                return (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    style={{
                      padding: '10px 12px',
                      border: `1px solid ${isSelected ? V1.teal600 : V1.ink200}`,
                      background: isSelected ? V1.teal50 : V1.white,
                      color: isSelected ? V1.teal900 : V1.ink700,
                      fontFamily: V1.monoFont,
                      fontSize: 13,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h1
              style={{
                fontFamily: V1.displayFont,
                fontSize: 30,
                letterSpacing: V1.trackingTight,
                lineHeight: 1.1,
                color: V1.ink900,
                margin: 0,
              }}
            >
              Confirm your session
            </h1>
            <p
              style={{
                fontFamily: V1.displayFont,
                fontStyle: 'italic',
                fontSize: 16,
                color: V1.ink600,
                margin: '8px 0 28px',
              }}
            >
              Review the details below then confirm to book.
            </p>

            <div
              style={{
                border: `1px solid ${V1.ink200}`,
                background: V1.white,
                padding: 24,
                marginBottom: 28,
              }}
            >
              {[
                { label: 'Coach', value: coach?.name || '—' },
                { label: 'Session type', value: sessionType?.name || '—' },
                { label: 'Duration', value: sessionType ? `${sessionType.hours} hr` : '—' },
                { label: 'Date', value: selectedDate ? `${displayMonth} ${selectedDate}, 2026` : '—' },
                { label: 'Time', value: selectedTime || '—' },
                { label: 'Timezone', value: 'Local (EST)' },
              ].map((row, i, arr) => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: i < arr.length - 1 ? `1px solid ${V1.ink100}` : 'none',
                  }}
                >
                  <div
                    style={{
                      fontFamily: V1.monoFont,
                      fontSize: 11,
                      letterSpacing: V1.trackingMono,
                      textTransform: 'uppercase',
                      color: V1.ink400,
                    }}
                  >
                    {row.label}
                  </div>
                  <div style={{ color: V1.ink900, fontSize: 15, fontWeight: 500 }}>
                    {row.value}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                fontFamily: V1.displayFont,
                fontSize: 20,
                color: V1.ink900,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              Payment method
            </div>

            <div
              style={{
                border: `1px solid ${V1.ink200}`,
                background: V1.white,
              }}
            >
              <div
                onClick={() => setPaymentMode('hours')}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: 16,
                  borderBottom: `1px solid ${V1.ink100}`,
                  cursor: 'pointer',
                  background: paymentMode === 'hours' ? V1.teal50 : 'transparent',
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    border: `1px solid ${paymentMode === 'hours' ? V1.teal600 : V1.ink300}`,
                    borderRadius: 9,
                    marginTop: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {paymentMode === 'hours' && (
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        background: V1.teal600,
                        borderRadius: 5,
                      }}
                    />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, color: V1.ink900, fontWeight: 500 }}>Use coaching hours</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                    <div style={{ fontFamily: V1.monoFont, fontSize: 12, color: V1.ink500 }}>3 hrs remaining</div>
                    <div style={{ fontFamily: V1.monoFont, fontSize: 12, color: V1.teal700 }}>
                      This session uses {sessionType?.hours || 1} hr
                    </div>
                  </div>
                </div>
              </div>
              <div
                onClick={() => setPaymentMode('card')}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: 16,
                  cursor: 'pointer',
                  background: paymentMode === 'card' ? V1.teal50 : 'transparent',
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    border: `1px solid ${paymentMode === 'card' ? V1.teal600 : V1.ink300}`,
                    borderRadius: 9,
                    marginTop: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {paymentMode === 'card' && (
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        background: V1.teal600,
                        borderRadius: 5,
                      }}
                    />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, color: V1.ink900, fontWeight: 500 }}>Pay separately</div>
                  <div style={{ fontFamily: V1.monoFont, fontSize: 12, color: V1.ink500, marginTop: 4 }}>
                    {sessionType?.price || '$240'} · card on file · •••• 4242, exp 08/28
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => alert('Booking confirmed!')}
              style={{
                width: '100%',
                marginTop: 28,
                padding: '16px 20px',
                background: V1.fuchsia600,
                color: V1.white,
                border: 'none',
                cursor: 'pointer',
                fontFamily: V1.monoFont,
                fontSize: 12.8,
                letterSpacing: V1.trackingMono,
                textTransform: 'uppercase',
                fontWeight: 500,
              }}
            >
              Confirm booking →
            </button>
            <p
              style={{
                fontFamily: V1.displayFont,
                fontStyle: 'italic',
                fontSize: 14,
                color: V1.ink500,
                textAlign: 'center',
                marginTop: 12,
                margin: '12px 0 0',
              }}
            >
              You can cancel up to 24 hours before your session.
            </p>
          </div>
        )}

        {step < 4 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 40,
            }}
          >
            <div style={{ minWidth: 120 }}>
              {step > 1 && (
                <button
                  onClick={back}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontFamily: V1.monoFont,
                    fontSize: 13,
                    color: V1.ink500,
                  }}
                >
                  ← Back
                </button>
              )}
            </div>
            <button
              onClick={advance}
              disabled={!canAdvance()}
              style={{
                padding: '14px 24px',
                background: canAdvance() ? V1.teal800 : V1.ink200,
                color: canAdvance() ? V1.white : V1.ink400,
                border: 'none',
                cursor: canAdvance() ? 'pointer' : 'default',
                fontFamily: V1.monoFont,
                fontSize: 12.8,
                letterSpacing: V1.trackingMono,
                textTransform: 'uppercase',
                fontWeight: 500,
                opacity: canAdvance() ? 1 : 0.7,
              }}
            >
              Continue →
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          width: 280,
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          padding: 24,
          borderLeft: `1px solid ${V1.ink100}`,
          alignSelf: 'flex-start',
          height: 'fit-content',
        }}
      >
        <div
          style={{
            border: `1px solid ${V1.ink200}`,
            background: V1.white,
            padding: 20,
          }}
        >
          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: 11,
              letterSpacing: V1.trackingMono,
              textTransform: 'uppercase',
              color: V1.teal600,
              marginBottom: 16,
            }}
          >
            Session summary
          </div>

          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontFamily: V1.displayFont,
                fontSize: 18,
                color: V1.ink900,
                fontWeight: 600,
              }}
            >
              {coach?.name || 'Coach not selected'}
            </div>
            {coach && (
              <div style={{ fontSize: 13, color: V1.ink500, marginTop: 2 }}>
                {coach.focus}
              </div>
            )}
          </div>

          {sessionType && (
            <div style={{ fontSize: 14, color: V1.ink700, marginBottom: 4 }}>
              {sessionType.name} · {sessionType.hours} hr
            </div>
          )}

          {(selectedDate || selectedTime) && (
            <div style={{ fontSize: 14, color: V1.ink700, marginBottom: 4 }}>
              {selectedDate ? `${displayMonth} ${selectedDate}` : ''}
              {selectedTime ? ` · ${selectedTime}` : ''}
            </div>
          )}

          <div
            style={{
              height: 1,
              background: V1.ink100,
              margin: '16px 0',
            }}
          />

          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: 11,
              letterSpacing: V1.trackingMono,
              textTransform: 'uppercase',
              color: V1.ink400,
              marginBottom: 6,
            }}
          >
            Cost
          </div>
          <div
            style={{
              fontFamily: V1.displayFont,
              fontSize: 24,
              color: V1.ink900,
              fontWeight: 600,
              lineHeight: 1.1,
            }}
          >
            {sessionType ? `${sessionType.hours} coaching hour${sessionType.hours !== 1 ? 's' : ''}` : '—'}
          </div>
          <div style={{ fontFamily: V1.monoFont, fontSize: 12, color: V1.ink500, marginTop: 4 }}>
            {sessionType?.price || ''}
          </div>

          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: 11,
              letterSpacing: V1.trackingMono,
              textTransform: 'uppercase',
              color: V1.ink400,
              marginTop: 16,
              marginBottom: 6,
            }}
          >
            Your balance
          </div>
          <div style={{ fontSize: 14, color: V1.ink700 }}>
            4 hrs remaining
          </div>

          <div
            style={{
              height: 1,
              background: V1.ink100,
              margin: '16px 0',
            }}
          />

          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: 10.4,
              letterSpacing: '0.06em',
              lineHeight: 1.5,
              color: V1.ink500,
            }}
          >
            Free cancellation up to 24hrs before. Late cancellations forfeit the session.
          </div>
        </div>
      </div>
    </div>
  );
}

export default CoachingBookingFlowPage;
