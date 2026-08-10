import { AssessmentResults, type AssessmentResultsConfig } from '@/components/assessment/results';

const config: AssessmentResultsConfig = {
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
    {
      id: 'vision',
      name: 'Vision',
      score: 85,
      lowLabel: 'Reactive',
      highLabel: 'Visionary',
      description: 'Ability to see and articulate a compelling future state.',
    },
    {
      id: 'resilience',
      name: 'Resilience',
      score: 68,
      lowLabel: 'Fragile',
      highLabel: 'Unshakable',
      description: 'Capacity to maintain composure and recover from setbacks.',
    },
    {
      id: 'influence',
      name: 'Influence',
      score: 74,
      lowLabel: 'Quiet',
      highLabel: 'Magnetic',
      description: 'Ability to persuade and mobilize others toward your vision.',
    },
    {
      id: 'strategy',
      name: 'Strategy',
      score: 91,
      lowLabel: 'Tactical',
      highLabel: 'Strategic',
      description: 'Skill in formulating and executing multi-step plans.',
    },
    {
      id: 'mastery',
      name: 'Mastery',
      score: 42,
      lowLabel: 'Generalist',
      highLabel: 'Expert',
      description: 'Depth of expertise in your core domain.',
    },
  ],
  insights: [
    {
      type: 'strength',
      title: 'Strategy is your superpower',
      text: 'At the 91st percentile, your strategic thinking places you in the top quartile of senior executives. You naturally see patterns and connections others miss.',
    },
    {
      type: 'strength',
      title: 'Vision aligns with strategy',
      text: 'Your Vision score (85) and Strategy score (91) are both exceptionally high, making you a natural architect of change — you can see the future and build the path to it.',
    },
    {
      type: 'gap',
      title: 'Mastery needs attention',
      text: 'Your lowest dimension (42) suggests you may be spreading yourself too thin. Consider deepening expertise in one or two core domains to match your strategic breadth.',
    },
    {
      type: 'gap',
      title: 'Resilience under pressure',
      text: 'At 68, your resilience is solid but not elite. High-stakes environments may test your composure. Mindfulness and stress-management practices could yield quick wins.',
    },
  ],
  developmentActions: [
    {
      priority: 1,
      dimension: 'Mastery',
      action: 'Identify one domain where you can go from competent to expert. Dedicate 4 hours per week to deliberate practice in that area for the next 90 days.',
      timeline: '90 days',
    },
    {
      priority: 2,
      dimension: 'Resilience',
      action: 'Build a daily 10-minute mindfulness or reflection practice. Track your composure in high-stakes meetings and identify your top 3 stress triggers.',
      timeline: '30 days',
    },
    {
      priority: 3,
      dimension: 'Influence',
      action: 'Schedule 3 cross-functional conversations per month. Practice the "consult before deciding" pattern to strengthen your coalition-building muscle.',
      timeline: '60 days',
    },
  ],
  retakePath: '/prism/take',
  nexusPath: '/nexus/chat',
};

export function PrismResultsPage() {
  return <AssessmentResults config={config} />;
}

export default PrismResultsPage;
