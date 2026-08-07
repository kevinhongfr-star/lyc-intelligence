/**
 * AdminDashboard — Main admin hub with quick stats, recent activity, and navigation.
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  BarChart3,
  CreditCard,
  Flag,
  FileText,
  Settings,
  Shield,
  Activity,
  TrendingUp,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { adminService } from '@/services/adminService';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [auditStats, setAuditStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [platformData, auditData] = await Promise.all([
        adminService.analytics.platform(),
        adminService.audit.stats(),
      ]);
      setStats(platformData.stats);
      setAuditStats(auditData.stats);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-text-muted">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading admin dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-text-muted mt-1">
          Platform overview, quick actions, and recent admin activity.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <OverviewCard
          label="Total Users"
          value={stats?.total_users || 0}
          icon={<Users className="w-5 h-5" />}
          color="text-fuchsia"
        />
        <OverviewCard
          label="Active (7d)"
          value={stats?.active_users_7d || 0}
          icon={<Activity className="w-5 h-5" />}
          color="text-green-600"
        />
        <OverviewCard
          label="Organizations"
          value={stats?.total_organizations || 0}
          icon={<Building2 className="w-5 h-5" />}
          color="text-blue-600"
        />
        <OverviewCard
          label="Actions Today"
          value={auditStats?.actions_today || 0}
          icon={<TrendingUp className="w-5 h-5" />}
          color="text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-border p-5">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickLink to="/admin/users" label="Manage Users" icon={<Users className="w-4 h-4" />} />
            <QuickLink to="/admin/organizations" label="Organizations" icon={<Building2 className="w-4 h-4" />} />
            <QuickLink to="/admin/moderation" label="Moderation Queue" icon={<Flag className="w-4 h-4" />} />
            <QuickLink to="/admin/analytics" label="Analytics" icon={<BarChart3 className="w-4 h-4" />} />
            <QuickLink to="/admin/billing" label="Billing" icon={<CreditCard className="w-4 h-4" />} />
            <QuickLink to="/admin/audit" label="Audit Log" icon={<FileText className="w-4 h-4" />} />
            <QuickLink to="/admin/config" label="System Config" icon={<Settings className="w-4 h-4" />} />
            <QuickLink to="/admin/rbac" label="Roles & Perms" icon={<Shield className="w-4 h-4" />} />
          </div>
        </div>

        <div className="bg-white border border-border p-5">
          <h3 className="font-semibold mb-4">Platform Health</h3>
          <div className="space-y-3">
            <HealthRow
              label="API Latency (p50)"
              value={`${stats?.api_latency_p50_ms || 0}ms`}
              good={(stats?.api_latency_p50_ms || 0) < 200}
            />
            <HealthRow
              label="Error Rate"
              value={`${stats?.error_rate_percent || 0}%`}
              good={(stats?.error_rate_percent || 0) < 1}
            />
            <HealthRow
              label="Uptime"
              value={`${stats?.uptime_percent || 0}%`}
              good={(stats?.uptime_percent || 0) > 99}
            />
            <HealthRow
              label="Active Sessions (24h)"
              value={`${stats?.active_sessions_24h || 0}`}
              good={true}
            />
            <HealthRow
              label="Avg Time to Fill"
              value={`${stats?.avg_time_to_fill_days || 0} days`}
              good={(stats?.avg_time_to_fill_days || 999) < 60}
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-border p-5">
        <h3 className="font-semibold mb-4">Recent Admin Activity</h3>
        <div className="text-sm text-text-muted text-center py-8">
          View the full <Link to="/admin/audit" className="text-fuchsia hover:underline">audit log</Link> for complete activity history.
        </div>
      </div>
    </div>
  );
};

const OverviewCard: React.FC<{
  label: string;
  value: any;
  icon: React.ReactNode;
  color: string;
}> = ({ label, value, icon, color }) => (
  <div className="bg-white border border-border p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-text-muted uppercase tracking-wider">{label}</span>
      <span className={color}>{icon}</span>
    </div>
    <p className="text-2xl font-serif font-semibold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
  </div>
);

const QuickLink: React.FC<{ to: string; label: string; icon: React.ReactNode }> = ({ to, label, icon }) => (
  <Link
    to={to}
    className="flex items-center gap-2 p-3 bg-bg hover:bg-bg-warm border border-border transition-colors group"
  >
    <span className="text-fuchsia">{icon}</span>
    <span className="text-sm font-medium flex-1">{label}</span>
    <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-fuchsia" />
  </Link>
);

const HealthRow: React.FC<{ label: string; value: string; good: boolean }> = ({ label, value, good }) => (
  <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
    <span className="text-sm text-text-secondary">{label}</span>
    <span className={`text-sm font-medium ${good ? 'text-green-600' : 'text-red-600'}`}>{value}</span>
  </div>
);

export default AdminDashboard;
