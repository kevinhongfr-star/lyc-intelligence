import React, { useState } from 'react';
import { Zap } from 'lucide-react';

interface Rule {
  id: string;
  trigger: string;
  action: string;
  active: boolean;
}

const INITIAL_RULES: Rule[] = [
  { id: 'r1', trigger: 'New mandate created', action: 'Prepare search plan', active: true },
  { id: 'r2', trigger: 'Candidate shortlisted', action: 'Schedule interview', active: true },
  { id: 'r3', trigger: 'Interview completed', action: 'Send debrief form', active: true },
  { id: 'r4', trigger: 'Offer accepted', action: 'Start onboarding', active: false },
];

export function AutoTaskGenerator() {
  const [rules, setRules] = useState<Rule[]>(INITIAL_RULES);

  function toggleRule(id: string) {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    );
  }

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">AUTO-TASK RULES</h3>
      </div>

      <div>
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="flex items-center gap-3 border-b border-bg-tertiary py-3 last:border-b-0"
          >
            <button
              type="button"
              onClick={() => toggleRule(rule.id)}
              className="flex items-center gap-2 group"
              aria-pressed={rule.active}
            >
              <span
                className={`w-2.5 h-2.5 ${
                  rule.active ? 'bg-teal' : 'bg-slate'
                }`}
              />
            </button>
            <div className="flex-1 min-w-0 text-sm">
              <span className="text-text-primary">{rule.trigger}</span>
              <span className="text-text-muted mx-1.5">→</span>
              <span className="text-text-secondary">{rule.action}</span>
            </div>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wide ${
                rule.active ? 'text-teal' : 'text-slate'
              }`}
            >
              {rule.active ? 'Active' : 'Inactive'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
