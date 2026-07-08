'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle2,
  Clock,
  DollarSign,
  GitBranch,
  Loader2,
  Server,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

const DS = {
  headingFont: "'Libre Baskerville', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  accent: '#C108AB',
  accentHover: '#A00790',
  bg: '#0a0a0f',
  bgCard: '#12121a',
  border: '#1e1e2e',
  text: '#e5e5e5',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  radius: '0px',
};

interface SystemMetric {
  label: string;
  value: string | number;
  change?: number;
  status: 'healthy' | 'warning' | 'critical';
  icon: React.ReactNode;
}

interface AgentStatus {
  name: string;
  status: 'active' | 'idle' | 'error' | 'offline';
  lastActive?: string;
  tasksCompleted?: number;
  score?: number;
}

interface AlertItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  source: string;
}

export function KevinOversightDashboard() {
  const [loading, setLoading] = useState(true);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'alerts' | 'pipeline'>('overview');

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [metricsRes, agentsRes, alertsRes] = await Promise.all([
        fetch('/api/analytics/platform-overview').then(r => r.json()).catch(() => null),
        fetch('/api/agents/status').then(r => r.json()).catch(() => null),
        fetch('/api/alerts/recent?limit=20').then(r => r.json()).catch(() => null),
      ]);
      setSystemMetrics(metricsRes?.metrics || getDefaultMetrics());
      setAgentStatuses(agentsRes?.agents || getDefaultAgents());
      setAlerts(alertsRes?.alerts || getDefaultAlerts());
    } catch {
      setSystemMetrics(getDefaultMetrics());
      setAgentStatuses(getDefaultAgents());
      setAlerts(getDefaultAlerts());
    } finally { setLoading(false); }
  };

  const getDefaultMetrics = (): SystemMetric[] => [
    { label: 'Active Mandates', value: '—', status: 'warning', icon: <Users className="w-5 h-5" /> },
    { label: 'Pipeline Value', value: '—', status: 'warning', icon: <DollarSign className="w-5 h-5" /> },
    { label: 'System Uptime', value: '—', status: 'healthy', icon: <Server className="w-5 h-5" /> },
    { label: 'AI Calls Today', value: '—', status: 'healthy', icon: <Zap className="w-5 h-5" /> },
    { label: 'Avg Response Time', value: '—', status: 'healthy', icon: <Clock className="w-5 h-5" /> },
    { label: 'Error Rate', value: '—', status: 'healthy', icon: <AlertTriangle className="w-5 h-5" /> },
  ];

  const getDefaultAgents = (): AgentStatus[] => [
    { name: 'NEXUS', status: 'active', tasksCompleted: 0, score: 0 },
    { name: 'Marcus/AI', status: 'offline', tasksCompleted: 0, score: 0 },
    { name: 'Alessio/AI', status: 'offline', tasksCompleted: 0, score: 0 },
    { name: 'Samuel/AI', status: 'offline', tasksCompleted: 0, score: 0 },
    { name: 'Valentina/AI', status: 'offline', tasksCompleted: 0, score: 0 },
    { name: 'James/AI', status: 'offline', tasksCompleted: 0, score: 0 },
  ];

  const getDefaultAlerts = (): AlertItem[] => [
    { id: '1', severity: 'info', message: 'System monitoring initialized', timestamp: new Date().toISOString(), source: 'system' },
  ];

  const statusColor = (s: string) => {
    if (s === 'healthy' || s === 'active') return DS.success;
    if (s === 'warning' || s === 'idle') return DS.warning;
    if (s === 'critical' || s === 'error') return DS.error;
    return DS.textMuted;
  };

  const severityColor = (s: string) => {
    if (s === 'critical') return DS.error;
    if (s === 'warning') return DS.warning;
    return DS.info;
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'agents' as const, label: 'Agents', icon: <Users className="w-4 h-4" /> },
    { id: 'alerts' as const, label: 'Alerts', icon: <Bell className="w-4 h-4" /> },
    { id: 'pipeline' as const, label: 'Pipeline', icon: <GitBranch className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: DS.bg }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: DS.accent }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: DS.bg, color: DS.text, fontFamily: DS.bodyFont }}>
      <header style={{ borderBottom: `1px solid ${DS.border}`, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, background: DS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 style={{ fontFamily: DS.headingFont, fontSize: 18, fontWeight: 700, margin: 0 }}>NEXUS Oversight</h1>
            <p style={{ fontSize: 12, color: DS.textMuted, margin: 0 }}>Kevin's Command Center</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, background: DS.success, borderRadius: '50%' }} />
            <span style={{ fontSize: 12, color: DS.textSecondary }}>Monitoring Active</span>
          </div>
          <button onClick={loadDashboardData} style={{ padding: '6px 14px', background: 'transparent', border: `1px solid ${DS.border}`, color: DS.textSecondary, cursor: 'pointer', fontFamily: DS.bodyFont, fontSize: 13, borderRadius: DS.radius }}>
            Refresh
          </button>
        </div>
      </header>

      <nav style={{ borderBottom: `1px solid ${DS.border}`, padding: '0 24px', display: 'flex' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px',
            background: 'transparent', border: 'none',
            borderBottom: activeTab === tab.id ? `2px solid ${DS.accent}` : '2px solid transparent',
            color: activeTab === tab.id ? DS.text : DS.textMuted,
            cursor: 'pointer', fontFamily: DS.bodyFont, fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>

      <main style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
              {systemMetrics.map((metric, i) => (
                <div key={i} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, padding: 20, borderRadius: DS.radius }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ color: statusColor(metric.status) }}>{metric.icon}</div>
                    {metric.change !== undefined && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, color: metric.change >= 0 ? DS.success : DS.error }}>
                        {metric.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(metric.change)}%
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, fontFamily: DS.headingFont, marginBottom: 4 }}>{metric.value}</div>
                  <div style={{ fontSize: 12, color: DS.textMuted }}>{metric.label}</div>
                </div>
              ))}
            </div>
            <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: DS.radius }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${DS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontFamily: DS.headingFont, fontSize: 15, fontWeight: 600, margin: 0 }}>Recent Alerts</h2>
                <span style={{ fontSize: 12, color: DS.textMuted }}>{alerts.length} total</span>
              </div>
              <div>
                {alerts.slice(0, 5).map(alert => (
                  <div key={alert.id} style={{ padding: '12px 20px', borderBottom: `1px solid ${DS.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 8, height: 8, background: severityColor(alert.severity), borderRadius: '50%', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13 }}>{alert.message}</div>
                      <div style={{ fontSize: 11, color: DS.textMuted }}>{alert.source} · {new Date(alert.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <div style={{ padding: '24px 20px', textAlign: 'center', color: DS.textMuted }}>
                    <CheckCircle2 className="w-6 h-6" style={{ margin: '0 auto 8px', color: DS.success }} />
                    No alerts — all systems nominal
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'agents' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {agentStatuses.map((agent, i) => (
              <div key={i} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, padding: 20, borderRadius: DS.radius }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontFamily: DS.headingFont, fontSize: 15, fontWeight: 600, margin: 0 }}>{agent.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, background: statusColor(agent.status), borderRadius: '50%' }} />
                    <span style={{ fontSize: 12, color: statusColor(agent.status), textTransform: 'capitalize' }}>{agent.status}</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: DS.textMuted, marginBottom: 2 }}>Tasks Done</div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{agent.tasksCompleted ?? '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: DS.textMuted, marginBottom: 2 }}>Score</div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{agent.score !== undefined ? `${agent.score}/10` : '—'}</div>
                  </div>
                </div>
                {agent.lastActive && (
                  <div style={{ fontSize: 11, color: DS.textMuted, marginTop: 12 }}>Last active: {new Date(agent.lastActive).toLocaleString()}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'alerts' && (
          <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: DS.radius }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${DS.border}` }}>
              <h2 style={{ fontFamily: DS.headingFont, fontSize: 15, fontWeight: 600, margin: 0 }}>All Alerts</h2>
            </div>
            <div>
              {alerts.map(alert => (
                <div key={alert.id} style={{ padding: '14px 20px', borderBottom: `1px solid ${DS.border}`, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 8, height: 8, background: severityColor(alert.severity), borderRadius: '50%', marginTop: 5, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, marginBottom: 4 }}>{alert.message}</div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: DS.textMuted }}>
                      <span style={{ textTransform: 'uppercase', color: severityColor(alert.severity) }}>{alert.severity}</span>
                      <span>{alert.source}</span>
                      <span>{new Date(alert.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
              {alerts.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: DS.textMuted }}>No alerts</div>}
            </div>
          </div>
        )}

        {activeTab === 'pipeline' && (
          <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: DS.radius, padding: 24 }}>
            <h2 style={{ fontFamily: DS.headingFont, fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Pipeline Overview</h2>
            <p style={{ color: DS.textSecondary, fontSize: 13 }}>Connect to Supabase analytics endpoints to display mandate pipeline data, velocity metrics, and revenue tracking.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 20 }}>
              {['Sourcing', 'Interview', 'Offer', 'Placed'].map((stage) => (
                <div key={stage} style={{ padding: 16, border: `1px solid ${DS.border}`, borderRadius: DS.radius, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: DS.textMuted, marginBottom: 8 }}>{stage}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, fontFamily: DS.headingFont, color: DS.textMuted }}>—</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
