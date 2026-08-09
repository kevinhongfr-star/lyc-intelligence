import React, { useState, useMemo } from 'react';
import { FileText, Search, Download, Eye, Edit3, Trash2, MoreVertical, Calendar, Clock, ChevronDown, ChevronUp, Filter, Loader2 } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import type { ReportData, ReportStatus } from '@/services/reportService';

interface ReportListProps {
  reports: ReportData[];
  loading?: boolean;
  onView?: (report: ReportData) => void;
  onEdit?: (report: ReportData) => void;
  onDelete?: (reportId: string) => void;
  onExport?: (report: ReportData, format: 'PDF' | 'DOCX' | 'PNG') => void;
}

type SortField = 'title' | 'templateName' | 'createdAt' | 'status';
type SortDirection = 'asc' | 'desc';

const STATUS_COLORS: Record<ReportStatus, string> = {
  draft: 'default',
  generating: 'warning',
  completed: 'success',
  failed: 'destructive',
  scheduled: 'default',
};

const STATUS_LABELS: Record<ReportStatus, string> = {
  draft: 'Draft',
  generating: 'Generating',
  completed: 'Completed',
  failed: 'Failed',
  scheduled: 'Scheduled',
};

export function ReportList({ reports, loading, onView, onEdit, onDelete, onExport }: ReportListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const templates = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => set.add(r.templateName));
    return Array.from(set).sort();
  }, [reports]);

  const filtered = useMemo(() => {
    let result = reports.filter((r) => {
      if (search) {
        const s = search.toLowerCase();
        if (!r.title.toLowerCase().includes(s) && !r.templateName.toLowerCase().includes(s)) return false;
      }
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (templateFilter !== 'all' && r.templateName !== templateFilter) return false;
      return true;
    });

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'templateName':
          cmp = a.templateName.localeCompare(b.templateName);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'createdAt':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [reports, search, statusFilter, templateFilter, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  if (loading) {
    return (
      <div className="bg-bg border border-border p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#C108AB]" />
        <span className="ml-3 text-text-muted">Loading reports...</span>
      </div>
    );
  }

  return (
    <div className="bg-bg border border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-text-primary">Generated Reports</h2>
          <span className="text-sm text-text-muted">{filtered.length} reports</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              className="w-full pl-10 pr-4 py-2 bg-bg-alt border border-border text-text-primary focus:outline-none focus:ring-1 focus:ring-[#C108AB]"
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="bg-bg-alt border border-border px-3 py-2 text-sm text-text-primary"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All Status</option>
            {(['draft', 'generating', 'completed', 'failed', 'scheduled'] as ReportStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>

          <select
            className="bg-bg-alt border border-border px-3 py-2 text-sm text-text-primary"
            value={templateFilter}
            onChange={(e) => setTemplateFilter(e.target.value)}
          >
            <option value="all">All Templates</option>
            {templates.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center text-text-muted">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No reports found</p>
          {(search || statusFilter !== 'all' || templateFilter !== 'all') && (
            <p className="text-xs mt-1">Try adjusting your filters</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-alt">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">
                  <button onClick={() => handleSort('title')} className="flex items-center gap-1 hover:text-text-primary">
                    Title <SortIcon field="title" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">
                  <button onClick={() => handleSort('templateName')} className="flex items-center gap-1 hover:text-text-primary">
                    Template <SortIcon field="templateName" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">
                  <button onClick={() => handleSort('status')} className="flex items-center gap-1 hover:text-text-primary">
                    Status <SortIcon field="status" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">
                  <button onClick={() => handleSort('createdAt')} className="flex items-center gap-1 hover:text-text-primary">
                    Created <SortIcon field="createdAt" />
                  </button>
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((report) => (
                <React.Fragment key={report.id}>
                  <tr className="border-b border-border hover:bg-bg-alt transition-colors">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                        className="flex items-center gap-2 text-left w-full"
                      >
                        {expandedId === report.id ? <ChevronDown className="w-4 h-4 text-[#C108AB]" /> : <ChevronRight className="w-4 h-4 text-text-muted" />}
                        <FileText className="w-4 h-4 text-[#C108AB]" />
                        <span className="font-medium text-text-primary">{report.title}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted">{report.templateName}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_COLORS[report.status] as any}>
                        {STATUS_LABELS[report.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(report.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 relative">
                        {onView && (
                          <button
                            onClick={() => onView(report)}
                            className="p-2 hover:bg-bg"
                            title="View"
                          >
                            <Eye className="w-4 h-4 text-text-muted" />
                          </button>
                        )}
                        {onEdit && report.status === 'completed' && (
                          <button
                            onClick={() => onEdit(report)}
                            className="p-2 hover:bg-bg"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4 text-text-muted" />
                          </button>
                        )}
                        <button
                          onClick={() => setMenuOpenId(menuOpenId === report.id ? null : report.id)}
                          className="p-2 hover:bg-bg"
                          title="More"
                        >
                          <MoreVertical className="w-4 h-4 text-text-muted" />
                        </button>
                        {menuOpenId === report.id && (
                          <div className="absolute right-0 top-full mt-1 bg-bg border border-border shadow-lg z-10 min-w-[150px]">
                            {onExport && (
                              <>
                                <button onClick={() => { onExport(report, 'PDF'); setMenuOpenId(null); }} className="w-full text-left px-3 py-2 text-sm hover:bg-bg-alt flex items-center gap-2">
                                  <Download className="w-4 h-4" /> Export PDF
                                </button>
                                <button onClick={() => { onExport(report, 'DOCX'); setMenuOpenId(null); }} className="w-full text-left px-3 py-2 text-sm hover:bg-bg-alt flex items-center gap-2">
                                  <Download className="w-4 h-4" /> Export DOCX
                                </button>
                              </>
                            )}
                            {onDelete && (
                              <button onClick={() => { onDelete(report.id); setMenuOpenId(null); }} className="w-full text-left px-3 py-2 text-sm hover:bg-red-500/10 text-red-500 flex items-center gap-2">
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === report.id && (
                    <tr className="bg-bg-alt">
                      <td colSpan={5} className="px-4 py-4">
                        <div className="text-sm text-text-muted">
                          <p><strong>Template:</strong> {report.templateName}</p>
                          <p><strong>Format:</strong> {report.format}</p>
                          <p><strong>Sections:</strong> {report.sections.length}</p>
                          <p><strong>Created:</strong> {new Date(report.createdAt).toLocaleString()}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
