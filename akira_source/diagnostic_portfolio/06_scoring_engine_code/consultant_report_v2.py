"""
SHIFT Suite — Consultant Debrief Report v2 Generator
Enhanced with GROW Coaching Methodology + Advisory Discovery Framework.
Each dimension includes:
  - Original consultant content (interpretation, debrief language, probing, risk, cultural, tensions)
  - NEW: GROW Coaching Questions (Goal/Reality/Options/Will) — upsell coaching
  - NEW: Advisory Discovery — structured questions mapping to LYC service lines
  - NEW: Per-dimension service-line mapping (which LYC service to open)
"""
import json, os, sys, random, requests, time, re

sys.path.insert(0, '.')
from shift_engine import ShiftScorer

DS_KEY = "sk-4ed5f3dd979b406c8cf88861ce859e70"
DS_URL = "https://api.deepseek.com/v1/chat/completions"

def call_ds(prompt, max_tokens=7000, temp=0.3):
    resp = requests.post(DS_URL, headers={
        "Authorization": f"Bearer {DS_KEY}",
        "Content-Type": "application/json"
    }, json={
        "model": "deepseek-chat",
        "messages": [{"role": "system", "content": "Output ONLY valid JSON. Escape all internal double quotes with backslash. Never use raw double quotes inside string values."},
                     {"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
        "temperature": temp
    }, timeout=240)
    raw = resp.json()["choices"][0]["message"]["content"].strip()
    # Strip markdown fences
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:])
        if raw.endswith("```"): raw = raw[:-3].strip()
    return json.loads(raw)


def _build_consultant_staircase(scored, config):
    """Build staircase dimension overview chart for consultant debrief v6."""
    dims = config.get("dimensions", [])
    ds = scored.get("dimension_scores", {})
    dim_data = []
    for dim in dims:
        dname = dim["name"]
        did = dim.get("id", dname)
        dd = ds.get(did) or ds.get(dname)
        if dd is None:
            for k, v in ds.items():
                if dname.lower() in k.lower() or k.lower() in dname.lower():
                    dd = v
                    break
        if dd is None:
            continue
        norm = dd.get("normalised", 0)
        norm_max = dd.get("normalised_max", 20)
        pct = (norm / norm_max * 100) if norm_max > 0 else 0
        if pct >= 85: color = "#0F1115"
        elif pct >= 70: color = "#C108AB"
        elif pct >= 50: color = "#6E7A8A"
        else: color = "#B0B0B8"
        dim_data.append((dname, norm, pct, color))
    dim_data.sort(key=lambda x: x[2], reverse=True)
    cols = ""
    for name, norm, pct, color in dim_data:
        bar_h = pct * 1.5
        cols += f'<div class="stair-col"><div class="stair-val" style="color:{color}">{norm:.1f}</div><div class="stair-bar" style="height:{bar_h:.0f}px;background:{color}"></div><div class="stair-label">{name}</div></div>'
    html = f'<div class="staircase-wrap">{cols}</div><div class="stair-axis"><span>0</span><span>5</span><span>10</span><span>15</span><span>20</span></div>'
    return html

# ─── GROW + Advisory Content Generation ───

def generate_grow_content(inst_name, full_name, dim_name, sub_dims, is_business):
    """Generate GROW coaching questions for this dimension."""
    context = "organisational/business dynamics" if is_business else "individual leadership capability"
    sub_str = ", ".join(sub_dims) if sub_dims else "5 relevant sub-dimensions"
    
    prompt = f"""Generate GROW coaching methodology content as JSON for a consultant debriefing assessment results.

Instrument: {inst_name} — {full_name}
Dimension: {dim_name}
Sub-dimensions: {sub_str}
Context: {context}

PURPOSE: These questions help the consultant understand MORE CONTEXT from the leader.
The answers will naturally surface coaching opportunities and open doors for coaching program upsell.

The GROW model:
- GOAL: Questions that help the leader articulate their desired future state. Reveals ambition level, self-awareness gaps, and natural coaching entry points.
- REALITY: Questions that surface current obstacles, patterns, blind spots. Reveals depth of need and readiness to engage in deeper work.
- OPTIONS: Questions that expand thinking beyond current frame. Reveals whether the leader thinks in limited or expansive ways — signals appetite for structured development.
- WILL (WAY FORWARD): Questions that move toward commitment. Reveals readiness level and creates natural transition to coaching engagement discussion.

Return JSON:
{{
  "grow_questions": {{
    "goal": [
      {{"question": "Specific reflective question that surfaces the leader's aspiration related to this dimension", "coaching_signal": "What the answer reveals about coaching readiness", "upsell_angle": "How this naturally leads to a coaching conversation"}}
    ],
    "reality": [
      {{"question": "Question that surfaces current obstacles or patterns", "coaching_signal": "What this reveals", "upsell_angle": "Coaching entry point"}}
    ],
    "options": [
      {{"question": "Question that expands thinking", "coaching_signal": "What this reveals", "upsell_angle": "Coaching entry point"}}
    ],
    "will": [
      {{"question": "Question that moves toward commitment", "coaching_signal": "What this reveals", "upsell_angle": "How to transition to coaching offer"}}
    ]
  }},
  "coaching_transition_script": "A 3-4 sentence script the consultant can use to naturally transition from this dimension's debrief into a coaching program conversation. Should feel organic, not salesy.",
  "coaching_program_recommendations": [
    {{"program_type": "e.g., Executive Coaching, Leadership Acceleration, Team Effectiveness, Strategic Thinking Lab", "rationale": "Why this leader would benefit based on their dimension score pattern", "entry_point": "How to introduce it in the conversation"}}
  ]
}}

Make questions genuinely reflective and insightful — not surface-level. Each question should feel like something a world-class coach would ask. APAC-calibrated (respect hierarchy, face-saving, indirect communication styles)."""

    try:
        return call_ds(prompt, max_tokens=5000)
    except Exception as e:
        print(f"      GROW error: {e}")
        return None

def generate_advisory_content(inst_name, full_name, dim_name, sub_dims, is_business, other_dims):
    """Generate Advisory Discovery framework for this dimension."""
    sub_str = ", ".join(sub_dims) if sub_dims else "5 relevant sub-dimensions"
    other_dims_str = ", ".join(other_dims[:3])
    
    # Build service lines based on instrument type
    if inst_name in ["SPARK", "FORGE", "MOSAIC", "BRIDGE"]:
        primary_services = "advisory, org alignment workshops, cultural mapping, team diagnostics, executive search, cross-border talent programs"
    elif inst_name == "COACH":
        primary_services = "coach certification programs, leadership development workshops, team coaching, executive coaching referral, supervision programs"
    elif inst_name == "DRIVE":
        primary_services = "leadership development programs, executive coaching, career acceleration workshops, retention strategy advisory, talent mapping"
    elif inst_name == "QUEST":
        primary_services = "executive assessment, leadership advisory, board effectiveness review, succession planning, executive search, strategic offsite facilitation"
    elif inst_name == "IMPACT":
        primary_services = "governance advisory, board evaluation, mandate design consultancy, stakeholder mapping, APAC market entry strategy"
    elif inst_name == "PRISM":
        primary_services = "brand strategy advisory, reputation management, narrative consulting, market positioning workshops, communications audit"
    else:
        primary_services = "leadership advisory, team workshops, executive coaching, organizational diagnostics"
    
    prompt = f"""Generate Advisory Discovery methodology content as JSON for a consultant debriefing assessment results.

Instrument: {inst_name} — {full_name}
Dimension: {dim_name}
Sub-dimensions: {sub_str}
Other dimensions in this instrument: {other_dims_str}
Available LYC service lines: {primary_services}

PURPOSE: This is a structured methodology that helps the consultant:
1. Ask discovery questions that reveal ORGANIZATIONAL-LEVEL needs (beyond the individual)
2. Map the leader's answers to specific LYC service offerings
3. Create natural, non-salesy conversations about advisory, workshops, exec search, mapping, diagnostics programs

The consultant is debriefing a leader's assessment results. Through strategic questioning, the consultant should uncover:
- Team/org patterns behind the individual's scores
- Systemic issues that no single coaching engagement can fix
- Opportunities for broader organizational interventions
- Natural entry points for LYC's advisory and consulting services

Return JSON:
{{
  "advisory_discovery": {{
    "organizational_questions": [
      {{"question": "Question that reveals team/org-level patterns behind this dimension", "what_it_surfaces": "What organizational issue this surfaces", "service_bridge": "How to transition from their answer to a service conversation"}}
    ],
    "systemic_patterns": [
      {{"pattern": "Common organizational pattern this dimension reveals", "severity_indicators": "What signals how urgent/serious this is", "service_response": "Which LYC service addresses this"}}
    ]
  }},
  "service_mapping": [
    {{"service_line": "Specific LYC service (e.g., 'Executive Search', 'Team Alignment Workshop', 'Cultural Mapping Programme', 'Governance Advisory', 'Org Diagnostics Suite')", "trigger_signal": "What in the assessment or conversation triggers this recommendation", "conversation_opener": "Natural phrase to introduce this service", "value_proposition": "1-2 sentence pitch for why this leader/org needs it"}}
  ],
  "cross_sell_opportunities": [
    {{"combination": "e.g., 'Individual coaching + team diagnostics + alignment workshop'", "rationale": "Why this combination makes sense based on this dimension", "sequencing": "Recommended order of engagement"}}
  ],
  "advisory_transition_script": "3-4 sentence script for transitioning from this dimension's findings into a broader advisory conversation. Must feel like a natural diagnostic insight, not a sales pitch. Should create curiosity about what LYC can do at the organizational level.",
  "red_flags_for_advisory": [
    {{"flag": "Organizational red flag revealed through this dimension", "urgency_level": "High/Medium/Low", "recommended_action": "What the consultant should do/recommend"}}
  ]
}}

Make this deeply practical. The consultant needs concrete questions, concrete service mappings, and concrete language. APAC business culture calibrated. Not generic — specific to this dimension and instrument."""

    try:
        return call_ds(prompt, max_tokens=6000)
    except Exception as e:
        print(f"      Advisory error: {e}")
        return None

# ─── CSS (enhanced) ───

CONSULTANT_V2_CSS = """
<style>
:root { --navy: #0F1115; --accent: #C108AB; --cream: #faf8f5; --text: #2d2d2d; --muted: #6b6b6b; --border: #e8e4df; --warn: #dc2626; --ok: #16a34a; --info: #2563eb; --grow: #0891b2; --advisory: #7c3aed; --service: #0d9488; }
body { font-family: 'DejaVu Sans', sans-serif; color: var(--text); line-height: 1.7; max-width: 210mm; margin: 0 auto; padding: 40px; background: var(--cream); font-size: 14px; }
h1 { font-family: 'DejaVu Serif', serif; font-size: 2em; color: var(--navy); border-bottom: 3px solid var(--accent); padding-bottom: 12px; }
.confidential-banner { background: var(--warn); color: white; text-align: center; padding: 8px; font-size: 0.8em; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 24px; }
h2 { font-family: 'DejaVu Serif', serif; font-size: 1.4em; color: var(--navy); margin-top: 2em; border-left: 4px solid var(--accent); padding-left: 12px; }
h3 { font-size: 1.1em; color: var(--navy); margin-top: 1.5em; }
h4 { font-size: 0.95em; color: var(--navy); margin-top: 1.2em; }
.subtitle { font-family: 'DejaVu Serif', serif; color: var(--muted); font-size: 1em; margin-bottom: 1.5em; font-style: italic; }
.score-summary { background: var(--navy); color: white; padding: 24px; margin: 16px 0; display: flex; gap: 24px; align-items: center; }
.score-hero { text-align: center; min-width: 120px; }
.score-hero .num { font-size: 2.5em; font-weight: 700; color: var(--accent); }
.score-hero .label { font-size: 0.7em; text-transform: uppercase; letter-spacing: 2px; color: #999; }
.score-details { flex: 1; }
.score-details .band { font-size: 1.1em; color: #e0e0e0; margin-bottom: 4px; }
.score-details .interp { font-size: 0.85em; color: #aaa; }
.dim-section { background: white; border: 1px solid var(--border); padding: 20px; margin: 16px 0; }
.dim-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 2px solid var(--accent); padding-bottom: 8px; }
.dim-name { font-family: 'DejaVu Serif', serif; font-size: 1.1em; font-weight: 600; color: var(--navy); }
.dim-score-badge { font-size: 0.85em; padding: 4px 12px; font-weight: 600; }
.badge-strong { background: #dcfce7; color: #166534; }
.badge-developing { background: #fef9c3; color: #854d0e; }
.badge-gap { background: #fee2e2; color: #991b1b; }
.say-box { background: #f0fdf4; border-left: 3px solid var(--ok); padding: 12px; margin: 8px 0; }
.say-box::before { content: "SAY THIS"; display: block; font-size: 0.7em; font-weight: bold; color: var(--ok); letter-spacing: 1px; margin-bottom: 6px; }
.avoid-box { background: #fef2f2; border-left: 3px solid var(--warn); padding: 12px; margin: 8px 0; }
.avoid-box::before { content: "AVOID THIS"; display: block; font-size: 0.7em; font-weight: bold; color: var(--warn); letter-spacing: 1px; margin-bottom: 6px; }
.probe-box { background: #f0f7ff; border-left: 3px solid var(--info); padding: 12px; margin: 8px 0; }
.probe-box::before { content: "PROBING QUESTIONS"; display: block; font-size: 0.7em; font-weight: bold; color: var(--info); letter-spacing: 1px; margin-bottom: 6px; }
.risk-box { background: #fff7ed; border-left: 3px solid #ea580c; padding: 12px; margin: 8px 0; }
.risk-box::before { content: "RISK SIGNALS"; display: block; font-size: 0.7em; font-weight: bold; color: #ea580c; letter-spacing: 1px; margin-bottom: 6px; }
.cultural-box { background: #faf5ff; border-left: 3px solid #7c3aed; padding: 12px; margin: 8px 0; }
.cultural-box::before { content: "APAC CULTURAL NOTES"; display: block; font-size: 0.7em; font-weight: bold; color: #7c3aed; letter-spacing: 1px; margin-bottom: 6px; }
.conv-map { background: #f8fafc; border: 1px solid var(--border); padding: 16px; margin: 12px 0; }
.conv-map h4 { margin: 0 0 8px 0; color: var(--navy); font-size: 0.9em; text-transform: uppercase; letter-spacing: 1px; }
.conv-phase { margin: 8px 0; padding: 8px; border-left: 2px solid var(--accent); padding-left: 12px; }
.conv-phase strong { color: var(--accent); font-size: 0.8em; text-transform: uppercase; letter-spacing: 1px; }
.tension-row { display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--border); }
.tension-pair { font-weight: 600; color: var(--accent); min-width: 200px; }

/* NEW: GROW Section */
.grow-container { background: linear-gradient(135deg, #ecfeff 0%, #f0fdfa 100%); border: 2px solid var(--grow); padding: 20px; margin: 16px 0; }
.grow-title { font-family: 'DejaVu Serif', serif; font-size: 1.1em; color: var(--grow); margin: 0 0 4px 0; }
.grow-subtitle { font-size: 0.8em; color: var(--muted); margin-bottom: 16px; }
.grow-phase { margin: 12px 0; padding: 12px; background: white; border-left: 4px solid var(--grow); }
.grow-phase-label { font-weight: 700; color: var(--grow); font-size: 0.85em; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
.grow-question { font-style: italic; color: var(--navy); margin: 6px 0; padding-left: 8px; border-left: 2px solid #a5f3fc; }
.grow-meta { font-size: 0.8em; color: var(--muted); margin: 4px 0; padding-left: 8px; }
.grow-meta strong { color: var(--text); }
.grow-transition { background: #cffafe; border: 1px solid var(--grow); padding: 14px; margin-top: 16px; }
.grow-transition::before { content: "COACHING TRANSITION SCRIPT"; display: block; font-size: 0.7em; font-weight: bold; color: var(--grow); letter-spacing: 1px; margin-bottom: 6px; }
.grow-programs { margin-top: 12px; }
.grow-program { display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px dashed #a5f3fc; }
.grow-program-type { font-weight: 600; color: var(--grow); min-width: 180px; font-size: 0.9em; }

/* NEW: Advisory Discovery Section */
.advisory-container { background: linear-gradient(135deg, #f5f3ff 0%, #faf5ff 100%); border: 2px solid var(--advisory); padding: 20px; margin: 16px 0; }
.advisory-title { font-family: 'DejaVu Serif', serif; font-size: 1.1em; color: var(--advisory); margin: 0 0 4px 0; }
.advisory-subtitle { font-size: 0.8em; color: var(--muted); margin-bottom: 16px; }
.advisory-org-q { margin: 10px 0; padding: 12px; background: white; border-left: 4px solid var(--advisory); }
.advisory-org-q .question { font-style: italic; color: var(--navy); margin-bottom: 6px; }
.advisory-org-q .meta { font-size: 0.8em; color: var(--muted); }
.advisory-org-q .meta strong { color: var(--text); }
.service-map { margin: 16px 0; }
.service-card { background: white; border: 1px solid #d8b4fe; padding: 14px; margin: 10px 0; }
.service-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.service-name { font-weight: 700; color: var(--advisory); font-size: 0.95em; }
.service-trigger { font-size: 0.75em; background: #ede9fe; color: #6d28d9; padding: 2px 8px; }
.service-opener { font-style: italic; color: var(--navy); margin: 4px 0; font-size: 0.9em; }
.service-value { font-size: 0.85em; color: var(--muted); }
.crosssell-box { background: #f0fdfa; border: 1px solid var(--service); padding: 14px; margin: 12px 0; }
.crosssell-box::before { content: "CROSS-SELL COMBINATIONS"; display: block; font-size: 0.7em; font-weight: bold; color: var(--service); letter-spacing: 1px; margin-bottom: 8px; }
.crosssell-combo { font-weight: 600; color: var(--service); margin: 4px 0; }
.crosssell-meta { font-size: 0.8em; color: var(--muted); margin: 2px 0 8px 0; }
.advisory-transition { background: #ede9fe; border: 1px solid var(--advisory); padding: 14px; margin: 12px 0; }
.advisory-transition::before { content: "ADVISORY TRANSITION SCRIPT"; display: block; font-size: 0.7em; font-weight: bold; color: var(--advisory); letter-spacing: 1px; margin-bottom: 6px; }
.red-flag { display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid #e9d5ff; }
.red-flag-text { flex: 1; }
.red-flag-level { font-size: 0.75em; padding: 2px 8px; font-weight: 600; white-space: nowrap; }
.level-high { background: #fee2e2; color: #991b1b; }
.level-medium { background: #fef9c3; color: #854d0e; }
.level-low { background: #dcfce7; color: #166534; }
.systemic-row { margin: 8px 0; padding: 10px; background: white; border-left: 3px solid #c4b5fd; }

ul { padding-left: 18px; }
li { margin: 4px 0; }
table { width: 100%; border-collapse: collapse; margin: 12px 0; }
th { background: var(--navy); color: white; padding: 8px; text-align: left; font-size: 0.8em; text-transform: uppercase; letter-spacing: 0.5px; }
td { padding: 8px; border-bottom: 1px solid var(--border); font-size: 0.9em; }
.section-divider { border: none; border-top: 2px dashed var(--border); margin: 24px 0; }

/* v6: Staircase dimension overview chart */
.staircase-wrap{display:flex;align-items:flex-end;gap:6px;padding:20px 16px 0 16px;background:#fff;border:1px solid var(--border);margin:16px 0;}
.stair-col{flex:1;display:flex;flex-direction:column;align-items:center;min-width:0;}
.stair-val{font-size:13px;font-weight:700;margin-bottom:4px;font-family:'DejaVu Serif',serif;}
.stair-bar{width:100%;min-width:24px;border-radius:2px 2px 0 0;}
.stair-label{font-size:9px;color:#666;text-align:center;margin-top:6px;max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.stair-axis{display:flex;justify-content:space-between;padding:4px 16px 8px;font-size:10px;color:#aaa;background:#fff;border:1px solid var(--border);border-top:none;margin-bottom:16px;}
</style>
"""

# ─── Render ───

def render_consultant_v2(inst_name, scored, config, consultant_content, grow_content, advisory_content):
    full_name = config.get("full_name", inst_name)
    comp = scored.get("composite", {})
    composite_score = comp.get("score", 0) if isinstance(comp, dict) else 0
    comp_band = comp.get("band", "") if isinstance(comp, dict) else ""
    comp_interp = comp.get("interpretation", "") if isinstance(comp, dict) else ""
    arch = scored.get("archetype", {})
    arch_name = arch.get("name", "Unknown") if isinstance(arch, dict) else str(arch)

    dim_sections = ""
    for dim_key, dim_data in scored["dimension_scores"].items():
        dname = dim_data.get("name", dim_key)
        norm = dim_data.get("normalised", 0)
        norm_max = dim_data.get("normalised_max", 20)
        pct = (norm / norm_max * 100) if norm_max > 0 else 0
        verdict_data = dim_data.get("verdict", {})
        band = verdict_data.get("verdict", "Developing") if isinstance(verdict_data, dict) else str(verdict_data)
        badge_class = f"badge-{band.lower()}" if band in ["Strong","Developing","Gap"] else "badge-developing"

        cc = consultant_content.get(dname, {}) or {}
        gc = grow_content.get(dname, {}) or {}
        ac = advisory_content.get(dname, {}) or {}

        section = f'<div class="dim-section">'
        section += f'<div class="dim-header"><div class="dim-name">{dname}</div>'
        section += f'<div class="dim-score-badge {badge_class}">{pct:.0f}% — {band}</div></div>'

        # === PART A: Consultant Interpretation ===
        ci = cc.get("consultant_interpretation", {})
        if ci:
            section += '<h3>Consultant Score Interpretation</h3><table>'
            section += '<tr><th>Score Band</th><th>Deep Read</th></tr>'
            section += f'<tr><td class="badge-strong" style="width:100px">Strong (70+)</td><td>{ci.get("high_score_read","")}</td></tr>'
            section += f'<tr><td class="badge-developing">Developing (50-69)</td><td>{ci.get("mid_score_read","")}</td></tr>'
            section += f'<tr><td class="badge-gap">Gap (<50)</td><td>{ci.get("low_score_read","")}</td></tr>'
            section += '</table>'

        # === PART B: Debrief Language ===
        dl = cc.get("debrief_language", {})
        if dl:
            say_items = dl.get("say_this", [])
            avoid_items = dl.get("not_this", [])
            if say_items:
                section += '<div class="say-box"><ul>'
                for s in say_items: section += f'<li>"{s}"</li>'
                section += '</ul></div>'
            if avoid_items:
                section += '<div class="avoid-box"><ul>'
                for a in avoid_items: section += f'<li>"{a}"</li>'
                section += '</ul></div>'
            framing = dl.get("framing_strategy", "")
            if framing:
                section += f'<p><strong>Framing Strategy:</strong> {framing}</p>'

        # === PART C: Probing Questions ===
        probes = cc.get("probing_questions", [])
        if probes:
            section += '<div class="probe-box"><table><tr><th>Question</th><th>What It Reveals</th></tr>'
            for p in probes:
                section += f'<tr><td>"{p.get("question","")}"</td><td>{p.get("purpose","")}</td></tr>'
            section += '</table></div>'

        # === PART D: Risk Signals ===
        risks = cc.get("risk_signals", [])
        if risks:
            section += '<div class="risk-box"><table><tr><th>Signal</th><th>Meaning</th><th>Response</th></tr>'
            for r in risks:
                section += f'<tr><td>{r.get("signal","")}</td><td>{r.get("meaning","")}</td><td>{r.get("response","")}</td></tr>'
            section += '</table></div>'

        # === PART E: Conversation Map ===
        cm = cc.get("coaching_conversation_map", {})
        if cm:
            section += '<div class="conv-map"><h4>Conversation Flow</h4>'
            for phase in ["opening_frame", "exploration_phase", "commitment_phase", "resistance_handling"]:
                label = phase.replace("_", " ").title()
                section += f'<div class="conv-phase"><strong>{label}:</strong> {cm.get(phase, "")}</div>'
            section += '</div>'

        # === PART F: APAC Cultural ===
        apac = cc.get("apac_cultural_considerations", [])
        if apac:
            section += '<div class="cultural-box"><ul>'
            for a in apac: section += f'<li>{a}</li>'
            section += '</ul></div>'

        # === PART G: Cross-Dimension Tensions ===
        tensions = cc.get("cross_dimension_tensions", [])
        if tensions:
            section += '<h3>Cross-Dimensional Tensions</h3>'
            for t in tensions:
                section += f'<div class="tension-row"><div class="tension-pair">{t.get("tension_pair","")}</div>'
                section += f'<div><strong>Nature:</strong> {t.get("nature","")}<br><strong>Action:</strong> {t.get("consultant_action","")}</div></div>'

        # ────────────────────────────────────────────
        # NEW PART H: GROW COACHING METHODOLOGY
        # ────────────────────────────────────────────
        if gc and gc.get("grow_questions"):
            gq = gc["grow_questions"]
            section += '<hr class="section-divider">'
            section += '<div class="grow-container">'
            section += '<h3 class="grow-title">GROW Coaching Methodology</h3>'
            section += '<p class="grow-subtitle">Structured reflective questions to deepen understanding and create natural coaching entry points</p>'

            phase_labels = {
                "goal": ("G — GOAL", "Help the leader articulate their desired future state"),
                "reality": ("R — REALITY", "Surface current obstacles, patterns, and blind spots"),
                "options": ("O — OPTIONS", "Expand thinking beyond current frame of reference"),
                "will": ("W — WILL / WAY FORWARD", "Move toward commitment and action")
            }
            for phase_key in ["goal", "reality", "options", "will"]:
                phase_data = gq.get(phase_key, [])
                if not phase_data:
                    continue
                label, desc = phase_labels.get(phase_key, (phase_key.upper(), ""))
                section += f'<div class="grow-phase">'
                section += f'<div class="grow-phase-label">{label}</div>'
                section += f'<div style="font-size:0.8em;color:var(--muted);margin-bottom:8px">{desc}</div>'
                for item in phase_data:
                    q = item.get("question", "")
                    sig = item.get("coaching_signal", "")
                    upsell = item.get("upsell_angle", "")
                    section += f'<div class="grow-question">"{q}"</div>'
                    if sig:
                        section += f'<div class="grow-meta"><strong>Coaching Signal:</strong> {sig}</div>'
                    if upsell:
                        section += f'<div class="grow-meta"><strong>Coaching Entry Point:</strong> {upsell}</div>'
                section += '</div>'

            # Coaching transition script
            cts = gc.get("coaching_transition_script", "")
            if cts:
                section += f'<div class="grow-transition">{cts}</div>'

            # Coaching program recommendations
            programs = gc.get("coaching_program_recommendations", [])
            if programs:
                section += '<div class="grow-programs">'
                section += '<h4 style="color:var(--grow);margin:12px 0 8px 0;font-size:0.9em;text-transform:uppercase;letter-spacing:1px">Recommended Coaching Programs</h4>'
                for prog in programs:
                    ptype = prog.get("program_type", "")
                    rationale = prog.get("rationale", "")
                    entry = prog.get("entry_point", "")
                    section += f'<div class="grow-program">'
                    section += f'<div class="grow-program-type">{ptype}</div>'
                    section += f'<div><strong>Why:</strong> {rationale}<br>'
                    section += f'<span style="font-size:0.85em;color:var(--muted)"><strong>How to introduce:</strong> {entry}</span></div>'
                    section += '</div>'
                section += '</div>'

            section += '</div>'  # close grow-container

        # ────────────────────────────────────────────
        # NEW PART I: ADVISORY DISCOVERY FRAMEWORK
        # ────────────────────────────────────────────
        if ac and ac.get("advisory_discovery"):
            ad = ac["advisory_discovery"]
            section += '<hr class="section-divider">'
            section += '<div class="advisory-container">'
            section += '<h3 class="advisory-title">Advisory Discovery Framework</h3>'
            section += '<p class="advisory-subtitle">Structured discovery questions to uncover organizational-level needs and map to LYC service lines</p>'

            # Organizational discovery questions
            org_qs = ad.get("organizational_questions", [])
            if org_qs:
                section += '<h4 style="color:var(--advisory);margin:8px 0;font-size:0.85em;text-transform:uppercase;letter-spacing:1px">Organizational Discovery Questions</h4>'
                for oq in org_qs:
                    q = oq.get("question", "")
                    surfaces = oq.get("what_it_surfaces", "")
                    bridge = oq.get("service_bridge", "")
                    section += f'<div class="advisory-org-q">'
                    section += f'<div class="question">"{q}"</div>'
                    if surfaces:
                        section += f'<div class="meta"><strong>Surfaces:</strong> {surfaces}</div>'
                    if bridge:
                        section += f'<div class="meta"><strong>Service Bridge:</strong> {bridge}</div>'
                    section += '</div>'

            # Systemic patterns
            sys_patterns = ad.get("systemic_patterns", [])
            if sys_patterns:
                section += '<h4 style="color:var(--advisory);margin:12px 0 8px 0;font-size:0.85em;text-transform:uppercase;letter-spacing:1px">Systemic Patterns to Watch</h4>'
                for sp in sys_patterns:
                    section += f'<div class="systemic-row">'
                    section += f'<strong>{sp.get("pattern","")}</strong><br>'
                    section += f'<span style="font-size:0.85em;color:var(--muted)"><strong>Severity Indicators:</strong> {sp.get("severity_indicators","")}</span><br>'
                    section += f'<span style="font-size:0.85em;color:var(--service)"><strong>Service Response:</strong> {sp.get("service_response","")}</span>'
                    section += '</div>'

            section += '</div>'  # close advisory-container

            # Service Mapping (outside the container for visual separation)
            svc_map = ac.get("service_mapping", [])
            if svc_map:
                section += '<div class="service-map">'
                section += '<h4 style="color:var(--advisory);margin:8px 0;font-size:0.85em;text-transform:uppercase;letter-spacing:1px">Service-Line Mapping</h4>'
                for sm in svc_map:
                    trigger = sm.get("trigger_signal", "")
                    section += f'<div class="service-card">'
                    section += f'<div class="service-card-header"><span class="service-name">{sm.get("service_line","")}</span>'
                    section += f'<span class="service-trigger">{trigger[:60]}{"..." if len(trigger)>60 else ""}</span></div>'
                    opener = sm.get("conversation_opener", "")
                    if opener:
                        section += f'<div class="service-opener">"{opener}"</div>'
                    vp = sm.get("value_proposition", "")
                    if vp:
                        section += f'<div class="service-value">{vp}</div>'
                    section += '</div>'
                section += '</div>'

            # Cross-sell combinations
            crosssell = ac.get("cross_sell_opportunities", [])
            if crosssell:
                section += '<div class="crosssell-box">'
                for cs in crosssell:
                    combo = cs.get("combination", "")
                    rationale = cs.get("rationale", "")
                    seq = cs.get("sequencing", "")
                    section += f'<div class="crosssell-combo">{combo}</div>'
                    section += f'<div class="crosssell-meta"><strong>Why:</strong> {rationale}</div>'
                    section += f'<div class="crosssell-meta"><strong>Sequence:</strong> {seq}</div>'

            # Advisory transition script
            ats = ac.get("advisory_transition_script", "")
            if ats:
                section += f'<div class="advisory-transition">{ats}</div>'

            # Red flags
            red_flags = ac.get("red_flags_for_advisory", [])
            if red_flags:
                section += '<h4 style="color:var(--warn);margin:12px 0 8px 0;font-size:0.85em;text-transform:uppercase;letter-spacing:1px">Advisory Red Flags</h4>'
                for rf in red_flags:
                    level = rf.get("urgency_level", "Medium")
                    level_class = f"level-{level.lower()}" if level.lower() in ["high","medium","low"] else "level-medium"
                    section += f'<div class="red-flag">'
                    section += f'<div class="red-flag-text"><strong>{rf.get("flag","")}</strong><br>'
                    section += f'<span style="font-size:0.85em;color:var(--muted)"><strong>Action:</strong> {rf.get("recommended_action","")}</span></div>'
                    section += f'<span class="red-flag-level {level_class}">{level}</span>'
                    section += '</div>'

        section += '</div>'  # close dim-section
        dim_sections += section

    staircase_html = _build_consultant_staircase(scored, config)

    html = f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<title>{inst_name} Consultant Debrief Report v2</title>
{CONSULTANT_V2_CSS}
</head><body>
<div class="confidential-banner">CONFIDENTIAL — FOR CERTIFIED SHIFT PRACTITIONERS ONLY</div>
<h1>{inst_name} — Consultant Debrief Report</h1>
<div class="subtitle">{full_name} | Practitioner Edition with GROW Coaching & Advisory Discovery</div>

<div class="score-summary">
    <div class="score-hero">
        <div class="num">{composite_score:.0f}</div>
        <div class="label">Composite Score</div>
    </div>
    <div class="score-details">
        <div class="band">{comp_band}</div>
        <div class="interp">{comp_interp}</div>
    </div>
    <div style="text-align:right;">
        <div style="font-size:0.75em;color:#999;text-transform:uppercase;letter-spacing:1px">Profile</div>
        <div style="font-size:1.1em;font-weight:600">{arch_name}</div>
    </div>
</div>

<h3 style="color:#0F1115;font-size:1em;text-transform:uppercase;letter-spacing:1.5px;margin:24px 0 0 0;border:none;padding:0;">Dimension Overview</h3>
{staircase_html}

<h2>Dimension-by-Dimension Consultant Debrief</h2>
<p style="color:var(--muted);font-size:0.9em;">Each dimension includes: <strong>Part A–G</strong> — score interpretation, debrief language, probing questions, risk signals, conversation map, cultural calibration, cross-dimension tensions. <strong>Part H</strong> — GROW Coaching Methodology (Goal → Reality → Options → Will). <strong>Part I</strong> — Advisory Discovery Framework with service-line mapping.</p>

{dim_sections}

<div style="margin-top:40px;padding:20px;background:#f8f8f8;border-top:2px solid #ccc;font-size:0.8em;color:#666;">
<p><strong>SHIFT Diagnostics Suite — {inst_name} Consultant Debrief Report v2</strong></p>
<p>This document is confidential and intended solely for certified SHIFT practitioners. It contains interpretive guidance, GROW coaching methodology, advisory discovery frameworks, and service-line mapping designed to support effective debriefing and organic business development. Do not share with assessment subjects.</p>
<p>LYC Partners &copy; 2026</p>
</div>
</body></html>"""
    return html


# ═══════════════════════════════════════════════════════
# MAIN GENERATION LOOP
# ═══════════════════════════════════════════════════════

print("=" * 60)
print("GENERATING CONSULTANT DEBRIEF REPORTS v2")
print("(with GROW Coaching + Advisory Discovery)")
print("=" * 60)

os.makedirs("consultant_reports", exist_ok=True)

import sys
if len(sys.argv) > 1:
    instruments = sys.argv[1:]
else:
    instruments = ["QUEST", "IMPACT", "PRISM", "SPARK", "FORGE", "MOSAIC", "BRIDGE", "COACH", "DRIVE"]
is_biz = {"SPARK", "FORGE", "MOSAIC", "BRIDGE"}

for inst in instruments:
    print(f"\n{'='*50}")
    print(f"📋 {inst}...")
    print(f"{'='*50}")

    # Load config and score
    cfg_file = "drive_v2_config.json" if inst == "DRIVE" else f"{inst.lower()}_config.json"
    with open(cfg_file) as f:
        config = json.load(f)

    random.seed(42)
    scorer = ShiftScorer(inst)
    responses = {}
    for dim in config["dimensions"]:
        for qid in dim["question_ids"]:
            responses[qid] = random.randint(2, 5)
    scored = scorer.score(responses)

    full_name = config.get("full_name", inst)
    dims = config["dimensions"]
    dim_names = [d["name"] for d in dims]
    other_dims_map = {d["name"]: [n for n in dim_names if n != d["name"]] for d in dims}

    # ── Phase 1: Original consultant content ──
    print(f"  [Phase 1] Original consultant content...")
    consultant_content = {}
    for i, dim in enumerate(dims):
        dname = dim["name"]
        sub_dims = list(dim.get("sub_dimensions", {}).keys()) if isinstance(dim.get("sub_dimensions"), dict) else []
        n_sub = len(sub_dims) if sub_dims else 5
        focus = "organisational/business dynamics" if inst in is_biz else "individual leadership capability"

        print(f"    [{inst} D{i+1}] {dname[:50]}...")

        prompt = f"""Generate consultant debrief content as JSON:
Instrument: {inst} — {full_name}
Dimension: {dname}
Sub-dimensions: {', '.join(sub_dims) if sub_dims else 'Not specified, generate 5 relevant ones'}
Focus area: {focus}

Return JSON:
{{
  "consultant_interpretation": {{
    "high_score_read": "3-4 sentences: what a high score REALLY means",
    "mid_score_read": "3-4 sentences: what a mid-range score signals",
    "low_score_read": "3-4 sentences: what a low score indicates"
  }},
  "debrief_language": {{
    "say_this": ["3 specific phrases"],
    "not_this": ["3 phrases to AVOID"],
    "framing_strategy": "2-3 sentences"
  }},
  "probing_questions": [
    {{"question": "Q1", "purpose": "P1"}},
    {{"question": "Q2", "purpose": "P2"}},
    {{"question": "Q3", "purpose": "P3"}},
    {{"question": "Q4", "purpose": "P4"}}
  ],
  "risk_signals": [
    {{"signal": "S1", "meaning": "M1", "response": "R1"}},
    {{"signal": "S2", "meaning": "M2", "response": "R2"}}
  ],
  "coaching_conversation_map": {{
    "opening_frame": "2-3 sentences",
    "exploration_phase": "3-4 sentences",
    "commitment_phase": "2-3 sentences",
    "resistance_handling": "2-3 sentences"
  }},
  "apac_cultural_considerations": ["C1","C2","C3"],
  "cross_dimension_tensions": [
    {{"tension_pair": "This x Other", "nature": "N", "consultant_action": "A"}}
  ]
}}
Make content deeply practical. APAC-calibrated. Specific to this dimension."""

        try:
            data = call_ds(prompt, max_tokens=4500)
            consultant_content[dname] = data
            print(f"      ✅")
        except Exception as e:
            print(f"      ❌ {e}")
            consultant_content[dname] = {}
        time.sleep(0.8)

    # ── Phase 2: GROW Coaching content ──
    print(f"  [Phase 2] GROW Coaching Methodology...")
    grow_content = {}
    for i, dim in enumerate(dims):
        dname = dim["name"]
        sub_dims = list(dim.get("sub_dimensions", {}).keys()) if isinstance(dim.get("sub_dimensions"), dict) else []
        print(f"    [{inst} D{i+1}] {dname[:40]}...")

        gc = generate_grow_content(inst, full_name, dname, sub_dims, inst in is_biz)
        grow_content[dname] = gc
        if gc:
            print(f"      ✅")
        else:
            print(f"      ❌")
        time.sleep(0.8)

    # ── Phase 3: Advisory Discovery content ──
    print(f"  [Phase 3] Advisory Discovery Framework...")
    advisory_content = {}
    for i, dim in enumerate(dims):
        dname = dim["name"]
        sub_dims = list(dim.get("sub_dimensions", {}).keys()) if isinstance(dim.get("sub_dimensions"), dict) else []
        others = other_dims_map.get(dname, [])
        print(f"    [{inst} D{i+1}] {dname[:40]}...")

        ac = generate_advisory_content(inst, full_name, dname, sub_dims, inst in is_biz, others)
        advisory_content[dname] = ac
        if ac:
            print(f"      ✅")
        else:
            print(f"      ❌")
        time.sleep(0.8)

    # ── Render ──
    html = render_consultant_v2(inst, scored, config, consultant_content, grow_content, advisory_content)
    fname = f"consultant_reports/{inst}_Consultant_Debrief.html"
    with open(fname, "w") as f:
        f.write(html)
    text = re.sub(r'<[^>]+>', ' ', html)
    text = re.sub(r'\s+', ' ', text).strip()
    print(f"  ✅ RENDERED: {fname} ({os.path.getsize(fname)/1024:.0f}KB, {len(text):,} text chars)")

print("\n" + "=" * 60)
print("ALL CONSULTANT DEBRIEF v2 REPORTS GENERATED")
print("=" * 60)
for f in sorted(os.listdir("consultant_reports")):
    fpath = f"consultant_reports/{f}"
    text = re.sub(r'<[^>]+>', ' ', open(fpath).read())
    text = re.sub(r'\s+', ' ', text).strip()
    print(f"  {f:50s} {os.path.getsize(fpath)/1024:6.0f}KB  {len(text):6,} chars")

