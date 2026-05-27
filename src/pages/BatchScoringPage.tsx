import React, { useState } from 'react';
import { Upload, Play, Loader2, Plus, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, Progress } from '@/components/ui';
import { scoreCandidateWithAI } from '@/services/coze';
import { computeTRIDENT } from '@/services/tridentScoring';
import { getSupabase } from '@/services/supabaseApi';

interface CandidateInput { name: string; cv: string; }
interface ScoreResult { name: string; d1: number; d2: number; d3: number; composite: number; verdict: string; tier: string; reasoning: string; }

export function BatchScoringPage() {
  const [jd, setJd] = useState('');
  const [candidates, setCandidates] = useState<CandidateInput[]>([{ name: '', cv: '' }]);
  const [results, setResults] = useState<ScoreResult[]>([]);
  const [scoring, setScoring] = useState(false);
  const [progress, setProgress] = useState(0);

  const addCandidate = () => setCandidates([...candidates, { name: '', cv: '' }]);
  const removeCandidate = (i: number) => setCandidates(candidates.filter((_, idx) => idx !== i));
  const updateCandidate = (i: number, field: keyof CandidateInput, val: string) => { const c = [...candidates]; c[i] = { ...c[i], [field]: val }; setCandidates(c); };

  const runScoring = async () => {
    setScoring(true); setProgress(0); setResults([]);
    const valid = candidates.filter(c => c.name && c.cv);
    for (let i = 0; i < valid.length; i++) {
      const score = await scoreCandidateWithAI(jd, valid[i].cv);
      if (score) {
        const result = computeTRIDENT({ d1: score.d1, d2: score.d2, d3: score.d3 });
        setResults(prev => [...prev, { name: valid[i].name, d1: score.d1, d2: score.d2, d3: score.d3, composite: result.composite, verdict: result.verdict, tier: result.tier, reasoning: score.reasoning }]);
      }
      setProgress(Math.round(((i + 1) / valid.length) * 100));
    }
    setScoring(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif font-bold text-text-primary">Batch Scoring</h1>
      <Card><CardHeader><CardTitle>Job Description</CardTitle></CardHeader><CardContent><textarea value={jd} onChange={e => setJd(e.target.value)} placeholder="Paste the JD here..." className="w-full h-40 bg-bg-tertiary border border-bg-hover rounded-lg p-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent" /></CardContent></Card>
      <Card><CardHeader><div className="flex items-center justify-between"><CardTitle>Candidates ({candidates.length})</CardTitle><Button variant="outline" size="sm" onClick={addCandidate}><Plus className="w-3 h-3 mr-1" />Add</Button></div></CardHeader><CardContent className="space-y-3">{candidates.map((c, i) => (
        <div key={i} className="bg-bg-tertiary rounded-lg p-3"><div className="flex gap-2 mb-2"><Input placeholder="Candidate name" value={c.name} onChange={e => updateCandidate(i, 'name', e.target.value)} className="max-w-xs" /><button onClick={() => removeCandidate(i)} className="text-text-muted hover:text-red-400"><X className="w-4 h-4" /></button></div><textarea placeholder="Paste CV or profile..." value={c.cv} onChange={e => updateCandidate(i, 'cv', e.target.value)} className="w-full h-24 bg-bg-secondary border border-bg-hover rounded-lg p-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent" /></div>
      ))}</CardContent></Card>
      <div className="flex items-center gap-4"><Button onClick={runScoring} disabled={scoring || !jd || candidates.every(c => !c.name)}>{scoring ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Scoring... ({progress}%)</> : <><Play className="w-4 h-4 mr-2" />Run Match Sweep</>}</Button>{scoring && <Progress value={progress} className="max-w-xs" />}</div>
      {results.length > 0 && <Card><CardHeader><CardTitle>Results ({results.length} scored)</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-bg-tertiary"><th className="text-left py-2 text-text-muted font-medium">Name</th><th className="text-center py-2 text-text-muted font-medium">D1</th><th className="text-center py-2 text-text-muted font-medium">D2</th><th className="text-center py-2 text-text-muted font-medium">D3</th><th className="text-center py-2 text-text-muted font-medium">Composite</th><th className="text-center py-2 text-text-muted font-medium">Verdict</th><th className="text-center py-2 text-text-muted font-medium">Tier</th></tr></thead><tbody>{results.sort((a, b) => b.composite - a.composite).map((r, i) => (
        <tr key={i} className="border-b border-bg-tertiary"><td className="py-2 text-text-primary">{r.name}</td><td className="text-center py-2">{r.d1}</td><td className="text-center py-2">{r.d2}</td><td className="text-center py-2">{r.d3}</td><td className="text-center py-2 font-bold">{r.composite}</td><td className="text-center py-2"><Badge variant={r.composite >= 75 ? 'success' : r.composite >= 50 ? 'warning' : 'default'}>{r.verdict}</Badge></td><td className="text-center py-2">{r.tier}</td></tr>
      ))}</tbody></table></div></CardContent></Card>}
    </div>
  );
}
