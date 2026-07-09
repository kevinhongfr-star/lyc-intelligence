/**
 * CandidateCommunityPage — Candidate Portal community forum
 * Renders inside AppShell → Outlet. Shows forum categories and a list of threads.
 */
import React, { useState } from 'react';
import { Search, MessageSquare, Users, Clock, Pin, ArrowRight, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Input, Button } from '@/components/ui';

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  threadCount: number;
  icon: string;
}

interface ForumThread {
  id: string;
  title: string;
  author: string;
  category: string;
  replies: number;
  views: number;
  lastActivity: string;
  pinned: boolean;
  excerpt: string;
}

// Community forum is content-driven (curated threads); no backing table yet.
// A forum/threads table can be wired in a future ticket.
const STATIC_CATEGORIES: ForumCategory[] = [
  { id: 'cat1', name: 'Career Strategy', description: 'Long-term planning, pivots, and growth paths', threadCount: 142, icon: '🎯' },
  { id: 'cat2', name: 'Interview Tips', description: 'Prep, frameworks, and shared experiences', threadCount: 98, icon: '🎤' },
  { id: 'cat3', name: 'Compensation', description: 'Offers, negotiation, and benchmarks', threadCount: 76, icon: '💰' },
  { id: 'cat4', name: 'Leadership', description: 'Executive presence and team leadership', threadCount: 64, icon: '🧭' },
  { id: 'cat5', name: 'Industry Trends', description: 'Market signals and sector movements', threadCount: 53, icon: '📈' },
  { id: 'cat6', name: 'Community', description: 'Introductions, events, and peer support', threadCount: 41, icon: '🤝' },
];

const STATIC_THREADS: ForumThread[] = [
  { id: 't1', title: 'How to frame a 6-month career gap in executive interviews', author: 'Sarah C.', category: 'Interview Tips', replies: 24, views: 412, lastActivity: '2h ago', pinned: true, excerpt: "After a sabbatical, I'm re-entering the market and wondering how senior leaders frame a gap without underselling..." },
  { id: 't2', title: 'VP Engineering comp benchmarks — Series B fintech, SF', author: 'Michael W.', category: 'Compensation', replies: 18, views: 287, lastActivity: '5h ago', pinned: false, excerpt: 'Got an offer at $380K base + 0.4% equity. Curious how this compares to recent Series B benchmarks...' },
  { id: 't3', title: 'Cross-border move: HK → Singapore, what I learned', author: 'Jia L.', category: 'Career Strategy', replies: 31, views: 540, lastActivity: '1d ago', pinned: false, excerpt: 'Sharing my relocation playbook and the negotiation levers that mattered most for an APAC move...' },
  { id: 't4', title: 'Building executive presence as an introverted CTO', author: 'David K.', category: 'Leadership', replies: 12, views: 198, lastActivity: '1d ago', pinned: false, excerpt: "Presence isn't about the loudest voice. Here are the rituals that helped me lead authentically..." },
  { id: 't5', title: 'APAC fintech hiring signals — Q1 2025 outlook', author: 'Priya R.', category: 'Industry Trends', replies: 9, views: 156, lastActivity: '2d ago', pinned: false, excerpt: 'Consolidating demand signals from public filings and search firm reports for the region...' },
  { id: 't6', title: 'Introduce yourself — January 2025 cohort', author: 'Community Team', category: 'Community', replies: 47, views: 803, lastActivity: '3d ago', pinned: false, excerpt: "Welcome new members! Share your background, what you're exploring, and how the community can help..." },
];

export function CandidateCommunityPage() {
  const [categories] = useState<ForumCategory[]>(STATIC_CATEGORIES);
  const [threads] = useState<ForumThread[]>(STATIC_THREADS);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredThreads = threads.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Pinned first, then by last activity recency (stable sort on existing order)
  const sortedThreads = [...filteredThreads].sort((a, b) => Number(b.pinned) - Number(a.pinned));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif font-bold text-2xl text-text-primary">Community</h1>
          <p className="text-text-secondary text-sm mt-1">Connect with peers, share insights, and grow together.</p>
        </div>
        <Button size="sm">
          <Plus className="w-3 h-3" /> New Thread
        </Button>
      </div>

      {/* Categories */}
      <div>
        <div className="text-sm font-medium text-text-secondary mb-3">Categories</div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <button
              onClick={() => setActiveCategory('all')}
              className={`text-left p-4 border transition-colors ${activeCategory === 'all' ? 'border-fuchsia bg-fuchsia-light' : 'border-border bg-white hover:border-fuchsia'}`}
              style={{ borderRadius: 0 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🌟</span>
                <span className="font-medium text-text-primary text-sm">All Categories</span>
              </div>
              <div className="text-xs text-text-muted">{threads.length} threads</div>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)}
                className={`text-left p-4 border transition-colors ${activeCategory === cat.name ? 'border-fuchsia bg-fuchsia-light' : 'border-border bg-white hover:border-fuchsia'}`}
                style={{ borderRadius: 0 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{cat.icon}</span>
                  <span className="font-medium text-text-primary text-sm">{cat.name}</span>
                </div>
                <div className="text-xs text-text-muted">{cat.threadCount} threads</div>
              </button>
            ))}
          </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <Input
          placeholder="Search threads..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Thread list */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Threads</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedThreads.length === 0 ? (
            <div className="py-8 text-center text-text-muted text-sm">No threads found.</div>
          ) : (
            <div className="space-y-1">
              {sortedThreads.map((thread) => (
                <div
                  key={thread.id}
                  className="flex items-start gap-3 py-3 border-b border-border last:border-b-0 hover:bg-bg-warm transition-colors -mx-4 px-4 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-fuchsia" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {thread.pinned && <Pin className="w-3 h-3 text-fuchsia flex-shrink-0" />}
                      <span className="font-medium text-text-primary text-sm">{thread.title}</span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1 line-clamp-1">{thread.excerpt}</p>
                    <div className="flex items-center gap-4 text-xs text-text-muted mt-2 flex-wrap">
                      <span>by {thread.author}</span>
                      <span className="px-1.5 py-0.5 rounded bg-fuchsia-light text-fuchsia">{thread.category}</span>
                      <span className="inline-flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {thread.replies}</span>
                      <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" /> {thread.views}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {thread.lastActivity}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-muted flex-shrink-0 mt-1" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CandidateCommunityPage;
