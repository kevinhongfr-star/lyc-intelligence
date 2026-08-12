import type { AssessmentResultsConfig } from '@/components/assessment/results/types';
import {
  scoreAssessment as akiraScore,
  getInstrumentMeta,
  getCrossBorderTier,
  type ScoreOptions as AkiraScoreOptions,
} from './assessmentEngine';
import { generateCPIReportHTML, type CPIReportData } from './cpiReportRenderer';
import * as reportService from './reportService';
import type { ScoreResult as AkiraScoreResult } from '../lib/akira/engine';
import { ASSESSMENT_CATALOG } from '@/assessments/catalog';

export type InstrumentKey =
  | 'CPI'
  | 'PRISM'
  | 'SPARK'
  | 'LEAP'
  | 'QUEST'
  | 'IMPACT'
  | 'FORGE'
  | 'DRIVE'
  | 'COACH'
  | 'BRIDGE'
  | 'MOSAIC';

export interface ScoreResult {
  id?: string;
  instrumentKey: InstrumentKey | string;
  compositeScore: number;
  tierLabel: string;
  archetype: string;
  archetypeDescription?: string;
  archetypeTagline?: string;
  archetypeStrengths?: string[];
  archetypeDevelopment?: string[];
  dimensionScores: Record<string, number>;
  dimensionNames: Record<string, string>;
  crossBorderScore?: number;
  percentile?: Record<string, number>;
  strengths?: Array<{ title: string; text: string }>;
  gaps?: Array<{ title: string; text: string }>;
  development_actions?: Array<{ priority: number; dimension: string; action: string; timeline: string }>;
  generatedAt: Date;
  userId?: string;
}

export interface RunReportOptions {
  userId?: string;
  retakeLink?: string;
  shareLink?: string;
  tier?: string;
  persist?: boolean;
}

export interface ReportMeta {
  instrumentKey: string;
  resultId?: string;
  title: string;
  downloadFilename: string;
  shareUrl?: string;
  retakeUrl?: string;
  generatedAt?: Date;
}

const INSTRUMENT_ACCENTS: Record<string, string> = {
  CPI: '#C108AB',
  PRISM: '#C108AB',
  SPARK: '#0D9488',
  LEAP: '#6366F1',
  QUEST: '#3B82F6',
  DRIVE: '#F59E0B',
  COACH: '#10B981',
  IMPACT: '#F43F5E',
  FORGE: '#8B5CF6',
  BRIDGE: '#EC4899',
  MOSAIC: '#14B8A6',
};

const INSTRUMENT_NAMES: Record<string, string> = {
  CPI: 'China Leadership Pipeline Diagnostic',
  PRISM: 'PRISM Leadership Diagnostic',
  SPARK: 'SPARK AI Readiness Diagnostic',
  LEAP: 'LEAP — Learning & Execution Potential',
  QUEST: 'QUEST — Questioning & Inquiry Skills',
  IMPACT: 'IMPACT — Influence & Executive Presence',
  FORGE: 'FORGE — Performance & Resilience',
  DRIVE: 'DRIVE — Execution & Delivery Capability',
  COACH: 'COACH — Coaching & Leadership Development',
  BRIDGE: 'BRIDGE — Cross-Border Leadership',
  MOSAIC: 'MOSAIC — Cultural Agility',
};

export async function scoreAssessment(
  instrumentKey: string,
  answers: Record<string, number>,
  opts?: RunReportOptions
): Promise<ScoreResult> {
  const key = instrumentKey.toUpperCase();
  const scoreOpts: AkiraScoreOptions = {
    persist: opts?.persist,
    userId: opts?.userId,
  };
  const akiraOut = await akiraScore(key, answers, scoreOpts);
  if (!akiraOut.ok) {
    throw new Error(`[reportPipeline] Akira scoring failed for ${key}: ${akiraOut.error}`);
  }
  const { meta, result } = akiraOut as { ok: true; meta: { dimensions: Array<{ id: string; name: string }>; instrument: string; full_name: string; tagline: string }; result: AkiraScoreResult };
  const r = result as unknown as {
    dimension_scores: Record<string, number>;
    composite: { score: number; band: string; interpretation?: string };
    archetype?: { name: string; description?: string; core_strength?: string; strengths?: string[]; development?: string[] };
    cross_border_score?: number;
    development_priorities?: Array<{ priority: number; dimension: string; action: string; timeline: string }>;
  };

  const dimensionScores: Record<string, number> = {};
  const dimensionNames: Record<string, string> = {};
  for (const dim of meta.dimensions) {
    dimensionScores[dim.id] = r.dimension_scores?.[dim.id] ?? 50;
    dimensionNames[dim.id] = dim.name;
  }

  const compositeScore = typeof r.composite?.score === 'number' ? r.composite.score : 60;
  const tierLabel = typeof r.composite?.band === 'string' && r.composite.band
    ? r.composite.band
    : compositeScore >= 80 ? 'Elite' : compositeScore >= 65 ? 'Advanced' : compositeScore >= 50 ? 'Established' : 'Developing';

  const archetype = r.archetype?.name || 'Balanced Leader';
  const archetypeDescription = r.archetype?.description || r.archetype?.core_strength;
  const archetypeStrengths = Array.isArray((r.archetype as { strengths?: string[] })?.strengths)
    ? (r.archetype as { strengths: string[] }).strengths
    : undefined;
  const archetypeDevelopment = Array.isArray((r.archetype as { development?: string[] })?.development)
    ? (r.archetype as { development: string[] }).development
    : undefined;

  const devList: Array<{ priority: number; dimension: string; action: string; timeline: string }> = [];
  const strengthsList: Array<{ title: string; text: string }> = [];
  const gapsList: Array<{ title: string; text: string }> = [];
  if (Array.isArray(r.development_priorities)) {
    for (const dp of r.development_priorities) {
      if (dp && typeof (dp as any).priority === 'number') {
        devList.push({
          priority: (dp as any).priority,
          dimension: String((dp as any).dimension || 'Development'),
          action: String((dp as any).action || (dp as any).recommendation || 'Targeted development practice'),
          timeline: String((dp as any).timeline || '90 days'),
        });
        if (typeof (dp as any).dimension === 'string' && (dp as any).priority <= 2) {
          gapsList.push({
            title: String((dp as any).dimension),
            text: String((dp as any).action || (dp as any).recommendation || ''),
          });
        }
      }
    }
  }

  const sortedDimPairs = Object.entries(dimensionScores).sort((a, b) => b[1] - a[1]);
  for (const [id, score] of sortedDimPairs.slice(0, 3)) {
    if (score >= 70) {
      strengthsList.push({
        title: dimensionNames[id] || id,
        text: `A core strength at ${score}/100 — leverage this as a leadership multiplier.`,
      });
    }
  }

  const out: ScoreResult = {
    instrumentKey: key,
    compositeScore,
    tierLabel,
    archetype,
    archetypeDescription,
    archetypeTagline: meta.tagline,
    archetypeStrengths,
    archetypeDevelopment,
    dimensionScores,
    dimensionNames,
    crossBorderScore: typeof r.cross_border_score === 'number' ? r.cross_border_score : undefined,
    strengths: strengthsList.length ? strengthsList : undefined,
    gaps: gapsList.length ? gapsList : undefined,
    development_actions: devList.length ? devList : undefined,
    generatedAt: new Date(),
    userId: opts?.userId,
  };
  if (akiraOut.ok && (akiraOut as any).persisted_id) {
    out.id = (akiraOut as any).persisted_id;
  }
  return out;
}

async function persistResult(result: ScoreResult, opts: RunReportOptions): Promise<{ id?: string }> {
  try {
    const supabase = (await import('./supabaseApi')).getSupabase();
    const { data, error } = await supabase
      .from('assessment_results')
      .insert({
        instrument_key: result.instrumentKey,
        user_id: opts.userId || null,
        composite_score: result.compositeScore,
        tier_label: result.tierLabel,
        archetype: result.archetype,
        dimension_scores: result.dimensionScores,
        dimension_names: result.dimensionNames,
        cross_border_score: result.crossBorderScore || null,
        generated_at: result.generatedAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return { id: data?.id };
  } catch {
    return {};
  }
}

export async function renderReport(
  instrumentKey: string,
  result: ScoreResult,
  brandOpts?: {
    accent?: string;
    includeFooter?: boolean;
    generatedAt?: Date;
    retakeLink?: string;
    shareLink?: string;
  }
): Promise<string> {
  const key = instrumentKey.toUpperCase();
  const accent = brandOpts?.accent || INSTRUMENT_ACCENTS[key] || '#C108AB';
  const generatedAt = brandOpts?.generatedAt || new Date();
  const instrumentName = INSTRUMENT_NAMES[key] || `${key} Assessment`;

  if (key === 'CPI') {
    const cpiData: CPIReportData = {
      name: 'Assessment Participant',
      date: generatedAt.toISOString().split('T')[0],
      compositeScore: result.compositeScore,
      tierLabel: result.tierLabel,
      archetype: result.archetype,
      archetypeTagline: result.archetypeTagline,
      archetypeDescription: result.archetypeDescription,
      archetypeStrengths: result.archetypeStrengths,
      archetypeDevelopment: result.archetypeDevelopment,
      dimensionScores: result.dimensionScores,
      dimensionNames: result.dimensionNames,
      crossBorderScore: result.crossBorderScore ?? 0,
    };
    return generateCPIReportHTML(cpiData);
  }

  const dimRows = Object.entries(result.dimensionScores)
    .map(([id, score]) => {
      const name = result.dimensionNames[id] || id;
      const color = score >= 80 ? '#22C55E' : score >= 65 ? accent : score >= 50 ? '#EAB308' : '#888888';
      const pct = Math.max(0, Math.min(100, score));
      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #F0F0F0;font-size:14px;font-weight:500;">${name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F0F0F0;text-align:center;font-family:Georgia,serif;font-weight:700;font-size:18px;color:${color};">${score}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F0F0F0;">
          <div style="width:100%;height:10px;background:#F0F0F0;">
            <div style="height:100%;width:${pct}%;background:${color};"></div>
          </div>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #F0F0F0;text-align:center;font-weight:600;font-size:13px;color:${color};">
          ${score >= 80 ? 'Elite' : score >= 65 ? 'Advanced' : score >= 50 ? 'Established' : 'Developing'}
        </td>
      </tr>`;
    })
    .join('');

  const strengthsList = (result.strengths || [])
    .map((s) => `<li style="padding:8px 0 8px 24px;position:relative;font-size:14px;border-bottom:1px solid #F5F5F5;">
      <span style="position:absolute;left:0;font-weight:700;color:${accent};">▸</span>
      <strong>${s.title}</strong> — ${s.text}
    </li>`)
    .join('') || '<li style="padding:8px 0;font-size:14px;color:#999;">Narrative analysis pending</li>';

  const gapsList = (result.gaps || [])
    .map((g) => `<li style="padding:8px 0 8px 24px;position:relative;font-size:14px;border-bottom:1px solid #F5F5F5;">
      <span style="position:absolute;left:0;font-weight:700;color:${accent};">▸</span>
      <strong>${g.title}</strong> — ${g.text}
    </li>`)
    .join('') || '<li style="padding:8px 0;font-size:14px;color:#999;">Narrative analysis pending</li>';

  const actionsList = (result.development_actions || [])
    .sort((a, b) => a.priority - b.priority)
    .map((a, i) => `<li style="display:flex;align-items:flex-start;gap:14px;padding:14px 0;border-bottom:1px solid #F0F0F0;font-size:14px;">
      <span style="flex-shrink:0;width:32px;height:32px;background:${accent};color:#fff;font-family:Georgia,serif;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:15px;">${i + 1}</span>
      <div>
        <div style="font-weight:600;margin-bottom:4px;">${a.dimension}</div>
        <div style="color:#333;line-height:1.6;">${a.action}</div>
        <div style="font-size:12px;color:#999;margin-top:4px;">Timeline: ${a.timeline}</div>
      </div>
    </li>`)
    .join('') || `<li style="display:flex;align-items:flex-start;gap:14px;padding:14px 0;border-bottom:1px solid #F0F0F0;font-size:14px;">
      <span style="flex-shrink:0;width:32px;height:32px;background:${accent};color:#fff;font-family:Georgia,serif;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:15px;">1</span>
      <div>
        <div style="font-weight:600;margin-bottom:4px;">Focused Practice</div>
        <div style="color:#333;line-height:1.6;">Identify your lowest-scoring dimension and schedule a weekly 60-minute focused practice for the next 90 days.</div>
        <div style="font-size:12px;color:#999;margin-top:4px;">Timeline: 90 days</div>
      </div>
    </li>`;

  const retakeHtml = brandOpts?.retakeLink
    ? `<a href="${brandOpts.retakeLink}" style="display:inline-block;padding:12px 24px;background:${accent};color:#fff;font-weight:600;text-decoration:none;font-size:14px;">Retake Assessment</a>`
    : '';

  const shareHtml = brandOpts?.shareLink
    ? `<a href="${brandOpts.shareLink}" style="display:inline-block;padding:12px 24px;background:#111;color:#fff;font-weight:600;text-decoration:none;font-size:14px;">Share Report</a>`
    : '';

  const footerHtml = brandOpts?.includeFooter === false ? '' : `
    <div style="text-align:center;padding:24px 0;font-size:12px;color:#999;border-top:2px solid ${accent};margin-top:40px;">
      LYC Intelligence · ${instrumentName}<br>
      Confidential — Generated ${generatedAt.toISOString().split('T')[0]}
    </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${instrumentName} — ${result.archetype}</title>
<style>
  /* #1273: Standalone report HTML — self-hosted font URLs relative to the app root.
     When exported/saved as a standalone HTML file, fonts fall back to system equivalents. */
  @font-face { font-family:'Crimson Pro'; src:url('/fonts/CrimsonPro-Regular.woff2') format('woff2'); font-weight:400 700; font-style:normal; font-display:swap; }
  @font-face { font-family:'Crimson Pro'; src:url('/fonts/CrimsonPro-Italic.woff2') format('woff2'); font-weight:400 700; font-style:italic; font-display:swap; }
  @font-face { font-family:'DM Sans'; src:url('/fonts/DMSans-Regular.woff2') format('woff2'); font-weight:400; font-style:normal; font-display:swap; }
  @font-face { font-family:'DM Sans'; src:url('/fonts/DMSans-Medium.woff2') format('woff2'); font-weight:500; font-style:normal; font-display:swap; }
  @font-face { font-family:'DM Sans'; src:url('/fonts/DMSans-SemiBold.woff2') format('woff2'); font-weight:600; font-style:normal; font-display:swap; }
  @font-face { font-family:'DM Sans'; src:url('/fonts/DMSans-Bold.woff2') format('woff2'); font-weight:700; font-style:normal; font-display:swap; }
  @font-face { font-family:'IBM Plex Mono'; src:url('/fonts/IBMPlexMono-Regular.woff2') format('woff2'); font-weight:400; font-style:normal; font-display:swap; }
  @font-face { font-family:'IBM Plex Mono'; src:url('/fonts/IBMPlexMono-Medium.woff2') format('woff2'); font-weight:500; font-style:normal; font-display:swap; }
  * { margin:0; padding:0; box-sizing:border-box; border-radius:0 !important; }
  body { font-family:'DM Sans',system-ui,sans-serif; color:#1a1a1a; line-height:1.6; background:#FFFFFF; }
  .page { width:210mm; min-height:297mm; padding:22mm 20mm; margin:0 auto; background:#fff; }
  .section { margin-bottom:36px; page-break-inside:avoid; }
  h1,h2,h3 { font-family:'Crimson Pro',Georgia,serif; color:#1a1a1a; }
  h2 { font-size:22px; border-bottom:2px solid ${accent}; padding-bottom:8px; margin-bottom:16px; }
  h3 { font-size:16px; margin-bottom:8px; }
  .accent { color:${accent}; }
  .mono { font-family:'IBM Plex Mono','Courier New',monospace; }
  .cover { text-align:center; padding:60px 0 40px; border-bottom:3px solid ${accent}; margin-bottom:40px; }
  .cover .brand { font-family:'Crimson Pro',serif; font-size:28px; font-weight:700; color:${accent}; letter-spacing:1px; margin-bottom:8px; }
  .cover h1 { font-size:32px; margin:16px 0 8px; }
  .cover .subtitle { font-size:15px; color:#666; margin-bottom:24px; }
  .cover .meta { display:inline-block; padding:16px 32px; background:#F5F5F5; border-left:4px solid ${accent}; text-align:left; }
  .cover .meta-row { font-size:14px; margin:4px 0; }
  .cover .meta-label { color:#666; display:inline-block; width:110px; }
  .archetype-badge { display:inline-block; margin-top:20px; padding:10px 28px; background:${accent}; color:#fff; font-family:'Crimson Pro',serif; font-size:18px; font-weight:700; }
  .score-display { display:flex; align-items:center; gap:24px; margin-bottom:16px; }
  .score-circle { width:110px; height:110px; border-radius:50%; border:6px solid ${accent}; display:flex; flex-direction:column; align-items:center; justify-content:center; flex-shrink:0; }
  .score-circle .num { font-family:'Crimson Pro',serif; font-size:34px; font-weight:700; color:${accent}; line-height:1; }
  .score-circle .max { font-size:12px; color:#999; }
  .score-info .tier { font-family:'Crimson Pro',serif; font-size:20px; color:${accent}; font-weight:700; }
  .score-info .archetype { font-size:16px; color:#333; margin-top:4px; }
  .score-info .tagline { font-size:13px; color:#666; font-style:italic; margin-top:4px; }
  table.dimensions { width:100%; border-collapse:collapse; }
  table.dimensions th { text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:0.5px; color:#999; padding:8px 12px; border-bottom:1px solid #E5E5E5; }
  ul.clean { list-style:none; padding:0; }
  .cb-box { padding:20px; background:#F9F5FA; border-left:4px solid ${accent}; }
  .actions { display:flex; gap:12px; flex-wrap:wrap; }
  @media print { .page { width:auto; min-height:auto; padding:15mm; margin:0; } .section { page-break-inside:avoid; } }
</style>
</head>
<body>
<div class="page">
  <div class="cover">
    <div class="brand">LYC INTELLIGENCE</div>
    <h1>${instrumentName}</h1>
    <p class="subtitle">Executive Leadership Assessment Report</p>
    <div class="meta">
      <div class="meta-row"><span class="meta-label">Instrument</span> ${key}</div>
      <div class="meta-row"><span class="meta-label">Date</span> ${generatedAt.toISOString().split('T')[0]}</div>
      ${result.userId ? `<div class="meta-row"><span class="meta-label">User ID</span> <span class="mono">${result.userId.slice(0, 8)}…</span></div>` : ''}
    </div>
    <div class="archetype-badge">${result.archetype}</div>
  </div>

  <div class="section">
    <h2>Executive Summary</h2>
    <div class="score-display">
      <div class="score-circle">
        <span class="num">${result.compositeScore}</span>
        <span class="max">/ 100</span>
      </div>
      <div class="score-info">
        <div class="tier">${result.tierLabel}</div>
        <div class="archetype">${result.archetype}</div>
        ${result.archetypeTagline ? `<div class="tagline">"${result.archetypeTagline}"</div>` : ''}
      </div>
    </div>
    <p style="font-size:14px;color:#333;line-height:1.7;">
      ${result.archetypeDescription || `Your leadership profile (${result.archetype}) reflects a composite score of ${result.compositeScore}/100, placing you in the ${result.tierLabel} tier. Review the dimension breakdown and development plan below for targeted recommendations.`}
    </p>
  </div>

  <div class="section">
    <h2>Dimension Breakdown</h2>
    <table class="dimensions">
      <thead><tr><th>Dimension</th><th style="width:10%;">Score</th><th style="width:40%;"></th><th style="width:15%;">Tier</th></tr></thead>
      <tbody>${dimRows}</tbody>
    </table>
  </div>

  <div class="section">
    <h2>Leadership Profile — <span class="accent">${result.archetype}</span></h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
      <div>
        <h3>Key Strengths</h3>
        <ul class="clean">${strengthsList}</ul>
      </div>
      <div>
        <h3>Development Areas</h3>
        <ul class="clean">${gapsList}</ul>
      </div>
    </div>
  </div>

  ${result.crossBorderScore !== undefined ? `
  <div class="section">
    <h2>Cross-Border Readiness</h2>
    <div class="cb-box">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px;">
        <div style="font-family:'Crimson Pro',serif;font-size:28px;font-weight:700;color:${getCrossBorderTier(result.crossBorderScore).color};">
          ${result.crossBorderScore}<span style="font-size:14px;color:#999;"> / 100</span>
        </div>
        <div>
          <div style="font-weight:600;color:${getCrossBorderTier(result.crossBorderScore).color};">
            ${getCrossBorderTier(result.crossBorderScore).label} Readiness
          </div>
          <div style="font-size:13px;color:#666;">Cross-border adaptability indicator</div>
        </div>
      </div>
    </div>
  </div>` : ''}

  <div class="section">
    <h2>90-Day Action Plan</h2>
    <ol style="list-style:none;padding:0;">${actionsList}</ol>
  </div>

  ${(retakeHtml || shareHtml) ? `<div class="section actions">${retakeHtml}${shareHtml}</div>` : ''}

  ${footerHtml}
</div>
</body>
</html>`;
}

export async function runAndRenderReport(
  instrumentKey: string,
  answers: Record<string, number>,
  opts?: RunReportOptions
): Promise<
  | { ok: true; result: ScoreResult; html: string; reportId?: string }
  | { ok: false; error: string }
> {
  try {
    const result = await scoreAssessment(instrumentKey, answers, { ...opts, persist: opts?.persist ?? true });
    if (!result || typeof result.compositeScore !== 'number') {
      return { ok: false, error: 'Scoring failed — no composite score returned' };
    }

    const html = await renderReport(instrumentKey, result, {
      accent: '#C108AB',
      includeFooter: true,
      generatedAt: new Date(),
      retakeLink: opts?.retakeLink,
      shareLink: opts?.shareLink,
    });

    let reportId: string | undefined;
    try {
      if (typeof (reportService as any).generateReport === 'function') {
        const saved = await (reportService as any).generateReport(
          'assessment-report',
          'PDF',
          { instrumentKey, resultId: result.id, compositeScore: result.compositeScore }
        );
        if (saved?.reportId) reportId = saved.reportId;
      }
    } catch {
      /* persistence is optional */
    }

    return { ok: true, result, html, reportId };
  } catch (err: any) {
    return { ok: false, error: err?.message || String(err) };
  }
}

export async function getReportMeta(
  instrumentKey: string,
  resultId?: string
): Promise<ReportMeta> {
  const key = instrumentKey.toUpperCase();
  const name = INSTRUMENT_NAMES[key] || `${key} Assessment`;
  const dateStamp = new Date().toISOString().split('T')[0];

  const result = resultId ? await lookupResult(resultId) : undefined;

  return {
    instrumentKey: key,
    resultId,
    title: `${name} Report${result?.archetype ? ` — ${result.archetype}` : ''}`,
    downloadFilename: `LYC_${key}_Report_${resultId || dateStamp}.html`,
    shareUrl: resultId ? `/share/assessment/${resultId}` : undefined,
    retakeUrl: `/${key.toLowerCase()}/take`,
    generatedAt: result?.generatedAt ? new Date(result.generatedAt) : new Date(),
  };
}

async function lookupResult(resultId: string): Promise<Partial<ScoreResult> | null> {
  try {
    const supabase = (await import('./supabaseApi')).getSupabase();
    const { data } = await supabase
      .from('assessment_results')
      .select('*')
      .eq('id', resultId)
      .single();
    if (!data) return null;
    return {
      archetype: data.archetype,
      generatedAt: data.generated_at,
      compositeScore: data.composite_score,
    };
  } catch {
    return null;
  }
}

export function instrumentToConfig(instrumentKey: string, result: ScoreResult): AssessmentResultsConfig {
  const key = instrumentKey.toUpperCase();
  const accent = INSTRUMENT_ACCENTS[key] || '#C108AB';
  const assessmentName = INSTRUMENT_NAMES[key] || key;
  const prefix = `${key.toLowerCase()}-results`;
  const lowerKey = key.toLowerCase();

  // P1 #1322 — pull real dimension metadata from the canonical catalog instead
  // of generic "Low/High" placeholders, and auto-generate the "why it matters"
  // + "what to do next" layers from score bands so every instrument gets the
  // progressive-reveal treatment without per-page wiring.
  const catalogEntry = ASSESSMENT_CATALOG[key];
  const catalogDimsById = new Map(
    (catalogEntry?.dimensions || []).map((d) => [d.id, d])
  );

  const dimensions = Object.entries(result.dimensionScores).map(([id, score]) => {
    const cat = catalogDimsById.get(id);
    const name = result.dimensionNames[id] || cat?.name || id;
    const description = cat?.description || `${name} dimension score`;
    const lowLabel = cat?.lowLabel || 'Developing';
    const highLabel = cat?.highLabel || 'Established';

    // Score-band-derived "why it matters" + action suggestion (#1322).
    let whyItMatters: string;
    let actionSuggestion: string;
    if (score >= 75) {
      whyItMatters = `${name} is a signature strength in your profile. At this level it compounds your other dimensions and is a credible differentiator in executive positioning conversations.`;
      actionSuggestion = `Lead with ${name} in board and search narratives. Look for mandates where this strength is the primary lever, and use it to offset adjacent gaps rather than over-investing here.`;
    } else if (score >= 50) {
      whyItMatters = `${name} is functional but not yet a differentiator. In executive contexts, peers at this band blend in rather than stand out — the gap to the next band is where competitive positioning is won.`;
      actionSuggestion = `Targeted development on ${name}: identify one high-stakes context per quarter where you deliberately stretch this dimension, and seek feedback from a counterpart who models the high band.`;
    } else if (score >= 35) {
      whyItMatters = `${name} is a material gap relative to executive benchmarks. At this band it can quietly cap your readiness for broader mandates — decision-makers will sense it before they can name it.`;
      actionSuggestion = `Treat ${name} as a primary development priority. Pair a structured 90-day plan with coaching or a NEXUS deep-dive, and revisit with a re-assessment to confirm movement.`;
    } else {
      whyItMatters = `${name} is a foundational gap. At this level it is likely already affecting outcomes in your current mandate, not just future ones — it warrants attention before broader positioning work.`;
      actionSuggestion = `Prioritise ${name} immediately. Start with the development actions below, consider a consultant-matched debrief, and defer high-stakes contexts that depend heavily on this dimension until you see movement.`;
    }

    return {
      id,
      name,
      score,
      lowLabel,
      highLabel,
      description,
      whyItMatters,
      actionSuggestion,
    };
  });

  return {
    assessmentCode: key,
    assessmentName,
    accent,
    prefix,
    overallScore: result.compositeScore,
    archetype: {
      name: result.archetype,
      description: result.archetypeDescription || `${result.archetype} leadership profile.`,
      traits: result.archetypeStrengths || [],
    },
    dimensions,
    insights: [
      ...(result.strengths || []).map((s) => ({ ...s, type: 'strength' as const })),
      ...(result.gaps || []).map((g) => ({ ...g, type: 'gap' as const })),
    ],
    developmentActions: result.development_actions || [],
    retakePath: `/${lowerKey}/take`,
    nexusPath: '/nexus/chat',
  };
}
