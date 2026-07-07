import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Target, Activity, User, Download, Eye } from 'lucide-react';

type TemplateId = 'competitive-intel' | 'org-health' | 'talent-deep-dive';

interface TemplateOption {
  id: TemplateId;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const TEMPLATES: TemplateOption[] = [
  {
    id: 'competitive-intel',
    label: 'Competitive Intel',
    description: 'Company matrix, talent density, and positioning insights.',
    icon: <Target className="w-5 h-5 text-accent" />,
  },
  {
    id: 'org-health',
    label: 'Org Health',
    description: 'Risk overlay, succession gaps, retention and vacancy impact.',
    icon: <Activity className="w-5 h-5 text-accent" />,
  },
  {
    id: 'talent-deep-dive',
    label: 'Talent Deep-Dive',
    description: 'TRIDENT, career trajectory, risks, and approach strategy.',
    icon: <User className="w-5 h-5 text-accent" />,
  },
];

export function ReportBuilderPage() {
  const [selected, setSelected] = useState<TemplateId>('competitive-intel');

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Link
        to="/reports"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-accent"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Reports
      </Link>

      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl font-bold text-text-primary">Report Builder</h1>
          <p className="text-text-muted mt-1">
            Compose a client-ready deliverable from a template.
          </p>
        </div>
        <span className="text-xs uppercase tracking-wider text-text-muted border border-bg-tertiary px-2 py-1">
          Phase 3 — coming soon
        </span>
      </header>

      <div className="bg-bg-primary border border-bg-tertiary p-5 space-y-6">
        {/* Template selection */}
        <section>
          <h2 className="font-serif text-lg font-bold text-text-primary mb-3">Template</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TEMPLATES.map((t) => {
              const active = selected === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelected(t.id)}
                  className={`text-left p-4 border transition-colors ${
                    active
                      ? 'border-accent bg-accent-10'
                      : 'border-bg-tertiary hover:border-text-muted'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {t.icon}
                    <span className="font-serif font-bold text-text-primary">{t.label}</span>
                  </div>
                  <p className="text-sm text-text-muted">{t.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Data source config (disabled-looking) */}
        <section>
          <h2 className="font-serif text-lg font-bold text-text-primary mb-3">Data Sources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-xs uppercase tracking-wider text-text-muted font-semibold mb-1">
                Client / Mandate
              </span>
              <input
                type="text"
                disabled
                placeholder="Select a mandate…"
                className="w-full bg-bg-tertiary text-text-muted px-3 py-2 border border-bg-tertiary cursor-not-allowed"
              />
            </label>
            <label className="block">
              <span className="block text-xs uppercase tracking-wider text-text-muted font-semibold mb-1">
                Comparison Set
              </span>
              <select
                disabled
                className="w-full bg-bg-tertiary text-text-muted px-3 py-2 border border-bg-tertiary cursor-not-allowed"
              >
                <option>Choose companies…</option>
              </select>
            </label>
            <label className="block">
              <span className="block text-xs uppercase tracking-wider text-text-muted font-semibold mb-1">
                Reporting Period
              </span>
              <select
                disabled
                className="w-full bg-bg-tertiary text-text-muted px-3 py-2 border border-bg-tertiary cursor-not-allowed"
              >
                <option>Q2 2026</option>
              </select>
            </label>
            <label className="block">
              <span className="block text-xs uppercase tracking-wider text-text-muted font-semibold mb-1">
                Output Format
              </span>
              <select
                disabled
                className="w-full bg-bg-tertiary text-text-muted px-3 py-2 border border-bg-tertiary cursor-not-allowed"
              >
                <option>PDF (client-ready)</option>
              </select>
            </label>
          </div>
        </section>

        {/* Preview placeholder */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-lg font-bold text-text-primary">Preview</h2>
            <span className="inline-flex items-center gap-1 text-xs text-text-muted">
              <Eye className="w-3.5 h-3.5" />
              Live preview unavailable
            </span>
          </div>
          <div className="h-64 bg-bg-tertiary flex items-center justify-center text-text-muted">
            Preview
          </div>
        </section>

        {/* Export button (disabled-looking) */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-bg-tertiary">
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 bg-bg-tertiary text-text-muted px-4 py-2 cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
}
