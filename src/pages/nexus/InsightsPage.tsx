import React from 'react';
import { V1 } from '@/styles/v1-tokens';

interface Observation {
  id: string;
  text: string;
  source: 'Readout' | 'Conversation';
  date: string;
  severity: 'High' | 'Medium' | 'Low';
}

interface Pattern {
  id: string;
  label: string;
  color: 'teal' | 'fuchsia' | 'ink';
  title: string;
  body: string;
}

interface MilestoneObservation {
  id: string;
  name: string;
  insight: string;
  status: 'On track' | 'At risk';
}

const OBSERVATIONS: Observation[] = [
  {
    id: 'o1',
    text: "Your executive presence scores 2.3\u03c3 higher in written communication than verbal delivery \u2014 a coaching session on voice modulation could close the gap.",
    source: 'Readout',
    date: 'Aug 14, 2026',
    severity: 'High',
  },
  {
    id: 'o2',
    text: "Across 3 lenses, your Decision Speed dimension consistently correlates with faster milestone completion \u2014 +34% on average.",
    source: 'Readout',
    date: 'Aug 12, 2026',
    severity: 'Medium',
  },
  {
    id: 'o3',
    text: "We haven't talked about your China market strategy in 6 weeks. The CPI readout flagged 3 priority actions that are still open.",
    source: 'Conversation',
    date: 'Aug 8, 2026',
    severity: 'High',
  },
  {
    id: 'o4',
    text: "Your last 2 milestone updates reference 'stakeholder alignment' as a blocker. MOSAIC lens is designed for this.",
    source: 'Conversation',
    date: 'Aug 5, 2026',
    severity: 'Low',
  },
];

const PATTERNS: Pattern[] = [
  {
    id: 'p1',
    label: 'PATTERN 01',
    color: 'teal',
    title: 'Cross-lens consistency',
    body: "Your scores on Decision Quality, Strategic Clarity, and Narrative Strength hold within a tight band (\u00b18%) across all five lenses you've completed so far. This suggests these are stable strengths rather than context-dependent.",
  },
  {
    id: 'p2',
    label: 'PATTERN 02',
    color: 'teal',
    title: 'High-low gap dimensions',
    body: "The widest spread in your profile is Written Presence (91st) versus Live Room Presence (43rd) \u2014 a 48-point gap. Most executives in your cohort cluster within 25 points, making this a notable asymmetry worth targeting.",
  },
  {
    id: 'p3',
    label: 'PATTERN 03',
    color: 'teal',
    title: 'Situation blind spots',
    body: "Your lowest-scoring scenarios consistently involve high-ambiguity settings without structured data: board debates in open Q&A, impromptu all-hands questions, and open-ended negotiation. Scripted contexts score strongly.",
  },
  {
    id: 'p4',
    label: 'PATTERN 04',
    color: 'fuchsia',
    title: 'Stakeholder mapping drift',
    body: "You tend to re-prioritize stakeholders more frequently than baseline \u2014 2.4x per quarter vs. 1.1x cohort median. Some churn is strategic; the pattern here suggests you may benefit from a formal RACI cadence.",
  },
  {
    id: 'p5',
    label: 'PATTERN 05',
    color: 'ink',
    title: 'Energy curve alignment',
    body: "Your milestone completion rate is 62% higher when tasks land in your morning window (9\u201311am) vs. afternoon (3\u20135pm). Simple shift: block morning time for high-consequence work.",
  },
  {
    id: 'p6',
    label: 'PATTERN 06',
    color: 'ink',
    title: 'Feedback intake timing',
    body: "When you receive coaching notes within 48 hours of a session, your follow-through is about 70%. After 7 days it drops to 28%. Booking a short sync the day after sessions would materially improve adoption.",
  },
];

const MILESTONES: MilestoneObservation[] = [
  {
    id: 'm1',
    name: 'Q3 \u2014 Launch Singapore GM transition',
    insight: "The handover plan looks solid on paper, but MOSAIC flagged that the Singapore team expects a more consultative decision style than your default. A short calibration conversation before the announcement would reduce friction.",
    status: 'At risk',
  },
  {
    id: 'm2',
    name: 'Q3 \u2014 Close Series B extension',
    insight: "Your investor update narrative has improved sharply since the last cycle \u2014 the board readout rated it 82nd percentile. The gap: your Q&A rehearsal score was still in the 40s. One prep session before the close.",
    status: 'On track',
  },
  {
    id: 'm3',
    name: 'Q4 \u2014 Stand up AI governance model',
    insight: "Three of your lens readouts (SPARK, FORGE, CPI) independently flag this as the single most consequential structural move you can make this half. The governance playbook has a worked model you can adapt if you want a starting point.",
    status: 'On track',
  },
];

function severityColor(severity: Observation['severity']): string {
  switch (severity) {
    case 'High':
      return V1.teal600;
    case 'Medium':
      return V1.fuchsia600;
    case 'Low':
      return V1.ink400;
  }
}

function patternColor(color: Pattern['color']): string {
  switch (color) {
    case 'teal':
      return V1.teal600;
    case 'fuchsia':
      return V1.fuchsia600;
    case 'ink':
      return V1.ink400;
  }
}

export default function InsightsPage() {
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
                color: V1.teal600,
                marginBottom: 8,
              }}
            >
              NEXUS
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
              Insights
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
              What we're noticing across your readouts, milestones, and conversations.
            </p>
          </div>

          <hr
            style={{
              border: 'none',
              borderTop: `1px solid ${V1.ink100}`,
              margin: '40px 0',
            }}
          />

          {/* Section: What we're noticing */}
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
              What we're noticing
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
              Four recent observations from across your data.
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {OBSERVATIONS.map((obs, i) => (
                <div
                  key={obs.id}
                  style={{
                    padding: '28px 0',
                    borderTop:
                      i > 0 ? `1px solid ${V1.ink100}` : 'none',
                  }}
                >
                  <blockquote
                    style={{
                      fontFamily: V1.displayFont,
                      fontStyle: 'italic',
                      fontSize: 20,
                      lineHeight: 1.4,
                      color: V1.ink800,
                      margin: '0 0 16px',
                      paddingLeft: 20,
                      borderLeft: `3px solid ${V1.teal600}`,
                    }}
                  >
                    {obs.text}
                  </blockquote>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: V1.monoFont,
                        fontSize: 11.2,
                        textTransform: 'uppercase',
                        letterSpacing: V1.trackingMono,
                        color: V1.teal600,
                      }}
                    >
                      SOURCE \u00b7 {obs.source}
                    </span>
                    <span
                      style={{
                        fontFamily: V1.monoFont,
                        fontSize: 11.2,
                        textTransform: 'uppercase',
                        letterSpacing: V1.trackingMono,
                        color: V1.ink500,
                      }}
                    >
                      DATE \u00b7 {obs.date}
                    </span>
                    <span
                      style={{
                        fontFamily: V1.monoFont,
                        fontSize: 11.2,
                        textTransform: 'uppercase',
                        letterSpacing: V1.trackingMono,
                        color: severityColor(obs.severity),
                      }}
                    >
                      Severity \u00b7 {obs.severity}
                    </span>
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

          {/* Section: Patterns across your lenses */}
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
              Patterns across your lenses
            </div>
            <h2
              style={{
                fontFamily: V1.displayFont,
                fontSize: 26,
                lineHeight: V1.leadingHeading,
                color: V1.ink900,
                fontWeight: V1.fwRegular,
                margin: '0 0 24px',
              }}
            >
              Recurring signals we see across your profile.
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
              }}
            >
              {PATTERNS.map((p) => (
                <div
                  key={p.id}
                  style={{
                    border: `1px solid ${V1.ink100}`,
                    padding: 20,
                    margin: 8,
                  }}
                >
                  <div
                    style={{
                      fontFamily: V1.monoFont,
                      fontSize: 11.2,
                      textTransform: 'uppercase',
                      letterSpacing: V1.trackingMono,
                      color: patternColor(p.color),
                      marginBottom: 10,
                    }}
                  >
                    {p.label}
                  </div>
                  <div
                    style={{
                      fontFamily: V1.displayFont,
                      fontSize: 18,
                      fontWeight: V1.fwBold,
                      color: V1.ink900,
                      lineHeight: 1.3,
                      marginBottom: 10,
                    }}
                  >
                    {p.title}
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
                    {p.body}
                  </p>
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

          {/* Section: Milestone progress insights */}
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
              Milestone progress insights
            </div>
            <h2
              style={{
                fontFamily: V1.displayFont,
                fontSize: 26,
                lineHeight: V1.leadingHeading,
                color: V1.ink900,
                fontWeight: V1.fwRegular,
                margin: '0 0 24px',
              }}
            >
              What your data says about each active milestone.
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {MILESTONES.map((m, i) => (
                <div
                  key={m.id}
                  style={{
                    padding: '20px 0',
                    borderTop:
                      i > 0 ? `1px solid ${V1.ink100}` : 'none',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      gap: 16,
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: V1.displayFont,
                        fontSize: 20,
                        fontWeight: V1.fwSemibold,
                        color: V1.ink900,
                      }}
                    >
                      {m.name}
                    </div>
                    <span
                      style={{
                        fontFamily: V1.monoFont,
                        fontSize: 11.2,
                        textTransform: 'uppercase',
                        letterSpacing: V1.trackingMono,
                        color:
                          m.status === 'On track'
                            ? V1.teal600
                            : V1.fuchsia600,
                        flexShrink: 0,
                      }}
                    >
                      {m.status}
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: V1.displayFont,
                      fontStyle: 'italic',
                      fontSize: 16,
                      lineHeight: 1.5,
                      color: V1.ink700,
                      margin: 0,
                    }}
                  >
                    {m.insight}
                  </p>
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

          {/* Section: Recommended next step */}
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
              Recommended next step
            </div>
            <h2
              style={{
                fontFamily: V1.displayFont,
                fontSize: 26,
                lineHeight: V1.leadingHeading,
                color: V1.ink900,
                fontWeight: V1.fwRegular,
                margin: '0 0 24px',
              }}
            >
              Based on your signals \u2014 here's what we'd do first.
            </h2>

            <div
              style={{
                border: `2px solid ${V1.teal600}`,
                padding: 24,
                display: 'flex',
                gap: 32,
                alignItems: 'flex-start',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: V1.displayFont,
                    fontSize: 22,
                    fontWeight: V1.fwBold,
                    color: V1.ink900,
                    lineHeight: 1.3,
                    marginBottom: 14,
                  }}
                >
                  Take MOSAIC \u2014 Team &amp; Stakeholder Dynamics
                </div>
                <p
                  style={{
                    fontFamily: V1.bodyFont,
                    fontSize: 15,
                    lineHeight: V1.leadingBody,
                    color: V1.ink700,
                    margin: '0 0 12px',
                  }}
                >
                  Your insights keep pointing back to the same underlying surface:
                  stakeholder mapping, alignment work, and team dynamics across
                  markets. MOSAIC is the lens purpose-built for exactly this set of
                  problems.
                </p>
                <p
                  style={{
                    fontFamily: V1.bodyFont,
                    fontSize: 15,
                    lineHeight: V1.leadingBody,
                    color: V1.ink700,
                    margin: 0,
                  }}
                >
                  It takes about 25 minutes. You'll get a 12-dimension profile, a
                  set of concrete communication adjustments, and a board-ready
                  summary you can share with your chair if needed.
                </p>
              </div>
              <div style={{ width: 240, flexShrink: 0 }}>
                <button
                  type="button"
                  style={{
                    width: '100%',
                    background: V1.teal800,
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
                    transition: `background ${V1.durFast}ms ${V1.ease}`,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = V1.teal700)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = V1.teal800)
                  }
                >
                  Start MOSAIC \u2192
                </button>
              </div>
            </div>
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
              border: `1px solid ${V1.ink200}`,
              padding: 20,
              marginBottom: 16,
            }}
          >
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
              NEXUS activity
            </div>
            {[
              { num: '4', label: 'Readouts completed' },
              { num: '2', label: 'Milestones active' },
              { num: '68', label: 'Messages exchanged' },
            ].map((row, i) => (
              <div
                key={row.label}
                style={{
                  padding: '12px 0',
                  borderTop:
                    i > 0 ? `1px solid ${V1.ink100}` : 'none',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      fontFamily: V1.displayFont,
                      fontSize: 28,
                      lineHeight: 1,
                      color: V1.ink900,
                      fontWeight: V1.fwRegular,
                      letterSpacing: V1.trackingTight,
                    }}
                  >
                    {row.num}
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
                    \u00b7 {row.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            style={{
              width: '100%',
              background: V1.teal800,
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
              marginBottom: 24,
              transition: `background ${V1.durFast}ms ${V1.ease}`,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = V1.teal700)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = V1.teal800)
            }
          >
            Talk to NEXUS about this \u2192
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
            Focus this week
          </div>
          <p
            style={{
              fontFamily: V1.bodyFont,
              fontStyle: 'italic',
              fontSize: 14,
              lineHeight: 1.5,
              color: V1.ink600,
              margin: '0 0 24px',
            }}
          >
            Singapore GM announcement prep, Series B investor Q&amp;A
            rehearsal, and the China strategy check\u2013in you've been putting
            off.
          </p>

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
            Insights cadence
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
            Weekly digest \u00b7 email
          </div>
        </aside>
      </div>
    </div>
  );
}
