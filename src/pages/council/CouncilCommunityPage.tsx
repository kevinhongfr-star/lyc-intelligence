import React, { useState, useMemo } from 'react';
import {
  Crown,
  Coins,
  ShieldCheck,
  Heart,
  MessageCircle,
  Send,
  Megaphone,
  MessageSquare,
  Pin,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

/**
 * Council Community Feed (M4) — auth required.
 *
 * Member-only community feed with post composer, filter tabs, and a
 * Chatham House rules banner.
 *
 * Brand rules:
 *  - NEVER use "free" — use "Executive Introduction" or "Complimentary"
 *  - Sharp corners only — no rounded-* classes
 *  - Chatham House rules: information may be used, but neither the identity
 *    nor the affiliation of the speaker(s) may be revealed.
 */

type PostCategory = 'Discussion' | 'Announcement';

interface Post {
  id: string;
  author: string;
  authorInitials: string;
  authorTitle: string;
  tier: 'Founding' | 'Individual' | 'Corporate' | 'PE Partner';
  content: string;
  timestamp: string;
  category: PostCategory;
  pinned?: boolean;
  likes: number;
  comments: number;
  liked?: boolean;
}

type FilterTab = 'All' | 'Discussions' | 'Announcements';

const INITIAL_POSTS: Post[] = [
  {
    id: 'p1',
    author: 'Council Team',
    authorInitials: 'CT',
    authorTitle: 'LYC Intelligence',
    tier: 'Founding',
    content:
      'The July intelligence report "APAC Leadership Mobility" is now live in your Benefits hub. Members can download the full PDF and the one-page executive summary. We will host a live briefing on August 12 — RSVP from your dashboard.',
    timestamp: '3 hours ago',
    category: 'Announcement',
    pinned: true,
    likes: 14,
    comments: 3,
  },
  {
    id: 'p2',
    author: 'David Park',
    authorInitials: 'DP',
    authorTitle: 'CFO, Series D Startup',
    tier: 'Individual',
    content:
      'Question for the group: how are you thinking about founder equity refresh grants at the VP level? We are revising our plan and would value perspectives from anyone who has done this in the past 12 months. Happy to share what we land on.',
    timestamp: 'Yesterday',
    category: 'Discussion',
    likes: 9,
    comments: 7,
  },
  {
    id: 'p3',
    author: 'Mei Lin',
    authorInitials: 'ML',
    authorTitle: 'VP Strategy, Fortune 500 Tech',
    tier: 'Corporate',
    content:
      'Just wrapped a coaching session with Elena on board communication. The single most useful frame: lead with the decision you need, then the two options, then your recommendation. Board attention is scarcer than board time.',
    timestamp: '2 days ago',
    category: 'Discussion',
    likes: 22,
    comments: 5,
  },
  {
    id: 'p4',
    author: 'Council Team',
    authorInitials: 'CT',
    authorTitle: 'LYC Intelligence',
    tier: 'Founding',
    content:
      'Reminder: the CFO Roundtable on July 18 has 6 seats remaining. Founding and PE Partner members receive priority booking. Reserve your seat from the event page — 1 Council Credit.',
    timestamp: '3 days ago',
    category: 'Announcement',
    likes: 6,
    comments: 1,
  },
  {
    id: 'p5',
    author: 'Wei Zhang',
    authorInitials: 'WZ',
    authorTitle: 'Partner, Growth Equity Firm',
    tier: 'PE Partner',
    content:
      'Sharing a pattern I am seeing in the market: growth-stage boards are increasingly asking CFOs to own the capital plan narrative end-to-end, not just the model. Worth pressure-testing how you present yours before your next board cycle.',
    timestamp: '5 days ago',
    category: 'Discussion',
    likes: 31,
    comments: 9,
  },
];

const TIER_BADGE_CLS: Record<Post['tier'], string> = {
  Founding: 'bg-[rgba(193,8,171,0.08)] text-[#C108AB]',
  Individual: 'bg-[#F7F7F7] text-[#525252]',
  Corporate: 'bg-[rgba(26,125,66,0.08)] text-[#1A7D42]',
  'PE Partner': 'bg-[rgba(184,134,11,0.08)] text-[#B8860B]',
};

const FILTER_TABS: { id: FilterTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'All', label: 'All', icon: MessageSquare },
  { id: 'Discussions', label: 'Discussions', icon: MessageCircle },
  { id: 'Announcements', label: 'Announcements', icon: Megaphone },
];

export function CouncilCommunityPage() {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('All');

  const filteredPosts = useMemo(() => {
    const sorted = [...posts].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
    if (activeTab === 'All') return sorted;
    if (activeTab === 'Discussions') return sorted.filter((p) => p.category === 'Discussion');
    return sorted.filter((p) => p.category === 'Announcement');
  }, [posts, activeTab]);

  const handlePost = () => {
    const text = draft.trim();
    if (!text) return;
    setPosting(true);
    setTimeout(() => {
      const newPost: Post = {
        id: `p${Date.now()}`,
        author: 'Sarah Chen',
        authorInitials: 'SC',
        authorTitle: 'VP Strategy, Fortune 500 Tech',
        tier: 'Founding',
        content: text,
        timestamp: 'Just now',
        category: 'Discussion',
        likes: 0,
        comments: 0,
      };
      setPosts((prev) => [newPost, ...prev]);
      setDraft('');
      setPosting(false);
    }, 500);
  };

  const handleLike = (id: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  };

  return (
    <div
      className="min-h-screen bg-[#F7F7F7] text-[#1C1C1C]"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* Member nav */}
      <nav className="bg-white border-b border-[#E5E5E5] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a
            href="/council/dashboard"
            className="font-bold text-base tracking-tight text-[#1C1C1C] no-underline"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            The Council
          </a>
          <div className="hidden md:flex items-center gap-6">
            <a href="/council/dashboard" className="text-sm text-[#525252] hover:text-[#C108AB] transition-colors no-underline">Dashboard</a>
            <a href="/council/coaching" className="text-sm text-[#525252] hover:text-[#C108AB] transition-colors no-underline">Coaching</a>
            <a href="/council/community" className="text-sm font-medium text-[#C108AB] no-underline">Community</a>
            <a href="/council/directory" className="text-sm text-[#525252] hover:text-[#C108AB] transition-colors no-underline">Directory</a>
            <a href="/council/benefits" className="text-sm text-[#525252] hover:text-[#C108AB] transition-colors no-underline">Benefits</a>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[rgba(193,8,171,0.08)] text-[#C108AB] text-xs font-semibold">
              <Coins className="w-3.5 h-3.5" />
              9 credits
            </div>
            <Button size="sm" variant="outline" onClick={() => (window.location.href = '/council/profile')}>
              <Crown className="w-3.5 h-3.5" />
              Sarah
            </Button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-3xl mx-auto px-6 py-10 md:py-12 text-center">
          <div className="text-xs font-bold uppercase tracking-[2.5px] text-[#C108AB] mb-3">
            Community
          </div>
          <h1
            className="text-2xl md:text-4xl font-bold tracking-tight text-[#1C1C1C]"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            The Council feed
          </h1>
          <p className="text-sm text-[#525252] mt-2 max-w-xl mx-auto leading-relaxed">
            Insight and peer discussion from senior leaders. Share what you are learning — and learn from people who operate at your altitude.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Chatham House rules banner */}
        <div className="bg-[rgba(193,8,171,0.06)] border border-[rgba(193,8,171,0.20)] p-4 mb-6 flex items-start gap-3">
          <div className="w-8 h-8 bg-[#C108AB] flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#1C1C1C] flex items-center gap-2">
              Chatham House Rules
              <Badge variant="fuchsia">Active</Badge>
            </div>
            <p className="text-xs text-[#525252] leading-relaxed mt-1">
              Information shared here may be used, but neither the identity nor the affiliation of any
              speaker may be revealed. Keep the feed candid, respectful, and confidential.
            </p>
          </div>
        </div>

        {/* Post composer */}
        <Card className="border border-[#E5E5E5] bg-white p-5 mb-6 !shadow-none">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-[#C108AB] flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white" style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                SC
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Share an insight with the Council…"
                rows={3}
                className="w-full px-4 py-2.5 bg-[#FFFFFF] border border-[#E5E5E5] text-sm text-[#1C1C1C] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#C108AB]/40 focus:shadow-[0_0_0_3px_rgba(193,8,171,0.06)] transition-all duration-200 resize-none"
              />
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1.5 text-[11px] text-[#A3A3A3]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Posted under Chatham House rules
                </div>
                <Button
                  size="sm"
                  onClick={handlePost}
                  disabled={!draft.trim() || posting}
                  aria-busy={posting}
                >
                  {posting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Posting…
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Post
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-[#E5E5E5]">
          {FILTER_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors -mb-px border-b-2 ${
                  active
                    ? 'border-[#C108AB] text-[#C108AB]'
                    : 'border-transparent text-[#525252] hover:text-[#1C1C1C]'
                }`}
                aria-pressed={active}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Feed */}
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <Card className="border border-[#E5E5E5] bg-white p-8 !shadow-none text-center">
              <MessageSquare className="w-6 h-6 text-[#A3A3A3] mx-auto mb-2" />
              <p className="text-sm text-[#525252]">No posts in this category yet.</p>
            </Card>
          ) : (
            filteredPosts.map((post) => (
              <Card key={post.id} className="border border-[#E5E5E5] bg-white p-5 !shadow-none">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-[#1C1C1C] flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white" style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                      {post.authorInitials}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[#1C1C1C]">{post.author}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TIER_BADGE_CLS[post.tier]}`}>
                        {post.tier}
                      </span>
                      {post.pinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#B8860B] bg-[rgba(184,134,11,0.08)] px-2 py-0.5">
                          <Pin className="w-3 h-3" />
                          Pinned
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#A3A3A3] mt-0.5">
                      {post.authorTitle} · {post.timestamp}
                    </div>
                    <p className="text-sm text-[#1C1C1C] leading-relaxed mt-3 whitespace-pre-wrap">{post.content}</p>

                    <div className="flex items-center gap-5 mt-4 pt-3 border-t border-[#F0F0F0]">
                      <button
                        type="button"
                        onClick={() => handleLike(post.id)}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
                          post.liked ? 'text-[#C108AB]' : 'text-[#525252] hover:text-[#C108AB]'
                        }`}
                        aria-pressed={post.liked}
                      >
                        <Heart className={`w-3.5 h-3.5 ${post.liked ? 'fill-[#C108AB]' : ''}`} />
                        {post.likes}
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#525252] hover:text-[#C108AB] transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        {post.comments}
                      </button>
                      {post.category === 'Announcement' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[#C108AB] bg-[rgba(193,8,171,0.08)] px-2 py-0.5 ml-auto">
                          <Megaphone className="w-3 h-3" />
                          Announcement
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0d0a14] text-white mt-8">
        <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm font-bold" style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}>
            The Council — Community
          </div>
          <nav className="flex gap-6 text-xs text-white/60">
            <a href="/council/dashboard" className="hover:text-white transition-colors no-underline">Dashboard</a>
            <a href="/council/directory" className="hover:text-white transition-colors no-underline">Directory</a>
            <a href="/council/benefits" className="hover:text-white transition-colors no-underline">Benefits</a>
          </nav>
          <div className="text-[11px] text-white/40">© 2026 LYC Partners</div>
        </div>
      </footer>
    </div>
  );
}
