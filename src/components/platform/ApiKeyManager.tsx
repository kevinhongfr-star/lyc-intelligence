import React, { useState } from 'react';
import { Key, Copy, Check, Trash2, Eye, EyeOff, Plus, Shield, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

const MOCK_KEYS: ApiKey[] = [
  { id: 'k1', name: 'Production Integration', key_prefix: 'sk_abc123****xyz789', scopes: ['read', 'write'], is_active: true, last_used_at: new Date(Date.now() - 3600000).toISOString(), expires_at: null, created_at: '2026-06-01T00:00:00Z' },
  { id: 'k2', name: 'Testing Automation', key_prefix: 'sk_def456****uvw321', scopes: ['read'], is_active: true, last_used_at: new Date(Date.now() - 86400000).toISOString(), expires_at: new Date(Date.now() + 30 * 86400000).toISOString(), created_at: '2026-07-15T00:00:00Z' },
  { id: 'k3', name: 'Legacy Integration', key_prefix: 'sk_ghi789****rst654', scopes: ['read'], is_active: false, last_used_at: new Date(Date.now() - 30 * 86400000).toISOString(), expires_at: null, created_at: '2026-03-10T00:00:00Z' },
];

const SCOPE_OPTIONS = ['read', 'write', 'admin', 'api'];

export function ApiKeyManager() {
  const [keys, setKeys] = useState<ApiKey[]>(MOCK_KEYS);
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(['read']);
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newKeyName.trim()) return;
    const keyId = `k_${Date.now()}`;
    const newKey: ApiKey = {
      id: keyId,
      name: newKeyName.trim(),
      key_prefix: `sk_${Math.random().toString(36).slice(2, 8)}****${Math.random().toString(36).slice(-4)}`,
      scopes: newKeyScopes,
      is_active: true,
      last_used_at: null,
      expires_at: null,
      created_at: new Date().toISOString(),
    };
    setKeys(prev => [newKey, ...prev]);
    setRawKey(`sk_${Math.random().toString(36).slice(2, 12)}${Math.random().toString(36).slice(2, 20)}`);
    setNewKeyName('');
    setNewKeyScopes(['read']);
    setShowNewKey(false);
  };

  const handleRevoke = (id: string) => {
    setKeys(prev => prev.map(k => k.id === id ? { ...k, is_active: false } : k));
  };

  const handleDelete = (id: string) => {
    setKeys(prev => prev.filter(k => k.id !== id));
  };

  const toggleScope = (scope: string) => {
    setNewKeyScopes(prev => prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleVisibility = (id: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5 text-accent" />
          API Keys
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-text-muted">
            {keys.filter(k => k.is_active).length} active of {keys.length} total
          </p>
          <Button variant="outline" size="sm" onClick={() => setShowNewKey(true)}>
            <Plus className="w-4 h-4" /> Generate Key
          </Button>
        </div>

        {showNewKey && (
          <div className="mb-4 border border-accent/30 p-4 bg-accent/5">
            <h4 className="font-medium text-sm text-text-primary mb-3">Generate New API Key</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-text-muted mb-1">Key Name</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production Integration"
                  className="w-full px-3 py-2 border border-border bg-bg text-sm focus:outline-none focus:border-accent rounded-none"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-2">Scopes</label>
                <div className="flex gap-2 flex-wrap">
                  {SCOPE_OPTIONS.map(scope => (
                    <button
                      key={scope}
                      onClick={() => toggleScope(scope)}
                      className={`px-3 py-1 text-xs border transition-colors ${
                        newKeyScopes.includes(scope)
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border text-text-secondary hover:border-accent/50'
                      }`}
                    >
                      {scope}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" size="sm" onClick={() => setShowNewKey(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreate}><Key className="w-4 h-4" /> Generate</Button>
            </div>
          </div>
        )}

        {rawKey && (
          <div className="mb-4 border border-accent p-4 bg-accent/5">
            <p className="text-xs text-accent font-medium mb-2 flex items-center gap-1">
              <Shield className="w-4 h-4" /> Copy this key now — it won't be shown again
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono bg-bg p-2 break-all">{rawKey}</code>
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(rawKey, 'new')}>
                {copiedId === 'new' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {keys.map(key => (
            <div key={key.id} className="border border-border p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-text-primary">{key.name}</span>
                    {!key.is_active && (
                      <span className="text-xs px-1.5 py-0.5 bg-bg-tertiary text-text-muted">Revoked</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs font-mono text-text-muted">
                      {visibleKeys.has(key.id) ? key.key_prefix.replace(/\*+/, 'sk_****') : key.key_prefix}
                    </code>
                    <button onClick={() => toggleVisibility(key.id)} className="text-text-muted hover:text-text-secondary">
                      {visibleKeys.has(key.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      Created {new Date(key.created_at).toLocaleDateString()}
                    </span>
                    {key.last_used_at && (
                      <span>· Last used {new Date(key.last_used_at).toLocaleDateString()}</span>
                    )}
                    {key.expires_at && (
                      <span>· Expires {new Date(key.expires_at).toLocaleDateString()}</span>
                    )}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {key.scopes.map(s => (
                      <span key={s} className="text-xs px-1.5 py-0.5 bg-bg-tertiary text-text-muted">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(key.key_prefix, key.id)}
                  >
                    {copiedId === key.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  {key.is_active ? (
                    <Button variant="ghost" size="sm" onClick={() => handleRevoke(key.id)}>
                      Revoke
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(key.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}