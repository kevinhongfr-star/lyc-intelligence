"""L10: Communication Templates — D46 through D50"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from lyc_business_components import *

# D46: Weekly Mandate Digest (already covered by D26 status update)
D46_DATA = {
    "email_meta": {"mandate_id": "MND-2026-0042", "role_title": "Chief Technology Officer", "week": 6, "recipient": "Sarah Chen", "date": "2026-08-29"},
    "pipeline_snapshot": {"stage_counts": {"sourced": 45, "contacted": 22, "screened": 12, "interviewed": 3, "shortlisted": 5},
                          "new_this_week": {"sourced": 8, "contacted": 5, "screened": 3}, "status": "on_track"},
    "highlights": ["2 exceptional candidates from ByteDance identified", "First-round interviews scheduled for next week", "Market mapping 100% complete"],
    "next_steps": ["Conduct 3 first-round client interviews", "Finalize top-3 recommendation shortlist", "Begin reference checks for leading candidates"],
    "decisions_needed": ["Confirm interview panel for Round 1"]
}

def gen_weekly_digest(d):
    em = d["email_meta"]; ps = d["pipeline_snapshot"]
    body = f'<p>Dear {em["recipient"]},</p>'
    body += f'<p>Week {em["week"]} update for the <strong>{em["role_title"]}</strong> search.</p>'
    status_cls = "status-on-track" if ps["status"] == "on_track" else "status-at-risk"
    body += f'<p>Status: <span class="status-bar {status_cls}">{ps["status"].replace("_"," ").upper()}</span></p>'
    body += '<div class="metric-row">'
    for label, key in [("Sourced","sourced"),("Contacted","contacted"),("Screened","screened"),("Shortlisted","shortlisted")]:
        body += f'<div class="metric-box"><div class="value">{ps["stage_counts"][key]}</div><div class="label">{label}</div></div>'
    body += '</div>'
    nw = ps["new_this_week"]
    body += f'<p class=small>New this week: +{nw["sourced"]} sourced, +{nw["contacted"]} contacted, +{nw["screened"]} screened</p>'
    body += '<h3>Highlights</h3><ul>' + ''.join(f'<li>{h}</li>' for h in d["highlights"]) + '</ul>'
    body += '<h3>Next Steps</h3><ul>' + ''.join(f'<li>{s}</li>' for s in d["next_steps"]) + '</ul>'
    if d.get("decisions_needed"):
        body += '<div class="action-item"><strong>Action Required:</strong> ' + "; ".join(d["decisions_needed"]) + '</div>'
    body += '<hr class="divider"><p class=small>LYC Partners | Weekly Digest (Automated)</p>'
    return wrap_email(body, subject=f"[LYC] Week {em['week']} Digest — {em['role_title']}")

# D47: Pipeline Status Update Email
D47_DATA = {
    "email_meta": {"mandate_id": "MND-2026-0042", "role_title": "Chief Technology Officer", "recipient": "Sarah Chen", "trigger": "milestone_reached"},
    "pipeline_snapshot": {"stage_counts": {"sourced": 45, "contacted": 20, "screened": 8, "interviewed": 4, "shortlisted": 3},
                          "key_milestone": "Shortlist delivered — 3 candidates recommended", "status": "milestone"},
    "highlights": ["Shortlist of 3 exceptional candidates delivered", "All 3 candidates have LEAP scores above 75th percentile", "Compensation expectations within approved budget"],
    "next_steps": ["Review shortlist presentation deck", "Schedule interviews with top candidates", "Provide feedback within 5 business days"]
}

def gen_pipeline_update(d):
    em = d["email_meta"]; ps = d["pipeline_snapshot"]
    body = f'<p>Dear {em["recipient"]},</p>'
    body += f'<p><strong>Milestone reached:</strong> {ps["key_milestone"]}</p>'
    body += '<div class="metric-row">'
    for label, key in [("Sourced","sourced"),("Contacted","contacted"),("Screened","screened"),("Interviewed","interviewed"),("Shortlisted","shortlisted")]:
        body += f'<div class="metric-box"><div class="value">{ps["stage_counts"][key]}</div><div class="label">{label}</div></div>'
    body += '</div>'
    body += '<h3>Key Highlights</h3><ul>' + ''.join(f'<li>{h}</li>' for h in d["highlights"]) + '</ul>'
    body += '<h3>Next Steps</h3><ul>' + ''.join(f'<li>{s}</li>' for s in d["next_steps"]) + '</ul>'
    body += '<hr class="divider"><p class=small>LYC Partners | Pipeline Update</p>'
    return wrap_email(body, subject=f"[LYC] Milestone: {ps['key_milestone'][:50]}")

# D48: Assessment Completion Alert
D48_DATA = {
    "email_meta": {"mandate_id": "MND-2026-0042", "candidate_name": "Alex Wang", "instrument": "LEAP", "date": "2026-08-20", "recipient": "Kevin Hong"},
    "score_summary": {"overall_percentile": 88, "top_dimensions": {"Strategic Vision": 88, "Stakeholder Influence": 85}, "flag_dimensions": {}, "status": "strong"},
    "recommendation": "Strong candidate — proceed to next stage"
}

def gen_assessment_alert(d):
    em = d["email_meta"]; ss = d["score_summary"]
    body = f'<p>New assessment completed for <strong>{em["candidate_name"]}</strong> ({em["instrument"]}).</p>'
    body += '<div class="metric-row">'
    body += f'<div class="metric-box"><div class="value">{ss["overall_percentile"]}th</div><div class="label">Percentile</div></div>'
    for dim, score in ss["top_dimensions"].items():
        body += f'<div class="metric-box"><div class="value">{score}</div><div class="label">{dim}</div></div>'
    body += '</div>'
    body += f'<p><strong>Recommendation:</strong> {d["recommendation"]}</p>'
    body += '<hr class="divider"><p class=small>LYC Partners | Assessment Alert (Automated)</p>'
    return wrap_email(body, subject=f"[LYC] Assessment Complete — {em['candidate_name']} ({ss['overall_percentile']}th %ile)")

# D49: Market Briefing Email
D49_DATA = {
    "email_meta": {"period": "August 2026", "industry": "Technology", "recipient": "Clients", "date": "2026-08-31"},
    "market_insights": [
        {"topic": "CTO Talent Market", "finding": "Demand for CTO-level talent in China tech sector up 25% YoY. Supply remains constrained.", "implication": "Expect longer search timelines and higher compensation expectations."},
        {"topic": "Compensation Trends", "finding": "Average CTO total compensation in Shanghai increased 15% to ¥3.1M.", "implication": "Budget planning should account for continued upward pressure."},
        {"topic": "Remote Work Impact", "finding": "60% of tech executives now prefer hybrid arrangements. APAC-wide scope roles attract 3x more candidates.", "implication": "Offering APAC scope significantly expands talent pool."}
    ],
    "data_points": [{"label": "CTO Demand Growth", "value": "+25%", "change": "up"}, {"label": "Avg Total Comp (Shanghai)", "value": "¥3.1M", "change": "up"}, {"label": "Avg Time-to-Fill", "value": "11.2w", "change": "up"}, {"label": "Hybrid Preference", "value": "60%", "change": "new"}]
}

def gen_market_briefing(d):
    em = d["email_meta"]
    body = f'<p>Dear {em["recipient"]},</p>'
    body += f'<p>Here is the <strong>{em["industry"]}</strong> market briefing for <strong>{em["period"]}</strong>.</p>'
    body += '<div class="metric-row">'
    for dp in d["data_points"]:
        body += f'<div class="metric-box"><div class="value">{dp["value"]}</div><div class="label">{dp["label"]}</div></div>'
    body += '</div>'
    body += '<h3>Key Insights</h3>'
    for mi in d["market_insights"]:
        body += f'<div style="background:{GREY_100};border-radius:6px;padding:12px;margin:8px 0">'
        body += f'<strong>{mi["topic"]}</strong><br>{mi["finding"]}<br><span class=small><em>Implication: {mi["implication"]}</em></span></div>'
    body += '<hr class="divider"><p class=small>LYC Partners | Market Intelligence (Periodic)</p>'
    return wrap_email(body, subject=f"[LYC] {em['industry']} Market Briefing — {em['period']}")

# D50: QBR Summary Email
D50_DATA = {
    "email_meta": {"quarter": "Q3 2026", "client_name": "Apex Technologies", "date": "2026-10-01", "consultant_name": "Kevin Hong"},
    "quarter_highlights": {"total_revenue": 4200000, "placements": 8, "active_mandates": 12, "client_satisfaction": 4.6, "avg_time_to_fill": 9.5},
    "key_achievements": ["CTO placement at Apex Technologies (10-week fill time)", "3 new retained mandates signed in technology vertical", "Client satisfaction score up from 4.2 to 4.6"],
    "metrics_vs_target": {"revenue_achievement_pct": 105, "placement_target_pct": 100, "nps_score": 72},
    "next_quarter_focus": ["Close 3 P0 mandates in pipeline", "Launch assessment platform v2", "Expand technology practice team with 2 senior hires"]
}

def gen_qbr_summary(d):
    em = d["email_meta"]; qh = d["quarter_highlights"]
    body = f'<p>Dear {em["client_name"]} team,</p>'
    body += f'<p>Here is your <strong>{em["quarter"]}</strong> Quarterly Business Review summary.</p>'
    body += '<div class="metric-row">'
    body += f'<div class="metric-box"><div class="value">¥{qh["total_revenue"]/1e6:.1f}M</div><div class="label">Revenue</div></div>'
    body += f'<div class="metric-box"><div class="value">{qh["placements"]}</div><div class="label">Placements</div></div>'
    body += f'<div class="metric-box"><div class="value">{qh["client_satisfaction"]}/5</div><div class="label">Satisfaction</div></div>'
    body += f'<div class="metric-box"><div class="value">{qh["avg_time_to_fill"]}w</div><div class="label">Avg Fill Time</div></div>'
    body += '</div>'
    mt = d["metrics_vs_target"]
    body += f'<p>Revenue achievement: <strong>{mt["revenue_achievement_pct"]}%</strong> of target | NPS: <strong>{mt["nps_score"]}</strong></p>'
    body += '<h3>Key Achievements</h3><ul>' + ''.join(f'<li>{a}</li>' for a in d["key_achievements"]) + '</ul>'
    body += '<h3>Next Quarter Focus</h3><ul>' + ''.join(f'<li>{f}</li>' for f in d["next_quarter_focus"]) + '</ul>'
    body += f'<hr class="divider"><p class=small>{em["consultant_name"]}<br>LYC Partners | QBR Summary</p>'
    return wrap_email(body, subject=f"[LYC] QBR Summary — {em['quarter']}")


def generate_all(output_dir="business_docs"):
    os.makedirs(output_dir, exist_ok=True)
    docs = [
        ("D46_Weekly_Digest", gen_weekly_digest, D46_DATA),
        ("D47_Pipeline_Update", gen_pipeline_update, D47_DATA),
        ("D48_Assessment_Alert", gen_assessment_alert, D48_DATA),
        ("D49_Market_Briefing", gen_market_briefing, D49_DATA),
        ("D50_QBR_Summary", gen_qbr_summary, D50_DATA),
    ]
    for name, fn, data in docs:
        html = fn(data)
        path = os.path.join(output_dir, f"{name}.html")
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"  {name}: {len(html)//1024}KB")
    return len(docs)

if __name__ == "__main__":
    print("L10: Communication Templates")
    n = generate_all()
    print(f"  {n} documents generated.")
