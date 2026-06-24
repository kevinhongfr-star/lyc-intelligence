import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  ChevronRight,
  Shield,
  UserX,
  KeyRound,
  Eye,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Mail,
  Clock,
  ArrowLeft,
  UserCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const MOCK_USERS = [
  { id: '1', name: 'Kevin Zhang', email: 'kevin@lycintelligence.com', icp: 'leader', role: 'admin', subtype: null, credits: 0, status: 'active', lastActive: '2m ago', mandates: 0 },
  { id: '2', name: 'Alex Wang', email: 'alex@lycintelligence.com', icp: 'consultant', role: 'user', subtype: null, credits: 450, status: 'active', lastActive: '15m ago', mandates: 3 },
  { id: '3', name: 'Sarah Li', email: 'sarah@lycintelligence.com', icp: 'consultant', role: 'user', subtype: null, credits: 320, status: 'active', lastActive: '1h ago', mandates: 4 },
  { id: '4', name: 'Mike Chen', email: 'mike@lycintelligence.com', icp: 'consultant', role: 'user', subtype: null, credits: 180, status: 'active', lastActive: '3h ago', mandates: 2 },
  { id: '5', name: 'Emily Zhang', email: 'emily@lycintelligence.com', icp: 'consultant', role: 'user', subtype: null, credits: 275, status: 'active', lastActive: '1d ago', mandates: 3 },
  { id: '6', name: 'David Chen', email: 'david@techcorp.com', icp: 'client', role: 'user', subtype: null, credits: 0, status: 'active', lastActive: '2h ago', mandates: 1 },
  { id: '7', name: 'Lisa Wang', email: 'lisa@financeco.com', icp: 'client', role: 'user', subtype: null, credits: 0, status: 'active', lastActive: '1d ago', mandates: 2 },
  { id: '8', name: 'BD Manager', email: 'bd@lycintelligence.com', icp: 'consultant', role: 'user', subtype: 'bd_manager', credits: 500, status: 'active', lastActive: '30m ago', mandates: 0 },
  { id: '9', name: 'Jane Smith', email: 'jane@candidate.com', icp: 'candidate', role: 'user', subtype: null, credits: 120, status: 'active', lastActive: '1d ago', mandates: 0 },
  { id: '10', name: 'Old User', email: 'old@lycintelligence.com', icp: 'consultant', role: 'user', subtype: null, credits: 0, status: 'disabled', lastActive: '3mo ago', mandates: 0 },
];

const ROLES = ['admin', 'user'];
const ICPS = ['all', 'candidate', 'consultant', 'leader', 'client'];
const STATUSES = ['all', 'active', 'disabled'];

export function UserManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [icpFilter, setIcpFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [newRole, setNewRole] = useState('');

  const filtered = MOCK_USERS.filter((u) => {
    const matchesSearch = !searchQuery ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesICP = icpFilter === 'all' || u.icp === icpFilter;
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesICP && matchesRole && matchesStatus;
  });

  const selected = MOCK_USERS.find((u) => u.id === selectedUser);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="secondary" className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'disabled': return <Badge variant="secondary" className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />Disabled</Badge>;
      default: return null;
    }
  };

  const getICPChip = (icp: string) => {
    const colors: Record<string, string> = {
      candidate: 'bg-blue-100 text-blue-700',
      consultant: 'bg-purple-100 text-purple-700',
      leader: 'bg-amber-100 text-amber-700',
      client: 'bg-green-100 text-green-700',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[icp] || 'bg-gray-100 text-gray-700'}`}>
        {icp}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return <Badge variant="secondary" className="bg-red-100 text-red-700"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
    }
    return <Badge variant="secondary" className="bg-gray-100 text-gray-700">User</Badge>;
  };

  const handleRoleChange = () => {
    console.log(`Change role for ${selected?.id} to ${newRole}`);
    setShowRoleModal(false);
  };

  const handleDisable = () => {
    console.log(`Disable user ${selected?.id}`);
    setShowDisableModal(false);
    setSelectedUser(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-text-primary">User Management</h1>
        <p className="text-text-muted">{MOCK_USERS.length} total users · {MOCK_USERS.filter(u => u.status === 'active').length} active</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select value={icpFilter} onChange={(e) => setIcpFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm">
          {ICPS.map((i) => <option key={i} value={i}>{i === 'all' ? 'All ICPs' : i}</option>)}
        </select>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm">
          <option value="all">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm">
          {STATUSES.map((s) => <option key={s} value={s}>{s === 'all' ? 'All Status' : s}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-bg-tertiary">
                    <th className="text-left text-xs text-text-muted font-medium px-4 py-3">User</th>
                    <th className="text-left text-xs text-text-muted font-medium px-4 py-3">ICP / Role</th>
                    <th className="text-left text-xs text-text-muted font-medium px-4 py-3">Credits</th>
                    <th className="text-left text-xs text-text-muted font-medium px-4 py-3">Status</th>
                    <th className="text-left text-xs text-text-muted font-medium px-4 py-3">Last Active</th>
                    <th className="text-right text-xs text-text-muted font-medium px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <tr
                      key={user.id}
                      className={`border-b border-border hover:bg-bg-tertiary transition-colors cursor-pointer ${selectedUser === user.id ? 'bg-bg-tertiary' : ''}`}
                      onClick={() => setSelectedUser(user.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center text-accent text-sm font-medium">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium text-text-primary text-sm">{user.name}</p>
                            <p className="text-xs text-text-muted">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {getICPChip(user.icp)}
                          {getRoleBadge(user.role)}
                          {user.subtype && (
                            <span className="px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-700">bd_manager</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-text-primary">{user.credits}</span>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(user.status)}</td>
                      <td className="px-4 py-3 text-sm text-text-muted">{user.lastActive}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedUser(user.id); }}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); }}>
                            <Mail className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="p-12 text-center">
                  <Users className="w-12 h-12 text-text-muted mx-auto mb-3" />
                  <p className="text-text-muted">No users matching your filters</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          {selected ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>User Details</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center text-accent text-lg font-medium">
                    {selected.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{selected.name}</p>
                    <p className="text-sm text-text-muted">{selected.email}</p>
                    {getStatusBadge(selected.status)}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">ICP</span>
                    {getICPChip(selected.icp)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Role</span>
                    {getRoleBadge(selected.role)}
                  </div>
                  {selected.subtype && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Subtype</span>
                      <span className="px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-700">{selected.subtype}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-text-muted">Credits</span>
                    <span className="font-medium text-text-primary">{selected.credits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Active Mandates</span>
                    <span className="font-medium text-text-primary">{selected.mandates}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Last Active</span>
                    <span className="font-medium text-text-primary">{selected.lastActive}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-border">
                  <h4 className="text-sm font-medium text-text-primary">Quick Actions</h4>
                  <div className="space-y-2">
                    {selected.role !== 'admin' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => { setNewRole('admin'); setShowRoleModal(true); }}
                      >
                        <Shield className="w-4 h-4 mr-2" /> Make Admin
                      </Button>
                    )}
                    {selected.role === 'admin' && selected.email !== 'kevin@lycintelligence.com' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => { setNewRole('user'); setShowRoleModal(true); }}
                      >
                        <Shield className="w-4 h-4 mr-2 text-red-500" /> Revoke Admin
                      </Button>
                    )}
                    {selected.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => setShowDisableModal(true)}
                      >
                        <UserX className="w-4 h-4 mr-2" /> Disable User
                      </Button>
                    )}
                    {selected.status === 'disabled' && (
                      <Button variant="outline" size="sm" className="w-full justify-start text-green-600 border-green-200 hover:bg-green-50">
                        <UserCheck className="w-4 h-4 mr-2" /> Enable User
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <KeyRound className="w-4 h-4 mr-2" /> Reset Password
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <CreditCard className="w-4 h-4 mr-2" /> Manage Credits
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <p className="text-text-muted">Select a user to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showRoleModal && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent" />
                Change Role
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-text-secondary">
                Change role for <strong>{selected.name}</strong> from <strong>{selected.role}</strong> to <strong>{newRole}</strong>?
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowRoleModal(false)}>Cancel</Button>
                <Button className="flex-1" onClick={handleRoleChange}>Confirm</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showDisableModal && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Disable User
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-text-secondary">
                Are you sure you want to disable <strong>{selected.name}</strong>? They will lose access to the platform immediately.
              </p>
              {selected.mandates > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    This user has {selected.mandates} active mandate(s). Consider reassigning first.
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowDisableModal(false)}>Cancel</Button>
                <Button variant="destructive" className="flex-1" onClick={handleDisable}>Disable User</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
