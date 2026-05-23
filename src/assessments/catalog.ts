export function getB2CName(type: string): string { return type; }
export const ASSESSMENT_CATALOG: Record<string, { name: string; b2cName: string; dimensions: string[] }> = {
  PRISM: { name: 'PRISM', b2cName: 'Career & Professional Branding', dimensions: ['Vision', 'Resilience', 'Influence', 'Strategy', 'Mastery'] },
  FORGE: { name: 'FORGE', b2cName: 'Sales Excellence', dimensions: ['Drive', 'Relationship', 'Strategy', 'Execution', 'Adaptability'] },
  BRIDGE: { name: 'BRIDGE', b2cName: 'China Leadership Readiness', dimensions: ['Cultural', 'Strategic', 'Operational', 'Political', 'Network'] },
  MOSAIC: { name: 'MOSAIC', b2cName: 'CQ Leadership Development', dimensions: ['CQ Drive', 'CQ Knowledge', 'CQ Strategy', 'CQ Action', 'CQ Adaptability'] },
  SPARK: { name: 'SPARK', b2cName: 'AI Leadership Readiness', dimensions: ['AI Vision', 'Data Fluency', 'Change Leadership', 'Ethics', 'Innovation'] },
  SHIFT_LEAP: { name: 'SHIFT-LEAP', b2cName: 'Competitive Positioning', dimensions: ['Market', 'Capability', 'Timing', 'Risk', 'Impact'] },
  SHIFT_DRIVE: { name: 'SHIFT-DRIVE', b2cName: 'Execution Capability', dimensions: ['Strategy', 'Operations', 'People', 'Technology', 'Results'] },
  SHIFT_COACH: { name: 'SHIFT-COACH', b2cName: 'Leadership Coaching Readiness', dimensions: ['Self-Awareness', 'Growth', 'Feedback', 'Resilience', 'Impact'] },
  SHIFT_QUEST: { name: 'SHIFT-QUEST', b2cName: 'Strategic Readiness', dimensions: ['Vision', 'Analysis', 'Decision', 'Influence', 'Adaptability'] },
  SHIFT_IMPACT: { name: 'SHIFT-IMPACT', b2cName: 'Organizational Impact', dimensions: ['Leadership', 'Innovation', 'Culture', 'Performance', 'Legacy'] },
};
