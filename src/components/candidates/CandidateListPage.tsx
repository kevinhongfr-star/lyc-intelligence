// CandidateListPage.tsx — DEX Candidate Tracking (Technical Blueprint 01)
// Main candidates list view with 19-stage pipeline filtering

'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  User,
  MapPin,
  Building2,
  TrendingUp,
  MoreHorizontal,
} from 'lucide-react';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { Card, CardContent } from '@/components/ui';
import { EnrichmentStatusBadge } from './EnrichmentStatusBadge';

interface Candidate {
  id: string;
  name: string;
  current_title: string | null;
  company: { id: string; name: string } | null;
  pipeline_stage: string;
  tier: string | null;
  classification: string | null;
  motivation_overall: string;
  data_confidence: number;
  last_contacted: string | null;
  trident_composite: number | null;
  enrichment_status: string;
}

interface CandidateListPageProps {
  onCreateNew?: () => void;
  onSelectCandidate?: (id: string) => void;
}

// Pipeline stage labels
const STAGE_LABELS: Record<string, string> = {
  S1_Sourced: 'S1: Sourced',
  S2_Screened: 'S2: Screened',
  S3_Contacted: 'S3: Contacted',
  S4_No_Response: 'S4: No Response',
  S5_Responded: 'S5: Responded',
  S6_WeChat_Added: 'S6: WeChat Added',
  S7_Interested: 'S7: Interested',
  S8_Not_Interested: 'S8: Not Interested',
  S9_Call_Positive: 'S9: Call Positive',
  S10_Call_Negative: 'S10: Call Negative',
  S11_Internal_Interview: 'S11: Internal Interview',
  S12_Presented_to_Client: 'S12: Presented to Client',
  S13_Client_Int_Scheduled: 'S13: Client Int Scheduled',
  S14_Client_Interviewed: 'S14: Client Interviewed',
  S15_Client_2nd_Interview: 'S15: Client 2nd Interview',
  S16_Offer_Extended: 'S16: Offer Extended',
  S17_Offer_Accepted: 'S17: Offer Accepted',
  S18_Offer_Declined: 'S18: Offer Declined',
  S19_Closed: 'S19: Closed',
};

const STAGE_COLORS: Record<string, string> = {
  S1_Sourced: 'bg-gray-100 text-gray-700 border-gray-200',
  S2_Screened: 'bg-blue-100 text-blue-700 border-blue-200',
  S3_Contacted: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  S4_No_Response: 'bg-gray-100 text-gray-500 border-gray-200',
  S5_Responded: 'bg-green-100 text-green-700 border-green-200',
  S6_WeChat_Added: 'bg-purple-100 text-purple-700 border-purple-200',
  S7_Interested: 'bg-green-200 text-green-800 border-green-300',
  S8_Not_Interested: 'bg-red-100 text-red-700 border-red-200',
  S9_Call_Positive: 'bg-green-200 text-green-800 border-green-300',
  S10_Call_Negative: 'bg-red-100 text-red-700 border-red-200',
  S11_Internal_Interview: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  S12_Presented_to_Client: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  S13_Client_Int_Scheduled: 'bg-cyan-200 text-cyan-800 border-cyan-300',
  S14_Client_Interviewed: 'bg-cyan-200 text-cyan-800 border-cyan-300',
  S15_Client_2nd_Interview: 'bg-cyan-300 text-cyan-800 border-cyan-400',
  S16_Offer_Extended: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  S17_Offer_Accepted: 'bg-emerald-200 text-emerald-800 border-emerald-300',
  S18_Offer_Declined: 'bg-red-200 text-red-800 border-red-300',
  S19_Closed: 'bg-gray-200 text-gray-800 border-gray-300',
};

const MOTIVATION_COLORS: Record<string, string> = {
  GREEN: 'bg-green-500',
  YELLOW: 'bg-yellow-500',
  RED: 'bg-red-500',
  UNKNOWN: 'bg-gray-400',
};

const TIER_COLORS: Record<string, string> = {
  A: 'bg-gold text-gold-800',
  B: 'bg-silver text-silver-800',
  C: 'bg-bronze text-bronze-800',
};

export function CandidateListPage({ onCreateNew, onSelectCandidate }: CandidateListPageProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string[]>([]);
  const [motivationFilter, setMotivationFilter] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<string | null>(null);

  async function fetchCandidates() {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '50');
      params.set('is_archived', 'false');

      if (stageFilter.length > 0) {
        params.set('pipeline_stage', stageFilter.join(','));
      }
      if (motivationFilter) {
        params.set('motivation_overall', motivationFilter);
      }
      if (tierFilter) {
        params.set('tier', tierFilter);
      }
      if (searchQuery) {
        params.set('search', searchQuery);
      }

      const res = await fetch(`/api/candidates?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCandidates(data.data || []);
        setTotal(data.pagination?.total || 0);
        setTotalPages(data.pagination?.total_pages || 1);
      } else {
        setError(data.error || 'Failed to load candidates');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchCandidates();
  }, [page, stageFilter.join(','), motivationFilter, tierFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) fetchCandidates();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString();
  }

  function formatScore(score: number | null): string {
    if (!score) return '-';
    return Math.round(score * 10) / 10 + '/10';
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-text-primary">Candidates</h1>
          <p className="text-sm text-text-secondary">{total} total candidates</p>
        </div>
        <Button onClick={onCreateNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Quick Add
        </Button>
      </div>

      {/* Search & Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search by name, company, title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-none border border-bg-tertiary bg-bg-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Stage Filter */}
          <select
            multiple
            value={stageFilter}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, opt => opt.value);
              setStageFilter(selected);
            }}
            className="px-3 py-2 text-sm rounded-none border border-bg-tertiary bg-bg-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {Object.entries(STAGE_LABELS).map(([stage, label]) => (
              <option key={stage} value={stage}>{label}</option>
            ))}
          </select>

          {/* Motivation Filter */}
          <select
            value={motivationFilter || ''}
            onChange={(e) => setMotivationFilter(e.target.value || null)}
            className="px-3 py-2 text-sm rounded-none border border-bg-tertiary bg-bg-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">All Motivation</option>
            <option value="GREEN">GREEN</option>
            <option value="YELLOW">YELLOW</option>
            <option value="RED">RED</option>
            <option value="UNKNOWN">UNKNOWN</option>
          </select>

          {/* Tier Filter */}
          <select
            value={tierFilter || ''}
            onChange={(e) => setTierFilter(e.target.value || null)}
            className="px-3 py-2 text-sm rounded-none border border-bg-tertiary bg-bg-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">All Tiers</option>
            <option value="A">Tier A</option>
            <option value="B">Tier B</option>
            <option value="C">Tier C</option>
          </select>
        </div>
      </Card>

      {/* Candidate List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-text-secondary" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">{error}</div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-8 text-text-secondary">No candidates found</div>
      ) : (
        <div className="space-y-2">
          {candidates.map((candidate) => (
            <div
              key={candidate.id}
              onClick={() => onSelectCandidate?.(candidate.id)}
              className="flex items-center gap-4 p-4 rounded-none bg-bg-secondary border border-bg-tertiary hover:border-border-focus hover:shadow-sm cursor-pointer transition-all"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center text-text-secondary">
                <User className="w-5 h-5" />
              </div>

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text-primary truncate">{candidate.name}</span>
                  {candidate.tier && (
                    <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${TIER_COLORS[candidate.tier] || 'bg-gray-100 text-gray-700'}`}>
                      {candidate.tier}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-text-secondary mt-0.5">
                  {candidate.current_title && <span className="truncate">{candidate.current_title}</span>}
                  {candidate.company && (
                    <span className="flex items-center gap-1 truncate">
                      <Building2 className="w-3 h-3" />
                      {candidate.company.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Stage Badge */}
              <Badge className={`${STAGE_COLORS[candidate.pipeline_stage] || 'bg-gray-100 text-gray-700'} px-2 py-1 text-xs font-medium border`}>
                {STAGE_LABELS[candidate.pipeline_stage] || candidate.pipeline_stage}
              </Badge>

              {/* Motivation Dot */}
              <div className="relative group">
                <div className={`w-3 h-3 rounded-full ${MOTIVATION_COLORS[candidate.motivation_overall] || 'bg-gray-400'}`} />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50">
                  <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                    Motivation: {candidate.motivation_overall || 'UNKNOWN'}
                  </div>
                </div>
              </div>

              {/* Score */}
              <div className="text-sm text-text-secondary w-16 text-right">
                {formatScore(candidate.trident_composite)}
              </div>

              {/* Enrichment Status */}
              <EnrichmentStatusBadge status={candidate.enrichment_status || 'raw'} size="sm" />

              {/* Confidence */}
              <div className="w-16 text-right">
                <div className="text-xs text-text-secondary">{candidate.data_confidence}%</div>
                <div className="w-full h-1 bg-gray-200 rounded mt-1">
                  <div
                    className="h-full bg-primary rounded"
                    style={{ width: `${candidate.data_confidence}%` }}
                  />
                </div>
              </div>

              {/* Last Contacted */}
              <div className="flex items-center gap-1 text-xs text-text-secondary w-20">
                <TrendingUp className="w-3 h-3" />
                {formatDate(candidate.last_contacted)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-text-secondary">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}