/**
 * WebPerformancePage.tsx — Core Web Vitals Monitoring
 * Performance metrics, LCP, FID, CLS, and optimization suggestions
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Zap,
  Clock,
  Activity,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileCode,
  Image,
  Database,
} from 'lucide-react';

interface Metric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'needs_improvement' | 'poor';
  trend: 'up' | 'down' | 'stable';
  description: string;
}

interface PagePerformance {
  url: string;
  lcp: number;
  fid: number;
  cls: number;
  status: 'good' | 'needs_improvement' | 'poor';
  visits: number;
}

const METRICS: Metric[] = [
  { id: 'lcp', name: 'Largest Contentful Paint', value: 2.4, unit: 's', status: 'good', trend: 'up', description: 'Time to render largest content element' },
  { id: 'fid', name: 'First Input Delay', value: 85, unit: 'ms', status: 'good', trend: 'stable', description: 'Time to respond to first user input' },
  { id: 'cls', name: 'Cumulative Layout Shift', value: 0.12, unit: '', status: 'good', trend: 'down', description: 'Unexpected layout shifts during page load' },
  { id: 'tbt', name: 'Total Blocking Time', value: 120, unit: 'ms', status: 'needs_improvement', trend: 'up', description: 'Total time main thread is blocked' },
  { id: 'ttfb', name: 'Time to First Byte', value: 340, unit: 'ms', status: 'needs_improvement', trend: 'stable', description: 'Time from request to first byte' },
];

const PAGES: PagePerformance[] = [
  { url: '/dashboard', lcp: 1.8, fid: 56, cls: 0.08, status: 'good', visits: 12400 },
  { url: '/candidate/profile', lcp: 2.8, fid: 98, cls: 0.15, status: 'needs_improvement', visits: 8900 },
  { url: '/mandates', lcp: 3.2, fid: 110, cls: 0.18, status: 'poor', visits: 6500 },
  { url: '/search', lcp: 2.1, fid: 72, cls: 0.1, status: 'good', visits: 4200 },
  { url: '/client/portal', lcp: 2.6, fid: 88, cls: 0.12, status: 'good', visits: 2100 },
];

const OPTIMIZATIONS = [
  { id: 'o1', title: 'Optimize Images', description: 'Compress and lazy-load images', impact: 'high', type: 'image', recommended: true },
  { id: 'o2', title: 'Bundle Optimization', description: 'Code splitting and tree shaking', impact: 'high', type: 'code', recommended: true },
  { id: 'o3', title: 'Cache Strategy', description: 'Improve cache headers for static assets', impact: 'medium', type: 'cache', recommended: true },
  { id: 'o4', title: 'Third-Party Scripts', description: 'Audit and defer non-critical scripts', impact: 'medium', type: 'code', recommended: false },
  { id: 'o5', title: 'Server-Side Rendering', description: 'Implement SSR for key pages', impact: 'high', type: 'code', recommended: false },
];

const statusColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  good: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle2 className="w-4 h-4" /> },
  needs_improvement: { bg: 'bg-amber-100', text: 'text-amber-700', icon: <AlertTriangle className="w-4 h-4" /> },
  poor: { bg: 'bg-red-100', text: 'text-red-700', icon: <AlertTriangle className="w-4 h-4" /> },
};

export function WebPerformancePage() {
  const [loading, setLoading] = useState(false);

  function refresh() {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  }

  const goodCount = METRICS.filter(m => m.status === 'good').length;
  const avgLCP = METRICS.find(m => m.id === 'lcp')?.value || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Web Performance</h1>
          <p className="text-sm text-gray-500 mt-1">Core Web Vitals and optimization insights</p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg"><Zap className="w-5 h-5 text-blue-600" /></div>
          <div>
            <div className="text-2xl font-bold">{goodCount}/{METRICS.length}</div>
            <div className="text-xs text-gray-500">Good Scores</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg"><Clock className="w-5 h-5 text-green-600" /></div>
          <div>
            <div className="text-2xl font-bold">{avgLCP}s</div>
            <div className="text-xs text-gray-500">Avg LCP</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg"><Activity className="w-5 h-5 text-purple-600" /></div>
          <div>
            <div className="text-2xl font-bold">0.12</div>
            <div className="text-xs text-gray-500">Avg CLS</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-lg"><TrendingUp className="w-5 h-5 text-amber-600" /></div>
          <div>
            <div className="text-2xl font-bold">85ms</div>
            <div className="text-xs text-gray-500">Avg FID</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-medium mb-3">Core Web Vitals</h2>
          <div className="space-y-3">
            {METRICS.map(m => {
              const status = statusColors[m.status];
              return (
                <Card key={m.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{m.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{m.description}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xl font-bold">{m.value}{m.unit}</div>
                        <div className="flex items-center gap-1 text-xs">
                          {m.trend === 'up' ? <TrendingUp className="w-3 h-3 text-green-500" /> :
                           m.trend === 'down' ? <TrendingDown className="w-3 h-3 text-red-500" /> : null}
                          <span className="text-gray-500">{m.trend}</span>
                        </div>
                      </div>
                      <Badge className={`${status.bg} ${status.text}`}>
                        {status.icon}
                        <span className="ml-1 capitalize">{m.status.replace('_', ' ')}</span>
                      </Badge>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-3">Page Performance</h2>
          <div className="space-y-2">
            {PAGES.map(p => {
              const status = statusColors[p.status];
              return (
                <Card key={p.url} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{p.url}</div>
                      <div className="text-xs text-gray-500">{p.visits.toLocaleString()} visits</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right text-xs">
                        <div>LCP: {p.lcp}s</div>
                        <div>FID: {p.fid}ms</div>
                        <div>CLS: {p.cls}</div>
                      </div>
                      <Badge className={`${status.bg} ${status.text}`}>
                        {status.icon}
                      </Badge>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <h2 className="text-lg font-medium mb-3 mt-6">Optimization Suggestions</h2>
          <div className="space-y-2">
            {OPTIMIZATIONS.map(o => (
              <div key={o.id} className={`p-3 rounded-lg ${o.recommended ? 'bg-blue-50' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {o.type === 'image' ? <Image className="w-4 h-4 text-gray-400" /> :
                     o.type === 'code' ? <FileCode className="w-4 h-4 text-gray-400" /> :
                     <Database className="w-4 h-4 text-gray-400" />}
                    <div>
                      <div className="text-sm font-medium">{o.title}</div>
                      <div className="text-xs text-gray-500">{o.description}</div>
                    </div>
                  </div>
                  <Badge className={o.impact === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                    {o.impact} impact
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
