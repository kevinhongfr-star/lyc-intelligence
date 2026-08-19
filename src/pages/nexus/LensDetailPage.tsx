import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { V1 } from '@/styles/v1-tokens';

const LENS = {
  code: 'PRISM',
  fullName: 'PRISM — Professional branding',
  pillarName: 'Strategic & Organizational Impact',
  tagline: 'See how the world sees your professional brand.',
  subtitle:
    "A deep diagnostic that maps how the outside world currently sees you — and the gap between that and where you're going.",
  whatItMeasures: [
    'PRISM measures five core dimensions of your professional brand: Brand Clarity, Market Legibility, Identity Consistency, Narrative Power, and Visibility Level. Together these form a complete picture of how you present yourself to the world — and how that world receives you.',
    'The diagnostic is grounded in a 3×3 grid model with Visibility on the vertical axis and Brand Consistency / Narrative Alignment on the horizontal. Your responses position you within this grid, surfacing one of ten distinct professional brand archetypes — from The Authority (high visibility, high consistency) to The Blank Page (early-stage, still forming).',
    'Unlike self-report personality instruments, PRISM focuses on external perception and market positioning. The questions ask not who you are, but how you show up — in meetings, on LinkedIn, in client conversations, and across the channels where your professional brand lives.',
  ],
  whatYouGet: [
    'Your five-dimension brand profile with percentile scores across all dimensions',
    'Your personal brand archetype (one of ten) with a narrative profile and quadrant position',
    'Three high-priority growth moves tailored to your archetype and dimension gaps',
    'A visibility × consistency 2×2 matrix plot showing your current position',
    'Channel-specific recommendations: LinkedIn, in-person presence, written output, storytelling',
    'A shareable one-page readout you can send to your coach, mentor, or team',
  ],
  howItWorks: [
    {
      step: '01',
      title: 'Answer 30 situational questions',
      body: 'Each question presents a real professional scenario — a board meeting, a LinkedIn post, a client conversation. You rate your current behavior on a 5-point Likert scale from Strongly Disagree to Strongly Agree. There are no right answers; the goal is an honest baseline.',
    },
    {
      step: '02',
      title: 'Dimension scoring across five axes',
      body: 'Your responses are aggregated per dimension (six questions each) to produce percentile scores. The algorithm normalizes for response bias and cross-checks internal consistency so the readout reflects a coherent profile, not random noise.',
    },
    {
      step: '03',
      title: 'Archetype mapping on the 3×3 grid',
      body: 'Your Visibility score and Consistency / Narrative score place you on the structural grid. The nearest archetype cell is selected, and if you sit between cells, the readout surfaces both your primary archetype and the adjacent tendencies.',
    },
    {
      step: '04',
      title: 'Prioritized actions delivered as a readout',
      body: 'Within minutes you receive a structured readout: dimension scores, archetype narrative, the three moves that will move your position most, and channel-specific playbooks. You can revisit, share, or discuss the readout with a coach at any time.',
    },
  ],
  sampleQuestion:
    "When someone asks you what you do, your answer is consistent across contexts — a colleague at the watercooler, a stranger at a conference, a recruiter on a call — and it leads to a follow-up conversation you actually want to have.",
  sampleQuestionMeta: 'Question 14 of 28 · Situational',
  whoFor: [
    'Mid-to-senior professionals who want to understand and shape how they are perceived by peers, reports, and the broader market',
    'Founders and consultants whose personal brand is a core business asset — where positioning directly drives pipeline and pricing',
    'Leaders in career transition who need to reframe their narrative for a new role, industry, or geography',
  ],
  relatedLenses: [
    { code: 'SPARK', name: 'AI leadership readiness', href: '/nexus/lenses/spark' },
    { code: 'MOSAIC', name: 'Cross-border cultural fit', href: '/nexus/lenses/mosaic' },
    { code: 'IMPACT', name: 'Board-level influence', href: '/nexus/lenses/impact' },
  ],
};

const STEPS = LENS.howItWorks;
const RELATED = LENS.relatedLenses;

export default function LensDetailPage() {
  const { code } = useParams<{ code: string }>();
  const lens = LENS;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: V1.bg,
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: V1.shellGap,
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
            padding: V1.shellPad,
            maxWidth: V1.contentMax,
            margin: '0 auto',
            width: '100%',
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: 11.2,
              textTransform: 'uppercase',
              letterSpacing: V1.trackingMono,
              color: V1.teal600,
              marginBottom: 12,
            }}
          >
            Diagnostic lens · {lens.pillarName}
          </div>

          {/* Display title */}
          <h1
            style={{
              fontFamily: V1.displayFont,
              fontSize: 48,
              lineHeight: 1.1,
              letterSpacing: V1.trackingTight,
              color: V1.ink900,
              fontWeight: V1.fwRegular,
              margin: '0 0 16px',
            }}
          >
            {code || lens.code} · {lens.fullName}
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontFamily: V1.displayFont,
              fontStyle: 'italic',
              fontSize: 20,
              lineHeight: 1.5,
              color: V1.ink600,
              margin: '0 0 40px',
              maxWidth: 680,
            }}
          >
            {lens.subtitle}
          </p>

          {/* Section: What it measures */}
          <section style={{ marginBottom: 0 }}>
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
              What it measures
            </div>
            <h2
              style={{
                fontFamily: V1.displayFont,
                fontSize: 24,
                lineHeight: 1.2,
                letterSpacing: V1.trackingTight,
                color: V1.ink900,
                fontWeight: V1.fwRegular,
                margin: '0 0 20px',
              }}
            >
              A five-dimension brand profile on a visibility × consistency grid.
            </h2>
            {lens.whatItMeasures.map((p, i) => (
              <p
                key={i}
                style={{
                  fontFamily: V1.bodyFont,
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: V1.ink700,
                  margin: i < lens.whatItMeasures.length - 1 ? '0 0 16px' : 0,
                }}
              >
                {p}
              </p>
            ))}
          </section>

          <hr
            style={{
              border: 'none',
              borderTop: `1px solid ${V1.ink100}`,
              margin: '48px 0',
            }}
          />

          {/* Section: What you'll get */}
          <section style={{ marginBottom: 0 }}>
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
              What you'll get
            </div>
            <h2
              style={{
                fontFamily: V1.displayFont,
                fontSize: 24,
                lineHeight: 1.2,
                letterSpacing: V1.trackingTight,
                color: V1.ink900,
                fontWeight: V1.fwRegular,
                margin: '0 0 20px',
              }}
            >
              A structured readout you can act on this week.
            </h2>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
              }}
            >
              {lens.whatYouGet.map((item, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '8px 0',
                    fontFamily: V1.bodyFont,
                    fontSize: 16,
                    lineHeight: 1.6,
                    color: V1.ink700,
                  }}
                >
                  <span
                    style={{
                      color: V1.teal600,
                      fontFamily: V1.bodyFont,
                      fontWeight: V1.fwMedium,
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <hr
            style={{
              border: 'none',
              borderTop: `1px solid ${V1.ink100}`,
              margin: '48px 0',
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
                color: V1.teal600,
                marginBottom: 8,
              }}
            >
              How it works
            </div>
            <h2
              style={{
                fontFamily: V1.displayFont,
                fontSize: 24,
                lineHeight: 1.2,
                letterSpacing: V1.trackingTight,
                color: V1.ink900,
                fontWeight: V1.fwRegular,
                margin: '0 0 24px',
              }}
            >
              Four steps from questions to a readable result.
            </h2>
            <div>
              {STEPS.map((s, i) => (
                <div
                  key={s.step}
                  style={{
                    padding: '24px 0',
                    borderTop:
                      i > 0 ? `1px solid ${V1.ink100}` : undefined,
                  }}
                >
                  <div style={{ display: 'flex', gap: 20 }}>
                    <div
                      style={{
                        fontFamily: V1.monoFont,
                        fontSize: '1.25rem',
                        color: V1.teal600,
                        letterSpacing: V1.trackingMono,
                        flexShrink: 0,
                        lineHeight: 1,
                        paddingTop: 2,
                      }}
                    >
                      {s.step}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: V1.displayFont,
                          fontWeight: V1.fwBold,
                          fontSize: 18,
                          color: V1.ink900,
                          lineHeight: 1.3,
                          marginBottom: 8,
                        }}
                      >
                        {s.title}
                      </div>
                      <p
                        style={{
                          fontFamily: V1.bodyFont,
                          fontSize: 16,
                          lineHeight: 1.6,
                          color: V1.ink700,
                          margin: 0,
                        }}
                      >
                        {s.body}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <hr
            style={{
              border: 'none',
              borderTop: `1px solid ${V1.ink100}`,
              margin: '48px 0',
            }}
          />

          {/* Section: Sample question */}
          <section style={{ marginBottom: 0 }}>
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
              Sample question
            </div>
            <h2
              style={{
                fontFamily: V1.displayFont,
                fontSize: 24,
                lineHeight: 1.2,
                letterSpacing: V1.trackingTight,
                color: V1.ink900,
                fontWeight: V1.fwRegular,
                margin: '0 0 20px',
              }}
            >
              How PRISM feels to take.
            </h2>
            <div
              style={{
                border: `1px solid ${V1.ink200}`,
                padding: 24,
                borderRadius: V1.radius,
              }}
            >
              <p
                style={{
                  fontFamily: V1.displayFont,
                  fontStyle: 'italic',
                  fontSize: 18,
                  lineHeight: 1.5,
                  color: V1.ink900,
                  margin: '0 0 16px',
                }}
              >
                "{lens.sampleQuestion}"
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
                {lens.sampleQuestionMeta}
              </div>
            </div>
          </section>

          <hr
            style={{
              border: 'none',
              borderTop: `1px solid ${V1.ink100}`,
              margin: '48px 0',
            }}
          />

          {/* Section: Who this is for */}
          <section style={{ marginBottom: 0 }}>
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
              Who this is for
            </div>
            <h2
              style={{
                fontFamily: V1.displayFont,
                fontSize: 24,
                lineHeight: 1.2,
                letterSpacing: V1.trackingTight,
                color: V1.ink900,
                fontWeight: V1.fwRegular,
                margin: '0 0 20px',
              }}
            >
              Built for leaders whose brand is a professional asset.
            </h2>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
              }}
            >
              {lens.whoFor.map((item, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '8px 0',
                    fontFamily: V1.bodyFont,
                    fontSize: 16,
                    lineHeight: 1.6,
                    color: V1.ink700,
                  }}
                >
                  <span
                    style={{
                      color: V1.teal600,
                      fontFamily: V1.bodyFont,
                      fontWeight: V1.fwMedium,
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <hr
            style={{
              border: 'none',
              borderTop: `1px solid ${V1.ink100}`,
              margin: '48px 0',
            }}
          />

          {/* Section: Related lenses */}
          <section style={{ marginBottom: 0 }}>
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
              Related lenses
            </div>
            <h2
              style={{
                fontFamily: V1.displayFont,
                fontSize: 24,
                lineHeight: 1.2,
                letterSpacing: V1.trackingTight,
                color: V1.ink900,
                fontWeight: V1.fwRegular,
                margin: '0 0 20px',
              }}
            >
              Other diagnostics that pair well.
            </h2>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              {RELATED.map((related) => (
                <Link
                  key={related.code}
                  to={related.href}
                  style={{
                    flex: '1 1 calc(33.333% - 12px)',
                    minWidth: 220,
                    border: `1px solid ${V1.ink200}`,
                    padding: 20,
                    borderRadius: V1.radius,
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: `border-color ${V1.durFast}ms ${V1.ease}, background ${V1.durFast}ms ${V1.ease}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = V1.teal600;
                    e.currentTarget.style.background = V1.cream;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = V1.ink200;
                    e.currentTarget.style.background = 'transparent';
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
                    {related.code}
                  </div>
                  <div
                    style={{
                      fontFamily: V1.displayFont,
                      fontSize: 18,
                      color: V1.ink900,
                      lineHeight: 1.3,
                      marginBottom: 12,
                    }}
                  >
                    {related.name}
                  </div>
                  <div
                    style={{
                      fontFamily: V1.bodyFont,
                      fontSize: 14,
                      color: V1.teal600,
                      fontWeight: V1.fwMedium,
                    }}
                  >
                    View lens →
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </main>

        {/* RIGHT RAIL */}
        <aside
          style={{
            width: V1.shellRailW,
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            padding: 24,
            borderLeft: `1px solid ${V1.ink200}`,
            alignSelf: 'flex-start',
          }}
        >
          {/* Cost block */}
          <div
            style={{
              marginBottom: 24,
              paddingBottom: 24,
              borderBottom: `1px solid ${V1.ink100}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
              <div
                style={{
                  fontFamily: V1.displayFont,
                  fontSize: 40,
                  lineHeight: 1,
                  letterSpacing: V1.trackingTight,
                  color: V1.ink900,
                  fontWeight: V1.fwRegular,
                }}
              >
                2 mi
              </div>
              <div
                style={{
                  fontFamily: V1.monoFont,
                  fontSize: 10.5,
                  textTransform: 'uppercase',
                  letterSpacing: V1.trackingMono,
                  border: `1px solid ${V1.teal200}`,
                  background: V1.teal50,
                  color: V1.teal700,
                  padding: '4px 8px',
                  borderRadius: V1.radius,
                }}
              >
                Standard
              </div>
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
              Miles deducted on completion
            </div>
          </div>

          {/* Primary CTA */}
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
            onMouseEnter={(e) => (e.currentTarget.style.background = V1.teal700)}
            onMouseLeave={(e) => (e.currentTarget.style.background = V1.teal800)}
          >
            Start {lens.code} →
          </button>

          {/* Quick facts */}
          <div
            style={{
              marginBottom: 24,
              paddingBottom: 24,
              borderBottom: `1px solid ${V1.ink100}`,
            }}
          >
            {[
              { label: 'Est. time', value: '12–15 min' },
              { label: 'Questions', value: '~28' },
              { label: 'Dimensions', value: '4' },
              { label: 'Pillar', value: 'P3 · Strategic & Org Impact' },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderTop: i > 0 ? `1px solid ${V1.ink100}` : undefined,
                }}
              >
                <div
                  style={{
                    fontFamily: V1.monoFont,
                    fontSize: 11.2,
                    textTransform: 'uppercase',
                    letterSpacing: V1.trackingMono,
                    color: V1.ink400,
                  }}
                >
                  {row.label}
                </div>
                <div
                  style={{
                    fontFamily: V1.bodyFont,
                    fontSize: 14,
                    color: V1.ink900,
                    fontWeight: V1.fwMedium,
                  }}
                >
                  {row.value}
                </div>
              </div>
            ))}
          </div>

          {/* Related lenses (rail compact) */}
          <div>
            <div
              style={{
                fontFamily: V1.monoFont,
                fontSize: 11.2,
                textTransform: 'uppercase',
                letterSpacing: V1.trackingMono,
                color: V1.teal600,
                marginBottom: 12,
              }}
            >
              Related lenses
            </div>
            {RELATED.slice(0, 2).map((related, i) => (
              <div
                key={related.code}
                style={{
                  padding: '12px 0',
                  borderTop: i > 0 ? `1px solid ${V1.ink100}` : undefined,
                }}
              >
                <div
                  style={{
                    fontFamily: V1.monoFont,
                    fontSize: 10.5,
                    textTransform: 'uppercase',
                    letterSpacing: V1.trackingMono,
                    color: V1.teal600,
                    marginBottom: 4,
                  }}
                >
                  {related.code}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      fontFamily: V1.displayFont,
                      fontSize: 15,
                      color: V1.ink900,
                      lineHeight: 1.3,
                    }}
                  >
                    {related.name}
                  </div>
                  <Link
                    to={related.href}
                    style={{
                      fontFamily: V1.bodyFont,
                      fontSize: 13,
                      color: V1.teal600,
                      fontWeight: V1.fwMedium,
                      textDecoration: 'none',
                      flexShrink: 0,
                    }}
                  >
                    →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
