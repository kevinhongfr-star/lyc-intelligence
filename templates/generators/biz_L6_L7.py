"""L6+L7: Engagement Management & Post-Placement — D26 through D35"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from lyc_business_components import *

D26_DATA = {
    "status_meta": {"mandate_id": "MND-2026-0042", "role_title": "Chief Technology Officer", "client_name": "Apex Technologies", "report_date": "2026-08-15", "report_period": "Week 1-4", "consultant_name": "Kevin Hong", "overall_status": "on_track"},
    "pipeline_metrics": {"total_sourced": 45, "total_contacted": 20, "total_interested": 12, "total_assessed": 8, "total_shortlisted": 5, "total_interviewed": 0, "total_offered": 0, "weeks_elapsed": 4, "weeks_remaining": 8},
    "period_highlights": {"activities_completed": ["Market mapping completed — 12 target companies", "Initial outreach to 45 candidates", "8 candidates assessed via LEAP"], "key_achievements": ["3 exceptional candidates identified from Tier 1 targets", "Shortlist quality exceeding expectations"], "challenges": ["2 top candidates declined due to non-compete restrictions"]},
    "next_period_plan": {"planned_activities": ["Complete shortlist refinement", "Schedule client interviews for top 3", "Conduct deep-dive reference checks"], "milestones_due": ["Shortlist presentation — Week 6", "First client interviews — Week 7"], "decisions_needed": ["Confirm interview panel for Round 1", "Approve shortlist of 3 candidates"]},
    "risk_flags": [{"risk": "2 candidates lost to non-compete", "severity": "medium", "mitigation": "Expanding search to adjacent companies"}]
}

def gen_status_update(d):
    sm = d["status_meta"]; pm = d["pipeline_metrics"]
    # Email format
    status_cls = {"on_track": "status-on-track", "at_risk": "status-at-risk", "delayed": "status-delayed"}.get(sm["overall_status"], "status-on-track")
    body = f'<p>Dear {sm["client_name"]} team,</p>'
    body += f'<p>Here is the Week {pm["weeks_elapsed"]} update for the <strong>{sm["role_title"]}</strong> search.</p>'
    body += f'<p>Overall Status: <span class="status-bar {status_cls}">{sm["overall_status"].replace("_"," ").upper()}</span></p>'
    body += '<h3>Pipeline Summary</h3>'
    body += '<div class="metric-row">'
    for label, key in [("Sourced","total_sourced"),("Contacted","total_contacted"),("Assessed","total_assessed"),("Shortlisted","total_shortlisted")]:
        body += f'<div class="metric-box"><div class="value">{pm[key]}</div><div class="label">{label}</div></div>'
    body += '</div>'
    ph = d["period_highlights"]
    body += '<h3>This Period</h3>'
    body += '<p><strong>Completed:</strong></p><ul>' + ''.join(f'<li>{a}</li>' for a in ph["activities_completed"]) + '</ul>'
    body += '<p><strong>Key Achievements:</strong></p><ul>' + ''.join(f'<li>{a}</li>' for a in ph["key_achievements"]) + '</ul>'
    if ph["challenges"]:
        body += '<p><strong>Challenges:</strong></p><ul>' + ''.join(f'<li>{a}</li>' for a in ph["challenges"]) + '</ul>'
    np = d["next_period_plan"]
    body += '<h3>Next Period</h3><ul>' + ''.join(f'<li>{a}</li>' for a in np["planned_activities"]) + '</ul>'
    body += '<p><strong>Milestones Due:</strong></p><ul>' + ''.join(f'<li>{m}</li>' for m in np["milestones_due"]) + '</ul>'
    if np["decisions_needed"]:
        body += f'<div class="action-item"><strong>Action Required:</strong> {"; ".join(np["decisions_needed"])}</div>'
    if d["risk_flags"]:
        body += '<h3>Risk Flags</h3>'
        for r in d["risk_flags"]:
            sev_cls = {"low": "status-on-track", "medium": "status-at-risk", "high": "status-delayed"}.get(r["severity"], "")
            body += f'<div class="action-item"><span class="status-bar {sev_cls}" style="font-size:10px">{r["severity"].upper()}</span> {r["risk"]}<br><span class=small>Mitigation: {r["mitigation"]}</span></div>'
    body += f'<hr class="divider"><p class=small>{sm["consultant_name"]}<br>LYC Partners</p>'
    return wrap_email(body, subject=f"[LYC] Mandate Update — {sm['role_title']} — Week {pm['weeks_elapsed']}")

D27_DATA = {
    "meeting_meta": {"mandate_id": "MND-2026-0042", "meeting_date": "2026-09-10T14:00", "meeting_type": "alignment", "location": "Apex HQ, Shanghai", "duration_minutes": 90, "facilitator": "Kevin Hong"},
    "attendees": [{"name": "David Liu", "company": "Apex Technologies", "role": "CEO"}, {"name": "Sarah Chen", "company": "Apex Technologies", "role": "CHRO"}, {"name": "Kevin Hong", "company": "LYC Partners", "role": "Lead Partner"}],
    "agenda_items": [
        {"topic": "Shortlist Review", "discussion_summary": "Reviewed 5 shortlisted candidates. David and Sarah both impressed with Alex Wang's strategic vision. Lisa Zhang noted for AI expertise.",
         "decisions_made": ["Proceed with Alex Wang and Lisa Zhang for Round 1 interviews", "James Chen as backup — schedule if top 2 don't progress"],
         "action_items": [{"action": "Send interview invitations to candidates", "owner": "LYC", "due_date": "2026-09-15"}, {"action": "Confirm interview panel", "owner": "Client", "due_date": "2026-09-12"}]},
        {"topic": "Timeline Adjustment", "discussion_summary": "David has board meeting on original interview date. Need to reschedule.",
         "decisions_made": ["Move interviews to Week of Sept 22"], "action_items": [{"action": "Reschedule interviews to Sept 22-24", "owner": "LYC", "due_date": "2026-09-13"}]},
        {"topic": "Compensation Strategy", "discussion_summary": "Discussed Alex Wang's likely expectations. Sarah confirmed budget of ¥3.2M-3.5M is approved.",
         "decisions_made": ["Budget approved up to ¥3.5M total"], "action_items": []}
    ],
    "summary": {"key_decisions": ["Alex Wang and Lisa Zhang to proceed to Round 1", "Interviews rescheduled to Sept 22-24", "Budget approved up to ¥3.5M"],
                "action_items": [{"action": "Send interview invitations", "owner": "LYC", "due_date": "2026-09-15"}, {"action": "Confirm interview panel", "owner": "Client", "due_date": "2026-09-12"}, {"action": "Reschedule interviews", "owner": "LYC", "due_date": "2026-09-13"}],
                "next_meeting": "2026-09-25T14:00"}
}

def gen_meeting_minutes(d):
    mm = d["meeting_meta"]
    body = build_doc_header("Meeting Minutes", mm["meeting_date"][:10])
    body += f"<h2>{mm['meeting_type'].title()} Meeting — {mm['mandate_id']}</h2>"
    body += f'<p class=small>Date: {mm['meeting_date']} | Duration: {mm['duration_minutes']}min | Location: {mm['location']} | Facilitator: {mm['facilitator']}</p>'
    body += "<h3>Attendees</h3>"
    for a in d["attendees"]:
        body += f'<p style="margin:2px 0"><strong>{a["name"]}</strong> — {a["role"]}, {a["company"]}</p>'
    for ai in d["agenda_items"]:
        body += f'<hr class="section-divider"><h3>{ai["topic"]}</h3><p>{ai["discussion_summary"]}</p>'
        if ai["decisions_made"]:
            body += '<h4>Decisions</h4>' + build_bullet_list(ai["decisions_made"])
        if ai["action_items"]:
            body += build_action_table(ai["action_items"])
    # Summary
    sm = d["summary"]
    body += '<hr class="section-divider"><h2>Summary</h2>'
    body += "<h3>Key Decisions</h3>" + build_bullet_list(sm["key_decisions"])
    body += "<h3>Action Items</h3>" + build_action_table(sm["action_items"])
    if sm["next_meeting"]:
        body += f'<p><strong>Next Meeting:</strong> {sm["next_meeting"]}</p>'
    body += '<p class=small>Please review and confirm accuracy within 48 hours.</p>'
    return wrap_a4(body, title="Meeting Minutes", confidential=True)


D28_DATA = {
    "recap_meta": {"mandate_id": "MND-2026-0042", "role_title": "Chief Technology Officer", "date": "2026-09-10", "trigger": "meeting"},
    "context": "Following today's alignment meeting regarding the CTO search shortlist and interview planning.",
    "decisions_made": ["Alex Wang and Lisa Zhang approved for Round 1 interviews", "Interviews rescheduled to week of Sept 22", "Budget approved up to ¥3.5M total"],
    "action_items": [{"action": "Send interview invitations to Alex Wang and Lisa Zhang", "owner": "LYC", "due_date": "2026-09-15"},
                     {"action": "Confirm interview panel and room booking", "owner": "Client", "due_date": "2026-09-12"}],
    "upcoming_milestones": [{"milestone": "Round 1 Interviews", "target_date": "2026-09-22"}, {"milestone": "Debrief & Shortlist Narrowing", "target_date": "2026-09-25"}],
    "consultant_notes": "Strong alignment today. The shortlist quality is high and the team is excited about Alex Wang. Let's move quickly to secure interview slots."
}

def gen_nextstep_client(d):
    rm = d["recap_meta"]
    body = f'<p>{d["context"]}</p>'
    body += '<h3>Decisions Made</h3><ul>' + ''.join(f'<li>{dec}</li>' for dec in d["decisions_made"]) + '</ul>'
    body += '<h3>Action Items</h3>'
    for ai in d["action_items"]:
        tag_cls = "tag-lyc" if ai["owner"] == "LYC" else "tag-client"
        body += f'<div class="action-item"><span class="tag {tag_cls}">{ai["owner"]}</span>{ai["action"]} — due {ai["due_date"]}</div>'
    body += '<h3>Upcoming Milestones</h3><ul>' + ''.join(f'<li>{m["milestone"]} — {m["target_date"]}</li>' for m in d["upcoming_milestones"]) + '</ul>'
    body += f'<p class=small>{d["consultant_notes"]}</p><hr class="divider"><p class=small>LYC Partners</p>'
    return wrap_email(body, subject=f"Next Steps — {rm['role_title']} — {rm['date']}")


D30_DATA = {
    "recap_meta": {"mandate_id": "MND-2026-0042", "candidate_name": "Alex Wang", "role_title": "Chief Technology Officer", "date": "2026-09-15", "stage": "first_interview"},
    "status_update": "Great news! Following your initial screening, the client is very interested in meeting you. They were particularly impressed with your LEAP assessment results.",
    "next_steps": [{"step": "Round 1 Interview with CEO and CHRO", "timeline": "Week of September 22", "action_required_by_candidate": True},
                   {"step": "Prepare 15-min presentation on technology vision", "timeline": "Before interview", "action_required_by_candidate": True}],
    "important_dates": [{"event": "Round 1 Interview", "date": "2026-09-22T10:00", "location": "Apex HQ, Shanghai (Hybrid)"}],
    "preparation_needed": ["Research Apex's recent product launches", "Prepare thoughts on APAC cloud market trends", "Prepare questions for the CEO about company vision"],
    "contact_info": {"consultant_name": "Kevin Hong", "consultant_phone": "+86 21 5888 0000", "consultant_email": "kevin@lyc-partners.ai"}
}

def gen_nextstep_candidate(d):
    rm = d["recap_meta"]; ci = d["contact_info"]
    body = f'<p>Dear {rm["candidate_name"]},</p>'
    body += f'<p>{d["status_update"]}</p>'
    body += '<h3>Next Steps</h3>'
    for ns in d["next_steps"]:
        req = ' <span class="fuchsia-dot">●</span> <strong>Action required</strong>' if ns["action_required_by_candidate"] else ""
        body += f'<div class="action-item">{ns["step"]} — {ns["timeline"]}{req}</div>'
    if d["important_dates"]:
        body += '<h3>Important Dates</h3><ul>'
        for dt in d["important_dates"]:
            body += f'<li><strong>{dt["event"]}</strong> — {dt["date"]} — {dt["location"]}</li>'
        body += '</ul>'
    if d["preparation_needed"]:
        body += '<h3>Preparation</h3><ul>' + ''.join(f'<li>{p}</li>' for p in d["preparation_needed"]) + '</ul>'
    body += f'<hr class="divider"><p>Your consultant:<br><strong>{ci["consultant_name"]}</strong><br>{ci["consultant_phone"]}<br>{ci["consultant_email"]}</p>'
    return wrap_email(body, subject=f"Update on {rm['role_title']} — Next Steps")


D31_DATA = {
    "confirmation_meta": {"mandate_id": "MND-2026-0042", "candidate_name": "Alex Wang", "role_title": "Chief Technology Officer", "client_company": "Apex Technologies", "start_date": "2026-11-01", "confirmation_date": "2026-10-15"},
    "placement_details": {"agreed_compensation": "¥3,200,000 total (¥1.8M base + 40% bonus + 0.5% RSUs)", "fee_amount": 650000, "fee_paid": 300000, "fee_outstanding": 350000, "guarantee_start": "2026-11-01", "guarantee_end": "2027-05-01", "guarantee_terms": "6-month replacement guarantee"},
    "post_placement_services": ["Guarantee period monitoring", "90-day onboarding support", "Executive coaching referral", "Team integration workshop"],
    "contact_information": "Kevin Hong | kevin@lyc-partners.ai | +86 21 5888 0000"
}

def gen_placement_confirmation(d):
    cm = d["confirmation_meta"]; pd = d["placement_details"]
    body = build_doc_header("Placement Confirmation", cm["confirmation_date"])
    body += f"<h2>Confirmation of Placement</h2>"
    body += f"<p>We are pleased to confirm the successful placement of <strong>{cm['candidate_name']}</strong> as <strong>{cm['role_title']}</strong> at <strong>{cm['client_company']}</strong>.</p>"
    body += f"<p><strong>Start Date:</strong> {cm['start_date']}</p>"
    body += f"<h3>Placement Details</h3>"
    body += f"<p><strong>Compensation:</strong> {pd['agreed_compensation']}</p>"
    body += f"<h3>Fee Summary</h3>"
    body += f"<table><tr><th>Item</th><th>Amount</th></tr>"
    body += f"<tr><td>Total Fee</td><td>¥{pd['fee_amount']:,}</td></tr>"
    body += f"<tr><td>Paid to Date</td><td>¥{pd['fee_paid']:,}</td></tr>"
    body += f"<tr><td>Outstanding</td><td>¥{pd['fee_outstanding']:,}</td></tr></table>"
    body += f"<h3>Guarantee Period</h3><p>{pd['guarantee_start']} to {pd['guarantee_end']}</p><p>{pd['guarantee_terms']}</p>"
    body += f"<h3>Post-Placement Services</h3>{build_bullet_list(d['post_placement_services'])}"
    body += f'<p class=small>{d['contact_information']}</p>'
    body += build_signature_block("Kevin Hong", "Managing Partner", cm["confirmation_date"], "LYC Partners")
    return wrap_a4(body, title="Placement Confirmation", confidential=True)


def generate_all(output_dir="business_docs"):
    os.makedirs(output_dir, exist_ok=True)
    docs = [
        ("D26_Status_Update", gen_status_update, D26_DATA),
        ("D27_Meeting_Minutes", gen_meeting_minutes, D27_DATA),
        ("D28_NextStep_Client", gen_nextstep_client, D28_DATA),
        ("D30_NextStep_Candidate", gen_nextstep_candidate, D30_DATA),
        ("D31_Placement_Confirmation", gen_placement_confirmation, D31_DATA),
    ]
    for name, fn, data in docs:
        html = fn(data)
        path = os.path.join(output_dir, f"{name}.html")
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"  {name}: {len(html)//1024}KB")
    return len(docs)

if __name__ == "__main__":
    print("L6+L7: Engagement + Post-Placement")
    n = generate_all()
    print(f"  {n} documents generated.")
