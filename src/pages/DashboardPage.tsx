import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, Calendar, TrendingUp, MessageSquare, FileText, 
  ChevronRight, Target, Award, Globe, Sparkles,
  CreditCard, Gift, Share2, Loader2
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useMemoryStore } from '../stores/memoryStore';
import { getMemoryContextForUser, formatAssessmentForInjection } from '../services/memoryService';
import { getSupabase } from '../services/supabaseApi';

import { DS } from '@/lib/designSystem';

interface AssessmentSummary {
  id: string;
  archetype: string;
  composite_score: number;
  dimension_scores: Record<string, number>;
  adaptability_score: number;
  created_at: string;
}

interface SessionSummary {
  id: string;
  session_title: string;
  last_message_at: string;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const { memories, recentSessions, loadMemories, loadRecentSessions } = useMemoryStore();
  
  const [assessment, setAssessment] = useState<AssessmentSummary | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [credits, setCredits] = useState(5);
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const sb = getSupabase();
      
      // Load memories and sessions in parallel
      await Promise.all([
        loadMemories(user.id),
        loadRecentSessions(user.id)
      ]);

      // Load latest assessment
      // Try user_id first, fall back to email
      let assessmentData: any = null;
      const { data: byUserId } = await sb
        .from('assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (byUserId) {
        assessmentData = byUserId;
      } else if (user.email) {
        const { data: byEmail } = await sb
          .from('assessments')
          .select('*')
          .eq('email', user.email)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        assessmentData = byEmail;
      }

      if (assessmentData) {
        setAssessment({
          id: assessmentData.id,
          archetype: assessmentData.archetype,
          composite_score: assessmentData.composite_score,
          dimension_scores: JSON.parse(assessmentData.scores || '{}'),
          adaptability_score: assessmentData.adaptability_score || 0,
          created_at: assessmentData.created_at
        });
      }

      // Load profile for credits/streak
      if (profile) {
        setStreak(profile.streak_days || 0);
        setReferralCode(profile.referral_code || '');
      }

      // Generate suggestions based on memories
      generateSuggestions(memories);
    } catch (e) {
      console.error('[Dashboard] Load error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSuggestions = (memoryList: typeof memories) => {
    // Generate context-aware suggestions based on memory
    const goals = memoryList.filter(m => m.memory_type === 'goal');
    const painPoints = memoryList.filter(m => m.memory_type === 'pain_point');
    
    const baseSuggestions = [
      'How do I position my leadership experience?',
      'What should I focus on for the next 90 days?',
      'Help me strengthen my LinkedIn profile'
    ];

    if (goals.length > 0) {
      baseSuggestions[0] = `Progress toward: ${goals[0].content.substring(0, 40)}...`;
    }
    if (painPoints.length > 0) {
      baseSuggestions[1] = `Address: ${painPoints[0].content.substring(0, 40)}...`;
    }

    setSuggestions(baseSuggestions);
  };

  const getReferralLink = () => {
    return `${window.location.origin}/signup?ref=${referralCode}`;
  };

  const [referralCopied, setReferralCopied] = useState(false);
  const copyReferralLink = async () => {
    const link = getReferralLink();
    try {
      await navigator.clipboard.writeText(link);
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 2000);
    } catch {
      // Fallback: select text for manual copy
      console.log('Referral link:', link);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: DS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 style={{ width: 32, height: 32, color: DS.accent, animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: DS.bg, padding: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontFamily: DS.headingFont, fontSize: '28px', fontWeight: 700, color: DS.text, marginBottom: '4px' }}>
              {greeting()}, {profile?.name?.split(' ')[0] || 'there'}
            </h1>
            <p style={{ color: DS.muted, fontSize: '14px' }}>
              Here's your career intelligence overview
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: DS.card, borderRadius: '20px', border: `1px solid ${DS.cardBorder}` }}>
              <Calendar style={{ width: 16, height: 16, color: DS.accent }} />
              <span style={{ fontSize: '14px', color: DS.text }}>{streak} day streak</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: DS.card, borderRadius: '20px', border: `1px solid ${DS.cardBorder}` }}>
              <CreditCard style={{ width: 16, height: 16, color: DS.accent }} />
              <span style={{ fontSize: '14px', color: DS.text }}>{credits} credits</span>
            </div>
          </div>
        </div>

        {/* Row 1: Career Summary Card */}
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(193,8,171,0.15), rgba(99,102,241,0.1))',
          border: `1px solid ${DS.accent}40`,
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
            <div>
              <p style={{ fontSize: '12px', color: DS.muted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Your Archetype
              </p>
              <p style={{ fontSize: '20px', fontWeight: 700, color: DS.text }}>
                {assessment?.archetype || 'Not assessed yet'}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: DS.muted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Last Assessment
              </p>
              <p style={{ fontSize: '20px', fontWeight: 700, color: DS.text }}>
                {assessment?.created_at 
                  ? new Date(assessment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'Take your first assessment'}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: DS.muted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Overall Score
              </p>
              <p style={{ fontSize: '20px', fontWeight: 700, color: assessment?.composite_score ? DS.success : DS.muted }}>
                {assessment?.composite_score || '—'}/100
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: DS.muted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Next Recommended Action
              </p>
              <p style={{ fontSize: '14px', color: DS.textSecondary }}>
                {getNextAction()}
              </p>
            </div>
            {/* Phase 11.2 — Nexus CTA after assessment */}
            {assessment && (
              <div style={{ background: `${DS.accent}08`, border: `1px solid ${DS.accent}25`, borderRadius: '12px', padding: '20px', marginTop: '16px' }}>
                <p style={{ color: DS.textSecondary, fontSize: '14px', margin: '0 0 12px', fontFamily: DS.headingFont }}>
                  Nexus has context from your assessment. Ask it anything about your results or next steps.
                </p>
                <a
                  href={`/nexus?context=dashboard&archetype=${encodeURIComponent(assessment.archetype || '')}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: DS.accent, color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}
                >
                  Continue with Nexus →
                </a>
              </div>
            )}

          </div>
        </div>

        {/* Row 2: Three Action Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <ActionCard
            icon={MessageSquare}
            title="Continue with Nexus"
            description="Get personalized advice based on your profile"
            color={DS.accent}
            onClick={() => navigate('/nexus')}
          />
          <ActionCard
            icon={Target}
            title="Run Assessment"
            description="Discover your executive archetype"
            color={DS.success}
            onClick={() => navigate('/assessment')}
          />
          <ActionCard
            icon={FileText}
            title="Upload CV"
            description="Get AI-powered analysis of your resume"
            color={DS.warning}
            onClick={() => navigate('/documents')}
          />
        </div>

        {/* Row 3: Recent Activity */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {/* Recent Conversations */}
          <div style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ fontFamily: DS.headingFont, fontSize: '16px', fontWeight: 600, color: DS.text, marginBottom: '16px' }}>
              Recent Conversations
            </h3>
            {recentSessions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentSessions.slice(0, 3).map((session) => (
                  <div 
                    key={session.id}
                    onClick={() => navigate(`/nexus?session=${session.id}`)}
                    style={{ 
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px', background: DS.bg, borderRadius: '8px', cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = DS.bgAlt}
                    onMouseOut={(e) => e.currentTarget.style.background = DS.bg}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <MessageSquare style={{ width: 16, height: 16, color: DS.muted }} />
                      <span style={{ fontSize: '14px', color: DS.text }}>
                        {session.session_title || 'New conversation'}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: DS.muted }}>
                      {formatDate(session.last_message_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: DS.muted, fontSize: '14px' }}>No conversations yet</p>
            )}
          </div>

          {/* Assessment Summary */}
          <div style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ fontFamily: DS.headingFont, fontSize: '16px', fontWeight: 600, color: DS.text, marginBottom: '16px' }}>
              Assessment Results
            </h3>
            {assessment ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '14px', color: DS.text }}>{assessment.archetype}</span>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: DS.success }}>{assessment.composite_score}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(assessment.dimension_scores || {}).slice(0, 4).map(([key, value]) => (
                    <div key={key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', color: DS.textSecondary }}>{formatDimensionName(key)}</span>
                        <span style={{ fontSize: '12px', color: DS.text }}>{value}%</span>
                      </div>
                      <div style={{ height: '4px', background: DS.border, borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${value}%`, background: DS.accent, borderRadius: '2px' }} />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/progress')}
                  style={{
                    marginTop: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'none',
                    border: 'none',
                    color: DS.accent,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  View full progress <ChevronRight style={{ width: 14, height: 14 }} />
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Target style={{ width: 32, height: 32, color: DS.muted, margin: '0 auto 12px' }} />
                <p style={{ color: DS.muted, fontSize: '14px', marginBottom: '16px' }}>No assessment yet</p>
                <button
                  onClick={() => navigate('/assessment')}
                  style={{
                    padding: '10px 20px',
                    background: DS.accent,
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Take Assessment
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Row 4: Nexus Suggestions */}
        {suggestions.length > 0 && (
          <div style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
            <h3 style={{ fontFamily: DS.headingFont, fontSize: '16px', fontWeight: 600, color: DS.text, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles style={{ width: 18, height: 18, color: DS.accent }} />
              Suggested by Nexus
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => navigate(`/nexus?prompt=${encodeURIComponent(suggestion)}`)}
                  style={{
                    padding: '10px 16px',
                    background: `${DS.accent}15`,
                    border: `1px solid ${DS.accent}40`,
                    borderRadius: '20px',
                    color: DS.text,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = `${DS.accent}25`;
                    e.currentTarget.style.borderColor = DS.accent;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = `${DS.accent}15`;
                    e.currentTarget.style.borderColor = `${DS.accent}40`;
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Row 5: Referral Module */}
        <div style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Gift style={{ width: 24, height: 24, color: DS.success }} />
            <div>
              <h3 style={{ fontFamily: DS.headingFont, fontSize: '16px', fontWeight: 600, color: DS.text }}>
                Earn Credits
              </h3>
              <p style={{ fontSize: '13px', color: DS.muted }}>
                Refer a colleague and both get 5 bonus credits
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ 
                padding: '12px 16px', 
                background: DS.bg, 
                border: `1px solid ${DS.cardBorder}`, 
                borderRadius: '8px',
                fontSize: '14px',
                color: DS.text,
                fontFamily: 'monospace'
              }}>
                {getReferralLink()}
              </div>
            </div>
            <button
              onClick={copyReferralLink}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '12px 20px',
                background: DS.success,
                color: '#000000',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Share2 style={{ width: 16, height: 16 }} />
              Copy Link
            </button>
          </div>
        </div>
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

interface ActionCardProps {
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  title: string;
  description: string;
  color: string;
  onClick: () => void;
}

function ActionCard({ icon: Icon, title, description, color, onClick }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        padding: '20px',
        background: DS.card,
        border: `1px solid ${DS.cardBorder}`,
        borderRadius: '12px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.background = DS.bgAlt;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = DS.border;
        e.currentTarget.style.background = DS.card;
      }}
    >
      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '10px',
        background: `${color}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <Icon style={{ width: 22, height: 22, color }} />
      </div>
      <div>
        <h4 style={{ fontSize: '15px', fontWeight: 600, color: DS.text, marginBottom: '4px' }}>{title}</h4>
        <p style={{ fontSize: '13px', color: DS.muted }}>{description}</p>
      </div>
    </button>
  );
}

function formatDimensionName(key: string): string {
  const names: Record<string, string> = {
    strategic_orientation: 'Strategic',
    cross_border_adaptability: 'Adaptability',
    stakeholder_influence: 'Stakeholder',
    execution_discipline: 'Execution',
    leadership_presence: 'Leadership'
  };
  return names[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getNextAction(): string {
  return 'Take your assessment to get personalized recommendations';
}
