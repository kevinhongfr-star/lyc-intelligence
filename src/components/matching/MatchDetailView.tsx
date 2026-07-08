'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Trophy,
  Activity,
  Lightbulb,
  Target,
  Shield,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Link as LinkIcon,
  Edit3,
  Loader2,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { MatchQualityBadge, MatchScoreBar } from './MatchQualityBadge';

interface MatchDetailViewProps {
  matchId: string;
  mandateId: string;
  contactId: string;
  onClose: () => void;
  userRole?: string;
}

interface MatchData {
  match: any;
  candidate: any;
  mandate: any;
}

export function MatchDetailView({ matchId, mandateId, contactId, onClose, userRole }: MatchDetailViewProps) {
  const [data, setData] = useState<MatchData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'trident' | 'pipeline' | 'ai'>('overview');
  const [isLinking, setIsLinking] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [overrideForm, setOverrideForm] = useState({
    override_score: 0,
    override_grade: 'STRONG',
    override_reason: '',
  });

  useEffect(() => {
    loadMatchDetail();
  }, [matchId]);

  const loadMatchDetail = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/matching/mandate/${mandateId}/matches/${contactId}`);
      const data = await res.json();
      if (data.success) {
        setData(data);
        if (data.match) {
          setOverrideForm(prev => ({
            ...prev,
            override_score: data.match.override_score || data.match.match_score,
            override_grade: data.match.override_grade || data.match.match_grade,
          }));
        }
      }
    } catch (e) {
      console.error('Failed to load match detail:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkToPipeline = async () => {
    setIsLinking(true);
    try {
      await fetch(`/api/matching/matches/${matchId}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: 'P2', notes: 'Added from AI match' }),
      });
      onClose();
    } catch (e) {
      console.error('Failed to link:', e);
    } finally {
      setIsLinking(false);
    }
  };

  const handleOverride = async () => {
    try {
      await fetch(`/api/matching/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overrideForm),
      });
      setShowOverride(false);
      loadMatchDetail();
    } catch (e) {
      console.error('Failed to override:', e);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-card border border-border rounded-none p-8">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-text-muted mt-4">Loading match analysis...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { match, candidate, mandate } = data;
  const aiAnalysis = match.ai_analysis || {};
  const dimScores = match.dimension_scores || {};
  const pipelineCompat = match.pipeline_compatibility || {};

  const canOverride = userRole === 'admin' || userRole === 'team_lead';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-none w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-text-primary">Match Analysis</h2>
              <MatchQualityBadge score={match.match_score} grade={match.match_grade} size="lg" />
              {match.is_stale && (
                <span className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-full">
                  Stale
                </span>
              )}
            </div>
            <p className="text-sm text-text-muted mt-1">
              {candidate?.full_name || candidate?.name || 'Candidate'} ↔ {mandate?.title || 'Mandate'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-alt rounded-none">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6">
          {[
            { id: 'overview', label: 'Overview', icon: <Trophy className="w-4 h-4" /> },
            { id: 'trident', label: 'TRIDENT Fit', icon: <Shield className="w-4 h-4" /> },
            { id: 'pipeline', label: 'Pipeline', icon: <Activity className="w-4 h-4" /> },
            { id: 'ai', label: 'AI Analysis', icon: <Lightbulb className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Score breakdown */}
              <div>
                <h3 className="font-semibold text-text-primary mb-4">Score Breakdown</h3>
                <div className="space-y-4">
                  <ScoreComponent
                    label="TRIDENT Fit"
                    score={match.trident_component || 0}
                    weight="60% weight"
                    color="bg-blue-500"
                  />
                  <ScoreComponent
                    label="Pipeline Compatibility"
                    score={match.pipeline_component || 0}
                    weight="20% weight"
                    color="bg-emerald-500"
                  />
                  <ScoreComponent
                    label="Heuristic Fit"
                    score={match.heuristic_component || 0}
                    weight="20% weight"
                    color="bg-amber-500"
                  />
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text-primary">Overall Match Score</span>
                    <span className="text-2xl font-bold text-text-primary">{match.match_score?.toFixed(1)}/100</span>
                  </div>
                  <div className="mt-2">
                    <MatchScoreBar score={match.match_score} grade={match.match_grade} showScore={false} height="h-3" />
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-bg-alt rounded-none p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{match.trident_component?.toFixed(0)}</div>
                  <div className="text-xs text-text-muted mt-1">TRIDENT Score</div>
                </div>
                <div className="bg-bg-alt rounded-none p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-600">{match.pipeline_component?.toFixed(0)}</div>
                  <div className="text-xs text-text-muted mt-1">Pipeline Fit</div>
                </div>
                <div className="bg-bg-alt rounded-none p-4 text-center">
                  <div className="text-2xl font-bold text-amber-600">{match.heuristic_component?.toFixed(0)}</div>
                  <div className="text-xs text-text-muted mt-1">Heuristic Fit</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trident' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-text-primary">TRIDENT 3D Fit Analysis</h3>
              {match.trident_composite ? (
                <div className="grid grid-cols-3 gap-4">
                  {['d1', 'd2', 'd3'].map((dim, i) => {
                    const score = dimScores[dim]?.score || 0;
                    const notes = dimScores[dim]?.fit_notes || '';
                    const labels = ['Capability (D1)', 'Behavioral (D2)', 'Cultural (D3)'];
                    return (
                      <div key={dim} className="bg-bg-alt rounded-none p-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600">{score?.toFixed(1)}</div>
                          <div className="text-sm font-medium text-text-secondary mt-1">{labels[i]}</div>
                        </div>
                        <div className="mt-3">
                          <MatchScoreBar score={score * 10} showScore={false} height="h-2" />
                        </div>
                        <p className="text-xs text-text-muted mt-2 text-center">{notes}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-none p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-amber-800">No TRIDENT Scorecard</p>
                      <p className="text-sm text-amber-700 mt-1">
                        This candidate does not have a TRIDENT scorecard for this mandate. Score is based on heuristic proxy (data confidence + tier).
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'pipeline' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-text-primary">Pipeline Compatibility</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bg-alt rounded-none p-4">
                  <div className="text-sm text-text-muted">Stage</div>
                  <div className="font-medium text-text-primary mt-1">{pipelineCompat.stage || '—'}</div>
                  <div className={`text-xs mt-1 ${pipelineCompat.stage_compatible ? 'text-emerald-600' : 'text-red-600'}`}>
                    {pipelineCompat.stage_compatible ? '✓ Stage compatible' : '✗ Stage incompatible'}
                  </div>
                </div>
                <div className="bg-bg-alt rounded-none p-4">
                  <div className="text-sm text-text-muted">Motivation</div>
                  <div className={`font-medium mt-1 ${
                    pipelineCompat.motivation_fit === 'GREEN' ? 'text-emerald-600' :
                    pipelineCompat.motivation_fit === 'YELLOW' ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {pipelineCompat.motivation_fit || '—'}
                  </div>
                </div>
                <div className="bg-bg-alt rounded-none p-4">
                  <div className="text-sm text-text-muted">Reachability</div>
                  <div className={`font-medium mt-1 ${pipelineCompat.reachability_ok ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {pipelineCompat.reachability_ok ? 'Good' : 'Needs verification'}
                  </div>
                </div>
                <div className="bg-bg-alt rounded-none p-4">
                  <div className="text-sm text-text-muted">Availability</div>
                  <div className={`font-medium mt-1 ${pipelineCompat.available ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {pipelineCompat.available ? 'Available' : 'In late pipeline'}
                  </div>
                </div>
              </div>
              {pipelineCompat.notes && (
                <div className="bg-blue-50 border border-blue-200 rounded-none p-4">
                  <p className="text-sm text-blue-800">{pipelineCompat.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-text-primary">AI Match Analysis</h3>
              </div>

              {aiAnalysis.match_summary ? (
                <>
                  <div className="bg-bg-alt rounded-none p-4">
                    <h4 className="font-medium text-text-primary mb-2">Match Summary</h4>
                    <p className="text-sm text-text-secondary">{aiAnalysis.match_summary}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-none p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <h4 className="font-medium text-emerald-800">Key Strengths</h4>
                      </div>
                      <ul className="space-y-2">
                        {(aiAnalysis.key_strengths || []).map((s: string, i: number) => (
                          <li key={i} className="text-sm text-emerald-700 flex items-start gap-2">
                            <span className="text-emerald-500">•</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-none p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <h4 className="font-medium text-red-800">Key Risks</h4>
                      </div>
                      <ul className="space-y-2">
                        {(aiAnalysis.key_risks || []).map((r: string, i: number) => (
                          <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                            <span className="text-red-500">•</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-bg-alt rounded-none p-3 text-center">
                      <div className="text-xs text-text-muted">Compensation</div>
                      <div className="font-medium text-text-primary mt-1">{aiAnalysis.compensation_fit || '—'}</div>
                    </div>
                    <div className="bg-bg-alt rounded-none p-3 text-center">
                      <div className="text-xs text-text-muted">Location</div>
                      <div className="font-medium text-text-primary mt-1">{aiAnalysis.location_fit || '—'}</div>
                    </div>
                    <div className="bg-bg-alt rounded-none p-3 text-center">
                      <div className="text-xs text-text-muted">Recommendation</div>
                      <div className="font-medium text-primary mt-1">{aiAnalysis.recommendation || '—'}</div>
                    </div>
                  </div>

                  {aiAnalysis.talking_points?.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-none p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        <h4 className="font-medium text-blue-800">Talking Points for Outreach</h4>
                      </div>
                      <ul className="space-y-2">
                        {aiAnalysis.talking_points.map((tp: string, i: number) => (
                          <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                            <span className="text-blue-500">{i + 1}.</span>
                            {tp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-bg-alt rounded-none p-8 text-center">
                  <Lightbulb className="w-12 h-12 text-text-muted mx-auto" />
                  <h4 className="font-medium text-text-primary mt-4">No AI Analysis</h4>
                  <p className="text-sm text-text-muted mt-1">
                    AI analysis is available for top candidates after running a match with DeepSeek enabled.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <div>
            {canOverride && (
              <Button variant="outline" onClick={() => setShowOverride(true)} className="gap-2">
                <Edit3 className="w-4 h-4" />
                Override Score
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button onClick={handleLinkToPipeline} disabled={isLinking} className="gap-2">
              {isLinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
              {isLinking ? 'Adding...' : 'Add to Mandate'}
            </Button>
          </div>
        </div>

        {/* Override modal */}
        {showOverride && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-card border border-border rounded-none p-6 w-full max-w-md m-4">
              <h3 className="text-lg font-semibold text-text-primary">Override Match Score</h3>
              <p className="text-sm text-text-muted mt-1">
                Manually adjust the match score and grade.
              </p>

              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={overrideForm.override_score}
                    onChange={e => setOverrideForm(prev => ({ ...prev, override_score: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-none bg-bg-base border border-border text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Grade</label>
                  <select
                    value={overrideForm.override_grade}
                    onChange={e => setOverrideForm(prev => ({ ...prev, override_grade: e.target.value }))}
                    className="w-full px-3 py-2 rounded-none bg-bg-base border border-border text-text-primary"
                  >
                    <option value="EXCEPTIONAL">EXCEPTIONAL</option>
                    <option value="STRONG">STRONG</option>
                    <option value="MODERATE">MODERATE</option>
                    <option value="WEAK">WEAK</option>
                    <option value="MISMATCH">MISMATCH</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Reason</label>
                  <textarea
                    value={overrideForm.override_reason}
                    onChange={e => setOverrideForm(prev => ({ ...prev, override_reason: e.target.value }))}
                    className="w-full px-3 py-2 rounded-none bg-bg-base border border-border text-text-primary"
                    rows={2}
                    placeholder="Why are you overriding this score?"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowOverride(false)}>Cancel</Button>
                <Button onClick={handleOverride}>Apply Override</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreComponent({ label, score, weight, color }: {
  label: string;
  score: number;
  weight: string;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-text-secondary">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">{weight}</span>
          <span className="font-semibold text-text-primary">{score?.toFixed(0)}/100</span>
        </div>
      </div>
      <div className="w-full bg-bg-alt rounded-full h-3 overflow-hidden">
        <div
          className={`${color} h-full rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}

export default MatchDetailView;
