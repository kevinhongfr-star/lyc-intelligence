/**
 * RolePermissions — RBAC management: role matrix, permission overrides.
 */
import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Settings,
  Plus,
  Trash2,
  Check,
  X,
  Loader2,
  Save,
} from 'lucide-react';
import { adminService } from '@/services/adminService';

interface RolePermission {
  id: string;
  role: string;
  resource: string;
  action: string;
  allowed: boolean;
}

interface PermissionOverride {
  id: string;
  user_id: string;
  resource: string;
  action: string;
  allowed: boolean;
  reason: string;
}

const ROLES = [
  { value: 'admin', label: 'Admin', description: 'Full access to everything' },
  { value: 'partner', label: 'Partner', description: 'All mandates + candidates + analytics' },
  { value: 'consultant', label: 'Consultant', description: 'Own mandates + shared candidates' },
  { value: 'recruiter', label: 'Recruiter', description: 'Assigned mandates + candidate database' },
  { value: 'analyst', label: 'Analyst', description: 'Read-only dashboards + reports' },
];

const RESOURCES = [
  'users', 'organizations', 'mandates', 'candidates', 'moderation',
  'audit_logs', 'system_config', 'feature_flags', 'billing', 'rbac',
];

const ACTIONS = ['create', 'read', 'update', 'delete', 'administer'];

const RolePermissions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'overrides'>('matrix');
  const [selectedRole, setSelectedRole] = useState('admin');
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [overrides, setOverrides] = useState<PermissionOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [newOverride, setNewOverride] = useState({
    user_id: '',
    resource: 'users',
    action: 'read',
    allowed: true,
    reason: '',
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      if (activeTab === 'matrix') {
        const { permissions: perms } = await adminService.rbac.rolePermissions();
        setPermissions(perms);
      } else {
        const { overrides: ovr } = await adminService.rbac.overrides();
        setOverrides(ovr);
      }
    } catch (err) {
      console.error('Failed to load permissions:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(role: string, resource: string, action: string, currentAllowed: boolean) {
    setSaving(`${role}-${resource}-${action}`);
    try {
      await adminService.rbac.updatePermission(role, resource, action, !currentAllowed);
      setPermissions(prev => {
        const existing = prev.find(
          p => p.role === role && p.resource === resource && p.action === action
        );
        if (existing) {
          return prev.map(p =>
            p.id === existing.id ? { ...p, allowed: !currentAllowed } : p
          );
        }
        return [...prev, { id: 'new', role, resource, action, allowed: !currentAllowed }];
      });
    } catch (err) {
      alert('Failed to update permission: ' + (err as Error).message);
    } finally {
      setSaving(null);
    }
  }

  async function handleCreateOverride() {
    if (!newOverride.user_id) return;
    try {
      await adminService.rbac.createOverride(newOverride);
      setShowOverrideModal(false);
      setNewOverride({ user_id: '', resource: 'users', action: 'read', allowed: true, reason: '' });
      loadData();
    } catch (err) {
      alert('Failed to create override: ' + (err as Error).message);
    }
  }

  async function handleDeleteOverride(id: string) {
    try {
      await adminService.rbac.deleteOverride(id);
      loadData();
    } catch (err) {
      alert('Failed to delete: ' + (err as Error).message);
    }
  }

  const getPermission = (role: string, resource: string, action: string) =>
    permissions.find(p => p.role === role && p.resource === resource && p.action === action);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-serif font-semibold">Roles & Permissions</h1>
        <p className="text-sm text-text-muted mt-1">
          Manage role-based access control and permission overrides.
        </p>
      </div>

      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'matrix'
              ? 'border-fuchsia text-fuchsia'
              : 'border-transparent text-text-muted hover:text-text-secondary'
          }`}
        >
          <Shield className="w-4 h-4" />
          Permission Matrix
        </button>
        <button
          onClick={() => setActiveTab('overrides')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'overrides'
              ? 'border-fuchsia text-fuchsia'
              : 'border-transparent text-text-muted hover:text-text-secondary'
          }`}
        >
          <Users className="w-4 h-4" />
          Overrides
        </button>
      </div>

      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {ROLES.map(role => (
              <button
                key={role.value}
                onClick={() => setSelectedRole(role.value)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  selectedRole === role.value
                    ? 'bg-fuchsia text-white'
                    : 'bg-white border border-border text-text-secondary hover:bg-bg-warm'
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-text-muted">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading permissions...
            </div>
          ) : (
            <div className="bg-white border border-border overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-bg">
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">Resource</th>
                    {ACTIONS.map(action => (
                      <th key={action} className="text-center px-3 py-3 font-medium text-text-secondary text-xs">
                        {action.charAt(0).toUpperCase() + action.slice(1)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RESOURCES.map(resource => (
                    <tr key={resource} className="border-t border-border hover:bg-bg-warm">
                      <td className="px-4 py-3 font-medium text-text-primary">
                        {resource.replace(/_/g, ' ')}
                      </td>
                      {ACTIONS.map(action => {
                        const perm = getPermission(selectedRole, resource, action);
                        const allowed = perm?.allowed ?? false;
                        const isSaving = saving === `${selectedRole}-${resource}-${action}`;
                        return (
                          <td key={action} className="text-center px-3 py-3">
                            <button
                              onClick={() => handleToggle(selectedRole, resource, action, allowed)}
                              disabled={isSaving}
                              className={`w-7 h-7 flex items-center justify-center transition-colors ${
                                allowed
                                  ? 'bg-fuchsia text-white'
                                  : 'bg-bg hover:bg-bg-warm'
                              } ${isSaving ? 'opacity-50' : ''}`}
                            >
                              {allowed && <Check className="w-4 h-4" />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="bg-fuchsia/5 border border-fuchsia/20 p-4 text-xs">
            <p className="text-fuchsia font-medium mb-1">{ROLES.find(r => r.value === selectedRole)?.label} — Description</p>
            <p className="text-text-muted">{ROLES.find(r => r.value === selectedRole)?.description}</p>
          </div>
        </div>
      )}

      {activeTab === 'overrides' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowOverrideModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-fuchsia text-white text-sm font-medium hover:bg-fuchsia/90"
            >
              <Plus className="w-4 h-4" />
              New Override
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-text-muted">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading overrides...
            </div>
          ) : (
            <div className="bg-white border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-bg text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium text-text-secondary">User</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Resource</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Action</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Access</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Reason</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {overrides.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                        No permission overrides found.
                      </td>
                    </tr>
                  ) : (
                    overrides.map(ovr => (
                      <tr key={ovr.id} className="border-t border-border hover:bg-bg-warm">
                        <td className="px-4 py-3 font-medium">{ovr.user_id}</td>
                        <td className="px-4 py-3 text-xs">{ovr.resource}</td>
                        <td className="px-4 py-3 text-xs">{ovr.action}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs font-medium ${
                            ovr.allowed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {ovr.allowed ? 'Allow' : 'Deny'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-text-muted max-w-xs truncate">{ovr.reason || '—'}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDeleteOverride(ovr.id)}
                            className="p-1.5 hover:bg-red-50 text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showOverrideModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-border p-6 w-full max-w-md">
            <h3 className="text-lg font-serif font-semibold mb-4">Create Permission Override</h3>
            <div className="space-y-3">
              <input
                value={newOverride.user_id}
                onChange={e => setNewOverride({ ...newOverride, user_id: e.target.value })}
                placeholder="User ID"
                className="w-full px-3 py-2 bg-white border border-border text-sm focus:outline-none focus:border-fuchsia"
              />
              <select
                value={newOverride.resource}
                onChange={e => setNewOverride({ ...newOverride, resource: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-border text-sm focus:outline-none focus:border-fuchsia"
              >
                {RESOURCES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <select
                value={newOverride.action}
                onChange={e => setNewOverride({ ...newOverride, action: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-border text-sm focus:outline-none focus:border-fuchsia"
              >
                {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => setNewOverride({ ...newOverride, allowed: true })}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    newOverride.allowed ? 'bg-green-500 text-white' : 'bg-bg text-text-muted'
                  }`}
                >
                  Allow
                </button>
                <button
                  onClick={() => setNewOverride({ ...newOverride, allowed: false })}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    !newOverride.allowed ? 'bg-red-500 text-white' : 'bg-bg text-text-muted'
                  }`}
                >
                  Deny
                </button>
              </div>
              <textarea
                value={newOverride.reason}
                onChange={e => setNewOverride({ ...newOverride, reason: e.target.value })}
                placeholder="Reason for this override..."
                rows={2}
                className="w-full px-3 py-2 bg-white border border-border text-sm focus:outline-none focus:border-fuchsia"
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowOverrideModal(false)} className="px-4 py-2 bg-white border border-border text-sm font-medium hover:bg-bg-warm">Cancel</button>
              <button onClick={handleCreateOverride} disabled={!newOverride.user_id} className="px-4 py-2 bg-fuchsia text-white text-sm font-medium hover:bg-fuchsia/90 disabled:opacity-50">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolePermissions;
