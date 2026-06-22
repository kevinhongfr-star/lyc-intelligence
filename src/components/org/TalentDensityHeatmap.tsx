import React, { useState, useMemo, useCallback } from 'react';
import {
  MapPin, Building2, TrendingUp, TrendingDown, Filter, X, 
  ChevronDown, ChevronRight, Loader2, AlertCircle
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import type { TargetCompany, TalentDensityCell } from '@/services/supabaseApi';

interface TalentDensityHeatmapProps {
  companies: TargetCompany[];
  onCellClick?: (sector: string, geography: string) => void;
  loading?: boolean;
}

const SECTORS = [
  'Technology',
  'Finance',
  'Healthcare',
  'Manufacturing',
  'Consumer',
  'Energy',
  'Real Estate',
  'Education',
  'Media',
  'Other',
];

const GEOGRAPHIES = [
  'North America',
  'Europe',
  'APAC',
  'Latin America',
  'Middle East',
  'Africa',
  'Global',
];

const getDensityColor = (score: number): string => {
  if (score >= 80) return '#166534'; // Dark green
  if (score >= 60) return '#22C55E'; // Light green
  if (score >= 40) return '#EAB308'; // Yellow
  if (score >= 20) return '#F97316'; // Orange
  return '#EF4444'; // Red
};

const getDensityLabel = (score: number): string => {
  if (score >= 80) return 'Very Dense';
  if (score >= 60) return 'Dense';
  if (score >= 40) return 'Moderate';
  if (score >= 20) return 'Sparse';
  return 'Very Sparse';
};

const getDensityBgClass = (score: number): string => {
  if (score >= 80) return 'bg-green-700';
  if (score >= 60) return 'bg-green-500';
  if (score >= 40) return 'bg-yellow-500';
  if (score >= 20) return 'bg-orange-500';
  return 'bg-red-500';
};

export function TalentDensityHeatmap({
  companies,
  onCellClick,
  loading = false,
}: TalentDensityHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{ sector: string; geography: string } | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ sector: string; geography: string } | null>(null);
  const [expandedCell, setExpandedCell] = useState<{ sector: string; geography: string } | null>(null);
  const [filters, setFilters] = useState<{
    sectors: string[];
    geographies: string[];
    minDensity: number;
    maxDensity: number;
    minCompanySize: string;
    maxCompanySize: string;
  }>({
    sectors: [],
    geographies: [],
    minDensity: 0,
    maxDensity: 100,
    minCompanySize: '',
    maxCompanySize: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Calculate density matrix
  const densityMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, TalentDensityCell>> = {};

    // Initialize empty matrix
    SECTORS.forEach(sector => {
      matrix[sector] = {};
      GEOGRAPHIES.forEach(geo => {
        matrix[sector][geo] = {
          sector,
          geography: geo,
          density_score: 0,
          company_count: 0,
          companies: [],
        };
      });
    });

    // Populate from companies
    companies.forEach(company => {
      const sector = company.sector || company.industry || 'Other';
      const geography = company.region || 'Global';

      // Normalize sector/geography to our predefined values
      const normalizedSector = SECTORS.find(s => 
        sector.toLowerCase().includes(s.toLowerCase())
      ) || 'Other';
      const normalizedGeo = GEOGRAPHIES.find(g => 
        geography.toLowerCase().includes(g.toLowerCase())
      ) || 'Global';

      // Apply filters
      if (filters.sectors.length > 0 && !filters.sectors.includes(normalizedSector)) return;
      if (filters.geographies.length > 0 && !filters.geographies.includes(normalizedGeo)) return;
      const densityScore = company.talent_density_score ?? 50;
      if (densityScore < filters.minDensity || densityScore > filters.maxDensity) return;

      const cell = matrix[normalizedSector][normalizedGeo];
      cell.company_count++;
      cell.companies.push(company);
      cell.density_score = Math.round(
        (cell.density_score * (cell.company_count - 1) + densityScore) / cell.company_count
      );
    });

    return matrix;
  }, [companies, filters]);

  // Get companies for selected cell
  const selectedCompanies = useMemo(() => {
    if (!selectedCell) return [];
    return densityMatrix[selectedCell.sector]?.[selectedCell.geography]?.companies || [];
  }, [selectedCell, densityMatrix]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    let totalCompanies = 0;
    let totalDensity = 0;
    let maxDensityCell: { sector: string; geography: string; score: number } | null = null;
    let minDensityCell: { sector: string; geography: string; score: number } | null = null;

    SECTORS.forEach(sector => {
      GEOGRAPHIES.forEach(geo => {
        const cell = densityMatrix[sector]?.[geo];
        if (cell && cell.company_count > 0) {
          totalCompanies += cell.company_count;
          totalDensity += cell.density_score;

          if (!maxDensityCell || cell.density_score > maxDensityCell.score) {
            maxDensityCell = { sector, geography: geo, score: cell.density_score };
          }
          if (!minDensityCell || cell.density_score < minDensityCell.score) {
            minDensityCell = { sector, geography: geo, score: cell.density_score };
          }
        }
      });
    });

    const avgDensity = totalCompanies > 0 ? Math.round(totalDensity / totalCompanies) : 0;

    return {
      totalCompanies,
      avgDensity,
      maxDensityCell,
      minDensityCell,
    };
  }, [densityMatrix]);

  const handleCellClick = (sector: string, geography: string) => {
    const cell = densityMatrix[sector][geography];
    if (cell.company_count > 0) {
      setSelectedCell({ sector, geography });
      onCellClick?.(sector, geography);
    }
  };

  const toggleSectorFilter = (sector: string) => {
    setFilters(prev => ({
      ...prev,
      sectors: prev.sectors.includes(sector)
        ? prev.sectors.filter(s => s !== sector)
        : [...prev.sectors, sector],
    }));
  };

  const toggleGeographyFilter = (geo: string) => {
    setFilters(prev => ({
      ...prev,
      geographies: prev.geographies.includes(geo)
        ? prev.geographies.filter(g => g !== geo)
        : [...prev.geographies, geo],
    }));
  };

  const clearFilters = () => {
    setFilters({
      sectors: [],
      geographies: [],
      minDensity: 0,
      maxDensity: 100,
      minCompanySize: '',
      maxCompanySize: '',
    });
    setSelectedCell(null);
  };

  // Tooltip component
  const Tooltip = () => {
    if (!hoveredCell) return null;

    const cell = densityMatrix[hoveredCell.sector]?.[hoveredCell.geography];
    if (!cell) return null;

    return (
      <div className="absolute bg-card rounded-lg border border-card-border p-3 shadow-lg z-20 pointer-events-none"
        style={{
          left: '50%',
          top: '10px',
          transform: 'translateX(-50%)',
          minWidth: '200px',
        }}
      >
        <div className="font-semibold text-text-primary mb-2">
          {hoveredCell.sector} • {hoveredCell.geography}
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Density Score:</span>
            <Badge 
              variant={cell.density_score >= 60 ? 'success' : cell.density_score >= 40 ? 'warning' : 'danger'}
            >
              {cell.density_score}/100
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Companies:</span>
            <span className="text-text-primary font-medium">{cell.company_count}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Status:</span>
            <span className="text-text-primary">{getDensityLabel(cell.density_score)}</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-card-border p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <span className="ml-3 text-text-muted">Loading talent density data...</span>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-card-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-text-primary">
            Talent Density Heatmap
          </h3>
          <Badge variant="default">
            {summaryStats.totalCompanies} companies
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-1" />
            Filters
            {(filters.sectors.length > 0 || filters.geographies.length > 0 || 
              filters.minDensity > 0 || filters.maxDensity < 100) && (
              <Badge variant="default" className="ml-2">Active</Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="p-4 bg-bg-alt border-b border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sector filters */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <Building2 className="w-4 h-4 inline mr-1" />
                Sectors
              </label>
              <div className="flex flex-wrap gap-2">
                {SECTORS.map(sector => (
                  <button
                    key={sector}
                    onClick={() => toggleSectorFilter(sector)}
                    className={`px-3 py-1 rounded-full text-sm border transition-all ${
                      filters.sectors.includes(sector)
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border text-text-muted hover:border-accent/50'
                    }`}
                  >
                    {sector}
                  </button>
                ))}
              </div>
            </div>

            {/* Geography filters */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Geographies
              </label>
              <div className="flex flex-wrap gap-2">
                {GEOGRAPHIES.map(geo => (
                  <button
                    key={geo}
                    onClick={() => toggleGeographyFilter(geo)}
                    className={`px-3 py-1 rounded-full text-sm border transition-all ${
                      filters.geographies.includes(geo)
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border text-text-muted hover:border-accent/50'
                    }`}
                  >
                    {geo}
                  </button>
                ))}
              </div>
            </div>

            {/* Density range */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Density Range
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={filters.minDensity}
                  onChange={(e) => setFilters(prev => ({ ...prev, minDensity: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <span className="text-sm text-text-muted w-16">
                  {filters.minDensity} - {filters.maxDensity}
                </span>
              </div>
            </div>
          </div>

          {/* Clear filters */}
          {(filters.sectors.length > 0 || filters.geographies.length > 0 || 
            filters.minDensity > 0 || filters.maxDensity < 100) && (
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

      {/* Summary insights */}
      <div className="p-4 bg-bg-alt border-b border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <div className="text-sm text-text-muted">Highest Density</div>
              <div className="font-medium text-text-primary">
                {summaryStats.maxDensityCell 
                  ? `${(summaryStats.maxDensityCell as { sector: string; geography: string; score: number }).sector}/${(summaryStats.maxDensityCell as { sector: string; geography: string; score: number }).geography} (${(summaryStats.maxDensityCell as { sector: string; geography: string; score: number }).score}/100)`
                  : 'N/A'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <div className="text-sm text-text-muted">Lowest Density</div>
              <div className="font-medium text-text-primary">
                {summaryStats.minDensityCell 
                  ? `${(summaryStats.minDensityCell as { sector: string; geography: string; score: number }).sector}/${(summaryStats.minDensityCell as { sector: string; geography: string; score: number }).geography} (${(summaryStats.minDensityCell as { sector: string; geography: string; score: number }).score}/100)`
                  : 'N/A'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <MapPin className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="text-sm text-text-muted">Average Density</div>
              <div className="font-medium text-text-primary">
                {summaryStats.avgDensity}/100
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="relative p-4 overflow-x-auto">
        <Tooltip />

        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-text-muted">
                Sector
              </th>
              {GEOGRAPHIES.map(geo => (
                <th 
                  key={geo} 
                  className="px-2 py-2 text-center text-sm font-medium text-text-muted"
                >
                  {geo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SECTORS.map(sector => (
              <tr key={sector}>
                <td className="px-4 py-2 text-sm font-medium text-text-primary">
                  {sector}
                </td>
                {GEOGRAPHIES.map(geo => {
                  const cell = densityMatrix[sector]?.[geo];
                  const isSelected = selectedCell?.sector === sector && selectedCell?.geography === geo;
                  const isHovered = hoveredCell?.sector === sector && hoveredCell?.geography === geo;

                  return (
                    <td
                      key={geo}
                      className={`px-2 py-2 text-center cursor-pointer transition-all ${
                        cell?.company_count > 0 ? 'hover:ring-2 hover:ring-accent/50' : ''
                      } ${isSelected ? 'ring-2 ring-accent' : ''}`}
                      onMouseEnter={() => cell?.company_count > 0 && setHoveredCell({ sector, geography: geo })}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => handleCellClick(sector, geo)}
                    >
                      <div
                        className={`w-full h-12 rounded-lg flex flex-col items-center justify-center ${
                          cell?.company_count > 0 
                            ? getDensityBgClass(cell.density_score)
                            : 'bg-bg-alt border border-border'
                        }`}
                      >
                        {cell?.company_count > 0 ? (
                          <>
                            <span className="text-white font-bold text-sm">
                              {cell.density_score}
                            </span>
                            <span className="text-white/80 text-xs">
                              {cell.company_count}
                            </span>
                          </>
                        ) : (
                          <span className="text-text-muted text-xs">—</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 p-4 bg-bg-alt border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-700" />
          <span className="text-sm text-text-muted">Very Dense (80+)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span className="text-sm text-text-muted">Dense (60-79)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500" />
          <span className="text-sm text-text-muted">Moderate (40-59)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-500" />
          <span className="text-sm text-text-muted">Sparse (20-39)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span className="text-sm text-text-muted">Very Sparse (0-19)</span>
        </div>
      </div>

      {/* Selected cell detail panel */}
      {selectedCell && selectedCompanies.length > 0 && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-text-primary">
              Companies in {selectedCell.sector} / {selectedCell.geography}
            </h4>
            <button
              onClick={() => setSelectedCell(null)}
              className="p-2 hover:bg-bg-alt rounded-lg"
            >
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedCompanies.slice(0, 12).map(company => (
              <div
                key={company.id}
                className="bg-bg-alt rounded-lg p-3 border border-border hover:border-accent/50 transition-all"
              >
                <div className="font-medium text-text-primary mb-1">
                  {company.name}
                </div>
                <div className="text-sm text-text-muted">
                  {company.industry} • {company.location}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={(company.talent_density_score ?? 50) >= 60 ? 'success' : 'default'}>
                    Density: {company.talent_density_score ?? 'N/A'}
                  </Badge>
                  {company.key_talent_count && (
                    <Badge variant="default">
                      {company.key_talent_count} talents
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          {selectedCompanies.length > 12 && (
            <div className="mt-4 text-center text-sm text-text-muted">
              Showing 12 of {selectedCompanies.length} companies
            </div>
          )}
        </div>
      )}
    </div>
  );
}