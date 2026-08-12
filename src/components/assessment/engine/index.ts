/**
 * engine/index.ts — Barrel for the branching-native DiagnosticEngine.
 *
 * #1277: Public surface of the assessment engine module. Consumers should
 * import from '@/components/assessment/engine' (or '@/components/assessment'
 * if re-exported at the package root).
 */
export { DiagnosticEngine } from './DiagnosticEngine';
export type {
  DiagnosticEngineProps,
  EnginePhase,
  DiagnosticDefinition,
  DiagnosticQuestion,
  CanonicalQuestionType,
  SkipRule,
  QuestionDependency,
  DiagnosticMeta,
  AnswerMap,
  AnswerValue,
} from './types';
