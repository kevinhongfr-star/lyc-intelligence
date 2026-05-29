import type { AssessmentType, AssessmentReport } from '@/types';
let jsPDFModule: typeof import('jspdf') | null = null;
async function loadJsPDF() { if (!jsPDFModule) jsPDFModule = await import('jspdf'); return jsPDFModule; }

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
  doc.text('Know where you stand. Know where to go.', margin, y + 17);
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
    doc.roundedRect(margin, y, pw - margin * 2, 20, 4, 4, 'F');
    doc.setTextColor(255, 255, 255); 
    doc.setFontSize(13); 
    doc.setFont('helvetica', 'bold');
    doc.text(`Your Archetype: ${result.archetype}`, margin + 10, y + 12);
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
      doc.roundedRect(margin + 50, y - 4, 100, 5, 2, 2, 'F');
      
      // Draw score fill
      const fillWidth = Math.min(100, (val / 100) * 100);
      doc.setFillColor(193, 8, 171);
      doc.roundedRect(margin + 50, y - 4, fillWidth, 5, 2, 2, 'F');
      
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
  doc.text('© ' + new Date().getFullYear() + ' LYC Partners • Confidential', margin, 290);
  
  doc.save(`LYC_${assessmentType}_Report.pdf`);
}
