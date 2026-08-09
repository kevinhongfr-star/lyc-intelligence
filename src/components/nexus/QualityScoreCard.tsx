import React, { useState } from 'react';
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  success: '#00897B',
  warning: '#B45309',
  danger: '#DC2626',
  radius: '0px',
};

export type QualityDimensionId =
  | 'diagnostic'
  | 'framework'
  | 'deliverable'
  | 'coaching'
  | 'reflection'
  | 'milestone'
  | 'seniority'
  | 'safety';

export interface QualityDimension {
  id: QualityDimensionId;
  label: string;
  score: number;
}

export interface QualityImprovement {
  id: string;
  text: string;
  dimension: QualityDimensionId;
}

export interface QualityScoreCardProps {
  /** Overall quality score (0-5) */
  score: number;
  /** Scores for each of the 8 quality dimensions */
  dimensions: QualityDimension[];
  /** Optional list of improvement recommendations */
  improvements?: QualityImprovement[];
  /** Additional className for styling */
  className?: string;
}

function getLetterGrade(score: number): string {
  if (score >= 4.3) return 'A';
  if (score >= 3.7) return 'B';
  if (score >= 2.7) return 'C';
  if (score >= 2.0) return 'D';
  return 'F';
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A':
      return DS.success;
    case 'B':
      return '#2563EB';
    case 'C':
      return DS.warning;
    case 'D':
      return '#EA580C';
    default:
      return DS.danger;
  }
}

const DIMENSION_LABELS: Record<QualityDimensionId, string> = {
  diagnostic: 'Diagnostic Depth',
  framework: 'Framework Alignment',
  deliverable: 'Deliverable Quality',
  coaching: 'Coaching Efficacy',
  reflection: 'Reflection Depth',
  milestone: 'Milestone Clarity',
  seniority: 'Seniority Match',
  safety: 'Safety & Boundaries',
};

const DIMENSION_ICONS: Record<QualityDimensionId, string> = {
  diagnostic: '🔍',
  framework: '🧩',
  deliverable: '📦',
  coaching: '🎯',
  reflection: '💭',
  milestone: '🏁',
  seniority: '🎓',
  safety: '🛡️',
};

export function QualityScoreCard({
  score,
  dimensions,
  improvements,
  className,
}: QualityScoreCardProps) {
  const [showHowToImprove, setShowHowToImprove] = useState(false);
  const letterGrade = getLetterGrade(score);
  const gradeColor = getGradeColor(letterGrade);

  return (
    <div
      className={cn('border border-[#E5E5E5] bg-white', className)}
      style={{ }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: `1px solid ${DS.border}`,
          background: DS.bgAlt,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award style={{ width: 18, height: 18, color: DS.accent }} />
          <span
            style={{
              fontFamily: DS.bodyFont,
              fontSize: '13px',
              fontWeight: 600,
              color: DS.text,
            }}
          >
            Quality Score
          </span>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              background: gradeColor,
              color: '#FFFFFF',
              fontSize: '28px',
              fontWeight: 700,
              fontFamily: DS.bodyFont,
              flexShrink: 0,
            }}
          >
            {letterGrade}
          </div>
          <div>
            <div
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: DS.text,
                fontFamily: DS.bodyFont,
                lineHeight: 1,
              }}
            >
              {score.toFixed(1)}
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 500,
                  color: DS.muted,
                  marginLeft: '4px',
                }}
              >
                / 5.0
              </span>
            </div>
            <div
              style={{
                fontSize: '12px',
                color: DS.muted,
                marginTop: '4px',
                fontFamily: DS.bodyFont,
              }}
            >
              Overall quality rating
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: DS.muted,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '10px',
            fontFamily: DS.bodyFont,
          }}
        >
          Dimension Breakdown
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {dimensions.map((dim) => (
            <div key={dim.id}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: DS.textSecondary,
                    fontFamily: DS.bodyFont,
                  }}
                >
                  {DIMENSION_ICONS[dim.id]} {DIMENSION_LABELS[dim.id] || dim.label}
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: DS.text,
                    fontFamily: DS.bodyFont,
                  }}
                >
                  {dim.score.toFixed(1)}
                </span>
              </div>
              <div
                style={{
                  position: 'relative',
                  height: '6px',
                  background: DS.border,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${(dim.score / 5) * 100}%`,
                    background:
                      dim.score >= 4
                        ? DS.success
                        : dim.score >= 3
                        ? DS.accent
                        : dim.score >= 2
                        ? DS.warning
                        : DS.danger,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {improvements && improvements.length > 0 && (
          <div
            style={{
              marginTop: '20px',
              padding: '12px 16px',
              background: DS.bgAlt,
              border: `1px solid ${DS.border}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '10px',
              }}
            >
              <TrendingUp style={{ width: 15, height: 15, color: DS.accent }} />
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: DS.text,
                  fontFamily: DS.bodyFont,
                }}
              >
                Suggested Improvements
              </span>
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {improvements.slice(0, 3).map((imp) => (
                <li
                  key={imp.id}
                  style={{
                    fontSize: '13px',
                    color: DS.textSecondary,
                    lineHeight: 1.5,
                    fontFamily: DS.bodyFont,
                  }}
                >
                  {imp.text}
                </li>
              ))}
            </ul>

            <button
              onClick={() => setShowHowToImprove((prev) => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '10px',
                padding: 0,
                background: 'transparent',
                border: 'none',
                color: DS.accent,
                fontSize: '12px',
                fontWeight: 600,
                fontFamily: DS.bodyFont,
                cursor: 'pointer',
              }}
            >
              {showHowToImprove ? (
                <>
                  Hide details <ChevronUp style={{ width: 14, height: 14 }} />
                </>
              ) : (
                <>
                  How to improve <ChevronDown style={{ width: 14, height: 14 }} />
                </>
              )}
            </button>

            {showHowToImprove && (
              <ul
                style={{
                  margin: '10px 0 0',
                  paddingLeft: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  borderTop: `1px solid ${DS.border}`,
                  paddingTop: '10px',
                }}
              >
                {improvements.map((imp) => (
                  <li
                    key={imp.id}
                    style={{
                      fontSize: '13px',
                      color: DS.textSecondary,
                      lineHeight: 1.5,
                      fontFamily: DS.bodyFont,
                    }}
                  >
                    <span
                      style={{
                        color: DS.muted,
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        marginRight: '6px',
                      }}
                    >
                      [{DIMENSION_LABELS[imp.dimension] || imp.dimension}]
                    </span>
                    {imp.text}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}