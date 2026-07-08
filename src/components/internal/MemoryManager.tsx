import React, { useState } from 'react';
import { Brain, Trash2, AlertTriangle } from 'lucide-react';
import { MOCK_MEMORIES } from '@/mocks/internalPortal';

export default function MemoryManager() {
  const [memories, setMemories] = useState(MOCK_MEMORIES);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const clearMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
    setConfirmId(null);
  };

  const clearAll = () => {
    setMemories([]);
    setConfirmClearAll(false);
  };

  return (
    <div className="bg-bg-primary border border-bg-tertiary" style={{ borderRadius: 0 }}>
      <div className="p-4 border-b border-bg-tertiary bg-bg-secondary flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5" style={{ color: '#C108AB' }} />
          <span className="text-sm font-medium text-text-primary">Memory Store</span>
        </div>
        {memories.length > 0 && (
          <button
            onClick={() => setConfirmClearAll(true)}
            className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-600 border border-red-300 hover:bg-red-50 transition-colors"
            style={{ borderRadius: 0 }}
          >
            <Trash2 className="w-3 h-3" />
            Clear All
          </button>
        )}
      </div>

      {confirmClearAll && (
        <div className="p-3 border-b border-bg-tertiary bg-red-50 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="text-sm text-red-800">Are you sure you want to clear all memories?</span>
          <button
            onClick={clearAll}
            className="px-3 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700"
            style={{ borderRadius: 0 }}
          >
            Confirm
          </button>
          <button
            onClick={() => setConfirmClearAll(false)}
            className="px-3 py-1 text-xs font-medium text-text-muted border border-bg-tertiary hover:bg-bg-secondary"
            style={{ borderRadius: 0 }}
          >
            Cancel
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-bg-tertiary bg-bg-secondary">
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wide">User ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wide">Topic</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wide">Confidence</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wide">Created</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wide">Last Referenced</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {memories.map((mem) => (
              <tr key={mem.id} className="border-b border-bg-tertiary hover:bg-bg-secondary transition-colors">
                <td className="px-4 py-3 text-sm text-text-primary font-mono">{mem.userId}</td>
                <td className="px-4 py-3 text-sm text-text-primary">{mem.topic}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-bg-tertiary" style={{ borderRadius: 0 }}>
                      <div
                        className="h-full"
                        style={{ width: `${mem.confidence * 100}%`, backgroundColor: '#C108AB', borderRadius: 0 }}
                      />
                    </div>
                    <span className="text-sm text-text-primary">{Math.round(mem.confidence * 100)}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-text-muted">{mem.createdAt}</td>
                <td className="px-4 py-3 text-sm text-text-muted">{mem.lastReferenced}</td>
                <td className="px-4 py-3 text-right">
                  {confirmId === mem.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-red-600">Delete?</span>
                      <button
                        onClick={() => clearMemory(mem.id)}
                        className="px-2 py-0.5 text-xs font-semibold text-white bg-red-600"
                        style={{ borderRadius: 0 }}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="px-2 py-0.5 text-xs text-text-muted border border-bg-tertiary"
                        style={{ borderRadius: 0 }}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(mem.id)}
                      className="text-text-muted hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {memories.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-muted text-sm">
                  No memories stored
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
