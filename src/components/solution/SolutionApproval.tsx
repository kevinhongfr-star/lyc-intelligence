import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, PauseCircle, FileText, User, Calendar,
  ArrowLeft, Send, Loader2, AlertTriangle, Eye
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { getMandateSolutions, updateSolutionStatus, createNotification } from '@/services/supabaseApi';
import { SolutionType, SOLUTION_TYPES } from './SolutionPicker';
import type { Mandate } from '@/services/supabaseApi';

interface SolutionApprovalProps {
  mandate: Mandate;
  onComplete?: () => void;
}

export function SolutionApproval({ mandate, onComplete }: SolutionApprovalProps) {
  const { profile } = useAuthStore();
  const [solutions, setSolutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSolutions, setSelectedSolutions] = useState<string[]>([]);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSolutions();
  }, [mandate.id]);

  const loadSolutions = async () => {
    setLoading(true);
    const data = await getMandateSolutions(mandate.id);
    setSolutions(data);
    setSelectedSolutions(data.map(s => s.id));
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (selectedSolutions.length === 0) {
      setError('Please select at least one solution to approve/reject');
      return;
    }

    if (action === 'reject' && !notes.trim()) {
      setError('Please provide rejection notes');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const promises = selectedSolutions.map(solutionId =>
        updateSolutionStatus(solutionId, action === 'approve' ? 'approved' : 'rejected', profile?.id, action === 'reject' ? notes : '')
      );

      await Promise.all(promises);

      // Create notification for the consultant who defined the solutions
      const consultantId = solutions[0]?.defined_by;
      if (consultantId && consultantId !== profile?.id) {
        await createNotification(consultantId, {
          type: action === 'approve' ? 'solution_approved' : 'solution_rejected',
          title: `Solution ${action === 'approve' ? 'Approved' : 'Rejected'}`,
          message: `${profile?.name} has ${action === 'approve' ? 'approved' : 'rejected'} the solutions for ${mandate.title}`,
          link: `/platform/mandates/${mandate.id}/solutions`,
        });
      }

      onComplete?.();
    } catch (err) {
      console.error('Approval error:', err);
      setError('Failed to process approval. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return { icon: FileText, color: '#6B7280', label: 'Draft' };
      case 'pending_approval':
        return { icon: PauseCircle, color: '#F59E0B', label: 'Pending Approval' };
      case 'approved':
        return { icon: CheckCircle, color: '#22C55E', label: 'Approved' };
      case 'rejected':
        return { icon: XCircle, color: '#EF4444', label: 'Rejected' };
      default:
        return { icon: FileText, color: '#6B7280', label: status };
    }
  };

  const pendingSolutions = solutions.filter(s => s.status === 'pending_approval');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (pendingSolutions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">No Solutions Pending Approval</h3>
        <p className="text-text-muted">All solutions for this mandate have been reviewed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">Review Solutions</h1>
          <p className="text-text-muted">Approve or reject the proposed solutions for {mandate.title}</p>
        </div>
        <div 
          className="px-4 py-2 text-sm rounded-full font-medium"
          style={{ backgroundColor: '#F59E0B20', color: '#F59E0B' }}
        >
          {pendingSolutions.length} Pending
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-none p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Action Toggle */}
      <div className="bg-bg-secondary rounded-none p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-text-primary">Action:</span>
          <div className="flex bg-bg-primary rounded-none p-1">
            <button
              onClick={() => setAction('approve')}
              className={`px-4 py-2 rounded-none text-sm font-medium transition-all ${
                action === 'approve' 
                  ? 'bg-accent text-white' 
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Approve
            </button>
            <button
              onClick={() => setAction('reject')}
              className={`px-4 py-2 rounded-none text-sm font-medium transition-all ${
                action === 'reject' 
                  ? 'bg-red-500 text-white' 
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Reject
            </button>
          </div>
        </div>

        {action === 'reject' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-text-primary mb-1">Rejection Notes (Required)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              rows={3}
              className="w-full px-4 py-2 bg-bg-primary border border-bg-tertiary rounded-none resize-none"
            />
          </div>
        )}
      </div>

      {/* Solutions List */}
      <div className="space-y-4">
        {pendingSolutions.map(solution => {
          const config = SOLUTION_TYPES[solution.solution_type as SolutionType];
          const isSelected = selectedSolutions.includes(solution.id);
          
          return (
            <div 
              key={solution.id}
              className={`border rounded-none p-4 transition-all ${
                isSelected ? 'border-accent bg-accent/5' : 'border-bg-tertiary'
              }`}
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => setSelectedSolutions(prev => {
                    if (prev.includes(solution.id)) {
                      return prev.filter(id => id !== solution.id);
                    }
                    return [...prev, solution.id];
                  })}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'border-accent bg-accent' : 'border-bg-tertiary'
                  }`}
                >
                  {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                </button>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-none bg-accent/10 flex items-center text-accent">
                      {config?.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">
                        {config?.label || solution.solution_type}
                      </h3>
                      {solution.linked_assessment_type && (
                        <Badge variant="default" className="text-xs">
                          {solution.linked_assessment_type.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Solution Details */}
                  <div className="bg-bg-secondary rounded-none p-4 mb-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {solution.solution_detail?.key_roles && (
                        <div>
                          <span className="text-text-muted">Key Roles:</span>
                          <p className="text-text-primary">{solution.solution_detail.key_roles.join(', ')}</p>
                        </div>
                      )}
                      {solution.solution_detail?.timeline && (
                        <div>
                          <span className="text-text-muted">Timeline:</span>
                          <p className="text-text-primary">{solution.solution_detail.timeline}</p>
                        </div>
                      )}
                      {solution.solution_detail?.candidate_count && (
                        <div>
                          <span className="text-text-muted">Candidates:</span>
                          <p className="text-text-primary">{solution.solution_detail.candidate_count}</p>
                        </div>
                      )}
                      {solution.solution_detail?.team_name && (
                        <div>
                          <span className="text-text-muted">Team:</span>
                          <p className="text-text-primary">{solution.solution_detail.team_name}</p>
                        </div>
                      )}
                      {solution.solution_detail?.org_units && (
                        <div>
                          <span className="text-text-muted">Org Units:</span>
                          <p className="text-text-primary">{solution.solution_detail.org_units.join(', ')}</p>
                        </div>
                      )}
                      {solution.solution_detail?.roles && (
                        <div>
                          <span className="text-text-muted">Roles:</span>
                          <p className="text-text-primary">{solution.solution_detail.roles.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-text-muted">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>Defined by: {solution.defined_by_name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(solution.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          className="flex-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={processing}
          className="flex-1"
          style={{ backgroundColor: action === 'approve' ? undefined : '#EF4444' }}
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {action === 'approve' ? (
                <CheckCircle className="w-4 h-4 mr-2" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              {action === 'approve' ? 'Approve Selected' : 'Reject Selected'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default SolutionApproval;
