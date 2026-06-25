// Phase 7.1: Reference Tracker Component
// Referee System - Track status of all reference requests

'use client';

import React, { useState, useEffect } from 'react';
import { authFetch } from '@/utils/authFetch';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Mail,
  Bell,
  Loader2,
  RefreshCw,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui';
import { Card } from '@/components/ui';

interface ReferenceRequest {
  id: string;
  candidateId: string;
  candidateName: string;
  mandateTitle: string;
  refereeName: string;
  refereeEmail: string;
  refereeTitle: string;
  refereeCompany: string;
  relationship: string;
  status: 'invited' | 'reminded' | 'submitted' | 'expired' | 'declined';
  invitedAt: string;
  remindedAt: string | null;
  submittedAt: string | null;
  expiresAt: string;
}

interface ReferenceTrackerProps {
  candidateId?: string;
  mandateId?: string;
  organizationId?: string;
  /**
   * Callback when viewing details
   */
  onViewDetail?: (requestId: string) => void;
}

const STATUS_CONFIG = {
  invited: {
    label: 'Pending',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: Mail,
  },
  reminded: {
    label: 'Reminded',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Bell,
  },
  submitted: {
    label: 'Submitted',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle2,
  },
  expired: {
    label: 'Expired',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: Clock,
  },
  declined: {
    label: 'Declined',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: XCircle,
  },
};

export function ReferenceTracker({
  candidateId,
  mandateId,
  organizationId,
  onViewDetail,
}: ReferenceTrackerProps) {
  const [requests, setRequests] = useState<ReferenceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch reference requests
  const fetchRequests = async () => {
    try {
      const params = new URLSearchParams();
      if (candidateId) params.set('candidate_id', candidateId);
      if (mandateId) params.set('mandate_id', mandateId);
      if (organizationId) params.set('organization_id', organizationId);

      const response = await authFetch(`/api/data/reference-requests?${params}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch references');
      }

      setRequests(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load references');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [candidateId, mandateId, organizationId]);

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchRequests();
  };

  // Calculate stats
  const stats = {
    total: requests.length,
    submitted: requests.filter(r => r.status === 'submitted').length,
    pending: requests.filter(r => ['invited', 'reminded'].includes(r.status)).length,
    expired: requests.filter(r => ['expired', 'declined'].includes(r.status)).length,
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get days until expiry
  const getDaysUntilExpiry = (expiresAt: string) => {
    const days = Math.ceil(
      (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (days < 0) return 'Expired';
    if (days === 0) return 'Expires today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <span className="ml-2 text-text-muted">Loading references...</span>
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
        <button
          onClick={handleRefresh}
          className="mt-4 text-sm text-primary hover:underline"
        >
          Try again
        </button>
      </Card>
    );
  }

  // Empty state
  if (requests.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <User className="w-12 h-12 text-text-muted mx-auto" />
          <h3 className="font-medium text-text-primary mt-4">No Reference Requests</h3>
          <p className="text-sm text-text-muted mt-1">
            Reference requests will appear here once you send them.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
          <p className="text-xs text-text-muted">Total</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.submitted}</p>
          <p className="text-xs text-green-600">Submitted</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          <p className="text-xs text-amber-600">Pending</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-600">{stats.expired}</p>
          <p className="text-xs text-gray-600">Inactive</p>
        </div>
      </div>

      {/* Request List */}
      <div className="space-y-3">
        {requests.map((request) => {
          const config = STATUS_CONFIG[request.status];
          const StatusIcon = config.icon;

          return (
            <Card
              key={request.id}
              className="p-4 hover:bg-bg-alt transition-colors cursor-pointer"
              onClick={() => onViewDetail?.(request.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    request.status === 'submitted'
                      ? 'bg-green-100'
                      : request.status === 'expired' || request.status === 'declined'
                      ? 'bg-gray-100'
                      : 'bg-amber-100'
                  }`}>
                    <StatusIcon className={`w-5 h-5 ${
                      request.status === 'submitted'
                        ? 'text-green-600'
                        : request.status === 'expired' || request.status === 'declined'
                        ? 'text-gray-600'
                        : 'text-amber-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">{request.refereeName}</p>
                    <p className="text-sm text-text-muted">
                      {request.refereeTitle}
                      {request.refereeCompany && ` at ${request.refereeCompany}`}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      {request.refereeRelationship.replace('_', ' ')} • Invited {formatDate(request.invitedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
                    {config.label}
                  </span>
                  {request.status === 'submitted' ? (
                    <span className="text-xs text-green-600">
                      {formatDate(request.submittedAt)}
                    </span>
                  ) : (
                    <span className={`text-xs ${
                      request.status === 'expired' ? 'text-gray-500' : 'text-amber-600'
                    }`}>
                      {getDaysUntilExpiry(request.expiresAt)}
                    </span>
                  )}
                </div>
              </div>

              {/* Candidate context */}
              {candidateId && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-text-muted">
                    For: {request.candidateName} • {request.mandateTitle}
                  </p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Refresh button */}
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        Refresh
      </button>
    </div>
  );
}

// Compact stats version for dashboard
export function ReferenceStatsCards({ candidateId }: { candidateId: string }) {
  const [stats, setStats] = useState<{
    total: number;
    submitted: number;
    pending: number;
    avgRating: number | null;
  } | null>(null);

  useEffect(() => {
    async function fetch() {
      const response = await authFetch(`/api/data/reference-requests?candidate_id=${candidateId}&stats=true`);
      const result = await response.json();
      if (result.success) {
        setStats(result.stats);
      }
    }
    fetch();
  }, [candidateId]);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-card border border-border rounded-lg p-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="text-sm text-text-muted">Submitted</span>
        </div>
        <p className="text-xl font-bold text-text-primary mt-1">
          {stats.submitted} / {stats.total}
        </p>
      </div>
      <div className="bg-card border border-border rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <span className="text-sm text-text-muted">Pending</span>
        </div>
        <p className="text-xl font-bold text-text-primary mt-1">{stats.pending}</p>
      </div>
    </div>
  );
}

export default ReferenceTracker;
