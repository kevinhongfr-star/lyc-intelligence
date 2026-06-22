import React, { useState } from 'react';
import { Sparkles, Building2, RefreshCw, ExternalLink, Globe, Users, Calendar, MapPin, Briefcase, Newspaper, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { TargetCompany, CompanyOverview } from '@/types';
import { generateCompanyOverview } from '@/services/supabaseApi';

interface Props {
  company: TargetCompany;
  onOverviewGenerated?: (overview: CompanyOverview) => void;
  onError?: (error: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Not Generated',
  generating: 'Generating...',
  completed: 'Generated',
  failed: 'Failed',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Building2 className="w-4 h-4 text-slate-400" />,
  generating: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
  completed: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  failed: <AlertCircle className="w-4 h-4 text-red-500" />,
};

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CompanyOverviewGenerator({ company, onOverviewGenerated, onError }: Props) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const overview = company.company_overview;
  const status = company.overview_status || 'pending';

  async function handleGenerate() {
    setGenerating(true);
    setError(null);

    try {
      const result = await generateCompanyOverview(company.id, {
        name: company.name,
        industry: company.industry || undefined,
        location: company.location || undefined,
      });

      if (result.success && result.data) {
        onOverviewGenerated?.(result.data);
        setRetryCount(0);
      } else {
        setError(result.error || 'Failed to generate overview');
        onError?.(result.error || 'Unknown error');
        setRetryCount(c => c + 1);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate overview';
      setError(errorMessage);
      onError?.(errorMessage);
      setRetryCount(c => c + 1);
    } finally {
      setGenerating(false);
    }
  }

  const canGenerate = !generating && status !== 'generating';
  const hasOverview = status === 'completed' && overview;

  return (
    <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-slate-50">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${status === 'completed' ? 'bg-emerald-100 text-emerald-600' : status === 'failed' ? 'bg-red-100 text-red-600' : status === 'generating' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">{company.name}</h3>
            <p className="text-xs text-text-muted">
              {company.industry || 'Industry unknown'}
              {company.location && ` • ${company.location}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status badge */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
            status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
            status === 'failed' ? 'bg-red-100 text-red-800' :
            status === 'generating' ? 'bg-blue-100 text-blue-800' :
            'bg-slate-100 text-slate-700'
          }`}>
            {STATUS_ICONS[status]}
            {STATUS_LABELS[status]}
          </span>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              canGenerate
                ? 'bg-accent text-white hover:bg-accent-hover'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {hasOverview ? 'Regenerate' : 'Generate Overview'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-red-800 font-medium">Generation failed</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
            {retryCount > 0 && (
              <p className="text-xs text-red-500 mt-1">
                {retryCount === 1 ? '1 retry available' : `${retryCount} retries available`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Overview content */}
      {hasOverview && (
        <div className="p-4 space-y-4">
          {/* Generated timestamp */}
          {overview?.generated_at && (
            <div className="flex items-center gap-2 text-xs text-text-muted pb-2 border-b border-border">
              <Calendar className="w-3 h-3" />
              AI-generated on {formatDate(overview.generated_at)}
            </div>
          )}

          {/* Description */}
          {overview?.description && (
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Overview</h4>
              <p className="text-sm text-text-primary leading-relaxed">{overview.description}</p>
            </div>
          )}

          {/* Quick stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {overview?.revenue && (
              <div className="bg-white rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2 text-text-muted mb-1">
                  <Globe className="w-3 h-3" />
                  <span className="text-xs font-medium">Revenue</span>
                </div>
                <p className="text-sm font-semibold text-text-primary">{overview.revenue}</p>
              </div>
            )}

            {overview?.employee_count && (
              <div className="bg-white rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2 text-text-muted mb-1">
                  <Users className="w-3 h-3" />
                  <span className="text-xs font-medium">Employees</span>
                </div>
                <p className="text-sm font-semibold text-text-primary">{overview.employee_count}</p>
              </div>
            )}

            {overview?.founded && (
              <div className="bg-white rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2 text-text-muted mb-1">
                  <Calendar className="w-3 h-3" />
                  <span className="text-xs font-medium">Founded</span>
                </div>
                <p className="text-sm font-semibold text-text-primary">{overview.founded}</p>
              </div>
            )}

            {overview?.headquarters && (
              <div className="bg-white rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2 text-text-muted mb-1">
                  <MapPin className="w-3 h-3" />
                  <span className="text-xs font-medium">HQ</span>
                </div>
                <p className="text-sm font-semibold text-text-primary">{overview.headquarters}</p>
              </div>
            )}
          </div>

          {/* Key Products */}
          {overview?.key_products && overview.key_products.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 flex items-center gap-2">
                <Briefcase className="w-3 h-3" />
                Key Products/Services
              </h4>
              <div className="flex flex-wrap gap-2">
                {overview.key_products.map((product, idx) => (
                  <span key={idx} className="px-3 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full">
                    {product}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent News */}
          {overview?.recent_news && (
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 flex items-center gap-2">
                <Newspaper className="w-3 h-3" />
                Recent News
              </h4>
              <p className="text-sm text-text-primary leading-relaxed bg-slate-50 rounded-lg p-3">
                {overview.recent_news}
              </p>
            </div>
          )}

          {/* Company link */}
          {company.domain && (
            <div className="pt-2 border-t border-border">
              <a
                href={company.domain.startsWith('http') ? company.domain : `https://${company.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-hover font-medium"
              >
                <Globe className="w-4 h-4" />
                Visit website
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!hasOverview && !generating && status === 'pending' && (
        <div className="p-8 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-text-primary font-medium">No AI overview yet</p>
          <p className="text-sm text-text-muted mt-1">
            Click &ldquo;Generate Overview&rdquo; to get an AI-generated company profile
          </p>
        </div>
      )}

      {/* Generating skeleton */}
      {status === 'generating' && (
        <div className="p-4 space-y-4 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-4 bg-slate-200 rounded w-1/2" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-slate-200 rounded-lg" />
            ))}
          </div>
          <div className="h-24 bg-slate-200 rounded-lg" />
        </div>
      )}
    </div>
  );
}
