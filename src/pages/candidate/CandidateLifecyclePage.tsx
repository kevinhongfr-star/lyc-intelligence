/**
 * CandidateLifecyclePage.tsx — Issue #41
 * Auto stage transitions, lifecycle rules, trigger management
 */
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  GitBranch,
  Play,
  Pause,
  Trash2,
  Plus,
  ArrowRight,
  Timer,
  Zap,
  Users,
  TrendingUp,
} from 'lucide-react';

interface LifecycleRule {
  id: string;
  name: string;
  fromStage: string;
  toStage: string;
  trigger: string;
  autoActions: string[];
  notifyRoles: string[];
  active: boolean;
}

interface CandidateStage {
  candidateId: string;
  currentStage: string;
  previousStage: string;
  daysInStage: number;
  score: number;
}

export function CandidateLifecyclePage() {
  const { user } = useAuthStore();
  const [rules, setRules] = useState<LifecycleRule[]>([]);
  const [candidates, setCandidates] = useState<CandidateStage[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    fromStage: 'screening',
    toStage: 'shortlist',
    trigger: 'score_threshold',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [rulesRes, candidatesRes, statsRes] = await Promise.all([
        fetch('/api/lifecycle/rules').then(r => r.json()),
        fetch('/api/lifecycle/candidates').then(r => r.json()),
        fetch('/api/lifecycle/stats').then(r => r.json()),
      ]);
      setRules(rulesRes.rules || []);
      setCandidates(candidatesRes.candidates || []);
      setStats(statsRes.stats || null);
    } catch (e) {
      console.error('Failed to load lifecycle data', e);
    } finally {
      setLoading(false);
    }
  }

  async function createRule(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/lifecycle/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ name: '', fromStage: 'screening', toStage: 'shortlist', trigger: 'score_threshold' });
      fetchData();
    }
  }

  async function toggleRule(id: string, active: boolean) {
    const res = await fetch(`/api/lifecycle/rules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    });
    if (res.ok) fetchData();
  }

  async function deleteRule(id: string) {
    if (!confirm('Delete this rule?')) return;
    const res = await fetch(`/api/lifecycle/rules/${id}`, { method: 'DELETE' });
    if (res.ok) fetchData();
  }

  const stageColors: Record<string, string> = {
    new: 'bg-gray-100 text-gray-700',
    screening: 'bg-blue-100 text-blue-700',
    shortlist: 'bg-indigo-100 text-indigo-700',
    interviewing: 'bg-amber-100 text-amber-700',
    offer: 'bg-emerald-100 text-emerald-700',
    hired: 'bg-green-100 text-green-700',
    on_hold: 'bg-orange-100 text-orange-700',
    archived: 'bg-slate-100 text-slate-700',
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-gray-100 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Candidate Lifecycle Automation</h1>
          <p className="text-sm text-gray-500 mt-1">Auto stage transitions and workflow rules</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Rule
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg"><Users className="w-5 h-5 text-blue-600" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.totalCandidates}</div>
              <div className="text-xs text-gray-500">Tracked Candidates</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg"><Zap className="w-5 h-5 text-emerald-600" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.autoTransitionsToday}</div>
              <div className="text-xs text-gray-500">Auto Transitions Today</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg"><Timer className="w-5 h-5 text-amber-600" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.avgDaysInStage}</div>
              <div className="text-xs text-gray-500">Avg Days in Stage</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg"><TrendingUp className="w-5 h-5 text-purple-600" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.activeRules}</div>
              <div className="text-xs text-gray-500">Active Rules</div>
            </div>
          </Card>
        </div>
      )}

      {showForm && (
        <Card className="p-4">
          <h3 className="font-medium mb-3">Create Lifecycle Rule</h3>
          <form onSubmit={createRule} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Rule name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
              required
            />
            <select
              value={form.fromStage}
              onChange={e => setForm({ ...form, fromStage: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              {['new', 'screening', 'shortlist', 'interviewing', 'offer', 'on_hold'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={form.toStage}
              onChange={e => setForm({ ...form, toStage: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              {['screening', 'shortlist', 'interviewing', 'offer', 'hired', 'on_hold', 'archived'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={form.trigger}
              onChange={e => setForm({ ...form, trigger: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="score_threshold">Score Threshold</option>
              <option value="time_based">Time Based</option>
              <option value="event_based">Event Based</option>
              <option value="manual">Manual</option>
            </select>
            <div className="md:col-span-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">Create Rule</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-gray-500" />
            Automation Rules
          </h2>
          <div className="space-y-2">
            {rules.map(rule => (
              <Card key={rule.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={rule.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                      {rule.active ? 'Active' : 'Paused'}
                    </Badge>
                    <div>
                      <div className="font-medium text-sm">{rule.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <span className={`px-1.5 py-0.5 rounded ${stageColors[rule.fromStage] || 'bg-gray-100'}`}>{rule.fromStage}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span className={`px-1.5 py-0.5 rounded ${stageColors[rule.toStage] || 'bg-gray-100'}`}>{rule.toStage}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleRule(rule.id, rule.active)}
                      className="p-1.5 hover:bg-gray-100 rounded"
                      title={rule.active ? 'Pause' : 'Activate'}
                    >
                      {rule.active ? <Pause className="w-4 h-4 text-amber-600" /> : <Play className="w-4 h-4 text-green-600" />}
                    </button>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="p-1.5 hover:bg-gray-100 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Trigger: {rule.trigger} · Actions: {rule.autoActions.join(', ')} · Notify: {rule.notifyRoles.join(', ')}
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-3">Candidates by Stage</h2>
          <div className="space-y-2">
            {candidates.map(c => (
              <Card key={c.candidateId} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">
                    {c.candidateId.slice(-3)}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{c.candidateId}</div>
                    <div className="text-xs text-gray-500">{c.daysInStage} days in stage</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${stageColors[c.currentStage] || 'bg-gray-100'}`}>
                    {c.currentStage}
                  </span>
                  <span className="text-xs text-gray-500">Score: {c.score}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
