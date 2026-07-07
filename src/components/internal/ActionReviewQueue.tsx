import { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface PendingAction {
  id: string;
  description: string;
}

const INITIAL_ACTIONS: PendingAction[] = [
  { id: 'a1', description: 'Auto-score candidate David Tan → M-028' },
  { id: 'a2', description: 'Send interview reminder → Sophie Lau' },
  { id: 'a3', description: 'Generate market map → SEA Fintech' },
];

export function ActionReviewQueue() {
  const [actions, setActions] = useState<PendingAction[]>(INITIAL_ACTIONS);

  const handleAct = (id: string) => {
    setActions((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <h3 className="font-serif text-lg font-bold text-text-primary">ACTION REVIEW QUEUE</h3>
        </div>
        <span className="text-xs text-text-muted">
          Pending: <span className="text-text-primary font-semibold">{actions.length}</span>
        </span>
      </div>

      {actions.length === 0 ? (
        <div className="border border-bg-tertiary p-6 text-center">
          <p className="text-sm text-text-muted">No pending actions. Queue is clear.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((a) => (
            <div key={a.id} className="border border-bg-tertiary p-4">
              <p className="text-sm text-text-primary mb-3">{a.description}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAct(a.id)}
                  className="bg-teal text-white px-3 py-1 text-sm font-medium hover:opacity-90"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleAct(a.id)}
                  className="bg-error text-white px-3 py-1 text-sm font-medium hover:opacity-90"
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="border border-bg-tertiary text-text-secondary px-3 py-1 text-sm font-medium hover:bg-bg-secondary"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
