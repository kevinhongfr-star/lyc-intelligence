/**
 * FeatureFlagsPage.tsx — Feature Flag Management
 * Dynamic feature rollout, gradual percentage-based rollout
 */
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  ToggleLeft,
  ToggleRight,
  Plus,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  environments: string[];
  targetRoles?: string[];
  createdAt: string;
  updatedAt: string;
}

export function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', enabled: false, rolloutPercentage: 0 });

  useEffect(() => {
    fetchFlags();
  }, []);

  async function fetchFlags() {
    setLoading(true);
    try {
      const res = await fetch('/api/feature-flags/flags');
      const data = await res.json();
      setFlags(data.flags || []);
    } catch (e) {
      console.error('Failed to load feature flags', e);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFlag(id: string, enabled: boolean) {
    const res = await fetch(`/api/feature-flags/flags/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    if (res.ok) fetchFlags();
  }

  async function updateRollout(id: string, percentage: number) {
    const res = await fetch(`/api/feature-flags/flags/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rolloutPercentage: percentage }),
    });
    if (res.ok) fetchFlags();
  }

  async function createFlag(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/feature-flags/flags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm({ name: '', description: '', enabled: false, rolloutPercentage: 0 });
      fetchFlags();
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-gray-100 rounded w-1/3 animate-pulse" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Feature Flags</h1>
          <p className="text-sm text-gray-500 mt-1">Manage feature rollouts and A/B testing</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Flag
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg"><Settings className="w-5 h-5 text-blue-600" /></div>
          <div>
            <div className="text-2xl font-bold">{flags.length}</div>
            <div className="text-xs text-gray-500">Total Flags</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>
          <div>
            <div className="text-2xl font-bold">{flags.filter(f => f.enabled).length}</div>
            <div className="text-xs text-gray-500">Enabled</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-lg"><TrendingUp className="w-5 h-5 text-amber-600" /></div>
          <div>
            <div className="text-2xl font-bold">{flags.filter(f => f.rolloutPercentage < 100 && f.enabled).length}</div>
            <div className="text-xs text-gray-500">Partial Rollout</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-gray-50 rounded-lg"><XCircle className="w-5 h-5 text-gray-600" /></div>
          <div>
            <div className="text-2xl font-bold">{flags.filter(f => !f.enabled).length}</div>
            <div className="text-xs text-gray-500">Disabled</div>
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        {flags.map(flag => (
          <Card key={flag.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${flag.enabled ? 'bg-green-50' : 'bg-gray-50'}`}>
                  {flag.enabled ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-gray-500" />}
                </div>
                <div>
                  <div className="font-medium text-sm">{flag.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{flag.description}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    {flag.environments.map(e => (
                      <Badge key={e} variant="outline" className="text-[10px]">{e}</Badge>
                    ))}
                    {flag.targetRoles?.map(r => (
                      <Badge key={r} className="text-[10px] bg-blue-50 text-blue-700">{r}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-semibold">{flag.rolloutPercentage}%</div>
                  <div className="text-[10px] text-gray-500">Rollout</div>
                </div>
                <button
                  onClick={() => toggleFlag(flag.id, !flag.enabled)}
                  className="p-1.5 hover:bg-gray-100 rounded"
                >
                  {flag.enabled ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
            </div>

            {flag.enabled && flag.rolloutPercentage < 100 && (
              <div className="mt-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={flag.rolloutPercentage}
                  onChange={e => updateRollout(flag.id, parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 space-y-4">
            <h3 className="font-medium">Create Feature Flag</h3>
            <form onSubmit={createFlag} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Rollout Percentage</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={form.rolloutPercentage}
                  onChange={e => setForm({ ...form, rolloutPercentage: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-right text-sm font-medium">{form.rolloutPercentage}%</div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Enabled</span>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, enabled: !form.enabled })}
                >
                  {form.enabled ? <ToggleRight className="w-6 h-6 text-green-600" /> : <ToggleLeft className="w-6 h-6 text-gray-400" />}
                </button>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
