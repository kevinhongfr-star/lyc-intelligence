import React from 'react';
import { Plus, Settings, FileText, Shield } from 'lucide-react';

const MOCK_USERS = [
  { id: 1, name: 'Claire Jin', email: 'claire@financehub.com', role: 'Admin' },
  { id: 2, name: 'Michael Wong', email: 'michael@financehub.com', role: 'Viewer' },
  { id: 3, name: 'Priya Sharma', email: 'priya@financehub.com', role: 'Viewer' },
];

export function ClientPortalAdmin() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-text-primary">Admin & Security</h1>
        <p className="text-text-muted mt-1">Manage your organization settings</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-bg-secondary border border-bg-tertiary p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-bold text-text-primary">User Management</h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors">
              <Plus className="w-4 h-4" />
              Add User
            </button>
          </div>
          
          <div className="space-y-2">
            {MOCK_USERS.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-bg-primary border border-bg-tertiary">
                <div>
                  <p className="font-medium text-text-primary">{user.name}</p>
                  <p className="text-sm text-text-muted">{user.email}</p>
                </div>
                <select className="px-3 py-1 bg-bg-tertiary border border-bg-tertiary text-sm text-text-primary">
                  <option>Admin</option>
                  <option>Viewer</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-bg-secondary border border-bg-tertiary p-6">
            <h2 className="font-serif text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              SSO Configuration
            </h2>
            <div className="h-32 bg-bg-tertiary flex items-center justify-center">
              <span className="text-sm text-text-muted">SSO setup placeholder</span>
            </div>
          </div>

          <div className="bg-bg-secondary border border-bg-tertiary p-6">
            <h2 className="font-serif text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Audit Log
            </h2>
            <div className="h-32 bg-bg-tertiary flex items-center justify-center">
              <span className="text-sm text-text-muted">Audit log placeholder</span>
            </div>
          </div>

          <div className="bg-bg-secondary border border-bg-tertiary p-6">
            <h2 className="font-serif text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Data Retention
            </h2>
            <div className="h-32 bg-bg-tertiary flex items-center justify-center">
              <span className="text-sm text-text-muted">Retention policy placeholder</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}