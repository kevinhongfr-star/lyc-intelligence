import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Download, Share2, Save, AlertTriangle, CheckCircle } from 'lucide-react';
import { MatchResult, getScoreBarColor } from '../../services/scoringClient';

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

function getFitLabel(score: number): { label: string; color: string } {
  if (score >= 75) return { label: 'Strong Fit', color: DS.success };
  if (score >= 50) return { label: 'Good Fit', color: DS.warning };
  return { label: 'Potential Fit', color: DS.error };
}

interface ResultsTableProps {
  results: MatchResult[];
  onDownloadPDF?: (result: MatchResult) => void;
  onShareCard?: (result: MatchResult) => void;
  onSaveCandidate?: (result: MatchResult) => void;
}

export function ResultsTable({ results, onDownloadPDF, onShareCard, onSaveCandidate }: ResultsTableProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  
  const sorted = [...results].sort((a, b) => b.composite_score - a.composite_score);
  
  const tierCounts = {
    strong: results.filter(r => r.composite_score >= 75).length,
    good: results.filter(r => r.composite_score >= 50 && r.composite_score < 75).length,
    potential: results.filter(r => r.composite_score < 50).length,
  };

  return (
    <div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
        gap: '12px', 
        marginBottom: '24px' 
      }}>
        {[
          { label: 'Strong Fit', count: tierCounts.strong, color: DS.success },
          { label: 'Good Fit', count: tierCounts.good, color: DS.warning },
          { label: 'Potential Fit', count: tierCounts.potential, color: DS.error },
        ].map(item => (
          <div key={item.label} style={{ 
            background: DS.card, 
            border: `1px solid ${DS.cardBorder}`, 
            borderRadius: '0px', 
            padding: '16px', 
            textAlign: 'center' 
          }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: item.color }}>
              {item.count}
            </div>
            <div style={{ fontSize: '12px', color: DS.muted, marginTop: '4px' }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sorted.map((result, index) => {
          const fit = getFitLabel(result.composite_score);
          const isExpanded = expandedIndex === index;
          
          return (
            <div 
              key={index} 
              style={{ 
                background: DS.card, 
                border: `1px solid ${DS.cardBorder}`, 
                borderRadius: DS.radius, 
                overflow: 'hidden'
              }}
            >
              <div 
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                style={{ 
                  padding: '16px 20px', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px'
                }}
              >
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '50%', 
                  background: `${fit.color}20`,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '14px', 
                  fontWeight: 700, 
                  color: fit.color,
                  flexShrink: 0
                }}>
                  {index + 1}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: DS.text }}>
                    {result.candidate_name}
                  </div>
                  <div style={{ fontSize: '12px', color: DS.muted, marginTop: '2px' }}>
                    {fit.label}
                  </div>
                </div>

                <div style={{ textAlign: 'right', marginRight: '16px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: fit.color }}>
                    {result.composite_score}
                  </div>
                  <div style={{ fontSize: '11px', color: DS.muted }}>score</div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginRight: '8px' }}>
                  {[
                    { label: 'EXP', score: result.dimension_scores.experience },
                    { label: 'SKL', score: result.dimension_scores.skills },
                    { label: 'FIT', score: result.dimension_scores.fit },
                  ].map(dim => (
                    <div key={dim.label} style={{ textAlign: 'center', minWidth: '36px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: getScoreBarColor(dim.score) }}>
                        {dim.score}
                      </div>
                      <div style={{ fontSize: '10px', color: DS.muted }}>{dim.label}</div>
                    </div>
                  ))}
                </div>

                {isExpanded ? (
                  <ChevronUp style={{ width: 18, height: 18, color: DS.muted }} />
                ) : (
                  <ChevronDown style={{ width: 18, height: 18, color: DS.muted }} />
                )}
              </div>

              {isExpanded && (
                <div style={{ 
                  padding: '0 20px 20px', 
                  borderTop: `1px solid ${DS.border}`
                }}>
                  <div style={{ paddingTop: '16px' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ 
                        fontSize: '12px', 
                        fontWeight: 700, 
                        color: DS.success, 
                        margin: '0 0 8px 0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <CheckCircle style={{ width: 14, height: 14 }} />
                        Key Match Reasons
                      </h4>
                      <ul style={{ 
                        margin: 0, 
                        paddingLeft: '20px',
                        fontSize: '13px', 
                        color: DS.textSecondary,
                        lineHeight: 1.6
                      }}>
                        {result.match_reasons.map((reason, i) => (
                          <li key={i} style={{ marginBottom: '4px' }}>{reason}</li>
                        ))}
                      </ul>
                    </div>

                    {result.risk_factors.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ 
                          fontSize: '12px', 
                          fontWeight: 700, 
                          color: DS.warning, 
                          margin: '0 0 8px 0',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <AlertTriangle style={{ width: 14, height: 14 }} />
                          Risk Factors
                        </h4>
                        <ul style={{ 
                          margin: 0, 
                          paddingLeft: '20px',
                          fontSize: '13px', 
                          color: DS.textSecondary,
                          lineHeight: 1.6
                        }}>
                          {result.risk_factors.map((risk, i) => (
                            <li key={i} style={{ marginBottom: '4px' }}>{risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ 
                        fontSize: '12px', 
                        fontWeight: 700, 
                        color: DS.accent, 
                        margin: '0 0 8px 0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Approach Strategy
                      </h4>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '13px', 
                        color: DS.textSecondary,
                        lineHeight: 1.6 
                      }}>
                        {result.approach_strategy}
                      </p>
                    </div>

                    <div style={{ 
                      marginTop: '16px', 
                      display: 'flex', 
                      gap: '12px',
                      paddingTop: '16px',
                      borderTop: `1px solid ${DS.border}`
                    }}>
                      {[
                        { label: 'Experience', score: result.dimension_scores.experience },
                        { label: 'Skills', score: result.dimension_scores.skills },
                        { label: 'Fit', score: result.dimension_scores.fit },
                      ].map(dim => (
                        <div key={dim.label} style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', color: DS.muted }}>{dim.label}</span>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: DS.text }}>{dim.score}</span>
                          </div>
                          <div style={{ height: '6px', background: DS.border, borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ 
                              height: '100%', 
                              width: `${dim.score}%`, 
                              background: getScoreBarColor(dim.score), 
                              borderRadius: '3px'
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ 
                      marginTop: '16px',
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}>
                      {onDownloadPDF && (
                        <button
                          onClick={() => onDownloadPDF(result)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '10px 16px',
                            background: DS.accent,
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '0px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            minHeight: '44px'
                          }}
                        >
                          <Download style={{ width: 14, height: 14 }} />
                          Download PDF
                        </button>
                      )}
                      
                      {onShareCard && (
                        <button
                          onClick={() => onShareCard(result)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '10px 16px',
                            background: DS.bg,
                            color: DS.textSecondary,
                            border: `1px solid ${DS.cardBorder}`,
                            borderRadius: '0px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            minHeight: '44px'
                          }}
                        >
                          <Share2 style={{ width: 14, height: 14 }} />
                          Share Card
                        </button>
                      )}
                      
                      {onSaveCandidate && (
                        <button
                          onClick={() => onSaveCandidate(result)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '10px 16px',
                            background: DS.bg,
                            color: DS.textSecondary,
                            border: `1px solid ${DS.cardBorder}`,
                            borderRadius: '0px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            minHeight: '44px'
                          }}
                        >
                          <Save style={{ width: 14, height: 14 }} />
                          Save Candidate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}