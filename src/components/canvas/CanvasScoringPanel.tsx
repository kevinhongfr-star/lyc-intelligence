import React, { useState, useEffect } from 'react';
import { Sparkles, Star, Target, Users, Brain, Heart, Info, ChevronRight, Save, RefreshCw } from 'lucide-react';
import { Badge, Button, Card, Progress, Textarea, Input } from '@/components/ui';
import { authFetch } from '@/utils/authFetch';

interface CanvasScoringPanelProps {
  scorecardId: string;
  contactId: string;
  mandateId?: string;
  onGenerate?: (profile: any) => void;
}

export function CanvasScoringPanel({ scorecardId, contactId, mandateId, onGenerate }: CanvasScoringPanelProps) {
  const [tridentSummary, setTridentSummary] = useState<any>(null);
  const [suggestedScores, setSuggestedScores] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [scores, setScores] = useState({
    strategic_thinking: 7.0,
    communication: 7.0,
    adaptability: 7.0,
    team_leadership: 7.0,
    decision_making: 7.0,
    emotional_intelligence: 7.0,
  });
  const [notes, setNotes] = useState({
    strategic_thinking: '',
    communication: '',
    adaptability: '',
    team_leadership: '',
    decision_making: '',
    emotional_intelligence: '',
  });

  useEffect(() => {
    fetchPrefill();
  }, [scorecardId]);

  async function fetchPrefill() {
    try {
      const res = await authFetch(`/api/canvas/prefill`, {
        method: 'POST',
        body: JSON.stringify({ scorecard_id: scorecardId }),
      });
      const data = await res.json();
      if (data.success) {
        setSuggestedScores(data.suggested_scores);
        setTridentSummary(data.trident_summary);
        setScores({
          strategic_thinking: data.suggested_scores.strategic_thinking,
          communication: data.suggested_scores.communication,
          adaptability: data.suggested_scores.adaptability,
          team_leadership: data.suggested_scores.team_leadership,
          decision_making: data.suggested_scores.decision_making,
          emotional_intelligence: data.suggested_scores.emotional_intelligence,
        });
      }
    } catch (err) {
      console.error('Prefill failed:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleScoreChange(dimension: keyof typeof scores, value: number) {
    setScores(prev => ({ ...prev, [dimension]: Number(value.toFixed(1)) }));
  }

  function handleNoteChange(dimension: keyof typeof notes, value: string) {
    setNotes(prev => ({ ...prev, [dimension]: value }));
  }

  const composite = Number((Object.values(scores).reduce((a, b) => a + b, 0) / 6).toFixed(1));
  const grade = composite >= 9.0 ? 'A+' : composite >= 8.0 ? 'A' : composite >= 7.0 ? 'B' : composite >= 6.0 ? 'C' : 'F';

  const gradeColors: Record<string, string> = {
    'A+': 'bg-green-500',
    'A': 'bg-emerald-500',
    'B': 'bg-amber-500',
    'C': 'bg-orange-500',
    'F': 'bg-red-500',
  };

  const dimensions = [
    { key: 'strategic_thinking', label: 'Strategic Thinking', icon: Target, mapping: 'D1 → ST' },
    { key: 'communication', label: 'Communication', icon: Users, mapping: 'D2 → Comm' },
    { key: 'adaptability', label: 'Adaptability', icon: RefreshCw, mapping: 'D3 → Adapt' },
    { key: 'team_leadership', label: 'Team Leadership', icon: Users, mapping: 'D2 → TL' },
    { key: 'decision_making', label: 'Decision Making', icon: Brain, mapping: 'D1×D3 → DM' },
    { key: 'emotional_intelligence', label: 'Emotional Intelligence', icon: Heart, mapping: 'D3 → EQ' },
  ] as const;

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await authFetch(`/api/canvas/generate`, {
        method: 'POST',
        body: JSON.stringify({
          contact_id: contactId,
          mandate_id: mandateId,
          scorecard_id: scorecardId,
          c_strategic_thinking: scores.strategic_thinking,
          c_communication: scores.communication,
          c_adaptability: scores.adaptability,
          c_team_leadership: scores.team_leadership,
          c_decision_making: scores.decision_making,
          c_emotional_intelligence: scores.emotional_intelligence,
          canvas_notes: notes,
        }),
      });
      const data = await res.json();
      if (data.success && onGenerate) {
        onGenerate(data.profile);
      }
    } catch (err) {
      console.error('Generate failed:', err);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="flex gap-6 h-full">
      <div className="w-1/4 bg-gray-50 rounded-none p-6 overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">TRIDENT Summary</h3>
        </div>
        {tridentSummary && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">D1 (Domain)</span>
              <span className="font-bold text-blue-600">{tridentSummary.d1}/10</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">D2 (Delivery)</span>
              <span className="font-bold text-green-600">{tridentSummary.d2}/10</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">D3 (Drive)</span>
              <span className="font-bold text-purple-600">{tridentSummary.d3}/10</span>
            </div>
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Composite</span>
                <span className="font-bold text-gray-800">{tridentSummary.composite}/10</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-gray-600">Verdict</span>
                <Badge className={`${tridentSummary.verdict === 'Exceptional Primary' || tridentSummary.verdict === 'Strong' ? 'bg-green-100 text-green-700' : tridentSummary.verdict === 'Solid' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                  {tridentSummary.verdict}
                </Badge>
              </div>
            </div>
          </div>
        )}
        <div className="mt-6 p-3 bg-blue-50 rounded-none">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed">
              {suggestedScores?.mapping_notes}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-none p-6 overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-6">CANVAS 6 Dimensions</h2>
        <div className="grid grid-cols-2 gap-6">
          {dimensions.map((dim) => (
            <Card key={dim.key} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <dim.icon className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-700">{dim.label}</span>
                </div>
                <Badge variant="outline" className="text-xs">{dim.mapping}</Badge>
              </div>
              <div className="mb-3">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={scores[dim.key]}
                  onChange={(e) => handleScoreChange(dim.key, parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-none appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-gray-500">1.0</span>
                  <span className="font-bold text-blue-600">{scores[dim.key].toFixed(1)}/10</span>
                  <span className="text-sm text-gray-500">10.0</span>
                </div>
              </div>
              <Textarea
                placeholder="Consultant note (optional, ≤50 words)"
                value={notes[dim.key]}
                onChange={(e) => handleNoteChange(dim.key, e.target.value)}
                className="h-16 text-sm"
                maxLength={50}
              />
            </Card>
          ))}
        </div>
      </div>

      <div className="w-1/4 bg-gray-50 rounded-none p-6 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="text-5xl font-bold text-gray-800 mb-1">{composite.toFixed(1)}</div>
          <div className="text-gray-500 mb-4">CANVAS Composite</div>
          <Badge className={`text-xl px-4 py-2 ${gradeColors[grade]} text-white font-bold`}>
            Grade {grade}
          </Badge>
        </div>
        <div className="mt-8 w-full">
          <Progress value={(composite / 10) * 100} className="h-3" />
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>1.0</span>
            <span>10.0</span>
          </div>
        </div>
        <div className="mt-6 w-full space-y-2">
          <div className="text-xs text-gray-600 font-medium">TRIDENT → CANVAS MAPPING</div>
          <div className="text-xs text-gray-500 space-y-1">
            <div>D1 → Strategic Thinking</div>
            <div>D2 → Communication, Team Leadership</div>
            <div>D3 → Adaptability, EQ</div>
            <div>D1×D3 → Decision Making</div>
          </div>
        </div>
        <Button
          className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2" />
              Generate Narrative
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
