import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CreditCard,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Shield,
  ArrowRight,
  UserX,
  UserCheck,
  DollarSign,
  FileText,
  Server,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const MOCK_STATS = {
  totalUsers: 847,
  activeToday: 23,
  newThisWeek: 12,
  byICP: {
    candidate: 620,
    consultant: 45,
    leader: 8,
    client: 174,
  },
  credits: {
    totalIssued: 125000,
    totalConsumed: 87340,
    totalRemaining: 37660,
  },
  system: {
    apiStatus: 'operational',
    dbStatus: 'healthy',
    lastDeploy: '2h ago',
    recentErrors: 3,
  },
};

const RECENT_ACTIVITY = [
  { id: '1', action: 'credit_grant', user: 'kevin@lycintelligence.com', target: 'alex@lycintelligence.com', detail: '+500 credits', time: '5m ago' },
  { id: '2', action: 'user_disabled', user: 'admin', target: 'old_user@lycintelligence.com', detail: 'Account disabled', time: '1h ago' },
  { id: '3', action: 'role_change', user: 'kevin@lycintelligence.com', target: 'new_consultant@lycintelligence.com', detail: 'consultant → team_lead', time: '3h ago' },
  { id: '4', action: 'bulk_credit', user: 'kevin@lycintelligence.com', target: '12 users', detail: '+3,000 credits (CSV)', time: '1d ago' },
  { id: '5', action: 'mandate_created', user: 'alex@lycintelligence.com', target: 'TechCorp VP Eng', detail: 'New mandate', time: '1d ago' },
];

const QUICK_ACTIONS = [
  { label: 'Manage Users', icon: Users, path: '/platform/admin/users', desc: 'View, edit, disable users' },
  { label: 'Credit Management', icon: CreditCard, path: '/platform/admin/credits', desc: 'Grant, adjust, bulk operations' },
  { label: 'System Health', icon: Activity, path: '/platform/admin/health', desc: 'API, DB, deployment status' },
  { label: 'Audit Log', icon: FileText, path: '/platform/admin/audit', desc: 'View all platform actions' },
];

const formatCurrency = (val: number) => {
  if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
  return String(val);
};

const getActionIcon = (action: string) => {
  switch (action) {
    case 'credit_grant': return <DollarSign className="w-4 h-4 text-green-500" />;
    case 'user_disabled': return <UserX className="w-4 h-4 text-red-500" />;
    case 'role_change': return <Shield className="w-4 h-4 text-blue-500" />;
    case 'bulk_credit': return <CreditCard className="w-4 h-4 text-green-500" />;
    default: return <Activity className="w-4 h-4 text-text-muted" />;
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case 'credit_grant': return 'bg-green-500/10';
    case 'user_disabled': return 'bg-red-500/10';
    case 'role_change': return 'bg-blue-500/10';
    case 'bulk_credit': return 'bg-green-500/10';
    default: return 'bg-bg-tertiary';
  }
};

export default function AdminDashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">Admin Dashboard</h1>
          <p className="text-text-muted">Platform overview and management</p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          <Shield className="w-3 h-3 mr-1" />
          Admin Access
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Total Users</span>
              <Users className="w-4 h-4 text-accent" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{MOCK_STATS.totalUsers}</p>
            <p className="text-xs text-green-600 mt-1">+{MOCK_STATS.newThisWeek} this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Active Today</span>
              <UserCheck className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{MOCK_STATS.activeToday}</p>
            <p className="text-xs text-text-muted mt-1">Online now</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Credits Issued</span>
              <CreditCard className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{formatCurrency(MOCK_STATS.credits.totalIssued)}</p>
            <p className="text-xs text-text-muted mt-1">{formatCurrency(MOCK_STATS.credits.totalRemaining)} remaining</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">System Status</span>
              <Server className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-green-600">Healthy</span>
            </div>
            <p className="text-xs text-text-muted mt-1">{MOCK_STATS.system.recentErrors} recent errors</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" />
              Users by ICP
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(MOCK_STATS.byICP).map(([icp, count]) => {
              const percent = Math.round((count / MOCK_STATS.totalUsers) * 100);
              const icpColors: Record<string, string> = {
                candidate: 'bg-blue-500',
                consultant: 'bg-purple-500',
                leader: 'bg-amber-500',
                client: 'bg-green-500',
              };
              return (
                <div key={icp} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-primary capitalize">{icp}</span>
                    <span className="text-text-muted">{count} ({percent}%)</span>
                  </div>
                  <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${icpColors[icp] || 'bg-accent'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-accent" />
              Credit Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-muted">Consumption</span>
                <span className="text-text-primary">
                  {formatCurrency(MOCK_STATS.credits.totalConsumed)} / {formatCurrency(MOCK_STATS.credits.totalIssued)}
                </span>
              </div>
              <div className="w-full h-3 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full"
                  style={{ width: `${Math.round((MOCK_STATS.credits.totalConsumed / MOCK_STATS.credits.totalIssued) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-text-muted mt-1">
                {Math.round((MOCK_STATS.credits.totalConsumed / MOCK_STATS.credits.totalIssued) * 100)}% consumed
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-bg-tertiary rounded-lg">
                <p className="text-xs text-text-muted">Issued</p>
                <p className="font-semibold text-text-primary">{formatCurrency(MOCK_STATS.credits.totalIssued)}</p>
              </div>
              <div className="text-center p-2 bg-bg-tertiary rounded-lg">
                <p className="text-xs text-text-muted">Consumed</p>
                <p className="font-semibold text-text-primary">{formatCurrency(MOCK_STATS.credits.totalConsumed)}</p>
              </div>
              <div className="text-center p-2 bg-bg-tertiary rounded-lg">
                <p className="text-xs text-text-muted">Remaining</p>
                <p className="font-semibold text-green-600">{formatCurrency(MOCK_STATS.credits.totalRemaining)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-serif font-semibold text-text-primary mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.path} to={action.path}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <Icon className="w-6 h-6 text-accent mb-3" />
                    <p className="font-medium text-text-primary">{action.label}</p>
                    <p className="text-xs text-text-muted mt-1">{action.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" />
            Recent Admin Activity
          </CardTitle>
          <Link to="/platform/admin/audit" className="text-sm text-accent hover:underline">
            View full log
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {RECENT_ACTIVITY.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-2 bg-bg-tertiary rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getActionColor(item.action)}`}>
                  {getActionIcon(item.action)}
                </div>
                <div>
                  <p className="text-sm text-text-primary">
                    <span className="font-medium">{item.user}</span>
                    <span className="text-text-muted"> → {item.detail}</span>
                  </p>
                  <p className="text-xs text-text-muted">Target: {item.target}</p>
                </div>
              </div>
              <span className="text-xs text-text-muted">{item.time}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
