// Phase 3.8: Compensation Benchmarking Type Definitions

export type CompLevel = 'junior' | 'mid' | 'senior' | 'executive';

export type SourceType = 'placement' | 'candidate_expectation' | 'imported' | 'survey';

export type EducationLevel = 'bachelor' | 'master' | 'phd' | 'mba';

export type CompanySize = 'startup' | 'mid_market' | 'enterprise' | 'mnc';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface CompBenchmark {
  id: string;
  org_id: string;
  job_title_pattern: string;
  industry: string | null;
  country: string;
  city: string | null;
  level: CompLevel | null;
  currency: string;

  p10: number | null;
  p25: number | null;
  p50: number | null;
  p75: number | null;
  p90: number | null;
  mean: number | null;

  sample_size: number;
  data_sources: string[];
  effective_from: string;
  effective_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompDataPoint {
  id: string;
  org_id: string;
  source_type: SourceType;
  source_id: string | null;

  job_title: string;
  industry: string | null;
  company_size: CompanySize | null;
  country: string;
  city: string | null;

  currency: string;
  base_salary_annual: number | null;
  bonus_target_pct: number | null;
  equity_value_annual: number | null;
  total_cash_annual: number | null;

  experience_years: number | null;
  education_level: EducationLevel | null;

  data_date: string;
  created_at: string;
}

export interface CompSurveyImport {
  id: string;
  org_id: string;
  survey_name: string;
  survey_year: number;
  imported_at: string;
  imported_by: string | null;
  row_count: number;
  file_path: string | null;
}

export interface BenchmarkInput {
  jobTitle: string;
  industry?: string;
  country?: string;
  city?: string;
  level?: CompLevel;
}

export interface BenchmarkResult {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  mean: number;
  sampleSize: number;
  currency: string;
  confidence: ConfidenceLevel;
  dataSources: string[];
  relaxationLevel?: number;
  relaxationNote?: string;
}

export interface HistoryDataPoint {
  date: string;
  p50: number;
  p25: number;
  p75: number;
  sampleSize: number;
}

export const SURVEY_CSV_REQUIRED_COLUMNS = [
  'job_title',
  'industry',
  'city',
  'country',
  'company_size',
  'base_salary_annual',
  'bonus_target_pct',
  'total_cash_annual',
  'currency',
  'experience_years',
  'education_level',
];

export const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  high: 'text-tier-1',
  medium: 'text-amber-600',
  low: 'text-red-500',
};
