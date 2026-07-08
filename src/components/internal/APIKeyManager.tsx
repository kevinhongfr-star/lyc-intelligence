import React, { useState } from 'react';
import { Key, Plus, Ban } from 'lucide-react';
import { MOCK_API_KEYS } from '@/mocks/internalPortal';

interface KeyState {
  [key: string]: string;
}

export default function APIKeyManager() {
  const [keyStatuses, setKeyStatuses] = useState<KeyState>(() =>
    Object.fromEntries(MOCK_API_KEYS.map(k => [k.id, k.status]))
  );

  const revokeKey = (id: string) => {
    setKeyStatuses(prev => ({
      ...prev,
      [id]: prev[id] === 'active' ? 'revoked' : 'active',
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-accent" />
          <h2 className="font-serif font-semibold text-lg text-text-primary">API Keys</h2>
        </div>
        <button
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-accent text-white hover:bg-accent-light transition-colors"
          style={{ borderRadius: 0 }}
        >
          <Plus className="w-3.5 h-3.5" />
          Generate New Key
        </button>
      </div>

      <div className="space-y-3">
        {MOCK_API_KEYS.map(apiKey => {
          const currentStatus = keyStatuses[apiKey.id];
          const isActive = currentStatus === 'active';
          return (
            <div
              key={apiKey.id}
              className="bg-bg-primary border border-bg-tertiary p-4"
              style={{ borderRadius: 0 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-text-primary">{apiKey.name}</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${
                        isActive
                          ? 'bg-tier-1Bg text-tier-1'
                          : 'bg-red-500/15 text-red-600'
                      }`}
                      style={{ borderRadius: 0 }}
                    >
                      {currentStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-text-muted">
                    <span>Prefix: <code className="bg-bg-secondary px-1.5 py-0.5 text-xs" style={{ borderRadius: 0 }}>{apiKey.prefix}****</code></span>
                    <span>Created: {apiKey.created}</span>
                    <span>Last used: {apiKey.lastUsed}</span>
                  </div>
                </div>
                <button
                  onClick={() => revokeKey(apiKey.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border transition-colors ${
                    isActive
                      ? 'border-red-300 text-red-600 hover:bg-red-50'
                      : 'border-bg-tertiary text-text-secondary hover:bg-bg-secondary'
                  }`}
                  style={{ borderRadius: 0 }}
                >
                  <Ban className="w-3 h-3" />
                  {isActive ? 'Revoke' : 'Reactivate'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
