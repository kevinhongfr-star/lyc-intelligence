import React, { useState, useMemo } from 'react';
import { Share2, Copy, CheckCircle } from 'lucide-react';
import { MOCK_ASSESSMENT_RESULTS } from '@/mocks/advancedFeatures';
import { Button } from '@/components/ui';

type Expiration = '7d' | '30d' | 'never';

const EXPIRATION_OPTIONS: { id: Expiration; label: string }[] = [
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: 'never', label: 'Never' },
];

export default function ShareAssessment() {
  const [includeScores, setIncludeScores] = useState(true);
  const [includeDimensions, setIncludeDimensions] = useState(true);
  const [includePercentile, setIncludePercentile] = useState(true);
  const [expiration, setExpiration] = useState<Expiration>('30d');
  const [copied, setCopied] = useState(false);

  const shareLink = useMemo(() => {
    const params = new URLSearchParams();
    if (includeScores) params.set('scores', '1');
    if (includeDimensions) params.set('dims', '1');
    if (includePercentile) params.set('pct', '1');
    params.set('exp', expiration);
    return `https://lyc-intelligence.app/share/as1?${params.toString()}`;
  }, [includeScores, includeDimensions, includePercentile, expiration]);

  const handleCopy = () => {
    navigator.clipboard?.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Toggle sections */}
      <div className="bg-bg-primary border border-bg-tertiary p-6" style={{ borderRadius: 0 }}>
        <h3 className="font-serif font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-accent" />
          Share Settings
        </h3>
        <p className="text-sm text-text-muted mb-4">
          Choose which sections to include in the shared link.
        </p>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeScores}
              onChange={(e) => setIncludeScores(e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
            <span className="text-sm text-text-primary">Scores</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeDimensions}
              onChange={(e) => setIncludeDimensions(e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
            <span className="text-sm text-text-primary">Dimensions</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includePercentile}
              onChange={(e) => setIncludePercentile(e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
            <span className="text-sm text-text-primary">Percentile</span>
          </label>
        </div>
      </div>

      {/* Expiration */}
      <div className="bg-bg-primary border border-bg-tertiary p-6" style={{ borderRadius: 0 }}>
        <h3 className="font-serif font-semibold text-text-primary mb-4">Link Expiration</h3>
        <div className="flex gap-2">
          {EXPIRATION_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setExpiration(opt.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                expiration === opt.id
                  ? 'bg-accent text-white'
                  : 'bg-bg-secondary text-text-muted hover:bg-bg-tertiary'
              }`}
              style={{ borderRadius: 0 }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-bg-primary border border-bg-tertiary p-6" style={{ borderRadius: 0 }}>
        <h3 className="font-serif font-semibold text-text-primary mb-4">Preview</h3>
        <div className="bg-bg-secondary border border-bg-tertiary p-4" style={{ borderRadius: 0 }}>
          <h4 className="font-semibold text-text-primary mb-3">TRIDENT Leadership Assessment</h4>
          {includeScores && (
            <div className="mb-2">
              <span className="text-sm text-text-muted">Overall Score: </span>
              <span className="font-bold text-accent">{MOCK_ASSESSMENT_RESULTS.trident.overall}/10</span>
            </div>
          )}
          {includeDimensions && (
            <div className="mb-2 space-y-1">
              {Object.entries(MOCK_ASSESSMENT_RESULTS.trident.dimensions).map(([dim, score]) => (
                <div key={dim} className="flex justify-between text-sm">
                  <span className="text-text-muted">{dim}</span>
                  <span className="text-text-primary">{score as number}/10</span>
                </div>
              ))}
            </div>
          )}
          {includePercentile && (
            <div>
              <span className="text-sm text-text-muted">Percentile: </span>
              <span className="font-bold text-accent">92nd</span>
            </div>
          )}
          {!includeScores && !includeDimensions && !includePercentile && (
            <p className="text-sm text-text-muted italic">No sections selected for sharing.</p>
          )}
        </div>
      </div>

      {/* Link + Copy */}
      <div className="bg-bg-primary border border-bg-tertiary p-6" style={{ borderRadius: 0 }}>
        <h3 className="font-serif font-semibold text-text-primary mb-4">Shareable Link</h3>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={shareLink}
            className="flex-1 bg-bg-secondary border border-bg-tertiary px-3 py-2 text-sm text-text-muted font-mono"
            style={{ borderRadius: 0 }}
          />
          <Button
            variant={copied ? 'success' : 'default'}
            size="default"
            onClick={handleCopy}
            style={{ borderRadius: 0 }}
            className="flex items-center gap-2"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Link
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
