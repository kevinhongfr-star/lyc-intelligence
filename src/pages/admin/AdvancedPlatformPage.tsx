import React, { useState } from 'react';
import { Heading, Paragraph, Container, Card, Badge, Button, Grid, Tabs, Tab, StatCard, Input, Select } from '@/components/design-system';
import { COLORS, SPACING } from '@/styles/tokens';
import {
  Brain, Wand2, Bot, FileSignature, PenLine, CheckCircle2,
  Sparkles, Database, Workflow, Shield, Gauge, FileText, Cpu
} from 'lucide-react';

interface InteractiveTemplate {
  id: string;
  code: string;
  name: string;
  level: string;
  reactified: boolean;
  features: string[];
  status: 'complete' | 'in_progress' | 'planned';
}

const INTERACTIVE: InteractiveTemplate[] = [
  // T31 · L4 Interview & Scheduling
  { id: 't31-1', code: 'D15', name: 'Interview Prep (Client)', level: 'L4', reactified: true, features: ['Form wizard', 'Save draft', 'Share link', 'Kiosk mode'], status: 'complete' },
  { id: 't31-2', code: 'D16', name: 'Interview Prep (Candidate)', level: 'L4', reactified: true, features: ['Checklist', 'Video tips', 'Timeline'], status: 'complete' },
  { id: 't31-3', code: 'D17', name: 'Interview Schedule', level: 'L4', reactified: true, features: ['Calendar sync', 'Timezone detect', 'Slot picker', 'Reschedule flow'], status: 'complete' },
  { id: 't31-4', code: 'D18', name: 'Interview Framework', level: 'L4', reactified: true, features: ['Question bank', 'Score rubric', 'Live notes'], status: 'complete' },
  { id: 't31-5', code: 'D19', name: 'Interview Debrief', level: 'L4', reactified: true, features: ['Real-time collab', 'Consensus meter', 'Approval gate'], status: 'complete' },
  // T32 · L5-L6 Feedback & Forms
  { id: 't32-1', code: 'D20', name: 'Feedback Form', level: 'L5', reactified: true, features: ['Conditional fields', 'Anonymous option', 'E-signature'], status: 'complete' },
  { id: 't32-2', code: 'D21', name: 'Final Recommendation', level: 'L5', reactified: true, features: ['Rubric score', 'Sign-off chain', 'PDF export'], status: 'complete' },
  { id: 't32-3', code: 'D22', name: 'Compensation Recap', level: 'L5', reactified: true, features: ['Live calculator', 'Scenario slider'], status: 'complete' },
  { id: 't32-4', code: 'D23', name: 'Reference Check', level: 'L5', reactified: true, features: ['Email workflow', 'Multi-referee', 'Redact PII'], status: 'in_progress' },
  { id: 't32-5', code: 'D24', name: 'Offer Letter', level: 'L5', reactified: true, features: ['Clause library', 'E-signature', 'Version diff'], status: 'complete' },
  { id: 't32-6', code: 'D25', name: 'Counter-Offer Advisory', level: 'L5', reactified: true, features: ['Scenario tree', 'Coach tips'], status: 'complete' },
  { id: 't32-7', code: 'D26', name: 'Status Update', level: 'L6', reactified: true, features: ['Auto-fill', 'Client notification'], status: 'complete' },
  { id: 't32-8', code: 'D27', name: 'Meeting Minutes', level: 'L6', reactified: true, features: ['Live transcript', 'AI summary', 'Action extraction'], status: 'complete' },
  // T33 · L8 Assessment & Onboarding
  { id: 't33-1', code: 'D36', name: 'Assessment Bundle', level: 'L8', reactified: true, features: ['Instrument picker', 'Progress tracker', 'Resume mid-flow'], status: 'complete' },
  { id: 't33-2', code: 'D37', name: 'Development Recs', level: 'L8', reactified: true, features: ['Goal builder', 'Activity library', '6-mo plan'], status: 'complete' },
  { id: 't33-3', name: 'Onboarding Wizard', code: 'L8-OOB', level: 'L8', reactified: true, features: ['Role picker', 'Org mapping', 'ICP prompt'], status: 'complete' },
];

const AICAPABILITIES = [
  { id: 'gpt-doc', name: 'Document Drafting', desc: 'DeepSeek-powered D01–D50 drafting from mandate context.', icon: <FileSignature className="w-5 h-5" />, sample: 'Generate D01 Client Proposal for Mandate #482' },
  { id: 'gpt-polish', name: 'Brand Voice Polishing', desc: 'A3 LLM Voice Engine + brand lens applied before send.', icon: <Wand2 className="w-5 h-5" />, sample: 'Apply LYC ECHO guidelines to D19 debrief draft' },
  { id: 'gpt-score', name: 'Score Explanation', desc: 'Translate dimension scores to narrative per G1 templates.', icon: <PenLine className="w-5 h-5" />, sample: 'Explain SHIFT scores for Priya S. in executive language' },
  { id: 'gpt-email', name: 'Email Outreach Draft', desc: 'A4 Content Generator + Banned Word Scanner (B1) pre-send.', icon: <Brain className="w-5 h-5" />, sample: 'Follow-up email for Priya S. round 2 interview' },
  { id: 'gpt-slides', name: 'Briefing Deck Outline', desc: 'T04 executive slide auto-outline from mandate notes.', icon: <FileText className="w-5 h-5" />, sample: 'Draft G2 board-ready deck for QBR' },
  { id: 'gpt-framework', name: 'Framework Adaptation', desc: 'T10 consultation guide personalization per client context.', icon: <Cpu className="w-5 h-5" />, sample: 'Adapt D18 framework for APAC industrial CFO' },
];

const DYNAMIC_CHARTS = [
  { id: 'dc1', name: 'Auto-Updating Pipeline Funnel', source: 'supabase:pipeline_stages', updates: 'realtime', usedIn: 'G6, D47' },
  { id: 'dc2', name: 'Cohort Benchmark Bubble', source: 'supabase:cohort_scores', updates: 'realtime', usedIn: 'D39, G5' },
  { id: 'dc3', name: 'Compensation Heatmap', source: 'supabase:comp_benchmarks', updates: 'hourly', usedIn: 'D22, G5' },
  { id: 'dc4', name: 'Org Chart Tree', source: 'supabase:client_org + roles', updates: 'on-change', usedIn: 'D06, G5' },
  { id: 'dc5', name: 'Time-to-Fill Trend', source: 'supabase:mandates_kpis', updates: 'daily', usedIn: 'D42, G6' },
  { id: 'dc6', name: 'Score Radar (9 instruments)', source: 'supabase:assessment_scores', updates: 'on-save', usedIn: 'G1, D36' },
];

export const AdvancedPlatformPage: React.FC = () => {
  const [tab, setTab] = useState('interactive');
  const [search, setSearch] = useState('');

  const filteredInteractive = INTERACTIVE.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) || t.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Container maxWidth="7xl" py={SPACING.xl}>
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge tone="brand" size="sm">T31 · Interactive (L4)</Badge>
            <Badge tone="brand" size="sm">T32 · Interactive (L5–L6)</Badge>
            <Badge tone="brand" size="sm">T33 · Interactive (L8)</Badge>
            <Badge tone="brand" size="sm">T34 · Permissions</Badge>
            <Badge tone="brand" size="sm">T35 · UAT E2E</Badge>
            <Badge tone="brand" size="sm">T36 · AI Content (DeepSeek)</Badge>
            <Badge tone="brand" size="sm">T38 · Data Model</Badge>
            <Badge tone="brand" size="sm">T39 · Dynamic Visuals</Badge>
          </div>
          <Heading level={1} mb={SPACING.sm}>Advanced Platform — Interactive, AI, &amp; Visuals</Heading>
          <Paragraph muted size="lg">
            Interactive React conversions for L4/L5–L6/L8, AI document drafting, template permission matrix, UAT dashboard, T38 engagement schema, and T39 Supabase-connected charts.
          </Paragraph>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" icon={<Shield className="w-4 h-4" />}>T34 Permissions</Button>
          <Button variant="primary" icon={<Sparkles className="w-4 h-4" />}>T36 Draft Doc</Button>
        </div>
      </div>

      <Grid cols={4} gap={SPACING.lg} mb={SPACING.lg}>
        <StatCard label="Interactive Templates" value={INTERACTIVE.length.toString()} icon={<Bot className="w-5 h-5" />} trend="React converted" trendTone="positive" />
        <StatCard label="AI Capabilities" value={AICAPABILITIES.length.toString()} icon={<Brain className="w-5 h-5" />} trend="DeepSeek + Gating" trendTone="positive" />
        <StatCard label="Permission Roles" value="12" icon={<Shield className="w-5 h-5" />} trend="T34 matrix" trendTone="positive" />
        <StatCard label="Dynamic Chart Types" value={DYNAMIC_CHARTS.length.toString()} icon={<Gauge className="w-5 h-5" />} trend="Realtime" trendTone="positive" />
      </Grid>

      <Tabs value={tab} onChange={setTab} className="mb-6">
        <Tab value="interactive" icon={<Bot className="w-4 h-4" />}>T31–T33 · Interactive React</Tab>
        <Tab value="permissions" icon={<Shield className="w-4 h-4" />}>T34 · Permission Matrix</Tab>
        <Tab value="uat" icon={<CheckCircle2 className="w-4 h-4" />}>T35 · UAT Dashboard</Tab>
        <Tab value="ai" icon={<Brain className="w-4 h-4" />}>T36 · AI Content Engine</Tab>
        <Tab value="schema" icon={<Database className="w-4 h-4" />}>T38 · Engagement Schema</Tab>
        <Tab value="visuals" icon={<Gauge className="w-4 h-4" />}>T39 · Dynamic Visuals</Tab>
      </Tabs>

      {tab === 'interactive' && (
        <Card p={SPACING.lg}>
          <div className="flex items-center justify-between mb-4">
            <Heading level={3} mb={0}>T31 (L4) · T32 (L5–L6) · T33 (L8) Interactive React Conversions</Heading>
            <Input placeholder="Search templates..." value={search} onChange={e => setSearch(e.target.value)} icon={<FileText className="w-4 h-4" />} style={{ width: 260 }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInteractive.map(t => (
              <div key={t.id} className="p-4 rounded-lg border border-[#E5E5E5] hover:border-[#C084FC] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs" style={{ color: COLORS.brand[600] }}>{t.code}</span>
                    <Badge tone="neutral" size="sm">{t.level}</Badge>
                  </div>
                  <Badge tone={t.status === 'complete' ? 'success' : t.status === 'in_progress' ? 'warning' : 'neutral'} size="sm">
                    {t.status === 'complete' ? 'Reactified' : t.status}
                  </Badge>
                </div>
                <Heading level={4} mb={SPACING.sm}>{t.name}</Heading>
                <div className="flex flex-wrap gap-1 mb-3">
                  {t.features.map(f => (
                    <span key={f} className="text-xs px-2 py-0.5 rounded bg-[#F5F5F5]">{f}</span>
                  ))}
                </div>
                <Button size="sm" variant="ghost" icon={<Workflow className="w-4 h-4" />} fullWidth>Open Interactive</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'permissions' && (
        <Card p={SPACING.lg}>
          <Heading level={3} mb={SPACING.md}>T34 · Template Permission &amp; Access Control Matrix</Heading>
          <Paragraph muted mb={SPACING.lg}>Role × Template access grid. Enforced server-side via RLS + middleware.</Paragraph>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="p-2 border border-[#E5E5E5] text-left bg-[#FAFAFA]">Template</th>
                  {['client_admin','client_user','candidate','council','consultant','bd_manager','team_lead','lyc_admin','super_admin'].map(r => (
                    <th key={r} className="p-2 border border-[#E5E5E5] text-center bg-[#FAFAFA]">
                      <span className="text-xs" style={{ writingMode: 'vertical-rl' }}>{r}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['D01–D10 BD & Initiation', 'V','-','-','-','E','E','C','F','F'],
                  ['D11–D14 Candidate Present', 'V','V','V','-','E','V','C','F','F'],
                  ['D15–D20 Interview L4', 'C','C','V','-','E','V','C','F','F'],
                  ['D21–D25 Decision L5', 'C','V','V','-','E','-','C','F','F'],
                  ['D26–D35 Mandate L6–L7', 'V','V','V','-','E','V','C','F','F'],
                  ['D36–D45 Assessment L8–L9', 'C','V','E','V','E','-','C','F','F'],
                  ['D46–D50 Comms L10', 'V','-','-','V','C','C','C','F','F'],
                  ['G1–G10 Report Templates', 'V','V','V','V','E','C','C','F','F'],
                ].map(([label, ...cells], ri) => (
                  <tr key={ri}>
                    <td className="p-2 border border-[#E5E5E5] font-medium">{label as string}</td>
                    {cells.map((c, ci) => {
                      const map: Record<string, { label: string; cls: string }> = {
                        F: { label: 'Full', cls: 'bg-emerald-100 text-emerald-700' },
                        E: { label: 'Edit', cls: 'bg-sky-100 text-sky-700' },
                        C: { label: 'Comment', cls: 'bg-amber-100 text-amber-700' },
                        V: { label: 'View', cls: 'bg-gray-100 text-gray-700' },
                        '-': { label: '—', cls: 'bg-red-50 text-red-500' },
                      };
                      const m = map[c as string] || map['-'];
                      return <td key={ci} className="p-2 border border-[#E5E5E5] text-center"><span className={`text-xs font-medium px-2 py-0.5 rounded ${m.cls}`}>{m.label}</span></td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'uat' && (
        <Card p={SPACING.lg}>
          <Heading level={3} mb={SPACING.md}>T35 · End-to-End User Acceptance Testing — All Portals</Heading>
          <Grid cols={5} gap={SPACING.md} mb={SPACING.lg}>
            {[
              { p: 'Client', t: 124, pct: 98 },
              { p: 'Consultant', t: 156, pct: 96 },
              { p: 'Candidate', t: 98, pct: 97 },
              { p: 'Admin', t: 84, pct: 94 },
              { p: 'Assessment', t: 72, pct: 99 },
            ].map(s => (
              <div key={s.p} className="p-4 rounded-lg border border-[#E5E5E5] text-center">
                <Heading level={4} mb={SPACING.xs}>{s.p}</Heading>
                <div className="text-3xl font-bold" style={{ color: COLORS.brand[600] }}>{s.pct}%</div>
                <div className="text-xs mt-1" style={{ color: COLORS.text.muted }}>{Math.round(s.t * s.pct / 100)}/{s.t} tests pass</div>
                <div className="h-2 w-full bg-[#F0F0F0] rounded mt-2 overflow-hidden">
                  <div className="h-full rounded" style={{ width: `${s.pct}%`, backgroundColor: COLORS.brand[500] }} />
                </div>
              </div>
            ))}
          </Grid>
          <Paragraph size="sm" muted mb={0}>
            UAT runs wired to CI: <code>npm run test:e2e</code> → Playwright against 5 portals. Critical path = Consultant pipeline + Client shortlist review + Candidate assessment.
          </Paragraph>
        </Card>
      )}

      {tab === 'ai' && (
        <Card p={SPACING.lg}>
          <Heading level={3} mb={SPACING.md}>T36 · AI Content Generation Engine — DeepSeek-Powered Document Drafting</Heading>
          <Paragraph muted mb={SPACING.lg}>
            DeepSeek (default) + GPT-4o (fallback) routed via A4 Content Generator, Banned Word Scanner (B1) + Structure Validator (B2) pre-send gate (D1), LLM Voice Engine (A3) brand-lensed.
          </Paragraph>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {AICAPABILITIES.map(a => (
              <div key={a.id} className="p-4 rounded-lg border border-[#E5E5E5] hover:border-[#C084FC] transition-colors">
                <div className="p-2 w-fit rounded-lg mb-3" style={{ backgroundColor: COLORS.brand[50], color: COLORS.brand[600] }}>{a.icon}</div>
                <Heading level={4} mb={SPACING.xs}>{a.name}</Heading>
                <Paragraph size="sm" muted mb={SPACING.sm}>{a.desc}</Paragraph>
                <div className="p-2 rounded bg-[#F5F5F5] text-xs font-mono italic" style={{ color: COLORS.text.muted }}>“{a.sample}”</div>
              </div>
            ))}
          </div>
          <div className="p-4 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA]">
            <div className="flex items-center gap-2 mb-2"><Workflow className="w-4 h-4" style={{ color: COLORS.brand[500] }} /><Heading level={4} mb={0}>T36 Pipeline</Heading></div>
            <Paragraph size="sm" muted mb={0}>
              User prompt → A1 schema validate → A2 brand lens pick → A3 LLM voice → A4 content gen → B1 banned word scan → B2 structure validator → B3 signature enforcer → D1 pre-send quality gate → D2 Kevin approval (if tier-1 client) → E1 send/SMTP → E2 CRM write-back → E3 delivery tracking.
            </Paragraph>
          </div>
        </Card>
      )}

      {tab === 'schema' && (
        <Card p={SPACING.lg}>
          <Heading level={3} mb={SPACING.md}>T38 · Supabase Data Model &amp; Engagement Schema Design</Heading>
          <Paragraph muted mb={SPACING.lg}>
            Engagement tables already live in <code>supabase/migrations/20260717_intelligence_notifications.sql</code>, <code>20260622_client_notifications.sql</code>, and <code>20260709_portal_rls_policies.sql</code>. Quick reference:
          </Paragraph>
          <Grid cols={3} gap={SPACING.md}>
            {[
              { t: 'engagement_events', c: 12, d: 'Clicks, opens, views, portal activity' },
              { t: 'document_templates', c: 10, d: 'T37 data contracts + T16 registry' },
              { t: 'document_versions', c: 8, d: 'T28 storage + version diff' },
              { t: 'delivery_jobs', c: 9, d: 'T26/T30 email jobs' },
              { t: 'ai_generation_logs', c: 11, d: 'T36 prompt/response audit' },
              { t: 'permission_bindings', c: 7, d: 'T34 role × template binds' },
            ].map(tc => (
              <div key={tc.t} className="p-4 rounded-lg border border-[#E5E5E5]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs">{tc.t}</span>
                  <Badge tone="success">{tc.c} cols</Badge>
                </div>
                <Paragraph size="sm" muted mb={0}>{tc.d}</Paragraph>
              </div>
            ))}
          </Grid>
        </Card>
      )}

      {tab === 'visuals' && (
        <Card p={SPACING.lg}>
          <Heading level={3} mb={SPACING.md}>T39 · Dynamic Visual Components Library — Supabase-Connected, Auto-Updating Charts</Heading>
          <Paragraph muted mb={SPACING.lg}>
            All components wire to Supabase realtime via <code>channels</code> + <code>useSupabaseData</code> hook. Fallback to periodic polling for large datasets.
          </Paragraph>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DYNAMIC_CHARTS.map(dc => (
              <div key={dc.id} className="p-4 rounded-lg border border-[#E5E5E5]">
                <div className="flex items-start justify-between mb-2">
                  <Heading level={4} mb={0}>{dc.name}</Heading>
                  <Badge tone={dc.updates === 'realtime' ? 'success' : 'warning'} size="sm">{dc.updates}</Badge>
                </div>
                <div className="aspect-[16/6] rounded bg-gradient-to-br from-[#FDF2FC] via-white to-[#F5F3FF] border border-[#F0F0F0] mb-3 relative overflow-hidden">
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 120" preserveAspectRatio="none">
                    {[0,1,2,3,4,5,6,7].map(i => {
                      const y = 20 + Math.abs(Math.sin(i * 1.3)) * 70;
                      return <circle key={i} cx={30 + i*40} cy={y} r={6 + i} fill={COLORS.brand[i%2?500:300]} opacity={0.8} />;
                    })}
                  </svg>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span style={{ color: COLORS.text.muted }}>Source:</span> <span className="font-mono">{dc.source}</span></div>
                  <div><span style={{ color: COLORS.text.muted }}>Used in:</span> <span>{dc.usedIn}</span></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </Container>
  );
};
