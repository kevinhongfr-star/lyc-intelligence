import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  X,
  FileText,
  Video,
  Presentation,
  Image,
  Code,
  File,
  Loader2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { StatusBadge } from '../shared/StatusBadge';

const PHASE_OPTIONS = ['All', 'ATTRACT', 'ENGAGE', 'ASSESS', 'RESOLVE', 'SUSTAIN', 'PROMOTE', 'OPS'];
const PRIORITY_OPTIONS = ['All', 'P0', 'P1', 'P2'];
const STATUS_OPTIONS = ['All', 'idea', 'draft', 'review', 'approved', 'archived'];

const FORMAT_ICONS: Record<string, any> = {
  MD: FileText,
  DOCX: FileText,
  PDF: FileText,
  PPTX: Presentation,
  HTML: Code,
  PNG: Image,
  JPG: Image,
  MP4: Video,
};

interface Asset {
  id: string;
  name: string;
  description: string | null;
  status: string;
  notion_phase: string | null;
  asset_priority: string | null;
  asset_category: string | null;
  asset_format: string | null;
  assigned_to: string | null;
  notion_asset_id: string | null;
  notion_page_url: string | null;
  dependencies: string[] | null;
  product_layer: string | null;
  created_at: string;
  updated_at: string;
}

export function AssetLibraryPage() {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [assignedFilter, setAssignedFilter] = useState('All');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [filterOpen, setFilterOpen] = useState(true);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (e) {
      console.error('Failed to load assets:', e);
    } finally {
      setLoading(false);
    }
  };

  const assignees = useMemo(() => {
    const names = new Set<string>();
    assets.forEach(a => {
      if (a.assigned_to) names.add(a.assigned_to);
    });
    return ['All', ...Array.from(names).sort()];
  }, [assets]);

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      if (searchQuery && !asset.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (phaseFilter !== 'All' && asset.notion_phase !== phaseFilter) {
        return false;
      }
      if (priorityFilter !== 'All' && asset.asset_priority !== priorityFilter) {
        return false;
      }
      if (statusFilter !== 'All' && asset.status !== statusFilter) {
        return false;
      }
      if (assignedFilter !== 'All' && asset.assigned_to !== assignedFilter) {
        return false;
      }
      return true;
    });
  }, [assets, searchQuery, phaseFilter, priorityFilter, statusFilter, assignedFilter]);

  const activeFilters = useMemo(() => {
    const filters: { label: string; value: string; clear: () => void }[] = [];
    if (phaseFilter !== 'All') filters.push({ label: 'Phase', value: phaseFilter, clear: () => setPhaseFilter('All') });
    if (priorityFilter !== 'All') filters.push({ label: 'Priority', value: priorityFilter, clear: () => setPriorityFilter('All') });
    if (statusFilter !== 'All') filters.push({ label: 'Status', value: statusFilter, clear: () => setStatusFilter('All') });
    if (assignedFilter !== 'All') filters.push({ label: 'Assigned', value: assignedFilter, clear: () => setAssignedFilter('All') });
    return filters;
  }, [phaseFilter, priorityFilter, statusFilter, assignedFilter]);

  const clearAllFilters = () => {
    setPhaseFilter('All');
    setPriorityFilter('All');
    setStatusFilter('All');
    setAssignedFilter('All');
    setSearchQuery('');
  };

  const FormatIcon = (format: string | null) => {
    if (!format) return File;
    return FORMAT_ICONS[format.toUpperCase()] || File;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="ml-3 text-text-muted">Loading assets...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-[#E5E5E5] bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#171717]">Asset Library</h1>
            <p className="text-sm text-[#737373] mt-0.5">
              {filteredAssets.length} of {assets.length} assets
            </p>
          </div>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#404040] border border-[#E5E5E5] hover:bg-[#FAFAFA]"
          >
            <Filter className="w-4 h-4" />
            Filters
            {filterOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3]" />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-[#E5E5E5] focus:outline-none focus:border-[#2563EB] bg-white"
          />
        </div>

        {filterOpen && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <FilterSelect
              label="Phase"
              value={phaseFilter}
              options={PHASE_OPTIONS}
              onChange={setPhaseFilter}
            />
            <FilterSelect
              label="Priority"
              value={priorityFilter}
              options={PRIORITY_OPTIONS}
              onChange={setPriorityFilter}
            />
            <FilterSelect
              label="Status"
              value={statusFilter}
              options={STATUS_OPTIONS}
              onChange={setStatusFilter}
            />
            <FilterSelect
              label="Assigned To"
              value={assignedFilter}
              options={assignees}
              onChange={setAssignedFilter}
            />
          </div>
        )}

        {activeFilters.length > 0 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[#737373]">Active filters:</span>
            {activeFilters.map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-[#F5F5F5] text-[#404040]"
              >
                {f.label}: {f.value}
                <button onClick={f.clear} className="hover:text-[#171717]">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-xs text-[#2563EB] hover:underline ml-auto"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FileText className="w-12 h-12 text-[#D4D4D4] mb-3" />
            <p className="text-sm text-[#737373]">No assets match your filters</p>
            <button
              onClick={clearAllFilters}
              className="mt-2 text-sm text-[#2563EB] hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#F0F0F0]">
            {filteredAssets.map(asset => {
              const Icon = FormatIcon(asset.asset_format);
              return (
                <div
                  key={asset.id}
                  className="px-6 py-4 hover:bg-[#FAFAFA] cursor-pointer transition-colors"
                  onClick={() => setSelectedAsset(asset)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-[#F5F5F5] flex-shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-[#737373]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-medium text-[#171717] truncate">
                          {asset.name}
                        </h3>
                        <StatusBadge status={asset.status} size="sm" />
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-[#737373] flex-wrap">
                        {asset.notion_phase && (
                          <span className="inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-[#7C3AED]" />
                            {asset.notion_phase}
                          </span>
                        )}
                        {asset.asset_priority && (
                          <span className={`font-medium ${
                            asset.asset_priority === 'P0' ? 'text-[#DC2626]' :
                            asset.asset_priority === 'P1' ? 'text-[#CA8A04]' : 'text-[#737373]'
                          }`}>
                            {asset.asset_priority}
                          </span>
                        )}
                        {asset.asset_format && <span>{asset.asset_format}</span>}
                        {asset.assigned_to && <span>· {asset.assigned_to}</span>}
                      </div>
                    </div>
                    {asset.notion_page_url && (
                      <a
                        href={asset.notion_page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-[#2563EB] hover:underline flex-shrink-0 mt-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Notion
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedAsset && (
        <AssetDetailModal asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#737373] mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-[#E5E5E5] focus:outline-none focus:border-[#2563EB] bg-white"
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function AssetDetailModal({ asset, onClose }: { asset: Asset; onClose: () => void }) {
  const [deps, setDeps] = useState<Partial<Asset>[]>([]);
  const [reverseDeps, setReverseDeps] = useState<Partial<Asset>[]>([]);

  useEffect(() => {
    loadDependencies();
  }, [asset]);

  const loadDependencies = async () => {
    if (!asset.dependencies || asset.dependencies.length === 0) {
      setDeps([]);
    } else {
      const { data } = await supabase
        .from('assets')
        .select('id, name, status, notion_asset_id')
        .in('notion_asset_id', asset.dependencies);
      setDeps(data || []);
    }

    if (asset.notion_asset_id) {
      const { data } = await supabase
        .from('assets')
        .select('id, name, status, notion_asset_id')
        .contains('dependencies', [asset.notion_asset_id]);
      setReverseDeps(data || []);
    }
  };

  const FormatIcon = FORMAT_ICONS[asset.asset_format?.toUpperCase() || ''] || File;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-[#E5E5E5] flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-[#F5F5F5]">
              <FormatIcon className="w-5 h-5 text-[#737373]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#171717]">{asset.name}</h2>
              <div className="flex items-center gap-3 mt-1 text-xs text-[#737373] flex-wrap">
                <StatusBadge status={asset.status} size="sm" />
                {asset.notion_phase && <span>Phase: {asset.notion_phase}</span>}
                {asset.asset_priority && <span>Priority: {asset.asset_priority}</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#F5F5F5]">
            <X className="w-5 h-5 text-[#737373]" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {asset.description && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-[#737373] mb-2">
                Description
              </h4>
              <p className="text-sm text-[#404040]">{asset.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-[#737373] mb-1">Format</p>
              <p className="text-[#171717]">{asset.asset_format || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-[#737373] mb-1">Category</p>
              <p className="text-[#171717]">{asset.asset_category || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-[#737373] mb-1">Assigned To</p>
              <p className="text-[#171717]">{asset.assigned_to || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-[#737373] mb-1">Product Layer</p>
              <p className="text-[#171717]">{asset.product_layer || '—'}</p>
            </div>
          </div>

          {deps.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-[#737373] mb-2">
                Dependencies ({deps.length})
              </h4>
              <div className="space-y-2">
                {deps.map(dep => (
                  <div key={dep.id} className="flex items-center justify-between py-2 px-3 bg-[#FAFAFA]">
                    <span className="text-sm text-[#404040]">{dep.name}</span>
                    <StatusBadge status={dep.status || 'idea'} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {reverseDeps.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-[#737373] mb-2">
                Required By ({reverseDeps.length})
              </h4>
              <div className="space-y-2">
                {reverseDeps.map(dep => (
                  <div key={dep.id} className="flex items-center justify-between py-2 px-3 bg-[#FAFAFA]">
                    <span className="text-sm text-[#404040]">{dep.name}</span>
                    <StatusBadge status={dep.status || 'idea'} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#E5E5E5] flex items-center justify-between">
          <span className="text-xs text-[#737373]">
            Updated {new Date(asset.updated_at).toLocaleDateString()}
          </span>
          {asset.notion_page_url && (
            <a
              href={asset.notion_page_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#171717] text-white text-sm hover:bg-[#404040] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View in Notion
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
