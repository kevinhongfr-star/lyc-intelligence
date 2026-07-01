import React, { useState, useEffect } from 'react';
import {
  Save, ChevronRight, AlertCircle, CheckCircle, X, Star,
  Sparkles, Target, TrendingUp, Award, Clock, FileText
} from 'lucide-react';
import { Badge, Button, Card, Progress, Textarea } from '@/components/ui';

interface TridentScorePanelProps {
  contactId: string;
  mandateId?: string;
  onSave?: (scorecard: any) => void;
  onNext?: () => void;
}

interface SubDimensions {
  sector_expertise?: number;
  analytical_depth?: number;
  industry_knowledge?: number;
  technical_fluency?: number;
  outcomes?: number;
  stakeholder_impact?: number;
  execution?: number;
  leadership?: number;
  resilience?: number;
  ambition?: number;
  cultural_adaptability?: number;
  learning_agility?: number;
}

export function TridentScorePanel({ contactId, mandateId, onSave, onNext }: TridentScorePanelProps) {
  const [contact, setContact] = useState<any>(null);
  const [preflight, setPreflight] = useState<any>(null);
  const [d1Score, setD1Score] = useState(7.0);
  const [d2Score, setD2Score] = useState(7.0);
  const [d3Score, setD3Score] = useState(7.0);
  const [d1Sub, setD1Sub] = useState<SubDimensions>({});
  const [d2Sub, setD2Sub] = useState<SubDimensions>({});
  const [d3Sub, setD3Sub] = useState<SubDimensions>({});
  const [d1Evidence, setD1Evidence] = useState('');
  const [d2Evidence, setD2Evidence] = useState('');
  const [d3Evidence, setD3Evidence] = useState('');
  const [d1Confidence, setD1Confidence] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [d2Confidence, setD2Confidence] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [d3Confidence, setD3Confidence] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [recommendation, setRecommendation] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPreflight, setShowPreflight] = useState(true);

  useEffect(() => {
    runPreflight();
  }, [contactId]);

  const runPreflight = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/trident/preflight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_id: contactId, mandate_id: mandateId }),
      });
      const data = await response.json();
      if (data.success) {
        setPreflight(data.preflight);
        setContact(data.contact);
      }
    } catch (err) {
      console.error('Preflight error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!d1Evidence || !d2Evidence || !d3Evidence) {
      alert('Evidence is required for all 3 dimensions');
      return;
    }

    if (preflight?.overall === 'HALT') {
      alert('Pre-flight check failed — cannot score this candidate');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/trident/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: contactId,
          mandate_id: mandateId,
          d1_score: d1Score,
          d2_score: d2Score,
          d3_score: d3Score,
          d1_sub: d1Sub,
          d2_sub: d2Sub,
          d3_sub: d3Sub,
          d1_evidence: d1Evidence,
          d2_evidence: d2Evidence,
          d3_evidence: d3Evidence,
          d1_confidence: d1Confidence,
          d2_confidence: d2Confidence,
          d3_confidence: d3Confidence,
          recommendation,
        }),
      });

      const data = await response.json();
      if (data.success) {
        if (onSave) onSave(data.scorecard);
        if (onNext) onNext();
      } else {
        alert(data.error || 'Failed to save scorecard');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save scorecard');
    } finally {
      setSaving(false);
    }
  };

  const composite = Math.round((d1Score * 0.30 + d2Score * 0.40 + d3Score * 0.30) * 10) / 10;

  const getVerdict = (score: number) => {
    if (score >= 9.0) return 'Exceptional Primary';
    if (score >= 8.0) return 'Strong';
    if (score >= 7.0) return 'Solid';
    if (score >= 6.0) return 'Conditional';
    return 'Not Recommended';
  };

  const getSegment = (score: number) => {
    if (score >= 8.0) return 'A';
    if (score >= 6.5) return 'B';
    return 'C';
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'Exceptional Primary': return 'bg-purple-500 text-white';
      case 'Strong': return 'bg-green-500 text-white';
      case 'Solid': return 'bg-blue-500 text-white';
      case 'Conditional': return 'bg-yellow-500 text-white';
      case 'Not Recommended': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getSegmentColor = (seg: string) => {
    switch (seg) {
      case 'A': return 'text-green-600';
      case 'B': return 'text-yellow-600';
      case 'C': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const ScoreSlider = ({
    label,
    value,
    onChange,
    confidence,
    onConfidenceChange,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    confidence: 'High' | 'Medium' | 'Low';
    onConfidenceChange: (c: 'High' | 'Medium' | 'Low') => void;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-text-primary">{label}</label>
        <span className="text-2xl font-bold text-accent">{value.toFixed(1)}</span>
      </div>
      <input
        type="range"
        min="1.0"
        max="10.0"
        step="0.1"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-bg-alt rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>1.0</span>
        <span>10.0</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted">Confidence:</span>
        {(['High', 'Medium', 'Low'] as const).map(c => (
          <button
            key={c}
            onClick={() => onConfidenceChange(c)}
            className={`px-2 py-1 text-xs rounded ${
              confidence === c ? 'bg-accent text-white' : 'bg-bg-alt text-text-muted'
            }`}
          >
            {c[0]}
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Sparkles className="w-8 h-8 mx-auto mb-3 text-accent animate-pulse" />
        <p className="text-text-muted">Running pre-flight checks...</p>
      </div>
    );
  }

  if (preflight?.overall === 'HALT') {
    return (
      <Card className="p-6 border-red-500">
        <div className="flex items-center gap-3 mb-4">
          <X className="w-6 h-6 text-red-500" />
          <h3 className="text-lg font-semibold text-red-500">Pre-flight HALT</h3>
        </div>
        <p className="text-text-muted mb-3">
          This candidate cannot be scored due to pre-flight failures:
        </p>
        <ul className="space-y-1">
          {preflight?.flags?.map((flag: string, i: number) => (
            <li key={i} className="text-sm text-red-600">• {flag}</li>
          ))}
        </ul>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Left Panel: Candidate Profile */}
      <div className="col-span-3 space-y-3">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-text-muted mb-3">Candidate</h3>
          <div className="space-y-2">
            <div>
              <div className="text-lg font-semibold text-text-primary">{contact?.name}</div>
              <div className="text-sm text-text-muted">{contact?.company || '-'}</div>
            </div>
            {contact?.pipeline_stage && (
              <Badge variant="secondary">{contact.pipeline_stage}</Badge>
            )}
            {contact?.data_confidence && (
              <div>
                <div className="text-xs text-text-muted mb-1">Data Confidence</div>
                <Progress value={contact.data_confidence * 100} className="h-2" />
              </div>
            )}
          </div>
        </Card>

        {preflight && preflight.overall !== 'HALT' && (
          <Card className="p-4">
            <h3 className="text-sm font-medium text-text-muted mb-3">Pre-flight</h3>
            <div className="space-y-1">
              {Object.entries(preflight).filter(([k]) => k.endsWith('_verification') || k === 'jd_alignment' || k === 'signal_integrity' || k === 'trident_readiness' || k === 'compliance_conflict').map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 text-xs">
                  {value === 'PASS' && <CheckCircle className="w-3 h-3 text-green-500" />}
                  {value === 'WARN' && <AlertCircle className="w-3 h-3 text-yellow-500" />}
                  {value === 'HALT' && <X className="w-3 h-3 text-red-500" />}
                  <span className="text-text-muted">{key.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
            {preflight.flags && preflight.flags.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border">
                <div className="text-xs text-yellow-600">
                  {preflight.flags.length} flag{preflight.flags.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Center Panel: Scoring */}
      <div className="col-span-6 space-y-4">
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            <h3 className="font-semibold text-text-primary">D1: Domain & Intelligence (30%)</h3>
          </div>
          <ScoreSlider
            label="Score"
            value={d1Score}
            onChange={setD1Score}
            confidence={d1Confidence}
            onConfidenceChange={setD1Confidence}
          />
          <Textarea
            placeholder="Evidence: Specific facts, company names, achievements..."
            value={d1Evidence}
            onChange={(e) => setD1Evidence(e.target.value)}
            rows={3}
          />
          <div className="grid grid-cols-4 gap-2">
            {(['sector_expertise', 'analytical_depth', 'industry_knowledge', 'technical_fluency'] as const).map(key => (
              <div key={key}>
                <label className="text-xs text-text-muted">{key.replace(/_/g, ' ')}</label>
                <input
                  type="number"
                  min="1.0"
                  max="10.0"
                  step="0.1"
                  value={d1Sub[key] || ''}
                  onChange={(e) => setD1Sub({ ...d1Sub, [key]: parseFloat(e.target.value) || undefined })}
                  className="w-full px-2 py-1 text-sm bg-bg border border-border rounded"
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            <h3 className="font-semibold text-text-primary">D2: Delivery & Influence (40%)</h3>
          </div>
          <ScoreSlider
            label="Score"
            value={d2Score}
            onChange={setD2Score}
            confidence={d2Confidence}
            onConfidenceChange={setD2Confidence}
          />
          <Textarea
            placeholder="Evidence: Quantified outcomes, stakeholder impact, leadership..."
            value={d2Evidence}
            onChange={(e) => setD2Evidence(e.target.value)}
            rows={3}
          />
          <div className="grid grid-cols-4 gap-2">
            {(['outcomes', 'stakeholder_impact', 'execution', 'leadership'] as const).map(key => (
              <div key={key}>
                <label className="text-xs text-text-muted">{key.replace(/_/g, ' ')}</label>
                <input
                  type="number"
                  min="1.0"
                  max="10.0"
                  step="0.1"
                  value={d2Sub[key] || ''}
                  onChange={(e) => setD2Sub({ ...d2Sub, [key]: parseFloat(e.target.value) || undefined })}
                  className="w-full px-2 py-1 text-sm bg-bg border border-border rounded"
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-accent" />
            <h3 className="font-semibold text-text-primary">D3: Drive & Dynamics (30%)</h3>
          </div>
          <ScoreSlider
            label="Score"
            value={d3Score}
            onChange={setD3Score}
            confidence={d3Confidence}
            onConfidenceChange={setD3Confidence}
          />
          <Textarea
            placeholder="Evidence: Resilience, ambition, cultural fit, learning agility..."
            value={d3Evidence}
            onChange={(e) => setD3Evidence(e.target.value)}
            rows={3}
          />
          <div className="grid grid-cols-4 gap-2">
            {(['resilience', 'ambition', 'cultural_adaptability', 'learning_agility'] as const).map(key => (
              <div key={key}>
                <label className="text-xs text-text-muted">{key.replace(/_/g, ' ')}</label>
                <input
                  type="number"
                  min="1.0"
                  max="10.0"
                  step="0.1"
                  value={d3Sub[key] || ''}
                  onChange={(e) => setD3Sub({ ...d3Sub, [key]: parseFloat(e.target.value) || undefined })}
                  className="w-full px-2 py-1 text-sm bg-bg border border-border rounded"
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <label className="text-sm font-medium text-text-primary mb-2 block">Recommendation (optional)</label>
          <Textarea
            placeholder="Narrative recommendation for this candidate..."
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
            rows={3}
          />
        </Card>
      </div>

      {/* Right Panel: Composite */}
      <div className="col-span-3 space-y-3">
        <Card className="p-4 sticky top-4">
          <div className="text-center">
            <div className="text-sm text-text-muted mb-2">COMPOSITE</div>
            <div className="text-5xl font-bold text-text-primary mb-2">{composite.toFixed(1)}</div>
            <div className="text-sm text-text-muted">/ 10.0</div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-center">
              <div className="text-sm text-text-muted mb-2">VERDICT</div>
              <Badge className={`text-lg px-3 py-1 ${getVerdictColor(getVerdict(composite))}`}>
                {getVerdict(composite)}
              </Badge>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-center">
              <div className="text-sm text-text-muted mb-2">SEGMENT</div>
              <div className={`text-4xl font-bold ${getSegmentColor(getSegment(composite))}`}>
                {getSegment(composite)}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-sm text-text-muted mb-2">REVIEW STATUS</div>
            <Badge variant="warning">⏳ Pending</Badge>
          </div>

          <div className="mt-4 space-y-2">
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={saving || !d1Evidence || !d2Evidence || !d3Evidence}
            >
              {saving ? <Clock className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Save Scorecard
            </Button>
            <Button variant="outline" className="w-full" onClick={onNext}>
              Save & Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="mt-4 pt-4 border-t border-border text-center text-xs text-text-muted">
            <div>10 credits will be consumed</div>
            <div className="mt-1">⌘+S to save | ⌘+⏎ for next</div>
          </div>
        </Card>
      </div>
    </div>
  );
}