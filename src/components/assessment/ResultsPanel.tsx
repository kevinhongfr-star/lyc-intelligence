import React from 'react';
import { Download, CheckCircle2 } from 'lucide-react';
import {
  CPDArchetype,
  DimensionId,
  ASSESSMENT_ENGINE,
  ARCHETYPE_INFO,
  DIMENSION_INFO,
} from '../../services/assessmentEngine';

const DS = {
  headingFont: "'Libre Baskerville', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  accent: '#C108AB',
  accentHover: '#A00790',
  bg: '#FFFFFF',
  bgAlt: '#F5F5F5',
  card: '#FFFFFF',
  cardBorder: '#E5E5E5',
  text: '#000000',
  textSecondary: '#333333',
  muted: '#666666',
  border: '#E5E5E5',
  radius: '12px',
  radiusSm: '8px',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  shadowHover: '0 4px 12px rgba(0,0,0,0.1)',
};

interface ResultsPanelProps {
  compositeScore: number;
  dimensionScores: Record<DimensionId, number>;
  crossBorderScore: number;
  archetype: CPDArchetype;
  onDownloadPDF: () => void;
  isGeneratingPDF: boolean;
}

export function ResultsPanel({
  compositeScore,
  dimensionScores,
  crossBorderScore,
  archetype,
  onDownloadPDF,
  isGeneratingPDF
}: ResultsPanelProps) {
  const crossBorderTier = ASSESSMENT_ENGINE.getCrossBorderTier(crossBorderScore);
  const archetypeData = ARCHETYPE_INFO[archetype];

  const getScoreColor = (score: number) => {
    if (score >= 70) return DS.success;
    if (score >= 50) return DS.warning;
    return '#EF4444';
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      width: '100%',
    }}>
      {/* Success Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '32px'
      }}>
        
        <h2 style={{ fontFamily: DS.headingFont, fontSize: '28px', color: DS.text, marginBottom: '8px' }}>
          {archetype}
        </h2>
      </div>

      {/* Archetype Badge */}
      <div style={{
        background: `${DS.accent}15`,
        border: `1px solid ${DS.accent}40`,
        borderRadius: DS.radius,
        padding: '32px',
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        <h3 style={{
          fontFamily: DS.headingFont,
          fontSize: '22px',
          color: DS.text,
          margin: '0 0 8px'
        }}>
          Your Cross-Border Leadership Profile
        </h3>
        <p style={{
          color: DS.textSecondary,
          fontSize: '15px',
          margin: '0 0 12px',
          lineHeight: 1.6
        }}>
          {archetypeData.description}
        </p>
        <p style={{
          fontSize: '14px',
          color: DS.accent,
          fontWeight: '600',
          margin: 0
        }}>
          {archetypeData.tagline}
        </p>
      </div>

      {/* Composite Score */}
      <div style={{
        background: DS.card,
        border: `1px solid ${DS.cardBorder}`,
        borderRadius: DS.radius,
        padding: '24px',
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        <p style={{ color: DS.muted, fontSize: '13px', marginBottom: '8px' }}>
          Overall Assessment Score
        </p>
        <p style={{
          fontSize: '64px',
          fontWeight: 700,
          color: getScoreColor(compositeScore),
          margin: '0 0 8px'
        }}>
          {compositeScore}
        </p>
        <p style={{ color: DS.muted, fontSize: '13px', margin: 0 }}>
          Out of 100
        </p>
      </div>

      {/* Dimensions */}
      <div style={{
        background: DS.card,
        border: `1px solid ${DS.cardBorder}`,
        borderRadius: DS.radius,
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h4 style={{
          fontFamily: DS.headingFont,
          fontSize: '16px',
          color: DS.text,
          marginBottom: '20px'
        }}>
          Dimension Breakdown
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(Object.entries(DIMENSION_INFO) as Array<[DimensionId, any]>).map(([dimId, info]) => {
            const score = dimensionScores[dimId];
            return (
              <div key={dimId}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px'
                }}>
                  <span style={{ color: DS.text, fontSize: '14px' }}>
                    {info.name}
                  </span>
                  <span style={{
                    color: getScoreColor(score),
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {score}
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: DS.bg,
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${score}%`,
                    background: getScoreColor(score),
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cross-Border Tier */}
      <div style={{
        background: DS.card,
        border: `1px solid ${DS.cardBorder}`,
        borderRadius: DS.radius,
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h4 style={{
          fontFamily: DS.headingFont,
          fontSize: '16px',
          color: DS.text,
          marginBottom: '12px'
        }}>
          Cross-Border Readiness: {crossBorderTier.label}
        </h4>
        <p style={{
          fontSize: '14px',
          color: DS.textSecondary,
          marginBottom: '12px'
        }}>
          You scored {crossBorderScore} out of 100 for cross-border leadership readiness.
        </p>
      </div>

      {/* Strengths & Development Areas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{
          background: DS.card,
          border: `1px solid ${DS.cardBorder}`,
          borderRadius: DS.radius,
          padding: '20px'
        }}>
          <h4 style={{
            fontFamily: DS.headingFont,
            fontSize: '15px',
            color: DS.success,
            marginBottom: '12px'
          }}>
            Top Strengths
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: DS.textSecondary }}>
            {archetypeData.strengths.map((s, i) => (
              <li key={i} style={{ marginBottom: '8px', fontSize: '14px' }}>{s}</li>
            ))}
          </ul>
        </div>
        <div style={{
          background: DS.card,
          border: `1px solid ${DS.cardBorder}`,
          borderRadius: DS.radius,
          padding: '20px'
        }}>
          <h4 style={{
            fontFamily: DS.headingFont,
            fontSize: '15px',
            color: DS.warning,
            marginBottom: '12px'
          }}>
            Development Areas
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: DS.textSecondary }}>
            {archetypeData.development.map((d, i) => (
              <li key={i} style={{ marginBottom: '8px', fontSize: '14px' }}>{d}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Download PDF Button */}
      <button
        onClick={onDownloadPDF}
        disabled={isGeneratingPDF}
        style={{
          width: '100%',
          padding: '18px',
          background: DS.accent,
          color: '#FFFFFF',
          border: 'none',
          borderRadius: DS.radius,
          fontSize: '16px',
          fontWeight: 600,
          cursor: isGeneratingPDF ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          minHeight: '56px'
        }}
      >
        
        {/* Phase 6.1 — Insight bridge to Nexus */}
        <div style={{
          background: 'rgba(193,8,171,0.08)',
          border: '1px solid rgba(193,8,171,0.25)',
          borderRadius: '12px',
          padding: '20px 24px',
          marginTop: '24px',
        }}>
          <p style={{ color: DS.text, fontSize: '15px', lineHeight: 1.6, margin: '0 0 16px', fontFamily: DS.headingFont }}>
            Your biggest development area is <strong style={{ color: DS.accent }}>shown in your dimension scores</strong>.
            {compositeScore >= 70
              ? ' Given your strong overall positioning, this is the gap worth closing first.'
              : ' Combined with developing scores, this is where to focus your next 90 days.'}
          </p>
          <a
            href={`/nexus?context=assessment&archetype=${encodeURIComponent(archetype)}&score=${compositeScore}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', background: DS.accent, color: '#fff',
              borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '14px'
            }}
          >
            Build your 90-day plan with Nexus →
          </a>
        </div>
<Download style={{ width: 20, height: 20 }} />
        {isGeneratingPDF ? 'Generating PDF...' : 'Download Your Report'}
      </button>

      {/* Create Account CTA */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(193,8,171,0.08) 0%, rgba(99,102,241,0.08) 100%)',
        border: '1px solid rgba(193,8,171,0.2)',
        borderRadius: DS.radius,
        padding: '24px',
        marginTop: '20px',
        textAlign: 'center',
      }}>
        <h4 style={{
          fontFamily: DS.headingFont,
          fontSize: '18px',
          color: DS.text,
          margin: '0 0 8px',
        }}>
          Save Your Results & Unlock Your Career Portal
        </h4>
        <p style={{
          fontSize: '14px',
          color: DS.textSecondary,
          margin: '0 0 16px',
          lineHeight: 1.5,
        }}>
          Create an account to track your assessment history, receive personalized opportunities,
          and manage your career journey with LYC Intelligence.
        </p>
        <a
          href="/signup?icp=candidate"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 28px',
            background: DS.accent,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            textDecoration: 'none',
          }}
        >
          Create Account to Track →
        </a>
      </div>
    </div>
  );
}
