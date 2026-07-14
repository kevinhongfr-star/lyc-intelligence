import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  Check,
  Download,
  Filter,
  Search,
  Trash2,
  MoreHorizontal,
  Save,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortKey?: string;
  width?: string;
  defaultVisible?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T extends { id: string }> {
  columns: DataTableColumn<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  emptyCta?: { label: string; onClick: () => void };
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  bulkActions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: (selectedIds: string[]) => void;
    variant?: 'default' | 'danger';
  }>;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  sortable?: boolean;
  defaultSort?: { key: string; direction: 'asc' | 'desc' };
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  paginated?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  totalCount?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  columnVisibility?: boolean;
  columnVisibilityStorageKey?: string;
  csvExport?: boolean;
  csvFilename?: string;
  onCsvExport?: () => void;
  savedViews?: boolean;
  views?: Array<{ id: string; name: string; isDefault?: boolean }>;
  currentView?: string;
  onViewChange?: (viewId: string) => void;
  onSaveView?: (name: string) => void;
  loading?: boolean;
  rowClassName?: (row: T) => string;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No data available',
  emptyCta,
  selectable = false,
  selectedIds: externalSelectedIds,
  onSelectionChange,
  bulkActions = [],
  searchable = false,
  searchPlaceholder = 'Search...',
  onSearch,
  sortable = true,
  defaultSort,
  onSort,
  paginated = false,
  pageSize = 20,
  pageSizeOptions = [20, 50, 100],
  totalCount,
  page: externalPage,
  onPageChange,
  onPageSizeChange,
  columnVisibility = true,
  columnVisibilityStorageKey,
  csvExport = false,
  csvFilename = 'export.csv',
  onCsvExport,
  savedViews = false,
  views = [],
  currentView,
  onViewChange,
  onSaveView,
  loading = false,
  rowClassName,
}: DataTableProps<T>) {
  const [internalSelected, setInternalSelected] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortState, setSortState] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    defaultSort || null
  );
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(pageSize);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [showSaveViewDialog, setShowSaveViewDialog] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    if (columnVisibilityStorageKey) {
      try {
        const saved = localStorage.getItem(columnVisibilityStorageKey);
        if (saved) return new Set(JSON.parse(saved));
      } catch {}
    }
    return new Set(columns.filter(c => c.defaultVisible !== false).map(c => c.key));
  });

  const columnMenuRef = useRef<HTMLDivElement>(null);
  const viewMenuRef = useRef<HTMLDivElement>(null);

  const selectedIds = externalSelectedIds || internalSelected;
  const page = externalPage || internalPage;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node)) {
        setShowColumnMenu(false);
      }
      if (viewMenuRef.current && !viewMenuRef.current.contains(e.target as Node)) {
        setShowViewMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (columnVisibilityStorageKey && visibleColumns) {
      localStorage.setItem(columnVisibilityStorageKey, JSON.stringify(Array.from(visibleColumns)));
    }
  }, [visibleColumns, columnVisibilityStorageKey]);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === data.length) {
      const newSet = new Set<string>();
      setInternalSelected(newSet);
      onSelectionChange?.(newSet);
    } else {
      const newSet = new Set(data.map(d => d.id));
      setInternalSelected(newSet);
      onSelectionChange?.(newSet);
    }
  }, [data, selectedIds.size, onSelectionChange]);

  const handleSelectRow = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setInternalSelected(next);
    onSelectionChange?.(next);
  }, [selectedIds, onSelectionChange]);

  const handleSort = useCallback((key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortState?.key === key) {
      direction = sortState.direction === 'asc' ? 'desc' : 'asc';
    }
    const newSort = { key, direction };
    setSortState(newSort);
    onSort?.(key, direction);
  }, [sortState, onSort]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  }, [onSearch]);

  const handlePageChange = useCallback((newPage: number) => {
    setInternalPage(newPage);
    onPageChange?.(newPage);
  }, [onPageChange]);

  const handlePageSizeChange = useCallback((size: number) => {
    setInternalPageSize(size);
    setInternalPage(1);
    onPageSizeChange?.(size);
  }, [onPageSizeChange]);

  const toggleColumn = useCallback((key: string) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const resetColumns = useCallback(() => {
    setVisibleColumns(new Set(columns.filter(c => c.defaultVisible !== false).map(c => c.key)));
  }, [columns]);

  const handleCsvExport = useCallback(() => {
    if (onCsvExport) {
      onCsvExport();
      return;
    }
    const headers = visibleColumns
      .map(key => columns.find(c => c.key === key)?.header || key)
      .join(',');
    const rows = data.map(row =>
      Array.from(visibleColumns)
        .map(key => {
          const col = columns.find(c => c.key === key);
          const value = col?.render ? '' : (row as any)[key];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        })
        .join(',')
    ).join('\n');
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = csvFilename;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [data, visibleColumns, columns, csvFilename, onCsvExport]);

  const displayColumns = useMemo(
    () => columns.filter(c => visibleColumns.has(c.key)),
    [columns, visibleColumns]
  );

  const total = totalCount ?? data.length;
  const totalPages = Math.ceil(total / internalPageSize);
  const startItem = (page - 1) * internalPageSize + 1;
  const endItem = Math.min(page * internalPageSize, total);

  const allSelected = data.length > 0 && selectedIds.size === data.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  if (loading) {
    return (
      <div className="bg-white rounded-card shadow-card border border-border p-12 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-bg-alt rounded w-1/3 mx-auto" />
          <div className="h-4 bg-bg-alt rounded w-1/2 mx-auto" />
          <div className="h-4 bg-bg-alt rounded w-1/4 mx-auto" />
        </div>
      </div>
    );
  }

  if (data.length === 0 && !searchable) {
    return (
      <div className="bg-white rounded-card shadow-card border border-border p-12 text-center">
        <p className="text-text-muted mb-4">{emptyMessage}</p>
        {emptyCta && (
          <Button onClick={emptyCta.onClick}>{emptyCta.label}</Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-card shadow-card border border-border overflow-hidden">
      {(searchable || selectable || bulkActions.length > 0 || columnVisibility || csvExport || savedViews) && (
        <div className="px-4 py-3 border-b border-border flex items-center gap-3 flex-wrap">
          {searchable && (
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <label htmlFor="dt-search" className="sr-only">Search table</label>
              <Input
                id="dt-search"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={searchPlaceholder}
                className="pl-9"
                aria-label="Search table"
              />
            </div>
          )}

          <div className="flex-1" />

          {savedViews && views.length > 0 && (
            <div ref={viewMenuRef} className="relative">
              <button
                onClick={() => setShowViewMenu(!showViewMenu)}
                className="px-3 py-2 text-sm font-medium border border-border bg-white hover:bg-bg-alt flex items-center gap-2"
              >
                <Eye className="w-4 h-4 text-text-muted" />
                <span>{views.find(v => v.id === currentView)?.name || 'Default'}</span>
                <ChevronDown className="w-4 h-4 text-text-muted" />
              </button>
              {showViewMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-border shadow-lg z-50">
                  {views.map(view => (
                    <button
                      key={view.id}
                      onClick={() => {
                        onViewChange?.(view.id);
                        setShowViewMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-bg-alt flex items-center justify-between"
                    >
                      <span>{view.name}</span>
                      {view.isDefault && <span className="text-xs text-text-muted">Default</span>}
                    </button>
                  ))}
                  <div className="border-t border-border" />
                  <button
                    onClick={() => {
                      setShowSaveViewDialog(true);
                      setShowViewMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-bg-alt flex items-center gap-2 text-primary"
                  >
                    <Save className="w-4 h-4" />
                    Save current view
                  </button>
                </div>
              )}
            </div>
          )}

          {csvExport && (
            <button
              onClick={handleCsvExport}
              className="px-3 py-2 text-sm font-medium border border-border bg-white hover:bg-bg-alt flex items-center gap-2"
              title="Export CSV"
            >
              <Download className="w-4 h-4 text-text-muted" />
              Export
            </button>
          )}

          {columnVisibility && (
            <div ref={columnMenuRef} className="relative">
              <button
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="px-3 py-2 text-sm font-medium border border-border bg-white hover:bg-bg-alt flex items-center gap-2"
                title="Toggle columns"
              >
                <Columns3 className="w-4 h-4 text-text-muted" />
                Columns
                <span className="text-xs text-text-muted">
                  {displayColumns.length}/{columns.length}
                </span>
              </button>
              {showColumnMenu && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-border shadow-lg z-50">
                  <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Toggle Columns
                    </span>
                    <button
                      onClick={resetColumns}
                      className="text-xs text-primary hover:text-primary/80"
                    >
                      Reset
                    </button>
                  </div>
                  <div className="py-1 max-h-64 overflow-y-auto">
                    {columns.map(col => (
                      <button
                        key={col.key}
                        onClick={() => toggleColumn(col.key)}
                        className="w-full px-3 py-2 flex items-center gap-3 hover:bg-bg-alt transition-colors text-left"
                      >
                        <div
                          className={`w-4 h-4 border flex items-center justify-center transition-colors ${
                            visibleColumns.has(col.key)
                              ? 'bg-primary border-primary'
                              : 'border-gray-300'
                          }`}
                        >
                          {visibleColumns.has(col.key) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span
                          className={`text-sm ${
                            visibleColumns.has(col.key) ? 'text-text-primary' : 'text-text-muted'
                          }`}
                        >
                          {col.header}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {selectable && selectedIds.size > 0 && bulkActions.length > 0 && (
        <div className="px-4 py-2 bg-primary/5 border-b border-border flex items-center gap-3">
          <span className="text-sm font-medium text-text-primary">
            {selectedIds.size} selected
          </span>
          <div className="flex-1" />
          {bulkActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => action.onClick(Array.from(selectedIds))}
              className={`px-3 py-1.5 text-sm font-medium border flex items-center gap-1.5 ${
                action.variant === 'danger'
                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                  : 'border-border text-text-primary hover:bg-bg-alt'
              }`}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-x-auto" role="region" aria-label="Data table" tabIndex={0}>
        <table className="w-full" role="grid">
          <thead>
            <tr className="bg-bg-alt border-b border-border">
              {selectable && (
                <th className="px-4 py-3 w-10" scope="col">
                  <label className="sr-only" htmlFor="dt-select-all">Select all rows</label>
                  <input
                    id="dt-select-all"
                    type="checkbox"
                    checked={allSelected}
                    ref={el => el && (el.indeterminate = someSelected)}
                    onChange={handleSelectAll}
                    className="w-4 h-4"
                    aria-label={allSelected ? 'Deselect all rows' : 'Select all rows'}
                  />
                </th>
              )}
              {displayColumns.map(col => (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={sortState?.key === (col.sortKey || col.key) ? (sortState.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                  className={`px-4 py-3 text-${col.align || 'left'} text-xxs uppercase tracking-wider font-semibold text-text-muted ${
                    col.sortable !== false && sortable ? 'cursor-pointer hover:bg-bg-alt/80 select-none' : ''
                  }`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable !== false && sortable && handleSort(col.sortKey || col.key)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && col.sortable !== false && sortable) {
                      e.preventDefault();
                      handleSort(col.sortKey || col.key);
                    }
                  }}
                  tabIndex={col.sortable !== false && sortable ? 0 : -1}
                  role="columnheader"
                >
                  <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : ''}`}>
                    {col.header}
                    {col.sortable !== false && sortable && sortState?.key === (col.sortKey || col.key) && (
                      sortState.direction === 'asc' ? (
                        <ChevronUp className="w-3 h-3" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="w-3 h-3" aria-hidden="true" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={displayColumns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center text-text-muted"
                  role="gridcell"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={row.id || i}
                  onClick={() => onRowClick?.(row)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && onRowClick) {
                      e.preventDefault();
                      onRowClick(row);
                    }
                  }}
                  tabIndex={onRowClick ? 0 : -1}
                  role="row"
                  aria-selected={selectedIds.has(row.id)}
                  className={`
                    border-b border-border last:border-b-0
                    ${onRowClick ? 'cursor-pointer hover:bg-bg-alt/50' : ''}
                    ${selectedIds.has(row.id) ? 'bg-primary/5' : ''}
                    ${rowClassName ? rowClassName(row) : ''}
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C108AB]
                  `}
                >
                  {selectable && (
                    <td className="px-4 py-3 w-10" onClick={(e) => e.stopPropagation()} role="gridcell">
                      <label className="sr-only" htmlFor={`dt-select-${row.id}`}>Select row</label>
                      <input
                        id={`dt-select-${row.id}`}
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={(e) => handleSelectRow(row.id, e as any)}
                        className="w-4 h-4"
                        aria-label={`Select row ${i + 1}`}
                      />
                    </td>
                  )}
                  {displayColumns.map(col => (
                    <td
                      key={col.key}
                      role="gridcell"
                      className={`px-4 py-3 text-sm text-text-primary text-${col.align || 'left'}`}
                    >
                      {col.render ? col.render(row) : (row as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {paginated && total > 0 && (
        <div className="px-4 py-3 border-t border-border flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 text-sm text-text-muted">
            <span>
              Showing <span className="font-medium text-text-primary">{startItem}</span>–
              <span className="font-medium text-text-primary">{endItem}</span> of{' '}
              <span className="font-medium text-text-primary">{total}</span>
            </span>
            <select
              value={internalPageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-2 py-1 border border-border text-sm bg-white"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size} / page</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(1)}
              disabled={page === 1}
              className="p-1.5 hover:bg-bg-alt disabled:opacity-40 disabled:cursor-not-allowed"
              title="First page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="p-1.5 hover:bg-bg-alt disabled:opacity-40 disabled:cursor-not-allowed"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm text-text-muted">
              Page <span className="font-medium text-text-primary">{page}</span> of{' '}
              <span className="font-medium text-text-primary">{totalPages || 1}</span>
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 hover:bg-bg-alt disabled:opacity-40 disabled:cursor-not-allowed"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={page >= totalPages}
              className="p-1.5 hover:bg-bg-alt disabled:opacity-40 disabled:cursor-not-allowed"
              title="Last page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showSaveViewDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Save View</h3>
            <p className="text-sm text-text-muted mb-4">
              Save the current filters, columns, and sort as a saved view.
            </p>
            <Input
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder="View name"
              className="mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowSaveViewDialog(false);
                  setNewViewName('');
                }}
                className="px-4 py-2 text-sm font-medium border border-border hover:bg-bg-alt"
              >
                Cancel
              </button>
              <Button
                onClick={() => {
                  if (newViewName.trim()) {
                    onSaveView?.(newViewName.trim());
                    setShowSaveViewDialog(false);
                    setNewViewName('');
                  }
                }}
                disabled={!newViewName.trim()}
              >
                Save View
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
