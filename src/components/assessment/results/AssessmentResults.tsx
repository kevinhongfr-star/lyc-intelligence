import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  INK, OFF, G200, G400, G600, WHITE,
  monoStyle, containerStyle,
  useScrollReveal, RevealStyles,
} from '../landing/shared';
import { ResultsHero } from './ResultsHero';
import { DimensionScorecard } from './DimensionScorecard';
import { ArchetypeProfile } from './ArchetypeProfile';
import { KeyInsights } from './KeyInsights';
import { DevelopmentPlan } from './DevelopmentPlan';
import { NEXUSCTA } from './NEXUSCTA';
import { ShareRetake } from './ShareRetake';
// #1322: Executive summary + progressive Section wrappers (new)
import { ExecutiveSummary } from './ExecutiveSummary';
import { Section } from './Section';
import type {
  AssessmentResultsConfig,
  ExecutiveSummary as ExecutiveSummaryType,
} from './types';

interface Props {
  config: AssessmentResultsConfig;
}

/**
 * Auto-build a sane ExecutiveSummary when a renderer hasn't provided one yet.
 * Uses bracket classification + top strength/gap dimensions + archetype to
 * write a plausible 30-second summary. This lets us land #1322 immediately on
 * all 11 assessment results pages without waiting for content to be authored.
 */
function deriveExecutiveSummary(config: AssessmentResultsConfig): ExecutiveSummaryType {
  const sortedDims = [...config.dimensions].sort((a, b) => b.score - a.score);
  const strongest = sortedDims[0];
  const weakest = sortedDims[sortedDims.length - 1];

  let bracket: ExecutiveSummaryType['bracket'];
  if (config.overallScore >= 85) bracket = 'Top 10%';
  else if (config.overallScore >= 75) bracket = 'Top Quartile';
  else if (config.overallScore >= 62) bracket = 'Above Average';
  else if (config.overallScore >= 50) bracket = 'Solid Midfield';
  else if (config.overallScore >= 35) bracket = 'Developing';
  else bracket = 'Needs Attention';

  const headline = `${config.archetype.name} — ${bracket} placement.`;
  const synopsis =
    strongest && weakest
      ? `Your result is shaped by a sharp strength in ${strongest.name} (${strongest.score}) paired with an opportunity in ${weakest.name} (${weakest.score}). Your ${config.archetype.name} profile means you lean toward ${config.archetype.traits[0]?.toLowerCase() ?? 'a systematic approach'} — a differentiator in the right context.`
      : `Your ${config.archetype.name} profile sits in the ${bracket} range. ${config.archetype.description}`;

  const keyTakeaways: ExecutiveSummaryType['keyTakeaways'] = [
    strongest
      ? {
          tone: 'strength',
          label: `${strongest.name} is your stand-out strength`,
          detail: strongest.description || `Your ${strongest.name} score (${strongest.score}) differentiates you from peers.`,
        }
      : { tone: 'neutral', label: 'Exec summary', detail: 'See below for full details.' },
    weakest && weakest.score < (strongest?.score ?? 80) - 20
      ? {
          tone: 'gap',
          label: `${weakest.name} is your development focus`,
          detail: weakest.description || `A score of ${weakest.score} suggests room to deepen this dimension with focused practice.`,
        }
      : {
          tone: 'neutral',
          label: 'Balanced profile',
          detail: 'Dimension scores are clustered — no extreme gaps, no single hero dimension.',
        },
    {
      tone: 'neutral',
      label: `Archetype: ${config.archetype.name}`,
      detail:
        config.archetype.traits[0]
          ? `${config.archetype.traits[0]} — a signature tendency.`
          : config.archetype.description.slice(0, 140),
    },
  ];

  return { headline, synopsis, keyTakeaways, bracket };
}

// ── NAV ────────────────────────────────────────────────────────────
function Nav({ config }: { config: AssessmentResultsConfig }) {
  const { assessmentName, accent } = config;
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      background: 'rgba(245,245,243,0.96)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      zIndex: 100, borderBottom: `1px solid ${G200}`,
    }}>
      <div style={{ ...containerStyle, padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{
          fontFamily: "'Libre Baskerville', Georgia, serif",
          fontSize: 20, fontWeight: 700, textDecoration: 'none', color: INK,
          display: 'flex', alignItems: 'baseline', gap: 6,
        }}>
          {assessmentName} <span style={{
            fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
            fontSize: 10, fontWeight: 400, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: G400,
          }}>Results</span>
        </Link>
        <Link to="/nexus" style={{
          fontSize: 13, fontWeight: 500, color: WHITE, textDecoration: 'none',
          padding: '8px 20px', background: accent,
          transition: 'opacity 120ms ease', minHeight: 36,
          display: 'inline-flex', alignItems: 'center',
        }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>
          NEXUS
        </Link>
      </div>
    </nav>
  );
}

// ── FOOTER ─────────────────────────────────────────────────────────
function Footer({ config }: { config: AssessmentResultsConfig }) {
  const { assessmentName, accent } = config;
  const footerLink: React.CSSProperties = { color: G600, textDecoration: 'none', fontSize: 13, lineHeight: 2 };

  return (
    <footer style={{ background: OFF, borderTop: `1px solid ${G200}`, padding: '64px 0 32px' }}>
      <div style={containerStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48 }}>
          <div>
            <span style={{
              fontFamily: "'Libre Baskerville', Georgia, serif",
              fontSize: 18, fontWeight: 700, color: INK,
            }}>{assessmentName}</span>
            <p style={{ fontSize: 13, color: G600, marginTop: 12, lineHeight: 1.5, maxWidth: 300 }}>
              Part of the LYC Intelligence diagnostic suite. Know where you stand. Know where to go.
            </p>
          </div>
          <div>
            <div style={{ ...monoStyle, color: G400, marginBottom: 12 }}>Platform</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Link to="/nexus" style={footerLink}>NEXUS</Link>
              <Link to="/dex-ai" style={footerLink}>DEX AI</Link>
              <Link to="/pricing" style={footerLink}>Pricing</Link>
            </div>
          </div>
        </div>
        <div style={{
          paddingTop: 32, borderTop: `1px solid ${G200}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, color: G400 }}>
            © 2026 LYC Intelligence by LYC Partners.
          </span>
          <span style={{ ...monoStyle, color: accent }}>
            {assessmentName}
          </span>
        </div>
      </div>
    </footer>
  );
}

// ── MAIN WRAPPER ───────────────────────────────────────────────────
export function AssessmentResults({ config }: Props) {
  useScrollReveal(config.prefix);
  const revealClass = `${config.prefix}-reveal`;

  // #1322: Always have an executive summary — renderer-supplied or auto-derived.
  const summary = useMemo(
    () => config.executiveSummary ?? deriveExecutiveSummary(config),
    [config],
  );

  return (
    <div style={{
      background: OFF, color: INK, minHeight: '100vh',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      lineHeight: 1.6, WebkitFontSmoothing: 'antialiased',
    }}>
      <Nav config={config} />
      <main>
        {/* 1. Hero: big score + archetype reveal (immediate, no gate) */}
        <Section
          sectionId="hero"
          label=""
          title=""
          revealClass={revealClass}
          accent={config.accent}
        >
          <ResultsHero config={config} />
        </Section>

        {/* 2. Executive Summary (30-second verdict) — auto-unfolded, no gate */}
        <ExecutiveSummary
          summary={summary}
          accent={config.accent}
          revealClass={revealClass}
          overallScore={config.overallScore}
          assessmentName={config.assessmentName}
        />

        {/* 3. Dimension Scorecard — GATED progressive reveal */}
        <Section
          sectionId="dimensions"
          label="01 · Deep Dive"
          title="Your dimension scorecard"
          revealClass={revealClass}
          accent={config.accent}
          gated
          gateCopy="Reveal your dimension breakdown"
        >
          <DimensionScorecard config={config} />
        </Section>

        {/* 4. Archetype Profile — GATED */}
        <Section
          sectionId="archetype"
          label="02 · Archetype"
          title={`What it means to be a ${config.archetype.name}`}
          revealClass={revealClass}
          accent={config.accent}
          gated
          gateCopy="Reveal the archetype story"
        >
          <ArchetypeProfile config={config} />
        </Section>

        {/* 5. Key Insights — GATED */}
        <Section
          sectionId="insights"
          label="03 · Insights"
          title="Stand-out themes we noticed"
          revealClass={revealClass}
          accent={config.accent}
          gated
          gateCopy="Reveal key insights"
        >
          <KeyInsights config={config} />
        </Section>

        {/* 6. Development Plan — GATED */}
        <Section
          sectionId="development"
          label="04 · Action Plan"
          title="Where to invest the next 90 days"
          revealClass={revealClass}
          accent={config.accent}
          gated
          gateCopy="Reveal development actions"
        >
          <DevelopmentPlan config={config} />
        </Section>

        {/* 7. NEXUS CTA (no gate) */}
        <Section
          sectionId="nexus"
          label=""
          title=""
          revealClass={revealClass}
          accent={config.accent}
        >
          <NEXUSCTA config={config} />
        </Section>

        {/* 8. Share / Retake (no gate) */}
        <Section
          sectionId="share"
          label=""
          title=""
          revealClass={revealClass}
          accent={config.accent}
        >
          <ShareRetake config={config} />
        </Section>
      </main>
      <Footer config={config} />
      <RevealStyles prefix={config.prefix} />
    </div>
  );
}
