/**
 * AIOrchestrationPage.tsx — Issue #100
 * AI Orchestration console — manages the multi-agent routing layer that
 * coordinates specialized AI agents (invisible to end users, presented as
 * unified "Nexus"). Includes routing rules, agent health, prompt registry,
 * and cost/latency telemetry.
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Workflow,
  Bot,
  Cpu,
  Clock,
  DollarSign,
  GitBranch,
  Settings2,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';

interface Agent {
  id: string;
  codename: string;
  role: string;
  specialty: string;
  model: string;
  status: 'online' | 'idle' | 'offline';
  routes24h: number;
  avgLatencyMs: number;
  costPer1k: number;
  successRate: number;
}

const AGENTS: Agent[] = [
  { id: 'a1', codename: 'Marcus', role: 'Conversation Lead', specialty: 'Intent routing + small talk', model: 'gpt-4o-mini', status: 'online', routes24h: 4820, avgLatencyMs: 180, costPer1k: 0.15, successRate: 98.2 },
  { id: 'a2', codename: 'Maria', role: 'Search Ops', specialty: 'Talent sourcing + matching', model: 'gpt-4o', status: 'online', routes24h: 1240, avgLatencyMs: 420, costPer1k: 5.0, successRate: 94.1 },
  { id: 'a3', codename: 'ECHO', role: 'Email Composition', specialty: 'Brand-voice email drafting', model: 'claude-3-5-sonnet', status: 'online', routes24h: 318, avgLatencyMs: 680, costPer1k: 3.0, successRate: 96.4 },
  { id: 'a4', codename: 'Amélie', role: 'Brand Governance', specialty: 'Voice + banned-word enforcement', model: 'gpt-4o-mini', status: 'online', routes24h: 318, avgLatencyMs: 90, costPer1k: 0.15, successRate: 99.8 },
  { id: 'a5', codename: 'Atlas', role: 'Delivery Ops', specialty: 'SMTP + retry + tracking', model: 'rule-engine', status: 'online', routes24h: 318, avgLatencyMs: 40, costPer1k: 0.0, successRate: 99.9 },
  { id: 'a6', codename: 'Vesta', role: 'Memory Curator', specialty: 'Long-term memory consolidation', model: 'gpt-4o-mini', status: 'idle', routes24h: 84, avgLatencyMs: 320, costPer1k: 0.15, successRate: 97.5 },
  { id: 'a7', codename: 'Orion', role: 'Proactive Engine', specialty: 'Recommendations + nudges', model: 'gpt-4o', status: 'degraded', routes24h: 642, avgLatencyMs: 510, costPer1k: 5.0, successRate: 88.3 },
];

interface RoutingRule {
  id: string;
  trigger: string;
  target: string;
  condition: string;
  enabled: boolean;
}

const ROUTING_RULES: RoutingRule[] = [
  { id: 'r1', trigger: 'user_message', target: 'Marcus', condition: 'always (entry point)', enabled: true },
  { id: 'r2', trigger: 'intent:search', target: 'Maria', condition: 'Marcus routes via intent classifier', enabled: true },
  { id: 'r3', trigger: 'intent:email_draft', target: 'ECHO', condition: 'email_request type detected', enabled: true },
  { id: 'r4', trigger: 'pre_send', target: 'Amélie', condition: 'every email before send', enabled: true },
  { id: 'r5', trigger: 'email_queued', target: 'Atlas', condition: 'after Amélie approval', enabled: true },
  { id: 'r6', trigger: 'session_end', target: 'Vesta', condition: 'consolidate memory async', enabled: true },
  { id: 'r7', trigger: 'idle_30s', target: 'Orion', condition: 'proactive suggestion', enabled: false },
];

const statusConfig: Record<string, { color: string; bg: string }> = {
  online: { color: 'text-green-600', bg: 'bg-green-50' },
  idle: { color: 'text-blue-600', bg: 'bg-blue-50' },
  offline: { color: 'text-red-600', bg: 'bg-red-50' },
  degraded: { color: 'text-amber-600', bg: 'bg-amber-50' },
};

export function AIOrchestrationPage() {
  const [tab, setTab] = useState<'agents' | 'routing' | 'telemetry'>('agents');
  const [rules, setRules] = useState(ROUTING_RULES);

  const totalRoutes = AGENTS.reduce((s, a) => s + a.routes24h, 0);
  const totalCost = AGENTS.reduce((s, a) => s + (a.routes24h / 1000) * a.costPer1k, 0);
  const onlineAgents = AGENTS.filter((a) => a.status === 'online').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Workflow className="w-6 h-6 text-indigo-600" />
            AI Orchestration
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Multi-agent routing layer (presented as unified "Nexus" to end users)
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Settings2 className="w-4 h-4" />
          Configure
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Bot className="w-3 h-3" /> Agents Online
          </div>
          <div className="text-2xl font-bold mt-1">
            {onlineAgents}/{AGENTS.length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Activity className="w-3 h-3" /> Routes (24h)
          </div>
          <div className="text-2xl font-bold mt-1">{totalRoutes.toLocaleString()}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <DollarSign className="w-3 h-3" /> Cost (24h)
          </div>
          <div className="text-2xl font-bold mt-1">${totalCost.toFixed(2)}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" /> Avg Latency
          </div>
          <div className="text-2xl font-bold mt-1">
            {Math.round(AGENTS.reduce((s, a) => s + a.avgLatencyMs, 0) / AGENTS.length)}ms
          </div>
        </Card>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {[
          { key: 'agents', label: 'Agents' },
          { key: 'routing', label: 'Routing Rules' },
          { key: 'telemetry', label: 'Telemetry' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'agents' && (
        <div className="space-y-3">
          {AGENTS.map((a) => {
            const sc = statusConfig[a.status];
            return (
              <Card key={a.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-50">
                      <Cpu className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{a.codename}</span>
                        <Badge variant="outline" className="text-[10px]">{a.role}</Badge>
                        <Badge className={`text-[10px] border-0 ${sc.bg} ${sc.color}`}>{a.status}</Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{a.specialty}</div>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500">
                        <span className="font-mono">{a.model}</span>
                        <span>· {a.routes24h.toLocaleString()} routes/24h</span>
                        <span>· {a.avgLatencyMs}ms avg</span>
                        <span>· ${a.costPer1k.toFixed(2)}/1k</span>
                        <span
                          className={
                            a.successRate >= 95
                              ? 'text-green-600'
                              : a.successRate >= 90
                                ? 'text-amber-600'
                                : 'text-red-600'
                          }
                        >
                          · {a.successRate}% success
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'routing' && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <GitBranch className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold">Routing Rules</h2>
          </div>
          <div className="space-y-2">
            {rules.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100"
              >
                <div className="flex items-center gap-3 text-sm">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <code className="text-xs bg-white px-2 py-0.5 rounded border border-gray-200">
                    {r.trigger}
                  </code>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium">{r.target}</span>
                  <span className="text-gray-500 text-xs">({r.condition})</span>
                </div>
                <button
                  onClick={() =>
                    setRules((prev) =>
                      prev.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x)),
                    )
                  }
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    r.enabled ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                      r.enabled ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'telemetry' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Success Rate by Agent</h3>
            <div className="space-y-2">
              {AGENTS.map((a) => (
                <div key={a.id} className="flex items-center gap-2">
                  <span className="w-20 text-xs text-gray-600">{a.codename}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        a.successRate >= 95 ? 'bg-green-500' : a.successRate >= 90 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${a.successRate}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-xs font-medium">{a.successRate}%</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Cost Breakdown (24h)</h3>
            <div className="space-y-2">
              {AGENTS.filter((a) => a.costPer1k > 0)
                .sort((a, b) => (b.routes24h / 1000) * b.costPer1k - (a.routes24h / 1000) * a.costPer1k)
                .map((a) => {
                  const cost = (a.routes24h / 1000) * a.costPer1k;
                  return (
                    <div key={a.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{a.codename}</span>
                      <span className="font-medium">${cost.toFixed(2)}</span>
                    </div>
                  );
                })}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-sm font-semibold">
                <span>Total</span>
                <span>${totalCost.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card className="p-4 bg-indigo-50 border-indigo-100">
        <div className="flex items-start gap-2">
          {onlineAgents === AGENTS.length ? (
            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
          )}
          <p className="text-xs text-gray-700">
            <strong>Orchestration Principle:</strong> All agents surface to end users as the single
            unified assistant "Nexus". Codenames above are internal-only and must never appear in
            user-facing copy, logs displayed in-app, or email sender fields.
          </p>
        </div>
      </Card>
    </div>
  );
}
