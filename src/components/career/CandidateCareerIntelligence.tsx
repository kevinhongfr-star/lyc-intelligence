'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Target,
  Zap,
  Activity,
  PlayCircle,
  PauseCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Bell,
  Clock,
  Award,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';

interface CandidateCareerIntelligenceProps {
  contactId: string;
  contactData?: any;
}

const TIER_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  ALPHA: { label: 'Alpha', color: 'text-purple-700', bg: 'bg-purple-100' },
  BETA: { label: 'Beta', color: 'text-blue-700', bg: 'bg-blue-100' },
  GAMMA: { label: 'Gamma', color: 'text-gray-700', bg: 'bg-gray-100' },
  DORMANT: { label: 'Dormant', color: 'text-gray-400', bg: 'bg-gray-50' },
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  low: 'bg-gray-400',
};

const NURTURE_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Active', color: 'text-green-600' },
  PAUSED: { label: 'Paused', color: 'text-gray-600' },
  COMPLETED: { label: 'Completed', color: 'text-blue-600' },
  CONVERTED: { label: 'Converted', color: 'text-purple-600' },
  DECLINED: { label: 'Declined', color: 'text-red-600' },
};

export function CandidateCareerIntelligence({ contactId, contactData }: CandidateCareerIntelligenceProps) {
  const [loading, setLoading] = useState(true);
  const [benchmark, setBenchmark] = useState<any>(null);
  const [benchmarkHistory, setBenchmarkHistory] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [nurtureSequences, setNurtureSequences] = useState<any[]>([]);
  const [log, setLog] = useState<any[]>([]);
  const [expanded, setExpanded] = useState({
    benchmark: true,
    signals: true,
    nurture: true,
    log: false,
  });
  const [generating, setGenerating] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [conversationText, setConversationText] = useState('');
  const [showConvoInput, setShowConvoInput] = useState(false);
  const [processingConvo, setProcessingConvo] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [contactId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [benchRes, signalsRes, nurtureRes, logRes] = await Promise.all([
        fetch(`/api/career/benchmark/${contactId}`),
        fetch(`/api/career/signals/${contactId}`),
        fetch(`/api/career/nurture/${contactId}`),
        fetch(`/api/career/log/${contactId}`),
      ]);
      const [bench, sig, nur, lg] = await Promise.all([
        benchRes.json(),
        signalsRes.json(),
        nurtureRes.json(),
        logRes.json(),
      ]);
      if (bench.success) setBenchmark(bench.benchmark);
      if (sig.success) setSignals(sig.signals || []);
      if (nur.success) setNurtureSequences(nur.sequences || []);
      if (lg.success) setLog(lg.log || []);
    } catch (e) {
      console.error('Failed to load career intelligence:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBenchmark = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/career/benchmark/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_id: contactId }),
      });
      const data = await res.json();
      if (data.success) {
        setBenchmark(data.benchmark);
      }
    } catch (e) {
      console.error('Benchmark generation failed:', e);
    } finally {
      setGenerating(false);
    }
  };

  const handleEnrollNurture = async (sequenceType: string) => {
    setEnrolling(true);
    try {
      const res = await fetch('/api/career/nurture/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_id: contactId, sequence_type: sequenceType }),
      });
      const data = await res.json();
      if (data.success) {
        loadAllData();
      }
    } catch (e) {
      console.error('Nurture enrollment failed:', e);
    } finally {
      setEnrolling(false);
    }
  };

  const handlePauseNurture = async () => {
    try {
      await fetch('/api/career/nurture/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_id: contactId, reason: 'Paused manually' }),
      });
      loadAllData();
    } catch (e) {
      console.error('Pause nurture failed:', e);
    }
  };

  const handleDetectSignals = async () => {
    try {
      const res = await fetch('/api/career/signals/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_id: contactId }),
      });
      const data = await res.json();
      if (data.success) {
        loadAllData();
      }
    } catch (e) {
      console.error('Signal detection failed:', e);
    }
  };

  const handleProcessConversation = async () => {
    if (!conversationText.trim()) return;
    setProcessingConvo(true);
    try {
      const res = await fetch('/api/career/conversation/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_id: contactId, text: conversationText, direction: 'inbound' }),
      });
      const data = await res.json();
      if (data.success) {
        setConversationText('');
        setShowConvoInput(false);
        loadAllData();
      }
    } catch (e) {
      console.error('Conversation processing failed:', e);
    } finally {
      setProcessingConvo(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section as keyof typeof prev] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-5 h-5 text-primary animate-spin" />
        <span className="ml-2 text-text-muted">Loading career intelligence...</span>
      </div>
    );
  }

  const tier = contactData?.career_tier || 'DORMANT';
  const tierInfo = TIER_LABELS[tier] || TIER_LABELS.DORMANT;
  const engagementScore = contactData?.engagement_score || 0;
  const activeNurture = nurtureSequences.find((n: any) => n.status === 'ACTIVE');
  const highSignals = signals.filter((s: any) => ['high', 'critical'].includes(s.severity));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-text-primary">Career Intelligence</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tierInfo.bg} ${tierInfo.color}`}>
              {tierInfo.label} Tier
            </span>
          </div>
          <p className="text-sm text-text-muted">
            Engagement Score: <span className="font-medium text-text-primary">{engagementScore}/100</span>
          </p>
          <div className="w-48 h-2 bg-bg-alt rounded-full mt-1">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${engagementScore}%`,
                background: engagementScore >= 70 ? '#10b981' : engagementScore >= 40 ? '#f59e0b' : '#ef4444',
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConvoInput(!showConvoInput)}
            className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-bg-alt flex items-center gap-1.5"
          >
            <MessageSquare className="w-4 h-4" />
            Log Conversation
          </button>
          <button
            onClick={handleGenerateBenchmark}
            disabled={generating}
            className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
          >
            <Sparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Generating...' : 'Generate Benchmark'}
          </button>
        </div>
      </div>

      {/* Conversation Input */}
      {showConvoInput && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h4 className="font-medium text-text-primary mb-3">Log Candidate Conversation</h4>
          <textarea
            value={conversationText}
            onChange={e => setConversationText(e.target.value)}
            placeholder="Paste or type the conversation content here. The AI will extract signals, preferences, and update the candidate profile."
            className="w-full h-32 p-3 border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => setShowConvoInput(false)}
              className="px-4 py-1.5 text-sm border border-border rounded-lg hover:bg-bg-alt"
            >
              Cancel
            </button>
            <button
              onClick={handleProcessConversation}
              disabled={processingConvo || !conversationText.trim()}
              className="px-4 py-1.5 text-sm bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Sparkles className={`w-4 h-4 ${processingConvo ? 'animate-spin' : ''}`} />
              {processingConvo ? 'Processing...' : 'Process with AI'}
            </button>
          </div>
        </div>
      )}

      {/* Career Benchmark */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('benchmark')}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-bg-alt/50"
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="font-medium text-text-primary">Career Benchmark</span>
            {benchmark && (
              <span className="text-xs text-text-muted">
                Updated {new Date(benchmark.generated_at).toLocaleDateString()}
              </span>
            )}
          </div>
          {expanded.benchmark ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {expanded.benchmark && (
          <div className="px-5 pb-5 border-t border-border pt-4">
            {benchmark ? (
              <div className="space-y-4">
                {/* Narrative */}
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg">
                  <p className="text-sm text-text-primary leading-relaxed">{benchmark.narrative_summary}</p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-bg-alt rounded-lg text-center">
                    <Target className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-text-primary">{benchmark.market_demand_score || 0}/100</p>
                    <p className="text-xs text-text-muted">Market Demand</p>
                  </div>
                  <div className="p-3 bg-bg-alt rounded-lg text-center">
                    <Activity className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-text-primary">{benchmark.active_mandates_matching || 0}</p>
                    <p className="text-xs text-text-muted">Matching Mandates</p>
                  </div>
                  <div className="p-3 bg-bg-alt rounded-lg text-center">
                    <Zap className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-text-primary">{(benchmark.skill_gaps || []).length}</p>
                    <p className="text-xs text-text-muted">Skill Gaps</p>
                  </div>
                  <div className="p-3 bg-bg-alt rounded-lg text-center">
                    <Award className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-text-primary">{Math.round((benchmark.data_confidence || 0) * 100)}%</p>
                    <p className="text-xs text-text-muted">Data Confidence</p>
                  </div>
                </div>

                {/* Skill Gaps */}
                {(benchmark.skill_gaps || []).length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-text-primary mb-2">Key Skill Gaps</h5>
                    <div className="flex flex-wrap gap-2">
                      {benchmark.skill_gaps.slice(0, 8).map((skill: string, i: number) => (
                        <span key={i} className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trajectory Paths */}
                {(benchmark.trajectory_paths || []).length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-text-primary mb-2">Top Career Paths</h5>
                    <div className="space-y-2">
                      {benchmark.trajectory_paths.slice(0, 3).map((path: any, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-sm text-text-primary flex-1">{path.label}</span>
                          <div className="w-32 h-1.5 bg-bg-alt rounded-full">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.round(path.likelihood * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-text-muted w-12 text-right">
                            {Math.round(path.likelihood * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-50" />
                <p className="text-text-muted mb-3">No benchmark generated yet</p>
                <button
                  onClick={handleGenerateBenchmark}
                  disabled={generating}
                  className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:opacity-90"
                >
                  {generating ? 'Generating...' : 'Generate First Benchmark'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Movement Signals */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('signals')}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-bg-alt/50"
        >
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-amber-500" />
            <span className="font-medium text-text-primary">Movement Signals</span>
            {highSignals.length > 0 && (
              <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                {highSignals.length} high priority
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={e => { e.stopPropagation(); handleDetectSignals(); }}
              className="text-xs text-text-muted hover:text-primary flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Detect
            </button>
            {expanded.signals ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>
        {expanded.signals && (
          <div className="px-5 pb-5 border-t border-border pt-4">
            {signals.length > 0 ? (
              <div className="space-y-2">
                {signals.slice(0, 10).map((signal: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-bg-alt rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${SEVERITY_COLORS[signal.severity] || 'bg-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary capitalize">
                          {signal.type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-text-muted capitalize">{signal.severity}</span>
                      </div>
                      <p className="text-sm text-text-muted mt-0.5">{signal.description}</p>
                      <p className="text-xs text-text-muted mt-1">
                        {signal.source} · {new Date(signal.detected_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Bell className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
                <p className="text-sm text-text-muted">No movement signals detected</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nurture Sequences */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('nurture')}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-bg-alt/50"
        >
          <div className="flex items-center gap-3">
            <PlayCircle className="w-5 h-5 text-blue-500" />
            <span className="font-medium text-text-primary">Nurture Workflow</span>
            {activeNurture && (
              <span className={`text-xs font-medium ${NURTURE_STATUS_LABELS[activeNurture.status]?.color || ''}`}>
                {NURTURE_STATUS_LABELS[activeNurture.status]?.label || activeNurture.status}
              </span>
            )}
          </div>
          {expanded.nurture ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {expanded.nurture && (
          <div className="px-5 pb-5 border-t border-border pt-4">
            {activeNurture ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">{activeNurture.sequence_type.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-text-muted">
                      Step {activeNurture.current_step} of {activeNurture.total_steps} · {activeNurture.touch_count} touches sent
                    </p>
                  </div>
                  <button
                    onClick={handlePauseNurture}
                    className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-bg-alt flex items-center gap-1.5"
                  >
                    <PauseCircle className="w-4 h-4" />
                    Pause
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-text-muted mb-1.5">
                    <span>Progress</span>
                    <span>{Math.round((activeNurture.current_step / activeNurture.total_steps) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-bg-alt rounded-full">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${(activeNurture.current_step / activeNurture.total_steps) * 100}%` }}
                    />
                  </div>
                </div>

                {activeNurture.next_touch_at && (
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <Clock className="w-4 h-4" />
                    Next touch: {new Date(activeNurture.next_touch_at).toLocaleDateString()}
                  </div>
                )}

                {activeNurture.response_count > 0 && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      {activeNurture.response_count} response{activeNurture.response_count > 1 ? 's' : ''} received
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-text-muted">Not enrolled in any nurture sequence</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {['ALPHA_CAREER', 'BETA_QUARTERLY', 'GAMMA_SEMI_ANNUAL', 'S8_NOT_INTERESTED', 'S4_NO_RESPONSE'].map(type => (
                    <button
                      key={type}
                      onClick={() => handleEnrollNurture(type)}
                      disabled={enrolling}
                      className="p-3 border border-border rounded-lg text-left hover:bg-bg-alt transition-colors disabled:opacity-50"
                    >
                      <p className="text-sm font-medium text-text-primary">{type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {type.includes('ALPHA') && 'Monthly personalized intelligence'}
                        {type.includes('BETA') && 'Quarterly semi-personalized'}
                        {type.includes('GAMMA') && 'Semi-annual template-based'}
                        {type.includes('S8') && 'Post-decline value nurture'}
                        {type.includes('S4') && 'Re-engagement for no-response'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Intelligence Log */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('log')}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-bg-alt/50"
        >
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-text-primary">Intelligence Log</span>
            <span className="text-xs text-text-muted">{log.length} entries</span>
          </div>
          {expanded.log ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {expanded.log && (
          <div className="px-5 pb-5 border-t border-border pt-4">
            {log.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {log.map((entry: any) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full ${
                        entry.direction === 'outbound' ? 'bg-blue-500' : 'bg-emerald-500'
                      }`} />
                      <div className="w-px h-full bg-border" />
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary capitalize">
                          {entry.intelligence_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-text-muted capitalize">{entry.channel}</span>
                        <span className="text-xs text-text-muted">
                          {new Date(entry.created_at).toLocaleString()}
                        </span>
                      </div>
                      {entry.content_summary && (
                        <p className="text-sm text-text-muted mt-1">{entry.content_summary}</p>
                      )}
                      {entry.engagement_impact && (
                        <span className={`inline-block mt-1 px-1.5 py-0.5 text-xs rounded ${
                          entry.engagement_impact === 'POSITIVE' ? 'bg-green-50 text-green-700' :
                          entry.engagement_impact === 'NEGATIVE' ? 'bg-red-50 text-red-700' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {entry.engagement_impact}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Clock className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
                <p className="text-sm text-text-muted">No intelligence interactions logged yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CandidateCareerIntelligence;
