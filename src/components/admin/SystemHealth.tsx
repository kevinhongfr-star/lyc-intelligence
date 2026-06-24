import React, { useState } from 'react';
import {
  Server,
  Database,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  HardDrive,
  Cpu,
  Globe,
  RefreshCw,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const MOCK_DB_STATS = {
  profiles: 847,
  mandates: 156,
  candidates: 2340,
  companies: 892,
  assessments: 1240,
  credits: 125000,
  audit_log: 28450,
};

const MOCK_RECENT_ERRORS = [
  { id: '1', service: 'API', error: 'TimeoutError', endpoint: '/api/nexus/completion', user: null, time: '12m ago', count: 3 },
  { id: '2', service: 'Auth', error: 'RateLimitExceeded', endpoint: '/auth/login', user: 'anonymous', time: '1h ago', count: 15 },
  { id: '3', service: 'DB', error: 'ConnectionTimeout', endpoint: 'profiles', user: null, time: '2h ago', count: 1 },
];

const MOCK_DEPLOYMENTS = [
  { id: '1', environment: 'production', version: 'v2.3.1', status: 'healthy', lastDeploy: '2h ago', commit: 'a1b2c3d', by: 'kevin@lycintelligence.com' },
  { id: '2', environment: 'staging', version: 'v2.3.2-rc', status: 'healthy', lastDeploy: '1d ago', commit: 'e4f5g6h', by: 'CI/CD' },
];

const MOCK_DEPENDENCIES = [
  { name: 'Supabase', status: 'operational', latency: 42, uptime: 99.9 },
  { name: 'Vercel Functions', status: 'operational', latency: 180, uptime: 99.7 },
  { name: 'OpenAI API', status: 'operational', latency: 890, uptime: 99.5 },
  { name: 'LinkedIn API', status: 'degraded', latency: 2400, uptime: 97.2 },
  { name: 'Email (Resend)', status: 'operational', latency: 310, uptime: 99.8 },
  { name: 'Storage (S3)', status: 'operational', latency: 55, uptime: 99.99 },
];

export function SystemHealth() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'degraded': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'down': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-text-muted" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational': return 'bg-green-100 text-green-700';
      case 'degraded': return 'bg-amber-100 text-amber-700';
      case 'down': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const overallStatus = MOCK_DEPENDENCIES.every((d) => d.status === 'operational')
    ? 'healthy'
    : MOCK_DEPENDENCIES.some((d) => d.status === 'down')
    ? 'down'
    : 'degraded';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">System Health</h1>
          <p className="text-text-muted">Platform infrastructure and dependencies</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Overall Status</span>
              {getStatusIcon(overallStatus)}
            </div>
            <Badge variant="secondary" className={getStatusColor(overallStatus)}>
              {overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1)}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Dependencies</span>
              <Server className="w-4 h-4 text-accent" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{MOCK_DEPENDENCIES.length}</p>
            <p className="text-xs text-text-muted">
              {MOCK_DEPENDENCIES.filter((d) => d.status === 'operational').length} operational
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Recent Errors</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-600">{MOCK_RECENT_ERRORS.length}</p>
            <p className="text-xs text-text-muted">Last 24h</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-accent" />
              Dependencies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_DEPENDENCIES.map((dep) => (
              <div key={dep.name} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(dep.status)}
                  <div>
                    <p className="font-medium text-text-primary">{dep.name}</p>
                    <Badge variant="secondary" className={`mt-1 text-[10px] ${getStatusColor(dep.status)}`}>
                      {dep.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-text-primary">{dep.latency}ms</p>
                  <p className="text-xs text-text-muted">Uptime: {dep.uptime}%</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-accent" />
              Database Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(MOCK_DB_STATS).map(([table, count]) => (
              <div key={table} className="flex items-center justify-between p-2 bg-bg-tertiary rounded-lg">
                <span className="text-sm text-text-primary capitalize">{table.replace('_', ' ')}</span>
                <span className="text-sm font-medium text-text-primary">
                  {count >= 1000 ? `${(count / 1000).toFixed(1)}K` : count.toLocaleString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              Recent Errors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {MOCK_RECENT_ERRORS.map((err) => (
              <div key={err.id} className="flex items-start justify-between p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-red-100 text-red-700 text-[10px]">{err.service}</Badge>
                      <span className="font-medium text-sm text-text-primary">{err.error}</span>
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                      {err.endpoint} · {err.user || 'system'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-text-muted">{err.time}</span>
                  {err.count > 1 && (
                    <Badge variant="secondary" className="ml-1 text-[10px]">×{err.count}</Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-accent" />
              Deployments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_DEPLOYMENTS.map((deploy) => (
              <div key={deploy.id} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary">{deploy.environment}</span>
                    <Badge variant="secondary" className={getStatusColor(deploy.status)}>
                      {getStatusIcon(deploy.status)}
                      <span className="ml-1 text-[10px]">{deploy.status}</span>
                    </Badge>
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    {deploy.version} · {deploy.commit} · {deploy.lastDeploy} by {deploy.by}
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
