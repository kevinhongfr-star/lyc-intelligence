import { VercelRequest, VercelResponse } from '@vercel/node';
import * as db from './supabaseRest.js';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

function matchesRole(roleA: string, roleB: string): boolean {
  if (!roleA || !roleB) return false;
  const a = roleA.toLowerCase();
  const b = roleB.toLowerCase();
  return a === b || a.includes(b) || b.includes(a);
}

function matchesGeo(locA: string, locB: string): boolean {
  if (!locA || !locB) return false;
  return locA.toLowerCase().includes(locB.toLowerCase()) || locB.toLowerCase().includes(locA.toLowerCase());
}

function extractSeniority(role: string): string {
  if (!role) return 'manager';
  const r = role.toLowerCase();
  if (r.includes('ceo') || r.includes('cfo') || r.includes('coo') || r.includes('c-suite') || r.includes('c suite')) return 'c_suite';
  if (r.includes('svp') || r.includes('senior vp')) return 'svp';
  if (r.includes('vp') || r.includes('vice president')) return 'vp';
  if (r.includes('director')) return 'director';
  if (r.includes('head of')) return 'head_of';
  if (r.includes('manager')) return 'manager';
  return 'individual_contributor';
}

function extractFunction(role: string): string {
  if (!role) return 'general';
  const r = role.toLowerCase();
  if (r.includes('hr') || r.includes('human resources') || r.includes('talent')) return 'human_resources';
  if (r.includes('finance') || r.includes('accounting') || r.includes('cfo')) return 'finance';
  if (r.includes('sales') || r.includes('business dev')) return 'sales';
  if (r.includes('marketing') || r.includes('brand')) return 'marketing';
  if (r.includes('operation') || r.includes('coo') || r.includes('supply chain')) return 'operations';
  if (r.includes('engineer') || r.includes('tech') || r.includes('cto') || r.includes('dev') || r.includes('software')) return 'technology';
  if (r.includes('product')) return 'product';
  return 'general';
}

async function callDeepSeek(prompt: string, options: { max_tokens?: number; temperature?: number; response_format?: any } = {}) {
  if (!DEEPSEEK_API_KEY) {
    return {
      choices: [{ message: { content: 'DeepSeek API key not configured. Intelligence generation unavailable.' } }],
      usage: { total_tokens: 0 }
    };
  }
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-v4-flash',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options.max_tokens || 800,
      temperature: options.temperature ?? 0.3,
      response_format: options.response_format,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DeepSeek error: ${res.status} ${text}`);
  }
  return await res.json();
}

async function computeCompensationBenchmark(params: {
  role: string;
  industry?: string;
  geography?: string;
  clientCurrentComp?: { base: number; bonus_pct: number; currency: string };
}) {
  const placements = await db.selectMany('contacts', {
    select: 'accepted_compensation, currency, pipeline_stage, current_role, industry, location',
    where: [
      { column: 'pipeline_stage', value: ['S17_Offer_Accepted', 'S19_Closed'], op: 'in' },
    ],
  });

  const relevant = (placements || []).filter((p: any) =>
    matchesRole(p.current_role, params.role) &&
    (!params.industry || p.industry === params.industry) &&
    (!params.geography || matchesGeo(p.location, params.geography))
  );

  const compValues = relevant
    .map((p: any) => p.accepted_compensation)
    .filter((c: any) => c != null && typeof c === 'number')
    .sort((a: number, b: number) => a - b);

  if (compValues.length < 5) {
    return {
      insufficient_data: true,
      data_points: compValues.length,
      message: 'Insufficient data for reliable benchmarking. Need at least 5 data points.',
      confidence: 'low',
    };
  }

  const percentile = (pct: number) => compValues[Math.floor(compValues.length * pct / 100)];

  const result: any = {
    insufficient_data: false,
    data_points: compValues.length,
    confidence: compValues.length >= 20 ? 'high' : compValues.length >= 10 ? 'medium' : 'low',
    base: {
      p10: percentile(10),
      p25: percentile(25),
      median: percentile(50),
      p75: percentile(75),
      p90: percentile(90),
    },
  };

  if (params.clientCurrentComp) {
    const clientBase = params.clientCurrentComp.base;
    const marketMedian = result.base.median;
    const gapPct = Math.round(((clientBase - marketMedian) / marketMedian) * 100);
    result.gap_analysis = {
      client_base: clientBase,
      market_median: marketMedian,
      gap_percent: gapPct,
      position: gapPct > 10 ? 'above_market' : gapPct > -10 ? 'at_market' : 'below_market',
      attrition_risk: gapPct < -20 ? 'high' : gapPct < -10 ? 'medium' : 'low',
      recommendation: gapPct < -10
        ? `Compensation is ${Math.abs(gapPct)}% below market. Consider adjusting to reduce attrition risk.`
        : gapPct > 10
        ? `Compensation is ${gapPct}% above market. Review if premium is justified.`
        : 'Compensation is aligned with market.',
    };
  }

  return result;
}

async function selectTalentRadar(params: {
  industrySectors: string[];
  jobFunctions: string[];
  geographies: string[];
  count?: number;
  clientId?: string;
}) {
  const count = params.count || 10;

  const where: any[] = [
    { column: 'is_archived', value: false },
    { column: 'career_tier', value: ['ALPHA', 'BETA'], op: 'in' },
  ];

  if (params.industrySectors && params.industrySectors.length > 0) {
    where.push({ column: 'industry', value: params.industrySectors, op: 'in' });
  }

  const candidates = await db.selectMany('contacts', {
    select: 'id, full_name, industry, current_role, location, skills, years_experience, career_tier, engagement_score, movement_signals, trident_scores',
    where,
    orderBy: { column: 'engagement_score', ascending: false },
    limit: count * 3,
  });

  if (!candidates || candidates.length === 0) return [];

  const scored = candidates.map((c: any) => {
    let score = 0;
    score += (c.engagement_score || 0) * 0.3;
    score += (c.trident_scores?.overall || c.trident_scores?.capability || 50) * 0.3;
    score += ((c.movement_signals?.length || 0) > 0 ? 20 : 0);
    score += (c.career_tier === 'ALPHA' ? 20 : 10);
    return { ...c, radar_score: score };
  }).sort((a: any, b: any) => b.radar_score - a.radar_score);

  const selected = scored.slice(0, count);
  const anonymized = [];

  for (const candidate of selected) {
    let anonProfile = await db.selectOne('anonymized_talent_profiles', {
      column: 'real_contact_id',
      value: candidate.id,
      select: '*',
    });

    if (!anonProfile) {
      const totalCount = await db.countRows('anonymized_talent_profiles', {});

      const nextIndex = (totalCount || 0) + 1;
      let nextLabel;
      if (nextIndex <= 26) {
        nextLabel = `Profile ${String.fromCharCode(64 + nextIndex)}`;
      } else {
        const first = String.fromCharCode(64 + Math.ceil(nextIndex / 26));
        const second = String.fromCharCode(64 + ((nextIndex - 1) % 26) + 1);
        nextLabel = `Profile ${first}${second}`;
      }

      anonProfile = await db.insert('anonymized_talent_profiles', {
        real_contact_id: candidate.id,
        anonymized_label: nextLabel,
        industry: candidate.industry,
        function_field: extractFunction(candidate.current_role),
        seniority_level: extractSeniority(candidate.current_role),
        geography: candidate.location,
        years_experience: candidate.years_experience,
        key_skills: candidate.skills || [],
        trident_capability: candidate.trident_scores?.capability,
        trident_overall: candidate.trident_scores?.overall || candidate.trident_scores?.capability,
        career_tier: candidate.career_tier,
        engagement_score: candidate.engagement_score,
        movement_signal_count: candidate.movement_signals?.length || 0,
      });
    } else {
      const updated = await db.update('anonymized_talent_profiles',
        { column: 'id', value: anonProfile.id },
        {
          trident_capability: candidate.trident_scores?.capability,
          trident_overall: candidate.trident_scores?.overall || candidate.trident_scores?.capability,
          career_tier: candidate.career_tier,
          engagement_score: candidate.engagement_score,
          movement_signal_count: candidate.movement_signals?.length || 0,
          last_updated_at: new Date().toISOString(),
        }
      );
      anonProfile = updated[0];
    }

    anonymized.push({
      label: anonProfile.anonymized_label,
      seniority: anonProfile.seniority_level,
      geography: anonProfile.geography,
      industry: anonProfile.industry,
      experience: anonProfile.years_experience,
      key_skills: anonProfile.key_skills,
      engagement_tier: anonProfile.career_tier,
      has_movement_signals: anonProfile.movement_signal_count > 0,
      trident_overall: anonProfile.trident_overall,
    });
  }

  return anonymized;
}

async function generateQuarterlyReport(params: {
  clientId: string;
  clientName: string;
  industrySectors: string[];
  jobFunctions: string[];
  geographies: string[];
  periodStart: Date;
  periodEnd: Date;
}) {
  const { clientId, industrySectors, jobFunctions, geographies, periodStart, periodEnd } = params;
  const startTime = Date.now();

  const activeCandidates = await db.countRows('contacts', {
    where: [
      { column: 'is_archived', value: false },
      { column: 'industry', value: industrySectors, op: 'in' },
    ],
  });

  const newEntrants = await db.countRows('contacts', {
    where: [
      { column: 'is_archived', value: false },
      { column: 'industry', value: industrySectors, op: 'in' },
      { column: 'created_at', value: periodStart.toISOString(), op: 'gte' },
      { column: 'created_at', value: periodEnd.toISOString(), op: 'lte' },
    ],
  });

  const activeMandates = await db.countRows('mandates', {
    where: [
      { column: 'status', value: ['active', 'in_progress'], op: 'in' },
      { column: 'industry', value: industrySectors, op: 'in' },
    ],
  });

  const compData = await computeCompensationBenchmark({
    role: jobFunctions[0] || 'manager',
    industry: industrySectors[0],
    geography: geographies[0],
  });

  const radarProfiles = await selectTalentRadar({
    industrySectors,
    jobFunctions,
    geographies,
    count: 10,
    clientId,
  });

  const dataSources = [
    { source: 'placement_data', data_points: compData.data_points || 0, confidence: compData.confidence || 'low' },
    { source: 'candidate_pool', data_points: activeCandidates || 0, confidence: activeCandidates >= 50 ? 'high' : activeCandidates >= 20 ? 'medium' : 'low' },
    { source: 'mandate_data', data_points: activeMandates || 0, confidence: 'high' },
    { source: 'talent_radar', data_points: radarProfiles.length, confidence: radarProfiles.length >= 8 ? 'high' : radarProfiles.length >= 5 ? 'medium' : 'low' },
  ];

  const overallConfidence = dataSources.every((d: any) => d.confidence === 'high')
    ? 'high'
    : dataSources.some((d: any) => d.confidence === 'low')
    ? 'low'
    : 'medium';

  const narrativePrompt = `You are LYC Intelligence's strategic talent advisor. Generate a Quarterly Talent Landscape Report executive summary.

Client Industry: ${industrySectors.join(', ')}
Key Functions: ${jobFunctions.join(', ')}
Geographies: ${geographies.join(', ')}
Period: ${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}

DATA SUMMARY:
1. Supply & Demand:
   - Active candidates in market: ${activeCandidates || 0}
   - New entrants this quarter: ${newEntrants || 0}
   - Active mandates: ${activeMandates || 0}
   - Net supply trend: ${(newEntrants || 0) > 5 ? 'Growing' : 'Stable'}

2. Compensation:
   - Data points: ${compData.data_points || 0}
   - Confidence: ${compData.confidence || 'low'}
   - Median: ${compData.base?.median || 'N/A'}
   - P25-P75 range: ${compData.base?.p25 || 'N/A'} - ${compData.base?.p75 || 'N/A'}

3. Talent Radar:
   - ${radarProfiles.length} anonymized top profiles selected
   - Top skills: ${[...new Set(radarProfiles.flatMap((p: any) => p.key_skills || []))].slice(0, 5).join(', ') || 'Various'}

Generate a professional executive summary with:
1. Market overview (3-4 sentences)
2. 3 key findings
3. 2 strategic recommendations

Tone: Professional, data-driven, like a McKinsey analyst. NOT a recruiter pitch.
Include confidence levels. Total: 300-500 words.`;

  let narrative = `Q${Math.ceil(periodEnd.getMonth() / 3)} ${periodEnd.getFullYear()} Talent Landscape Report for ${params.clientName}. 

Market Overview: The ${industrySectors.join(', ')} talent market shows ${activeCandidates && activeCandidates > 50 ? 'healthy supply' : 'moderate supply'} with ${newEntrants || 0} new entrants this quarter. Demand remains ${activeMandates && activeMandates > 5 ? 'strong' : 'steady'} with ${activeMandates || 0} active mandates.

Key Findings:
1. Talent supply is ${(newEntrants || 0) > 5 ? 'growing' : 'stable'} — ${activeCandidates || 0} professionals active in the market
2. Compensation: ${compData.insufficient_data ? 'Insufficient benchmark data for this segment' : `Median ${compData.base?.median}, confidence: ${compData.confidence}`}
3. Talent Radar identified ${radarProfiles.length} high-potential professionals for outreach

Strategic Recommendations:
1. ${radarProfiles.length > 5 ? 'Leverage Talent Radar to engage high-potential passive candidates' : 'Build talent pipeline through targeted sourcing'}
2. ${compData.confidence === 'high' ? 'Use compensation benchmarks to inform offer strategy' : 'Gather more compensation data for better benchmarking'}`;

  let tokensUsed = 0;
  try {
    const dsResult = await callDeepSeek(narrativePrompt, { max_tokens: 1000, temperature: 0.3 });
    const content = dsResult.choices?.[0]?.message?.content;
    if (content && content.length > 50) narrative = content;
    tokensUsed = dsResult.usage?.total_tokens || 0;
  } catch (e) {
    console.error('DeepSeek quarterly report failed:', e);
  }

  const execSummary = narrative.substring(0, 200) + (narrative.length > 200 ? '...' : '');

  const report = await db.insert('client_intelligence_reports', {
    client_id: clientId,
    report_type: 'quarterly_landscape',
    title: `Q${Math.ceil(periodEnd.getMonth() / 3)} ${periodEnd.getFullYear()} Talent Landscape — ${industrySectors.join(', ')}`,
    content: {
      narrative,
      supply_demand: {
        active_candidates: activeCandidates,
        new_entrants: newEntrants,
        active_mandates: activeMandates,
        net_trend: (newEntrants || 0) > 5 ? 'growing' : 'stable',
      },
      compensation: compData,
      skill_demand: {
        rising: [...new Set(radarProfiles.flatMap((p: any) => p.key_skills || []))].slice(0, 5),
        declining: [],
        gaps: [],
      },
      talent_radar: radarProfiles,
    },
    executive_summary: execSummary,
    overall_confidence: overallConfidence,
    data_sources: dataSources,
    status: 'under_review',
    period_start: periodStart.toISOString().split('T')[0],
    period_end: periodEnd.toISOString().split('T')[0],
    tokens_used: tokensUsed,
    generation_time_ms: Date.now() - startTime,
  });

  return report;
}

async function generatePreMandateAssessment(mandateId: string) {
  const startTime = Date.now();

  const mandate = await db.selectOne('mandates', {
    select: '*, clients(name)',
    column: 'id',
    value: mandateId,
  });

  if (!mandate) throw new Error('Mandate not found');

  const candidates = await db.selectMany('contacts', {
    select: 'id, pipeline_stage, industry, current_role, location, skills, trident_scores, career_tier, engagement_score',
    where: [{ column: 'is_archived', value: false }],
  });

  const relevant = (candidates || []).filter((c: any) =>
    matchesRole(c.current_role, mandate.role_title || mandate.title) &&
    matchesGeo(c.location, mandate.location)
  );

  const poolSize = relevant.length;
  const qualifiedCount = relevant.filter((c: any) => (c.trident_scores?.capability || 0) >= 60).length;
  const reachableCount = relevant.filter((c: any) =>
    ['ALPHA', 'BETA'].includes(c.career_tier) && (c.engagement_score || 0) > 30
  ).length;

  let difficulty = 3;
  if (poolSize < 10) difficulty = 5;
  else if (poolSize < 25) difficulty = 4;
  else if (poolSize > 100 && qualifiedCount > 20) difficulty = 2;
  else if (poolSize > 200) difficulty = 1;

  const compBenchmark = await computeCompensationBenchmark({
    role: mandate.role_title || mandate.title,
    industry: mandate.industry,
    geography: mandate.location,
  });

  const narrative = `Pre-Mandate Talent Assessment: ${mandate.title}

Talent Pool Analysis:
- Total relevant talent pool: ${poolSize} candidates
- Qualified candidates (TRIDENT ≥ 60): ${qualifiedCount}
- Reachable engaged candidates: ${reachableCount}
- Difficulty rating: ${difficulty}/5 (${difficulty <= 2 ? 'Easy' : difficulty <= 3 ? 'Moderate' : difficulty <= 4 ? 'Hard' : 'Very Hard'})

Compensation:
${compBenchmark.insufficient_data
  ? '  Insufficient data for reliable benchmarking'
  : `  Median: ${compBenchmark.base?.median}
  Range (P25-P75): ${compBenchmark.base?.p25} - ${compBenchmark.base?.p75}
  Confidence: ${compBenchmark.confidence}`
}

Recommendations:
${poolSize < 10 ? '  • Very small talent pool — consider expanding search criteria or geography' : ''}
${qualifiedCount < 5 ? '  • Few qualified candidates — may need to develop talent or compromise on requirements' : ''}
${reachableCount < 3 ? '  • Low engagement — invest in sourcing and relationship building' : ''}
${poolSize >= 25 ? '  • Healthy pool size — should be fillable within standard timeline' : ''}
${compBenchmark.confidence === 'high' ? '  • Strong compensation data available for offer strategy' : ''}`;

  let tokensUsed = 0;
  try {
    const prompt = `Generate a Pre-Mandate Talent Landscape Assessment for:
Mandate: ${mandate.title}
Client: ${mandate.clients?.name || 'Unknown'}
Industry: ${mandate.industry || 'N/A'}
Location: ${mandate.location || 'N/A'}

Market Data:
- Total talent pool: ${poolSize}
- Qualified (TRIDENT ≥60): ${qualifiedCount}
- Reachable (engaged): ${reachableCount}
- Difficulty: ${difficulty}/5
- Compensation: ${compBenchmark.insufficient_data ? 'Insufficient data' : `Median ${compBenchmark.base?.median} (${compBenchmark.confidence} confidence)`}

Generate a 300-500 word assessment. Be honest and data-driven.`;
    const dsResult = await callDeepSeek(prompt, { max_tokens: 800, temperature: 0.3 });
    tokensUsed = dsResult.usage?.total_tokens || 0;
  } catch (e) {
    // fallback to template narrative
  }

  const report = await db.insert('client_intelligence_reports', {
    client_id: mandate.client_id,
    mandate_id: mandateId,
    report_type: 'pre_mandate_assessment',
    title: `Pre-Mandate Assessment: ${mandate.title}`,
    content: {
      narrative,
      pool_size: poolSize,
      qualified_count: qualifiedCount,
      reachable_count: reachableCount,
      difficulty,
      compensation: compBenchmark,
    },
    executive_summary: narrative.substring(0, 200),
    overall_confidence: poolSize >= 20 ? 'high' : poolSize >= 10 ? 'medium' : 'low',
    status: 'under_review',
    tokens_used: tokensUsed,
    generation_time_ms: Date.now() - startTime,
  });

  return report;
}

function calculateSignalRelevance(signal: any, subscription: any): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  const industryOverlap = (signal.affected_industries || []).filter(
    (i: string) => (subscription.industry_sectors || []).includes(i)
  );
  if (industryOverlap.length > 0) {
    score += 0.4;
    reasons.push(`Industry overlap: ${industryOverlap.join(', ')}`);
  }

  const geoOverlap = (signal.affected_geographies || []).filter(
    (g: string) => (subscription.geographies || []).includes(g)
  );
  if (geoOverlap.length > 0) {
    score += 0.3;
    reasons.push(`Geography overlap: ${geoOverlap.join(', ')}`);
  }

  const companyOverlap = (signal.affected_companies || []).filter(
    (c: string) => (subscription.key_companies || []).includes(c)
  );
  if (companyOverlap.length > 0) {
    score += 0.3;
    reasons.push(`Watched companies: ${companyOverlap.join(', ')}`);
  }

  if (signal.severity === 'critical') score += 0.1;
  else if (signal.severity === 'high') score += 0.05;

  return { score: Math.min(1, score), reason: reasons.join('; ') };
}

async function processMarketSignal(signalId: string) {
  const signal = await db.selectOne('market_signals', {
    select: '*',
    column: 'id',
    value: signalId,
  });

  if (!signal) return null;

  const subscriptions = await db.selectMany('client_market_subscriptions', {
    select: '*, clients(id, name)',
    where: [
      { column: 'is_active', value: true },
      { column: 'subscription_type', value: 'market_alerts' },
    ],
  });

  const alertsGenerated: string[] = [];

  for (const sub of subscriptions || []) {
    const relevance = calculateSignalRelevance(signal, sub);
    if (relevance.score < 0.3) continue;

    const alertContent = `Market Alert: ${signal.title}

${signal.description || ''}

Severity: ${signal.severity}
Affected: ${(signal.affected_industries || []).join(', ')}
Relevance: ${Math.round(relevance.score * 100)}%

This alert was automatically generated by LYC Intelligence.`;

    const report = await db.insert('client_intelligence_reports', {
      client_id: sub.client_id,
      report_type: 'market_alert',
      title: `Market Alert: ${signal.title}`,
      content: {
        signal_id: signalId,
        alert_content: alertContent,
        relevance_score: relevance.score,
        relevance_reason: relevance.reason,
      },
      executive_summary: `${signal.title} — ${signal.severity} severity`,
      overall_confidence: signal.confidence > 0.7 ? 'high' : signal.confidence > 0.4 ? 'medium' : 'low',
      status: signal.severity === 'critical' ? 'under_review' : 'draft',
    });

    if (report) alertsGenerated.push(report.id);
  }

  await db.update('market_signals',
    { column: 'id', value: signalId },
    { alerts_generated: alertsGenerated }
  );

  return alertsGenerated;
}

async function getUserRole(userId: string): Promise<string> {
  const profile = await db.selectOne('profiles', {
    select: 'role',
    column: 'id',
    value: userId,
  });
  return profile?.role || 'consultant';
}

async function getUserIdFromReq(req: VercelRequest): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) return null;
      const user = await res.json();
      return user?.id || null;
    } catch {
      return null;
    }
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url || '', 'http://localhost');
  const path = url.pathname.replace('/api/intelligence/', '');
  const parts = path.split('/').filter(Boolean);
  const [resource, id, action] = parts;

  const userId = await getUserIdFromReq(req);
  const userRole = userId ? await getUserRole(userId) : null;

  const isConsultant = userRole === 'consultant' || userRole === 'team_lead' || userRole === 'admin';
  const isTeamLead = userRole === 'team_lead' || userRole === 'admin';
  const isAdmin = userRole === 'admin';

  try {
    // R-1: GET /api/intelligence/reports
    if (req.method === 'GET' && resource === 'reports' && !id) {
      if (!userId || !isConsultant) return res.status(403).json({ error: 'Consultant+ required' });
      const clientId = url.searchParams.get('client_id');
      const type = url.searchParams.get('type');
      const status = url.searchParams.get('status');

      const where: any[] = [];
      if (clientId) where.push({ column: 'client_id', value: clientId });
      if (type) where.push({ column: 'report_type', value: type });
      if (status) where.push({ column: 'status', value: status });

      const data = await db.selectMany('client_intelligence_reports', {
        select: 'id, title, report_type, status, overall_confidence, created_at, period_start, period_end, client_id, clients(name)',
        where: where.length > 0 ? where : undefined,
        orderBy: { column: 'created_at', ascending: false },
        limit: 100,
      });
      return res.status(200).json({ success: true, reports: data });
    }

    // R-2: POST /api/intelligence/reports
    if (req.method === 'POST' && resource === 'reports' && !id) {
      if (!userId || !isConsultant) return res.status(403).json({ error: 'Consultant+ required' });
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { client_id, report_type, mandate_id } = body;

      if (report_type === 'pre_mandate_assessment' && mandate_id) {
        const report = await generatePreMandateAssessment(mandate_id);
        return res.status(200).json({ success: true, report });
      }

      if (report_type === 'comp_snapshot' && client_id) {
        const benchmark = await computeCompensationBenchmark({
          role: body.role || 'manager',
          industry: body.industry,
          geography: body.geography,
        });
        const report = await db.insert('client_intelligence_reports', {
          client_id,
          report_type: 'comp_snapshot',
          title: `Compensation Benchmark — ${body.role || 'Role'}`,
          content: { benchmark },
          executive_summary: `Compensation benchmark for ${body.role || 'role'} — ${benchmark.confidence} confidence`,
          overall_confidence: benchmark.confidence,
          status: 'under_review',
        });
        return res.status(200).json({ success: true, report });
      }

      if (report_type === 'talent_radar' && client_id) {
        const radar = await selectTalentRadar({
          industrySectors: body.industries || [],
          jobFunctions: body.functions || [],
          geographies: body.geographies || [],
          count: body.count || 10,
          clientId: client_id,
        });
        const report = await db.insert('client_intelligence_reports', {
          client_id,
          report_type: 'talent_radar',
          title: `Talent Radar — ${body.industries?.[0] || 'Market'}`,
          content: { profiles: radar },
          executive_summary: `${radar.length} top anonymized profiles selected`,
          overall_confidence: radar.length >= 8 ? 'high' : 'medium',
          status: 'under_review',
        });
        return res.status(200).json({ success: true, report });
      }

      return res.status(400).json({ error: 'Invalid report_type' });
    }

    // R-3: GET /api/intelligence/reports/:id
    if (req.method === 'GET' && resource === 'reports' && id && action !== 'deliver') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const report = await db.selectOne('client_intelligence_reports', {
        select: '*',
        column: 'id',
        value: id,
      });
      if (!report) return res.status(404).json({ error: 'Report not found' });
      return res.status(200).json({ success: true, report });
    }

    // R-4/5: Reviews — GET /api/intelligence/reviews/pending and POST /api/intelligence/reviews
    if (resource === 'reviews') {
      if (req.method === 'GET' && id === 'pending') {
        if (!userId || !isConsultant) return res.status(403).json({ error: 'Consultant+ required' });
        const pending = await db.selectMany('client_intelligence_reports', {
          select: 'id, title, report_type, created_at, overall_confidence, client_id, clients(name)',
          where: [{ column: 'status', value: 'under_review' }],
          orderBy: { column: 'created_at', ascending: false },
        });
        return res.status(200).json({ success: true, reports: pending });
      }

      if (req.method === 'POST') {
        if (!userId || !isConsultant) return res.status(403).json({ error: 'Consultant+ required' });
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
        const { report_id, action, notes, content_changes } = body;

        const report = await db.selectOne('client_intelligence_reports', {
          select: '*',
          column: 'id',
          value: report_id,
        });

        if (!report) return res.status(404).json({ error: 'Report not found' });

        let newStatus = report.status;
        const updates: any = {
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
          review_notes: notes,
        };

        switch (action) {
          case 'approve':
            newStatus = 'approved';
            updates.status = 'approved';
            updates.delivered_at = new Date().toISOString();
            updates.delivery_channel = 'portal';
            break;
          case 'edit':
            newStatus = 'approved';
            updates.status = 'approved';
            if (content_changes) updates.content = content_changes;
            updates.review_changes_made = true;
            break;
          case 'reject':
            newStatus = 'archived';
            updates.status = 'archived';
            break;
          case 'escalate':
            updates.status = 'under_review';
            break;
        }

        const updated = await db.update('client_intelligence_reports',
          { column: 'id', value: report_id },
          updates
        );

        return res.status(200).json({ success: true, action, report: updated[0] });
      }
    }

    // R-6: POST /api/intelligence/reports/:id/deliver
    if (req.method === 'POST' && resource === 'reports' && id && action === 'deliver') {
      if (!userId || !isConsultant) return res.status(403).json({ error: 'Consultant+ required' });
      const updated = await db.update('client_intelligence_reports',
        { column: 'id', value: id },
        {
          status: 'delivered',
          delivered_at: new Date().toISOString(),
          delivery_channel: 'portal',
        }
      );
      return res.status(200).json({ success: true, report: updated[0] });
    }

    // R-7: POST /api/intelligence/comp-benchmark
    if (req.method === 'POST' && resource === 'comp-benchmark') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const result = await computeCompensationBenchmark(body);
      return res.status(200).json({ success: true, benchmark: result });
    }

    // R-8: GET /api/intelligence/talent-radar/:clientId
    if (req.method === 'GET' && resource === 'talent-radar' && id) {
      if (!userId || !isConsultant) return res.status(403).json({ error: 'Consultant+ required' });
      const clientId = id;
      const count = parseInt(url.searchParams.get('count') || '10');

      const subs = await db.selectMany('client_market_subscriptions', {
        select: 'industry_sectors, job_functions, geographies',
        where: [
          { column: 'client_id', value: clientId },
          { column: 'subscription_type', value: 'talent_radar' },
        ],
        limit: 1,
      });
      const sub = subs && subs.length > 0 ? subs[0] : null;

      const radar = await selectTalentRadar({
        industrySectors: sub?.industry_sectors || [],
        jobFunctions: sub?.job_functions || [],
        geographies: sub?.geographies || [],
        count,
        clientId,
      });

      return res.status(200).json({ success: true, profiles: radar });
    }

    // R-9: GET /api/intelligence/signals
    if (req.method === 'GET' && resource === 'signals' && !id) {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const severity = url.searchParams.get('severity');
      const type = url.searchParams.get('type');

      const where: any[] = [];
      if (severity) where.push({ column: 'severity', value: severity });
      if (type) where.push({ column: 'signal_type', value: type });

      const data = await db.selectMany('market_signals', {
        select: '*',
        where: where.length > 0 ? where : undefined,
        orderBy: { column: 'detected_at', ascending: false },
        limit: 100,
      });
      return res.status(200).json({ success: true, signals: data });
    }

    // R-10: POST /api/intelligence/signals
    if (req.method === 'POST' && resource === 'signals' && !id) {
      if (!userId || !isConsultant) return res.status(403).json({ error: 'Consultant+ required' });
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const signal = await db.insert('market_signals', {
        ...body,
        source: body.source || 'manual',
        verified_by: userId,
        verified_at: new Date().toISOString(),
      });

      processMarketSignal(signal.id).catch(console.error);

      return res.status(200).json({ success: true, signal });
    }

    // R-11: GET /api/intelligence/subscriptions
    if (req.method === 'GET' && resource === 'subscriptions' && !id) {
      if (!userId || !isConsultant) return res.status(403).json({ error: 'Consultant+ required' });
      const clientId = url.searchParams.get('client_id');
      const data = await db.selectMany('client_market_subscriptions', {
        orderBy: { column: 'created_at', ascending: false },
        where: clientId ? [{ column: 'client_id', value: clientId }] : undefined,
      });
      return res.status(200).json({ success: true, subscriptions: data });
    }

    // R-12: POST /api/intelligence/subscriptions
    if (req.method === 'POST' && resource === 'subscriptions' && !id) {
      if (!userId || !isConsultant) return res.status(403).json({ error: 'Consultant+ required' });
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

      let sub: any = null;
      if (body.client_id && body.subscription_type) {
        const existing = await db.selectMany('client_market_subscriptions', {
          select: '*',
          where: [
            { column: 'client_id', value: body.client_id },
            { column: 'subscription_type', value: body.subscription_type },
          ],
          limit: 1,
        });
        sub = existing && existing.length > 0 ? existing[0] : null;
      }

      if (sub) {
        const updated = await db.update('client_market_subscriptions',
          { column: 'id', value: sub.id },
          body
        );
        sub = updated[0];
      } else {
        sub = await db.insert('client_market_subscriptions', body);
      }
      return res.status(200).json({ success: true, subscription: sub });
    }

    // R-13: POST /api/intelligence/query
    if (req.method === 'POST' && resource === 'query') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { client_id, query_text, channel = 'platform' } = body;
      if (!client_id || !query_text) return res.status(400).json({ error: 'client_id and query_text required' });

      const lower = query_text.toLowerCase();
      let response = '';
      let queryType = 'general';
      let reportId: string | null = null;

      if (lower.includes('compensation') || lower.includes('salary') || lower.includes('pay') || lower.includes('market rate')) {
        queryType = 'compensation';
        const bench = await computeCompensationBenchmark({
          role: query_text,
          industry: body.industry,
          geography: body.geography,
        });
        response = JSON.stringify(bench);
      } else if (lower.includes('top talent') || lower.includes('radar') || lower.includes('best candidates')) {
        queryType = 'talent_radar';
        const radar = await selectTalentRadar({
          industrySectors: body.industries || [],
          jobFunctions: [],
          geographies: body.geographies || [],
          count: 10,
          clientId: client_id,
        });
        response = `Found ${radar.length} top anonymized profiles. Top skills: ${[...new Set(radar.flatMap((p: any) => p.key_skills || []))].slice(0, 5).join(', ')}.`;
      } else {
        queryType = 'general';
        response = 'General market intelligence query. For detailed insights, request a full quarterly report or compensation benchmark.';
      }

      await db.insert('intelligence_queries', {
        client_id,
        user_id: userId,
        channel,
        query_text,
        response_summary: response.substring(0, 500),
        response_full: { response, query_type: queryType },
        report_generated: reportId,
      });

      return res.status(200).json({ success: true, response, query_type: queryType, report_id: reportId });
    }

    // R-14: GET /api/intelligence/oversight
    if (req.method === 'GET' && resource === 'oversight') {
      if (!userId || !isAdmin) return res.status(403).json({ error: 'Admin only' });

      const subs = await db.selectMany('client_market_subscriptions', {
        select: 'subscription_type, tier, is_active',
      });

      const subCounts: Record<string, any> = {};
      for (const s of subs || []) {
        if (!s.is_active) continue;
        if (!subCounts[s.subscription_type]) {
          subCounts[s.subscription_type] = { total: 0, premium: 0, standard: 0, basic: 0 };
        }
        subCounts[s.subscription_type].total++;
        subCounts[s.subscription_type][s.tier]++;
      }

      const monthStart = new Date();
      monthStart.setDate(1);

      const monthlyReports = await db.selectMany('client_intelligence_reports', {
        select: 'report_type, status, delivered_at, opened_at, created_at',
        where: [{ column: 'created_at', value: monthStart.toISOString(), op: 'gte' }],
      });

      const reportStats = {
        generated: monthlyReports?.length || 0,
        delivered: monthlyReports?.filter((r: any) => r.status === 'delivered').length || 0,
        pending_review: monthlyReports?.filter((r: any) => r.status === 'under_review').length || 0,
        opened: monthlyReports?.filter((r: any) => r.opened_at).length || 0,
      };

      const signalsThisMonth = await db.countRows('market_signals', {
        where: [{ column: 'detected_at', value: monthStart.toISOString(), op: 'gte' }],
      });

      const reviewData = await db.selectMany('client_intelligence_reports', {
        select: 'reviewed_at, created_at, review_changes_made, status',
        where: [
          { column: 'status', value: 'delivered' },
          { column: 'created_at', value: monthStart.toISOString(), op: 'gte' },
        ],
      });

      const avgReviewTime = reviewData?.length
        ? reviewData.reduce((sum: number, r: any) => sum + (new Date(r.reviewed_at).getTime() - new Date(r.created_at).getTime()), 0) / reviewData.length / (60 * 60 * 1000)
        : 0;

      const editRate = reviewData?.length
        ? reviewData.filter((r: any) => r.review_changes_made).length / reviewData.length
        : 0;

      const queryCount = await db.countRows('intelligence_queries', {
        where: [{ column: 'created_at', value: monthStart.toISOString(), op: 'gte' }],
      });

      return res.status(200).json({
        success: true,
        subscriptions: subCounts,
        reports_this_month: reportStats,
        signals_this_month: signalsThisMonth || 0,
        queries_this_month: queryCount || 0,
        review_metrics: {
          avg_review_time_hours: Math.round(avgReviewTime * 10) / 10,
          edit_rate: Math.round(editRate * 100),
          total_reviews: reviewData?.length || 0,
        },
      });
    }

    // R-15: POST /api/intelligence/pre-mandate/:mandateId
    if (req.method === 'POST' && resource === 'pre-mandate' && id) {
      if (!userId || !isConsultant) return res.status(403).json({ error: 'Consultant+ required' });
      const mandateId = id;
      const report = await generatePreMandateAssessment(mandateId);
      return res.status(200).json({ success: true, report });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (error: any) {
    console.error('Intelligence API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export {
  computeCompensationBenchmark,
  selectTalentRadar,
  generateQuarterlyReport,
  generatePreMandateAssessment,
  processMarketSignal,
};
