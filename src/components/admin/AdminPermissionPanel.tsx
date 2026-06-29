'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Settings,
  History,
  Plus,
  Trash2,
  Save,
  X,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui';

type Tab = 'role-matrix' | 'users' | 'overrides' | 'audit-log';

interface RolePermission {
  id: string;
  role: string;
  resource: string;
  action: string;
  allowed: boolean;
  conditions: any;
}

interface UserInfo {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

interface PermissionOverride {
  id: string;
  user_id: string;
  resource: string;
  action: string;
  allowed: boolean;
  reason: string;
  granted_by: string;
  granted_at: string;
  expires_at: string;
  is_active: boolean;
}

interface AuditEntry {
  id: string;
  changed_by: string;
  changed_at: string;
  change_type: string;
  target_role: string;
  target_user_id: string;
  resource: string;
  action: string;
  reason: string;
}

const ROLES = [
  { value: 'admin', label: 'Admin', color: 'bg-red-100 text-red-700' },
  { value: 'team_lead', label: 'Team Lead', color: 'bg-purple-100 text-purple-700' },
  { value: 'consultant', label: 'Consultant', color: 'bg-blue-100 text-blue-700' },
  { value: 'client', label: 'Client', color: 'bg-green-100 text-green-700' },
];

const RESOURCES = [
  'contacts', 'mandates', 'signals', 'agent_actions',
  'trident_scorecards', 'canvas_profiles', 'client_accounts',
  'client_feedback', 'import', 'grid_reports', 'match_results',
  'notifications', 'rbac_settings',
];

const ACTIONS = [
  'create', 'read_own', 'read_all', 'update_own', 'update_any',
  'delete', 'export', 'review', 'approve', 'administer',
];

const ACTION_LABELS: Record<string, string> = {
  create: 'Create',
  read_own: 'Read Own',
  read_all: 'Read All',
  update_own: 'Update Own',
  update_any: 'Update Any',
  delete: 'Delete',
  export: 'Export',
  review: 'Review',
  approve: 'Approve',
  administer: 'Administer',
};

interface AdminPermissionPanelProps {
  userId: string;
  userRole: string;
}

export function AdminPermissionPanel({ userRole }: AdminPermissionPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('role-matrix');
  const [isAdmin, setIsAdmin] = useState(userRole === 'admin');
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [overrides, setOverrides] = useState<PermissionOverride[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [newOverride, setNewOverride] = useState({
    user_id: '',
    resource: 'contacts',
    action: 'create',
    allowed: true,
    reason: '',
    expires_at: '',
  });

  useEffect(() => {
    if (activeTab === 'role-matrix') {
      loadRolePermissions();
    } else if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'overrides') {
      loadOverrides();
    } else if (activeTab === 'audit-log') {
      loadAuditLog();
    }
  }, [activeTab]);

  const loadRolePermissions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/rbac/role-permissions');
      const data = await res.json();
      if (data.success) setPermissions(data.permissions);
    } catch (e) {
      console.error('Failed to load role permissions:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/rbac/users');
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOverrides = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/rbac/permission-overrides');
      const data = await res.json();
      if (data.success) setOverrides(data.overrides);
    } catch (e) {
      console.error('Failed to load overrides:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAuditLog = async () => {
    setIsLoading(true);
    try {
      setAuditLog([]);
    } catch (e) {
      console.error('Failed to load audit log:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionToggle = async (role: string, resource: string, action: string, currentAllowed: boolean) => {
    setSaving(true);
    try {
      const newAllowed = !currentAllowed;
      const res = await fetch('/api/admin/rbac/role-permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, resource, action, allowed: newAllowed }),
      });
      const data = await res.json();
      if (data.success) {
        setPermissions(prev => {
          const existing = prev.find(p => p.role === role && p.resource === resource && p.action === action);
          if (existing) {
            return prev.map(p =>
              p.id === existing.id ? { ...p, allowed: newAllowed } : p
            );
          }
          return [...prev, data.permission];
        });
      }
    } catch (e) {
      console.error('Failed to update permission:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/rbac/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      }
    } catch (e) {
      console.error('Failed to change role:', e);
    }
  };

  const handleCreateOverride = async () => {
    if (!newOverride.user_id) return;
    try {
      const res = await fetch('/api/admin/rbac/permission-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOverride),
      });
      const data = await res.json();
      if (data.success) {
        setOverrides(prev => [...prev, data.override]);
        setShowOverrideModal(false);
        setNewOverride({
          user_id: '',
          resource: 'contacts',
          action: 'create',
          allowed: true,
          reason: '',
          expires_at: '',
        });
      }
    } catch (e) {
      console.error('Failed to create override:', e);
    }
  };

  const handleDeleteOverride = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/rbac/permission-overrides/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setOverrides(prev => prev.filter(o => o.id !== id));
      }
    } catch (e) {
      console.error('Failed to delete override:', e);
    }
  };

  const getRoleColor = (role: string) =>
    ROLES.find(r => r.value === role)?.color || 'bg-gray-100 text-gray-700';

  const getRoleLabel = (role: string) =>
    ROLES.find(r => r.value === role)?.label || role;

  const getPermission = (role: string, resource: string, action: string) =>
    permissions.find(p => p.role === role && p.resource === resource && p.action === action);

  if (!isAdmin) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-lg font-semibold text-text-primary mt-4">Admin Access Required</h3>
        <p className="text-text-muted mt-2">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Permission Management</h1>
        <p className="text-text-muted mt-1">
          Manage roles, permissions, and access controls for the DEX AI platform.
        </p>
      </div>

      <div className="flex gap-2 border-b border-border">
        <TabButton
          active={activeTab === 'role-matrix'}
          onClick={() => setActiveTab('role-matrix')}
          icon={<Shield className="w-4 h-4" />}
          label="Role Matrix"
        />
        <TabButton
          active={activeTab === 'users'}
          onClick={() => setActiveTab('users')}
          icon={<Users className="w-4 h-4" />}
          label="Users"
        />
        <TabButton
          active={activeTab === 'overrides'}
          onClick={() => setActiveTab('overrides')}
          icon={<Settings className="w-4 h-4" />}
          label="Overrides"
        />
        <TabButton
          active={activeTab === 'audit-log'}
          onClick={() => setActiveTab('audit-log')}
          icon={<History className="w-4 h-4" />}
          label="Audit Log"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <span className="ml-2 text-text-muted">Loading...</span>
        </div>
      ) : (
        <>
          {activeTab === 'role-matrix' && (
            <RoleMatrixTab
              permissions={permissions}
              onToggle={handlePermissionToggle}
              saving={saving}
            />
          )}
          {activeTab === 'users' && (
            <UsersTab
              users={users}
              onRoleChange={handleRoleChange}
            />
          )}
          {activeTab === 'overrides' && (
            <OverridesTab
              overrides={overrides}
              users={users}
              onAdd={() => setShowOverrideModal(true)}
              onDelete={handleDeleteOverride}
            />
          )}
          {activeTab === 'audit-log' && (
            <AuditLogTab entries={auditLog} />
          )}
        </>
      )}

      {showOverrideModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Create Permission Override</h3>
              <button onClick={() => setShowOverrideModal(false)} className="p-1 hover:bg-bg-alt rounded">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">User</label>
                <select
                  value={newOverride.user_id}
                  onChange={e => setNewOverride(prev => ({ ...prev, user_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border text-text-primary"
                >
                  <option value="">Select user...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Resource</label>
                <select
                  value={newOverride.resource}
                  onChange={e => setNewOverride(prev => ({ ...prev, resource: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border text-text-primary"
                >
                  {RESOURCES.map(r => (
                    <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Action</label>
                <select
                  value={newOverride.action}
                  onChange={e => setNewOverride(prev => ({ ...prev, action: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border text-text-primary"
                >
                  {ACTIONS.map(a => (
                    <option key={a} value={a}>{ACTION_LABELS[a] || a}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Access</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewOverride(prev => ({ ...prev, allowed: true }))}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      newOverride.allowed
                        ? 'bg-green-100 text-green-700 border-2 border-green-500'
                        : 'bg-bg-alt text-text-muted hover:bg-bg-base'
                    }`}
                  >
                    Allow
                  </button>
                  <button
                    onClick={() => setNewOverride(prev => ({ ...prev, allowed: false }))}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      !newOverride.allowed
                        ? 'bg-red-100 text-red-700 border-2 border-red-500'
                        : 'bg-bg-alt text-text-muted hover:bg-bg-base'
                    }`}
                  >
                    Deny
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Reason</label>
                <textarea
                  value={newOverride.reason}
                  onChange={e => setNewOverride(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border text-text-primary"
                  rows={2}
                  placeholder="Why is this override needed?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Expires At (optional)</label>
                <input
                  type="datetime-local"
                  value={newOverride.expires_at}
                  onChange={e => setNewOverride(prev => ({ ...prev, expires_at: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border text-text-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowOverrideModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateOverride} disabled={!newOverride.user_id}>
                Create Override
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-text-muted hover:text-text-secondary'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function RoleMatrixTab({ permissions, onToggle, saving }: {
  permissions: RolePermission[];
  onToggle: (role: string, resource: string, action: string, current: boolean) => void;
  saving: boolean;
}) {
  const [selectedRole, setSelectedRole] = useState('consultant');

  const getPerm = (resource: string, action: string) =>
    permissions.find(p => p.role === selectedRole && p.resource === resource && p.action === action);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-text-secondary">Role:</span>
        <div className="flex gap-2">
          {ROLES.map(role => (
            <button
              key={role.value}
              onClick={() => setSelectedRole(role.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedRole === role.value
                  ? `${role.color} border-2 border-current`
                  : 'bg-bg-alt text-text-muted hover:bg-bg-base'
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>
        {saving && <span className="text-xs text-text-muted flex items-center"><Loader2 className="w-3 h-3 animate-spin mr-1" /> Saving...</span>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-medium text-text-secondary sticky left-0 bg-bg-base z-10">
                Resource
              </th>
              {ACTIONS.map(action => (
                <th key={action} className="text-center py-3 px-2 font-medium text-text-secondary text-xs whitespace-nowrap">
                  {ACTION_LABELS[action] || action}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RESOURCES.map(resource => (
              <tr key={resource} className="border-b border-border hover:bg-bg-alt/50">
                <td className="py-3 px-4 font-medium text-text-primary sticky left-0 bg-bg-base z-10">
                  {resource.replace(/_/g, ' ')}
                </td>
                {ACTIONS.map(action => {
                  const perm = getPerm(resource, action);
                  const allowed = perm?.allowed || false;
                  return (
                    <td key={action} className="py-3 px-2 text-center">
                      <button
                        onClick={() => onToggle(selectedRole, resource, action, allowed)}
                        className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                          allowed
                            ? 'bg-green-500 text-white'
                            : 'bg-bg-alt text-text-muted hover:bg-bg-base'
                        }`}
                      >
                        {allowed && <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-text-muted">
        Click a checkbox to toggle permission. Changes are saved immediately and logged to the audit trail.
      </p>
    </div>
  );
}

function UsersTab({ users, onRoleChange }: {
  users: UserInfo[];
  onRoleChange: (id: string, role: string) => void;
}) {
  const getRoleColor = (role: string) =>
    ROLES.find(r => r.value === role)?.color || 'bg-gray-100 text-gray-700';

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full">
        <thead className="bg-bg-alt">
          <tr>
            <th className="text-left py-3 px-4 font-medium text-text-secondary">Name</th>
            <th className="text-left py-3 px-4 font-medium text-text-secondary">Email</th>
            <th className="text-left py-3 px-4 font-medium text-text-secondary">Role</th>
            <th className="text-left py-3 px-4 font-medium text-text-secondary">Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className="border-t border-border hover:bg-bg-alt/50">
              <td className="py-3 px-4 font-medium text-text-primary">{user.full_name || '—'}</td>
              <td className="py-3 px-4 text-text-muted">{user.email}</td>
              <td className="py-3 px-4">
                <select
                  value={user.role}
                  onChange={e => onRoleChange(user.id, e.target.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer border-none ${getRoleColor(user.role)}`}
                >
                  {ROLES.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </td>
              <td className="py-3 px-4 text-sm text-text-muted">
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <div className="py-8 text-center text-text-muted">No users found.</div>
      )}
    </div>
  );
}

function OverridesTab({ overrides, users, onAdd, onDelete }: {
  overrides: PermissionOverride[];
  users: UserInfo[];
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  const getUserName = (userId: string) =>
    users.find(u => u.id === userId)?.full_name || userId;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-text-muted">
          {overrides.length} active override{overrides.length !== 1 ? 's' : ''}
        </p>
        <Button onClick={onAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Override
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-bg-alt">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-text-secondary">User</th>
              <th className="text-left py-3 px-4 font-medium text-text-secondary">Resource</th>
              <th className="text-left py-3 px-4 font-medium text-text-secondary">Action</th>
              <th className="text-left py-3 px-4 font-medium text-text-secondary">Access</th>
              <th className="text-left py-3 px-4 font-medium text-text-secondary">Reason</th>
              <th className="text-left py-3 px-4 font-medium text-text-secondary">Expires</th>
              <th className="text-left py-3 px-4 font-medium text-text-secondary"></th>
            </tr>
          </thead>
          <tbody>
            {overrides.map(override => (
              <tr key={override.id} className="border-t border-border hover:bg-bg-alt/50">
                <td className="py-3 px-4 font-medium text-text-primary">{getUserName(override.user_id)}</td>
                <td className="py-3 px-4 text-text-muted">{override.resource}</td>
                <td className="py-3 px-4 text-text-muted">{override.action}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    override.allowed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {override.allowed ? 'Allow' : 'Deny'}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-text-muted max-w-xs truncate">{override.reason || '—'}</td>
                <td className="py-3 px-4 text-sm text-text-muted">
                  {override.expires_at ? new Date(override.expires_at).toLocaleDateString() : 'Never'}
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => onDelete(override.id)}
                    className="p-1.5 hover:bg-red-100 rounded text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {overrides.length === 0 && (
          <div className="py-8 text-center text-text-muted">
            No permission overrides.
          </div>
        )}
      </div>
    </div>
  );
}

function AuditLogTab({ entries }: { entries: AuditEntry[] }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 text-center">
      <History className="w-12 h-12 text-text-muted mx-auto" />
      <h3 className="font-medium text-text-primary mt-4">Audit Log</h3>
      <p className="text-sm text-text-muted mt-2">
        Permission change audit logs are being migrated to the new system.
      </p>
    </div>
  );
}

export default AdminPermissionPanel;
