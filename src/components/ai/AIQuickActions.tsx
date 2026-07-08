/**
 * AIQuickActions — Reusable component for AI-powered quick actions
 * Uses aiClient to call DeepSeek endpoints for common tasks.
 * Can be embedded in any portal page inside AppShell.
 */
import React, { useState } from 'react';
import { Sparkles, FileText, Brain, Target, X, Loader2, AlertCircle } from 'lucide-react';
import aiClient from '@/services/aiClient';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';

interface AIQuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  action: () => Promise<{ success: boolean; data?: unknown; error?: string }>;
}

interface AIQuickActionsProps {
  title?: string;
  actions?: AIQuickAction[];
}

const DEFAULT_ACTIONS: AIQuickAction[] = [
  {
    id: 'generate-questions',
    label: 'Generate Interview Questions',
    icon: <Brain className="w-4 h-4" />,
    description: 'AI-generated behavioral interview questions for executive roles',
    action: () => aiClient.generateInterviewQuestions('TechCorp', 'VP Engineering', 'medium', 5),
  },
  {
    id: 'analyze-cv',
    label: 'Analyze CV',
    icon: <FileText className="w-4 h-4" />,
    description: 'Extract structured data from candidate CV text',
    action: () => aiClient.analyzeCV('Sample CV text for analysis'),
  },
  {
    id: 'talent-deep-dive',
    label: 'Talent Deep-Dive',
    icon: <Target className="w-4 h-4" />,
    description: 'Generate comprehensive talent assessment report',
    action: () => aiClient.talentDeepDive({
      candidateName: 'Sample Candidate',
      currentRole: 'VP Engineering',
      yearsExperience: 15,
    }),
  },
];

export function AIQuickActions({ title = 'AI Quick Actions', actions = DEFAULT_ACTIONS }: AIQuickActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<{ actionId: string; data: unknown } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: AIQuickAction) => {
    setLoading(action.id);
    setError(null);
    setResult(null);

    try {
      const res = await action.action();
      if (res.success) {
        setResult({ actionId: action.id, data: res.data });
      } else {
        setError(res.error || 'AI request failed');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(null);
    }
  };

  const handleClear = () => {
    setResult(null);
    setError(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-fuchsia" />
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              size="sm"
              onClick={() => handleAction(action)}
              disabled={loading !== null}
              className="flex items-center gap-2"
            >
              {loading === action.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                action.icon
              )}
              {action.label}
            </Button>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center gap-2 py-4 text-text-muted text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-fuchsia" />
            <span>Processing with DeepSeek AI...</span>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="flex items-start gap-2 py-3 px-3 bg-red/5 border border-red/20 text-sm text-red rounded">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
            <button onClick={handleClear} className="ml-auto text-red/60 hover:text-red">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Result display */}
        {result && !loading && !error && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-primary">
                {actions.find(a => a.id === result.actionId)?.label} Result
              </span>
              <button onClick={handleClear} className="text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-bg-warm border border-border p-4 text-sm text-text-primary overflow-x-auto max-h-64 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-xs">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Descriptions */}
        {!loading && !result && !error && (
          <div className="space-y-2">
            {actions.map((action) => (
              <div key={action.id} className="flex items-center gap-2 text-xs text-text-muted">
                {action.icon}
                <span>{action.description}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AIQuickActions;
