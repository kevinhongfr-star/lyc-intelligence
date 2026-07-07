import React, { useState } from 'react';

const INITIAL_FORM = {
  name: 'Alex Chen',
  email: 'alex.chen@techcorp.io',
  title: 'VP Engineering',
  company: 'TechCorp',
};

export function B2CProfileSettingsPage() {
  const [form, setForm] = useState(INITIAL_FORM);

  const handleChange = (field: keyof typeof INITIAL_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-text-primary">Profile</h1>
        <p className="text-text-muted mt-1">Profile form mockup</p>
      </header>

      <div className="bg-bg-secondary border border-bg-tertiary p-6 max-w-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs uppercase tracking-wider text-text-muted mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full bg-bg-primary border border-bg-tertiary px-3 py-2 text-sm text-text-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-text-muted mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full bg-bg-primary border border-bg-tertiary px-3 py-2 text-sm text-text-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-text-muted mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full bg-bg-primary border border-bg-tertiary px-3 py-2 text-sm text-text-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-text-muted mb-1.5">
              Company
            </label>
            <input
              type="text"
              value={form.company}
              onChange={(e) => handleChange('company', e.target.value)}
              className="w-full bg-bg-primary border border-bg-tertiary px-3 py-2 text-sm text-text-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors">
            Save Changes
          </button>
          <button
            onClick={() => setForm(INITIAL_FORM)}
            className="px-4 py-2 bg-bg-tertiary text-text-primary text-sm font-medium hover:bg-bg-hover transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="bg-bg-secondary border border-bg-tertiary p-12 text-center">
        <div className="max-w-md mx-auto">
          <p className="text-text-secondary text-lg mb-4">
            Notification preferences, integrations, and account security.
          </p>
          <div className="h-32 bg-bg-tertiary flex items-center justify-center">
            <span className="text-text-muted">Placeholder</span>
          </div>
        </div>
      </div>
    </div>
  );
}
