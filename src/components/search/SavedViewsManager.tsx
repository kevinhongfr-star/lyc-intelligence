import React, { useState, useEffect } from 'react';
import { Bookmark, Star, Trash2, FolderOpen } from 'lucide-react';

interface SavedView {
  id: string;
  name: string;
  filters: Record<string, any>;
  sort?: { field: string; direction: string };
  createdAt: string;
}

interface SavedViewsManagerProps {
  currentFilters: Record<string, any>;
  currentSort?: { field: string; direction: string };
  onLoadView: (filters: Record<string, any>, sort?: { field: string; direction: string }) => void;
  storageKey: string;
}

export function SavedViewsManager({ currentFilters, currentSort, onLoadView, storageKey }: SavedViewsManagerProps) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [showSave, setShowSave] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try { setViews(JSON.parse(stored)); } catch {}
    }
  }, [storageKey]);

  const save = () => {
    if (!newName.trim()) return;
    const view: SavedView = {
      id: Date.now().toString(),
      name: newName.trim(),
      filters: currentFilters,
      sort: currentSort,
      createdAt: new Date().toISOString(),
    };
    const updated = [...views, view];
    setViews(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setNewName('');
    setShowSave(false);
  };

  const remove = (id: string) => {
    const updated = views.filter(v => v.id !== id);
    setViews(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const [showList, setShowList] = useState(false);

  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-1">
        <button
          onClick={() => setShowSave(!showSave)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#737373] hover:text-[#171717] border border-[#E5E5E5] rounded hover:bg-[#FAFAFA] transition-colors"
          title="Save current view"
        >
          <Star className="w-3 h-3" />
          Save View
        </button>
        {views.length > 0 && (
          <button
            onClick={() => setShowList(!showList)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#737373] hover:text-[#171717] border border-[#E5E5E5] rounded hover:bg-[#FAFAFA] transition-colors"
            title="Load saved view"
          >
            <FolderOpen className="w-3 h-3" />
            Views ({views.length})
          </button>
        )}
      </div>

      {showSave && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-white border border-[#E5E5E5] rounded-lg shadow-lg p-3 w-64">
          <p className="text-xs font-medium text-[#737373] mb-2">Save current filters as:</p>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="e.g. C-Suite APAC, Score 80+..."
            className="w-full px-2.5 py-1.5 text-sm border border-[#E5E5E5] rounded focus:outline-none focus:border-[#C108AB]/50 mb-2"
            onKeyDown={e => e.key === 'Enter' && save()}
            autoFocus
          />
          <button
            onClick={save}
            disabled={!newName.trim()}
            className="w-full py-1.5 text-xs font-medium text-white bg-[#C108AB] rounded hover:bg-[#A50798] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      )}

      {showList && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-white border border-[#E5E5E5] rounded-lg shadow-lg w-72 max-h-64 overflow-y-auto">
          <div className="p-2 border-b border-[#F0F0F0]">
            <p className="text-xs font-medium text-[#737373]">Saved Views</p>
          </div>
          {views.map(v => (
            <div key={v.id} className="flex items-center justify-between px-3 py-2 hover:bg-[#FAFAFA] group">
              <button
                onClick={() => { onLoadView(v.filters, v.sort); setShowList(false); }}
                className="flex-1 text-left"
              >
                <p className="text-sm font-medium text-[#171717]">{v.name}</p>
                <p className="text-xs text-[#A3A3A3]">{new Date(v.createdAt).toLocaleDateString()}</p>
              </button>
              <button
                onClick={() => remove(v.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-[#A3A3A3] hover:text-red-500 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
