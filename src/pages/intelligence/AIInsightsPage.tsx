/**
 * AIInsightsPage.tsx — Issue #47
 * ML-driven recommendations, predictive analytics, anomaly detection
 */
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Target,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Filter,
  ChevronDown,
  BarChart3,
  ShieldAlert,
} from 'lucide-react';

interface AIInsight {
  id: string;
  type: 'recommendation' | 'prediction' | 'anomaly' | 'trend' | 'risk';
  category: string;
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  action?: string;
  createdAt: string;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  recommendation: { icon: <Lightbulb className="w-4 h-4" />, color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Recommendation' },
  prediction: { icon: <Target className="w-4 h-4" />, color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Prediction' },
  anomaly: { icon: <AlertTriangle className="w-4 h-4" />, color: 'bg-red-50 text-red-700 border-red-200', label: 'Anomaly' },
  trend: { icon: <TrendingUp className="w-4 h-4" />, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Trend' },
  risk: { icon: <ShieldAlert className="w-4 h-4" />, color: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Risk' },
};

export function AIInsightsPage() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [insightsRes, statsRes, catRes] = await Promise.all([
        fetch('/api/ai-insights/insights').then(r => r.json()),
        fetch('/api/ai-insights/stats').then(r => r.json()),
        fetch('/api/ai-insights/categories').then(r => r.json()),
      ]);
      setInsights(insightsRes.insights || []);
      setStats(statsRes.stats || null);
      setCategories(catRes.categories || []);
    } catch (e) {
      console.error('Failed to load AI insights', e);
    } finally {
      setLoading(false);
    }
  }

  async function sendFeedback(insightId: string, helpful: boolean) {
    await fetch('/api/ai-insights/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ insightId, helpful }),
    });
  }

  const filteredInsights = insights.filter(i => {
    if (filterType && i.type !== filterType) return false;
    if (filterCategory && i.category !== filterCategory) return false;
    return true;
  });

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
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            AI-Powered Insights
          </h1>
          <p className="text-sm text-gray-500 mt-1">ML-driven recommendations, predictions, and anomalies</p>
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2">
          <Filter className="w-4 h-4" />
          Filter
          <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg"><Brain className="w-5 h-5 text-purple-600" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.totalInsights}</div>
              <div className="text-xs text-gray-500">Total Insights</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg"><Zap className="w-5 h-5 text-amber-600" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.actionableInsights}</div>
              <div className="text-xs text-gray-500">Actionable</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg"><BarChart3 className="w-5 h-5 text-blue-600" /></div>
            <div>
              <div className="text-2xl font-bold">{(stats.avgConfidence * 100).toFixed(0)}%</div>
              <div className="text-xs text-gray-500">Avg Confidence</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.byType?.prediction || 0}</div>
              <div className="text-xs text-gray-500">Predictions</div>
            </div>
          </Card>
        </div>
      )}

      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Type</label>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Types</option>
                <option value="recommendation">Recommendation</option>
                <option value="prediction">Prediction</option>
                <option value="anomaly">Anomaly</option>
                <option value="trend">Trend</option>
                <option value="risk">Risk</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Category</label>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setFilterType(''); setFilterCategory(''); }}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Clear filters
              </button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {filteredInsights.map(insight => {
          const config = typeConfig[insight.type];
          return (
            <Card key={insight.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg border ${config.color}`}>
                    {config.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{insight.title}</span>
                      <Badge variant="outline" className="text-[10px]">{insight.category}</Badge>
                      <Badge className={`text-[10px] ${config.color}`}>{config.label}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{insight.description}</p>

                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1">
                        <BarChart3 className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          Confidence: {(insight.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(insight.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {insight.actionable && insight.action && (
                      <div className="mt-3">
                        <Button size="sm" className="gap-1">
                          <Zap className="w-3 h-3" />
                          {insight.action}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 ml-4">
                  <button
                    onClick={() => sendFeedback(insight.id, true)}
                    className="p-1.5 hover:bg-gray-100 rounded"
                    title="Helpful"
                  >
                    <ThumbsUp className="w-4 h-4 text-gray-400 hover:text-green-600" />
                  </button>
                  <button
                    onClick={() => sendFeedback(insight.id, false)}
                    className="p-1.5 hover:bg-gray-100 rounded"
                    title="Not helpful"
                  >
                    <ThumbsDown className="w-4 h-4 text-gray-400 hover:text-red-600" />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
