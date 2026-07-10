// Dynamic import for jspdf to reduce bundle size
let jsPDFModule: any = null;
async function getJsPDF() {
  if (!jsPDFModule) {
    const mod = await import('jspdf');
    jsPDFModule = mod.jsPDF;
  }
  return jsPDFModule;
}
import type { LENSReportData, LENSReportCandidate } from '@/services/supabaseApi';

const PAGE_WIDTH = 210; // A4 width in mm
const PAGE_HEIGHT = 297; // A4 height in mm
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

const getScoreColor = (score: number): string => {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#F59E0B';
  return '#6B7280';
};

const getVerdictColor = (verdict: string): string => {
  if (verdict === 'proceed') return '#065F46';
  if (verdict === 'hold') return '#92400E';
  return '#991B1B';
};

const getVerdictBg = (verdict: string): string => {
  if (verdict === 'proceed') return '#D1FAE5';
  if (verdict === 'hold') return '#FEF3C7';
  return '#FEE2E2';
};

interface RenderParams {
  reportData: LENSReportData;
  reportType: 'T1' | 'T2' | 'T3';
}

export async function renderLENSReport(params: RenderParams): Promise<string> {
  const { reportData, reportType } = params;
  const JsPDF = await getJsPDF();
  const doc = new JsPDF();

  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Helper to add header
  const addHeader = (title: string) => {
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, PAGE_WIDTH, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(title, MARGIN, 18);
    doc.setFontSize(10);
    doc.text(`LYC Intelligence — LENS ${reportType} Report`, PAGE_WIDTH - MARGIN, 18, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  };

  // Helper to add footer
  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text(`Page ${pageNum} of ${totalPages}`, MARGIN, PAGE_HEIGHT - 15);
    doc.text(generatedDate, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 15, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  };

  // Helper to add new page
  const addNewPage = () => {
    doc.addPage();
  };

  // Helper to draw score badge
  const drawScoreBadge = (x: number, y: number, score: number, label: string = 'Match') => {
    const badgeWidth = 35;
    const badgeHeight = 12;
    
    doc.setFillColor(getScoreColor(score));
    doc.roundedRect(x, y, badgeWidth, badgeHeight, 2, 2, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`${label}: ${score}`, x + badgeWidth / 2, y + 8, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  };

  // Helper to draw verdict badge
  const drawVerdictBadge = (x: number, y: number, verdict: string) => {
    const badgeWidth = 25;
    const badgeHeight = 10;
    
    doc.setFillColor(getVerdictBg(verdict));
    doc.roundedRect(x, y, badgeWidth, badgeHeight, 2, 2, 'F');
    
    doc.setTextColor(getVerdictColor(verdict));
    doc.setFontSize(9);
    doc.text(verdict.toUpperCase(), x + badgeWidth / 2, y + 7, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  };

  // Helper to draw dimension box
  const drawDimensionBox = (x: number, y: number, label: string, value: number) => {
    const boxWidth = 50;
    const boxHeight = 25;
    
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(x, y, boxWidth, boxHeight, 3, 3, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(113, 128, 150);
    doc.text(label, x + boxWidth / 2, y + 8, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(26, 26, 26);
    doc.text(`${value}/100`, x + boxWidth / 2, y + 18, { align: 'center' });
  };

  // Helper to draw bullet list
  const drawBulletList = (x: number, y: number, items: string[], maxWidth: number) => {
    let currentY = y;
    items.forEach(item => {
      doc.setFontSize(10);
      doc.setTextColor(74, 85, 104);
      doc.text(`• ${item.substring(0, 80)}`, x, currentY);
      currentY += 6;
    });
    return currentY;
  };

  // Calculate total pages based on report type and candidates
  const totalPages = reportType === 'T1' 
    ? 3 + reportData.candidates.length 
    : reportType === 'T2' 
      ? 5 
      : 4;

  // ── T1: Talent Mapping Shortlist ──
  if (reportType === 'T1') {
    // Page 1: Cover
    doc.setFillColor(248, 249, 250);
    doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
    
    doc.setFontSize(28);
    doc.setTextColor(26, 26, 26);
    doc.text(reportData.mandate.title || 'Talent Mapping Report', PAGE_WIDTH / 2, 120, { align: 'center' });
    
    doc.setFontSize(18);
    doc.setTextColor(74, 85, 104);
    doc.text('Talent Mapping Shortlist', PAGE_WIDTH / 2, 140, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(113, 128, 150);
    doc.text(`LENS Report Type T1`, PAGE_WIDTH / 2, 160, { align: 'center' });
    doc.text(`${reportData.mandate.client || 'Client'} | ${generatedDate}`, PAGE_WIDTH / 2, 180, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(138, 111, 58);
    doc.text('LYC Intelligence', PAGE_WIDTH / 2, 220, { align: 'center' });
    
    addFooter(1, totalPages);

    // Page 2: Executive Summary
    addNewPage();
    addHeader('Executive Summary');

    let y = 40;

    doc.setFontSize(11);
    doc.setTextColor(74, 85, 104);
    doc.text(
      `This report presents ${reportData.candidates.length} shortlisted candidates for the ${reportData.mandate.title || 'mandate'} mandate.`,
      MARGIN, y
    );
    y += 15;

    // Key Highlights
    doc.setFontSize(12);
    doc.setTextColor(26, 26, 26);
    doc.text('Key Highlights', MARGIN, y);
    y += 10;

    const topCandidate = reportData.candidates[0];
    const proceedCount = reportData.candidates.filter(c => c.verdict === 'proceed').length;
    const holdCount = reportData.candidates.filter(c => c.verdict === 'hold').length;
    const avgScore = Math.round(
      reportData.candidates.reduce((sum, c) => sum + c.match_score, 0) / reportData.candidates.length
    );

    const highlights = [
      `Top candidate: ${topCandidate?.name || 'N/A'} with match score ${topCandidate?.match_score || 0}/100`,
      `${proceedCount} candidates recommended to proceed`,
      `${holdCount} candidates on hold for further evaluation`,
      `Average match score: ${avgScore}/100`,
    ];

    y = drawBulletList(MARGIN + 5, y, highlights, CONTENT_WIDTH);
    y += 10;

    // Candidate Overview Table
    doc.setFontSize(12);
    doc.setTextColor(26, 26, 26);
    doc.text('Candidate Overview', MARGIN, y);
    y += 8;

    // Table header
    doc.setFillColor(248, 249, 250);
    doc.rect(MARGIN, y, CONTENT_WIDTH, 10, 'F');
    doc.setFontSize(10);
    doc.setTextColor(26, 26, 26);
    doc.text('Candidate', MARGIN + 5, y + 7);
    doc.text('Title', MARGIN + 60, y + 7);
    doc.text('Match', MARGIN + 130, y + 7);
    doc.text('Verdict', MARGIN + 160, y + 7);
    y += 12;

    // Table rows
    reportData.candidates.forEach((candidate, i) => {
      if (y > PAGE_HEIGHT - 50) {
        addNewPage();
        addHeader('Executive Summary (continued)');
        y = 40;
      }

      doc.setFontSize(9);
      doc.setTextColor(74, 85, 104);
      doc.text(candidate.name.substring(0, 25), MARGIN + 5, y + 5);
      doc.text(candidate.title?.substring(0, 30) || '', MARGIN + 60, y + 5);
      
      drawScoreBadge(MARGIN + 125, y, candidate.match_score, '');
      drawVerdictBadge(MARGIN + 160, y + 1, candidate.verdict);
      
      y += 15;
    });

    addFooter(2, totalPages);

    // Pages 3+: Candidate Pages
    reportData.candidates.forEach((candidate, idx) => {
      addNewPage();
      addHeader(`Candidate: ${candidate.name}`);

      y = 40;

      // Candidate header
      doc.setFontSize(14);
      doc.setTextColor(26, 26, 26);
      doc.text(candidate.name, MARGIN, y);
      
      doc.setFontSize(11);
      doc.setTextColor(74, 85, 104);
      doc.text(`${candidate.title || 'N/A'} at ${candidate.company || 'N/A'}`, MARGIN, y + 8);
      doc.setFontSize(10);
      doc.text(candidate.location || 'Location N/A', MARGIN, y + 16);

      // Score badges
      drawScoreBadge(PAGE_WIDTH - MARGIN - 70, y, candidate.match_score);
      drawVerdictBadge(PAGE_WIDTH - MARGIN - 35, y + 1, candidate.verdict);

      y += 30;

      // Dimension scores
      doc.setFontSize(12);
      doc.setTextColor(26, 26, 26);
      doc.text('Match Dimensions', MARGIN, y);
      y += 8;

      const dims = candidate.dimensions || { experience: 0, skills: 0, fit: 0 };
      const dimWidth = 55;
      const startX = MARGIN;

      drawDimensionBox(startX, y, 'Experience', dims.experience || 0);
      drawDimensionBox(startX + dimWidth + 5, y, 'Skills', dims.skills || 0);
      drawDimensionBox(startX + dimWidth * 2 + 10, y, 'Fit', dims.fit || 0);

      y += 35;

      // Strengths
      doc.setFontSize(11);
      doc.setTextColor(26, 26, 26);
      doc.text('Key Strengths', MARGIN, y);
      y += 6;
      y = drawBulletList(MARGIN + 5, y, candidate.strengths || [], CONTENT_WIDTH / 2);
      y += 10;

      // Development Areas
      doc.setFontSize(11);
      doc.setTextColor(26, 26, 26);
      doc.text('Development Areas', MARGIN, y);
      y += 6;
      y = drawBulletList(MARGIN + 5, y, candidate.development_areas || [], CONTENT_WIDTH / 2);
      y += 10;

      // DISC Profile
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 20, 3, 3, 'F');
      doc.setFontSize(10);
      doc.setTextColor(74, 85, 104);
      doc.text('DISC Profile:', MARGIN + 5, y + 8);
      doc.setTextColor(26, 26, 26);
      doc.text(candidate.disc_profile || 'Not assessed', MARGIN + 40, y + 8);
      y += 25;

      // Recommendation
      doc.setFillColor(237, 242, 247);
      doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 25, 3, 3, 'F');
      doc.setDrawColor(138, 111, 58);
      doc.setLineWidth(1);
      doc.line(MARGIN, y, MARGIN, y + 25);

      doc.setFontSize(10);
      doc.setTextColor(74, 85, 104);
      doc.text('Recommendation', MARGIN + 8, y + 8);
      doc.setFontSize(11);
      doc.setTextColor(26, 26, 26);
      doc.text(candidate.recommendation || 'Proceed with interview', MARGIN + 8, y + 18);

      addFooter(3 + idx, totalPages);
    });

    // Appendix
    addNewPage();
    addHeader('Appendix: Full Candidate List');

    y = 40;

    // Table
    doc.setFillColor(248, 249, 250);
    doc.rect(MARGIN, y, CONTENT_WIDTH, 10, 'F');
    doc.setFontSize(9);
    doc.setTextColor(26, 26, 26);
    
    const colWidths = [10, 35, 40, 35, 25, 20, 20, 20, 15];
    const headers = ['#', 'Name', 'Title', 'Company', 'Location', 'Match', 'Exp', 'Skills', 'Fit'];
    
    headers.forEach((h, i) => {
      doc.text(h, MARGIN + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y + 7);
    });
    y += 12;

    reportData.candidates.forEach((candidate, i) => {
      if (y > PAGE_HEIGHT - 30) {
        addNewPage();
        addHeader('Appendix (continued)');
        y = 40;
      }

      doc.setFontSize(8);
      doc.setTextColor(74, 85, 104);
      
      const dims = candidate.dimensions || { experience: 0, skills: 0, fit: 0 };
      const row = [
        String(i + 1),
        candidate.name.substring(0, 20),
        (candidate.title || '').substring(0, 20),
        (candidate.company || '').substring(0, 18),
        (candidate.location || '').substring(0, 12),
        String(candidate.match_score),
        String(dims.experience || 0),
        String(dims.skills || 0),
        String(dims.fit || 0),
      ];

      row.forEach((val, j) => {
        doc.text(val, MARGIN + colWidths.slice(0, j).reduce((a, b) => a + b, 0), y + 5);
      });
      
      y += 8;
    });

    addFooter(totalPages, totalPages);
  }

  // ── T2: Candidate Profile ──
  if (reportType === 'T2') {
    const candidate = reportData.candidates[0];
    let y: number; // Declare y variable for T2 section

    // Page 1: Cover
    doc.setFillColor(248, 249, 250);
    doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
    
    doc.setFontSize(24);
    doc.setTextColor(26, 26, 26);
    doc.text(candidate?.name || 'Candidate Profile', PAGE_WIDTH / 2, 120, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(74, 85, 104);
    doc.text(candidate?.title || 'Title', PAGE_WIDTH / 2, 140, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(113, 128, 150);
    doc.text(candidate?.company || 'Company', PAGE_WIDTH / 2, 160, { align: 'center' });
    doc.text(`${reportData.mandate.title || 'Mandate'} | ${generatedDate}`, PAGE_WIDTH / 2, 180, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(138, 111, 58);
    doc.text('LYC Intelligence | LENS T2', PAGE_WIDTH / 2, 220, { align: 'center' });
    
    addFooter(1, totalPages);

    // Page 2: Profile Summary
    addNewPage();
    addHeader('Profile Summary');

    y = 40;

    // Profile header box
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 35, 4, 4, 'F');

    doc.setFontSize(16);
    doc.setTextColor(26, 26, 26);
    doc.text(candidate?.name || 'Name', MARGIN + 10, y + 12);
    
    doc.setFontSize(12);
    doc.setTextColor(74, 85, 104);
    doc.text(`${candidate?.title || 'Title'} at ${candidate?.company || 'Company'}`, MARGIN + 10, y + 20);
    doc.setFontSize(10);
    doc.text(`${candidate?.location || 'Location'} | ${candidate?.industry || 'Industry'}`, MARGIN + 10, y + 28);

    drawScoreBadge(PAGE_WIDTH - MARGIN - 70, y + 10, candidate?.match_score || 0);
    drawVerdictBadge(PAGE_WIDTH - MARGIN - 35, y + 11, candidate?.verdict || 'hold');

    y += 45;

    // Dimension scores
    doc.setFontSize(12);
    doc.setTextColor(26, 26, 26);
    doc.text('Match Dimensions', MARGIN, y);
    y += 8;

    const dims = candidate?.dimensions || { experience: 0, skills: 0, fit: 0 };
    drawDimensionBox(MARGIN, y, 'Experience', dims.experience || 0);
    drawDimensionBox(MARGIN + 55, y, 'Skills', dims.skills || 0);
    drawDimensionBox(MARGIN + 110, y, 'Fit', dims.fit || 0);

    y += 35;

    // Strengths & Development
    doc.setFontSize(11);
    doc.setTextColor(26, 26, 26);
    doc.text('Key Strengths', MARGIN, y);
    y += 6;
    y = drawBulletList(MARGIN + 5, y, candidate?.strengths || [], CONTENT_WIDTH / 2);
    y += 8;

    doc.text('Development Areas', MARGIN, y);
    y += 6;
    y = drawBulletList(MARGIN + 5, y, candidate?.development_areas || [], CONTENT_WIDTH / 2);

    addFooter(2, totalPages);

    // Page 3: Work History
    addNewPage();
    addHeader('Work History');

    y = 40;

    const workHistory = candidate?.work_history || [];
    workHistory.forEach((job: any, i: number) => {
      if (y > PAGE_HEIGHT - 60) {
        addNewPage();
        addHeader('Work History (continued)');
        y = 40;
      }

      doc.setFillColor(248, 249, 250);
      doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 30, 3, 3, 'F');

      doc.setFontSize(12);
      doc.setTextColor(26, 26, 26);
      doc.text(job.company || 'Company', MARGIN + 8, y + 10);
      
      doc.setFontSize(11);
      doc.setTextColor(74, 85, 104);
      doc.text(job.title || 'Title', MARGIN + 8, y + 18);
      
      doc.setFontSize(10);
      doc.text(`${job.start_date || ''} - ${job.end_date || 'Present'}`, MARGIN + 8, y + 26);

      y += 35;
    });

    addFooter(3, totalPages);

    // Page 4: Skills & DISC
    addNewPage();
    addHeader('Skills & DISC Profile');

    y = 40;

    // Skills Matrix
    doc.setFontSize(12);
    doc.setTextColor(26, 26, 26);
    doc.text('Skills Matrix', MARGIN, y);
    y += 8;

    const skills = candidate?.skills || [];
    skills.forEach((skill: any) => {
      if (y > PAGE_HEIGHT - 80) {
        addNewPage();
        addHeader('Skills (continued)');
        y = 40;
      }

      doc.setFillColor(248, 249, 250);
      doc.roundedRect(MARGIN, y, CONTENT_WIDTH / 2 - 5, 15, 2, 2, 'F');
      
      doc.setFontSize(10);
      doc.setTextColor(26, 26, 26);
      doc.text(skill.name || 'Skill', MARGIN + 5, y + 10);
      doc.setTextColor(74, 85, 104);
      doc.text(skill.level || 'Level', MARGIN + CONTENT_WIDTH / 2 - 30, y + 10);
      
      y += 18;
    });

    y += 10;

    // DISC Profile
    doc.setFontSize(12);
    doc.setTextColor(26, 26, 26);
    doc.text('DISC Profile', MARGIN, y);
    y += 8;

    doc.setFillColor(248, 249, 250);
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 40, 3, 3, 'F');

    const discScores = candidate?.disc_scores || { D: 0, I: 0, S: 0, C: 0 };
    const discLabels = ['D', 'I', 'S', 'C'];
    const discWidth = 40;

    discLabels.forEach((label, i) => {
      const discX = MARGIN + 20 + i * discWidth;
      
      doc.setFontSize(10);
      doc.setTextColor(26, 26, 26);
      doc.text(label, discX, y + 10);
      
      doc.setFontSize(14);
      doc.setTextColor(74, 85, 104);
      const discKey = label as keyof typeof discScores;
      doc.text(`${discScores[discKey] || 0}%`, discX, y + 22);
    });

    doc.setFontSize(10);
    doc.setTextColor(74, 85, 104);
    doc.text(candidate?.disc_summary || 'DISC profile summary', MARGIN + 10, y + 35);

    addFooter(4, totalPages);

    // Page 5: Recommendation
    addNewPage();
    addHeader('Recommendation');

    y = 40;

    doc.setFillColor(237, 242, 247);
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 50, 4, 4, 'F');
    doc.setDrawColor(138, 111, 58);
    doc.setLineWidth(2);
    doc.line(MARGIN, y, MARGIN, y + 50);

    doc.setFontSize(12);
    doc.setTextColor(74, 85, 104);
    doc.text('Overall Assessment', MARGIN + 10, y + 15);
    
    doc.setFontSize(14);
    doc.setTextColor(26, 26, 26);
    doc.text(candidate?.recommendation || 'Recommendation', MARGIN + 10, y + 30);

    addFooter(5, totalPages);
  }

  // ── T3: Match Scorecard ──
  if (reportType === 'T3') {
    let y: number; // Declare y variable for T3 section

    // Page 1: Cover
    doc.setFillColor(248, 249, 250);
    doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
    
    doc.setFontSize(24);
    doc.setTextColor(26, 26, 26);
    doc.text('Match Scorecard', PAGE_WIDTH / 2, 120, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(74, 85, 104);
    doc.text(reportData.mandate.title || 'Mandate', PAGE_WIDTH / 2, 140, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(113, 128, 150);
    doc.text(`Comparing ${reportData.candidates.length} Candidates`, PAGE_WIDTH / 2, 160, { align: 'center' });
    doc.text(`${reportData.mandate.client || 'Client'} | ${generatedDate}`, PAGE_WIDTH / 2, 180, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(138, 111, 58);
    doc.text('LYC Intelligence | LENS T3', PAGE_WIDTH / 2, 220, { align: 'center' });
    
    addFooter(1, totalPages);

    // Page 2: Comparison Summary
    addNewPage();
    addHeader('Comparison Summary');

    y = 40;

    // Summary stats
    const topScore = Math.max(...reportData.candidates.map(c => c.match_score));
    const avgScore = Math.round(
      reportData.candidates.reduce((sum, c) => sum + c.match_score, 0) / reportData.candidates.length
    );
    const proceedCount = reportData.candidates.filter(c => c.verdict === 'proceed').length;

    const stats = [
      { label: 'Candidates', value: String(reportData.candidates.length) },
      { label: 'Top Score', value: `${topScore}/100` },
      { label: 'Avg Score', value: `${avgScore}/100` },
      { label: 'Recommended', value: String(proceedCount) },
    ];

    stats.forEach((stat, i) => {
      const statX = MARGIN + i * 45;
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(statX, y, 40, 25, 3, 3, 'F');
      
      doc.setFontSize(9);
      doc.setTextColor(113, 128, 150);
      doc.text(stat.label, statX + 20, y + 10, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setTextColor(26, 26, 26);
      doc.text(stat.value, statX + 20, y + 20, { align: 'center' });
    });

    y += 35;

    // Comparison Table
    doc.setFontSize(12);
    doc.setTextColor(26, 26, 26);
    doc.text('Dimension Scores Comparison', MARGIN, y);
    y += 8;

    // Table header
    doc.setFillColor(248, 249, 250);
    doc.rect(MARGIN, y, CONTENT_WIDTH, 10, 'F');
    
    const colW = CONTENT_WIDTH / (reportData.candidates.length + 1);
    doc.setFontSize(10);
    doc.text('Dimension', MARGIN + 5, y + 7);
    
    reportData.candidates.forEach((c, i) => {
      doc.text(c.name.substring(0, 15), MARGIN + colW * (i + 1) + 5, y + 7);
    });
    y += 12;

    // Table rows
    const dimensions = ['Match Score', 'Experience', 'Skills', 'Fit', 'TRIDENT', 'Verdict'];
    
    dimensions.forEach(dim => {
      doc.setFillColor(248, 249, 250);
      doc.rect(MARGIN, y, colW, 10, 'F');
      
      doc.setFontSize(9);
      doc.setTextColor(26, 26, 26);
      doc.text(dim, MARGIN + 5, y + 7);

      reportData.candidates.forEach((c, i) => {
        const cellX = MARGIN + colW * (i + 1);
        
        if (dim === 'Match Score') {
          drawScoreBadge(cellX, y, c.match_score, '');
        } else if (dim === 'Verdict') {
          drawVerdictBadge(cellX + 5, y + 1, c.verdict);
        } else if (dim === 'TRIDENT') {
          doc.text(c.trident || 'N/A', cellX + 5, y + 7);
        } else {
          const dims = c.dimensions || { experience: 0, skills: 0, fit: 0 };
          const val = dims[dim.toLowerCase() as keyof typeof dims] || 0;
          doc.text(String(val), cellX + 5, y + 7);
        }
      });

      y += 12;
    });

    addFooter(2, totalPages);

    // Page 3: Strengths & Development
    addNewPage();
    addHeader('Strengths & Development Comparison');

    y = 40;

    // Strengths
    doc.setFontSize(12);
    doc.setTextColor(26, 26, 26);
    doc.text('Strengths Comparison', MARGIN, y);
    y += 8;

    reportData.candidates.forEach((c, i) => {
      const startX = MARGIN + i * (CONTENT_WIDTH / reportData.candidates.length);
      
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(startX, y, CONTENT_WIDTH / reportData.candidates.length - 5, 40, 3, 3, 'F');
      
      doc.setFontSize(10);
      doc.setTextColor(26, 26, 26);
      doc.text(c.name.substring(0, 15), startX + 5, y + 8);
      
      doc.setFontSize(8);
      doc.setTextColor(74, 85, 104);
      (c.strengths || []).slice(0, 3).forEach((s, j) => {
        doc.text(`• ${s.substring(0, 25)}`, startX + 5, y + 15 + j * 6);
      });
    });

    y += 50;

    // Development Areas
    doc.setFontSize(12);
    doc.setTextColor(26, 26, 26);
    doc.text('Development Areas Comparison', MARGIN, y);
    y += 8;

    reportData.candidates.forEach((c, i) => {
      const startX = MARGIN + i * (CONTENT_WIDTH / reportData.candidates.length);
      
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(startX, y, CONTENT_WIDTH / reportData.candidates.length - 5, 30, 3, 3, 'F');
      
      doc.setFontSize(10);
      doc.setTextColor(26, 26, 26);
      doc.text(c.name.substring(0, 15), startX + 5, y + 8);
      
      doc.setFontSize(8);
      doc.setTextColor(74, 85, 104);
      (c.development_areas || []).slice(0, 2).forEach((d, j) => {
        doc.text(`• ${d.substring(0, 25)}`, startX + 5, y + 15 + j * 6);
      });
    });

    addFooter(3, totalPages);

    // Page 4: Recommendations
    addNewPage();
    addHeader('Recommendations');

    y = 40;

    reportData.candidates.forEach((c, i) => {
      if (y > PAGE_HEIGHT - 60) {
        addNewPage();
        addHeader('Recommendations (continued)');
        y = 40;
      }

      doc.setFillColor(248, 249, 250);
      doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 35, 3, 3, 'F');
      doc.setDrawColor(138, 111, 58);
      doc.setLineWidth(1);
      doc.line(MARGIN, y, MARGIN, y + 35);

      doc.setFontSize(12);
      doc.setTextColor(26, 26, 26);
      doc.text(c.name, MARGIN + 10, y + 10);
      
      drawVerdictBadge(MARGIN + 100, y + 5, c.verdict);
      doc.setFontSize(10);
      doc.setTextColor(74, 85, 104);
      doc.text(`Match: ${c.match_score}/100`, MARGIN + 130, y + 12);
      
      doc.setFontSize(10);
      doc.text(c.recommendation?.substring(0, 60) || 'Proceed with interview', MARGIN + 10, y + 25);

      y += 40;
    });

    // Overall recommendation
    y += 10;
    doc.setFillColor(237, 242, 247);
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 30, 4, 4, 'F');
    doc.setDrawColor(138, 111, 58);
    doc.setLineWidth(2);
    doc.line(MARGIN, y, MARGIN, y + 30);

    doc.setFontSize(12);
    doc.setTextColor(74, 85, 104);
    doc.text('Overall Recommendation', MARGIN + 10, y + 10);
    
    doc.setFontSize(11);
    doc.setTextColor(26, 26, 26);
    doc.text(
      `Based on the comparison, ${reportData.candidates.find(c => c.verdict === 'proceed')?.name || 'top candidate'} is recommended for next steps.`,
      MARGIN + 10, y + 22
    );

    addFooter(4, totalPages);
  }

  // Generate PDF blob URL
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  
  return pdfUrl;
}

export function downloadLENSReport(pdfUrl: string, reportType: string, mandateTitle: string): void {
  const link = window.document.createElement('a');
  link.href = pdfUrl;
  link.download = `LENS_${reportType}_${mandateTitle?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
}