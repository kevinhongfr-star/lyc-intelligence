import React from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, FileText, Eye, Download, Share2, Target, Activity, User,
  ChevronRight,
} from 'lucide-react';

interface QuickLink {
  title: string;
  to: string;
  icon: React.ReactNode;
  blurb: string;
}

const QUICK_LINKS: QuickLink[] = [
  {
    title: 'Competitive Intelligence',
    to: '/reports/competitive-intel',
    icon: <Target className="w-5 h-5 text-accent" />,
    blurb: 'Side-by-side company, talent density, and positioning analysis.',
  },
  {
    title: 'Organizational Health',
    to: '/reports/org-health',
    icon: <Activity className="w-5 h-5 text-accent" />,
    blurb: 'Risk overlay, succession depth, retention and vacancy impact.',
  },
  {
    title: 'Talent Deep-Dive',
    to: '/reports/talent-deep-dive',
    icon: <User className="w-5 h-5 text-accent" />,
    blurb: 'TRIDENT, career trajectory, risks, and approach strategy.',
  },
];

interface RecentReport {
  title: string;
  meta: string;
  viewTo: string;
}

const RECENT_REPORTS: RecentReport[] = [
  {
    title: 'Competitive Intel: Grab vs Gojek Leadership',
    meta: 'Generated: Jul 5 | Client: FinanceHub',
    viewTo: '/reports/competitive-intel',
  },
  {
    title: 'Org Health: FinanceHub Asia Q2 2026',
    meta: 'Generated: Jul 3 | Client: FinanceHub',
    viewTo: '/reports/org-health',
  },
  {
    title: 'Talent Deep-Dive: David Tan',
    meta: 'Generated: Jun 28 | Mandate: VP Risk',
    viewTo: '/reports/talent-deep-dive',
  },
];

export function ReportsListPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl font-bold text-text-primary">REPORTS</h1>
          <p className="text-text-muted mt-1">
            Generate and manage client-ready deliverables.
          </p>
        </div>
        <Link
          to="/reports/builder"
          className="inline-flex items-center gap-2 bg-accent text-white px-4 py-2 hover:bg-accent-hover font-medium"
        >
          <Plus className="w-4 h-4" />
          Create New Report
        </Link>
      </header>

      {/* Quick-link cards */}
      <section>
        <h2 className="font-serif text-lg font-bold text-text-primary mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {QUICK_LINKS.map((q) => (
            <Link
              key={q.title}
              to={q.to}
              className="bg-bg-primary border border-bg-tertiary p-5 flex flex-col gap-3 hover:border-accent transition-colors"
            >
              <div className="flex items-center gap-2">
                {q.icon}
                <h3 className="font-serif text-base font-bold text-text-primary">{q.title}</h3>
              </div>
              <p className="text-sm text-text-muted flex-1">{q.blurb}</p>
              <span className="inline-flex items-center gap-1 text-sm text-accent font-medium">
                Open
                <ChevronRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Reports */}
      <section className="bg-bg-primary border border-bg-tertiary">
        <div className="px-5 py-4 border-b border-bg-tertiary flex items-center gap-2">
          <FileText className="w-4 h-4 text-accent" />
          <h2 className="font-serif text-lg font-bold text-text-primary">Recent Reports</h2>
        </div>
        <ul>
          {RECENT_REPORTS.map((r) => (
            <li
              key={r.title}
              className="border-b border-bg-tertiary last:border-b-0 p-4 flex items-center justify-between gap-4 flex-wrap"
            >
              <div className="min-w-0">
                <div className="font-serif font-medium text-text-primary">{r.title}</div>
                <div className="text-xs text-text-muted mt-0.5">{r.meta}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={r.viewTo}
                  className="inline-flex items-center gap-1 text-accent hover:underline text-sm font-medium px-2 py-1"
                >
                  <Eye className="w-4 h-4" />
                  View
                </Link>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 bg-bg-secondary text-text-secondary px-3 py-1 text-sm hover:bg-bg-tertiary"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-text-muted text-sm px-2 py-1 hover:text-text-secondary"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
