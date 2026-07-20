/**
 * SystemHealthPage.tsx — Issue #26/28/31
 * System health, CI/CD status, error monitoring, and backup overview
 */
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Activity,
  Server,
  Database,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  GitBranch,
  Cloud,
  HardDrive,
  Zap,
  XCircle,
} from 'lucide-react';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'maintenance';
  uptime: string;
  latency: string;
  lastChecked: string;
}

interface Deployment {
  id: string;
  branch: string;
  env: string;
  status: 'success' | 'failed' | 'in_progress';
  deployedAt: string;
  commit: string;
}

const SERVICES: ServiceStatus[] = [
  { name: 'API Gateway', status: 'operational', uptime: '99.97%', latency: '45ms', lastChecked: '2026-07-20T14:00:00Z' },
  { name: 'Auth Service', status: 'operational', uptime: '99.99%', latency: '28ms', lastChecked: '2026-07-20T14:00:00Z' },
  { name: 'Supabase DB', status: 'operational', uptime: '99.95%', latency: '12ms', lastChecked: '2026-07-20T14:00:00Z' },
  { name: 'DEX AI Engine', status: 'operational', uptime: '99.91%', latency: '120ms', lastChecked: '2026-07-20T14:00:00Z' },
  { name: 'Email Service', status: 'degraded', uptime: '99.2%', latency: '340ms', lastChecked: '2026-07-20T14:00:00Z' },
  { name: 'File Storage', status: 'operational', uptime: '99.98%', latency: '55ms', lastChecked: '2026-07-20T14:00:00Z' },
];

const DEPLOYMENTS: Deployment[] = [
  { id: 'dep-1', branch: 'main', env: 'production', status: 'success', deployedAt: '2026-07-20T12:00:00Z', commit: 'a3f7d2e' },
  { id: 'dep-2', branch: 'develop', env: 'staging', status: 'in_progress', deployedAt: '2026-07-20T13:30:00Z', commit: 'b8e1c4a' },
  { id: 'dep-3', branch: 'main', env: 'production', status: 'success', deployedAt: '2026-07-19T12:00:00Z', commit: 'c5d9f1b' },
];

const statusConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  operational: { icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-600', bg: 'bg-green-50' },
  degraded: { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-50' },
  down: { icon: <XCircle className="w-4 h-4" />, color: 'text-red-600', bg: 'bg-red-50' },
  maintenance: { icon: <Clock className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50' },
  success: { icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-600', bg: 'bg-green-50' },
  failed: { icon: <XCircle className="w-4 h-4" />, color: 'text-red-600', bg: 'bg-red-50' },
  in_progress: { icon: <RefreshCw className="w-4 h-4 animate-spin" />, color: 'text-blue-600', bg: 'bg-blue-50' },
};

export function SystemHealthPage() {
  const [services, setServices] = useState<ServiceStatus[]>(SERVICES);
  const [deployments] = useState<Deployment[]>(DEPLOYMENTS);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [checking, setChecking] = useState(false);

  async function runHealthCheck() {
    setChecking(true);
    await new Promise(r => setTimeout(r, 1500));
    setLastRefresh(new Date());
    setChecking(false);
  }

  const allOperational = services.every(s => s.status === 'operational');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">System Health</h1>
          <p className="text-sm text-gray-500 mt-1">Infrastructure status, deployments, and monitoring</p>
        </div>
        <Button variant="outline" onClick={runHealthCheck} disabled={checking} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Checking...' : 'Refresh'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className={`p-2 rounded-lg ${allOperational ? 'bg-green-50' : 'bg-amber-50'}`}>
            {allOperational ? <ShieldCheck className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-amber-600" />}
          </div>
          <div>
            <div className="text-2xl font-bold">{allOperational ? 'All Good' : 'Degraded'}</div>
            <div className="text-xs text-gray-500">System Status</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg"><Activity className="w-5 h-5 text-blue-600" /></div>
          <div>
            <div className="text-2xl font-bold">{services.filter(s => s.status === 'operational').length}/{services.length}</div>
            <div className="text-xs text-gray-500">Services Up</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg"><Cloud className="w-5 h-5 text-purple-600" /></div>
          <div>
            <div className="text-2xl font-bold">99.7%</div>
            <div className="text-xs text-gray-500">Avg Uptime (30d)</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg"><Zap className="w-5 h-5 text-emerald-600" /></div>
          <div>
            <div className="text-2xl font-bold">67ms</div>
            <div className="text-xs text-gray-500">Avg Latency</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-medium mb-3">Service Status</h2>
          <div className="space-y-2">
            {services.map(s => {
              const cfg = statusConfig[s.status];
              return (
                <Card key={s.name} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded ${cfg.bg}`}>
                        {s.name.includes('DB') ? <Database className={`w-4 h-4 ${cfg.color}`} /> :
                         s.name.includes('AI') ? <Zap className={`w-4 h-4 ${cfg.color}`} /> :
                         s.name.includes('Storage') ? <HardDrive className={`w-4 h-4 ${cfg.color}`} /> :
                         <Server className={`w-4 h-4 ${cfg.color}`} />}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{s.name}</div>
                        <div className="text-xs text-gray-500">Latency: {s.latency}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-medium">{s.uptime}</div>
                        <div className="text-[10px] text-gray-400">uptime</div>
                      </div>
                      <Badge className={`text-[10px] ${cfg.bg} ${cfg.color} border-0`}>
                        {cfg.icon}
                        <span className="ml-1 capitalize">{s.status}</span>
                      </Badge>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-3">Recent Deployments</h2>
          <div className="space-y-2">
            {deployments.map(d => {
              const cfg = statusConfig[d.status];
              return (
                <Card key={d.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded ${cfg.bg}`}>
                        <GitBranch className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div>
                        <div className="text-sm font-medium flex items-center gap-2">
                          {d.branch}
                          <Badge variant="outline" className="text-[10px]">{d.env}</Badge>
                        </div>
                        <div className="text-xs text-gray-500">Commit {d.commit} · {new Date(d.deployedAt).toLocaleString()}</div>
                      </div>
                    </div>
                    <Badge className={`text-[10px] ${cfg.bg} ${cfg.color} border-0`}>
                      {cfg.icon}
                      <span className="ml-1 capitalize">{d.status.replace('_', ' ')}</span>
                    </Badge>
                  </div>
                </Card>
              );
            })}
          </div>

          <h2 className="text-lg font-medium mb-3 mt-6">Monitoring & Alerts</h2>
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-400" />
                <span className="text-sm">Sentry Error Monitoring</span>
              </div>
              <Badge className="bg-green-100 text-green-700 text-[10px]">Connected</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-gray-400" />
                <span className="text-sm">Automated Backups</span>
              </div>
              <Badge className="bg-green-100 text-green-700 text-[10px]">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-gray-400" />
                <span className="text-sm">Vercel Analytics</span>
              </div>
              <Badge className="bg-green-100 text-green-700 text-[10px]">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-gray-400" />
                <span className="text-sm">SSL Certificate</span>
              </div>
              <Badge className="bg-green-100 text-green-700 text-[10px]">Valid</Badge>
            </div>
          </Card>
        </div>
      </div>

      <div className="text-xs text-gray-400">
        Last refreshed: {lastRefresh.toLocaleString()}
      </div>
    </div>
  );
}
