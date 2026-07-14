import React, { useState } from 'react';
import {
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  Check,
  RotateCcw,
  Search,
} from 'lucide-react';
import { Input } from '@/components/ui';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterGroup {
  id: string;
  label: string;
  type: 'checkbox' | 'radio' | 'range' | 'search';
  options?: FilterOption[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  defaultOpen?: boolean;
}

export interface FilterSidebarProps {
  groups: FilterGroup[];
  filters: Record<string, string[] | string>;
  onChange: (filters: Record<string, string[] | string>) => void;
  onClear: () => void;
  title?: string;
  className?: string;
}

export function FilterSidebar({
  groups,
  filters,
  onChange,
  onClear,
  title = 'Filters',
  className = '',
}: FilterSidebarProps) {
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    new Set(groups.filter(g => g.defaultOpen !== false).map(g => g.id))
  );

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleCheckboxChange = (groupId: string, value: string) => {
    const current = (filters[groupId] as string[]) || [];
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onChange({ ...filters, [groupId]: next.length > 0 ? next : [] });
  };

  const handleRadioChange = (groupId: string, value: string) => {
    const current = filters[groupId] as string;
    const next = current === value ? '' : value;
    onChange({ ...filters, [groupId]: next });
  };

  const handleSearchChange = (groupId: string, value: string) => {
    onChange({ ...filters, [groupId]: value });
  };

  const getActiveFilterCount = (): number => {
    return Object.values(filters).reduce((count, value) => {
      if (Array.isArray(value)) return count + value.length;
      if (typeof value === 'string' && value) return count + 1;
      return count;
    }, 0);
  };

  const activeCount = getActiveFilterCount();

  return (
    <div className={`bg-white border border-border rounded-none ${className}`}>
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-muted" />
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 bg-primary text-white text-xs font-medium rounded-full">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>

      <div className="divide-y divide-border">
        {groups.map(group => (
          <div key={group.id}>
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-bg-alt/50 transition-colors"
            >
              <span className="text-sm font-medium text-text-primary">{group.label}</span>
              {openGroups.has(group.id) ? (
                <ChevronUp className="w-4 h-4 text-text-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-text-muted" />
              )}
            </button>

            {openGroups.has(group.id) && (
              <div className="px-4 pb-4 space-y-2">
                {group.type === 'search' && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <Input
                      type="text"
                      placeholder={group.placeholder || 'Search...'}
                      value={(filters[group.id] as string) || ''}
                      onChange={(e) => handleSearchChange(group.id, e.target.value)}
                      className="pl-9"
                    />
                  </div>
                )}

                {group.type === 'checkbox' && group.options?.map(option => {
                  const current = (filters[group.id] as string[]) || [];
                  const isChecked = current.includes(option.value);
                  return (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 cursor-pointer hover:bg-bg-alt/30 px-2 py-1.5 -mx-2 rounded-none transition-colors"
                    >
                      <div
                        className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-primary border-primary'
                            : 'border-gray-300'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm text-text-primary flex-1">{option.label}</span>
                      {option.count !== undefined && (
                        <span className="text-xs text-text-muted">{option.count}</span>
                      )}
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCheckboxChange(group.id, option.value)}
                        className="sr-only"
                      />
                    </label>
                  );
                })}

                {group.type === 'radio' && group.options?.map(option => {
                  const isChecked = filters[group.id] === option.value;
                  return (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 cursor-pointer hover:bg-bg-alt/30 px-2 py-1.5 -mx-2 rounded-none transition-colors"
                    >
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                          isChecked
                            ? 'border-primary'
                            : 'border-gray-300'
                        }`}
                      >
                        {isChecked && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <span className="text-sm text-text-primary flex-1">{option.label}</span>
                      {option.count !== undefined && (
                        <span className="text-xs text-text-muted">{option.count}</span>
                      )}
                      <input
                        type="radio"
                        checked={isChecked}
                        onChange={() => handleRadioChange(group.id, option.value)}
                        className="sr-only"
                      />
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default FilterSidebar;
