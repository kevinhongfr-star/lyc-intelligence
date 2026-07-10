import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from './adminAuth.js';
import { selectMany, selectOne, insert, update, isSupabaseConfigured } from './supabaseRest.js';

/* ─── Scoring Calibration ─── */
const DEFAULT_WEIGHTS = {
  industry_match: 0.25,
  years_experience: 0.20,
  company_tier: 0.20,
  education: 0.15,
  skills_match: 0.15,
  language: 0.05,
};

async function suggestScoringModel(mandateType: string, industry: string, geography: string, seniority: string) {
  const sweeps = await selectMany('sweep_outcomes', {
    where: [
      { column: 'mandate_type', value: mandateType },
    ],
  });

  if (sweeps.length < 3) {
    return {
      confidence: 0.4,
      suggestion: 'INSUFFICIENT_DATA',
      note: 'Need 3+ similar sweeps for reliable calibration',
      supporting_sweeps: sweeps.length,
      default_weights: DEFAULT_WEIGHTS,
    };
  }

  const acceptedWeights: any[] = [];
  const rejectedWeights: any[] = [];

  for (const sweep of sweeps) {
    const outcome = sweep.outcome_data || {};
    const accepted = outcome.kevin_promotions || [];
    const rejected = outcome.kevin_demotions || [];
    const model = sweep.scoring_model || {};

    if (accepted.length > 0) acceptedWeights.push(model.weights || DEFAULT_WEIGHTS);
    if (rejected.length > 0) rejectedWeights.push(model.weights || DEFAULT_WEIGHTS);
  }

  const optimal = averageWeights(acceptedWeights.length > 0 ? acceptedWeights : [DEFAULT_WEIGHTS]);

  return {
    weights: optimal,
    rationale: generateRationale(optimal, sweeps),
    confidence: Math.min(sweeps.length / 10, 0.95),
    supporting_sweeps: sweeps.length,
    keyword_suggestions: suggestKeywords(sweeps, industry),
  };
}

function averageWeights(weights: any[]): any {
  const keys = Object.keys(weights[0] || DEFAULT_WEIGHTS);
  const result: Record<string, number> = {};
  for (const key of keys) {
    const sum = weights.reduce((s, w) => s + (w[key] || 0), 0);
    result[key] = Math.round((sum / weights.length) * 1000) / 1000;
  }
  return result;
}

function generateRationale(weights: any, sweeps: any[]): string {
  const topFactors = Object.entries(weights)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 3)
    .map(([k, v]) => `${k} (${Math.round((v as number) * 100)}%)`)
    .join(', ');
  return `Based on ${sweeps.length} historical sweeps. Top factors: ${topFactors}. Weights optimized for accepted candidate profile.`;
}

function suggestKeywords(sweeps: any[], industry: string): string[] {
  const keywords = new Set<string>();
  keywords.add(industry);
  for (const sweep of sweeps) {
    const metrics = sweep.input_metrics || {};
    if (metrics.keywords) {
      for (const kw of metrics.keywords) keywords.add(kw);
    }
  }
  return Array.from(keywords).slice(0, 10);
}

/* ─── Pattern Detection ─── */
async function detectPatterns() {
  const sweeps = await selectMany('sweep_outcomes', {});
  const patterns: any[] = [];

  // Geographic patterns
  const geoRates: Record<string, { total: number; responses: number }> = {};
  for (const sweep of sweeps) {
    const geo = sweep.input_metrics?.geography || 'unknown';
    const outreach = sweep.outreach_metrics || {};
    if (!geoRates[geo]) geoRates[geo] = { total: 0, responses: 0 };
    geoRates[geo].total += outreach.sent || 0;
    geoRates[geo].responses += outreach.responses || 0;
  }

  for (const [geo, data] of Object.entries(geoRates)) {
    const rate = data.total > 0 ? data.responses / data.total : 0;
    if (rate < 0.10 && data.total >= 5) {
      patterns.push({
        category: 'geographic',
        title: `${geo} outreach below 10%`,
        description: `Response rate in ${geo} is ${Math.round(rate * 100)}%. Consider adjusting approach.`,
        confidence: Math.min(data.total / 20, 0.9),
        supporting_data: { geography: geo, sent: data.total, responses: data.responses },
      });
    }
  }

  // Template patterns
  const templateRates: Record<string, { total: number; responses: number }> = {};
  for (const sweep of sweeps) {
    const template = sweep.input_metrics?.template || 'default';
    const outreach = sweep.outreach_metrics || {};
    if (!templateRates[template]) templateRates[template] = { total: 0, responses: 0 };
    templateRates[template].total += outreach.sent || 0;
    templateRates[template].responses += outreach.responses || 0;
  }

  for (const [tmpl, data] of Object.entries(templateRates)) {
    const rate = data.total > 0 ? data.responses / data.total : 0;
    if (rate > 0.35 && data.total >= 5) {
      patterns.push({
        category: 'template',
        title: `${tmpl} outperforms at ${Math.round(rate * 100)}%`,
        description: `Template "${tmpl}" has above-average response rate.`,
        confidence: Math.min(data.total / 20, 0.9),
        supporting_data: { template: tmpl, sent: data.total, responses: data.responses },
      });
    }
  }

  return patterns;
}

/* ─── Universe Validation ─── */
async function validateUniverse(mandateId: string, companies: string[]) {
  const mandate = await selectOne('mandates', { where: [{ column: 'id', value: mandateId }] });
  if (!mandate) return { error: 'Mandate not found' };

  const issues: any[] = [];
  const expansionSuggestions: string[] = [];

  // Check if companies have been used in similar mandates
  const similarMandates = await selectMany('mandates', {
    where: [
      { column: 'industry', value: mandate.industry },
      { column: 'id', value: mandateId, op: 'neq' },
    ],
  });

  const knownCompanies = new Set<string>();
  for (const m of similarMandates) {
    const outcomes = await selectMany('sweep_outcomes', { where: [{ column: 'mandate_id', value: m.id }] });
    for (const o of outcomes) {
      const companies = o.input_metrics?.target_companies || [];
      for (const c of companies) knownCompanies.add(c.toLowerCase());
    }
  }

  for (const company of companies) {
    if (!knownCompanies.has(company.toLowerCase())) {
      issues.push({ company, issue_type: 'untested', suggestion: 'No historical data for this company' });
    }
  }

  // Suggest expansion based on patterns
  const patterns = await detectPatterns();
  const geoPatterns = patterns.filter((p: any) => p.category === 'geographic');
  for (const p of geoPatterns) {
    if (p.confidence > 0.7) {
      expansionSuggestions.push(`Consider ${p.supporting_data?.geography} based on pattern: ${p.title}`);
    }
  }

  return { issues, expansion_suggestions: expansionSuggestions };
}

/* ─── API Handlers ─── */
async function handleCalibrate(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'POST') {
      const { mandate_type, industry, geography, seniority } = req.body;
      const result = await suggestScoringModel(mandate_type, industry, geography, seniority);
      return res.status(200).json({ success: true, ...result });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Calibrate] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePatterns(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      const category = req.query.category as string;
      const status = req.query.status as string || 'active';
      const where: any[] = [{ column: 'status', value: status }];
      if (category) where.push({ column: 'category', value: category });

      const storedPatterns = await selectMany('patterns', { where }, 50);

      if (storedPatterns.length === 0) {
        const detected = await detectPatterns();
        return res.status(200).json({ success: true, patterns: detected, source: 'detected' });
      }

      return res.status(200).json({ success: true, patterns: storedPatterns, source: 'database' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Patterns] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleValidate(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'POST') {
      const { mandate_id, companies } = req.body;
      if (!mandate_id || !companies) return res.status(400).json({ error: 'mandate_id and companies required' });
      const result = await validateUniverse(mandate_id, companies);
      return res.status(200).json({ success: true, ...result });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Validate] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleInsights(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const insightId = path[1];

  try {
    if (req.method === 'GET') {
      const status = req.query.status as string || 'new';
      const limit = parseInt(req.query.limit as string || '10');
      const patterns = await detectPatterns();
      const insights = patterns.slice(0, limit).map((p: any) => ({
        type: p.category,
        title: p.title,
        description: p.description,
        confidence: p.confidence,
        suggested_action: p.category === 'geographic' ? 'Adjust outreach strategy' : p.category === 'template' ? 'Scale winning template' : 'Review and optimize',
      }));
      return res.status(200).json({ success: true, insights });
    }

    if (req.method === 'POST' && insightId) {
      const { resolution } = req.body;
      return res.status(200).json({ success: true, insight_id: insightId, resolution });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Insights] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/* ─── Main Router ─── */
export async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const path = (req.query as any).path || [];
  const resource = path[0];

  switch (resource) {
    case 'calibrate-scoring':
      return handleCalibrate(req, res);
    case 'patterns':
      return handlePatterns(req, res);
    case 'validate-universe':
      return handleValidate(req, res);
    case 'insights':
      return handleInsights(req, res);
    default:
      return res.status(404).json({ error: `Unknown resource: /api/v12/${resource}` });
  }
}