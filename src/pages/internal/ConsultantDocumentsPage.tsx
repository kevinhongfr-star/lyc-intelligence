/**
 * ConsultantDocumentsPage — Consultant Workspace (Internal) Document Center
 * Issue #82 T22: Consultant Portal UI Shell & Document Views
 *
 * Surfaces for each consultant role:
 * - Engagement documents (L1–L3: proposals, SOWs, initiation packs)
 * - Candidate deliverables (L4–L5: interview kits, feedback, presentations)
 * - Assessment reports (L8 diagnostics, SHIFT composite, individual/cohort)
 * - Pipeline & status reports (L7 dashboards)
 * - Reference: T16 template registry + T27 rendering API + T28 storage/versioning
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, Download, Eye, Upload, Search, Filter, RefreshCw,
  Calendar, Tag, Users, BarChart3, CheckCircle2, Clock, AlertTriangle, ArrowUpDown, Share2
} from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardContent, Button, Badge, Input,
  EmptyState, Select, Tabs, TabsList, TabsTrigger
} from '@/components/ui';
import { StatCard } from '@/components/design-system/Cards';
import { useAuthStore } from '@/stores/authStore';
import { getDocuments, type Document } from '@/services/supabaseApi';
import { Heading, Paragraph } from '@/components/design-system/Typography';
import { Flex, Container } from '@/components/design-system/Layout';

type TabKey = 'all' | 'mine' | 'review' | 'delivered';

interface ConsultantDocRow {
  id: string;
  title: string;
  templateCode: string;
  level: 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'L7' | 'L8' | 'L9' | 'L10';
  docType: 'Proposal' | 'SOW' | 'Candidate Pack' | 'Interview Kit' | 'Scorecard' | 'Report' | 'Assessment' | 'Pipeline' | 'Comm';
  audience: 'Client' | 'Internal' | 'Candidate' | 'Leadership';
  mandateId: string | null;
  candidateId: string | null;
  owner: string;
  status: 'Draft' | 'In Review' | 'Approved' | 'Delivered' | 'Archived';
  version: string;
  lastEdited: string;
  updatedBy: string;
}

const STATUS_STYLES: Record<ConsultantDocRow['status'], string> = {
  Draft: 'bg-[rgba(107,114,128,0.08)] text-[#6B7280]',
  'In Review': 'bg-[rgba(234,179,8,0.08)] text-[#B8860B]',
  Approved: 'bg-[rgba(26,125,66,0.08)] text-[#1A7D42]',
  Delivered: 'bg-[rgba(99,102,241,0.08)] text-[#6366F1]',
  Archived: 'bg-[rgba(156,163,175,0.08)] text-[#9CA3AF]',
};

const LEVEL_BADGE: Record<ConsultantDocRow['level'], string> = {
  L1: 'bg-[rgba(193,8,171,0.08)] text-[#C108AB]',
  L2: 'bg-[rgba(193,8,171,0.08)] text-[#C108AB]',
  L3: 'bg-[rgba(99,102,241,0.08)] text-[#6366F1]',
  L4: 'bg-[rgba(26,125,66,0.08)] text-[#1A7D42]',
  L5: 'bg-[rgba(26,125,66,0.08)] text-[#1A7D42]',
  L6: 'bg-[rgba(6,182,212,0.08)] text-[#06B6D4]',
  L7: 'bg-[rgba(234,179,8,0.08)] text-[#B8860B]',
  L8: 'bg-[rgba(217,119,6,0.08)] text-[#D97706]',
  L9: 'bg-[rgba(107,114,128,0.08)] text-[#6B7280]',
  L10: 'bg-[rgba(107,114,128,0.08)] text-[#6B7280]',
};

function seedFromDocuments(docs: Document[], _userId: string, userEmail: string): ConsultantDocRow[] {
  return docs.map((d, i): ConsultantDocRow => {
    const lvls: ConsultantDocRow['level'][] = ['L1','L2','L3','L4','L5','L6','L7','L8','L9','L10'];
    const types: ConsultantDocRow['docType'][] = ['Proposal','SOW','Candidate Pack','Interview Kit','Scorecard','Report','Assessment','Pipeline','Comm'];
    const audiences: ConsultantDocRow['audience'][] = ['Client','Internal','Candidate','Leadership'];
    const statuses: ConsultantDocRow['status'][] = ['Draft','In Review','Approved','Delivered','Archived'];
    return {
      id: d.id,
      title: d.name ?? `Untitled Document #${i + 1}`,
      templateCode: `D${String((i % 50) + 1).padStart(2, '0')}`,
      level: lvls[i % lvls.length],
      docType: types[i % types.length],
      audience: audiences[i % audiences.length],
      mandateId: d.mandate_id ?? null,
      candidateId: null,
      owner: d.created_by ?? userEmail,
      status: statuses[i % statuses.length],
      version: `1.${i % 5}`,
      lastEdited: d.updated_at ?? d.created_at ?? new Date().toISOString(),
      updatedBy: d.created_by ?? userEmail,
    };
  });
}

function formatDate(ds: string): string {
  try {
    return new Date(ds).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return ds;
  }
}

export function ConsultantDocumentsPage() {
  const { profile } = useAuthStore();
  const [docs, setDocs] = useState<ConsultantDocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<TabKey>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [audienceFilter, setAudienceFilter] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getDocuments();
        if (!cancelled) {
          const uid = profile?.id ?? 'anon';
          const ue = profile?.email ?? 'consultant@lyc';
          setDocs(seedFromDocuments(result.slice(0, 30), uid, ue));
        }
      } catch (e) {
        console.warn('[ConsultantDocumentsPage] docs load failed, using fallback', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [profile?.id, profile?.email]);

  const filtered = useMemo(() => {
    return docs.filter(d => {
      if (tab === 'mine' && d.owner !== (profile?.email ?? '')) return false;
      if (tab === 'review' && d.status !== 'In Review') return false;
      if (tab === 'delivered' && d.status !== 'Delivered') return false;
      if (levelFilter !== 'all' && d.level !== levelFilter) return false;
      if (audienceFilter !== 'all' && d.audience !== audienceFilter) return false;
      if (search && !(`${d.title} ${d.docType} ${d.templateCode}`.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [docs, tab, levelFilter, audienceFilter, search, profile?.email]);

  const stats = useMemo(() => ({
    total: docs.length,
    drafts: docs.filter(d => d.status === 'Draft').length,
    review: docs.filter(d => d.status === 'In Review').length,
    delivered: docs.filter(d => d.status === 'Delivered').length,
  }), [docs]);

  return (
    <Container size="xl">
      <Stack gap={6} style={{ padding: '16px 0 32px' }}>
        <Flex justify="between" align="end" wrap>
          <Stack gap={2}>
            <Heading level={1} mb={0}>Consultant Document Center</Heading>
            <Paragraph muted mb={0}>T22 · L1–L10 business docs, assessment reports, pipeline packs & scheduled email templates</Paragraph>
          </Stack>
          <Flex gap={3}>
            <Button variant="outline"><RefreshCw size={14} style={{ marginRight: 6 }} />Refresh</Button>
            <Button variant="default"><Upload size={14} style={{ marginRight: 6 }} />New Document</Button>
          </Flex>
        </Flex>

        <Grid columns={4} gap={4}>
          <StatCard title="Total Documents" value={stats.total} icon={<FileText size={18} />} />
          <StatCard title="My Drafts" value={stats.drafts} icon={<Clock size={18} />} />
          <StatCard title="In Review" value={stats.review} icon={<AlertTriangle size={18} />} />
          <StatCard title="Delivered (30d)" value={stats.delivered} icon={<CheckCircle2 size={18} />} />
        </Grid>

        <Card>
          <CardHeader>
            <Flex justify="between" align="center" wrap gap={3}>
              <Tabs defaultValue={tab} value={tab} onValueChange={(v) => setTab(v as TabKey)}>
                <TabsList>
                  <TabsTrigger value="all">All ({docs.length})</TabsTrigger>
                  <TabsTrigger value="mine">My Docs ({docs.filter(d => d.owner === profile?.email).length})</TabsTrigger>
                  <TabsTrigger value="review">Review ({stats.review})</TabsTrigger>
                  <TabsTrigger value="delivered">Delivered ({stats.delivered})</TabsTrigger>
                </TabsList>
              </Tabs>
              <Flex gap={2} wrap>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#A3A3A3' }} />
                  <Input
                    placeholder="Search title, template code…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: 260, paddingLeft: 34 }}
                  />
                </div>
                <Select
                  value={levelFilter}
                  onValueChange={setLevelFilter}
                  options={[
                    { value: 'all', label: 'All Levels' },
                    { value: 'L1', label: 'L1 · BD' },
                    { value: 'L2', label: 'L2 · Initiation' },
                    { value: 'L3', label: 'L3 · Pres' },
                    { value: 'L4', label: 'L4 · Interview' },
                    { value: 'L5', label: 'L5 · Decision' },
                    { value: 'L6', label: 'L6 · Mandate' },
                    { value: 'L7', label: 'L7 · Pipeline' },
                    { value: 'L8', label: 'L8 · Assessment' },
                    { value: 'L9', label: 'L9 · Internal Ops' },
                    { value: 'L10', label: 'L10 · Comms' },
                  ]}
                  style={{ width: 170 }}
                />
                <Select
                  value={audienceFilter}
                  onValueChange={setAudienceFilter}
                  options={[
                    { value: 'all', label: 'All Audiences' },
                    { value: 'Client', label: 'Client' },
                    { value: 'Internal', label: 'Internal' },
                    { value: 'Candidate', label: 'Candidate' },
                    { value: 'Leadership', label: 'Leadership' },
                  ]}
                  style={{ width: 170 }}
                />
              </Flex>
            </Flex>
          </CardHeader>
          <CardContent>
            {loading ? (
              <EmptyState icon={<FileText />} title="Loading documents…" description="Fetching your engagement docs from storage." />
            ) : filtered.length === 0 ? (
              <EmptyState icon={<Filter />} title="No documents match" description="Try removing filters or creating a new L1–L10 document." />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ color: '#6B7280', textAlign: 'left', borderBottom: '1px solid #F0F0F0' }}>
                      <th style={{ padding: '10px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>Title</th>
                      <th style={{ padding: '10px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>Level</th>
                      <th style={{ padding: '10px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>Type</th>
                      <th style={{ padding: '10px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>Audience</th>
                      <th style={{ padding: '10px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>Status</th>
                      <th style={{ padding: '10px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>Version</th>
                      <th style={{ padding: '10px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}><Flex gap={1} align="center"><ArrowUpDown size={12} />Last edited</Flex></th>
                      <th style={{ padding: '10px 12px', fontWeight: 600, whiteSpace: 'nowrap', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((d) => (
                      <tr key={d.id} style={{ borderBottom: '1px solid #F7F7F7' }}>
                        <td style={{ padding: '12px' }}>
                          <Flex align="center" gap={2}>
                            <FileText size={16} style={{ color: '#C108AB', flexShrink: 0 }} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: '#1F1F1F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 320 }}>{d.title}</div>
                              <div style={{ fontSize: 12, color: '#6B7280' }}>{d.templateCode} · owner: {d.owner}</div>
                            </div>
                          </Flex>
                        </td>
                        <td style={{ padding: '12px' }}><Badge className={LEVEL_BADGE[d.level]} variant="outline">{d.level}</Badge></td>
                        <td style={{ padding: '12px', color: '#404040' }}>{d.docType}</td>
                        <td style={{ padding: '12px' }}>
                          <Badge variant="outline">{d.audience}</Badge>
                        </td>
                        <td style={{ padding: '12px' }}><Badge className={STATUS_STYLES[d.status]} variant="outline">{d.status}</Badge></td>
                        <td style={{ padding: '12px', fontFamily: 'monospace', color: '#6B7280' }}>v{d.version}</td>
                        <td style={{ padding: '12px', color: '#6B7280', fontSize: 13, whiteSpace: 'nowrap' }}>{formatDate(d.lastEdited)}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <Flex gap={1} justify="end">
                            <Button size="sm" variant="ghost"><Eye size={14} /></Button>
                            <Button size="sm" variant="ghost"><Share2 size={14} /></Button>
                            <Button size="sm" variant="ghost"><Download size={14} /></Button>
                          </Flex>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}

// Local missing layout helpers — keeps file self-contained
function Stack({ gap = 4, children, className, style }: { gap?: number; children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const SP: Record<number, number> = { 0: 0, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32 };
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

export default ConsultantDocumentsPage;
