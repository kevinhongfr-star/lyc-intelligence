import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from './adminAuth.js';
import { selectMany, selectOne, insert, update, isSupabaseConfigured } from './supabaseRest.js';

/* ─── Prompt Registry ─── */
async function handlePrompts(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const promptId = path[1];

  try {
    if (req.method === 'GET') {
      if (promptId) {
        const prompt = await selectOne('prompt_registry', { where: [{ column: 'id', value: promptId }] });
        if (!prompt) return res.status(404).json({ error: 'Prompt not found' });
        return res.status(200).json({ success: true, prompt });
      }
      const featureKey = req.query.feature_key as string;
      const where: any[] = [];
      if (featureKey) where.push({ column: 'feature_key', value: featureKey });
      const prompts = await selectMany('prompt_registry', where.length > 0 ? { where } : {}, 50);
      return res.status(200).json({ success: true, prompts });
    }

    if (req.method === 'PUT' && promptId) {
      await update('prompt_registry', promptId, {
        ...req.body,
        updated_at: new Date().toISOString(),
        version: incrementVersion(req.body.version),
      });
      return res.status(200).json({ success: true });
    }

    if (req.method === 'POST' && promptId && path[2] === 'test') {
      const { variables } = req.body;
      const prompt = await selectOne('prompt_registry', { where: [{ column: 'id', value: promptId }] });
      if (!prompt) return res.status(404).json({ error: 'Prompt not found' });

      // Simulate LLM call
      const output = simulateLLMOutput(prompt.feature_key, variables);
      const tokensUsed = estimateTokens(output);
      const cost = calculateCost(prompt.model, tokensUsed);

      await update('prompt_registry', promptId, {
        usage_count: (prompt.usage_count || 0) + 1,
        last_used_at: new Date().toISOString(),
      });

      return res.status(200).json({
        success: true,
        output,
        tokens_used: tokensUsed,
        cost,
        qa_passed: qaCheck(output, prompt.feature_key),
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Prompts] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function incrementVersion(version: string): string {
  if (!version) return '1.1';
  const parts = version.split('.');
  const minor = parseInt(parts[1] || '0') + 1;
  return `${parts[0]}.${minor}`;
}

function simulateLLMOutput(featureKey: string, variables: any): string {
  const outputs: Record<string, string> = {
    jd_generator: `Job Description: ${variables?.position_title || 'Position'}\n\nResponsibilities:\n- Lead strategic initiatives\n- Drive cross-functional collaboration\n\nRequirements:\n- 10+ years experience\n- Strong leadership skills`,
    cv_optimizer: `Optimized CV for ${variables?.position_title || 'Role'}:\n\nSummary: Results-driven professional with extensive experience...`,
    executive_summary: `EXECUTIVE SUMMARY\n\nKey Metrics:\n- Pipeline: 12 active mandates\n- Revenue forecast: $850K\n- Team utilization: 78%`,
    shortlist_rationale: `Rationale: Candidate demonstrates strong alignment with role requirements based on...`,
    follow_up_draft: `Hi ${variables?.first_name || 'there'}, Following up on our conversation...`,
    data_query: `SELECT * FROM mandates WHERE status = 'active';`,
    flag_description: `Flag: This mandate has been in sourcing stage for 45 days without pipeline activity.`,
    outreach_message: `Hi ${variables?.first_name || 'there'}, I came across your profile...`,
    response_classifier: `Classification: interested (confidence: 0.92)`,
  };
  return outputs[featureKey] || `Generated output for ${featureKey}`;
}

function estimateTokens(text: string): number {
  return Math.ceil((text || '').length / 4);
}

function calculateCost(model: string, tokens: number): number {
  const costPer1k = model === 'deepseek_pro' ? 0.002 : 0.001;
  return Math.round((tokens / 1000) * costPer1k * 1000) / 1000;
}

function qaCheck(output: string, featureKey: string): boolean {
  if (!output || output.length < 10) return false;
  if (featureKey === 'cv_optimizer' && output.includes('hallucinated')) return false;
  if (featureKey === 'jd_generator' && !output.includes('Requirements')) return false;
  return true;
}

/* ─── Smart Search ─── */
async function handleSmartSearch(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'POST') {
      const { query } = req.body;
      const parsed = parseNLPQuery(query);

      let results: any[] = [];
      if (parsed.entity === 'candidates') {
        results = await selectMany('candidates', { where: [{ column: 'is_deleted', value: false }] }, 20);
      } else if (parsed.entity === 'mandates') {
        results = await selectMany('mandates', { where: [{ column: 'is_deleted', value: false }] }, 20);
      } else {
        results = await selectMany('organizations', { where: [{ column: 'is_deleted', value: false }] }, 20);
      }

      return res.status(200).json({
        success: true,
        parsed_intent: parsed,
        results,
        total_count: results.length,
        suggestions: generateRefinementSuggestions(parsed, results),
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[SmartSearch] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function parseNLPQuery(query: string): any {
  const q = (query || '').toLowerCase();
  let entity = 'candidates';
  const filters: Record<string, string> = {};

  if (q.includes('mandate') || q.includes('role') || q.includes('position')) entity = 'mandates';
  if (q.includes('organization') || q.includes('company') || q.includes('client')) entity = 'organizations';
  if (q.includes('consultant')) entity = 'consultants';

  if (q.includes('interview')) filters.status = 'interview';
  if (q.includes('offer')) filters.status = 'offer';
  if (q.includes('active') || q.includes('open')) filters.status = 'active';

  const industryMatch = q.match(/(manufacturing|finance|tech|healthcare|retail)/);
  if (industryMatch) filters.industry = industryMatch[1];

  const locationMatch = q.match(/in (\w+)/);
  if (locationMatch) filters.location = locationMatch[1];

  return { entity, filters, sort: { field: 'created_at', direction: 'desc' }, limit: 20 };
}

function generateRefinementSuggestions(parsed: any, results: any[]): string[] {
  const suggestions: string[] = [];
  if (results.length > 10) suggestions.push('Try adding more specific filters to narrow results');
  if (results.length === 0) suggestions.push('No results found. Try broadening your search criteria');
  if (!parsed.filters.industry) suggestions.push(`Add an industry filter (e.g., "in manufacturing")`);
  return suggestions;
}

/* ─── Cost Management ─── */
const COST_LIMITS = {
  daily_budget_rmb: 50,
  per_task_max_rmb: 5,
  monthly_budget_rmb: 1500,
  alert_threshold: 0.8,
};

async function handleLLMCosts(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const action = path[1];

  try {
    if (req.method === 'GET' && action === 'overview') {
      const period = req.query.period as string || 'today';
      const tasks = await selectMany('tasks', { where: [{ column: 'status', value: 'completed' }] });

      let totalCost = 0;
      const byModel: Record<string, number> = {};
      const byFeature: Record<string, number> = {};

      for (const t of tasks) {
        const cost = t.cost?.total_cny || 0;
        totalCost += cost;
        const model = t.metadata?.model || 'deepseek_flash';
        byModel[model] = (byModel[model] || 0) + cost;
        const feature = t.metadata?.feature_key || 'unknown';
        byFeature[feature] = (byFeature[feature] || 0) + cost;
      }

      return res.status(200).json({
        success: true,
        period,
        daily_cost: Math.round(totalCost * 100) / 100,
        monthly_cost: Math.round(totalCost * 100) / 100,
        by_model: byModel,
        by_feature: byFeature,
        budget_remaining: Math.round((COST_LIMITS.monthly_budget_rmb - totalCost) * 100) / 100,
        budget_used_pct: Math.round((totalCost / COST_LIMITS.monthly_budget_rmb) * 1000) / 10,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[LLMCosts] Error:', err);
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
    case 'prompts':
      return handlePrompts(req, res);
    case 'search':
      return handleSmartSearch(req, res);
    case 'costs':
      return handleLLMCosts(req, res);
    default:
      return res.status(404).json({ error: `Unknown resource: /api/v13/${resource}` });
  }
}