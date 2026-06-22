import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Calendar, Clock, MessageSquare, Award, CheckCircle, 
  XCircle, MinusCircle, Loader2, User, Building2
} from 'lucide-react';
import { Badge } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';
import { getMandateWithPipeline } from '@/services/supabaseApi';
import { 
  PIPELINE_STAGE_ORDER, 
  STAGE_CONFIG, 
  getScoreColor,
  getVerdictLabel,
  PIPELINE_PHASES
} from '@/types/pipelineStages';
import { ClientFeedback } from './ClientFeedback';
import type { CandidatePipeline, Mandate } from '@/services/supabaseApi';

interface ClientMandateViewProps {
  mandateId: string;
  onBack?: () => void;
}

export function ClientMandateView({ mandateId, onBack }: ClientMandateViewProps) {
  const { profile } = useAuthStore();
  const [mandate, setMandate] = useState<Mandate | null>(null);
  const [pipeline, setPipeline] = useState<Record<string, CandidatePipeline[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidatePipeline | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const userRole = profile?.role as UserRole;
  const isAdmin = userRole === 'client_admin';

  useEffect(() => {
    loadMandate();
  }, [mandateId]);

  const loadMandate = async () => {
    setLoading(true);
    const { mandate: m, pipeline: p } = await getMandateWithPipeline(mandateId);
    setMandate(m);

    // Group pipeline by stage
    const grouped: Record<string, CandidatePipeline[]> = {};
    PIPELINE_STAGE_ORDER.forEach(stage => {
      grouped[stage] = [];
    });

    p.forEach(cp => {
      const stage = cp.stage || 'approach';
      if (!grouped[stage]) {
        grouped[stage] = [];
      }
      grouped[stage].push(cp);
    });

    setPipeline(grouped);
    setLoading(false);
  };

  // Get verdict based on score (without showing raw score)
  const getVerdictFromScore = (score: number): { label: string; color: string; bgColor: string } => {
    if (score >= 75) return { label: 'Strong', color: '#22C55E', bgColor: 'rgba(34, 197, 94, 0.1)' };
    if (score >= 50) return { label: 'Moderate', color: '#EAB308', bgColor: 'rgba(234, 179, 8, 0.1)' };
    return { label: 'Weak', color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.1)' };
  };

  // Check if candidate can see contact info (only after shortlist stage)
  const canSeeContactInfo = (stage: string): boolean => {
    const shortlistStages = ['client_submitted', 'client_approved', 'interview_1', 'interview_2', 'interview_3', 'final_interview', 'assessment', 'reference_check', 'offer_sent', 'offer_accepted', 'onboarded', 'follow_up_1m', 'follow_up_3m', 'follow_up_6m', 'probation_passed'];
    return shortlistStages.includes(stage);
  };

  // Get feedback badge
  const getFeedbackBadge = (feedback: any) => {
    if (!feedback) return null;
    
    switch (feedback.decision) {
      case 'approved':
        return { icon: CheckCircle, color: '#22C55E', label: 'Approved' };
      case 'rejected':
        return { icon: XCircle, color: '#EF4444', label: 'Rejected' };
      case 'hold':
        return { icon: MinusCircle, color: '#EAB308', label: 'On Hold' };
      default:
        return null;
    }
  };

  // Calculate days since creation
  const getDaysSinceCreation = () => {
    if (!mandate?.created_at) return 0;
    const created = new Date(mandate.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Calculate days in stage
  const getDaysInStage = (candidate: CandidatePipeline): number => {
    const updated = new Date(candidate.updated_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - updated.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Total candidates
  const totalCandidates = Object.values(pipeline).reduce((sum, arr) => sum + arr.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!mandate) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">Mandate not found</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-accent text-white rounded-lg">
          Back to Mandates
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">{mandate.title}</h1>
          <p className="text-text-muted">
            {mandate.company?.name} | {getDaysSinceCreation()} days in progress
          </p>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center gap-6">
        {(() => {
          const statusInfo = {
            '1_search': { label: 'Active Search', color: '#00897B' },
            '2_call': { label: 'Canvas', color: '#F59E0B' },
            '3_deliver': { label: 'Deliver', color: '#10B981' },
            'on_hold': { label: 'On Hold', color: '#F59E0B' },
            'won': { label: 'Won', color: '#22C55E' },
            'lost': { label: 'Lost', color: '#EF4444' },
            'completed': { label: 'Completed', color: '#6B7280' },
          }[mandate.status] || { label: mandate.status, color: '#6B7280' };
          
          return (
            <span 
              className="px-2 py-1 text-xs font-medium rounded"
              style={{ backgroundColor: `${statusInfo.color}20`, color: statusInfo.color }}
            >
              {statusInfo.label}
            </span>
          );
        })()}
        
        <div className="flex items-center gap-2 text-text-muted">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">Created: {new Date(mandate.created_at).toLocaleDateString()}</span>
        </div>
        
        <div className="flex items-center gap-2 text-text-muted">
          <Award className="w-4 h-4" />
          <span className="text-sm">{totalCandidates} candidates in pipeline</span>
        </div>
      </div>

      {/* Pipeline Kanban (Read-only) */}
      <div className="bg-bg-secondary rounded-xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Candidate Pipeline</h2>
        
        {/* Phase Grouped Layout */}
        {Object.values(PIPELINE_PHASES).map(phase => {
          const phaseStages = PIPELINE_STAGE_ORDER.filter(s => STAGE_CONFIG[s].phase === phase);
          const hasCandidates = phaseStages.some(stage => (pipeline[stage]?.length || 0) > 0);
          
          if (!hasCandidates) return null;
          
          return (
            <div key={phase} className="mb-6">
              <h3 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wider">{phase}</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {phaseStages.map(stageName => {
                  const stageConfig = STAGE_CONFIG[stageName];
                  const candidates = pipeline[stageName] || [];
                  
                  if (candidates.length === 0) return null;
                  
                  return (
                    <div
                      key={stageName}
                      className="w-48 flex-shrink-0 bg-white rounded-lg border border-bg-tertiary"
                    >
                      {/* Stage Header */}
                      <div 
                        className="px-3 py-2 border-b border-bg-tertiary"
                        style={{ backgroundColor: stageConfig.bgColor }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: stageConfig.color }}
                            />
                            <span className="text-xs font-medium text-text-primary">
                              {stageConfig.label}
                            </span>
                          </div>
                          <Badge variant="default" className="text-xs">
                            {candidates.length}
                          </Badge>
                        </div>
                      </div>

                      {/* Candidates */}
                      <div className="p-2 space-y-2 max-h-[300px] overflow-y-auto">
                        {candidates.map(candidate => {
                          const score = candidate.trident_composite || candidate.match_score || 0;
                          const verdict = getVerdictFromScore(score);
                          const feedback = candidate.client_feedback;
                          const feedbackInfo = getFeedbackBadge(feedback);
                          const canSeeContact = canSeeContactInfo(stageName);
                          
                          return (
                            <div
                              key={candidate.id}
                              onClick={() => setSelectedCandidate(candidate)}
                              className="bg-bg-primary border border-bg-tertiary rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
                            >
                              {/* Header */}
                              <div className="flex items-start gap-2 mb-2">
                                <div 
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                  style={{ backgroundColor: stageConfig.color }}
                                >
                                  {candidate.contact?.name?.[0] ?? '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-text-primary truncate">
                                    {candidate.contact?.name ?? 'Unknown'}
                                  </p>
                                  <p className="text-xs text-text-muted truncate">
                                    {candidate.contact?.current_title || 'No title'}
                                  </p>
                                </div>
                                {feedbackInfo && (
                                  <feedbackInfo.icon 
                                    className="w-4 h-4 flex-shrink-0" 
                                    style={{ color: feedbackInfo.color }} 
                                  />
                                )}
                              </div>

                              {/* Verdict Badge */}
                              <div className="flex items-center gap-2 mb-2">
                                <span 
                                  className="px-2 py-0.5 rounded text-xs font-medium"
                                  style={{ backgroundColor: verdict.bgColor, color: verdict.color }}
                                >
                                  {verdict.label} Fit
                                </span>
                                {canSeeContact && candidate.contact?.company?.name && (
                                  <span className="text-xs text-text-muted">
                                    {candidate.contact?.company?.name}
                                  </span>
                                )}
                              </div>

                              {/* Actions (Admin only, for feedback) */}
                              {isAdmin && stageName === 'client_approved' && !feedback && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setShowFeedback(true); }}
                                  className="w-full py-1.5 bg-accent text-white rounded text-xs font-medium hover:bg-accent/90"
                                >
                                  Provide Feedback
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-bg-tertiary flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">
                    {selectedCandidate.contact?.name}
                  </h3>
                  <p className="text-sm text-text-muted">{selectedCandidate.contact?.current_title}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-2 hover:bg-bg-tertiary rounded-lg"
              >
                <XCircle className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Match Strength */}
              {selectedCandidate.trident_composite && (
                <div className="bg-bg-secondary rounded-lg p-4">
                  <p className="text-sm text-text-muted mb-2">Match Strength</p>
                  <div className="flex items-center gap-3">
                    <span 
                      className="text-3xl font-bold"
                      style={{ color: getScoreColor(selectedCandidate.trident_composite) }}
                    >
                      {getVerdictFromScore(selectedCandidate.trident_composite).label}
                    </span>
                    <div className="flex-1">
                      <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${selectedCandidate.trident_composite}%`,
                            backgroundColor: getScoreColor(selectedCandidate.trident_composite)
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Company Info (if visible) */}
              {canSeeContactInfo(selectedCandidate.stage || '') && selectedCandidate.contact?.company?.name && (
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-text-muted" />
                  <span className="text-text-secondary">{selectedCandidate.contact?.company?.name}</span>
                </div>
              )}

              {/* Location */}
              {selectedCandidate.contact?.location && (
                <div className="flex items-center gap-3">
                  <span className="text-lg">📍</span>
                  <span className="text-text-secondary">{selectedCandidate.contact.location}</span>
                </div>
              )}

              {/* Summary */}
              {selectedCandidate.contact?.summary && (
                <div>
                  <p className="text-sm font-medium text-text-primary mb-2">Professional Summary</p>
                  <p className="text-sm text-text-secondary">{selectedCandidate.contact.summary}</p>
                </div>
              )}

              {/* Skills */}
              {selectedCandidate.contact?.skills && selectedCandidate.contact.skills.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-text-primary mb-2">Key Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.contact.skills.slice(0, 5).map((skill, i) => (
                      <Badge key={i} variant="default" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback */}
              {selectedCandidate.client_feedback && (
                <div 
                  className="rounded-lg p-4"
                  style={{ 
                    backgroundColor: selectedCandidate.client_feedback.decision === 'approved' ? '#22C55E10' :
                                   selectedCandidate.client_feedback.decision === 'rejected' ? '#EF444410' : '#EAB30810'
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {selectedCandidate.client_feedback.decision === 'approved' && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    {selectedCandidate.client_feedback.decision === 'rejected' && (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    {selectedCandidate.client_feedback.decision === 'hold' && (
                      <MinusCircle className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="font-medium text-text-primary">
                      {selectedCandidate.client_feedback.decision === 'approved' ? 'Approved' :
                       selectedCandidate.client_feedback.decision === 'rejected' ? 'Rejected' : 'On Hold'}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">
                    {selectedCandidate.client_feedback.comment}
                  </p>
                  <p className="text-xs text-text-muted mt-2">
                    {new Date(selectedCandidate.client_feedback.decided_at).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Feedback Button (Admin only) */}
              {isAdmin && !selectedCandidate.client_feedback && (
                <button
                  onClick={() => setShowFeedback(true)}
                  className="w-full py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90"
                >
                  Provide Feedback
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Panel */}
      {showFeedback && selectedCandidate && (
        <ClientFeedback
          candidate={selectedCandidate}
          mandate={mandate}
          onClose={() => { setShowFeedback(false); setSelectedCandidate(null); }}
          onSubmit={() => { loadMandate(); setShowFeedback(false); setSelectedCandidate(null); }}
        />
      )}
    </div>
  );
}

export default ClientMandateView;
