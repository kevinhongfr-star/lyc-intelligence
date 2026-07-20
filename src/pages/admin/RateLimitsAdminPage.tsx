/**
 * RateLimitsAdminPage.tsx — API Rate Limit Management
 * Monitor and configure API rate limiting
 */
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Gauge,
  TrendingUp,
  Shield,
  AlertTriangle,
  Edit3,
  RefreshCw,
} from 'lucide-react';

interface RateLimitConfig {
  id: string;
  name: string;
  bucketSize: number;
  refillRate: number;
  windowSeconds: number;
  description: string;
  currentUsage: number;
  peakUsage: number;
  status: 'normal' | 'warning' | 'critical';
}

const MOCK_CONFIGS: RateLimitConfig[] = [
  { id: 'api', name: 'API General', bucketSize: 1000, refillRate: 100, windowSeconds: 3600, description: 'General API requests', currentUsage: 234, peakUsage: 890, status: 'normal' },
  { id: 'search', name: 'Search', bucketSize: 200, refillRate: 20, windowSeconds: 300, description: 'Search queries', currentUsage: 189, peakUsage: 195, status: 'warning' },
  { id: 'auth', name: 'Authentication', bucketSize: 50, refillRate: 5, windowSeconds: 900, description: 'Login attempts', currentUsage: 12, peakUsage: 34, status: 'normal' },
  { id: 'write', name: 'Write Operations', bucketSize: 500, refillRate: 50, windowSeconds: 3600, description: 'Create/update operations', currentUsage: 456, peakUsage: 490, status: 'warning' },
  { id: 'public', name: 'Public API', bucketSize: 5000, refillRate: 500, windowSeconds: 3600, description: 'Public endpoints', currentUsage: 1234, peakUsage: 4500, status: 'normal' },
  { id: 'webhook', name: 'Webhooks', bucketSize: 100, refillRate: 10, windowSeconds: 60, description: 'Webhook deliveries', currentUsage: 45, peakUsage: 98, status: 'critical' },
];

const statusColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  normal: { bg: 'bg-green-100', text: 'text-green-700', icon: <Shield className="w-4 h-4" /> },
  warning: { bg: 'bg-amber-100', text: 'text-amber-700', icon: <AlertTriangle className="w-4 h-4" /> },
  critical: { bg: 'bg-red-100', text: 'text-red-700', icon: <AlertTriangle className="w-4 h-4" /> },
};

export function RateLimitsAdminPage() {
  const [configs, setConfigs] = useState<RateLimitConfig[]>(MOCK_CONFIGS);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  function refresh() {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  }

  function getUsagePercent(c: RateLimitConfig) {
    return Math.round((c.currentUsage / c.bucketSize) * 100);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">API Rate Limits</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor and configure API rate limiting</p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg"><Gauge className="w-5 h-5 text-blue-600" /></div>
          <div>
            <div className="text-2xl font-bold">{configs.length}</div>
            <div className="text-xs text-gray-500">Rate Limit Groups</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg"><Shield className="w-5 h-5 text-green-600" /></div>
          <div>
            <div className="text-2xl font-bold">{configs.filter(c => c.status === 'normal').length}</div>
            <div className="text-xs text-gray-500">Normal</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-lg"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>
          <div>
            <div className="text-2xl font-bold">{configs.filter(c => c.status === 'warning').length}</div>
            <div className="text-xs text-gray-500">Warning</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-lg"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
          <div>
            <div className="text-2xl font-bold">{configs.filter(c => c.status === 'critical').length}</div>
            <div className="text-xs text-gray-500">Critical</div>
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        {configs.map(c => {
          const status = statusColors[c.status];
          const percent = getUsagePercent(c);
          return (
            <Card key={c.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${status.bg}`}>
                    {status.icon}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{c.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{c.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className={`${status.bg} ${status.text}`}>
                    {c.status}
                  </Badge>
                  <button
                    onClick={() => setEditing(editing === c.id ? null : c.id)}
                    className="p-1.5 hover:bg-gray-100 rounded"
                  >
                    <Edit3 className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Usage: {c.currentUsage} / {c.bucketSize}</span>
                  <span>Peak: {c.peakUsage}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      percent > 80 ? 'bg-red-500' : percent > 60 ? 'bg-amber-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-4 text-center text-xs">
                <div className="bg-gray-50 rounded p-2">
                  <div className="font-semibold">{c.bucketSize}</div>
                  <div className="text-gray-500">Bucket Size</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="font-semibold">{c.refillRate}/min</div>
                  <div className="text-gray-500">Refill Rate</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="font-semibold">{c.windowSeconds / 60} min</div>
                  <div className="text-gray-500">Window</div>
                </div>
              </div>

              {editing === c.id && (
                <div className="mt-4 border-t pt-4 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-medium text-gray-600 block">Bucket Size</label>
                      <input type="number" defaultValue={c.bucketSize} className="w-full border rounded px-2 py-1 text-xs" />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-600 block">Refill Rate</label>
                      <input type="number" defaultValue={c.refillRate} className="w-full border rounded px-2 py-1 text-xs" />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-600 block">Window (sec)</label>
                      <input type="number" defaultValue={c.windowSeconds} className="w-full border rounded px-2 py-1 text-xs" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                    <Button size="sm" onClick={() => setEditing(null)}>Save</Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
