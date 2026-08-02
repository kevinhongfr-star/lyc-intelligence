/**
 * AssessmentPortalPage — Assessment Portal UI Shell (for Candidates + Consultants)
 * Issue #85 T25: Assessment Portal UI Shell & Document Views
 *
 * Surfaces:
 * - Candidate: active assessments, results/reports (PDF preview + download), invites, scheduled sessions
 * - Consultant: administration, scoring, document exports, cohort diagnostics
 *
 * Ties in with:
 *  - T28: Document Storage & Versioning
 *  - T29: PDF Export Service (SHIFT composite, diagnostic, individual reports)
 *  - T33: Interactive Template React Conversion (Assessment & Onboarding L8)
 *  - T38: Supabase Data Model & Engagement Schema Design
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, Download, Eye, CheckCircle2, Clock, Calendar, AlertCircle,
  Users, Award, ExternalLink, RefreshCw, Search, ChevronRight
} from 'lucide-react';
import {
  Card, CardContent, Button, Badge, Input,
  EmptyState, Select, Progress, Tabs, TabsList, TabsTrigger
} from '@/components/ui';
import { StatCard } from '@/components/design-system/Cards';
import { useAuthStore } from '@/stores/authStore';
import { Heading, Paragraph } from '@/components/design-system/Typography';
import { Flex, Container } from '@/components/design-system/Layout';

type TabKey = 'active' | 'completed' | 'reports';
type AssessmentStatus = 'Invited' | 'In Progress' | 'Completed' | 'Reviewed' | 'Expired';

interface AssessmentRow {
  id: string;
  title: string;
  instrument: 'SHIFT' | 'DISC' | 'Big5' | 'Cognitive' | 'Values' | 'Composite' | 'Diagnostic';
  status: AssessmentStatus;
  progressPct: number;
  dueDate: string | null;
  completedAt: string | null;
  assigneeName: string;
  reportDocumentId: string | null;
  cohortName: string | null;
  language: string;
  timeLimitMin: number | null;
}

const STATUS_STYLES: Record<AssessmentStatus, string> = {
  Invited: 'bg-[rgba(99,102,241,0.08)] text-[#6366F1]',
  'In Progress': 'bg-[rgba(234,179,8,0.08)] text-[#B8860B]',
  Completed: 'bg-[rgba(26,125,66,0.08)] text-[#1A7D42]',
  Reviewed: 'bg-[rgba(193,8,171,0.08)] text-[#C108AB]',
  Expired: 'bg-[rgba(107,114,128,0.08)] text-[#6B7280]',
};

function fmtDate(s: string | null): string {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return s;
  }
}

const SAMPLE_ASSESSMENTS: AssessmentRow[] = [
  { id: 'A-1042', title: 'SHIFT Composite — Executive Candidate', instrument: 'Composite', status: 'Reviewed', progressPct: 100, dueDate: '2026-07-20', completedAt: '2026-07-18', assigneeName: 'Alex Chen', reportDocumentId: 'doc-shift-a1042', cohortName: 'APAC Q3', language: 'EN', timeLimitMin: 60 },
  { id: 'A-1043', title: 'Team Diagnostic — Product Team', instrument: 'Diagnostic', status: 'In Progress', progressPct: 65, dueDate: '2026-08-10', completedAt: null, assigneeName: 'Product Team (8)', reportDocumentId: null, cohortName: 'Product 2026H2', language: 'EN', timeLimitMin: 45 },
  { id: 'A-1044', title: 'SHIFT — Cohort Entry', instrument: 'SHIFT', status: 'Invited', progressPct: 0, dueDate: '2026-08-14', completedAt: null, assigneeName: 'Cohort Members', reportDocumentId: null, cohortName: 'APAC Cohort 14', language: 'ZH', timeLimitMin: 60 },
  { id: 'A-1045', title: 'DISC — Sales Leader Final', instrument: 'DISC', status: 'Completed', progressPct: 100, dueDate: '2026-07-28', completedAt: '2026-07-26', assigneeName: 'Jamie Lee', reportDocumentId: 'doc-disc-a1045', cohortName: null, language: 'EN', timeLimitMin: 20 },
  { id: 'A-1046', title: 'Cognitive Aptitude', instrument: 'Cognitive', status: 'Completed', progressPct: 100, dueDate: '2026-07-20', completedAt: '2026-07-19', assigneeName: 'Priya Shah', reportDocumentId: 'doc-cog-a1046', cohortName: null, language: 'EN', timeLimitMin: 30 },
  { id: 'A-1047', title: 'Values & Motivators', instrument: 'Values', status: 'Expired', progressPct: 10, dueDate: '2026-07-10', completedAt: null, assigneeName: 'Sam Okafor', reportDocumentId: null, cohortName: null, language: 'EN', timeLimitMin: 25 },
  { id: 'A-1048', title: 'Big5 — C-Suite Benchmark', instrument: 'Big5', status: 'Reviewed', progressPct: 100, dueDate: '2026-07-05', completedAt: '2026-07-01', assigneeName: 'Board Candidate #3', reportDocumentId: 'doc-big5-a1048', cohortName: 'Board Search', language: 'EN', timeLimitMin: 40 },
];

export function AssessmentPortalPage() {
  const { profile } = useAuthStore();
  const isConsultant = (profile?.role ?? '') !== 'candidate';
  const [tab, setTab] = useState<TabKey>('active');
  const [search, setSearch] = useState('');
  const [instrument, setInstrument] = useState<string>('all');
  const [rows, setRows] = useState<AssessmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setRows(SAMPLE_ASSESSMENTS);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (tab === 'active' && (r.status === 'Completed' || r.status === 'Reviewed' || r.status === 'Expired')) return false;
      if (tab === 'completed' && r.status !== 'Completed' && r.status !== 'Reviewed') return false;
      if (tab === 'reports' && !r.reportDocumentId) return false;
      if (instrument !== 'all' && r.instrument !== instrument) return false;
      if (search && !(`${r.title} ${r.assigneeName} ${r.id}`.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [rows, tab, instrument, search]);

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter(r => r.status === 'Invited' || r.status === 'In Progress').length,
    completed: rows.filter(r => r.status === 'Completed' || r.status === 'Reviewed').length,
    withReport: rows.filter(r => !!r.reportDocumentId).length,
  }), [rows]);

  return (
    <Container size="xl">
      <Stack gap={6} style={{ padding: '16px 0 32px' }}>
        <Flex justify="between" align="end" wrap>
          <Stack gap={2}>
            <Heading level={1} mb={0}>Assessment Portal</Heading>
            <Paragraph muted mb={0}>
              T25 · SHIFT Composite, 5 instruments, APAC translation, Cohort diagnostics, Team &amp; Individual reports
            </Paragraph>
          </Stack>
          <Flex gap={3}>
            <Button variant="outline"><RefreshCw size={14} style={{ marginRight: 6 }} />Sync results</Button>
            {isConsultant && <Button variant="default"><FileText size={14} style={{ marginRight: 6 }} />New Assessment</Button>}
          </Flex>
        </Flex>

        <Grid columns={4} gap={4}>
          <StatCard title="Total Assessments" value={stats.total} icon={<FileText size={18} />} />
          <StatCard title="Active / Pending" value={stats.active} icon={<Clock size={18} />} />
          <StatCard title="Completed" value={stats.completed} icon={<CheckCircle2 size={18} />} />
          <StatCard title="Reports Available" value={stats.withReport} icon={<Award size={18} />} />
        </Grid>

        <Card>
          <CardContent style={{ padding: '16px 24px', borderBottom: '1px solid #F0F0F0' }}>
            <Flex justify="between" align="center" wrap gap={3}>
              <Tabs defaultValue={tab} value={tab} onValueChange={(v) => setTab(v as TabKey)}>
                <TabsList>
                  <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
                  <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
                  <TabsTrigger value="reports">Report Documents ({stats.withReport})</TabsTrigger>
                </TabsList>
              </Tabs>
              <Flex gap={2} wrap>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#A3A3A3' }} />
                  <Input
                    placeholder="Search title, assignee, ID…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: 280, paddingLeft: 34 }}
                  />
                </div>
                <Select
                  value={instrument}
                  onValueChange={setInstrument}
                  options={[
                    { value: 'all', label: 'All Instruments' },
                    { value: 'SHIFT', label: 'SHIFT Composite' },
                    { value: 'Diagnostic', label: 'Team Diagnostic' },
                    { value: 'DISC', label: 'DISC' },
                    { value: 'Big5', label: 'Big 5' },
                    { value: 'Cognitive', label: 'Cognitive' },
                    { value: 'Values', label: 'Values' },
                    { value: 'Composite', label: 'Executive Composite' },
                  ]}
                  style={{ width: 200 }}
                />
              </Flex>
            </Flex>
          </CardContent>
          <CardContent>
            {loading ? (
              <EmptyState icon={<RefreshCw />} title="Loading assessments…" description="Fetching active and completed assessments." />
            ) : filtered.length === 0 ? (
              <EmptyState icon={<AlertCircle />} title="No assessments match" description="Try a different tab, instrument, or search." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filtered.map((r) => (
                  <div key={r.id} style={{ border: '1px solid #F0F0F0', borderRadius: 12, padding: 16, background: '#FFFFFF' }}>
                    <Flex justify="between" align="start" wrap gap={3}>
                      <Stack gap={1} style={{ flex: 1, minWidth: 0 }}>
                        <Flex align="center" gap={2} wrap>
                          <Badge variant="outline" className="bg-[rgba(193,8,171,0.06)] text-[#C108AB]">{r.id}</Badge>
                          <Badge variant="outline">{r.instrument}</Badge>
                          <Badge className={STATUS_STYLES[r.status]} variant="outline">{r.status}</Badge>
                          {r.cohortName && <Badge variant="outline"><Users size={12} style={{ marginRight: 4 }} />{r.cohortName}</Badge>}
                          {r.language !== 'EN' && <Badge variant="outline">🌐 {r.language}</Badge>}
                        </Flex>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#1F1F1F' }}>{r.title}</div>
                        <div style={{ fontSize: 13, color: '#6B7280' }}>
                          Assignee: <strong style={{ color: '#404040' }}>{r.assigneeName}</strong>
                          {r.dueDate && <> · Due: <strong>{fmtDate(r.dueDate)}</strong></>}
                          {r.completedAt && <> · Completed: <strong style={{ color: '#1A7D42' }}>{fmtDate(r.completedAt)}</strong></>}
                          {r.timeLimitMin && <> · Time limit: {r.timeLimitMin} min</>}
                        </div>
                        {r.status === 'In Progress' && (
                          <div style={{ maxWidth: 420 }}>
                            <div style={{ marginBottom: 4, fontSize: 12, color: '#6B7280' }}>{r.progressPct}% complete</div>
                            <Progress value={r.progressPct} />
                          </div>
                        )}
                      </Stack>
                      <Flex gap={2} wrap>
                        {tab !== 'reports' && r.status !== 'Completed' && r.status !== 'Reviewed' && r.status !== 'Expired' && (
                          <Button variant="default" size="sm">
                            {r.status === 'Invited' ? 'Begin' : 'Resume'} <ChevronRight size={14} style={{ marginLeft: 4 }} />
                          </Button>
                        )}
                        {r.reportDocumentId && (
                          <>
                            <Button size="sm" variant="ghost"><Eye size={14} style={{ marginRight: 4 }} />Preview</Button>
                            <Button size="sm" variant="outline"><Download size={14} style={{ marginRight: 4 }} />PDF</Button>
                          </>
                        )}
                        {tab === 'reports' && r.reportDocumentId && (
                          <Button size="sm" variant="ghost"><ExternalLink size={14} style={{ marginRight: 4 }} />Open Doc</Button>
                        )}
                      </Flex>
                    </Flex>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}

function Stack({ gap = 4, children, className, style }: { gap?: number; children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const SP: Record<number, number> = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32 };
  return (
    <div
      className={className}
      style={{ display: 'flex', flexDirection: 'column', gap: SP[gap] ?? gap, ...style }}
    >
      {children}
    </div>
  );
}

function Grid({ columns = 3, gap = 4, children, className }: { columns?: number; gap?: number; children: React.ReactNode; className?: string }) {
  const SP: Record<number, number> = { 2: 8, 3: 12, 4: 16, 6: 24 };
  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: SP[gap] ?? gap,
      }}
    >
      {children}
    </div>
  );
}

export default AssessmentPortalPage;
