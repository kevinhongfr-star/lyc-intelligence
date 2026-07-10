import React, { useState } from 'react';
import { FileText, Loader2, AlertTriangle, TrendingUp, CheckCircle2, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';

interface ReportData {
  title: string;
  executiveSummary: string;
  pipelineHealth: string;
  keyRisks: string[];
  nextActions: string[];
  generatedAt: string;
  pipeline?: { stage: string; count: number; candidates: string[] }[];
}

interface MandateReportCardProps {
  mandateId: string;
}

export function MandateReportCard({ mandateId }: MandateReportCardProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/mandate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mandateId }),
      });
      if (!res.ok) throw new Error(`Report error: ${res.status}`);
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed');
      setData(result.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const STAGE_COLORS: Record<string, string> = {
    GRID: '#3B82F6',
    LENS: '#8B5CF6',
    SWEEP: '#F59E0B',
    CANVA: '#22C55E',
    PLACED: '#D4AF37',
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-transparent">
        <CardTitle className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-2 font-bold text-text-muted uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            Mandate Status Report
          </span>
          {!data && !loading && (
            <button
              onClick={generate}
              className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
            >
              Generate Report
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
          <div className="flex items-center justify-center py-8 gap-2 text-text-muted">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Generating mandate status report...</span>
          </div>
        )}

        {error && (
          <div className="py-4 text-center">
            <p className="text-sm text-red-500 mb-2">{error}</p>
            <button onClick={generate} className="text-xs text-blue-600 hover:underline">Retry</button>
          </div>
        )}

        {!data && !loading && !error && (
          <div className="py-6 text-center">
            <FileText className="w-8 h-8 text-text-muted/20 mx-auto mb-2" />
            <p className="text-sm text-text-muted">Generate an AI-powered mandate status report with pipeline analysis</p>
          </div>
        )}

        {data && (
          <div className="space-y-5">
            {data.title && (
              <h3 className="text-sm font-bold text-text-primary">{data.title}</h3>
            )}

            {data.generatedAt && (
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <Calendar className="w-3 h-3" />
                Generated {new Date(data.generatedAt).toLocaleString()}
              </div>
            )}

            {/* Executive Summary */}
            <div>
              <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Executive Summary</h4>
              <p className="text-sm text-text-primary leading-relaxed">{data.executiveSummary}</p>
            </div>

            {/* Pipeline Health */}
            <div>
              <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3 text-blue-500" />
                Pipeline Health
              </h4>
              <p className="text-sm text-text-primary leading-relaxed">{data.pipelineHealth}</p>

              {data.pipeline && data.pipeline.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {data.pipeline.map(p => (
                    <div key={p.stage} className="flex-1 text-center p-2 rounded border border-[#E5E5E5]">
                      <div className="text-lg font-bold font-mono" style={{ color: STAGE_COLORS[p.stage] || '#666' }}>
                        {p.count}
                      </div>
                      <div className="text-xs text-text-muted">{p.stage}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Key Risks */}
            {data.keyRisks.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  Key Risks
                </h4>
                <ul className="space-y-1.5">
                  {data.keyRisks.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-primary">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Actions */}
            {data.nextActions.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  Recommended Next Actions
                </h4>
                <ol className="space-y-1.5">
                  {data.nextActions.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-primary">
                      <span className="w-5 h-5 rounded-full bg-green-50 text-green-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {a}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
