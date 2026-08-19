import React from 'react';
import { V1 } from '@/styles/v1-tokens';

interface SessionType {
  id: string;
  code: string;
  name: string;
  description: string;
  duration: string;
  format: string;
  deliverable: string;
  price: string;
}

interface HowItWorksStep {
  num: string;
  title: string;
  body: string;
}

const SESSIONS: SessionType[] = [
  {
    id: 's1',
    code: 'SESSION 01',
    name: 'Board prep session',
    description:
      'Prepare for an upcoming board meeting with structured talking points, Q&A rehearsal, and narrative tuning.',
    duration: '120 min',
    format: 'Video call',
    deliverable: 'Written summary',
    price: '$1,800',
  },
  {
    id: 's2',
    code: 'SESSION 02',
    name: 'Stakeholder strategy session',
    description:
      'Map key stakeholders, identify pressure points, and design a communication sequencing plan.',
    duration: '90 min',
    format: 'Video call',
    deliverable: 'Written summary',
    price: '$1,200',
  },
  {
    id: 's3',
    code: 'SESSION 03',
    name: 'Restructuring / org design session',
    description:
      'Work through reorg options, team topology, and transition risk mapping.',
    duration: '120 min',
    format: 'Video call',
    deliverable: 'Written summary',
    price: '$1,800',
  },
  {
    id: 's4',
    code: 'SESSION 04',
    name: 'Career transition advisory',
    description:
      'Executive-level career review, positioning for next role, and search strategy design.',
    duration: '90 min',
    format: 'Video call',
    deliverable: 'Written summary',
    price: '$1,200',
  },
];

const STEPS: HowItWorksStep[] = [
  {
    num: '01',
    title: 'Request',
    body:
      "Choose the session type that fits the moment, submit a short brief about what you're working on, and we'll confirm within one business day.",
  },
  {
    num: '02',
    title: 'Match',
    body:
      "Based on your context, sector, and stage, a LYC senior partner is assigned to your session \u2014 typically within 48 hours of request.",
  },
  {
    num: '03',
    title: 'Session',
    body:
      "90\u2013120 minutes structured working session, followed within 3 business days by a written summary with decisions, next steps, and owners.",
  },
];

export default function AdvisorySessionsPage() {
  return (
    <div style={{ minHeight: '100vh', background: V1.bg }}>
      <div
        style={{
          display: 'flex',
          gap: 32,
          maxWidth: V1.shellMax,
          margin: '0 auto',
          width: '100%',
          padding: `${V1.shellPad}px 0`,
        }}
      >
        {/* MAIN */}
        <main
          style={{
            flex: 1,
            maxWidth: 820,
            width: '100%',
          }}
        >
          {/* Page header */}
          <div style={{ marginBottom: 0 }}>
            <div
              style={{
                fontFamily: V1.monoFont,
                fontSize: 11.2,
                textTransform: 'uppercase',
                letterSpacing: V1.trackingMono,
                color: V1.fuchsia600,
                marginBottom: 8,
              }}
            >
              Human layer
            </div>
            <h1
              style={{
                fontFamily: V1.displayFont,
                fontSize: 48,
                lineHeight: V1.leadingDisplay,
                letterSpacing: V1.trackingTight,
                color: V1.ink900,
                fontWeight: V1.fwRegular,
                margin: '0 0 12px',
              }}
            >
              Advisory sessions
            </h1>
            <p
              style={{
                fontFamily: V1.displayFont,
                fontStyle: 'italic',
                fontSize: 20,
                lineHeight: 1.5,
                color: V1.ink600,
                margin: 0,
                maxWidth: 640,
              }}
            >
              Higher-touch structured sessions for high-stakes moments. Led by
              LYC senior partners.
            </p>
          </div>

          <hr
            style={{
              border: 'none',
              borderTop: `1px solid ${V1.ink100}`,
              margin: '40px 0',
            }}
          />

          {/* Section: Session types */}
          <section style={{ marginBottom: 0 }}>
            <div
              style={{
                fontFamily: V1.monoFont,
                fontSize: 11.2,
                textTransform: 'uppercase',
                letterSpacing: V1.trackingMono,
                color: V1.ink400,
                marginBottom: 12,
              }}
            >
              Session types
            </div>
            <h2
              style={{
                fontFamily: V1.displayFont,
                fontSize: 30,
                lineHeight: V1.leadingHeading,
                color: V1.ink900,
                fontWeight: V1.fwRegular,
                margin: '0 0 24px',
              }}
            >
              Four ways to work with a senior partner.
            </h2>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {SESSIONS.map((s) => (
                <div
                  key={s.id}
                  style={{
                    border: `1px solid ${V1.ink200}`,
                    padding: 28,
                    borderRadius: V1.radius,
                    boxShadow: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 24,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'inline-block',
                        fontFamily: V1.monoFont,
                        fontSize: 11.2,
                        textTransform: 'uppercase',
                        letterSpacing: V1.trackingMono,
                        color: V1.fuchsia600,
                        borderBottom: `1px solid ${V1.fuchsia600}`,
                        paddingBottom: 2,
                        marginBottom: 12,
                      }}
                    >
                      {s.code}
                    </div>
                    <div
                      style={{
                        fontFamily: V1.displayFont,
                        fontSize: 24,
                        fontWeight: V1.fwBold,
                        color: V1.ink900,
                        lineHeight: 1.25,
                        marginBottom: 10,
                      }}
                    >
                      {s.name}
                    </div>
                    <p
                      style={{
                        fontFamily: V1.bodyFont,
                        fontSize: 16,
                        lineHeight: V1.leadingBody,
                        color: V1.ink700,
                        margin: '0 0 16px',
                      }}
                    >
                      {s.description}
                    </p>
                    <div
                      style={{
                        fontFamily: V1.monoFont,
                        fontSize: 11.2,
                        textTransform: 'uppercase',
                        letterSpacing: V1.trackingMono,
                        color: V1.ink500,
                      }}
                    >
                      Duration \u00b7 {s.duration}
                      {' '}\u2022{' '}
                      Format \u00b7 {s.format}
                      {' '}\u2022{' '}
                      Deliverable \u00b7 {s.deliverable}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <div
                      style={{
                        fontFamily: V1.displayFont,
                        fontSize: 32,
                        lineHeight: 1,
                        color: V1.ink900,
                        fontWeight: V1.fwRegular,
                        letterSpacing: V1.trackingTight,
                        marginBottom: 12,
                      }}
                    >
                      {s.price}
                    </div>
                    <button
                      type="button"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        color: V1.teal600,
                        fontFamily: V1.monoFont,
                        fontSize: 11.2,
                        textTransform: 'uppercase',
                        letterSpacing: V1.trackingMono,
                        cursor: 'pointer',
                        transition: `color ${V1.durFast}ms ${V1.ease}`,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = V1.teal800)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = V1.teal600)
                      }
                    >
                      Select \u2192
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <hr
            style={{
              border: 'none',
              borderTop: `1px solid ${V1.ink100}`,
              margin: '40px 0',
            }}
          />

          {/* Section: How it works */}
          <section style={{ marginBottom: 0 }}>
            <div
              style={{
                fontFamily: V1.monoFont,
                fontSize: 11.2,
                textTransform: 'uppercase',
                letterSpacing: V1.trackingMono,
                color: V1.ink400,
                marginBottom: 12,
              }}
            >
              How it works
            </div>
            <h2
              style={{
                fontFamily: V1.displayFont,
                fontSize: 30,
                lineHeight: V1.leadingHeading,
                color: V1.ink900,
                fontWeight: V1.fwRegular,
                margin: '0 0 24px',
              }}
            >
              Three steps from request to deliverable.
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {STEPS.map((step, i) => (
                <div
                  key={step.num}
                  style={{
                    padding: '24px 0',
                    borderTop:
                      i > 0 ? `1px solid ${V1.ink100}` : 'none',
                    display: 'flex',
                    gap: 20,
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      border: `1px solid ${V1.teal600}`,
                      borderRadius: V1.radiusFull,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontFamily: V1.monoFont,
                      fontSize: 12,
                      color: V1.teal600,
                      letterSpacing: V1.trackingMono,
                    }}
                  >
                    {step.num}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: V1.displayFont,
                        fontSize: 20,
                        fontWeight: V1.fwSemibold,
                        color: V1.ink900,
                        lineHeight: 1.3,
                        marginBottom: 6,
                      }}
                    >
                      {step.title}
                    </div>
                    <p
                      style={{
                        fontFamily: V1.bodyFont,
                        fontSize: 15,
                        lineHeight: V1.leadingBody,
                        color: V1.ink600,
                        margin: 0,
                      }}
                    >
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <hr
            style={{
              border: 'none',
              borderTop: `1px solid ${V1.ink100}`,
              margin: '40px 0',
            }}
          />

          {/* CTA section */}
          <section
            style={{
              border: `1px solid ${V1.ink200}`,
              padding: 32,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: V1.displayFont,
                fontSize: 28,
                fontWeight: V1.fwSemibold,
                color: V1.ink900,
                lineHeight: 1.25,
                marginBottom: 10,
              }}
            >
              Ready to book an advisory session?
            </div>
            <p
              style={{
                fontFamily: V1.displayFont,
                fontStyle: 'italic',
                fontSize: 18,
                lineHeight: 1.5,
                color: V1.ink600,
                margin: '0 0 24px',
              }}
            >
              Tell us what you're working on and we'll match you with the right
              partner.
            </p>
            <button
              type="button"
              style={{
                background: V1.fuchsia600,
                color: V1.white,
                fontFamily: V1.monoFont,
                fontSize: 11.2,
                textTransform: 'uppercase',
                letterSpacing: V1.trackingMono,
                padding: '16px 32px',
                border: 'none',
                borderRadius: V1.radius,
                cursor: 'pointer',
                boxShadow: 'none',
                transition: `background ${V1.durFast}ms ${V1.ease}`,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = V1.fuchsia700)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = V1.fuchsia600)
              }
            >
              Book an advisory session \u2192
            </button>
          </section>
        </main>

        {/* RIGHT RAIL */}
        <aside
          style={{
            width: 280,
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            padding: 24,
            borderLeft: `1px solid ${V1.ink200}`,
            alignSelf: 'flex-start',
          }}
        >
          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: 11.2,
              textTransform: 'uppercase',
              letterSpacing: V1.trackingMono,
              color: V1.fuchsia600,
              marginBottom: 10,
            }}
          >
            How advisory is different
          </div>
          <p
            style={{
              fontFamily: V1.bodyFont,
              fontSize: 14,
              lineHeight: V1.leadingBody,
              color: V1.ink700,
              margin: '0 0 12px',
            }}
          >
            <strong>Coaching</strong> is an ongoing monthly relationship. Your
            coach is embedded in your development, tracks weekly progress, and
            builds a multi-quarter arc.
          </p>
          <p
            style={{
              fontFamily: V1.bodyFont,
              fontSize: 14,
              lineHeight: V1.leadingBody,
              color: V1.ink700,
              margin: 0,
            }}
          >
            <strong>Advisory sessions</strong> are one-off, high-structure
            engagements. You pick a specific moment, we match a partner with
            deep expertise in that exact kind of problem, and you walk out with
            a written deliverable.
          </p>

          <hr
            style={{
              border: 'none',
              borderTop: `1px solid ${V1.ink100}`,
              margin: '24px 0',
            }}
          />

          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: 11.2,
              textTransform: 'uppercase',
              letterSpacing: V1.trackingMono,
              color: V1.ink400,
              marginBottom: 8,
            }}
          >
            Pricing
          </div>
          <div
            style={{
              fontFamily: V1.displayFont,
              fontSize: 24,
              color: V1.ink900,
              lineHeight: 1.2,
              marginBottom: 4,
            }}
          >
            $1,200+ starting
          </div>
          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: 11.2,
              textTransform: 'uppercase',
              letterSpacing: V1.trackingMono,
              color: V1.ink500,
            }}
          >
            Fixed price per session
          </div>

          <hr
            style={{
              border: 'none',
              borderTop: `1px solid ${V1.ink100}`,
              margin: '24px 0',
            }}
          />

          <button
            type="button"
            style={{
              width: '100%',
              background: V1.fuchsia600,
              color: V1.white,
              fontFamily: V1.monoFont,
              fontSize: 11.2,
              textTransform: 'uppercase',
              letterSpacing: V1.trackingMono,
              padding: '14px 20px',
              border: 'none',
              borderRadius: V1.radius,
              cursor: 'pointer',
              boxShadow: 'none',
              margin: '16px 0',
              transition: `background ${V1.durFast}ms ${V1.ease}`,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = V1.fuchsia700)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = V1.fuchsia600)
            }
          >
            Request a session \u2192
          </button>

          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: 11.2,
              textTransform: 'uppercase',
              letterSpacing: V1.trackingMono,
              color: V1.ink400,
              marginBottom: 8,
            }}
          >
            Availability
          </div>
          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: 11.2,
              textTransform: 'uppercase',
              letterSpacing: V1.trackingMono,
              color: V1.ink600,
            }}
          >
            Typically within 2 weeks of request
          </div>
        </aside>
      </div>
    </div>
  );
}
