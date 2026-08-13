import React from 'react';
import { Link } from 'react-router-dom';
import {
  INK, OFF, G200, G400, G600, WHITE,
  monoStyle, containerStyle,
  useScrollReveal, RevealStyles,
} from '../landing/shared';
import { ResultsHero } from './ResultsHero';
import { ExecutiveSummary } from './ExecutiveSummary';
import { DimensionScorecard } from './DimensionScorecard';
import { ArchetypeProfile } from './ArchetypeProfile';
import { KeyInsights } from './KeyInsights';
import { DevelopmentPlan } from './DevelopmentPlan';
import { CrossDiagnosticSummary } from './CrossDiagnosticSummary';
import { ShareRetake } from './ShareRetake';
import { ProgressiveProfileModal } from '@/components/onboarding/ProgressiveProfileModal';
import type { AssessmentResultsConfig } from './types';

interface Props {
  config: AssessmentResultsConfig;
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
          fontFamily: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif",
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
              fontFamily: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif",
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
              <Link to="/dex-ai" style={footerLink}>LYC Intelligence</Link>
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

  return (
    <div style={{
      background: OFF, color: INK, minHeight: '100vh',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      lineHeight: 1.6, WebkitFontSmoothing: 'antialiased',
    }}>
      <Nav config={config} />
      <main>
        <ResultsHero config={config} />
        <ExecutiveSummary config={config} />
        <DimensionScorecard config={config} />
        <ArchetypeProfile config={config} />
        <KeyInsights config={config} />
        <DevelopmentPlan config={config} />
        <CrossDiagnosticSummary
          assessmentCode={config.assessmentCode}
          accent={config.accent}
          prefix={config.prefix}
          nexusPath={config.nexusPath}
        />
        <ShareRetake config={config} />
      </main>
      <Footer config={config} />
      <RevealStyles prefix={config.prefix} />
      {/*
        #1326 — Progressive profiling: lightly ask for title + company after
        the user has finished an assessment. The modal self-gates on missing
        profile fields and a 14-day dismissal flag in localStorage, so it
        only fires once per assessment cycle and never nags authenticated
        users who already have this data. Anonymous users see nothing —
        ProgressiveProfileModal bails when `profile` is null.
      */}
      <ProgressiveProfileModal assessmentName={config.assessmentName} />
    </div>
  );
}
