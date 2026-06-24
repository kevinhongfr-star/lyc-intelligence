// Phase 2.8: BD Deferred Alerts Component
'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  ChevronRight,
  Calendar,
  Bell,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { BDOpportunity } from '@/types/bd';
import { cn } from '@/lib/utils';

interface DeferredAlertsProps {
  orgId: string;
  onSelectOpportunity?: (opp: BDOpportunity) => void;
  includeUpcoming?: boolean;
  upcomingDays?: number;
}

interface PastDueOpportunity extends BDOpportunity {
  days_overdue: number;
}

export function DeferredAlerts({
  orgId,
  onSelectOpportunity,
  includeUpcoming = true,
  upcomingDays = 7,
}: DeferredAlertsProps) {
  const [pastDue, setPastDue] = useState<PastDueOpportunity[]>([]);
  const [upcoming, setUpcoming] = useState<BDOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeferred();
  }, [orgId, includeUpcoming, upcomingDays]);

  const fetchDeferred = async () => {
    try {
      let url = `/api/x/bd/deferred-check?org_id=${orgId}`;
      if (includeUpcoming) {
        url += `&include_upcoming=true&upcoming_days=${upcomingDays}`;
      }

      const response = await fetch(url);
      const result = await response.json();
      if (result.success) {
        setPastDue(result.data.past_due || []);
        setUpcoming(result.data.upcoming || []);
      }
    } catch (err) {
      console.error('Failed to fetch deferred opportunities:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-text-muted">Loading...</div>
      </Card>
    );
  }

  const hasAlerts = pastDue.length > 0 || upcoming.length > 0;

  return (
    <Card className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-accent" />
          <h3 className="font-medium text-text-primary">Deferred Follow-ups</h3>
        </div>
        {pastDue.length > 0 && (
          <Badge variant="danger">
            {pastDue.length} past due
          </Badge>
        )}
      </div>

      {!hasAlerts ? (
        <div className="text-center py-6 text-text-muted">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No deferred opportunities</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Past Due */}
          {pastDue.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-600">
                  Past Due ({pastDue.length})
                </span>
              </div>
              <div className="space-y-2">
                {pastDue.slice(0, 5).map((opp) => (
                  <button
                    key={opp.id}
                    onClick={() => onSelectOpportunity?.(opp)}
                    className={cn(
                      'w-full p-3 rounded-lg text-left',
                      'bg-red-50 border border-red-100',
                      'hover:bg-red-100 transition-colors',
                      'flex items-center justify-between'
                    )}
                  >
                    <div>
                      <div className="font-medium text-sm text-text-primary">
                        {opp.company_name}
                      </div>
                      <div className="text-xs text-text-muted">
                        {opp.primary_contact_name}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="danger">
                        {opp.days_overdue}d overdue
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-text-muted" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-text-muted">
                  Coming Up ({upcoming.length})
                </span>
              </div>
              <div className="space-y-2">
                {upcoming.slice(0, 3).map((opp) => (
                  <button
                    key={opp.id}
                    onClick={() => onSelectOpportunity?.(opp)}
                    className={cn(
                      'w-full p-3 rounded-lg text-left',
                      'bg-bg-secondary border border-bg-hover',
                      'hover:bg-bg-hover transition-colors',
                      'flex items-center justify-between'
                    )}
                  >
                    <div>
                      <div className="font-medium text-sm text-text-primary">
                        {opp.company_name}
                      </div>
                      <div className="text-xs text-text-muted">
                        {opp.primary_contact_name}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">
                        {opp.deferred_until ? formatDate(opp.deferred_until) : '—'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-text-muted" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* View All */}
          {(pastDue.length > 5 || upcoming.length > 3) && (
            <Button variant="outline" className="w-full text-sm">
              View All Deferred
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

export default DeferredAlerts;
