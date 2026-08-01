/**
 * RagLibraryPage.tsx — Issue #42
 * RAG (Retrieval Augmented Generation) content library for Nexus.
 * Curates searchable knowledge chunks that Nexus grounds its answers on.
 */
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  Library,
  Upload,
  Search,
  FileText,
  Tag,
  TrendingUp,
  Trash2,
  RefreshCw,
  Database,
} from 'lucide-react';

interface RagChunk {
  id: string;
  title: string;
  source: string;
  category: 'methodology' | 'playbook' | 'spec' | 'market-data' | 'case-study';
  content: string;
  embeddingModel: string;
  tokens: number;
  lastIndexed: string;
  retrievalCount: number;
  tags: string[];
}

const SEED_CHUNKS: RagChunk[] = [
  {
    id: 'rag-1',
    title: 'TRIDENT Match Scoring Methodology',
    source: 'docs/METHODOLOGY.md',
    category: 'methodology',
    content: 'TRIDENT scores candidates across 5 dimensions: Technical Fit, Leadership Capacity, Cultural Alignment, Trajectory, and Risk Profile. Each dimension weighted...',
    embeddingModel: 'text-embedding-3-large',
    tokens: 412,
    lastIndexed: '2026-07-18T10:00:00Z',
    retrievalCount: 248,
    tags: ['trident', 'scoring', 'match'],
  },
  {
    id: 'rag-2',
    title: 'APAC Executive Compensation Benchmarks 2026',
    source: 'docs/comp_benchmarks_2026.csv',
    category: 'market-data',
    content: 'Median CTO compensation in Singapore S$420K base + 30% bonus. HK CTO median HK$3.8M. Tokyo CTO median ¥45M...',
    embeddingModel: 'text-embedding-3-large',
    tokens: 1840,
    lastIndexed: '2026-07-19T08:00:00Z',
    retrievalCount: 132,
    tags: ['compensation', 'apac', 'benchmark'],
  },
  {
    id: 'rag-3',
    title: 'SHIFT Composite Scoring Spec',
    source: 'specs/v2/09_SHIFT_Composite_Data_Model_Spec.md',
    category: 'spec',
    content: 'SHIFT combines LENS, DRIVE, LEAP, QUEST, COACH, IMPACT instruments into a weighted composite. Weights derive from role family...',
    embeddingModel: 'text-embedding-3-large',
    tokens: 920,
    lastIndexed: '2026-07-15T12:00:00Z',
    retrievalCount: 87,
    tags: ['shift', 'assessment', 'composite'],
  },
  {
    id: 'rag-4',
    title: 'Candidate Outreach Playbook — Cold',
    source: 'docs/playbooks/outreach_cold.md',
    category: 'playbook',
    content: 'Cold outreach sequence: Day 0 personalized email, Day 3 LinkedIn connect, Day 7 follow-up with value add, Day 14 break-up email. Subject lines 4-8 words...',
    embeddingModel: 'text-embedding-3-large',
    tokens: 654,
    lastIndexed: '2026-07-20T09:00:00Z',
    retrievalCount: 312,
    tags: ['outreach', 'cold', 'sequence'],
  },
  {
    id: 'rag-5',
    title: 'Case Study: FinTech CEO Placement (SG)',
    source: 'docs/case_studies/fintech_ceo_sg.md',
    category: 'case-study',
    content: 'Placed CEO for Series B fintech in 47 days. Used TRIDENT + culture fit analysis. Candidate pool 84, shortlist 6, offers 2, accepted 1...',
    embeddingModel: 'text-embedding-3-large',
    tokens: 1100,
    lastIndexed: '2026-07-10T14:00:00Z',
    retrievalCount: 56,
    tags: ['case-study', 'fintech', 'ceo'],
  },
];

const categoryConfig: Record<string, { color: string; bg: string }> = {
  methodology: { color: 'text-purple-600', bg: 'bg-purple-50' },
  playbook: { color: 'text-blue-600', bg: 'bg-blue-50' },
  spec: { color: 'text-indigo-600', bg: 'bg-indigo-50' },
  'market-data': { color: 'text-emerald-600', bg: 'bg-emerald-50' },
  'case-study': { color: 'text-amber-600', bg: 'bg-amber-50' },
};

export function RagLibraryPage() {
  const [chunks, setChunks] = useState<RagChunk[]>(SEED_CHUNKS);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [reindexing, setReindexing] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return chunks.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.content.toLowerCase().includes(search.toLowerCase()) ||
        c.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchesCat = filterCat === 'all' || c.category === filterCat;
      return matchesSearch && matchesCat;
    });
  }, [chunks, search, filterCat]);

  async function reindex(id: string) {
    setReindexing(id);
    await new Promise((r) => setTimeout(r, 1200));
    setChunks((prev) =>
      prev.map((c) => (c.id === id ? { ...c, lastIndexed: new Date().toISOString() } : c)),
    );
    setReindexing(null);
  }

  const totalTokens = chunks.reduce((s, c) => s + c.tokens, 0);
  const totalRetrievals = chunks.reduce((s, c) => s + c.retrievalCount, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Library className="w-6 h-6 text-indigo-600" />
            RAG Library
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Knowledge chunks grounding Nexus answers (retrieval-augmented generation)
          </p>
        </div>
        <Button className="gap-2">
          <Upload className="w-4 h-4" />
          Upload Source
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{chunks.length}</div>
          <div className="text-xs text-gray-500">Indexed Chunks</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-indigo-600">{(totalTokens / 1000).toFixed(1)}K</div>
          <div className="text-xs text-gray-500">Total Tokens</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-emerald-600">{totalRetrievals}</div>
          <div className="text-xs text-gray-500">Retrievals (30d)</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{new Set(chunks.flatMap((c) => c.tags)).size}</div>
          <div className="text-xs text-gray-500">Unique Tags</div>
        </Card>
      </div>

      <Card className="p-3">
        <div className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search chunks by title, content, or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-md bg-white"
          >
            <option value="all">All Categories</option>
            <option value="methodology">Methodology</option>
            <option value="playbook">Playbook</option>
            <option value="spec">Spec</option>
            <option value="market-data">Market Data</option>
            <option value="case-study">Case Study</option>
          </select>
        </div>
      </Card>

      <div className="space-y-3">
        {filtered.map((c) => {
          const cat = categoryConfig[c.category];
          return (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-gray-900 truncate">{c.title}</span>
                    <Badge className={`text-[10px] border-0 ${cat.bg} ${cat.color}`}>{c.category}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{c.content}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      {c.source}
                    </span>
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {c.tags.join(', ')}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {c.retrievalCount} retrievals
                    </span>
                    <span>{c.tokens} tokens</span>
                    <span>· indexed {new Date(c.lastIndexed).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => reindex(c.id)}
                    disabled={reindexing === c.id}
                    className="gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${reindexing === c.id ? 'animate-spin' : ''}`} />
                    {reindexing === c.id ? 'Indexing...' : 'Reindex'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setChunks((prev) => prev.filter((x) => x.id !== c.id))}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card className="p-8 text-center text-gray-500">No chunks match your search.</Card>
        )}
      </div>
    </div>
  );
}
