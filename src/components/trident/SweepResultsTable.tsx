import React, { useState, useEffect } from 'react';
import {
  CheckCircle, AlertCircle, X, Sparkles, RefreshCw, Save,
  ChevronUp, ChevronDown, Filter, Search
} from 'lucide-react';
import { Badge, Button, Card, Progress } from '@/components/ui';

interface SweepResultsTableProps {
  mandateId: string;
  contactIds: string[];
  onComplete?: () => void;
}

interface PreflightSummary {
  contact_id: string;
  contact_name: string;
  preflight: {
    overall: 'PROCEED' | 'PROCEED_WITH_FLAGS' | 'HALT';
    flags: string[];
  };
}

interface AISuggestion {
  contact_id: string;
  contact_name: string;
  suggested_d1?: number;
  suggested_d2?: number;
  suggested_d3?: number;
  d1_evidence?: string;
  d2_evidence?: string;
  d3_evidence?: string;
  d1_confidence?: string;
  d2_confidence?: string;
  d3_confidence?: string;
  composite?: number;
  verdict?: string;
  segment?: string;
  preflight_flags?: string[];
  error?: string;
  status?: string;
}

interface HaltedContact {
  contact_id: string;
  reason: string;
}

export function SweepResultsTable({ mandateId, contactIds, onComplete }: SweepResultsTableProps) {
  const [preflightSummary, setPreflightSummary] = useState<PreflightSummary[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [haltedContacts, setHaltedContacts] = useState<HaltedContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'A' | 'B' | 'C'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (mandateId && contactIds.length > 0) {
      runSweep();
    }
  }, [mandateId, contactIds]);

  const runSweep = async () => {
    setLoading(true);
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - start);
    }, 100);

    try {
      const response = await fetch('/api/trident/sweep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_ids: contactIds,
          mandate_id: mandateId,
          mode: 'ai_suggest',
        }),
      });
      const data = await response.json();
      if (data.success) {
        setPreflightSummary(data.preflight_summary);
        setAiSuggestions(data.ai_suggestions);
        setHaltedContacts(data.halted_contacts);
      } else {
        alert(data.error || 'SWEEP failed');
      }
    } catch (err) {
      console.error('Sweep error:', err);
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const updateSuggestion = (contactId: string, field: string, value: any) => {
    setAiSuggestions(prev => prev.map(s =>
      s.contact_id === contactId ? { ...s, [field]: value } : s
    ));
  };

  const acceptAll = async () => {
    setSaving(true);
    try {
      for (const suggestion of aiSuggestions) {
        if (suggestion.error || !suggestion.suggested_d1) continue;
        await fetch('/api/trident/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contact_id: suggestion.contact_id,
            mandate_id: mandateId,
            d1_score: suggestion.suggested_d1,
            d2_score: suggestion.suggested_d2,
            d3_score: suggestion.suggested_d3,
            d1_evidence: suggestion.d1_evidence,
            d2_evidence: suggestion.d2_evidence,
            d3_evidence: suggestion.d3_evidence,
            d1_confidence: suggestion.d1_confidence,
            d2_confidence: suggestion.d2_confidence,
            d3_confidence: suggestion.d3_confidence,
            metadata: { mode: 'sweep', ai_suggested: true },
          }),
        });
      }
      if (onComplete) onComplete();
    } catch (err) {
      console.error('Accept all error:', err);
    } finally {
      setSaving(false);
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'Exceptional Primary': return 'bg-purple-500';
      case 'Strong': return 'bg-green-500';
      case 'Solid': return 'bg-blue-500';
      case 'Conditional': return 'bg-yellow-500';
      case 'Not Recommended': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRowColor = (segment: string) => {
    switch (segment) {
      case 'A': return 'bg-green-50';
      case 'B': return 'bg-yellow-50';
      case 'C': return 'bg-red-50';
      default: return '';
    }
  };

  const filteredSuggestions = aiSuggestions.filter(s => {
    if (s.error) return filter === 'all';
    if (filter === 'all') return true;
    return s.segment === filter;
  }).filter(s =>
    !searchTerm || s.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const passCount = preflightSummary.filter(p => p.preflight.overall !== 'HALT').length;
  const warnCount = preflightSummary.filter(p => p.preflight.overall === 'PROCEED_WITH_FLAGS').length;
  const haltCount = preflightSummary.filter(p => p.preflight.overall === 'HALT').length;

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <Sparkles className="w-12 h-12 mx-auto mb-3 text-accent animate-pulse" />
        <p className="text-text-primary font-medium">Running TRIDENT SWEEP...</p>
        <p className="text-sm text-text-muted mt-2">Processing {contactIds.length} candidates via DeepSeek AI</p>
        <p className="text-xs text-text-muted mt-1">Elapsed: {(elapsedMs / 1000).toFixed(1)}s</p>
        <Progress value={Math.min((elapsedMs / 110000) * 100, 100)} className="h-1 mt-3" />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">TRIDENT SWEEP Results</h3>
            <p className="text-sm text-text-muted">
              {aiSuggestions.length} scored | {haltedContacts.length} halted | {warnCount} flagged
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={runSweep} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-1" /> Re-run
            </Button>
            <Button onClick={acceptAll} disabled={saving || aiSuggestions.length === 0}>
              <Save className="w-4 h-4 mr-1" /> Accept All
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-sm text-green-600">Pass</div>
            <div className="text-2xl font-bold text-green-700">{passCount}</div>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <div className="text-sm text-yellow-600">Warnings</div>
            <div className="text-2xl font-bold text-yellow-700">{warnCount}</div>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="text-sm text-red-600">Halt</div>
            <div className="text-2xl font-bold text-red-700">{haltCount}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-muted" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="px-2 py-1 bg-bg border border-border rounded text-sm"
            >
              <option value="all">All Segments</option>
              <option value="A">Segment A (8+)</option>
              <option value="B">Segment B (6.5-7.9)</option>
              <option value="C">Segment C (&lt;6.5)</option>
            </select>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-2 py-1 bg-bg border border-border rounded text-sm"
            />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-bg-alt text-sm text-text-muted border-b">
                <th className="text-left p-3">Name</th>
                <th className="text-center p-3">D1</th>
                <th className="text-center p-3">D2</th>
                <th className="text-center p-3">D3</th>
                <th className="text-center p-3">Composite</th>
                <th className="text-center p-3">Verdict</th>
                <th className="text-center p-3">Seg</th>
                <th className="text-center p-3">AI Conf</th>
                <th className="text-center p-3">Flags</th>
                <th className="text-center p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuggestions.map(suggestion => {
                const halted = haltedContacts.find(h => h.contact_id === suggestion.contact_id);
                return (
                  <tr
                    key={suggestion.contact_id}
                    className={`border-b hover:bg-bg-alt ${getRowColor(suggestion.segment || '')}`}
                  >
                    <td className="p-3">
                      <div className="font-medium text-text-primary">{suggestion.contact_name}</div>
                      {halted && (
                        <div className="text-xs text-red-600 mt-1">
                          <X className="w-3 h-3 inline mr-1" />{halted.reason}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {editingId === suggestion.contact_id ? (
                        <input
                          type="number"
                          min="1.0"
                          max="10.0"
                          step="0.1"
                          value={suggestion.suggested_d1 || 7}
                          onChange={(e) => updateSuggestion(suggestion.contact_id, 'suggested_d1', parseFloat(e.target.value))}
                          className="w-16 px-1 py-0.5 text-center bg-bg border border-border rounded text-sm"
                          onBlur={() => setEditingId(null)}
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => setEditingId(suggestion.contact_id)}
                          className="font-medium text-text-primary"
                          disabled={!!suggestion.error}
                        >
                          {suggestion.suggested_d1?.toFixed(1) || '-'}
                        </button>
                      )}
                    </td>
                    <td className="p-3 text-center font-medium text-text-primary">
                      {suggestion.suggested_d2?.toFixed(1) || '-'}
                    </td>
                    <td className="p-3 text-center font-medium text-text-primary">
                      {suggestion.suggested_d3?.toFixed(1) || '-'}
                    </td>
                    <td className="p-3 text-center font-bold text-text-primary">
                      {suggestion.composite?.toFixed(1) || '-'}
                    </td>
                    <td className="p-3 text-center">
                      {suggestion.verdict && (
                        <Badge className={`${getVerdictColor(suggestion.verdict)} text-white`}>
                          {suggestion.verdict === 'Exceptional Primary' ? 'Exceptional' : suggestion.verdict}
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {suggestion.segment && (
                        <span className={`text-lg font-bold ${
                          suggestion.segment === 'A' ? 'text-green-600' :
                          suggestion.segment === 'B' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {suggestion.segment}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center text-xs text-text-muted">
                      {suggestion.d1_confidence?.[0] || '-'}/{suggestion.d2_confidence?.[0] || '-'}/{suggestion.d3_confidence?.[0] || '-'}
                    </td>
                    <td className="p-3 text-center">
                      {suggestion.preflight_flags && suggestion.preflight_flags.length > 0 ? (
                        <Badge variant="warning" className="text-xs">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {suggestion.preflight_flags.length}
                        </Badge>
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-500 inline" />
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <Button variant="outline" size="sm" disabled={!!suggestion.error}>
                        Save
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-3 bg-bg-alt">
        <div className="flex items-center justify-between text-sm text-text-muted">
          <span>Credits consumed: 10 (entire SWEEP run)</span>
          <span>Total: {contactIds.length} candidates in {(elapsedMs / 1000).toFixed(1)}s</span>
        </div>
      </Card>
    </div>
  );
}