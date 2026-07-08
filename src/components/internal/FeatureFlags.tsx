import React, { useState } from 'react';
import { ToggleLeft, ToggleRight, Flag } from 'lucide-react';
import { MOCK_FEATURE_FLAGS } from '@/mocks/internalPortal';

interface FlagState {
  [key: string]: boolean;
}

export default function FeatureFlags() {
  const [flags, setFlags] = useState<FlagState>(() =>
    Object.fromEntries(MOCK_FEATURE_FLAGS.map(f => [f.id, f.enabled]))
  );

  const toggleFlag = (id: string) => {
    setFlags(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Flag className="w-5 h-5 text-accent" />
        <h2 className="font-serif font-semibold text-lg text-text-primary">Feature Flags</h2>
      </div>

      <div className="space-y-3">
        {MOCK_FEATURE_FLAGS.map(flag => {
          const isEnabled = flags[flag.id];
          return (
            <div
              key={flag.id}
              className="bg-bg-primary border border-bg-tertiary p-4"
              style={{ borderRadius: 0 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-text-primary">{flag.label}</span>
                    <code className="text-xs text-text-muted bg-bg-secondary px-1.5 py-0.5" style={{ borderRadius: 0 }}>
                      {flag.key}
                    </code>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    {flag.portals.map(portal => (
                      <span
                        key={portal}
                        className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-bg-secondary text-text-secondary"
                        style={{ borderRadius: 0 }}
                      >
                        {portal}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => toggleFlag(flag.id)}
                  className="flex items-center gap-2 ml-4"
                  aria-label={isEnabled ? 'Disable flag' : 'Enable flag'}
                >
                  {isEnabled ? (
                    <ToggleRight className="w-8 h-8 text-accent" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-text-muted" />
                  )}
                  <span className={`text-xs font-medium ${isEnabled ? 'text-accent' : 'text-text-muted'}`}>
                    {isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
