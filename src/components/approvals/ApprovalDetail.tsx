// Phase 3.11: Approval Detail Component
'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  MessageSquare,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  X,
  Calendar,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { Textarea } from '@/components/ui';

interface StepRecord {
  id: string;
  step_order: number;
  approver_id: string;
  approver_role: string | null;
  status: string;
  decision: string | null;
  comment: string | null;
  decided_at: string | null;
  delegated_from: string | null;
  escalated_at: string | null;
}

interface AuditEntry {
  id: string;
  action: string;
  actor_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

interface ApprovalDetailProps {
  requestId: string;
  approverId: string;
  onClose: () => void;
  onActionComplete?: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  in_review: 'In Review',
  escalated: 'Escalated',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  in_review: 'bg-blue-100 text-blue-700',
  escalated: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const ACTION_LABELS: Record<string, string> = {
  requested: 'Request Created',
  step_approved: 'Step Approved',
  step_rejected: 'Step Rejected',
  escalated: 'Escalated',
  delegated: 'Delegated',
  cancelled: 'Cancelled',
  fully_approved: 'Fully Approved',
};

export function ApprovalDetail({ requestId, approverId, onClose, onActionComplete }: ApprovalDetailProps) {
  const [detail, setDetail] = useState<{
    request: any;
    steps: StepRecord[];
    audit: AuditEntry[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [showAudit, setShowAudit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [requestId]);

  const fetchDetail = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/x/approvals/requests/${requestId}`);
      const result = await response.json();

      if (result.success) {
        setDetail(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch approval detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (decision: 'approved' | 'rejected') => {
    if (!detail) return;

    const currentStep = detail.request.current_step;
    const currentStepRecord = detail.steps.find(s => s.step_order === currentStep);

    if (!currentStepRecord || currentStepRecord.approver_id !== approverId) return;
    if (currentStepRecord.status !== 'pending') return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/x/approvals/requests/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step_order: currentStep,
          approver_id: approverId,
          decision,
          comment,
        }),
      });

      const result = await response.json();

      if (result.success) {
        fetchDetail();
        onActionComplete?.();
      }
    } catch (err) {
      console.error('Failed to process approval:', err);
    } finally {
      setIsSubmitting(false);
      setComment('');
    }
  };

  const getStepIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (status === 'rejected') return <XCircle className="w-5 h-5 text-red-500" />;
    if (status === 'escalated') return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    return <Clock className="w-5 h-5 text-gray-400" />;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-primary animate-spin" />
        </div>
      </Card>
    );
  }

  if (!detail) {
    return (
      <Card className="p-6">
        <p className="text-center text-text-muted">Approval not found</p>
      </Card>
    );
  }

  const { request, steps, audit } = detail;
  const currentStepRecord = steps.find(s => s.step_order === request.current_step);
  const canApprove = currentStepRecord?.approver_id === approverId && currentStepRecord?.status === 'pending';
  const isCompleted = ['approved', 'rejected', 'cancelled'].includes(request.status);

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-primary" />
          <div>
            <h2 className="font-semibold text-text-primary">
              {request.approval_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
            </h2>
            <p className="text-sm text-text-muted">
              {request.entity_type} • {request.entity_id.slice(0, 8)}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[request.status]}`}>
            {STATUS_LABELS[request.status]}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* SLA Deadline */}
      {request.sla_deadline && (
        <div className="mb-6 p-4 bg-bg-alt rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-text-muted" />
            <span className="text-text-muted">SLA Deadline: </span>
            <span className="text-text-primary">
              {new Date(request.sla_deadline).toLocaleString()}
            </span>
            {new Date(request.sla_deadline) < new Date() && (
              <span className="flex items-center gap-1 text-red-500">
                <AlertTriangle className="w-4 h-4" />
                Overdue
              </span>
            )}
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="mb-6">
        <h3 className="font-medium text-text-primary mb-4">Approval Steps</h3>
        <div className="space-y-4">
          {steps.map((step, index) => {
            const isCurrentStep = step.step_order === request.current_step && !isCompleted;
            const isPast = step.status === 'approved' || step.status === 'rejected';

            return (
              <div key={step.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCurrentStep ? 'bg-primary/10 ring-2 ring-primary' : 'bg-bg-alt'
                  }`}>
                    {getStepIcon(step.status)}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-0.5 h-8 ${isPast ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-text-primary">
                        Step {step.step_order}: {step.approver_role || step.approver_id.slice(0, 8)}
                      </span>
                      {step.delegated_from && (
                        <span className="text-xs text-text-muted ml-2">
                          (delegated)
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[step.status]}`}>
                      {STATUS_LABELS[step.status]}
                    </span>
                  </div>
                  {step.decided_at && (
                    <div className="text-sm text-text-muted mt-1">
                      {new Date(step.decided_at).toLocaleString()}
                    </div>
                  )}
                  {step.comment && (
                    <div className="mt-2 p-2 bg-bg-alt rounded text-sm text-text-primary">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-text-muted" />
                        {step.comment}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      {canApprove && (
        <div className="border-t border-border pt-6">
          <h3 className="font-medium text-text-primary mb-4">Your Decision</h3>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add comment (optional)"
            rows={3}
            className="mb-4"
          />
          <div className="flex gap-3">
            <Button
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
              onClick={() => handleAction('approved')}
              disabled={isSubmitting}
            >
              <ThumbsUp className="w-4 h-4" />
              Approve
            </Button>
            <Button
              className="flex-1 gap-2 bg-red-600 hover:bg-red-700"
              onClick={() => handleAction('rejected')}
              disabled={isSubmitting}
            >
              <ThumbsDown className="w-4 h-4" />
              Reject
            </Button>
          </div>
        </div>
      )}

      {/* Audit Trail Toggle */}
      <div className="mt-6 border-t border-border pt-6">
        <button
          className="flex items-center justify-between w-full"
          onClick={() => setShowAudit(!showAudit)}
        >
          <span className="font-medium text-text-primary">Audit Trail</span>
          {showAudit ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {showAudit && (
          <div className="mt-4 space-y-3">
            {audit.map((entry) => (
              <div key={entry.id} className="flex gap-3 text-sm">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-text-muted flex-shrink-0" />
                <div>
                  <div className="text-text-primary">
                    {ACTION_LABELS[entry.action] || entry.action}
                  </div>
                  <div className="text-text-muted text-xs">
                    {new Date(entry.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

export default ApprovalDetail;
