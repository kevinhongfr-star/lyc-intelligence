import React, { useState } from 'react';
import { Key, Plus, Copy, Check } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  maskedKey: string;
  created: string;
  status: 'Active' | 'Revoked';
}

const INITIAL_KEYS: ApiKey[] = [
  {
    id: '1',
    name: 'Production API',
    maskedKey: 'sk-prod-xxxx...xxxx',
    created: 'Created Jan 2026',
    status: 'Active',
  },
  {
    id: '2',
    name: 'Webhook Integration',
    maskedKey: 'sk-web-xxxx...xxxx',
    created: 'Created Mar 2026',
    status: 'Active',
  },
];

export function APIKeyManagement() {
  const [keys, setKeys] = useState<ApiKey[]>(INITIAL_KEYS);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateKey = () => {
    setNewKey('sk-new-xxxx');
    setCopied(false);
  };

  const copyNewKey = () => {
    if (!newKey) return;
    navigator.clipboard?.writeText(newKey);
    setCopied(true);
  };

  const revoke = (id: string) => {
    setKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, status: 'Revoked' as const } : k)),
    );
  };

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-accent" />
          <h3 className="font-serif text-lg font-bold text-text-primary">API KEY MANAGEMENT</h3>
        </div>
        <button
          onClick={generateKey}
          className="flex items-center gap-2 bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent-hover"
        >
          <Plus className="w-4 h-4" />
          Generate New Key
        </button>
      </div>

      {newKey && (
        <div className="flex items-center justify-between bg-accent-10 border border-bg-tertiary p-3 mb-4">
          <p className="text-sm text-text-primary">
            New key generated:{' '}
            <span className="font-mono text-xs">{newKey}</span>
            <span className="text-text-muted"> (copy now, shown once)</span>
          </p>
          <button
            onClick={copyNewKey}
            className="flex items-center gap-1 text-accent text-sm"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}

      <div className="flex flex-col">
        {keys.map((k) => (
          <div
            key={k.id}
            className="flex items-center justify-between py-4 border-b border-bg-tertiary last:border-b-0"
          >
            <div>
              <p className="font-medium text-text-primary">{k.name}</p>
              <p className="font-mono text-xs text-text-muted">{k.maskedKey}</p>
              <p className="text-xs text-text-muted">{k.created}</p>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={`text-xs font-medium ${k.status === 'Active' ? 'text-teal' : 'text-text-muted'}`}
              >
                {k.status}
              </span>
              <button
                onClick={() => revoke(k.id)}
                disabled={k.status === 'Revoked'}
                className="text-error text-sm disabled:text-text-muted disabled:cursor-not-allowed"
              >
                Revoke
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
