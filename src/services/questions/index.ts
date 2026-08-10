// Generated question-bank barrel — do not hand-edit.
// Source of truth: akira_source/diagnostic_portfolio/07_question_banks/*

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

export const QUESTION_BANKS = {
  CPI: { instrument: cpi.INSTRUMENT, full_name: cpi.FULL_NAME, version: cpi.VERSION, total_questions: cpi.TOTAL_QUESTIONS, scale: cpi.SCALE, delivery_minutes: cpi.DELIVERY_MINUTES, dimensions: cpi.DIMENSIONS, all_questions: cpi.ALL_QUESTIONS, reverse_coded_ids: cpi.REVERSE_CODED_IDS },
  PRISM: { instrument: prism.INSTRUMENT, full_name: prism.FULL_NAME, version: prism.VERSION, total_questions: prism.TOTAL_QUESTIONS, scale: prism.SCALE, delivery_minutes: prism.DELIVERY_MINUTES, dimensions: prism.DIMENSIONS, all_questions: prism.ALL_QUESTIONS, reverse_coded_ids: prism.REVERSE_CODED_IDS },
  SPARK: { instrument: spark.INSTRUMENT, full_name: spark.FULL_NAME, version: spark.VERSION, total_questions: spark.TOTAL_QUESTIONS, scale: spark.SCALE, delivery_minutes: spark.DELIVERY_MINUTES, dimensions: spark.DIMENSIONS, all_questions: spark.ALL_QUESTIONS, reverse_coded_ids: spark.REVERSE_CODED_IDS },
  LEAP: { instrument: leap.INSTRUMENT, full_name: leap.FULL_NAME, version: leap.VERSION, total_questions: leap.TOTAL_QUESTIONS, scale: leap.SCALE, delivery_minutes: leap.DELIVERY_MINUTES, dimensions: leap.DIMENSIONS, all_questions: leap.ALL_QUESTIONS, reverse_coded_ids: leap.REVERSE_CODED_IDS },
  QUEST: { instrument: quest.INSTRUMENT, full_name: quest.FULL_NAME, version: quest.VERSION, total_questions: quest.TOTAL_QUESTIONS, scale: quest.SCALE, delivery_minutes: quest.DELIVERY_MINUTES, dimensions: quest.DIMENSIONS, all_questions: quest.ALL_QUESTIONS, reverse_coded_ids: quest.REVERSE_CODED_IDS },
  IMPACT: { instrument: impact.INSTRUMENT, full_name: impact.FULL_NAME, version: impact.VERSION, total_questions: impact.TOTAL_QUESTIONS, scale: impact.SCALE, delivery_minutes: impact.DELIVERY_MINUTES, dimensions: impact.DIMENSIONS, all_questions: impact.ALL_QUESTIONS, reverse_coded_ids: impact.REVERSE_CODED_IDS },
  FORGE: { instrument: forge.INSTRUMENT, full_name: forge.FULL_NAME, version: forge.VERSION, total_questions: forge.TOTAL_QUESTIONS, scale: forge.SCALE, delivery_minutes: forge.DELIVERY_MINUTES, dimensions: forge.DIMENSIONS, all_questions: forge.ALL_QUESTIONS, reverse_coded_ids: forge.REVERSE_CODED_IDS },
  DRIVE: { instrument: drive.INSTRUMENT, full_name: drive.FULL_NAME, version: drive.VERSION, total_questions: drive.TOTAL_QUESTIONS, scale: drive.SCALE, delivery_minutes: drive.DELIVERY_MINUTES, dimensions: drive.DIMENSIONS, all_questions: drive.ALL_QUESTIONS, reverse_coded_ids: drive.REVERSE_CODED_IDS },
  COACH: { instrument: coach.INSTRUMENT, full_name: coach.FULL_NAME, version: coach.VERSION, total_questions: coach.TOTAL_QUESTIONS, scale: coach.SCALE, delivery_minutes: coach.DELIVERY_MINUTES, dimensions: coach.DIMENSIONS, all_questions: coach.ALL_QUESTIONS, reverse_coded_ids: coach.REVERSE_CODED_IDS },
  BRIDGE: { instrument: bridge.INSTRUMENT, full_name: bridge.FULL_NAME, version: bridge.VERSION, total_questions: bridge.TOTAL_QUESTIONS, scale: bridge.SCALE, delivery_minutes: bridge.DELIVERY_MINUTES, dimensions: bridge.DIMENSIONS, all_questions: bridge.ALL_QUESTIONS, reverse_coded_ids: bridge.REVERSE_CODED_IDS },
  MOSAIC: { instrument: mosaic.INSTRUMENT, full_name: mosaic.FULL_NAME, version: mosaic.VERSION, total_questions: mosaic.TOTAL_QUESTIONS, scale: mosaic.SCALE, delivery_minutes: mosaic.DELIVERY_MINUTES, dimensions: mosaic.DIMENSIONS, all_questions: mosaic.ALL_QUESTIONS, reverse_coded_ids: mosaic.REVERSE_CODED_IDS },
};

export type InstrumentCode = keyof typeof QUESTION_BANKS;
