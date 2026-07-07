import { useState } from 'react';
import { Brain } from 'lucide-react';

const STATS: { label: string; value: string }[] = [
  { label: 'Total Memories Stored', value: '1,247' },
  { label: 'Storage Used', value: '12.4 MB' },
  { label: 'Oldest Memory', value: 'Jan 2026' },
];

const RECENT_MEMORIES: { id: string; text: string; when: string }[] = [
  {
    id: 'm1',
    text: 'User prefers concise executive summaries with explicit revenue impact; dislikes long preamble...',
    when: '2h ago',
  },
  {
    id: 'm2',
    text: 'Mandate M-028 (Fintech CFO) — shortlist of 4 confirmed, two pending reference checks on Kevin...',
    when: '1d ago',
  },
  {
    id: 'm3',
    text: 'Candidate David Tan signaled openness to SEA relocation; salary expectation band $220–260K...',
    when: '3d ago',
  },
];

export function MemoryManagement() {
  const [confirming, setConfirming] = useState(false);
  const [cleared, setCleared] = useState(false);

  const handleConfirmClear = () => {
    setCleared(true);
    setConfirming(false);
  };

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">MEMORY MANAGEMENT</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {STATS.map((s) => (
          <div key={s.label} className="border border-bg-tertiary p-4">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{s.label}</p>
            <p className="font-serif text-2xl font-bold text-text-primary">
              {cleared && s.label !== 'Oldest Memory' ? '0' : s.value}
              {cleared && s.label === 'Storage Used' && ' MB'}
            </p>
          </div>
        ))}
      </div>

      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
        Recent Memories
      </p>
      <div className="space-y-2 mb-6">
        {RECENT_MEMORIES.map((m) => (
          <div key={m.id} className="border border-bg-tertiary p-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-secondary truncate">{m.text}</p>
            </div>
            <span className="text-xs text-text-muted flex-shrink-0">{m.when}</span>
          </div>
        ))}
      </div>

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="bg-error text-white px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          Clear All Memories
        </button>
      ) : (
        <div className="border border-error p-4 flex items-center gap-3">
          <span className="text-sm text-text-primary">Are you sure?</span>
          <button
            type="button"
            onClick={handleConfirmClear}
            className="bg-error text-white px-3 py-1 text-sm font-medium hover:opacity-90"
          >
            Yes, clear
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="border border-bg-tertiary text-text-secondary px-3 py-1 text-sm font-medium hover:bg-bg-secondary"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
