import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AssessmentResults, type AssessmentResultsConfig } from '@/components/assessment/results';
import { getPRISMResult, type PRISMAnalysisResult } from '@/services/prismAnalysis';

// ── MOCK DATA (fallback when no backend result is available) ───────
const mockConfig: AssessmentResultsConfig = {
  assessmentCode: 'PRISM',
  assessmentName: 'PRISM',
  accent: '#C108AB',
  prefix: 'prism-results',
  overallScore: 72,
  archetype: {
    name: 'Strategic Architect',
    description:
      'You see the big picture and build systems to get there. Your strength lies in translating vision into structured plans, but you may sometimes overlook the human element in execution. Your peers rely on you for direction in ambiguity.',
    traits: [
      'Thinks in systems and frameworks, not just tasks',
      'Naturally gravitates toward long-term planning',
      'Comfortable making decisions with incomplete information',
      'May under-invest in relationship building',
    ],
  },
  dimensions: [
    { id: 'vision', name: 'Vision', score: 85, lowLabel: 'Tactical', highLabel: 'Visionary', description: 'Ability to see and articulate a compelling future state.' },
    { id: 'resilience', name: 'Resilience', score: 68, lowLabel: 'Sensitive', highLabel: 'Resilient', description: 'Capacity to maintain composure and recover from setbacks.' },
    { id: 'influence', name: 'Influence', score: 74, lowLabel: 'Reserved', highLabel: 'Influential', description: 'Ability to persuade and mobilize others toward your vision.' },
    { id: 'strategy', name: 'Strategy', score: 91, lowLabel: 'Reactive', highLabel: 'Strategic', description: 'Skill in formulating and executing multi-step plans.' },
    { id: 'mastery', name: 'Mastery', score: 42, lowLabel: 'Generalist', highLabel: 'Expert', description: 'Depth of expertise in your core domain.' },
  ],
  insights: [
    { type: 'strength', title: 'Strategy is your superpower', text: 'At the 91st percentile, your strategic thinking places you in the top quartile of senior executives. You naturally see patterns and connections others miss.' },
    { type: 'strength', title: 'Vision aligns with strategy', text: 'Your Vision score (85) and Strategy score (91) are both exceptionally high, making you a natural architect of change.' },
    { type: 'gap', title: 'Mastery needs attention', text: 'Your lowest dimension (42) suggests you may be spreading yourself too thin. Consider deepening expertise in one or two core domains.' },
    { type: 'gap', title: 'Resilience under pressure', text: 'At 68, your resilience is solid but not elite. High-stakes environments may test your composure.' },
  ],
  developmentActions: [
    { priority: 1, dimension: 'Mastery', action: 'Identify one domain where you can go from competent to expert. Dedicate 4 hours per week to deliberate practice for the next 90 days.', timeline: '90 days' },
    { priority: 2, dimension: 'Resilience', action: 'Build a daily 10-minute mindfulness or reflection practice. Track your composure in high-stakes meetings.', timeline: '30 days' },
    { priority: 3, dimension: 'Influence', action: 'Schedule 3 cross-functional conversations per month. Practice the "consult before deciding" pattern.', timeline: '60 days' },
  ],
  retakePath: '/prism/take',
  nexusPath: '/nexus/chat',
};

// ── CONVERT backend result → results config ────────────────────────
function resultToConfig(result: PRISMAnalysisResult): AssessmentResultsConfig {
  const dimNames: Record<string, { name: string; desc: string; low: string; high: string }> = {
    vision: { name: 'Vision', desc: 'Ability to see and articulate a compelling future state.', low: 'Tactical', high: 'Visionary' },
    resilience: { name: 'Resilience', desc: 'Capacity to maintain composure and recover from setbacks.', low: 'Sensitive', high: 'Resilient' },
    influence: { name: 'Influence', desc: 'Ability to persuade and mobilize others toward your vision.', low: 'Reserved', high: 'Influential' },
    strategy: { name: 'Strategy', desc: 'Skill in formulating and executing multi-step plans.', low: 'Reactive', high: 'Strategic' },
    mastery: { name: 'Mastery', desc: 'Depth of expertise in your core domain.', low: 'Generalist', high: 'Expert' },
  };

  return {
    assessmentCode: 'PRISM',
    assessmentName: 'PRISM',
    accent: '#C108AB',
    prefix: 'prism-results',
    overallScore: result.composite_score,
    archetype: {
      name: result.archetype,
      description: result.archetype_description,
      traits: result.archetype_traits,
    },
    dimensions: Object.entries(result.dimension_scores).map(([id, score]) => ({
      id,
      name: dimNames[id]?.name || id,
      score,
      lowLabel: dimNames[id]?.low || 'Low',
      highLabel: dimNames[id]?.high || 'High',
      description: dimNames[id]?.desc || '',
    })),
    insights: [
      ...result.strengths.map(s => ({ title: s.title, text: s.text, type: 'strength' as const })),
      ...result.gaps.map(g => ({ title: g.title, text: g.text, type: 'gap' as const })),
    ],
    developmentActions: result.development_actions,
    retakePath: '/prism/take',
    nexusPath: '/nexus/chat',
  };
}

export function PrismResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [config, setConfig] = useState<AssessmentResultsConfig | null>(null);

  useEffect(() => {
    // If we have an ID, try to fetch real results
    if (id) {
      getPRISMResult(id).then((result) => {
        if (result) {
          setConfig(resultToConfig(result));
        } else {
          setConfig(mockConfig); // fallback to mock
        }
      });
    } else {
      setConfig(mockConfig); // no ID — show mock data
    }
  }, [id]);

  if (!config) {
    return (
      <div style={{
        background: '#F5F5F3', minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 32, height: 32, border: '2px solid #E8E8E5',
            borderTopColor: '#C108AB',
            animation: 'spin 350ms linear infinite',
            margin: '0 auto 24px',
          }} />
          <p style={{ color: '#4B5563', fontSize: 14 }}>Loading your results…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return <AssessmentResults config={config} />;
}

export default PrismResultsPage;
