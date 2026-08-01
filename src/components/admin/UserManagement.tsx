'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Heading, Button, Badge, Input, Grid, Flex } from '@/components/design-system';
import { COLORS, SPACING } from '@/styles/tokens';
import { useAuthStore } from '@/stores/authStore';
import {
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Coins,
  UserCog,
} from 'lucide-react';

interface AdminUser {
  id: string;
  full_name?: string | null;
  name?: string | null;
  email: string;
  role: string;
  icp?: string | null;
  status?: string;
  credits?: number;
  balance?: number;
  last_active?: string | null;
  last_login_at?: string | null;
  created_at?: string;
  organization_id?: string | null;
}

type RoleFilter = 'all' | 'admin' | 'team_lead' | 'consultant' | 'client' | 'member';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
  { value: 'all', label: 'All Roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'team_lead', label: 'Team Lead' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'client', label: 'Client' },
  { value: 'member', label: 'Member' },
];

function getRoleBadgeVariant(role: string): BadgeVariant {
  switch (role) {
    case 'admin':
      return 'error';
    case 'team_lead':
      return 'info';
    case 'consultant':
      return 'default';
    case 'client':
      return 'success';
    default:
      return 'default';
  }
}

function getUserDisplayName(user: AdminUser): string {
  return user.full_name || user.name || (user.email ? user.email.split('@')[0] : 'Unknown');
}

function getUserCredits(user: AdminUser): number {
  if (typeof user.credits === 'number') return user.credits;
  if (typeof user.balance === 'number') return user.balance;
  return 0;
}

function getUserLastActive(user: AdminUser): string | null {
  return user.last_active || user.last_login_at || null;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function extractUsers(payload: any): AdminUser[] {
  if (!payload) return [];
  if (payload.success === false) return [];
  if (Array.isArray(payload)) return payload as AdminUser[];
  if (Array.isArray(payload.users)) return payload.users as AdminUser[];
  if (payload.data) {
    if (Array.isArray(payload.data)) return payload.data as AdminUser[];
    if (Array.isArray(payload.data.users)) return payload.data.users as AdminUser[];
  }
  return [];
}

export const UserManagement: React.FC = () => {
  const { profile } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isAdmin = profile?.role === 'admin';

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      const json = await res.json();
      setUsers(extractUsers(json));
    } catch (e: any) {
      setError(e?.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (!term) return true;
      const name = getUserDisplayName(u).toLowerCase();
      const email = (u.email || '').toLowerCase();
      const icp = (u.icp || '').toLowerCase();
      return name.includes(term) || email.includes(term) || icp.includes(term);
    });
  }, [users, searchTerm, roleFilter]);

  const toggleExpand = (id: string) => {
    setExpandedUserId((prev) => (prev === id ? null : id));
  };

  const handleAdjustCredits = async (user: AdminUser) => {
    const input = window.prompt(
      `Adjust credits for ${getUserDisplayName(user)}.\nEnter the delta (e.g. 10 to grant, -5 to deduct):`,
      '0',
    );
    if (input === null) return;
    const delta = Number(input);
    if (!Number.isFinite(delta) || delta === 0) {
      setActionMessage({ type: 'error', text: 'Please enter a non-zero numeric credit delta.' });
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${user.id}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta }),
      });
      if (!res.ok) throw new Error(`Failed to adjust credits (status ${res.status})`);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, credits: getUserCredits(u) + delta } : u)),
      );
      setActionMessage({
        type: 'success',
        text: `Credits updated by ${delta > 0 ? '+' : ''}${delta} for ${getUserDisplayName(user)}.`,
      });
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e?.message || 'Failed to adjust credits.' });
    }
  };

  const handleChangeRole = async (user: AdminUser) => {
    const newRole = window.prompt(
      `Change role for ${getUserDisplayName(user)}.\nChoose: admin, team_lead, consultant, client, member`,
      user.role || 'member',
    );
    if (!newRole || newRole === user.role) return;
    try {
      const res = await fetch(`/api/admin/users/${user.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error(`Failed to change role (status ${res.status})`);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
      setActionMessage({
        type: 'success',
        text: `Role updated to "${newRole}" for ${getUserDisplayName(user)}.`,
      });
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e?.message || 'Failed to change role.' });
    }
  };

  if (!isAdmin) {
    return (
      <Card padding="8">
        <Flex direction="column" align="center" gap="4">
          <AlertCircle size={SPACING[10]} color={COLORS.warning} />
          <Heading level={3}>Admin access required</Heading>
          <p style={{ color: COLORS.textMuted, textAlign: 'center', maxWidth: 480 }}>
            You must be signed in as an administrator to manage users.
          </p>
        </Flex>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card padding="8">
        <Flex align="center" gap="3" justify="center">
          <Loader2 size={SPACING[6]} color={COLORS.primary} className="animate-spin" />
          <span style={{ color: COLORS.textMuted }}>Loading users...</span>
        </Flex>
      </Card>
    );
  }

  if (error) {
    return (
      <Card padding="8">
        <Flex direction="column" align="center" gap="4">
          <AlertCircle size={SPACING[10]} color={COLORS.error} />
          <Heading level={3}>Failed to load users</Heading>
          <p style={{ color: COLORS.textMuted, textAlign: 'center' }}>{error}</p>
          <Button variant="outline" onClick={fetchUsers}>Retry</Button>
        </Flex>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[5] }}>
      <Flex justify="between" align="center" gap="4" className="flex-wrap">
        <Flex direction="column" gap="1">
          <Heading level={2}>User Management</Heading>
          <span style={{ color: COLORS.textMuted, fontSize: SPACING[4] }}>
            {users.length} total · {filteredUsers.length} shown
          </span>
        </Flex>
      </Flex>

      {actionMessage && (
        <div
          style={{
            padding: `${SPACING[3]}px ${SPACING[4]}px`,
            borderRadius: SPACING[2],
            backgroundColor: actionMessage.type === 'success' ? COLORS.successLight : COLORS.errorLight,
            color: actionMessage.type === 'success' ? COLORS.successDark : COLORS.errorDark,
            fontSize: SPACING[3],
          }}
        >
          {actionMessage.text}
        </div>
      )}

      <Card padding="4">
        <Flex gap="3" align="end" className="flex-wrap">
          <div style={{ flex: 1, minWidth: 220 }}>
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or ICP..."
            />
          </div>
          <div>
            <label
              htmlFor="user-role-filter"
              style={{
                display: 'block',
                fontSize: SPACING[3],
                fontWeight: 500,
                color: COLORS.text,
                marginBottom: SPACING[2],
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Role
            </label>
            <select
              id="user-role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
              style={{
                padding: `${SPACING[3]}px ${SPACING[4]}px`,
                fontSize: SPACING[4],
                backgroundColor: COLORS.white,
                color: COLORS.text,
                border: `1px solid ${COLORS.border}`,
                borderRadius: SPACING[2],
                outline: 'none',
                cursor: 'pointer',
                minWidth: 180,
              }}
            >
              {ROLE_FILTERS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </Flex>
      </Card>

      <Card padding="0">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: COLORS.bg }}>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>ICP</Th>
                <Th>Status</Th>
                <Th>Credits</Th>
                <Th>Last Active</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const isExpanded = expandedUserId === user.id;
                const status = user.status || 'active';
                return (
                  <React.Fragment key={user.id}>
                    <tr
                      onClick={() => toggleExpand(user.id)}
                      style={{
                        cursor: 'pointer',
                        borderBottom: `1px solid ${COLORS.borderLight}`,
                        backgroundColor: isExpanded ? COLORS.primaryLight : 'transparent',
                        transition: 'background-color 150ms ease-out',
                      }}
                    >
                      <Td><strong>{getUserDisplayName(user)}</strong></Td>
                      <Td><span style={{ color: COLORS.textSecondary }}>{user.email}</span></Td>
                      <Td><Badge variant={getRoleBadgeVariant(user.role)}>{user.role || 'member'}</Badge></Td>
                      <Td><span style={{ color: COLORS.textSecondary }}>{user.icp || '—'}</span></Td>
                      <Td>
                        <Badge variant={status === 'suspended' ? 'error' : status === 'invited' ? 'warning' : 'success'}>
                          {status}
                        </Badge>
                      </Td>
                      <Td><span style={{ color: COLORS.text }}>{getUserCredits(user)}</span></Td>
                      <Td><span style={{ color: COLORS.textSecondary }}>{formatDateTime(getUserLastActive(user))}</span></Td>
                      <Td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', color: COLORS.textMuted }}>
                          {isExpanded ? <ChevronUp size={SPACING[5]} /> : <ChevronDown size={SPACING[5]} />}
                        </span>
                      </Td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} style={{ padding: 0, backgroundColor: COLORS.bg }}>
                          <div style={{ padding: SPACING[5], display: 'flex', flexDirection: 'column', gap: SPACING[4] }}>
                            <Grid columns={3} gap="4">
                              <DetailField label="User ID" value={user.id} />
                              <DetailField label="Created" value={formatDateTime(user.created_at)} />
                              <DetailField label="Organization" value={user.organization_id || '—'} />
                            </Grid>
                            <Flex gap="3" className="flex-wrap">
                              <Button size="sm" variant="primary" onClick={() => handleAdjustCredits(user)}>
                                <Coins size={SPACING[4]} /> Adjust Credits
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleChangeRole(user)}>
                                <UserCog size={SPACING[4]} /> Change Role
                              </Button>
                            </Flex>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div style={{ padding: SPACING[8], textAlign: 'center', color: COLORS.textMuted }}>
              No users match the current filters.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

const Th: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <th
    style={{
      textAlign: 'left',
      padding: `${SPACING[3]}px ${SPACING[4]}px`,
      fontSize: SPACING[3],
      fontWeight: 600,
      color: COLORS.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      borderBottom: `1px solid ${COLORS.border}`,
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </th>
);

const Td: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <td
    style={{
      padding: `${SPACING[3]}px ${SPACING[4]}px`,
      fontSize: SPACING[3],
      color: COLORS.text,
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </td>
);

const DetailField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div
      style={{
        fontSize: SPACING[3],
        fontWeight: 500,
        color: COLORS.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: SPACING[1],
      }}
    >
      {label}
    </div>
    <div style={{ fontSize: SPACING[3], color: COLORS.text, wordBreak: 'break-word' }}>{value}</div>
  </div>
);

export default UserManagement;
