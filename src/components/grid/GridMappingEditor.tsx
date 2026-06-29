import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Save, RefreshCw, ChevronDown, ChevronUp, AlertCircle, Check, X,
  Building2, Users, Target, BarChart3, TrendingUp, Download, Send,
  Star, Clock, MessageSquare, Filter, Edit2, Trash2
} from 'lucide-react';
import { Badge, Button, Input, Card, Progress } from '@/components/ui';

interface GridMapping {
  id: string;
  mandate_id: string;
  mandate?: { id: string; title: string };
  mapping_type: 'grid' | 'sweep';
  status: 'draft' | 'in_progress' | 'complete' | 'archived';
  config: Record<string, any>;
  standards_summary: Record<string, any>;
  intelligence_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface GridSector {
  id: string;
  grid_mapping_id: string;
  sector_name: string;
  is_primary: boolean;
  segments: string[];
  sort_order: number;
}

interface GridCompany {
  id: string;
  grid_mapping_id: string;
  grid_sector_id?: string;
  company_name: string;
  segment?: string;
  est_employees?: number;
  relevance: 'high' | 'medium' | 'low';
  rationale: string;
  target_candidates: number;
  actual_candidates: number;
  gap: number;
  gap_reason?: string;
  gap_action_plan?: string;
  sort_order: number;
}

interface GridFunction {
  id: string;
  grid_mapping_id: string;
  function_name: string;
  relevant_titles: string[];
  seniority_from?: string;
  seniority_to?: string;
  relevance: 'high' | 'medium' | 'low';
  notes?: string;
  sort_order: number;
}

interface GridCandidateEntry {
  id: string;
  grid_mapping_id: string;
  contact_id: string;
  grid_company_id?: string;
  grid_function_id?: string;
  contact?: { id: string; name: string; current_title: string };
  market_position?: string;
  sector_benchmark?: string;
  salary_band?: string;
  talent_density?: string;
  competitor_presence?: string;
  priority: 'P1' | 'P2' | 'P3';
  priority_override: boolean;
  priority_override_reason?: string;
  status: string;
  notes?: string;
  sort_order: number;
}

type TabType = 'sectors' | 'companies' | 'functions' | 'candidates' | 'gaps' | 'intelligence';

export function GridMappingEditor() {
  const [activeTab, setActiveTab] = useState<TabType>('sectors');
  const [mapping, setMapping] = useState<GridMapping | null>(null);
  const [sectors, setSectors] = useState<GridSector[]>([]);
  const [companies, setCompanies] = useState<GridCompany[]>([]);
  const [functions, setFunctions] = useState<GridFunction[]>([]);
  const [entries, setEntries] = useState<GridCandidateEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showAddSector, setShowAddSector] = useState(false);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [showAddFunction, setShowAddCompany] = useState(false);

  useEffect(() => {
    loadMapping();
  }, []);

  const loadMapping = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/grid/mappings?status=draft');
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        const mappingId = data.data[0].id;
        const mappingResponse = await fetch(`/api/grid/mappings/${mappingId}`);
        const mappingData = await mappingResponse.json();
        if (mappingData.success) {
          setMapping(mappingData.data);
          setSectors(mappingData.data.sectors || []);
          setCompanies(mappingData.data.companies || []);
          setFunctions(mappingData.data.functions || []);
          setEntries(mappingData.data.entries || []);
        }
      } else {
        const createResponse = await fetch('/api/grid/mappings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mandate_id: 'test-mandate-id',
            mapping_type: 'grid',
            config: { target_role: 'VP Sales', target_geography: 'APAC' },
          }),
        });
        const createData = await createResponse.json();
        if (createData.success) {
          loadMapping();
        }
      }
    } catch (err) {
      console.error('Load mapping error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addSector = async (sectorName: string) => {
    if (!mapping) return;
    try {
      const response = await fetch(`/api/grid/mappings/${mapping.id}/sectors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sector_name: sectorName, is_primary: sectors.length === 0 }),
      });
      const data = await response.json();
      if (data.success) {
        setSectors(prev => [...prev, data.data]);
        setShowAddSector(false);
      }
    } catch (err) {
      console.error('Add sector error:', err);
    }
  };

  const addCompany = async (company: Omit<GridCompany, 'id' | 'grid_mapping_id'>) => {
    if (!mapping) return;
    try {
      const response = await fetch(`/api/grid/mappings/${mapping.id}/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(company),
      });
      const data = await response.json();
      if (data.success) {
        setCompanies(prev => [...prev, data.data]);
        setShowAddCompany(false);
      }
    } catch (err) {
      console.error('Add company error:', err);
    }
  };

  const generateIntelligence = async () => {
    if (!mapping) return;
    setGenerating(true);
    try {
      const response = await fetch(`/api/grid/mappings/${mapping.id}/generate`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        loadMapping();
      }
    } catch (err) {
      console.error('Generate intelligence error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P1': return 'bg-red-500';
      case 'P2': return 'bg-yellow-500';
      case 'P3': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const StandardsBar = () => {
    if (!mapping?.standards_summary) return null;
    const standards = mapping.standards_summary;
    const metrics = [
      { key: 'm1_companies', label: 'Companies' },
      { key: 'm2_sectors', label: 'Sectors' },
      { key: 'm3_candidates', label: 'Candidates' },
      { key: 'm4_contacted', label: 'Contacted' },
      { key: 'm5_gap_filled', label: 'Gaps' },
      { key: 'm6_p1_contacted', label: 'P1 Contacted' },
      { key: 'm7_last_update', label: 'Updates' },
    ];

    return (
      <div className="bg-card rounded-xl border border-card-border p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-text-primary">Minimum Standards (M1-M7)</h3>
          <Badge variant={standards.m7_last_update?.status === 'green' ? 'success' : 'warning'}>
            {Object.values(standards).filter((s: any) => s.status === 'green').length}/7 ✅
          </Badge>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {metrics.map(({ key, label }) => {
            const metric = standards[key];
            return (
              <div key={key} className="text-center">
                <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${getStatusColor(metric?.status || 'red')}`} />
                <div className="text-xs text-text-muted">{label}</div>
                <div className="text-xs font-medium text-text-primary">
                  {metric?.count ?? metric?.pct ?? '-'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const SectorsTab = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-text-primary">Sectors & Segments</h4>
        <Button variant="outline" size="sm" onClick={() => setShowAddSector(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Sector
        </Button>
      </div>

      {sectors.length === 0 ? (
        <div className="p-8 text-center text-text-muted">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No sectors added yet</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowAddSector(true)}>
            Add first sector
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {sectors.map(sector => (
            <Card key={sector.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {sector.is_primary && <Star className="w-4 h-4 text-yellow-500" />}
                  <span className="font-medium text-text-primary">{sector.sector_name}</span>
                  <Badge variant="default">{sector.segments.length} segments</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1 hover:bg-bg-alt rounded">
                    <Edit2 className="w-4 h-4 text-text-muted" />
                  </button>
                  <button className="p-1 hover:bg-bg-alt rounded">
                    <Trash2 className="w-4 h-4 text-text-muted" />
                  </button>
                </div>
              </div>
              {sector.segments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {sector.segments.map((seg, i) => (
                    <Badge key={i} variant="secondary">{seg}</Badge>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {showAddSector && (
        <Card className="p-4">
          <h4 className="font-medium text-text-primary mb-3">Add Sector</h4>
          <Input
            placeholder="Sector name (e.g., Mining)"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addSector((e.target as HTMLInputElement).value);
              }
            }}
          />
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={() => setShowAddSector(false)}>Cancel</Button>
            <Button size="sm" onClick={() => addSector('New Sector')}>Add</Button>
          </div>
        </Card>
      )}
    </div>
  );

  const CompaniesTab = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-text-primary">Target Companies</h4>
        <Button variant="outline" size="sm" onClick={() => setShowAddCompany(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Company
        </Button>
      </div>

      {companies.length === 0 ? (
        <div className="p-8 text-center text-text-muted">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No companies added yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-sm text-text-muted border-b">
                <th className="text-left p-2">Company</th>
                <th className="text-left p-2">Sector</th>
                <th className="text-center p-2">Relevance</th>
                <th className="text-center p-2">Target</th>
                <th className="text-center p-2">Actual</th>
                <th className="text-center p-2">Gap</th>
              </tr>
            </thead>
            <tbody>
              {companies.map(company => (
                <tr key={company.id} className="border-b hover:bg-bg-alt">
                  <td className="p-2">
                    <div className="font-medium text-text-primary">{company.company_name}</div>
                    <div className="text-xs text-text-muted">{company.rationale}</div>
                  </td>
                  <td className="p-2 text-sm text-text-muted">{company.segment || '-'}</td>
                  <td className="p-2 text-center">
                    <Badge variant={company.relevance === 'high' ? 'success' : company.relevance === 'medium' ? 'warning' : 'default'}>
                      {company.relevance}
                    </Badge>
                  </td>
                  <td className="p-2 text-center">{company.target_candidates}</td>
                  <td className="p-2 text-center">{company.actual_candidates}</td>
                  <td className="p-2 text-center">
                    <Badge variant={company.gap > 0 ? 'warning' : company.gap < 0 ? 'error' : 'success'}>
                      {company.gap > 0 ? `+${company.gap}` : company.gap}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddCompany && (
        <Card className="p-4">
          <h4 className="font-medium text-text-primary mb-3">Add Company</h4>
          <div className="space-y-3">
            <Input placeholder="Company name" />
            <select className="w-full px-3 py-2 bg-bg border border-border rounded-lg">
              <option value="">Select sector</option>
              {sectors.map(s => <option key={s.id} value={s.id}>{s.sector_name}</option>)}
            </select>
            <Input placeholder="Rationale for targeting" />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={() => setShowAddCompany(false)}>Cancel</Button>
            <Button size="sm" onClick={() => addCompany({ company_name: 'New Company', relevance: 'medium', rationale: 'Test', target_candidates: 1 })}>Add</Button>
          </div>
        </Card>
      )}
    </div>
  );

  const FunctionsTab = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-text-primary">Business Functions</h4>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-1" /> Add Function
        </Button>
      </div>

      {functions.length === 0 ? (
        <div className="p-8 text-center text-text-muted">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No functions defined yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {functions.map(func => (
            <Card key={func.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text-primary">{func.function_name}</span>
                  <Badge variant={func.relevance === 'high' ? 'success' : 'default'}>
                    {func.relevance}
                  </Badge>
                </div>
                <div className="text-sm text-text-muted">
                  {func.seniority_from} - {func.seniority_to}
                </div>
              </div>
              {func.relevant_titles.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {func.relevant_titles.map((title, i) => (
                    <Badge key={i} variant="secondary">{title}</Badge>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const CandidatesTab = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-text-primary">Candidate Map</h4>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-1" /> Add Candidate
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="p-8 text-center text-text-muted">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No candidates mapped yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map(entry => (
            <Card key={entry.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getPriorityColor(entry.priority)}`} />
                  <div>
                    <div className="font-medium text-text-primary">{entry.contact?.name || 'Unknown'}</div>
                    <div className="text-sm text-text-muted">{entry.contact?.current_title || '-'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={entry.status === 'uncontacted' ? 'default' : 'success'}>
                    {entry.status}
                  </Badge>
                  {entry.priority_override && <Badge variant="warning">Override</Badge>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const GapsTab = () => {
    const gapCompanies = companies.filter(c => c.gap !== 0);
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-text-primary">Gap Analysis</h4>
        <div className="flex items-center gap-4 mb-4">
          <Badge variant={gapCompanies.length > 0 ? 'warning' : 'success'}>
            {gapCompanies.length} companies with gaps
          </Badge>
          <span className="text-sm text-text-muted">
            Total gap: {gapCompanies.reduce((sum, c) => sum + c.gap, 0)} candidates
          </span>
        </div>

        {gapCompanies.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            <Check className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p>No gaps identified</p>
          </div>
        ) : (
          <div className="space-y-2">
            {gapCompanies.map(company => (
              <Card key={company.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-text-primary">{company.company_name}</span>
                  <Badge variant="warning">Gap: {company.gap}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-text-muted">Reason:</span>
                  <select className="px-3 py-1 bg-bg border border-border rounded-lg text-sm">
                    <option value="">Select reason</option>
                    <option value="not_interested">Not interested</option>
                    <option value="not_found">Not found</option>
                    <option value="not_reachable">Not reachable</option>
                    <option value="wrong_seniority">Wrong seniority</option>
                    <option value="wrong_function">Wrong function</option>
                  </select>
                </div>
                <Input placeholder="Action plan..." className="mt-2 text-sm" />
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  const IntelligenceTab = () => {
    if (!mapping?.intelligence_data || Object.keys(mapping.intelligence_data).length === 0) {
      return (
        <div className="p-8 text-center">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-text-muted mb-4">No intelligence data available</p>
          <Button onClick={generateIntelligence} disabled={generating}>
            {generating ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : null}
            Generate Intelligence
          </Button>
        </div>
      );
    }

    const intel = mapping.intelligence_data;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-text-primary">Intelligence Data (16 Points)</h4>
          <Button variant="outline" size="sm" onClick={generateIntelligence}>
            <RefreshCw className="w-4 h-4 mr-1" /> Regenerate
          </Button>
        </div>

        <Card className="p-4">
          <h5 className="text-sm font-medium text-text-muted mb-2">1. Market Landscape</h5>
          <p className="text-text-primary">{intel['1_market_landscape']}</p>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <h5 className="text-sm font-medium text-text-muted mb-2">2. Talent Distribution</h5>
            <pre className="text-sm text-text-primary whitespace-pre-wrap">{JSON.stringify(intel['2_talent_distribution'], null, 2)}</pre>
          </Card>
          <Card className="p-4">
            <h5 className="text-sm font-medium text-text-muted mb-2">3. Geo Density</h5>
            <pre className="text-sm text-text-primary whitespace-pre-wrap">{JSON.stringify(intel['3_geo_density'], null, 2)}</pre>
          </Card>
        </div>

        <Card className="p-4">
          <h5 className="text-sm font-medium text-text-muted mb-2">6. Compensation Benchmark</h5>
          <div className="flex items-center gap-4">
            <span className="text-text-primary">
              {intel['6_compensation_benchmark']?.range_low || '-'} - {intel['6_compensation_benchmark']?.range_high || '-'}
              {intel['6_compensation_benchmark']?.currency}
            </span>
            <Badge variant={intel['6_compensation_benchmark']?.confidence === 'high' ? 'success' : intel['6_compensation_benchmark']?.confidence === 'medium' ? 'warning' : 'default'}>
              {intel['6_compensation_benchmark']?.confidence} confidence
            </Badge>
          </div>
        </Card>

        <Card className="p-4">
          <h5 className="text-sm font-medium text-text-muted mb-2">11. Time to Fill</h5>
          <div className="flex items-center gap-4">
            <span className="text-lg font-medium text-text-primary">
              {intel['11_time_to_fill']?.estimated_days || '-'} days
            </span>
            <Badge variant={intel['11_time_to_fill']?.confidence === 'high' ? 'success' : 'warning'}>
              {intel['11_time_to_fill']?.confidence} confidence
            </Badge>
          </div>
        </Card>

        <Card className="p-4">
          <h5 className="text-sm font-medium text-text-muted mb-2">15. Risk Indicators</h5>
          <div className="flex flex-wrap gap-2">
            {(intel['15_risk_indicators'] || []).map((risk: string, i: number) => (
              <Badge key={i} variant="error">{risk}</Badge>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'sectors', label: 'Sectors', icon: <Building2 className="w-4 h-4" /> },
    { key: 'companies', label: 'Companies', icon: <Target className="w-4 h-4" /> },
    { key: 'functions', label: 'Functions', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'candidates', label: 'Candidates', icon: <Users className="w-4 h-4" /> },
    { key: 'gaps', label: 'Gaps', icon: <AlertCircle className="w-4 h-4" /> },
    { key: 'intelligence', label: 'Intelligence', icon: <TrendingUp className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-card-border p-8 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-accent" />
        <span className="ml-3 text-text-muted">Loading GRID mapping...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {mapping && <StandardsBar />}

      <div className="bg-card rounded-xl border border-card-border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-text-primary">
              {mapping?.mandate?.title || 'GRID Mapping'}
            </h3>
            <Badge variant={mapping?.status === 'complete' ? 'success' : mapping?.status === 'in_progress' ? 'warning' : 'default'}>
              {mapping?.status}
            </Badge>
            <Badge variant="secondary">{mapping?.mapping_type?.toUpperCase()}</Badge>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={generateIntelligence} disabled={generating}>
              {generating ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : null}
              Generate Intelligence
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
          </div>
        </div>

        <div className="flex border-b border-border">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                activeTab === tab.key
                  ? 'text-accent border-accent bg-accent/5'
                  : 'text-text-muted border-transparent hover:text-text-primary'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeTab === 'sectors' && <SectorsTab />}
          {activeTab === 'companies' && <CompaniesTab />}
          {activeTab === 'functions' && <FunctionsTab />}
          {activeTab === 'candidates' && <CandidatesTab />}
          {activeTab === 'gaps' && <GapsTab />}
          {activeTab === 'intelligence' && <IntelligenceTab />}
        </div>
      </div>
    </div>
  );
}