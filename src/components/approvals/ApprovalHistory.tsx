// Phase 3.11: Approval History Component
'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  ChevronRight,
  RefreshCw,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { Select } from '@/components/ui';

interface ApprovalHistoryItem {
  id: string;
  approval_type: string;
  entity_type: string;
  entity_id: string;
  status: string;
  final_decision: string | null;
  requested_at: string;
  decided_at: string | null;
  current_step: number;
}

interface ApprovalHistoryProps {
  orgId: string;
  onSelectRequest: (requestId: string) => void;
}

const STATUS_FILTERS = [
  { value: '', label: 'All Statuses' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'in_review', label: 'In Review' },
  { value: 'pending', label: 'Pending' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'cancelled', label: 'Cancelled' },
];

const APPROVAL_TYPE_LABELS: Record<string, string> = {
  candidate_submission: 'Candidate Submission',
  fee_change: 'Fee Change',
  offer_approval: 'Offer Approval',
  mandate_creation: 'Mandate Creation',
  budget_exception: 'Budget Exception',
  data_export: 'Data Export',
  custom: 'Custom Approval',
};

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  approved: { icon: CheckCircle2, color: 'text-green-500', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-red-500', label: 'Rejected' },
  in_review: { icon: Clock, color: 'text-blue-500', label: 'In Review' },
  pending: { icon: Clock, color: 'text-gray-400', label: 'Pending' },
  escalated: { icon: AlertTriangle, color: 'text-amber-500', label: 'Escalated' },
  cancelled: { icon: XCircle, color: 'text-gray-400', label: 'Cancelled' },
};

export function ApprovalHistory({ orgId, onSelectRequest }: ApprovalHistoryProps) {
  const [approvals, setApprovals] = useState<ApprovalHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchApprovals();
  }, [orgId, statusFilter]);

  const fetchApprovals = async () => {
    setIsLoading(true);
    try {
      let url = `/api/x/approvals/requests?org_id=${orgId}`;
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setApprovals(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch approval history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-text-muted" />
          <h3 className="font-semibold text-text-primary">Approval History</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-muted" />
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
              className="w-40"
            >
              {STATUS_FILTERS.map(filter => (
                <option key={filter.value} value={filter.value}>{filter.label}</option>
              ))}
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={fetchApprovals}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-3 bg-bg-alt rounded-lg text-center">
          <div className="text-2xl font-bold text-text-primary">{approvals.length}</div>
          <div className="text-xs text-text-muted">Total</div>
        </div>
        <div className="p-3 bg-green-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">
            {approvals.filter(a => a.status === 'approved').length}
          </div>
          <div className="text-xs text-green-600">Approved</div>
        </div>
        <div className="p-3 bg-red-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-600">
            {approvals.filter(a => a.status === 'rejected').length}
          </div>
          <div className="text-xs text-red-600">Rejected</div>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">
            {approvals.filter(a => a.status === 'in_review' || a.status === 'pending').length}
          </div>
          <div className="text-xs text-blue-600">In Progress</div>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : approvals.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-text-muted mx-auto" />
          <p className="text-text-muted mt-4">No approval requests found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {approvals.map(approval => {
            const statusConfig = STATUS_CONFIG[approval.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={approval.id}
                className="p-4 bg-bg-alt rounded-lg cursor-pointer hover:bg-bg-base transition-colors"
                onClick={() => onSelectRequest(approval.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      approval.status === 'approved' ? 'bg-green-100' :
                      approval.status === 'rejected' ? 'bg-red-100' :
                      approval.status === 'escalated' ? 'bg-amber-100' :
                      'bg-blue-100'
                    }`}>
                      <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                    </div>
                    <div>
                      <div className="font-medium text-text-primary">
                        {APPROVAL_TYPE_LABELS[approval.approval_type] || approval.approval_type}
                      </div>
                      <div className="text-sm text-text-muted">
                        {approval.entity_type} • {formatDate(approval.requested_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      approval.status === 'approved' ? 'bg-green-100 text-green-700' :
                      approval.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      approval.status === 'escalated' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {statusConfig.label}
                    </span>
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

export default ApprovalHistory;
