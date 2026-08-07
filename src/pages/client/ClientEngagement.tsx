/**
 * ClientEngagement — NPS, surveys, and engagement tracking page (Phase 8)
 *
 * Wraps the EngagementTracker component with page-level
 * layout and supplementary engagement sections.
 */
import React from 'react';
import {
  BarChart3,
  Clock,
  FileText,
  MessageSquare,
  Calendar,
  Users,
} from 'lucide-react';
import { EngagementTracker } from '@/components/client/EngagementTracker';
import { fetchEngagementMetrics, type EngagementMetrics } from '@/services/clientService';

export function ClientEngagement() {
  const [metrics, setMetrics] = React.useState<EngagementMetrics | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const m = await fetchEngagementMetrics();
      if (!cancelled) setMetrics(m);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Engagement</h1>
        <p className="text-sm text-text-muted">
          Track your engagement metrics and share feedback to help us improve
        </p>
      </div>

      {/* Engagement Tracker (NPS + Metrics + Survey) */}
      <EngagementTracker />

      {/* Additional sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Response time */}
        <div className="bg-white border border-bg-tertiary p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4" style={{ color: '#C108AB' }} />
            <h3 className="text-sm font-semibold text-text-primary">Response Time</h3>
          </div>
          <div className="text-3xl font-bold" style={{ color: '#C108AB' }}>
            {metrics?.average_response_time_hours != null
              ? `${metrics.average_response_time_hours.toFixed(1)}h`
              : '—'}
          </div>
          <p className="text-xs text-text-muted mt-1">Average time to respond to your queries</p>
          <div className="mt-3 w-full h-2 bg-bg-secondary">
            <div
              className="h-full transition-all"
              style={{
                width: metrics?.average_response_time_hours != null
                  ? `${Math.min(metrics.average_response_time_hours * 2, 100)}%`
                  : '0%',
                background: '#C108AB',
              }}
            />
          </div>
        </div>

        {/* Login activity */}
        <div className="bg-white border border-bg-tertiary p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4" style={{ color: '#C108AB' }} />
            <h3 className="text-sm font-semibold text-text-primary">Login Activity</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <div className="text-2xl font-bold text-text-primary">{metrics?.total_logins ?? 0}</div>
              <div className="text-xs text-text-muted">Total logins</div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: '#C108AB' }}>
                {metrics?.login_streak_days ?? 0}d
              </div>
              <div className="text-xs text-text-muted">Current streak</div>
            </div>
          </div>
          {metrics?.last_login_at && (
            <div className="mt-3 text-xs text-text-muted">
              Last login: {new Date(metrics.last_login_at).toLocaleString()}
            </div>
          )}
        </div>

        {/* Documents viewed */}
        <div className="bg-white border border-bg-tertiary p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4" style={{ color: '#C108AB' }} />
            <h3 className="text-sm font-semibold text-text-primary">Documents & Feedback</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <div className="text-2xl font-bold text-text-primary">{metrics?.documents_viewed ?? 0}</div>
              <div className="text-xs text-text-muted">Documents viewed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{metrics?.feedback_submitted ?? 0}</div>
              <div className="text-xs text-text-muted">Feedback submitted</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="w-full h-2 bg-bg-secondary">
                <div
                  className="h-full"
                  style={{
                    width: `${Math.min((metrics?.documents_viewed ?? 0) * 10, 100)}%`,
                    background: '#C108AB',
                  }}
                />
              </div>
              <div className="text-[10px] text-text-muted mt-1">Documents</div>
            </div>
            <div className="flex-1">
              <div className="w-full h-2 bg-bg-secondary">
                <div
                  className="h-full"
                  style={{
                    width: `${Math.min((metrics?.feedback_submitted ?? 0) * 10, 100)}%`,
                    background: '#10B981',
                  }}
                />
              </div>
              <div className="text-[10px] text-text-muted mt-1">Feedback</div>
            </div>
          </div>
        </div>

        {/* Engagement level card */}
        <div className="bg-white border border-bg-tertiary p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4" style={{ color: '#C108AB' }} />
            <h3 className="text-sm font-semibold text-text-primary">Engagement Breakdown</h3>
          </div>
          <div className="space-y-3 mt-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-muted">Document Views</span>
                <span className="font-medium text-text-primary">{metrics?.documents_viewed ?? 0}</span>
              </div>
              <div className="w-full h-1.5 bg-bg-secondary">
                <div
                  className="h-full"
                  style={{
                    width: `${Math.min((metrics?.documents_viewed ?? 0) * 10, 100)}%`,
                    background: '#C108AB',
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-muted">Feedback</span>
                <span className="font-medium text-text-primary">{metrics?.feedback_submitted ?? 0}</span>
              </div>
              <div className="w-full h-1.5 bg-bg-secondary">
                <div
                  className="h-full"
                  style={{
                    width: `${Math.min((metrics?.feedback_submitted ?? 0) * 10, 100)}%`,
                    background: '#C108AB',
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-muted">Login Streak</span>
                <span className="font-medium text-text-primary">{metrics?.login_streak_days ?? 0}d</span>
              </div>
              <div className="w-full h-1.5 bg-bg-secondary">
                <div
                  className="h-full"
                  style={{
                    width: `${Math.min((metrics?.login_streak_days ?? 0) * 5, 100)}%`,
                    background: '#C108AB',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Survey prompt */}
      <div className="bg-white border border-bg-tertiary p-5">
        <div className="flex items-start gap-4">
          <div
            className="w-10 h-10 flex items-center justify-center text-white"
            style={{ background: '#C108AB' }}
          >
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-text-primary">Share Your Experience</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Your feedback shapes how we improve our service. Every response is read by our leadership team.
            </p>
            <button
              className="mt-3 px-4 py-2 text-xs font-medium text-white"
              style={{ background: '#C108AB' }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Take the NPS Survey →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientEngagement;