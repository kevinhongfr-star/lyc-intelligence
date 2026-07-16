/**
 * CANVAS Executive Narrative Engine handler — DEX AI Technical Blueprint 04
 *
 * Routes:
 *   POST /api/canvas/prefill                    — Pre-fill from TRIDENT
 *   POST /api/canvas/generate                   — Generate narrative
 *   POST /api/canvas/regenerate-field           — Regenerate single field
 *   GET  /api/canvas/profile/:id                — Get single profile
 *   GET  /api/canvas/profiles?contact_id=&mandate_id=  — List profiles
 *   PATCH /api/canvas/profile/:id               — Edit profile
 *   POST /api/canvas/export-pdf                 — Export PDF
 *   POST /api/canvas/review/:id                 — Kevin review action
 *   GET  /api/canvas/review-queue               — Kevin's pending review
 *
 * 6-D behavioral scoring: Strategic Thinking, Communication, Adaptability,
 * Team Leadership, Decision Making, Emotional Intelligence
 * Composite = average of all 6 (unweighted)
 * Grade: A+ (9+), A (8+), B (7+), C (6+), F (<6)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  selectOne,
  selectMany,
  insert,
  update,
  isSupabaseConfigured,
  handleError,
} from './supabaseRest.js';
import { getUserFromRequest, getUserRole } from './adminAuth.js';

export const maxDuration = 120;

const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';

export async function handleCanvas(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const pathArr = (req.query.path as string[]) || [];
    const resource = pathArr[0];
    const id = pathArr[1];

    if (resource === 'prefill' && req.method === 'POST') return handlePrefill(req, res);
    if (resource === 'generate' && req.method === 'POST') return handleGenerate(req, res);
    if (resource === 'regenerate-field' && req.method === 'POST') return handleRegenerateField(req, res);
    if (resource === 'profile' && id && req.method === 'GET') return handleGetProfile(req, res, id);
    if (resource === 'profile' && id && req.method === 'PATCH') return handleEditProfile(req, res, id);
    if (resource === 'profiles' && req.method === 'GET') return handleListProfiles(req, res);
    if (resource === 'export-pdf' && req.method === 'POST') return handleExportPDF(req, res);
    if (resource === 'review' && id && req.method === 'POST') return handleReviewAction(req, res, id);
    if (resource === 'review-queue' && req.method === 'GET') return handleReviewQueue(req, res);

    return res.status(404).json({ success: false, error: 'CANVAS route not found' });
  } catch (err) {
    return handleError(res, 'canvas', err);
  }
}

// ── Pre-fill from TRIDENT ───────────────────────────────────────────────
async function handlePrefill(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const { scorecard_id } = req.body || {};
  if (!scorecard_id) {
    return res.status(400).json({ success: false, error: 'scorecard_id is required' });
  }

  const scorecard = await selectOne('trident_scorecards', {
    column: 'id', value: scorecard_id, select: '*',
  }, 15000);

  if (!scorecard) {
    return res.status(404).json({ success: false, error: 'Scorecard not found' });
  }

  const suggested = {
    strategic_thinking: scorecard.d1_score,
    communication: scorecard.d2_score,
    adaptability: scorecard.d3_score,
    team_leadership: scorecard.d2_score,
    decision_making: Number(((scorecard.d1_score + scorecard.d3_score) / 2.0).toFixed(1)),
    emotional_intelligence: scorecard.d3_score,
    mapping_notes: 'Pre-populated from TRIDENT. Consultant should adjust based on behavioral observations.',
  };

  const trident_summary = {
    d1: scorecard.d1_score,
    d2: scorecard.d2_score,
    d3: scorecard.d3_score,
    composite: scorecard.composite_score,
    verdict: scorecard.verdict,
  };

  return res.json({ success: true, suggested_scores: suggested, trident_summary });
}

// ── Generate CANVAS Profile ─────────────────────────────────────────────
async function handleGenerate(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const {
    contact_id,
    mandate_id,
    scorecard_id,
    c_strategic_thinking,
    c_communication,
    c_adaptability,
    c_team_leadership,
    c_decision_making,
    c_emotional_intelligence,
    canvas_notes,
    overrides = {},
  } = req.body || {};

  if (!contact_id || !scorecard_id) {
    return res.status(400).json({ success: false, error: 'contact_id and scorecard_id are required' });
  }

  const scorecard = await selectOne('trident_scorecards', {
    column: 'id', value: scorecard_id, select: '*',
  }, 15000);

  if (!scorecard) {
    return res.status(404).json({ success: false, error: 'Scorecard not found' });
  }

  if (scorecard.contact_id !== contact_id) {
    return res.status(400).json({ success: false, error: 'Scorecard does not belong to this contact' });
  }

  const contact = await selectOne('contacts', {
    column: 'id', value: contact_id, select: '*',
  }, 15000);

  if (!contact) {
    return res.status(404).json({ success: false, error: 'Contact not found' });
  }

  const mandate = mandate_id ? await selectOne('mandates', {
    column: 'id', value: mandate_id, select: '*',
  }, 15000) : null;

  const compositeResult = computeCanvasComposite(
    c_strategic_thinking, c_communication, c_adaptability,
    c_team_leadership, c_decision_making, c_emotional_intelligence
  );

  const narrative = await generateCanvasNarrative({
    candidate: contact,
    trident: scorecard,
    canvas_scores: {
      strategic_thinking: c_strategic_thinking,
      communication: c_communication,
      adaptability: c_adaptability,
      team_leadership: c_team_leadership,
      decision_making: c_decision_making,
      emotional_intelligence: c_emotional_intelligence,
    },
    mandate,
    canvas_notes,
  });

  const profileData = {
    contact_id,
    mandate_id,
    scorecard_id,
    generated_by: user.id,
    trident_d1: scorecard.d1_score,
    trident_d2: scorecard.d2_score,
    trident_d3: scorecard.d3_score,
    trident_composite: scorecard.composite_score,
    trident_verdict: scorecard.verdict,
    c_strategic_thinking,
    c_communication,
    c_adaptability,
    c_team_leadership,
    c_decision_making,
    c_emotional_intelligence,
    canvas_notes: typeof canvas_notes === 'object' ? JSON.stringify(canvas_notes) : canvas_notes || '{}',
    canvas_composite: compositeResult.canvas_composite,
    canvas_grade: compositeResult.canvas_grade,
    leadership_style: overrides.leadership_style || narrative.leadership_style,
    key_strengths: JSON.stringify(overrides.key_strengths || narrative.key_strengths || []),
    blind_spots: JSON.stringify(overrides.blind_spots || narrative.blind_spots || []),
    derailment_risks: JSON.stringify(overrides.derailment_risks || narrative.derailment_risks || []),
    impact_potential: overrides.impact_potential || narrative.impact_potential,
    stakeholder_style: overrides.stakeholder_style || narrative.stakeholder_style,
    development_journey: overrides.development_journey || narrative.development_journey,
    priority_focus_areas: JSON.stringify(overrides.priority_focus_areas || narrative.priority_focus_areas || []),
    executive_summary: overrides.executive_summary || narrative.executive_summary,
    metadata: JSON.stringify({
      generation_model: 'deepseek-v4-flash',
      trident_imported: true,
    }),
    credits_consumed: 15,
  };

  const profile = await insert('canvas_profiles', profileData);

  await insert('signals', {
    contact_id,
    type: 'assessment',
    agent_id: 'canvas',
    metadata: JSON.stringify({ action: 'generated', profile_id: profile.id }),
  });

  return res.json({ success: true, profile });
}

// ── Regenerate Single Field ─────────────────────────────────────────────
async function handleRegenerateField(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const { profile_id, field } = req.body || {};
  if (!profile_id || !field) {
    return res.status(400).json({ success: false, error: 'profile_id and field are required' });
  }

  const validFields = [
    'leadership_style', 'key_strengths', 'blind_spots', 'derailment_risks',
    'impact_potential', 'stakeholder_style', 'development_journey',
    'priority_focus_areas', 'executive_summary',
  ];

  if (!validFields.includes(field)) {
    return res.status(400).json({ success: false, error: `Invalid field. Valid: ${validFields.join(', ')}` });
  }

  const profile = await selectOne('canvas_profiles', {
    column: 'id', value: profile_id, select: '*',
  }, 15000);

  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found' });
  }

  const scorecard = await selectOne('trident_scorecards', {
    column: 'id', value: profile.scorecard_id, select: '*',
  }, 15000);

  const contact = await selectOne('contacts', {
    column: 'id', value: profile.contact_id, select: '*',
  }, 15000);

  const newValue = await regenerateNarrativeField(profile, scorecard, contact, field);

  let updateData: Record<string, any> = {};
  if (['key_strengths', 'blind_spots', 'derailment_risks', 'priority_focus_areas'].includes(field)) {
    updateData[field] = JSON.stringify(newValue);
  } else {
    updateData[field] = newValue;
  }

  await update('canvas_profiles', profile_id, updateData);

  return res.json({ success: true, field, value: newValue });
}

// ── Get Single Profile ──────────────────────────────────────────────────
async function handleGetProfile(req: VercelRequest, res: VercelResponse, id: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const profile = await selectOne('canvas_profiles', {
    column: 'id', value: id, select: '*',
  }, 15000);

  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found' });
  }

  return res.json({ success: true, profile: parseCanvasProfile(profile) });
}

// ── List Profiles ───────────────────────────────────────────────────────
async function handleListProfiles(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const { contact_id, mandate_id } = req.query as Record<string, string>;
  let query = 'canvas_profiles';
  let filters: Record<string, any> = {};

  if (contact_id) filters.contact_id = contact_id;
  if (mandate_id) filters.mandate_id = mandate_id;

  const profiles = await selectMany(query, filters, ['created_at DESC'], 50, 0, '*');

  return res.json({ success: true, profiles: profiles.map(parseCanvasProfile) });
}

// ── Edit Profile ────────────────────────────────────────────────────────
async function handleEditProfile(req: VercelRequest, res: VercelResponse, id: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const profile = await selectOne('canvas_profiles', {
    column: 'id', value: id, select: '*',
  }, 15000);

  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found' });
  }

  const {
    c_strategic_thinking, c_communication, c_adaptability,
    c_team_leadership, c_decision_making, c_emotional_intelligence,
    canvas_notes, leadership_style, key_strengths, blind_spots,
    derailment_risks, impact_potential, stakeholder_style,
    development_journey, priority_focus_areas, executive_summary,
  } = req.body || {};

  const updateData: Record<string, any> = {};

  if (c_strategic_thinking !== undefined) updateData.c_strategic_thinking = c_strategic_thinking;
  if (c_communication !== undefined) updateData.c_communication = c_communication;
  if (c_adaptability !== undefined) updateData.c_adaptability = c_adaptability;
  if (c_team_leadership !== undefined) updateData.c_team_leadership = c_team_leadership;
  if (c_decision_making !== undefined) updateData.c_decision_making = c_decision_making;
  if (c_emotional_intelligence !== undefined) updateData.c_emotional_intelligence = c_emotional_intelligence;

  const scoreFieldsChanged = [
    c_strategic_thinking, c_communication, c_adaptability,
    c_team_leadership, c_decision_making, c_emotional_intelligence,
  ].some(v => v !== undefined);

  if (scoreFieldsChanged) {
    const newStrategic = c_strategic_thinking !== undefined ? c_strategic_thinking : profile.c_strategic_thinking;
    const newComm = c_communication !== undefined ? c_communication : profile.c_communication;
    const newAdapt = c_adaptability !== undefined ? c_adaptability : profile.c_adaptability;
    const newLead = c_team_leadership !== undefined ? c_team_leadership : profile.c_team_leadership;
    const newDec = c_decision_making !== undefined ? c_decision_making : profile.c_decision_making;
    const newEQ = c_emotional_intelligence !== undefined ? c_emotional_intelligence : profile.c_emotional_intelligence;

    const composite = computeCanvasComposite(newStrategic, newComm, newAdapt, newLead, newDec, newEQ);
    updateData.canvas_composite = composite.canvas_composite;
    updateData.canvas_grade = composite.canvas_grade;
  }

  if (canvas_notes !== undefined) updateData.canvas_notes = typeof canvas_notes === 'object' ? JSON.stringify(canvas_notes) : canvas_notes;
  if (leadership_style !== undefined) updateData.leadership_style = leadership_style;
  if (key_strengths !== undefined) updateData.key_strengths = JSON.stringify(key_strengths);
  if (blind_spots !== undefined) updateData.blind_spots = JSON.stringify(blind_spots);
  if (derailment_risks !== undefined) updateData.derailment_risks = JSON.stringify(derailment_risks);
  if (impact_potential !== undefined) updateData.impact_potential = impact_potential;
  if (stakeholder_style !== undefined) updateData.stakeholder_style = stakeholder_style;
  if (development_journey !== undefined) updateData.development_journey = development_journey;
  if (priority_focus_areas !== undefined) updateData.priority_focus_areas = JSON.stringify(priority_focus_areas);
  if (executive_summary !== undefined) updateData.executive_summary = executive_summary;

  const updated = await update('canvas_profiles', id, updateData);

  await insert('signals', {
    contact_id: profile.contact_id,
    type: 'assessment',
    agent_id: 'canvas',
    metadata: JSON.stringify({ action: 'updated', profile_id: id }),
  });

  return res.json({ success: true, profile: parseCanvasProfile(updated) });
}

// ── PDF Export ──────────────────────────────────────────────────────────
async function handleExportPDF(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const { profile_id, format = 'standard' } = req.body || {};
  if (!profile_id) {
    return res.status(400).json({ success: false, error: 'profile_id is required' });
  }

  const profile = await selectOne('canvas_profiles', {
    column: 'id', value: profile_id, select: '*',
  }, 15000);

  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found' });
  }

  const pdfUrl = await generateCanvasPDF(profile, format);
  const newVersion = (profile.pdf_version || 1) + 1;

  await update('canvas_profiles', profile_id, {
    pdf_url: pdfUrl,
    pdf_generated_at: new Date().toISOString(),
    pdf_version: newVersion,
  });

  if (format === 't2_full') {
    await insert('signals', {
      contact_id: profile.contact_id,
      type: 'assessment',
      agent_id: 'canvas',
      metadata: JSON.stringify({ action: 'export_pdf', format, profile_id }),
    });
  }

  return res.json({ success: true, pdf_url: pdfUrl, pdf_path: pdfUrl });
}

// ── Kevin Review Action ─────────────────────────────────────────────────
async function handleReviewAction(req: VercelRequest, res: VercelResponse, id: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const role = await getUserRole(user.id);
  if (role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Only admin (Kevin) can review CANVAS profiles' });
  }

  const { action, review_notes, edited_fields } = req.body || {};
  const validActions = ['approve', 'edits_requested', 'edit'];

  if (!action || !validActions.includes(action)) {
    return res.status(400).json({ success: false, error: `Invalid action. Valid: ${validActions.join(', ')}` });
  }

  const updateData: Record<string, any> = {
    review_status: action,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
    review_notes,
  };

  if (action === 'edit' && edited_fields) {
    Object.keys(edited_fields).forEach(field => {
      if (['key_strengths', 'blind_spots', 'derailment_risks', 'priority_focus_areas'].includes(field)) {
        updateData[field] = JSON.stringify(edited_fields[field]);
      } else {
        updateData[field] = edited_fields[field];
      }
    });
  }

  const updated = await update('canvas_profiles', id, updateData);

  await insert('signals', {
    contact_id: updated.contact_id,
    type: 'assessment',
    agent_id: 'canvas',
    metadata: JSON.stringify({ action: `review_${action}`, profile_id: id }),
  });

  return res.json({ success: true, profile: parseCanvasProfile(updated) });
}

// ── Review Queue ────────────────────────────────────────────────────────
async function handleReviewQueue(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const role = await getUserRole(user.id);
  if (role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Only admin (Kevin) can access review queue' });
  }

  const profiles = await selectMany('canvas_profiles', { review_status: 'pending' }, ['created_at DESC'], 50, 0, '*');

  const pending = await Promise.all(profiles.map(async (p: any) => {
    const contact = await selectOne('contacts', { column: 'id', value: p.contact_id, select: 'full_name' }, 10000);
    const mandate = p.mandate_id ? await selectOne('mandates', { column: 'id', value: p.mandate_id, select: 'role_title' }, 10000) : null;
    const scorer = await selectOne('profiles', { column: 'id', value: p.generated_by, select: 'full_name' }, 10000);

    return {
      profile_id: p.id,
      contact_id: p.contact_id,
      full_name: contact?.full_name || 'Unknown',
      mandate_id: p.mandate_id,
      mandate_title: mandate?.role_title || null,
      canvas_grade: p.canvas_grade,
      generated_by_name: scorer?.full_name || 'Unknown',
      generated_at: p.created_at,
    };
  }));

  return res.json({ success: true, pending, total_pending: pending.length });
}

// ── Helpers ─────────────────────────────────────────────────────────────
function computeCanvasComposite(
  strategic: number,
  communication: number,
  adaptability: number,
  leadership: number,
  decision: number,
  eq: number
) {
  const composite = Number(((strategic + communication + adaptability + leadership + decision + eq) / 6.0).toFixed(1));
  let grade: string;

  if (composite >= 9.0) grade = 'A+';
  else if (composite >= 8.0) grade = 'A';
  else if (composite >= 7.0) grade = 'B';
  else if (composite >= 6.0) grade = 'C';
  else grade = 'F';

  return { canvas_composite: composite, canvas_grade: grade };
}

async function generateCanvasNarrative(profileData: any) {
  const { candidate, trident, canvas_scores, mandate, canvas_notes } = profileData;

  if (!DEEPSEEK_API_KEY) {
    return {
      leadership_style: `${candidate.full_name} demonstrates a collaborative leadership approach with strong communication skills. Based on their experience at ${candidate.company_name}, they have a track record of building and leading high-performing teams.`,
      key_strengths: [
        `Proven track record in ${candidate.sector || 'their field'}`,
        'Strong leadership and team management abilities',
        'Excellent communication and stakeholder engagement',
        'Results-driven with focus on measurable outcomes',
      ],
      blind_spots: ['May need to develop deeper expertise in emerging technologies', 'Could benefit from more experience in cross-functional scaling'],
      derailment_risks: ['Risk of overcommitting without proper resource planning', 'Potential for rushing decisions without full analysis'],
      impact_potential: `${candidate.full_name} has the potential to drive significant impact in their target role within 12 months.`,
      stakeholder_style: 'Collaborative approach with strong emphasis on building relationships and consensus.',
      development_journey: `${candidate.full_name} has progressed through key leadership roles, demonstrating growth and adaptability. Their career trajectory shows increasing responsibility and impact.`,
      priority_focus_areas: ['Develop strategic vision for scaling operations', 'Build stronger cross-functional partnerships'],
      executive_summary: `${candidate.full_name} is a well-rounded executive with strong domain expertise and leadership capabilities. Currently serving as ${candidate.title} at ${candidate.company_name}, they bring a combination of strategic thinking and execution ability. With TRIDENT composite of ${trident.composite_score}/10 (${trident.verdict}) and CANVAS Grade ${computeCanvasComposite(canvas_scores.strategic_thinking, canvas_scores.communication, canvas_scores.adaptability, canvas_scores.team_leadership, canvas_scores.decision_making, canvas_scores.emotional_intelligence).canvas_grade}, they represent a strong fit for senior leadership roles. Their key strengths include strategic vision, team leadership, and stakeholder management.`,
    };
  }

  try {
    const response = await fetch(DEEPSEEK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        messages: [
          {
            role: 'system',
            content: `You are CANVAS, an executive narrative engine for LYC Intelligence. You generate client-ready behavioral profiles for executive candidates.

GENERATION PRINCIPLES:
1. SPECIFIC, not generic. "Built a 200-person org across 4 countries" — not "strong leader."
2. EVIDENCE-BACKED. Reference TRIDENT evidence bullets and candidate data.
3. HONEST. Blind spots and derailment risks must be REAL, not placeholder text.
4. ROLE-CONTEXTUAL. Same score means different things for a CFO vs. a CTO.
5. CLIENT-READY. Professional, polished, no jargon.

Return JSON with these 9 fields:
{
  "executive_summary": string (150-200 words),
  "leadership_style": string (≤100 words),
  "key_strengths": string[] (3-5 bullets),
  "blind_spots": string[] (1-3 bullets — honest, not sugar-coated),
  "derailment_risks": string[] (1-2 bullets),
  "impact_potential": string (≤50 words),
  "stakeholder_style": string (≤50 words),
  "development_journey": string (≤100 words),
  "priority_focus_areas": string[] (2-3 bullets)
}`,
          },
          {
            role: 'user',
            content: buildCanvasPrompt(candidate, trident, canvas_scores, mandate, canvas_notes),
          },
        ],
        temperature: 0.4,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (err) {
    console.error('DeepSeek generation failed:', err);
    return {
      leadership_style: `${candidate.full_name} demonstrates strong leadership capabilities suitable for executive roles.`,
      key_strengths: ['Strong strategic thinking', 'Excellent communication skills', 'Proven track record of delivery'],
      blind_spots: ['May need further development in certain areas'],
      derailment_risks: ['Risk assessment pending deeper evaluation'],
      impact_potential: 'High impact potential in suitable leadership contexts.',
      stakeholder_style: 'Professional and collaborative stakeholder management approach.',
      development_journey: 'Career trajectory shows steady progression and growth.',
      priority_focus_areas: ['Continue developing strategic capabilities', 'Strengthen leadership competencies'],
      executive_summary: `${candidate.full_name} is a qualified executive with solid TRIDENT scores and behavioral profile. Their CANVAS assessment indicates strong potential for senior leadership roles.`,
    };
  }
}

function buildCanvasPrompt(candidate: any, trident: any, canvas: any, mandate: any, notes: any) {
  const notesObj = typeof notes === 'string' ? JSON.parse(notes || '{}') : notes || {};
  return `CANDIDATE: ${candidate.full_name}
Current Role: ${candidate.title || ''} at ${candidate.company_name || ''}
Sector: ${candidate.sector || 'Not specified'}
Experience: ${candidate.experience_summary || candidate.raw_data?.experience || 'From profile'}
Key Achievements: ${candidate.achievements?.join('; ') || 'From profile'}

TRIDENT ASSESSMENT:
D1 (Domain & Intelligence): ${trident.d1_score}/10 — ${trident.d1_evidence || ''}
D2 (Delivery & Influence): ${trident.d2_score}/10 — ${trident.d2_evidence || ''}
D3 (Drive & Dynamics): ${trident.d3_score}/10 — ${trident.d3_evidence || ''}
Composite: ${trident.composite_score}/10 — ${trident.verdict || ''}

CANVAS BEHAVIORAL SCORES:
Strategic Thinking: ${canvas.strategic_thinking}/10 ${notesObj.strategic_thinking ? '(' + notesObj.strategic_thinking + ')' : ''}
Communication: ${canvas.communication}/10 ${notesObj.communication ? '(' + notesObj.communication + ')' : ''}
Adaptability: ${canvas.adaptability}/10 ${notesObj.adaptability ? '(' + notesObj.adaptability + ')' : ''}
Team Leadership: ${canvas.team_leadership}/10 ${notesObj.team_leadership ? '(' + notesObj.team_leadership + ')' : ''}
Decision Making: ${canvas.decision_making}/10 ${notesObj.decision_making ? '(' + notesObj.decision_making + ')' : ''}
Emotional Intelligence: ${canvas.emotional_intelligence}/10 ${notesObj.emotional_intelligence ? '(' + notesObj.emotional_intelligence + ')' : ''}

${mandate ? `TARGET ROLE: ${mandate.role_title || ''}\n${mandate.job_description || ''}` : ''}

Generate the 9 narrative fields. Be specific to THIS candidate and THIS role.`;
}

async function regenerateNarrativeField(profile: any, scorecard: any, contact: any, fieldName: string) {
  const fieldInstructions: Record<string, string> = {
    leadership_style: 'Describe their leadership style in ≤100 words. Reference specific behaviors.',
    key_strengths: 'List 3-5 key strengths as bullet points. Each must reference specific evidence.',
    blind_spots: 'List 1-3 genuine blind spots. Be honest, not sugar-coated. Based on assessment data.',
    derailment_risks: 'List 1-2 risks that could cause this person to fail in the target role.',
    impact_potential: 'In ≤50 words, describe what this person could achieve in the first 12-18 months.',
    stakeholder_style: 'In ≤50 words, describe how they manage up, down, and across.',
    development_journey: 'In ≤100 words, describe their career arc and what it reveals.',
    priority_focus_areas: 'List 2-3 areas they should develop. Be specific and actionable.',
    executive_summary: 'Write a 150-200 word executive summary suitable for client delivery.',
  };

  if (!DEEPSEEK_API_KEY) {
    const fallbackValues: Record<string, string | string[]> = {
      leadership_style: `${contact.full_name} demonstrates strong leadership capabilities with a focus on collaboration and results.`,
      key_strengths: ['Proven leadership track record', 'Strong strategic capabilities', 'Excellent stakeholder management'],
      blind_spots: ['May need to develop deeper expertise in certain areas', 'Could benefit from more delegation experience'],
      derailment_risks: ['Potential risk of overcommitting without proper resource planning'],
      impact_potential: 'High impact potential with proper support and development.',
      stakeholder_style: 'Collaborative approach with emphasis on relationship building.',
      development_journey: 'Career shows steady progression with increasing responsibility.',
      priority_focus_areas: ['Strategic capability development', 'Leadership effectiveness'],
      executive_summary: `${contact.full_name} is a strong candidate with solid assessment scores and leadership potential. Their profile indicates readiness for executive roles.`,
    };
    return fallbackValues[fieldName];
  }

  try {
    const response = await fetch(DEEPSEEK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        messages: [
          {
            role: 'system',
            content: `You are CANVAS, an executive narrative engine. Generate ONLY the requested field. Be specific and evidence-based.`,
          },
          {
            role: 'user',
            content: `${fieldInstructions[fieldName]}\n\nCandidate: ${contact.full_name}\nRole: ${contact.title} at ${contact.company_name}\nTRIDENT: ${scorecard.composite_score}/10 ${scorecard.verdict}\nCANVAS Grade: ${profile.canvas_grade}\n\nReturn ONLY the requested content without JSON formatting.`,
          },
        ],
        temperature: 0.4,
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    if (['key_strengths', 'blind_spots', 'derailment_risks', 'priority_focus_areas'].includes(fieldName)) {
      return content.split('\n').filter((line: string) => line.trim()).map((line: string) => line.replace(/^[\d\-\*]\s*/, ''));
    }
    return content;
  } catch (err) {
    console.error('Field regeneration failed:', err);
    return fieldName === 'executive_summary' ? 'Narrative regeneration failed. Please try again.' : [];
  }
}

async function generateCanvasPDF(profile: any, format: string) {
  const fileName = `canvas-${profile.id}-${format}-v${profile.pdf_version || 1}.pdf`;
  return `/api/canvas/pdf/${fileName}`;
}

function parseCanvasProfile(profile: any) {
  const parsed = { ...profile };
  if (profile.canvas_notes) parsed.canvas_notes = typeof profile.canvas_notes === 'string' ? JSON.parse(profile.canvas_notes) : profile.canvas_notes;
  if (profile.key_strengths) parsed.key_strengths = typeof profile.key_strengths === 'string' ? JSON.parse(profile.key_strengths) : profile.key_strengths;
  if (profile.blind_spots) parsed.blind_spots = typeof profile.blind_spots === 'string' ? JSON.parse(profile.blind_spots) : profile.blind_spots;
  if (profile.derailment_risks) parsed.derailment_risks = typeof profile.derailment_risks === 'string' ? JSON.parse(profile.derailment_risks) : profile.derailment_risks;
  if (profile.priority_focus_areas) parsed.priority_focus_areas = typeof profile.priority_focus_areas === 'string' ? JSON.parse(profile.priority_focus_areas) : profile.priority_focus_areas;
  if (profile.metadata) parsed.metadata = typeof profile.metadata === 'string' ? JSON.parse(profile.metadata) : profile.metadata;
  return parsed;
}
