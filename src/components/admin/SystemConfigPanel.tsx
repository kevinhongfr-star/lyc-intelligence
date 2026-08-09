/**
 * SystemConfigPanel — System-wide configuration and feature flags.
 */
import React, { useState, useEffect } from 'react';
import {
  Settings,
  Flag,
  Plus,
  Save,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { adminService } from '@/services/adminService';

interface SystemConfigItem {
  id: string;
  key: string;
  value: any;
  scope: string;
  scope_target: string | null;
  description: string | null;
  updated_at: string;
}

interface FeatureFlagItem {
  id: string;
  key: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  rollout_percentage: number;
  allowed_roles: string[] | null;
  org_override: Record<string, boolean> | null;
  updated_at: string;
}

const SystemConfigPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'config' | 'flags'>('config');
  const [configs, setConfigs] = useState<SystemConfigItem[]>([]);
  const [flags, setFlags] = useState<FeatureFlagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateConfig, setShowCreateConfig] = useState(false);
  const [showCreateFlag, setShowCreateFlag] = useState(false);
  const [newConfig, setNewConfig] = useState({ key: '', value: '', description: '', scope: 'global' });
  const [newFlag, setNewFlag] = useState({ key: '', name: '', description: '', rollout: 100 });
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      if (activeTab === 'config') {
        const { configs } = await adminService.config.list();
        setConfigs(configs);
      } else {
        const { flags } = await adminService.featureFlags.list();
        setFlags(flags);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateConfig() {
    if (!newConfig.key.trim()) return;
    setSaving(true);
    try {
      await adminService.config.create({
        key: newConfig.key,
        value: newConfig.value,
        description: newConfig.description || undefined,
        scope: newConfig.scope,
      });
      setShowCreateConfig(false);
      setNewConfig({ key: '', value: '', description: '', scope: 'global' });
      loadData();
    } catch (err) {
      alert('Failed to create config:' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateConfig(id: string, value: string) {
    setSaving(true);
    try {
      await adminService.config.update(id, { value });
      setSavedId(id);
      setTimeout(() => setSavedId(null), 1500);
    } catch (err) {
      alert('Failed to update:' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateFlag() {
    if (!newFlag.key.trim() || !newFlag.name.trim()) return;
    setSaving(true);
    try {
      await adminService.featureFlags.create({
        key: newFlag.key,
        name: newFlag.name,
        description: newFlag.description || undefined,
        rollout_percentage: newFlag.rollout,
      });
      setShowCreateFlag(false);
      setNewFlag({ key: '', name: '', description: '', rollout: 100 });
      loadData();
    } catch (err) {
      alert('Failed to create flag:' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleFlag(key: string, currentEnabled: boolean) {
    try {
      await adminService.featureFlags.update(key, { is_enabled: !currentEnabled });
      loadData();
    } catch (err) {
      alert('Failed to toggle:' + (err as Error).message);
    }
  }

  async function handleRolloutChange(key: string, percentage: number) {
    try {
      await adminService.featureFlags.update(key, { rollout_percentage: percentage });
      loadData();
    } catch (err) {
      alert('Failed to update rollout:' + (err as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-serif font-semibold">System Configuration</h1>
        <p className="text-sm text-text-muted mt-1">
          Manage system-wide settings and feature flags.
        </p>
      </div>

      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'config'
              ? 'border-fuchsia text-fuchsia'
              : 'border-transparent text-text-muted hover:text-text-secondary'
          }`}
        >
          <Settings className="w-4 h-4" />
          System Config
        </button>
        <button
          onClick={() => setActiveTab('flags')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'flags'
              ? 'border-fuchsia text-fuchsia'
              : 'border-transparent text-text-muted hover:text-text-secondary'
          }`}
        >
          <Flag className="w-4 h-4" />
          Feature Flags
        </button>
      </div>

      {activeTab === 'config' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateConfig(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-fuchsia text-white text-sm font-medium hover:bg-fuchsia/90"
            >
              <Plus className="w-4 h-4" />
              New Config
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-text-muted">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading configs...
            </div>
          ) : (
            <div className="bg-white border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-bg text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium text-text-secondary">Key</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Value</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Scope</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Description</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Updated</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {configs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                        No config entries found.
                      </td>
                    </tr>
                  ) : (
                    configs.map(config => (
                      <tr key={config.id} className="border-t border-border hover:bg-bg-warm">
                        <td className="px-4 py-3 font-mono text-xs font-medium">{config.key}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <input
                              defaultValue={typeof config.value === 'object' ? JSON.stringify(config.value) : config.value}
                              onBlur={e => handleUpdateConfig(config.id, e.target.value)}
                              className="flex-1 px-2 py-1 bg-bg border border-border text-xs focus:outline-none focus:border-fuchsia font-mono"
                            />
                            {savedId === config.id && (
                              <Check className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs capitalize">{config.scope}</td>
                        <td className="px-4 py-3 text-xs text-text-muted">{config.description || '—'}</td>
                        <td className="px-4 py-3 text-xs text-text-muted">
                          {new Date(config.updated_at).toLocaleDateString()}
                        </td>
                        <td></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'flags' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateFlag(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-fuchsia text-white text-sm font-medium hover:bg-fuchsia/90"
            >
              <Plus className="w-4 h-4" />
              New Feature Flag
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-text-muted">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading feature flags...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flags.length === 0 ? (
                <div className="col-span-full bg-white border border-border p-12 text-center text-text-muted">
                  No feature flags found.
                </div>
              ) : (
                flags.map(flag => (
                  <div key={flag.id} className="bg-white border border-border p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{flag.name}</h4>
                        <p className="text-xs font-mono text-text-muted">{flag.key}</p>
                      </div>
                      <button
                        onClick={() => handleToggleFlag(flag.key, flag.is_enabled)}
                        className={`p-1 transition-colors ${flag.is_enabled ? 'text-fuchsia' : 'text-text-muted'}`}
                      >
                        {flag.is_enabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                      </button>
                    </div>

                    {flag.description && (
                      <p className="text-xs text-text-muted">{flag.description}</p>
                    )}

                    <div>
                      <label className="block text-xs text-text-muted mb-1">
                        Rollout: {flag.rollout_percentage}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={flag.rollout_percentage}
                        onChange={e => handleRolloutChange(flag.key, parseInt(e.target.value))}
                        className="w-full accent-fuchsia"
                        disabled={!flag.is_enabled}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-text-muted">
                      <span>
                        Status: {flag.is_enabled ? (
                          <span className="text-green-600 font-medium">Active</span>
                        ) : (
                          <span className="text-gray-500">Disabled</span>
                        )}
                      </span>
                      <span>Updated: {new Date(flag.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {showCreateConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-border p-6 w-full max-w-md">
            <h3 className="text-lg font-serif font-semibold mb-4">New System Config</h3>
            <div className="space-y-3">
              <input
                value={newConfig.key}
                onChange={e => setNewConfig({ ...newConfig, key: e.target.value })}
                placeholder="config.key.name"
                className="w-full px-3 py-2 bg-white border border-border text-sm font-mono focus:outline-none focus:border-fuchsia"
              />
              <input
                value={newConfig.value}
                onChange={e => setNewConfig({ ...newConfig, value: e.target.value })}
                placeholder="value"
                className="w-full px-3 py-2 bg-white border border-border text-sm font-mono focus:outline-none focus:border-fuchsia"
              />
              <input
                value={newConfig.description}
                onChange={e => setNewConfig({ ...newConfig, description: e.target.value })}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 bg-white border border-border text-sm focus:outline-none focus:border-fuchsia"
              />
              <select
                value={newConfig.scope}
                onChange={e => setNewConfig({ ...newConfig, scope: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-border text-sm focus:outline-none focus:border-fuchsia"
              >
                <option value="global">Global</option>
                <option value="org">Organization</option>
                <option value="role">Role</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowCreateConfig(false)} className="px-4 py-2 bg-white border border-border text-sm font-medium hover:bg-bg-warm">Cancel</button>
              <button onClick={handleCreateConfig} disabled={saving || !newConfig.key} className="px-4 py-2 bg-fuchsia text-white text-sm font-medium hover:bg-fuchsia/90 disabled:opacity-50">Create</button>
            </div>
          </div>
        </div>
      )}

      {showCreateFlag && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-border p-6 w-full max-w-md">
            <h3 className="text-lg font-serif font-semibold mb-4">New Feature Flag</h3>
            <div className="space-y-3">
              <input
                value={newFlag.key}
                onChange={e => setNewFlag({ ...newFlag, key: e.target.value })}
                placeholder="feature.key.name"
                className="w-full px-3 py-2 bg-white border border-border text-sm font-mono focus:outline-none focus:border-fuchsia"
              />
              <input
                value={newFlag.name}
                onChange={e => setNewFlag({ ...newFlag, name: e.target.value })}
                placeholder="Display name"
                className="w-full px-3 py-2 bg-white border border-border text-sm focus:outline-none focus:border-fuchsia"
              />
              <input
                value={newFlag.description}
                onChange={e => setNewFlag({ ...newFlag, description: e.target.value })}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 bg-white border border-border text-sm focus:outline-none focus:border-fuchsia"
              />
              <div>
                <label className="text-xs text-text-muted">Rollout: {newFlag.rollout}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newFlag.rollout}
                  onChange={e => setNewFlag({ ...newFlag, rollout: parseInt(e.target.value) })}
                  className="w-full accent-fuchsia"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowCreateFlag(false)} className="px-4 py-2 bg-white border border-border text-sm font-medium hover:bg-bg-warm">Cancel</button>
              <button onClick={handleCreateFlag} disabled={saving || !newFlag.key || !newFlag.name} className="px-4 py-2 bg-fuchsia text-white text-sm font-medium hover:bg-fuchsia/90 disabled:opacity-50">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemConfigPanel;
