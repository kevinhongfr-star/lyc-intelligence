/**
 * services/reportGenerator.ts — legacy standalone jsPDF generator.
 *
 * #1379 brand compliance: all roundedRect calls converted to plain rect
 * (zero border radius). Accent is LYC fuchsia #C108AB (rgb 193,8,171).
 *
 * FONT LIMITATION: text is drawn with jsPDF's built-in Helvetica — the
 * ECHO brand fonts (System serif / DM Sans / IBM Plex Mono) cannot be
 * embedded without bundling font binaries as jsPDF payloads. The canonical
 * B2C assessment PDF path (pdfExport.ts → html2canvas of PdfReport.tsx)
 * renders the real brand fonts and is the source of truth for PDFs.
 *
 * NOTE: generatePDF() currently has no consumers (superseded by the
 * html2canvas pipeline). Kept for compliance; presentation-only changes.
 */
import type { AssessmentType, AssessmentReport } from '@/types';

declare global {
  // Shim: jsPDF may not be installed in all environments.
  const jsPDF: any;
  interface Window { jsPDF?: any; }
}

let jsPDFModule: any = null;
async function loadJsPDF() {
  if (jsPDFModule) return jsPDFModule;
  try {
    jsPDFModule = await import('jspdf' as any);
  } catch {
    jsPDFModule = { default: undefined };
  }
  return jsPDFModule;
}

export async function generatePDF(assessmentType: AssessmentType, result: { scores: Record<string, number>; archetype: string; percentile: Record<string, number>; }, report: AssessmentReport, userName?: string): Promise<void> {
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF.default({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth(); 
  const margin = 18;
  let y = margin;
  
  // Background
  doc.setFillColor(10, 10, 10); 
  doc.rect(0, 0, pw, doc.internal.pageSize.getHeight(), 'F');
  
  // Header section
  doc.setTextColor(255, 255, 255); 
  doc.setFont('helvetica', 'bold'); 
  doc.setFontSize(22);
  doc.text('LYC Intelligence', margin, y + 10);
  
  doc.setFontSize(10); 
  doc.setTextColor(136, 136, 136);
  doc.text('Building Leadership That Works Across Borders', margin, y + 17);
  y += 25;
  
  // Accent line
  doc.setFillColor(193, 8, 171); 
  doc.rect(margin, y, pw - margin * 2, 1, 'F'); 
  y += 15;
  
  // Report title
  doc.setFontSize(20); 
  doc.setTextColor(255, 255, 255); 
  doc.setFont('helvetica', 'bold');
  doc.text(report.title || 'Assessment Report', margin, y);
  y += 8;
  
  // Subtitle (username/type)
  doc.setFontSize(12); 
  doc.setTextColor(180, 180, 180); 
  doc.setFont('helvetica', 'normal');
  doc.text(userName ? `${userName} • ${assessmentType}` : assessmentType, margin, y);
  y += 20;
  
  // Archetype highlight (if present)
  if (result.archetype) { 
    doc.setFillColor(25, 25, 25);
    doc.rect(margin, y, pw - margin * 2, 20, 'F');
    doc.setTextColor(255, 255, 255); 
    doc.setFontSize(13); 
    doc.setFont('helvetica', 'bold');
    doc.text(`Your Leadership Profile: ${result.archetype}`, margin + 10, y + 12);
    y += 30; 
  }
  
  // Summary
  if (report.summary) { 
    doc.setTextColor(220, 220, 220); 
    doc.setFontSize(11); 
    doc.setFont('helvetica', 'normal');
    const summaryLines = doc.splitTextToSize(report.summary, pw - margin * 2);
    doc.text(summaryLines, margin, y);
    y += summaryLines.length * 6 + 10; 
  }
  
  // Scores
  const entries = Object.entries(result.scores);
  if (entries.length) { 
    doc.setFontSize(14); 
    doc.setFont('helvetica', 'bold'); 
    doc.setTextColor(193, 8, 171); 
    doc.text('Dimension Scores', margin, y);
    y += 10;
    
    doc.setFontSize(11); 
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    
    for (const [key, val] of entries) {
      // Draw score bar background
      doc.setFillColor(30, 30, 30);
      doc.rect(margin + 50, y - 4, 100, 5, 'F');
      
      // Draw score fill
      const fillWidth = Math.min(100, (val / 100) * 100);
      doc.setFillColor(193, 8, 171);
      doc.rect(margin + 50, y - 4, fillWidth, 5, 'F');
      
      doc.text(key, margin, y);
      doc.setTextColor(220, 220, 220);
      doc.text(`${Math.round(val)}`, margin + 155, y);
      doc.setTextColor(255, 255, 255);
      y += 10; 
    } 
    y += 10;
  }
  
  // Sections
  for (const section of report.sections || []) { 
    doc.setFontSize(13); 
    doc.setFont('helvetica', 'bold'); 
    doc.setTextColor(193, 8, 171); 
    doc.text(section.heading, margin, y); 
    y += 7; 
    
    doc.setFont('helvetica', 'normal'); 
    doc.setTextColor(220, 220, 220); 
    doc.setFontSize(10); 
    const sectionLines = doc.splitTextToSize(section.content, pw - margin * 2);
    doc.text(sectionLines, margin, y); 
    y += sectionLines.length * 6 + 10; 
    
    if (y > 260) { 
      doc.addPage(); 
      doc.setFillColor(10, 10, 10); 
      doc.rect(0, 0, pw, doc.internal.pageSize.getHeight(), 'F'); 
      y = margin + 20; 
    } 
  }
  
  // Footer
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('©' + new Date().getFullYear() + 'LYC Partners • Confidential', margin, 290);
  
  doc.save(`LYC_${assessmentType}_Report.pdf`);
}
