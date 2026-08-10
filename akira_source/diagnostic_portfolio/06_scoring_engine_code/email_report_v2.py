#!/usr/bin/env python3
"""LYC Partners — Email Report Generator v2 (Group 9)
10 email template types following the design spec.
600px width, inline CSS, DM Sans only, table layout for email compatibility."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from lyc_components import *
from lyc_components import _embed_logo

OUTPUT_DIR = Path(__file__).parent / "email_reports"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def email_css():
    return f"""
    body {{ font-family: 'DM Sans', 'Noto Sans', sans-serif; margin: 0; padding: 0; background: #f4f4f4; }}
    .email-wrap {{ max-width: 600px; margin: 0 auto; background: {B['white']}; }}
    .email-header {{ background: {B['dark']}; padding: 16px 24px; text-align: center; }}
    .email-header img {{ height: 32px; }}
    .email-body {{ padding: 24px; }}
    .email-footer {{ background: {B['grey_100']}; padding: 16px 24px; text-align: center; font-size: 7pt; color: {B['muted']}; }}
    .metric-row {{ display: flex; gap: 8px; margin: 16px 0; }}
    .metric-box {{ flex: 1; background: {B['grey_100']}; border-radius: 6px; padding: 12px; text-align: center; }}
    .metric-box .val {{ font-size: 18pt; font-weight: 700; color: {B['dark']}; }}
    .metric-box .lbl {{ font-size: 7pt; color: {B['muted']}; text-transform: uppercase; }}
    .metric-box .delta {{ font-size: 8pt; }}
    .status-line {{ display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid {B['border_light']}; }}
    .status-line .name {{ flex: 1; font-size: 9pt; }}
    .status-line .bar {{ flex: 2; }}
    .status-line .badge {{ flex: 0 0 70px; text-align: right; font-size: 8pt; font-weight: 600; }}
    """

def email_wrap(body, subject=""):
    logo = _embed_logo(True)
    return f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>{subject}</title><style>{email_css()}</style></head>
<body>
<div class="email-wrap">
    <div class="email-header"><img src="{logo}" alt="LYC Partners"/></div>
    <div class="email-body">{body}</div>
    <div class="email-footer">
        LYC Partners | Shanghai<br/>
        <a href="#" style="color:{B['fuchsia']}">Unsubscribe</a> | <a href="#" style="color:{B['fuchsia']}">Privacy Policy</a>
    </div>
</div>
</body></html>"""

def cta_button(text="View Full Dashboard", url="#"):
    return f'<div style="text-align:center;margin:20px 0"><a href="{url}" style="display:inline-block;background:{B["fuchsia"]};color:{B["white"]};padding:12px 28px;border-radius:6px;font-weight:600;text-decoration:none;font-size:10pt">{text}</a></div>'

def status_line(name, progress_pct, status, color=None):
    c = color or (B["success"] if "track" in status.lower() or "filled" in status.lower() else B["danger"] if "risk" in status.lower() else B["fuchsia"])
    return f'''<div class="status-line">
        <div class="name">{name}</div>
        <div class="bar"><div style="background:{B['grey_300']};border-radius:4px;height:6px"><div style="background:{c};height:6px;border-radius:4px;width:{progress_pct}%"></div></div></div>
        <div class="badge" style="color:{c}">{status}</div>
    </div>'''

# ═══════════════════════════════════════
# 10 Email Templates
# ═══════════════════════════════════════

def gen_weekly_digest():
    body = f"""
    <p>Hi <strong>Kevin</strong>,</p>
    <p>Here's your weekly mandate update for <strong>TechCorp Asia</strong>.</p>
    <div class="metric-row">
        <div class="metric-box"><div class="val">5</div><div class="lbl">Active Mandates</div><div class="delta" style="color:{B['success']}">+1</div></div>
        <div class="metric-box"><div class="val">42</div><div class="lbl">In Pipeline</div><div class="delta" style="color:{B['success']}">+8</div></div>
        <div class="metric-box"><div class="val">34d</div><div class="lbl">Avg Time/Fill</div><div class="delta" style="color:{B['success']}">-3d</div></div>
        <div class="metric-box"><div class="val">92%</div><div class="lbl">SLA Compliance</div><div class="delta" style="color:{B['success']}">+5%</div></div>
    </div>
    <h3 style="font-size:11pt;margin:16px 0 8px">Mandate Status</h3>
    {status_line("VP Engineering", 75, "On Track")}
    {status_line("CMO Search", 40, "At Risk", B["danger"])}
    {status_line("Head of Product", 95, "Filled", B["success"])}
    {status_line("Data Science Dir", 25, "Active", B["fuchsia"])}
    {cta_button("View Full Dashboard")}
    """
    return email_wrap(body, "Weekly Mandate Digest")

def gen_pipeline_update():
    body = f"""
    <p>Pipeline milestone update for <strong>VP Engineering</strong>.</p>
    <div class="metric-row">
        <div class="metric-box"><div class="val">12</div><div class="lbl">Shortlisted</div></div>
        <div class="metric-box"><div class="val">6</div><div class="lbl">Interviewed</div></div>
        <div class="metric-box"><div class="val">2</div><div class="lbl">Offers</div></div>
    </div>
    <p><strong>Stage Change:</strong> Candidate A moved from Shortlist → Interview (completed Round 1)</p>
    <p><strong>Alert:</strong> CMO pipeline has been stalled at Screening for 12 days</p>
    {cta_button("View Pipeline")}
    """
    return email_wrap(body, "Pipeline Status Update")

def gen_assessment_alert():
    body = f"""
    <p><strong>Assessment Completed</strong></p>
    <div class="metric-row">
        <div class="metric-box"><div class="val" style="color:{B['fuchsia']}">72</div><div class="lbl">Composite Score</div></div>
        <div class="metric-box"><div class="val">84th</div><div class="lbl">Percentile</div></div>
        <div class="metric-box"><div class="val" style="color:{B['success']}">Strong</div><div class="lbl">Match Tier</div></div>
    </div>
    <p><strong>Candidate:</strong> Alex Chen<br/><strong>Instrument:</strong> LEAP<br/><strong>Role:</strong> VP Engineering</p>
    <p>Top strengths: Steadiness (82), Dominance (78)</p>
    <p>Development area: Conscientiousness (45)</p>
    {cta_button("View Full Report")}
    """
    return email_wrap(body, "Assessment Completion Alert")

def gen_shortlist_notification():
    body = f"""
    <p>Your shortlist for <strong>VP Engineering</strong> is ready.</p>
    <div class="metric-row">
        <div class="metric-box"><div class="val">5</div><div class="lbl">Candidates</div></div>
        <div class="metric-box"><div class="val">2</div><div class="lbl">Strong Match</div></div>
        <div class="metric-box"><div class="val">92</div><div class="lbl">Top Score</div></div>
    </div>
    <table style="width:100%;font-size:9pt;border-collapse:collapse">
        <tr style="background:{B['dark']};color:white"><th style="padding:6px">#</th><th style="padding:6px">Name</th><th style="padding:6px">Score</th><th style="padding:6px">Tier</th></tr>
        <tr><td style="padding:6px;border-bottom:1px solid {B['border']}">1</td><td style="padding:6px;border-bottom:1px solid {B['border']}">Alex Chen</td><td style="padding:6px;border-bottom:1px solid {B['border']};color:{B['fuchsia']};font-weight:700">92</td><td style="padding:6px;border-bottom:1px solid {B['border']}">Strong</td></tr>
        <tr style="background:{B['grey_100']}"><td style="padding:6px;border-bottom:1px solid {B['border']}">2</td><td style="padding:6px;border-bottom:1px solid {B['border']}">Maria Rodriguez</td><td style="padding:6px;border-bottom:1px solid {B['border']};color:{B['fuchsia']};font-weight:700">87</td><td style="padding:6px;border-bottom:1px solid {B['border']}">Strong</td></tr>
        <tr><td style="padding:6px;border-bottom:1px solid {B['border']}">3</td><td style="padding:6px;border-bottom:1px solid {B['border']}">James Park</td><td style="padding:6px;border-bottom:1px solid {B['border']};font-weight:700">82</td><td style="padding:6px;border-bottom:1px solid {B['border']}">Strong</td></tr>
    </table>
    {cta_button("Review Full Shortlist")}
    """
    return email_wrap(body, "Shortlist Ready for Review")

def gen_interview_feedback():
    body = f"""
    <p>All interview feedback has been collected for <strong>VP Engineering</strong> candidates.</p>
    <div class="metric-row">
        <div class="metric-box"><div class="val">3</div><div class="lbl">Candidates</div></div>
        <div class="metric-box"><div class="val">4.2</div><div class="lbl">Avg Rating</div></div>
        <div class="metric-box"><div class="val">9</div><div class="lbl">Interviews Done</div></div>
    </div>
    <table style="width:100%;font-size:9pt;border-collapse:collapse">
        <tr style="background:{B['dark']};color:white"><th style="padding:6px">Candidate</th><th style="padding:6px">Technical</th><th style="padding:6px">Leadership</th><th style="padding:6px">Culture</th><th style="padding:6px">Overall</th></tr>
        <tr><td style="padding:6px;border-bottom:1px solid {B['border']}">Alex Chen</td><td style="padding:6px;border-bottom:1px solid {B['border']}">4.5</td><td style="padding:6px;border-bottom:1px solid {B['border']}">4.0</td><td style="padding:6px;border-bottom:1px solid {B['border']}">4.3</td><td style="padding:6px;border-bottom:1px solid {B['border']};font-weight:700;color:{B['fuchsia']}">4.3</td></tr>
        <tr style="background:{B['grey_100']}"><td style="padding:6px;border-bottom:1px solid {B['border']}">Maria Rodriguez</td><td style="padding:6px;border-bottom:1px solid {B['border']}">4.0</td><td style="padding:6px;border-bottom:1px solid {B['border']}">4.5</td><td style="padding:6px;border-bottom:1px solid {B['border']}">3.8</td><td style="padding:6px;border-bottom:1px solid {B['border']};font-weight:700">4.1</td></tr>
        <tr><td style="padding:6px;border-bottom:1px solid {B['border']}">James Park</td><td style="padding:6px;border-bottom:1px solid {B['border']}">4.8</td><td style="padding:6px;border-bottom:1px solid {B['border']}">3.5</td><td style="padding:6px;border-bottom:1px solid {B['border']}">4.0</td><td style="padding:6px;border-bottom:1px solid {B['border']};font-weight:700">4.1</td></tr>
    </table>
    <p><strong>Theme:</strong> All candidates rated highly on technical depth. Leadership style differentiation is key.</p>
    {cta_button("View Detailed Feedback")}
    """
    return email_wrap(body, "Interview Feedback Summary")

def gen_market_briefing():
    body = f"""
    <p><strong>Weekly Market Briefing — APAC Tech</strong></p>
    <div class="metric-row">
        <div class="metric-box"><div class="val" style="color:{B['danger']}">Tight</div><div class="lbl">Talent Market</div></div>
        <div class="metric-box"><div class="val">+8%</div><div class="lbl">Comp Trend YoY</div></div>
        <div class="metric-box"><div class="val">3</div><div class="lbl">Active Competitors</div></div>
    </div>
    <p><strong>Key Signal:</strong> Engineering talent in APAC remains constrained. VP+ candidates commanding 15-20% premium over Q2. Passive candidate engagement is the primary sourcing channel.</p>
    <p><strong>Competitor Moves:</strong> ByteDance (+12 eng roles), Alibaba Cloud (new APAC hub), Tencent (VP-level hiring spree)</p>
    {cta_button("View Full Market Report")}
    """
    return email_wrap(body, "Market Briefing")

def gen_consultant_digest():
    body = f"""
    <p><strong>Monthly Consultant Performance Digest</strong></p>
    <div class="metric-row">
        <div class="metric-box"><div class="val">8</div><div class="lbl">Active Mandates</div></div>
        <div class="metric-box"><div class="val">3</div><div class="lbl">Filled This Month</div></div>
        <div class="metric-box"><div class="val">91%</div><div class="lbl">SLA Compliance</div></div>
        <div class="metric-box"><div class="val">4.6</div><div class="lbl">Client NPS</div></div>
    </div>
    <table style="width:100%;font-size:9pt;border-collapse:collapse">
        <tr style="background:{B['dark']};color:white"><th style="padding:6px">Consultant</th><th style="padding:6px">Mandates</th><th style="padding:6px">Fill Rate</th><th style="padding:6px">NPS</th></tr>
        <tr><td style="padding:6px;border-bottom:1px solid {B['border']}">Sarah Wong</td><td style="padding:6px;border-bottom:1px solid {B['border']}">3</td><td style="padding:6px;border-bottom:1px solid {B['border']};color:{B['success']}">100%</td><td style="padding:6px;border-bottom:1px solid {B['border']}">4.8</td></tr>
        <tr style="background:{B['grey_100']}"><td style="padding:6px;border-bottom:1px solid {B['border']}">James Liu</td><td style="padding:6px;border-bottom:1px solid {B['border']}">3</td><td style="padding:6px;border-bottom:1px solid {B['border']}">67%</td><td style="padding:6px;border-bottom:1px solid {B['border']}">4.5</td></tr>
        <tr><td style="padding:6px;border-bottom:1px solid {B['border']}">Emily Zhang</td><td style="padding:6px;border-bottom:1px solid {B['border']}">2</td><td style="padding:6px;border-bottom:1px solid {B['border']}">50%</td><td style="padding:6px;border-bottom:1px solid {B['border']}">4.2</td></tr>
    </table>
    {cta_button("View Full Dashboard")}
    """
    return email_wrap(body, "Consultant Performance Digest")

def gen_client_activity():
    body = f"""
    <p><strong>Client Activity Digest — Week 30</strong></p>
    <div class="metric-row">
        <div class="metric-box"><div class="val">28</div><div class="lbl">Portal Logins</div></div>
        <div class="metric-box"><div class="val">12</div><div class="lbl">Reports Viewed</div></div>
        <div class="metric-box"><div class="val">5</div><div class="lbl">Candidates Reviewed</div></div>
        <div class="metric-box"><div class="val">3</div><div class="lbl">Feedback Submitted</div></div>
    </div>
    <p><strong>Engagement Trend:</strong> Portal activity up 15% vs. prior week. Peak usage: Tuesday 10-11am.</p>
    <p><strong>Top Viewed:</strong> LEAP Assessment Reports (4 views), Shortlist (3 views)</p>
    {cta_button("View Engagement Dashboard")}
    """
    return email_wrap(body, "Client Activity Digest")

def gen_sla_alert():
    body = f"""
    <p style="color:{B['danger']};font-weight:700;font-size:12pt">SLA Threshold Breach Alert</p>
    <div class="metric-row">
        <div class="metric-box" style="background:#FEF2F2"><div class="val" style="color:{B['danger']}">2</div><div class="lbl">Breached SLAs</div></div>
        <div class="metric-box"><div class="val">85%</div><div class="lbl">Overall Compliance</div></div>
    </div>
    <table style="width:100%;font-size:9pt;border-collapse:collapse">
        <tr style="background:{B['danger']};color:white"><th style="padding:6px">Mandate</th><th style="padding:6px">Milestone</th><th style="padding:6px">Target</th><th style="padding:6px">Overdue By</th></tr>
        <tr><td style="padding:6px;border-bottom:1px solid {B['border']}">CMO Search</td><td style="padding:6px;border-bottom:1px solid {B['border']}">Shortlist delivery</td><td style="padding:6px;border-bottom:1px solid {B['border']}">Jul 15</td><td style="padding:6px;border-bottom:1px solid {B['border']};color:{B['danger']};font-weight:700">+7 days</td></tr>
        <tr style="background:{B['grey_100']}"><td style="padding:6px;border-bottom:1px solid {B['border']}">CTO Search</td><td style="padding:6px;border-bottom:1px solid {B['border']}">First interviews</td><td style="padding:6px;border-bottom:1px solid {B['border']}">Jul 18</td><td style="padding:6px;border-bottom:1px solid {B['border']};color:{B['danger']};font-weight:700">+4 days</td></tr>
    </table>
    <p>Immediate action required. Escalation recommended if not resolved within 48 hours.</p>
    {cta_button("View SLA Dashboard", "#")}
    """
    return email_wrap(body, "SLA Alert")

def gen_qbr_summary():
    body = f"""
    <p><strong>Q3 2026 Summary — TechCorp Asia</strong></p>
    <div class="metric-row">
        <div class="metric-box"><div class="val">$450K</div><div class="lbl">Revenue</div><div class="delta" style="color:{B['danger']}">-10% vs target</div></div>
        <div class="metric-box"><div class="val">12</div><div class="lbl">Placements</div><div class="delta" style="color:{B['danger']}">-20% vs target</div></div>
        <div class="metric-box"><div class="val">34d</div><div class="lbl">Time/Fill</div><div class="delta" style="color:{B['success']}">-19% vs benchmark</div></div>
    </div>
    <div class="metric-row">
        <div class="metric-box"><div class="val">82</div><div class="lbl">Quality of Hire</div><div class="delta" style="color:{B['success']}">+9%</div></div>
        <div class="metric-box"><div class="val">91%</div><div class="lbl">Retention 12M</div><div class="delta" style="color:{B['success']}">+6%</div></div>
        <div class="metric-box"><div class="val">72</div><div class="lbl">NPS</div><div class="delta" style="color:{B['success']}">+12</div></div>
    </div>
    <p><strong>Key Wins:</strong> Quality of hire and retention metrics significantly above benchmark. Time-to-fill improved 19%.</p>
    <p><strong>Focus Areas:</strong> Revenue and placement volume below target — pipeline acceleration needed in Q4.</p>
    {cta_button("View Full QBR")}
    """
    return email_wrap(body, "QBR Summary")

# ═══════════════════════════════════════
EMAIL_TEMPLATES = [
    ("Weekly_Mandate_Digest", gen_weekly_digest),
    ("Pipeline_Status_Update", gen_pipeline_update),
    ("Assessment_Completion_Alert", gen_assessment_alert),
    ("Shortlist_Notification", gen_shortlist_notification),
    ("Interview_Feedback_Summary", gen_interview_feedback),
    ("Market_Briefing", gen_market_briefing),
    ("Consultant_Performance_Digest", gen_consultant_digest),
    ("Client_Activity_Digest", gen_client_activity),
    ("SLA_Alert", gen_sla_alert),
    ("QBR_Summary", gen_qbr_summary),
]

def main():
    generated = []
    for name, fn in EMAIL_TEMPLATES:
        html = fn()
        fname = f"{name}.html"
        out = OUTPUT_DIR / fname
        out.write_text(html, encoding="utf-8")
        generated.append(fname)
        print(f"  {fname} ({out.stat().st_size // 1024}KB)")
    print(f"\nGenerated {len(generated)} email templates")

if __name__ == "__main__":
    main()
