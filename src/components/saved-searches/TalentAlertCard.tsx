// Phase 2.7: Talent Alert Card Component
'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellDot,
  User,
  AlertCircle,
  RefreshCw,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import type { TalentAlert } from '@/lib/saved-searches/engine';

interface TalentAlertCardProps {
  userId: string;
  onViewCandidate?: (candidateId: string) => void;
}

const ALERT_TYPE_CONFIG = {
  new_match: { label: 'New Candidate', icon: BellDot, color: 'text-green-500', bg: 'bg-green-100' },
  profile_updated: { label: 'Profile Updated', icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-100' },
  stage_changed: { label: 'Stage Changed', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-100' },
};

export function TalentAlertCard({ userId, onViewCandidate }: TalentAlertCardProps) {
  const [alerts, setAlerts] = useState<TalentAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unviewedCount, setUnviewedCount] = useState(0);

  useEffect(() => {
    fetchAlerts();
  }, [userId]);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/talent-alerts?user_id=${userId}`);
      const result = await response.json();

      if (result.success) {
        setAlerts(result.data);
        setUnviewedCount(result.data.filter((a: TalentAlert) => !a.viewed_at).length);
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsViewed = async (alertId: string) => {
    try {
      await fetch(`/api/x/talent-alerts/${alertId}`, {
        method: 'PUT',
      });
      fetchAlerts();
    } catch (err) {
      console.error('Failed to mark alert as viewed:', err);
    }
  };

  const handleMarkAllAsViewed = async () => {
    try {
      await fetch(`/api/x/talent-alerts/mark-all?user_id=${userId}`, {
        method: 'PUT',
      });
      fetchAlerts();
    } catch (err) {
      console.error('Failed to mark all alerts as viewed:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const formatMatchScore = (score: number) => {
    return Math.round(score * 100);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-text-muted" />
          <h3 className="font-semibold text-text-primary">Talent Alerts</h3>
          {unviewedCount > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium">
              {unviewedCount}
            </span>
          )}
        </div>
        {unviewedCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsViewed}>
            Mark All Read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
          <p className="text-text-muted mt-4">No new talent alerts</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {alerts.slice(0, 10).map(alert => {
            const config = ALERT_TYPE_CONFIG[alert.alert_type];
            const AlertIcon = config.icon;

            return (
              <div
                key={alert.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  alert.viewed_at ? 'bg-bg-alt' : 'bg-blue-50'
                } hover:bg-bg-base`}
                onClick={() => onViewCandidate?.(alert.candidate_id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                    <AlertIcon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                      <span className="text-xs text-text-muted">{formatDate(alert.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-text-primary">
                        Candidate {alert.candidate_id.slice(0, 8)}
                      </span>
                      <span className="px-2 py-0.5 bg-bg-base rounded text-xs">
                        Match: {formatMatchScore(alert.match_score)}%
                      </span>
                    </div>
                  </div>
                  {!alert.viewed_at && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsViewed(alert.id);
                      }}
                      className="p-1 hover:bg-bg-base rounded"
                    >
                      <Eye className="w-4 h-4 text-text-muted" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {alerts.length > 10 && (
            <div className="text-center py-2">
              <span className="text-sm text-text-muted">
                +{alerts.length - 10} more alerts
              </span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default TalentAlertCard;