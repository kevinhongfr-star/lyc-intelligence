// AgentActionReviewQueue.tsx — DEX Platform Foundation T1
// Shows pending agent actions for team_lead/admin review

'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  AlertTriangle,
  Bot,
  ChevronDown,
  ChevronUp,
  Eye,
} from 'lucide-react';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

interface AgentAction {
  id: string;
  agent_id: string;
  action_type: string;
  status: string;
  confidence: number | null;
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  created_at: string;
  triggered_by: string;
  contact_id: string | null;
  mandate_id: string | null;
  review_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  error_message: string | null;
}

interface AgentActionReviewQueueProps {
  showAll?: boolean; // show all vs just pending
  agentFilter?: string;
  onReviewComplete?: () => void;
}

const AGENT_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  trident:  { label: 'TRIDENT', color: 'text-cyan-700 bg-cyan-50 border-cyan-200', icon: <Bot className="w-4 h-4" /> },
  canvas:   { label: 'CANVAS', color: 'text-violet-700 bg-violet-50 border-violet-200', icon: <Bot className="w-4 h-4" /> },
  grid:     { label: 'GRID', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: <Bot className="w-4 h-4" /> },
  sweep:    { label: 'SWEEP', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: <Bot className="w-4 h-4" /> },
  alessio:  { label: 'ALESSIO', color: 'text-pink-700 bg-pink-50 border-pink-200', icon: <Bot className="w-4 h-4" /> },
};

const ACTION_TYPE_LABELS: Record<string, string> = {
  score: 'Score',
  narrate: 'Narrate',
  map: 'Map',
  research: 'Research',
  notify: 'Notify',
  draft: 'Draft',
  enrich: 'Enrich',
  parse: 'Parse',
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:  { bg: 'bg-amber-50', text: 'text-amber-700' },
  approved: { bg: 'bg-green-50', text: 'text-green-700' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700' },
  executed: { bg: 'bg-blue-50', text: 'text-blue-700' },
  failed:   { bg: 'bg-red-50', text: 'text-red-700' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}

function OutputPreview({ data }: { data: Record<string, any> }) {
  const [expanded, setExpanded] = useState(false);
  const entries = Object.entries(data);

  if (entries.length === 0) {
    return <span className="text-xs text-text-secondary italic">No output yet</span>;
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? 'Hide' : 'Show'} output ({entries.length} fields)
      </button>

      {expanded && (
        <div className="mt-2 p-2 rounded bg-gray-50 border border-gray-200 text-xs font-mono max-h-48 overflow-auto">
          {entries.map(([key, value]) => (
            <div key={key} className="flex gap-2">
              <span className="text-purple-600">{key}:</span>
              <span className="text-gray-800 truncate">
                {typeof value === 'object' ? JSON.stringify(value).substring(0, 100) : String(value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AgentActionReviewQueue({
  showAll = false,
  agentFilter,
  onReviewComplete,
}: AgentActionReviewQueueProps) {
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  async function fetchActions() {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (!showAll) {
        params.set('status', 'pending');
      }
      if (agentFilter) {
        params.set('agent_id', agentFilter);
      }
      params.set('limit', '50');

      const res = await fetch(`/api/agent-actions?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setActions(data.data || []);
      } else {
        setError(data.error || 'Failed to load actions');
      }
    } catch (e) {
      setError('Network error loading actions');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchActions();
  }, [showAll, agentFilter]);

  async function handleReview(actionId: string, approved: boolean) {
    setReviewingId(actionId);
    try {
      const res = await fetch(`/api/agent-actions/${actionId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: approved ? 'approved' : 'rejected',
          review_notes: reviewNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReviewNotes('');
        await fetchActions();
        onReviewComplete?.();
      } else {
        setError(data.error || 'Review failed');
      }
    } catch (e) {
      setError('Review failed');
    } finally {
      setReviewingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-text-secondary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-600 text-sm">
        {error}
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary text-sm">
        {showAll ? 'No agent actions yet.' : 'No pending actions to review.'}
      </div>
    );
  }

  const pendingActions = actions.filter(a => a.status === 'pending');
  const otherActions = actions.filter(a => a.status !== 'pending');

  return (
    <div className="space-y-4">
      {/* Pending Actions */}
      {pendingActions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            Pending Review ({pendingActions.length})
          </h3>
          <div className="space-y-3">
            {pendingActions.map((action) => {
              const agent = AGENT_CONFIG[action.agent_id] || AGENT_CONFIG.alessio;
              return (
                <Card key={action.id} className="border-amber-200">
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-semibold ${agent.color}`}>
                          {agent.icon}
                          <span>{agent.label}</span>
                        </div>
                        <Badge variant="warning">{ACTION_TYPE_LABELS[action.action_type] || action.action_type}</Badge>
                        {action.confidence && (
                          <Badge variant="default">
                            {Math.round(action.confidence * 100)}% confidence
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-text-secondary whitespace-nowrap">
                        {formatDate(action.created_at)}
                      </span>
                    </div>

                    {/* Input/Output Preview */}
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs font-medium text-text-secondary">Input:</span>
                        <div className="mt-1 text-xs text-text-secondary">
                          {action.contact_id && <div>Contact: {action.contact_id.substring(0, 8)}...</div>}
                          {action.mandate_id && <div>Mandate: {action.mandate_id.substring(0, 8)}...</div>}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-text-secondary">Output:</span>
                        <OutputPreview data={action.output_data} />
                      </div>
                    </div>

                    {/* Review Actions */}
                    <div className="mt-4 flex items-center gap-3">
                      <textarea
                        value={reviewingId === action.id ? reviewNotes : ''}
                        onChange={(e) => {
                          setReviewingId(action.id);
                          setReviewNotes(e.target.value);
                        }}
                        placeholder="Review notes (optional)"
                        className="flex-1 text-sm px-3 py-2 rounded border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReview(action.id, false)}
                          disabled={reviewingId === action.id}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleReview(action.id, true)}
                          disabled={reviewingId === action.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {reviewingId === action.id ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                          )}
                          Approve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Other Actions */}
      {showAll && otherActions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            History
          </h3>
          <div className="space-y-2">
            {otherActions.slice(0, 10).map((action) => {
              const agent = AGENT_CONFIG[action.agent_id] || AGENT_CONFIG.alessio;
              const statusStyle = STATUS_COLORS[action.status] || STATUS_COLORS.pending;
              return (
                <div
                  key={action.id}
                  className="flex items-center justify-between p-3 rounded bg-bg-secondary border border-bg-tertiary"
                >
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-semibold ${agent.color}`}>
                      {agent.icon}
                      <span>{agent.label}</span>
                    </div>
                    <Badge className={`${statusStyle.bg} ${statusStyle.text}`}>
                      {action.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-text-secondary">
                    {formatDate(action.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
