import { v1Client } from '@/hooks/v1/v1Client';

export type DiagnosticDimensionId =
  | 'role'
  | 'situation'
  | 'constraint'
  | 'emotion'
  | 'success';

export type DiagnosticStatus = 'collected' | 'missing' | 'active';

export interface DiagnosticDimension {
  id: DiagnosticDimensionId;
  label: string;
  status: DiagnosticStatus;
  collectedAt?: string;
}

export interface DiagnosticCoverage {
  dimensions: DiagnosticDimension[];
  collected: number;
  total: number;
  percentage: number;
  isComplete: boolean;
}

export interface DiagnosticSuggestion {
  dimension: DiagnosticDimensionId;
  question: string;
  context?: string;
}

export interface DiagnosticProgress {
  sessionId: string;
  collected: number;
  total: number;
  percentage: number;
  dimensions: DiagnosticDimension[];
  lastUpdated: string;
}

export async function getDiagnosticCoverage(
  sessionId: string,
): Promise<DiagnosticCoverage> {
  return v1Client.get<DiagnosticCoverage>(
    `/diagnostic/sessions/${sessionId}/coverage`,
  );
}

export async function suggestDiagnosticQuestion(
  dimension: DiagnosticDimensionId,
): Promise<DiagnosticSuggestion> {
  return v1Client.get<DiagnosticSuggestion>(
    `/diagnostic/suggest?dimension=${dimension}`,
  );
}

export async function markDimensionComplete(
  sessionId: string,
  dimension: DiagnosticDimensionId,
): Promise<DiagnosticDimension> {
  return v1Client.post<DiagnosticDimension>(
    `/diagnostic/sessions/${sessionId}/dimensions/${dimension}/complete`,
  );
}

export async function getDiagnosticProgress(
  sessionId: string,
): Promise<DiagnosticProgress> {
  return v1Client.get<DiagnosticProgress>(
    `/diagnostic/sessions/${sessionId}/progress`,
  );
}

export async function getNextSuggestion(
  sessionId: string,
): Promise<DiagnosticSuggestion | null> {
  return v1Client.get<DiagnosticSuggestion | null>(
    `/diagnostic/sessions/${sessionId}/next-suggestion`,
  );
}