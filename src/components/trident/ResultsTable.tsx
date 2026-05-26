import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Download, Share2, Save, AlertTriangle, CheckCircle } from 'lucide-react';
import { TRIDENTResult, getTierFromScore, getScoreBarColor } from '../../services/tridentScoring';

const DS = {
  headingFont: 'Georgia, serif',
  accent: '#C108AB',
  bg: '#FFFFFF',
  card: '#FAFAFA',
  muted: '#666666',
  text: '#0A0A0A',
  textSecondary: '#333333',
  border: '#E5E5E5',
  radius: '12px',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF'
};

interface ResultsTableProps {
  results: TRIDENTResult[];
  onDownloadPDF?: (result: TRIDENTResult) => void;
  onShareCard?: (result: TRIDENTResult) => void;
  onSaveCandidate?: (result: TRIDENTResult) => void;
}

export function ResultsTable({ results, onDownloadPDF, onShareCard, onSaveCandidate }: ResultsTableProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  
  const sorted = [...results].sort((a, b) => b.composite_score - a.composite_score);
  
  const tierCounts = {
    T1: results.filter(r => getTierFromScore(r.composite_score).tier === 'T1').length,
    T2: results.filter(r => getTierFromScore(r.composite_score).tier === 'T2').length,
    T3: results.filter(r => getTierFromScore(r.composite_score).tier === 'T3').length
  };

  return (
    <div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '12px', 
        marginBottom: '24px' 
      }}>
        {[
          { tier: 'T1', label: 'Strong Primary', count: tierCounts.T1, color: DS.success },
          { tier: 'T2', label: 'Strong Secondary', count: tierCounts.T2, color: DS.warning },
          { tier: 'T3', label: 'Reserve', count: tierCounts.T3, color: DS.error },
        ].map(item => (
          <div key={item.tier} style={{ 
            background: DS.white, 
            border: `1px solid ${DS.border}`, 
            borderRadius: '8px', 
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
          const tier = getTierFromScore(result.composite_score);
          const isExpanded = expandedIndex === index;
          
          return (
            <div 
              key={index} 
              style={{ 
                background: DS.white, 
                border: `1px solid ${DS.border}`, 
                borderRadius: DS.radius, 
                overflow: 'hidden',
                transition: 'all 0.2s ease'
              }}
            >
              <div 
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                style={{ 
                  padding: '16px 20px', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px',
                  transition: 'background 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = DS.card}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '50%', 
                  background: `${tier.color}20`,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '14px', 
                  fontWeight: 700, 
                  color: tier.color,
                  flexShrink: 0
                }}>
                  {index + 1}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: DS.text }}>
                    {result.candidate_name}
                  </div>
                  <div style={{ fontSize: '12px', color: DS.muted, marginTop: '2px' }}>
                    {tier.label} · Tier {tier.tier}
                  </div>
                </div>

                <div style={{ textAlign: 'right', marginRight: '16px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: tier.color }}>
                    {result.composite_score}
                  </div>
                  <div style={{ fontSize: '11px', color: DS.muted }}>composite</div>
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
                  borderTop: `1px solid ${DS.border}`,
                  marginTop: '0'
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
                              borderRadius: '3px',
                              transition: 'width 0.5s ease'
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
                            color: DS.white,
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'opacity 0.2s ease',
                            minHeight: '44px'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                        >
                          <Download style={{ width: 14, height: 14 }} />
                          Download PDF (3 credits)
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
                            background: DS.card,
                            color: DS.text,
                            border: `1px solid ${DS.border}`,
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            minHeight: '44px'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = DS.accent;
                            e.currentTarget.style.color = DS.accent;
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = DS.border;
                            e.currentTarget.style.color = DS.text;
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
                            background: DS.card,
                            color: DS.text,
                            border: `1px solid ${DS.border}`,
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            minHeight: '44px'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = DS.success;
                            e.currentTarget.style.color = DS.success;
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = DS.border;
                            e.currentTarget.style.color = DS.text;
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