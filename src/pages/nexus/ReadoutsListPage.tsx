import React from 'react';
import { Link } from 'react-router-dom';
import { V1 } from '@/styles/v1-tokens';

interface InProgressItem {
  id: string;
  code: string;
  name: string;
  progress: number;
  href: string;
}

interface ReadoutItem {
  id: string;
  code: string;
  name: string;
  date: string;
  scoreSnippet: string;
  href: string;
}

interface DateGroup {
  label: string;
  items: ReadoutItem[];
}

const IN_PROGRESS: InProgressItem[] = [
  {
    id: 'ip1',
    code: 'CPI',
    name: 'Talent pipeline health',
    progress: 42,
    href: '/nexus/lenses/cpi',
  },
  {
    id: 'ip2',
    code: 'BRIDGE',
    name: 'Cross-border leadership effectiveness',
    progress: 18,
    href: '/nexus/lenses/bridge',
  },
];

const DATE_GROUPS: DateGroup[] = [
  {
    label: 'This month · August 2026',
    items: [
      {
        id: 'r1',
        code: 'SPARK',
        name: 'AI leadership readiness',
        date: 'Aug 12, 2026',
        scoreSnippet:
          '"You score in the 82nd percentile on Adopted Use — the gap is in Strategy and Governance, where most leaders stall after the initial deployment wave."',
        href: '/nexus/readouts/spark/r1',
      },
      {
        id: 'r2',
        code: 'FORGE',
        name: 'Operating model clarity',
        date: 'Aug 3, 2026',
        scoreSnippet:
          '"Your decision-rights dimension is the outlier — strong at the center, weak at the front line. The dual-line ambiguity for the Singapore GM is the #1 structural drag."',
        href: '/nexus/readouts/forge/r2',
      },
    ],
  },
  {
    label: 'July 2026',
    items: [
      {
        id: 'r3',
        code: 'IMPACT',
        name: 'Board-level influence',
        date: 'Jul 22, 2026',
        scoreSnippet:
          '"Your narrative quality in board updates is top quartile. The drag: you pre-frame options before the board has time to digest the framing itself."',
        href: '/nexus/readouts/impact/r3',
      },
      {
        id: 'r4',
        code: 'MOSAIC',
        name: 'Cross-border cultural fit',
        date: 'Jul 9, 2026',
        scoreSnippet:
          '"Strong on Relationship, weaker on Hierarchy Distance — your default communication style lands as too direct with the Tokyo team and too consultative in Shanghai."',
        href: '/nexus/readouts/mosaic/r4',
      },
      {
        id: 'r5',
        code: 'DRIVE',
        name: 'Personal execution velocity',
        date: 'Jul 1, 2026',
        scoreSnippet:
          '"Your energy distribution curves sharply downward by 4pm. The highest-leverage shift: protect the first 90 minutes for type-1 decisions, not scheduling."',
        href: '/nexus/readouts/drive/r5',
      },
    ],
  },
  {
    label: 'June 2026',
    items: [
      {
        id: 'r6',
        code: 'PRISM',
        name: 'Professional branding',
        date: 'Jun 18, 2026',
        scoreSnippet:
          '"You are The Signal — high visibility, medium consistency. Your LinkedIn presence, in-person impression, and written output tell three different stories."',
        href: '/nexus/readouts/prism/r6',
      },
    ],
  },
];

export default function ReadoutsListPage() {
  const completedCount = DATE_GROUPS.reduce((sum, g) => sum + g.items.length, 0);

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
              Your history
            </div>
            <h1
              style={{
                fontFamily: V1.displayFont,
                fontSize: 40,
                lineHeight: 1.1,
                letterSpacing: V1.trackingTight,
                color: V1.ink900,
                fontWeight: V1.fwRegular,
                margin: '0 0 12px',
              }}
            >
              Readouts you've completed
            </h1>
            <p
              style={{
                fontFamily: V1.displayFont,
                fontStyle: 'italic',
                fontSize: 18,
                lineHeight: 1.5,
                color: V1.ink600,
                margin: 0,
                maxWidth: 640,
              }}
            >
              A record of every diagnostic lens you've finished. Readouts are yours to revisit, share, or discuss in coaching.
            </p>
          </div>

          <hr
            style={{
              border: 'none',
              borderTop: `1px solid ${V1.ink100}`,
              margin: '32px 0',
            }}
          />

          {/* Section: In progress */}
          {IN_PROGRESS.length > 0 && (
            <section style={{ marginBottom: 0 }}>
              <div
                style={{
                  fontFamily: V1.monoFont,
                  fontSize: 11.2,
                  textTransform: 'uppercase',
                  letterSpacing: V1.trackingMono,
                  color: V1.teal600,
                  marginBottom: 16,
                }}
              >
                In progress · {IN_PROGRESS.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {IN_PROGRESS.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: `1px solid ${V1.ink200}`,
                      padding: 20,
                      borderRadius: V1.radius,
                      boxShadow: 'none',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 20,
                        marginBottom: 16,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: V1.monoFont,
                            fontSize: 11.2,
                            textTransform: 'uppercase',
                            letterSpacing: V1.trackingMono,
                            color: V1.teal600,
                            marginBottom: 6,
                          }}
                        >
                          {item.code}
                        </div>
                        <div
                          style={{
                            fontFamily: V1.displayFont,
                            fontSize: 18,
                            color: V1.ink900,
                            lineHeight: 1.3,
                            marginBottom: 8,
                          }}
                        >
                          {item.name}
                        </div>
                        <div
                          style={{
                            height: 2,
                            background: V1.ink100,
                            overflow: 'hidden',
                            marginBottom: 12,
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${item.progress}%`,
                              background: V1.teal600,
                            }}
                          />
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
                          {item.progress}% complete
                        </div>
                      </div>
                      <Link
                        to={item.href}
                        style={{
                          fontFamily: V1.bodyFont,
                          fontSize: 14,
                          color: V1.teal600,
                          fontWeight: V1.fwMedium,
                          textDecoration: 'none',
                          flexShrink: 0,
                          paddingTop: 2,
                        }}
                      >
                        Resume →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <hr
            style={{
              border: 'none',
              borderTop: `1px solid ${V1.ink100}`,
              margin: '48px 0',
            }}
          />

          {/* Section: Completed — Date groups */}
          <section style={{ marginBottom: 0 }}>
            <div
              style={{
                fontFamily: V1.monoFont,
                fontSize: 11.2,
                textTransform: 'uppercase',
                letterSpacing: V1.trackingMono,
                color: V1.teal600,
                marginBottom: 24,
              }}
            >
              Completed
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {DATE_GROUPS.map((group) => (
                <div key={group.label}>
                  <div
                    style={{
                      fontFamily: V1.monoFont,
                      fontSize: 11.2,
                      textTransform: 'uppercase',
                      letterSpacing: V1.trackingMono,
                      color: V1.ink500,
                      marginBottom: 12,
                    }}
                  >
                    {group.label}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          border: `1px solid ${V1.ink100}`,
                          padding: 20,
                          borderRadius: V1.radius,
                          boxShadow: 'none',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 20,
                          transition: `border-color ${V1.durFast}ms ${V1.ease}, background ${V1.durFast}ms ${V1.ease}`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = V1.teal600;
                          e.currentTarget.style.background = V1.cream;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = V1.ink100;
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'baseline',
                              gap: 12,
                              marginBottom: 4,
                              flexWrap: 'wrap',
                            }}
                          >
                            <div
                              style={{
                                fontFamily: V1.monoFont,
                                fontSize: 11.2,
                                textTransform: 'uppercase',
                                letterSpacing: V1.trackingMono,
                                color: V1.teal600,
                              }}
                            >
                              {item.code}
                            </div>
                            <div
                              style={{
                                fontFamily: V1.displayFont,
                                fontSize: 18,
                                fontWeight: V1.fwBold,
                                color: V1.ink900,
                                lineHeight: 1.3,
                              }}
                            >
                              {item.name}
                            </div>
                          </div>
                          <div
                            style={{
                              fontFamily: V1.monoFont,
                              fontSize: 11.2,
                              textTransform: 'uppercase',
                              letterSpacing: V1.trackingMono,
                              color: V1.ink500,
                              marginBottom: 8,
                            }}
                          >
                            {item.date}
                          </div>
                          <p
                            style={{
                              fontFamily: V1.displayFont,
                              fontStyle: 'italic',
                              fontSize: 15,
                              lineHeight: 1.5,
                              color: V1.ink700,
                              margin: 0,
                            }}
                          >
                            {item.scoreSnippet}
                          </p>
                        </div>
                        <Link
                          to={item.href}
                          style={{
                            fontFamily: V1.monoFont,
                            fontSize: 11.2,
                            textTransform: 'uppercase',
                            letterSpacing: V1.trackingMono,
                            color: V1.teal600,
                            textDecoration: 'none',
                            flexShrink: 0,
                            paddingTop: 4,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          View readout →
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Load more */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: 40,
              }}
            >
              <button
                type="button"
                style={{
                  background: 'transparent',
                  border: `1px solid ${V1.teal800}`,
                  color: V1.teal800,
                  fontFamily: V1.monoFont,
                  fontSize: 11.2,
                  textTransform: 'uppercase',
                  letterSpacing: V1.trackingMono,
                  padding: '12px 24px',
                  borderRadius: V1.radius,
                  cursor: 'pointer',
                  boxShadow: 'none',
                  transition: `background ${V1.durFast}ms ${V1.ease}, color ${V1.durFast}ms ${V1.ease}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = V1.teal800;
                  e.currentTarget.style.color = V1.white;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = V1.teal800;
                }}
              >
                Load more
              </button>
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
          {/* Stats block */}
          <div
            style={{
              border: `1px solid ${V1.ink200}`,
              padding: 20,
              borderRadius: V1.radius,
              marginBottom: 16,
            }}
          >
            {[
              { value: String(completedCount), label: 'Completed' },
              { value: String(IN_PROGRESS.length), label: 'In progress' },
              { value: '5', label: 'To explore' },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                style={{
                  padding: '12px 0',
                  borderTop: i > 0 ? `1px solid ${V1.ink100}` : undefined,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 8,
                    marginBottom: 2,
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
                    {row.value}
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
                    · {row.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Explore CTA */}
          <Link
            to="/nexus/lenses"
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'center',
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
              textDecoration: 'none',
              margin: '16px 0',
              transition: `background ${V1.durFast}ms ${V1.ease}`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = V1.teal700)}
            onMouseLeave={(e) => (e.currentTarget.style.background = V1.teal800)}
          >
            Explore more lenses →
          </Link>

          {/* Quick stats / focus area */}
          <div
            style={{
              borderTop: `1px solid ${V1.ink100}`,
              paddingTop: 20,
            }}
          >
            <div
              style={{
                fontFamily: V1.monoFont,
                fontSize: 11.2,
                textTransform: 'uppercase',
                letterSpacing: V1.trackingMono,
                color: V1.ink400,
                marginBottom: 6,
              }}
            >
              Focus area
            </div>
            <div
              style={{
                fontFamily: V1.bodyFont,
                fontSize: 14,
                color: V1.ink900,
                fontWeight: V1.fwMedium,
                marginBottom: 16,
              }}
            >
              Strategic & Organizational Impact
            </div>
            <p
              style={{
                fontFamily: V1.displayFont,
                fontStyle: 'italic',
                fontSize: 14,
                lineHeight: 1.5,
                color: V1.ink600,
                margin: 0,
                paddingLeft: 12,
                borderLeft: `1px solid ${V1.teal300}`,
              }}
            >
              Completing 3 lenses unlocks a cross-diagnostic synthesis.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
