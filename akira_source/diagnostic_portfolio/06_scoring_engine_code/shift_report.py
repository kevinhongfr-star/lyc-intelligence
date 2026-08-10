#!/usr/bin/env python3
"""
SHIFT Suite — Parameterised HTML Report Generator
Brand-compliant with DRIVE v3.2 visual system.
Works for LEAP, QUEST, IMPACT, PRISM (and future instruments).

CSS built with %-formatting to avoid f-string brace escaping issues.
HTML body built with f-strings for dynamic content.
"""

import json
import os
import base64
import math
from pathlib import Path
from datetime import datetime

SCRIPT_DIR = Path(__file__).parent
LOGO_PATH = SCRIPT_DIR / "lyc_logo.png"

# ── Brand Tokens (DRIVE v3.2 compatible) ──
B = {
    "fuchsia": "#C108AB", "dark": "#0F1115", "white": "#FFFFFF",
    "gray_bg": "#FAFAFA", "border": "#E0E0E0", "text": "#1A1A1A",
    "text2": "#4A4A4A", "muted": "#888888", "gold": "#8B7200",
    "green": "#1B5E3B", "orange": "#B85C00", "red": "#7A0000",
}


def get_color(pct):
    """Map percentage (0-100) to brand colour."""
    if pct >= 85: return B["gold"]
    if pct >= 70: return B["green"]
    if pct >= 50: return B["orange"]
    return B["red"]


def load_logo_b64():
    if not LOGO_PATH.exists():
        return None
    try:
        with open(LOGO_PATH, "rb") as f:
            return f"data:image/png;base64,{base64.b64encode(f.read()).decode()}"
    except:
        return None


# ═══════════════════════════════════════
# CSS — built with %-formatting
# ═══════════════════════════════════════

def build_css():
    return """
@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@400;500;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-size:16px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:'DM Sans',sans-serif;color:%(text)s;background:%(white)s;line-height:1.65;max-width:210mm;margin:0 auto;padding:48px 44px}
h1,h2,h3,h4{font-family:'Crimson Pro',serif;font-weight:600}
h1{font-size:38px;line-height:1.15;color:%(dark)s;letter-spacing:-0.3px}
h2{font-size:26px;line-height:1.25;color:%(dark)s;margin-top:56px;margin-bottom:20px;padding-bottom:10px;border-bottom:2px solid %(dark)s}
h3{font-size:20px;line-height:1.3;color:%(text)s;margin-top:36px;margin-bottom:14px}
h4{font-size:16px;color:%(text2)s;margin-top:20px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;font-family:'DM Sans',sans-serif;font-weight:700}
p{margin-bottom:14px;font-size:15px;color:%(text2)s;line-height:1.7}
strong{color:%(text)s}
.eyebrow{color:%(fuchsia)s;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2.5px}
.tagline{font-style:italic;color:%(muted)s;font-size:13px;font-family:'Crimson Pro',serif}
.rule{height:1px;background:%(border)s;margin:28px 0}
.sec-num{font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:3px;color:%(muted)s;margin-bottom:6px}
.cover{min-height:270mm;display:flex;flex-direction:column;justify-content:space-between;page-break-after:always}
.cover-top{text-align:left;padding-top:80px;border-top:3px solid %(dark)s}
.cover-title{font-size:56px;font-weight:700;letter-spacing:-1px;margin:16px 0 8px}
.cover-sub{font-size:20px;color:%(muted)s;font-weight:400}
.cover-mid{padding:60px 0}
.cover-name{font-size:36px;font-weight:600;color:%(dark)s;margin-bottom:6px}
.cover-date{font-size:16px;color:%(muted)s}
.cover-bot{border-top:1px solid %(border)s;padding-top:24px;display:flex;justify-content:space-between;align-items:flex-end}
.cover-left{font-size:12px;color:%(muted)s;line-height:2}
.cover-right{text-align:right;font-size:11px;color:%(muted)s}
.toc-list{list-style:none;padding:0}
.toc-item{display:flex;align-items:baseline;padding:14px 0;border-bottom:1px solid %(border)s}
.toc-item:last-child{border-bottom:none}
.toc-n{font-size:13px;font-weight:700;color:%(fuchsia)s;min-width:36px;letter-spacing:1px}
.toc-t{flex:1;font-size:15px;color:%(text)s;font-weight:500}
.toc-p{font-size:13px;color:%(muted)s;font-variant-numeric:tabular-nums}
.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin:28px 0;border:1px solid %(border)s}
.m-block{padding:28px 24px;border-right:1px solid %(border)s}
.m-block:last-child{border-right:none}
.m-val{font-size:40px;font-weight:700;font-family:'Crimson Pro',serif;line-height:1;margin-bottom:6px}
.m-lbl{font-size:11px;color:%(muted)s;text-transform:uppercase;letter-spacing:1.5px;font-weight:500}
.m-band{font-size:14px;font-weight:600;margin-top:6px}
.arch-block{margin:36px 0;padding:40px;background:%(dark)s;color:%(white)s;display:grid;grid-template-columns:160px 1fr;gap:36px;align-items:center}
.arch-icon{width:140px;height:140px;border-radius:50%%;overflow:hidden;background:%(white)s;padding:8px;display:flex;align-items:center;justify-content:center}
.arch-icon .icon-fallback{width:100%%;height:100%%;display:flex;align-items:center;justify-content:center;font-size:56px;font-family:'Crimson Pro',serif;color:%(fuchsia)s;font-weight:700}
.arch-name{font-size:40px;font-weight:700;font-family:'Crimson Pro',serif;margin-bottom:8px;color:%(white)s;letter-spacing:-0.5px}
.arch-sub{font-size:15px;color:rgba(255,255,255,0.75);margin-bottom:18px;font-style:italic;font-family:'Crimson Pro',serif}
.arch-row{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:20px}
.arch-col-lbl{font-size:10px;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.6);margin-bottom:6px}
.arch-col p{font-size:14px;color:rgba(255,255,255,0.85);margin:0;line-height:1.6}
.dim-row{display:grid;grid-template-columns:180px 1fr 48px;align-items:center;gap:16px;margin-bottom:12px}
.dim-label{font-size:14px;font-weight:500;color:%(text)s}
.dim-track{height:6px;background:%(border)s;position:relative}
.dim-fill{height:100%%;position:absolute;left:0;top:0}
.dim-val{font-size:14px;font-weight:700;text-align:right;font-family:'Crimson Pro',serif;font-variant-numeric:tabular-nums}
.dim-section{margin-bottom:40px;padding-bottom:32px;border-bottom:1px solid %(border)s}
.dim-section:last-child{border-bottom:none}
.dim-header{display:flex;align-items:baseline;gap:12px;margin-bottom:16px}
.dim-score-big{font-size:48px;font-weight:700;font-family:'Crimson Pro',serif;line-height:1}
.dim-band{font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px}
.sub-tbl{width:100%%;border-collapse:collapse;margin-top:12px;font-size:14px}
.sub-tbl th{text-align:left;padding:8px 10px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:%(muted)s;border-bottom:1px solid %(border)s;font-weight:600}
.sub-tbl td{padding:8px 10px;border-bottom:1px solid %(border)s;color:%(text2)s}
.sub-tbl .num{text-align:center;font-weight:600;font-variant-numeric:tabular-nums}
.mini-track{height:4px;background:%(border)s;width:100px}
.mini-fill{height:100%%}
.dev-card{margin-bottom:24px;padding:28px;border:1px solid %(border)s}
.dev-head{display:flex;align-items:baseline;gap:14px;margin-bottom:12px}
.dev-n{font-size:32px;font-weight:700;font-family:'Crimson Pro',serif;color:%(muted)s;line-height:1;min-width:40px}
.dev-title{font-size:20px;font-weight:600;font-family:'Crimson Pro',serif;color:%(text)s}
.dev-score{font-size:14px;color:%(muted)s;margin-bottom:8px}
.dev-card p{font-size:14px;color:%(text2)s;margin:0}
.apac-card{padding:28px;border:1px solid %(border)s;background:%(gray_bg)s;margin:16px 0}
.apac-card h4{margin-top:0}
.gauge-container{text-align:center;padding:32px 0}
.legal{margin-top:64px;padding-top:24px;border-top:2px solid %(dark)s}
.legal h3{font-size:14px;text-transform:uppercase;letter-spacing:1px;color:%(muted)s;margin-top:24px;margin-bottom:8px;font-family:'DM Sans',sans-serif;font-weight:700}
.legal p{font-size:12px;color:%(muted)s;line-height:1.8}
.doc-foot{text-align:center;padding:40px 0 0;border-top:1px solid %(border)s;margin-top:48px}
@page{size:A4;margin:20mm 15mm;@bottom-center{content:counter(page);font-family:"DM Sans",sans-serif;font-size:10px;color:#888888}}
@media print{body{padding:0;max-width:none}h2{page-break-after:avoid}.dim-section{page-break-inside:avoid}.arch-block{page-break-inside:avoid}.cover{min-height:auto}.doc-foot{margin-top:24px}}
""" % B


# ═══════════════════════════════════════
# HTML SECTION BUILDERS
# ═══════════════════════════════════════

def _build_gauge_svg(score):
    """SVG arc gauge for composite score."""
    color = get_color(score)
    angle = (score / 100) * 180
    rad = math.radians(angle)
    cx, cy, r = 120, 110, 90
    ex = cx - r * math.cos(rad)
    ey = cy - r * math.sin(rad)
    large_arc = 1 if angle > 180 else 0
    
    markers = ""
    for threshold in [40, 55, 70, 85]:
        a = math.radians((threshold / 100) * 180)
        mx = cx - (r + 12) * math.cos(a)
        my = cy - (r + 12) * math.sin(a)
        markers += f'<circle cx="{mx:.1f}" cy="{my:.1f}" r="2" fill="{B["border"]}"/>'
    
    return f'''<svg width="240" height="130" viewBox="0 0 240 130" style="display:inline-block">
      <path d="M {cx-r} {cy} A {r} {r} 0 0 1 {cx+r} {cy}" fill="none" stroke="{B['border']}" stroke-width="16" stroke-linecap="butt"/>
      <path d="M {cx-r} {cy} A {r} {r} 0 {large_arc} 1 {ex:.1f} {ey:.1f}" fill="none" stroke="{color}" stroke-width="16" stroke-linecap="butt"/>
      <circle cx="{cx}" cy="{cy}" r="4" fill="{B['fuchsia']}"/>
      {markers}
      <text x="{cx}" y="{cy - 16}" text-anchor="middle" font-family="Crimson Pro,serif" font-size="32" font-weight="700" fill="{color}">{score:.1f}</text>
      <text x="{cx}" y="{cy + 2}" text-anchor="middle" font-family="DM Sans,sans-serif" font-size="10" fill="{B['muted']}">/ 100</text>
    </svg>'''


def _build_toc(items):
    rows = ""
    for num, title, page in items:
        rows += f'<li class="toc-item"><span class="toc-n">{num}</span><span class="toc-t">{title}</span><span class="toc-p">{page}</span></li>'
    return f'<ul class="toc-list">{rows}</ul>'


def _build_dimension_bars(dim_scores, dims):
    html = ""
    for dim in dims:
        did = dim["id"]
        data = dim_scores.get(did, {})
        name = data.get("name", dim["name"])
        norm = data.get("normalised", 0)
        pct = norm * 5
        color = get_color(pct)
        html += (
            f'<div class="dim-row">'
            f'<span class="dim-label">{name}</span>'
            f'<div class="dim-track"><div class="dim-fill" style="width:{pct}%;background:{color}"></div></div>'
            f'<span class="dim-val">{norm:.1f}</span>'
            f'</div>'
        )
    return html


def _build_exec_summary(inst_name, full_name, cs, band, band_interp, archetype, dim_scores, dev_priorities):
    color = get_color(cs)
    arch_name = archetype["name"]
    dominant_dims = archetype.get("dominant_dimensions", [])
    
    insight_rows = ""
    if dominant_dims:
        insight_rows += f'<tr style="border-bottom:1px solid {B["border"]}"><td style="padding:12px 0;width:180px;font-weight:600;color:{B["text"]}">Primary Driver</td><td style="padding:12px 0;color:{B["text2"]}">{" & ".join(dominant_dims[:2])}</td></tr>'
    insight_rows += f'<tr style="border-bottom:1px solid {B["border"]}"><td style="padding:12px 0;font-weight:600;color:{B["text"]}">Readiness Band</td><td style="padding:12px 0;color:{B["text2"]}">{band} — {band_interp}</td></tr>'
    if dev_priorities:
        dp = dev_priorities[0]
        insight_rows += f'<tr style="border-bottom:1px solid {B["border"]}"><td style="padding:12px 0;font-weight:600;color:{B["text"]}">Top Development Need</td><td style="padding:12px 0;color:{B["text2"]}">{dp["dimension"]} ({dp["score"]}/20)</td></tr>'
    if dev_priorities and len(dev_priorities) >= 2:
        insight_rows += f'<tr><td style="padding:12px 0;font-weight:600;color:{B["text"]}">Recommended Action</td><td style="padding:12px 0;color:{B["text2"]}">Targeted development on {dev_priorities[0]["dimension"]} and {dev_priorities[1]["dimension"]}</td></tr>'
    
    dim_summary = ""
    for did, data in dim_scores.items():
        verdict = data.get("verdict", {}).get("verdict", "")
        dim_summary += (
            f'<tr style="border-bottom:1px solid {B["border"]}">'
            f'<td style="padding:8px 0;font-weight:500">{data["name"]}</td>'
            f'<td style="padding:8px 0;text-align:center;font-weight:600;font-variant-numeric:tabular-nums;color:{get_color(data["normalised"]*5)}">{data["normalised"]:.1f}/20</td>'
            f'<td style="padding:8px 0;color:{B["muted"]};font-size:13px">{verdict}</td>'
            f'</tr>'
        )
    
    return f"""
  <div class="sec-num">01</div>
  <h2>Executive Summary</h2>
  <p>This report presents the <strong>{inst_name}</strong> ({full_name}) diagnostic assessment results. The instrument evaluates core competency dimensions synthesised into a composite readiness profile and archetype classification.</p>
  <div class="metrics">
    <div class="m-block"><div class="m-val" style="color:{color}">{cs:.1f}</div><div class="m-lbl">Composite Score</div><div class="m-band">{band}</div></div>
    <div class="m-block"><div class="m-val">{arch_name}</div><div class="m-lbl">Archetype</div><div class="m-band" style="font-size:12px;color:{B['muted']}">{" & ".join(dominant_dims[:2]) if dominant_dims else "—"}</div></div>
    <div class="m-block"><div class="m-val">{len(dim_scores)}</div><div class="m-lbl">Dimensions Assessed</div><div class="m-band" style="color:{get_color(cs)}">{band}</div></div>
  </div>
  <div class="rule"></div>
  <h3>Key Insights</h3>
  <table style="width:100%;border-collapse:collapse;font-size:14px">{insight_rows}</table>
  <h3 style="margin-top:36px">Dimension Summary</h3>
  <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:12px">
    <thead><tr>
      <th style="text-align:left;padding:8px 0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:{B['muted']};border-bottom:1px solid {B['border']};font-weight:600">Dimension</th>
      <th style="text-align:center;padding:8px 0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:{B['muted']};border-bottom:1px solid {B['border']};font-weight:600">Score</th>
      <th style="text-align:left;padding:8px 0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:{B['muted']};border-bottom:1px solid {B['border']};font-weight:600">Verdict</th>
    </tr></thead>
    <tbody>{dim_summary}</tbody>
  </table>
"""


def _build_assessment_overview(inst_name, full_name, config):
    dims = config["dimensions"]
    total_q = config["total_questions"]
    bands = config["composite_bands"]
    
    dim_rows = ""
    for dim in dims:
        subs = ", ".join(dim.get("sub_dimensions", [])[:3])
        if len(dim.get("sub_dimensions", [])) > 3:
            subs += f" +{len(dim['sub_dimensions'])-3} more"
        dim_rows += f'<tr><td>{dim["id"]}</td><td>{dim["name"]}</td><td>{dim["n_questions"]}</td><td>{subs}</td></tr>'
    
    band_colors = {"Exceptional": B["gold"], "Strong": B["green"], "Developing": B["orange"],
                   "Emerging": B["orange"], "Early stage": B["red"],
                   "Near-Ready": B["green"], "Ready": B["gold"],
                   "Building Mandate": B["orange"], "Proving Mandate": B["green"],
                   "Market Visible": B["orange"], "Market Established": B["green"]}
    
    band_blocks = ""
    for b in bands:
        bc = band_colors.get(b["band"], B["muted"])
        band_blocks += f'<div style="padding:16px;text-align:center;border-right:1px solid {B["border"]};border-bottom:3px solid {bc}"><div style="font-weight:700;color:{bc};font-size:18px">{b["min"]}–{b["max"]}</div><div style="font-size:11px;color:{B["muted"]};text-transform:uppercase;letter-spacing:1px;margin-top:4px">{b["band"]}</div></div>'
    
    n_cols = len(bands)
    
    return f"""
  <div class="sec-num">02</div>
  <h2>Assessment Overview</h2>
  <h3>Instrument</h3>
  <p><strong>{inst_name}</strong> — {full_name}. A {total_q}-item self-report assessment measuring {len(dims)} core competency dimensions. Each dimension uses Likert-scale items (1–5), yielding raw scores normalised to 0–20 per dimension and 0–100 composite.</p>
  <h3>Dimensions Measured</h3>
  <table class="sub-tbl">
    <thead><tr><th>ID</th><th>Dimension</th><th>Items</th><th>Focus Areas</th></tr></thead>
    <tbody>{dim_rows}</tbody>
  </table>
  <h3>Score Interpretation</h3>
  <div style="display:grid;grid-template-columns:repeat({n_cols},1fr);gap:0;border:1px solid {B['border']};margin:16px 0">
    {band_blocks}
  </div>
  <p style="font-size:13px;color:{B['muted']}">Composite score = mean of all dimension scores, normalised to 0–100. Individual dimension scores range 0–20 with verbal verdicts where defined.</p>
"""


def _build_dimension_deep_dive(dim_scores, dims):
    html = ""
    for dim in dims:
        did = dim["id"]
        data = dim_scores.get(did, {})
        name = data.get("name", dim["name"])
        norm = data.get("normalised", 0)
        pct = norm * 5
        color = get_color(pct)
        verdict = data.get("verdict", {})
        verdict_text = verdict.get("verdict", "")
        verdict_meaning = verdict.get("meaning", "")
        
        if pct >= 70:
            narrative = f"Strong performance on {name}. This dimension is a deployable strength with consistent evidence of capability."
        elif pct >= 50:
            narrative = f"Moderate performance on {name}. Foundational capability exists but targeted development would strengthen consistency and depth."
        else:
            narrative = f"{name} presents a development opportunity. Score indicates limited deployment or capability gaps requiring structured intervention."
        
        if verdict_text:
            narrative += f" Verdict: <strong>{verdict_text}</strong>."
        if verdict_meaning:
            narrative += f" {verdict_meaning}"
        
        sub_scores = data.get("sub_dimensions", {})
        sub_rows = ""
        for sn, sd in sub_scores.items():
            sub_pct = sd.get("normalised", 0) * 5
            sub_rows += f'<tr><td>{sn}</td><td class="num">{sd.get("normalised", 0):.1f}</td><td><div class="mini-track"><div class="mini-fill" style="width:{sub_pct}%;background:{get_color(sub_pct)}"></div></div></td></tr>'
        
        band_label = verdict_text or _get_band_label(pct)
        
        html += f"""
<div class="dim-section">
  <div style="color:{B['fuchsia']};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;margin-bottom:4px">{did}</div>
  <h3 style="margin-top:0">{name}</h3>
  <div class="dim-header">
    <span class="dim-score-big" style="color:{color}">{norm:.1f}</span>
    <span class="dim-band" style="color:{color}">/ 20 · {band_label}</span>
  </div>
  <p>{narrative}</p>
  <table class="sub-tbl">
    <thead><tr><th>Sub-Dimension</th><th>Score</th><th>Level</th></tr></thead>
    <tbody>{sub_rows}</tbody>
  </table>
</div>"""
    return html


def _build_archetype_card(archetype, dim_scores):
    arch_name = archetype["name"]
    arch_desc = archetype.get("description", "")
    dominant = archetype.get("dominant_dimensions", [])
    initial = arch_name[0] if arch_name else "?"
    
    dim_pair = " and ".join(dominant[:2]) if len(dominant) >= 2 else (dominant[0] if dominant else "balanced competency deployment")
    orientation = f"contexts requiring {dominant[0].lower()} capability integrated with {dominant[1].lower()} effectiveness" if len(dominant) >= 2 else (f"contexts requiring deep {dominant[0].lower()} capability" if dominant else "balanced leadership contexts")
    
    return f"""
  <div class="sec-num">05</div>
  <h2>Archetype Profile</h2>
  <div class="arch-block">
    <div class="arch-icon"><div class="icon-fallback">{initial}</div></div>
    <div>
      <div class="eyebrow" style="color:{B['fuchsia']};margin-bottom:10px">Assigned Archetype</div>
      <div class="arch-name">{arch_name}</div>
      <div class="arch-sub">{arch_desc}</div>
      <div class="arch-row">
        <div>
          <div class="arch-col-lbl">Dominant Dimensions</div>
          <p>{" · ".join(dominant[:3]) if dominant else "—"}</p>
        </div>
        <div>
          <div class="arch-col-lbl">Profile Pattern</div>
          <p>Dimension score distribution indicates {arch_name.lower()} profile activation driven by {dim_pair}.</p>
        </div>
      </div>
    </div>
  </div>
  <h3>Archetype Interpretation</h3>
  <p>The <strong>{arch_name}</strong> archetype emerges from the interaction between the candidate's strongest dimensions. This profile suggests a natural orientation toward {orientation}.</p>
  <p>In practice, this means the candidate is most effective when their mandate leverages {dim_pair}, and may face friction when required to operate primarily through lower-scoring dimensions.</p>
  <div class="rule"></div>
  <h3>Archetype Context</h3>
  <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:12px">
    <tr style="border-bottom:1px solid {B['border']}"><td style="padding:12px 0;width:180px;font-weight:600;color:{B['text']}">Archetype</td><td style="padding:12px 0;color:{B['text2']}">{arch_name}</td></tr>
    <tr style="border-bottom:1px solid {B['border']}"><td style="padding:12px 0;font-weight:600;color:{B['text']}">Activation Pattern</td><td style="padding:12px 0;color:{B['text2']}">{arch_desc}</td></tr>
    <tr style="border-bottom:1px solid {B['border']}"><td style="padding:12px 0;font-weight:600;color:{B['text']}">Optimal Context</td><td style="padding:12px 0;color:{B['text2']}">Mandates requiring {dim_pair}</td></tr>
    <tr><td style="padding:12px 0;font-weight:600;color:{B['text']}">Development Edge</td><td style="padding:12px 0;color:{B['text2']}">Extending capability into lower-scoring complementary dimensions</td></tr>
  </table>
"""


def _build_development_priorities(dev_priorities, dim_scores):
    cards = ""
    for dp in dev_priorities:
        dim_name = dp["dimension"]
        score = dp["score"]
        verdict = dp.get("verdict", "")
        
        if score < 8:
            urgency = "High urgency"
            guidance = "Significant gap detected. Recommend structured development programme with external coaching support and measurable milestones."
        elif score < 12:
            urgency = "Moderate urgency"
            guidance = "Reserve-level capability. Targeted interventions — stretch assignments, focused coaching, and deliberate practice — can elevate this dimension to secondary strength."
        else:
            urgency = "Monitor"
            guidance = "Dimension is functional but not a primary strength. Maintain through continued practice and periodic calibration."
        
        cards += f"""
<div class="dev-card">
  <div class="dev-head">
    <span class="dev-n">{dp['priority']}</span>
    <div>
      <div class="dev-title">{dim_name}</div>
      <div class="dev-score">Score: {score}/20 · {verdict} · {urgency}</div>
    </div>
  </div>
  <p>{guidance}</p>
</div>"""
    
    return f"""
  <div class="sec-num">06</div>
  <h2>Development Priorities</h2>
  <p>Ranked development priorities based on dimension score distribution. Priorities are ordered from lowest-scoring dimensions (greatest development need) to highest-scoring among the bottom three.</p>
  {cards}
  <h3>Monitoring Plan</h3>
  <table class="sub-tbl" style="margin-top:12px">
    <thead><tr><th>Checkpoint</th><th>Timeline</th><th>Success Indicator</th></tr></thead>
    <tbody>
      <tr><td>Initial Review</td><td>30 days</td><td>Development plan agreed, resources allocated</td></tr>
      <tr><td>Progress Check</td><td>60 days</td><td>Observable behaviour change in target dimensions</td></tr>
      <tr><td>Reassessment</td><td>90 days</td><td>Score improvement ≥ 2 points on priority dimensions</td></tr>
    </tbody>
  </table>
"""


def _build_apac_section(inst_name, dim_scores):
    apac_dims = []
    for did, data in dim_scores.items():
        name_lower = data["name"].lower()
        if any(kw in name_lower for kw in ["apac", "mandate credibility", "translation", "cross-border", "regional"]):
            apac_dims.append(data)
    
    apac_notes = f"""
    <p>The APAC context modifier accounts for cross-cultural leadership dynamics specific to the Asia-Pacific operating environment. Leadership effectiveness in APAC markets requires additional competency layers beyond Western-centric assessment frameworks.</p>
    <p>Key APAC-specific factors considered in SHIFT assessments include:</p>
    <ul style="padding-left:18px;margin:12px 0">
      <li style="margin-bottom:8px;font-size:14px;color:{B['text2']}">Guanxi and relationship capital in Greater China markets</li>
      <li style="margin-bottom:8px;font-size:14px;color:{B['text2']}">Regulatory navigation across ASEAN jurisdictions</li>
      <li style="margin-bottom:8px;font-size:14px;color:{B['text2']}">Cross-cultural communication in multilingual team environments</li>
      <li style="margin-bottom:8px;font-size:14px;color:{B['text2']}">Speed-of-execution calibration for APAC market pace</li>
      <li style="margin-bottom:8px;font-size:14px;color:{B['text2']}">Stakeholder management across hierarchical vs. flat structures</li>
    </ul>"""
    
    if apac_dims:
        specific = f"<p><strong>APAC-specific dimensions detected in this assessment:</strong></p><ul style='padding-left:18px;margin:12px 0'>"
        for ad in apac_dims:
            label = "Strong APAC positioning" if ad["normalised"] >= 14 else ("APAC development area" if ad["normalised"] >= 10 else "APAC readiness gap")
            specific += f"<li style='margin-bottom:8px;font-size:14px;color:{B['text2']}'>{ad['name']}: {ad['normalised']}/20 — {label}</li>"
        specific += "</ul>"
    else:
        specific = "<p><em>No instrument-specific APAC dimensions detected. The modifier notes above apply as contextual overlay to all dimension scores.</em></p>"
    
    return f"""
  <div class="sec-num">07</div>
  <h2>APAC Context Modifier</h2>
  <p>SHIFT assessments are designed with APAC leadership context embedded in the assessment architecture. This section provides contextual interpretation for candidates operating primarily in Asia-Pacific markets.</p>
  <div class="apac-card">
    <h4>APAC Leadership Context</h4>
    {apac_notes}
  </div>
  <div class="rule"></div>
  <h3>Instrument-Specific APAC Notes</h3>
  {specific}
  <div style="margin-top:24px;padding:20px;background:{B['gray_bg']};border:1px solid {B['border']};font-size:13px;color:{B['muted']}">
    <strong>Note:</strong> APAC modifier scores are contextual overlays, not separate dimensions. They inform interpretation of the primary dimension scores and archetype assignment for candidates whose primary operating context is the Asia-Pacific region.
  </div>
"""


def _build_appendix(inst_name, full_name, config, composite_bands):
    dims = config["dimensions"]
    total_q = config["total_questions"]
    n_arch = len(config.get("archetypes", []))
    
    rc_items = []
    for dim in dims:
        rc_items.extend(dim.get("reverse_coded", []))
    rc_text = ", ".join(rc_items) if rc_items else "None"
    
    band_rows = ""
    for b in composite_bands:
        band_rows += f'<tr><td>{b["min"]}–{b["max"]}</td><td>{b["band"]}</td><td>{b["interpretation"]}</td></tr>'
    
    return f"""
  <div class="sec-num">08</div>
  <h2>Appendix — Methodology</h2>
  <h3>Instrument Details</h3>
  <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:12px">
    <tr style="border-bottom:1px solid {B['border']}"><td style="padding:8px 0;width:200px;font-weight:600">Instrument</td><td style="padding:8px 0">{inst_name} — {full_name}</td></tr>
    <tr style="border-bottom:1px solid {B['border']}"><td style="padding:8px 0;font-weight:600">Total Items</td><td style="padding:8px 0">{total_q}</td></tr>
    <tr style="border-bottom:1px solid {B['border']}"><td style="padding:8px 0;font-weight:600">Dimensions</td><td style="padding:8px 0">{len(dims)}</td></tr>
    <tr style="border-bottom:1px solid {B['border']}"><td style="padding:8px 0;font-weight:600">Scale</td><td style="padding:8px 0">1–5 Likert</td></tr>
    <tr style="border-bottom:1px solid {B['border']}"><td style="padding:8px 0;font-weight:600">Reverse-Coded Items</td><td style="padding:8px 0;font-size:13px">{rc_text}</td></tr>
    <tr style="border-bottom:1px solid {B['border']}"><td style="padding:8px 0;font-weight:600">Archetypes Defined</td><td style="padding:8px 0">{n_arch}</td></tr>
    <tr><td style="padding:8px 0;font-weight:600">Composite Range</td><td style="padding:8px 0">0–100</td></tr>
  </table>
  <h3>Composite Score Bands</h3>
  <table class="sub-tbl" style="margin-top:12px">
    <thead><tr><th>Range</th><th>Band</th><th>Interpretation</th></tr></thead>
    <tbody>{band_rows}</tbody>
  </table>
  <h3>Scoring Methodology</h3>
  <p>Each item is scored 1–5. Reverse-coded items are inverted (score = 6 − raw). Dimension scores are summed and normalised to 0–20 using the formula: (raw_sum / raw_max) × 20. Composite score is the mean of all dimension normalised scores, scaled to 0–100.</p>
  <p>Archetype assignment uses dimension score ranking — the two highest-scoring dimensions are matched against archetype definitions via keyword proximity analysis.</p>
  <h3>SHIFT Suite Integration</h3>
  <p>{inst_name} is one instrument in the SHIFT Diagnostic Suite. In composite SHIFT scoring, {inst_name} contributes a weighted component based on the engagement context. Other instruments in the suite include DRIVE, COACH, FORGE, BRIDGE, MOSAIC, and SPARK.</p>
"""


def _build_legal(inst_name, full_name):
    return f"""
  <div class="legal">
    <h3>Confidentiality Notice</h3>
    <p>This report is confidential and intended for authorized recipients only. Distribution, reproduction, or disclosure of this report's contents to unauthorized parties is strictly prohibited. The information contained herein is the proprietary assessment data of LYC Partners.</p>
    <h3>Disclaimer</h3>
    <p>Assessment results are based on self-reported data and should be interpreted in context by qualified professionals. This report does not constitute a clinical diagnosis, psychological evaluation, or medical assessment. Results reflect the candidate's self-perception at the time of assessment and may be influenced by transient mood, social desirability, or contextual factors.</p>
    <p>{inst_name} scores and archetype assignments are developmental tools, not predictive guarantees. They should be used in conjunction with other evidence (interviews, 360° feedback, performance data) before making high-stakes decisions.</p>
    <h3>Data Protection</h3>
    <p>Personal data collected during this assessment is processed in accordance with applicable data protection regulations including GDPR and PDPA. Assessment data is stored securely, retained for the period specified in the engagement agreement, and destroyed thereafter. Candidates retain the right to access, correct, or request deletion of their personal data.</p>
    <h3>Copyright & Trademarks</h3>
    <p>© 2026 LYC Partners. All rights reserved. {inst_name}, SHIFT, and all associated diagnostic instruments are proprietary to LYC Partners. The SHIFT Diagnostic Suite methodology, scoring algorithms, and archetype frameworks are protected intellectual property. Unauthorised reproduction or adaptation is prohibited.</p>
  </div>
"""


def _get_band_label(pct):
    if pct >= 85: return "Exceptional"
    if pct >= 70: return "Strong"
    if pct >= 50: return "Developing"
    return "Needs Support"


# ═══════════════════════════════════════
# MAIN GENERATOR
# ═══════════════════════════════════════

def generate_shift_report(scored_profile, candidate_name="Assessment Candidate",
                          date=None, instrument=None):
    if not date:
        date = datetime.now().strftime("%d %B %Y")
    
    inst_name = instrument or scored_profile["instrument"]
    config_path = os.path.join(SCRIPT_DIR, f"{inst_name.lower()}_config.json")
    with open(config_path) as f:
        config = json.load(f)
    
    full_name = config["full_name"]
    dims = config["dimensions"]
    composite_bands = config["composite_bands"]
    
    cs = scored_profile["composite"]["score"]
    band = scored_profile["composite"]["band"]
    band_interp = scored_profile["composite"]["interpretation"]
    dim_scores = scored_profile["dimension_scores"]
    archetype = scored_profile["archetype"]
    dev_priorities = scored_profile["development_priorities"]
    
    logo_b64 = load_logo_b64()
    logo_html = (
        f'<img src="{logo_b64}" alt="LYC Partners" style="height:36px;width:auto;display:block;">'
        if logo_b64
        else '<div style="font-weight:700;font-size:18px;color:#FFFFFF;font-family:Crimson Pro,serif;">LYC PARTNERS</div>'
    )
    
    css = build_css()
    gauge_svg = _build_gauge_svg(cs)
    dim_bars_html = _build_dimension_bars(dim_scores, dims)
    dim_deep_html = _build_dimension_deep_dive(dim_scores, dims)
    archetype_html = _build_archetype_card(archetype, dim_scores)
    dev_html = _build_development_priorities(dev_priorities, dim_scores)
    apac_html = _build_apac_section(inst_name, dim_scores)
    exec_html = _build_exec_summary(inst_name, full_name, cs, band, band_interp, archetype, dim_scores, dev_priorities)
    overview_html = _build_assessment_overview(inst_name, full_name, config)
    appendix_html = _build_appendix(inst_name, full_name, config, composite_bands)
    legal_html = _build_legal(inst_name, full_name)
    
    toc_items = [
        ("01", "Executive Summary", "3"),
        ("02", "Assessment Overview", "5"),
        ("03", "Diagnostic Profile", "6"),
        ("04", "Dimension Deep-Dive", "9"),
        ("05", "Archetype Profile", "13"),
        ("06", "Development Priorities", "15"),
        ("07", "APAC Context Modifier", "16"),
        ("08", "Appendix — Methodology", "17"),
        ("09", "Legal & Disclaimers", "18"),
    ]
    toc_html = _build_toc(toc_items)
    
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{inst_name} Diagnostic Report — {candidate_name}</title>
<style>{css}</style>
</head>
<body>

<div class="cover">
  <div class="cover-top">
    <div style="margin-bottom:20px">{logo_html}</div>
    <div class="cover-title">{inst_name}</div>
    <div class="cover-sub">{full_name}</div>
    <div style="margin-top:12px"><span class="tagline">Diagnose. Design. Deliver.</span></div>
  </div>
  <div class="cover-mid">
    <div class="eyebrow">Confidential Assessment</div>
    <div class="cover-name">{candidate_name}</div>
    <div class="cover-date">{date}</div>
  </div>
  <div class="cover-bot">
    <div class="cover-left">LYC Partners<br>Shanghai · Hong Kong · Singapore<br>contact@lyc-partners.ai</div>
    <div class="cover-right">© 2026 LYC Partners. All rights reserved.</div>
  </div>
</div>

<div style="page-break-after:always">
  <div class="sec-num">Contents</div>
  <h2>Table of Contents</h2>
  {toc_html}
</div>

<div style="page-break-after:always">{exec_html}</div>
<div style="page-break-after:always">{overview_html}</div>

<div style="page-break-after:always">
  <div class="sec-num">03</div>
  <h2>Diagnostic Profile</h2>
  <h3>Composite Score</h3>
  <div style="text-align:center;padding:40px 0;border-top:3px solid {B['dark']};border-bottom:1px solid {B['border']};margin:16px 0">
    {gauge_svg}
    <div style="font-size:20px;font-weight:600;margin-top:12px;color:{B['text']}">{band}</div>
    <div style="font-size:14px;color:{B['muted']};margin-top:4px">{band_interp}</div>
  </div>
  <h3>Dimension Scores</h3>
  {dim_bars_html}
</div>

<div style="page-break-after:always">
  <div class="sec-num">04</div>
  <h2>Dimension Deep-Dive</h2>
  <p>Detailed analysis of each assessed dimension with sub-dimension breakdown and interpretive context.</p>
  {dim_deep_html}
</div>

<div style="page-break-after:always">{archetype_html}</div>
<div style="page-break-after:always">{dev_html}</div>
<div style="page-break-after:always">{apac_html}</div>
<div style="page-break-after:always">{appendix_html}</div>
<div>{legal_html}</div>

<div class="doc-foot">
  <div style="color:{B['fuchsia']};font-size:18px;letter-spacing:8px;margin-bottom:8px">● ● ●</div>
  <div class="tagline">Diagnose. Design. Deliver.</div>
  <div style="font-size:12px;color:{B['muted']};margin-top:12px">© 2026 LYC Partners. All rights reserved.<br>SHIFT Diagnostic Suite is proprietary to LYC Partners.</div>
</div>

</body>
</html>"""
    return html


# ═══════════════════════════════════════
# CLI — Generate demo reports
# ═══════════════════════════════════════

if __name__ == "__main__":
    import sys
    sys.path.insert(0, str(SCRIPT_DIR))
    from shift_engine import ShiftScorer
    import random
    
    output_dir = SCRIPT_DIR / "reports"
    output_dir.mkdir(exist_ok=True)
    
    for name in ["LEAP", "QUEST", "IMPACT", "PRISM"]:
        scorer = ShiftScorer(name)
        random.seed(42)
        
        responses = {}
        for dim in scorer.config["dimensions"]:
            for qid in dim["question_ids"]:
                responses[qid] = random.randint(2, 5)
        
        scored = scorer.score(responses)
        html = generate_shift_report(scored, candidate_name="Assessment Candidate", instrument=name)
        
        out_path = output_dir / f"{name}_Report_v1.html"
        with open(out_path, "w") as f:
            f.write(html)
        
        print(f"✅ {name}: {out_path} ({len(html):,} bytes)")
        print(f"   Composite: {scored['composite']['score']}/100 ({scored['composite']['band']})")
        print(f"   Archetype: {scored['archetype']['name']}")
        print()
    
    print(f"All reports generated in: {output_dir}")
