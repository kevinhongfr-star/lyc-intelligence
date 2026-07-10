/**
 * api/_lib/aiHandler.ts
 * Server-side AI endpoints that call DeepSeek securely.
 * Prevents API key exposure in browser bundle.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from './adminAuth.js';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return false;
  }
  if (entry.count >= 5) return true;
  entry.count++;
  return false;
}

async function callDeepSeek(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7
): Promise<{ content?: string; error?: string; usage?: any }> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API key not configured');
  }

  const response = await fetch(DEEPSEEK_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: data.usage,
  };
}

// ── CV Analysis ──────────────────────────────────────────────────────────────

const CV_EXTRACTION_SYSTEM = `You are an expert HR analyst specializing in executive search. Extract structured information from CVs accurately and return ONLY valid JSON. Be precise with names, dates, and facts.`;

const CV_EXTRACTION_PROMPT = `Extract the following information from this CV. Return ONLY a JSON object with these exact fields:
- name: Full name (or null if not found)
- currentTitle: Current job title (or null)
- currentCompany: Current company name (or null)
- yearsExperience: Total years of relevant experience as a number (or null)
- keySkills: Array of 5 most important skills
- education: Array of objects with {degree, institution, year} for each degree
- careerHighlights: Array of 3 bullet points summarizing career achievements
- potentialRedFlags: Array of any concerns (gaps, inconsistencies, red flags) - empty array if none

CV text:
{cvText}

Return ONLY JSON, no markdown or explanation.`;

// ── Interview Questions ───────────────────────────────────────────────────────

const INTERVIEW_QUESTIONS_SYSTEM = `You are an expert executive search consultant specializing in behavioral interviewing. Generate insightful, competency-based interview questions that reveal candidate capabilities and fit.`;

const INTERVIEW_QUESTIONS_PROMPT = `Generate 10 interview questions for this executive search mandate.

Mandate: {mandateTitle}
Industry: {industry}
Location: {location}
Seniority: {seniority}

Success Profile:
- Required experience: {requiredExperience} years
- Required industries: {requiredIndustries}
- Target DISC profile: {targetDisc}
- Key competencies: {competencies}

Generate questions for these competency areas:
1. Technical expertise (3 questions)
2. Leadership (3 questions)
3. Cultural fit (2 questions)
4. Problem-solving (2 questions)

For each question provide:
- id: unique identifier (e.g., "tech-1")
- question: The interview question text
- competencyArea: One of "Technical", "Leadership", "Cultural Fit", "Problem Solving"
- whatToListenFor: Key indicators in a good answer (2-3 bullet points)
- followUpQuestion: A probing follow-up question

Return ONLY a JSON array of questions.`;

// ── Offer Negotiation ────────────────────────────────────────────────────────

const OFFER_NEGOTIATION_SYSTEM = `You are an expert compensation analyst specializing in executive search. Provide data-driven, competitive offer suggestions based on candidate profile, market data, and mandate details.`;

const OFFER_NEGOTIATION_PROMPT = `Suggest a competitive offer for this executive candidate.

Candidate:
- Current title: {candidateTitle}
- Years experience: {yearsExperience}
- Key skills: {skills}
- Current compensation: {currentComp}

Mandate:
- Position: {mandateTitle}
- Budget range: {budgetRange}
- Seniority level: {seniority}
- Location: {location}

Market context:
{marketData}

Provide a suggestion with this JSON structure:
{
  "baseSalaryRange": { "min": number, "max": number, "recommended": number },
  "bonusStructure": { "percentage": number, "amount": number },
  "equity": { "type": "rsu" | "option" | "none", "value": string },
  "benefits": [list of benefit suggestions],
  "negotiationStrategy": "How to present and negotiate this offer",
  "rationale": "Why this offer is appropriate"
}

Return ONLY JSON.`;

// ── Handler ──────────────────────────────────────────────────────────────────

export async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // Auth check
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Rate limiting
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    res.status(429).json({ error: 'Rate limit exceeded' });
    return;
  }

  const pathArr = (req.query.path as string[]) || [];
  const action = pathArr[0] || '';

  try {
    if (action === 'analyze-cv') {
      const { cvText } = req.body || {};
      if (!cvText) {
        res.status(400).json({ error: 'Missing cvText' });
        return;
      }

      const result = await callDeepSeek(
        CV_EXTRACTION_SYSTEM,
        CV_EXTRACTION_PROMPT.replace('{cvText}', cvText),
        0.3
      );

      if (result.error) {
        res.status(500).json({ error: result.error });
        return;
      }

      try {
        let jsonStr = result.content?.trim() || '';
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) jsonStr = jsonMatch[1] || jsonMatch[0];

        const data = JSON.parse(jsonStr);
        res.status(200).json({
          success: true,
          data: {
            name: data.name || null,
            currentTitle: data.currentTitle || null,
            currentCompany: data.currentCompany || null,
            yearsExperience: typeof data.yearsExperience === 'number' ? data.yearsExperience : null,
            keySkills: Array.isArray(data.keySkills) ? data.keySkills.slice(0, 10) : [],
            education: Array.isArray(data.education) ? data.education : [],
            careerHighlights: Array.isArray(data.careerHighlights) ? data.careerHighlights.slice(0, 5) : [],
            potentialRedFlags: Array.isArray(data.potentialRedFlags) ? data.potentialRedFlags : [],
          },
          usage: result.usage,
        });
        return;
      } catch (parseError) {
        res.status(500).json({ error: 'Failed to parse CV data' });
        return;
      }
    }

    if (action === 'generate-questions') {
      const { mandate, successProfile } = req.body || {};
      if (!mandate || !successProfile) {
        res.status(400).json({ error: 'Missing mandate or successProfile' });
        return;
      }

      const competencies = (successProfile.personality_indicators || [])
        .map((p: any) => `${p.trait}: ${p.description}`)
        .join('; ');

      const result = await callDeepSeek(
        INTERVIEW_QUESTIONS_SYSTEM,
        INTERVIEW_QUESTIONS_PROMPT
          .replace('{mandateTitle}', mandate.title || 'Executive Position')
          .replace('{industry}', mandate.keywords || 'General')
          .replace('{location}', mandate.location || 'Not specified')
          .replace('{seniority}', mandate.seniority_level || 'Senior')
          .replace('{requiredExperience}', String(successProfile.required_experience_years || 10))
          .replace('{requiredIndustries}', (successProfile.required_industries || []).join(', '))
          .replace('{targetDisc}', successProfile.target_disc_profile || 'Not specified')
          .replace('{competencies}', competencies || 'General competencies'),
        0.7
      );

      if (result.error) {
        res.status(500).json({ error: result.error });
        return;
      }

      try {
        let jsonStr = result.content?.trim() || '';
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || jsonStr.match(/\[[\s\S]*\]/);
        if (jsonMatch) jsonStr = jsonMatch[1] || jsonMatch[0];

        const data = JSON.parse(jsonStr);
        if (!Array.isArray(data)) {
          res.status(500).json({ error: 'Invalid response format' });
          return;
        }

        res.status(200).json({
          success: true,
          data: data.map((q: any, idx: number) => ({
            id: q.id || `generated-${idx + 1}`,
            question: q.question || '',
            competencyArea: q.competencyArea || 'General',
            whatToListenFor: q.whatToListenFor || '',
            followUpQuestion: q.followUpQuestion || '',
          })),
          usage: result.usage,
        });
        return;
      } catch (parseError) {
        res.status(500).json({ error: 'Failed to parse generated questions' });
        return;
      }
    }

    if (action === 'negotiate-offer') {
      const { candidate, mandate, marketData } = req.body || {};
      if (!candidate || !mandate) {
        res.status(400).json({ error: 'Missing candidate or mandate' });
        return;
      }

      const marketDataSummary = marketData?.avgBaseSalary
        ? `Market data shows average base salary of $${marketData.avgBaseSalary.toLocaleString()} for similar roles (Source: ${marketData.dataSource || 'Market Research'}). Total compensation including bonuses typically ranges $${((marketData.avgTotalComp || marketData.avgBaseSalary) * 1.2).toLocaleString()}.`
        : 'No specific market data available. Use internal benchmarks and candidate expectations.';

      const currentComp = candidate.currentCompensation
        ? `Base $${candidate.currentCompensation.base?.toLocaleString() || 'Unknown'}, Bonus ${candidate.currentCompensation.bonus || 'Unknown'}%`
        : 'Not disclosed';

      const budgetRange = mandate.budgetRange
        ? `$${mandate.budgetRange.min.toLocaleString()} - $${mandate.budgetRange.max.toLocaleString()}`
        : 'Not specified';

      const result = await callDeepSeek(
        OFFER_NEGOTIATION_SYSTEM,
        OFFER_NEGOTIATION_PROMPT
          .replace('{candidateTitle}', candidate.title || 'Executive')
          .replace('{yearsExperience}', String(candidate.yearsExperience || 0))
          .replace('{skills}', (candidate.skills || []).join(', ') || 'Various')
          .replace('{currentComp}', currentComp)
          .replace('{mandateTitle}', mandate.title || 'Position')
          .replace('{budgetRange}', budgetRange)
          .replace('{seniority}', mandate.seniorityLevel || 'Senior')
          .replace('{location}', mandate.location || 'Not specified')
          .replace('{marketData}', marketDataSummary),
        0.5
      );

      if (result.error) {
        res.status(500).json({ error: result.error });
        return;
      }

      try {
        let jsonStr = result.content?.trim() || '';
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) jsonStr = jsonMatch[1] || jsonMatch[0];

        const data = JSON.parse(jsonStr);
        res.status(200).json({
          success: true,
          data: {
            baseSalaryRange: data.baseSalaryRange || { min: 0, max: 0, recommended: 0 },
            bonusStructure: data.bonusStructure || { percentage: 0, amount: 0 },
            equity: data.equity || { type: 'none', value: '' },
            benefits: Array.isArray(data.benefits) ? data.benefits : [],
            negotiationStrategy: data.negotiationStrategy || '',
            rationale: data.rationale || '',
          },
          usage: result.usage,
        });
        return;
      } catch (parseError) {
        res.status(500).json({ error: 'Failed to parse offer suggestion' });
        return;
      }
    }

    // ─── AI Summary ─────────────────────────────────────────────────────────────
    if (action === 'summary') {
      const { entityType, entityId } = req.body || {};
      if (!entityType || !entityId) {
        res.status(400).json({ error: 'Missing entityType or entityId' });
        return;
      }
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
      );
      let contextData = '';
      let contextLabel = '';
      if (entityType === 'candidate') {
        const { data, error } = await supabase.from('contacts').select('id, title, company, location, country, email, linkedin_url, seniority_level, industry, source, score, pipeline_stage, career_history, education, summary, skills, strengths, assessment_notes').eq('id', entityId).maybeSingle();
        if (error || !data) { res.status(404).json({ error: 'Candidate not found' }); return; }
        const d = data as any;
        const career = Array.isArray(d.career_history) ? d.career_history.map((h: any) => (h.role || h.title || 'Role') + ' at ' + (h.company || 'Company') + (h.startDate ? ' (' + h.startDate + (h.endDate ? '-' + h.endDate : '-Present') + ')' : '')).join('\n') : 'No career history';
        const edu = Array.isArray(d.education) ? d.education.map((e: any) => (e.degree || '') + ' ' + (e.field || '') + ' - ' + (e.school || 'School') + (e.year ? ' (' + e.year + ')' : '')).join('\n') : 'No education data';
        contextLabel = 'CANDIDATE: ' + (d.title || 'Unknown') + ' at ' + (d.company || 'Unknown');
        contextData = 'Name/Title: ' + (d.title || 'N/A') + '\nCurrent Company: ' + (d.company || 'N/A') + '\nLocation: ' + ([d.location, d.country].filter(Boolean).join(', ') || 'N/A') + '\nSeniority: ' + (d.seniority_level || 'N/A') + '\nIndustry: ' + (d.industry || 'N/A') + '\nScore: ' + (d.score || 'N/A') + '\nPipeline Stage: ' + (d.pipeline_stage || 'N/A') + '\nSummary: ' + (d.summary || 'No summary') + '\nSkills: ' + (Array.isArray(d.skills) ? d.skills.join(', ') : (d.skills || 'N/A')) + '\nStrengths: ' + (d.strengths || 'N/A') + '\nAssessment Notes: ' + (d.assessment_notes || 'N/A') + '\n\nCareer History:\n' + career + '\n\nEducation:\n' + edu;
      } else if (entityType === 'mandate') {
        const { data, error } = await supabase.from('mandates').select('*').eq('id', entityId).maybeSingle();
        if (error || !data) { res.status(404).json({ error: 'Mandate not found' }); return; }
        const d = data as any;
        const { count } = await supabase.from('candidates_pipeline').select('*', { count: 'exact', head: true }).eq('mandate_id', entityId);
        contextLabel = 'MANDATE: ' + (d.title || 'Unknown');
        contextData = 'Title: ' + (d.title || 'N/A') + '\nCompany: ' + (d.company || 'N/A') + '\nStatus: ' + (d.status || 'N/A') + '\nSeniority Level: ' + (d.seniority_level || 'N/A') + '\nLocation: ' + (d.location || 'N/A') + '\nIndustry: ' + (d.industry || 'N/A') + '\nKeywords: ' + (d.keywords || 'N/A') + '\nDescription: ' + ((d.description || 'N/A').substring(0, 500)) + '\nFee: ' + (d.fee || 'N/A') + '\nPriority: ' + (d.priority || 'N/A') + '\nCreated: ' + (d.created_at || 'N/A') + '\nCandidates in Pipeline: ' + (count || 0) + '\nHiring Manager: ' + (d.hiring_manager_name || 'N/A') + '\nTeam: ' + (d.team || 'N/A');
      } else {
        res.status(400).json({ error: 'Invalid entityType' });
        return;
      }
      const sysPrompt = 'You are a senior executive search analyst at LYC Partners, a Shanghai-based executive search firm. Generate a concise, actionable executive summary for the consultant reviewing this profile. Be specific, data-driven, and highlight what matters for placement decisions. Write in professional English. Max 150 words.\n\nReturn JSON: {"summary": "the summary text", "keyStrengths": ["s1", "s2", "s3"], "riskFlags": ["f1"] or [], "recommendedAction": "one sentence recommendation"}';
      const usrPrompt = 'Generate an executive summary for this ' + entityType + ':\n\n' + contextData;
      const result = await callDeepSeek(sysPrompt, usrPrompt, 0.5, 600);
      if (result.error) { res.status(500).json({ error: result.error }); return; }
      try {
        let jsonStr = result.content?.trim() || '';
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) jsonStr = jsonMatch[1] || jsonMatch[0];
        const data = JSON.parse(jsonStr);
        res.status(200).json({
          success: true,
          data: {
            entityType, entityId, contextLabel,
            summary: data.summary || '',
            keyStrengths: Array.isArray(data.keyStrengths) ? data.keyStrengths : [],
            riskFlags: Array.isArray(data.riskFlags) ? data.riskFlags : [],
            recommendedAction: data.recommendedAction || '',
          },
          usage: result.usage,
        });
        return;
      } catch (parseError) {
        res.status(500).json({ error: 'Failed to parse AI summary response' });
        return;
      }
    }

    // ─── Mandate Status Report ─────────────────────────────────────────────────
    if (action === 'mandate-report') {
      const { mandateId } = req.body || {};
      if (!mandateId) { res.status(400).json({ error: 'Missing mandateId' }); return; }

      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
      );

      const { data: mandate, error } = await supabase.from('mandates').select('*').eq('id', mandateId).maybeSingle();
      if (error || !mandate) { res.status(404).json({ error: 'Mandate not found' }); return; }
      const m = mandate as any;

      // Get pipeline candidates
      const { data: pipeline } = await supabase.from('candidates_pipeline').select('*, contacts(title, company, location, country, seniority_level, score)').eq('mandate_id', mandateId);
      const candidates = (pipeline || []) as any[];

      const stageGroups = ['GRID', 'LENS', 'SWEEP', 'CANVA', 'PLACED'].map(stage => {
        const inStage = candidates.filter(c => c.stage === stage);
        return { stage, count: inStage.length, candidates: inStage.slice(0, 5).map((c: any) => c.contacts?.title || 'Unknown') };
      });

      const contextData = 'Mandate: ' + (m.title || 'N/A') + '\nCompany: ' + (m.company || 'N/A') + '\nStatus: ' + (m.status || 'N/A') + '\nSeniority: ' + (m.seniority_level || 'N/A') + '\nLocation: ' + (m.location || 'N/A') + '\nPriority: ' + (m.priority || 'N/A') + '\nCreated: ' + (m.created_at || 'N/A') + '\n\nPipeline Summary:\n' + stageGroups.map(s => s.stage + ': ' + s.count + ' candidates' + (s.candidates.length ? ' (' + s.candidates.join(', ') + ')' : '')).join('\n') + '\n\nTotal Candidates: ' + candidates.length;

      const sysPrompt = 'You are a senior executive search analyst at LYC Partners. Generate a professional mandate status report. Include: (1) Executive Summary (2-3 sentences), (2) Pipeline Health Assessment, (3) Key Risks or Bottlenecks, (4) Recommended Next Actions (3-5 bullet points). Be specific and data-driven. Write in professional English. Max 300 words.\n\nReturn JSON: {"title": "report title", "executiveSummary": "text", "pipelineHealth": "text", "keyRisks": ["risk1", "risk2"], "nextActions": ["action1", "action2", "action3"], "generatedAt": "ISO timestamp"}';

      const result = await callDeepSeek(sysPrompt, 'Generate a mandate status report:\n\n' + contextData, 0.5, 800);
      if (result.error) { res.status(500).json({ error: result.error }); return; }

      try {
        let jsonStr = result.content?.trim() || '';
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) jsonStr = jsonMatch[1] || jsonMatch[0];
        const data = JSON.parse(jsonStr);
        res.status(200).json({ success: true, data: { mandateId, ...data, pipeline: stageGroups }, usage: result.usage });
        return;
      } catch {
        res.status(500).json({ error: 'Failed to parse mandate report' });
        return;
      }
    }

    res.status(404).json({ error: 'Unknown action' });
  } catch (err: any) {
    console.error('[aiHandler]', err);
    res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(err?.message || err) : undefined,
    });
  }
}
