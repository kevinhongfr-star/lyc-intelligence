import React, { useState } from 'react';
import { Heading, Paragraph, Container, Card, Badge, Button, Grid, Tabs, Tab, StatCard, Input } from '@/components/design-system';
import { COLORS, SPACING, REPORT_TOKENS } from '@/styles/tokens';
import {
  FileText, Layout, Mail, Presentation, Users, BarChart3,
  Target, ClipboardCheck, Network, BookOpen, Download,
  Eye, Settings, Sparkles, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';

interface TemplateInfo {
  id: string;
  name: string;
  group: string;
  variants: string[];
  status: 'ready' | 'draft' | 'qa';
  lastUpdated: string;
  usageCount: number;
}

const TEMPLATES: TemplateInfo[] = [
  { id: 'G1', name: 'Assessment Report', group: 'G1 — Assessments', variants: ['Base', 'Executive', 'Candidate', 'Team', 'Cohort'], status: 'ready', lastUpdated: '2026-07-22', usageCount: 1247 },
  { id: 'G2', name: 'Executive Briefing', group: 'G2 — Briefings', variants: ['Slide Deck', 'Board Ready', '1-Pager'], status: 'ready', lastUpdated: '2026-07-22', usageCount: 328 },
  { id: 'G3', name: 'Scorecard & Comparison', group: 'G3 — Scorecards', variants: ['Single Scorecard', 'Side-by-Side', 'Matrix'], status: 'ready', lastUpdated: '2026-07-21', usageCount: 892 },
  { id: 'G4', name: 'Diagnostic Report', group: 'G4 — Diagnostics', variants: ['Team Diagnostic', 'Individual Diagnostic', 'Cohort Diagnostic'], status: 'ready', lastUpdated: '2026-07-20', usageCount: 541 },
  { id: 'G5', name: 'Talent Map & Market Viz', group: 'G5 — Visualizations', variants: ['Bubble Chart', 'Heatmap', 'Org Chart'], status: 'ready', lastUpdated: '2026-07-20', usageCount: 276 },
  { id: 'G6', name: 'Pipeline & Status', group: 'G6 — Pipeline', variants: ['Dashboard', 'Status Cards', 'Funnel View'], status: 'ready', lastUpdated: '2026-07-19', usageCount: 1105 },
  { id: 'G7', name: 'Shortlist & Profile', group: 'G7 — Profiles', variants: ['Shortlist View', 'Candidate Card', 'Longlist'], status: 'ready', lastUpdated: '2026-07-19', usageCount: 1532 },
  { id: 'G8', name: 'Consultation Guide', group: 'G8 — Guides', variants: ['Interview Prep', 'Debrief', 'Framework Kit'], status: 'ready', lastUpdated: '2026-07-18', usageCount: 418 },
  { id: 'G9', name: 'Email Templates', group: 'G9 — Comms', variants: ['Weekly Digest', 'Alert', 'Briefing'], status: 'ready', lastUpdated: '2026-07-18', usageCount: 3891 },
  { id: 'G10', name: 'PDF Export System', group: 'G10 — Exports', variants: ['LYC Branded', 'Co-Branded', 'Client White-Label'], status: 'qa', lastUpdated: '2026-07-17', usageCount: 672 },
];

const DESIGN_COMPONENTS = [
  'ReportHeader', 'SectionDivider', 'ScoreCard', 'DimensionBar', 'RadarChart',
  'HeatmapGrid', 'ComparisonTable', 'ProfileCard', 'StatusBadge', 'CTAButton',
  'PageFooter', 'WatermarkLayer', 'TableOfContents', 'AppendixBlock', 'SignatureBlock'
];

const STATUS_STYLES: Record<string, string> = {
  ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  qa: 'bg-sky-50 text-sky-700 border-sky-200',
};

export const ReportEnginePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const filteredTemplates = TEMPLATES.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.group.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = !selectedGroup || t.group.startsWith(selectedGroup);
    return matchesSearch && matchesGroup;
  });

  return (
    <Container maxWidth="7xl" py={SPACING.xl}>
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge tone="brand" size="sm">EPIC #60 · v6 Report Engine</Badge>
            <Badge tone="success" size="sm">T01 Design System Ready</Badge>
          </div>
          <Heading level={1} mb={SPACING.sm}>Report Engine Administration</Heading>
          <Paragraph muted size="lg">
            Central hub for 50+ report templates across 10 groups. T01: 15 design tokens &amp; shared components initialized.
          </Paragraph>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" icon={<Settings className="w-4 h-4" />}>Token Config</Button>
          <Button variant="primary" icon={<Sparkles className="w-4 h-4" />}>Generate Report</Button>
        </div>
      </div>

      <Grid cols={4} gap={SPACING.lg} mb={SPACING.lg}>
        <StatCard label="Template Groups" value="10" icon={<Layout className="w-5 h-5" />} trend="+2 this sprint" trendTone="positive" />
        <StatCard label="Total Variants" value="50" icon={<FileText className="w-5 h-5" />} trend="+8 this sprint" trendTone="positive" />
        <StatCard label="Reports Generated" value="11,382" icon={<Download className="w-5 h-5" />} trend="+24% MoM" trendTone="positive" />
        <StatCard label="Design Components" value="15" icon={<CheckCircle2 className="w-5 h-5" />} trend="All T01 shipped" trendTone="positive" />
      </Grid>

      <Tabs value={activeTab} onChange={setActiveTab} className="mb-6">
        <Tab value="overview" icon={<Layout className="w-4 h-4" />}>Overview</Tab>
        <Tab value="assessments" icon={<ClipboardCheck className="w-4 h-4" />}>G1 · Assessments (T02)</Tab>
        <Tab value="emails" icon={<Mail className="w-4 h-4" />}>G9 · Emails (T03)</Tab>
        <Tab value="briefings" icon={<Presentation className="w-4 h-4" />}>G2 · Briefings (T04)</Tab>
        <Tab value="profiles" icon={<Users className="w-4 h-4" />}>G7 · Profiles (T05)</Tab>
        <Tab value="scorecards" icon={<BarChart3 className="w-4 h-4" />}>G3 · Scorecards (T06)</Tab>
        <Tab value="pipeline" icon={<Target className="w-4 h-4" />}>G6 · Pipeline (T07)</Tab>
        <Tab value="diagnostics" icon={<Network className="w-4 h-4" />}>G4/G5 · Diagnostics &amp; Maps (T08/T09)</Tab>
        <Tab value="guides" icon={<BookOpen className="w-4 h-4" />}>G8 · Guides (T10)</Tab>
      </Tabs>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card p={SPACING.lg}>
            <div className="flex items-center justify-between mb-4">
              <Heading level={3} mb={0}>Template Library (T01–T10)</Heading>
              <div className="flex gap-2">
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<FileText className="w-4 h-4" />}
                  style={{ width: 280 }}
                />
                {['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10'].map(g => (
                  <Button
                    key={g}
                    variant={selectedGroup === g ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedGroup(selectedGroup === g ? null : g)}
                  >{g}</Button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-[#E5E5E5]" style={{ color: COLORS.text.muted }}>
                    <th className="py-3 px-3 font-medium">Group</th>
                    <th className="py-3 px-3 font-medium">Template</th>
                    <th className="py-3 px-3 font-medium">Variants</th>
                    <th className="py-3 px-3 font-medium">Status</th>
                    <th className="py-3 px-3 font-medium">Usage</th>
                    <th className="py-3 px-3 font-medium">Updated</th>
                    <th className="py-3 px-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTemplates.map(t => (
                    <tr key={t.id} className="border-b border-[#F0F0F0] hover:bg-[#FAFAFA]">
                      <td className="py-3 px-3 font-mono text-xs" style={{ color: COLORS.brand[600] }}>{t.id}</td>
                      <td className="py-3 px-3 font-medium">{t.name}</td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {t.variants.map(v => (
                            <span key={v} className="px-1.5 py-0.5 text-xs rounded bg-[#F5F5F5]">{v}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${STATUS_STYLES[t.status]}`}>
                          {t.status === 'ready' ? <CheckCircle2 className="w-3 h-3" /> :
                           t.status === 'qa' ? <Clock className="w-3 h-3" /> :
                           <AlertCircle className="w-3 h-3" />}
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 tabular-nums">{t.usageCount.toLocaleString()}</td>
                      <td className="py-3 px-3" style={{ color: COLORS.text.muted }}>{t.lastUpdated}</td>
                      <td className="py-3 px-3">
                        <div className="flex gap-1">
                          <button className="p-1.5 rounded hover:bg-[#F0F0F0]" title="Preview">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 rounded hover:bg-[#F0F0F0]" title="Download">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card p={SPACING.lg}>
            <div className="flex items-center justify-between mb-4">
              <Heading level={3} mb={0}>T01: Design System Foundation — 15 Shared Components</Heading>
              <Badge tone="success">All Ready</Badge>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {DESIGN_COMPONENTS.map(c => (
                <div key={c} className="p-3 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] hover:bg-white hover:border-[#C084FC] transition-colors cursor-pointer">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium">{c}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: REPORT_TOKENS.background }}>
              <Heading level={4} mb={SPACING.sm}>Report Tokens (from tokens.ts)</Heading>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div><span style={{ color: COLORS.text.muted }}>Brand:</span> <span className="font-mono" style={{ color: REPORT_TOKENS.brand }}>{REPORT_TOKENS.brand}</span></div>
                <div><span style={{ color: COLORS.text.muted }}>Accent:</span> <span className="font-mono" style={{ color: REPORT_TOKENS.accent }}>{REPORT_TOKENS.accent}</span></div>
                <div><span style={{ color: COLORS.text.muted }}>Page BG:</span> <span className="font-mono">{REPORT_TOKENS.background}</span></div>
                <div><span style={{ color: COLORS.text.muted }}>Ink:</span> <span className="font-mono" style={{ color: REPORT_TOKENS.ink }}>{REPORT_TOKENS.ink}</span></div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab !== 'overview' && (
        <Card p={SPACING.xl}>
          <div className="flex items-center gap-2 mb-4">
            <Badge tone="brand">Template Preview</Badge>
            <Badge tone="success">Group Ready</Badge>
          </div>
          <Heading level={2} mb={SPACING.md}>
            {activeTab === 'assessments' && 'G1 — Assessment Report Templates (T02)'}
            {activeTab === 'emails' && 'G9 — Email Report Templates (T03)'}
            {activeTab === 'briefings' && 'G2 — Executive Briefing & Presentation Templates (T04)'}
            {activeTab === 'profiles' && 'G7 — Shortlist & Candidate Profile Templates (T05)'}
            {activeTab === 'scorecards' && 'G3 — Scorecard & Comparison View Templates (T06)'}
            {activeTab === 'pipeline' && 'G6 — Pipeline & Status Report Templates (T07)'}
            {activeTab === 'diagnostics' && 'G4/G5 — Diagnostic + Talent Map Templates (T08/T09)'}
            {activeTab === 'guides' && 'G8 — Consultation Guide Templates (T10)'}
          </Heading>
          <Paragraph muted mb={SPACING.lg}>
            1 base template + 4 variants × 9 assessment instruments (G1), or equivalent variants per group. Rendered via the T16 Template Registry pipeline with tokens injected from <code className="text-xs bg-[#F5F5F5] px-1 rounded">tokens.ts &gt; REPORT_TOKENS</code>.
          </Paragraph>
          <div className="aspect-video rounded-lg border-2 border-dashed border-[#E0E0E0] flex items-center justify-center" style={{ backgroundColor: REPORT_TOKENS.background }}>
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: COLORS.text.muted }} />
              <Paragraph size="sm" muted mb={SPACING.xs}>Template preview area</Paragraph>
              <Paragraph size="xs" muted>Rendered via src/services/reportGenerator.ts &amp; T16 registry</Paragraph>
            </div>
          </div>
        </Card>
      )}
    </Container>
  );
};
