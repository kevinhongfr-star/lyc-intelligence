/**
 * EmailEnginePage.tsx — Issues #101-120 (EPIC #121)
 * Nexus Email Generator Engine — unified admin surface covering:
 *   Module A: Core Engine (#101-105)  — schema validator, brand lens, LLM voice, content gen, template vars
 *   Module B: Brand Governance (#106-108) — banned words, structure validator, signature enforcer
 *   Module C: Templates (#109-111) — library, selection logic, CTA library
 *   Module D: Quality Gate (#112-113) — pre-send gate, Kevin approval workflow
 *   Module E: Delivery + Logging (#114-116) — SMTP/SendCloud, CRM write-back, delivery tracking
 *   Module F: Agent Integration (#117-118) — Nexus↔Search, Nexus↔Delivery pipelines
 *   Module G: Consistency (#119-120) — ECHO gap patches, cross-agent audit
 *
 * Brand voice: Direct, calm, precise. No emoji, no exclamation marks.
 * Sender: "Nexus" <nexus@lyc-partners.ai> (Kevin Hong for executive only).
 */
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  Mail,
  ShieldCheck,
  Palette,
  Mic,
  FileText,
  Variable,
  Ban,
  CheckSquare,
  PenLine,
  Library,
  GitFork,
  Target,
  Fence,
  UserCheck,
  Send,
  RefreshCw,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Workflow,
  Cpu,
} from 'lucide-react';

type ModuleKey =
  | 'overview'
  | 'schema'
  | 'brandLens'
  | 'llmVoice'
  | 'contentGen'
  | 'templateVars'
  | 'bannedWords'
  | 'structure'
  | 'signature'
  | 'templates'
  | 'selection'
  | 'cta'
  | 'qualityGate'
  | 'approval'
  | 'smtp'
  | 'crmSync'
  | 'tracking'
  | 'nexusSearch'
  | 'nexusDelivery'
  | 'echoGaps'
  | 'audit';

const MODULES: { key: ModuleKey; label: string; ticket: string; icon: React.ComponentType<{ className?: string }>; group: string }[] = [
  { key: 'overview', label: 'Overview', ticket: '#121', icon: Activity, group: 'Overview' },
  { key: 'schema', label: 'Schema Validator', ticket: '#101', icon: CheckSquare, group: 'A · Core' },
  { key: 'brandLens', label: 'Brand Lens Selector', ticket: '#102', icon: Palette, group: 'A · Core' },
  { key: 'llmVoice', label: 'LLM Voice Engine', ticket: '#103', icon: Mic, group: 'A · Core' },
  { key: 'contentGen', label: 'Content Generator', ticket: '#104', icon: FileText, group: 'A · Core' },
  { key: 'templateVars', label: 'Template Variables', ticket: '#105', icon: Variable, group: 'A · Core' },
  { key: 'bannedWords', label: 'Banned Word Scanner', ticket: '#106', icon: Ban, group: 'B · Governance' },
  { key: 'structure', label: 'Structure Validator', ticket: '#107', icon: CheckSquare, group: 'B · Governance' },
  { key: 'signature', label: 'Signature Enforcer', ticket: '#108', icon: PenLine, group: 'B · Governance' },
  { key: 'templates', label: 'Template Library', ticket: '#109', icon: Library, group: 'C · Templates' },
  { key: 'selection', label: 'Template Selection', ticket: '#110', icon: GitFork, group: 'C · Templates' },
  { key: 'cta', label: 'CTA Library', ticket: '#111', icon: Target, group: 'C · Templates' },
  { key: 'qualityGate', label: 'Quality Gate', ticket: '#112', icon: Fence, group: 'D · Quality' },
  { key: 'approval', label: 'Approval Workflow', ticket: '#113', icon: UserCheck, group: 'D · Quality' },
  { key: 'smtp', label: 'SMTP / SendCloud', ticket: '#114', icon: Send, group: 'E · Delivery' },
  { key: 'crmSync', label: 'CRM Write-Back', ticket: '#115', icon: RefreshCw, group: 'E · Delivery' },
  { key: 'tracking', label: 'Delivery Tracking', ticket: '#116', icon: Activity, group: 'E · Delivery' },
  { key: 'nexusSearch', label: 'Nexus ↔ Search', ticket: '#117', icon: Search, group: 'F · Integration' },
  { key: 'nexusDelivery', label: 'Nexus ↔ Delivery', ticket: '#118', icon: Workflow, group: 'F · Integration' },
  { key: 'echoGaps', label: 'ECHO Gap Patches', ticket: '#119', icon: AlertTriangle, group: 'G · Consistency' },
  { key: 'audit', label: 'Cross-Agent Audit', ticket: '#120', icon: Cpu, group: 'G · Consistency' },
];

const BRAND_LENSES = [
  { id: 'lyc', name: 'LYC Partners', headlineFont: 'Crimson Pro', tone: 'Direct, advisory, situation-first' },
  { id: 'nexus', name: 'Nexus', headlineFont: 'Crimson Pro', tone: 'Calm teacher, precise, no filler' },
  { id: 'grid', name: 'GRID', headlineFont: 'Crimson Pro', tone: 'Structured, framework-oriented' },
  { id: 'meridian', name: 'MERIDIAN', headlineFont: 'Crimson Pro', tone: 'Strategic, boardroom' },
  { id: 'valentina', name: 'Valentina', headlineFont: 'Crimson Pro', tone: 'Warm, executive coaching' },
];

const BANNED_WORDS = [
  { pattern: 'architecture', replacement: 'structure|design', severity: 'soft' },
  { pattern: 'resonance', replacement: 'fit|alignment', severity: 'soft' },
  { pattern: 'calibration', replacement: 'alignment|adjustment', severity: 'soft' },
  { pattern: 'sovereignty gap', replacement: 'gap between HQ and local markets', severity: 'hard' },
  { pattern: 'leverage', replacement: 'use|apply', severity: 'soft' },
  { pattern: 'synergy', replacement: 'collaboration|partnership', severity: 'hard' },
  { pattern: 'disrupt', replacement: 'transform|reshape', severity: 'hard' },
  { pattern: 'revolutionary', replacement: 'innovative|novel', severity: 'hard' },
];

const TEMPLATES = [
  { id: 't1', name: 'Service Introduction', lens: 'LYC Partners', cta: 'Book 20-min intro call', uses: 142, avgOpenRate: 38 },
  { id: 't2', name: 'Podcast Invite', lens: 'Nexus', cta: 'Confirm recording slot', uses: 84, avgOpenRate: 52 },
  { id: 't3', name: 'Webinar Invite', lens: 'GRID', cta: 'Reserve seat', uses: 318, avgOpenRate: 41 },
  { id: 't4', name: 'Workshop Invite', lens: 'MERIDIAN', cta: 'Request outline', uses: 96, avgOpenRate: 44 },
  { id: 't5', name: 'Coaching Introduction', lens: 'Valentina', cta: 'Schedule discovery', uses: 62, avgOpenRate: 48 },
  { id: 't6', name: 'Advisory Introduction', lens: 'LYC Partners', cta: 'Share advisory brief', uses: 38, avgOpenRate: 35 },
  { id: 't7', name: 'Follow-up (warm)', lens: 'Nexus', cta: 'Reply with availability', uses: 412, avgOpenRate: 46 },
  { id: 't8', name: 'Cold Outreach', lens: 'Nexus', cta: 'Open 2-min profile', uses: 1240, avgOpenRate: 22 },
];

const CTAS = [
  { id: 'c1', text: 'Book 20-min intro call', lens: 'LYC Partners', conversionRate: 18 },
  { id: 'c2', text: 'Confirm recording slot', lens: 'Nexus', conversionRate: 24 },
  { id: 'c3', text: 'Reserve seat', lens: 'GRID', conversionRate: 31 },
  { id: 'c4', text: 'Reply with availability', lens: 'Nexus', conversionRate: 28 },
  { id: 'c5', text: 'Open 2-min profile', lens: 'Nexus', conversionRate: 12 },
];

const APPROVALS = [
  { id: 'ap1', recipient: 'sarah.chen@techcorp.com', subject: 'Intro: LYC advisory for Q4 hiring', lens: 'LYC Partners', requestedBy: 'Marcus', status: 'pending_kevin', createdAt: '2026-07-21T08:30:00Z' },
  { id: 'ap2', recipient: 'michael.tan@finstartup.io', subject: 'Podcast invite — APAC Founders', lens: 'Nexus', requestedBy: 'ECHO', status: 'approved', createdAt: '2026-07-21T07:15:00Z' },
  { id: 'ap3', recipient: 'priya.kumar@bigbank.com', subject: 'Workshop: SHIFT for CTOs', lens: 'MERIDIAN', requestedBy: 'ECHO', status: 'rejected', createdAt: '2026-07-20T16:00:00Z' },
];

const approvalStatusConfig: Record<string, { color: string; bg: string; label: string }> = {
  pending_kevin: { color: 'text-amber-600', bg: 'bg-amber-50', label: 'Pending Kevin' },
  approved: { color: 'text-green-600', bg: 'bg-green-50', label: 'Approved' },
  rejected: { color: 'text-red-600', bg: 'bg-red-50', label: 'Rejected' },
};

export function EmailEnginePage() {
  const [active, setActive] = useState<ModuleKey>('overview');
  const [bannedSearch, setBannedSearch] = useState('');
  const [selectedLens, setSelectedLens] = useState('nexus');

  const filteredBanned = useMemo(
    () =>
      BANNED_WORDS.filter(
        (b) =>
          b.pattern.toLowerCase().includes(bannedSearch.toLowerCase()) ||
          b.replacement.toLowerCase().includes(bannedSearch.toLowerCase()),
      ),
    [bannedSearch],
  );

  const groupedModules = useMemo(() => {
    const groups: Record<string, typeof MODULES> = {};
    MODULES.forEach((m) => {
      if (!groups[m.group]) groups[m.group] = [];
      groups[m.group].push(m);
    });
    return groups;
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Module sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 p-3 overflow-y-auto">
        <div className="flex items-center gap-2 px-2 py-3 mb-2">
          <Mail className="w-5 h-5 text-purple-600" />
          <div>
            <div className="text-sm font-semibold text-gray-900">Email Engine</div>
            <div className="text-[10px] text-gray-400">#101-120 · EPIC #121</div>
          </div>
        </div>
        {Object.entries(groupedModules).map(([group, items]) => (
          <div key={group} className="mb-3">
            <div className="text-[10px] uppercase tracking-wider text-gray-400 px-2 mb-1">{group}</div>
            {items.map((m) => {
              const Icon = m.icon;
              const isActive = active === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setActive(m.key)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                    isActive ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="flex-1 text-left truncate">{m.label}</span>
                  <span className="text-[9px] text-gray-400">{m.ticket}</span>
                </button>
              );
            })}
          </div>
        ))}
      </aside>

      {/* Module content */}
      <main className="flex-1 overflow-y-auto p-6">
        {active === 'overview' && <OverviewModule />}
        {active === 'schema' && <SchemaModule />}
        {active === 'brandLens' && (
          <BrandLensModule selectedLens={selectedLens} setSelectedLens={setSelectedLens} />
        )}
        {active === 'llmVoice' && <LLMVoiceModule selectedLens={selectedLens} />}
        {active === 'contentGen' && <ContentGenModule />}
        {active === 'templateVars' && <TemplateVarsModule />}
        {active === 'bannedWords' && (
          <BannedWordsModule
            search={bannedSearch}
            setSearch={setBannedSearch}
            filtered={filteredBanned}
          />
        )}
        {active === 'structure' && <StructureModule />}
        {active === 'signature' && <SignatureModule />}
        {active === 'templates' && <TemplatesModule />}
        {active === 'selection' && <SelectionModule />}
        {active === 'cta' && <CtaModule />}
        {active === 'qualityGate' && <QualityGateModule />}
        {active === 'approval' && <ApprovalModule />}
        {active === 'smtp' && <SmtpModule />}
        {active === 'crmSync' && <CrmSyncModule />}
        {active === 'tracking' && <TrackingModule />}
        {active === 'nexusSearch' && <NexusSearchModule />}
        {active === 'nexusDelivery' && <NexusDeliveryModule />}
        {active === 'echoGaps' && <EchoGapsModule />}
        {active === 'audit' && <AuditModule />}
      </main>
    </div>
  );
}

function ModuleHeader({ ticket, title, desc }: { ticket: string; title: string; desc: string }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        <Badge variant="outline" className="text-[10px]">{ticket}</Badge>
      </div>
      <p className="text-sm text-gray-500 mt-1">{desc}</p>
    </div>
  );
}

function OverviewModule() {
  return (
    <div>
      <ModuleHeader ticket="#121" title="Email Engine Overview" desc="Nexus Email Generator Engine — single unified surface for all 20 modules" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Card className="p-4"><div className="text-2xl font-bold">8</div><div className="text-xs text-gray-500">Templates Live</div></Card>
        <Card className="p-4"><div className="text-2xl font-bold text-green-600">2,392</div><div className="text-xs text-gray-500">Emails Sent (30d)</div></Card>
        <Card className="p-4"><div className="text-2xl font-bold text-blue-600">38.4%</div><div className="text-xs text-gray-500">Avg Open Rate</div></Card>
        <Card className="p-4"><div className="text-2xl font-bold text-purple-600">5</div><div className="text-xs text-gray-500">Brand Lenses</div></Card>
      </div>
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-2">Brand Voice Constants</h3>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Direct, calm, precise — teacher not salesperson</li>
          <li>• Situation-first framing (who/what/why now)</li>
          <li>• No emoji, no exclamation marks, no filler</li>
          <li>• No invented statistics or commercial language</li>
          <li>• Active voice, short sentences</li>
          <li>• Headline font: Crimson Pro (canonical across all assets)</li>
          <li>• Dark backgrounds: fully retired in all contexts</li>
        </ul>
      </Card>
    </div>
  );
}

function SchemaModule() {
  return (
    <div>
      <ModuleHeader ticket="#101" title="Email Request Schema Validator" desc="Validates inbound email_request payloads before any processing" />
      <Card className="p-4">
        <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto font-mono">{`email_request:
  type: enum  # service_intro | podcast_invite | webinar_invite | workshop_invite
              # coaching_intro | advisory_intro | follow_up | cold_outreach
  brand_lens: enum  # LYC Partners | Nexus | GRID | MERIDIAN | Valentina
  recipient:
    name: string (required)
    email: string (required, email format)
    role: string (optional)
    company: string (optional)
  sender: enum  # "Nexus" (default) | "Kevin Hong" (executive only)
  content:
    subject_override: string (optional, else auto-generated)
    key_message: string (required, 1-2 sentences)
    cta: string (required)
    context: string (optional)
  constraints:
    word_count_max: integer (default 200)
    tone_override: string (optional)
    urgency: enum  # low | medium | high
  metadata:
    campaign_id: string (optional)
    template_id: string (optional)
    priority: enum  # normal | high`}</pre>
      </Card>
      <Card className="p-4 mt-3">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="text-sm font-semibold">Validation Rules</span>
        </div>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Reject if sender = "Kevin Hong" but type is not executive-class</li>
          <li>• Reject if brand_lens not in approved set</li>
          <li>• Reject if recipient.email fails RFC 5322</li>
          <li>• Reject if word_count_max &lt; 50 or &gt; 500</li>
        </ul>
      </Card>
    </div>
  );
}

function BrandLensModule({ selectedLens, setSelectedLens }: { selectedLens: string; setSelectedLens: (v: string) => void }) {
  return (
    <div>
      <ModuleHeader ticket="#102" title="Brand Lens Selector" desc="Selects the voice/persona applied to a given email request" />
      <div className="space-y-2">
        {BRAND_LENSES.map((l) => (
          <Card key={l.id} className={`p-4 cursor-pointer transition-all ${selectedLens === l.id ? 'ring-2 ring-purple-500' : ''}`} onClick={() => setSelectedLens(l.id)}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-purple-600" />
                  <span className="font-medium">{l.name}</span>
                  {selectedLens === l.id && <Badge className="text-[10px] border-0 bg-purple-50 text-purple-600">Active</Badge>}
                </div>
                <div className="text-xs text-gray-500 mt-1">Tone: {l.tone}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Headline font: {l.headlineFont}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function LLMVoiceModule({ selectedLens }: { selectedLens: string }) {
  const lens = BRAND_LENSES.find((l) => l.id === selectedLens);
  return (
    <div>
      <ModuleHeader ticket="#103" title="LLM Voice Engine" desc={`Applies the ${lens?.name || 'Nexus'} voice profile to generated content`} />
      <Card className="p-4 mb-3">
        <div className="text-xs text-gray-500 mb-2">System Prompt (excerpts)</div>
        <pre className="text-xs bg-gray-50 p-3 rounded font-mono whitespace-pre-wrap">{`You are ${lens?.name}, a ${lens?.tone.toLowerCase()}.

Rules:
- Never use emoji or exclamation marks.
- Open with situation context (who/what/why now).
- Use active voice and short sentences.
- Do not invent statistics.
- Headline font in any rendered asset: Crimson Pro.
- Subject line: 4-8 words, situation-first, no clickbait.

Sender identity:
- Default: Nexus <nexus@lyc-partners.ai>
- Executive only: Kevin Hong <kevin.hong@lyc-partners.ai>`}</pre>
      </Card>
      <Card className="p-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div><div className="text-lg font-bold">0.04</div><div className="text-[10px] text-gray-500">Voice Drift Score</div></div>
          <div><div className="text-lg font-bold">96.4%</div><div className="text-[10px] text-gray-500">Voice Pass Rate</div></div>
          <div><div className="text-lg font-bold">680ms</div><div className="text-[10px] text-gray-500">Avg Generation</div></div>
        </div>
      </Card>
    </div>
  );
}

function ContentGenModule() {
  return (
    <div>
      <ModuleHeader ticket="#104" title="Content Generator" desc="Produces subject + body + CTA from a validated email_request" />
      <Card className="p-4 mb-3">
        <div className="text-xs text-gray-500 mb-2">Sample Output (cold_outreach · Nexus lens)</div>
        <div className="border border-gray-200 rounded p-3 bg-white">
          <div className="text-xs text-gray-400 mb-1">Subject</div>
          <div className="font-medium text-sm mb-3">Sarah, APAC CTO moves in Q4</div>
          <div className="text-xs text-gray-400 mb-1">Body</div>
          <p className="text-sm text-gray-700 leading-relaxed">
            Sarah, three APAC CTO placements closed in the last six weeks at companies similar to TechCorp Asia. The pattern across all three: a re-evaluation of build-versus-buy for platform engineering. If this is on your roadmap for Q4, I can share what we are seeing on the candidate side. Two minutes to review a profile: [link].
          </p>
          <div className="text-xs text-gray-400 mt-3 mb-1">CTA</div>
          <div className="text-sm text-purple-600">Open 2-min profile</div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="text-xs text-gray-500 mb-2">Generation Pipeline</div>
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="outline">Schema Validated</Badge>
          <span className="text-gray-400">→</span>
          <Badge variant="outline">Lens Selected</Badge>
          <span className="text-gray-400">→</span>
          <Badge variant="outline">LLM Voice Applied</Badge>
          <span className="text-gray-400">→</span>
          <Badge variant="outline">Banned-Word Scan</Badge>
          <span className="text-gray-400">→</span>
          <Badge variant="outline">Structure Check</Badge>
          <span className="text-gray-400">→</span>
          <Badge className="border-0 bg-purple-50 text-purple-600">Quality Gate</Badge>
        </div>
      </Card>
    </div>
  );
}

function TemplateVarsModule() {
  const vars = [
    { name: '{{recipient.name}}', source: 'recipient.name', required: true },
    { name: '{{recipient.company}}', source: 'recipient.company', required: false },
    { name: '{{recipient.role}}', source: 'recipient.role', required: false },
    { name: '{{sender.name}}', source: 'sender', required: true },
    { name: '{{cta}}', source: 'content.cta', required: true },
    { name: '{{key_message}}', source: 'content.key_message', required: true },
    { name: '{{lens.tone}}', source: 'brand_lens.tone', required: true },
    { name: '{{date.short}}', source: 'system.date', required: true },
  ];
  return (
    <div>
      <ModuleHeader ticket="#105" title="Template Variable System" desc="Variable substitutions available in machine-readable templates" />
      <Card className="p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-xs text-gray-500">
              <th className="text-left py-2">Variable</th>
              <th className="text-left py-2">Source</th>
              <th className="text-left py-2">Required</th>
            </tr>
          </thead>
          <tbody>
            {vars.map((v) => (
              <tr key={v.name} className="border-b border-gray-50">
                <td className="py-2 font-mono text-xs text-purple-600">{v.name}</td>
                <td className="py-2 font-mono text-xs text-gray-600">{v.source}</td>
                <td className="py-2">
                  {v.required ? (
                    <Badge className="text-[10px] border-0 bg-red-50 text-red-600">Required</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">Optional</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function BannedWordsModule({ search, setSearch, filtered }: { search: string; setSearch: (v: string) => void; filtered: typeof BANNED_WORDS }) {
  return (
    <div>
      <ModuleHeader ticket="#106" title="Banned Word Scanner" desc="Flags prohibited patterns and suggests replacements" />
      <Card className="p-3 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search banned words..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </Card>
      <div className="space-y-2">
        {filtered.map((b) => (
          <Card key={b.pattern} className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Ban className={`w-4 h-4 ${b.severity === 'hard' ? 'text-red-600' : 'text-amber-500'}`} />
              <div>
                <div className="font-mono text-sm">{b.pattern}</div>
                <div className="text-xs text-gray-500">→ {b.replacement}</div>
              </div>
            </div>
            <Badge className={`text-[10px] border-0 ${b.severity === 'hard' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
              {b.severity}
            </Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StructureModule() {
  const rules = [
    { rule: 'Subject line length', spec: '4-8 words', status: 'pass' },
    { rule: 'Opening context', spec: 'First sentence contains who/what/why now', status: 'pass' },
    { rule: 'Body word count', spec: '≤ constraints.word_count_max (default 200)', status: 'pass' },
    { rule: 'CTA present', spec: 'Exactly one CTA, clear action verb', status: 'pass' },
    { rule: 'Paragraph length', spec: 'No paragraph > 3 sentences', status: 'pass' },
    { rule: 'No clickbait', spec: 'Subject free of superlatives/clickbait', status: 'pass' },
  ];
  return (
    <div>
      <ModuleHeader ticket="#107" title="Structure Validator" desc="Enforces structural rules on subject, body, and CTA" />
      <Card className="p-4">
        <div className="space-y-2">
          {rules.map((r) => (
            <div key={r.rule} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div>
                <div className="text-sm font-medium">{r.rule}</div>
                <div className="text-xs text-gray-500">{r.spec}</div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SignatureModule() {
  return (
    <div>
      <ModuleHeader ticket="#108" title="Signature Block Enforcer" desc="Appends canonical signature per sender identity" />
      <Card className="p-4 mb-3">
        <div className="text-xs text-gray-500 mb-2">Default (Nexus)</div>
        <pre className="text-xs bg-gray-50 p-3 rounded font-mono">{`Nexus
LYC Intelligence
nexus@lyc-partners.ai`}</pre>
      </Card>
      <Card className="p-4">
        <div className="text-xs text-gray-500 mb-2">Executive (Kevin Hong)</div>
        <pre className="text-xs bg-gray-50 p-3 rounded font-mono">{`Kevin Hong
Founder & Managing Partner
LYC Partners
kevin.hong@lyc-partners.ai`}</pre>
      </Card>
    </div>
  );
}

function TemplatesModule() {
  return (
    <div>
      <ModuleHeader ticket="#109" title="Machine-Readable Template Library" desc="Canonical templates indexed by type + brand lens" />
      <div className="space-y-2">
        {TEMPLATES.map((t) => (
          <Card key={t.id} className="p-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-sm">{t.name}</span>
                <Badge variant="outline" className="text-[10px]">{t.lens}</Badge>
              </div>
              <div className="text-xs text-gray-500 mt-1">CTA: {t.cta}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">{t.uses}</div>
              <div className="text-[10px] text-gray-500">{t.avgOpenRate}% open</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SelectionModule() {
  return (
    <div>
      <ModuleHeader ticket="#110" title="Template Selection Logic" desc="Picks the best template from request type + lens + recipient signals" />
      <Card className="p-4">
        <pre className="text-xs bg-gray-50 p-3 rounded font-mono whitespace-pre-wrap">{`function selectTemplate(request):
  candidates = templates.where(
    type == request.type AND
    lens == request.brand_lens
  )
  if request.recipient.role in EXECUTIVE_ROLES:
    candidates = candidates.where(executive_safe == true)
  if request.constraints.urgency == 'high':
    candidates = candidates.where(cta == 'reply')
  return candidates.sortBy(historical_open_rate).first()`}</pre>
      </Card>
    </div>
  );
}

function CtaModule() {
  return (
    <div>
      <ModuleHeader ticket="#111" title="Lens-Specific CTA Library" desc="Pre-approved CTAs keyed to brand lens" />
      <div className="space-y-2">
        {CTAS.map((c) => (
          <Card key={c.id} className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-4 h-4 text-purple-600" />
              <div>
                <div className="text-sm font-medium">"{c.text}"</div>
                <div className="text-xs text-gray-500">{c.lens}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-green-600">{c.conversionRate}%</div>
              <div className="text-[10px] text-gray-500">conv</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function QualityGateModule() {
  const checks = [
    { name: 'Schema valid', status: 'pass' },
    { name: 'Brand lens applied', status: 'pass' },
    { name: 'No banned words', status: 'pass' },
    { name: 'Structure rules met', status: 'pass' },
    { name: 'Signature appended', status: 'pass' },
    { name: 'Word count within limit', status: 'pass' },
    { name: 'CTA present', status: 'pass' },
    { name: 'No exclamation marks', status: 'pass' },
    { name: 'No emoji', status: 'pass' },
    { name: 'Active voice ratio ≥ 70%', status: 'warn' },
  ];
  return (
    <div>
      <ModuleHeader ticket="#112" title="Pre-Send Quality Gate" desc="10-check gate run before any email enters the approval queue" />
      <Card className="p-4">
        <div className="space-y-2">
          {checks.map((c) => (
            <div key={c.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">{c.name}</span>
              {c.status === 'pass' ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : c.status === 'warn' ? (
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ApprovalModule() {
  return (
    <div>
      <ModuleHeader ticket="#113" title="Kevin Approval Workflow" desc="Executive-class emails require Kevin Hong sign-off before send" />
      <div className="space-y-2">
        {APPROVALS.map((a) => {
          const sc = approvalStatusConfig[a.status];
          return (
            <Card key={a.id} className="p-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium">{a.subject}</div>
                  <div className="text-xs text-gray-500 mt-0.5">To: {a.recipient}</div>
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-500">
                    <Badge variant="outline" className="text-[10px]">{a.lens}</Badge>
                    <span>· requested by {a.requestedBy}</span>
                    <span>· {new Date(a.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <Badge className={`text-[10px] border-0 ${sc.bg} ${sc.color}`}>{sc.label}</Badge>
              </div>
              {a.status === 'pending_kevin' && (
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="gap-1"><CheckCircle2 className="w-3 h-3" />Approve</Button>
                  <Button size="sm" variant="outline" className="text-red-600 gap-1"><XCircle className="w-3 h-3" />Reject</Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function SmtpModule() {
  return (
    <div>
      <ModuleHeader ticket="#114" title="SMTP / SendCloud Integration" desc="Outbound transport with retry, rate-limit, and IP warmup" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <Card className="p-4"><div className="text-xs text-gray-500">Provider</div><div className="text-sm font-semibold mt-1">SendCloud</div></Card>
        <Card className="p-4"><div className="text-xs text-gray-500">Sent (24h)</div><div className="text-sm font-semibold mt-1">142</div></Card>
        <Card className="p-4"><div className="text-xs text-gray-500">Bounce Rate</div><div className="text-sm font-semibold mt-1 text-green-600">1.2%</div></Card>
      </div>
      <Card className="p-4">
        <div className="text-xs text-gray-500 mb-2">Retry Policy</div>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Soft bounce: retry at +1h, +4h, +24h, then fail</li>
          <li>• Hard bounce: immediate fail, suppress recipient</li>
          <li>• Rate limit: 50 emails / minute per sender domain</li>
          <li>• IP warmup: ramping day 3 of 30 (current cap: 200/day)</li>
        </ul>
      </Card>
    </div>
  );
}

function CrmSyncModule() {
  return (
    <div>
      <ModuleHeader ticket="#115" title="CRM Write-Back" desc="Mirrors sent emails + opens into the CRM record" />
      <Card className="p-4">
        <div className="space-y-2">
          {[
            { entity: 'Sarah Chen', lastSync: '2026-07-21T08:35:00Z', status: 'synced' },
            { entity: 'ACME Corp', lastSync: '2026-07-21T08:30:00Z', status: 'synced' },
            { entity: 'FinBank Asia', lastSync: '2026-07-21T07:00:00Z', status: 'pending' },
          ].map((r) => (
            <div key={r.entity} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">{r.entity}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{new Date(r.lastSync).toLocaleTimeString()}</span>
                {r.status === 'synced' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function TrackingModule() {
  return (
    <div>
      <ModuleHeader ticket="#116" title="Delivery Tracking" desc="Open / click / reply events surfaced per email" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
        <Card className="p-4"><div className="text-2xl font-bold">142</div><div className="text-xs text-gray-500">Delivered</div></Card>
        <Card className="p-4"><div className="text-2xl font-bold text-blue-600">58</div><div className="text-xs text-gray-500">Opened</div></Card>
        <Card className="p-4"><div className="text-2xl font-bold text-purple-600">19</div><div className="text-xs text-gray-500">Clicked</div></Card>
        <Card className="p-4"><div className="text-2xl font-bold text-green-600">7</div><div className="text-xs text-gray-500">Replied</div></Card>
      </div>
      <Card className="p-4">
        <div className="text-xs text-gray-500 mb-2">Recent Events</div>
        <div className="space-y-1">
          {[
            { event: 'reply', recipient: 'sarah.chen@techcorp.com', at: '2026-07-21T08:42:00Z' },
            { event: 'open', recipient: 'michael.tan@finstartup.io', at: '2026-07-21T08:30:00Z' },
            { event: 'click', recipient: 'priya.kumar@bigbank.com', at: '2026-07-21T08:15:00Z' },
            { event: 'open', recipient: 'david.lee@healthcorp.cn', at: '2026-07-21T07:50:00Z' },
          ].map((e, i) => (
            <div key={i} className="flex items-center gap-3 text-xs p-2 bg-gray-50 rounded">
              <Badge variant="outline" className="text-[10px]">{e.event}</Badge>
              <span className="flex-1 font-mono text-gray-700">{e.recipient}</span>
              <span className="text-gray-400">{new Date(e.at).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function NexusSearchModule() {
  return (
    <div>
      <ModuleHeader ticket="#117" title="Nexus ↔ Search Ops Pipeline" desc="Nexus requests candidate sourcing from the search ops agent" />
      <Card className="p-4">
        <pre className="text-xs bg-gray-50 p-3 rounded font-mono whitespace-pre-wrap">{`Trigger: user asks Nexus "find me CTOs in SG fintech"
  ↓
Nexus → Maria (Search Ops):
  { intent: "search", filters: { role: "CTO", location: "SG", industry: "fintech" } }
  ↓
Maria returns top-N candidates → Nexus renders inline
  ↓
If user says "email top 3" → routes to ECHO (Email)`}</pre>
      </Card>
    </div>
  );
}

function NexusDeliveryModule() {
  return (
    <div>
      <ModuleHeader ticket="#118" title="Nexus ↔ Delivery Ops Pipeline" desc="After email approval, Nexus hands off to delivery ops agent" />
      <Card className="p-4">
        <pre className="text-xs bg-gray-50 p-3 rounded font-mono whitespace-pre-wrap">{`Trigger: email passes quality gate AND (executive class → Kevin approved)
  ↓
Nexus → Atlas (Delivery Ops):
  { email_id, recipient, transport: "sendcloud", priority }
  ↓
Atlas: enqueue → SMTP → tracking webhook → CRM write-back
  ↓
Nexus surfaces delivery confirmation to user`}</pre>
      </Card>
    </div>
  );
}

function EchoGapsModule() {
  const gaps = [
    { gap: 'ECHO guideline §3.2 — paragraph transition rule', status: 'patched' },
    { gap: 'ECHO guideline §4.1 — subject length upper bound (8 words)', status: 'patched' },
    { gap: 'ECHO guideline §5.0 — recipient.timezone-aware send window', status: 'open' },
    { gap: 'ECHO guideline §6.3 — attachment whitelist enforcement', status: 'open' },
  ];
  return (
    <div>
      <ModuleHeader ticket="#119" title="ECHO Guidelines Gap Patches" desc="Tracks patches for gaps discovered in the ECHO composition guidelines" />
      <Card className="p-4">
        <div className="space-y-2">
          {gaps.map((g) => (
            <div key={g.gap} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">{g.gap}</span>
              {g.status === 'patched' ? (
                <Badge className="text-[10px] border-0 bg-green-50 text-green-600">Patched</Badge>
              ) : (
                <Badge className="text-[10px] border-0 bg-amber-50 text-amber-600">Open</Badge>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AuditModule() {
  const findings = [
    { area: 'Sender identity leak', finding: 'No agent codenames in sender field', status: 'pass' },
    { area: 'Brand voice drift', finding: 'Voice drift score 0.04 (threshold 0.10)', status: 'pass' },
    { area: 'Banned-word bypass', finding: 'No bypass attempts detected (30d)', status: 'pass' },
    { area: 'Approval enforcement', finding: 'All executive emails routed through Kevin', status: 'pass' },
    { area: 'Dark background usage', finding: '0 occurrences (fully retired)', status: 'pass' },
    { area: 'Headline font consistency', finding: 'Crimson Pro enforced in 100% of assets', status: 'pass' },
  ];
  return (
    <div>
      <ModuleHeader ticket="#120" title="Cross-Agent Audit" desc="Verifies brand-voice + sender-identity consistency across all agents" />
      <Card className="p-4">
        <div className="space-y-2">
          {findings.map((f) => (
            <div key={f.area} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div>
                <div className="text-sm font-medium">{f.area}</div>
                <div className="text-xs text-gray-500">{f.finding}</div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
