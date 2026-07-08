// Phase 3.11: Pending Approvals List Component
'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  User,
  FileText,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';

interface PendingApproval {
  id: string;
  approval_type: string;
  entity_type: string;
  entity_id: string;
  request_data: Record<string, unknown>;
  requested_by: string;
  requested_at: string;
  current_step: number;
  status: string;
  sla_deadline: string | null;
}

interface PendingApprovalsListProps {
  userId: string;
  orgId: string;
  onSelectRequest: (requestId: string) => void;
}

const APPROVAL_TYPE_LABELS: Record<string, string> = {
  candidate_submission: 'Candidate Submission',
  fee_change: 'Fee Change',
  offer_approval: 'Offer Approval',
  mandate_creation: 'Mandate Creation',
  budget_exception: 'Budget Exception',
  data_export: 'Data Export',
  custom: 'Custom Approval',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  in_review: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  escalated: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

export function PendingApprovalsList({ userId, orgId, onSelectRequest }: PendingApprovalsListProps) {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchApprovals();
  }, [userId, orgId]);

  const fetchApprovals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/approvals/my-pending?user_id=${userId}&org_id=${orgId}`
      );
      const result = await response.json();

      if (result.success) {
        setApprovals(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch pending approvals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  const getSlaStatus = (deadline: string | null) => {
    if (!deadline) return { label: 'No SLA', color: 'text-gray-400', icon: Clock };

    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffMs = deadlineDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours <= 0) {
      return { label: 'Overdue', color: 'text-red-500', icon: XCircle };
    }
    if (diffHours <= 6) {
      return { label: `${Math.ceil(diffHours)}h left`, color: 'text-amber-500', icon: AlertTriangle };
    }
    return { label: `${Math.ceil(diffHours)}h left`, color: 'text-green-500', icon: Clock };
  };

  const getEntitySummary = (entityType: string, requestData: Record<string, unknown>) => {
    if (entityType === 'candidate') {
      return requestData.candidate_name || 'Candidate';
    }
    if (entityType === 'offer') {
      return requestData.candidate_name || 'Offer';
    }
    if (entityType === 'fee') {
      return requestData.fee_amount ? `$${requestData.fee_amount}` : 'Fee Change';
    }
    return entityType.charAt(0).toUpperCase() + entityType.slice(1);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-text-muted" />
          <h3 className="font-semibold text-text-primary">Pending Approvals</h3>
          {approvals.length > 0 && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
              {approvals.length}
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={fetchApprovals}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : approvals.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
          <p className="text-text-muted mt-4">No pending approvals</p>
          <p className="text-sm text-text-muted mt-2">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {approvals.map(approval => {
            const slaStatus = getSlaStatus(approval.sla_deadline);
            const SlaIcon = slaStatus.icon;

            return (
              <div
                key={approval.id}
                className="p-4 bg-bg-alt rounded-none cursor-pointer hover:bg-bg-base transition-colors"
                onClick={() => onSelectRequest(approval.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-none bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-text-primary">
                        {APPROVAL_TYPE_LABELS[approval.approval_type] || approval.approval_type}
                      </div>
                      <div className="text-sm text-text-muted mt-1">
                        {getEntitySummary(approval.entity_type, approval.request_data)}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Requested by you
                        </span>
                        <span>{formatTimeAgo(approval.requested_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1 text-xs ${slaStatus.color}`}>
                      <SlaIcon className="w-4 h-4" />
                      {slaStatus.label}
                    </div>
                    <ChevronRight className="w-5 h-5 text-text-muted" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default PendingApprovalsList;
