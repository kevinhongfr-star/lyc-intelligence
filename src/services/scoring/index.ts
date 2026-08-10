// Generated scoring-config barrel — do not hand-edit.
// Source of truth: akira_source/diagnostic_portfolio/06_scoring_engine_code/*

import * as cpi from './cpi';
import * as prism from './prism';
import * as spark from './spark';
import * as leap from './leap';
import * as quest from './quest';
import * as impact from './impact';
import * as forge from './forge';
import * as drive from './drive';
import * as coach from './coach';
import * as bridge from './bridge';
import * as mosaic from './mosaic';

export { cpi, prism, spark, leap, quest, impact, forge, drive, coach, bridge, mosaic };

export const SCORING_CONFIGS = {
  CPI: cpi.SCORING_CONFIG,
  PRISM: prism.SCORING_CONFIG,
  SPARK: spark.SCORING_CONFIG,
  LEAP: leap.SCORING_CONFIG,
  QUEST: quest.SCORING_CONFIG,
  IMPACT: impact.SCORING_CONFIG,
  FORGE: forge.SCORING_CONFIG,
  DRIVE: drive.SCORING_CONFIG,
  COACH: coach.SCORING_CONFIG,
  BRIDGE: bridge.SCORING_CONFIG,
  MOSAIC: mosaic.SCORING_CONFIG,
} as const;

export type InstrumentCode = keyof typeof SCORING_CONFIGS;
