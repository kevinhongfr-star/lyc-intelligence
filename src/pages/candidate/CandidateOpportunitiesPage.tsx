/**
 * CandidateOpportunitiesPage — Candidate Portal opportunities marketplace
 * Renders inside AppShell → Outlet. Shows matched opportunities,
 * recommended roles, and application tracking.
 */
import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, DollarSign, Star, Filter, TrendingUp, ArrowRight, Bookmark, Send, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input, EmptyState } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';
import { getOpenMandates } from '@/services/supabaseApi';

interface Opportunity {
  id: string;
  company: string;
  role: string;
  location: string;
  remote: boolean;
  salaryMin: number;
  salaryMax: number;
  matchScore: number;
  tier: 'S' | 'A' | 'B' | 'C';
  industry: string;
  posted: string;
  saved: boolean;
}

// Parse a compensation_range string (e.g. "$280K - $340K" or "280000-340000") into min/max in $K
function parseCompRange(raw: any): { min: number; max: number; label: string } {
  if (raw == null || raw === '') return { min: 0, max: 0, label: '—' };
  const str = String(raw);
  const nums = str.match(/[\d,.]+/g)?.map((s) => parseFloat(s.replace(/,/g, ''))) ?? [];
  if (nums.length >= 2) {
    // Normalize: if values >= 1000 assume raw dollars; convert to $K
    const min = nums[0] >= 1000 ? Math.round(nums[0] / 1000) : Math.round(nums[0]);
    const max = nums[1] >= 1000 ? Math.round(nums[1] / 1000) : Math.round(nums[1]);
    return { min, max, label: `$${min}K - $${max}K` };
  }
  if (nums.length === 1) {
    const v = nums[0] >= 1000 ? Math.round(nums[0] / 1000) : Math.round(nums[0]);
    return { min: v, max: v, label: `$${v}K` };
  }
  return { min: 0, max: 0, label: str };
}

function mapMandate(m: any): Opportunity {
  const company = (m as any).company ?? null;
  const comp = parseCompRange((m as any).compensation_range);
  return {
    id: (m as any).id ?? '',
    company: company?.name ?? '—',
    role: (m as any).title ?? 'Untitled Role',
    location: (m as any).location ?? '—',
    remote: false,
    salaryMin: comp.min,
    salaryMax: comp.max,
    matchScore: 0, // requires matching logic not available yet
    tier: 'A', // default tier
    industry: company?.industry ?? '—',
    posted: '—',
    saved: false,
  };
}

const TIER_COLORS: Record<string, string> = {
  S: 'bg-fuchsia text-white',
  A: 'bg-green text-white',
  B: 'bg-blue text-white',
  C: 'bg-text-muted text-white',
};

export function CandidateOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const { candidateProfile, profile } = useTenantContext();

  useEffect(() => {
    let cancelled = false;
    const fetchOpps = async () => {
      try {
        setError(null);
        const data = await getOpenMandates(20);
        if (cancelled) return;
        setOpportunities(data.map(mapMandate));
      } catch (e) {
        console.error('[CandidateOpportunitiesPage] Error:', e);
        if (!cancelled) setError('Failed to load opportunities');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchOpps();
    return () => { cancelled = true; };
  }, []);

  const filteredOpps = opportunities.filter(o => {
    const matchesSearch = o.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === 'all' || o.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const displayName = candidateProfile?.name || profile?.name || 'Candidate';
  const currentTitle = candidateProfile?.current_title || 'Professional';

  const savedCount = opportunities.filter(o => o.saved).length;
  const avgMatch = opportunities.length
    ? Math.round(opportunities.reduce((sum, o) => sum + o.matchScore, 0) / opportunities.length)
    : 0;

  const toggleSave = (id: string) => {
    setOpportunities(prev => prev.map(o =>
      o.id === id ? { ...o, saved: !o.saved } : o
    ));
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-serif font-bold text-2xl text-text-primary">My Opportunities</h1>
            <p className="text-text-secondary text-sm mt-1">Personalized opportunities matched to your profile and goals.</p>
          </div>
          <div className="flex items-center gap-3 bg-bg-warm px-4 py-2 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-fuchsia-light flex items-center justify-center">
              <User className="w-4 h-4 text-fuchsia" />
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-text-primary">{displayName}</div>
              <div className="text-xs text-text-muted">{currentTitle}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : opportunities.length}</div>
              <div className="text-xs text-text-muted">Available Roles</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue/10 flex items-center justify-center">
              <Bookmark className="w-5 h-5 text-blue" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : savedCount}</div>
              <div className="text-xs text-text-muted">Saved</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : `${avgMatch}%`}</div>
              <div className="text-xs text-text-muted">Avg Match Score</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search opportunities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="px-4 py-2 bg-white border border-border text-sm text-text-primary focus:outline-none focus:border-fuchsia rounded-md"
        >
          <option value="all">All Tiers</option>
          <option value="S">Tier S</option>
          <option value="A">Tier A</option>
          <option value="B">Tier B</option>
          <option value="C">Tier C</option>
        </select>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-text-muted text-sm">Loading opportunities...</div>
        ) : error ? (
          <EmptyState title="Failed to load opportunities" description={error} />
        ) : filteredOpps.length === 0 ? (
          <EmptyState
            title="No opportunities found"
            description={searchTerm || tierFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'There are no open mandates available right now. Check back soon.'}
          />
        ) : (
          filteredOpps.map((opp) => (
            <Card key={opp.id} className="p-5 hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <Badge className={`${TIER_COLORS[opp.tier]} text-xs`}>{opp.tier}</Badge>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-text-primary">{opp.role}</h3>
                    <p className="text-sm text-text-secondary">{opp.company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-fuchsia/10 text-fuchsia">
                    <Star className="w-3 h-3 mr-1" /> {opp.matchScore}% match
                  </Badge>
                  <button
                    onClick={() => toggleSave(opp.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      opp.saved ? 'bg-fuchsia/10 text-fuchsia' : 'hover:bg-bg-warm text-text-muted'
                    }`}
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div className="flex items-center gap-1 text-xs text-text-muted">
                  <MapPin className="w-3 h-3" />
                  {opp.location} {opp.remote && '(Remote OK)'}
                </div>
                <div className="flex items-center gap-1 text-xs text-text-muted">
                  <DollarSign className="w-3 h-3" />
                  {opp.salaryMin > 0 || opp.salaryMax > 0
                    ? `$${opp.salaryMin}K - $${opp.salaryMax}K`
                    : '—'}
                </div>
                <div className="text-xs text-text-muted">Industry: {opp.industry}</div>
                <div className="text-xs text-text-muted">Posted: {opp.posted}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm">
                  <Send className="w-3 h-3 mr-1" /> Apply Now
                </Button>
                <Button variant="outline" size="sm">
                  View Details <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default CandidateOpportunitiesPage;
