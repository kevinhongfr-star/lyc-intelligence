/**
 * AnalyticsDashboard — Platform-wide analytics, usage stats, health metrics.
 */
import React, { useState, useEffect } from 'react';
import {
  Users,
  Activity,
  BarChart3,
  Clock,
  TrendingUp,
  TrendingDown,
  Server,
  Database,
  HardDrive,
  Gauge,
  Loader2,
} from 'lucide-react';
import { adminService } from '@/services/adminService';

const AnalyticsDashboard: React.FC = () => {
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [mandateHealth, setMandateHealth] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [platformData, usageData, healthData, mandateData] = await Promise.all([
        adminService.analytics.platform(),
        adminService.analytics.usage(30),
        adminService.analytics.health(),
        adminService.analytics.mandateHealth(),
      ]);
      setPlatformStats(platformData.stats);
      setUsage(usageData.metrics);
      setHealth(healthData.health);
      setMandateHealth(mandateData.items || []);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-text-muted">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold">Platform Analytics</h1>
        <p className="text-sm text-text-muted mt-1">
          Real-time platform-wide usage, health, and performance metrics.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Total Users"
          value={platformStats?.total_users || 0}
          icon={<Users className="w-5 h-5" />}
          delta={+12}
          color="text-fuchsia"
        />
        <KpiCard
          label="Active (24h)"
          value={platformStats?.active_users_24h || 0}
          icon={<Activity className="w-5 h-5" />}
          delta={+8}
          color="text-green-600"
        />
        <KpiCard
          label="Active (7d)"
          value={platformStats?.active_users_7d || 0}
          icon={<BarChart3 className="w-5 h-5" />}
          delta={+3}
          color="text-blue-600"
        />
        <KpiCard
          label="Avg Time to Fill"
          value={`${platformStats?.avg_time_to_fill_days || 0}d`}
          icon={<Clock className="w-5 h-5" />}
          delta={-5}
          color="text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-border p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-fuchsia" />
            Usage Metrics (30d)
          </h3>
          <div className="space-y-3">
            <UsageBar label="New Users" value={usage?.new_users || 0} max={Math.max(usage?.new_users || 0, 100)} />
            <UsageBar label="Active Sessions" value={usage?.active_sessions || 0} max={Math.max(usage?.active_sessions || 0, 100)} />
            <UsageBar label="Searches Performed" value={usage?.searches_performed || 0} max={Math.max(usage?.searches_performed || 0, 100)} />
            <UsageBar label="Stage Changes" value={usage?.stage_changes || 0} max={Math.max(usage?.stage_changes || 0, 100)} />
            <UsageBar label="Interviews Scheduled" value={usage?.interviews_scheduled || 0} max={Math.max(usage?.interviews_scheduled || 0, 100)} />
          </div>
        </div>

        <div className="bg-white border border-border p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Server className="w-4 h-4 text-fuchsia" />
            System Health
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <HealthMetric
              label="API Latency (p50)"
              value={`${health?.api_latency_p50_ms || 0}ms`}
              icon={<Gauge className="w-4 h-4" />}
              good={health?.api_latency_p50_ms < 200}
            />
            <HealthMetric
              label="API Latency (p95)"
              value={`${health?.api_latency_p95_ms || 0}ms`}
              icon={<Gauge className="w-4 h-4" />}
              good={health?.api_latency_p95_ms < 500}
            />
            <HealthMetric
              label="Error Rate"
              value={`${health?.error_rate_percent || 0}%`}
              icon={<Activity className="w-4 h-4" />}
              good={health?.error_rate_percent < 1}
            />
            <HealthMetric
              label="Uptime"
              value={`${health?.uptime_percent || 0}%`}
              icon={<Server className="w-4 h-4" />}
              good={health?.uptime_percent > 99}
            />
            <HealthMetric
              label="Cache Hit Rate"
              value={`${health?.cache_hit_rate_percent || 0}%`}
              icon={<Database className="w-4 h-4" />}
              good={health?.cache_hit_rate_percent > 90}
            />
            <HealthMetric
              label="Storage"
              value={`${health?.storage_used_gb || 0} / ${health?.storage_limit_gb || 0}GB`}
              icon={<HardDrive className="w-4 h-4" />}
              good={(health?.storage_used_gb || 0) < (health?.storage_limit_gb || 1) * 0.8}
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-border p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-fuchsia" />
          Mandate Health Overview
        </h3>
        {mandateHealth.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8">
            No active mandates to display.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {mandateHealth.slice(0, 12).map(m => (
              <div key={m.mandate_id} className="border border-border p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium truncate">{m.title}</p>
                  <span
                    className={`w-3 h-3 ${
                      m.health_status === 'green' ? 'bg-green-500' :
                      m.health_status === 'amber' ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>Health: {m.health_score}</span>
                  <span>{m.days_since_last_activity}d since activity</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const KpiCard: React.FC<{
  label: string;
  value: any;
  icon: React.ReactNode;
  delta: number;
  color: string;
}> = ({ label, value, icon, delta, color }) => (
  <div className="bg-white border border-border p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-text-muted uppercase tracking-wider">{label}</span>
      <span className={color}>{icon}</span>
    </div>
    <p className="text-2xl font-serif font-semibold">{value}</p>
    <div className="flex items-center gap-1 mt-1 text-xs">
      {delta >= 0 ? (
        <TrendingUp className="w-3 h-3 text-green-600" />
      ) : (
        <TrendingDown className="w-3 h-3 text-red-600" />
      )}
      <span className={delta >= 0 ? 'text-green-600' : 'text-red-600'}>
        {delta >= 0 ? '+' : ''}{delta}% vs last period
      </span>
    </div>
  </div>
);

const UsageBar: React.FC<{ label: string; value: number; max: number }> = ({ label, value, max }) => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-text-secondary">{label}</span>
        <span className="font-medium">{value.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-bg">
        <div className="h-full bg-fuchsia transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const HealthMetric: React.FC<{ label: string; value: string; icon: React.ReactNode; good: boolean }> = ({
  label, value, icon, good,
}) => (
  <div className="flex items-center gap-2 p-2 bg-bg">
    <span className={good ? 'text-green-600' : 'text-red-600'}>{icon}</span>
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  </div>
);

export default AnalyticsDashboard;
