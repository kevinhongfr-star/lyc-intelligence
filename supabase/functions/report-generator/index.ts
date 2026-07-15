// Supabase Edge Function: report-generator
// Generates PDF reports for candidates, mandates, and analytics

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
  type: 'candidate' | 'mandate' | 'pipeline' | 'analytics' | 'custom';
  id?: string;
  format?: 'pdf' | 'html';
  options?: Record<string, any>;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: ReportRequest = await req.json();
    console.log('[report-generator] Type:', body.type, 'ID:', body.id);

    let reportContent = '';
    let filename = `report_${Date.now()}`;

    switch (body.type) {
      case 'candidate': {
        const { data: candidate } = await supabase
          .from('candidates')
          .select(`
            *,
            mandate_candidates(
              mandate:mandates(id, title, company),
              stage,
              score
            )
          `)
          .eq('id', body.id)
          .single();

        if (!candidate) throw new Error('Candidate not found');

        filename = `candidate_${candidate.id}_${Date.now()}`;
        reportContent = generateCandidateHTML(candidate);
        break;
      }

      case 'mandate': {
        const { data: mandate } = await supabase
          .from('mandates')
          .select(`
            *,
            candidates:v2_candidates(id, name, status, score),
            company:v2_companies(name)
          `)
          .eq('id', body.id)
          .single();

        if (!mandate) throw new Error('Mandate not found');

        filename = `mandate_${mandate.id}_${Date.now()}`;
        reportContent = generateMandateHTML(mandate);
        break;
      }

      case 'pipeline': {
        const organizationId = body.options?.organization_id;
        if (!organizationId) throw new Error('organization_id required');

        const { data: pipeline } = await supabase
          .from('mandate_candidates')
          .select(`
            candidate:v2_candidates(id, name),
            mandate:mandates(id, title),
            stage,
            score,
            updated_at
          `)
          .eq('mandate.organization_id', organizationId);

        filename = `pipeline_${Date.now()}`;
        reportContent = generatePipelineHTML(pipeline || []);
        break;
      }

      case 'analytics': {
        const { data: stats } = await supabase.rpc('get_analytics_summary', {
          org_id: body.options?.organization_id,
        });

        filename = `analytics_${Date.now()}`;
        reportContent = generateAnalyticsHTML(stats || {});
        break;
      }

      default:
        throw new Error('Unknown report type');
    }

    // For HTML, return directly
    if (body.format === 'html' || !body.format) {
      return new Response(reportContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html',
          'Content-Disposition': `inline; filename="${filename}.html"`,
        },
      });
    }

    // For PDF, we'd need a PDF library (e.g., deno-pdf)
    // For now, return HTML with PDF content-type hint
    return new Response(reportContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${filename}.html"`,
      },
    });
  } catch (error) {
    console.error('[report-generator] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateCandidateHTML(candidate: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Candidate Report - ${candidate.name || candidate.id}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; }
    h1 { color: #C108AB; border-bottom: 2px solid #C108AB; padding-bottom: 10px; }
    .section { margin: 24px 0; }
    .label { font-weight: 600; color: #666; }
    .value { margin: 4px 0 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #eee; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
  </style>
</head>
<body>
  <h1>Candidate Report</h1>
  <div class="section">
    <div class="label">Name</div>
    <div class="value">${candidate.name || 'N/A'}</div>
    <div class="label">Email</div>
    <div class="value">${candidate.email || 'N/A'}</div>
    <div class="label">Current Company</div>
    <div class="value">${candidate.current_company || 'N/A'}</div>
    <div class="label">Current Title</div>
    <div class="value">${candidate.current_title || 'N/A'}</div>
  </div>
  <h2>Pipeline History</h2>
  <table>
    <thead>
      <tr><th>Mandate</th><th>Stage</th><th>Score</th></tr>
    </thead>
    <tbody>
      ${(candidate.mandate_candidates || []).map((mc: any) => `
        <tr>
          <td>${mc.mandate?.title || 'N/A'}</td>
          <td>${mc.stage || 'N/A'}</td>
          <td>${mc.score || 'N/A'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <footer style="margin-top: 40px; color: #999; font-size: 12px;">
    Generated by LYC Intelligence • ${new Date().toISOString()}
  </footer>
</body>
</html>
  `;
}

function generateMandateHTML(mandate: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Mandate Report - ${mandate.title || mandate.id}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; }
    h1 { color: #C108AB; border-bottom: 2px solid #C108AB; padding-bottom: 10px; }
    .section { margin: 24px 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #eee; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
  </style>
</head>
<body>
  <h1>Mandate Report</h1>
  <div class="section">
    <p><strong>Title:</strong> ${mandate.title || 'N/A'}</p>
    <p><strong>Company:</strong> ${mandate.company?.name || mandate.company_name || 'N/A'}</p>
    <p><strong>Status:</strong> ${mandate.status || 'N/A'}</p>
    <p><strong>Stage:</strong> ${mandate.stage || 'N/A'}</p>
  </div>
  <h2>Candidates</h2>
  <table>
    <thead><tr><th>Name</th><th>Status</th><th>Score</th></tr></thead>
    <tbody>
      ${(mandate.candidates || []).map((c: any) => `
        <tr><td>${c.name || 'N/A'}</td><td>${c.status || 'N/A'}</td><td>${c.score || 'N/A'}</td></tr>
      `).join('')}
    </tbody>
  </table>
  <footer style="margin-top: 40px; color: #999; font-size: 12px;">
    Generated by LYC Intelligence • ${new Date().toISOString()}
  </footer>
</body>
</html>
  `;
}

function generatePipelineHTML(pipeline: any[]): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Pipeline Report</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1000px; margin: 0 auto; padding: 40px; }
    h1 { color: #C108AB; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #eee; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
  </style>
</head>
<body>
  <h1>Pipeline Report</h1>
  <table>
    <thead><tr><th>Candidate</th><th>Mandate</th><th>Stage</th><th>Score</th><th>Updated</th></tr></thead>
    <tbody>
      ${pipeline.map((p: any) => `
        <tr>
          <td>${p.candidate?.name || 'N/A'}</td>
          <td>${p.mandate?.title || 'N/A'}</td>
          <td>${p.stage || 'N/A'}</td>
          <td>${p.score || 'N/A'}</td>
          <td>${p.updated_at ? new Date(p.updated_at).toLocaleDateString() : 'N/A'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <footer style="margin-top: 40px; color: #999; font-size: 12px;">
    Generated by LYC Intelligence • ${new Date().toISOString()}
  </footer>
</body>
</html>
  `;
}

function generateAnalyticsHTML(stats: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Analytics Report</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; }
    h1 { color: #C108AB; }
    .metric { background: #f5f5f5; padding: 16px; margin: 8px 0; }
    .metric-value { font-size: 32px; font-weight: bold; color: #C108AB; }
    .metric-label { color: #666; }
  </style>
</head>
<body>
  <h1>Analytics Report</h1>
  <div class="metric">
    <div class="metric-value">${stats.total_candidates || 0}</div>
    <div class="metric-label">Total Candidates</div>
  </div>
  <div class="metric">
    <div class="metric-value">${stats.active_mandates || 0}</div>
    <div class="metric-label">Active Mandates</div>
  </div>
  <div class="metric">
    <div class="metric-value">${stats.placements || 0}</div>
    <div class="metric-label">Placements</div>
  </div>
  <footer style="margin-top: 40px; color: #999; font-size: 12px;">
    Generated by LYC Intelligence • ${new Date().toISOString()}
  </footer>
</body>
</html>
  `;
}