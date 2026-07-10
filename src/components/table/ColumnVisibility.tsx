import React, { useState, useEffect, useRef } from 'react';
import { Columns3, Check } from 'lucide-react';

export interface ColumnDef {
  key: string;
  label: string;
  defaultVisible?: boolean;
}

interface ColumnVisibilityProps {
  columns: ColumnDef[];
  visibleColumns: Set<string>;
  onToggle: (key: string) => void;
  storageKey: string;
}

export function ColumnVisibility({ columns, visibleColumns, onToggle, storageKey }: ColumnVisibilityProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const visibleCount = visibleColumns.size;
  const totalCount = columns.length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={"px-3 py-2 text-sm font-medium border transition-all flex items-center gap-2 " +
          (open ? "bg-[#C108AB]/5 border-[#C108AB]/30 text-[#C108AB]" : "text-[#404040] bg-white border-[#E5E5E5] hover:bg-[#F5F5F5]")}
      >
        <Columns3 className="w-4 h-4" />
        Columns
        <span className="text-xs text-[#A3A3A3]">{visibleCount}/{totalCount}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-[#E5E5E5] shadow-lg z-50">
          <div className="px-3 py-2 border-b border-[#E5E5E5] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#737373] uppercase tracking-wider">Toggle Columns</span>
            <button
              onClick={() => {
                columns.forEach(col => {
                  const shouldBeVisible = col.defaultVisible !== false;
                  if (shouldBeVisible && !visibleColumns.has(col.key)) onToggle(col.key);
                  if (!shouldBeVisible && visibleColumns.has(col.key)) onToggle(col.key);
                });
              }}
              className="text-xs text-[#C108AB] hover:text-[#A00798]"
            >
              Reset
            </button>
          </div>
          <div className="py-1 max-h-64 overflow-y-auto">
            {columns.map(col => (
              <button
                key={col.key}
                onClick={() => onToggle(col.key)}
                className="w-full px-3 py-2 flex items-center gap-3 hover:bg-[#FAFAFA] transition-colors text-left"
              >
                <div className={"w-4 h-4 border flex items-center justify-center transition-colors " +
                  (visibleColumns.has(col.key) ? "bg-[#C108AB] border-[#C108AB]" : "border-[#D4D4D4]")}>
                  {visibleColumns.has(col.key) && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className={"text-sm " + (visibleColumns.has(col.key) ? "text-[#171717]" : "text-[#A3A3A3]")}>
                  {col.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function useColumnVisibility(storageKey: string, columns: ColumnDef[]) {
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    return new Set(columns.filter(c => c.defaultVisible !== false).map(c => c.key));
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(Array.from(visibleColumns)));
  }, [visibleColumns, storageKey]);

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return { visibleColumns, toggleColumn };
}
