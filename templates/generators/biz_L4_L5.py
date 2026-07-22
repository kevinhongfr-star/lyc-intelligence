"""L4+L5: Interview Process & Decision Documents — D15 through D25"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from lyc_business_components import *

D15_DATA = {
    "prep_meta": {"mandate_id": "MND-2026-0042", "role_title": "Chief Technology Officer", "interview_round": 2, "date_prepared": "2026-09-15", "consultant_name": "Kevin Hong"},
    "interview_logistics": {"date": "2026-09-22T10:00", "duration_minutes": 60, "format": "hybrid", "location": "Apex HQ, Shanghai", "video_link": "https://meet.apextech.com/lyc",
        "interviewers": [{"name": "David Liu", "title": "CEO", "focus_area": "Strategic vision & cultural fit"}, {"name": "Sarah Chen", "title": "CHRO", "focus_area": "Leadership style & team building"}],
        "candidate_name": "Alex Wang", "candidate_current_role": "VP Engineering, Alibaba Cloud"},
    "candidate_brief": {"professional_summary": "Alex brings 18 years of technology leadership, currently managing 120 engineers at Alibaba Cloud. Led the cloud-native migration serving 50M+ users.",
        "key_strengths": ["Proven scale — managed 120-person engineering org through 3x growth", "Cloud architecture expertise — led multi-region deployment", "Strong stakeholder management at board level"],
        "areas_to_explore": ["Experience outside of Alibaba ecosystem", "Approach to building vs. buying technology", "Delegation style with large teams"],
        "assessment_highlights": "LEAP score: Strategic Vision 88/100, Engineering Leadership 82/100. DRIVE indicates strong achievement motivation.",
        "potential_concerns": ["May have limited experience outside large corporate environment", "Compensation expectations at upper end of range"],
        "motivation_notes": "Seeking CTO-level role with broader scope and board exposure. Motivated by transformational challenge."},
    "suggested_questions": [
        {"category": "Leadership", "question": "Tell us about a time you had to fundamentally restructure your engineering team. What drove the decision and how did you manage the transition?",
         "purpose": "Assess change management and organizational design skills", "look_for": "Clear rationale, empathy for affected team members, measurable outcomes", "red_flag": "Blames others, no data-driven decision making"},
        {"category": "Strategic", "question": "How would you approach building our AI strategy given our current platform architecture and market position?",
         "purpose": "Evaluate strategic thinking and technical depth", "look_for": "Market-aware approach, pragmatic phasing, resource allocation thinking", "red_flag": "Buzzword-heavy without substance"},
        {"category": "Behavioral", "question": "Describe a situation where you disagreed with the CEO on a technology direction. How did you handle it?",
         "purpose": "Assess stakeholder management and executive presence", "look_for": "Diplomacy backed by data, willingness to challenge constructively", "red_flag": "Automatic compliance or aggressive confrontation"}
    ],
    "evaluation_criteria": [{"dimension": "Strategic Vision", "weight": 30, "rating_scale": "1-5"}, {"dimension": "Technical Leadership", "weight": 25, "rating_scale": "1-5"},
        {"dimension": "Stakeholder Management", "weight": 20, "rating_scale": "1-5"}, {"dimension": "Cultural Fit", "weight": 15, "rating_scale": "1-5"}, {"dimension": "Growth Potential", "weight": 10, "rating_scale": "1-5"}],
    "interview_tips": {"do": ["Start with rapport-building", "Allow candidate time to think", "Take detailed notes against criteria"],
        "dont": ["Make promises about compensation", "Share other candidates' details", "Discuss internal politics"]}
}

def gen_interview_prep_client(d):
    pm = d["prep_meta"]; il = d["interview_logistics"]; cb = d["candidate_brief"]
    cover = build_cover("INTERVIEW<br>PREPARATION GUIDE", f"Candidate: {il['candidate_name']}",
                        [f"<strong>Role:</strong> {pm['role_title']}", f"<strong>Round:</strong> {pm['interview_round']}",
                         f"<strong>Date:</strong> {il['date'][:10]}", f"<strong>Prepared by:</strong> {pm['consultant_name']}"], status="CONFIDENTIAL")
    # Logistics
    body1 = build_doc_header("Interview Logistics", pm["date_prepared"])
    body1 += f"""<h2>Session Details</h2>
    <div class="stat-grid">
        <div class="stat-card"><div class="stat-value" style="font-size:12pt">{il['date'][:16]}</div><div class="stat-label">Date & Time</div></div>
        <div class="stat-card"><div class="stat-value">{il['duration_minutes']}min</div><div class="stat-label">Duration</div></div>
        <div class="stat-card"><div class="stat-value">{il['format'].title()}</div><div class="stat-label">Format</div></div>
    </div>
    <h3>Interview Panel</h3>"""
    for iv in il["interviewers"]:
        body1 += f'<div style="background:{GREY_100};border-radius:6px;padding:10px 14px;margin:6px 0"><strong>{iv["name"]}</strong> — {iv["title"]}<br><span class=small>Focus: {iv["focus_area"]}</span></div>'
    # Candidate brief
    body2 = build_doc_header("Candidate Brief", pm["date_prepared"])
    body2 += f"<h2>Professional Summary</h2><p>{cb['professional_summary']}</p>"
    body2 += "<h3>Key Strengths</h3>" + build_bullet_list(cb["key_strengths"])
    body2 += "<h3>Areas to Explore</h3>" + build_bullet_list(cb["areas_to_explore"])
    body2 += build_callout(cb["assessment_highlights"])
    body2 += f'<div class="callout"><strong>Concerns:</strong> {"; ".join(cb["potential_concerns"])}</div>'
    body2 += f"<p><strong>Motivation:</strong> {cb['motivation_notes']}</p>"
    # Questions
    body3 = build_doc_header("Suggested Questions", pm["date_prepared"])
    for i, q in enumerate(d["suggested_questions"], 1):
        body3 += f"""<h3>{i}. [{q['category']}] {q['question']}</h3>
        <p class=small><strong>Purpose:</strong> {q['purpose']}</p>
        <p class=small><strong>Look for:</strong> {q['look_for']}</p>
        <p class=small style="color:{DANGER}"><strong>Red flag:</strong> {q['red_flag']}</p>"""
    # Evaluation
    body3 += "<h3>Evaluation Criteria</h3>"
    body3 += '<table><tr><th>Dimension</th><th>Weight</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th></tr>'
    for ec in d["evaluation_criteria"]:
        body3 += f'<tr><td style="font-weight:600">{ec["dimension"]}</td><td>{ec["weight"]}%</td>'
        body3 += '<td>○</td><td>○</td><td>○</td><td>○</td><td>○</td></tr>'
    body3 += "</table>"
    # Tips
    tips = d["interview_tips"]
    body3 += '<div class="two-col">'
    body3 += f'<div><h4 style="color:{SUCCESS}">DO</h4>{build_bullet_list(tips["do"])}</div>'
    body3 += f"<div><h4 style=\"color:{DANGER}\">DON'T</h4>{build_bullet_list(tips['dont'])}</div>"
    body3 += '</div>'
    return wrap_a4_multi([cover, body1, body2, body3], title="Interview Prep Guide", confidential=True)


D19_DATA = {
    "debrief_meta": {"mandate_id": "MND-2026-0042", "role_title": "Chief Technology Officer", "interview_date": "2026-09-22", "interview_round": 2, "candidate_name": "Alex Wang", "facilitator": "Kevin Hong"},
    "interviewers": [
        {"name": "David Liu", "title": "CEO", "scores": {"Strategic Vision": {"score": 5, "evidence": "Clear 3-year tech vision", "concerns": ""}, "Technical Leadership": {"score": 4, "evidence": "Strong scaling experience", "concerns": "Limited outside Alibaba"}},
         "overall_rating": "strong_yes", "key_strengths_observed": ["Exceptional strategic thinking", "Strong executive presence"], "concerns_observed": ["May need support navigating unfamiliar territory"], "would_hire": True, "comments": "Impressive candidate. Best strategic thinker we've seen."},
        {"name": "Sarah Chen", "title": "CHRO", "scores": {"Cultural Fit": {"score": 4, "evidence": "Values alignment strong", "concerns": "Used to very large org"}, "Stakeholder Management": {"score": 5, "evidence": "Board presentation excellent", "concerns": ""}},
         "overall_rating": "yes", "key_strengths_observed": ["Great communicator", "Empathetic leader"], "concerns_observed": ["Adaptability to mid-size org?"], "would_hire": True, "comments": "Strong yes. Cultural fit is good."}
    ],
    "discussion_points": [{"topic": "Org size transition", "notes": "Candidate used to 120-person team. Our current team is 85 — similar but different dynamics."}, {"topic": "Compensation expectations", "notes": "At upper end of range. May need equity sweetener."}],
    "consensus": {"overall_rating": "Strong Yes", "decision": "advance", "conditions": ["Confirm compensation flexibility", "Check reference from non-Alibaba contact"], "next_steps": "Proceed to final round with Board Technology Committee. Target within 2 weeks."}
}

def gen_interview_debrief(d):
    dm = d["debrief_meta"]
    body = build_doc_header("Interview Debrief", dm["interview_date"])
    body += f"<h2>{dm['candidate_name']} — {dm['role_title']}</h2>"
    body += f'<p class=small>Round {dm['interview_round']} | Date: {dm['interview_date']} | Facilitator: {dm['facilitator']}</p>'
    # Feedback
    body += "<h2>Interviewer Feedback</h2>"
    for iv in d["interviewers"]:
        rating_cls = {"strong_yes": "badge-success", "yes": "badge-info", "maybe": "badge-warning", "no": "badge-danger"}.get(iv["overall_rating"], "badge-neutral")
        body += f'<div style="background:{GREY_100};border-radius:6px;padding:14px;margin:10px 0">'
        body += f'<div style="display:flex;justify-content:space-between;align-items:center"><strong>{iv["name"]}</strong> — {iv["title"]}'
        body += f'<span class="badge {rating_cls}">{iv["overall_rating"].replace("_"," ").title()}</span></div>'
        body += f'<p class=small><strong>Strengths:</strong> {"; ".join(iv["key_strengths_observed"])}</p>'
        body += f'<p class=small><strong>Concerns:</strong> {"; ".join(iv["concerns_observed"]) if iv["concerns_observed"] else "None"}</p>'
        body += f'<p class=small><em>"{iv["comments"]}"</em></p></div>'
    # Discussion
    body += "<h2>Discussion Points</h2>"
    for dp in d["discussion_points"]:
        body += f'<p><strong>{dp["topic"]}:</strong> {dp["notes"]}</p>'
    # Consensus
    con = d["consensus"]
    body += f'<div class="callout"><strong>Decision: {con["decision"].upper()}</strong><br>'
    body += f'Overall Rating: {con["overall_rating"]}<br>'
    if con["conditions"]:
        body += f'Conditions: {"; ".join(con["conditions"])}<br>'
    body += f'Next Steps: {con["next_steps"]}</div>'
    return wrap_a4(body, title="Interview Debrief", confidential=True)


D21_DATA = {
    "recommendation_meta": {"mandate_id": "MND-2026-0042", "role_title": "Chief Technology Officer", "client_name": "Apex Technologies", "date": "2026-10-05", "consultant_name": "Kevin Hong"},
    "search_summary": {"total_candidates_sourced": 45, "total_assessed": 12, "total_interviewed": 5, "search_duration_weeks": 10},
    "finalists": [
        {"rank": 1, "name": "Alex Wang", "overall_match_pct": 87, "key_strengths": ["Strategic vision", "Scale experience", "Board presence"],
         "key_risks": ["Limited non-Alibaba experience"], "assessment_summary": "LEAP: 88th percentile. Strong strategic and leadership dimensions.",
         "interview_performance": "Exceptional in both rounds. CEO rated 5/5 on strategic vision.", "compensation_expectation": "¥3.2M total", "availability": "3 months notice"},
        {"rank": 2, "name": "Lisa Zhang", "overall_match_pct": 82, "key_strengths": ["AI/ML expertise", "Cross-cultural leadership"],
         "key_risks": ["Smaller team experience"], "assessment_summary": "LEAP: 80th percentile. Outstanding technical depth.",
         "interview_performance": "Strong technical round. Cultural fit questions in round 2.", "compensation_expectation": "¥2.8M total", "availability": "2 months notice"},
        {"rank": 3, "name": "James Chen", "overall_match_pct": 76, "key_strengths": ["Startup agility", "Full-stack background"],
         "key_risks": ["Limited enterprise experience"], "assessment_summary": "LEAP: 74th percentile. High innovation scores.",
         "interview_performance": "Good but less executive presence than top 2.", "compensation_expectation": "¥2.5M total", "availability": "1 month notice"}
    ],
    "recommendation": {"recommended_candidate": "Alex Wang", "rationale": "Alex demonstrates the strongest combination of strategic vision and proven scale. His LEAP scores and interview performance confirm he can operate at board level. While compensation is at the upper range, his 3-month notice provides time for proper transition planning.",
        "risk_assessment": "Primary risk: limited experience outside Alibaba ecosystem. Mitigation: strong onboarding plan with first 90 days focused on understanding Apex-specific context.",
        "negotiation_considerations": "Alex's current comp is ¥2.8M. Our offer of ¥3.2M represents a 14% increase, which is reasonable for a CTO-level move.",
        "onboarding_recommendations": "Recommend structured 90-day plan with bi-weekly CEO check-ins and a dedicated executive coach for the first 6 months."},
    "market_context": {"candidate_availability": "3 months notice, negotiable", "competitive_pressure": "We have intelligence that 2 other firms are approaching Alex", "recommended_urgency": "this_week"}
}

def gen_recommendation(d):
    rm = d["recommendation_meta"]; ss = d["search_summary"]
    cover = build_cover("FINAL CANDIDATE<br>RECOMMENDATION", f"{rm['role_title']} — {rm['client_name']}",
                        [f"<strong>Date:</strong> {rm['date']}", f"<strong>Consultant:</strong> {rm['consultant_name']}"], status="CONFIDENTIAL")
    # Search summary
    body1 = build_doc_header("Search Summary", rm["date"])
    body1 += f"""<h2>By the Numbers</h2>
    {build_stat_cards([
        {"value": ss['total_candidates_sourced'], "label": "Sourced"},
        {"value": ss['total_assessed'], "label": "Assessed"},
        {"value": ss['total_interviewed'], "label": "Interviewed"},
        {"value": f"{ss['search_duration_weeks']}w", "label": "Duration"}
    ])}
    <h2>Finalists</h2>"""
    for f in d["finalists"]:
        body1 += f"""<div style="background:{GREY_100};border-radius:6px;padding:14px;margin:10px 0">
        <div style="display:flex;justify-content:space-between;align-items:center">
            <strong>#{f['rank']} {f['name']}</strong>
            <span style="font-size:16pt;font-weight:700;color:{FUCHSIA}">{f['overall_match_pct']}%</span>
        </div>
        <p class=small><strong>Strengths:</strong> {', '.join(f['key_strengths'])}</p>
        <p class=small><strong>Assessment:</strong> {f['assessment_summary']}</p>
        <p class=small><strong>Comp Expectation:</strong> {f['compensation_expectation']} | <strong>Availability:</strong> {f['availability']}</p>
        </div>"""
    # Recommendation
    rec = d["recommendation"]
    body2 = build_doc_header("Recommendation", rm["date"])
    body2 += f'<h2>Recommended: {rec["recommended_candidate"]}</h2>'
    body2 += f"<p>{rec['rationale']}</p>"
    body2 += f"<h3>Risk Assessment</h3><p>{rec['risk_assessment']}</p>"
    body2 += f"<h3>Negotiation</h3><p>{rec['negotiation_considerations']}</p>"
    body2 += f"<h3>Onboarding</h3><p>{rec['onboarding_recommendations']}</p>"
    mc = d["market_context"]
    urgency_cls = {"immediate": "badge-danger", "this_week": "badge-warning", "flexible": "badge-success"}.get(mc["recommended_urgency"], "badge-neutral")
    body2 += f'<div class="callout"><strong>Market Context:</strong> {mc["competitive_pressure"]}<br><strong>Recommended Urgency:</strong> <span class="badge {urgency_cls}">{mc["recommended_urgency"].replace("_"," ").upper()}</span></div>'
    return wrap_a4_multi([cover, body1, body2], title="Final Recommendation", confidential=True)


D22_DATA = {
    "comp_recap_meta": {"mandate_id": "MND-2026-0042", "candidate_name": "Alex Wang", "role_title": "Chief Technology Officer", "date": "2026-10-06"},
    "proposed_package": {"base_salary": 1800000, "base_salary_frequency": "annual", "target_bonus_pct": 40, "target_bonus_amount": 720000,
                         "equity_options": "0.5% RSUs over 4 years", "other_compensation": "Executive health, relocation ¥200K",
                         "total_target_comp": 3200000, "currency": "CNY"},
    "current_package": {"base_salary": 1500000, "bonus": 450000, "equity": "¥600K unvested", "other": "¥80K benefits", "total": 2630000},
    "market_benchmark": {"percentile": "75th", "market_median": 2200000, "market_75th": 3000000, "market_90th": 3800000, "positioning": "above market"},
    "move_analysis": {"total_comp_increase_pct": 21.7, "base_salary_increase_pct": 20.0, "market_positioning_change": "Moving from 50th to 75th percentile"},
    "negotiation_notes": {"candidate_expectations": "¥3.2M+ total, prefers higher base", "client_budget": "Up to ¥3.5M approved",
                          "flex_areas": ["Equity vesting schedule", "Sign-on bonus", "Relocation package"],
                          "deal_breakers": ["Non-compete from current employer"],
                          "recommended_approach": "Offer ¥3.2M with ¥1.8M base + 40% bonus + equity sweetener. Emphasize growth trajectory and board exposure."}
}

def gen_compensation_recap(d):
    cm = d["comp_recap_meta"]; pp = d["proposed_package"]; cp = d["current_package"]; mb = d["market_benchmark"]; ma = d["move_analysis"]
    body = build_doc_header("Compensation Recap", cm["date"])
    body += f"<h2>{cm['candidate_name']} — {cm['role_title']}</h2>"
    body += '<table><tr><th>Component</th><th>Current</th><th>Proposed</th><th>Market 75th</th></tr>'
    body += f'<tr><td>Base Salary</td><td>¥{cp["base_salary"]:,}</td><td>¥{pp["base_salary"]:,}</td><td>—</td></tr>'
    body += f'<tr><td>Bonus</td><td>¥{cp["bonus"]:,}</td><td>¥{pp["target_bonus_amount"]:,} ({pp["target_bonus_pct"]}%)</td><td>—</td></tr>'
    body += f'<tr><td>Equity</td><td>{cp["equity"]}</td><td>{pp["equity_options"]}</td><td>—</td></tr>'
    body += f'<tr style="font-weight:700;background:{GREY_100}"><td>Total Target</td><td>¥{cp["total"]:,}</td><td>¥{pp["total_target_comp"]:,}</td><td>¥{mb["market_75th"]:,}</td></tr>'
    body += '</table>'
    body += build_stat_cards([
        {"value": f"{ma['total_comp_increase_pct']}%", "label": "Total Comp Increase"},
        {"value": f"{ma['base_salary_increase_pct']}%", "label": "Base Increase"},
        {"value": mb["percentile"], "label": "Market Position"},
    ])
    nn = d["negotiation_notes"]
    body += f"<h3>Negotiation Strategy</h3><p>{nn['recommended_approach']}</p>"
    body += f"<p><strong>Flex Areas:</strong> {', '.join(nn['flex_areas'])}</p>"
    body += f'<div class="callout"><strong>Deal Breakers:</strong> {"; ".join(nn["deal_breakers"])}</div>'
    return wrap_a4(body, title="Compensation Recap", confidential=True)


def generate_all(output_dir="business_docs"):
    os.makedirs(output_dir, exist_ok=True)
    docs = [
        ("D15_Interview_Prep_Client", gen_interview_prep_client, D15_DATA),
        ("D19_Interview_Debrief", gen_interview_debrief, D19_DATA),
        ("D21_Final_Recommendation", gen_recommendation, D21_DATA),
        ("D22_Compensation_Recap", gen_compensation_recap, D22_DATA),
    ]
    for name, fn, data in docs:
        html = fn(data)
        path = os.path.join(output_dir, f"{name}.html")
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"  {name}: {len(html)//1024}KB")
    return len(docs)

if __name__ == "__main__":
    print("L4+L5: Interview + Decision Documents")
    n = generate_all()
    print(f"  {n} documents generated.")
