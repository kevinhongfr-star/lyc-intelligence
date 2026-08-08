/**
 * OrgSettings — Organization configuration, billing, plan management.
 */
import React, { useState, useEffect } from 'react';
import {
  Building2,
  Mail,
  Users,
  CreditCard,
  Gauge,
  Save,
  Pause,
  Play,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { adminService } from '@/services/adminService';

interface OrgRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  seats_used: number;
  seats_limit: number;
  billing_email: string | null;
}

const PLAN_TIERS = [
  { value: 'free', label: 'Executive Introduction', seats: 3, color: 'bg-gray-100 text-gray-700' },
  { value: 'starter', label: 'Starter', seats: 10, color: 'bg-blue-100 text-blue-700' },
  { value: 'growth', label: 'Growth', seats: 50, color: 'bg-fuchsia/10 text-fuchsia' },
  { value: 'enterprise', label: 'Enterprise', seats: 500, color: 'bg-purple-100 text-purple-700' },
];

const OrgSettings: React.FC = () => {
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOrg, setEditingOrg] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<OrgRow>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: '', plan: 'free', billing_email: '' });

  useEffect(() => {
    loadOrgs();
  }, []);

  async function loadOrgs() {
    setLoading(true);
    try {
      const { orgs } = await adminService.organizations.list();
      setOrgs(orgs);
    } catch (err) {
      console.error('Failed to load orgs:', err);
      setOrgs([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(orgId: string) {
    try {
      await adminService.organizations.update(orgId, editData);
      setEditingOrg(null);
      loadOrgs();
    } catch (err) {
      alert('Failed to save: ' + (err as Error).message);
    }
  }

  async function handleSuspend(orgId: string) {
    try {
      await adminService.organizations.suspend(orgId);
      loadOrgs();
    } catch (err) {
      alert('Failed to suspend: ' + (err as Error).message);
    }
  }

  async function handleReactivate(orgId: string) {
    try {
      await adminService.organizations.reactivate(orgId);
      loadOrgs();
    } catch (err) {
      alert('Failed to reactivate: ' + (err as Error).message);
    }
  }

  async function handleChangePlan(orgId: string, plan: string) {
    try {
      await adminService.organizations.changePlan(orgId, { plan });
      loadOrgs();
    } catch (err) {
      alert('Failed to change plan: ' + (err as Error).message);
    }
  }

  async function handleCreate() {
    if (!newOrg.name.trim()) return;
    try {
      await adminService.organizations.create({
        name: newOrg.name,
        plan: newOrg.plan as any,
        billing_email: newOrg.billing_email || undefined,
      });
      setShowCreateModal(false);
      setNewOrg({ name: '', plan: 'free', billing_email: '' });
      loadOrgs();
    } catch (err) {
      alert('Failed to create: ' + (err as Error).message);
    }
  }

  function startEdit(org: OrgRow) {
    setEditingOrg(org.id);
    setEditData({
      name: org.name,
      billing_email: org.billing_email || undefined,
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Organizations</h1>
          <p className="text-sm text-text-muted mt-1">
            Manage organizations, billing plans, and seat allocation.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-fuchsia text-white text-sm font-medium hover:bg-fuchsia/90"
        >
          <Building2 className="w-4 h-4" />
          New Organization
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-text-muted">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading organizations...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orgs.length === 0 ? (
            <div className="col-span-full bg-white border border-border p-12 text-center text-text-muted">
              No organizations found.
            </div>
          ) : (
            orgs.map(org => (
              <div key={org.id} className="bg-white border border-border p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-fuchsia/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-fuchsia" />
                    </div>
                    {editingOrg === org.id ? (
                      <input
                        value={editData.name || ''}
                        onChange={e => setEditData({ ...editData, name: e.target.value })}
                        className="px-2 py-1 border border-border text-sm focus:outline-none focus:border-fuchsia"
                      />
                    ) : (
                      <div>
                        <h3 className="font-semibold">{org.name}</h3>
                        <p className="text-xs text-text-muted">/{org.slug}</p>
                      </div>
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium ${
                      org.status === 'active' ? 'bg-green-100 text-green-700' :
                      org.status === 'suspended' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {org.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider">Plan</p>
                    <div className="flex items-center gap-1 mt-1">
                      {editingOrg === org.id ? (
                        <select
                          value={editData.plan || org.plan}
                          onChange={e => setEditData({ ...editData, plan: e.target.value })}
                          className="flex-1 px-2 py-1 border border-border text-xs focus:outline-none focus:border-fuchsia"
                        >
                          {PLAN_TIERS.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      ) : (
                        <>
                          <Gauge className="w-3 h-3 text-fuchsia" />
                          <span className="font-medium capitalize">{org.plan}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider">Seats</p>
                    <p className="mt-1 font-medium">
                      <span className={org.seats_used >= org.seats_limit ? 'text-red-600' : ''}>
                        {org.seats_used}
                      </span>
                      <span className="text-text-muted"> / {org.seats_limit}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <Mail className="w-3 h-3 text-text-muted" />
                  {editingOrg === org.id ? (
                    <input
                      value={editData.billing_email || ''}
                      onChange={e => setEditData({ ...editData, billing_email: e.target.value })}
                      placeholder="billing@org.com"
                      className="flex-1 px-2 py-1 border border-border focus:outline-none focus:border-fuchsia"
                    />
                  ) : (
                    <span className="text-text-muted">{org.billing_email || 'No billing email'}</span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  {editingOrg === org.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingOrg(null)}
                        className="px-3 py-1 text-xs border border-border hover:bg-bg-warm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSave(org.id)}
                        className="px-3 py-1 text-xs bg-fuchsia text-white hover:bg-fuchsia/90"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(org)}
                      className="text-xs text-fuchsia hover:underline flex items-center gap-1"
                    >
                      Edit Details
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}

                  <div className="flex gap-2">
                    {org.status === 'active' ? (
                      <button
                        onClick={() => handleSuspend(org.id)}
                        className="p-1.5 hover:bg-red-50 text-red-600"
                        title="Suspend"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    ) : org.status === 'suspended' ? (
                      <button
                        onClick={() => handleReactivate(org.id)}
                        className="p-1.5 hover:bg-green-50 text-green-600"
                        title="Reactivate"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-border p-6 w-full max-w-md">
            <h3 className="text-lg font-serif font-semibold mb-4">Create Organization</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Organization Name</label>
                <input
                  value={newOrg.name}
                  onChange={e => setNewOrg({ ...newOrg, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-border text-sm focus:outline-none focus:border-fuchsia"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Plan</label>
                <select
                  value={newOrg.plan}
                  onChange={e => setNewOrg({ ...newOrg, plan: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-border text-sm focus:outline-none focus:border-fuchsia"
                >
                  {PLAN_TIERS.map(t => (
                    <option key={t.value} value={t.value}>{t.label} ({t.seats} seats)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Billing Email</label>
                <input
                  value={newOrg.billing_email}
                  onChange={e => setNewOrg({ ...newOrg, billing_email: e.target.value })}
                  placeholder="billing@org.com"
                  className="w-full px-3 py-2 bg-white border border-border text-sm focus:outline-none focus:border-fuchsia"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-white border border-border text-sm font-medium hover:bg-bg-warm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newOrg.name}
                className="px-4 py-2 bg-fuchsia text-white text-sm font-medium hover:bg-fuchsia/90 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgSettings;
