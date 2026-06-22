import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Plus, Loader2, Filter, Download, Archive, 
  CheckSquare, Square, ChevronDown, X, Briefcase, 
  Users, TrendingUp, Calendar, MoreVertical
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { useMandates } from '@/hooks/useSupabaseData';
import { updateMandateStatus, bulkUpdateMandateStatus } from '@/services/supabaseApi';
import { PIPELINE_STAGES, PIPELINE_STAGE_ORDER } from '@/types/pipelineStages';
import type { Mandate } from '@/services/supabaseApi';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: '1_search', label: 'Active Search', color: '#00897B' },
  { value: '2_call', label: 'Canvas', color: '#F59E0B' },
  { value: '3_deliver', label: 'Deliver', color: '#10B981' },
  { value: 'on_hold', label: 'On Hold', color: '#F59E0B' },
  { value: 'won', label: 'Won', color: '#22C55E' },
  { value: 'lost', label: 'Lost', color: '#EF4444' },
  { value: 'completed', label: 'Completed', color: '#6B7280' },
];

const BULK_ACTIONS = [
  { value: 'archive', label: 'Archive', icon: Archive },
  { value: 'on_hold', label: 'Set On Hold', icon: X },
  { value: 'won', label: 'Mark as Won', icon: CheckSquare },
];

interface MandatesPageProps {
  onCreateMandate?: () => void;
}

export function MandatesPageEnhanced({ onCreateMandate }: MandatesPageProps) {
  const navigate = useNavigate();
  const { data: mandates, count, loading, error } = useMandates({ limit: 200 });
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [consultantFilter, setConsultantFilter] = useState('');
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  // Sorting
  const [sortBy, setSortBy] = useState<'title' | 'status' | 'created_at' | 'score'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  
  // Unique consultants for filter
  const consultants = useMemo(() => {
    const names = new Set<string>();
    mandates.forEach(m => {
      // Extract consultant name from mandate if available
      if (m.intake_data?.consultant) {
        names.add(m.intake_data.consultant);
      }
    });
    return Array.from(names).sort();
  }, [mandates]);

  // Filter and sort mandates
  const filteredMandates = useMemo(() => {
    let result = mandates;
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(m => 
        m.title?.toLowerCase().includes(searchLower) ||
        m.company?.name?.toLowerCase().includes(searchLower) ||
        m.keywords?.toLowerCase().includes(searchLower)
      );
    }
    
    // Status filter
    if (statusFilter) {
      result = result.filter(m => m.status === statusFilter);
    }
    
    // Sort
    result = [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'score':
          const scoreA = a.intake_data?.match_score_avg || 0;
          const scoreB = b.intake_data?.match_score_avg || 0;
          comparison = scoreA - scoreB;
          break;
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [mandates, search, statusFilter, sortBy, sortDir]);

  // Selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredMandates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMandates.map(m => m.id)));
    }
  };

  // Bulk action handler
  const handleBulkAction = async (action: string) => {
    if (selectedIds.size === 0) return;
    
    setUpdating(true);
    try {
      if (action === 'archive') {
        // Archive would be a soft delete - set status to completed
        await bulkUpdateMandateStatus(Array.from(selectedIds), 'completed');
      } else {
        await bulkUpdateMandateStatus(Array.from(selectedIds), action);
      }
      setSelectedIds(new Set());
      setShowBulkActions(false);
      window.location.reload();
    } catch (err) {
      console.error('Bulk action failed:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Title', 'Client', 'Status', 'Pipeline Count', 'Avg Score', 'Created Date'];
    const rows = filteredMandates.map(m => [
      m.title || 'Untitled',
      m.company?.name || 'No client',
      m.status || '',
      String(m.total_candidates || 0),
      String(m.intake_data?.match_score_avg || 'N/A'),
      new Date(m.created_at).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mandates-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get status info
  const getStatusInfo = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status) || { label: status, color: '#6B7280' };
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">Mandates</h1>
          <p className="text-text-muted">
            {filteredMandates.length} of {count ?? mandates.length} mandates
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg text-sm font-medium hover:bg-bg-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => navigate('/platform/mandates/new')}
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Mandate
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            placeholder="Search by title, client, keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-bg-secondary border border-bg-tertiary rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-bg-secondary border border-bg-tertiary rounded-lg text-sm text-text-primary px-3 py-2.5 min-h-[44px]"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Consultant Filter */}
        {consultants.length > 0 && (
          <select
            value={consultantFilter}
            onChange={(e) => setConsultantFilter(e.target.value)}
            className="bg-bg-secondary border border-bg-tertiary rounded-lg text-sm text-text-primary px-3 py-2.5 min-h-[44px]"
          >
            <option value="">All Consultants</option>
            {consultants.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        {/* Clear Filters */}
        {(search || statusFilter || consultantFilter) && (
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setConsultantFilter('');
            }}
            className="px-3 py-2.5 text-sm text-text-muted hover:text-text-primary flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-accent/10 border border-accent/30 rounded-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-accent">
              {selectedIds.size} selected
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-text-muted hover:text-text-primary"
            >
              Clear selection
            </button>
          </div>
          <div className="flex items-center gap-2">
            {BULK_ACTIONS.map((action) => (
              <button
                key={action.value}
                onClick={() => handleBulkAction(action.value)}
                disabled={updating}
                className="px-3 py-1.5 bg-white border border-accent/30 rounded-lg text-sm text-text-primary hover:bg-accent hover:text-white flex items-center gap-1 disabled:opacity-50"
              >
                {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <action.icon className="w-3 h-3" />}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table View */}
      <div className="bg-bg-secondary border border-bg-tertiary rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bg-tertiary">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={toggleSelectAll}
                    className="text-text-muted hover:text-text-primary"
                  >
                    {selectedIds.size === filteredMandates.length && filteredMandates.length > 0 ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                  <button
                    onClick={() => { setSortBy('title'); setSortDir(sortBy === 'title' && sortDir === 'asc' ? 'desc' : 'asc'); }}
                    className="flex items-center gap-1 hover:text-text-primary"
                  >
                    Mandate
                    {sortBy === 'title' && <ChevronDown className={`w-3 h-3 ${sortDir === 'asc' ? 'rotate-180' : ''}`} />}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Client</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                  <button
                    onClick={() => { setSortBy('status'); setSortDir(sortBy === 'status' && sortDir === 'asc' ? 'desc' : 'asc'); }}
                    className="flex items-center gap-1 hover:text-text-primary"
                  >
                    Status
                    {sortBy === 'status' && <ChevronDown className={`w-3 h-3 ${sortDir === 'asc' ? 'rotate-180' : ''}`} />}
                  </button>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">Pipeline</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">
                  <button
                    onClick={() => { setSortBy('score'); setSortDir(sortBy === 'score' && sortDir === 'asc' ? 'desc' : 'asc'); }}
                    className="flex items-center gap-1 mx-auto hover:text-text-primary"
                  >
                    Avg Score
                    {sortBy === 'score' && <ChevronDown className={`w-3 h-3 ${sortDir === 'asc' ? 'rotate-180' : ''}`} />}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                  <button
                    onClick={() => { setSortBy('created_at'); setSortDir(sortBy === 'created_at' && sortDir === 'asc' ? 'desc' : 'asc'); }}
                    className="flex items-center gap-1 hover:text-text-primary"
                  >
                    Created
                    {sortBy === 'created_at' && <ChevronDown className={`w-3 h-3 ${sortDir === 'asc' ? 'rotate-180' : ''}`} />}
                  </button>
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-tertiary">
              {filteredMandates.map((mandate) => {
                const statusInfo = getStatusInfo(mandate.status);
                const avgScore = mandate.intake_data?.match_score_avg;
                
                return (
                  <tr 
                    key={mandate.id}
                    className="hover:bg-bg-tertiary/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/platform/mandates/${mandate.id}`)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleSelect(mandate.id)}
                        className="text-text-muted hover:text-text-primary"
                      >
                        {selectedIds.has(mandate.id) ? (
                          <CheckSquare className="w-4 h-4 text-accent" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                          <Briefcase className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{mandate.title || 'Untitled'}</p>
                          <p className="text-xs text-text-muted">
                            {mandate.keywords ? mandate.keywords.split(',').slice(0, 3).join(', ') : 'No keywords'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {mandate.company?.name || 'No client'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        style={{ backgroundColor: `${statusInfo.color}20`, color: statusInfo.color }}
                        className="px-2 py-1 text-xs font-medium rounded"
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="w-3 h-3 text-text-muted" />
                        <span className="text-sm text-text-secondary">{mandate.total_candidates || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {avgScore ? (
                        <span 
                          className="inline-flex items-center gap-1 text-sm font-medium"
                          style={{ color: avgScore >= 75 ? '#22C55E' : avgScore >= 50 ? '#EAB308' : '#EF4444' }}
                        >
                          <TrendingUp className="w-3 h-3" />
                          {avgScore}
                        </span>
                      ) : (
                        <span className="text-text-muted text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-text-secondary">
                        <Calendar className="w-3 h-3" />
                        {formatDate(mandate.created_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/platform/mandates/${mandate.id}`)}
                          className="px-3 py-1.5 text-xs bg-accent/10 text-accent rounded-lg hover:bg-accent hover:text-white"
                        >
                          View
                        </button>
                        <button
                          onClick={() => navigate(`/platform/mandates/${mandate.id}/pipeline`)}
                          className="px-3 py-1.5 text-xs bg-bg-tertiary text-text-secondary rounded-lg hover:bg-bg-secondary"
                        >
                          Pipeline
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {filteredMandates.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                    No mandates found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default MandatesPageEnhanced;
