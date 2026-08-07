/**
 * UsersTable — User management table with CRUD, invite, deactivate, password reset.
 */
import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  MoreVertical,
  Mail,
  KeyRound,
  UserMinus,
  UserCheck,
  Trash2,
  Loader2,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { adminService } from '@/services/adminService';

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  status: 'active' | 'invited' | 'disabled';
  created_at: string;
  last_login: string | null;
  org_id: string | null;
  avatar_url: string | null;
  title: string | null;
}

const ROLE_OPTIONS = [
  'admin', 'partner', 'consultant', 'recruiter', 'analyst',
  'lyc_admin', 'lyc_consultant', 'super_admin', 'team_lead',
  'member', 'candidate', 'client_admin', 'client_viewer',
];

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-50 text-green-700 border border-green-200',
  invited: 'bg-amber-50 text-amber-700 border border-amber-200',
  disabled: 'bg-red-50 text-red-700 border border-red-200',
};

const UsersTable: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('consultant');
  const [inviteName, setInviteName] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, [statusFilter, roleFilter]);

  async function loadUsers() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (roleFilter) params.role = roleFilter;
      const { users } = await adminService.users.list(params);
      setUsers(users);
    } catch (err) {
      console.error('Failed to load users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter(u => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(term) ||
      (u.full_name || '').toLowerCase().includes(term)
    );
  });

  async function handleInvite() {
    if (!inviteEmail || !inviteEmail.includes('@')) return;
    setActionLoading('invite');
    try {
      await adminService.users.create({
        email: inviteEmail,
        role: inviteRole,
        full_name: inviteName || undefined,
      });
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteName('');
      setInviteRole('consultant');
      loadUsers();
    } catch (err) {
      alert('Failed to invite user: ' + (err as Error).message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeactivate(id: string) {
    setActionLoading(id);
    try {
      await adminService.users.deactivate(id);
      loadUsers();
    } catch (err) {
      alert('Failed to deactivate: ' + (err as Error).message);
    } finally {
      setActionLoading(null);
      setMenuOpenId(null);
    }
  }

  async function handleReactivate(id: string) {
    setActionLoading(id);
    try {
      await adminService.users.reactivate(id);
      loadUsers();
    } catch (err) {
      alert('Failed to reactivate: ' + (err as Error).message);
    } finally {
      setActionLoading(null);
      setMenuOpenId(null);
    }
  }

  async function handleResetPassword(id: string) {
    if (!confirm('Reset this user\'s password? A new password will be generated.')) return;
    setActionLoading(id);
    try {
      const result = await adminService.users.resetPassword(id);
      alert(result.message);
    } catch (err) {
      alert('Failed to reset password: ' + (err as Error).message);
    } finally {
      setActionLoading(null);
      setMenuOpenId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Permanently delete this user? This cannot be undone.')) return;
    setActionLoading(id);
    try {
      await adminService.users.delete(id);
      loadUsers();
    } catch (err) {
      alert('Failed to delete: ' + (err as Error).message);
    } finally {
      setActionLoading(null);
      setMenuOpenId(null);
    }
  }

  async function handleRoleChange(id: string, newRole: string) {
    setActionLoading(id);
    try {
      await adminService.users.update(id, { role: newRole });
      loadUsers();
    } catch (err) {
      alert('Failed to update role: ' + (err as Error).message);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold">User Management</h1>
          <p className="text-sm text-text-muted mt-1">
            Manage platform users, roles, and access.
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-fuchsia text-white text-sm font-medium hover:bg-fuchsia/90"
        >
          <Plus className="w-4 h-4" />
          Invite User
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-10 pr-4 py-2 bg-white border border-border text-sm w-64 focus:outline-none focus:border-fuchsia"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-border text-sm focus:outline-none focus:border-fuchsia"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="invited">Invited</option>
          <option value="disabled">Disabled</option>
        </select>

        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-border text-sm focus:outline-none focus:border-fuchsia"
        >
          <option value="">All Roles</option>
          {ROLE_OPTIONS.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-text-secondary">User</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Role</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Status</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Last Login</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Created</th>
              <th className="px-4 py-3 font-medium text-text-secondary w-10"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading users...
                  </div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} className="border-t border-border hover:bg-bg-warm">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-fuchsia/10 flex items-center justify-center">
                        <span className="text-fuchsia font-medium text-sm">
                          {(user.full_name || user.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{user.full_name || '—'}</p>
                        <p className="text-xs text-text-muted flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={e => handleRoleChange(user.id, e.target.value)}
                      className="px-2 py-1 bg-bg border border-border text-xs focus:outline-none focus:border-fuchsia"
                    >
                      {ROLE_OPTIONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 text-xs font-medium ${STATUS_STYLES[user.status]}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">
                    {user.last_login
                      ? new Date(user.last_login).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 relative">
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === user.id ? null : user.id)}
                      className="p-1 hover:bg-bg-warm"
                    >
                      <MoreVertical className="w-4 h-4 text-text-muted" />
                    </button>

                    {menuOpenId === user.id && (
                      <div className="absolute right-4 top-full mt-1 bg-white border border-border shadow-lg z-10 min-w-[180px]">
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          disabled={actionLoading === user.id}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-bg-warm disabled:opacity-50"
                        >
                          <KeyRound className="w-4 h-4" />
                          Reset Password
                        </button>
                        {user.status === 'disabled' ? (
                          <button
                            onClick={() => handleReactivate(user.id)}
                            disabled={actionLoading === user.id}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-bg-warm disabled:opacity-50"
                          >
                            <UserCheck className="w-4 h-4" />
                            Reactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeactivate(user.id)}
                            disabled={actionLoading === user.id}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-bg-warm disabled:opacity-50"
                          >
                            <UserMinus className="w-4 h-4" />
                            Deactivate
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={actionLoading === user.id}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-border p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-serif font-semibold">Invite New User</h3>
              <button onClick={() => setShowInviteModal(false)} className="p-1 hover:bg-bg-warm">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 bg-white border border-border text-sm focus:outline-none focus:border-fuchsia"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Full Name (optional)</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full px-3 py-2 bg-white border border-border text-sm focus:outline-none focus:border-fuchsia"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-border text-sm focus:outline-none focus:border-fuchsia"
                >
                  {ROLE_OPTIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 bg-white border border-border text-sm font-medium hover:bg-bg-warm"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={actionLoading === 'invite' || !inviteEmail}
                className="px-4 py-2 bg-fuchsia text-white text-sm font-medium hover:bg-fuchsia/90 disabled:opacity-50"
              >
                {actionLoading === 'invite' ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersTable;

function X(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="20"
      height="20"
      {...props}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
