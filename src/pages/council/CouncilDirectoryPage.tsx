import React, { useState, useMemo } from 'react';
import {
  Crown,
  Coins,
  Search,
  MapPin,
  MessageSquare,
  Users,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

/**
 * Council Member Directory (M5) — auth required.
 *
 * Searchable, tier-filterable directory of Council members with a
 * direct-message action on each card.
 *
 * Brand rules:
 *  - NEVER use "free" — use "Executive Introduction" or "Complimentary"
 *  - Sharp corners only — no rounded-* classes
 *  - Chatham House rules apply to any information exchanged here.
 */

type Tier = 'Founding' | 'Individual' | 'Corporate' | 'PE Partner';

interface Member {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  tier: Tier;
  initials: string;
}

const MEMBERS: Member[] = [
  { id: 'm1', name: 'David Park', title: 'CFO', company: 'Series D Startup', location: 'Singapore', tier: 'Individual', initials: 'DP' },
  { id: 'm2', name: 'Mei Lin', title: 'VP Strategy', company: 'Fortune 500 Tech', location: 'Shanghai', tier: 'Corporate', initials: 'ML' },
  { id: 'm3', name: 'Wei Zhang', title: 'Partner', company: 'Growth Equity Firm', location: 'Hong Kong', tier: 'PE Partner', initials: 'WZ' },
  { id: 'm4', name: 'Sarah Chen', title: 'VP Strategy', company: 'Fortune 500 Tech', location: 'Shanghai', tier: 'Founding', initials: 'SC' },
  { id: 'm5', name: 'James Liu', title: 'COO', company: 'Scale-up Logistics', location: 'Beijing', tier: 'Founding', initials: 'JL' },
  { id: 'm6', name: 'Anita Rao', title: 'CHRO', company: 'Global Consumer Goods', location: 'Mumbai', tier: 'Corporate', initials: 'AR' },
  { id: 'm7', name: 'Tom Becker', title: 'Managing Director', company: 'Boutique Advisory', location: 'London', tier: 'Individual', initials: 'TB' },
  { id: 'm8', name: 'Yuki Tanaka', title: 'VP Engineering', company: 'Public SaaS Co.', location: 'Tokyo', tier: 'Individual', initials: 'YT' },
  { id: 'm9', name: 'Carlos Mendez', title: 'Partner', company: 'Late-stage VC', location: 'São Paulo', tier: 'PE Partner', initials: 'CM' },
  { id: 'm10', name: 'Priya Nair', title: 'GM', company: 'APAC Region, Fintech', location: 'Singapore', tier: 'Founding', initials: 'PN' },
  { id: 'm11', name: 'Marcus Wei', title: 'Senior Coach', company: 'LYC Intelligence', location: 'Shanghai', tier: 'Founding', initials: 'MW' },
  { id: 'm12', name: 'Elena Rodriguez', title: 'Senior Coach', company: 'LYC Intelligence', location: 'Remote', tier: 'Founding', initials: 'ER' },
];

const TIER_FILTERS: (Tier | 'All')[] = ['All', 'Founding', 'Individual', 'Corporate', 'PE Partner'];

const TIER_BADGE_CLS: Record<Tier, string> = {
  Founding: 'bg-[rgba(193,8,171,0.08)] text-[#C108AB]',
  Individual: 'bg-[#F7F7F7] text-[#525252]',
  Corporate: 'bg-[rgba(26,125,66,0.08)] text-[#1A7D42]',
  'PE Partner': 'bg-[rgba(184,134,11,0.08)] text-[#B8860B]',
};

export function CouncilDirectoryPage() {
  const [query, setQuery] = useState('');
  const [activeTier, setActiveTier] = useState<Tier | 'All'>('All');
  const [messagingId, setMessagingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MEMBERS.filter((m) => {
      const matchesTier = activeTier === 'All' || m.tier === activeTier;
      const matchesQuery =
        q === '' ||
        m.name.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q) ||
        m.company.toLowerCase().includes(q) ||
        m.location.toLowerCase().includes(q);
      return matchesTier && matchesQuery;
    });
  }, [query, activeTier]);

  const handleMessage = (member: Member) => {
    setMessagingId(member.id);
    setTimeout(() => setMessagingId(null), 800);
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
            <a href="/council/community" className="text-sm text-[#525252] hover:text-[#C108AB] transition-colors no-underline">Community</a>
            <a href="/council/directory" className="text-sm font-medium text-[#C108AB] no-underline">Directory</a>
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
        <div className="max-w-6xl mx-auto px-6 py-10 md:py-12">
          <div className="text-xs font-bold uppercase tracking-[2.5px] text-[#C108AB] mb-3">
            Member Directory
          </div>
          <h1
            className="text-2xl md:text-4xl font-bold tracking-tight text-[#1C1C1C]"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            Connect with senior peers
          </h1>
          <p className="text-sm text-[#525252] mt-2 max-w-xl leading-relaxed">
            A curated directory of Council members. Search by name, title, company, or location. Direct messages follow Chatham House rules.
          </p>

          {/* Search bar */}
          <div className="mt-6 relative max-w-xl">
            <Search className="w-4 h-4 text-[#A3A3A3] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search members by name, title, company, or city…"
              className="pl-11"
              aria-label="Search members"
            />
          </div>

          {/* Result count + tier filter */}
          <div className="mt-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-[#525252]">
              <Users className="w-3.5 h-3.5 text-[#A3A3A3]" />
              <span className="font-semibold text-[#1C1C1C]">{filtered.length}</span>
              {filtered.length === 1 ? 'member' : 'members'}
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {TIER_FILTERS.map((tier) => {
                const active = activeTier === tier;
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setActiveTier(tier)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors border ${
                      active
                        ? 'bg-[#C108AB] text-white border-[#C108AB]'
                        : 'bg-white text-[#525252] border-[#E5E5E5] hover:border-[#C108AB]/40 hover:text-[#1C1C1C]'
                    }`}
                    aria-pressed={active}
                  >
                    {tier}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Member grid */}
      <section className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {filtered.length === 0 ? (
            <Card className="border border-[#E5E5E5] bg-white p-12 !shadow-none text-center">
              <Search className="w-6 h-6 text-[#A3A3A3] mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#1C1C1C]">No members match your search</p>
              <p className="text-xs text-[#525252] mt-1">Try a different name, title, or clear your filters.</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setQuery('');
                  setActiveTier('All');
                }}
              >
                Clear filters
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((m) => (
                <Card key={m.id} className="border border-[#E5E5E5] bg-white p-5 !shadow-none hover:border-[#C108AB]/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-[#C108AB] flex items-center justify-center flex-shrink-0">
                      <span
                        className="text-sm font-bold text-white"
                        style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                      >
                        {m.initials}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-[#1C1C1C] truncate">{m.name}</h3>
                      </div>
                      <div className="text-xs text-[#525252] mt-0.5 flex items-center gap-1.5">
                        <Briefcase className="w-3 h-3 text-[#A3A3A3] flex-shrink-0" />
                        <span className="truncate">{m.title}, {m.company}</span>
                      </div>
                      <div className="text-[11px] text-[#A3A3A3] mt-1 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {m.location}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#F0F0F0] flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TIER_BADGE_CLS[m.tier]}`}>
                      {m.tier === 'Founding' && <Crown className="w-3 h-3" />}
                      {m.tier}
                    </span>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => handleMessage(m)}
                      disabled={messagingId === m.id}
                      aria-busy={messagingId === m.id}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      {messagingId === m.id ? 'Opening…' : 'Message'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d0a14] text-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm font-bold" style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}>
            The Council — Directory
          </div>
          <nav className="flex gap-6 text-xs text-white/60">
            <a href="/council/dashboard" className="hover:text-white transition-colors no-underline">Dashboard</a>
            <a href="/council/community" className="hover:text-white transition-colors no-underline">Community</a>
            <a href="/council/benefits" className="hover:text-white transition-colors no-underline">Benefits</a>
          </nav>
          <div className="text-[11px] text-white/40">© 2026 LYC Partners</div>
        </div>
      </footer>
    </div>
  );
}
