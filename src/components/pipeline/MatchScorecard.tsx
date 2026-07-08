import React, { useState, useEffect } from 'react';
import { X, Brain, TrendingUp, Users, Award, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui';
import { getScoreColor, getVerdictLabel } from '@/types/pipelineStages';
import { getContact } from '@/services/supabaseApi';
import { runMatchScoring } from '@/services/scoringClient';

interface ScorecardDimension {
  score: number;
  evidence: string[];
  label: string;
  icon: React.ReactNode;
  description: string;
}

export interface MatchScorecard {
  candidate_id: string;
  mandate_id: string;
  overall_score: number;
  dimensions: {
    experience: ScorecardDimension;
    skills: ScorecardDimension;
    fit: ScorecardDimension;
  };
  verdict: 'strong_fit' | 'moderate_fit' | 'weak_fit';
  ai_summary: string;
  match_reasons?: string[];
  risk_factors?: string[];
  approach_strategy?: string;
  created_at: string;
}

interface MatchScorecardViewProps {
  candidateId: string;
  mandateId: string;
  onClose: () => void;
  jdDescription?: string;
}

// Component to display a single candidate's scorecard
export function MatchScorecardView({ candidateId, mandateId, onClose, jdDescription }: MatchScorecardViewProps) {
  const [loading, setLoading] = useState(true);
  const [scorecard, setScorecard] = useState<MatchScorecard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedDimensions, setExpandedDimensions] = useState<Set<string>>(new Set(['experience', 'skills', 'fit']));

  useEffect(() => {
    loadScorecard();
  }, [candidateId, mandateId]);

  const loadScorecard = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get candidate contact data
      const contact = await getContact(candidateId);
      if (!contact) {
        setError('Candidate not found');
        setLoading(false);
        return;
      }

      // If JD provided, run AI scoring
      if (jdDescription) {
        const response = await runMatchScoring(jdDescription, [{
          name: contact.name,
          cv: contact.summary || contact.headline || '',
        }]);

        const result = response.results?.[0];
        if (result) {
          const scorecardData: MatchScorecard = {
            candidate_id: candidateId,
            mandate_id: mandateId,
            overall_score: result.composite_score,
            dimensions: {
              experience: {
                score: result.dimension_scores.experience,
                evidence: result.match_reasons?.filter((_, i) => i % 3 === 0) || [],
                label: 'Experience',
                icon: <TrendingUp className="w-4 h-4" />,
                description: 'Years, industry, geography, company match',
              },
              skills: {
                score: result.dimension_scores.skills,
                evidence: result.match_reasons?.filter((_, i) => i % 3 === 1) || [],
                label: 'Skills',
                icon: <Award className="w-4 h-4" />,
                description: 'Required skills match',
              },
              fit: {
                score: result.dimension_scores.fit,
                evidence: result.match_reasons?.filter((_, i) => i % 3 === 2) || [],
                label: 'Culture Fit',
                icon: <Users className="w-4 h-4" />,
                description: 'Personality, culture, character alignment',
              },
            },
            verdict: result.composite_score >= 75 ? 'strong_fit' : result.composite_score >= 50 ? 'moderate_fit' : 'weak_fit',
            ai_summary: result.approach_strategy || result.match_reasons?.join(' ') || 'No analysis available',
            match_reasons: result.match_reasons,
            risk_factors: result.risk_factors,
            approach_strategy: result.approach_strategy,
            created_at: new Date().toISOString(),
          };
          setScorecard(scorecardData);
        }
      } else {
        // Build from existing candidate data
        const scorecardData: MatchScorecard = {
          candidate_id: candidateId,
          mandate_id: mandateId,
          overall_score: contact.trident_composite || 0,
          dimensions: {
            experience: {
              score: contact.trident_d1 || 0,
              evidence: [],
              label: 'Experience',
              icon: <TrendingUp className="w-4 h-4" />,
              description: 'Years, industry, geography, company match',
            },
            skills: {
              score: contact.trident_d2 || 0,
              evidence: contact.skills || [],
              label: 'Skills',
              icon: <Award className="w-4 h-4" />,
              description: 'Required skills match',
            },
            fit: {
              score: contact.trident_d3 || 0,
              evidence: [],
              label: 'Culture Fit',
              icon: <Users className="w-4 h-4" />,
              description: 'Personality, culture, character alignment',
            },
          },
          verdict: (contact.trident_composite || 0) >= 75 ? 'strong_fit' : (contact.trident_composite || 0) >= 50 ? 'moderate_fit' : 'weak_fit',
          ai_summary: 'Scorecard generated from candidate profile data.',
          created_at: contact.updated_at,
        };
        setScorecard(scorecardData);
      }
    } catch (err) {
      console.error('Error loading scorecard:', err);
      setError('Failed to load scorecard');
    } finally {
      setLoading(false);
    }
  };

  const toggleDimension = (dim: string) => {
    setExpandedDimensions(prev => {
      const next = new Set(prev);
      if (next.has(dim)) {
        next.delete(dim);
      } else {
        next.add(dim);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-none p-8">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" />
          <p className="text-text-muted mt-4">Loading scorecard...</p>
        </div>
      </div>
    );
  }

  if (error || !scorecard) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-none p-8 max-w-md">
          <p className="text-red-500 mb-4">{error || 'Failed to load scorecard'}</p>
          <button onClick={onClose} className="px-4 py-2 bg-accent text-white rounded-none">
            Close
          </button>
        </div>
      </div>
    );
  }

  const verdictInfo = getVerdictLabel(scorecard.verdict);
  const overallColor = getScoreColor(scorecard.overall_score);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-bg-tertiary flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Match Scorecard</h2>
              <p className="text-sm text-text-muted">AI-Generated Candidate Analysis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-tertiary rounded-none">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {/* Overall Score */}
        <div className="px-6 py-4 bg-bg-secondary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Overall Match Score</p>
              <div className="flex items-baseline gap-2">
                <span 
                  className="text-4xl font-bold"
                  style={{ color: overallColor }}
                >
                  {scorecard.overall_score}
                </span>
                <span className="text-text-muted">/ 100</span>
              </div>
            </div>
            <span
              style={{ backgroundColor: verdictInfo.color }}
              className="px-4 py-2 text-sm font-semibold text-white rounded-none"
            >
              {verdictInfo.label}
            </span>
          </div>
        </div>

        {/* Dimensions */}
        <div className="px-6 py-4 space-y-3 overflow-y-auto max-h-[50vh]">
          {Object.entries(scorecard.dimensions).map(([key, dim]) => {
            const isExpanded = expandedDimensions.has(key);
            const dimColor = getScoreColor(dim.score);
            
            return (
              <div 
                key={key}
                className="border border-bg-tertiary rounded-none overflow-hidden"
              >
                <button
                  onClick={() => toggleDimension(key)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div style={{ color: dimColor }}>{dim.icon}</div>
                    <div className="text-left">
                      <p className="font-medium text-text-primary">{dim.label}</p>
                      <p className="text-xs text-text-muted">{dim.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-16 h-2 bg-bg-tertiary rounded-full overflow-hidden"
                      >
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ width: `${dim.score}%`, backgroundColor: dimColor }}
                        />
                      </div>
                      <span 
                        className="text-lg font-bold w-10"
                        style={{ color: dimColor }}
                      >
                        {dim.score}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-text-muted" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-text-muted" />
                    )}
                  </div>
                </button>
                
                {isExpanded && dim.evidence.length > 0 && (
                  <div className="px-4 py-3 bg-bg-secondary border-t border-bg-tertiary">
                    <ul className="space-y-1">
                      {dim.evidence.map((e, i) => (
                        <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                          <span className="text-accent mt-1">•</span>
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* AI Summary */}
        {scorecard.ai_summary && (
          <div className="px-6 py-4 border-t border-bg-tertiary">
            <h3 className="text-sm font-semibold text-text-primary mb-2">AI Analysis</h3>
            <p className="text-sm text-text-secondary">{scorecard.ai_summary}</p>
          </div>
        )}

        {/* Risk Factors */}
        {scorecard.risk_factors && scorecard.risk_factors.length > 0 && (
          <div className="px-6 py-4 border-t border-bg-tertiary bg-amber-50">
            <h3 className="text-sm font-semibold text-amber-800 mb-2">Risk Factors</h3>
            <ul className="space-y-1">
              {scorecard.risk_factors.map((risk, i) => (
                <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">⚠</span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-bg-tertiary bg-bg-secondary flex items-center justify-between text-xs text-text-muted">
          <span>Generated: {new Date(scorecard.created_at).toLocaleDateString()}</span>
          <span>Powered by AI</span>
        </div>
      </div>
    </div>
  );
}

export default MatchScorecardView;
