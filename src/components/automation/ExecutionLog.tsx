// Phase 3.10: Execution Log Component
'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  CheckCircle,
  XCircle,
  MinusCircle,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface ExecutionLogProps {
  orgId: string;
  ruleId?: string;
  limit?: number;
}

interface RuleExecution {
  id: string;
  rule_id: string;
  entity_type: string;
  entity_id: string;
  trigger_data: Record<string, unknown>;
  status: 'success' | 'failed' | 'skipped';
  actions_executed: string[];
  error_message?: string;
  executed_at: string;
}

const selectClassName = 'w-full px-3 py-2 bg-bg-tertiary border border-bg-hover rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent';

export function ExecutionLog({ orgId, ruleId, limit = 50 }: ExecutionLogProps) {
  const [executions, setExecutions] = useState<RuleExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchExecutions();
  }, [orgId, ruleId, statusFilter, limit]);

  const fetchExecutions = async () => {
    setLoading(true);
    try {
      let url = `/api/automation/executions?org_id=${orgId}&limit=${limit}`;
      if (ruleId) url += `&rule_id=${ruleId}`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;

      const response = await fetch(url);
      const result = await response.json();
      if (result.success) {
        setExecutions(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch executions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-tier-1" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'skipped':
        return <MinusCircle className="w-4 h-4 text-text-muted" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'success': return 'Success';
      case 'failed': return 'Failed';
      case 'skipped': return 'Skipped';
      default: return status;
    }
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'failed': return 'danger';
      default: return 'default';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-text-muted">Loading execution history...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <History className="w-6 h-6 text-accent" />
          <div>
            <h2 className="font-serif font-semibold text-lg text-text-primary">Execution History</h2>
            <p className="text-sm text-text-muted">
              {executions.length} total executions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-muted" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={cn(selectClassName, 'w-32')}
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>
      </div>

      {/* Execution List */}
      {executions.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No executions yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {executions.map((exec) => (
            <div
              key={exec.id}
              className="p-3 bg-bg-secondary rounded-lg"
            >
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(expandedId === exec.id ? null : exec.id)}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(exec.status)}
                  <div>
                    <div className="text-sm font-medium text-text-primary">
                      {exec.entity_type} - {exec.entity_id.slice(0, 8)}
                    </div>
                    <div className="text-xs text-text-muted">
                      {formatDate(exec.executed_at)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {exec.actions_executed && exec.actions_executed.length > 0 && (
                    <Badge variant="default">
                      {exec.actions_executed.length} action(s)
                    </Badge>
                  )}
                  <Badge variant={getBadgeVariant(exec.status)}>
                    {getStatusLabel(exec.status)}
                  </Badge>
                  {expandedId === exec.id ? (
                    <ChevronUp className="w-4 h-4 text-text-muted" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-text-muted" />
                  )}
                </div>
              </div>

              {expandedId === exec.id && (
                <div className="mt-3 pt-3 border-t border-bg-hover">
                  {exec.error_message && (
                    <div className="mb-3 p-2 bg-red-500/10 rounded text-sm text-red-600">
                      Error: {exec.error_message}
                    </div>
                  )}

                  {exec.actions_executed && exec.actions_executed.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-text-muted mb-1">
                        Actions Executed
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {exec.actions_executed.map((action, idx) => (
                          <Badge key={idx} variant="default">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {exec.trigger_data && Object.keys(exec.trigger_data).length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-text-muted mb-1">
                        Trigger Data
                      </div>
                      <pre className="text-xs bg-bg-base p-2 rounded overflow-x-auto">
                        {JSON.stringify(exec.trigger_data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default ExecutionLog;
