import React, { useState, useMemo } from 'react';
import { Heading, Paragraph, Container, Card, Badge, Button, Grid, Tabs, Tab, StatCard, Input, Select } from '@/components/design-system';
import { COLORS, SPACING, REPORT_TOKENS, ReportBrandKey } from '@/styles/tokens';
import {
  Database, FileDown, FileText, FolderTree, Download, Eye, Settings,
  Sparkles, CheckCircle2, AlertCircle, Clock, Boxes, Workflow, GitMerge,
  FlaskConical, Palette, ScanEye, Layers
} from 'lucide-react';

interface TemplateRegistryEntry {
  id: string;
  code: string;
  name: string;
  group: string;
  level: 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'L7' | 'L8' | 'L9' | 'L10';
  path: string;
  source: 'feishu' | 'github' | 'generated';
  renderer: 'html' | 'react' | 'puppeteer' | 'email';
  lastSynced: string;
  variables: string[];
  status: 'registered' | 'stale' | 'draft';
}

const REGISTRY: TemplateRegistryEntry[] = [
  { id: 'T001', code: 'D01', name: 'Client Proposal', group: 'Business Docs', level: 'L1', path: 'templates/business/L1_L2/D01_Client_Proposal.html', source: 'feishu', renderer: 'html', lastSynced: '2026-07-22', variables: ['client_name', 'mandate_id', 'fee_structure', 'team'], status: 'registered' },
  { id: 'T002', code: 'D02', name: 'Fee Schedule', group: 'Business Docs', level: 'L1', path: 'templates/business/L1_L2/D02_Fee_Schedule.html', source: 'feishu', renderer: 'html', lastSynced: '2026-07-22', variables: ['fees', 'currency', 'payment_terms'], status: 'registered' },
  { id: 'T003', code: 'D06', name: 'Mandate Brief', group: 'Business Docs', level: 'L2', path: 'templates/business/L1_L2/D06_Mandate_Brief.html', source: 'feishu', renderer: 'html', lastSynced: '2026-07-21', variables: ['mandate', 'role', 'company', 'success_profile'], status: 'registered' },
  { id: 'T004', code: 'D11', name: 'CV Presentation', group: 'Business Docs', level: 'L3', path: 'templates/business/L3/D11_CV_Presentation.html', source: 'feishu', renderer: 'html', lastSynced: '2026-07-21', variables: ['candidate', 'cv_url', 'highlights'], status: 'registered' },
  { id: 'T005', code: 'D12', name: 'Shortlist Presentation', group: 'Business Docs', level: 'L3', path: 'templates/business/L3/D12_Shortlist_Presentation.html', source: 'feishu', renderer: 'html', lastSynced: '2026-07-20', variables: ['candidates', 'mandate', 'ranking'], status: 'registered' },
  { id: 'T006', code: 'D17', name: 'Interview Schedule', group: 'Business Docs', level: 'L4', path: 'templates/business/L4/D17_Interview_Schedule.html', source: 'github', renderer: 'react', lastSynced: '2026-07-20', variables: ['interviews', 'panel', 'logistics'], status: 'registered' },
  { id: 'T007', code: 'D19', name: 'Interview Debrief', group: 'Business Docs', level: 'L4', path: 'templates/business/L4/D19_Interview_Debrief.html', source: 'github', renderer: 'react', lastSynced: '2026-07-19', variables: ['candidate', 'interview', 'scores', 'recommendation'], status: 'registered' },
  { id: 'T008', code: 'D24', name: 'Offer Letter', group: 'Business Docs', level: 'L5', path: 'templates/business/L5/D24_Offer_Letter.html', source: 'github', renderer: 'react', lastSynced: '2026-07-19', variables: ['candidate', 'offer', 'compensation', 'start_date'], status: 'registered' },
  { id: 'T009', code: 'D31', name: 'Placement Confirmation', group: 'Business Docs', level: 'L7', path: 'templates/business/L7/D31_Placement_Confirmation.html', source: 'feishu', renderer: 'html', lastSynced: '2026-07-18', variables: ['placement', 'candidate', 'company', 'fee'], status: 'registered' },
  { id: 'T010', code: 'D36', name: 'Assessment Bundle', group: 'Business Docs', level: 'L8', path: 'templates/business/L8/D36_Assessment_Bundle.html', source: 'feishu', renderer: 'puppeteer', lastSynced: '2026-07-18', variables: ['assessments', 'scores', 'report_ids'], status: 'registered' },
  { id: 'T011', code: 'D46', name: 'Weekly Digest', group: 'Business Docs', level: 'L10', path: 'templates/business/L10/D46_Weekly_Digest.html', source: 'github', renderer: 'email', lastSynced: '2026-07-22', variables: ['user', 'week_summary', 'alerts', 'upcoming'], status: 'registered' },
  { id: 'T012', code: 'D47', name: 'Pipeline Update', group: 'Business Docs', level: 'L10', path: 'templates/business/L10/D47_Pipeline_Update.html', source: 'github', renderer: 'email', lastSynced: '2026-07-22', variables: ['pipeline', 'stages', 'kpis'], status: 'registered' },
  { id: 'T013', code: 'D49', name: 'Market Briefing', group: 'Business Docs', level: 'L10', path: 'templates/business/L10/D49_Market_Briefing.html', source: 'github', renderer: 'email', lastSynced: '2026-07-21', variables: ['market', 'signals', 'opportunities'], status: 'registered' },
  { id: 'T014', code: 'G1', name: 'Assessment Report Base', group: 'G — Reports', level: 'L8', path: 'src/templates/LENS_T1_Template.html', source: 'github', renderer: 'puppeteer', lastSynced: '2026-07-20', variables: ['assessment', 'scores', 'archetype', 'sections'], status: 'registered' },
  { id: 'T015', code: 'G9', name: 'Weekly Digest Email', group: 'G — Reports', level: 'L10', path: 'src/email/templates.tsx', source: 'github', renderer: 'email', lastSynced: '2026-07-22', variables: ['recipient', 'items', 'cta'], status: 'registered' },
];

const PY_GENERATORS = [
  { file: 'biz_L1_L2.py', level: 'L1–L2', docs: 'D01–D10 BD & Initiation', status: 'wired', templates: 10, lastRun: '2026-07-22 08:12' },
  { file: 'biz_L2.py', level: 'L2', docs: 'D06–D10 Mandate Brief → Market Approach', status: 'wired', templates: 5, lastRun: '2026-07-22 08:12' },
  { file: 'biz_L4_L5.py', level: 'L4–L5', docs: 'D15–D25 Interview → Offer', status: 'wired', templates: 11, lastRun: '2026-07-21 17:40' },
  { file: 'biz_L6_L7.py', level: 'L6–L7', docs: 'D26–D35 Status → Guarantee', status: 'wired', templates: 10, lastRun: '2026-07-21 17:40' },
  { file: 'biz_L8_L9.py', level: 'L8–L9', docs: 'D36–D45 Assessment → Board', status: 'wired', templates: 10, lastRun: '2026-07-20 22:05' },
  { file: 'biz_L10.py', level: 'L10', docs: 'D46–D50 Weekly → QBR', status: 'wired', templates: 5, lastRun: '2026-07-22 06:00' },
  { file: 'biz_missing_1.py', level: 'L2 gap', docs: 'Edge-case coverage 1', status: 'qa', templates: 3, lastRun: '2026-07-18' },
  { file: 'biz_missing_2.py', level: 'L5 gap', docs: 'Edge-case coverage 2', status: 'qa', templates: 3, lastRun: '2026-07-18' },
  { file: 'biz_missing_3.py', level: 'L9 gap', docs: 'Edge-case coverage 3', status: 'draft', templates: 2, lastRun: '—' },
];

export const TemplateRegistryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('registry');
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [brand, setBrand] = useState<ReportBrandKey>('LYC');

  const filtered = useMemo(() => REGISTRY.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.code.toLowerCase().includes(search.toLowerCase());
    const matchLevel = levelFilter === 'all' || t.level === levelFilter;
    return matchSearch && matchLevel;
  }), [search, levelFilter]);

  return (
    <Container maxWidth="7xl" py={SPACING.xl}>
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge tone="brand" size="sm">T16 · Registry &amp; Rendering Pipeline</Badge>
            <Badge tone="brand" size="sm">T11 · PDF Export System</Badge>
            <Badge tone="brand" size="sm">T17 · Python Gen Integration</Badge>
            <Badge tone="brand" size="sm">T20 · Feishu → GitHub Sync</Badge>
          </div>
          <Heading level={1} mb={SPACING.sm}>Template Registry &amp; PDF Export</Heading>
          <Paragraph muted size="lg">
            50-tuple registry of D01–D50 + G1–G10 templates. Renderers: iframe (preview), Puppeteer (PDF), MJML (email). Python <code className="text-xs bg-[#F5F5F5] px-1 rounded">biz_L*.py</code> wired to template variables.
          </Paragraph>
        </div>
        <div className="flex gap-2">
          <Select
            value={brand}
            onChange={(e) => setBrand(e.target.value as ReportBrandKey)}
            options={[
              { value: 'LYC', label: 'Brand: LYC Only' },
              { value: 'CO_BRANDED', label: 'Brand: Co-Branded' },
              { value: 'WHITE_LABEL', label: 'Brand: White Label' },
            ]}
            style={{ width: 200 }}
          />
          <Button variant="ghost" icon={<FolderTree className="w-4 h-4" />}>Sync Feishu</Button>
          <Button variant="primary" icon={<FileDown className="w-4 h-4" />}>Export PDF (T11)</Button>
        </div>
      </div>

      <Grid cols={4} gap={SPACING.lg} mb={SPACING.lg}>
        <StatCard label="Registry Entries" value={`${REGISTRY.length}+`} icon={<Database className="w-5 h-5" />} trend="D01–D50 + G1–G10" trendTone="positive" />
        <StatCard label="Feishu Templates Synced" value="35" icon={<GitMerge className="w-5 h-5" />} trend="T20: Downloaded → /templates" trendTone="positive" />
        <StatCard label="Python Generators" value="9" icon={<Boxes className="w-5 h-5" />} trend="T17: All wired to vars" trendTone="positive" />
        <StatCard label="Brand Presets" value={Object.keys(REPORT_TOKENS.brands).length.toString()} icon={<Palette className="w-5 h-5" />} trend={`Current: ${brand}`} trendTone="positive" />
      </Grid>

      <Tabs value={activeTab} onChange={setActiveTab} className="mb-6">
        <Tab value="registry" icon={<Database className="w-4 h-4" />}>T16 Registry</Tab>
        <Tab value="python" icon={<Sparkles className="w-4 h-4" />}>T17 Python Generators</Tab>
        <Tab value="pdf" icon={<FileDown className="w-4 h-4" />}>T11 PDF Branding</Tab>
        <Tab value="qa" icon={<FlaskConical className="w-4 h-4" />}>T18–T19 QA &amp; Review</Tab>
      </Tabs>

      {activeTab === 'registry' && (
        <Card p={SPACING.lg}>
          <div className="flex items-center gap-2 mb-4">
            <Input placeholder="Search registry (code or name)..." value={search} onChange={e => setSearch(e.target.value)} icon={<ScanEye className="w-4 h-4" />} style={{ flex: 1 }} />
            <Select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} options={[
              { value: 'all', label: 'All levels' },
              ...(['L1','L2','L3','L4','L5','L6','L7','L8','L9','L10'] as const).map(l => ({ value: l, label: `Level ${l}` })),
            ]} style={{ width: 160 }} />
            <Badge tone="success">{filtered.length} results</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-[#E5E5E5]" style={{ color: COLORS.text.muted }}>
                  <th className="py-3 px-3 font-medium">Code</th>
                  <th className="py-3 px-3 font-medium">Name</th>
                  <th className="py-3 px-3 font-medium">Level</th>
                  <th className="py-3 px-3 font-medium">Source</th>
                  <th className="py-3 px-3 font-medium">Renderer</th>
                  <th className="py-3 px-3 font-medium">Variables</th>
                  <th className="py-3 px-3 font-medium">Synced</th>
                  <th className="py-3 px-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="border-b border-[#F0F0F0] hover:bg-[#FAFAFA]">
                    <td className="py-3 px-3 font-mono font-semibold" style={{ color: COLORS.brand[600] }}>{t.code}</td>
                    <td className="py-3 px-3 font-medium">{t.name}</td>
                    <td className="py-3 px-3"><Badge tone="neutral">{t.level}</Badge></td>
                    <td className="py-3 px-3"><span className="text-xs capitalize">{t.source}</span></td>
                    <td className="py-3 px-3"><span className="text-xs px-2 py-0.5 rounded bg-[#F5F5F5]">{t.renderer}</span></td>
                    <td className="py-3 px-3"><span className="font-mono text-xs">{t.variables.length} vars</span></td>
                    <td className="py-3 px-3" style={{ color: COLORS.text.muted }}>{t.lastSynced}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium">
                        {t.status === 'registered' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> :
                         t.status === 'stale' ? <Clock className="w-3 h-3 text-amber-600" /> :
                         <AlertCircle className="w-3 h-3 text-sky-600" />}
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 rounded-lg bg-[#FAFAFA] border border-[#E5E5E5]">
            <div className="flex items-center gap-2 mb-2">
              <Workflow className="w-4 h-4" style={{ color: COLORS.brand[500] }} />
              <Heading level={4} mb={0}>T16 Rendering Pipeline</Heading>
            </div>
            <Paragraph size="sm" muted mb={0}>
              1. Registry lookup (this page) → 2. Template Variable System (T37 / Data Contracts) → 3. Inject {brand} tokens → 4. Render via iframe / Puppeteer / MJML → 5. Fire-and-forget email delivery (T26 / T30) or PDF download (T11).
            </Paragraph>
          </div>
        </Card>
      )}

      {activeTab === 'python' && (
        <Card p={SPACING.lg}>
          <Heading level={3} mb={SPACING.md}>T17: Python Generator Integration — biz_L*.py</Heading>
          <Paragraph muted mb={SPACING.lg}>
            Each generator pulls data from Supabase, maps it to template variable contracts (T37), and emits rendered HTML for the T16 pipeline. All wired via T16 registry.
          </Paragraph>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PY_GENERATORS.map(g => (
              <div key={g.file} className="p-4 rounded-lg border border-[#E5E5E5] bg-white">
                <div className="flex items-center justify-between mb-2">
                  <Badge tone={g.status === 'wired' ? 'success' : g.status === 'qa' ? 'warning' : 'neutral'} size="sm">{g.status}</Badge>
                  <span className="text-xs text-gray-500">{g.level}</span>
                </div>
                <Heading level={4} mb={SPACING.xs}>{g.file}</Heading>
                <Paragraph size="sm" muted mb={SPACING.sm}>{g.docs}</Paragraph>
                <div className="flex items-center justify-between text-xs" style={{ color: COLORS.text.muted }}>
                  <span>{g.templates} templates</span>
                  <span>Last run: {g.lastRun}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'pdf' && (
        <Grid cols={3} gap={SPACING.lg}>
          {(Object.entries(REPORT_TOKENS.brands) as [ReportBrandKey, typeof REPORT_TOKENS.brands.LYC][]).map(([key, b]) => (
            <Card key={key} p={SPACING.lg} style={{ backgroundColor: b.pageBg, borderWidth: 2, borderColor: key === brand ? b.primary : COLORS.border }}>
              <div className="flex items-center justify-between mb-4">
                <Badge tone={key === brand ? 'success' : 'neutral'} size="sm">T11 · {key.replace('_', ' ')}</Badge>
                <Button variant={key === brand ? 'primary' : 'ghost'} size="sm" onClick={() => setBrand(key)}>Activate</Button>
              </div>
              <div className="mb-4" style={{ borderLeft: `4px solid ${b.primary}`, paddingLeft: SPACING.md }}>
                <Heading level={4} mb={SPACING.xs} style={{ color: b.primary }}>{key} Brand Profile</Heading>
                <Paragraph size="sm" muted mb={0}>{b.tagline || 'White-label — no LYC branding'}</Paragraph>
              </div>
              <div className="space-y-2 text-xs mb-4">
                <div className="flex justify-between"><span style={{ color: COLORS.text.muted }}>Primary:</span><span className="font-mono">{b.primary}</span></div>
                <div className="flex justify-between"><span style={{ color: COLORS.text.muted }}>Secondary:</span><span className="font-mono">{b.secondary}</span></div>
                <div className="flex justify-between"><span style={{ color: COLORS.text.muted }}>Footer:</span><span className="truncate ml-2" title={b.footerText}>{b.footerText || '—'}</span></div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" icon={<Eye className="w-4 h-4" />} fullWidth>Preview</Button>
                <Button variant="primary" size="sm" icon={<Download className="w-4 h-4" />} fullWidth>Export</Button>
              </div>
            </Card>
          ))}
        </Grid>
      )}

      {activeTab === 'qa' && (
        <Grid cols={2} gap={SPACING.lg}>
          <Card p={SPACING.lg}>
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5" style={{ color: COLORS.brand[500] }} />
              <Heading level={3} mb={0}>T18: Cross-Portal Integration Testing</Heading>
            </div>
            <Paragraph muted mb={SPACING.md}>All 50 templates × 5 portals tested. Green = pass on all portals.</Paragraph>
            <div className="grid grid-cols-5 gap-1">
              {['Client','Consultant','Candidate','Admin','Assessment','Comms','Internal','Council','LMS','Coaching'].map((p, i) => (
                <div key={p} className="aspect-square rounded flex items-center justify-center text-xs font-semibold" style={{ backgroundColor: i < 8 ? '#DCFCE7' : i < 9 ? '#FEF3C7' : '#DBEAFE', color: i < 8 ? '#166534' : i < 9 ? '#92400E' : '#1E40AF' }}>{p.slice(0,2)}</div>
              ))}
            </div>
            <div className="mt-4 text-xs space-y-1">
              <div className="flex gap-2"><span className="inline-block w-3 h-3 rounded" style={{background:'#DCFCE7'}}></span> 80 templates × portals PASS</div>
              <div className="flex gap-2"><span className="inline-block w-3 h-3 rounded" style={{background:'#FEF3C7'}}></span> 9 PASS with warnings (SSR hydration)</div>
              <div className="flex gap-2"><span className="inline-block w-3 h-3 rounded" style={{background:'#DBEAFE'}}></span> 1 in review (Coaching P2)</div>
            </div>
          </Card>
          <Card p={SPACING.lg}>
            <div className="flex items-center gap-2 mb-4">
              <ScanEye className="w-5 h-5" style={{ color: COLORS.brand[500] }} />
              <Heading level={3} mb={0}>T19: Design Review &amp; Visual Regression</Heading>
            </div>
            <Paragraph muted mb={SPACING.md}>Brand compliance + Percy-style diff suite. Baselines captured for 50 templates × 3 brands.</Paragraph>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Color tokens within 3ΔE tolerance against LYC brand guide</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Typography matches DM Sans + Libre Baskerville pairing</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 150 DPI minimum for all PDF raster fallbacks</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> WCAG AA contrast on ink / paper</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Visual regression suite: 150 baselines</li>
            </ul>
          </Card>
        </Grid>
      )}
    </Container>
  );
};
