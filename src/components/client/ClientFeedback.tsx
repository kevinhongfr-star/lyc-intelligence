import React, { useState } from 'react';
import { X, CheckCircle, XCircle, MinusCircle, Send, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { updateCandidateFeedback, createNotification } from '@/services/supabaseApi';
import type { CandidatePipeline, Mandate } from '@/services/supabaseApi';

interface ClientFeedbackProps {
  candidate: CandidatePipeline;
  mandate: Mandate;
  onClose: () => void;
  onSubmit: () => void;
}

export function ClientFeedback({ candidate, mandate, onClose, onSubmit }: ClientFeedbackProps) {
  const { profile } = useAuthStore();
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'hold'>('approved');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      setError('Please provide a reason for your decision');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Update candidate feedback
      const success = await updateCandidateFeedback(candidate.id, {
        decision,
        comment: comment.trim(),
        decided_by: profile?.id || null,
        decided_at: new Date().toISOString(),
      });

      if (!success) {
        throw new Error('Failed to submit feedback');
      }

      // Create notification for consultant
      const consultantId = mandate.intake_data?.consultant_id || '';
      if (consultantId) {
        await createNotification(consultantId, {
          type: 'feedback_received',
          title: `${candidate.contact?.name} has been ${decision}`,
          message: `${profile?.name} ${decision === 'approved' ? 'approved' : decision === 'rejected' ? 'rejected' : 'put on hold'} ${candidate.contact?.name} for ${mandate.title}`,
          link: `/platform/mandates/${mandate.id}/pipeline`,
          metadata: {
            candidate_id: candidate.id,
            mandate_id: mandate.id,
            decision,
          },
        });
      }

      onSubmit();
    } catch (err) {
      console.error('Feedback submission error:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDecisionInfo = () => {
    switch (decision) {
      case 'approved':
        return {
          icon: CheckCircle,
          color: '#22C55E',
          label: 'Approve',
          description: 'Candidate moves to interview phase',
        };
      case 'rejected':
        return {
          icon: XCircle,
          color: '#EF4444',
          label: 'Reject',
          description: 'Candidate is removed from consideration',
        };
      case 'hold':
        return {
          icon: MinusCircle,
          color: '#EAB308',
          label: 'On Hold',
          description: 'Candidate pending further review',
        };
    }
  };

  const decisionInfo = getDecisionInfo();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-bg-tertiary flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Provide Feedback</h3>
            <p className="text-sm text-text-muted">{candidate.contact?.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-tertiary rounded-none">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Candidate Info */}
          <div className="flex items-center gap-3 p-4 bg-bg-secondary rounded-none">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: '#6B7280' }}
            >
              {candidate.contact?.name?.[0] ?? '?'}
            </div>
            <div>
              <p className="font-medium text-text-primary">{candidate.contact?.name}</p>
              <p className="text-sm text-text-muted">{candidate.contact?.current_title}</p>
            </div>
          </div>

          {/* Decision Radio Buttons */}
          <div>
            <p className="text-sm font-medium text-text-primary mb-3">Decision</p>
            <div className="space-y-2">
              {(['approved', 'rejected', 'hold'] as const).map((dec) => {
                const info = {
                  approved: { icon: CheckCircle, color: '#22C55E', label: 'Approve' },
                  rejected: { icon: XCircle, color: '#EF4444', label: 'Reject' },
                  hold: { icon: MinusCircle, color: '#EAB308', label: 'On Hold' },
                }[dec];
                
                return (
                  <label
                    key={dec}
                    className={`flex items-center gap-3 p-3 border rounded-none cursor-pointer transition-all ${
                      decision === dec
                        ? 'border-accent bg-accent/5'
                        : 'border-bg-tertiary hover:border-accent/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="decision"
                      value={dec}
                      checked={decision === dec}
                      onChange={() => setDecision(dec)}
                      className="sr-only"
                    />
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        decision === dec ? 'bg-accent' : 'bg-bg-tertiary'
                      }`}
                    >
                      <info.icon className={`w-4 h-4 ${decision === dec ? 'text-white' : 'text-text-muted'}`} />
                    </div>
                    <div>
                      <p className={`font-medium ${decision === dec ? 'text-accent' : 'text-text-primary'}`}>
                        {info.label}
                      </p>
                      <p className="text-xs text-text-muted">
                        {dec === 'approved' && 'Candidate moves to interview phase'}
                        {dec === 'rejected' && 'Candidate is removed from consideration'}
                        {dec === 'hold' && 'Candidate pending further review'}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Comment Textarea */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Reason for Decision <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Please explain your decision..."
              className="w-full px-4 py-3 border border-bg-tertiary rounded-none focus:outline-none focus:border-accent resize-none"
              rows={4}
            />
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
          </div>

          {/* Preview */}
          <div 
            className="p-4 rounded-none"
            style={{ backgroundColor: `${decisionInfo.color}10` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <decisionInfo.icon className="w-5 h-5" style={{ color: decisionInfo.color }} />
              <span className="font-medium" style={{ color: decisionInfo.color }}>
                {decisionInfo.label}
              </span>
            </div>
            <p className="text-sm text-text-secondary">
              {comment || 'Your comment will appear here'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-bg-tertiary bg-bg-secondary flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-bg-tertiary rounded-none text-text-secondary hover:bg-bg-tertiary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-accent text-white rounded-none font-medium hover:bg-accent/90 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Feedback
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClientFeedback;
