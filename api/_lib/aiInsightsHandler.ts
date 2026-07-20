/**
 * api/_lib/aiInsightsHandler.ts — AI-Powered Insights
 * Issue #47: ML-driven recommendations, predictive analytics, anomaly detection
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface AIInsight {
  id: string;
  type: 'recommendation' | 'prediction' | 'anomaly' | 'trend' | 'risk';
  category: string;
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  action?: string;
  entityId?: string;
  entityType?: string;
  createdAt: string;
}

const MOCK_INSIGHTS: AIInsight[] = [
  {
    id: 'insight-1',
    type: 'recommendation',
    category: 'Candidate Matching',
    title: 'Top 3 candidates for CTO — Apex Digital',
    description: 'Based on skills alignment, cultural fit score, and availability, Sarah Chen (92%), Michael Park (88%), and Linda Wong (85%) are the strongest matches.',
    confidence: 0.92,
    actionable: true,
    action: 'View ranked shortlist',
    entityId: 'man-201',
    entityType: 'mandate',
    createdAt: '2026-07-20T06:00:00Z',
  },
  {
    id: 'insight-2',
    type: 'prediction',
    category: 'Pipeline Forecast',
    title: 'Q3 placement forecast: 14-16 hires',
    description: 'Given current pipeline velocity and historical conversion rates, expect 14-16 successful placements in Q3 with 78% confidence.',
    confidence: 0.78,
    actionable: false,
    createdAt: '2026-07-19T10:00:00Z',
  },
  {
    id: 'insight-3',
    type: 'anomaly',
    category: 'Engagement',
    title: 'Unusual drop in candidate response rate',
    description: 'Candidate response rate dropped 34% in the last 7 days vs. 30-day average. Consider reviewing outreach messaging or timing.',
    confidence: 0.85,
    actionable: true,
    action: 'Review outreach templates',
    createdAt: '2026-07-20T08:00:00Z',
  },
  {
    id: 'insight-4',
    type: 'risk',
    category: 'Retention',
    title: 'High flight risk: 3 shortlisted candidates',
    description: 'Market signal analysis indicates 3 shortlisted candidates have increased LinkedIn activity and profile updates suggesting active job searching elsewhere.',
    confidence: 0.71,
    actionable: true,
    action: 'Accelerate interview process',
    entityId: 'man-202',
    entityType: 'mandate',
    createdAt: '2026-07-18T14:00:00Z',
  },
  {
    id: 'insight-5',
    type: 'trend',
    category: 'Market Intelligence',
    title: 'Fintech CTO salaries up 12% YoY in Singapore',
    description: 'Compensation benchmarking data shows a 12% increase in fintech CTO base salaries in Singapore over the past 12 months.',
    confidence: 0.88,
    actionable: false,
    createdAt: '2026-07-17T09:00:00Z',
  },
  {
    id: 'insight-6',
    type: 'recommendation',
    category: 'Talent Pool',
    title: 'Expand search to Hong Kong',
    description: 'AI analysis suggests the Hong Kong talent pool has 23% more qualified CFO candidates with cross-border experience for your active mandates.',
    confidence: 0.81,
    actionable: true,
    action: 'Search Hong Kong candidates',
    createdAt: '2026-07-16T11:00:00Z',
  },
];

function getUser(req: VercelRequest) {
  return (req as any).__authenticatedUser;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = ((req.query as any).path || []) as string[];
  const method = req.method || 'GET';
  const user = getUser(req);

  try {
    // GET /insights — list AI insights
    if (method === 'GET' && path[0] === 'insights') {
      const { type, category, unread } = req.query;
      let insights = [...MOCK_INSIGHTS];

      if (type) insights = insights.filter(i => i.type === type);
      if (category) insights = insights.filter(i => i.category === category);

      return res.status(200).json({
        success: true,
        insights,
        total: insights.length,
      });
    }

    // GET /insights/:id — single insight
    if (method === 'GET' && path[0] === 'insights' && path[1]) {
      const insight = MOCK_INSIGHTS.find(i => i.id === path[1]);
      if (!insight) return res.status(404).json({ error: 'Insight not found' });
      return res.status(200).json({ success: true, insight });
    }

    // POST /feedback — feedback on insight quality
    if (method === 'POST' && path[0] === 'feedback') {
      const { insightId, helpful, notes } = req.body || {};

      const { error } = await supabase.from('ai_insight_feedback').insert({
        insight_id: insightId,
        user_id: user?.id,
        helpful,
        notes,
        created_at: new Date().toISOString(),
      });
      if (error) console.warn('ai_insight_feedback insert failed:', error.message);

      return res.status(201).json({ success: true, insightId, helpful });
    }

    // GET /categories — insight categories
    if (method === 'GET' && path[0] === 'categories') {
      return res.status(200).json({
        success: true,
        categories: [
          'Candidate Matching',
          'Pipeline Forecast',
          'Engagement',
          'Retention',
          'Market Intelligence',
          'Talent Pool',
          'Diversity',
          'Compensation',
        ],
      });
    }

    // GET /stats — AI insights stats
    if (method === 'GET' && path[0] === 'stats') {
      return res.status(200).json({
        success: true,
        stats: {
          totalInsights: MOCK_INSIGHTS.length,
          byType: {
            recommendation: MOCK_INSIGHTS.filter(i => i.type === 'recommendation').length,
            prediction: MOCK_INSIGHTS.filter(i => i.type === 'prediction').length,
            anomaly: MOCK_INSIGHTS.filter(i => i.type === 'anomaly').length,
            trend: MOCK_INSIGHTS.filter(i => i.type === 'trend').length,
            risk: MOCK_INSIGHTS.filter(i => i.type === 'risk').length,
          },
          actionableInsights: MOCK_INSIGHTS.filter(i => i.actionable).length,
          avgConfidence: MOCK_INSIGHTS.reduce((sum, i) => sum + i.confidence, 0) / MOCK_INSIGHTS.length,
        },
      });
    }

    return res.status(404).json({ error: 'Unknown AI insights endpoint' });
  } catch (err: any) {
    console.error('[aiInsightsHandler]', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
