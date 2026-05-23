import type { AssessmentType, AssessmentReport } from '@/types';
let jsPDFModule: typeof import('jspdf') | null = null;
async function loadJsPDF() { if (!jsPDFModule) jsPDFModule = await import('jspdf'); return jsPDFModule; }

export async function generatePDF(assessmentType: AssessmentType, result: { scores: Record<string, number>; archetype: string; percentile: Record<string, number>; }, report: AssessmentReport, userName?: string): Promise<void> {
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF.default({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth(); const margin = 20;
  let y = margin;
  doc.setFillColor(10, 10, 10); doc.rect(0, 0, pw, doc.internal.pageSize.getHeight(), 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(24);
  doc.text(report.title || 'Assessment Report', margin, y += 15);
  doc.setFontSize(12); doc.setTextColor(160, 160, 178);
  doc.text(userName ? `${userName} — ${assessmentType}` : assessmentType, margin, y += 10);
  y += 10;
  doc.setFillColor(193, 8, 171); doc.rect(margin, y, pw - margin * 2, 0.5, 'F'); y += 10;
  if (report.summary) { doc.setTextColor(255, 255, 255); doc.setFontSize(11); doc.text(report.summary, margin, y, { maxWidth: pw - margin * 2 }); y += 30; }
  if (result.archetype) { doc.setFontSize(14); doc.text(`Archetype: ${result.archetype}`, margin, y); y += 10; }
  const entries = Object.entries(result.scores);
  if (entries.length) { doc.setFontSize(11); for (const [key, val] of entries) { doc.text(`${key}: ${val}`, margin, y); y += 7; } }
  for (const section of report.sections || []) { y += 5; doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(193, 8, 171); doc.text(section.heading, margin, y); y += 7; doc.setFont('helvetica', 'normal'); doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.text(section.content, margin, y, { maxWidth: pw - margin * 2 }); y += 20; if (y > 260) { doc.addPage(); doc.setFillColor(10, 10, 10); doc.rect(0, 0, pw, doc.internal.pageSize.getHeight(), 'F'); y = margin; } }
  doc.save(`LYC_${assessmentType}_Report.pdf`);
}
