/**
 * W4-T10 — Reusable Depth Page Template for all 11 diagnostic deep-links.
 *
 * Data-driven template. Every diagnostic depth page = 1 data instance of this
 * component. Pages are accessible via deep link only, NOT browsable from nav.
 *
 * 6 sections (all with component-style section divs):
 *   1. HERO · 2. WHAT IT MEASURES · 3. HOW IT WORKS
 *   4. WHAT YOU GET · 5. SAMPLE REPORT PREVIEW · 6. CTA
 *
 * Brand rules:
 *   - Inline style objects. Zero border radius. No Tailwind.
 *   - Serif headings · sans body · mono labels/codes.
 *   - One accent per diagnostic (passed via accent prop). Eyebrows = gray-500.
 *   - CTA ALWAYS directs back to NEXUS chat. Never to a catalog.
 *   - Human debrief upsell at bottom of "What you get" section.
 *   - Mobile: grids collapse to 1 column below 768px.
 */
import React from 'react';
import { ArrowRight, Download, MessageSquare, Calendar, FileText } from 'lucide-react';
import { DS, ACCENT, ACCENT_DARK, OCEAN, AMBER, FOREST_GREEN } from '@/tokens';
import { getMileLabel } from '@/config/miles';

// ── TYPES ───────────────────────────────────────────────────────────

export interface LandingDimension {
  name: string;
  shortDescription: string;
}

export interface DepthPageTemplateProps {
  diagnosticCode: string;
  diagnosticName: string;
  descriptor: string;
  tagline: string;
  mileCost: number;
  costTier: string;
  dimensionPlaceholders?: LandingDimension[];
  pillarMapping?: string;
  formatQuestionCount?: number;
  formatTimeMinutes?: number;
  sampleReportPlaceholder?: string;
}

// ── ACCENT MAPPING ──────────────────────────────────────────────────

function getAccentForCode(code: string): { accent: string; accentDark: string } {
  const upper = code.toUpperCase();
  if (upper === 'LEAP') return { accent: OCEAN, accentDark: '#153A6B' };
  if (upper === 'SPARK') return { accent: AMBER, accentDark: '#92400E' };
  if (upper === 'IMPACT') return { accent: FOREST_GREEN, accentDark: '#14532D' };
  if (upper === 'CPI') return { accent: ACCENT, accentDark: ACCENT_DARK };
  return { accent: ACCENT, accentDark: ACCENT_DARK };
}

// ── SHARED STYLE FRAGMENTS ──────────────────────────────────────────

const COLOR_BG_DARK = DS.bgDark;
const COLOR_TEXT_ON_DARK = DS.bg;
const COLOR_MUTED_ON_DARK = 'rgba(255,255,255,0.62)';

const EYEBROW_MONO: React.CSSProperties = {
  fontFamily: DS.monoFont,
  fontSize: 10,
  letterSpacing: '0.24em',
  color: DS.muted,
  textTransform: 'uppercase',
  marginBottom: 12,
  fontWeight: 600,
};

const SECTION_TITLE: React.CSSProperties = {
  fontFamily: DS.headingFont,
  fontSize: 'clamp(28px, 3.6vw, 40px)',
  fontWeight: 700,
  letterSpacing: '-0.015em',
  margin: 0,
  color: DS.text,
  lineHeight: 1.15,
};

const SECTION_LEAD: React.CSSProperties = {
  fontFamily: DS.bodyFont,
  color: DS.textSecondary,
  maxWidth: 620,
  marginTop: 12,
  lineHeight: 1.6,
  fontSize: 16,
};

// ── PRIMARY CTA BUTTON ──────────────────────────────────────────────

function CtaButton({
  href,
  label,
  accent,
  accentDark,
  size = 'md',
  icon,
}: {
  href: string;
  label: string;
  accent: string;
  accentDark: string;
  size?: 'md' | 'lg';
  icon?: React.ReactNode;
}) {
  const pad = size === 'lg' ? '20px 40px' : '14px 22px';
  const fs = size === 'lg' ? 14 : 13;
  return (
    <a
      href={href}
      style={{
        background: accent,
        color: DS.bg,
        border: `1px solid ${accent}`,
        fontFamily: DS.bodyFont,
        fontSize: fs,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: size === 'lg' ? '0.18em' : '0.15em',
        padding: pad,
        minHeight: 44,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        textDecoration: 'none',
        cursor: 'pointer',
        transition: `background ${DS.transition}`,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = accentDark)}
      onMouseLeave={(e) => (e.currentTarget.style.background = accent)}
    >
      {icon}
      {label}
      <ArrowRight size={14} />
    </a>
  );
}

// ── SECTION COMPONENTS ──────────────────────────────────────────────

function HeroSection({
  diagnosticCode,
  diagnosticName,
  descriptor,
  tagline,
  mileCost,
  costTier,
  pillarMapping,
  accent,
  accentDark,
}: {
  diagnosticCode: string;
  diagnosticName: string;
  descriptor: string;
  tagline: string;
  mileCost: number;
  costTier: string;
  pillarMapping?: string;
  accent: string;
  accentDark: string;
}) {
  return (
    <section data-depth-hero style={{ background: COLOR_BG_DARK }}>
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: '96px 32px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          <div
            style={{
              background: accent,
              color: DS.bg,
              fontFamily: DS.monoFont,
              fontSize: 10,
              letterSpacing: '0.20em',
              padding: '4px 10px',
              display: 'inline-block',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            {costTier.toUpperCase()}
          </div>
          <div
            style={{
              background: 'transparent',
              border: `1px solid rgba(255,255,255,0.15)`,
              color: COLOR_MUTED_ON_DARK,
              fontFamily: DS.monoFont,
              fontSize: 10,
              letterSpacing: '0.15em',
              padding: '4px 10px',
              display: 'inline-block',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            {getMileLabel(diagnosticCode)}
          </div>
          {pillarMapping && (
            <div
              style={{
                background: 'transparent',
                border: `1px solid rgba(255,255,255,0.1)`,
                color: COLOR_MUTED_ON_DARK,
                fontFamily: DS.monoFont,
                fontSize: 10,
                letterSpacing: '0.12em',
                padding: '4px 10px',
                display: 'inline-block',
                textTransform: 'uppercase',
                fontWeight: 500,
              }}
            >
              {pillarMapping}
            </div>
          )}
        </div>

        <div
          style={{
            fontFamily: DS.monoFont,
            fontSize: 10,
            letterSpacing: '0.22em',
            color: DS.muted,
            textTransform: 'uppercase',
            marginBottom: 10,
            fontWeight: 500,
          }}
        >
          {diagnosticCode} · {descriptor}
        </div>

        <h1
          style={{
            fontFamily: DS.headingFont,
            fontSize: 'clamp(40px, 6vw, 64px)',
            fontWeight: 700,
            color: COLOR_TEXT_ON_DARK,
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            maxWidth: 720,
            margin: 0,
          }}
        >
          {diagnosticName}
        </h1>

        <p
          style={{
            fontFamily: DS.bodyFont,
            fontSize: 'clamp(15px, 1.5vw, 18px)',
            color: COLOR_MUTED_ON_DARK,
            lineHeight: 1.55,
            maxWidth: 600,
            marginTop: 18,
          }}
        >
          {tagline}
        </p>

        <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
          <CtaButton
            href="/nexus/chat"
            label="Run with NEXUS"
            accent={accent}
            accentDark={accentDark}
            icon={<MessageSquare size={14} />}
          />
        </div>

        <div
          style={{
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            alignItems: 'center',
            fontFamily: DS.monoFont,
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: COLOR_MUTED_ON_DARK,
            marginTop: 40,
          }}
        >
          <span>Diagnostic Code: {diagnosticCode}</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
          <span>{mileCost} {mileCost === 1 ? 'mile' : 'miles'}</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
          <span>{costTier}</span>
        </div>
      </div>
    </section>
  );
}

function WhatItMeasuresSection({
  dimensionPlaceholders,
  accent,
}: {
  dimensionPlaceholders: LandingDimension[];
  accent: string;
}) {
  return (
    <section data-depth-measures style={{ background: DS.bg, padding: '96px 32px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <div>
          <div style={EYEBROW_MONO}>WHAT IT MEASURES</div>
          <h2 style={SECTION_TITLE}>
            {dimensionPlaceholders.length} key dimensions of professional insight
          </h2>
          <p style={SECTION_LEAD}>
            [Emily: what it measures lead paragraph — placeholder. Each dimension surfaces a distinct angle of
            your professional operating context, scored independently with written interpretation.]
          </p>
        </div>

        <div
          className="depth-dim-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
            marginTop: 48,
          }}
        >
          {dimensionPlaceholders.map((dim, i) => {
            const highlighted = i === 0;
            return (
              <div
                key={i}
                style={{
                  background: DS.card,
                  border: highlighted
                    ? `1px solid ${DS.border}`
                    : `1px solid ${DS.border}`,
                  borderLeft: highlighted ? `3px solid ${accent}` : `1px solid ${DS.border}`,
                  padding: 24,
                  transition: DS.transition,
                }}
              >
                <div
                  style={{
                    fontFamily: DS.headingFont,
                    fontSize: 18,
                    fontWeight: 600,
                    color: DS.text,
                    marginBottom: 6,
                  }}
                >
                  {dim.name}
                </div>
                <div
                  style={{
                    fontFamily: DS.monoFont,
                    fontSize: 9,
                    color: accent,
                    textTransform: 'uppercase',
                    letterSpacing: '0.18em',
                    marginTop: 6,
                    marginBottom: 10,
                  }}
                >
                  DIMENSION {String(i + 1).padStart(2, '0')}
                </div>
                <p
                  style={{
                    fontFamily: DS.bodyFont,
                    fontSize: 14,
                    color: DS.textSecondary,
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  {dim.shortDescription}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection({
  formatQuestionCount,
  formatTimeMinutes,
  accent,
}: {
  formatQuestionCount: number;
  formatTimeMinutes: number;
  accent: string;
}) {
  const steps = [
    {
      mono: '01 · QUESTIONS',
      title: 'Answer focused diagnostic questions',
      body: `[Emily: step 1 copy — placeholder. Approximately ${formatQuestionCount} calibrated questions across the diagnostic's dimensional framework. ~${formatTimeMinutes} minutes. Behavioural and situational, not abstract traits.]`,
    },
    {
      mono: '02 · SCORING',
      title: 'NEXUS scores and interprets each dimension',
      body: '[Emily: step 2 copy — placeholder. Each dimension scored 0–100 with written interpretation calibrated against real executive populations. Composite score + per-dimension verdicts.]',
    },
    {
      mono: '03 · RESULTS',
      title: 'Get your report and debrief with NEXUS',
      body: '[Emily: step 3 copy — placeholder. PDF report download, NEXUS walks you through the key findings in chat, and you can book a live debrief to go deeper if you want.]',
    },
  ];

  return (
    <section data-depth-how style={{ background: DS.bgAlt, padding: '96px 32px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <div>
          <div style={EYEBROW_MONO}>HOW IT WORKS</div>
          <h2 style={SECTION_TITLE}>A clear three-step path to insight.</h2>
          <p style={SECTION_LEAD}>
            {formatQuestionCount} questions · approximately {formatTimeMinutes} minutes · NEXUS debrief included.
          </p>
        </div>

        <div
          className="depth-how-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
            marginTop: 56,
          }}
        >
          {steps.map((step, i) => (
            <div
              key={i}
              style={{
                background: DS.bg,
                border: `1px solid ${DS.border}`,
                padding: 0,
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: i === 0 ? accent : DS.border,
                }}
              />
              <div style={{ padding: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      background: accent,
                      color: DS.bg,
                      fontFamily: DS.monoFont,
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {i + 1}
                  </div>
                  <div
                    style={{
                      fontFamily: DS.monoFont,
                      fontSize: 10,
                      letterSpacing: '0.2em',
                      color: accent,
                      textTransform: 'uppercase',
                    }}
                  >
                    {step.mono}
                  </div>
                </div>
                <h3
                  style={{
                    fontFamily: DS.headingFont,
                    fontSize: 18,
                    fontWeight: 600,
                    color: DS.text,
                    margin: 0,
                    lineHeight: 1.35,
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontFamily: DS.bodyFont,
                    fontSize: 14,
                    color: DS.textSecondary,
                    lineHeight: 1.55,
                    margin: 0,
                    marginTop: 12,
                  }}
                >
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            marginTop: 48,
            padding: '24px 28px',
            background: DS.bg,
            border: `1px solid ${DS.border}`,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: DS.headingFont,
                fontSize: 32,
                fontWeight: 700,
                color: accent,
                lineHeight: 1,
              }}
            >
              {formatQuestionCount}
            </div>
            <div
              style={{
                fontFamily: DS.monoFont,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: DS.muted,
                marginTop: 6,
              }}
            >
              Questions
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: DS.headingFont,
                fontSize: 32,
                fontWeight: 700,
                color: accent,
                lineHeight: 1,
              }}
            >
              {formatTimeMinutes}
            </div>
            <div
              style={{
                fontFamily: DS.monoFont,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: DS.muted,
                marginTop: 6,
              }}
            >
              Minutes
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: DS.headingFont,
                fontSize: 32,
                fontWeight: 700,
                color: accent,
                lineHeight: 1,
              }}
            >
              0–100
            </div>
            <div
              style={{
                fontFamily: DS.monoFont,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: DS.muted,
                marginTop: 6,
              }}
            >
              Composite Score
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: DS.headingFont,
                fontSize: 32,
                fontWeight: 700,
                color: accent,
                lineHeight: 1,
              }}
            >
              PDF
            </div>
            <div
              style={{
                fontFamily: DS.monoFont,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: DS.muted,
                marginTop: 6,
              }}
            >
              Report Export
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhatYouGetSection({ accent }: { accent: string }) {
  const bullets = [
    {
      icon: <Download size={18} />,
      title: 'PDF report download',
      desc: '[Emily: bullet 1 copy — placeholder. Branded PDF report with composite score, dimension breakdowns, written interpretation, and dimensional profile visualization.]',
    },
    {
      icon: <MessageSquare size={18} />,
      title: 'NEXUS debrief in chat',
      desc: '[Emily: bullet 2 copy — placeholder. NEXUS walks you through the key findings, highlights the most meaningful signals, and answers follow-up questions in conversation.]',
    },
    {
      icon: <Calendar size={18} />,
      title: 'Book a live debrief to go deeper',
      desc: '[Emily: upsell copy — placeholder. After your results, NEXUS can suggest a live debrief session with a certified coach if you want to turn the diagnostic into a concrete action plan. 30–90 minutes depending on depth.]',
      isUpsell: true,
    },
  ];

  return (
    <section data-depth-get style={{ background: DS.bg, padding: '96px 32px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div>
          <div style={EYEBROW_MONO}>WHAT YOU GET</div>
          <h2 style={SECTION_TITLE}>Insight you can act on, not just file away.</h2>
          <p style={SECTION_LEAD}>
            [Emily: what you get lead paragraph — placeholder. Your diagnostic includes the PDF report,
            NEXUS chat debrief, and the option to book a live human debrief if you want to go deeper.]
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginTop: 48 }}>
          {bullets.map((b, i) => (
            <div
              key={i}
              style={{
                background: b.isUpsell ? DS.bgAlt : DS.bg,
                border: b.isUpsell ? `1px solid ${accent}` : `1px solid ${DS.border}`,
                padding: '24px 28px',
                display: 'flex',
                gap: 20,
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: 36,
                  height: 36,
                  background: b.isUpsell ? accent : DS.bgAlt,
                  color: b.isUpsell ? DS.bg : accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {b.icon}
              </div>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontFamily: DS.headingFont,
                    fontSize: 18,
                    fontWeight: 600,
                    color: DS.text,
                    margin: 0,
                  }}
                >
                  {b.title}
                </h3>
                <p
                  style={{
                    fontFamily: DS.bodyFont,
                    fontSize: 14,
                    color: DS.textSecondary,
                    lineHeight: 1.55,
                    margin: 0,
                    marginTop: 8,
                  }}
                >
                  {b.desc}
                </p>
                {b.isUpsell && (
                  <a
                    href="/nexus/chat"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      marginTop: 12,
                      fontFamily: DS.bodyFont,
                      fontSize: 13,
                      fontWeight: 600,
                      color: accent,
                      textDecoration: 'underline',
                      textUnderlineOffset: 3,
                      transition: DS.transition,
                    }}
                  >
                    Ask NEXUS about a live debrief
                    <ArrowRight size={12} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SampleReportSection({
  sampleReportPlaceholder,
  accent,
}: {
  sampleReportPlaceholder: string;
  accent: string;
}) {
  return (
    <section data-depth-sample style={{ background: DS.bgAlt, padding: '96px 32px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div>
          <div style={EYEBROW_MONO}>SAMPLE REPORT</div>
          <h2 style={SECTION_TITLE}>See what your report looks like.</h2>
          <p style={SECTION_LEAD}>
            [Emily: sample report lead — placeholder. Real sample reports are being prepared per
            diagnostic. Below is an indicative preview of the report structure and information density.]
          </p>
        </div>

        <div
          style={{
            marginTop: 48,
            background: DS.bg,
            border: `1px solid ${DS.border}`,
            padding: 0,
          }}
        >
          <div
            style={{
              padding: '12px 20px',
              background: DS.bgDark,
              borderBottom: `1px solid ${DS.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                background: '#FF5F57',
              }}
            />
            <div
              style={{
                width: 10,
                height: 10,
                background: '#FEBC2E',
              }}
            />
            <div
              style={{
                width: 10,
                height: 10,
                background: '#28C840',
              }}
            />
            <div
              style={{
                fontFamily: DS.monoFont,
                fontSize: 11,
                color: DS.mutedDim,
                marginLeft: 12,
                letterSpacing: '0.1em',
              }}
            >
              report_preview.pdf
            </div>
          </div>

          <div
            style={{
              padding: '80px 40px',
              textAlign: 'center',
              minHeight: 400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ maxWidth: 560 }}>
              <FileText size={48} color={DS.mutedDim} style={{ marginBottom: 24 }} />
              <div
                style={{
                  fontFamily: DS.headingFont,
                  fontSize: 20,
                  fontWeight: 600,
                  color: DS.muted,
                  marginBottom: 8,
                }}
              >
                [Sample report preview — real samples TBD]
              </div>
              <p
                style={{
                  fontFamily: DS.bodyFont,
                  fontSize: 14,
                  color: DS.mutedDim,
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {sampleReportPlaceholder}
              </p>
              <div
                style={{
                  display: 'inline-block',
                  marginTop: 24,
                  padding: '6px 14px',
                  fontFamily: DS.monoFont,
                  fontSize: 10,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: accent,
                  border: `1px solid ${accent}40`,
                  background: `${accent}0A`,
                }}
              >
                Samples forthcoming
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaSection({
  diagnosticName,
  accent,
  accentDark,
}: {
  diagnosticName: string;
  accent: string;
  accentDark: string;
}) {
  return (
    <section data-depth-cta style={{ background: COLOR_BG_DARK, position: 'relative', overflow: 'hidden' }}>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 40%, ${accent}0F 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          maxWidth: 680,
          margin: '0 auto',
          padding: '112px 32px',
          position: 'relative',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontFamily: DS.headingFont,
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 700,
            color: COLOR_TEXT_ON_DARK,
            lineHeight: 1.15,
            letterSpacing: '-0.015em',
            margin: 0,
          }}
        >
          NEXUS will recommend this diagnostic in conversation.
        </h2>
        <p
          style={{
            fontFamily: DS.bodyFont,
            color: COLOR_MUTED_ON_DARK,
            fontSize: 16,
            lineHeight: 1.6,
            marginTop: 20,
            maxWidth: 520,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {diagnosticName} isn&rsquo;t a self-serve catalog item. Start with NEXUS — describe the
          context you&rsquo;re working in, and NEXUS will recommend the right diagnostic at the right
          moment. No browsing required.
        </p>
        <div style={{ marginTop: 32 }}>
          <CtaButton
            href="/nexus/chat"
            label="Start with NEXUS"
            accent={accent}
            accentDark={accentDark}
            size="lg"
            icon={<MessageSquare size={16} />}
          />
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 24,
            marginTop: 28,
          }}
        >
          {[
            'RECOMMENDED BY NEXUS',
            'NO CATALOG BROWSING',
            'CONTEXT-FIRST MATCHING',
          ].map((t, i, arr) => (
            <React.Fragment key={t}>
              <span
                style={{
                  fontFamily: DS.monoFont,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: DS.mutedDim,
                }}
              >
                {t}
              </span>
              {i < arr.length - 1 && <span style={{ color: DS.mutedDim }}>·</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── MAIN EXPORT ─────────────────────────────────────────────────────

export function DepthPageTemplate(props: DepthPageTemplateProps) {
  const {
    diagnosticCode,
    diagnosticName,
    descriptor,
    tagline,
    mileCost,
    costTier,
    dimensionPlaceholders = [],
    pillarMapping,
    formatQuestionCount = 30,
    formatTimeMinutes = 12,
    sampleReportPlaceholder = '[Emily: per-diagnostic sample report preview description — placeholder. Real samples will include composite score visualization, dimension heatmap, written interpretation excerpts, and action plan preview.]',
  } = props;

  const { accent, accentDark } = getAccentForCode(diagnosticCode);

  return (
    <main data-depth-page={diagnosticCode.toLowerCase()}>
      <style>{`
        [data-depth-page="${diagnosticCode.toLowerCase()}"] .depth-dim-grid { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
        [data-depth-page="${diagnosticCode.toLowerCase()}"] .depth-how-grid { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
        @media (max-width: 768px) {
          [data-depth-page="${diagnosticCode.toLowerCase()}"] .depth-dim-grid { grid-template-columns: 1fr !important; }
          [data-depth-page="${diagnosticCode.toLowerCase()}"] .depth-how-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <HeroSection
        diagnosticCode={diagnosticCode}
        diagnosticName={diagnosticName}
        descriptor={descriptor}
        tagline={tagline}
        mileCost={mileCost}
        costTier={costTier}
        pillarMapping={pillarMapping}
        accent={accent}
        accentDark={accentDark}
      />

      <WhatItMeasuresSection
        dimensionPlaceholders={dimensionPlaceholders}
        accent={accent}
      />

      <HowItWorksSection
        formatQuestionCount={formatQuestionCount}
        formatTimeMinutes={formatTimeMinutes}
        accent={accent}
      />

      <WhatYouGetSection accent={accent} />

      <SampleReportSection
        sampleReportPlaceholder={sampleReportPlaceholder}
        accent={accent}
      />

      <CtaSection
        diagnosticName={diagnosticName}
        accent={accent}
        accentDark={accentDark}
      />
    </main>
  );
}

export default DepthPageTemplate;
