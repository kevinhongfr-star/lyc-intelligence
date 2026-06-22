import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2, MapPin, TrendingUp, Download, ChevronRight, ChevronDown,
  Loader2, AlertCircle, FileText, BarChart3, Users
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { OrgChartVisualization } from './OrgChartVisualization';
import { TalentDensityHeatmap } from './TalentDensityHeatmap';
import { generateOrgChartPDF } from './OrgChartPDFExport';
import type { TargetCompany, OrgChartData, Mandate } from '@/services/supabaseApi';
import { getTargetCompanies, getOrgChart, getMandateById } from '@/services/supabaseApi';

interface TalentLandscapeClientProps {
  mandateId: string;
  userRole: 'client_admin' | 'client_viewer' | 'lyc_consultant' | 'lyc_admin';
}

export function TalentLandscapeClient({ mandateId, userRole }: TalentLandscapeClientProps) {
  const [mandate, setMandate] = useState<Mandate | null>(null);
  const [companies, setCompanies] = useState<TargetCompany[]>([]);
  const [orgCharts, setOrgCharts] = useState<Record<string, OrgChartData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'orgcharts' | 'heatmap'>('overview');
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, [mandateId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load mandate
      const mandateData = await getMandateById(mandateId);
      if (!mandateData) {
        setError('Mandate not found');
        return;
      }
      setMandate(mandateData);

      // Load target companies
      const companiesData = await getTargetCompanies(mandateId);
      setCompanies(companiesData);

      // Load org charts for each company
      const charts: Record<string, OrgChartData> = {};
      for (const company of companiesData) {
        if (company.org_chart) {
          charts[company.id] = company.org_chart as OrgChartData;
        }
      }
      setOrgCharts(charts);

      // Select first company with org chart
      const firstCompanyWithChart = companiesData.find(c => c.org_chart && (c.org_chart as OrgChartData).nodes?.length > 0);
      if (firstCompanyWithChart) {
        setSelectedCompanyId(firstCompanyWithChart.id);
      }
    } catch (err) {
      console.error('Load talent landscape error:', err);
      setError('Failed to load talent landscape data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate insights
  const insights = useMemo(() => {
    if (!companies.length) return null;

    // Top sectors and geographies
    const sectorCounts: Record<string, number> = {};
    const geoCounts: Record<string, number> = {};
    const densityBySector: Record<string, number[]> = {};

    companies.forEach(company => {
      const sector = company.sector || company.industry || 'Other';
      const geo = company.region || 'Global';
      sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
      geoCounts[geo] = (geoCounts[geo] || 0) + 1;
      if (company.talent_density_score) {
        densityBySector[sector] = densityBySector[sector] || [];
        densityBySector[sector].push(company.talent_density_score);
      }
    });

    // Find highest density
    let highestDensity = { sector: '', geo: '', score: 0 };
    let lowestDensity = { sector: '', geo: '', score: 100 };

    companies.forEach(company => {
      if (company.talent_density_score) {
        if (company.talent_density_score > highestDensity.score) {
          highestDensity = {
            sector: company.sector || company.industry || 'Other',
            geo: company.region || 'Global',
            score: company.talent_density_score,
          };
        }
        if (company.talent_density_score < lowestDensity.score) {
          lowestDensity = {
            sector: company.sector || company.industry || 'Other',
            geo: company.region || 'Global',
            score: company.talent_density_score,
          };
        }
      }
    });

    // Top sectors by count
    const topSectors = Object.entries(sectorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([sector]) => sector);

    // Top geographies by count
    const topGeographies = Object.entries(geoCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([geo]) => geo);

    // Companies with org charts
    const companiesWithCharts = companies.filter(c => 
      c.org_chart && (c.org_chart as OrgChartData).nodes?.length > 0
    );

    // High relevance positions
    let highRelevancePositions = 0;
    companiesWithCharts.forEach(company => {
      const chart = company.org_chart as OrgChartData;
      highRelevancePositions += chart.nodes?.filter(n => (n.talent_relevance ?? 3) >= 4).length || 0;
    });

    return {
      totalCompanies: companies.length,
      topSectors,
      topGeographies,
      highestDensity,
      lowestDensity,
      companiesWithCharts: companiesWithCharts.length,
      highRelevancePositions,
    };
  }, [companies]);

  // Companies with org charts for display
  const companiesWithOrgCharts = useMemo(() => {
    return companies
      .filter(c => c.org_chart && (c.org_chart as OrgChartData).nodes?.length > 0)
      .slice(0, 5); // Top 5 for client view
  }, [companies]);

  const handleExportPDF = async () => {
    setGeneratingPDF(true);
    try {
      await generateOrgChartPDF({
        mandate,
        companies: companiesWithOrgCharts,
        orgCharts,
        insights,
      });
    } catch (err) {
      console.error('PDF generation error:', err);
      setError('Failed to generate PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-bg rounded-xl p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <span className="ml-3 text-text-muted">Loading talent landscape...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-bg rounded-xl p-8 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <span className="ml-3 text-red-500">{error}</span>
      </div>
    );
  }

  return (
    <div className="bg-bg rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary">
            Talent Landscape: {mandate?.title || 'Mandate'}
          </h2>
          <p className="text-sm text-text-muted mt-1">
            {userRole === 'client_admin' || userRole === 'client_viewer'
              ? 'Your talent mapping overview'
              : 'Complete talent mapping and analysis'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {(userRole === 'lyc_consultant' || userRole === 'lyc_admin') && (
            <Button
              onClick={handleExportPDF}
              disabled={generatingPDF}
            >
              {generatingPDF ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-1" />
              )}
              Export PDF
            </Button>
          )}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 p-4 bg-bg-alt border-b border-border">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'overview'
              ? 'bg-accent text-white'
              : 'text-text-muted hover:text-text-primary hover:bg-bg'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-1" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('orgcharts')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'orgcharts'
              ? 'bg-accent text-white'
              : 'text-text-muted hover:text-text-primary hover:bg-bg'
          }`}
        >
          <Users className="w-4 h-4 inline mr-1" />
          Org Charts
        </button>
        <button
          onClick={() => setActiveTab('heatmap')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'heatmap'
              ? 'bg-accent text-white'
              : 'text-text-muted hover:text-text-primary hover:bg-bg'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-1" />
          Density Heatmap
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-card rounded-xl p-4 border border-card-border">
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="w-5 h-5 text-accent" />
                  <span className="text-sm text-text-muted">Target Companies</span>
                </div>
                <div className="text-2xl font-bold text-text-primary">
                  {insights?.totalCompanies || 0}
                </div>
              </div>

              <div className="bg-card rounded-xl p-4 border border-card-border">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-text-muted">Org Charts</span>
                </div>
                <div className="text-2xl font-bold text-text-primary">
                  {insights?.companiesWithCharts || 0}
                </div>
              </div>

              <div className="bg-card rounded-xl p-4 border border-card-border">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm text-text-muted">High Relevance Positions</span>
                </div>
                <div className="text-2xl font-bold text-text-primary">
                  {insights?.highRelevancePositions || 0}
                </div>
              </div>

              <div className="bg-card rounded-xl p-4 border border-card-border">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-text-muted">Top Geography</span>
                </div>
                <div className="text-lg font-bold text-text-primary">
                  {insights?.topGeographies?.[0] || 'N/A'}
                </div>
              </div>
            </div>

            {/* Key insights */}
            <div className="bg-card rounded-xl p-6 border border-card-border">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Key Insights
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <div className="font-medium text-text-primary">
                      Highest Talent Density
                    </div>
                    <div className="text-sm text-text-muted">
                      {insights?.highestDensity?.sector}/{insights?.highestDensity?.geo} 
                      ({insights?.highestDensity?.score}/100)
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Building2 className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <div className="font-medium text-text-primary">
                      Focus Sectors
                    </div>
                    <div className="text-sm text-text-muted">
                      {insights?.topSectors?.join(', ') || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <MapPin className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="font-medium text-text-primary">
                      Target Geographies
                    </div>
                    <div className="text-sm text-text-muted">
                      {insights?.topGeographies?.join(', ') || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-medium text-text-primary mb-3">
                  Recommendations
                </h4>
                <ul className="space-y-2 text-sm text-text-muted">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-accent" />
                    Focus sourcing on {insights?.highestDensity?.geo || 'APAC'} {insights?.highestDensity?.sector || 'technology'} companies
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-accent" />
                    Target positions with relevance 4-5 in mapped org charts
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-accent" />
                    Expand coverage in {insights?.lowestDensity?.geo || 'underrepresented'} regions
                  </li>
                </ul>
              </div>
            </div>

            {/* Quick preview of top org charts */}
            {companiesWithOrgCharts.length > 0 && (
              <div className="bg-card rounded-xl p-6 border border-card-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Top Target Companies
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {companiesWithOrgCharts.slice(0, 3).map(company => (
                    <div
                      key={company.id}
                      className="bg-bg-alt rounded-lg p-4 border border-border hover:border-accent/50 cursor-pointer transition-all"
                      onClick={() => {
                        setSelectedCompanyId(company.id);
                        setActiveTab('orgcharts');
                      }}
                    >
                      <div className="font-medium text-text-primary mb-2">
                        {company.name}
                      </div>
                      <div className="text-sm text-text-muted mb-2">
                        {company.industry} • {company.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={(company.fit_score ?? 0) >= 80 ? 'success' : 'default'}>
                          Fit: {company.fit_score ?? 'N/A'}
                        </Badge>
                        <Badge variant="default">
                          {(company.org_chart as OrgChartData)?.nodes?.length || 0} positions
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orgcharts' && (
          <div className="space-y-6">
            {/* Company selector */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-text-primary">
                Select Company:
              </label>
              <select
                value={selectedCompanyId || ''}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="px-4 py-2 bg-bg border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {companiesWithOrgCharts.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name} — {company.industry}
                  </option>
                ))}
              </select>
            </div>

            {/* Org chart visualization */}
            {selectedCompanyId && orgCharts[selectedCompanyId] && (
              <OrgChartVisualization
                nodes={orgCharts[selectedCompanyId].nodes}
                onNodeClick={(node) => {
                  console.log('Selected node:', node);
                }}
              />
            )}

            {!selectedCompanyId && (
              <div className="bg-card rounded-xl p-8 text-center">
                <Users className="w-12 h-12 mx-auto mb-3 text-text-muted opacity-50" />
                <p className="text-text-muted">Select a company to view its org chart</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'heatmap' && (
          <TalentDensityHeatmap
            companies={companies}
            onCellClick={(sector, geography) => {
              console.log('Clicked cell:', sector, geography);
            }}
          />
        )}
      </div>
    </div>
  );
}