export const STAGE_ORDER = ['SWEEP', 'CANVA', 'GRID', 'LENS', 'PLACED'] as const;
export type Stage = typeof STAGE_ORDER[number];
export const STAGE_CONFIG: Record<Stage, { label: string; color: string }> = {
  SWEEP: { label: 'Sweep', color: '#6366F1' },
  CANVA: { label: 'Canvas', color: '#F59E0B' },
  GRID: { label: 'Grid', color: '#10B981' },
  LENS: { label: 'Lens', color: '#EC4899' },
  PLACED: { label: 'Placed', color: '#8B5CF6' },
};
