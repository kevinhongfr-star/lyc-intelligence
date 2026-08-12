/**
 * schemas/index.ts — #97 Barrel export for all B2C contract schemas (8 schemas total)
 *
 * 1 × shared base result:      assessmentResult
 * 6 × diagnostic extensions:   prism | spark | forge | bridge | mosaic | drive
 * 1 × AI generated content:    aiGeneratedContent
 */

export * from './assessmentResult';
export * from './aiGeneratedContent';

export * from './diagnostics/prism';
export * from './diagnostics/spark';
export * from './diagnostics/forge';
export * from './diagnostics/bridge';
export * from './diagnostics/mosaic';
export * from './diagnostics/drive';

import type { PrismResultSchema } from './diagnostics/prism';
import type { SparkResultSchema } from './diagnostics/spark';
import type { ForgeResultSchema } from './diagnostics/forge';
import type { BridgeResultSchema } from './diagnostics/bridge';
import type { MosaicResultSchema } from './diagnostics/mosaic';
import type { DriveResultSchema } from './diagnostics/drive';
import type { DiagnosticSlug } from '@/types/assessment';

/** Discriminated union: all 6 diagnostic result schema variants */
export type AnyDiagnosticResultSchema =
  | PrismResultSchema
  | SparkResultSchema
  | ForgeResultSchema
  | BridgeResultSchema
  | MosaicResultSchema
  | DriveResultSchema;

/** Slug → schema type map. Use: ResultSchemaForSlug['prism'] */
export type ResultSchemaForSlug = {
  prism:  PrismResultSchema;
  spark:  SparkResultSchema;
  forge:  ForgeResultSchema;
  bridge: BridgeResultSchema;
  mosaic: MosaicResultSchema;
  drive:  DriveResultSchema;
};

export const ALL_DIAGNOSTIC_SCHEMA_SLUGS: DiagnosticSlug[] = [
  'prism', 'spark', 'forge', 'bridge', 'mosaic', 'drive',
];

/** Number of schemas (#97 B2C scope: 8 total) */
export const SCHEMA_COUNT = 8;
