/**
 * OrgIntelligencePage — main entry for the Org Intelligence module.
 *
 * Tabs:
 *   - Companies: CSV upload + format reference (T5.1)
 *   - Talent Pool: individuals per company + manual entry (T5.2)
 *   - Evaluations: list of evaluation runs + re-score + override (T5.3)
 *   - Scoring: platform-wide 5-criteria stats + bar chart (T5.4)
 *   - One-Pager: company summary + GRID PDF generator (T5.5 + T6)
 *
 * Access: gated by AdminRoute (admin role required). Renders inside the
 * platform AppLayout, so it inherits the platform sidebar.
 */
import React, { useState } from 'react';
import { Building2, Users, ClipboardCheck, BarChart3, FileText } from 'lucide-react';
import { CSVUploader } from '@/components/org-intel/CSVUploader';
import { TalentPoolTab } from '@/components/org-intel/TalentPoolTab';
import { EvaluationsTab } from '@/components/org-intel/EvaluationsTab';
import { ScoringTab } from '@/components/org-intel/ScoringTab';
import { OnePagerTab } from '@/components/org-intel/OnePagerTab';

type Tab = 'companies' | 'talent-pool' | 'evaluations' | 'scoring' | 'one-pager';

interface TabDef {
  id: Tab;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const TABS: TabDef[] = [
  { id: 'companies',    label: 'Companies',    icon: <Building2 className="w-4 h-4" />,      description: 'Target company list — CSV upload + manual entry' },
  { id: 'talent-pool',  label: 'Talent Pool',  icon: <Users className="w-4 h-4" />,          description: 'Individuals in the org tree per company' },
  { id: 'evaluations',  label: 'Evaluations',  icon: <ClipboardCheck className="w-4 h-4" />, description: 'Active evaluation runs and outcomes' },
  { id: 'scoring',      label: 'Scoring',      icon: <BarChart3 className="w-4 h-4" />,      description: 'Platform-wide 5-criteria scoring overview' },
  { id: 'one-pager',    label: 'One-Pager',    icon: <FileText className="w-4 h-4" />,       description: 'Per-company summary + GRID PDF generator' },
];

export function OrgIntelligencePage() {
  const [active, setActive] = useState<Tab>('companies');

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-serif text-text-primary">Org Intelligence</h1>
        <p className="text-text-muted mt-1">
          Desktop-research-driven org charts and talent profiles, scored before
          assessments begin.
        </p>
      </header>

      <nav className="border-b border-bg-hover">
        <ul className="flex gap-1 -mb-px overflow-x-auto">
          {TABS.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => setActive(t.id)}
                className={`
                  px-4 py-2 text-sm font-medium flex items-center gap-2 border-b-2
                  transition-colors whitespace-nowrap
                  ${active === t.id
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-muted hover:text-text-primary hover:border-bg-hover'}
                `}
              >
                {t.icon}
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <section className="bg-white border border-bg-hover rounded-none p-6">
        <h2 className="text-xl font-medium text-text-primary">
          {TABS.find((t) => t.id === active)?.label}
        </h2>
        <p className="text-text-muted text-sm mt-1 mb-6">
          {TABS.find((t) => t.id === active)?.description}
        </p>

        {active === 'companies' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-text-secondary mb-2">
                Upload target companies
              </h3>
              <CSVUploader />
            </div>

            <div className="border-t border-bg-hover pt-6">
              <h3 className="text-sm font-medium text-text-secondary mb-2">
                Format reference
              </h3>
              <div className="bg-bg-secondary border border-bg-hover rounded-none p-3 font-mono text-xs overflow-x-auto">
                <div className="text-text-muted"># Required columns</div>
                <div>name, mandate_id</div>
                <div className="text-text-muted mt-2"># Optional columns</div>
                <div>
                  name_cn, industry, hq_city, hq_country, website,
                  brief_description, is_comparator
                </div>
                <div className="text-text-muted mt-2"># Example</div>
                <div>
                  Codelco China, 智利国家铜业, Bulk commodities, Shanghai, China,
                  https://www.codelco.com, State-owned copper producer,
                  1f3a57d9-e3fe-4e96-b761-e769d94f26ae, true
                </div>
              </div>
            </div>
          </div>
        )}

        {active === 'talent-pool' && <TalentPoolTab />}
        {active === 'evaluations' && <EvaluationsTab />}
        {active === 'scoring' && <ScoringTab />}
        {active === 'one-pager' && <OnePagerTab />}
      </section>
    </div>
  );
}
