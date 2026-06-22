import React, { useState, useEffect } from 'react';
import { Bell, Calendar, ChevronRight, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getOutreachNextActions } from '@/services/supabaseApi';
import type { OutreachAttempt } from '@/types';
import { CHANNEL_LABELS } from '@/types';

interface NextActionItem {
  id: string;
  mandateId: string;
  candidateId: string;
  candidateName: string;
  mandateTitle: string;
  nextAction: string;
  nextActionDate: string;
  lastAttemptChannel: string | null;
  lastAttemptOutcome: string | null;
}

interface Props {
  daysAhead?: number;
  maxItems?: number;
  onCandidateClick?: (candidateId: string, mandateId: string) => void;
  onRefresh?: () => void;
}

function isoDateOnly(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getDateLabel(dateStr: string): { label: string; isOverdue: boolean; isToday: boolean; isThisWeek: boolean } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(dateStr);
  targetDate.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `Overdue by ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'day' : 'days'}`,
      isOverdue: true,
      isToday: false,
      isThisWeek: false,
    };
  }
  if (diffDays === 0) {
    return { label: 'Today', isOverdue: false, isToday: true, isThisWeek: true };
  }
  if (diffDays === 1) {
    return { label: 'Tomorrow', isOverdue: false, isToday: false, isThisWeek: true };
  }
  if (diffDays <= 7) {
    return { label: `In ${diffDays} days`, isOverdue: false, isToday: false, isThisWeek: true };
  }
  return {
    label: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    isOverdue: false,
    isToday: false,
    isThisWeek: false,
  };
}

export function NextActionReminders({ daysAhead = 7, maxItems = 20, onCandidateClick, onRefresh }: Props) {
  const [items, setItems] = useState<NextActionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const rawItems = await getOutreachNextActions(daysAhead + 30); // Fetch with extra buffer to show overdue too
      const mapped: NextActionItem[] = rawItems.map((item: any) => ({
        id: item.id,
        mandateId: item.mandate_id,
        candidateId: item.candidate_id,
        candidateName: item.candidate_name || 'Candidate',
        mandateTitle: item.mandate_title || 'Mandate',
        nextAction: item.next_action || '',
        nextActionDate: item.next_action_date || '',
        lastAttemptChannel: item.channel || null,
        lastAttemptOutcome: item.outcome || null,
      }));

      // Sort by date (overdue first, then upcoming)
      mapped.sort((a, b) => new Date(a.nextActionDate).getTime() - new Date(b.nextActionDate).getTime());

      setItems(mapped.slice(0, maxItems));
      setLoading(false);
    }
    load();
  }, [daysAhead, maxItems]);

  const overdueCount = items.filter(i => getDateLabel(i.nextActionDate).isOverdue).length;
  const todayCount = items.filter(i => getDateLabel(i.nextActionDate).isToday).length;
  const upcomingCount = items.filter(i => {
    const label = getDateLabel(i.nextActionDate);
    return label.isThisWeek && !label.isToday && !label.isOverdue;
  }).length;

  if (loading) {
    return (
      <div className="bg-bg-secondary border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <Bell className="w-4 h-4 text-accent" />
            Upcoming Follow-ups
          </h3>
        </div>
        <div className="py-6 text-center text-text-muted text-sm">Loading reminders...</div>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-4 gap-2 flex-wrap">
        <div>
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <Bell className="w-4 h-4 text-accent" />
            Upcoming Follow-ups
          </h3>
          <p className="text-xs text-text-muted mt-1">
            {items.length} follow-up {items.length === 1 ? 'action' : 'actions'} scheduled
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {overdueCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full font-medium">
              <AlertTriangle className="w-3 h-3" />
              {overdueCount} overdue
            </span>
          )}
          {todayCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-full font-medium">
              <Clock className="w-3 h-3" />
              {todayCount} today
            </span>
          )}
          {upcomingCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full font-medium">
              <Calendar className="w-3 h-3" />
              {upcomingCount} this week
            </span>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-text-primary">All caught up!</p>
          <p className="text-xs text-text-muted mt-1">
            No follow-up actions scheduled. Plan next steps in the candidate timeline.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const dateInfo = getDateLabel(item.nextActionDate);

            return (
              <button
                key={item.id}
                onClick={() => onCandidateClick?.(item.candidateId, item.mandateId)}
                className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-sm ${
                  dateInfo.isOverdue
                    ? 'border-red-200 bg-red-50 hover:bg-red-100'
                    : dateInfo.isToday
                    ? 'border-amber-200 bg-amber-50 hover:bg-amber-100'
                    : 'border-border bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    dateInfo.isOverdue
                      ? 'bg-red-100 text-red-600'
                      : dateInfo.isToday
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {dateInfo.isOverdue ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : dateInfo.isToday ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <Calendar className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {item.candidateName}
                        </p>
                        <p className="text-xs text-text-muted truncate mt-0.5">
                          {item.mandateTitle}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          dateInfo.isOverdue
                            ? 'bg-red-200 text-red-800'
                            : dateInfo.isToday
                            ? 'bg-amber-200 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {dateInfo.label}
                        </span>
                      </div>
                    </div>

                    {item.nextAction && (
                      <p className="text-sm text-text-primary mt-2 leading-relaxed">
                        <span className="text-text-muted text-xs font-medium">Action: </span>
                        {item.nextAction}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/30">
                      <span className="text-xs text-text-muted">
                        <span className="font-medium text-text-primary">Last:</span>{' '}
                        {item.lastAttemptChannel ? CHANNEL_LABELS[item.lastAttemptChannel as keyof typeof CHANNEL_LABELS] || item.lastAttemptChannel : '—'}
                      </span>
                      <ChevronRight className="w-3 h-3 text-text-muted ml-auto" />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
          <span>Showing {items.length} of up to {maxItems} actions</span>
          <button
            onClick={onRefresh}
            className="text-accent hover:text-accent-hover font-medium"
          >
            Open timeline →
          </button>
        </div>
      )}
    </div>
  );
}
