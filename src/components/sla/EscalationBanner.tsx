// Phase 3.12: Escalation Banner Component
'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, XCircle, X, Bell, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui';

interface SLAEscalation {
  id: string;
  mandate_id: string;
  escalation_type: 'warning' | 'critical' | 'breach';
  milestone_stage: string;
  message: string;
  notified_roles: string[];
  acknowledged_at: string | null;
  created_at: string;
}

interface EscalationBannerProps {
  orgId: string;
  onViewEscalations?: () => void;
}

const ESCALATION_CONFIG = {
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    label: 'Warning',
    priority: 1,
  },
  critical: {
    icon: AlertCircle,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    label: 'Critical',
    priority: 2,
  },
  breach: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'SLA Breach',
    priority: 3,
  },
};

export function EscalationBanner({ orgId, onViewEscalations }: EscalationBannerProps) {
  const [escalations, setEscalations] = useState<SLAEscalation[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEscalations = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/x/sla/escalations?org_id=${orgId}&acknowledged=true`);
        const result = await response.json();

        if (result.success) {
          setEscalations(result.data);
        }
      } catch (err) {
        console.error('Failed to fetch escalations:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEscalations();
  }, [orgId]);

  const activeEscalations = escalations.filter(e => !e.acknowledged_at);
  const hasEscalations = activeEscalations.length > 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleAcknowledge = async (escalationId: string) => {
    try {
      await fetch(`/api/x/sla/escalations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: escalationId }),
      });

      setEscalations(escalations.map(e =>
        e.id === escalationId ? { ...e, acknowledged_at: new Date().toISOString() } : e
      ));
    } catch (err) {
      console.error('Failed to acknowledge escalation:', err);
    }
  };

  // Get highest priority escalation type for banner styling
  const highestPriority = activeEscalations.reduce((max, e) => {
    const priority = ESCALATION_CONFIG[e.escalation_type].priority;
    return priority > max ? priority : max;
  }, 0);

  const bannerConfig = highestPriority === 3 ? ESCALATION_CONFIG.breach :
    highestPriority === 2 ? ESCALATION_CONFIG.critical :
    ESCALATION_CONFIG.warning;

  // Don't render if no active escalations
  if (!hasEscalations && !isLoading) {
    return null;
  }

  return (
    <div className={`${bannerConfig.bg} border-l-4 ${bannerConfig.border} rounded-r-lg overflow-hidden`}>
      {/* Banner Header */}
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {activeEscalations.length > 0 ? (
                <AlertTriangle className={`w-5 h-5 ${bannerConfig.color}`} />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
              <div>
                <span className={`font-medium ${bannerConfig.color}`}>
                  {activeEscalations.length > 0
                    ? `${activeEscalations.length} Active Escalation${activeEscalations.length > 1 ? 's' : ''}`
                    : 'All Escalations Resolved'}
                </span>
                <span className="text-sm text-text-muted ml-2">
                  Click to view details
                </span>
              </div>
            </>
          )}
        </div>
        {hasEscalations && onViewEscalations && (
          <Button variant="outline" size="sm" onClick={(e) => {
            e.stopPropagation();
            onViewEscalations();
          }}>
            View All
          </Button>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && activeEscalations.length > 0 && (
        <div className="px-4 pb-4 space-y-3 border-t border-current/20">
          {activeEscalations.map(escalation => {
            const config = ESCALATION_CONFIG[escalation.escalation_type];
            const Icon = config.icon;

            return (
              <div
                key={escalation.id}
                className={`p-3 rounded-lg ${config.bg}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${config.color}`}>{config.label}</span>
                        <span className="text-xs text-text-muted">{formatDate(escalation.created_at)}</span>
                      </div>
                      <p className="text-sm text-text-primary mt-1">{escalation.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-text-muted">Mandate: {escalation.mandate_id.slice(0, 8)}</span>
                        <span className="text-xs text-text-muted">|</span>
                        <span className="text-xs text-text-muted">Stage: {escalation.milestone_stage}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAcknowledge(escalation.id)}
                    className="flex-shrink-0"
                  >
                    Acknowledge
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default EscalationBanner;