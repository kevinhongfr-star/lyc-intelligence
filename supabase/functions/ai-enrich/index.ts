import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY') || '';
const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = Deno.env.get('DEEPSEEK_MODEL') || 'deepseek-v4-flash';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

async function supabaseFetch(path: string, options?: RequestInit): Promise<any> {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function callDeepSeek(
  systemPrompt: string,
  userPrompt: string,
  model: string = DEEPSEEK_MODEL,
  maxTokens: number = 500
): Promise<{ content: string; tokens: number }> {
  if (!DEEPSEEK_API_KEY) {
    return { content: 'DeepSeek API key not configured', tokens: 0 };
  }

  const res = await fetch(DEEPSEEK_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    throw new Error(`DeepSeek error: ${res.status}`);
  }

  const data = await res.json();
  return {
    content: data.choices?.[0]?.message?.content || '{}',
    tokens: data.usage?.total_tokens || 0,
  };
}

// ── Company Enrichment ────────────────────────────────────────────────────

async function enrichCompany(companyId: string, types: string[]) {
  const company = await supabaseFetch(
    `/rest/v1/companies?id=eq.${companyId}&select=id,name,industry,headquarters,website,employee_count,description`
  );

  if (!company || company.length === 0) {
    return { error: 'Company not found' };
  }

  const c = company[0];
  const results: Record<string, any> = {};
  let totalTokens = 0;

  const enrichmentTypes = types.length > 0 ? types : [
    'industry_classification', 'size_estimation', 'tech_stack',
    'competitive_landscape', 'hiring_needs'
  ];

  for (const type of enrichmentTypes) {
    try {
      let systemPrompt = '';
      let userPrompt = '';
      let model = DEEPSEEK_MODEL;

      switch (type) {
        case 'industry_classification':
          systemPrompt = 'You are a business analyst. Classify the company industry. Return JSON: { "industry": string, "sub_industry": string, "confidence": number }';
          userPrompt = `Company: ${c.name}\nIndustry: ${c.industry || 'N/A'}\nHQ: ${c.headquarters || 'N/A'}\nDescription: ${c.description || 'N/A'}`;
          break;

        case 'size_estimation':
          systemPrompt = 'You are a business analyst. Estimate company size metrics. Return JSON: { "estimated_employees": number, "estimated_revenue_range": string, "growth_stage": string, "confidence": number }';
          userPrompt = `Company: ${c.name}\nKnown employees: ${c.employee_count || 'N/A'}\nIndustry: ${c.industry || 'N/A'}\nHQ: ${c.headquarters || 'N/A'}`;
          break;

        case 'tech_stack':
          systemPrompt = 'You are a technology analyst. Infer likely tech stack for this company. Return JSON: { "likely_stack": string[], "engineering_focus": string, "confidence": number }';
          userPrompt = `Company: ${c.name}\nIndustry: ${c.industry || 'N/A'}\nDescription: ${c.description || 'N/A'}`;
          model = 'deepseek-v4-pro';
          break;

        case 'competitive_landscape':
          systemPrompt = 'You are a competitive intelligence analyst. Identify key competitors. Return JSON: { "competitors": [{ "name": string, "advantage": string }], "market_position": string, "confidence": number }';
          userPrompt = `Company: ${c.name}\nIndustry: ${c.industry || 'N/A'}\nHQ: ${c.headquarters || 'N/A'}`;
          model = 'deepseek-v4-pro';
          break;

        case 'hiring_needs':
          systemPrompt = 'You are a talent market analyst. Predict hiring needs for this company. Return JSON: { "likely_roles": [{ "role": string, "urgency": "high"|"medium"|"low", "reason": string }], "hiring_velocity": "increasing"|"stable"|"decreasing", "confidence": number }';
          userPrompt = `Company: ${c.name}\nIndustry: ${c.industry || 'N/A'}\nSize: ${c.employee_count || 'N/A'} employees`;
          model = 'deepseek-v4-pro';
          break;

        default:
          continue;
      }

      const result = await callDeepSeek(systemPrompt, userPrompt, model, 500);
      totalTokens += result.tokens;

      let parsed;
      try {
        parsed = JSON.parse(result.content);
      } catch {
        parsed = { raw: result.content };
      }

      results[type] = parsed;

      // Store enrichment result in company_intelligence
      await supabaseFetch('/rest/v1/company_intelligence', {
        method: 'POST',
        body: JSON.stringify({
          company_id: companyId,
          data_type: type,
          data_value: parsed,
          source: 'ai_enrichment',
          confidence: parsed.confidence || 0.7,
        }),
      });

    } catch (e) {
      results[type] = { error: (e as Error).message };
    }
  }

  // Update company record with enrichment timestamp
  await supabaseFetch(`/rest/v1/companies?id=eq.${companyId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      ai_enriched_at: new Date().toISOString(),
      ai_enrichment_summary: results,
    }),
  });

  return { success: true, enrichment: results, tokens_used: totalTokens };
}

// ── Candidate Enrichment ──────────────────────────────────────────────────

async function enrichCandidate(contactId: string, types: string[]) {
  const contact = await supabaseFetch(
    `/rest/v1/contacts?id=eq.${contactId}&select=id,full_name,current_role,current_company,industry,location,linkedin_url,summary`
  );

  if (!contact || contact.length === 0) {
    return { error: 'Contact not found' };
  }

  const ct = contact[0];
  const results: Record<string, any> = {};
  let totalTokens = 0;

  const enrichmentTypes = types.length > 0 ? types : [
    'skills_extraction', 'career_trajectory', 'role_fit'
  ];

  for (const type of enrichmentTypes) {
    try {
      let systemPrompt = '';
      let userPrompt = '';
      let model = DEEPSEEK_MODEL;

      switch (type) {
        case 'skills_extraction':
          systemPrompt = 'You are a talent analyst. Extract skills from candidate profile. Return JSON: { "core_skills": string[], "secondary_skills": string[], "skill_gaps": string[], "confidence": number }';
          userPrompt = `Name: ${ct.full_name}\nRole: ${ct.current_role || 'N/A'}\nCompany: ${ct.current_company || 'N/A'}\nSummary: ${ct.summary || 'N/A'}`;
          break;

        case 'career_trajectory':
          systemPrompt = 'You are a career analyst. Analyze career trajectory. Return JSON: { "trajectory": "ascending"|"stable"|"transitioning", "career_level": string, "next_likely_move": string, "risk_factors": string[], "confidence": number }';
          userPrompt = `Name: ${ct.full_name}\nRole: ${ct.current_role || 'N/A'}\nIndustry: ${ct.industry || 'N/A'}`;
          model = 'deepseek-v4-pro';
          break;

        case 'role_fit':
          systemPrompt = 'You are a talent matching analyst. Assess role fit indicators. Return JSON: { "leadership_potential": "high"|"medium"|"low", "cultural_fit_signals": string[], "mobility_indicators": string[], "confidence": number }';
          userPrompt = `Name: ${ct.full_name}\nRole: ${ct.current_role || 'N/A'}\nCompany: ${ct.current_company || 'N/A'}\nLocation: ${ct.location || 'N/A'}`;
          model = 'deepseek-v4-pro';
          break;

        default:
          continue;
      }

      const result = await callDeepSeek(systemPrompt, userPrompt, model, 500);
      totalTokens += result.tokens;

      let parsed;
      try {
        parsed = JSON.parse(result.content);
      } catch {
        parsed = { raw: result.content };
      }

      results[type] = parsed;

    } catch (e) {
      results[type] = { error: (e as Error).message };
    }
  }

  // Update contact with enrichment data
  await supabaseFetch(`/rest/v1/contacts?id=eq.${contactId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      ai_enriched_at: new Date().toISOString(),
      canvas_profile: { ...results, enriched_at: new Date().toISOString() },
    }),
  });

  return { success: true, enrichment: results, tokens_used: totalTokens };
}

// ── Signal Enrichment ─────────────────────────────────────────────────────

async function enrichSignal(signalId: string) {
  const signal = await supabaseFetch(
    `/rest/v1/intelligence_signals?id=eq.${signalId}&select=*`
  );

  if (!signal || signal.length === 0) {
    return { error: 'Signal not found' };
  }

  const s = signal[0];

  const systemPrompt = `You are an intelligence analyst. Enrich this market signal with AI analysis.
Return JSON: {
  "ai_summary": string,
  "relevance_score": number (0-1),
  "confidence": number (0-1),
  "predicted_impact": string,
  "recommended_actions": string[],
  "related_companies": string[]
}`;

  const userPrompt = `Title: ${s.title}
Type: ${s.signal_type}
Summary: ${s.summary}
Impact Level: ${s.impact_level}
Companies: ${(s.companies_related || []).join(', ')}
Industries: ${(s.industries || []).join(', ')}
Geography: ${(s.geography || []).join(', ')}`;

  const result = await callDeepSeek(systemPrompt, userPrompt, DEEPSEEK_MODEL, 600);

  let parsed;
  try {
    parsed = JSON.parse(result.content);
  } catch {
    parsed = { ai_summary: result.content };
  }

  // Update signal with AI enrichment
  await supabaseFetch(`/rest/v1/intelligence_signals?id=eq.${signalId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      ai_enriched: true,
      ai_analysis: parsed,
      relevance_score: parsed.relevance_score || s.relevance_score,
      confidence: parsed.confidence || s.confidence,
    }),
  });

  return { success: true, enrichment: parsed, tokens_used: result.tokens };
}

// ── Main Handler ──────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { target_type, target_id, enrichment_types, signal_id } = body;

    let result;

    if (signal_id) {
      // Signal enrichment
      result = await enrichSignal(signal_id);
    } else if (target_type === 'company' && target_id) {
      result = await enrichCompany(target_id, enrichment_types || []);
    } else if (target_type === 'candidate' && target_id) {
      result = await enrichCandidate(target_id, enrichment_types || []);
    } else {
      // Batch mode: enrich all unenriched signals
      const unenriched = await supabaseFetch(
        '/rest/v1/intelligence_signals?ai_enriched=eq.false&select=id&limit=20'
      );

      const enriched: any[] = [];
      let totalTokens = 0;

      for (const s of (unenriched || [])) {
        try {
          const r = await enrichSignal(s.id);
          if (r.success) {
            enriched.push(s.id);
            totalTokens += r.tokens_used;
          }
        } catch (e) {
          console.error(`[ai-enrich] Signal ${s.id} failed:`, e);
        }
      }

      result = {
        success: true,
        batch: true,
        enriched_count: enriched.length,
        tokens_used: totalTokens,
      };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ai-enrich] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
