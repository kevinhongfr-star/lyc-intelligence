import React, { useState } from 'react';
import { Heading, Paragraph, Container, Card, Badge, Button, Grid, Tabs, Tab, StatCard, Input } from '@/components/design-system';
import { COLORS, SPACING } from '@/styles/tokens';
import {
  Building2, Users, UserCog, GraduationCap, ClipboardList, FileText,
  Folder, Eye, Download, Share2, Search, Clock, CheckCircle2, Shield
} from 'lucide-react';

interface DocItem {
  id: string;
  title: string;
  code: string;
  type: string;
  lastOpened: string;
  access: 'view' | 'comment' | 'edit';
  status: 'draft' | 'final' | 'scheduled';
  ownedBy: string;
}

const PORTAL_DATA: Record<string, {
  id: string;
  name: string;
  icon: React.ReactNode;
  tagline: string;
  stats: { label: string; value: string; icon: React.ReactNode }[];
  docs: DocItem[];
  route: string;
}> = {
  client: {
    id: 'client', name: 'Client Portal',
    icon: <Building2 className="w-5 h-5" />,
    tagline: 'T21: Client-facing document views — mandate progress, shortlists, assessments.',
    stats: [
      { label: 'Shared Documents', value: '12', icon: <FileText className="w-4 h-4" /> },
      { label: 'Mandate Updates', value: '4 new', icon: <Clock className="w-4 h-4" /> },
      { label: 'Pending Review', value: '3', icon: <Eye className="w-4 h-4" /> },
    ],
    route: '/client/documents',
    docs: [
      { id: 'c1', title: 'Mandate Brief — CFO Search', code: 'D06', type: 'Mandate', lastOpened: 'Today', access: 'comment', status: 'final', ownedBy: 'Sarah LYC' },
      { id: 'c2', title: 'Shortlist v2 — 5 Candidates', code: 'D12', type: 'Shortlist', lastOpened: 'Yesterday', access: 'comment', status: 'final', ownedBy: 'Sarah LYC' },
      { id: 'c3', title: 'Interview Schedule — Round 2', code: 'D17', type: 'Interview', lastOpened: '2 days ago', access: 'view', status: 'scheduled', ownedBy: 'James LYC' },
      { id: 'c4', title: 'Team Diagnostic — Executive', code: 'D38', type: 'Assessment', lastOpened: '1 week ago', access: 'view', status: 'final', ownedBy: 'Assessment Team' },
      { id: 'c5', title: 'QBR Summary Q2', code: 'D50', type: 'Review', lastOpened: '—', access: 'view', status: 'draft', ownedBy: 'Kevin H.' },
    ],
  },
  consultant: {
    id: 'consultant', name: 'Consultant (Internal) Portal',
    icon: <Users className="w-5 h-5" />,
    tagline: 'T22: Consultant workspace document views — generation, templating, version tracking.',
    stats: [
      { label: 'My Documents', value: '34', icon: <FileText className="w-4 h-4" /> },
      { label: 'Drafts in Progress', value: '7', icon: <FileText className="w-4 h-4" /> },
      { label: 'Generated This Week', value: '19', icon: <CheckCircle2 className="w-4 h-4" /> },
    ],
    route: '/app/documents',
    docs: [
      { id: 'k1', title: 'CV Presentation — Albert T.', code: 'D11', type: 'Candidate', lastOpened: '2h ago', access: 'edit', status: 'draft', ownedBy: 'You' },
      { id: 'k2', title: 'Client Proposal — Mandate #482', code: 'D01', type: 'BD', lastOpened: 'Today', access: 'edit', status: 'final', ownedBy: 'You' },
      { id: 'k3', title: 'Interview Debrief — Priya S.', code: 'D19', type: 'Interview', lastOpened: 'Today', access: 'edit', status: 'final', ownedBy: 'You' },
      { id: 'k4', title: 'Offer Letter — Counter Advisory', code: 'D25', type: 'Offer', lastOpened: 'Yesterday', access: 'comment', status: 'draft', ownedBy: 'Team Lead' },
      { id: 'k5', title: 'Placement Confirmation', code: 'D31', type: 'Placement', lastOpened: '3 days ago', access: 'view', status: 'final', ownedBy: 'You' },
    ],
  },
  candidate: {
    id: 'candidate', name: 'Candidate Portal',
    icon: <UserCog className="w-5 h-5" />,
    tagline: 'T23: Candidate-facing document views — career reports, assessments, offers.',
    stats: [
      { label: 'My Assessments', value: '3', icon: <GraduationCap className="w-4 h-4" /> },
      { label: 'Reports Shared', value: '2', icon: <Share2 className="w-4 h-4" /> },
      { label: 'Offers Received', value: '1', icon: <CheckCircle2 className="w-4 h-4" /> },
    ],
    route: '/candidate/documents',
    docs: [
      { id: 'cd1', title: 'SHIFT Composite Report', code: 'G1', type: 'Assessment', lastOpened: 'Today', access: 'view', status: 'final', ownedBy: 'LYC' },
      { id: 'cd2', title: 'Development Recommendations', code: 'D37', type: 'Coaching', lastOpened: 'Yesterday', access: 'view', status: 'final', ownedBy: 'Coach M.' },
      { id: 'cd3', title: 'Interview Prep Guide', code: 'D16', type: 'Interview', lastOpened: '3 days ago', access: 'view', status: 'final', ownedBy: 'Sarah LYC' },
    ],
  },
  admin: {
    id: 'admin', name: 'Admin Portal',
    icon: <Shield className="w-5 h-5" />,
    tagline: 'T24: Admin document views — audit, permissions, mass operations, brand variants.',
    stats: [
      { label: 'Total Templates', value: '50', icon: <Folder className="w-4 h-4" /> },
      { label: 'Versions Tracked', value: '287', icon: <Clock className="w-4 h-4" /> },
      { label: 'Audit Events (24h)', value: '124', icon: <Shield className="w-4 h-4" /> },
    ],
    route: '/app/admin/document-generation',
    docs: [
      { id: 'a1', title: 'D46 Weekly Digest Template', code: 'D46', type: 'Email', lastOpened: 'Today', access: 'edit', status: 'final', ownedBy: 'Admin' },
      { id: 'a2', title: 'D24 Offer Letter — LYC Brand', code: 'D24', type: 'PDF', lastOpened: 'Yesterday', access: 'edit', status: 'final', ownedBy: 'Admin' },
      { id: 'a3', title: 'G1 Assessment — Executive Variant', code: 'G1-E', type: 'PDF', lastOpened: '2 days ago', access: 'edit', status: 'final', ownedBy: 'Assessment' },
    ],
  },
  assessment: {
    id: 'assessment', name: 'Assessment Portal',
    icon: <ClipboardList className="w-5 h-5" />,
    tagline: 'T25: Assessment document views — instrument selection, scorecards, cohort bundles.',
    stats: [
      { label: 'Instruments', value: '9', icon: <ClipboardList className="w-4 h-4" /> },
      { label: 'Active Cohorts', value: '4', icon: <Users className="w-4 h-4" /> },
      { label: 'Scorecards Generated', value: '138', icon: <CheckCircle2 className="w-4 h-4" /> },
    ],
    route: '/assessment/documents',
    docs: [
      { id: 'as1', title: 'SHIFT — 5 Instruments', code: 'G1-SHIFT', type: 'Bundle', lastOpened: 'Today', access: 'view', status: 'final', ownedBy: 'Assessment' },
      { id: 'as2', title: 'Cohort Q2 — Executive Summary', code: 'D39', type: 'Cohort', lastOpened: 'Yesterday', access: 'view', status: 'final', ownedBy: 'Assessment' },
      { id: 'as3', title: 'Criterion Validation Report', code: 'D40', type: 'QA', lastOpened: '1 week ago', access: 'view', status: 'final', ownedBy: 'Assessment' },
    ],
  },
};

export const PortalDocumentViewsPage: React.FC = () => {
  const [active, setActive] = useState('client');
  const [search, setSearch] = useState('');
  const portal = PORTAL_DATA[active];
  const filteredDocs = portal.docs.filter(d => d.title.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <Container maxWidth="7xl" py={SPACING.xl}>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Badge tone="brand" size="sm">T21 · Client</Badge>
          <Badge tone="brand" size="sm">T22 · Consultant</Badge>
          <Badge tone="brand" size="sm">T23 · Candidate</Badge>
          <Badge tone="brand" size="sm">T24 · Admin</Badge>
          <Badge tone="brand" size="sm">T25 · Assessment</Badge>
        </div>
        <Heading level={1} mb={SPACING.sm}>Portal UI Shells &amp; Document Views</Heading>
        <Paragraph muted size="lg">
          5 portals × unified document view component. Each portal shell embeds the shared DocViewer with role-scoped rendering.
        </Paragraph>
      </div>

      <Tabs value={active} onChange={setActive} className="mb-6">
        {Object.values(PORTAL_DATA).map(p => (
          <Tab key={p.id} value={p.id} icon={p.icon}>{p.name}</Tab>
        ))}
      </Tabs>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.brand[50], color: COLORS.brand[600] }}>{portal.icon}</div>
          <div>
            <Heading level={2} mb={0}>{portal.name}</Heading>
            <Paragraph size="sm" muted mb={0}>{portal.tagline}</Paragraph>
          </div>
        </div>
        <Badge tone="neutral">Route: {portal.route}</Badge>
      </div>

      <Grid cols={3} gap={SPACING.lg} mb={SPACING.lg}>
        {portal.stats.map(s => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} />
        ))}
      </Grid>

      <Card p={SPACING.lg}>
        <div className="flex items-center justify-between mb-4">
          <Heading level={3} mb={0}>Document Library — {portal.name}</Heading>
          <div className="flex gap-2">
            <Input placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} icon={<Search className="w-4 h-4" />} style={{ width: 260 }} />
            <Button variant="ghost" icon={<Share2 className="w-4 h-4" />}>Share</Button>
            <Button variant="primary" icon={<Download className="w-4 h-4" />}>Download All</Button>
          </div>
        </div>
        <div className="divide-y divide-[#F0F0F0]">
          {filteredDocs.map(d => (
            <div key={d.id} className="py-3 flex items-center justify-between hover:bg-[#FAFAFA] px-2 -mx-2 rounded">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-2 rounded-lg bg-[#F5F5F5]"><FileText className="w-5 h-5" style={{ color: COLORS.brand[500] }} /></div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs" style={{ color: COLORS.brand[600] }}>{d.code}</span>
                    <Badge tone={d.status === 'final' ? 'success' : d.status === 'scheduled' ? 'warning' : 'neutral'} size="sm">{d.status}</Badge>
                    <Badge tone="neutral" size="sm">{d.type}</Badge>
                  </div>
                  <div className="font-medium truncate">{d.title}</div>
                  <div className="text-xs" style={{ color: COLORS.text.muted }}>Owner: {d.ownedBy} · Last opened: {d.lastOpened}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="neutral" size="sm">{d.access}</Badge>
                <button className="p-1.5 rounded hover:bg-[#F0F0F0]" title="Preview"><Eye className="w-4 h-4" /></button>
                <button className="p-1.5 rounded hover:bg-[#F0F0F0]" title="Download"><Download className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {filteredDocs.length === 0 && (
            <div className="py-8 text-center" style={{ color: COLORS.text.muted }}>No documents match your search.</div>
          )}
        </div>
      </Card>
    </Container>
  );
};
