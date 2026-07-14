import React, { memo } from 'react';
import { DataTableColumn } from '@/components/shared/DataTable';

interface MemoizedTableRowProps<T extends { id: string }> {
  row: T;
  columns: DataTableColumn<T>[];
  selectable: boolean;
  selected: boolean;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
  index: number;
}

function TableRowComponent<T extends { id: string }>({
  row,
  columns,
  selectable,
  selected,
  onSelect,
  onClick,
  rowClassName,
  index,
}: MemoizedTableRowProps<T>) {
  return (
    <tr
      onClick={() => onClick?.(row)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          e.preventDefault();
          onClick(row);
        }
      }}
      tabIndex={onClick ? 0 : -1}
      role="row"
      aria-selected={selected}
      className={`
        border-b border-border last:border-b-0
        ${onClick ? 'cursor-pointer hover:bg-bg-alt/50' : ''}
        ${selected ? 'bg-primary/5' : ''}
        ${rowClassName ? rowClassName(row) : ''}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C108AB]
      `}
    >
      {selectable && (
        <td className="px-4 py-3 w-10" onClick={(e) => e.stopPropagation()} role="gridcell">
          <label className="sr-only" htmlFor={`dt-row-select-${row.id}`}>Select row</label>
          <input
            id={`dt-row-select-${row.id}`}
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(row.id, e as any)}
            className="w-4 h-4"
            aria-label={`Select row ${index + 1}`}
          />
        </td>
      )}
      {columns.map(col => (
        <td
          key={col.key}
          role="gridcell"
          className={`px-4 py-3 text-sm text-text-primary text-${col.align || 'left'}`}
        >
          {col.render ? col.render(row) : (row as any)[col.key]}
        </td>
      ))}
    </tr>
  );
}

function areRowsEqual<T extends { id: string }>(
  prevProps: MemoizedTableRowProps<T>,
  nextProps: MemoizedTableRowProps<T>
): boolean {
  if (prevProps.row.id !== nextProps.row.id) return false;
  if (prevProps.selected !== nextProps.selected) return false;
  if (prevProps.columns.length !== nextProps.columns.length) return false;
  if (prevProps.selectable !== nextProps.selectable) return false;
  if (prevProps.onClick !== nextProps.onClick) return false;
  if (prevProps.onSelect !== nextProps.onSelect) return false;
  if (prevProps.index !== nextProps.index) return false;
  return true;
}

export const MemoizedTableRow = memo(TableRowComponent as any, areRowsEqual as any) as <T extends { id: string }>(
  props: MemoizedTableRowProps<T>
) => JSX.Element;
