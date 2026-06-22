// Timeline Components Index
export { TimelineView } from './TimelineView';
export type {
  TimelineViewProps,
  Milestone,
  MilestoneStatus,
  MandateMilestones,
} from './TimelineView';

export { MilestoneDetail } from './MilestoneDetail';
export type { MilestoneDetailProps } from './MilestoneDetail';

export { ClientTimeline } from './ClientTimeline';
export type { ClientTimelineProps } from './ClientTimeline';

export { TimelineAnalytics } from './TimelineAnalytics';
export type {
  TimelineAnalyticsProps,
  StageAnalytics,
  ConsultantAnalytics,
} from './TimelineAnalytics';

export { MandatesAtRisk } from './MandatesAtRisk';
export type {
  MandatesAtRiskProps,
  AtRiskMandate,
} from './MandatesAtRisk';

// Re-export helper functions
export {
  calculateMilestoneStatus,
  getStatusColor,
  getStatusLabel,
  MILESTONE_LABELS,
  MILESTONE_ORDER,
  DEFAULT_SLA_DAYS,
} from './TimelineView';
