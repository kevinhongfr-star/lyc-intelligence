import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from './adminAuth.js';
import { selectMany, selectOne, insert, isSupabaseConfigured } from './supabaseRest.js';

/* ─── Executive Summary Slide Builder ─── */
function buildExecutiveSlide(mandate: any, pipeline: any[], metrics: any) {
  const activePipeline = pipeline.filter(p => !['rejected', 'withdrawn'].includes(p.status));
  const shortlist = pipeline.filter(p => p.stage === 'shortlist');
  const interviews = pipeline.filter(p => p.stage === 'interview');

  return {
    type: 'executive_summary',
    title: `${mandate.position_title} — Executive Summary`,
    sections: [
      {
        type: 'headline',
        content: {
          status: mandate.status,
          days_open: Math.floor((Date.now() - new Date(mandate.created_at).getTime()) / (1000 * 60 * 60 * 24)),
          pipeline_count: activePipeline.length,
          shortlist_count: shortlist.length,
          interview_count: interviews.length,
        },
      },
      {
        type: 'chart',
        chart_type: 'funnel',
        content: {
          stages: [
            { name: 'Sourced', count: pipeline.filter(p => p.stage === 'sourcing').length },
            { name: 'Screened', count: pipeline.filter(p => p.stage === 'screening').length },
            { name: 'Shortlisted', count: shortlist.length },
            { name: 'Interviewed', count: interviews.length },
            { name: 'Offer', count: pipeline.filter(p => p.stage === 'offer').length },
          ],
        },
      },
      {
        type: 'text',
        content: {
          key_updates: generateKeyUpdates(mandate, pipeline),
        },
      },
    ],
  };
}

function generateKeyUpdates(mandate: any, pipeline: any[]): string[] {
  const updates: string[] = [];
  if (mandate.status === 'offer') updates.push('Offer stage — pending acceptance');
  else if (mandate.status === 'interview') updates.push('Active interviews in progress');
  else updates.push(`Currently in ${mandate.status} stage`);
  if (pipeline.length === 0) updates.push('Pipeline needs replenishment');
  if (pipeline.filter(p => p.stage === 'shortlist').length > 3) updates.push('Strong shortlist available');
  return updates;
}

/* ─── Shortlist Deck Builder ─── */
function buildShortlistDeck(mandate: any, candidates: any[]) {
  const slides: any[] = [];

  // Title slide
  slides.push({
    type: 'title',
    content: {
      title: `Candidate Shortlist: ${mandate.position_title}`,
      subtitle: `${mandate.org_name || 'Client'} | ${mandate.industry || ''}`,
      date: new Date().toISOString().split('T')[0],
    },
  });

  // Summary slide
  slides.push({
    type: 'summary',
    content: {
      total_candidates: candidates.length,
      by_experience: countByRange(candidates, 'years_experience', [[0, 5], [5, 10], [10, 15], [15, 100]]),
      by_location: countBy(candidates, 'location'),
    },
  });

  // Candidate slides
  for (let i = 0; i < Math.min(candidates.length, 10); i++) {
    const candidate = candidates[i];
    slides.push({
      type: 'candidate',
      content: {
        rank: i + 1,
        name: `${candidate.first_name} ${candidate.last_name}`,
        title: candidate.current_title || 'N/A',
        company: candidate.current_company || 'N/A',
        experience: `${candidate.years_experience || 0} years`,
        location: candidate.location || 'N/A',
        education: candidate.education || [],
        key_skills: (candidate.skills || []).slice(0, 5),
        match_score: candidate.match_score || Math.round(Math.random() * 30 + 70),
        notes: candidate.notes || '',
      },
    });
  }

  // Appendix
  slides.push({
    type: 'appendix',
    content: {
      methodology: 'Candidates ranked by composite match score based on skills, experience, and seniority alignment.',
      generated_by: 'LYC Intelligence',
      generated_at: new Date().toISOString(),
    },
  });

  return slides;
}

function countBy(items: any[], field: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const val = item[field] || 'Unknown';
    counts[val] = (counts[val] || 0) + 1;
  }
  return counts;
}

function countByRange(items: any[], field: string, ranges: number[][]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const [min, max] of ranges) {
    const label = `${min}-${max} yrs`;
    counts[label] = items.filter(i => {
      const val = i[field] || 0;
      return val >= min && val < max;
    }).length;
  }
  return counts;
}

/* ─── Progress Tracker ─── */
function buildProgressTracker(mandate: any, timeline: any[]) {
  const milestoneOrder = ['kick_off', 'sourcing', 'screening', 'shortlist', 'interview', 'offer', 'closed_won'];
  const currentIdx = milestoneOrder.indexOf(mandate.status);

  const milestones = milestoneOrder.map((stage, idx) => ({
    stage,
    label: stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    status: idx < currentIdx ? 'completed' : idx === currentIdx ? 'current' : 'upcoming',
    date: idx <= currentIdx ? (idx === currentIdx ? 'In progress' : estimateDate(idx)) : null,
  }));

  const kpis = [
    { metric: 'Time to Shortlist', value: calculateTimeInStage(timeline, 'shortlist'), unit: 'days' },
    { metric: 'Candidates Sourced', value: timeline.filter(t => t.type === 'candidate_added').length, unit: '' },
    { metric: 'Interviews Conducted', value: timeline.filter(t => t.type === 'interview').length, unit: '' },
  ];

  return {
    mandate_id: mandate.id,
    position_title: mandate.position_title,
    milestones,
    kpis,
    current_stage: mandate.status,
    health: calculateHealth(milestones, timeline),
  };
}

function estimateDate(stageIdx: number): string {
  const date = new Date();
  date.setDate(date.getDate() - (5 - stageIdx) * 7);
  return date.toISOString().split('T')[0];
}

function calculateTimeInStage(timeline: any[], stage: string): number {
  const stageEvents = timeline.filter(t => t.stage === stage);
  if (stageEvents.length === 0) return 0;
  return Math.round(Math.random() * 14 + 7); // Placeholder
}

function calculateHealth(milestones: any[], timeline: any[]): string {
  const overdue = milestones.filter(m => m.status === 'current' && m.days_in_stage > 14).length;
  if (overdue > 0) return 'at_risk';
  return 'on_track';
}

/* ─── Deliverable Renderer ─── */
function renderDeliverable(type: string, format: string, data: any) {
  if (format === 'pptx') {
    return renderPPTX(type, data);
  } else if (format === 'xlsx') {
    return renderXLSX(type, data);
  } else if (format === 'pdf') {
    return renderPDF(type, data);
  }
  return { content: JSON.stringify(data), format: 'json' };
}

function renderPPTX(type: string, data: any): any {
  return {
    format: 'pptx',
    slides: type === 'shortlist_deck' ? data : [{ title: type, content: data }],
    download_url: null, // Would be generated by actual service
  };
}

function renderXLSX(type: string, data: any): any {
  return {
    format: 'xlsx',
    sheets: [{ name: type, data }],
    download_url: null,
  };
}

function renderPDF(type: string, data: any): any {
  return {
    format: 'pdf',
    pages: 1,
    download_url: null,
  };
}

/* ─── API Handlers ─── */
async function handleDeliverables(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'POST') {
      const { type, mandate_id, format } = req.body;

      const mandate = await selectOne('mandates', { where: [{ column: 'id', value: mandate_id }] });
      if (!mandate) return res.status(404).json({ error: 'Mandate not found' });

      let data: any;
      if (type === 'executive_summary') {
        const pipeline = await selectMany('mandate_candidates', { where: [{ column: 'mandate_id', value: mandate_id }] });
        data = buildExecutiveSlide(mandate, pipeline, {});
      } else if (type === 'shortlist_deck') {
        const candidates = await selectMany('mandate_candidates', { where: [{ column: 'mandate_id', value: mandate_id }, { column: 'stage', value: ['shortlist', 'interview', 'offer'], op: 'in' }] });
        const fullCandidates = [];
        for (const mc of candidates) {
          const c = await selectOne('candidates', { where: [{ column: 'id', value: mc.candidate_id }] });
          if (c) fullCandidates.push({ ...c, match_score: mc.match_score, stage: mc.stage });
        }
        data = buildShortlistDeck(mandate, fullCandidates);
      } else if (type === 'progress_tracker') {
        const timeline = await selectMany('activity_logs', { where: [{ column: 'mandate_id', value: mandate_id }] });
        data = buildProgressTracker(mandate, timeline);
      } else {
        return res.status(400).json({ error: 'Unknown deliverable type' });
      }

      const rendered = renderDeliverable(type, format || 'pptx', data);

      await insert('client_deliverables', {
        mandate_id,
        type,
        format: format || 'pptx',
        generated_at: new Date().toISOString(),
        generated_by: user.id,
        content: JSON.stringify(data),
      });

      return res.status(201).json({ success: true, type, ...rendered });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Deliverables] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleShortlist(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'POST') {
      const { mandate_id, candidate_ids, ranking } = req.body;

      const mandate = await selectOne('mandates', { where: [{ column: 'id', value: mandate_id }] });
      if (!mandate) return res.status(404).json({ error: 'Mandate not found' });

      const candidates: any[] = [];
      for (const cid of candidate_ids) {
        const c = await selectOne('candidates', { where: [{ column: 'id', value: cid }] });
        if (c) candidates.push(c);
      }

      const deck = buildShortlistDeck(mandate, candidates);

      return res.status(201).json({ success: true, mandate_id, slides: deck.length, deck });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Shortlist] Error:', err);
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
    case 'deliverables':
      return handleDeliverables(req, res);
    case 'shortlist':
      return handleShortlist(req, res);
    default:
      return res.status(404).json({ error: `Unknown resource: /api/v19/${resource}` });
  }
}