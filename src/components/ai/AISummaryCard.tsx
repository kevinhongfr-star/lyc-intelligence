import React, { useState } from 'react';
import { Sparkles, AlertTriangle, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';

interface AISummaryData {
  summary: string;
  keyStrengths: string[];
  riskFlags: string[];
  recommendedAction: string;
  contextLabel?: string;
}

interface AISummaryCardProps {
  entityType: 'candidate' | 'mandate' | 'company';
  entityId: string;
}

export function AISummaryCard({ entityType, entityId }: AISummaryCardProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AISummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType, entityId }),
      });
      if (!res.ok) throw new Error(`AI summary error: ${res.status}`);
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to generate');
      setData(result.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-[#C108AB]/5 to-transparent">
        <CardTitle className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-2 font-bold text-text-muted uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#C108AB]" />
            AI Executive Summary
          </span>
          {!data && !loading && (
            <button
              onClick={generate}
              className="px-3 py-1 text-xs font-medium text-[#C108AB] border border-[#C108AB]/30 rounded hover:bg-[#C108AB]/10 transition-colors"
            >
              Generate
            </button>
          )}
          {data && (
            <button
              onClick={generate}
              className="px-3 py-1 text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
            >
              Regenerate
            </button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {loading && (
          <div className="flex items-center justify-center py-6 gap-2 text-text-muted">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Analyzing profile...</span>
          </div>
        )}

        {error && (
          <div className="py-4 text-center">
            <p className="text-sm text-red-500 mb-2">{error}</p>
            <button onClick={generate} className="text-xs text-[#C108AB] hover:underline">Retry</button>
          </div>
        )}

        {!data && !loading && !error && (
          <div className="py-4 text-center">
            <Sparkles className="w-6 h-6 text-text-muted/30 mx-auto mb-2" />
            <p className="text-sm text-text-muted">Click Generate to get an AI-powered executive summary</p>
          </div>
        )}

        {data && (
          <div className="space-y-4">
            {data.contextLabel && (
              <Badge variant="secondary" className="text-xs">{data.contextLabel}</Badge>
            )}

            <p className="text-sm text-text-primary leading-relaxed">{data.summary}</p>

            {data.keyStrengths.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  Key Strengths
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {data.keyStrengths.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {data.riskFlags.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  Risk Flags
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {data.riskFlags.map((f, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {data.recommendedAction && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
                <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800">{data.recommendedAction}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
