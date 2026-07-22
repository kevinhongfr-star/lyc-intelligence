"""
LYC Business Document Components — Shared library for all business documents
Companion to lyc_components.py (platform reports)
Covers: A4 documents, emails, landscape presentations, letters
"""
import base64, os

# ── Brand tokens ──────────────────────────────────────────────
DARK      = "#0F1115"
LIGHT_BG  = "#FAFAFB"
WHITE     = "#FFFFFF"
FUCHSIA   = "#C108AB"
GREY_100  = "#F3F4F6"
GREY_200  = "#E5E7EB"
GREY_300  = "#D1D5DB"
GREY_400  = "#9CA3AF"
GREY_500  = "#6B7280"
GREY_600  = "#4B5563"
GREY_700  = "#374151"
DANGER    = "#DC2626"
WARNING   = "#F59E0B"
SUCCESS   = "#10B981"
INFO      = "#3B82F6"

FONT_SANS = "'DM Sans', 'Helvetica Neue', Arial, sans-serif"
FONT_SERIF = "'Libre Baskerville', Georgia, serif"

# ── Logo helper ───────────────────────────────────────────────
def _embed_logo(inverted=False):
    fname = "lyc_logo_inverted.png" if inverted else "lyc_logo.png"
    path = os.path.join(os.path.dirname(__file__), fname)
    try:
        with open(path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode()
        return f"data:image/png;base64,{b64}"
    except:
        return ""

# ── CSS for A4 Portrait documents ─────────────────────────────
def css_a4(doc_type="general"):
    return f"""
@page {{ size: A4 portrait; margin: 0; }}
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{
    font-family: {FONT_SANS};
    color: {DARK};
    background: {WHITE};
    font-size: 10.5pt;
    line-height: 1.6;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}}
.page {{
    width: 210mm; min-height: 297mm;
    padding: 18mm 20mm 22mm 20mm;
    position: relative;
    page-break-after: always;
    background: {WHITE};
}}
.page:last-child {{ page-break-after: avoid; }}

/* Header bar */
.doc-header {{
    display: flex; align-items: center; justify-content: space-between;
    padding-bottom: 10px; margin-bottom: 20px;
    border-bottom: 1px solid {GREY_200};
}}
.doc-header .logo {{ height: 28px; }}
.doc-header .title {{ font-size: 11pt; font-weight: 700; color: {DARK}; }}
.doc-header .date {{ font-size: 8.5pt; color: {GREY_500}; }}

/* Footer */
.doc-footer {{
    position: absolute; bottom: 12mm; left: 20mm; right: 20mm;
    display: flex; justify-content: space-between; align-items: center;
    font-size: 7.5pt; color: {GREY_400};
    border-top: 1px solid {GREY_200}; padding-top: 8px;
}}

/* Cover page */
.cover-page {{
    display: flex; flex-direction: column;
    justify-content: center; align-items: flex-start;
    min-height: 260mm; padding-top: 60mm;
}}
.cover-page .cover-logo {{ height: 40px; margin-bottom: 40px; }}
.cover-page h1 {{
    font-family: {FONT_SERIF}; font-size: 26pt; font-weight: 700;
    color: {DARK}; margin-bottom: 12px; line-height: 1.2;
    max-width: 450px;
}}
.cover-page .subtitle {{
    font-size: 12pt; color: {GREY_600}; margin-bottom: 30px;
}}
.cover-page .cover-meta {{
    font-size: 9pt; color: {GREY_500}; line-height: 1.8;
}}
.cover-page .cover-meta strong {{ color: {DARK}; }}
.cover-accent {{
    width: 60px; height: 3px; background: {FUCHSIA};
    margin: 20px 0;
}}

/* Typography */
h2 {{
    font-family: {FONT_SERIF}; font-size: 16pt; font-weight: 700;
    color: {DARK}; margin: 24px 0 12px 0;
}}
h3 {{
    font-size: 12pt; font-weight: 700; color: {DARK};
    margin: 18px 0 8px 0;
}}
h4 {{
    font-size: 10.5pt; font-weight: 600; color: {GREY_700};
    margin: 14px 0 6px 0;
}}
p {{ margin-bottom: 10px; color: {GREY_700}; }}
.small {{ font-size: 8.5pt; color: {GREY_500}; }}

/* Callout */
.callout {{
    border-top: 2px solid {FUCHSIA};
    padding: 12px 16px; margin: 16px 0;
    background: {GREY_100}; border-radius: 0 0 4px 4px;
    font-size: 9.5pt;
}}
.callout::before {{
    content: "●"; color: {FUCHSIA}; font-size: 8pt;
    margin-right: 8px;
}}

/* Tables */
table {{
    width: 100%; border-collapse: collapse;
    margin: 12px 0; font-size: 9.5pt;
}}
th {{
    background: {DARK}; color: {WHITE};
    padding: 8px 12px; text-align: left;
    font-weight: 600; font-size: 8.5pt;
    text-transform: uppercase; letter-spacing: 0.5px;
}}
td {{
    padding: 8px 12px; border-bottom: 1px solid {GREY_200};
    color: {GREY_700};
}}
tr:nth-child(even) td {{ background: {GREY_100}; }}

/* Status badges */
.badge {{
    display: inline-block; padding: 2px 10px;
    border-radius: 10px; font-size: 8pt; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.3px;
}}
.badge-success {{ background: #D1FAE5; color: #065F46; }}
.badge-warning {{ background: #FEF3C7; color: #92400E; }}
.badge-danger {{ background: #FEE2E2; color: #991B1B; }}
.badge-info {{ background: #DBEAFE; color: #1E40AF; }}
.badge-neutral {{ background: {GREY_200}; color: {GREY_600}; }}
.badge-fuchsia {{ background: #FCE7F3; color: #9D174D; }}

/* Stat cards */
.stat-grid {{
    display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px; margin: 16px 0;
}}
.stat-card {{
    background: {GREY_100}; border-radius: 6px;
    padding: 14px 16px; text-align: center;
}}
.stat-card .stat-value {{
    font-size: 22pt; font-weight: 700; color: {DARK};
}}
.stat-card .stat-label {{
    font-size: 8pt; color: {GREY_500}; text-transform: uppercase;
    letter-spacing: 0.5px; margin-top: 4px;
}}

/* Bullet lists */
ul.checklist {{ list-style: none; padding: 0; }}
ul.checklist li {{
    padding: 4px 0 4px 20px; position: relative;
    font-size: 9.5pt; color: {GREY_700};
}}
ul.checklist li::before {{
    content: "●"; color: {FUCHSIA}; font-size: 6pt;
    position: absolute; left: 4px; top: 8px;
}}

/* Two column */
.two-col {{
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 20px; margin: 16px 0;
}}

/* Watermarks */
.watermark-draft {{
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    font-size: 72pt; font-weight: 700;
    color: {GREY_400}; opacity: 0.15;
    pointer-events: none; z-index: 0;
}}
.watermark-confidential {{
    position: absolute; top: 10mm; right: 20mm;
    font-size: 8pt; font-weight: 600;
    color: {FUCHSIA}; text-transform: uppercase;
    letter-spacing: 1px; z-index: 10;
}}

/* Section divider */
.section-divider {{
    border: none; border-top: 1px solid {GREY_200};
    margin: 24px 0;
}}

/* Action items */
.action-table td:first-child {{ font-weight: 600; }}
.action-table .owner {{ color: {FUCHSIA}; font-weight: 600; }}
.action-table .due {{ color: {GREY_500}; font-size: 8.5pt; }}

/* Progress bar */
.progress-bar {{
    height: 6px; background: {GREY_200};
    border-radius: 3px; overflow: hidden;
    margin: 4px 0;
}}
.progress-bar .fill {{
    height: 100%; border-radius: 3px;
    background: {FUCHSIA};
}}

/* Landscape overrides */
@media (orientation: landscape) {{
    .page {{ width: 297mm; min-height: 210mm; padding: 14mm 18mm 18mm 18mm; }}
}}
.landscape-page {{
    width: 297mm; min-height: 210mm;
    padding: 14mm 18mm 18mm 18mm;
    page-break-after: always;
}}
"""

# ── CSS for Email templates (600px) ───────────────────────────
def css_email():
    return f"""
body {{
    font-family: {FONT_SANS};
    color: {DARK}; background: {GREY_100};
    font-size: 14px; line-height: 1.6;
    margin: 0; padding: 0;
}}
.email-wrapper {{
    max-width: 600px; margin: 0 auto;
    background: {WHITE};
}}
.email-header {{
    background: {DARK}; padding: 20px 24px;
    display: flex; align-items: center; justify-content: space-between;
}}
.email-header img {{ height: 24px; }}
.email-header .brand {{ color: {WHITE}; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; }}
.email-body {{ padding: 28px 24px; }}
.email-footer {{
    background: {GREY_100}; padding: 16px 24px;
    font-size: 11px; color: {GREY_500};
    border-top: 1px solid {GREY_200};
}}
h2 {{ font-family: {FONT_SERIF}; font-size: 18px; margin: 0 0 12px 0; }}
h3 {{ font-size: 14px; font-weight: 700; margin: 16px 0 8px 0; }}
.status-bar {{
    display: inline-block; padding: 4px 12px;
    border-radius: 12px; font-size: 11px; font-weight: 600;
}}
.status-on-track {{ background: #D1FAE5; color: #065F46; }}
.status-at-risk {{ background: #FEF3C7; color: #92400E; }}
.status-delayed {{ background: #FEE2E2; color: #991B1B; }}
.metric-row {{
    display: flex; gap: 12px; margin: 16px 0;
}}
.metric-box {{
    flex: 1; background: {GREY_100};
    border-radius: 6px; padding: 12px; text-align: center;
}}
.metric-box .value {{ font-size: 20px; font-weight: 700; color: {DARK}; }}
.metric-box .label {{ font-size: 10px; color: {GREY_500}; text-transform: uppercase; margin-top: 2px; }}
.action-list {{ margin: 12px 0; }}
.action-item {{
    padding: 8px 12px; margin: 4px 0;
    background: {GREY_100}; border-radius: 4px;
    font-size: 13px;
}}
.action-item .tag {{
    display: inline-block; padding: 1px 8px;
    border-radius: 8px; font-size: 10px; font-weight: 600;
    margin-right: 8px;
}}
.tag-lyc {{ background: #FCE7F3; color: #9D174D; }}
.tag-client {{ background: #DBEAFE; color: #1E40AF; }}
.fuchsia-dot {{ color: {FUCHSIA}; }}
.divider {{ border: none; border-top: 1px solid {GREY_200}; margin: 20px 0; }}
table {{ width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }}
th {{ background: {DARK}; color: {WHITE}; padding: 8px 10px; text-align: left; font-size: 11px; }}
td {{ padding: 8px 10px; border-bottom: 1px solid {GREY_200}; }}
"""

# ── Wrap A4 page ──────────────────────────────────────────────
def wrap_a4(body, title="", watermark=None, confidential=False):
    wm = ""
    if watermark == "DRAFT":
        wm = '<div class="watermark-draft">DRAFT</div>'
    conf = '<div class="watermark-confidential">CONFIDENTIAL</div>' if confidential else ""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<style>{css_a4()}</style>
</head>
<body>
<div class="page">
{conf}
{wm}
{body}
<div class="doc-footer">
    <span>LYC Partners — Confidential</span>
    <span>Page 1</span>
</div>
</div>
</body>
</html>"""

# ── Wrap multi-page A4 ────────────────────────────────────────
def wrap_a4_multi(pages_html, title="", watermark=None, confidential=False):
    wm = ""
    if watermark == "DRAFT":
        wm = '<div class="watermark-draft">DRAFT</div>'
    conf = '<div class="watermark-confidential">CONFIDENTIAL</div>' if confidential else ""
    pages = ""
    for i, pg in enumerate(pages_html):
        pages += f"""<div class="page">
{conf if i == 0 else ""}
{wm if i == 0 else ""}
{pg}
<div class="doc-footer">
    <span>LYC Partners — Confidential</span>
    <span>Page {i+1}</span>
</div>
</div>
"""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<style>{css_a4()}</style>
</head>
<body>
{pages}
</body>
</html>"""

# ── Wrap landscape page ──────────────────────────────────────
def wrap_landscape(pages_html, title=""):
    pages = ""
    for i, pg in enumerate(pages_html):
        pages += f"""<div class="landscape-page">
{pg}
<div class="doc-footer">
    <span>LYC Partners — Confidential</span>
    <span>Page {i+1}</span>
</div>
</div>
"""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<style>{css_a4()}
.landscape-page {{
    width: 297mm; min-height: 210mm;
    padding: 14mm 18mm 18mm 18mm;
    page-break-after: always;
    position: relative;
}}
</style>
</head>
<body>
{pages}
</body>
</html>"""

# ── Wrap email HTML ───────────────────────────────────────────
def wrap_email(body, subject=""):
    logo = _embed_logo(inverted=True)
    logo_tag = f'<img src="{logo}" style="height:24px">' if logo else ""
    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{subject}</title>
<style>{css_email()}</style>
</head>
<body>
<div class="email-wrapper">
<div class="email-header">
    {logo_tag}
    <span class="brand">LYC PARTNERS</span>
</div>
<div class="email-body">
{body}
</div>
<div class="email-footer">
    LYC Partners | Executive Search & Talent Advisory<br>
    This is an automated message. Please do not reply directly.
</div>
</div>
</body>
</html>"""

# ── Cover page helper ─────────────────────────────────────────
def build_cover(title, subtitle="", meta_lines=None, status=None):
    logo = _embed_logo()
    logo_tag = f'<img src="{logo}" class="cover-logo">' if logo else ""
    meta = ""
    if meta_lines:
        meta = '<div class="cover-meta">' + "<br>".join(meta_lines) + "</div>"
    status_badge = ""
    if status:
        cls = {"DRAFT": "badge-neutral", "CONFIDENTIAL": "badge-fuchsia", "FINAL": "badge-success"}.get(status, "badge-neutral")
        status_badge = f'<span class="badge {cls}" style="margin-bottom:16px">{status}</span>'
    return f"""
<div class="cover-page">
    {logo_tag}
    <div class="cover-accent"></div>
    <h1>{title}</h1>
    {f'<div class="subtitle">{subtitle}</div>' if subtitle else ''}
    {status_badge}
    {meta}
</div>
"""

# ── Doc header ────────────────────────────────────────────────
def build_doc_header(title, date=""):
    logo = _embed_logo()
    logo_tag = f'<img src="{logo}" class="logo">' if logo else ""
    return f"""
<div class="doc-header">
    {logo_tag}
    <span class="title">{title}</span>
    <span class="date">{date}</span>
</div>
"""

# ── Reusable SVG components ───────────────────────────────────
def svg_gauge(value, label="", max_val=100, color=FUCHSIA):
    pct = min(100, max(0, (value / max_val) * 100))
    angle = pct * 1.8 - 90
    return f"""
<svg width="120" height="80" viewBox="0 0 120 80">
    <path d="M 10 70 A 50 50 0 0 1 110 70" fill="none" stroke="{GREY_200}" stroke-width="8" stroke-linecap="round"/>
    <path d="M 10 70 A 50 50 0 0 1 110 70" fill="none" stroke="{color}" stroke-width="8" stroke-linecap="round"
          stroke-dasharray="{pct * 1.57} 157" />
    <text x="60" y="62" text-anchor="middle" font-size="16" font-weight="700" fill="{DARK}">{value}</text>
    <text x="60" y="76" text-anchor="middle" font-size="7" fill="{GREY_500}">{label}</text>
</svg>"""

def svg_funnel(stages, values, width=400, height=160):
    n = len(stages)
    max_v = max(values) if values else 1
    step_h = height // (n + 1)
    svg = f'<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}">'
    colors = [DARK, "#2D3748", "#4A5568", GREY_600, GREY_500, GREY_400]
    for i, (s, v) in enumerate(zip(stages, values)):
        w = int((v / max_v) * (width - 80)) if max_v > 0 else 20
        x = (width - w) // 2
        y = i * step_h + 5
        c = colors[i % len(colors)]
        svg += f'<rect x="{x}" y="{y}" width="{w}" height="{step_h - 4}" rx="3" fill="{c}" opacity="{1 - i*0.12}"/>'
        svg += f'<text x="{width//2}" y="{y + step_h//2 + 2}" text-anchor="middle" fill="white" font-size="9" font-weight="600">{s}: {v}</text>'
    svg += '</svg>'
    return svg

def svg_horizontal_bar(label, value, max_val=100, color=FUCHSIA, width=300):
    pct = min(100, (value / max_val) * 100) if max_val > 0 else 0
    return f"""
<div style="display:flex;align-items:center;gap:8px;margin:4px 0;font-size:9pt;">
    <span style="width:100px;color:{GREY_600};text-align:right;">{label}</span>
    <div style="flex:1;height:8px;background:{GREY_200};border-radius:4px;overflow:hidden;">
        <div style="width:{pct}%;height:100%;background:{color};border-radius:4px;"></div>
    </div>
    <span style="font-weight:600;width:35px;">{value}</span>
</div>"""

def svg_radar(dimensions, values, size=200, color=FUCHSIA):
    import math
    n = len(dimensions)
    cx, cy = size//2, size//2
    r = size//2 - 30
    svg = f'<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}">'
    # Grid
    for ring in [0.25, 0.5, 0.75, 1.0]:
        pts = []
        for i in range(n):
            angle = math.pi * 2 * i / n - math.pi / 2
            px = cx + r * ring * math.cos(angle)
            py = cy + r * ring * math.sin(angle)
            pts.append(f"{px},{py}")
        svg += f'<polygon points="{" ".join(pts)}" fill="none" stroke="{GREY_200}" stroke-width="0.5"/>'
    # Data
    pts = []
    for i, (dim, val) in enumerate(zip(dimensions, values)):
        angle = math.pi * 2 * i / n - math.pi / 2
        px = cx + r * (val / 100) * math.cos(angle)
        py = cy + r * (val / 100) * math.sin(angle)
        pts.append(f"{px},{py}")
    svg += f'<polygon points="{" ".join(pts)}" fill="{color}" fill-opacity="0.15" stroke="{color}" stroke-width="1.5"/>'
    # Labels
    for i, dim in enumerate(dimensions):
        angle = math.pi * 2 * i / n - math.pi / 2
        px = cx + (r + 18) * math.cos(angle)
        py = cy + (r + 18) * math.sin(angle)
        anchor = "middle"
        svg += f'<text x="{px}" y="{py}" text-anchor="{anchor}" font-size="7" fill="{GREY_600}">{dim}</text>'
    svg += '</svg>'
    return svg

def svg_heatmap(headers, rows, data, cell_fn=None):
    """Heatmap table with color-coded cells. cell_fn(value) -> color"""
    if not cell_fn:
        def cell_fn(v):
            if v >= 80: return f"background:#D1FAE5;color:#065F46"
            elif v >= 60: return f"background:#DBEAFE;color:#1E40AF"
            elif v >= 40: return f"background:#FEF3C7;color:#92400E"
            else: return f"background:#FEE2E2;color:#991B1B"
    html = '<table><thead><tr><th></th>'
    for h in headers:
        html += f'<th style="text-align:center">{h}</th>'
    html += '</tr></thead><tbody>'
    for row, vals in zip(rows, data):
        html += f'<tr><td style="font-weight:600">{row}</td>'
        for v in vals:
            style = cell_fn(v)
            html += f'<td style="{style};text-align:center;font-weight:600">{v}</td>'
        html += '</tr>'
    html += '</tbody></table>'
    return html

def build_timeline_table(milestones):
    """Build a simple timeline table from list of {phase, date, status}"""
    html = '<table><thead><tr><th>Phase</th><th>Target Date</th><th>Status</th></tr></thead><tbody>'
    for m in milestones:
        status = m.get("status", "planned")
        badge_cls = {"completed": "badge-success", "in_progress": "badge-info",
                     "at_risk": "badge-warning", "planned": "badge-neutral"}.get(status, "badge-neutral")
        html += f'<tr><td>{m["phase"]}</td><td>{m.get("date","")}</td>'
        html += f'<td><span class="badge {badge_cls}">{status.replace("_"," ").title()}</span></td></tr>'
    html += '</tbody></table>'
    return html

def build_action_table(actions):
    """Build action items table from list of {action, owner, due, status}"""
    html = '<table class="action-table"><thead><tr><th>Action</th><th>Owner</th><th>Due</th><th>Status</th></tr></thead><tbody>'
    for a in actions:
        status = a.get("status", "open")
        badge_cls = {"done": "badge-success", "open": "badge-info", "overdue": "badge-danger"}.get(status, "badge-neutral")
        html += f'<tr><td>{a["action"]}</td><td class="owner">{a.get("owner","")}</td>'
        html += f'<td class="due">{a.get("due","")}</td>'
        html += f'<td><span class="badge {badge_cls}">{status.title()}</span></td></tr>'
    html += '</tbody></table>'
    return html

def build_stat_cards(stats):
    """Build stat cards from list of {value, label}"""
    html = '<div class="stat-grid">'
    for s in stats:
        html += f'<div class="stat-card"><div class="stat-value">{s["value"]}</div><div class="stat-label">{s["label"]}</div></div>'
    html += '</div>'
    return html

def build_callout(text, style="default"):
    """Callout box - top rule with fuchsia dot"""
    return f'<div class="callout">{text}</div>'

def build_bullet_list(items):
    html = '<ul class="checklist">'
    for item in items:
        html += f'<li>{item}</li>'
    html += '</ul>'
    return html

def build_signature_block(name, title="", date="", company="LYC Partners"):
    return f"""
<div style="margin:24px 0;padding:16px 0;border-top:1px solid {GREY_200}">
    <div style="width:200px;border-bottom:1px solid {DARK};margin-bottom:6px;padding-bottom:30px"></div>
    <div style="font-weight:600;font-size:10pt">{name}</div>
    <div style="font-size:8.5pt;color:{GREY_500}">{title}</div>
    <div style="font-size:8.5pt;color:{GREY_500}">{company}</div>
    <div style="font-size:8.5pt;color:{GREY_500}">{date}</div>
</div>
"""
