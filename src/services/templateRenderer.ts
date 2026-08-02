/**
 * T27: Template Rendering API — Server-Side HTML → Dynamic Content
 * 
 * Server-side (api-side rendering pipeline for HTML templates via T16 registry.
 * Browser fallback: iframe preview via srcdoc for portal document views.
 * Production: Puppeteer / Puppeteer server (edge function /api/_lib/documentGenerationHandler.ts.
 */

import { REPORT_TOKENS, ReportBrandKey } from '@/styles/tokens';

export interface TemplateRenderOptions {
  templateId: string;
  variables: Record<string, unknown>;
  brand?: ReportBrandKey;
  locale?: 'en' | 'zh' | 'fr';
  outputFormat?: 'html' | 'pdf' | 'email';
}

export interface RenderedTemplate {
  html: string;
  meta: {
    title: string;
    tokensInjected: number;
    warnings: string[];
    renderedAt: string;
    sizeBytes?: number;
  };
}

/** T16 Registry: 50-tuple list of templates wired to template path
 */
export const TEMPLATE_REGISTRY: Record<string, {
  code: string;
  path: string;
  renderer: 'html' | 'react' | 'puppeteer' | 'email';
  group: string;
  level: string;
  variablesSchema: string[];
}> = {
  D01: { code: 'D01', path: 'templates/business/L1_L2/D01_Client_Proposal.html', renderer: 'html', group: 'Business Docs', level: 'L1', variablesSchema: ['client_name', 'mandate_id', 'fee_structure', 'team'] },
  D02: { code: 'D02', path: 'templates/business/L1_L2/D02_Fee_Schedule.html', renderer: 'html', group: 'Business Docs', level: 'L1', variablesSchema: ['fees', 'currency'] },
  D06: { code: 'D06', path: 'templates/business/L1_L2/D06_Mandate_Brief.html', renderer: 'html', group: 'Business Docs', level: 'L2', variablesSchema: ['mandate', 'role', 'company', 'success_profile'] },
  D11: { code: 'D11', path: 'templates/business/L3/D11_CV_Presentation.html', renderer: 'html', group: 'Business Docs', level: 'L3', variablesSchema: ['candidate', 'cv_url', 'highlights'] },
  D12: { code: 'D12', path: 'templates/business/L3/D12_Shortlist_Presentation.html', renderer: 'html', group: 'Business Docs', level: 'L3', variablesSchema: ['candidates', 'mandate', 'ranking'] },
  D17: { code: 'D17', path: 'templates/business/L4/D17_Interview_Schedule.html', renderer: 'react', group: 'Business Docs', level: 'L4', variablesSchema: ['interviews', 'panel', 'logistics'] },
  D19: { code: 'D19', path: 'templates/business/L4/D19_Interview_Debrief.html', renderer: 'react', group: 'Business Docs', level: 'L4', variablesSchema: ['candidate', 'interview', 'scores', 'recommendation'] },
  D24: { code: 'D24', path: 'templates/business/L5/D24_Offer_Letter.html', renderer: 'react', group: 'Business Docs', level: 'L5', variablesSchema: ['candidate', 'offer', 'compensation', 'start_date'] },
  D31: { code: 'D31', path: 'templates/business/L7/D31_Placement_Confirmation.html', renderer: 'html', group: 'Business Docs', level: 'L7', variablesSchema: ['placement', 'candidate', 'company', 'fee'] },
  D36: { code: 'D36', path: 'templates/business/L8/D36_Assessment_Bundle.html', renderer: 'puppeteer', group: 'Business Docs', level: 'L8', variablesSchema: ['assessments', 'scores', 'report_ids'] },
  D46: { code: 'D46', path: 'templates/business/L10/D46_Weekly_Digest.html', renderer: 'email', group: 'Business Docs', level: 'L10', variablesSchema: ['user', 'week_summary', 'alerts', 'upcoming'] },
  D47: { code: 'D47', path: 'templates/business/L10/D47_Pipeline_Update.html', renderer: 'email', group: 'Business Docs', level: 'L10', variablesSchema: ['pipeline', 'stages', 'kpis'] },
  D49: { code: 'D49', path: 'templates/business/L10/D49_Market_Briefing.html', renderer: 'email', group: 'Business Docs', level: 'L10', variablesSchema: ['market', 'signals', 'opportunities'] },
  G1_BASE: { code: 'G1', path: 'src/templates/LENS_T1_Template.html', renderer: 'puppeteer', group: 'G — Reports', level: 'L8', variablesSchema: ['assessment', 'scores', 'archetype', 'sections'] },
  G9: { code: 'G9', path: 'src/email/templates.tsx', renderer: 'email', group: 'G — Reports', level: 'L10', variablesSchema: ['recipient', 'items', 'cta'] },
};

/**
 * Inject brand tokens + replace {{vars}}. Server-side safe var replacement.
 * @returns fully hydrated HTML with all variables
 */
export function injectVariables(html: string, variables: Record<string, unknown>): { html: string; replaced: number; warnings: string[] } {
  let replaced = 0;
  const warnings: string[] = [];
  let out = html;

  for (const [key, val] of Object.entries(variables)) {
    const token = `{{${key}}}`;
    const countBefore = out.split(token).length - 1;
    if (countBefore > 0) {
      const safeVal = typeof val === 'string' ? val : typeof val === 'object' ? JSON.stringify(val) : String(val);
      out = out.split(token).join(safeVal);
      replaced += countBefore;
    }
  }

  // Warn for any remaining unreplaced {{tokens
  const leftover = out.match(/\{\{[^{}]+\}\}/g) || [];
  for (const tok of leftover) {
    if (!warnings.includes(`Unreplaced token: ${tok}`)) {
      warnings.push(`Unreplaced token: ${tok}`);
    }
  }

  return { html: out, replaced, warnings };
}

/**
 * T01: inject brand tokens (REPORT_TOKENS.brands) into HTML style block
 */
export function injectBrandTokens(html: string, brandKey: ReportBrandKey = 'LYC', brand = REPORT_TOKENS.brands[brandKey]): string {
  const styleBlock = `
<style>
  :root {
    --brand-primary: ${brand.primary};
    --brand-secondary: ${brand.secondary};
    --page-bg: ${brand.pageBg};
  }
  .report-header::after { content: "${brand.footerText}"; }
</style>
`;
  // Inject tokens injectedTokens into <head>. Fallback if no head.
  const withHead = html.includes('</head>')
    ? html.replace('</head>', `${styleBlock}\n</head>`)
    : styleBlock + html;
  return withHead;
}

/**
 * T27: Primary render entry point
 */
export async function renderTemplate(opts: TemplateRenderOptions): Promise<RenderedTemplate> {
  const { templateId, variables, brand = 'LYC' } = opts;
  const entry = TEMPLATE_REGISTRY[templateId];
  const warnings: string[] = [];

  // 1. Load base HTML string (mocked in browser; real pipeline loads from FS on server)
  let baseHtml = entry
    ? `<html><head><title>${entry.code} — ${templateId}</title></head><body><div>TEMPLATE:${entry.path}</div>{{content}}</body></html>`
    : `<html><head><title>Template ${templateId}</title></head><body>Template not in registry</body></html>`;

  if (!entry) warnings.push(`Template ${templateId} missing from T16 registry`);

  // 2. Inject brand tokens (T01 + T11)
  baseHtml = injectBrandTokens(baseHtml, brand);

  // 3. Replace user variables
  const { html: hydrated, replaced, warnings: varWarnings } = injectVariables(baseHtml, variables);
  warnings.push(...varWarnings);

  // 4. Watermark (T11 LYC-only vs co-branded)
  const finalHtml = hydrated.replace('</body>', `<div style="position:fixed;bottom:8mm;right:8mm;opacity:0.4;font-size:9px">${REPORT_TOKENS.watermark}</div></body>`);

  return {
    html: finalHtml,
    meta: {
      title: entry?.code ? `${entry.code} · Rendered` : `${templateId}`,
      tokensInjected: replaced,
      warnings,
      renderedAt: new Date().toISOString(),
      sizeBytes: new Blob([finalHtml]).size,
    },
  };
}

/**
 * T76 iframe preview for portal document views (T21-T25)
 * Browser-side preview string
 */
export function buildIframeSrcdoc(rendered: RenderedTemplate): string {
  return rendered.html;
}

export default {
  renderTemplate,
  buildIframeSrcdoc: buildIframeSrcdoc,
  injectBrandTokens,
  TEMPLATE_REGISTRY,
};
