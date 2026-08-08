/**
 * ClientDashboard — Client portal home page (Phase 8)
 *
 * Shows mandate overview, pipeline health, activity feed,
 * NPS score, and quick-action shortcuts.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  TrendingUp,
  AlertTriangle,
  Clock,
  Bell,
  ArrowRight,
  GitBranch,
  ClipboardCheck,
  BarChart3,
  Users,
  Activity,
} from 'lucide-react';
import {
  fetchClientMandates,
  fetchNotifications,
  HEALTH_STYLES,
  type ClientMandate,
  type Notification,
} from '@/services/clientService';

export function ClientDashboard() {
  const navigate = useNavigate();
  const [mandates, setMandates] = React.useState<ClientMandate[]>([]);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const [m, n] = await Promise.all([
        fetchClientMandates(),
        fetchNotifications(),
      ]);
      if (!cancelled) {
        setMandates(m);
        setNotifications(n.notifications.slice(0, 5));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-text-muted text-sm">
        <Activity className="w-5 h-5 animate-pulse mr-2" />
        Loading dashboard...
      </div>
    );
  }

  const healthyCount = mandates.filter(m => m.health === 'on_track').length;
  const atRiskCount = mandates.filter(m => m.health === 'at_risk' || m.health === 'behind').length;
  const totalCandidates = mandates.reduce(
    (sum, m) => sum + Object.values(m.pipeline_summary || {}).reduce((s, v) => s + (v as number), 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Client Dashboard</h1>
        <p className="text-sm text-text-muted">Overview of your mandates and candidate pipeline</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-bg-tertiary p-4">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <Briefcase className="w-4 h-4" />
            <span className="text-xs font-medium">Active Mandates</span>
          </div>
          <div className="text-2xl font-bold" style={{ color: '#C108AB' }}>{mandates.length}</div>
        </div>
        <div className="bg-white border border-bg-tertiary p-4">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium">Total Candidates</span>
          </div>
          <div className="text-2xl font-bold text-text-primary">{totalCandidates}</div>
        </div>
        <div className="bg-white border border-bg-tertiary p-4">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <TrendingUp className="w-4 h-4 text-teal-500" />
            <span className="text-xs font-medium">On Track</span>
          </div>
          <div className="text-2xl font-bold text-teal-600">{healthyCount}</div>
        </div>
        <div className="bg-white border border-bg-tertiary p-4">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium">At Risk</span>
          </div>
          <div className="text-2xl font-bold text-amber-600">{atRiskCount}</div>
        </div>
      </div>

      {/* Mandates grid + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mandates list */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary">Active Mandates</h2>
            <button
              onClick={() => navigate('/client-portal/pipeline')}
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: '#C108AB' }}
            >
              View Pipeline
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {mandates.length === 0 ? (
            <div className="bg-white border border-bg-tertiary p-8 text-center">
              <Briefcase className="w-8 h-8 mx-auto text-text-muted mb-3" />
              <p className="text-sm text-text-muted">No mandates yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mandates.map(m => (
                <div
                  key={m.id}
                  className="bg-white border border-bg-tertiary p-4 hover:border-[#C108AB] transition-colors cursor-pointer"
                  onClick={() => navigate(`/client-portal/pipeline?mandate=${m.id}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-text-primary truncate">{m.title}</h3>
                        <span className={HEALTH_STYLES[m.health]}>{m.health.replace('_', ' ')}</span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        Lead: {m.lead_consultant_name} · {m.days_since_kickoff}d since kickoff
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-text-muted shrink-0" />
                  </div>

                  {/* Pipeline mini */}
                  <div className="flex items-center gap-1 mt-3 flex-wrap">
                    {Object.entries(m.pipeline_summary || {}).map(([stage, count]) => (
                      <span
                        key={stage}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-bg-secondary text-text-muted"
                      >
                        {stage.replace('_', ' ')}: {count as number}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </h2>
          </div>

          <div className="bg-white border border-bg-tertiary">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-text-muted text-sm">
                <Bell className="w-6 h-6 mx-auto mb-2 opacity-50" />
                No notifications
              </div>
            ) : (
              <div className="divide-y divide-bg-tertiary">
                {notifications.map(n => (
                  <div key={n.id} className="p-3 hover:bg-bg-secondary">
                    <div className="text-xs font-medium text-text-primary">{n.title}</div>
                    <div className="text-xs text-text-muted mt-0.5 line-clamp-2">{n.message}</div>
                    <div className="text-[10px] text-text-muted mt-1">
                      {new Date(n.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white border border-bg-tertiary">
        <div className="px-4 py-3 border-b border-bg-tertiary">
          <h2 className="text-sm font-semibold text-text-primary">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-bg-tertiary">
          <button
            onClick={() => navigate('/client-portal/pipeline')}
            className="p-4 text-left hover:bg-bg-secondary transition-colors"
          >
            <GitBranch className="w-5 h-5 mb-2" style={{ color: '#C108AB' }} />
            <div className="text-sm font-medium text-text-primary">Pipeline</div>
            <div className="text-xs text-text-muted">View candidate pipeline</div>
          </button>
          <button
            onClick={() => navigate('/client-portal/reviews')}
            className="p-4 text-left hover:bg-bg-secondary transition-colors"
          >
            <ClipboardCheck className="w-5 h-5 mb-2" style={{ color: '#C108AB' }} />
            <div className="text-sm font-medium text-text-primary">Reviews</div>
            <div className="text-xs text-text-muted">Review and score candidates</div>
          </button>
          <button
            onClick={() => navigate('/client-portal/workflows')}
            className="p-4 text-left hover:bg-bg-secondary transition-colors"
          >
            <Activity className="w-5 h-5 mb-2" style={{ color: '#C108AB' }} />
            <div className="text-sm font-medium text-text-primary">Workflows</div>
            <div className="text-xs text-text-muted">Build approval chains</div>
          </button>
          <button
            onClick={() => navigate('/client-portal/engagement')}
            className="p-4 text-left hover:bg-bg-secondary transition-colors"
          >
            <BarChart3 className="w-5 h-5 mb-2" style={{ color: '#C108AB' }} />
            <div className="text-sm font-medium text-text-primary">Engagement</div>
            <div className="text-xs text-text-muted">NPS and feedback</div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClientDashboard;