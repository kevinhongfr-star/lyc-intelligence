// Phase 7.4: Background Check Tracker Component
'use client';

import React, { useState, useEffect } from 'react';
import { FileCheck, Calendar, AlertCircle, CheckCircle, Clock, XCircle, Download } from 'lucide-react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';

interface BackgroundCheck {
  id: string;
  candidate_id: string;
  mandate_id?: string;
  check_type: string;
  provider: string;
  order_date: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  result?: 'clear' | 'discrepancy' | 'unresolved';
  result_summary?: string;
  report_url?: string;
  ordered_by: string;
  created_at: string;
  completed_at?: string;
}

interface BackgroundCheckTrackerProps {
  candidateId: string;
  onUploadResult: (check: BackgroundCheck) => void;
}

const CHECK_TYPE_LABELS: Record<string, string> = {
  criminal: 'Criminal',
  employment: 'Employment',
  education: 'Education',
  credit: 'Credit',
  drug_screening: 'Drug Screening',
  comprehensive: 'Comprehensive',
};

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Pending' },
  in_progress: { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-100', label: 'In Progress' },
  completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100', label: 'Failed' },
  cancelled: { icon: XCircle, color: 'text-gray-400', bg: 'bg-gray-100', label: 'Cancelled' },
};

const RESULT_CONFIG = {
  clear: { color: 'text-green-600', bg: 'bg-green-100', label: 'Clear' },
  discrepancy: { color: 'text-amber-600', bg: 'bg-amber-100', label: 'Discrepancy' },
  unresolved: { color: 'text-red-600', bg: 'bg-red-100', label: 'Unresolved' },
};

export function BackgroundCheckTracker({ candidateId, onUploadResult }: BackgroundCheckTrackerProps) {
  const [checks, setChecks] = useState<BackgroundCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchChecks();
  }, [candidateId]);

  const fetchChecks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/data/background-checks?candidate_id=${candidateId}`);
      const result = await response.json();

      if (result.success) {
        setChecks(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch background checks:', err);
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileCheck className="w-5 h-5 text-text-muted" />
          <h3 className="font-semibold text-text-primary">Background Checks</h3>
        </div>
        <span className="text-sm text-text-muted">{checks.length} checks</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : checks.length === 0 ? (
        <div className="text-center py-8">
          <FileCheck className="w-12 h-12 text-text-muted mx-auto" />
          <p className="text-text-muted mt-4">No background checks ordered</p>
        </div>
      ) : (
        <div className="space-y-4">
          {checks.map(check => {
            const statusConfig = STATUS_CONFIG[check.status];
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={check.id}
                className="p-4 bg-bg-alt rounded-none"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-none ${statusConfig.bg} flex items-center justify-center`}>
                        <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-text-primary">
                            {CHECK_TYPE_LABELS[check.check_type]}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${statusConfig.bg} ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                          {check.result && (
                            <span className={`px-2 py-0.5 rounded-full text-xs ${RESULT_CONFIG[check.result].bg} ${RESULT_CONFIG[check.result].color}`}>
                              {RESULT_CONFIG[check.result].label}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-text-muted">
                          <span>Provider: {check.provider}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(check.order_date)}
                          </span>
                        </div>
                        {check.due_date && (
                          <div className="text-sm text-text-muted mt-1">
                            Due: {formatDate(check.due_date)}
                          </div>
                        )}
                        {check.result_summary && (
                          <div className="mt-2 p-2 bg-bg-base rounded text-sm text-text-primary">
                            {check.result_summary}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {check.status === 'completed' && check.report_url && (
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="w-4 h-4" />
                        View Report
                      </Button>
                    )}
                    {check.status === 'in_progress' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUploadResult(check)}
                      >
                        Upload Results
                      </Button>
                    )}
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

export default BackgroundCheckTracker;