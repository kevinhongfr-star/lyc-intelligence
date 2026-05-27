
import React from 'react';
import { ShareCardType } from '../../services/shareCardService';

const DS = {
  accent: '#C108AB',
  bg: '#0A0A0A',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  success: '#10B981',
  warning: '#F59E0B',
  radius: '12px'
};

interface Props {
  type: ShareCardType;
  data: any;
  className?: string;
}

export function ShareCard({ type, data, className = '' }: Props) {
  const cardStyle: React.CSSProperties = {
    width: '1200px',
    height: '630px',
    background: DS.bg,
    padding: '48px',
    borderRadius: DS.radius,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden'
  };

  // Decorative gradient
  const gradientStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `radial-gradient(circle at 10% 20%, ${DS.accent}20 0%, transparent 50%), radial-gradient(circle at 90% 80%, #6366F120 0%, transparent 50%)`
  };

  switch (type) {
    case 'assessment':
      return (
        <div className={className} style={cardStyle}>
          <div style={gradientStyle} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '14px', color: DS.textSecondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Career Intelligence Profile
                </div>
                <div style={{ fontSize: '48px', fontWeight: 800, color: DS.text, marginBottom: '8px' }}>
                  {data?.name || 'Executive'}
                </div>
              </div>
              <div style={{ 
                padding: '8px 16px', 
                background: `${DS.accent}20`, 
                color: DS.accent, 
                fontWeight: 700, 
                borderRadius: '8px', 
                fontSize: '14px' 
              }}>
                LYC Intelligence
              </div>
            </div>

            <div style={{ marginTop: '32px' }}>
              <div style={{ fontSize: '36px', fontWeight: 800, color: DS.accent, marginBottom: '8px' }}>
                {data?.archetype || 'Strategic Architect'}
              </div>
              <div style={{ fontSize: '16px', color: DS.textSecondary, maxWidth: '600px' }}>
                {data?.tagline || 'Cross-border leadership with board-level influence'}
              </div>
            </div>

            <div style={{ marginTop: '40px' }}>
              {[
                { label: 'Strategic Orientation', score: data?.dimension_scores?.strategic_orientation || 0 },
                { label: 'Cross-border Adaptability', score: data?.dimension_scores?.cross_border_adaptability || 0 },
                { label: 'Stakeholder Influence', score: data?.dimension_scores?.stakeholder_influence || 0 }
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: i < 2 ? '16px' : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', color: DS.textSecondary }}>{item.label}</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: DS.text }}>{item.score}%</span>
                  </div>
                  <div style={{ height: '10px', background: '#1a1a1a', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${item.score}%`, 
                      background: item.score >= 70 ? DS.success : item.score >= 50 ? DS.warning : DS.accent, 
                      borderRadius: '5px' 
                    }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '14px', color: DS.textSecondary }}>Cross-border Readiness:</div>
              <div style={{ 
                padding: '8px 16px', 
                background: `${DS.success}20`, 
                color: DS.success, 
                fontWeight: 700, 
                borderRadius: '8px',
                fontSize: '14px'
              }}>
                {data?.cross_border_readiness?.label || 'Advanced'} — {data?.cross_border_readiness?.score || 80}/100
              </div>
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #222222', paddingTop: '24px' }}>
            <div style={{ fontSize: '14px', color: DS.textSecondary }}>
              Powered by LYC Intelligence
            </div>
            <div style={{ fontSize: '14px', color: DS.text }}>
              lyc-intelligence.app
            </div>
          </div>
        </div>
      );

    case 'trident':
      return (
        <div className={className} style={cardStyle}>
          <div style={gradientStyle} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '14px', color: DS.textSecondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Match Scorecard
                </div>
                <div style={{ fontSize: '48px', fontWeight: 800, color: DS.text, marginBottom: '8px' }}>
                  {data?.candidate_name || 'Candidate'}
                </div>
                <div style={{ fontSize: '18px', color: DS.textSecondary }}>
                  {data?.role || 'Assessed for Executive Role'}
                </div>
              </div>
              <div style={{ 
                padding: '8px 16px', 
                background: `${DS.accent}20`, 
                color: DS.accent, 
                fontWeight: 700, 
                borderRadius: '8px', 
                fontSize: '14px' 
              }}>
                LYC Intelligence
              </div>
            </div>

            <div style={{ marginTop: '32px', display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <div style={{ fontSize: '96px', fontWeight: 800, color: data?.composite_score >= 70 ? DS.success : DS.warning }}>
                {data?.composite_score || 0}
              </div>
              <div style={{ fontSize: '24px', color: DS.text }}>/100</div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <div style={{ 
                display: 'inline-block', 
                padding: '12px 24px', 
                background: data?.composite_score >= 70 ? `${DS.success}20` : `${DS.warning}20`, 
                color: data?.composite_score >= 70 ? DS.success : DS.warning, 
                fontSize: '18px', 
                fontWeight: 700, 
                borderRadius: '10px'
              }}>
                {data?.verdict || 'Strong Primary'}
              </div>
            </div>

            <div style={{ marginTop: '40px', display: 'flex', gap: '24px' }}>
              {[
                { label: 'Experience', score: data?.dimension_scores?.experience || 0 },
                { label: 'Skills', score: data?.dimension_scores?.skills || 0 },
                { label: 'Fit', score: data?.dimension_scores?.fit || 0 }
              ].map((item, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: DS.text }}>{item.score}</div>
                  <div style={{ fontSize: '14px', color: DS.textSecondary }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', borderTop: '1px solid #222222', paddingTop: '24px' }}>
            <div style={{ fontSize: '14px', color: DS.textSecondary }}>Powered by LYC Intelligence</div>
          </div>
        </div>
      );

    case 'progress':
      return (
        <div className={className} style={cardStyle}>
          <div style={gradientStyle} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '14px', color: DS.textSecondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Quarterly Progress Report
                </div>
                <div style={{ fontSize: '48px', fontWeight: 800, color: DS.text, marginBottom: '8px' }}>
                  {data?.name || 'Executive'}
                </div>
              </div>
              <div style={{ 
                padding: '8px 16px', 
                background: `${DS.accent}20`, 
                color: DS.accent, 
                fontWeight: 700, 
                borderRadius: '8px', 
                fontSize: '14px' 
              }}>
                LYC Intelligence
              </div>
            </div>

            <div style={{ marginTop: '32px', display: 'flex', gap: '48px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '18px', color: DS.textSecondary, marginBottom: '24px' }}>3 months ago vs today</div>
                {[
                  { label: 'Strategic Orientation', old: data?.strategic_old || 0, new: data?.strategic_new || 0 },
                  { label: 'Cross-border Adaptability', old: data?.adaptability_old || 0, new: data?.adaptability_new || 0 },
                  { label: 'Stakeholder Influence', old: data?.influence_old || 0, new: data?.influence_new || 0 }
                ].map((item, i) => {
                  const delta = item.new - item.old;
                  return (
                    <div key={i} style={{ marginBottom: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '16px', color: DS.text }}>{item.label}</span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', color: DS.textSecondary }}>{item.old} →</span>
                          <span style={{ fontSize: '16px', fontWeight: 700, color: DS.text }}>{item.new}</span>
                          {delta > 0 && <span style={{ fontSize: '14px', fontWeight: 700, color: DS.success }}>+{delta} pts</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ flex: 1, height: '12px', background: '#1a1a1a', borderRadius: '6px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${item.old}%`, background: '#333333', borderRadius: '6px' }} />
                        </div>
                        <div style={{ flex: 1, height: '12px', background: '#1a1a1a', borderRadius: '6px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${item.new}%`, background: DS.success, borderRadius: '6px' }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ width: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px' }}>
                <div style={{ 
                  padding: '20px', 
                  background: `${DS.success}15`, 
                  border: `1px solid ${DS.success}30`, 
                  borderRadius: '12px' 
                }}>
                  <div style={{ fontSize: '14px', color: DS.textSecondary, marginBottom: '4px' }}>Cross-border Readiness</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: DS.success }}>
                    {data?.readiness_old || 'Developing'} → {data?.readiness_new || 'Advanced'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #222222', paddingTop: '24px' }}>
            <div style={{ fontSize: '14px', color: DS.textSecondary }}>Powered by LYC Intelligence</div>
            <div style={{ fontSize: '14px', color: DS.text }}>lyc-intelligence.app</div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
