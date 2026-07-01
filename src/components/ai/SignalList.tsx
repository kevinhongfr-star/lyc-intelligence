// SignalList.tsx — DEX Platform Foundation T1
// Displays signals for a given contact

'use client';

import React, { useState, useEffect } from 'react';
import {
  Mail,
  Calendar,
  MessageSquare,
  FileText,
  Linkedin,
  TrendingUp,
  Upload,
  AlertCircle,
  CheckCircle2,
  Clock,
  Grid3x3,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui';
import { Card, CardContent } from '@/components/ui';

interface Signal {
  id: string;
  type: string;
  source: string;
  title: string | null;
  content: string | null;
  action_required: boolean;
  action_status: string;
  created_at: string;
  actor_id: string;
  metadata: Record<string, any>;
  insights: Record<string, any>;
}

interface SignalListProps {
  contactId: string;
  limit?: number;
}

const SIGNAL_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  email:           { icon: <Mail className="w-4 h-4" />, color: 'text-blue-600 bg-blue-50', label: 'Email' },
  meeting:         { icon: <Calendar className="w-4 h-4" />, color: 'text-purple-600 bg-purple-50', label: 'Meeting' },
  comment:         { icon: <MessageSquare className="w-4 h-4" />, color: 'text-gray-600 bg-gray-50', label: 'Comment' },
  assessment:      { icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-600 bg-green-50', label: 'Assessment' },
  status_change:   { icon: <TrendingUp className="w-4 h-4" />, color: 'text-amber-600 bg-amber-50', label: 'Status Change' },
  feedback:        { icon: <AlertCircle className="w-4 h-4" />, color: 'text-pink-600 bg-pink-50', label: 'Feedback' },
  upload:          { icon: <Upload className="w-4 h-4" />, color: 'text-teal-600 bg-teal-50', label: 'Upload' },
  linkedin:        { icon: <Linkedin className="w-4 h-4" />, color: 'text-sky-600 bg-sky-50', label: 'LinkedIn' },
  outreach:        { icon: <Mail className="w-4 h-4" />, color: 'text-indigo-600 bg-indigo-50', label: 'Outreach' },
  grid_report:     { icon: <Grid3x3 className="w-4 h-4" />, color: 'text-cyan-600 bg-cyan-50', label: 'GRID Report' },
  mandate_phase:   { icon: <TrendingUp className="w-4 h-4" />, color: 'text-orange-600 bg-orange-50', label: 'Mandate Phase' },
  enrichment_advance: { icon: <Sparkles className="w-4 h-4" />, color: 'text-violet-600 bg-violet-50', label: 'Enrichment' },
};

const ACTION_STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'warning' | 'danger' | 'success' }> = {
  none:        { label: 'None', variant: 'default' },
  pending:     { label: 'Pending', variant: 'warning' },
  acknowledged:{ label: 'Acknowledged', variant: 'success' },
  resolved:    { label: 'Resolved', variant: 'success' },
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function SignalList({ contactId, limit = 50 }: SignalListProps) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSignals() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/signals?contact_id=${encodeURIComponent(contactId)}&limit=${limit}`);
        const data = await res.json();
        if (data.success) {
          setSignals(data.data || []);
        } else {
          setError(data.error || 'Failed to load signals');
        }
      } catch (e) {
        setError('Network error loading signals');
      } finally {
        setIsLoading(false);
      }
    }
    if (contactId) {
      fetchSignals();
    }
  }, [contactId, limit]);

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

  if (signals.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary text-sm">
        No signals yet for this contact.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {signals.map((signal) => {
        const config = SIGNAL_TYPE_CONFIG[signal.type] || SIGNAL_TYPE_CONFIG.comment;
        const actionStatus = ACTION_STATUS_CONFIG[signal.action_status] || ACTION_STATUS_CONFIG.none;

        return (
          <div
            key={signal.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-bg-secondary border border-bg-tertiary hover:border-border-focus transition-colors"
          >
            {/* Icon */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${config.color}`}>
              {config.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-text-secondary">{config.label}</span>
                <Badge variant={actionStatus.variant} className="text-xs">
                  {actionStatus.label}
                </Badge>
                {signal.action_required && (
                  <Badge variant="warning" className="text-xs">
                    Action Required
                  </Badge>
                )}
              </div>

              {signal.title && (
                <p className="mt-1 text-sm font-medium text-text-primary truncate">
                  {signal.title}
                </p>
              )}

              {signal.content && (
                <p className="mt-1 text-sm text-text-secondary line-clamp-2">
                  {signal.content}
                </p>
              )}

              {/* Metadata preview */}
              {signal.insights && Object.keys(signal.insights).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.entries(signal.insights).slice(0, 3).map(([key, value]) => (
                    <span key={key} className="text-xs px-2 py-0.5 rounded bg-bg-tertiary text-text-secondary">
                      {key}: {String(value).substring(0, 30)}
                    </span>
                  ))}
                </div>
              )}

              {/* Timestamp */}
              <div className="mt-2 flex items-center gap-1 text-xs text-text-secondary">
                <Clock className="w-3 h-3" />
                <span>{formatRelativeTime(signal.created_at)}</span>
                <span className="mx-1">·</span>
                <span>Source: {signal.source}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
