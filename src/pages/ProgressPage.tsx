import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, Minus, Calendar, RefreshCw,
  Target, ArrowRight, ChevronLeft, Loader2, Award
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { getSupabase } from '../services/supabaseApi';

const DS = {
  headingFont: 'Georgia, serif',
  accent: '#C108AB',
  accentLight: '#E040C8',
  bg: '#0A0A0A',
  card: '#111111',
  cardHover: '#1a1a1a',
  muted: '#888888',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  border: '#222222',
  radius: '12px',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444'
};

interface AssessmentRecord {
  id: string;
  archetype: string;
  composite_score: number;
  scores: Record<string, number>;
  cross_border_score: number;
  created_at: string;
}

const DIMENSION_LABELS: Record<string, string> = {
  strategic_orientation: 'Strategic Orientation',
  cross_border_adaptability: 'Cross-Border Adaptability',
  stakeholder_influence: 'Stakeholder Influence',
  execution_discipline: 'Execution Discipline',
  leadership_presence: 'Leadership Presence'
};

const DIMENSION_COLORS: Record<string, string> = {
  strategic_orientation: '#6366F1',
  cross_border_adaptability: '#10B981',
  stakeholder_influence: '#F59E0B',
  execution_discipline: '#EC4899',
  leadership_presence: '#06B6D4'
};

export function ProgressPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentRecord | null>(null);
  const [previousAssessment, setPreviousAssessment] = useState<AssessmentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [daysSinceLastAssessment, setDaysSinceLastAssessment] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadAssessments();
  }, [user]);

  const loadAssessments = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const sb = getSupabase();
      const { data } = await sb
        .from('assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        const parsed = data.map((a: any) => ({
          id: a.id,
          archetype: a.archetype,
          composite_score: a.composite_score,
          scores: JSON.parse(a.scores || '{}'),
          cross_border_score: a.cross_border_score || 0,
          created_at: a.created_at
        }));
        
        setAssessments(parsed);
        setSelectedAssessment(parsed[0]);
        
        if (parsed.length > 1) {
          setPreviousAssessment(parsed[1]);
        }
        
        // Calculate days since last assessment
        const lastDate = new Date(parsed[0].created_at);
        const now = new Date();
        const diff = now.getTime() - lastDate.getTime();
        setDaysSinceLastAssessment(Math.floor(diff / (1000 * 60 * 60 * 24)));
      }
    } catch (e) {
      console.error('[Progress] Load error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreDelta = (dimension: string): number | null => {
    if (!selectedAssessment || !previousAssessment) return null;
    const current = selectedAssessment.scores[dimension];
    const previous = previousAssessment.scores[dimension];
    if (current == null || previous == null) return null;
    return current - previous;
  };

  const getDeltaIcon = (delta: number | null) => {
    if (delta === null) return null;
    if (delta > 0) return <TrendingUp style={{ width: 14, height: 14, color: DS.success }} />;
    if (delta < 0) return <TrendingDown style={{ width: 14, height: 14, color: DS.error }} />;
    return <Minus style={{ width: 14, height: 14, color: DS.muted }} />;
  };

  const getDeltaColor = (delta: number | null) => {
    if (delta === null) return DS.muted;
    if (delta > 0) return DS.success;
    if (delta < 0) return DS.error;
    return DS.muted;
  };

  const formatDelta = (delta: number | null) => {
    if (delta === null) return '';
    if (delta > 0) return `+${delta}`;
    return delta.toString();
  };

  const canRetake = daysSinceLastAssessment >= 90;

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: DS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 style={{ width: 32, height: 32, color: DS.accent, animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: DS.bg }}>
      {/* Header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: DS.muted,
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '24px'
          }}
        >
          <ChevronLeft style={{ width: 16, height: 16 }} />
          Back to Dashboard
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontFamily: DS.headingFont, fontSize: '28px', fontWeight: 700, color: DS.text, marginBottom: '4px' }}>
              Your Progress
            </h1>
            <p style={{ color: DS.muted, fontSize: '14px' }}>
              Track your growth over time
            </p>
          </div>
          
          {canRetake && (
            <button
              onClick={() => navigate('/assessment')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: DS.accent,
                color: '#FFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <RefreshCw style={{ width: 16, height: 16 }} />
              Retake Assessment
            </button>
          )}
        </div>

        {assessments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', background: DS.card, borderRadius: '16px', border: `1px solid ${DS.border}` }}>
            <Target style={{ width: 48, height: 48, color: DS.muted, margin: '0 auto 16px' }} />
            <h2 style={{ fontFamily: DS.headingFont, fontSize: '20px', color: DS.text, marginBottom: '8px' }}>
              No assessments yet
            </h2>
            <p style={{ color: DS.muted, marginBottom: '24px' }}>
              Take your first assessment to start tracking your progress
            </p>
            <button
              onClick={() => navigate('/assessment')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 28px',
                background: DS.accent,
                color: '#FFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Take Assessment <ArrowRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
        ) : (
          <>
            {/* Retake reminder */}
            {!canRetake && daysSinceLastAssessment > 0 && (
              <div style={{
                background: `${DS.warning}15`,
                border: `1px solid ${DS.warning}40`,
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Calendar style={{ width: 20, height: 20, color: DS.warning }} />
                <div>
                  <p style={{ fontSize: '14px', color: DS.text, fontWeight: 500 }}>
                    Assessment available for retake in {90 - daysSinceLastAssessment} days
                  </p>
                  <p style={{ fontSize: '12px', color: DS.muted }}>
                    For the most accurate progress tracking, we recommend retaking every 90 days
                  </p>
                </div>
              </div>
            )}

            {/* Assessment History */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {assessments.map((a, i) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setSelectedAssessment(a);
                    setPreviousAssessment(assessments[i + 1] || null);
                  }}
                  style={{
                    padding: '10px 16px',
                    background: selectedAssessment?.id === a.id ? `${DS.accent}20` : DS.card,
                    border: `1px solid ${selectedAssessment?.id === a.id ? DS.accent : DS.border}`,
                    borderRadius: '8px',
                    color: selectedAssessment?.id === a.id ? DS.text : DS.textSecondary,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {i === 0 && <span style={{ marginLeft: '4px', color: DS.accent }}>(Latest)</span>}
                </button>
              ))}
            </div>

            {selectedAssessment && (
              <>
                {/* Current Assessment Card */}
                <div style={{ 
                  background: 'linear-gradient(135deg, rgba(193,8,171,0.15), rgba(99,102,241,0.1))',
                  border: `1px solid ${DS.accent}40`,
                  borderRadius: '16px',
                  padding: '32px',
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '16px',
                      background: `${DS.accent}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Award style={{ width: 32, height: 32, color: DS.accent }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: DS.muted, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {new Date(selectedAssessment.created_at).toLocaleDateString('en-US', { 
                          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
                        })}
                      </p>
                      <h2 style={{ fontFamily: DS.headingFont, fontSize: '24px', fontWeight: 700, color: DS.text }}>
                        {selectedAssessment.archetype}
                      </h2>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                    <div style={{ textAlign: 'center', padding: '20px', background: DS.bg, borderRadius: '12px' }}>
                      <p style={{ fontSize: '12px', color: DS.muted, marginBottom: '8px' }}>OVERALL SCORE</p>
                      <p style={{ fontSize: '48px', fontWeight: 800, color: DS.success, lineHeight: 1 }}>
                        {selectedAssessment.composite_score}
                      </p>
                    </div>
                    <div style={{ textAlign: 'center', padding: '20px', background: DS.bg, borderRadius: '12px' }}>
                      <p style={{ fontSize: '12px', color: DS.muted, marginBottom: '8px' }}>CROSS-BORDER READINESS</p>
                      <p style={{ fontSize: '48px', fontWeight: 800, color: DS.accent, lineHeight: 1 }}>
                        {selectedAssessment.cross_border_score}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dimension Breakdown */}
                <div style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
                  <h3 style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 600, color: DS.text, marginBottom: '24px' }}>
                    Dimension Breakdown
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {Object.entries(selectedAssessment.scores).map(([dim, score]) => {
                      const delta = getScoreDelta(dim);
                      const color = DIMENSION_COLORS[dim] || DS.accent;
                      
                      return (
                        <div key={dim}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '14px', color: DS.text }}>
                                {DIMENSION_LABELS[dim] || dim}
                              </span>
                              {delta !== null && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: getDeltaColor(delta) }}>
                                  {getDeltaIcon(delta)}
                                  <span style={{ fontSize: '12px', fontWeight: 600 }}>
                                    {formatDelta(delta)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <span style={{ fontSize: '20px', fontWeight: 700, color }}>
                              {score}%
                            </span>
                          </div>
                          <div style={{ height: '8px', background: DS.border, borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${score}%`,
                              background: color,
                              borderRadius: '4px',
                              transition: 'width 0.5s ease'
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Comparison with Previous */}
                {previousAssessment && (
                  <div style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: '16px', padding: '24px' }}>
                    <h3 style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 600, color: DS.text, marginBottom: '24px' }}>
                      Progress Since {new Date(previousAssessment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                      <div style={{ textAlign: 'center', padding: '16px', background: DS.bg, borderRadius: '12px' }}>
                        <p style={{ fontSize: '12px', color: DS.muted, marginBottom: '8px' }}>OVERALL</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          {getDeltaIcon(selectedAssessment.composite_score - previousAssessment.composite_score)}
                          <span style={{ fontSize: '24px', fontWeight: 700, color: getDeltaColor(selectedAssessment.composite_score - previousAssessment.composite_score) }}>
                            {formatDelta(selectedAssessment.composite_score - previousAssessment.composite_score)}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '16px', background: DS.bg, borderRadius: '12px' }}>
                        <p style={{ fontSize: '12px', color: DS.muted, marginBottom: '8px' }}>CROSS-BORDER</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          {getDeltaIcon(selectedAssessment.cross_border_score - previousAssessment.cross_border_score)}
                          <span style={{ fontSize: '24px', fontWeight: 700, color: getDeltaColor(selectedAssessment.cross_border_score - previousAssessment.cross_border_score) }}>
                            {formatDelta(selectedAssessment.cross_border_score - previousAssessment.cross_border_score)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
