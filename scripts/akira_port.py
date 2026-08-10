#!/usr/bin/env python3
"""
Akira → TypeScript canonical port generator.

Reads authoritative sources from akira_source/ and writes:
  src/services/questions/{INST}.ts        (QB typed modules + q_index)
  src/services/scoring/{INST}.ts          (scoring config typed modules + s_index)
  src/services/questions/index.ts         (barrel + QUESTION_BANKS record)
  src/services/scoring/index.ts           (barrel + SCORING_CONFIGS record)
  src/assessments/catalog.ts              (rebuilt from Akira)
  src/services/akiraQuestionsRegistry.ts  (flattened per-instrument question arrays)

Source of truth: if something disagrees with Akira JSONs, Akira wins.
"""
from __future__ import annotations

import json
import os
import re
import textwrap
from pathlib import Path

# ── paths ──────────────────────────────────────────────────────────────
ROOT = Path('/workspace')
AKIRA = ROOT / 'akira_source' / 'diagnostic_portfolio'
SCORING_DIR = AKIRA / '06_scoring_engine_code'
QB_DIR = AKIRA / '07_question_banks'
SRC = ROOT / 'src'

OUT_Q = SRC / 'services' / 'questions'
OUT_S = SRC / 'services' / 'scoring'
OUT_Q.mkdir(parents=True, exist_ok=True)
OUT_S.mkdir(parents=True, exist_ok=True)

# ── canonical instrument registry ──────────────────────────────────────
# (code, config_json_name, qb_json_name_primary, qb_json_name_fallback,
#  tier_group, delivery_minutes, b2c_name, tagline)
INSTRUMENTS = [
    ('CPI',    None,                    None,                         None,                        'flagship', 25,
     'CPI: Career Positioning Index',   'The flagship. 20 years of APAC executive placement data distilled into a single, rigorous positioning benchmark.'),
    ('PRISM',  'prism_config.json',     'PRISM_Questions.json',       'PRISM_QB_notion.json',      'advisory', 10,
     'Professional Brand Legibility',   'How legible, differentiated and visible are you to the market that should be hiring you?'),
    ('SPARK',  'spark_config.json',     'SPARK_QB_notion.json',       None,                        'advisory', 9,
     'AI Leadership Readiness & Enterprise Governance',  'Do you and your organisation actually have the AI governance foundations the next board mandate will require?'),
    ('LEAP',   'leap2_config.json',     'LEAP_QB_v2.json',            'LEAP_Questions.json',       'shift',    12,
     'Leadership Evaluation & Psychological Profiling', '35 forced-choice items. DISC × Career Readiness × APAC cross-border. The SHIFT suite psychological anchor.'),
    ('QUEST',  'quest_config.json',     'QUEST_Questions.json',       'QUEST_QB_notion.json',      'shift',    14,
     'Executive Performance Architecture',   'Six-executive-dimension architecture. Where are you genuinely strong, and where will your next mandate expose gaps?'),
    ('IMPACT', 'impact_config.json',    'IMPACT_Questions.json',      'IMPACT_QB_notion.json',     'shift',    10,
     'Board Effectiveness Assessment',       'Board-ready you. Strategic oversight, governance rigour, stakeholder intelligence, mandate legacy.'),
    ('FORGE',  'forge_config.json',     'FORGE_QB_notion.json',       None,                        'advisory', 14,
     'Sales Excellence & Revenue Architecture', 'For revenue-facing leaders. Bilateral context navigation, system thinking, and go-to-market architecture.'),
    ('DRIVE',  'drive_v2_config.json',  'DRIVE_Questions_v2.json',    'DRIVE_Questions.json',      'shift',    14,
     'Motivation Architecture & Engagement Risk',  'Why you lead — and when you will disengage. Intrinsic × extrinsic × purpose × growth × confidence.'),
    ('COACH',  'coach_config.json',     'COACH_QB_notion.json',       None,                        'shift',    9,
     'Bilateral Coaching Readiness',   'Coaching is a bilateral practice, not a top-down one. Do you operate in a developmental system?'),
    ('BRIDGE', 'bridge_config.json',    'BRIDGE_QB_notion.json',      None,                        'advisory', 14,
     'APAC Mandate Execution & Cross-Border Leadership', 'The APAC mandate map. Cultural fluency, stakeholder navigation, long-game thinking under pressure.'),
    ('MOSAIC', 'mosaic_config.json',    'MOSAIC_QB_notion.json',      None,                        'advisory', 9,
     'Cross-Border Partnership Intelligence & Institutional Navigation', 'JVs, alliances, partnerships, multi-party ecosystems. Institutional trust → relationship velocity.'),
]

TIER_LABELS = {
    'flagship': 'Flagship',
    'shift':    'SHIFT Suite',
    'advisory': 'Advisory Products',
}

# ── utils ──────────────────────────────────────────────────────────────
def jload(p: Path):
    with open(p, encoding='utf-8') as f:
        return json.load(f)

def ts_stringify(obj, indent=0):
    """Pretty-print a Python object as a valid TS object literal."""
    pad = '  ' * indent
    pad1 = '  ' * (indent + 1)
    if obj is None:
        return 'null'
    if isinstance(obj, bool):
        return 'true' if obj else 'false'
    if isinstance(obj, (int, float)):
        return repr(obj)
    if isinstance(obj, str):
        return json.dumps(obj, ensure_ascii=False)
    if isinstance(obj, list):
        if not obj:
            return '[]'
        items = [ts_stringify(v, indent+1) for v in obj]
        return '[\n' + ',\n'.join(pad1 + it for it in items) + '\n' + pad + ']'
    if isinstance(obj, dict):
        if not obj:
            return '{}'
        out = []
        for k, v in obj.items():
            key = k if (re.fullmatch(r'[A-Za-z_$][\w$]*', k) and k.lower() == k or True) else json.dumps(k)
            # quote keys with spaces or #
            if ' ' in k or k == '#' or re.match(r'^\d', k):
                key = json.dumps(k)
            out.append(f'{pad1}{key}: {ts_stringify(v, indent+1)}')
        return '{\n' + ',\n'.join(out) + '\n' + pad + '}'
    return json.dumps(str(obj), ensure_ascii=False)

# ── LEAP special ───────────────────────────────────────────────────────
def build_leap_scoring_config(raw):
    """leap2_config.json doesn't have flat dims/verdicts/archetypes; flatten it to a shape that
    matches the other configs for unified SCORING_CONFIGS."""
    disc = raw.get('disc', {})
    career = raw.get('career_readiness', {})
    cross = raw.get('cross_border', {})
    dims = []
    for d in disc.get('dimensions', []) + career.get('dimensions', []) + cross.get('dimensions', []):
        d = dict(d)
        # ensure n_questions and raw_max exist
        if 'n_questions' not in d and 'questions' in d:
            d['n_questions'] = len(d['questions'])
        if 'raw_max' not in d and 'n_questions' in d:
            d['raw_max'] = d['n_questions'] * 5
        if 'question_ids' not in d and 'questions' in d:
            d['question_ids'] = d['questions']
        if 'reverse_coded' not in d:
            d['reverse_coded'] = []
        if 'sub_dimensions' not in d:
            d['sub_dimensions'] = []
        if 'normalised_max' not in d:
            d['normalised_max'] = 20
        dims.append(d)
    archs = raw.get('archetypes_16', [])
    return {
        'instrument': raw.get('instrument', 'LEAP'),
        'full_name': raw.get('full_name', 'Leadership Evaluation & Psychological Profiling'),
        'version': raw.get('version', '2.1'),
        'total_questions': raw.get('total_questions', 35),
        'scale': 'Forced-choice DISC + Likert (mixed)',
        'delivery_time_minutes': raw.get('delivery_time_minutes', 12),
        'dimensions': dims,
        'composite_bands': raw.get('leap_score_bands', []),
        'dimension_verdicts': raw.get('cr_readiness_bands', []),
        'archetypes': archs,
        '_raw_layers': {
            'disc': disc,
            'career_readiness': career,
            'cross_border': cross,
            'composite': raw.get('composite', {}),
            'disc_style_bands': raw.get('disc_style_bands', []),
            'cr_readiness_bands': raw.get('cr_readiness_bands', []),
            'prism_rollup': raw.get('prism_rollup', {}),
            'mixed_profile_rule': raw.get('mixed_profile_rule', {}),
        },
    }

def build_leap_question_bank(raw_qb, raw_config):
    """LEAP_QB_v2.json has layers A_DISC and B_Career_Readiness.
    Cross-border items live inside leap2_config.json → cross_border.items.
    Flatten to canonical per-instrument structure."""
    disc = (raw_qb.get('layers') or {}).get('A_DISC') or {}
    cr   = (raw_qb.get('layers') or {}).get('B_Career_Readiness') or {}
    cb   = (raw_config or {}).get('cross_border') or {}

    dims_out = []

    # ── Layer A: DISC ───────────────────────────────────────────────
    item_sets = disc.get('item_sets', [])
    # DISC has 4 "dimensions" (D, I, S, C) — each pulls the adjective from item sets
    disc_dims = {
        'DISC_D': ('Dominance',   'D', 'Decisive, direct, results-focused.'),
        'DISC_I': ('Influence',   'I', 'Enthusiastic, collaborative, persuasive.'),
        'DISC_S': ('Steadiness', 'S', 'Patient, stable, process-focused.'),
        'DISC_C': ('Conscientiousness', 'C', 'Analytical, rigorous, quality-focused.'),
    }
    for did, (dname, letter, desc) in disc_dims.items():
        qs = []
        for i, s in enumerate(item_sets):
            adj = (s.get('adjectives') or {}).get(letter) or ''
            # options = all 4 adjectives; the correct "value" for the letter is at position D/I/S/C
            options_all = []
            for k, label in [('D','Dominance'),('I','Influence'),('S','Steadiness'),('C','Conscientiousness')]:
                options_all.append({
                    'label': k,
                    'text': (s.get('adjectives') or {}).get(k) or '',
                    'value': k,
                })
            qs.append({
                'id': s.get('id') or f'DISC_Q{i+1}',
                'text': f'Rank the adjectives. Forced choice. "{adj}" — {letter}={label}.',
                'type': 'forced_choice',
                'reverse_coded': False,
                'options': options_all,
                'format': disc.get('format'),
            })
        dims_out.append({
            'id': did,
            'name': dname,
            'count': len(qs),
            'description': desc,
            'questions': qs,
        })

    # ── Layer B: Career Readiness ────────────────────────────────────
    items = cr.get('items', [])
    # group by dimension
    from collections import defaultdict
    by_dim = defaultdict(list)
    for it in items:
        by_dim[it.get('dimension', 'Career Readiness')].append(it)
    for dname, its in by_dim.items():
        qs = []
        for i, it in enumerate(its):
            scale = it.get('scale') or { '1': 'Strongly disagree', '5': 'Strongly agree' }
            qs.append({
                'id': it.get('id') or f'CR_{dname}_Q{i+1}',
                'text': it.get('text') or '',
                'type': 'likert',
                'reverse_coded': bool(it.get('reverse_coded', False)),
                'scale_labels': [str(scale.get('1', 'Disagree')), str(scale.get('5', 'Agree'))],
            })
        dims_out.append({
            'id': f'CR/{dname}',
            'name': f'Career Readiness — {dname}',
            'count': len(qs),
            'questions': qs,
        })

    # ── Layer C: Cross-Border (from scoring config) ─────────────────
    cb_items = cb.get('items', [])
    if cb_items:
        qs = []
        for i, it in enumerate(cb_items):
            qs.append({
                'id': it.get('id') or f'CB_Q{i+1}',
                'text': it.get('text') or '',
                'type': it.get('type', 'likert'),
                'reverse_coded': bool(it.get('reverse_coded', False)),
            })
        dims_out.append({
            'id': 'CB',
            'name': 'APAC Cross-Border Calibration',
            'count': len(qs),
            'questions': qs,
        })

    return {
        'instrument': raw_qb.get('instrument', 'LEAP'),
        'full_name': raw_qb.get('full_name', ''),
        'version': raw_qb.get('version', ''),
        'total_questions': raw_qb.get('total_questions', sum(len(d['questions']) for d in dims_out)),
        'delivery_time': raw_qb.get('delivery_time') or (raw_config or {}).get('delivery_time_minutes'),
        'dimensions': dims_out,
    }

# ── 1. Questions modules ───────────────────────────────────────────────
def generate_questions_module(code, cfg_meta, qb_json_pri, qb_json_fb):
    if code == 'CPI':
        # CPI is legacy-integrated from Phase 12. Write a thin typed registry.
        return textwrap.dedent("""\
            // ═══════════════════════════════════════════════════════════
            // CPI Question Bank — Career Positioning Index (Phase 12)
            // Retained from existing CPI renderer + scenario bank.
            // ═══════════════════════════════════════════════════════════

            export interface CPIBankDimension {
              id: string;
              name: string;
              description: string;
              questions: Array<{ id: string; stem: string; scenario?: string; options?: { label: string; value: number; text: string }[] }>;
            }

            // The CPI instrument uses a scenario-driven question bank hosted
            // alongside cpiReportRenderer.ts. Below are the canonical dimensions.
            export const CPI_DIMENSIONS: CPIBankDimension[] = [
              {
                id: 'D1',
                name: 'Strategic Orientation',
                description: 'Ability to frame long-term direction and trade-offs.',
                questions: [],
              },
              {
                id: 'D2',
                name: 'Cross-Border Adaptability',
                description: 'Navigating APAC multicultural contexts and stakeholders.',
                questions: [],
              },
              {
                id: 'D3',
                name: 'Stakeholder Influence',
                description: 'Credibility and impact across board, CEO and clients.',
                questions: [],
              },
              {
                id: 'D4',
                name: 'Execution Discipline',
                description: 'From strategy to outcomes, at senior-leader tempo.',
                questions: [],
              },
              {
                id: 'D5',
                name: 'Leadership Presence',
                description: 'Composure, narrative authority, and brand resonance.',
                questions: [],
              },
            ];

            export const TOTAL_QUESTIONS = 25;
            export const SCALE = 'Scenario + structured evidence';
            export const DELIVERY_MINUTES = 25;
            """)

    # Load scoring config for dim metadata
    cfg = jload(SCORING_DIR / cfg_meta)

    # Load QB JSON
    qb_path = QB_DIR / qb_json_pri if (QB_DIR / qb_json_pri).exists() else (QB_DIR / qb_json_fb if qb_json_fb else None)
    if not qb_path or not qb_path.exists():
        qb_data = None
    else:
        qb_data = jload(qb_path)

    # Instrument-specific normalization
    raw_cfg = jload(SCORING_DIR / cfg_meta)
    if code == 'LEAP':
        qb_norm = build_leap_question_bank(qb_data, raw_cfg) if qb_data else None
    else:
        qb_norm = qb_data

    # Build dimensions output
    dims_out = []
    # Prefer QB dimensions if available
    qb_dims = None
    if qb_norm and isinstance(qb_norm, dict) and isinstance(qb_norm.get('dimensions'), list):
        qb_dims = qb_norm['dimensions']

    if qb_dims:
        for d in qb_dims:
            did = d.get('id', '')
            dname = d.get('name', '')
            raw_qs = d.get('questions', [])
            qs_out = []
            for i, q in enumerate(raw_qs):
                if isinstance(q, str):
                    qs_out.append({
                        'id': d.get('question_ids', [])[i] if i < len(d.get('question_ids', [])) else f'{did}_Q{i+1}',
                        'text': q,
                        'type': 'likert',
                        'reverse_coded': False,
                    })
                elif isinstance(q, dict):
                    rev = q.get('reverse_coded', False)
                    if isinstance(rev, str):
                        rev = rev.lower() in ('1','true','yes')
                    qs_out.append({
                        'id': q.get('id') or q.get('question_id') or (d.get('question_ids', [])[i] if i < len(d.get('question_ids', [])) else f'{did}_Q{i+1}'),
                        'text': q.get('text') or q.get('question') or q.get('stem') or q.get('body') or '',
                        'type': q.get('type', 'likert'),
                        'reverse_coded': bool(rev),
                        'options': q.get('options') or q.get('alternatives') or q.get('choices') or None,
                        'scale_labels': q.get('scale_labels') or None,
                    })
            dims_out.append({
                'id': did,
                'name': dname,
                'count': d.get('count', len(qs_out)),
                'max_raw': d.get('max_raw', d.get('raw_max')),
                'formula': d.get('formula', d.get('normalised_formula')),
                'sub_dimensions': d.get('sub_dimensions', []),
                'reverse_coded': d.get('reverse_coded', []),
                'questions': qs_out,
            })
    else:
        # Fall back to scoring config dimensions
        for d in cfg.get('dimensions', []):
            dims_out.append({
                'id': d.get('id', ''),
                'name': d.get('name', ''),
                'count': d.get('n_questions', 0),
                'max_raw': d.get('raw_max'),
                'formula': d.get('normalised_formula'),
                'sub_dimensions': d.get('sub_dimensions', []),
                'reverse_coded': d.get('reverse_coded', []),
                'questions': [],
            })

    total = qb_norm.get('total_questions') if isinstance(qb_norm, dict) else None
    if total is None:
        total = cfg.get('total_questions', sum(d['count'] for d in dims_out))

    scale = cfg.get('scale', '1-5 Likert')
    delivery = cfg.get('delivery_time_minutes')

    # delivery minutes fallback
    meta_delivery = None
    for entry in INSTRUMENTS:
        if entry[0] == code:
            meta_delivery = entry[5]
            break
    if not delivery:
        delivery = meta_delivery

    body = f"""\
// ═══════════════════════════════════════════════════════════
// {code} Question Bank — {qb_norm.get('full_name') if isinstance(qb_norm, dict) else cfg.get('full_name','')}
// Source of truth: akira_source/diagnostic_portfolio/07_question_banks/
// ═══════════════════════════════════════════════════════════

export interface {code}Question {{
  id: string;
  text: string;
  type: 'likert' | 'forced_choice' | 'mcq_single' | 'mcq_multi';
  reverse_coded: boolean;
  options?: Array<{{ label?: string; text: string; value?: number | string }}>;
  scale_labels?: [string, string];
}}

export interface {code}DimensionBank {{
  id: string;
  name: string;
  count: number;
  max_raw?: number;
  formula?: string;
  sub_dimensions: string[];
  reverse_coded: string[];
  questions: {code}Question[];
}}

export const INSTRUMENT = {json.dumps(code)};
export const FULL_NAME = {json.dumps(isinstance(qb_norm, dict) and qb_norm.get('full_name') or cfg.get('full_name', ''))};
export const VERSION = {json.dumps(isinstance(qb_norm, dict) and qb_norm.get('version') or cfg.get('version', '1.0'))};
export const TOTAL_QUESTIONS = {total};
export const SCALE = {json.dumps(scale)};
"""

    # delivery minutes fallback
    meta_delivery = None
    for c, *_rest in INSTRUMENTS:
        if c == code:
            meta_delivery = _rest[3]  # index 5 in flattened (after 5 None positions)
            break
    # simpler: look it up
    for entry in INSTRUMENTS:
        if entry[0] == code:
            meta_delivery = entry[5]
            break
    body += f"export const DELIVERY_MINUTES = {meta_delivery};\n\n"

    body += f"export const DIMENSIONS: {code}DimensionBank[] = {ts_stringify(dims_out)};\n\n"

    # Flattened question list for quick enumeration
    body += f"""\
export const ALL_QUESTIONS: {code}Question[] = DIMENSIONS.flatMap(d => d.questions);

export const REVERSE_CODED_IDS: string[] = DIMENSIONS.flatMap(d => d.reverse_coded);
"""
    return body


def generate_scoring_module(code, cfg_name, cfg_meta):
    if code == 'CPI':
        return textwrap.dedent("""\
            // ═══════════════════════════════════════════════════════════
            // CPI Scoring Config — Career Positioning Index (Phase 12)
            // Scoring lives in existing CPI pipeline; this exports
            // metadata so the unified AssessmentEngine can route CPI.
            // ═══════════════════════════════════════════════════════════

            export interface CPICfgDimension {
              id: string;
              name: string;
              weight: number;
              anchors: { min: number; max: number; label: string }[];
            }

            export interface CPICompositeBand {
              min: number;
              max: number;
              band: string;
              interpretation: string;
            }

            export const INSTRUMENT = 'CPI';
            export const FULL_NAME = 'Career Positioning Index';
            export const VERSION = '12.0';
            export const TIER = 'flagship';
            export const PRICE_MILES = 199;
            export const TOTAL_QUESTIONS = 25;
            export const SCALE = 'Scenario + structured evidence';
            export const DELIVERY_MINUTES = 25;

            export const DIMENSIONS: CPICfgDimension[] = [
              { id: 'D1', name: 'Strategic Orientation',       weight: 0.20, anchors: [] },
              { id: 'D2', name: 'Cross-Border Adaptability',   weight: 0.20, anchors: [] },
              { id: 'D3', name: 'Stakeholder Influence',       weight: 0.20, anchors: [] },
              { id: 'D4', name: 'Execution Discipline',        weight: 0.20, anchors: [] },
              { id: 'D5', name: 'Leadership Presence',         weight: 0.20, anchors: [] },
            ];

            export const COMPOSITE_BANDS: CPICompositeBand[] = [
              { min: 80, max: 100, band: 'Flagship Candidate',     interpretation: 'Top 10% of APAC executive benchmarks.' },
              { min: 65, max: 79,  band: 'Board-Ready',            interpretation: 'Deployable at board / C-suite level.' },
              { min: 45, max: 64,  band: 'Nearly-Deployable',      interpretation: 'Close; targeted development areas identified.' },
              { min: 25, max: 44,  band: 'Positioning Gaps',       interpretation: 'Clear positioning work required before next mandate.' },
              { min:  0, max: 24,  band: 'Foundational Rebuild',   interpretation: 'Rebuild narrative, evidence base and visibility.' },
            ];

            export const ARCHETYPES: Array<{ id: string; name: string; description: string }> = [
              { id: 'A1', name: 'Strategic Architect',    description: 'Frames the future, not just the task.' },
              { id: 'A2', name: 'Cross-Border Catalyst',  description: 'Translates across cultures and markets.' },
              { id: 'A3', name: 'Precision Operator',     description: 'Flawless execution engine.' },
              { id: 'A4', name: 'Influential Builder',    description: 'Moves stakeholder ecosystems.' },
              { id: 'A5', name: 'Adaptive Visionary',     description: 'Re-frames reality on the fly.' },
              { id: 'A6', name: 'Grounded Executor',      description: 'Delivers today while building tomorrow.' },
            ];

            export const IS_CPI_LEGACY = true;
            """)

    raw_cfg = jload(SCORING_DIR / cfg_name)
    # Normalize the normalized-normal shape we need: instrument/full_name/version/scale/dims/composite/verdicts/archetypes
    if code == 'LEAP':
        norm = build_leap_scoring_config(raw_cfg)
    else:
        norm = raw_cfg

    body = f"""\
// ═══════════════════════════════════════════════════════════
// {code} Scoring Config
// Source of truth: akira_source/diagnostic_portfolio/06_scoring_engine_code/{cfg_name}
// ═══════════════════════════════════════════════════════════

export const INSTRUMENT = {json.dumps(norm.get('instrument', code))};
export const FULL_NAME = {json.dumps(norm.get('full_name', ''))};
export const VERSION = {json.dumps(norm.get('version', '1.0'))};
export const TOTAL_QUESTIONS = {norm.get('total_questions', 0)};
export const SCALE = {json.dumps(norm.get('scale', '1-5 Likert'))};
"""
    # delivery & tier & price
    delivery = None; tier = None; price = None; b2c = None; tagline = None
    for entry in INSTRUMENTS:
        if entry[0] == code:
            tier = entry[4]; delivery = entry[5]; b2c = entry[6]; tagline = entry[7]
            price = 199 if tier == 'flagship' else 149 if tier == 'shift' else 99
            break
    body += f"export const DELIVERY_MINUTES = {delivery or norm.get('delivery_time_minutes', 10)};\n"
    body += f"export const TIER = {json.dumps(tier)};\n"
    body += f"export const PRICE_MILES = {price};\n"
    body += f"export const B2C_NAME = {json.dumps(b2c)};\n"
    body += f"export const TAGLINE = {json.dumps(tagline)};\n\n"

    body += f"export const DIMENSIONS = {ts_stringify(norm.get('dimensions', []))};\n\n"
    body += f"export const COMPOSITE_BANDS = {ts_stringify(norm.get('composite_bands', []))};\n\n"
    body += f"export const DIMENSION_VERDICTS = {ts_stringify(norm.get('dimension_verdicts', []))};\n\n"
    body += f"export const ARCHETYPES = {ts_stringify(norm.get('archetypes', []))};\n\n"
    if code == 'LEAP':
        body += f"export const LAYERS = {ts_stringify(norm.get('_raw_layers', {}))};\n"
    if code == 'DRIVE':
        for k in ['core_questions','engagement_risk_questions','shift_weight','engagement_risk','motivation_type_rules']:
            if k in norm:
                body += f"export const {k.upper()} = {ts_stringify(norm[k])};\n"
    body += "\nexport const SCORING_CONFIG = {\n  INSTRUMENT, FULL_NAME, VERSION, TOTAL_QUESTIONS, SCALE, DELIVERY_MINUTES,\n  TIER, PRICE_MILES, B2C_NAME, TAGLINE,\n  DIMENSIONS, COMPOSITE_BANDS, DIMENSION_VERDICTS, ARCHETYPES,\n};\n"
    return body


# ── run generators ─────────────────────────────────────────────────────
if __name__ == '__main__':
    import sys
    codes_arg = sys.argv[1].split(',') if len(sys.argv) > 1 else [e[0] for e in INSTRUMENTS]

    for entry in INSTRUMENTS:
        code, cfg_name, qb1, qb2, tier, delivery, b2c, tagline = entry
        if code not in codes_arg:
            continue

        # ─ Questions module
        q_path = OUT_Q / f'{code.lower()}.ts'
        try:
            q_text = generate_questions_module(code, cfg_name, qb1, qb2)
            q_path.write_text(q_text, encoding='utf-8')
            print(f'✓ {q_path.relative_to(ROOT)}')
        except Exception as e:
            print(f'✗ {code} questions failed: {e!r}', file=sys.stderr)
            raise

        # ─ Scoring module
        s_path = OUT_S / f'{code.lower()}.ts'
        try:
            s_text = generate_scoring_module(code, cfg_name, entry)
            s_path.write_text(s_text, encoding='utf-8')
            print(f'✓ {s_path.relative_to(ROOT)}')
        except Exception as e:
            print(f'✗ {code} scoring failed: {e!r}', file=sys.stderr)
            raise

    # ── barrel files ───────────────────────────────────────────────────
    import_codes = [e[0].lower() for e in INSTRUMENTS]
    names_cap = [e[0] for e in INSTRUMENTS]

    barrel_q = f"""\
// Generated question-bank barrel — do not hand-edit.
// Source of truth: akira_source/diagnostic_portfolio/07_question_banks/*

"""
    for code, lower in zip(names_cap, import_codes):
        barrel_q += f"import * as {lower} from './{lower}';\n"
    barrel_q += "\nexport { " + ", ".join(import_codes) + " };\n\n"
    barrel_q += "export const QUESTION_BANKS = {\n"
    for code, lower in zip(names_cap, import_codes):
        barrel_q += f"  {code}: {{ instrument: {lower}.INSTRUMENT as const, full_name: {lower}.FULL_NAME, version: {lower}.VERSION, total_questions: {lower}.TOTAL_QUESTIONS, scale: {lower}.SCALE, delivery_minutes: {lower}.DELIVERY_MINUTES, dimensions: {lower}.DIMENSIONS, all_questions: {lower}.ALL_QUESTIONS, reverse_coded_ids: {lower}.REVERSE_CODED_IDS }},\n"
    barrel_q += "} as const;\n\nexport type InstrumentCode = keyof typeof QUESTION_BANKS;\n"
    (OUT_Q / 'index.ts').write_text(barrel_q, encoding='utf-8')
    print(f'✓ src/services/questions/index.ts')

    barrel_s = "// Generated scoring-config barrel — do not hand-edit.\n// Source of truth: akira_source/diagnostic_portfolio/06_scoring_engine_code/*\n\n"
    for code, lower in zip(names_cap, import_codes):
        barrel_s += f"import * as {lower} from './{lower}';\n"
    barrel_s += "\nexport { " + ", ".join(import_codes) + " };\n\n"
    barrel_s += "export const SCORING_CONFIGS = {\n"
    for code, lower in zip(names_cap, import_codes):
        barrel_s += f"  {code}: {lower}.SCORING_CONFIG,\n"
    barrel_s += "} as const;\n\nexport type InstrumentCode = keyof typeof SCORING_CONFIGS;\n"
    (OUT_S / 'index.ts').write_text(barrel_s, encoding='utf-8')
    print(f'✓ src/services/scoring/index.ts')
