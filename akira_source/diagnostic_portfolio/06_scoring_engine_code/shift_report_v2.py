#!/usr/bin/env python3
"""
SHIFT Suite — Parameterised HTML Report Generator v6 (Archetype-First + Staircase)
LYC Partners brand system: Dark (#0F1115) + Fuchsia (#C108AB) + Greys.
Actual logo embedded. Callout system uses top-rule cards + dot markers.
Full-bleed pages, running footers, proper document structure.
"""

import json
import os
import base64
import math
from pathlib import Path
from datetime import datetime

SCRIPT_DIR = Path(__file__).parent
LOGO_PATH = SCRIPT_DIR / "lyc_logo.png"

# ═══════════════════════════════════════
# LYC Partners Brand Palette
# ═══════════════════════════════════════
B = {
    "dark": "#0F1115",        # Primary — headers, tables, cover, archetype
    "fuchsia": "#C108AB",     # Accent — dots, thin rules, small markers (MINIMAL)
    "white": "#FFFFFF",
    "bg": "#F5F5F5",          # Callout/background tint (brand light grey)
    "bg_warm": "#FDF5FC",     # Very subtle fuchsia tint for warnings
    "border": "#E0E0E0",      # Subtle borders
    "border_light": "#EEEEEE",# Even subtler
    "text": "#1A1A1A",        # Body text
    "text2": "#4A4A4A",       # Secondary text
    "muted": "#888888",       # Muted labels
    "score_hi": "#0F1115",    # 85+ Exceptional — brand dark
    "score_strong": "#C108AB",# 70-84 Strong — brand fuchsia
    "score_dev": "#6E7A8A",   # 50-69 Developing — blue-grey
    "score_gap": "#B0B0B8",   # <50 Gap — light grey
}

def get_color(pct):
    """Score colour — brand-aligned 4-band encoding."""
    if pct >= 85: return B["score_hi"]
    if pct >= 70: return B["score_strong"]
    if pct >= 50: return B["score_dev"]
    return B["score_gap"]

def _get_band_label(pct):
    if pct >= 85: return "Exceptional"
    if pct >= 70: return "Strong"
    if pct >= 50: return "Developing"
    return "Needs Support"

def load_logo_b64():
    if not LOGO_PATH.exists(): return None
    try:
        with open(LOGO_PATH, "rb") as f:
            return f"data:image/png;base64,{base64.b64encode(f.read()).decode()}"
    except: return None

INVERTED_LOGO_PATH = SCRIPT_DIR / "lyc_logo_inverted.png"
def load_logo_inverted_b64():
    if not INVERTED_LOGO_PATH.exists(): return None
    try:
        with open(INVERTED_LOGO_PATH, "rb") as f:
            return f"data:image/png;base64,{base64.b64encode(f.read()).decode()}"
    except: return None

# ═══════════════════════════════════════
# Content Library Loader
# ═══════════════════════════════════════

def _load_content_library(inst_name):
    lib_map = {
        "QUEST": "quest_content", "IMPACT": "impact_content",
        "PRISM": "prism_content", "SPARK": "spark_content",
        "FORGE": "forge_content", "MOSAIC": "mosaic_content",
        "BRIDGE": "bridge_content", "COACH": "coach_content",
        "DRIVE": "drive_content",
    }
    lib_name = lib_map.get(inst_name)
    if not lib_name: return None
    try:
        import importlib
        return importlib.import_module(lib_name)
    except ImportError:
        return None

def _get_dim_content(lib, dim_name, pct):
    if lib is None: return None
    try:
        return lib.get_dimension_content(dim_name, pct)
    except:
        return None

# ═══════════════════════════════════════
# CSS — LYC Partners Brand System v5
# ═══════════════════════════════════════

def build_css(inst_name):
    css_tmpl = """
/* Fonts: Built-in DejaVu family (no external CDN) */
@font-face { font-family: 'Crimson Pro'; src: local('DejaVu Serif'); font-weight: 400; }
@font-face { font-family: 'Crimson Pro'; src: local('DejaVu Serif Bold'); font-weight: 700; }
@font-face { font-family: 'DM Sans'; src: local('DejaVu Sans'); font-weight: 400; }
@font-face { font-family: 'DM Sans'; src: local('DejaVu Sans Bold'); font-weight: 700; }
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{background:#E8E8EC}
body{font-family:'DM Sans',sans-serif;font-size:16px;line-height:1.6;color:%(text)s;background:#fff;max-width:210mm;margin:0 auto;padding:0;box-shadow:0 0 40px rgba(0,0,0,.08)}

/* ── Cover (brand dark + actual logo + fuchsia accents) ── */
.cover{min-height:100vh;display:flex;flex-direction:column;justify-content:space-between;padding:60px 56px;background:%(dark)s;color:#fff;position:relative;margin:0;overflow:hidden}
.cover::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(circle at 20%% 80%%, rgba(193,8,171,0.06) 0%%, transparent 50%%), radial-gradient(circle at 80%% 20%%, rgba(193,8,171,0.04) 0%%, transparent 50%%);pointer-events:none}
.cover-top{flex:0;position:relative;z-index:1}
.cover-mid{flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0;position:relative;z-index:1}
.cover-bot{flex:0;display:flex;justify-content:space-between;align-items:flex-end;font-size:11px;opacity:.5;padding-bottom:16px;position:relative;z-index:1}
.cover-logo-img{max-width:200px;height:auto;margin-bottom:24px;opacity:.9}
.cover-dots{color:%(fuchsia)s;font-size:18px;letter-spacing:8px;margin-bottom:20px;opacity:.7}
.cover-title{font-family:'Crimson Pro',serif;font-size:72px;font-weight:700;line-height:1.05;letter-spacing:-1px;margin-top:8px}
.cover-sub{font-family:'DM Sans',sans-serif;font-size:14px;font-weight:400;letter-spacing:2px;text-transform:uppercase;margin-top:10px;opacity:.6}
.cover-name{font-family:'Crimson Pro',serif;font-size:36px;font-weight:600;line-height:1.2;margin:12px 0 6px}
.cover-date{font-size:13px;opacity:.45}
.cover-eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:4px;opacity:.4;margin-bottom:4px}
.cover-tagline{font-size:10px;letter-spacing:3px;text-transform:uppercase;opacity:.35;margin-top:8px}

/* ── Page Sections ── */
.page{padding:48px 56px 40px;position:relative;min-height:80vh}
.sec-num{font-size:10px;text-transform:uppercase;letter-spacing:3px;color:%(fuchsia)s;margin-bottom:4px;font-weight:600}
h2{font-family:'Crimson Pro',serif;font-size:26px;font-weight:700;color:%(dark)s;border-bottom:1px solid %(border)s;padding-bottom:10px;margin-bottom:20px}
h3{font-family:'Crimson Pro',serif;font-size:19px;font-weight:600;color:%(dark)s;margin:20px 0 8px}

/* ── Score Bars (Dynamic — colour + width) ── */
.dim-bar-row{display:flex;align-items:center;margin:10px 0;gap:12px}
.dim-label{flex:0 0 180px;font-size:14px;font-weight:500;color:%(text)s}
.dim-track{flex:1;height:10px;background:%(border)s;position:relative;border-radius:1px}
.dim-fill{height:100%%;transition:width .3s;border-radius:1px}
.dim-val{flex:0 0 50px;text-align:right;font-size:14px;font-weight:600}

/* ── Dimension Deep-Dive ── */
.dim-section{padding:28px 0;border-bottom:1px solid %(border_light)s}
.dim-header{display:flex;align-items:baseline;gap:12px;margin-bottom:14px}
.dim-score-big{font-size:40px;font-weight:700}
.dim-band{font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px}
.dim-id-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;color:%(muted)s;margin-bottom:4px}

/* ── Sub-Dim Table ── */
.sub-tbl{width:100%%;border-collapse:collapse;margin:12px 0;font-size:14px}
.sub-tbl th{background:%(dark)s;color:#fff;padding:8px 12px;text-align:left;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.5px}
.sub-tbl td{padding:8px 12px;border-bottom:1px solid %(border)s}
.sub-tbl .num{font-weight:600;text-align:center;width:60px}
.mini-track{display:inline-block;width:200px;height:8px;background:%(border)s;vertical-align:middle;border-radius:1px}
.mini-fill{height:100%%;border-radius:1px}

/* ── Executive Summary — Metric Cards ── */
.metric-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:16px 0}
.metric-card{text-align:center;padding:16px 8px;border-top:2px solid %(dark)s;background:%(bg)s}
.m-val{font-size:22px;font-weight:700;color:%(dark)s}
.m-label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:%(muted)s;margin-top:4px}

/* ── TOC ── */
.toc-item{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid %(border)s;font-size:14px}
.toc-item span:first-child{font-weight:500}

/* ── Archetype Block (brand dark + fuchsia stripe) ── */
.arch-block{background:%(dark)s;color:#fff;padding:48px 56px;margin:0 -56px;text-align:center;position:relative}
.arch-block::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:%(fuchsia)s}
.arch-block::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:rgba(193,8,171,0.3)}
.arch-eyebrow{font-size:10px;letter-spacing:4px;text-transform:uppercase;opacity:.4;margin-bottom:12px}
.arch-dots{color:%(fuchsia)s;font-size:14px;letter-spacing:6px;margin-bottom:16px;opacity:.6}
.arch-name{font-family:'Crimson Pro',serif;font-size:34px;font-weight:700;margin-bottom:6px}
.arch-sub{font-size:13px;opacity:.55;letter-spacing:2px;text-transform:uppercase;margin-bottom:20px}
.arch-desc{font-size:15px;line-height:1.7;max-width:560px;margin:0 auto;opacity:.85}

/* ── Development Priorities ── */
.dev-card{padding:16px 0;border-bottom:1px solid %(border)s}
.dev-rank{font-size:10px;font-weight:700;color:%(fuchsia)s;text-transform:uppercase;letter-spacing:2px}
.dev-title{font-size:17px;font-weight:600;color:%(dark)s;margin:4px 0}
.dev-score{font-size:13px;color:%(text2)s}

/* ── Tables ── */
table{width:100%%;border-collapse:collapse;margin:12px 0;font-size:14px}
th{background:%(dark)s;color:#fff;padding:8px 12px;text-align:left;font-size:12px}
td{padding:8px 12px;border-bottom:1px solid %(border)s}

/* ── Body Text ── */
.gs-para{margin:0 0 14px 0;text-align:left;line-height:1.7;font-size:15px;color:%(text)s}

/* ── Section Subheading ── */
.gs-h3{font-family:'Crimson Pro',serif;font-size:17px;font-weight:600;color:%(dark)s;margin:24px 0 10px 0;padding-bottom:6px;border-bottom:1px solid %(border)s}

/* ══════════════════════════════════════════════
   CALLOUT SYSTEM — Top-rule cards + dot markers
   NO left-border rectangles
   ══════════════════════════════════════════════ */

/* Key Insights: dark top rule, subtle bg, fuchsia dot marker */
.callout{background:%(bg)s;padding:18px 22px 16px;margin:20px 0;font-size:14px;line-height:1.7;border-top:1px solid %(dark)s;position:relative}
.callout strong{color:%(dark)s;display:block;margin-bottom:6px;font-size:11px;text-transform:uppercase;letter-spacing:1px}
.callout strong::before{content:'● ';color:%(fuchsia)s;font-size:8px;vertical-align:middle;margin-right:2px}

/* Strength Overused: fuchsia top rule, warm tint */
.callout-warn{background:%(bg_warm)s;padding:18px 22px 16px;margin:20px 0;font-size:14px;line-height:1.7;border-top:1px solid %(fuchsia)s;position:relative}
.callout-warn strong{color:%(dark)s;display:block;margin-bottom:6px;font-size:11px;text-transform:uppercase;letter-spacing:1px}
.callout-warn strong::before{content:'● ';color:%(fuchsia)s;font-size:8px;vertical-align:middle;margin-right:2px}

/* Coaching Prompts: no border, clean card with dot header */
.callout-info{background:#fff;padding:18px 22px 16px;margin:18px 0;font-size:14px;line-height:1.7;border:1px solid %(border)s}
.callout-info strong{color:%(dark)s;display:block;margin-bottom:8px;font-size:11px;text-transform:uppercase;letter-spacing:1px}
.callout-info strong::before{content:'● ';color:%(fuchsia)s;font-size:8px;vertical-align:middle;margin-right:2px}
.callout-info ol{margin:8px 0 0 0;padding-left:20px}
.callout-info ol li{margin-bottom:6px;font-size:13px;line-height:1.6}

/* APAC Cultural Calibration: subtle dotted top rule */
.callout-context{background:%(bg)s;padding:18px 22px 16px;margin:18px 0;font-size:14px;line-height:1.7;border-top:1px dotted %(muted)s}
.callout-context strong{color:%(dark)s;display:block;margin-bottom:6px;font-size:11px;text-transform:uppercase;letter-spacing:1px}
.callout-context strong::before{content:'● ';color:%(fuchsia)s;font-size:8px;vertical-align:middle;margin-right:2px}

/* Cross-dimension dynamics: minimal, clean */
.callout-dynamic{background:#fff;padding:12px 22px;margin:10px 0;font-size:13px;line-height:1.65;border-top:1px solid %(border_light)s}
.callout-dynamic strong{color:%(dark)s}
.callout-dynamic strong::before{content:'● ';color:%(fuchsia)s;font-size:6px;vertical-align:middle;margin-right:2px}

.gs-sub-interp{font-size:12px;color:%(text2)s;margin-top:2px;line-height:1.5}

/* ── Page Footer ── */
.page-foot{padding:20px 56px;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:%(muted)s;border-top:1px solid %(border)s;text-transform:uppercase;letter-spacing:1px}

/* ── Document Footer ── */
.doc-foot{text-align:center;padding:40px 56px;font-size:11px;color:%(muted)s;border-top:1px solid %(dark)s;margin-top:0}
.doc-foot-dots{color:%(fuchsia)s;font-size:14px;letter-spacing:6px;margin-bottom:12px}
.doc-foot-rule{width:30px;height:1px;background:%(fuchsia)s;margin:0 auto 16px}


/* ── Ring Reversed Header (ArchOption 03) ── */
.ring-header{display:flex;gap:36px;align-items:stretch;padding:20px 0 24px;border-bottom:1px solid %(border)s}
.ring-col{flex:0 0 140px;text-align:center;display:flex;align-items:center;justify-content:center}
.ring-cards{flex:1;display:flex;flex-direction:column;gap:0}
.ring-arch-card{padding:20px 24px;background:%(dark)s;border-top:3px solid %(fuchsia)s;flex:1}
.ring-arch-val{font-family:'Crimson Pro',serif;font-size:32px;font-weight:700;color:#FFFFFF}
.ring-arch-desc{font-size:12px;color:rgba(255,255,255,.7);margin-top:6px;font-style:italic}
.ring-meta{padding:12px 24px;background:%(bg)s;display:flex;gap:32px}
.ring-meta-item{flex:1}
.ring-meta-val{font-size:16px;font-weight:600;color:%(dark)s}
.ring-meta-label{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:%(muted)s;margin-top:2px}

/* ── Staircase Chart (ChartOption 03) ── */
.staircase-wrap{display:flex;align-items:flex-end;gap:6px;height:180px;padding:0 0 4px;border-bottom:1px solid %(border)s;margin:16px 0 8px}
.stair-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px}
.stair-val{font-size:12px;font-weight:600}
.stair-bar{width:100%%;border-radius:2px 2px 0 0;min-width:36px}
.stair-label{font-size:11px;color:%(text2)s;text-align:center;line-height:1.2;padding:4px 2px}
.stair-axis{display:flex;justify-content:space-between;font-size:10px;color:%(muted)s;padding:0 4px;margin-bottom:12px}

/* ── Print Styles ── */
@media print {
  html{background:#fff}
  body{box-shadow:none;max-width:none;margin:0}
  .cover{min-height:100vh;page-break-after:always}
  .page{page-break-before:always;padding:24px 40px}
  .page-foot{display:none}
  @page{margin:15mm 12mm;@top-right{content:'%(inst)s — CONFIDENTIAL';font-size:8px;color:#888}
  @bottom-center{content:counter(page);font-size:9px;color:#888}}
"""
    return css_tmpl % {"inst": inst_name, **B}

# ═══════════════════════════════════════
# Section Builders
# ═══════════════════════════════════════

def _build_gauge_svg(score):
    """Brand-aligned SVG gauge — stroke colour encodes score band."""
    radius = 54
    circ = 2 * math.pi * radius
    offset = circ * (1 - score / 100)
    color = get_color(score)
    return f'''<svg width="150" height="150" viewBox="0 0 150 150">
<circle cx="75" cy="75" r="{radius}" fill="none" stroke="{B['border']}" stroke-width="8"/>
<circle cx="75" cy="75" r="{radius}" fill="none" stroke="{color}" stroke-width="8"
  stroke-dasharray="{circ:.1f}" stroke-dashoffset="{offset:.1f}"
  stroke-linecap="butt" transform="rotate(-90 75 75)" style="transition:stroke-dashoffset .6s"/>
<text x="75" y="70" text-anchor="middle" font-family="DM Sans" font-size="28" font-weight="700" fill="{B['dark']}">{score:.0f}</text>
<text x="75" y="90" text-anchor="middle" font-family="DM Sans" font-size="11" fill="{B['muted']}" letter-spacing="1">/ 100</text>
</svg>'''


def _build_ring_reversed_header(archetype, cs, band, dim_scores):
    """ArchOption 03 — Ring Reversed: ring shows archetype initial, archetype card as hero."""
    import math as _m
    arch_name = archetype.get("name", "—")
    arch_desc = archetype.get("description", "")
    initial = arch_name[0].upper() if arch_name and arch_name != "—" else "?"
    radius = 52
    circ = 2 * _m.pi * radius
    offset = circ * (1 - cs / 100)
    ring_color = get_color(cs)
    ring_svg = f'''<svg width="130" height="130" viewBox="0 0 130 130">
<circle cx="65" cy="65" r="{radius}" fill="none" stroke="{B["border"]}" stroke-width="6"/>
<circle cx="65" cy="65" r="{radius}" fill="none" stroke="{ring_color}" stroke-width="6"
  stroke-dasharray="{circ:.1f}" stroke-dashoffset="{offset:.1f}"
  stroke-linecap="butt" transform="rotate(-90 65 65)"/>
<text x="65" y="60" text-anchor="middle" font-family="Crimson Pro,serif" font-size="36" font-weight="700" fill="{B["dark"]}">{initial}</text>
<text x="65" y="82" text-anchor="middle" font-family="DM Sans,sans-serif" font-size="9" fill="{B["muted"]}" letter-spacing="2">{arch_name.upper()}</text>
</svg>'''
    n_dims = len(dim_scores)
    return f'''
<div class="ring-header">
  <div class="ring-col">{ring_svg}</div>
  <div class="ring-cards">
    <div class="ring-arch-card">
      <div class="ring-arch-val">{arch_name}</div>
      <div class="ring-arch-desc">{arch_desc}</div>
    </div>
    <div class="ring-meta">
      <div class="ring-meta-item"><div class="ring-meta-val">{band}</div><div class="ring-meta-label">Band</div></div>
      <div class="ring-meta-item"><div class="ring-meta-val">{cs:.0f}</div><div class="ring-meta-label">Score</div></div>
      <div class="ring-meta-item"><div class="ring-meta-val">{n_dims}</div><div class="ring-meta-label">Dims</div></div>
    </div>
  </div>
</div>'''

def _build_toc(items):
    html = ""
    for num, title, page in items:
        html += f'<div class="toc-item"><span>{num} — {title}</span><span style="color:{B["muted"]}">{page}</span></div>'
    return html

def _build_dimension_bars(dim_scores, dims):
    """Staircase chart (ChartOption 03) — ranked columns, tallest left."""
    dim_data = []
    for dim in dims:
        did = dim["id"]
        data = dim_scores.get(did, {})
        name = data.get("name", dim["name"])
        norm = data.get("normalised", 0)
        pct = norm * 5
        color = get_color(pct)
        dim_data.append((name, norm, pct, color))
    
    # Sort by score descending (ranked)
    dim_data.sort(key=lambda x: x[2], reverse=True)
    
    # Build staircase columns
    cols = ""
    for name, norm, pct, color in dim_data:
        bar_h = pct * 1.5  # max ~150px
        cols += f'<div class="stair-col">'
        cols += f'<div class="stair-val" style="color:{color}">{norm:.1f}</div>'
        cols += f'<div class="stair-bar" style="height:{bar_h:.0f}px;background:{color}"></div>'
        cols += f'<div class="stair-label">{name}</div>'
        cols += f'</div>'
    
    html = f'<div class="staircase-wrap">{cols}</div>'
    html += '<div class="stair-axis"><span>0</span><span>5</span><span>10</span><span>15</span><span>20</span></div>'
    return html

def _build_exec_summary(inst_name, full_name, cs, band, band_interp, archetype, dim_scores, dev_priorities):
    return f"""
<div class="page">
<div class="sec-num">01</div>
<h2>Executive Summary</h2>
<p class="gs-para">{inst_name} ({full_name}) diagnostic results. Key findings and development priorities below.</p>
{_build_ring_reversed_header(archetype, cs, band, dim_scores)}
<p class="gs-para">{band_interp}</p>
<p class="gs-para">Archetype <strong>{archetype.get('name','—')}</strong> — {archetype.get('description','')}</p>
<h3>Key Development Priorities</h3>
<table>
<tr><th>Priority</th><th>Dimension</th><th>Score</th><th>Verdict</th></tr>
""" + "".join(
    f'<tr><td>{i+1}</td><td>{p.get("dimension","—")}</td><td>{p.get("score",0):.1f}/20</td><td>{p.get("verdict","")}</td></tr>'
    for i, p in enumerate(dev_priorities)
) + """</table>
</div>
"""

def _build_assessment_overview(inst_name, full_name, config):
    dims = config["dimensions"]
    rows = ""
    for d in dims:
        subs = ", ".join(d.get("sub_dimensions", [])) or "—"
        rows += f'<tr><td>{d["id"]}</td><td>{d["name"]}</td><td>{d["n_questions"]}</td><td style="font-size:12px">{subs}</td></tr>'
    return f"""
<div class="page">
<div class="sec-num">02</div>
<h2>Assessment Overview</h2>
<p class="gs-para">Instrument <strong>{inst_name}</strong> — {full_name}. {config['total_questions']} items, {len(dims)} dimensions. Likert-scale (1–5), normalised to 0–20 per dimension, 0–100 composite.</p>
<table>
<tr><th>ID</th><th>Dimension</th><th>Items</th><th>Focus Areas</th></tr>
{rows}
</table>
</div>
"""

def _build_dimension_deep_dive(dim_scores, dims, content_lib):
    html = '<p class="gs-para">Dimension-by-dimension analysis: sub-dimension breakdown, behavioural interpretation, coaching prompts, and APAC cultural calibration.</p>'
    
    for dim in dims:
        did = dim["id"]
        data = dim_scores.get(did, {})
        name = data.get("name", dim["name"])
        norm = data.get("normalised", 0)
        pct = norm * 5
        color = get_color(pct)
        verdict = data.get("verdict", {})
        verdict_text = verdict.get("verdict", "")
        band_label = verdict_text or _get_band_label(pct)
        
        dim_content = _get_dim_content(content_lib, name, pct)
        
        # Sub-dimension rows with dynamic bars
        sub_scores = data.get("sub_dimensions", {})
        sub_rows = ""
        for sn, sd in sub_scores.items():
            sub_pct = sd.get("normalised", 0) * 5
            sub_interp = ""
            if dim_content and sn in dim_content.get("sub_dim_interpretation", {}):
                sub_interp = f'<div class="gs-sub-interp">{dim_content["sub_dim_interpretation"][sn]}</div>'
            sub_rows += f'<tr><td><strong>{sn}</strong>{sub_interp}</td><td class="num">{sd.get("normalised", 0):.1f}</td><td><div class="mini-track"><div class="mini-fill" style="width:{sub_pct:.0f}%%;background:{get_color(sub_pct)}"></div></div></td></tr>'
        
        if dim_content:
            desc_paras = "".join(f'<p class="gs-para">{p}</p>' for p in dim_content["description_paragraphs"])
            band_narrative = f'<p class="gs-para">{dim_content["band_narrative"]}</p>'
            
            overuse_html = ""
            if dim_content.get("overuse_risks"):
                overuse_html = f'<div class="callout-warn"><strong>Strength Overused</strong>{dim_content["overuse_risks"]}</div>'
            
            dynamics_html = ""
            for dx in dim_content.get("cross_dynamics", []):
                dynamics_html += f'<div class="callout-dynamic"><strong>{name} × {dx["dim"]}:</strong> {dx["interaction"]}</div>'
            
            coaching_html = ""
            if dim_content.get("coaching_prompts"):
                prompts = "".join(f'<li>{p}</li>' for p in dim_content["coaching_prompts"])
                coaching_html = f'<div class="callout-info"><strong>Coaching Discussion Prompts</strong><ol>{prompts}</ol></div>'
            
            apac_html = ""
            if dim_content.get("apac_calibration"):
                apac_notes = "".join(f'<p>{note}</p>' for note in dim_content["apac_calibration"])
                apac_html = f'<div class="callout-context"><strong>APAC Cultural Calibration — {name}</strong>{apac_notes}</div>'
            
            dim_html = f"""
<div class="dim-section">
  <div class="dim-id-label">{did}</div>
  <h3 style="margin-top:0">{name}</h3>
  <div class="dim-header">
    <span class="dim-score-big" style="color:{color}">{norm:.1f}</span>
    <span class="dim-band" style="color:{color}">/ 20 · {band_label}</span>
  </div>
  {desc_paras}
  {band_narrative}
  <div class="callout"><strong>Key Insight</strong>{verdict.get('meaning', f'Score of {norm:.1f}/20 ({pct:.0f}%%) — {band_label} band.')}</div>
  <h3 class="gs-h3">Sub-Dimension Breakdown</h3>
  <table class="sub-tbl">
    <thead><tr><th>Sub-Dimension</th><th>Score</th><th>Level</th></tr></thead>
    <tbody>{sub_rows}</tbody>
  </table>
  {overuse_html}
  {dynamics_html}
  {coaching_html}
  {apac_html}
</div>"""
        else:
            if pct >= 70:
                narrative = f"Strong performance on {name}. Deployable strength with consistent evidence."
            elif pct >= 50:
                narrative = f"Moderate performance on {name}. Foundational capability exists — targeted development would strengthen consistency."
            else:
                narrative = f"{name} presents a development opportunity. Structured intervention required."
            
            if verdict_text:
                narrative += f" Verdict: <strong>{verdict_text}</strong>."
            if verdict.get("meaning"):
                narrative += f" {verdict['meaning']}"
            
            dim_html = f"""
<div class="dim-section">
  <div class="dim-id-label">{did}</div>
  <h3 style="margin-top:0">{name}</h3>
  <div class="dim-header">
    <span class="dim-score-big" style="color:{color}">{norm:.1f}</span>
    <span class="dim-band" style="color:{color}">/ 20 · {band_label}</span>
  </div>
  <p class="gs-para">{narrative}</p>
  <table class="sub-tbl">
    <thead><tr><th>Sub-Dimension</th><th>Score</th><th>Level</th></tr></thead>
    <tbody>{sub_rows}</tbody>
  </table>
</div>"""
        
        html += dim_html
    
    return html

def _build_archetype_card(archetype, dim_scores):
    return f"""
<div class="page">
<div class="sec-num">05</div>
<h2>Archetype Profile</h2>
<div class="arch-block">
  <div class="arch-eyebrow">Assigned Archetype</div>
  <div class="arch-dots">● ● ●</div>
  <div class="arch-name">{archetype.get('name','—')}</div>
  <div class="arch-sub">{archetype.get('description','')}</div>
  <div class="arch-desc">{archetype.get('interpretation','')}</div>
</div>
</div>
"""

def _build_development_priorities(dev_priorities, dim_scores):
    html = ""
    for i, p in enumerate(dev_priorities):
        dim_name = p.get("dimension", "—")
        score = p.get("score", 0)
        verdict = p.get("verdict", "")
        meaning = p.get("meaning", "")
        html += f'<div class="dev-card"><div class="dev-rank">Priority {i+1}</div><div class="dev-title">{dim_name}</div><div class="dev-score">Score: {score:.1f}/20 · {verdict} · {meaning}</div></div>'
    return f"""
<div class="page">
<div class="sec-num">06</div>
<h2>Development Priorities</h2>
<p class="gs-para">Ranked from lowest-scoring dimensions (greatest need) to highest among the bottom three.</p>
{html}
</div>
"""

def _build_apac_section(inst_name, dim_scores):
    return f"""
<div class="page">
<div class="sec-num">07</div>
<h2>APAC Context Modifier</h2>
<p class="gs-para">SHIFT assessments embed APAC leadership context in the assessment architecture. This section provides contextual interpretation for candidates operating primarily in Asia-Pacific markets.</p>
<p class="gs-para">The modifier accounts for power distance, collectivism vs. individualism, long-term vs. short-term orientation, and face/relationship norms that affect how dimensions are expressed in APAC contexts.</p>
</div>
"""

def _build_appendix(inst_name, full_name, config, composite_bands):
    dims = config["dimensions"]
    band_rows = ""
    for band in composite_bands:
        band_rows += f'<tr><td>{band["min"]}–{band["max"]}</td><td>{band["band"]}</td><td>{band["interpretation"]}</td></tr>'
    return f"""
<div class="page">
<div class="sec-num">08</div>
<h2>Appendix — Methodology</h2>
<table>
<tr><th colspan="2">Instrument Details</th></tr>
<tr><td>Instrument</td><td>{inst_name} — {full_name}</td></tr>
<tr><td>Total Items</td><td>{config["total_questions"]}</td></tr>
<tr><td>Dimensions</td><td>{len(dims)}</td></tr>
<tr><td>Scale</td><td>{config["scale"]}</td></tr>
<tr><td>Composite Range</td><td>0–100</td></tr>
</table>
<h3>Composite Score Bands</h3>
<table>
<tr><th>Range</th><th>Band</th><th>Interpretation</th></tr>
{band_rows}
</table>
</div>
"""

def _build_legal(inst_name, full_name):
    return f"""
<div class="page">
<div class="sec-num">09</div>
<h2>Legal & Disclaimers</h2>
<h3>Confidentiality Notice</h3>
<p class="gs-para">This report is confidential and intended solely for the named participant and authorised LYC Partners personnel. Unauthorised distribution is strictly prohibited.</p>
<h3>Disclaimer</h3>
<p class="gs-para">This assessment is a developmental tool. It is not predictive of future performance and should not be the sole basis for employment, promotion, or termination decisions.</p>
<h3>Data Protection</h3>
<p class="gs-para">All assessment data is processed per applicable data protection regulations. Responses are stored securely and accessible only to authorised personnel.</p>
</div>
"""

# ═══════════════════════════════════════
# Page Footer Builder
# ═══════════════════════════════════════

def _page_footer(inst_name, candidate_name):
    return f"""<div class="page-foot">
  <span>{inst_name} — {candidate_name}</span>
  <span>CONFIDENTIAL</span>
</div>"""

# ═══════════════════════════════════════
# Main Generator
# ═══════════════════════════════════════

def generate_shift_report(scored_profile, candidate_name="Participant",
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
    
    content_lib = _load_content_library(inst_name)
    if content_lib:
        print(f"  Content library loaded for {inst_name}")
    else:
        print(f"  No content library for {inst_name} — using template fallback")
    
    css = build_css(inst_name)
    gauge_svg = _build_gauge_svg(cs)
    dim_bars_html = _build_dimension_bars(dim_scores, dims)
    dim_deep_html = _build_dimension_deep_dive(dim_scores, dims, content_lib)
    archetype_html = _build_archetype_card(archetype, dim_scores)
    dev_html = _build_development_priorities(dev_priorities, dim_scores)
    apac_html = _build_apac_section(inst_name, dim_scores)
    exec_html = _build_exec_summary(inst_name, full_name, cs, band, band_interp, archetype, dim_scores, dev_priorities)
    overview_html = _build_assessment_overview(inst_name, full_name, config)
    appendix_html = _build_appendix(inst_name, full_name, config, composite_bands)
    legal_html = _build_legal(inst_name, full_name)
    
    pf = _page_footer(inst_name, candidate_name)
    
    logo_b64 = load_logo_b64()
    logo_inv_b64 = load_logo_inverted_b64()
    logo_src = logo_inv_b64 or logo_b64
    logo_html = f'<img src="{logo_src}" class="cover-logo-img" alt="LYC Partners"/>' if logo_src else '<div class="cover-logo">LYC PARTNERS</div>'
    
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

<!-- ═══ COVER ═══ -->
<div class="cover">
  <div class="cover-top">
    {logo_html}
    <div class="cover-dots">● ● ●</div>
    <div class="cover-title">{inst_name}</div>
    <div class="cover-sub">{full_name}</div>
  </div>
  <div class="cover-mid">
    <div class="cover-eyebrow">Confidential Report</div>
    <div class="cover-name">{candidate_name}</div>
    <div class="cover-date">{date}</div>
  </div>
  <div class="cover-bot">
    <div>LYC Partners<br>Shanghai · Hong Kong · Singapore<br>contact@lyc-partners.ai</div>
    <div>© 2026 LYC Partners</div>
  </div>
</div>

<!-- ═══ TOC ═══ -->
<div class="page">
  <div class="sec-num">Contents</div>
  <h2>Table of Contents</h2>
  {toc_html}
</div>
{pf}

<!-- ═══ EXEC SUMMARY ═══ -->
{exec_html}
{pf}

<!-- ═══ ASSESSMENT OVERVIEW ═══ -->
{overview_html}
{pf}

<!-- ═══ DIAGNOSTIC PROFILE ═══ -->
<div class="page">
  <div class="sec-num">03</div>
  <h2>Diagnostic Profile</h2>
  <h3>Composite Score</h3>
  <div style="text-align:center;padding:32px 0;border-top:2px solid {B['dark']};border-bottom:1px solid {B['border']};margin:16px 0">
    {gauge_svg}
    <div style="font-size:18px;font-weight:600;margin-top:12px;color:{B['dark']}">{band}</div>
    <div style="font-size:13px;color:{B['muted']};margin-top:4px">{band_interp}</div>
  </div>
  <h3>Dimension Scores</h3>
  {dim_bars_html}
</div>
{pf}

<!-- ═══ DIMENSION DEEP-DIVE ═══ -->
<div class="page">
  <div class="sec-num">04</div>
  <h2>Dimension Deep-Dive</h2>
  {dim_deep_html}
</div>
{pf}

<!-- ═══ ARCHETYPE ═══ -->
{archetype_html}
{pf}

<!-- ═══ DEVELOPMENT PRIORITIES ═══ -->
{dev_html}
{pf}

<!-- ═══ APAC CONTEXT ═══ -->
{apac_html}
{pf}

<!-- ═══ APPENDIX ═══ -->
{appendix_html}
{pf}

<!-- ═══ LEGAL ═══ -->
{legal_html}

<!-- ═══ DOCUMENT FOOTER ═══ -->
<div class="doc-foot">
  <div class="doc-foot-dots">● ● ●</div>
  <div class="doc-foot-rule"></div>
  <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:{B['muted']}">Diagnose. Design. Deliver.</div>
  <div style="font-size:11px;color:{B['muted']};margin-top:10px">© 2026 LYC Partners. All rights reserved.<br>SHIFT Diagnostic Suite is proprietary to LYC Partners.</div>
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
    
    for name in ["DRIVE", "QUEST", "IMPACT", "PRISM", "SPARK", "FORGE", "MOSAIC", "BRIDGE", "COACH"]:
        scorer = ShiftScorer(name)
        random.seed(42)
        
        responses = {}
        for dim in scorer.config["dimensions"]:
            for qid in dim["question_ids"]:
                responses[qid] = random.randint(2, 5)
        
        scored = scorer.score(responses)
        html = generate_shift_report(scored, candidate_name="Participant", instrument=name)
        
        out_path = output_dir / f"{name}_Report_v6.html"
        with open(out_path, "w") as f:
            f.write(html)
        
        print(f"✅ {name}: {out_path} ({len(html):,} bytes)")
        print(f"   Composite: {scored['composite']['score']}/100 ({scored['composite']['band']})")
        print(f"   Archetype: {scored['archetype']['name']}")
        print()
    
    print(f"All reports generated in: {output_dir}")
