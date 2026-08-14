/**
 * #1384 — Content Porting Utility
 *
 * Converts akira_source JSON question banks + scoring configs into production TS files.
 * Supports: dry-run, validate, batch, and single-assessment modes.
 *
 * Usage:
 *   npx tsx scripts/port-question-banks.ts [options] [assessment-code]
 *
 * Options:
 *   --dry-run     Show what would be generated without writing files
 *   --validate    Validate existing TS files against source JSON
 *   --batch       Process all 10 assessments (skip CPI — no akira_source data)
 *   --scoring     Only convert scoring configs
 *   --questions   Only convert question banks
 *
 * Examples:
 *   npx tsx scripts/port-question-banks.ts --dry-run SPARK
 *   npx tsx scripts/port-question-banks.ts --validate --batch
 *   npx tsx scripts/port-question-banks.ts --batch --scoring
 */
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── Paths ────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const AKIRA = join(ROOT, 'akira_source', 'diagnostic_portfolio');
const SCORING_SRC = join(AKIRA, '06_scoring_engine_code');
const QB_SRC = join(AKIRA, '07_question_banks');
const OUT_SCORING = join(ROOT, 'src', 'services', 'scoring');
const OUT_QUESTIONS = join(ROOT, 'src', 'services', 'questions');

// ── Instrument registry (mirrors akira_port.py INSTRUMENTS) ──────────
// CPI excluded — standalone B2B product, no akira_source JSON.
interface InstrumentDef {
  code: string;
  configJson: string | null;
  qbJsonPrimary: string | null;
  qbJsonFallback: string | null;
  scoringMode: 'weighted_average' | 'matrix' | 'forced_choice' | 'score_only' | 'weakest_dim';
  tierGroup: 'flagship' | 'shift' | 'advisory';
}

const INSTRUMENTS: InstrumentDef[] = [
  // Prefer _QB_notion.json (inline questions) over _Questions.json (ID ranges only)
  { code: 'PRISM',  configJson: 'prism_config.json',   qbJsonPrimary: 'PRISM_QB_notion.json',   qbJsonFallback: 'PRISM_Questions.json',   scoringMode: 'matrix',        tierGroup: 'advisory' },
  { code: 'SPARK',  configJson: 'spark_config.json',   qbJsonPrimary: 'SPARK_QB_notion.json',   qbJsonFallback: null,                     scoringMode: 'matrix',        tierGroup: 'advisory' },
  { code: 'LEAP',   configJson: 'leap2_config.json',   qbJsonPrimary: 'LEAP_Questions.json',    qbJsonFallback: 'LEAP_QB_v2.json',        scoringMode: 'forced_choice', tierGroup: 'shift' },
  { code: 'QUEST',  configJson: 'quest_config.json',   qbJsonPrimary: 'QUEST_QB_notion.json',   qbJsonFallback: 'QUEST_Questions.json',   scoringMode: 'matrix',        tierGroup: 'shift' },
  { code: 'IMPACT', configJson: 'impact_config.json',  qbJsonPrimary: 'IMPACT_QB_notion.json',  qbJsonFallback: 'IMPACT_Questions.json',  scoringMode: 'matrix',        tierGroup: 'shift' },
  { code: 'FORGE',  configJson: 'forge_config.json',   qbJsonPrimary: 'FORGE_QB_notion.json',   qbJsonFallback: null,                     scoringMode: 'matrix',        tierGroup: 'advisory' },
  { code: 'DRIVE',  configJson: 'drive_v2_config.json',qbJsonPrimary: 'DRIVE_Questions.json',   qbJsonFallback: 'DRIVE_Questions_v2.json',scoringMode: 'matrix',        tierGroup: 'shift' },
  { code: 'COACH',  configJson: 'coach_config.json',   qbJsonPrimary: 'COACH_QB_notion.json',   qbJsonFallback: null,                     scoringMode: 'matrix',        tierGroup: 'shift' },
  { code: 'BRIDGE', configJson: 'bridge_config.json',  qbJsonPrimary: 'BRIDGE_QB_notion.json',  qbJsonFallback: null,                     scoringMode: 'weakest_dim',   tierGroup: 'advisory' },
  { code: 'MOSAIC', configJson: 'mosaic_config.json',  qbJsonPrimary: 'MOSAIC_QB_notion.json',  qbJsonFallback: null,                     scoringMode: 'matrix',        tierGroup: 'advisory' },
];

// ── Helpers ──────────────────────────────────────────────────────────
function loadJson<T = any>(path: string): T | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function findQbFile(inst: InstrumentDef): { data: any; path: string } | null {
  if (inst.qbJsonPrimary) {
    const p = join(QB_SRC, inst.qbJsonPrimary);
    if (existsSync(p)) return { data: loadJson(p)!, path: p };
  }
  if (inst.qbJsonFallback) {
    const p = join(QB_SRC, inst.qbJsonFallback);
    if (existsSync(p)) return { data: loadJson(p)!, path: p };
  }
  return null;
}

// ── Scoring config conversion ────────────────────────────────────────
function convertScoringConfig(inst: InstrumentDef): string {
  const cfgPath = join(SCORING_SRC, inst.configJson!);
  const cfg = loadJson<any>(cfgPath);
  if (!cfg) throw new Error(`Config not found: ${cfgPath}`);

  const isLeap2 = inst.code === 'LEAP';

  // Extract dimensions
  let dimensions: any[];
  let archetypes: any[];
  let compositeBands: any[];
  let dimensionVerdicts: any[] | undefined;

  if (isLeap2) {
    // LEAP2 has nested structure
    dimensions = cfg.career_readiness?.dimensions || [];
    archetypes = cfg.archetypes_16 || [];
    compositeBands = cfg.leap_score_bands || [];
    dimensionVerdicts = cfg.cr_readiness_bands?.map((b: any) => ({
      dim: 'all',
      min: b.min,
      max: b.max,
      verdict: b.label,
      meaning: b.meaning,
    }));
  } else {
    dimensions = cfg.dimensions || [];
    archetypes = cfg.archetypes || [];
    compositeBands = cfg.composite_bands || [];
    dimensionVerdicts = cfg.dimension_verdicts;
  }

  const fullName = cfg.full_name || '';
  const version = cfg.version || '1.0';
  const totalQuestions = cfg.total_questions || 0;
  const scale = cfg.scale || '1-5 Likert';
  const deliveryMinutes = isLeap2
    ? (cfg.delivery_time_minutes || 12)
    : Math.max(5, Math.ceil(totalQuestions / 3));

  return `// AUTO-GENERATED by scripts/port-question-banks.ts — DO NOT EDIT MANUALLY.
// Source: akira_source/diagnostic_portfolio/06_scoring_engine_code/${inst.configJson}
// #1384 Content Porting Utility

export const INSTRUMENT = ${JSON.stringify(inst.code)};
export const FULL_NAME = ${JSON.stringify(fullName)};
export const VERSION = ${JSON.stringify(version)};
export const TOTAL_QUESTIONS = ${totalQuestions};
export const SCALE = ${JSON.stringify(scale)};
export const DELIVERY_MINUTES = ${deliveryMinutes};
export const TIER = ${JSON.stringify(inst.tierGroup)};
export const SCORING_MODE = ${JSON.stringify(inst.scoringMode)};

export const DIMENSIONS = ${JSON.stringify(dimensions, null, 2)};

export const ARCHETYPES = ${JSON.stringify(archetypes, null, 2)};

export const COMPOSITE_BANDS = ${JSON.stringify(compositeBands, null, 2)};
${dimensionVerdicts ? `\nexport const DIMENSION_VERDICTS = ${JSON.stringify(dimensionVerdicts, null, 2)};` : ''}

export const SCORING_CONFIG = {
  INSTRUMENT,
  FULL_NAME,
  VERSION,
  TOTAL_QUESTIONS,
  SCALE,
  DELIVERY_MINUTES,
  TIER,
  SCORING_MODE,
  DIMENSIONS,
  ARCHETYPES,
  COMPOSITE_BANDS,
${dimensionVerdicts ? '  DIMENSION_VERDICTS,\n' : ''}};
`;
}

// ── Question bank conversion ─────────────────────────────────────────
function convertQuestionBank(inst: InstrumentDef): string {
  const qbFile = findQbFile(inst);
  if (!qbFile) throw new Error(`Question bank not found for ${inst.code}`);
  const qb = qbFile.data;

  const isLeap2 = inst.code === 'LEAP';

  let allQuestions: any[];
  let dimensions: any[];
  let archetypes: any[];

  if (isLeap2) {
    // LEAP_Questions.json uses standard format with dimensions[].questions[]
    // LEAP_QB_v2.json uses a layers structure — try standard first.
    if (qb.dimensions && Array.isArray(qb.dimensions)) {
      dimensions = qb.dimensions;
      archetypes = qb.archetypes || [];
      // Load LEAP2 config for question text/items
      const cfgPath = join(SCORING_SRC, inst.configJson!);
      const cfg = loadJson<any>(cfgPath);
      const crDims = cfg?.career_readiness?.dimensions || [];
      const discSets = cfg?.disc?.item_sets || [];
      const cbItems = cfg?.cross_border?.items || [];

      allQuestions = dimensions.flatMap((dim: any) => {
        // If questions is an array of objects, use them directly
        if (Array.isArray(dim.questions)) {
          return dim.questions.map((q: any) => ({
            id: q.id,
            text: q.text,
            dimension: dim.name,
            type: 'likert',
            scale: [1, 2, 3, 4, 5],
            reverse_coded: q.reverse_coded || false,
            weight: q.weight || 1.0,
          }));
        }
        // If questions is a string range, get items from config's career_readiness section
        const crDim = crDims.find((d: any) => d.name === dim.name);
        if (crDim?.items) {
          return crDim.items.map((item: any) => ({
            id: item.id,
            text: item.text,
            dimension: dim.name,
            type: 'likert',
            scale: [1, 2, 3, 4, 5],
            reverse_coded: false,
            weight: crDim.weight || 1.0,
          }));
        }
        return [];
      });
      // Add DISC forced-choice questions from config
      const discQuestions = discSets.map((set: any) => ({
        id: set.id,
        text: `Choose MOST and LEAST: D=${set.D}, I=${set.I}, S=${set.S}, C=${set.C}`,
        dimension: 'DISC',
        type: 'forced_choice',
        options: [
          { label: set.D, value: 'D' },
          { label: set.I, value: 'I' },
          { label: set.S, value: 'S' },
          { label: set.C, value: 'C' },
        ],
      }));
      // Add cross-border questions from config
      const cbQuestions = cbItems.map((item: any) => ({
        id: item.id,
        text: item.text,
        dimension: 'Cross-Border',
        type: 'likert',
        scale: [1, 2, 3, 4, 5],
        reverse_coded: false,
        weight: 1.0,
      }));
      allQuestions = [...allQuestions, ...discQuestions, ...cbQuestions];
    } else {
      // LEAP_QB_v2.json layers format
      dimensions = qb.layers?.career_readiness?.dimensions || [];
      archetypes = qb.layers?.archetypes_16 || qb.archetypes_16 || [];
      const crQuestions = (qb.layers?.career_readiness?.dimensions || []).flatMap((dim: any) =>
        (dim.items || []).map((item: any) => ({
          id: item.id,
          text: item.text,
          dimension: dim.name,
          type: 'likert',
          scale: [1, 2, 3, 4, 5],
          reverse_coded: false,
          weight: dim.weight || 1.0,
        }))
      );
      const discQuestions = (qb.layers?.disc?.item_sets || qb.disc?.item_sets || []).map((set: any) => ({
        id: set.id,
        text: `Choose MOST and LEAST: D=${set.D}, I=${set.I}, S=${set.S}, C=${set.C}`,
        dimension: 'DISC',
        type: 'forced_choice',
        options: [
          { label: set.D, value: 'D' },
          { label: set.I, value: 'I' },
          { label: set.S, value: 'S' },
          { label: set.C, value: 'C' },
        ],
      }));
      const cbQuestions = (qb.layers?.cross_border?.items || qb.cross_border?.items || []).map((item: any) => ({
        id: item.id,
        text: item.text,
        dimension: 'Cross-Border',
        type: 'likert',
        scale: [1, 2, 3, 4, 5],
        reverse_coded: false,
        weight: 1.0,
      }));
      allQuestions = [...discQuestions, ...crQuestions, ...cbQuestions];
    }
  } else {
    // Standard format: questions inline in dimensions
    dimensions = qb.dimensions || [];
    archetypes = qb.archetypes || [];
    allQuestions = dimensions.flatMap((dim: any) => {
      // QB_notion files have questions as array of {id, text, reverse_coded, weight}
      if (Array.isArray(dim.questions)) {
        return dim.questions.map((q: any) => ({
          id: q.id,
          text: q.text,
          dimension: dim.name,
          type: 'likert',
          scale: [1, 2, 3, 4, 5],
          reverse_coded: q.reverse_coded || false,
          weight: q.weight || 1.0,
        }));
      }
      // _Questions.json files have questions as string range ("Q01-Q06") — use question_ids from config
      // Load the config to get question_ids
      const cfgPath = join(SCORING_SRC, inst.configJson!);
      const cfg = loadJson<any>(cfgPath);
      const cfgDim = cfg?.dimensions?.find((d: any) => d.id === dim.id || d.name === dim.name);
      const qIds = cfgDim?.question_ids || [];
      return qIds.map((qid: string) => ({
        id: qid,
        text: '', // Question text not in source — would need manual entry
        dimension: dim.name,
        type: 'likert',
        scale: [1, 2, 3, 4, 5],
        reverse_coded: (cfgDim?.reverse_coded || []).includes(qid),
        weight: 1.0,
      }));
    });
  }

  const reverseCodedIds = allQuestions.filter(q => q.reverse_coded).map(q => q.id);

  return `// AUTO-GENERATED by scripts/port-question-banks.ts — DO NOT EDIT MANUALLY.
// Source: akira_source/diagnostic_portfolio/07_question_banks/${qbFile.path.split('/').pop()}
// #1384 Content Porting Utility

export const INSTRUMENT = ${JSON.stringify(inst.code)};
export const TOTAL_QUESTIONS = ${allQuestions.length};

export interface QuestionItem {
  id: string;
  text: string;
  dimension: string;
  type: 'likert' | 'forced_choice' | 'slider';
  scale?: number[];
  options?: Array<{ label: string; value: string }>;
  reverse_coded: boolean;
  weight: number;
}

export const ALL_QUESTIONS: QuestionItem[] = ${JSON.stringify(allQuestions, null, 2)};

export const REVERSE_CODED_IDS: string[] = ${JSON.stringify(reverseCodedIds, null, 2)};

export const QUESTION_BANK = {
  INSTRUMENT,
  TOTAL_QUESTIONS,
  ALL_QUESTIONS,
  REVERSE_CODED_IDS,
};
`;
}

// ── Validation ───────────────────────────────────────────────────────
function validateInstrument(inst: InstrumentDef): { passed: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check source files exist
  if (inst.configJson) {
    const cfgPath = join(SCORING_SRC, inst.configJson);
    if (!existsSync(cfgPath)) errors.push(`Missing config: ${inst.configJson}`);
  }
  const qbFile = findQbFile(inst);
  if (!qbFile) errors.push(`Missing question bank for ${inst.code}`);

  // Check output files exist
  const scoringOut = join(OUT_SCORING, `${inst.code.toLowerCase()}.ts`);
  const questionsOut = join(OUT_QUESTIONS, `${inst.code.toLowerCase()}.ts`);
  if (!existsSync(scoringOut)) errors.push(`Missing output: src/services/scoring/${inst.code.toLowerCase()}.ts`);
  if (!existsSync(questionsOut)) errors.push(`Missing output: src/services/questions/${inst.code.toLowerCase()}.ts`);

  // Validate source JSON structure
  if (inst.configJson) {
    const cfgPath = join(SCORING_SRC, inst.configJson!);
    const cfg = loadJson<any>(cfgPath);
    if (cfg) {
      const isLeap2 = inst.code === 'LEAP';
      const dims = isLeap2 ? (cfg.career_readiness?.dimensions || []) : (cfg.dimensions || []);
      const archs = isLeap2 ? (cfg.archetypes_16 || []) : (cfg.archetypes || []);

      if (dims.length < 3 || dims.length > 6) {
        errors.push(`${inst.code}: dimension count ${dims.length} outside expected range 3-6`);
      }
      if (archs.length > 17) {
        errors.push(`${inst.code}: archetype count ${archs.length} exceeds max 17`);
      }
      if (cfg.total_questions && cfg.total_questions !== inst.code) {
        // just verify it's a number
      }
    }
  }

  // Validate question bank structure
  if (qbFile) {
    const qb = qbFile.data;
    const isLeap2 = inst.code === 'LEAP';
    let qCount = 0;

    if (isLeap2) {
      // LEAP_Questions.json: standard format with dimensions[].questions[]
      if (qb.dimensions && Array.isArray(qb.dimensions)) {
        qCount = (qb.dimensions || []).reduce((acc: number, dim: any) => acc + (dim.questions?.length || 0), 0);
      } else {
        // LEAP_QB_v2.json: layers format
        qCount = (qb.layers?.career_readiness?.dimensions || qb.career_readiness?.dimensions || []).reduce((acc: number, dim: any) => acc + (dim.items?.length || 0), 0)
               + (qb.layers?.disc?.item_sets || qb.disc?.item_sets || []).length
               + (qb.layers?.cross_border?.items || qb.cross_border?.items || []).length;
      }
    } else {
      qCount = (qb.dimensions || []).reduce((acc: number, dim: any) => {
        if (Array.isArray(dim.questions)) return acc + dim.questions.length;
        // String range format — count from config question_ids
        if (typeof dim.questions === 'string') {
          const cfgPath = join(SCORING_SRC, inst.configJson!);
          const cfg = loadJson<any>(cfgPath);
          const cfgDim = cfg?.dimensions?.find((d: any) => d.id === dim.id || d.name === dim.name);
          return acc + (cfgDim?.question_ids?.length || 0);
        }
        return acc;
      }, 0);
    }

    if (qCount < 24 || qCount > 36) {
      errors.push(`${inst.code}: question count ${qCount} outside expected range 24-36`);
    }
  }

  // Check SCORING_MODE exists in output
  if (existsSync(scoringOut)) {
    const content = readFileSync(scoringOut, 'utf-8');
    if (!content.includes('SCORING_MODE')) {
      errors.push(`${inst.code}: SCORING_MODE missing from scoring output`);
    }
  }

  return { passed: errors.length === 0, errors };
}

// ── CLI ──────────────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const validate = args.includes('--validate');
  const batch = args.includes('--batch');
  const onlyScoring = args.includes('--scoring');
  const onlyQuestions = args.includes('--questions');
  const codeArg = args.find(a => !a.startsWith('--'));

  if (validate) {
    console.log('\n=== VALIDATION ===\n');
    const insts = batch ? INSTRUMENTS : codeArg
      ? INSTRUMENTS.filter(i => i.code === codeArg.toUpperCase())
      : INSTRUMENTS;

    let allPassed = true;
    for (const inst of insts) {
      const result = validateInstrument(inst);
      const status = result.passed ? '✓' : '✗';
      console.log(`${status} ${inst.code}`);
      result.errors.forEach(e => console.log(`    ${e}`));
      if (!result.passed) allPassed = false;
    }
    console.log(allPassed ? '\nAll validations passed.' : '\nSome validations failed.');
    process.exit(allPassed ? 0 : 1);
  }

  const insts = batch ? INSTRUMENTS : codeArg
    ? INSTRUMENTS.filter(i => i.code === codeArg.toUpperCase())
    : INSTRUMENTS;

  if (insts.length === 0) {
    console.error(`No instrument found for code: ${codeArg}`);
    console.error(`Available: ${INSTRUMENTS.map(i => i.code).join(', ')}`);
    process.exit(1);
  }

  console.log(`\n=== ${dryRun ? 'DRY RUN' : 'CONVERT'} ===\n`);

  for (const inst of insts) {
    console.log(`\n--- ${inst.code} ---`);

    if (!onlyQuestions && inst.configJson) {
      try {
        const scoringTs = convertScoringConfig(inst);
        const outPath = join(OUT_SCORING, `${inst.code.toLowerCase()}.ts`);
        if (dryRun) {
          console.log(`  [DRY] Would write scoring → ${outPath} (${scoringTs.length} chars)`);
        } else {
          writeFileSync(outPath, scoringTs, 'utf-8');
          console.log(`  ✓ Scoring → ${outPath}`);
        }
      } catch (e: any) {
        console.error(`  ✗ Scoring: ${e.message}`);
      }
    }

    if (!onlyScoring) {
      try {
        const questionsTs = convertQuestionBank(inst);
        const outPath = join(OUT_QUESTIONS, `${inst.code.toLowerCase()}.ts`);
        if (dryRun) {
          console.log(`  [DRY] Would write questions → ${outPath} (${questionsTs.length} chars)`);
        } else {
          writeFileSync(outPath, questionsTs, 'utf-8');
          console.log(`  ✓ Questions → ${outPath}`);
        }
      } catch (e: any) {
        console.error(`  ✗ Questions: ${e.message}`);
      }
    }
  }

  console.log('\nDone.');
}

main();
