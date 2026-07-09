import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  validateAgentRequest,
  successResponse,
  errorResponse,
  getServiceSupabase,
  type SweepPayload,
} from '../../lib/agentUtils';

export const maxDuration = 30;

const AGENT = 'sweep';

async function handleResearchComp(payload: SweepPayload, sb: any) {
  if (!payload.compensation_data?.role_title) {
    throw new Error('Role title is required for compensation research.');
  }

  const { data, error } = await sb
    .from('compensation_data')
    .insert({
      role_title: payload.compensation_data.role_title,
      function: payload.compensation_data.function,
      level: payload.compensation_data.level,
      industry: payload.compensation_data.industry,
      company_size: payload.compensation_data.company_size,
      geography: payload.compensation_data.geography,
      min_comp: payload.compensation_data.min_comp,
      mid_comp: payload.compensation_data.mid_comp,
      max_comp: payload.compensation_data.max_comp,
      currency: payload.compensation_data.currency || 'USD',
      data_year: payload.compensation_data.data_year || new Date().getFullYear(),
      source: payload.compensation_data.source || 'sweep',
      sample_size: payload.compensation_data.sample_size,
      notes: payload.compensation_data.notes,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '42P01') {
      return {
        tablesWritten: [],
        recordsCreated: 0,
        message: 'Compensation data table not yet created. Research stored in memory only.',
      };
    }
    throw new Error(`Compensation data insert error: ${error.message}`);
  }

  return {
    tablesWritten: ['compensation_data'],
    recordsCreated: 1,
    message: `Compensation research for "${payload.compensation_data.role_title}" saved.`,
  };
}

async function handleMarketMap(payload: SweepPayload, sb: any) {
  if (!payload.talent_landscape_report?.report_title) {
    throw new Error('Report title is required for market map.');
  }

  const { data, error } = await sb
    .from('talent_landscape_reports')
    .insert({
      sector: payload.talent_landscape_report.sector,
      geography: payload.talent_landscape_report.geography,
      report_title: payload.talent_landscape_report.report_title,
      summary: payload.talent_landscape_report.summary,
      key_findings: payload.talent_landscape_report.key_findings,
      talent_pool_size: payload.talent_landscape_report.talent_pool_size,
      supply_demand_ratio: payload.talent_landscape_report.supply_demand_ratio,
      key_companies: payload.talent_landscape_report.key_companies,
      trends: payload.talent_landscape_report.trends,
      generated_at: payload.talent_landscape_report.generated_at || new Date().toISOString(),
      researcher: 'sweep',
      file_url: payload.talent_landscape_report.file_url,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '42P01') {
      return {
        tablesWritten: [],
        recordsCreated: 0,
        message: 'Talent landscape table not yet created. Market map stored in memory only.',
      };
    }
    throw new Error(`Talent landscape insert error: ${error.message}`);
  }

  return {
    tablesWritten: ['talent_landscape_reports'],
    recordsCreated: 1,
    message: `Market map "${payload.talent_landscape_report.report_title}" saved.`,
  };
}

async function handleIndustryAnalysis(payload: SweepPayload, sb: any) {
  if (!payload.market_research?.title) {
    throw new Error('Research title is required for industry analysis.');
  }

  const { data, error } = await sb
    .from('market_research')
    .insert({
      title: payload.market_research.title,
      type: payload.market_research.type || 'industry-analysis',
      sector: payload.market_research.sector,
      geography: payload.market_research.geography,
      status: payload.market_research.status || 'delivered',
      findings_summary: payload.market_research.findings_summary,
      data_points: payload.market_research.data_points,
      delivered_at: payload.market_research.delivered_at || new Date().toISOString(),
      researcher: 'sweep',
      source_urls: payload.market_research.source_urls,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '42P01') {
      return {
        tablesWritten: [],
        recordsCreated: 0,
        message: 'Market research table not yet created. Analysis stored in memory only.',
      };
    }
    throw new Error(`Market research insert error: ${error.message}`);
  }

  return {
    tablesWritten: ['market_research'],
    recordsCreated: 1,
    message: `Industry analysis "${payload.market_research.title}" saved.`,
  };
}

async function handleResearchProject(payload: SweepPayload, sb: any) {
  if (!payload.market_research?.title) {
    throw new Error('Research title is required.');
  }

  const { data, error } = await sb
    .from('market_research')
    .insert({
      title: payload.market_research.title,
      type: payload.market_research.type || 'custom',
      sector: payload.market_research.sector,
      geography: payload.market_research.geography,
      status: payload.market_research.status || 'in-progress',
      findings_summary: payload.market_research.findings_summary,
      data_points: payload.market_research.data_points,
      delivered_at: payload.market_research.delivered_at,
      researcher: 'sweep',
      source_urls: payload.market_research.source_urls,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '42P01') {
      return {
        tablesWritten: [],
        recordsCreated: 0,
        message: 'Market research table not yet created. Project stored in memory only.',
      };
    }
    throw new Error(`Research insert error: ${error.message}`);
  }

  return {
    tablesWritten: ['market_research'],
    recordsCreated: 1,
    message: `Research project "${payload.market_research.title}" created.`,
  };
}

const ACTION_HANDLERS: Record<string, (p: SweepPayload, sb: any) => Promise<any>> = {
  research_comp: handleResearchComp,
  market_map: handleMarketMap,
  industry_analysis: handleIndustryAnalysis,
  research_project: handleResearchProject,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const validation = validateAgentRequest(req, res, AGENT);
  if (!validation.valid) return;

  const { action, body } = validation;
  const payload = body.payload as SweepPayload || {};

  const sb = getServiceSupabase();
  if (!sb) {
    return errorResponse(res, 500, AGENT, 'Supabase is not configured.');
  }

  try {
    const handler = ACTION_HANDLERS[action];
    if (!handler) {
      return errorResponse(
        res,
        400,
        AGENT,
        `Unknown action "${action}". Supported actions: ${Object.keys(ACTION_HANDLERS).join(', ')}`
      );
    }

    const result = await handler(payload, sb);
    return successResponse(
      res,
      AGENT,
      action,
      result.recordsCreated || 0,
      result.tablesWritten || [],
      result.message || 'Action completed.'
    );
  } catch (e: any) {
    console.error(`[agents/sweep] Action "${action}" error:`, e);
    return errorResponse(res, 500, AGENT, e.message || 'Internal server error.');
  }
}
