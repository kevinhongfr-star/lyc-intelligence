import React, { useState, useMemo, useCallback } from 'react';
import { Filter, Download, Grid3X3, List, Maximize2, X, ChevronDown, MapPin, Building2 } from 'lucide-react';
import type { TargetCompany, MarketMapFilters } from '@/types';
import { jsPDF } from 'jspdf';

interface Props {
  companies: TargetCompany[];
  mandateId: string;
  onCompanyClick?: (company: TargetCompany) => void;
}

const COLORS = {
  excellent: '#10B981', // emerald-500
  good: '#3B82F6',      // blue-500
  fair: '#F59E0B',      // amber-500
  low: '#F97316',       // orange-500
  poor: '#94A3B8',      // slate-400
};

function getBubbleColor(fitScore: number | null | undefined): string {
  if (!fitScore) return COLORS.poor;
  if (fitScore >= 80) return COLORS.excellent;
  if (fitScore >= 60) return COLORS.good;
  if (fitScore >= 40) return COLORS.fair;
  if (fitScore >= 20) return COLORS.low;
  return COLORS.poor;
}

function parseEmployeeCount(sizeStr: string | null | undefined): number {
  if (!sizeStr) return 500; // default size
  const match = sizeStr.match(/(\d+)(?:[,kK])?/);
  if (!match) return 500;
  let num = parseInt(match[1], 10);
  if (sizeStr.toLowerCase().includes('k')) num *= 1000;
  return Math.min(Math.max(num, 100), 50000);
}

interface BubbleData {
  company: TargetCompany;
  x: number;
  y: number;
  radius: number;
  color: string;
  label: string;
}

export function MarketMapVisualization({ companies, mandateId, onCompanyClick }: Props) {
  const [filters, setFilters] = useState<MarketMapFilters>({
    fitScoreMin: 0,
    fitScoreMax: 100,
    employeeCountMin: 0,
    employeeCountMax: 100000,
  });
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedGeographies, setSelectedGeographies] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [hoveredCompany, setHoveredCompany] = useState<TargetCompany | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Extract unique sectors and geographies from companies
  const allSectors = useMemo(() => {
    const sectors = new Set(companies.map(c => c.sector || c.industry || 'Other').filter(Boolean));
    return Array.from(sectors).sort();
  }, [companies]);

  const allGeographies = useMemo(() => {
    const geos = new Set(companies.map(c => c.region || extractRegion(c.location) || 'Other').filter(Boolean));
    return Array.from(geos).sort();
  }, [companies]);

  function extractRegion(location: string | null | undefined): string | null {
    if (!location) return null;
    const loc = location.toLowerCase();
    if (loc.includes('china') || loc.includes('beijing') || loc.includes('shanghai') || loc.includes('hong kong')) return 'Greater China';
    if (loc.includes('singapore') || loc.includes('jakarta') || loc.includes('bangkok') || loc.includes('malaysia')) return 'Southeast Asia';
    if (loc.includes('japan') || loc.includes('korea') || loc.includes('seoul') || loc.includes('tokyo')) return 'Japan & Korea';
    if (loc.includes('india') || loc.includes('mumbai') || loc.includes('delhi') || loc.includes('bangalore')) return 'India';
    if (loc.includes('uk') || loc.includes('london') || loc.includes('germany') || loc.includes('france') || loc.includes('europe')) return 'Europe';
    if (loc.includes('usa') || loc.includes('united states') || loc.includes('new york') || loc.includes('san francisco')) return 'Americas';
    return 'Other';
  }

  // Filter companies
  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      // Sector filter
      if (selectedSectors.length > 0) {
        const companySector = company.sector || company.industry || '';
        if (!selectedSectors.some(s => companySector.toLowerCase().includes(s.toLowerCase()))) {
          return false;
        }
      }

      // Geography filter
      if (selectedGeographies.length > 0) {
        const companyGeo = company.region || extractRegion(company.location) || '';
        if (!selectedGeographies.some(g => companyGeo.toLowerCase().includes(g.toLowerCase()))) {
          return false;
        }
      }

      // Fit score filter
      const fitScore = company.fit_score || 0;
      if (fitScore < (filters.fitScoreMin || 0) || fitScore > (filters.fitScoreMax || 100)) {
        return false;
      }

      // Employee count filter
      const empCount = parseEmployeeCount(company.size);
      if (empCount < (filters.employeeCountMin || 0) || empCount > (filters.employeeCountMax || 100000)) {
        return false;
      }

      return true;
    });
  }, [companies, selectedSectors, selectedGeographies, filters]);

  // Generate bubble positions for grid layout
  const bubbles = useMemo((): BubbleData[] => {
    if (viewMode !== 'grid') return [];

    const gridCols = Math.min(8, Math.ceil(Math.sqrt(filteredCompanies.length)));
    const gridRows = Math.ceil(filteredCompanies.length / gridCols);
    const cellWidth = 100 / gridCols;
    const cellHeight = 100 / gridRows;

    return filteredCompanies.map((company, index) => {
      const col = index % gridCols;
      const row = Math.floor(index / gridCols);
      const baseX = col * cellWidth + cellWidth / 2;
      const baseY = row * cellHeight + cellHeight / 2;
      const radius = Math.min(cellWidth, cellHeight) * 4;

      return {
        company,
        x: baseX,
        y: baseY,
        radius: Math.min(radius, 60),
        color: getBubbleColor(company.fit_score),
        label: company.name || '',
      };
    });
  }, [filteredCompanies, viewMode]);

  function handleFilterToggle(filter: string, type: 'sector' | 'geography') {
    if (type === 'sector') {
      setSelectedSectors(prev =>
        prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
      );
    } else {
      setSelectedGeographies(prev =>
        prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
      );
    }
  }

  function clearFilters() {
    setSelectedSectors([]);
    setSelectedGeographies([]);
    setFilters({
      fitScoreMin: 0,
      fitScoreMax: 100,
      employeeCountMin: 0,
      employeeCountMax: 100000,
    });
  }

  function handleMouseMove(e: React.MouseEvent, company: TargetCompany) {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setHoveredCompany(company);
  }

  async function handleExportPDF() {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Market Map Report', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()} | ${filteredCompanies.length} companies`, pageWidth / 2, 22, { align: 'center' });

    // Company list
    let y = 30;
    doc.setFontSize(9);

    // Table header
    doc.setFont('helvetica', 'bold');
    doc.text('Rank', 15, y);
    doc.text('Company', 30, y);
    doc.text('Industry', 100, y);
    doc.text('Location', 150, y);
    doc.text('Fit Score', 210, y);
    doc.text('Employees', 240, y);
    y += 5;

    doc.setFont('helvetica', 'normal');

    const sortedCompanies = [...filteredCompanies].sort((a, b) => (b.fit_score || 0) - (a.fit_score || 0));

    sortedCompanies.forEach((company, index) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }

      doc.text(`${index + 1}`, 15, y);
      doc.text(company.name?.substring(0, 40) || '', 30, y);
      doc.text(company.industry?.substring(0, 25) || '', 100, y);
      doc.text(company.location?.substring(0, 20) || '', 150, y);
      doc.text(`${company.fit_score || 0}`, 210, y);
      doc.text(company.size || '', 240, y);
      y += 5;
    });

    doc.save(`market-map-${mandateId.slice(0, 8)}.pdf`);
  }

  function handleExportCSV() {
    const headers = ['Rank', 'Company', 'Domain', 'Industry', 'Location', 'Fit Score', 'Size', 'Sector', 'Region'];
    const sortedCompanies = [...filteredCompanies].sort((a, b) => (b.fit_score || 0) - (a.fit_score || 0));

    const rows = sortedCompanies.map((company, index) => [
      index + 1,
      company.name || '',
      company.domain || '',
      company.industry || '',
      company.location || '',
      company.fit_score || 0,
      company.size || '',
      company.sector || company.industry || '',
      company.region || '',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `market-map-${mandateId.slice(0, 8)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const hasActiveFilters = selectedSectors.length > 0 || selectedGeographies.length > 0 || filters.fitScoreMin !== 0 || filters.fitScoreMax !== 100;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-accent text-white border-accent'
                : 'bg-bg-secondary text-text-primary border-border hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                {selectedSectors.length + selectedGeographies.length}
              </span>
            )}
          </button>

          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-accent text-white' : 'bg-bg-secondary text-text-muted hover:bg-slate-50'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-accent text-white' : 'bg-bg-secondary text-text-muted hover:bg-slate-50'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-text-muted hover:text-red-500"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted">
            {filteredCompanies.length} of {companies.length} companies
          </span>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-bg-secondary border border-border rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sector filter */}
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-accent" />
                Sectors
              </h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {allSectors.map(sector => (
                  <label key={sector} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={selectedSectors.includes(sector)}
                      onChange={() => handleFilterToggle(sector, 'sector')}
                      className="rounded border-border text-accent"
                    />
                    <span className="text-text-primary">{sector}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Geography filter */}
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent" />
                Geographies
              </h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {allGeographies.map(geo => (
                  <label key={geo} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={selectedGeographies.includes(geo)}
                      onChange={() => handleFilterToggle(geo, 'geography')}
                      className="rounded border-border text-accent"
                    />
                    <span className="text-text-primary">{geo}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Fit score range */}
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-2">Fit Score Range</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-text-muted mb-1">
                    <span>Min: {filters.fitScoreMin}</span>
                    <span>Max: {filters.fitScoreMax}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={filters.fitScoreMin || 0}
                    onChange={(e) => setFilters(f => ({ ...f, fitScoreMin: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={filters.fitScoreMax || 100}
                    onChange={(e) => setFilters(f => ({ ...f, fitScoreMax: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-text-muted">
        <span className="font-medium">Fit Score:</span>
        {[
          { label: 'Excellent (80+)', color: COLORS.excellent },
          { label: 'Good (60-79)', color: COLORS.good },
          { label: 'Fair (40-59)', color: COLORS.fair },
          { label: 'Low (20-39)', color: COLORS.low },
          { label: 'Poor (<20)', color: COLORS.poor },
        ].map(item => (
          <span key={item.label} className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </span>
        ))}
      </div>

      {/* Grid view */}
      {viewMode === 'grid' && (
        <div className="relative bg-slate-50 border border-border rounded-xl overflow-hidden" style={{ height: '500px' }}>
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#E2E8F0" strokeWidth="0.2" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />

            {/* Bubbles */}
            {bubbles.map((bubble, index) => (
              <g key={bubble.company.id}>
                <circle
                  cx={bubble.x}
                  cy={bubble.y}
                  r={bubble.radius}
                  fill={bubble.color}
                  fillOpacity={0.7}
                  stroke={bubble.color}
                  strokeWidth={0.5}
                  strokeOpacity={1}
                  className="cursor-pointer transition-all duration-200 hover:fill-opacity-100"
                  onClick={() => onCompanyClick?.(bubble.company)}
                  onMouseMove={(e) => handleMouseMove(e as any, bubble.company)}
                  onMouseLeave={() => setHoveredCompany(null)}
                />
                <text
                  x={bubble.x}
                  y={bubble.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={Math.max(2, bubble.radius / 4)}
                  fill="white"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {bubble.label.length > 10 ? bubble.label.slice(0, 8) + '...' : bubble.label}
                </text>
              </g>
            ))}
          </svg>

          {/* Tooltip */}
          {hoveredCompany && (
            <div
              className="absolute bg-white shadow-xl border border-border rounded-lg p-3 z-10 pointer-events-none min-w-[200px]"
              style={{
                left: tooltipPos.x + 10,
                top: tooltipPos.y + 10,
              }}
            >
              <p className="font-semibold text-text-primary text-sm">{hoveredCompany.name}</p>
              <p className="text-xs text-text-muted mt-0.5">{hoveredCompany.industry}</p>
              <p className="text-xs text-text-muted">{hoveredCompany.location}</p>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                <span className="text-xs text-text-muted">Fit Score:</span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: getBubbleColor(hoveredCompany.fit_score) + '20',
                    color: getBubbleColor(hoveredCompany.fit_score),
                  }}
                >
                  {hoveredCompany.fit_score || 0}
                </span>
              </div>
              {hoveredCompany.fit_score !== undefined && hoveredCompany.fit_score >= 80 && (
                <p className="text-xs text-emerald-600 mt-1">⭐ Top target</p>
              )}
            </div>
          )}

          {/* Empty state */}
          {bubbles.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Grid3X3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-text-primary font-medium">No companies match your filters</p>
                <button
                  onClick={clearFilters}
                  className="text-sm text-accent hover:underline mt-1"
                >
                  Clear filters
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* List view */}
      {viewMode === 'list' && (
        <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Sector</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Geography</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Fit Score</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {[...filteredCompanies].sort((a, b) => (b.fit_score || 0) - (a.fit_score || 0)).map((company) => (
                  <tr
                    key={company.id}
                    className="border-b border-border hover:bg-slate-50 cursor-pointer"
                    onClick={() => onCompanyClick?.(company)}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-text-primary">{company.name}</p>
                      {company.domain && (
                        <p className="text-xs text-accent">{company.domain}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary">{company.sector || company.industry || '—'}</td>
                    <td className="px-4 py-3 text-sm text-text-primary">{company.region || company.location || '—'}</td>
                    <td className="px-4 py-3 text-sm text-text-primary">{company.size || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-bold"
                        style={{
                          backgroundColor: getBubbleColor(company.fit_score) + '20',
                          color: getBubbleColor(company.fit_score),
                        }}
                      >
                        {company.fit_score || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        company.overview_status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : company.overview_status === 'generating'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {company.overview_status || 'pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
