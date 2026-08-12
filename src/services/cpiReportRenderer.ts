// CPI Report Renderer — generates a printable HTML report
// China Leadership Pipeline Diagnostic
// LYC brand: Crimson Pro headings, DM Sans body, #C108AB accent, zero border-radius

export interface CPIReportData {
  name: string;
  date: string;
  compositeScore: number;
  tierLabel: string;
  archetype: string;
  archetypeTagline?: string;
  archetypeDescription?: string;
  archetypeStrengths?: string[];
  archetypeDevelopment?: string[];
  dimensionScores: Record<string, number>;
  dimensionNames: Record<string, string>;
  crossBorderScore: number;
  professionalContext?: {
    situation?: string;
    geography?: string;
    function?: string;
  };
  narrative?: {
    executive_summary?: string;
    strengths?: Array<{ strength: string; evidence: string }>;
    development_areas?: Array<{ area: string; example: string }>;
    cross_border_analysis?: string;
    career_recommendations?: string[];
    action_plan_90_day?: string[];
  } | { raw?: string } | null;
}

const TIER_COLORS: Record<string, string> = {
  Elite: '#22C55E',
  Advanced: '#C108AB',
  Established: '#EAB308',
  Developing: '#888888',
};

function scoreColor(score: number): string {
  if (score >= 80) return '#22C55E';
  if (score >= 65) return '#C108AB';
  if (score >= 50) return '#EAB308';
  return '#888888';
}

function scoreBar(score: number): string {
  return `<div class="bar-track"><div class="bar-fill" style="width:${score}%;background:${scoreColor(score)};"></div></div>`;
}

export function generateCPIReportHTML(data: CPIReportData): string {
  const tierColor = TIER_COLORS[data.tierLabel] || '#C108AB';
  const narrative = data.narrative && 'executive_summary' in (data.narrative as any) ? (data.narrative as any) : null;
  const rawNarrative = data.narrative && 'raw' in (data.narrative as any) ? (data.narrative as any).raw : null;

  const dimRows = Object.entries(data.dimensionScores)
    .map(([id, score]) => {
      const name = data.dimensionNames[id] || id;
      return `<tr> <td class="dim-name">${name}</td> <td class="dim-score" style="color:${scoreColor(score)};">${score}</td> <td class="dim-bar">${scoreBar(score)}</td> <td class="dim-tier" style="color:${scoreColor(score)};">${tierLabelFor(score)}</td> </tr>`;
    })
    .join('');

  const strengthsList = (narrative?.strengths || data.archetypeStrengths || [])
    .map((s: any) => `<li>${typeof s === 'string' ? s :`<strong>${s.strength}</strong> — ${s.evidence}`}</li>`)
    .join('');

  const developmentList = (narrative?.development_areas || data.archetypeDevelopment || [])
    .map((d: any) => `<li>${typeof d === 'string' ? d :`<strong>${d.area}</strong> — ${d.example}`}</li>`)
    .join('');

  const recommendations = (narrative?.career_recommendations || [])
    .map((r: string) => `<li>${r}</li>`)
    .join('');

  const actionPlan = (narrative?.action_plan_90_day || [])
    .map((a: string, i: number) => `<li><span class="action-num">${i + 1}</span><span>${a}</span></li>`)
    .join('');

  const ctx = data.professionalContext || {};
  const ctxLine = [ctx.situation, ctx.geography, ctx.function].filter(Boolean).join('·') || 'Not specified';

  return `<!DOCTYPE html> <html lang="en"> <head> <meta charset="UTF-8"> <meta name="viewport" content="width=device-width, initial-scale=1.0"> <title>China Leadership Pipeline Diagnostic — ${escapeHtml(data.name)}</title> <style> @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap'); * { margin: 0; padding: 0; box-sizing: border-box; border-radius: 0 !important; } body { font-family: 'DM Sans', sans-serif; color: #1a1a1a; line-height: 1.6; background: #FFFFFF; } .page { width: 210mm; min-height: 297mm; padding: 22mm 20mm; margin: 0 auto; background: #fff; } .section { margin-bottom: 36px; page-break-inside: avoid; } h1, h2, h3 { font-family: 'Crimson Pro', Georgia, serif; color: #1a1a1a; } h2 { font-size: 22px; border-bottom: 2px solid #C108AB; padding-bottom: 8px; margin-bottom: 16px; } h3 { font-size: 16px; margin-bottom: 8px; } .accent { color: #C108AB; } /* Cover */ .cover { text-align: center; padding: 60px 0 40px; border-bottom: 3px solid #C108AB; margin-bottom: 40px; } .cover .brand { font-family: 'Crimson Pro', serif; font-size: 28px; font-weight: 700; color: #C108AB; letter-spacing: 1px; margin-bottom: 8px; } .cover h1 { font-size: 32px; margin: 16px 0 8px; } .cover .subtitle { font-size: 15px; color: #666; margin-bottom: 24px; } .cover .meta { display: inline-block; padding: 16px 32px; background: #F5F5F5; border-left: 4px solid #C108AB; text-align: left; } .cover .meta-row { font-size: 14px; margin: 4px 0; } .cover .meta-label { color: #666; display: inline-block; width: 80px; } .archetype-badge { display: inline-block; margin-top: 20px; padding: 10px 28px; background: #C108AB; color: #fff; font-family: 'Crimson Pro', serif; font-size: 18px; font-weight: 700; } /* Score circle */ .score-display { display: flex; align-items: center; gap: 24px; margin-bottom: 16px; } .score-circle { width: 110px; height: 110px; border-radius: 50%; border: 6px solid ${tierColor}; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; } .score-circle .num { font-family: 'Crimson Pro', serif; font-size: 34px; font-weight: 700; color: ${tierColor}; line-height: 1; } .score-circle .max { font-size: 12px; color: #999; } .score-info .tier { font-family: 'Crimson Pro', serif; font-size: 20px; color: ${tierColor}; font-weight: 700; } .score-info .archetype { font-size: 16px; color: #333; margin-top: 4px; } .score-info .tagline { font-size: 13px; color: #666; font-style: italic; margin-top: 4px; } /* Dimension table */ table.dimensions { width: 100%; border-collapse: collapse; } table.dimensions th { text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; padding: 8px 12px; border-bottom: 1px solid #E5E5E5; } table.dimensions td { padding: 12px; border-bottom: 1px solid #F0F0F0; vertical-align: middle; font-size: 14px; } .dim-name { width: 35%; font-weight: 500; } .dim-score { width: 10%; text-align: center; font-family: 'Crimson Pro', serif; font-weight: 700; font-size: 18px; } .dim-bar { width: 40%; } .dim-tier { width: 15%; text-align: center; font-weight: 600; font-size: 13px; } .bar-track { width: 100%; height: 10px; background: #F0F0F0; } .bar-fill { height: 100%; } /* Lists */ ul.clean { list-style: none; padding: 0; } ul.clean li { padding: 8px 0 8px 24px; position: relative; font-size: 14px; border-bottom: 1px solid #F5F5F5; } ul.clean li:before { content: '▸'; color: #C108AB; position: absolute; left: 0; font-weight: 700; } /* Cross-border box */ .cb-box { padding: 20px; background: #F9F5FA; border-left: 4px solid #C108AB; } .cb-score-row { display: flex; align-items: center; gap: 16px; margin-bottom: 12px; } .cb-score-num { font-family: 'Crimson Pro', serif; font-size: 28px; font-weight: 700; color: ${scoreColor(data.crossBorderScore)}; } /* Action plan */ ol.action-plan { list-style: none; padding: 0; counter-reset: none; } ol.action-plan li { display: flex; align-items: flex-start; gap: 14px; padding: 14px 0; border-bottom: 1px solid #F0F0F0; font-size: 14px; } .action-num { flex-shrink: 0; width: 32px; height: 32px; background: #C108AB; color: #fff; font-family: 'Crimson Pro', serif; font-weight: 700; display: flex; align-items: center; justify-content: center; font-size: 15px; } .narrative-text { font-size: 14px; color: #333; line-height: 1.7; } .methodology { font-size: 12px; color: #999; line-height: 1.6; padding-top: 16px; border-top: 1px solid #E5E5E5; } .footer { text-align: center; padding: 24px 0; font-size: 12px; color: #999; border-top: 2px solid #C108AB; margin-top: 40px; } @media print { .page { width: auto; min-height: auto; padding: 15mm; margin: 0; } .section { page-break-inside: avoid; } } </style> </head> <body> <div class="page"> <!-- 1. COVER --> <div class="cover"> <div class="brand">LYC INTELLIGENCE</div> <h1>China Leadership Pipeline Diagnostic</h1> <p class="subtitle">Executive Leadership Assessment Report</p> <div class="meta"> <div class="meta-row"><span class="meta-label">Candidate</span> ${escapeHtml(data.name)}</div> <div class="meta-row"><span class="meta-label">Date</span> ${escapeHtml(data.date)}</div> <div class="meta-row"><span class="meta-label">Context</span> ${escapeHtml(ctxLine)}</div> </div> <div class="archetype-badge">${escapeHtml(data.archetype)}</div> </div> <!-- 2. EXECUTIVE SUMMARY --> <div class="section"> <h2>Executive Summary</h2> <div class="score-display"> <div class="score-circle"> <span class="num">${data.compositeScore}</span> <span class="max">/ 100</span> </div> <div class="score-info"> <div class="tier">${escapeHtml(data.tierLabel)}</div> <div class="archetype">${escapeHtml(data.archetype)}</div> ${data.archetypeTagline ?`<div class="tagline">"${escapeHtml(data.archetypeTagline)}"</div>`: ''} </div> </div> ${narrative?.executive_summary ?`<p class="narrative-text">${escapeHtml(narrative.executive_summary)}</p>`: rawNarrative ?`<p class="narrative-text">${escapeHtml(rawNarrative.slice(0, 500))}${rawNarrative.length > 500 ? '…' : ''}</p>`:`<p class="narrative-text">${escapeHtml(data.archetypeDescription || '')}</p>`} </div> <!-- 3. DIMENSION BREAKDOWN --> <div class="section"> <h2>Dimension Breakdown</h2> <table class="dimensions"> <thead> <tr> <th>Dimension</th> <th>Score</th> <th></th> <th>Tier</th> </tr> </thead> <tbody> ${dimRows} </tbody> </table> </div> <!-- 4. ARCHETYPE DEEP DIVE --> <div class="section"> <h2>Leadership Profile Deep Dive — <span class="accent">${escapeHtml(data.archetype)}</span></h2> <p class="narrative-text" style="margin-bottom:16px;">${escapeHtml(data.archetypeDescription || '')}</p> <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;"> <div> <h3>Strengths</h3> <ul class="clean">${strengthsList || '<li>Not specified</li>'}</ul> </div> <div> <h3>Development Areas</h3> <ul class="clean">${developmentList || '<li>Not specified</li>'}</ul> </div> </div> </div> <!-- 5. CROSS-BORDER ANALYSIS --> <div class="section"> <h2>Cross-Border Analysis</h2> <div class="cb-box"> <div class="cb-score-row"> <div class="cb-score-num">${data.crossBorderScore}<span style="font-size:14px;color:#999;"> / 100</span></div> <div> <div style="font-weight:600;color:${scoreColor(data.crossBorderScore)};">${tierLabelFor(data.crossBorderScore)} Readiness</div> <div style="font-size:13px;color:#666;">Cross-border adaptability assessment</div> </div> </div> ${narrative?.cross_border_analysis ?`<p class="narrative-text">${escapeHtml(narrative.cross_border_analysis)}</p>`:`<p class="narrative-text">Cross-border readiness score of ${data.crossBorderScore}/100 indicates ${data.crossBorderScore >= 80 ? 'elite' : data.crossBorderScore >= 65 ? 'advanced' : data.crossBorderScore >= 50 ? 'established' : 'developing'} capability in navigating multi-cultural and cross-border leadership contexts.</p>`} </div> </div> <!-- 6. CAREER RECOMMENDATIONS --> <div class="section"> <h2>Career Recommendations</h2> ${recommendations ?`<ul class="clean">${recommendations}</ul>`:`<p class="narrative-text">Personalized recommendations are generated with the full narrative analysis. Focus on developing your lower-scoring dimensions while leveraging your leadership profile's natural strengths.</p>`} </div> <!-- 7. 90-DAY ACTION PLAN --> <div class="section"> <h2>90-Day Action Plan</h2> <ol class="action-plan"> ${actionPlan ||`
          <li><span class="action-num">1</span><span>Identify your top development dimension and schedule a weekly focused practice session.</span></li>
          <li><span class="action-num">2</span><span>Seek a mentor or coach who embodies your target leadership profile strengths.</span></li>
          <li><span class="action-num">3</span><span>Set up a 30/60/90 checkpoint with a peer or sponsor to review progress against your career goals.</span></li>
        `} </ol> </div> <!-- 8. METHODOLOGY --> <div class="section"> <h2>Methodology</h2> <p class="methodology"> The China Leadership Pipeline Diagnostic evaluates executive leadership capability across five weighted dimensions: Strategic Orientation (25%), Cross-Border Adaptability (25%), Stakeholder Influence (20%), Execution Discipline (15%), and Leadership Presence (15%). The composite score is calculated as a weighted average of dimension scores, with a +5 bonus for elite cross-border readiness (≥80). Dimension scores are derived from 20 scenario-based questions (4 per dimension) and 5 cross-border readiness questions. Leadership profiles are assigned based on the top two scoring dimensions combined with cross-border readiness. Tier classifications: Elite (≥80), Advanced (≥65), Established (≥50), Developing (&lt;50). This report is generated by LYC Intelligence and should be interpreted alongside professional coaching context. </p> </div> <div class="footer"> LYC Intelligence · China Leadership Pipeline Diagnostic<br> Confidential — Generated ${escapeHtml(data.date)} </div> </div> </body> </html>`;
}

function tierLabelFor(score: number): string {
  if (score >= 80) return 'Elite';
  if (score >= 65) return 'Advanced';
  if (score >= 50) return 'Established';
  return 'Developing';
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g,'&#039;');
}
