import React from 'react';
import { V1 } from '@/styles/v1-tokens';

interface IncludedItem {
  num: string;
  title: string;
  body: string;
}

interface HowItWorksStep {
  num: string;
  title: string;
  body: string;
}

const INCLUDED: IncludedItem[] = [
  {
    num: '01',
    title: 'Full synthesis of all your NEXUS data',
    body:
      "Every readout, milestone update, coaching note, and NEXUS conversation you've had this quarter \u2014 pulled together into one coherent picture, not a set of disconnected fragments.",
  },
  {
    num: '02',
    title: '90-minute debrief with a senior partner',
    body:
      "A structured agenda, recorded session, and a senior partner who has genuinely read your file \u2014 not a template. Expect discussion, not a presentation.",
  },
  {
    num: '03',
    title: 'Written review document',
    body:
      "A 15\u201320 page Q-review in board-ready format. Three sections: what happened, what it means, what to do next. Designed to be shared as-is.",
  },
  {
    num: '04',
    title: '90-day action plan',
    body:
      "A prioritized sequence of 6\u201310 moves for the quarter ahead, with owners, timelines, and concrete success metrics. Not vague \u201creflect more\u201d advice.",
  },
  {
    num: '05',
    title: 'Board-ready format',
    body:
      "Typography, structure, and tone designed to be shared directly with your board or chair. No reformatting needed. Includes a one-page executive version.",
  },
];

const STEPS: HowItWorksStep[] = [
  {
    num: '01',
    title: 'Request',
    body:
      "You request a quarterly review. We schedule a 30-minute kickoff call within 7 days to confirm scope, stakeholdership, and any themes you want emphasized.",
  },
  {
    num: '02',
    title: 'Deep review window (10 days)',
    body:
      "Our senior partner team synthesizes your readouts, coaching notes, milestones, and conversation history. Early drafts circulate internally for quality review before you see anything.",
  },
  {
    num: '03',
    title: 'Debrief session + written delivery',
    body:
      "90-minute debrief with your assigned partner, followed within 3 business days by the written Q-review document and 90-day action plan in your NEXUS files.",
  },
];

export default function QuarterlyDeepReviewPage() {
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
                marginBottom: 12,
              }}
            >
              Premium
            </div>
            <h1
              style={{
                fontFamily: V1.displayFont,
                fontSize: 60,
                lineHeight: V1.leadingDisplay,
                letterSpacing: V1.trackingTight,
                color: V1.ink900,
                fontWeight: V1.fwRegular,
                margin: '32px 0',
              }}
            >
              Quarterly Deep Review
            </h1>
            <p
              style={{
                fontFamily: V1.displayFont,
                fontStyle: 'italic',
                fontSize: 22,
                lineHeight: 1.5,
                color: V1.ink600,
                margin: 0,
                maxWidth: 720,
              }}
            >
              A full synthesis. A senior partner. A written review. Every 90
              days.
            </p>
          </div>

          <hr
            style={{
              border: 'none',
              borderTop: `1px solid ${V1.ink100}`,
              margin: '64px 0',
            }}
          />

          {/* Section: What's included */}
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
              What's included
            </div>
            <h2
              style={{
                fontFamily: V1.displayFont,
                fontSize: 36,
                lineHeight: V1.leadingHeading,
                color: V1.ink900,
                fontWeight: V1.fwRegular,
                margin: '0',
                padding: '24px 0',
              }}
            >
              Five parts. Every quarter.
            </h2>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {INCLUDED.map((item) => (
                <div
                  key={item.num}
                  style={{
                    border: `1px solid ${V1.ink100}`,
                    padding: 28,
                  }}
                >
                  <div
                    style={{
                      fontFamily: V1.monoFont,
                      fontSize: 11.2,
                      textTransform: 'uppercase',
                      letterSpacing: V1.trackingMono,
                      color: V1.teal600,
                      marginBottom: 8,
                    }}
                  >
                    {item.num}
                  </div>
                  <div
                    style={{
                      fontFamily: V1.displayFont,
                      fontSize: 22,
                      fontWeight: V1.fwBold,
                      color: V1.ink900,
                      lineHeight: 1.25,
                      marginBottom: 8,
                    }}
                  >
                    {item.title}
                  </div>
                  <p
                    style={{
                      fontFamily: V1.bodyFont,
                      fontSize: 15,
                      lineHeight: V1.leadingBody,
                      color: V1.ink700,
                      margin: 0,
                    }}
                  >
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <hr
            style={{
              border: 'none',
              borderTop: `1px solid ${V1.ink100}`,
              margin: '64px 0',
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
              Three steps. Two weeks. One review.
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
              margin: '64px 0',
            }}
          />

          {/* Pricing section */}
          <section
            style={{
              border: `2px solid ${V1.fuchsia600}`,
              padding: 48,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: V1.monoFont,
                fontSize: 11.2,
                textTransform: 'uppercase',
                letterSpacing: V1.trackingMono,
                color: V1.fuchsia600,
                marginBottom: 16,
              }}
            >
              QUARTERLY DEEP REVIEW
            </div>
            <div
              style={{
                fontFamily: V1.displayFont,
                fontSize: 44,
                lineHeight: 1.1,
                letterSpacing: V1.trackingTight,
                color: V1.ink900,
                fontWeight: V1.fwRegular,
                marginBottom: 10,
              }}
            >
              $3,500 / quarter
            </div>
            <div
              style={{
                fontFamily: V1.monoFont,
                fontSize: 11.2,
                textTransform: 'uppercase',
                letterSpacing: V1.trackingMono,
                color: V1.ink500,
                marginBottom: 32,
              }}
            >
              Billed quarterly \u00b7 Cancel anytime
            </div>
            <div style={{ margin: '32px 0' }}>
              <button
                type="button"
                style={{
                  width: 320,
                  maxWidth: '100%',
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
                  margin: '0 auto',
                  display: 'block',
                  transition: `background ${V1.durFast}ms ${V1.ease}`,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = V1.fuchsia700)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = V1.fuchsia600)
                }
              >
                Request a quarterly review \u2192
              </button>
            </div>
            <p
              style={{
                fontFamily: V1.bodyFont,
                fontStyle: 'italic',
                fontSize: 14,
                lineHeight: 1.5,
                color: V1.ink500,
                margin: 0,
              }}
            >
              For Council tier members and above. Executive tier by request.
            </p>
          </section>

          {/* Enterprise link */}
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <button
              type="button"
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                color: V1.ink700,
                fontFamily: V1.monoFont,
                fontSize: 11.2,
                textTransform: 'uppercase',
                letterSpacing: V1.trackingMono,
                cursor: 'pointer',
                transition: `color ${V1.durFast}ms ${V1.ease}`,
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = V1.fuchsia600)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = V1.ink700)
              }
            >
              Talk to us about enterprise pricing \u2192
            </button>
          </div>
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
              marginBottom: 14,
            }}
          >
            For senior leaders
          </div>
          <div
            style={{
              fontFamily: V1.displayFont,
              fontSize: 22,
              lineHeight: 1.3,
              color: V1.ink900,
              fontWeight: V1.fwSemibold,
              marginBottom: 10,
            }}
          >
            Built for executives leading through transition.
          </div>
          <p
            style={{
              fontFamily: V1.bodyFont,
              fontStyle: 'italic',
              fontSize: 14,
              lineHeight: 1.5,
              color: V1.ink600,
              margin: 0,
            }}
          >
            Reorgs, fundraises, market entries, executive transitions \u2014
            the Quarterly Deep Review is designed to give you a structured
            checkpoint when the stakes are highest and the fog is thickest.
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
            What tier
          </div>
          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: 11.2,
              textTransform: 'uppercase',
              letterSpacing: V1.trackingMono,
              color: V1.ink700,
            }}
          >
            Council + Executive by request
          </div>

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
              marginBottom: 10,
            }}
          >
            Lead partner
          </div>
          <p
            style={{
              fontFamily: V1.displayFont,
              fontStyle: 'italic',
              fontSize: 18,
              lineHeight: 1.5,
              color: V1.ink700,
              margin: 0,
            }}
          >
            Assigned from our senior partner team based on your context.
          </p>

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
            Talk to us \u2192
          </button>
        </aside>
      </div>
    </div>
  );
}
