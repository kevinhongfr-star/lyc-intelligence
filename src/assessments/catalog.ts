export function getB2CName(type: string): string { return type; }

export interface AssessmentDimension {
  id: string;
  name: string;
  description: string;
  lowLabel: string;
  highLabel: string;
}

export interface AssessmentStyle {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface AssessmentArchetype {
  name: string;
  description: string;
  traits: string[];
}

export interface AssessmentInfo {
  name: string;
  b2cName: string;
  shortName: string;
  dimensions: AssessmentDimension[];
  styles: AssessmentStyle[];
  archetypes: AssessmentArchetype[];
}

export const ASSESSMENT_CATALOG: Record<string, AssessmentInfo> = {
  PRISM: {
    name: 'PRISM',
    b2cName: 'Career & Professional Branding',
    shortName: 'Career & Professional Branding',
    dimensions: [
      { id: 'vision', name: 'Vision', description: 'Your ability to see the big picture and set strategic direction', lowLabel: 'Tactical', highLabel: 'Visionary' },
      { id: 'resilience', name: 'Resilience', description: 'How you handle setbacks and bounce back from challenges', lowLabel: 'Sensitive', highLabel: 'Resilient' },
      { id: 'influence', name: 'Influence', description: 'Your ability to persuade and impact others', lowLabel: 'Reserved', highLabel: 'Influential' },
      { id: 'strategy', name: 'Strategy', description: 'Your approach to planning and decision-making', lowLabel: 'Reactive', highLabel: 'Strategic' },
      { id: 'mastery', name: 'Mastery', description: 'Your pursuit of excellence and expertise', lowLabel: 'Generalist', highLabel: 'Expert' },
    ],
    styles: [
      { id: 'analytical', name: 'Analytical', description: 'Data-driven, logical, and precise in communication', icon: '🔬' },
      { id: 'visionary', name: 'Visionary', description: 'Inspiring, future-focused, and motivational', icon: '🔭' },
      { id: 'pragmatic', name: 'Pragmatic', description: 'Practical, results-oriented, and action-focused', icon: '⚙️' },
      { id: 'empathetic', name: 'Empathetic', description: 'Warm, understanding, and people-centered', icon: '💡' },
    ],
    archetypes: [
      { name: 'Strategic Architect', description: 'You excel at long-term planning and positioning organizations for future success.', traits: ['Long-term thinker', 'Systems-oriented', 'Change catalyst'] },
      { name: 'Resilient Operator', description: 'You thrive under pressure and turn challenges into opportunities.', traits: ['Crisis manager', 'Adaptable', 'Persistent'] },
      { name: 'Influential Leader', description: 'You naturally inspire and mobilize others toward shared goals.', traits: ['Natural communicator', 'Relationship builder', 'Persuasive'] },
      { name: 'Masterful Expert', description: 'You combine deep expertise with continuous growth mindset.', traits: ['Life-long learner', 'Knowledge sharer', 'Quality-driven'] },
    ],
  },
  FORGE: {
    name: 'FORGE',
    b2cName: 'Sales Excellence',
    shortName: 'Sales Excellence',
    dimensions: [
      { id: 'drive', name: 'Drive', description: 'Your motivation and persistence in pursuing goals', lowLabel: 'Casual', highLabel: 'Tenacious' },
      { id: 'relationship', name: 'Relationship', description: 'Your ability to build and maintain professional connections', lowLabel: 'Transactional', highLabel: 'Relationship-focused' },
      { id: 'strategy', name: 'Strategy', description: 'Your approach to sales planning and execution', lowLabel: 'Reactive', highLabel: 'Strategic' },
      { id: 'execution', name: 'Execution', description: 'Your ability to close deals and deliver results', lowLabel: 'Slow', highLabel: 'Closer' },
      { id: 'adaptability', name: 'Adaptability', description: 'How you adjust to different buyer personalities and situations', lowLabel: 'Rigid', highLabel: 'Adaptive' },
    ],
    styles: [
      { id: 'analytical', name: 'Analytical', description: 'Methodical, data-backed, consultative selling', icon: '🔬' },
      { id: 'visionary', name: 'Visionary', description: 'Inspiring, big-picture, outcome-focused', icon: '🔭' },
      { id: 'pragmatic', name: 'Pragmatic', description: 'Direct, efficient, results-driven', icon: '⚙️' },
      { id: 'empathetic', name: 'Empathetic', description: 'Relationship-first, consultative, patient', icon: '💡' },
    ],
    archetypes: [
      { name: 'Trusted Advisor', description: 'You build deep relationships and become a valued partner to clients.', traits: ['Consultative', 'Patient', 'Trusted'] },
      { name: 'Hunter Closer', description: 'You thrive on the chase and excel at closing complex deals.', traits: ['Competitive', 'Persistent', 'Results-driven'] },
      { name: 'Strategic Consultant', description: 'You position yourself as an expert who solves business problems.', traits: ['Solution-oriented', 'Analytical', 'Value-focused'] },
      { name: 'Relationship Builder', description: 'You focus on long-term partnerships over short-term wins.', traits: ['Genuine', 'Networker', 'Patient'] },
    ],
  },
  BRIDGE: {
    name: 'BRIDGE',
    b2cName: 'China Leadership Readiness',
    shortName: 'China Leadership Readiness',
    dimensions: [
      { id: 'cultural', name: 'Cultural', description: 'Your understanding of Chinese business culture and norms', lowLabel: 'Unaware', highLabel: 'Culturally fluent' },
      { id: 'strategic', name: 'Strategic', description: 'Your ability to navigate business strategy in China', lowLabel: 'Naive', highLabel: 'Strategic' },
      { id: 'operational', name: 'Operational', description: 'Your capability to manage operations effectively in China', lowLabel: 'Inexperienced', highLabel: 'Operations expert' },
      { id: 'political', name: 'Political', description: 'Your understanding of stakeholder management and guanxi', lowLabel: 'Apolitical', highLabel: 'Politically savvy' },
      { id: 'network', name: 'Network', description: 'Your professional connections and relationships in China', lowLabel: 'Isolated', highLabel: 'Well-connected' },
    ],
    styles: [
      { id: 'analytical', name: 'Analytical', description: 'Systematic, research-based approach', icon: '🔬' },
      { id: 'visionary', name: 'Visionary', description: 'Big-picture, opportunity-focused', icon: '🔭' },
      { id: 'pragmatic', name: 'Pragmatic', description: 'Practical, step-by-step implementation', icon: '⚙️' },
      { id: 'empathetic', name: 'Empathetic', description: 'Relationship-first, culturally sensitive', icon: '💡' },
    ],
    archetypes: [
      { name: 'Cultural Bridge Builder', description: 'You excel at connecting Western and Chinese business practices.', traits: ['Bicultural', 'Adaptable', 'Connector'] },
      { name: 'Strategic Navigator', description: 'You understand the nuances of doing business in China.', traits: ['Perceptive', 'Calculated', 'Patient'] },
      { name: 'Operational Leader', description: 'You can effectively manage teams and operations in China.', traits: ['Hands-on', 'Detail-oriented', 'Resilient'] },
      { name: 'Relationship Architect', description: 'You build and maintain key stakeholder relationships.', traits: ['Networker', 'Trust-builder', 'Long-term thinker'] },
    ],
  },
  MOSAIC: {
    name: 'MOSAIC',
    b2cName: 'CQ Leadership Development',
    shortName: 'CQ Leadership Development',
    dimensions: [
      { id: 'cq_drive', name: 'CQ Drive', description: 'Your motivation to lead across cultural boundaries', lowLabel: 'Disinterested', highLabel: 'Highly motivated' },
      { id: 'cq_knowledge', name: 'CQ Knowledge', description: 'Your understanding of cultural frameworks and differences', lowLabel: 'Unaware', highLabel: 'Well-informed' },
      { id: 'cq_strategy', name: 'CQ Strategy', description: 'Your ability to plan for cross-cultural interactions', lowLabel: 'Unplanned', highLabel: 'Strategic' },
      { id: 'cq_action', name: 'CQ Action', description: 'Your ability to adapt behavior in different cultural contexts', lowLabel: 'Rigid', highLabel: 'Highly adaptive' },
      { id: 'cq_adapt', name: 'CQ Adaptability', description: 'Your flexibility in adjusting to new cultural situations', lowLabel: 'Fixed', highLabel: 'Highly flexible' },
    ],
    styles: [
      { id: 'analytical', name: 'Analytical', description: 'Cultural research, systematic approach', icon: '🔬' },
      { id: 'visionary', name: 'Visionary', description: 'Inclusive, global perspective', icon: '🔭' },
      { id: 'pragmatic', name: 'Pragmatic', description: 'Practical, action-oriented', icon: '⚙️' },
      { id: 'empathetic', name: 'Empathetic', description: 'Open-minded, curious, inclusive', icon: '💡' },
    ],
    archetypes: [
      { name: 'Global Bridge Leader', description: 'You naturally connect diverse teams and perspectives.', traits: ['Inclusive', 'Curious', 'Connector'] },
      { name: 'Cultural Strategist', description: 'You plan and execute with cultural intelligence at the forefront.', traits: ['Analytical', 'Strategic', 'Prepared'] },
      { name: 'Adaptive Leader', description: 'You thrive in diverse environments and adjust naturally.', traits: ['Flexible', 'Observant', 'Responsive'] },
      { name: 'Cultural Champion', description: 'You actively promote cultural understanding and inclusion.', traits: ['Advocate', 'Educator', 'Mentor'] },
    ],
  },
  SPARK: {
    name: 'SPARK',
    b2cName: 'AI Leadership Readiness',
    shortName: 'AI Leadership Readiness',
    dimensions: [
      { id: 'ai_vision', name: 'AI Vision', description: 'Your ability to see AI opportunities and implications', lowLabel: 'Skeptical', highLabel: 'Visionary' },
      { id: 'data_fluency', name: 'Data Fluency', description: 'Your comfort with data-driven decision making', lowLabel: 'Data-averse', highLabel: 'Data-savvy' },
      { id: 'change_leadership', name: 'Change Leadership', description: 'Your ability to lead teams through AI-driven transformation', lowLabel: 'Change-resistant', highLabel: 'Change leader' },
      { id: 'ethics', name: 'Ethics', description: 'Your consideration of ethical implications of AI', lowLabel: 'Unconcerned', highLabel: 'Ethically-minded' },
      { id: 'innovation', name: 'Innovation', description: 'Your appetite for experimenting with new AI tools and approaches', lowLabel: 'Traditional', highLabel: 'Innovative' },
    ],
    styles: [
      { id: 'analytical', name: 'Analytical', description: 'Data-driven, evidence-based approach', icon: '🔬' },
      { id: 'visionary', name: 'Visionary', description: 'Future-focused, transformative', icon: '🔭' },
      { id: 'pragmatic', name: 'Pragmatic', description: 'Practical implementation, risk-aware', icon: '⚙️' },
      { id: 'empathetic', name: 'Empathetic', description: 'People-focused, ethical', icon: '💡' },
    ],
    archetypes: [
      { name: 'AI Strategist', description: 'You see the big picture of AI transformation and lead accordingly.', traits: ['Visionary', 'Strategic', 'Transformative'] },
      { name: 'Data-Driven Leader', description: 'You leverage data and AI for better decision making.', traits: ['Analytical', 'Evidence-based', 'Decisive'] },
      { name: 'Change Champion', description: 'You help organizations navigate AI-driven change.', traits: ['Change agent', 'Coach', 'Motivator'] },
      { name: 'Ethical Innovator', description: 'You balance innovation with responsible AI use.', traits: ['Principled', 'Thoughtful', 'Innovative'] },
    ],
  },
  SHIFT_LEAP: {
    name: 'SHIFT-LEAP',
    b2cName: 'Competitive Positioning',
    shortName: 'Competitive Positioning',
    dimensions: [
      { id: 'market', name: 'Market', description: 'Your understanding of market dynamics and competitive landscape', lowLabel: 'Unaware', highLabel: 'Market expert' },
      { id: 'capability', name: 'Capability', description: 'Your unique strengths and competitive advantages', lowLabel: 'Undifferentiated', highLabel: 'Differentiated' },
      { id: 'timing', name: 'Timing', description: 'Your sense of when to act and seize opportunities', lowLabel: 'Reactive', highLabel: 'Opportunistic' },
      { id: 'risk', name: 'Risk', description: 'Your ability to assess and manage risks', lowLabel: 'Risk-blind', highLabel: 'Risk-aware' },
      { id: 'impact', name: 'Impact', description: 'Your ability to create meaningful competitive impact', lowLabel: 'Minimal', highLabel: 'Transformative' },
    ],
    styles: [
      { id: 'analytical', name: 'Analytical', description: 'Competitive analysis, data-driven strategy', icon: '🔬' },
      { id: 'visionary', name: 'Visionary', description: 'Opportunity spotting, disruptive thinking', icon: '🔭' },
      { id: 'pragmatic', name: 'Pragmatic', description: 'Execution-focused, competitive tactics', icon: '⚙️' },
      { id: 'empathetic', name: 'Empathetic', description: 'Customer-focused, market-driven', icon: '💡' },
    ],
    archetypes: [
      { name: 'Market Disruptor', description: 'You identify and exploit competitive opportunities others miss.', traits: ['Opportunistic', 'Bold', 'Innovative'] },
      { name: 'Strategic Defender', description: 'You protect and strengthen competitive position strategically.', traits: ['Analytical', 'Calculated', 'Defensive'] },
      { name: 'Agile Competitor', description: 'You adapt quickly to changing competitive landscapes.', traits: ['Adaptable', 'Responsive', 'Flexible'] },
      { name: 'Value Creator', description: 'You create sustainable competitive advantage through value.', traits: ['Customer-centric', 'Innovative', 'Sustainable'] },
    ],
  },
  SHIFT_DRIVE: {
    name: 'SHIFT-DRIVE',
    b2cName: 'Execution Capability',
    shortName: 'Execution Capability',
    dimensions: [
      { id: 'strategy', name: 'Strategy', description: 'Your ability to translate vision into actionable plans', lowLabel: 'Unfocused', highLabel: 'Strategic' },
      { id: 'operations', name: 'Operations', description: 'Your capability to manage execution processes', lowLabel: 'Inexperienced', highLabel: 'Operations expert' },
      { id: 'people', name: 'People', description: 'Your ability to mobilize and lead teams for results', lowLabel: 'Ineffective', highLabel: 'Inspirational' },
      { id: 'technology', name: 'Technology', description: 'Your use of technology to enable execution', lowLabel: 'Technology-averse', highLabel: 'Tech-enabled' },
      { id: 'results', name: 'Results', description: 'Your track record of delivering outcomes', lowLabel: 'Unproven', highLabel: 'Results-proven' },
    ],
    styles: [
      { id: 'analytical', name: 'Analytical', description: 'Process optimization, metric-driven', icon: '🔬' },
      { id: 'visionary', name: 'Visionary', description: 'Goal-focused, inspirational', icon: '🔭' },
      { id: 'pragmatic', name: 'Pragmatic', description: 'Hands-on, efficient, result-oriented', icon: '⚙️' },
      { id: 'empathetic', name: 'Empathetic', description: 'Team-focused, collaborative', icon: '💡' },
    ],
    archetypes: [
      { name: 'Execution Champion', description: 'You drive results through effective planning and delivery.', traits: ['Disciplined', 'Organized', 'Reliable'] },
      { name: 'Team Mobilizer', description: 'You inspire teams to achieve ambitious goals.', traits: ['Leader', 'Motivator', 'Coach'] },
      { name: 'Process Optimizer', description: 'You continuously improve how work gets done.', traits: ['Analytical', 'Efficient', 'Systematic'] },
      { name: 'Results Driver', description: 'You stay focused on outcomes and deliver consistently.', traits: ['Goal-oriented', 'Accountable', 'Persistent'] },
    ],
  },
  SHIFT_COACH: {
    name: 'SHIFT-COACH',
    b2cName: 'Leadership Coaching Readiness',
    shortName: 'Leadership Coaching Readiness',
    dimensions: [
      { id: 'self_awareness', name: 'Self-Awareness', description: 'Your understanding of your own strengths and growth areas', lowLabel: 'Unaware', highLabel: 'Highly self-aware' },
      { id: 'growth', name: 'Growth', description: 'Your commitment to continuous learning and development', lowLabel: 'Fixed', highLabel: 'Growth-oriented' },
      { id: 'feedback', name: 'Feedback', description: 'Your ability to give and receive constructive feedback', lowLabel: 'Feedback-averse', highLabel: 'Feedback-embracing' },
      { id: 'resilience', name: 'Resilience', description: 'Your ability to bounce back from setbacks', lowLabel: 'Fragile', highLabel: 'Resilient' },
      { id: 'impact', name: 'Impact', description: 'Your ability to positively impact others\' development', lowLabel: 'Neutral', highLabel: 'Transformative' },
    ],
    styles: [
      { id: 'analytical', name: 'Analytical', description: 'Diagnostic, developmental focus', icon: '🔬' },
      { id: 'visionary', name: 'Visionary', description: 'Inspiring, growth-focused', icon: '🔭' },
      { id: 'pragmatic', name: 'Pragmatic', description: 'Practical, action-oriented coaching', icon: '⚙️' },
      { id: 'empathetic', name: 'Empathetic', description: 'Supportive, patient, understanding', icon: '💡' },
    ],
    archetypes: [
      { name: 'Empowering Coach', description: 'You unlock potential through thoughtful guidance and support.', traits: ['Patient', 'Supportive', 'Empowering'] },
      { name: 'Growth Catalyst', description: 'You accelerate others\' development through challenge and support.', traits: ['Direct', 'Challenging', 'Motivating'] },
      { name: 'Reflective Mentor', description: 'You help others discover insights through thoughtful questions.', traits: ['Curious', 'Thoughtful', 'Socratic'] },
      { name: 'Results Developer', description: 'You focus on practical skill development and measurable results.', traits: ['Practical', 'Accountable', 'Focused'] },
    ],
  },
  SHIFT_QUEST: {
    name: 'SHIFT-QUEST',
    b2cName: 'Strategic Readiness',
    shortName: 'Strategic Readiness',
    dimensions: [
      { id: 'vision', name: 'Vision', description: 'Your ability to see and articulate the future direction', lowLabel: 'Short-term', highLabel: 'Visionary' },
      { id: 'analysis', name: 'Analysis', description: 'Your capability to analyze complex situations', lowLabel: 'Intuitive', highLabel: 'Analytical' },
      { id: 'decision', name: 'Decision', description: 'Your ability to make effective strategic decisions', lowLabel: 'Hesitant', highLabel: 'Decisive' },
      { id: 'influence', name: 'Influence', description: 'Your ability to build alignment around strategy', lowLabel: 'Isolated', highLabel: 'Influential' },
      { id: 'adapt', name: 'Adaptability', description: 'Your flexibility to adjust strategy as conditions change', lowLabel: 'Rigid', highLabel: 'Adaptive' },
    ],
    styles: [
      { id: 'analytical', name: 'Analytical', description: 'Data-driven strategy, evidence-based', icon: '🔬' },
      { id: 'visionary', name: 'Visionary', description: 'Future-focused, transformative', icon: '🔭' },
      { id: 'pragmatic', name: 'Pragmatic', description: 'Practical strategy, actionable', icon: '⚙️' },
      { id: 'empathetic', name: 'Empathetic', description: 'Stakeholder-focused, inclusive', icon: '💡' },
    ],
    archetypes: [
      { name: 'Strategic Visionary', description: 'You see the big picture and chart compelling direction.', traits: ['Forward-thinking', 'Inspiring', 'Clear communicator'] },
      { name: 'Analytical Strategist', description: 'You base strategy on deep analysis and insight.', traits: ['Thorough', 'Evidence-based', 'Calculated'] },
      { name: 'Decisive Leader', description: 'You make tough calls and drive strategic execution.', traits: ['Confident', 'Decisive', 'Accountable'] },
      { name: 'Adaptive Navigator', description: 'You adjust strategy based on changing conditions.', traits: ['Flexible', 'Observant', 'Responsive'] },
    ],
  },
  SHIFT_IMPACT: {
    name: 'SHIFT-IMPACT',
    b2cName: 'Organizational Impact',
    shortName: 'Organizational Impact',
    dimensions: [
      { id: 'leadership', name: 'Leadership', description: 'Your ability to lead and influence organizations', lowLabel: 'Individual contributor', highLabel: 'Organizational leader' },
      { id: 'innovation', name: 'Innovation', description: 'Your drive to create meaningful change', lowLabel: 'Status quo', highLabel: 'Innovative' },
      { id: 'culture', name: 'Culture', description: 'Your ability to shape organizational culture', lowLabel: 'Culture-neutral', highLabel: 'Culture-shaper' },
      { id: 'performance', name: 'Performance', description: 'Your track record of driving results', lowLabel: 'Unproven', highLabel: 'High performer' },
      { id: 'legacy', name: 'Legacy', description: 'Your lasting impact on organizations and people', lowLabel: 'Temporary', highLabel: 'Legacy-builder' },
    ],
    styles: [
      { id: 'analytical', name: 'Analytical', description: 'Metrics-driven, systematic impact', icon: '🔬' },
      { id: 'visionary', name: 'Visionary', description: 'Transformational, legacy-focused', icon: '🔭' },
      { id: 'pragmatic', name: 'Pragmatic', description: 'Results-oriented, efficient', icon: '⚙️' },
      { id: 'empathetic', name: 'Empathetic', description: 'People-focused, sustainable', icon: '💡' },
    ],
    archetypes: [
      { name: 'Transformational Leader', description: 'You create lasting, positive change in organizations.', traits: ['Visionary', 'Courageous', 'Transformative'] },
      { name: 'Culture Architect', description: 'You shape organizational culture for the better.', traits: ['Values-driven', 'Inclusive', 'Intentional'] },
      { name: 'Performance Driver', description: 'You consistently deliver measurable business results.', traits: ['Results-oriented', 'Accountable', 'Focused'] },
      { name: 'Legacy Builder', description: 'You create lasting positive impact on people and organizations.', traits: ['Long-term thinker', 'Mentor', 'Purpose-driven'] },
    ],
  },
};
