"""L8+L9: Assessment & Development + Internal Operations — D36 through D45"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from lyc_business_components import *

D36_DATA = {
    "bundle_meta": {"candidate_name": "Alex Wang", "role_title": "Chief Technology Officer", "mandate_id": "MND-2026-0042", "date": "2026-09-01", "instruments_used": ["LEAP", "DRIVE"]},
    "executive_summary": "Alex demonstrates an exceptional strategic leadership profile with outstanding scores in vision, stakeholder influence, and engineering leadership. DRIVE assessment confirms strong achievement motivation and adaptability. Overall, Alex is a top-tier candidate for the CTO role.",
    "instrument_reports": [
        {"instrument": "LEAP", "key_scores": {"Strategic Vision": 88, "Engineering Leadership": 82, "Technical Depth": 79, "Stakeholder Influence": 85, "Talent Development": 74},
         "interpretation": "Alex scores in the 88th percentile overall, with exceptional strategic vision and strong stakeholder influence. Engineering leadership is solid at 82nd percentile.",
         "implications_for_role": "Well-suited for board-level technology leadership. May need support in hands-on talent development initially."},
        {"instrument": "DRIVE", "key_scores": {"Achievement Motivation": 91, "Adaptability": 84, "Resilience": 87, "Collaboration": 78, "Innovation": 83},
         "interpretation": "Very high achievement motivation (91st percentile) with strong resilience and adaptability. Collaboration score is solid but could develop further.",
         "implications_for_role": "Will drive results aggressively. Ensure collaborative leadership style is reinforced during onboarding."}
    ],
    "integrated_analysis": {"overall_profile": "Strategic technology leader with exceptional vision and execution drive. Strong at scale, comfortable with ambiguity, and motivated by transformational challenges.",
        "strengths_synthesis": ["Strategic thinking and vision (LEAP 88)", "Achievement motivation and resilience (DRIVE 91/87)", "Stakeholder influence at executive level (LEAP 85)", "Proven ability to lead large engineering organizations"],
        "development_areas": ["Talent development and coaching (LEAP 74 — lowest dimension)", "Cross-functional collaboration style refinement", "Delegation in new environments"],
        "role_fit_assessment": "Strong fit (87% match). Strategic dimensions align well with CTO requirements. Main development area is talent coaching, which can be addressed through onboarding support.",
        "recommendations": ["Proceed with strong recommendation", "Consider executive coach for first 6 months focused on talent development", "Pair with strong VP Engineering for hands-on team management"]}
}

def gen_assessment_bundle(d):
    bm = d["bundle_meta"]
    cover = build_cover("COMPREHENSIVE<br>ASSESSMENT REPORT", f"{bm['candidate_name']} — {bm['role_title']}",
                        [f"<strong>Date:</strong> {bm['date']}", f"<strong>Instruments:</strong> {', '.join(bm['instruments_used'])}"], status="CONFIDENTIAL")
    # Executive summary
    body1 = build_doc_header("Executive Summary", bm["date"])
    body1 += f"<h2>Integrated Profile</h2><p>{d['executive_summary']}</p>"
    ia = d["integrated_analysis"]
    body1 += f"<h3>Role Fit Assessment</h3>"
    body1 += f'<div style="display:flex;align-items:center;gap:16px;margin:12px 0">'
    body1 += svg_gauge(87, "Match Score")
    body1 += f'<div><p style="font-weight:600">Strong Fit — {ia["role_fit_assessment"][:100]}...</p></div></div>'
    # Individual instruments
    body2 = build_doc_header("Instrument Reports", bm["date"])
    for ir in d["instrument_reports"]:
        body2 += f"<h2>{ir['instrument']}</h2>"
        dims = list(ir["key_scores"].keys())
        vals = list(ir["key_scores"].values())
        body2 += svg_radar(dims, vals, size=220)
        body2 += f"<p>{ir['interpretation']}</p>"
        body2 += build_callout(f"<strong>Role Implications:</strong> {ir['implications_for_role']}")
    # Integrated analysis
    body3 = build_doc_header("Integrated Analysis", bm["date"])
    body3 += f"<h2>Overall Profile</h2><p>{ia['overall_profile']}</p>"
    body3 += "<h3>Strengths</h3>" + build_bullet_list(ia["strengths_synthesis"])
    body3 += "<h3>Development Areas</h3>" + build_bullet_list(ia["development_areas"])
    body3 += "<h3>Recommendations</h3>" + build_bullet_list(ia["recommendations"])
    return wrap_a4_multi([cover, body1, body2, body3], title="Assessment Bundle Report", confidential=True)


D41_DATA = {
    "profitability_meta": {"mandate_id": "MND-2026-0042", "role_title": "Chief Technology Officer", "client_name": "Apex Technologies", "period": "2026 Q3", "status": "active"},
    "revenue": {"fee_agreed": 650000, "fee_received": 300000, "fee_outstanding": 350000, "currency": "CNY"},
    "costs": {"consultant_time_hours": 180, "consultant_time_cost": 90000, "research_costs": 25000, "travel_expenses": 8000, "assessment_credits": 12000, "other_costs": 5000, "total_costs": 140000},
    "profitability": {"gross_margin_pct": 78.5, "effective_hourly_rate": 2833, "time_to_fill_weeks": 10, "budget_variance_pct": -5.2},
    "benchmarking": {"avg_margin_for_type": 72, "performance_vs_avg": "above"}
}

def gen_profitability(d):
    pm = d["profitability_meta"]; rev = d["revenue"]; cost = d["costs"]; prof = d["profitability"]
    body = build_doc_header("Mandate Profitability", pm["period"])
    body += f"<h2>{pm['role_title']} — {pm['client_name']}</h2>"
    body += build_stat_cards([
        {"value": f"{prof['gross_margin_pct']}%", "label": "Gross Margin"},
        {"value": f"¥{prof['effective_hourly_rate']:,}", "label": "Effective Rate"},
        {"value": f"{prof['time_to_fill_weeks']}w", "label": "Time to Fill"},
        {"value": f"{prof['budget_variance_pct']}%", "label": "Budget Variance"}
    ])
    body += "<h3>Revenue</h3>"
    body += f"<table><tr><th>Item</th><th>Amount</th></tr>"
    body += f"<tr><td>Fee Agreed</td><td>¥{rev['fee_agreed']:,}</td></tr>"
    body += f"<tr><td>Received</td><td>¥{rev['fee_received']:,}</td></tr>"
    body += f"<tr><td>Outstanding</td><td>¥{rev['fee_outstanding']:,}</td></tr></table>"
    body += "<h3>Cost Breakdown</h3>"
    body += f"<table><tr><th>Category</th><th>Amount</th></tr>"
    for k, label in [("consultant_time_cost","Consultant Time"),("research_costs","Research"),("travel_expenses","Travel"),("assessment_credits","Assessments"),("other_costs","Other")]:
        body += f"<tr><td>{label}</td><td>¥{cost[k]:,}</td></tr>"
    body += f"<tr style='font-weight:700;background:{GREY_100}'><td>Total Costs</td><td>¥{cost['total_costs']:,}</td></tr></table>"
    bm = d["benchmarking"]
    body += f'<div class="callout">Performance vs. benchmark: <strong>{bm["performance_vs_avg"].upper()}</strong> average (avg margin: {bm["avg_margin_for_type"]}%)</div>'
    return wrap_a4(body, title="Mandate Profitability", confidential=True)


D45_DATA = {
    "board_meta": {"period": "2026 Q3", "date": "2026-10-15", "prepared_by": "Kevin Hong"},
    "executive_summary": "Q3 was a strong quarter with ¥4.2M in revenue against a ¥4.0M target (105% achievement). Key wins include the successful CTO placement at Apex Technologies and launch of the technology practice vertical.",
    "financial_highlights": {"revenue": 4200000, "revenue_target": 4000000, "margin_pct": 76, "placements": 8},
    "operational_highlights": {"active_mandates": 12, "avg_time_to_fill": 9.5, "client_satisfaction": 4.6, "key_wins": ["Apex Technologies CTO placement", "3 new retained mandates signed", "Technology practice vertical launched"]},
    "strategic_updates": [{"initiative": "APAC Expansion", "status": "on_track", "progress_pct": 65}, {"initiative": "Assessment Platform v2", "status": "in_progress", "progress_pct": 40}, {"initiative": "Client Portal Launch", "status": "on_track", "progress_pct": 80}],
    "risks_and_issues": [{"item": "Key consultant recruitment — 2 senior hires delayed", "severity": "medium", "mitigation": "Expanding search to regional candidates"}, {"item": "Market slowdown in tech hiring", "severity": "low", "mitigation": "Diversifying into healthcare and fintech verticals"}],
    "next_period_outlook": "Q4 outlook is positive with strong pipeline of 15 active mandates. Expected revenue of ¥4.5M. Key focus: closing 3 P0 mandates and launching assessment platform v2."
}

def gen_board_report(d):
    bm = d["board_meta"]
    fh = d["financial_highlights"]; oh = d["operational_highlights"]
    cover = build_cover("BOARD REPORT", f"{bm['period']} | LYC Partners", [f"<strong>Date:</strong> {bm['date']}", f"<strong>Prepared by:</strong> {bm['prepared_by']}"])
    body1 = build_doc_header("Executive Summary", bm["date"])
    body1 += f"<p>{d['executive_summary']}</p>"
    body1 += build_stat_cards([
        {"value": f"¥{fh['revenue']/1e6:.1f}M", "label": "Revenue"},
        {"value": f"{fh['revenue']*100//fh['revenue_target']}%", "label": "vs Target"},
        {"value": f"{fh['margin_pct']}%", "label": "Margin"},
        {"value": fh["placements"], "label": "Placements"}
    ])
    body1 += build_stat_cards([
        {"value": oh["active_mandates"], "label": "Active Mandates"},
        {"value": f"{oh['avg_time_to_fill']}w", "label": "Avg Time to Fill"},
        {"value": f"{oh['client_satisfaction']}/5", "label": "Client Satisfaction"},
    ])
    # Strategic updates
    body2 = build_doc_header("Strategic Updates", bm["date"])
    for su in d["strategic_updates"]:
        color = FUCHSIA if su["progress_pct"] >= 70 else (INFO if su["progress_pct"] >= 40 else WARNING)
        body2 += f'<h4>{su["initiative"]}</h4>'
        body2 += f'<div style="display:flex;align-items:center;gap:8px;margin:4px 0">'
        body2 += f'<span class=small style="width:80px">{su["status"].replace("_"," ").title()}</span>'
        body2 += f'<div style="flex:1;height:8px;background:{GREY_200};border-radius:4px;overflow:hidden"><div style="width:{su["progress_pct"]}%;height:100%;background:{color};border-radius:4px"></div></div>'
        body2 += f'<span style="font-weight:600;width:35px">{su["progress_pct"]}%</span></div>'
    # Risks
    body2 += "<h3>Risks & Issues</h3>"
    for r in d["risks_and_issues"]:
        sev_cls = {"low": "badge-success", "medium": "badge-warning", "high": "badge-danger"}.get(r["severity"], "badge-neutral")
        body2 += f'<div style="background:{GREY_100};border-radius:6px;padding:10px;margin:6px 0"><span class="badge {sev_cls}">{r["severity"].upper()}</span> {r["item"]}<br><span class=small>Mitigation: {r["mitigation"]}</span></div>'
    body2 += f"<h3>Q4 Outlook</h3><p>{d['next_period_outlook']}</p>"
    return wrap_a4_multi([cover, body1, body2], title=f"Board Report — {bm['period']}", confidential=True)


def generate_all(output_dir="business_docs"):
    os.makedirs(output_dir, exist_ok=True)
    docs = [
        ("D36_Assessment_Bundle", gen_assessment_bundle, D36_DATA),
        ("D41_Mandate_Profitability", gen_profitability, D41_DATA),
        ("D45_Board_Report", gen_board_report, D45_DATA),
    ]
    for name, fn, data in docs:
        html = fn(data)
        path = os.path.join(output_dir, f"{name}.html")
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"  {name}: {len(html)//1024}KB")
    return len(docs)

if __name__ == "__main__":
    print("L8+L9: Assessment + Operations")
    n = generate_all()
    print(f"  {n} documents generated.")
