/**
 * NexusMemoryPage — Nexus Phase 1 N2 Memory System UI
 * Issue #40 (N2): Nexus Memory System (Working + Episodic + Semantic)
 *
 * Allows admins & Nexus operators to inspect a user's 3-tier memory,
 * edit facts, evict stale working items, and replay important episodes.
 * Wired to: nexusMemoryService + NexusConversationPage + ProactiveSuggestionPage
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  Database, Brain, Clock, FileText, Search, Plus, Trash2, RefreshCw,
  ChevronRight, Filter, Award, AlertTriangle, Sparkles
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, EmptyState, Select, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { StatCard } from '@/components/design-system/Cards';
import { Heading, Paragraph } from '@/components/design-system/Typography';
import { Flex, Container } from '@/components/design-system/Layout';
import * as Mem from '@/services/nexusMemoryService';
import { useAuthStore } from '@/stores/authStore';

type TabKey = 'working' | 'episodic' | 'semantic' | 'snapshot';

export function NexusMemoryPage() {
  const { profile } = useAuthStore();
  const userId = profile?.id ?? 'anon';
  const [tab, setTab] = useState<TabKey>('working');
  const [search, setSearch] = useState('');
  const [epiTag, setEpiTag] = useState<string>('all');
  const [semDomain, setSemDomain] = useState<string>('all');
  const [refreshTick, setRefreshTick] = useState(0);
  const [working, setWorking] = useState<Mem.WorkingMemoryItem[]>([]);
  const [episodic, setEpisodic] = useState<Mem.EpisodicMemoryItem[]>([]);
  const [semantic, setSemantic] = useState<Mem.SemanticFact[]>([]);

  useEffect(() => {
    Mem.seedDemoMemory(userId, { name: profile?.name, role: profile?.role });
    setWorking(Mem.workingGet(userId));
    setEpisodic(Mem.episodicList(userId, { limit: 50 }));
    setSemantic(Mem.semanticFacts(userId));
  }, [userId, profile?.name, profile?.role, refreshTick]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    episodic.forEach(e => e.tags.forEach(t => s.add(t)));
    return Array.from(s);
  }, [episodic]);

  const stats = useMemo(() => ({
    working: working.length,
    episodic: episodic.length,
    semantic: semantic.length,
    domains: new Set(semantic.map(s => s.domain)).size,
  }), [working, episodic, semantic]);

  const filteredWorking = useMemo(() => {
    if (!search) return working;
    const q = search.toLowerCase();
    return working.filter(w => `${w.key} ${w.value}`.toLowerCase().includes(q));
  }, [working, search]);

  const filteredEpisodic = useMemo(() => {
    const q = search.toLowerCase();
    return episodic.filter(e => {
      if (epiTag !== 'all' && !e.tags.includes(epiTag)) return false;
      if (search && !(`${e.title} ${e.summary} ${e.tags.join(' ')}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [episodic, epiTag, search]);

  const filteredSemantic = useMemo(() => {
    const q = search.toLowerCase();
    return semantic.filter(s => {
      if (semDomain !== 'all' && s.domain !== semDomain) return false;
      if (search && !(`${s.domain} ${s.key} ${JSON.stringify(s.value)}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [semantic, semDomain, search]);

  function fmtTime(t: number): string {
    try {
      return new Date(t).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return String(t);
    }
  }

  function deleteWorking(id: string) {
    setWorking(prev => prev.filter(w => w.id !== id));
    // Rebuild bucket from list
    const items = working.filter(w => w.id !== id);
    // Write back by clearing and rewriting all alive items
    // Since nexusMemoryService has per-key delete by key/convo, use simple storage clear + re-seed:
    for (const w of items) {
      Mem.workingSet(userId, w.key, w.value, { conversationId: w.conversationId, ttlSeconds: w.expiresAt ? Math.max(60, Math.ceil((w.expiresAt - Date.now()) / 1000)) : undefined });
    }
    setRefreshTick(x => x + 1);
  }

  function renderConfidence(v: number) {
    const color = v >= 0.9 ? 'text-[#1A7D42]' : v >= 0.7 ? 'text-[#B8860B]' : 'text-[#C0392B]';
    return <span className={color} style={{ fontWeight: 600 }}>{(v * 100).toFixed(0)}%</span>;
  }

  return (
    <Container size="xl">
      <Stack gap={6} style={{ padding: '16px 0 32px' }}>
        <Flex justify="between" align="end" wrap>
          <Stack gap={2}>
            <Flex align="center" gap={2}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(193,8,171,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Database size={20} style={{ color: '#C108AB' }} />
              </div>
              <div>
                <Heading level={1} mb={0}>Nexus Memory System (N2)</Heading>
                <Paragraph muted mb={0}>3-tier memory for Nexus companion — Working · Episodic · Semantic</Paragraph>
              </div>
            </Flex>
          </Stack>
          <Flex gap={3}>
            <Button variant="outline" onClick={() => setRefreshTick(x => x + 1)}><RefreshCw size={14} style={{ marginRight: 6 }} />Refresh</Button>
            <Button variant="default" onClick={() => { Mem.seedDemoMemory(userId + Math.random(), { name: 'Demo User', role: 'consultant' }); setRefreshTick(x => x + 1); }}><Plus size={14} style={{ marginRight: 6 }} />Seed Demo</Button>
          </Flex>
        </Flex>

        <Grid columns={4} gap={4}>
          <StatCard title="Working Memory" value={stats.working} icon={<Clock size={18} />} />
          <StatCard title="Episodic Events" value={stats.episodic} icon={<FileText size={18} />} />
          <StatCard title="Semantic Facts" value={stats.semantic} icon={<Brain size={18} />} />
          <StatCard title="Fact Domains" value={stats.domains} icon={<Award size={18} />} />
        </Grid>

        <Card>
          <CardHeader>
            <Flex justify="between" align="center" wrap gap={3}>
              <Tabs defaultValue={tab} value={tab} onValueChange={(v) => setTab(v as TabKey)}>
                <TabsList>
                  <TabsTrigger value="working"><Clock size={14} style={{ marginRight: 4 }} />Working ({stats.working})</TabsTrigger>
                  <TabsTrigger value="episodic"><FileText size={14} style={{ marginRight: 4 }} />Episodic ({stats.episodic})</TabsTrigger>
                  <TabsTrigger value="semantic"><Brain size={14} style={{ marginRight: 4 }} />Semantic ({stats.semantic})</TabsTrigger>
                  <TabsTrigger value="snapshot"><Sparkles size={14} style={{ marginRight: 4 }} />Snapshot</TabsTrigger>
                </TabsList>
              </Tabs>
              <Flex gap={2} wrap>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#A3A3A3' }} />
                  <Input placeholder="Search memory…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 280, paddingLeft: 34 }} />
                </div>
                {tab === 'episodic' && (
                  <Select
                    value={epiTag}
                    onValueChange={setEpiTag}
                    options={[{ value: 'all', label: 'All tags' }, ...allTags.map(t => ({ value: t, label: `#${t}` }))]}
                    style={{ width: 160 }}
                  />
                )}
                {tab === 'semantic' && (
                  <Select
                    value={semDomain}
                    onValueChange={setSemDomain}
                    options={[
                      { value: 'all', label: 'All domains' },
                      { value: 'profile', label: 'profile' },
                      { value: 'preferences', label: 'preferences' },
                      { value: 'role', label: 'role' },
                      { value: 'organization', label: 'organization' },
                      { value: 'relationship', label: 'relationship' },
                      { value: 'context', label: 'context' },
                      { value: 'skills', label: 'skills' },
                    ]}
                    style={{ width: 180 }}
                  />
                )}
              </Flex>
            </Flex>
          </CardHeader>
          <CardContent>
            <TabsContent value="working">
              {filteredWorking.length === 0 ? (
                <EmptyState icon={<AlertTriangle />} title="No working memory" description="Working memory holds session-scratchpad entries until TTL expiry." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filteredWorking.map(w => (
                    <div key={w.id} style={{ border: '1px solid #F0F0F0', borderRadius: 12, padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <Flex align="center" gap={2} wrap>
                          <Badge variant="outline"><Clock size={12} style={{ marginRight: 4 }} />Working</Badge>
                          {w.conversationId && <Badge variant="outline">convo: {w.conversationId.slice(-6)}</Badge>}
                          {w.expiresAt && <Badge variant="outline">expires {fmtTime(w.expiresAt)}</Badge>}
                        </Flex>
                        <div style={{ fontWeight: 600, color: '#1F1F1F', marginTop: 6, fontFamily: 'monospace', fontSize: 13 }}>{w.key}</div>
                        <div style={{ color: '#404040', fontSize: 13 }}>{w.value}</div>
                        <div style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>touched {fmtTime(w.touchedAt)}</div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => deleteWorking(w.id)}><Trash2 size={14} /></Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="episodic">
              {filteredEpisodic.length === 0 ? (
                <EmptyState icon={<Filter />} title="No episodes match" description="Episodic memory stores narrative events (conversations, decisions, milestones)." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filteredEpisodic.map(e => (
                    <div key={e.id} style={{ border: '1px solid #F0F0F0', borderRadius: 12, padding: 14 }}>
                      <Flex align="center" gap={2} wrap>
                        <Badge variant="outline" className="bg-[rgba(99,102,241,0.06)] text-[#6366F1]"><FileText size={12} style={{ marginRight: 4 }} />Episode</Badge>
                        <span style={{ fontWeight: 600, color: '#1F1F1F' }}>{e.title}</span>
                        {e.tags.map(t => <Badge key={t} variant="outline">#{t}</Badge>)}
                      </Flex>
                      <div style={{ color: '#404040', fontSize: 13, marginTop: 6 }}>{e.summary}</div>
                      <Flex align="center" gap={3} style={{ marginTop: 8, color: '#9CA3AF', fontSize: 12 }}>
                        <span>🕓 {fmtTime(e.happenedAt)}</span>
                        <span>👥 {e.participants.join(', ') || '—'}</span>
                        {e.source && <span>source: {e.source}</span>}
                      </Flex>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="semantic">
              {filteredSemantic.length === 0 ? (
                <EmptyState icon={<Brain />} title="No semantic facts" description="Semantic memory stores long-term structured beliefs about the user." />
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{ color: '#6B7280', textAlign: 'left', borderBottom: '1px solid #F0F0F0' }}>
                        <th style={{ padding: 10, fontWeight: 600 }}>Domain</th>
                        <th style={{ padding: 10, fontWeight: 600 }}>Key</th>
                        <th style={{ padding: 10, fontWeight: 600 }}>Value</th>
                        <th style={{ padding: 10, fontWeight: 600 }}>Confidence</th>
                        <th style={{ padding: 10, fontWeight: 600 }}>Source</th>
                        <th style={{ padding: 10, fontWeight: 600 }}>Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSemantic.map(sf => (
                        <tr key={sf.id} style={{ borderBottom: '1px solid #F7F7F7' }}>
                          <td style={{ padding: 12 }}>
                            <Badge variant="outline" className={sf.isExplicit ? 'bg-[rgba(26,125,66,0.06)] text-[#1A7D42]' : ''}>
                              {sf.domain}{sf.isExplicit && ' · explicit'}
                            </Badge>
                          </td>
                          <td style={{ padding: 12, fontFamily: 'monospace', color: '#1F1F1F' }}>{sf.key}</td>
                          <td style={{ padding: 12, color: '#404040' }}>
                            {typeof sf.value === 'string' ? sf.value : JSON.stringify(sf.value)}
                          </td>
                          <td style={{ padding: 12 }}>{renderConfidence(sf.confidence)}</td>
                          <td style={{ padding: 12, color: '#6B7280', fontSize: 13 }}>{sf.source}</td>
                          <td style={{ padding: 12, color: '#6B7280', fontSize: 13 }}>{fmtTime(sf.updatedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="snapshot">
              {(() => {
                const snap = Mem.assembleMemorySnapshot(userId);
                const ctx = Mem.assemblePromptContext(snap);
                return (
                  <div>
                    <Flex justify="between" align="center" style={{ marginBottom: 12 }}>
                      <Paragraph muted mb={0}>Generated snapshot @ {fmtTime(snap.generatedAt)} — used by N3 context assembly</Paragraph>
                      <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText(ctx)}>Copy prompt context</Button>
                    </Flex>
                    <pre style={{
                      margin: 0,
                      padding: 16,
                      background: '#FAFAFA',
                      borderRadius: 10,
                      border: '1px solid #F0F0F0',
                      fontSize: 12,
                      color: '#404040',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      maxHeight: 420,
                      overflow: 'auto',
                    }}>{ctx || '(memory snapshot is empty)'}</pre>
                    <Flex justify="end" style={{ marginTop: 12 }}>
                      <Badge variant="outline">{snap.working.length} working</Badge>
                      <Badge variant="outline">{snap.episodic.length} episodic</Badge>
                      <Badge variant="outline">{snap.semantic.length} semantic</Badge>
                    </Flex>
                  </div>
                );
              })()}
            </TabsContent>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}

function Stack({ gap = 4, children, className, style }: { gap?: number; children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const SP: Record<number, number> = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32 };
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: SP[gap] ?? gap, ...style }}>
      {children}
    </div>
  );
}

function Grid({ columns = 3, gap = 4, children, className }: { columns?: number; gap?: number; children: React.ReactNode; className?: string }) {
  const SP: Record<number, number> = { 2: 8, 3: 12, 4: 16, 6: 24 };
  return (
    <div className={className} style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: SP[gap] ?? gap }}>
      {children}
    </div>
  );
}

export default NexusMemoryPage;
