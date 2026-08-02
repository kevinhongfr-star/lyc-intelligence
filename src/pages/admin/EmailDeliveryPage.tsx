import React, { useState } from 'react';
import { Heading, Paragraph, Container, Card, Badge, Button, Grid, Tabs, Tab, StatCard, Input, Select } from '@/components/design-system';
import { COLORS, SPACING } from '@/styles/tokens';
import {
  Mail, Send, Calendar, Clock, CheckCircle2, AlertTriangle, PlayCircle,
  BarChart3, Settings, Inbox, Users, FileText, Bell, RefreshCw, Eye
} from 'lucide-react';

interface EmailItem {
  id: string;
  template: string;
  code: string;
  audience: string;
  frequency: string;
  sent: number;
  opened: number;
  clicked: number;
  status: 'scheduled' | 'processing' | 'sent' | 'failed';
  nextRun: string;
  lastRun: string;
}

const COMMERCE_EMAILS: EmailItem[] = [
  { id: 'e1', template: 'Weekly Digest', code: 'D46', audience: 'All active users', frequency: 'Weekly · Mon 06:00', sent: 1248, opened: 842, clicked: 317, status: 'scheduled', nextRun: '2026-08-04 06:00', lastRun: '2026-07-28 06:00' },
  { id: 'e2', template: 'Pipeline Update', code: 'D47', audience: 'Consultants + BD', frequency: 'Twice weekly', sent: 437, opened: 352, clicked: 148, status: 'processing', nextRun: '2026-08-05 09:00', lastRun: '2026-07-29 09:00' },
  { id: 'e3', template: 'Assessment Alert', code: 'D48', audience: 'Candidates + coaches', frequency: 'Event-driven', sent: 189, opened: 152, clicked: 97, status: 'sent', nextRun: 'Triggered on score', lastRun: '2026-08-02 14:22' },
  { id: 'e4', template: 'Market Briefing', code: 'D49', audience: 'Council members + BD', frequency: 'Bi-monthly', sent: 286, opened: 192, clicked: 88, status: 'scheduled', nextRun: '2026-08-15 08:00', lastRun: '2026-07-15 08:00' },
  { id: 'e5', template: 'QBR Summary', code: 'D50', audience: 'Clients + Kevin', frequency: 'Quarterly', sent: 64, opened: 58, clicked: 31, status: 'scheduled', nextRun: '2026-10-01 09:00', lastRun: '2026-07-01 09:00' },
];

export const EmailDeliveryPage: React.FC = () => {
  const [tab, setTab] = useState('delivery');
  const [search, setSearch] = useState('');
  const [smtpProvider, setSmtpProvider] = useState<'sendcloud' | 'smtp'>('sendcloud');

  const filtered = COMMERCE_EMAILS.filter(e =>
    e.template.toLowerCase().includes(search.toLowerCase()) || e.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Container maxWidth="7xl" py={SPACING.xl}>
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge tone="brand" size="sm">T26 · Comms Portal (Render &amp; Delivery)</Badge>
            <Badge tone="brand" size="sm">T30 · D46–D50 Scheduled &amp; On-Demand</Badge>
            <Badge tone="success" size="sm">E1 · SMTP / SendCloud</Badge>
          </div>
          <Heading level={1} mb={SPACING.sm}>Email Template Rendering &amp; Delivery Pipeline</Heading>
          <Paragraph muted size="lg">
            T26 Renders HTML email via MJML/template registry, T30 schedules or on-demand-sends D46–D50. Backed by E1 (SMTP/SendCloud), E3 (delivery tracking), E2 (CRM write-back).
          </Paragraph>
        </div>
        <div className="flex gap-2">
          <Select value={smtpProvider} onChange={e => setSmtpProvider(e.target.value as 'sendcloud' | 'smtp')} options={[
            { value: 'sendcloud', label: 'E1: SendCloud API' },
            { value: 'smtp', label: 'E1: Raw SMTP Relay' },
          ]} style={{ width: 220 }} />
          <Button variant="ghost" icon={<Settings className="w-4 h-4" />}>Queue Config</Button>
          <Button variant="primary" icon={<Send className="w-4 h-4" />}>Send Test Email</Button>
        </div>
      </div>

      <Grid cols={4} gap={SPACING.lg} mb={SPACING.lg}>
        <StatCard label="Templates Delivered" value="5" icon={<FileText className="w-5 h-5" />} trend="D46–D50 live" trendTone="positive" />
        <StatCard label="Sent (7d)" value="2,224" icon={<Mail className="w-5 h-5" />} trend="+18% WoW" trendTone="positive" />
        <StatCard label="Open Rate" value="58.3%" icon={<Eye className="w-5 h-5" />} trend="+3.1 pt" trendTone="positive" />
        <StatCard label="Provider Uptime" value="99.98%" icon={<CheckCircle2 className="w-5 h-5" />} trend={smtpProvider.toUpperCase()} trendTone="positive" />
      </Grid>

      <Tabs value={tab} onChange={setTab} className="mb-6">
        <Tab value="delivery" icon={<Send className="w-4 h-4" />}>T26 / T30 Delivery Pipeline</Tab>
        <Tab value="templates" icon={<FileText className="w-4 h-4" />}>D46–D50 Email Templates</Tab>
        <Tab value="tracking" icon={<BarChart3 className="w-4 h-4" />}>E3 Delivery Tracking</Tab>
        <Tab value="queue" icon={<Clock className="w-4 h-4" />}>Cron Queue Monitor</Tab>
      </Tabs>

      {tab === 'delivery' && (
        <Card p={SPACING.lg}>
          <div className="flex items-center justify-between mb-4">
            <Heading level={3} mb={0}>T30 · Scheduled &amp; On-Demand Emails (D46–D50)</Heading>
            <div className="flex gap-2">
              <Input placeholder="Search templates..." value={search} onChange={e => setSearch(e.target.value)} icon={<Mail className="w-4 h-4" />} style={{ width: 240 }} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-[#E5E5E5]" style={{ color: COLORS.text.muted }}>
                  <th className="py-3 px-3 font-medium">Code</th>
                  <th className="py-3 px-3 font-medium">Template</th>
                  <th className="py-3 px-3 font-medium">Audience</th>
                  <th className="py-3 px-3 font-medium">Cadence</th>
                  <th className="py-3 px-3 font-medium text-right">Sent</th>
                  <th className="py-3 px-3 font-medium text-right">Open</th>
                  <th className="py-3 px-3 font-medium text-right">Click</th>
                  <th className="py-3 px-3 font-medium">Status</th>
                  <th className="py-3 px-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => {
                  const openRate = Math.round((e.opened / Math.max(1, e.sent)) * 100);
                  const clickRate = Math.round((e.clicked / Math.max(1, e.sent)) * 100);
                  return (
                    <tr key={e.id} className="border-b border-[#F0F0F0] hover:bg-[#FAFAFA]">
                      <td className="py-3 px-3 font-mono font-semibold" style={{ color: COLORS.brand[600] }}>{e.code}</td>
                      <td className="py-3 px-3 font-medium">{e.template}</td>
                      <td className="py-3 px-3"><span className="text-xs">{e.audience}</span></td>
                      <td className="py-3 px-3"><span className="text-xs inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{e.frequency}</span></td>
                      <td className="py-3 px-3 text-right tabular-nums">{e.sent}</td>
                      <td className="py-3 px-3 text-right tabular-nums">{openRate}%</td>
                      <td className="py-3 px-3 text-right tabular-nums">{clickRate}%</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-xs font-medium">
                          {e.status === 'sent' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> :
                           e.status === 'processing' ? <RefreshCw className="w-3 h-3 animate-spin text-sky-600" /> :
                           e.status === 'scheduled' ? <Clock className="w-3 h-3 text-gray-500" /> :
                           <AlertTriangle className="w-3 h-3 text-amber-600" />}
                          {e.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex gap-1">
                          <button className="p-1.5 rounded hover:bg-[#F0F0F0]" title="Preview"><Eye className="w-4 h-4" /></button>
                          <button className="p-1.5 rounded hover:bg-[#F0F0F0]" title="Send now"><PlayCircle className="w-4 h-4" style={{ color: COLORS.brand[500] }} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-[#E5E5E5]">
              <div className="flex items-center gap-2 mb-2"><Send className="w-4 h-4" style={{ color: COLORS.brand[500] }} /><Heading level={4} mb={0}>E1 · Provider</Heading></div>
              <Paragraph size="sm" muted>Current: <b>{smtpProvider.toUpperCase()}</b>. Queue: FIFO with exponential backoff on 4xx. Retry 3× before dead-letter.</Paragraph>
            </div>
            <div className="p-4 rounded-lg border border-[#E5E5E5]">
              <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4" style={{ color: COLORS.brand[500] }} /><Heading level={4} mb={0}>E2 · CRM Write-Back</Heading></div>
              <Paragraph size="sm" muted>Email events → CRM (contacts, companies, mandates). Opens update engagement score; clicks update mandate stage.</Paragraph>
            </div>
            <div className="p-4 rounded-lg border border-[#E5E5E5]">
              <div className="flex items-center gap-2 mb-2"><BarChart3 className="w-4 h-4" style={{ color: COLORS.brand[500] }} /><Heading level={4} mb={0}>E3 · Delivery Tracking</Heading></div>
              <Paragraph size="sm" muted>Bounces, complaints, suppressions synced hourly. Unsubscribe links auto-append per CAN-SPAM.</Paragraph>
            </div>
          </div>
        </Card>
      )}

      {tab === 'templates' && (
        <Card p={SPACING.lg}>
          <Heading level={3} mb={SPACING.md}>T26 · D46–D50 Email Templates (Comms Portal)</Heading>
          <Grid cols={2} gap={SPACING.md}>
            {COMMERCE_EMAILS.map(e => (
              <div key={e.id} className="p-4 rounded-lg border border-[#E5E5E5] hover:border-[#C084FC] transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ backgroundColor: COLORS.brand[50], color: COLORS.brand[600] }}>{e.code}</span>
                    <Heading level={4} mb={0}>{e.template}</Heading>
                  </div>
                  <Badge tone="success">Rendered</Badge>
                </div>
                <div className="aspect-[16/10] rounded bg-gradient-to-b from-white to-[#FAFAFA] border border-[#F0F0F0] p-3 flex flex-col gap-2 text-xs">
                  <div className="h-2 bg-[#F0F0F0] rounded w-1/3" />
                  <div className="h-3 rounded w-full" style={{ backgroundColor: COLORS.brand[500], opacity: 0.1 }} />
                  <div className="flex-1 space-y-1 mt-2">
                    <div className="h-2 bg-[#F0F0F0] rounded w-full" />
                    <div className="h-2 bg-[#F0F0F0] rounded w-5/6" />
                    <div className="h-2 bg-[#F0F0F0] rounded w-4/6" />
                  </div>
                  <div className="h-6 w-24 rounded mt-1" style={{ backgroundColor: COLORS.brand[500] }} />
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="ghost" icon={<Eye className="w-4 h-4" />} fullWidth>Preview</Button>
                  <Button size="sm" variant="primary" icon={<Send className="w-4 h-4" />} fullWidth>Send Test</Button>
                </div>
              </div>
            ))}
          </Grid>
        </Card>
      )}

      {tab === 'tracking' && (
        <Card p={SPACING.lg}>
          <Heading level={3} mb={SPACING.md}>E3 · Delivery Tracking Events (last 24h)</Heading>
          <Grid cols={4} gap={SPACING.lg} mb={SPACING.lg}>
            <StatCard label="Accepted" value="312" icon={<Inbox className="w-5 h-5" />} />
            <StatCard label="Delivered" value="308" icon={<CheckCircle2 className="w-5 h-5" />} />
            <StatCard label="Bounces" value="3" icon={<AlertTriangle className="w-5 h-5" />} trendTone="warning" trend="0.97%" />
            <StatCard label="Complaints" value="0" icon={<Bell className="w-5 h-5" />} trendTone="positive" trend="0%" />
          </Grid>
          <Paragraph size="sm" muted mb={0}>
            All events streamed to <code>email_events</code> Supabase table. E2 CRM write-back reconciles on <code>delivered + clicked</code>.
          </Paragraph>
        </Card>
      )}

      {tab === 'queue' && (
        <Card p={SPACING.lg}>
          <Heading level={3} mb={SPACING.md}>Cron Monitor · T30 Schedulers (/api/cron)</Heading>
          <Paragraph muted mb={SPACING.md}>
            All D46–D50 schedulers wired via <code>api/_lib/cron/processEmailQueue.ts</code> and <code>api/cron/[[...path]].ts</code> (pg_cron triggers).
          </Paragraph>
          <ul className="space-y-2 text-sm">
            {COMMERCE_EMAILS.map(e => (
              <li key={e.id} className="flex items-center justify-between p-2 rounded hover:bg-[#FAFAFA]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: COLORS.text.muted }} />
                  <span className="font-mono text-xs" style={{ color: COLORS.brand[600] }}>{e.code}</span>
                  <span>{e.template}</span>
                </div>
                <div className="text-xs" style={{ color: COLORS.text.muted }}>
                  Next: {e.nextRun} · Last: {e.lastRun}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </Container>
  );
};
