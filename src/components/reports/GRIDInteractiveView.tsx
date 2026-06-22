import React, { useState, useMemo, useCallback } from 'react';
import {
  Building2, MapPin, ChevronRight, ChevronDown, ChevronUp, 
  Download, Filter, X, BarChart3, Users, TrendingUp, Search,
  SortAsc, SortDesc, Loader2, AlertCircle, FileText, Eye
} from 'lucide-react';
import { Badge, Button, Input } from '@/components/ui';
import { OrgChartVisualization } from '@/components/org/OrgChartVisualization';
import { TalentDensityHeatmap } from '@/components/org/TalentDensityHeatmap';
import type { TargetCompany, OrgChartData, Mandate } from '@/services/supabaseApi';
import { generateGRIDReport } from '@/services/supabaseApi';

interface GRIDInteractiveViewProps {
  mandateId: string;
  mandate: Mandate;
  companies: TargetCompany[];
  loading?: boolean;
}

type ViewMode = 'table' | 'heatmap' | 'orgchart';
type SortField = 'name' | 'sector' | 'location' | 'talent_density_score' | 'fit_score' | 'evaluation_count';
type SortDirection = 'asc' | 'desc';

interface ExpandedCompany {
  id: string;
  section: 'orgchart' | 'talentpool' | 'evaluations';
}

export function GRIDInteractiveView({
  mandateId,
  mandate,
  companies,
  loading = false,
}: GRIDInteractiveViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [expandedCompanies, setExpandedCompanies] = useState<ExpandedCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<TargetCompany | null>(null);
  const [filters, setFilters] = useState({
    sector: '',
    location: '',
    minDensity: 0,
    maxDensity: 100,
    minFit: 0,
    maxFit: 100,
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>('fit_score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Get unique sectors and locations
  const sectors = useMemo(() => {
    const set = new Set<string>();
    companies.forEach(c => {
      if (c.sector) set.add(c.sector);
      if (c.industry) set.add(c.industry);
    });
    return Array.from(set).sort();
  }, [companies]);

  const locations = useMemo(() => {
    const set = new Set<string>();
    companies.forEach(c => {
      if (c.location) set.add(c.location);
      if (c.region) set.add(c.region);
    });
    return Array.from(set).sort();
  }, [companies]);

  // Filter and sort companies
  const filteredCompanies = useMemo(() => {
    let result = companies.filter(company => {
      if (filters.sector && company.sector !== filters.sector && company.industry !== filters.sector) return false;
      if (filters.location && company.location !== filters.location && company.region !== filters.location) return false;
      const density = company.talent_density_score ?? 50;
      if (density < filters.minDensity || density > filters.maxDensity) return false;
      const fit = company.fit_score ?? 50;
      if (fit < filters.minFit || fit > filters.maxFit) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!company.name.toLowerCase().includes(searchLower) &&
            !(company.industry?.toLowerCase().includes(searchLower)) &&
            !(company.location?.toLowerCase().includes(searchLower))) {
          return false;
        }
      }
      return true;
    });

    // Sort
    result.sort((a, b) => {
      const sortKey = sortField as keyof TargetCompany;
      const aValue = a[sortKey] ?? 0;
      const bValue = b[sortKey] ?? 0;
      const comparison = typeof aValue === 'string' 
        ? aValue.localeCompare(bValue as string)
        : (aValue as number) - (bValue as number);
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [companies, filters, sortField, sortDirection]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalCompanies = filteredCompanies.length;
    const avgDensity = totalCompanies > 0
      ? Math.round(filteredCompanies.reduce((sum, c) => sum + (c.talent_density_score ?? 50), 0) / totalCompanies)
      : 0;
    const avgFit = totalCompanies > 0
      ? Math.round(filteredCompanies.reduce((sum, c) => sum + (c.fit_score ?? 50), 0) / totalCompanies)
      : 0;
    const companiesWithCharts = filteredCompanies.filter(c => 
      c.org_chart && (c.org_chart as OrgChartData)?.nodes?.length > 0
    ).length;
    const totalEvaluations = filteredCompanies.reduce((sum, c) => sum + (c.key_talent_count ?? 0), 0);

    return {
      totalCompanies,
      avgDensity,
      avgFit,
      companiesWithCharts,
      totalEvaluations,
    };
  }, [filteredCompanies]);

  // Toggle company expansion
  const toggleExpand = (companyId: string, section: 'orgchart' | 'talentpool' | 'evaluations') => {
    setExpandedCompanies(prev => {
      const existing = prev.find(e => e.id === companyId && e.section === section);
      if (existing) {
        return prev.filter(e => e.id !== companyId || e.section !== section);
      }
      return [...prev.filter(e => e.id !== companyId), { id: companyId, section }];
    });
  };

  // Check if company section is expanded
  const isExpanded = (companyId: string, section: 'orgchart' | 'talentpool' | 'evaluations') => {
    return expandedCompanies.some(e => e.id === companyId && e.section === section);
  };

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      sector: '',
      location: '',
      minDensity: 0,
      maxDensity: 100,
      minFit: 0,
      maxFit: 100,
      search: '',
    });
    setExpandedCompanies([]);
    setSelectedCompany(null);
  };

  // Generate GRID PDF
  const handleGeneratePDF = async () => {
    setGeneratingPDF(true);
    try {
      const result = await generateGRIDReport(mandateId);
      if (result?.pdf_url) {
        // Download PDF
        const link = window.document.createElement('a');
        link.href = result.pdf_url;
        link.download = `GRID_${mandate.title?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Generate GRID PDF error:', err);
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Render sort indicator
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' 
      ? <SortAsc className="w-4 h-4 text-accent" />
      : <SortDesc className="w-4 h-4 text-accent" />;
  };

  // Render company row
  const CompanyRow = ({ company }: { company: TargetCompany }) => {
    const orgChart = company.org_chart as OrgChartData | null;
    const hasOrgChart = orgChart?.nodes && orgChart.nodes.length > 0;
    const isSelected = selectedCompany?.id === company.id;

    return (
      <div className="border-b border-border">
        {/* Main row */}
        <div 
          className={`grid grid-cols-12 gap-2 p-3 items-center cursor-pointer transition-all ${
            isSelected ? 'bg-accent/5' : 'hover:bg-bg-alt'
          }`}
          onClick={() => setSelectedCompany(company)}
        >
          {/* Company name */}
          <div className="col-span-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-text-muted" />
            <div>
              <div className="font-medium text-text-primary">{company.name}</div>
              <div className="text-xs text-text-muted">{company.industry || 'Industry'}</div>
            </div>
          </div>

          {/* Sector */}
          <div className="col-span-2 text-sm text-text-muted">
            {company.sector || company.industry || 'N/A'}
          </div>

          {/* Location */}
          <div className="col-span-2 text-sm text-text-muted">
            <MapPin className="w-3 h-3 inline mr-1" />
            {company.location || company.region || 'N/A'}
          </div>

          {/* Size */}
          <div className="col-span-1 text-sm text-text-muted">
            {company.size || 'N/A'}
          </div>

          {/* Talent Density */}
          <div className="col-span-1 text-center">
            <Badge variant={(company.talent_density_score ?? 50) >= 60 ? 'success' : 'default'}>
              {company.talent_density_score ?? 'N/A'}
            </Badge>
          </div>

          {/* Fit Score */}
          <div className="col-span-1 text-center">
            <Badge variant={(company.fit_score ?? 50) >= 80 ? 'success' : (company.fit_score ?? 50) >= 60 ? 'warning' : 'default'}>
              {company.fit_score ?? 'N/A'}
            </Badge>
          </div>

          {/* Evaluations */}
          <div className="col-span-1 text-center text-sm text-text-muted">
            {company.key_talent_count ?? 0}
          </div>

          {/* Actions */}
          <div className="col-span-1 flex items-center justify-end gap-1">
            {hasOrgChart && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(company.id, 'orgchart');
                }}
                className="p-1 hover:bg-bg-alt rounded text-text-muted hover:text-accent"
              >
                <Users className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(company.id, 'talentpool');
              }}
              className="p-1 hover:bg-bg-alt rounded text-text-muted hover:text-accent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded sections */}
        {isExpanded(company.id, 'orgchart') && hasOrgChart && (
          <div className="p-4 bg-bg-alt border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-text-primary">Org Chart</h4>
              <button
                onClick={() => toggleExpand(company.id, 'orgchart')}
                className="p-1 hover:bg-bg rounded"
              >
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>
            <OrgChartVisualization
              nodes={orgChart!.nodes}
              onNodeClick={(node) => console.log('Node clicked:', node)}
            />
          </div>
        )}

        {isExpanded(company.id, 'talentpool') && (
          <div className="p-4 bg-bg-alt border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-text-primary">Talent Pool</h4>
              <button
                onClick={() => toggleExpand(company.id, 'talentpool')}
                className="p-1 hover:bg-bg rounded"
              >
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>
            <div className="text-sm text-text-muted">
              {company.key_talent_count ?? 0} key talents identified
            </div>
            {/* Placeholder for talent pool details */}
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-bg rounded-lg p-3 border border-border">
                  <div className="text-xs text-text-muted">Position {i}</div>
                  <div className="text-sm text-text-primary mt-1">Talent details</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-card-border p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <span className="ml-3 text-text-muted">Loading GRID data...</span>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-card-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-text-primary">
            GRID Market Map
          </h3>
          <Badge variant="default">
            {summaryStats.totalCompanies} companies
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex bg-bg-alt rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-accent text-white'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'heatmap'
                  ? 'bg-accent text-white'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Heatmap
            </button>
            <button
              onClick={() => setViewMode('orgchart')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'orgchart'
                  ? 'bg-accent text-white'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Org Charts
            </button>
          </div>

          {/* Filters toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-1" />
            Filters
            {(filters.sector || filters.location || filters.search || 
              filters.minDensity > 0 || filters.maxDensity < 100 ||
              filters.minFit > 0 || filters.maxFit < 100) && (
              <Badge variant="default" className="ml-2">Active</Badge>
            )}
          </Button>

          {/* PDF export */}
          <Button
            onClick={handleGeneratePDF}
            disabled={generatingPDF}
          >
            {generatingPDF ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-1" />
            )}
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="p-4 bg-bg-alt border-b border-border">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Search
              </label>
              <Input
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search companies..."
                className="w-full"
              />
            </div>

            {/* Sector */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Sector
              </label>
              <select
                value={filters.sector}
                onChange={(e) => setFilters(prev => ({ ...prev, sector: e.target.value }))}
                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-text-primary"
              >
                <option value="">All Sectors</option>
                {sectors.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Location
              </label>
              <select
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-text-primary"
              >
                <option value="">All Locations</option>
                {locations.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* Density range */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Density Range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={filters.minDensity}
                  onChange={(e) => setFilters(prev => ({ ...prev, minDensity: parseInt(e.target.value) || 0 }))}
                  className="w-16 px-2 py-1 bg-bg border border-border rounded-lg text-sm"
                />
                <span className="text-text-muted">-</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={filters.maxDensity}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxDensity: parseInt(e.target.value) || 100 }))}
                  className="w-16 px-2 py-1 bg-bg border border-border rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Fit range */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Fit Range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={filters.minFit}
                  onChange={(e) => setFilters(prev => ({ ...prev, minFit: parseInt(e.target.value) || 0 }))}
                  className="w-16 px-2 py-1 bg-bg border border-border rounded-lg text-sm"
                />
                <span className="text-text-muted">-</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={filters.maxFit}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxFit: parseInt(e.target.value) || 100 }))}
                  className="w-16 px-2 py-1 bg-bg border border-border rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Clear filters */}
          {(filters.sector || filters.location || filters.search || 
            filters.minDensity > 0 || filters.maxDensity < 100 ||
            filters.minFit > 0 || filters.maxFit < 100) && (
            <button
              onClick={clearFilters}
              className="mt-4 text-sm text-accent hover:text-accent-hover flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-5 gap-4 p-4 bg-bg-alt border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Building2 className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="text-sm text-text-muted">Companies</div>
            <div className="font-medium text-text-primary">{summaryStats.totalCompanies}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10">
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <div className="text-sm text-text-muted">Avg Density</div>
            <div className="font-medium text-text-primary">{summaryStats.avgDensity}/100</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <BarChart3 className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <div className="text-sm text-text-muted">Avg Fit</div>
            <div className="font-medium text-text-primary">{summaryStats.avgFit}/100</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <div className="text-sm text-text-muted">Org Charts</div>
            <div className="font-medium text-text-primary">{summaryStats.companiesWithCharts}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Eye className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <div className="text-sm text-text-muted">Evaluations</div>
            <div className="font-medium text-text-primary">{summaryStats.totalEvaluations}</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-hidden">
        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 p-3 bg-bg-alt border-b border-border text-sm font-medium text-text-muted">
              <div 
                className="col-span-3 flex items-center gap-1 cursor-pointer hover:text-text-primary"
                onClick={() => handleSort('name')}
              >
                Company <SortIndicator field="name" />
              </div>
              <div 
                className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-text-primary"
                onClick={() => handleSort('sector')}
              >
                Sector <SortIndicator field="sector" />
              </div>
              <div 
                className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-text-primary"
                onClick={() => handleSort('location')}
              >
                Location <SortIndicator field="location" />
              </div>
              <div className="col-span-1">Size</div>
              <div 
                className="col-span-1 text-center flex items-center justify-center gap-1 cursor-pointer hover:text-text-primary"
                onClick={() => handleSort('talent_density_score')}
              >
                Density <SortIndicator field="talent_density_score" />
              </div>
              <div 
                className="col-span-1 text-center flex items-center justify-center gap-1 cursor-pointer hover:text-text-primary"
                onClick={() => handleSort('fit_score')}
              >
                Fit <SortIndicator field="fit_score" />
              </div>
              <div 
                className="col-span-1 text-center flex items-center justify-center gap-1 cursor-pointer hover:text-text-primary"
                onClick={() => handleSort('evaluation_count')}
              >
                Eval <SortIndicator field="evaluation_count" />
              </div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {/* Table rows */}
            <div className="max-h-[500px] overflow-y-auto">
              {filteredCompanies.length === 0 ? (
                <div className="p-8 text-center text-text-muted">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No companies match your filters</p>
                  <button
                    onClick={clearFilters}
                    className="mt-2 text-sm text-accent hover:text-accent-hover"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                filteredCompanies.map(company => (
                  <CompanyRow key={company.id} company={company} />
                ))
              )}
            </div>
          </div>
        )}

        {viewMode === 'heatmap' && (
          <div className="p-4">
            <TalentDensityHeatmap
              companies={filteredCompanies}
              onCellClick={(sector, geography) => {
                setFilters(prev => ({ ...prev, sector, location: geography }));
                setViewMode('table');
              }}
            />
          </div>
        )}

        {viewMode === 'orgchart' && (
          <div className="p-4">
            {filteredCompanies.filter(c => 
              c.org_chart && (c.org_chart as OrgChartData).nodes?.length > 0
            ).length === 0 ? (
              <div className="p-8 text-center text-text-muted">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No companies with org charts available</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredCompanies
                  .filter(c => c.org_chart && (c.org_chart as OrgChartData).nodes?.length > 0)
                  .slice(0, 5)
                  .map(company => (
                    <div key={company.id}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-text-primary">
                          {company.name}
                        </h4>
                        <Badge variant="default">
                          {(company.org_chart as OrgChartData)?.nodes?.length || 0} positions
                        </Badge>
                      </div>
                      <OrgChartVisualization
                        nodes={(company.org_chart as OrgChartData)?.nodes || []}
                        onNodeClick={(node) => console.log('Node clicked:', node)}
                      />
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}