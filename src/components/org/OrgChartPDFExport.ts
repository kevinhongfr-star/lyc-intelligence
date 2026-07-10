// jsPDF loaded dynamically to reduce bundle size
import type { Mandate, TargetCompany, OrgChartData } from '@/services/supabaseApi';

interface PDFExportParams {
  mandate: Mandate | null;
  companies: TargetCompany[];
  orgCharts: Record<string, OrgChartData>;
  insights: {
    totalCompanies: number;
    topSectors: string[];
    topGeographies: string[];
    highestDensity: { sector: string; geo: string; score: number };
    lowestDensity: { sector: string; geo: string; score: number };
    companiesWithCharts: number;
    highRelevancePositions: number;
  } | null;
}

const PAGE_WIDTH = 210; // A4 width in mm
const PAGE_HEIGHT = 297; // A4 height in mm
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

const getDensityColor = (score: number): string => {
  if (score >= 80) return '#166534';
  if (score >= 60) return '#22C55E';
  if (score >= 40) return '#EAB308';
  if (score >= 20) return '#F97316';
  return '#EF4444';
};

const getRelevanceColor = (relevance: number): string => {
  if (relevance >= 4) return '#22C55E';
  if (relevance === 3) return '#EAB308';
  return '#9CA3AF';
};

export async function generateOrgChartPDF(params: PDFExportParams): Promise<void> {
  const { mandate, companies, orgCharts, insights } = params;
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();

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
    doc.text(`LYC Intelligence — Talent Mapping Report`, PAGE_WIDTH - MARGIN, 18, { align: 'right' });
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

  // Helper to draw org chart node
  const drawOrgNode = (
    x: number,
    y: number,
    width: number,
    height: number,
    name: string,
    title: string,
    relevance: number
  ) => {
    // Node background
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(x, y, width, height, 3, 3, 'FD');

    // Relevance indicator
    const indicatorColor = getRelevanceColor(relevance);
    doc.setFillColor(indicatorColor);
    doc.circle(x + width - 8, y + 8, 4, 'F');

    // Name
    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55);
    doc.text(name.substring(0, 20), x + 5, y + 12);

    // Title
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(title.substring(0, 25), x + 5, y + 20);
  };

  // Helper to draw connection line
  const drawConnection = (x1: number, y1: number, x2: number, y2: number) => {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(x1, y1, x2, y2);
  };

  // Calculate total pages
  const totalPages = 5;

  // ── Page 1: Mandate Overview ──
  addHeader('Talent Landscape Overview');

  let y = 40;

  // Mandate info
  doc.setFontSize(14);
  doc.setTextColor(31, 41, 55);
  doc.text(`Mandate: ${mandate?.title || 'Untitled'}`, MARGIN, y);
  y += 10;

  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(`Status: ${mandate?.status || 'Active'}`, MARGIN, y);
  y += 8;
  doc.text(`Client: ${mandate?.client_first_name || 'N/A'}`, MARGIN, y);
  y += 15;

  // Target sectors/geographies
  doc.setFontSize(12);
  doc.setTextColor(31, 41, 55);
  doc.text('Target Sectors', MARGIN, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  if (insights?.topSectors?.length) {
    insights.topSectors.forEach((sector, i) => {
      doc.text(`• ${sector}`, MARGIN + 5, y + i * 6);
    });
    y += insights.topSectors.length * 6 + 10;
  }

  doc.setFontSize(12);
  doc.setTextColor(31, 41, 55);
  doc.text('Target Geographies', MARGIN, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  if (insights?.topGeographies?.length) {
    insights.topGeographies.forEach((geo, i) => {
      doc.text(`• ${geo}`, MARGIN + 5, y + i * 6);
    });
    y += insights.topGeographies.length * 6 + 15;
  }

  // Summary stats
  doc.setFillColor(243, 244, 246);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 40, 'F');

  doc.setFontSize(10);
  doc.setTextColor(31, 41, 55);
  doc.text('Summary Statistics', MARGIN + 5, y + 10);

  const stats = [
    { label: 'Total Companies', value: String(insights?.totalCompanies || 0) },
    { label: 'Org Charts Mapped', value: String(insights?.companiesWithCharts || 0) },
    { label: 'High Relevance Positions', value: String(insights?.highRelevancePositions || 0) },
  ];

  stats.forEach((stat, i) => {
    const statX = MARGIN + 5 + i * 60;
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(stat.label, statX, y + 20);
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);
    doc.text(stat.value, statX, y + 30);
  });

  addFooter(1, totalPages);

  // ── Pages 2-3: Org Charts ──
  const companiesWithCharts = companies.filter(c => 
    c.org_chart && (c.org_chart as OrgChartData).nodes?.length > 0
  ).slice(0, 3);

  let pageNum = 2;
  companiesWithCharts.forEach((company, companyIndex) => {
    if (companyIndex > 0) addNewPage();

    addHeader(`Org Chart: ${company.name}`);

    y = 40;

    // Company info
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`${company.industry || 'Industry'} • ${company.location || 'Location'}`, MARGIN, y);
    y += 6;
    doc.text(`Talent Density: ${company.talent_density_score || 'N/A'}/100`, MARGIN, y);
    y += 15;

    // Org chart
    const chart = company.org_chart as OrgChartData;
    const nodes = chart?.nodes || [];

    if (nodes.length > 0) {
      // Simple hierarchical layout
      const NODE_WIDTH = 40;
      const NODE_HEIGHT = 20;
      const H_GAP = 10;
      const V_GAP = 15;

      // Get root nodes
      const rootNodes = nodes.filter(n => !n.reports_to);

      // Draw tree
      const drawTree = (parentId: string | null, startX: number, startY: number, depth: number): number => {
        const children = nodes.filter(n => n.reports_to === parentId);
        if (children.length === 0) return startX;

        let currentX = startX;
        children.forEach(node => {
          drawOrgNode(
            currentX,
            startY,
            NODE_WIDTH,
            NODE_HEIGHT,
            node.name || 'Unnamed',
            node.title || '',
            node.talent_relevance || 3
          );

          // Draw children
          if (depth < 3) { // Limit depth for PDF
            const childY = startY + NODE_HEIGHT + V_GAP;
            drawConnection(currentX + NODE_WIDTH / 2, startY + NODE_HEIGHT, currentX + NODE_WIDTH / 2, childY);
            drawTree(node.id, currentX, childY, depth + 1);
          }

          currentX += NODE_WIDTH + H_GAP;
        });

        return currentX;
      };

      drawTree(null, MARGIN, y, 0);
    } else {
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text('No org chart data available', MARGIN, y + 20);
    }

    // Legend
    y = PAGE_HEIGHT - 40;
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text('Relevance Legend:', MARGIN, y);
    
    const legendItems = [
      { color: '#22C55E', label: 'High (4-5)' },
      { color: '#EAB308', label: 'Moderate (3)' },
      { color: '#9CA3AF', label: 'Low (1-2)' },
    ];

    legendItems.forEach((item, i) => {
      const legendX = MARGIN + 60 + i * 40;
      doc.setFillColor(item.color);
      doc.circle(legendX, y - 2, 3, 'F');
      doc.setTextColor(107, 114, 128);
      doc.text(item.label, legendX + 6, y);
    });

    addFooter(pageNum, totalPages);
    pageNum++;
  });

  // ── Page 4: Talent Density Heatmap ──
  if (pageNum < 4) {
    while (pageNum < 4) {
      addNewPage();
      pageNum++;
    }
  } else {
    addNewPage();
  }

  addHeader('Talent Density Heatmap');

  y = 40;

  // Heatmap grid
  const sectors = ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Consumer'];
  const geographies = ['North America', 'Europe', 'APAC', 'Latin America'];

  const CELL_WIDTH = 30;
  const CELL_HEIGHT = 15;

  // Headers
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  geographies.forEach((geo, i) => {
    doc.text(geo.substring(0, 10), MARGIN + 40 + i * CELL_WIDTH, y);
  });
  y += 8;

  // Rows
  sectors.forEach(sector => {
    doc.setFontSize(8);
    doc.setTextColor(31, 41, 55);
    doc.text(sector.substring(0, 12), MARGIN, y + 5);

    geographies.forEach((geo, i) => {
      // Find companies in this sector/geo
      const sectorCompanies = companies.filter(c => {
        const cSector = c.sector || c.industry || '';
        const cGeo = c.region || '';
        return cSector.toLowerCase().includes(sector.toLowerCase()) &&
               cGeo.toLowerCase().includes(geo.toLowerCase());
      });

      const avgDensity = sectorCompanies.length > 0
        ? Math.round(sectorCompanies.reduce((sum, c) => sum + (c.talent_density_score || 50), 0) / sectorCompanies.length)
        : 0;

      const cellX = MARGIN + 40 + i * CELL_WIDTH;
      const cellColor = getDensityColor(avgDensity);

      doc.setFillColor(avgDensity > 0 ? cellColor : '#F3F4F6');
      doc.rect(cellX, y, CELL_WIDTH - 2, CELL_HEIGHT - 2, 'F');

      if (avgDensity > 0) {
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text(String(avgDensity), cellX + CELL_WIDTH / 2 - 4, y + 6);
        doc.setFontSize(6);
        doc.text(String(sectorCompanies.length), cellX + CELL_WIDTH / 2 - 2, y + 10);
      } else {
        doc.setTextColor(128, 128, 128);
        doc.setFontSize(6);
        doc.text('—', cellX + CELL_WIDTH / 2 - 1, y + 6);
      }
    });

    y += CELL_HEIGHT;
  });

  // Legend
  y += 10;
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('Density Legend:', MARGIN, y);

  const densityLegend = [
    { color: '#166534', label: 'Very Dense (80+)' },
    { color: '#22C55E', label: 'Dense (60-79)' },
    { color: '#EAB308', label: 'Moderate (40-59)' },
    { color: '#F97316', label: 'Sparse (20-39)' },
    { color: '#EF4444', label: 'Very Sparse (0-19)' },
  ];

  densityLegend.forEach((item, i) => {
    const legendX = MARGIN + 50 + i * 35;
    doc.setFillColor(item.color);
    doc.rect(legendX, y - 4, 8, 8, 'F');
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(6);
    doc.text(item.label.substring(0, 12), legendX + 10, y);
  });

  addFooter(4, totalPages);

  // ── Page 5: Key Insights & Recommendations ──
  addNewPage();
  addHeader('Key Insights & Recommendations');

  y = 40;

  // Key insights
  doc.setFontSize(12);
  doc.setTextColor(31, 41, 55);
  doc.text('Key Insights', MARGIN, y);
  y += 10;

  const insightsList = [
    `Highest talent density in ${insights?.highestDensity?.sector || 'Technology'}/${insights?.highestDensity?.geo || 'APAC'} (${insights?.highestDensity?.score || 0}/100)`,
    `${insights?.companiesWithCharts || 0} companies with mapped org charts`,
    `${insights?.highRelevancePositions || 0} high-relevance positions identified`,
    `Focus sectors: ${insights?.topSectors?.join(', ') || 'Technology, Finance'}`,
  ];

  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  insightsList.forEach((insight, i) => {
    doc.text(`• ${insight}`, MARGIN + 5, y + i * 8);
  });
  y += insightsList.length * 8 + 15;

  // Recommendations
  doc.setFontSize(12);
  doc.setTextColor(31, 41, 55);
  doc.text('Recommendations', MARGIN, y);
  y += 10;

  const recommendations = [
    `Focus sourcing on ${insights?.highestDensity?.geo || 'APAC'} ${insights?.highestDensity?.sector || 'technology'} companies`,
    'Target positions with relevance 4-5 in mapped org charts',
    `Expand coverage in ${insights?.lowestDensity?.geo || 'underrepresented'} regions`,
    'Prioritize companies with highest talent density scores',
    'Build relationships with key leadership positions identified',
  ];

  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  recommendations.forEach((rec, i) => {
    doc.text(`${i + 1}. ${rec}`, MARGIN + 5, y + i * 8);
  });
  y += recommendations.length * 8 + 20;

  // Footer note
  doc.setFillColor(243, 244, 246);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 25, 'F');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text('This report was generated by LYC Intelligence Talent Mapping System.', MARGIN + 5, y + 10);
  doc.text('For questions or updates, contact your LYC consultant.', MARGIN + 5, y + 18);

  addFooter(5, totalPages);

  // Save PDF
  const fileName = `Talent_Landscape_${mandate?.title?.replace(/\s+/g, '_') || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}