import React, { useState } from 'react';
import { FileText, ChevronRight, Search, Layout, BarChart3, Calendar, TrendingUp, Lightbulb, Briefcase, Building2, Target } from 'lucide-react';
import { Badge } from '@/components/ui';
import type { ReportTemplateInfo } from '@/services/reportService';

interface ReportTemplateSelectorProps {
  templates: ReportTemplateInfo[];
  selectedId?: string;
  onSelect: (templateId: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Assessment & Evaluation': <FileText className="w-5 h-5" />,
  'Coaching & Development': <Users className="w-5 h-5" />,
  'Session & Meeting': <Calendar className="w-5 h-5" />,
  'Progress & Tracking': <TrendingUp className="w-5 h-5" />,
  'Intelligence & Insights': <Lightbulb className="w-5 h-5" />,
  'Career Planning': <Briefcase className="w-5 h-5" />,
  'Executive Briefing': <Building2 className="w-5 h-5" />,
  'Match Analysis': <Target className="w-5 h-5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  'Assessment & Evaluation': '#C108AB',
  'Coaching & Development': '#9A0688',
  'Session & Meeting': '#740566',
  'Progress & Tracking': '#C108AB',
  'Intelligence & Insights': '#C108AB',
  'Career Planning': '#9A0688',
  'Executive Briefing': '#C108AB',
  'Match Analysis': '#C108AB',
};

import { Users } from 'lucide-react';

export function ReportTemplateSelector({ templates, selectedId, onSelect }: ReportTemplateSelectorProps) {
  const [search, setSearch] = useState('');
  const grouped = groupByCategory(templates);

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
  );

  const filteredGrouped = groupByCategory(filteredTemplates);

  return (
    <div className="bg-bg border border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-[#C108AB]" />
            <h2 className="text-lg font-semibold text-text-primary">Report Templates</h2>
          </div>
          <span className="text-sm text-text-muted">{templates.length} templates</span>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            className="w-full pl-10 pr-4 py-2 bg-bg-alt border border-border text-text-primary focus:outline-none focus:ring-1 focus:ring-[#C108AB]"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-auto max-h-[400px]">
        {Object.keys(filteredGrouped).length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No templates match your search</p>
          </div>
        ) : (
          Object.entries(filteredGrouped).map(([category, items]) => (
            <div key={category} className="border-b border-border last:border-b-0">
              <div className="px-4 py-2 bg-bg-alt flex items-center gap-2">
                <span className="text-sm font-medium text-text-muted uppercase tracking-wide">
                  {category}
                </span>
                <span className="text-xs text-text-muted">({items.length})</span>
              </div>
              <div className="p-2">
                {items.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => onSelect(template.id)}
                    className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                      selectedId === template.id
                        ? 'bg-[#C108AB]/10 border border-[#C108AB]'
                        : 'hover:bg-bg-alt border border-transparent'
                    }`}
                  >
                    <div
                      className="p-2"
                      style={{ color: CATEGORY_COLORS[template.category] || '#C108AB' }}
                    >
                      {CATEGORY_ICONS[template.category] || <FileText className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-text-primary">{template.name}</div>
                      <div className="text-xs text-text-muted truncate">{template.description}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-muted" />
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function groupByCategory(templates: ReportTemplateInfo[]): Record<string, ReportTemplateInfo[]> {
  const groups: Record<string, ReportTemplateInfo[]> = {};
  for (const t of templates) {
    if (!groups[t.category]) groups[t.category] = [];
    groups[t.category].push(t);
  }
  return groups;
}
