import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AssessmentResults, type AssessmentResultsConfig } from '@/components/assessment/results';
import { getSPARKResult, type SPARKAnalysisResult } from '@/services/sparkAnalysis';
import { DS, TEAL, GRAY_600 } from '@/tokens';

// ── MOCK DATA (fallback when no backend result is available) ───────
const mockConfig: AssessmentResultsConfig = {
  assessmentCode: 'SPARK',
  assessmentName: 'SPARK',
  accent: TEAL,
  prefix: 'spark-results',
  overallScore: 68,
  archetype: {
    name: 'AI Strategist',
    description:
      'You see the big picture of AI transformation and lead accordingly. Your strength lies in envisioning how AI can reshape your business, but you may need to strengthen your execution and change management capabilities.',
    traits: [
      'Visionary in identifying AI opportunities',
      'Strategic in thinking about transformation',
      'Transformative in pushing for adoption',
      'May under-invest in operational details',
    ],
  },
  dimensions: [
    { id: 'ai_vision', name: 'AI Vision', score: 88, lowLabel: 'Skeptical', highLabel: 'Visionary', description: 'Your ability to see AI opportunities and implications.' },
    { id: 'data_fluency', name: 'Data Fluency', score: 72, lowLabel: 'Data-averse', highLabel: 'Data-savvy', description: 'Your comfort with data-driven decision making.' },
    { id: 'change_leadership', name: 'Change Leadership', score: 61, lowLabel: 'Change-resistant', highLabel: 'Change leader', description: 'Your ability to lead teams through AI-driven transformation.' },
    { id: 'ethics', name: 'Ethics', score: 79, lowLabel: 'Unconcerned', highLabel: 'Ethically-minded', description: 'Your consideration of ethical implications of AI.' },
    { id: 'innovation', name: 'Innovation', score: 42, lowLabel: 'Traditional', highLabel: 'Innovative', description: 'Your appetite for experimenting with new AI tools and approaches.' },
  ],
  insights: [
    { type: 'strength', title: 'AI Vision is your superpower', text: 'At 88/100, you see AI opportunities others miss. You naturally think about transformation, not just automation.' },
    { type: 'strength', title: 'Ethics aligns with vision', text: 'Your strong Ethics score (79) means you are thinking about responsible AI — a critical differentiator for leaders.' },
    { type: 'gap', title: 'Innovation needs attention', text: 'At 42/100, your appetite for experimentation is low. Vision without experimentation stays theoretical. Start prototyping.' },
    { type: 'gap', title: 'Change leadership gap', text: 'At 61, you can drive change but may struggle with resistance. AI transformation requires sustained change management.' },
  ],
  developmentActions: [
    { priority: 1, dimension: 'Innovation', action: 'Run one AI experiment per month. Start small — a single workflow, a single tool. Document what works.', timeline: '30 days' },
    { priority: 2, dimension: 'Change Leadership', action: 'Identify 3 AI champions in your organization. Build a coalition to drive adoption from within.', timeline: '60 days' },
    { priority: 3, dimension: 'Data Fluency', action: 'Schedule weekly data review sessions. Practice interpreting dashboards without the analytics team.', timeline: '90 days' },
  ],
  retakePath: '/spark/take',
  nexusPath: '/nexus/chat',
};

// ── CONVERT backend result → results config ────────────────────────
function resultToConfig(result: SPARKAnalysisResult): AssessmentResultsConfig {
  const dimNames: Record<string, { name: string; desc: string; low: string; high: string }> = {
    ai_vision: { name: 'AI Vision', desc: 'Your ability to see AI opportunities and implications.', low: 'Skeptical', high: 'Visionary' },
    data_fluency: { name: 'Data Fluency', desc: 'Your comfort with data-driven decision making.', low: 'Data-averse', high: 'Data-savvy' },
    change_leadership: { name: 'Change Leadership', desc: 'Your ability to lead teams through AI-driven transformation.', low: 'Change-resistant', high: 'Change leader' },
    ethics: { name: 'Ethics', desc: 'Your consideration of ethical implications of AI.', low: 'Unconcerned', high: 'Ethically-minded' },
    innovation: { name: 'Innovation', desc: 'Your appetite for experimenting with new AI tools and approaches.', low: 'Traditional', high: 'Innovative' },
  };

  return {
    assessmentCode: 'SPARK',
    assessmentName: 'SPARK',
    accent: TEAL,
    prefix: 'spark-results',
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
    retakePath: '/spark/take',
    nexusPath: '/nexus/chat',
  };
}

export function SparkResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [config, setConfig] = useState<AssessmentResultsConfig | null>(null);

  useEffect(() => {
    if (id) {
      getSPARKResult(id).then((result) => {
        if (result) {
          setConfig(resultToConfig(result));
        } else {
          setConfig(mockConfig);
        }
      });
    } else {
      setConfig(mockConfig);
    }
  }, [id]);

  if (!config) {
    return (
      <div style={{
        background: DS.bgAlt, minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: DS.bodyFont,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 32, height: 32, border: `2px solid ${DS.border}`,
            borderTopColor: TEAL,
            animation: 'spin 350ms linear infinite',
            margin: '0 auto 24px',
          }} />
          <p style={{ color: GRAY_600, fontSize: 14 }}>Loading your results…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return <AssessmentResults config={config} />;
}

export default SparkResultsPage;
