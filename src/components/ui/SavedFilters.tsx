import React, { useState, useEffect } from 'react';
import {
  BookmarkPlus,
  Bookmark,
  Trash2,
  Check,
  X,
  MoreHorizontal,
  ChevronDown,
  Edit3,
  Save,
} from 'lucide-react';
import { Input } from '@/components/ui';

export interface SavedFilter {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
}

export interface SavedFiltersProps {
  filters: SavedFilter[];
  currentFilters: Record<string, unknown>;
  currentViewId?: string;
  onSelect: (filter: SavedFilter) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, name: string) => void;
  onSetDefault?: (id: string) => void;
  storageKey?: string;
  className?: string;
}

export function SavedFilters({
  filters,
  currentFilters,
  currentViewId,
  onSelect,
  onSave,
  onDelete,
  onUpdate,
  onSetDefault,
  className = '',
}: SavedFiltersProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const hasChanges = filters.some(f => {
    if (f.id !== currentViewId) return false;
    return JSON.stringify(f.filters) !== JSON.stringify(currentFilters);
  });

  const handleSave = () => {
    if (newFilterName.trim()) {
      onSave(newFilterName.trim());
      setNewFilterName('');
      setShowSaveDialog(false);
    }
  };

  const startEditing = (filter: SavedFilter) => {
    setEditingId(filter.id);
    setEditName(filter.name);
    setOpenMenu(null);
  };

  const handleUpdate = (id: string) => {
    if (editName.trim()) {
      onUpdate(id, editName.trim());
      setEditingId(null);
      setEditName('');
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Saved Filters
        </span>
        <button
          type="button"
          onClick={() => setShowSaveDialog(true)}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
        >
          <BookmarkPlus className="w-3.5 h-3.5" />
          Save current
        </button>
      </div>

      <div className="space-y-1">
        {filters.length === 0 ? (
          <p className="text-xs text-text-muted py-2">No saved filters yet</p>
        ) : (
          filters.map(filter => (
            <div
              key={filter.id}
              className={`
                group relative flex items-center gap-2 px-3 py-2 rounded-none cursor-pointer
                transition-colors
                ${currentViewId === filter.id
                  ? 'bg-primary/5 border border-primary/20'
                  : 'hover:bg-bg-alt border border-transparent'
                }
              `}
              onClick={() => onSelect(filter)}
            >
              <Bookmark className={`w-4 h-4 flex-shrink-0 ${
                currentViewId === filter.id ? 'text-primary' : 'text-text-muted'
              }`} />

              {editingId === filter.id ? (
                <div className="flex-1 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <Input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleUpdate(filter.id);
                      if (e.key === 'Escape') { setEditingId(null); setEditName(''); }
                    }}
                    className="flex-1 h-7 text-sm py-0"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdate(filter.id)}
                    className="p-1 text-green-600 hover:bg-green-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditingId(null); setEditName(''); }}
                    className="p-1 text-text-muted hover:bg-bg-alt"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <span className={`flex-1 text-sm truncate ${
                    currentViewId === filter.id ? 'text-primary font-medium' : 'text-text-primary'
                  }`}>
                    {filter.name}
                    {filter.isDefault && (
                      <span className="ml-2 text-xs text-text-muted">(default)</span>
                    )}
                  </span>

                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); startEditing(filter); }}
                      className="p-1 text-text-muted hover:text-text-primary hover:bg-bg-alt rounded-none"
                      title="Rename"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onDelete(filter.id); }}
                      className="p-1 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-none"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {showSaveDialog && (
        <div className="mt-2 p-3 bg-bg-alt border border-border rounded-none space-y-3">
          <p className="text-sm font-medium text-text-primary">Save Current Filters</p>
          <Input
            value={newFilterName}
            onChange={e => setNewFilterName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="Filter name"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowSaveDialog(false); setNewFilterName(''); }}
              className="px-3 py-1.5 text-sm text-text-secondary border border-border bg-white hover:bg-bg-alt rounded-none transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!newFilterName.trim()}
              className="px-3 py-1.5 text-sm text-white bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-none transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SavedFilters;
