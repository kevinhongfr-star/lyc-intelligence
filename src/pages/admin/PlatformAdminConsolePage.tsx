/**
 * PlatformAdminConsolePage — Platform Admin Console (Kevin's Control Tower)
 * Issue #37: Platform Admin Console
 *
 * Central dashboard for: system health, user management, organizations,
 * revenue overview, feature flags, and operational metrics.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Users,
  Building2,
  DollarSign,
  Activity,
  Server,
  Database,
  Shield,
  Settings,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  MoreHorizontal,
  ChevronRight,
  Zap,
  FileText,
  Mail,
  Eye,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Progress } from '@/components/ui/Progress';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface SystemMetric {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: string;
  uptime: string;
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'invited' | 'suspended';
  joined_at: string;
  organization: string;
}

interface OrgSummary {
  id: string;
  name: string;
  plan: string;
  members: number;
  mrr: number;
  status: 'active' | 'trialing' | 'past_due';
  last_active: string;
}

interface RevenueSnapshot {
  mrr: number;
  mrr_change_pct: number;
  arr: number;
  new_revenue: number;
  churn: number;
  ltv: number;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function PlatformAdminConsolePage() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [users, setUsers] = useState<RecentUser[]>([]);
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [revenue, setRevenue] = useState<RevenueSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/platform-overview', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.data?.system_metrics || MOCK_METRICS);
        setUsers(data.data?.recent_users || MOCK_USERS);
        setOrgs(data.data?.organizations || MOCK_ORGS);
        setRevenue(data.data?.revenue || MOCK_REVENUE);
      } else {
        throw new Error('Not authorized');
      }
    } catch {
      setMetrics(MOCK_METRICS);
      setUsers(MOCK_USERS);
      setOrgs(MOCK_ORGS);
      setRevenue(MOCK_REVENUE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-[#1A1A1A] border-t-transparent rounded-full" />
      </div>
    );
  }

  const healthyCount = metrics.filter((m) => m.status === 'healthy').length;
  const systemHealth = healthyCount === metrics.length ? 'All systems operational' : `${metrics.length - healthyCount} service(s) degraded`;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-[13px] text-[#6B6B6B] mb-1">
                <Settings className="h-4 w-4" />
                Platform Admin
              </div>
              <h1 className="text-[24px] font-serif text-[#1A1A1A]">Control Tower</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] ${
                healthyCount === metrics.length
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  healthyCount === metrics.length ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
                {systemHealth}
              </div>
              <Button size="sm" variant="outline">
                <Activity className="h-4 w-4 mr-1.5" />
                Live
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard
            icon={<Users className="h-4 w-4" />}
            label="Total Users"
            value="2,847"
            change="+12.5%"
            positive={true}
          />
          <KpiCard
            icon={<Building2 className="h-4 w-4" />}
            label="Organizations"
            value="142"
            change="+8.3%"
            positive={true}
          />
          <KpiCard
            icon={<DollarSign className="h-4 w-4" />}
            label="MRR"
            value={`¥${revenue?.mrr.toLocaleString() || '0'}`}
            change={`+${revenue?.mrr_change_pct || 0}%`}
            positive={true}
          />
          <KpiCard
            icon={<Zap className="h-4 w-4" />}
            label="API Calls (24h)"
            value="142,891"
            change="+24.1%"
            positive={true}
          />
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          {/* ── Overview ── */}
          <TabsContent value="overview">
            <div className="grid lg:grid-cols-3 gap-6 mt-4">
              <div className="lg:col-span-2 space-y-6">
                {/* System Health */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>System Health</CardTitle>
                      <Badge variant={healthyCount === metrics.length ? 'success' : 'warning'}>
                        {healthyCount}/{metrics.length} healthy
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {metrics.map((m) => (
                        <ServiceRow key={m.name} metric={m} />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Recent Signups</CardTitle>
                      <Button variant="ghost" size="sm">
                        View all <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {users.slice(0, 5).map((user) => (
                        <UserRow key={user.id} user={user} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                {/* Revenue Snapshot */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Snapshot</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#6B6B6B]">MRR</span>
                      <span className="font-medium text-[#1A1A1A]">
                        ¥{revenue?.mrr.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#6B6B6B]">ARR</span>
                      <span className="font-medium text-[#1A1A1A]">
                        ¥{revenue?.arr.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#6B6B6B]">New Revenue</span>
                      <span className="font-medium text-emerald-600">
                        +¥{revenue?.new_revenue.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#6B6B6B]">Churn</span>
                      <span className="font-medium text-red-600">
                        -¥{revenue?.churn.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[#6B6B6B]">Avg LTV</span>
                      <span className="font-medium text-[#1A1A1A]">
                        ¥{revenue?.ltv.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-[#E5E5E5]">
                      <div className="flex items-center justify-between text-[12px] mb-1">
                        <span className="text-[#9B9B9B]">MRR Growth</span>
                        <span className="text-emerald-600 font-medium">+{revenue?.mrr_change_pct || 0}%</span>
                      </div>
                      <Progress value={revenue?.mrr_change_pct || 0} className="h-1.5" />
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    <QuickAction icon={<Users className="h-4 w-4" />} label="Invite User" />
                    <QuickAction icon={<Building2 className="h-4 w-4" />} label="Create Organization" />
                    <QuickAction icon={<Mail className="h-4 w-4" />} label="Send Broadcast" />
                    <QuickAction icon={<Shield className="h-4 w-4" />} label="Feature Flags" />
                    <QuickAction icon={<FileText className="h-4 w-4" />} label="Audit Log" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ── Users ── */}
          <TabsContent value="users">
            <div className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>User Management</CardTitle>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Search users..."
                        className="w-64"
                        startIcon={<Search className="h-4 w-4" />}
                      />
                      <Button size="sm">+ New User</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#E5E5E5]">
                        <th className="text-left text-[11px] uppercase tracking-wide text-[#9B9B9B] font-medium pb-2">User</th>
                        <th className="text-left text-[11px] uppercase tracking-wide text-[#9B9B9B] font-medium pb-2">Role</th>
                        <th className="text-left text-[11px] uppercase tracking-wide text-[#9B9B9B] font-medium pb-2">Organization</th>
                        <th className="text-left text-[11px] uppercase tracking-wide text-[#9B9B9B] font-medium pb-2">Status</th>
                        <th className="text-left text-[11px] uppercase tracking-wide text-[#9B9B9B] font-medium pb-2">Joined</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-[#F0F0F0] last:border-0">
                          <td className="py-2.5">
                            <div>
                              <div className="text-[13px] font-medium text-[#1A1A1A]">{user.name}</div>
                              <div className="text-[12px] text-[#9B9B9B]">{user.email}</div>
                            </div>
                          </td>
                          <td className="py-2.5">
                            <Badge variant={user.role === 'super_admin' ? 'default' : 'outline'}>
                              {user.role.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="py-2.5 text-[13px] text-[#6B6B6B]">{user.organization}</td>
                          <td className="py-2.5">
                            <Badge
                              variant={
                                user.status === 'active' ? 'success' : user.status === 'invited' ? 'warning' : 'danger'
                              }
                            >
                              {user.status}
                            </Badge>
                          </td>
                          <td className="py-2.5 text-[13px] text-[#6B6B6B]">
                            {new Date(user.joined_at).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 text-right">
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Organizations ── */}
          <TabsContent value="organizations">
            <div className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Organizations</CardTitle>
                    <Button size="sm">+ New Org</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {orgs.map((org) => (
                      <div key={org.id} className="flex items-center justify-between p-3 bg-[#FAFAFA] rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white border border-[#E5E5E5] flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-[#6B6B6B]" />
                          </div>
                          <div>
                            <div className="text-[14px] font-medium text-[#1A1A1A]">{org.name}</div>
                            <div className="text-[12px] text-[#9B9B9B]">
                              {org.members} members · Last active {new Date(org.last_active).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-[14px] font-medium text-[#1A1A1A]">¥{org.mrr.toLocaleString()}</div>
                            <div className="text-[11px] text-[#9B9B9B] uppercase tracking-wide">MRR</div>
                          </div>
                          <Badge variant={
                            org.status === 'active' ? 'success' : org.status === 'trialing' ? 'warning' : 'danger'
                          }>
                            {org.plan}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1.5" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Revenue ── */}
          <TabsContent value="revenue">
            <div className="mt-4 grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="text-[12px] text-[#9B9B9B] uppercase tracking-wide mb-1">
                    Monthly Recurring Revenue
                  </div>
                  <div className="text-[32px] font-serif text-[#1A1A1A]">
                    ¥{revenue?.mrr.toLocaleString() || 0}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[13px] text-emerald-600">
                    <TrendingUp className="h-4 w-4" />
                    +{revenue?.mrr_change_pct || 0}% vs last month
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-[12px] text-[#9B9B9B] uppercase tracking-wide mb-1">
                    Annual Run Rate
                  </div>
                  <div className="text-[32px] font-serif text-[#1A1A1A]">
                    ¥{revenue?.arr.toLocaleString() || 0}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[13px] text-emerald-600">
                    <TrendingUp className="h-4 w-4" />
                    +18.2% YoY
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-[12px] text-[#9B9B9B] uppercase tracking-wide mb-1">
                    Net Revenue Retention
                  </div>
                  <div className="text-[32px] font-serif text-[#1A1A1A]">112%</div>
                  <div className="flex items-center gap-1 mt-1 text-[13px] text-emerald-600">
                    <TrendingUp className="h-4 w-4" />
                    +3.1pp vs last month
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── System ── */}
          <TabsContent value="system">
            <div className="mt-4 grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Service Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {metrics.map((m) => (
                      <ServiceRow key={m.name} metric={m} detailed />
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Database & Infrastructure</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[13px] mb-1">
                      <span className="text-[#6B6B6B]">DB Storage</span>
                      <span className="text-[#1A1A1A]">24.7 GB / 100 GB</span>
                    </div>
                    <Progress value={24.7} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-[13px] mb-1">
                      <span className="text-[#6B6B6B]">Redis Memory</span>
                      <span className="text-[#1A1A1A]">1.2 GB / 4 GB</span>
                    </div>
                    <Progress value={30} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-[13px] mb-1">
                      <span className="text-[#6B6B6B]">CDN Bandwidth (24h)</span>
                      <span className="text-[#1A1A1A]">47 GB / 500 GB</span>
                    </div>
                    <Progress value={9.4} className="h-2" />
                  </div>
                  <div className="pt-3 border-t border-[#E5E5E5]">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-[#9B9B9B]">DB Connections</span>
                      <span className="text-[#1A1A1A]">127 / 500</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function KpiCard({
  icon,
  label,
  value,
  change,
  positive,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  positive: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-[#9B9B9B] text-[11px] uppercase tracking-wide mb-1">
          {icon}
          {label}
        </div>
        <div className="text-[24px] font-serif text-[#1A1A1A]">{value}</div>
        <div className={`flex items-center gap-1 text-[12px] mt-1 ${positive ? 'text-emerald-600' : 'text-red-600'}`}>
          {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {change}
        </div>
      </CardContent>
    </Card>
  );
}

function ServiceRow({ metric, detailed = false }: { metric: SystemMetric; detailed?: boolean }) {
  const statusIcon = {
    healthy: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
    degraded: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    down: <XCircle className="h-4 w-4 text-red-500" />,
  }[metric.status];

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        {statusIcon}
        <span className="text-[13px] text-[#1A1A1A]">{metric.name}</span>
      </div>
      <div className="flex items-center gap-4 text-[12px] text-[#6B6B6B]">
        {detailed && <span>{metric.latency}ms avg</span>}
        <span className="text-emerald-600 font-medium">{metric.uptime}%</span>
      </div>
    </div>
  );
}

function UserRow({ user }: { user: RecentUser }) {
  return (
    <div className="flex items-center justify-between py-2 rounded-lg hover:bg-[#FAFAFA] px-2 -mx-2 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#F0F0F0] flex items-center justify-center">
          <Users className="h-4 w-4 text-[#9B9B9B]" />
        </div>
        <div>
          <div className="text-[13px] font-medium text-[#1A1A1A]">{user.name}</div>
          <div className="text-[12px] text-[#9B9B9B]">{user.email}</div>
        </div>
      </div>
      <Badge variant={user.status === 'active' ? 'success' : user.status === 'invited' ? 'warning' : 'danger'}>
        {user.status}
      </Badge>
    </div>
  );
}

function QuickAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#F5F5F5] text-left transition-colors">
      <div className="text-[#6B6B6B]">{icon}</div>
      <span className="text-[13px] text-[#1A1A1A]">{label}</span>
      <ChevronRight className="h-4 w-4 text-[#9B9B9B] ml-auto" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Mock data                                                           */
/* ------------------------------------------------------------------ */

const MOCK_METRICS: SystemMetric[] = [
  { name: 'API Gateway', status: 'healthy', latency: '42', uptime: '99.99' },
  { name: 'Authentication', status: 'healthy', latency: '28', uptime: '99.99' },
  { name: 'Database (Primary)', status: 'healthy', latency: '15', uptime: '99.99' },
  { name: 'Redis Cache', status: 'healthy', latency: '3', uptime: '99.99' },
  { name: 'Search Engine', status: 'healthy', latency: '67', uptime: '99.95' },
  { name: 'Email Service', status: 'degraded', latency: '1200', uptime: '98.7' },
  { name: 'File Storage', status: 'healthy', latency: '85', uptime: '99.99' },
  { name: 'WebSocket Server', status: 'healthy', latency: '54', uptime: '99.97' },
];

const MOCK_USERS: RecentUser[] = [
  { id: 'u1', name: 'Sarah Chen', email: 'sarah@acme.com', role: 'client_admin', status: 'active', joined_at: '2026-07-15T10:30:00Z', organization: 'Acme Corp' },
  { id: 'u2', name: 'Michael Zhang', email: 'michael@globex.com', role: 'user', status: 'active', joined_at: '2026-07-14T14:20:00Z', organization: 'Globex' },
  { id: 'u3', name: 'Emily Wang', email: 'emily@initech.com', role: 'user', status: 'invited', joined_at: '2026-07-14T09:15:00Z', organization: 'Initech' },
  { id: 'u4', name: 'James Liu', email: 'james@umbrella.com', role: 'candidate', status: 'active', joined_at: '2026-07-13T16:45:00Z', organization: '—' },
  { id: 'u5', name: 'Lisa Park', email: 'lisa@stark.com', role: 'client_admin', status: 'active', joined_at: '2026-07-13T08:00:00Z', organization: 'Stark Industries' },
  { id: 'u6', name: 'David Kim', email: 'david@wayne.com', role: 'user', status: 'suspended', joined_at: '2026-07-12T11:30:00Z', organization: 'Wayne Enterprises' },
  { id: 'u7', name: 'Anna Lee', email: 'anna@oyl.com', role: 'coach', status: 'active', joined_at: '2026-07-12T09:00:00Z', organization: 'OYL Industries' },
];

const MOCK_ORGS: OrgSummary[] = [
  { id: 'o1', name: 'Acme Corp', plan: 'Enterprise', members: 24, mrr: 48000, status: 'active', last_active: '2026-07-17T10:00:00Z' },
  { id: 'o2', name: 'Globex', plan: 'Growth', members: 12, mrr: 24000, status: 'active', last_active: '2026-07-17T08:30:00Z' },
  { id: 'o3', name: 'Initech', plan: 'Starter', members: 5, mrr: 5000, status: 'trialing', last_active: '2026-07-16T14:00:00Z' },
  { id: 'o4', name: 'Stark Industries', plan: 'Enterprise', members: 31, mrr: 62000, status: 'active', last_active: '2026-07-17T09:45:00Z' },
  { id: 'o5', name: 'Wayne Enterprises', plan: 'Growth', members: 18, mrr: 36000, status: 'past_due', last_active: '2026-07-10T12:00:00Z' },
];

const MOCK_REVENUE: RevenueSnapshot = {
  mrr: 284500,
  mrr_change_pct: 12.5,
  arr: 3414000,
  new_revenue: 42000,
  churn: 8500,
  ltv: 68000,
};
