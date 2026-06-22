// SHIFT Report Renderer - HTML to PDF generation

import {
  SHIFTAssessmentType,
  SHIFTIntake,
  SHIFTAnalysisResult,
  SHIFT_CONFIGS,
  SHIFT_ARCHETYPES,
} from './shiftAssessmentTypes';

export function generateSHIFTReportHTML(
  assessmentType: SHIFTAssessmentType,
  intake: SHIFTIntake,
  analysis: SHIFTAnalysisResult,
  scoringRunId?: string
): string {
  const config = SHIFT_CONFIGS[assessmentType];
  const archetype = SHIFT_ARCHETYPES[analysis.archetype] || SHIFT_ARCHETYPES['Balanced Leader'];
  const generatedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SHIFT ${assessmentType} Assessment Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'DM Sans', sans-serif;
      color: #333;
      line-height: 1.6;
      background: #fff;
    }
    
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 20mm;
      margin: 0 auto;
      background: #fff;
    }
    
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 2px solid #C108AB;
    }
    
    .logo {
      font-family: 'Libre Baskerville', serif;
      font-size: 24px;
      font-weight: 700;
      color: #C108AB;
      margin-bottom: 8px;
    }
    
    .assessment-title {
      font-family: 'Libre Baskerville', serif;
      font-size: 32px;
      font-weight: 700;
      color: #000;
      margin-bottom: 8px;
    }
    
    .assessment-subtitle {
      font-size: 14px;
      color: #666;
    }
    
    .participant-info {
      margin-top: 16px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    
    .participant-name {
      font-size: 18px;
      font-weight: 600;
      color: #000;
    }
    
    .participant-details {
      font-size: 14px;
      color: #666;
    }
    
    .section {
      margin-top: 24px;
    }
    
    .section-title {
      font-family: 'Libre Baskerville', serif;
      font-size: 20px;
      font-weight: 700;
      color: #000;
      margin-bottom: 16px;
      border-bottom: 1px solid #e5e5e5;
      padding-bottom: 8px;
    }
    
    .score-container {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px;
      background: linear-gradient(135deg, #C108AB15 0%, #f5f5f5 100%);
      border-radius: 12px;
      margin-bottom: 24px;
    }
    
    .score-circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: #C108AB;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 48px;
      font-weight: 700;
    }
    
    .score-label {
      margin-top: 16px;
      font-size: 14px;
      color: #666;
      text-align: center;
    }
    
    .archetype-badge {
      display: inline-block;
      padding: 8px 24px;
      background: #C108AB20;
      border-radius: 20px;
      font-weight: 600;
      color: #000;
      margin-top: 16px;
    }
    
    .dimension-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }
    
    .dimension-item {
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    
    .dimension-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .dimension-name {
      font-weight: 600;
      color: #000;
    }
    
    .dimension-score {
      font-weight: 700;
      color: #C108AB;
    }
    
    .progress-bar {
      height: 8px;
      background: #e5e5e5;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      background: #C108AB;
      border-radius: 4px;
    }
    
    .strengths-section {
      padding: 24px;
      background: #22C55E15;
      border: 1px solid #22C55E30;
      border-radius: 12px;
    }
    
    .strengths-title {
      font-size: 18px;
      font-weight: 600;
      color: #22C55E;
      margin-bottom: 16px;
    }
    
    .strength-item {
      margin-bottom: 12px;
    }
    
    .strength-name {
      font-weight: 600;
      color: #000;
    }
    
    .strength-evidence {
      font-size: 14px;
      color: #666;
      margin-top: 4px;
    }
    
    .development-section {
      padding: 24px;
      background: #EAB30815;
      border: 1px solid #EAB30830;
      border-radius: 12px;
    }
    
    .development-title {
      font-size: 18px;
      font-weight: 600;
      color: #EAB308;
      margin-bottom: 16px;
    }
    
    .development-item {
      margin-bottom: 12px;
    }
    
    .development-area {
      font-weight: 600;
      color: #000;
    }
    
    .development-example {
      font-size: 14px;
      color: #666;
      margin-top: 4px;
    }
    
    .recommendations-section {
      padding: 24px;
      background: #f5f5f5;
      border-radius: 12px;
    }
    
    .recommendations-title {
      font-size: 18px;
      font-weight: 600;
      color: #000;
      margin-bottom: 16px;
    }
    
    .recommendation-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .recommendation-number {
      width: 24px;
      height: 24px;
      background: #C108AB20;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: #C108AB;
      font-size: 12px;
    }
    
    .recommendation-text {
      font-size: 14px;
      color: #333;
    }
    
    .context-section {
      padding: 24px;
      background: #f5f5f5;
      border-radius: 12px;
    }
    
    .context-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    
    .context-item {
      margin-bottom: 8px;
    }
    
    .context-label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }
    
    .context-value {
      font-size: 14px;
      color: #000;
    }
    
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e5e5e5;
      text-align: center;
    }
    
    .footer-logo {
      font-family: 'Libre Baskerville', serif;
      font-size: 14px;
      color: #C108AB;
    }
    
    .footer-text {
      font-size: 12px;
      color: #666;
      margin-top: 8px;
    }
    
    .footer-date {
      font-size: 12px;
      color: #999;
    }
    
    .page-break {
      page-break-after: always;
    }
    
    .confidence-badge {
      display: inline-block;
      padding: 4px 12px;
      background: #C108AB15;
      border-radius: 12px;
      font-size: 12px;
      color: #666;
      margin-left: 8px;
    }
    
    .goals-section {
      padding: 24px;
      background: #f5f5f5;
      border-radius: 12px;
    }
    
    .goals-title {
      font-size: 18px;
      font-weight: 600;
      color: #000;
      margin-bottom: 16px;
    }
    
    .goal-item {
      margin-bottom: 12px;
    }
    
    .goal-label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }
    
    .goal-text {
      font-size: 14px;
      color: #000;
    }
  </style>
</head>
<body>
  <!-- Page 1: Summary -->
  <div class="page">
    <div class="header">
      <div class="logo">LYC Intelligence</div>
      <div class="assessment-title">SHIFT ${assessmentType}</div>
      <div class="assessment-subtitle">${config.name} · ${config.purpose}</div>
      
      <div class="participant-info">
        <div class="participant-name">${intake.gate.name}</div>
        <div class="participant-details">
          ${intake.context.role || 'Professional'} · ${intake.context.industry || 'Industry'} · ${intake.context.years_experience} years experience
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Assessment Summary</div>
      
      <div class="score-container">
        <div style="text-align: center;">
          <div class="score-circle">${analysis.composite_score}</div>
          <div class="score-label">Composite Score (0-100)</div>
          <div class="archetype-badge">${analysis.archetype}</div>
          <div class="confidence-badge">Confidence: ${Math.round(analysis.confidence * 100)}%</div>
        </div>
      </div>
      
      <div class="dimension-grid">
        ${config.dimensions.map((dim) => {
          const score = analysis.dimension_scores[dim.id] || 0;
          return `
          <div class="dimension-item">
            <div class="dimension-header">
              <span class="dimension-name">${dim.name}</span>
              <span class="dimension-score">${score}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${score}%"></div>
            </div>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">${dim.description}</div>
          </div>`;
        }).join('')}
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-logo">LYC Intelligence</div>
      <div class="footer-text">Building leadership that works across borders</div>
      <div class="footer-date">Generated: ${generatedDate}</div>
    </div>
  </div>
  
  <!-- Page 2: Analysis -->
  <div class="page page-break">
    <div class="header">
      <div class="logo">LYC Intelligence</div>
      <div class="assessment-title">Detailed Analysis</div>
    </div>
    
    <div class="section">
      <div class="section-title">Your Archetype: ${analysis.archetype}</div>
      <p style="color: #333; margin-bottom: 16px;">${archetype.description}</p>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div>
          <div style="font-weight: 600; color: #22C55E; margin-bottom: 8px;">Key Strengths</div>
          ${archetype.strengths.map((s: string) => `<div style="font-size: 14px; color: #333; margin-bottom: 4px;">• ${s}</div>`).join('')}
        </div>
        <div>
          <div style="font-weight: 600; color: #EAB308; margin-bottom: 8px;">Development Focus</div>
          ${archetype.development.map((d: string) => `<div style="font-size: 14px; color: #333; margin-bottom: 4px;">• ${d}</div>`).join('')}
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="strengths-section">
        <div class="strengths-title">Top Strengths (Evidence-Based)</div>
        ${analysis.strengths.map((s: any) => `
        <div class="strength-item">
          <div class="strength-name">${s.strength}</div>
          <div class="strength-evidence">${s.evidence}</div>
        </div>`).join('')}
      </div>
    </div>
    
    <div class="section">
      <div class="development-section">
        <div class="development-title">Development Areas</div>
        ${analysis.development_areas.map((d: any) => `
        <div class="development-item">
          <div class="development-area">${d.area}</div>
          <div class="development-example">${d.example}</div>
        </div>`).join('')}
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-logo">LYC Intelligence</div>
      <div class="footer-text">Building leadership that works across borders</div>
    </div>
  </div>
  
  <!-- Page 3: Recommendations & Context -->
  <div class="page">
    <div class="header">
      <div class="logo">LYC Intelligence</div>
      <div class="assessment-title">Recommendations & Context</div>
    </div>
    
    <div class="section">
      <div class="recommendations-section">
        <div class="recommendations-title">Actionable Recommendations</div>
        ${analysis.recommendations.map((r: string, i: number) => `
        <div class="recommendation-item">
          <div class="recommendation-number">${i + 1}</div>
          <div class="recommendation-text">${r}</div>
        </div>`).join('')}
      </div>
    </div>
    
    <div class="section">
      <div class="context-section">
        <div style="font-size: 18px; font-weight: 600; color: #000; margin-bottom: 16px;">Assessment Context</div>
        
        <div class="context-grid">
          <div class="context-item">
            <div class="context-label">Current Role</div>
            <div class="context-value">${intake.context.role || 'Not specified'}</div>
          </div>
          <div class="context-item">
            <div class="context-label">Industry</div>
            <div class="context-value">${intake.context.industry || 'Not specified'}</div>
          </div>
          <div class="context-item">
            <div class="context-label">Experience</div>
            <div class="context-value">${intake.context.years_experience} years</div>
          </div>
          <div class="context-item">
            <div class="context-label">DISC Profile</div>
            <div class="context-value">${intake.style.disc_profile || 'Not specified'}</div>
          </div>
          <div class="context-item">
            <div class="context-label">Cross-Cultural Experience</div>
            <div class="context-value">${intake.crossBorder.cultural_experience ? 'Yes' : 'No'}</div>
          </div>
          <div class="context-item">
            <div class="context-label">International Teams</div>
            <div class="context-value">${intake.crossBorder.international_teams} teams</div>
          </div>
        </div>
        
        <div style="margin-top: 16px;">
          <div class="context-label">Current Challenges</div>
          <div class="context-value">${intake.context.challenges || 'Not specified'}</div>
        </div>
        
        <div style="margin-top: 16px;">
          <div class="context-label">Improvement Goals</div>
          <div class="context-value">${intake.context.improvement_goals || 'Not specified'}</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="goals-section">
        <div class="goals-title">Your Development Goals</div>
        
        <div class="goal-item">
          <div class="goal-label">Short-term (6 months)</div>
          <div class="goal-text">${intake.goals.short_term || 'Not specified'}</div>
        </div>
        
        <div class="goal-item">
          <div class="goal-label">Long-term (2 years)</div>
          <div class="goal-text">${intake.goals.long_term || 'Not specified'}</div>
        </div>
        
        <div class="goal-item">
          <div class="goal-label">Success Definition</div>
          <div class="goal-text">${intake.goals.success_definition || 'Not specified'}</div>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-logo">LYC Intelligence</div>
      <div class="footer-text">Building leadership that works across borders</div>
      <div class="footer-date">Report ID: ${scoringRunId || 'N/A'}</div>
    </div>
  </div>
</body>
</html>`;
}

// Server-side PDF generation using puppeteer or similar
export async function generateSHIFTReportPDF(
  assessmentType: SHIFTAssessmentType,
  intake: SHIFTIntake,
  analysis: SHIFTAnalysisResult,
  scoringRunId?: string
): Promise<Buffer> {
  const html = generateSHIFTReportHTML(assessmentType, intake, analysis, scoringRunId);
  
  // For server-side, we would use puppeteer or similar
  // This is a placeholder that returns the HTML as a buffer
  // In production, integrate with a PDF generation service
  
  return Buffer.from(html, 'utf-8');
}

// Client-side download function
export function downloadSHIFTReport(
  assessmentType: SHIFTAssessmentType,
  intake: SHIFTIntake,
  analysis: SHIFTAnalysisResult,
  scoringRunId?: string
): void {
  const html = generateSHIFTReportHTML(assessmentType, intake, analysis, scoringRunId);
  
  // Create a blob and download
  const blob = new Blob([html], { type: 'text/html' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SHIFT_${assessmentType}_Report.html`;
  a.click();
  window.URL.revokeObjectURL(url);
}