/**
 * CandidateCard — Individual candidate card for the client portal (Phase 8)
 *
 * Displays candidate information including name, title, company, tier badge,
 * pipeline stage, score, and quick action buttons.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { User, Star, ChevronRight, FileText, Eye } from 'lucide-react';
import { TIER_STYLES, type Candidate } from '@/services/clientService';

interface Props {
  candidate: Candidate;
  mandateId: string;
  onQuickReview?: (candidate: Candidate) => void;
  className?: string;
}

export function CandidateCard({ candidate, mandateId, onQuickReview, className = '' }: Props) {
  return (
    <div
      className={`bg-white border border-bg-tertiary hover:border-[#C108AB] transition-colors ${className}`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 flex items-center justify-center text-white text-sm font-semibold shrink-0"
              style={{ background: '#C108AB' }}
            >
              {candidate.full_name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-text-primary truncate">
                {candidate.full_name}
              </h3>
              <p className="text-xs text-text-muted truncate">
                {candidate.title}
                {candidate.company_name && ` at ${candidate.company_name}`}
              </p>
            </div>
          </div>
          <span className={TIER_STYLES[candidate.tier]}>
            {candidate.tier}
          </span>
        </div>

        {candidate.summary && (
          <p className="text-xs text-text-muted mt-3 line-clamp-2">{candidate.summary}</p>
        )}

        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <Star className="w-3 h-3" />
            <span>{candidate.pipeline_stage}</span>
          </div>
          {candidate.score != null && (
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <span className="font-semibold" style={{ color: '#C108AB' }}>{candidate.score}</span>
              <span>/100</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-bg-tertiary">
          <Link
            to={`/client/reviews?candidate=${candidate.id}&mandate=${mandateId}`}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
            style={{ background: '#C108AB' }}
          >
            <Eye className="w-3 h-3" />
            Review
          </Link>
          {candidate.one_pager_url && (
            <a
              href={candidate.one_pager_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-text-secondary border border-bg-tertiary hover:bg-bg-tertiary"
            >
              <FileText className="w-3 h-3" />
              Profile
            </a>
          )}
          {onQuickReview && (
            <button
              onClick={() => onQuickReview(candidate)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text-primary hover:bg-bg-tertiary ml-auto"
            >
              Quick review
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CandidateCard;