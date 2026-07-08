/**
 * Shortlist1Pager — Ranking table + 1-pager preview
 *
 * From Sarvika (card layout) + Manish (ranking table, scope bar, LYC View callout).
 * Shows ranked candidates with composite scores, tier badges, and quick actions.
 */

import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronDown, Eye, Download, Mail,
  FileText, MessageSquare, Sparkles, X, Shield, AlertTriangle
} from 'lucide-react';
import { ScopeBar } from './ScopeBar';
import { PipelineStageBadge, VerdictBadge, ScoreBadge } from './PipelineStageBadge';
import { cn } from '@/lib/utils';
import type { MatchResult } from '@/services/scoringClient';

// ─── Types ───

export interface ShortlistCandidate {
  id: string;
  name: string;
  title: string;
  company: string;
  stage: string;
  trident?: MatchResult | null;
  matchScore?: number | null;
  verdict?: string | null;
  tier?: string | null;
  location?: string;
  skills?: string[];
  availability?: string;
  estimatedComp?: string;
  notes?: string;
  approachStrategy?: string;
  flags?: string[];
  cvUrl?: string;
}

export interface Shortlist1PagerProps {
  mandateTitle: string;
  clientName?: string;
  location?: string;
  reference?: string;
  candidates: ShortlistCandidate[];
  viewMode: 'internal' | 'external';
  onAIAction?: (action: string, candidateId: string) => void;
  onExport?: () => void;
}

// ─── LYC View Callout (Internal Only) ───

function LYCViewCallout({ candidate }: { candidate: ShortlistCandidate }) {
  if (!candidate.flags?.length && !candidate.approachStrategy) return null;

  return (
    <div className="bg-[#1A1A1A]/5 border border-[#1A1A1A]/10 rounded p-3 mt-3">
      <div className="flex items-center gap-2 mb-2">
        <Shield size={12} className="text-[#C108AB]" />
        <span className="text-[10px] font-semibold text-[#C108AB] uppercase tracking-wider">
          LYC Internal — Not for Client
        </span>
      </div>

      {candidate.flags && candidate.flags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {candidate.flags.map((flag, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#EF4444]/10 rounded text-[9px] text-[#EF4444]">
              <AlertTriangle size={8} />
              {flag}
            </span>
          ))}
        </div>
      )}

      {candidate.approachStrategy && (
        <p className="text-xs text-[#4A4A4A]">{candidate.approachStrategy}</p>
      )}
    </div>
  );
}

// ─── Pre-Flight Checks ───

function PreFlightChecks({ candidate }: { candidate: ShortlistCandidate }) {
  const checks = [
    { label: 'CV Present', pass: !!candidate.cvUrl },
    { label: 'Score Computed', pass: !!candidate.trident },
    { label: 'No Reject Flag', pass: candidate.verdict !== 'Reject' },
    { label: 'Active Stage', pass: candidate.stage !== 'SWEEP' },
  ];

  return (
    <div className="flex items-center gap-2 mt-2">
      {checks.map((check, i) => (
        <span
          key={i}
          className={cn(
            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium',
            check.pass ? 'bg-[#00C853]/10 text-[#00C853]' : 'bg-[#EF4444]/10 text-[#EF4444]'
          )}
        >
          {check.pass ? '✓' : '✗'} {check.label}
        </span>
      ))}
    </div>
  );
}

// ─── AI Quick Actions ───

interface AIQuickActionsProps {
  candidateId: string;
  onAction: (action: string, candidateId: string) => void;
}

function AIQuickActions({ candidateId, onAction }: AIQuickActionsProps) {
  const actions = [
    { key: 'email', label: 'Email', icon: Mail, color: '#3B82F6' },
    { key: 'cv', label: 'CV', icon: FileText, color: '#00C853' },
    { key: 'shortlist', label: 'Shortlist', icon: Sparkles, color: '#C108AB' },
    { key: 'overview', label: 'Overview', icon: Eye, color: '#6366F1' },
    { key: 'feedback', label: 'Feedback', icon: MessageSquare, color: '#FFB300' },
  ];

  return (
    <div className="flex items-center gap-1">
      {actions.map(action => {
        const Icon = action.icon;
        return (
          <button
            key={action.key}
            onClick={() => onAction(action.key, candidateId)}
            className="flex items-center gap-1 px-2 py-1.5 rounded text-[10px] font-medium border border-[#E5E5E5] hover:border-[#1A1A1A] hover:bg-[#1A1A1A]/5 transition-all"
            style={{ color: action.color }}
          >
            <Icon size={12} />
            {action.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Dimension Matrix (3-Dim Match) ───

function DimensionMatrix({ trident, viewMode }: { trident: MatchResult; viewMode: 'internal' | 'external' }) {
  const dims = [
    { key: 'd1', label: viewMode === 'external' ? 'Experience' : 'D1 — Experience', weight: '40%', value: trident.d1 },
    { key: 'd2', label: viewMode === 'external' ? 'Skills Match' : 'D2 — Skills', weight: '35%', value: trident.d2 },
    { key: 'd3', label: viewMode === 'external' ? 'Org Fit' : 'D3 — Org Fit', weight: '25%', value: trident.d3 },
  ];

  const colors: Record<string, string> = { d1: '#6366F1', d2: '#C108AB', d3: '#00C853' };

  return (
    <div className="space-y-2">
      {dims.map(dim => (
        <div key={dim.key} className="flex items-center gap-3">
          <span className="text-[10px] text-[#8A8A8A] w-28 shrink-0">{dim.label}</span>
          <div className="flex-1 h-2 bg-[#F7F7F5] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${dim.value * 10}%`, background: colors[dim.key] }}
            />
          </div>
          <span className="text-[10px] font-semibold w-6 text-right" style={{ color: colors[dim.key] }}>
            {viewMode === 'external' ? `${dim.value * 10}%` : dim.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───

export function Shortlist1Pager({
  mandateTitle,
  clientName,
  location,
  reference,
  candidates,
  viewMode,
  onAIAction,
  onExport,
}: Shortlist1PagerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailCandidate, setDetailCandidate] = useState<ShortlistCandidate | null>(null);

  // Sort by composite score descending
  const sorted = [...candidates].sort((a, b) => {
    const aScore = a.trident?.composite ?? a.matchScore ?? 0;
    const bScore = b.trident?.composite ?? b.matchScore ?? 0;
    return bScore - aScore;
  });

  return (
    <div className="space-y-5">
      {/* Scope Bar */}
      <ScopeBar
        mandateTitle={mandateTitle}
        clientName={clientName}
        location={location}
        reference={reference}
        candidateCount={candidates.length}
        viewMode={viewMode}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1A1A1A]" style={{ fontFamily: 'Georgia, serif' }}>
            Shortlist
          </h2>
          <p className="text-sm text-[#8A8A8A]">
            {sorted.length} candidates ranked by fit
          </p>
        </div>
        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-2 bg-[#1A1A1A] text-white rounded text-sm hover:bg-[#333] transition-colors"
          >
            <Download size={14} />
            Export
          </button>
        )}
      </div>

      {/* Ranking Table */}
      <div className="bg-white border border-[#E5E5E5] rounded-none overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-[#F7F7F5] border-b border-[#E5E5E5] text-[10px] text-[#8A8A8A] uppercase tracking-wider">
          <div className="col-span-1">#</div>
          <div className="col-span-3">Candidate</div>
          <div className="col-span-2">Stage</div>
          <div className="col-span-2">{viewMode === 'external' ? 'Fit' : 'Match Profile'}</div>
          <div className="col-span-2">{viewMode === 'external' ? 'Assessment' : 'Verdict'}</div>
          <div className="col-span-2">Actions</div>
        </div>

        {/* Rows */}
        {sorted.map((candidate, idx) => {
          const isExpanded = expandedId === candidate.id;
          const composite = candidate.trident?.composite ?? candidate.matchScore;

          return (
            <div key={candidate.id} className="border-b border-[#E5E5E5] last:border-b-0">
              <button
                onClick={() => setExpandedId(isExpanded ? null : candidate.id)}
                className="w-full grid grid-cols-12 gap-2 px-4 py-3 hover:bg-[#FAFAF8] transition-colors text-left"
              >
                <div className="col-span-1 flex items-center">
                  <span className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold',
                    idx === 0 ? 'bg-[#C108AB]/10 text-[#C108AB]' :
                    idx === 1 ? 'bg-[#FFB300]/10 text-[#FFB300]' :
                    'bg-[#8A8A8A]/10 text-[#8A8A8A]'
                  )}>
                    {idx + 1}
                  </span>
                </div>
                <div className="col-span-3 flex items-center min-w-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1A1A1A] truncate" style={{ fontFamily: 'Georgia, serif' }}>
                      {candidate.name}
                    </p>
                    <p className="text-[11px] text-[#8A8A8A] truncate">
                      {candidate.title} · {candidate.company}
                    </p>
                  </div>
                </div>
                <div className="col-span-2 flex items-center">
                  <PipelineStageBadge stage={candidate.stage} viewMode={viewMode} size="sm" />
                </div>
                <div className="col-span-2 flex items-center">
                  {composite !== null && composite !== undefined ? (
                    <ScoreBadge score={composite} size="sm" />
                  ) : (
                    <span className="text-xs text-[#8A8A8A]">—</span>
                  )}
                </div>
                <div className="col-span-2 flex items-center">
                  {candidate.verdict ? (
                    <VerdictBadge verdict={candidate.verdict} viewMode={viewMode} size="sm" />
                  ) : (
                    <span className="text-xs text-[#8A8A8A]">Pending</span>
                  )}
                </div>
                <div className="col-span-2 flex items-center">
                  <ChevronRight
                    size={14}
                    className={cn('text-[#8A8A8A] transition-transform', isExpanded && 'rotate-90')}
                  />
                </div>
              </button>

              {/* Expanded Detail */}
              <AnimatePresence>
                {isExpanded && (
                  <div
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3">
                      {/* Dimension Matrix */}
                      {candidate.trident && (
                        <DimensionMatrix trident={candidate.trident} viewMode={viewMode} />
                      )}

                      {/* Pre-Flight Checks (internal only) */}
                      {viewMode === 'internal' && (
                        <PreFlightChecks candidate={candidate} />
                      )}

                      {/* LYC View Callout (internal only) */}
                      {viewMode === 'internal' && (
                        <LYCViewCallout candidate={candidate} />
                      )}

                      {/* AI Quick Actions */}
                      {onAIAction && viewMode === 'internal' && (
                        <AIQuickActions candidateId={candidate.id} onAction={onAIAction} />
                      )}

                      {/* Location & Availability */}
                      <div className="flex items-center gap-4 text-xs text-[#8A8A8A]">
                        {candidate.location && <span>📍 {candidate.location}</span>}
                        {candidate.availability && <span>🕐 {candidate.availability}</span>}
                        {candidate.estimatedComp && <span>💰 {candidate.estimatedComp}</span>}
                      </div>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {sorted.length === 0 && (
        <div className="bg-white border border-[#E5E5E5] rounded-none p-8 text-center">
          <p className="text-[#8A8A8A]">No candidates shortlisted yet.</p>
        </div>
      )}

      {/* Client Safety Warning (internal only) */}
      {viewMode === 'internal' && sorted.length > 0 && (
        <div className="bg-[#C108AB]/5 border border-[#C108AB]/20 rounded p-3 flex items-start gap-2">
          <Shield size={14} className="text-[#C108AB] mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-[#C108AB]">Client Safety Layer Active</p>
            <p className="text-[11px] text-[#4A4A4A] mt-0.5">
              Switch to Client View to preview what clients will see. Composite score, internal stages, risk flags, and approach strategies are automatically hidden.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Shortlist1Pager;
