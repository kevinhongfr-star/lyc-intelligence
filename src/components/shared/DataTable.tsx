/**
 * DataTable — Generic table component
 * Mockup v14 style: clean table with hover states
 */
import React from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export function DataTable<T extends { id?: string }>({ columns, data, onRowClick, emptyMessage }: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-card shadow-card border border-border p-6 text-center text-text-muted">
        {emptyMessage || 'No data available'}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-card shadow-card border border-border overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-bg-warm border-b border-border">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left text-xxs uppercase tracking-wider font-semibold text-text-muted">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr 
              key={row.id || i}
              onClick={() => onRowClick?.(row)}
              className={`
                border-b border-border last:border-b-0
                ${onRowClick ? 'cursor-pointer hover:bg-fuchsia-light' : ''}
              `}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm text-text-primary">
                  {col.render ? col.render(row) : (row as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;