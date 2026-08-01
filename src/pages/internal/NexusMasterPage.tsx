/**
 * NexusMasterPage.tsx — Issue #46
 * Nexus Master Control — central orchestration console for the Nexus AI
 * assistant. Aggregates persona, memory, RAG, proactive engine, and
 * cross-agent orchestration health into a single command surface.
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Cpu,
  Brain,
  Database,
  Sparkles,
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Settings,
  GitBranch,
  Clock,
} from 'lucide-react';

interface Subsystem {
  id: string;
  name: string;
  description: string;
  status: 'operational' | 'degraded' | 'offline';
  icon: React.ComponentType<{ className?: string }>;
  metrics: { label: string; value: string }[];
  lastDeploy: string;
  version: string;
}

const SUBSYSTEMS: Subsystem[] = [
  {
    id: 'persona',
    name: 'Persona Engine',
    description: 'Unified Nexus voice & personality (no agent names surfaced to users)',
    status: 'operational',
    icon: Sparkles,
    metrics: [
      { label: 'Active Personas', value: '5' },
      { label: 'Avg Latency', value: '180ms' },
      { label: 'Voice Drift Score', value: '0.04' },
    ],
    lastDeploy: '2026-07-19T10:00:00Z',
    version: 'v2.4.1',
  },
  {
    id: 'memory',
    name: 'Memory System',
    description: 'Short/long-term memory + per-entity recall',
    status: 'operational',
    icon: Brain,
    metrics: [
      { label: 'Memories Stored', value: '48,210' },
      { label: 'Recall Accuracy', value: '94.2%' },
      { label: 'Storage Used', value: '1.4 GB' },
    ],
    lastDeploy: '2026-07-18T14:00:00Z',
    version: 'v2.4.0',
  },
  {
    id: 'rag',
    name: 'RAG Library',
    description: 'Retrieval-augmented generation knowledge base',
    status: 'operational',
    icon: Database,
    metrics: [
      { label: 'Indexed Chunks', value: '1,842' },
      { label: 'Retrievals (24h)', value: '3,108' },
      { label: 'Avg Relevance', value: '0.87' },
    ],
    lastDeploy: '2026-07-20T09:00:00Z',
    version: 'v2.5.0',
  },
  {
    id: 'proactive',
    name: 'Proactive Engine',
    description: 'Suggestion & recommendation engine',
    status: 'degraded',
    icon: Zap,
    metrics: [
      { label: 'Suggestions (24h)', value: '642' },
      { label: 'Acceptance Rate', value: '31%' },
      { label: 'Queue Depth', value: '18' },
    ],
    lastDeploy: '2026-07-17T11:00:00Z',
    version: 'v2.3.2',
  },
  {
    id: 'orchestration',
    name: 'Cross-Agent Orchestration',
    description: 'Internal multi-agent routing (invisible to end users)',
    status: 'operational',
    icon: GitBranch,
    metrics: [
      { label: 'Agents Online', value: '7 / 7' },
      { label: 'Routes (24h)', value: '12,408' },
      { label: 'Avg Handoff', value: '240ms' },
    ],
    lastDeploy: '2026-07-20T08:00:00Z',
    version: 'v2.5.0',
  },
  {
    id: 'context',
    name: 'Context Assembly',
    description: 'Tier-gated context window builder',
    status: 'operational',
    icon: Cpu,
    metrics: [
      { label: 'Tier Hits', value: 'free: 412 / pro: 198 / exec: 38' },
      { label: 'Avg Tokens', value: '3,240' },
      { label: 'Truncation Rate', value: '2.1%' },
    ],
    lastDeploy: '2026-07-19T16:00:00Z',
    version: 'v2.4.1',
  },
];

const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  operational: { color: 'text-green-600', bg: 'bg-green-50', icon: <CheckCircle2 className="w-3 h-3" /> },
  degraded: { color: 'text-amber-600', bg: 'bg-amber-50', icon: <AlertTriangle className="w-3 h-3" /> },
  offline: { color: 'text-red-600', bg: 'bg-red-50', icon: <AlertTriangle className="w-3 h-3" /> },
};

export function NexusMasterPage() {
  const [subsystems] = useState(SUBSYSTEMS);
  const operational = subsystems.filter((s) => s.status === 'operational').length;
  const totalRequests = subsystems.reduce((s, x) => s + (parseInt(x.metrics[1]?.value.replace(/[^\d]/g, '')) || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-purple-600" />
            Nexus Master Control
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Unified orchestration console for the Nexus AI assistant
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`border-0 ${operational === subsystems.length ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
            {operational}/{subsystems.length} Operational
          </Badge>
          <Button variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            Configure
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Activity className="w-3 h-3" /> Total Requests (24h)
          </div>
          <div className="text-2xl font-bold mt-1">{totalRequests.toLocaleString()}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Zap className="w-3 h-3" /> Avg Response
          </div>
          <div className="text-2xl font-bold mt-1">214ms</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Brain className="w-3 h-3" /> Memory Hit Rate
          </div>
          <div className="text-2xl font-bold mt-1 text-green-600">94.2%</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <CheckCircle2 className="w-3 h-3" /> Uptime (30d)
          </div>
          <div className="text-2xl font-bold mt-1">99.91%</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {subsystems.map((s) => {
          const sc = statusConfig[s.status];
          const Icon = s.icon;
          return (
            <Card key={s.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-50">
                    <Icon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{s.name}</span>
                      <Badge variant="outline" className="text-[10px]">{s.version}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
                  </div>
                </div>
                <Badge className={`text-[10px] border-0 ${sc.bg} ${sc.color}`}>
                  {sc.icon}
                  <span className="ml-1 capitalize">{s.status}</span>
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                {s.metrics.map((m) => (
                  <div key={m.label}>
                    <div className="text-sm font-semibold text-gray-900">{m.value}</div>
                    <div className="text-[10px] text-gray-500">{m.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-3">
                <Clock className="w-3 h-3" />
                Last deploy {new Date(s.lastDeploy).toLocaleString()}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-4">
        <h2 className="text-sm font-semibold mb-2">Orchestration Rule</h2>
        <p className="text-xs text-gray-600">
          All user-facing features present as a single unified assistant named{' '}
          <strong>Nexus</strong>. Internal multi-agent orchestration (Marcus, Maria, ECHO, Amélie,
          etc.) is invisible to end users. No agent names leak into the application layer.
        </p>
      </Card>
    </div>
  );
}
