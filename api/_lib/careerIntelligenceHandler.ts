import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import * as db from './supabaseRest.js';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

const SEQUENCE_TEMPLATES: Record<string, { step: number; dayOffset: number; intelligenceTypes: string[]; messageTemplate: string }[]> = {
  ALPHA_CAREER: [
    { step: 1, dayOffset: 0, intelligenceTypes: ['comp_benchmark'], messageTemplate: 'personalized_intelligence' },
    { step: 2, dayOffset: 30, intelligenceTypes: ['skill_demand', 'market_timing'], messageTemplate: 'market_update' },
    { step: 3, dayOffset: 60, intelligenceTypes: ['career_trajectory'], messageTemplate: 'career_path_insight' },
    { step: 4, dayOffset: 90, intelligenceTypes: ['comp_benchmark', 'movement_intel'], messageTemplate: 'quarterly_review' },
    { step: 5, dayOffset: 120, intelligenceTypes: ['skill_demand'], messageTemplate: 'skill_market_update' },
    { step: 6, dayOffset: 180, intelligenceTypes: ['comp_benchmark'], messageTemplate: 'semi_annual_benchmark' },
    { step: 7, dayOffset: 270, intelligenceTypes: ['career_trajectory', 'skill_demand'], messageTemplate: 'career_review' },
    { step: 8, dayOffset: 365, intelligenceTypes: ['comp_benchmark', 'career_trajectory', 'skill_demand'], messageTemplate: 'annual_review' }
  ],
  BETA_QUARTERLY: [
    { step: 1, dayOffset: 0, intelligenceTypes: ['comp_benchmark'], messageTemplate: 'market_update' },
    { step: 2, dayOffset: 90, intelligenceTypes: ['skill_demand'], messageTemplate: 'skill_update' },
    { step: 3, dayOffset: 180, intelligenceTypes: ['comp_benchmark'], messageTemplate: 'market_update' },
    { step: 4, dayOffset: 270, intelligenceTypes: ['career_trajectory'], messageTemplate: 'career_insight' },
    { step: 5, dayOffset: 365, intelligenceTypes: ['comp_benchmark', 'skill_demand'], messageTemplate: 'annual_review' }
  ],
  GAMMA_SEMI_ANNUAL: [
    { step: 1, dayOffset: 0, intelligenceTypes: ['comp_benchmark'], messageTemplate: 'general_market_update' },
    { step: 2, dayOffset: 180, intelligenceTypes: ['skill_demand'], messageTemplate: 'skill_trend' },
    { step: 3, dayOffset: 365, intelligenceTypes: ['comp_benchmark'], messageTemplate: 'annual_update' }
  ],
  S8_NOT_INTERESTED: [
    { step: 1, dayOffset: 14, intelligenceTypes: ['comp_benchmark'], messageTemplate: 'value_first_no_pitch' },
    { step: 2, dayOffset: 42, intelligenceTypes: ['skill_demand', 'market_timing'], messageTemplate: 'market_update' },
    { step: 3, dayOffset: 84, intelligenceTypes: ['career_trajectory'], messageTemplate: 'career_insight' },
    { step: 4, dayOffset: 168, intelligenceTypes: ['comp_benchmark'], messageTemplate: 'benchmark_offer' }
  ],
  S4_NO_RESPONSE: [
    { step: 1, dayOffset: 30, intelligenceTypes: ['comp_benchmark'], messageTemplate: 'gentle_reach_out' },
    { step: 2, dayOffset: 60, intelligenceTypes: ['skill_demand'], messageTemplate: 'market_update' },
    { step: 3, dayOffset: 120, intelligenceTypes: ['career_trajectory'], messageTemplate: 'career_insight' }
  ]
};

function getTierColor(tier: string) {
  switch (tier) {
    case 'ALPHA': return 'text-purple-600 bg-purple-50';
    case 'BETA': return 'text-blue-600 bg-blue-50';
    case 'GAMMA': return 'text-gray-600 bg-gray-50';
    default: return 'text-gray-400 bg-gray-50';
  }
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical': return 'text-red-600 bg-red-50';
    case 'high': return 'text-orange-600 bg-orange-50';
    case 'medium': return 'text-amber-600 bg-amber-50';
    default: return 'text-gray-600 bg-gray-50';
  }
}

function getNurtureStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'text-green-600 bg-green-50';
    case 'PAUSED': return 'text-gray-600 bg-gray-50';
    case 'COMPLETED': return 'text-blue-600 bg-blue-50';
    case 'CONVERTED': return 'text-purple-600 bg-purple-50';
    case 'DECLINED': return 'text-red-600 bg-red-50';
    default: return 'text-gray-400 bg-gray-50';
  }
}

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

async function callDeepSeek(prompt: string, options: { max_tokens?: number; temperature?: number; response_format?: any } = {}) {
  if (!DEEPSEEK_API_KEY) {
    return {
      choices: [{ message: { content: JSON.stringify({ summary: 'Insight generation requires DeepSeek API key.', message: 'Career insights unavailable - configure DeepSeek API key to enable.', follow_up_offer: '' }) } }],
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
      model: 'deepseek-chat',
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

async function generateCareerBenchmark(contactId: string) {
  const contact = await db.selectOne('contacts', {
    select: 'id, full_name, current_role, current_company, industry, location, years_experience, skills, trident_scores',
    column: 'id',
    value: contactId,
  });

  if (!contact) throw new Error('Contact not found');

  const closedPlacements = await db.selectMany('contacts', {
    select: 'current_role, current_company, location, stage_change_date',
    where: [
      { column: 'pipeline_stage', value: 'S19_Closed' },
      { column: 'is_archived', value: false },
    ],
    limit: 50,
  });

  const activeMandates = await db.selectMany('mandates', {
    select: 'id, title, required_skills, location, status',
    where: [{ column: 'status', value: ['active', 'in_progress'], op: 'in' }],
    limit: 20,
  });

  const compPlacements = (closedPlacements || []).map((p: any) => ({
    role: p.current_role,
    company: p.current_company,
    location: p.location,
    date: p.stage_change_date,
  }));

  const relevantComps = compPlacements
    .filter((p: any) => matchesRole(p.role, contact.current_role) && matchesGeo(p.location, contact.location))
    .length;

  const trajectoryHistory = (closedPlacements || [])
    .filter((p: any) => matchesRole(p.role, contact.current_role))
    .map((p: any) => ({ from_role: contact.current_role, to_role: p.current_role, years_in_role: 3 }));

  const matchingMandates = (activeMandates || []).filter((m: any) => {
    const reqSkills = m.required_skills || [];
    const candidateSkills = contact.skills || [];
    return reqSkills.some((s: string) => candidateSkills.includes(s));
  });

  const trajectoryGroups: Record<string, number> = {};
  for (const t of trajectoryHistory) {
    trajectoryGroups[t.to_role] = (trajectoryGroups[t.to_role] || 0) + 1;
  }
  const totalTransitions = trajectoryHistory.length;
  const trajectoryPaths = Object.entries(trajectoryGroups)
    .map(([role, count]) => ({
      label: role,
      likelihood: totalTransitions > 0 ? Math.round((count / totalTransitions) * 100) / 100 : 0,
      avg_years: 3,
    }))
    .sort((a, b) => b.likelihood - a.likelihood)
    .slice(0, 5);

  const allDesiredSkills = new Set<string>();
  for (const m of matchingMandates) {
    (m.required_skills || []).forEach((s: string) => allDesiredSkills.add(s));
  }
  const skillGaps = [...allDesiredSkills].filter((s: string) => !(contact.skills || []).includes(s));

  const tridentScores = contact.trident_scores || {};
  const capabilityScore = tridentScores.capability || 50;
  const demandScore = Math.min(100, Math.round(
    (matchingMandates.length * 10) + capabilityScore * 0.3 + ((contact.skills || []).length > 5 ? 10 : 0)
  ));

  const narrativePrompt = `You are a career intelligence advisor. Generate a brief career benchmark summary for the following candidate:
Profile:
- Current Role: ${contact.current_role || 'Unknown'} at ${contact.current_company || 'Unknown'}
- Industry: ${contact.industry || 'Unknown'}
- Location: ${contact.location || 'Unknown'}
- Experience: ${contact.years_experience || 'N/A'} years
- Key Skills: ${(contact.skills || []).join(', ') || 'Not specified'}

Market Context:
- Data Points: ${relevantComps} historical placements
- Top Career Paths: ${trajectoryPaths.map((t: any) => `${t.label} (${Math.round(t.likelihood * 100)}% likelihood)`).join(', ') || 'Insufficient data'}
- Skill Gaps: ${skillGaps.join(', ') || 'None identified'}
- Market Demand Score: ${demandScore}/100
- Active Matching Mandates: ${matchingMandates.length}

Generate a 3-4 sentence career benchmark summary that:
1. States their market position clearly
2. Highlights their strongest career trajectory
3. Identifies the key skill gap to address
4. Provides one actionable recommendation

Be specific, data-driven, and concise. Do NOT mention specific compensation figures.
Respond in JSON: {"narrative": "the summary text"}`;

  let narrative = `Market position analysis for ${contact.full_name}. Based on ${matchingMandates.length} active matching mandates and a market demand score of ${demandScore}/100, this candidate is in ${demandScore > 60 ? 'strong' : demandScore > 30 ? 'moderate' : 'developing'} demand. Key growth areas: ${skillGaps.slice(0, 3).join(', ') || 'continuing professional development'}. Recommendation: ${trajectoryPaths.length > 0 ? `Explore path to ${trajectoryPaths[0].label}` : 'Build specialized expertise'}.`;
  let tokensUsed = 0;

  try {
    const dsResult = await callDeepSeek(narrativePrompt, { max_tokens: 500, temperature: 0.3, response_format: { type: 'json_object' } });
    const content = dsResult.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    if (parsed.narrative) narrative = parsed.narrative;
    tokensUsed = dsResult.usage?.total_tokens || 0;
  } catch (e) {
    console.error('DeepSeek benchmark narrative failed:', e);
  }

  const dataPoints = relevantComps + trajectoryHistory.length + matchingMandates.length;
  const dataConfidence = Math.min(1, dataPoints / 30);

  const benchmark = await db.insert('career_benchmarks', {
    contact_id: contactId,
    data_confidence: dataConfidence,
    data_sources_used: ['placement_history', 'pipeline_transitions', 'active_mandates', 'trident_scores'],
    comp_data_points: relevantComps,
    trajectory_paths: trajectoryPaths,
    current_skills: contact.skills || [],
    skill_gaps: skillGaps,
    market_demand_score: demandScore,
    active_mandates_matching: matchingMandates.length,
    demand_trend: demandScore > 60 ? 'increasing' : demandScore > 30 ? 'stable' : 'decreasing',
    narrative_summary: narrative,
    tokens_used: tokensUsed,
    is_current: true,
  });

  if (benchmark) {
    await db.update('career_benchmarks',
      {
        where: [
          { column: 'contact_id', value: contactId },
          { column: 'is_current', value: true },
          { column: 'id', value: benchmark.id, op: 'neq' },
        ],
      },
      { is_current: false, superseded_by: benchmark.id }
    );

    await db.update('contacts',
      { column: 'id', value: contactId },
      {
        career_benchmark: {
          comp_percentile: null,
          trajectory_paths: trajectoryPaths,
          skill_gaps: skillGaps,
          market_demand_score: demandScore,
          generated_at: new Date().toISOString(),
        },
      }
    );
  }

  return benchmark;
}

async function detectMovementSignals(contactId: string) {
  const contact = await db.selectOne('contacts', {
    select: '*, trident_scores',
    column: 'id',
    value: contactId,
  });

  if (!contact) return [];

  const signals: any[] = [];
  const existingSignals = contact.movement_signals || [];

  if (contact.years_in_role && contact.years_in_role >= 3) {
    signals.push({
      type: 'tenure_threshold',
      source: 'automated',
      severity: contact.years_in_role >= 5 ? 'medium' : 'low',
      detected_at: new Date().toISOString(),
      description: `${contact.years_in_role} years in current role at ${contact.current_company}`,
      auto_detected: true,
    });
  }

  if (contact.current_company) {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const peers = await db.selectMany('contacts', {
      select: 'id, full_name, pipeline_stage, current_role',
      where: [
        { column: 'current_company', value: contact.current_company },
        { column: 'id', value: contactId, op: 'neq' },
        { column: 'stage_change_date', value: ninetyDaysAgo, op: 'gte' },
        { column: 'pipeline_stage', value: ['S12_Presented_to_Client', 'S17_Offer_Accepted', 'S19_Closed'], op: 'in' },
      ],
    });

    if (peers && peers.length >= 2) {
      signals.push({
        type: 'peer_movement',
        source: 'automated',
        severity: 'medium',
        detected_at: new Date().toISOString(),
        description: `${peers.length} peers from ${contact.current_company} moved in last 90 days`,
        peer_count: peers.length,
        auto_detected: true,
      });
    }
  }

  if (contact.pipeline_stage && ['S3_Contacted', 'S4_No_Response'].includes(contact.pipeline_stage)) {
    const daysSinceLastActivity = contact.last_engaged_at
      ? Math.floor((Date.now() - new Date(contact.last_engaged_at).getTime()) / (24 * 60 * 60 * 1000))
      : null;
    if (daysSinceLastActivity && daysSinceLastActivity > 60) {
      signals.push({
        type: 'pipeline_stagnation',
        source: 'automated',
        severity: 'low',
        detected_at: new Date().toISOString(),
        description: `No engagement for ${daysSinceLastActivity} days`,
        auto_detected: true,
      });
    }
  }

  const newSignals = [...existingSignals];
  for (const signal of signals) {
    const recentSame = existingSignals.find(
      (s: any) => s.type === signal.type &&
        new Date(s.detected_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    if (!recentSame) {
      newSignals.push(signal);
    }
  }

  await db.update('contacts',
    { column: 'id', value: contactId },
    { movement_signals: newSignals }
  );

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentSignals = newSignals.filter(
    (s: any) => new Date(s.detected_at) > thirtyDaysAgo
  );
  const highSeverityCount = recentSignals.filter((s: any) => ['high', 'critical'].includes(s.severity)).length;

  if (highSeverityCount >= 2 || recentSignals.length >= 3) {
    try {
      await db.insert('notifications', {
        type: 'movement_signal_alert',
        recipient_id: contact.assigned_to,
        title: `Movement signals detected for ${contact.full_name}`,
        body: `${recentSignals.length} signals detected in last 30 days. Review and consider reaching out.`,
        channel: 'in_app',
        metadata: { contact_id: contactId, signals: recentSignals },
        action_url: `/candidates/${contactId}`,
      });
    } catch (e) {
      // Notification table may not exist yet
    }
  }

  return signals;
}

async function enrollInNurture(contactId: string, sequenceType: string, consultantId?: string) {
  const template = SEQUENCE_TEMPLATES[sequenceType];
  if (!template) throw new Error(`Unknown sequence type: ${sequenceType}`);

  const now = new Date();
  const nextTouch = new Date(now.getTime() + template[0].dayOffset * 24 * 60 * 60 * 1000);

  const sequence = await db.insert('nurture_sequences', {
    contact_id: contactId,
    sequence_type: sequenceType,
    current_step: 1,
    total_steps: template.length,
    cadence_days: template.length > 1 ? template[1].dayOffset - template[0].dayOffset : 30,
    next_touch_at: nextTouch.toISOString(),
    status: 'ACTIVE',
    intelligence_types: template[0].intelligenceTypes,
    consultant_id: consultantId,
  });

  await db.update('contacts',
    { column: 'id', value: contactId },
    {
      nurture_enrolled: true,
      nurture_stage: 'WAITING',
      nurture_next_touch: nextTouch.toISOString(),
    }
  );

  return sequence;
}

async function processNurtureQueue(limit = 50) {
  const now = new Date().toISOString();
  const dueSequences = await db.selectMany('nurture_sequences', {
    select: '*, contacts(id, full_name, current_role, current_company, industry, location, skills, career_tier, preference_model, career_benchmark, agent_conversation_log)',
    where: [
      { column: 'status', value: 'ACTIVE' },
      { column: 'next_touch_at', value: now, op: 'lte' },
    ],
    limit,
  });

  let processed = 0;
  let sent = 0;
  let errors = 0;

  for (const sequence of dueSequences || []) {
    try {
      const contact = sequence.contacts;
      const template = SEQUENCE_TEMPLATES[sequence.sequence_type];
      const currentTemplate = template[sequence.current_step - 1];

      if (!currentTemplate) {
        await db.update('nurture_sequences',
          { column: 'id', value: sequence.id },
          { status: 'COMPLETED', completed_at: new Date().toISOString() }
        );
        processed++;
        continue;
      }

      const msgPrompt = `You are LYC Intelligence's AI Career Advisor. You are NOT a recruiter. You provide genuine career intelligence and market insights.

Contact: ${contact.full_name || 'Candidate'}
Current Role: ${contact.current_role || 'Unknown'} at ${contact.current_company || 'Unknown'}
Industry: ${contact.industry || 'Unknown'}
Location: ${contact.location || 'Unknown'}
Key Skills: ${(contact.skills || []).join(', ') || 'Unknown'}
Career Tier: ${contact.career_tier}
Intelligence Types to Deliver: ${currentTemplate.intelligenceTypes.join(', ')}
Touch Step: ${sequence.current_step}
Message Style: ${currentTemplate.messageTemplate}

IMPORTANT RULES:
1. This is NOT a job pitch. You are sharing valuable market intelligence.
2. Be specific and data-driven. Use ranges, not absolutes.
3. Reference their specific situation (role, industry, location).
4. Keep it concise — 3-5 sentences max.
5. End with a soft, no-pressure offer for deeper insight.
6. Never mention a specific job opening.
7. Tone: professional, warm, informative.
8. If this is step 1, introduce yourself as LYC's AI career advisor.

Respond in JSON: {"subject": "subject line", "message": "the message text", "summary": "one-line summary", "follow_up_offer": "optional offer"}`;

      let messageContent = {
        subject: `Career Insight for ${contact.full_name}`,
        message: `Hi ${contact.full_name?.split(' ')[0] || 'there'}, I'm LYC's AI Career Advisor. Here's a quick market update for your role: demand for professionals in ${contact.industry || 'your field'} is ${contact.career_benchmark?.market_demand_score > 60 ? 'strong' : 'steady'}. Key skills in demand: ${(contact.skills || []).slice(0, 3).join(', ') || 'continuing development'}. Would you like a deeper career benchmark analysis?`,
        summary: `Market intelligence delivered (${currentTemplate.intelligenceTypes.join(', ')})`,
        follow_up_offer: 'Reply for a personalized career benchmark',
      };
      let tokensUsed = 0;

      try {
        const dsResult = await callDeepSeek(msgPrompt, { max_tokens: 800, temperature: 0.4, response_format: { type: 'json_object' } });
        const content = dsResult.choices?.[0]?.message?.content || '{}';
        const parsed = JSON.parse(content);
        if (parsed.message) messageContent = { ...messageContent, ...parsed };
        tokensUsed = dsResult.usage?.total_tokens || 0;
      } catch (e) {
        console.error('DeepSeek nurture message failed:', e);
      }

      await db.insert('career_intelligence_log', {
        contact_id: contact.id,
        intelligence_type: currentTemplate.intelligenceTypes[0] || 'nurture_touch',
        direction: 'outbound',
        channel: 'platform',
        content_summary: messageContent.summary,
        full_content: messageContent,
        consultant_id: sequence.consultant_id,
        agent_tokens_used: tokensUsed,
      });

      const nextStep = sequence.current_step + 1;
      const isComplete = nextStep > sequence.total_steps;
      let nextTouchDate = null;
      if (!isComplete && template[nextStep - 1]) {
        const daysUntilNext = template[nextStep - 1].dayOffset - currentTemplate.dayOffset;
        nextTouchDate = new Date(Date.now() + daysUntilNext * 24 * 60 * 60 * 1000);
      }

      await db.update('nurture_sequences',
        { column: 'id', value: sequence.id },
        {
          current_step: isComplete ? sequence.total_steps : nextStep,
          next_touch_at: nextTouchDate?.toISOString() || now,
          status: isComplete ? 'COMPLETED' : 'ACTIVE',
          touch_count: sequence.touch_count + 1,
          last_touch_at: new Date().toISOString(),
          completed_at: isComplete ? new Date().toISOString() : null,
        }
      );

      await db.update('contacts',
        { column: 'id', value: contact.id },
        {
          nurture_stage: isComplete ? 'ENGAGED' : 'ENGAGED',
          nurture_next_touch: nextTouchDate?.toISOString() || null,
          last_engaged_at: new Date().toISOString(),
        }
      );

      sent++;
    } catch (err) {
      console.error(`Nurture failed for sequence ${sequence.id}:`, err);
      errors++;
    }
    processed++;
  }

  return { processed, sent, errors };
}

async function processConversationResponse(contactId: string, conversationText: string, direction: 'inbound' | 'outbound') {
  const contact = await db.selectOne('contacts', {
    select: '*, motivation_assessment, preference_model',
    column: 'id',
    value: contactId,
  });

  if (!contact) return null;

  const extractionPrompt = `Analyze this conversation between a career intelligence advisor and a candidate. Extract structured signals.

Candidate Context:
- Name: ${contact.full_name}
- Current Role: ${contact.current_role} at ${contact.current_company}
- Current Pipeline Stage: ${contact.pipeline_stage}
- Current Career Tier: ${contact.career_tier}

Conversation:
${conversationText}

Extract the following in JSON format:
{
  "engagement_level": "positive|neutral|negative|no_response",
  "preferences_disclosed": {
    "comp_min": null,
    "comp_preferred": null,
    "location_preferences": [],
    "role_types": [],
    "industry_preferences": [],
    "dealbreakers": [],
    "ideal_timeline": null
  },
  "movement_signals": [],
  "interest_in_opportunities": false,
  "explicit_interest_in_role": null,
  "opt_out_requested": false,
  "escalation_needed": false,
  "escalation_reason": null,
  "conversation_summary": "2-3 sentence summary",
  "recommended_pipeline_action": "none|advance_stage|enroll_nurture|fast_track|pause_outreach"
}`;

  let signals: any = {
    engagement_level: 'neutral',
    preferences_disclosed: {},
    movement_signals: [],
    interest_in_opportunities: false,
    explicit_interest_in_role: null,
    opt_out_requested: false,
    escalation_needed: false,
    escalation_reason: null,
    conversation_summary: `Conversation logged. Length: ${conversationText.length} chars.`,
    recommended_pipeline_action: 'none',
  };

  try {
    const dsResult = await callDeepSeek(extractionPrompt, { max_tokens: 1000, temperature: 0.1, response_format: { type: 'json_object' } });
    const content = dsResult.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    signals = { ...signals, ...parsed };
  } catch (e) {
    console.error('DeepSeek conversation extraction failed:', e);
  }

  let engagementDelta = 0;
  if (signals.engagement_level === 'positive') engagementDelta = 10;
  else if (signals.engagement_level === 'neutral') engagementDelta = 2;
  else if (signals.engagement_level === 'negative') engagementDelta = -5;

  const newEngagementScore = Math.max(0, Math.min(100, (contact.engagement_score || 0) + engagementDelta));

  const currentPrefs = contact.preference_model || {};
  const newPrefs = { ...currentPrefs };
  if (signals.preferences_disclosed) {
    for (const [key, value] of Object.entries(signals.preferences_disclosed)) {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value) && value.length > 0) {
          newPrefs[key] = [...new Set([...(currentPrefs[key] || []), ...value])];
        } else if (typeof value === 'number' || (typeof value === 'string' && value)) {
          newPrefs[key] = value;
        }
      }
    }
    newPrefs.updated_at = new Date().toISOString();
  }

  const currentSignals = contact.movement_signals || [];
  const newMovementSignals = [...currentSignals];
  if (signals.movement_signals && Array.isArray(signals.movement_signals)) {
    for (const ms of signals.movement_signals) {
      newMovementSignals.push({ ...ms, source: 'conversation', detected_at: new Date().toISOString() });
    }
  }

  let pipelineAction = signals.recommended_pipeline_action || 'none';
  if (signals.opt_out_requested) {
    pipelineAction = 'pause_outreach';
  } else if (signals.explicit_interest_in_role) {
    pipelineAction = 'fast_track';
  }

  const updates: any = {
    engagement_score: newEngagementScore,
    preference_model: newPrefs,
    movement_signals: newMovementSignals,
    last_engaged_at: new Date().toISOString(),
  };

  if (contact.nurture_enrolled) {
    if (signals.engagement_level === 'positive') {
      updates.nurture_stage = 'RESPONDED';
    } else if (signals.opt_out_requested) {
      updates.nurture_stage = 'DECLINED_NURTURE';
      updates.nurture_enrolled = false;
    }
  }

  const conversationLog = contact.agent_conversation_log || [];
  conversationLog.unshift({
    date: new Date().toISOString(),
    summary: signals.conversation_summary,
    engagement: signals.engagement_level,
    action: pipelineAction,
  });
  updates.agent_conversation_log = conversationLog.slice(0, 5);

  if (newEngagementScore >= 70 && contact.career_tier === 'GAMMA') {
    updates.career_tier = 'BETA';
  } else if (newEngagementScore >= 90 && contact.career_tier === 'BETA') {
    updates.career_tier = 'ALPHA';
  } else if (newEngagementScore < 20 && contact.career_tier === 'BETA') {
    updates.career_tier = 'GAMMA';
  }

  await db.update('contacts',
    { column: 'id', value: contactId },
    updates
  );

  if (signals.escalation_needed && contact.assigned_to) {
    try {
      await db.insert('notifications', {
        type: 'conversation_escalation',
        recipient_id: contact.assigned_to,
        title: `Conversation requires your attention: ${contact.full_name}`,
        body: signals.escalation_reason || 'Candidate conversation requires human follow-up.',
        channel: 'in_app',
        metadata: { contact_id: contactId, signals },
        action_url: `/candidates/${contactId}`,
      });
    } catch (e) {
      // notification table may not exist
    }
  }

  await db.insert('career_intelligence_log', {
    contact_id: contactId,
    intelligence_type: 'general',
    direction: direction,
    channel: 'platform',
    content_summary: signals.conversation_summary,
    signals_captured: signals,
    engagement_impact: signals.engagement_level?.toUpperCase() || 'NEUTRAL',
  });

  return signals;
}

async function runAutoEnroll() {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const s8Candidates = await db.selectMany('contacts', {
    select: 'id, assigned_to',
    where: [
      { column: 'pipeline_stage', value: 'S8_Not_Interested' },
      { column: 'nurture_enrolled', value: false },
      { column: 'is_archived', value: false },
      { column: 'decline_reason', value: 'COMPENSATION', op: 'neq' },
      { column: 'stage_change_date', value: fourteenDaysAgo, op: 'gte' },
    ],
  });

  let s8Enrolled = 0;
  for (const c of s8Candidates || []) {
    try {
      await enrollInNurture(c.id, 'S8_NOT_INTERESTED', c.assigned_to);
      s8Enrolled++;
    } catch (e) { /* skip */ }
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const s4Candidates = await db.selectMany('contacts', {
    select: 'id, assigned_to, career_tier',
    where: [
      { column: 'pipeline_stage', value: 'S4_No_Response' },
      { column: 'nurture_enrolled', value: false },
      { column: 'is_archived', value: false },
      { column: 'career_tier', value: ['ALPHA', 'BETA'], op: 'in' },
      { column: 'last_engaged_at', value: thirtyDaysAgo, op: 'lte' },
    ],
  });

  let s4Enrolled = 0;
  for (const c of s4Candidates || []) {
    try {
      await enrollInNurture(c.id, 'S4_NO_RESPONSE', c.assigned_to);
      s4Enrolled++;
    } catch (e) { /* skip */ }
  }

  const highValueGamma = await db.selectMany('contacts', {
    select: 'id, assigned_to, trident_scores',
    where: [
      { column: 'career_tier', value: 'GAMMA' },
      { column: 'is_archived', value: false },
      { column: 'nurture_enrolled', value: false },
    ],
  });

  let gammaPromoted = 0;
  for (const c of highValueGamma || []) {
    const capability = c.trident_scores?.capability || 0;
    if (capability >= 70) {
      try {
        await db.update('contacts',
          { column: 'id', value: c.id },
          { career_tier: 'BETA' }
        );
        await enrollInNurture(c.id, 'BETA_QUARTERLY', c.assigned_to);
        gammaPromoted++;
      } catch (e) { /* skip */ }
    }
  }

  return { s8_enrolled: s8Enrolled, s4_enrolled: s4Enrolled, gamma_promoted: gammaPromoted };
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
  const path = url.pathname.replace('/api/career/', '');
  const parts = path.split('/').filter(Boolean);
  const [resource, id, action] = parts;

  const userId = await getUserIdFromReq(req);
  const userRole = userId ? await getUserRole(userId) : null;

  const isConsultant = userRole === 'consultant';
  const isTeamLead = userRole === 'team_lead' || userRole === 'admin';
  const isAdmin = userRole === 'admin';

  try {
    // CI-1: POST /api/career/benchmark/generate
    if (req.method === 'POST' && resource === 'benchmark' && id === 'generate') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { contact_id } = body;
      if (!contact_id) return res.status(400).json({ error: 'contact_id required' });
      const benchmark = await generateCareerBenchmark(contact_id);
      return res.status(200).json({ success: true, benchmark });
    }

    // CI-2: GET /api/career/benchmark/:contactId
    if (req.method === 'GET' && resource === 'benchmark' && id && action !== 'history') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const benchmarks = await db.selectMany('career_benchmarks', {
        select: '*',
        where: [
          { column: 'contact_id', value: id },
          { column: 'is_current', value: true },
        ],
        limit: 1,
      });
      const benchmark = benchmarks && benchmarks.length > 0 ? benchmarks[0] : null;
      return res.status(200).json({ success: true, benchmark });
    }

    // CI-3: GET /api/career/benchmark/:contactId/history
    if (req.method === 'GET' && resource === 'benchmark' && id === 'history') {
      // Actually path is benchmark/:id/history — let's reparse
    }

    // Handle benchmark history: /api/career/benchmark/:contactId/history
    if (req.method === 'GET' && resource === 'benchmark' && action === 'history') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const contactId = id;
      const history = await db.selectMany('career_benchmarks', {
        select: 'id, generated_at, data_confidence, market_demand_score, skill_gaps, narrative_summary',
        where: [{ column: 'contact_id', value: contactId }],
        orderBy: { column: 'generated_at', ascending: false },
        limit: 10,
      });
      return res.status(200).json({ success: true, history });
    }

    // CI-4: POST /api/career/nurture/enroll
    if (req.method === 'POST' && resource === 'nurture' && id === 'enroll') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { contact_id, sequence_type } = body;
      if (!contact_id || !sequence_type) return res.status(400).json({ error: 'contact_id and sequence_type required' });
      const sequence = await enrollInNurture(contact_id, sequence_type, userId);
      return res.status(200).json({ success: true, sequence });
    }

    // CI-5: POST /api/career/nurture/pause
    if (req.method === 'POST' && resource === 'nurture' && id === 'pause') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { contact_id, reason } = body;
      if (!contact_id) return res.status(400).json({ error: 'contact_id required' });
      const data = await db.update('nurture_sequences',
        {
          where: [
            { column: 'contact_id', value: contact_id },
            { column: 'status', value: 'ACTIVE' },
          ],
        },
        { status: 'PAUSED', pause_reason: reason || 'Paused by consultant' }
      );
      await db.update('contacts',
        { column: 'id', value: contact_id },
        { nurture_enrolled: false, nurture_stage: null }
      );
      return res.status(200).json({ success: true, paused: data?.length || 0 });
    }

    // CI-6: GET /api/career/nurture/queue
    if (req.method === 'GET' && resource === 'nurture' && id === 'queue') {
      if (!userId || !isTeamLead) return res.status(403).json({ error: 'Team Lead+ required' });
      const data = await db.selectMany('nurture_sequences', {
        select: '*, contacts(full_name, current_role, current_company, career_tier, engagement_score)',
        where: [{ column: 'status', value: 'ACTIVE' }],
        orderBy: { column: 'next_touch_at', ascending: true },
        limit: 50,
      });
      return res.status(200).json({ success: true, sequences: data });
    }

    // CI-7: POST /api/career/signals/detect
    if (req.method === 'POST' && resource === 'signals' && id === 'detect') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { contact_id } = body;
      if (!contact_id) return res.status(400).json({ error: 'contact_id required' });
      const signals = await detectMovementSignals(contact_id);
      return res.status(200).json({ success: true, signals_detected: signals.length, signals });
    }

    // CI-8: GET /api/career/signals/:contactId
    if (req.method === 'GET' && resource === 'signals' && id && id !== 'detect') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const contactId = id;
      const contact = await db.selectOne('contacts', {
        select: 'movement_signals',
        column: 'id',
        value: contactId,
      });
      return res.status(200).json({ success: true, signals: contact?.movement_signals || [] });
    }

    // CI-9: POST /api/career/conversation/process
    if (req.method === 'POST' && resource === 'conversation' && id === 'process') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { contact_id, text, direction = 'inbound' } = body;
      if (!contact_id || !text) return res.status(400).json({ error: 'contact_id and text required' });
      const result = await processConversationResponse(contact_id, text, direction);
      return res.status(200).json({ success: true, signals: result });
    }

    // CI-10: GET /api/career/log/:contactId
    if (req.method === 'GET' && resource === 'log' && id) {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const contactId = id;
      const log = await db.selectMany('career_intelligence_log', {
        select: '*',
        where: [{ column: 'contact_id', value: contactId }],
        orderBy: { column: 'created_at', ascending: false },
        limit: 50,
      });
      return res.status(200).json({ success: true, log });
    }

    // CI-11: GET /api/career/engagement-leaderboard
    if (req.method === 'GET' && (resource === 'engagement-leaderboard' || (resource === 'leaderboard'))) {
      if (!userId || !isTeamLead) return res.status(403).json({ error: 'Team Lead+ required' });
      const tier = url.searchParams.get('tier');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const where: any[] = [{ column: 'is_archived', value: false }];
      if (tier) where.push({ column: 'career_tier', value: tier });
      const data = await db.selectMany('contacts', {
        select: 'id, full_name, current_role, current_company, career_tier, engagement_score, last_engaged_at, nurture_stage, pipeline_stage, assigned_to',
        where,
        orderBy: { column: 'engagement_score', ascending: false },
        limit,
      });
      return res.status(200).json({ success: true, candidates: data, total: data?.length || 0 });
    }

    // CI-12: GET /api/career/dashboard
    if (req.method === 'GET' && resource === 'dashboard') {
      if (!userId || !isTeamLead) return res.status(403).json({ error: 'Team Lead+ required' });

      const tierDist = await db.selectMany('contacts', {
        select: 'career_tier',
        where: [{ column: 'is_archived', value: false }],
      });

      const tierCounts: Record<string, number> = { ALPHA: 0, BETA: 0, GAMMA: 0, DORMANT: 0 };
      for (const c of tierDist || []) {
        tierCounts[c.career_tier] = (tierCounts[c.career_tier] || 0) + 1;
      }

      const nurtureStats = await db.selectMany('nurture_sequences', {
        select: 'status, sequence_type, touch_count, response_count',
      });

      const nurtureByStatus: Record<string, number> = {};
      let totalTouches = 0;
      let totalResponses = 0;
      for (const n of nurtureStats || []) {
        nurtureByStatus[n.status] = (nurtureByStatus[n.status] || 0) + 1;
        totalTouches += n.touch_count;
        totalResponses += n.response_count;
      }

      const pendingAlertsContacts = await db.selectMany('contacts', {
        select: 'id',
        where: [
          { column: 'is_archived', value: false },
          { column: 'movement_signals', value: '[]', op: 'neq' },
        ],
      });
      const pendingAlerts = pendingAlertsContacts?.length || 0;

      const sevenDaysOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const dueNurtureSeqs = await db.selectMany('nurture_sequences', {
        select: 'id',
        where: [
          { column: 'status', value: 'ACTIVE' },
          { column: 'next_touch_at', value: sevenDaysOut, op: 'lte' },
        ],
      });
      const dueNurture = dueNurtureSeqs?.length || 0;

      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const allAlphaBeta = await db.selectMany('contacts', {
        select: 'id, career_benchmark',
        where: [
          { column: 'career_tier', value: ['ALPHA', 'BETA'], op: 'in' },
          { column: 'is_archived', value: false },
        ],
      });
      const staleCandidates = (allAlphaBeta || []).filter((c: any) => {
        const benchmark = c.career_benchmark;
        if (!benchmark) return true;
        const generatedAt = benchmark.generated_at;
        if (!generatedAt) return true;
        return new Date(generatedAt).getTime() < new Date(ninetyDaysAgo).getTime();
      });

      return res.status(200).json({
        success: true,
        tier_distribution: tierCounts,
        nurture_pipeline: {
          by_status: nurtureByStatus,
          total_touches: totalTouches,
          total_responses: totalResponses,
          response_rate: totalTouches > 0 ? Math.round((totalResponses / totalTouches) * 100) : 0,
        },
        pending_signal_alerts: pendingAlerts || 0,
        nurture_due_7d: dueNurture || 0,
        benchmarks_stale: staleCandidates?.length || 0,
      });
    }

    // Get nurture by contact: GET /api/career/nurture/:contactId
    if (req.method === 'GET' && resource === 'nurture' && id && id !== 'queue' && id !== 'enroll' && id !== 'pause') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const contactId = id;
      const sequences = await db.selectMany('nurture_sequences', {
        select: '*',
        where: [{ column: 'contact_id', value: contactId }],
        orderBy: { column: 'created_at', ascending: false },
      });
      return res.status(200).json({ success: true, sequences });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (error: any) {
    console.error('Career API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export {
  generateCareerBenchmark,
  detectMovementSignals,
  enrollInNurture,
  processNurtureQueue,
  processConversationResponse,
  runAutoEnroll,
};
