/**
 * Design system: Table
 *
 * Consolidates shared/DataTable into the design system with strict typing
 * (no `any`) and a richer API:
 *   - Generic over the row type
 *   - `columns` with `key`, `header`, `render`, `width`, `align`
 *   - Optional `loading` (renders a table skeleton)
 *   - Optional `emptyState` (renders EmptyState when data is empty)
 *   - Optional `onRowClick`
 *   - Row key extractor (defaults to `row.id`)
 *
 * The legacy `Column<T> = { key, header, render }` shape is preserved.
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { EmptyState } from './EmptyState';
import { Skeleton } from './Skeleton';

export type ColumnAlign = 'left' | 'center' | 'right';

export interface Column<T> {
  /** Property key on T — used when no `render` is supplied. */
  key: string;
  header: React.ReactNode;
  /** Custom cell renderer. */
  render?: (row: T, index: number) => React.ReactNode;
  /** Optional fixed width (CSS value). */
  width?: string | number;
  /** Cell + header alignment. Defaults to `left`. */
  align?: ColumnAlign;
  /** Optional className applied to both header and body cells. */
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  /** Unique row key extractor. Defaults to `row.id ?? index`. */
  rowKey?: (row: T, index: number) => string;
  onRowClick?: (row: T, index: number) => void;
  emptyMessage?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  /** Renders N skeleton rows in place of data. */
  loading?: boolean;
  loadingRows?: number;
  /** Sticky header. */
  stickyHeader?: boolean;
  /** Optional className on the wrapping container. */
  className?: string;
}

const ALIGN: Record<ColumnAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  rowKey,
  onRowClick,
  emptyMessage = 'No data available',
  emptyActionLabel,
  onEmptyAction,
  loading = false,
  loadingRows = 5,
  stickyHeader = false,
  className,
}: TableProps<T>) {
  const defaultRowKey = (row: T, index: number): string => {
    const id = row.id;
    return typeof id === 'string' ? id : String(index);
  };
  const resolveKey = rowKey ?? defaultRowKey;

  if (loading) {
    return (
      <div className={cn('bg-bg-secondary border border-bg-tertiary', className)}>
        <table className="w-full">
          <thead>
            <tr className="bg-bg-tertiary border-b border-bg-tertiary">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-xxs uppercase tracking-wider font-semibold text-text-muted"
                  style={{ width: col.width, textAlign: col.align ?? 'left' }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: loadingRows }).map((_, i) => (
              <tr key={i} className="border-b border-bg-tertiary last:border-b-0">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn('bg-bg-secondary border border-bg-tertiary', className)}>
        <EmptyState
          title={emptyMessage}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
        />
      </div>
    );
  }

  return (
    <div className={cn('bg-bg-secondary border border-bg-tertiary overflow-x-auto', className)}>
      <table className="w-full min-w-[640px]">
        <thead>
          <tr
            className={cn(
              'bg-bg-tertiary border-b border-bg-tertiary',
              stickyHeader && 'sticky top-0 z-10',
            )}
          >
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-xxs uppercase tracking-wider font-semibold text-text-muted',
                  ALIGN[col.align ?? 'left'],
                  col.className,
                )}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={resolveKey(row, index)}
              onClick={onRowClick ? () => onRowClick(row, index) : undefined}
              className={cn(
                'border-b border-bg-tertiary last:border-b-0',
                onRowClick && 'cursor-pointer hover:bg-bg-tertiary',
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-sm text-text-primary',
                    ALIGN[col.align ?? 'left'],
                    col.className,
                  )}
                >
                  {col.render
                    ? col.render(row, index)
                    : (row[col.key] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
