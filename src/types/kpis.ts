// Phase 0.7: KPI Type Definitions
// All KPI-related types, enums, and interfaces

export type KpiCategory =
  | 'revenue'
  | 'recruitment_efficiency'
  | 'candidate_experience'
  | 'consultant_performance'
  | 'platform_health';

export type KpiFrequency = 'realtime' | 'daily' | 'weekly' | 'monthly' | 'quarterly';

export type KpiUnit =
  | 'days'
  | 'hours'
  | 'percentage'
  | 'count'
  | 'currency'
  | 'ratio'
  | 'score'
  | 'minutes';

export type KpiTrend = 'up' | 'down' | 'flat';

export type KpiAlertSeverity = 'warning' | 'critical';

export type KpiDashboard =
  | 'b2b_dashboard'
  | 'client_portal'
  | 'candidate_portal'
  | 'internal';

export interface KpiDefinition {
  id: string;
  name: string;
  category: KpiCategory;
  description: string;
  formula: string;
  unit: KpiUnit;
  frequency: KpiFrequency;
  target?: number;
  warning_threshold?: number;
  critical_threshold?: number;
  data_source: string[];
  dashboard: KpiDashboard[];
  higher_is_better?: boolean;
  precision?: number;
}

export interface KpiValue {
  kpi_id: string;
  org_id: string;
  value: number;
  period_start: string;
  period_end: string;
  computed_at: string;
  sample_size: number;
}

export interface KpiAlert {
  id: number;
  kpi_id: string;
  org_id: string;
  severity: KpiAlertSeverity;
  current_value: number;
  threshold: number;
  message: string;
  created_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
}

export interface KpiWithValue extends KpiDefinition {
  current_value: KpiValue | null;
  previous_value: KpiValue | null;
  trend: KpiTrend;
  trend_percentage: number;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
}

export interface KpiHistoryPoint {
  period_start: string;
  period_end: string;
  value: number;
  sample_size: number;
}

export const KPI_CATEGORY_LABELS: Record<KpiCategory, string> = {
  revenue: 'Revenue & Business',
  recruitment_efficiency: 'Recruitment Efficiency',
  candidate_experience: 'Candidate Experience',
  consultant_performance: 'Consultant Performance',
  platform_health: 'Platform Health',
};

export const KPI_CATEGORY_ICONS: Record<KpiCategory, string> = {
  revenue: 'trending_up',
  recruitment_efficiency: 'speed',
  candidate_experience: 'sentiment_satisfied',
  consultant_performance: 'people',
  platform_health: 'health_and_safety',
};

export const KPI_UNIT_LABELS: Record<KpiUnit, string> = {
  days: 'days',
  hours: 'hrs',
  percentage: '%',
  count: '',
  currency: '',
  ratio: '',
  score: '',
  minutes: 'min',
};

export const KPI_FREQUENCY_LABELS: Record<KpiFrequency, string> = {
  realtime: 'Real-time',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
};
