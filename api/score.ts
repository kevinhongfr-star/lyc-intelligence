import type { VercelRequest, VercelResponse } from '@vercel/node';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { mandateId, contactIds, jdDescription, cvData } = req.body;
  if (!mandateId) return res.status(400).json({ error: 'Missing mandateId' });
  if (!DEEPSEEK_API_KEY) return res.status(500).json({ error: 'DEEPSEEK_API_KEY not configured' });

  try {
    let jd = jdDescription || '';
    if (!jd && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      const mRes = await fetch(`${SUPABASE_URL}/rest/v1/mandates?select=jd_description,skills_requirements,search_definition&id=eq.${mandateId}`, { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } });
      const mandates = await mRes.json();
      if (mandates.length) { const m = mandates[0]; jd = [m.jd_description, m.search_definition, Array.isArray(m.skills_requirements) ? m.skills_requirements.join(', ') : ''].filter(Boolean).join('\n'); }
    }
    if (!jd) return res.status(400).json({ error: 'No JD description found' });

    let candidates = cvData || [];
    if (!candidates.length && contactIds?.length && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      const cRes = await fetch(`${SUPABASE_URL}/rest/v1/contacts?select=id,name,current_title,headline,skills,career_history,summary&id=in.(${contactIds.join(',')})`, { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } });
      const contacts = await cRes.json();
      candidates = contacts.map((c: any) => ({ id: c.id, name: c.name, title: c.current_title || '', headline: c.headline || '', skills: Array.isArray(c.skills) ? c.skills : [], experience: c.summary || (Array.isArray(c.career_history) ? c.career_history.map((h: any) => `${h.role} at ${h.company}`).join('; ') : '') }));
    }
    if (!candidates.length) return res.status(400).json({ error: 'No candidates to score' });

    const results = [];
    for (const cv of candidates) {
      const prompt = `You are an executive search analyst. Score this candidate against the job description using the TRIDENT 3D model.

JOB DESCRIPTION:
${jd}

CANDIDATE: ${cv.name}
Title: ${cv.title}
Headline: ${cv.headline}
Skills: ${cv.skills.join(', ')}
Experience: ${cv.experience}

Score each dimension 0-100:
- D1 (Experience): Career trajectory match
- D2 (Skills): Skills match
- D3 (Organizational Fit): Culture/org fit

Also provide: verdict ("Strong Fit"/"Conditional Fit"/"Weak Fit"), key_match_reasons (2-3 sentences), risk_factors (1-2 sentences), approach_strategy.

JSON only: {"d1": number, "d2": number, "d3": number, "verdict": string, "key_match_reasons": string, "risk_factors": string, "approach_strategy": string}`;

      try {
        const dsRes = await fetch('https://api.deepseek.com/v1/chat/completions', { method: 'POST', headers: { 'Authorization': `Bearer ${DEEPSEEK_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], temperature: 0.3, max_tokens: 500 }) });
        const dsData = await dsRes.json();
        const content = dsData.choices?.[0]?.message?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const scores = JSON.parse(jsonMatch[0]);
          const composite = Math.round((scores.d1 || 0) * 0.40 + (scores.d2 || 0) * 0.35 + (scores.d3 || 0) * 0.25);
          const tier = scores.verdict?.includes('Strong') ? 'T1' : scores.verdict?.includes('Conditional') ? 'T2' : 'T3';
          results.push({ contactId: cv.id, name: cv.name, d1: scores.d1, d2: scores.d2, d3: scores.d3, composite, verdict: scores.verdict, tier, keyMatchReasons: scores.key_match_reasons, riskFactors: scores.risk_factors, approachStrategy: scores.approach_strategy });
          if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
            fetch(`${SUPABASE_URL}/rest/v1/candidates_pipeline?contact_id=eq.${cv.id}&mandate_id=eq.${mandateId}`, { method: 'PATCH', headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ trident_d1: scores.d1, trident_d2: scores.d2, trident_d3: scores.d3, trident_composite: composite, sweep_tier: tier, verdict: scores.verdict, key_match_reasons: scores.key_match_reasons, risk_factors: scores.risk_factors, approach_strategy: scores.approach_strategy }) }).catch(() => {});
            fetch(`${SUPABASE_URL}/rest/v1/scoring_runs`, { method: 'POST', headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: '3cf508f5-dd29-4d1c-846b-6633b616f9c6', mandate_id: mandateId, contact_id: cv.id, run_type: 'trident', input_params: JSON.stringify({ jd_length: jd.length }), output_scores: JSON.stringify({ d1: scores.d1, d2: scores.d2, d3: scores.d3, composite }), composite_score: composite, verdict: scores.verdict, model: 'deepseek-chat' }) }).catch(() => {});
          }
        }
      } catch (scoreErr) { results.push({ contactId: cv.id, name: cv.name, error: 'Scoring failed' }); }
    }
    return res.status(200).json({ success: true, results, scored: results.filter(r => !r.error).length, failed: results.filter(r => r.error).length });
  } catch (err: any) { return res.status(500).json({ error: 'Internal server error', message: err.message }); }
}
