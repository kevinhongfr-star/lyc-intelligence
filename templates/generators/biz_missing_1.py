"""Missing docs batch 1: D12-D14, D16-D17"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from lyc_business_components import *

D12_DATA = {
    "shortlist_meta": {"mandate_id": "MND-2026-0042", "role_title": "Chief Technology Officer", "client_name": "Apex Technologies", "date": "2026-09-07", "consultant_name": "Kevin Hong", "total_candidates": 3, "recommendation_order": [1, 2, 3]},
    "market_context": {"total_sourced": 45, "total_assessed": 12, "total_interviewed": 5, "shortlist_conversion_rate": "6.7%", "search_duration_weeks": 7},
    "candidates": [
        {"rank": 1, "candidate_name": "Alex Wang", "current_title": "VP Engineering", "current_company": "Alibaba Cloud", "match_score": 87, "match_tier": "Exceptional",
         "key_strengths": ["Proven scale leadership (120+ engineers)", "Cloud architecture expertise", "Board-level communication"],
         "potential_concerns": ["Limited experience outside Alibaba ecosystem"], "experience_summary": "18 years in tech leadership. Led cloud-native migration serving 50M+ users.",
         "assessment_highlights": {"instrument": "LEAP", "key_finding": "88th percentile — exceptional strategic vision"}, "compensation_expectation": "¥3.2M total",
         "availability": "3 months notice", "lyc_recommendation": "Strongly recommended. Best combination of strategic vision and scale.", "interview_focus_areas": ["Experience outside large corporate", "Delegation style"]},
        {"rank": 2, "candidate_name": "Lisa Zhang", "current_title": "Chief Architect", "current_company": "ByteDance", "match_score": 82, "match_tier": "Strong",
         "key_strengths": ["AI/ML expertise at scale", "Cross-cultural leadership experience"], "potential_concerns": ["Smaller team management experience"],
         "experience_summary": "15 years in technology. Led AI platform team of 60 engineers.", "assessment_highlights": {"instrument": "LEAP", "key_finding": "80th percentile — outstanding technical depth"},
         "compensation_expectation": "¥2.8M total", "availability": "2 months notice", "lyc_recommendation": "Strong technical profile. Consider for AI-focused roles.", "interview_focus_areas": ["Team scaling experience", "Management breadth"]},
        {"rank": 3, "candidate_name": "James Chen", "current_title": "Director of Engineering", "current_company": "Meituan", "match_score": 76, "match_tier": "Good",
         "key_strengths": ["Startup agility and speed", "Full-stack technical background"], "potential_concerns": ["Limited enterprise-scale experience"],
         "experience_summary": "12 years in tech. Built engineering org from 10 to 80 at 2 startups.", "assessment_highlights": {"instrument": "LEAP", "key_finding": "74th percentile — high innovation scores"},
         "compensation_expectation": "¥2.5M total", "availability": "1 month notice", "lyc_recommendation": "Good backup candidate. Strong innovation mindset.", "interview_focus_areas": ["Enterprise transition readiness", "Executive presence"]}
    ],
    "comparison_summary": {"matrix_data": {"dimensions": ["Strategic Vision", "Tech Leadership", "Stakeholder Mgmt", "Cultural Fit", "Growth Potential"],
        "scores": [[88,82,85,78,80],[76,90,72,75,85],[70,74,68,82,88]]}, "overall_recommendation": "Alex Wang is the strongest candidate overall. Recommend proceeding with all 3 for interviews.", "suggested_interview_sequence": ["Alex Wang — Week 1", "Lisa Zhang — Week 1", "James Chen — Week 2"]}
}

def gen_shortlist_presentation(d):
    sm = d["shortlist_meta"]; mc = d["market_context"]
    cover = build_cover("SHORTLIST<br>PRESENTATION", f"{sm['role_title']} — {sm['client_name']}",
                        [f"<strong>Date:</strong> {sm['date']}", f"<strong>Consultant:</strong> {sm['consultant_name']}", f"<strong>Candidates:</strong> {sm['total_candidates']}"], status="CONFIDENTIAL")
    # Search summary
    body1 = build_doc_header("Search Summary", sm["date"])
    body1 += build_stat_cards([
        {"value": mc["total_sourced"], "label": "Sourced"}, {"value": mc["total_assessed"], "label": "Assessed"},
        {"value": mc["total_interviewed"], "label": "Interviewed"}, {"value": mc["shortlist_conversion_rate"], "label": "Conversion Rate"}
    ])
    body1 += svg_funnel(["Sourced","Contacted","Assessed","Shortlisted"], [mc["total_sourced"], 22, mc["total_assessed"], sm["total_candidates"]], width=380, height=130)
    # Candidate pages
    cpages = []
    for c in d["candidates"]:
        tier_cls = {"Exceptional": "badge-fuchsia", "Strong": "badge-info", "Good": "badge-success"}.get(c["match_tier"], "badge-neutral")
        pg = build_doc_header(f"Candidate #{c['rank']}: {c['candidate_name']}", sm["date"])
        pg += f'<div style="display:flex;justify-content:space-between;align-items:center"><h2>{c["candidate_name"]}</h2><span class="badge {tier_cls}">{c["match_tier"]}</span></div>'
        pg += f'<p><strong>{c["current_title"]}</strong> at {c["current_company"]}</p>'
        pg += f'<p style="font-size:16pt;font-weight:700;color:{FUCHSIA};margin:8px 0">{c["match_score"]}% Match</p>'
        pg += f"<p>{c['experience_summary']}</p>"
        pg += f'<h3>Key Strengths</h3>{build_bullet_list(c["key_strengths"])}'
        if c["potential_concerns"]:
            pg += f'<div class="callout"><strong>Concerns:</strong> {"; ".join(c["potential_concerns"])}</div>'
        pg += f'<p class=small><strong>Assessment ({c["assessment_highlights"]["instrument"]}):</strong> {c["assessment_highlights"]["key_finding"]}</p>'
        pg += f'<p class=small><strong>Compensation:</strong> {c["compensation_expectation"]} | <strong>Availability:</strong> {c["availability"]}</p>'
        pg += f'<p><strong>LYC Recommendation:</strong> {c["lyc_recommendation"]}</p>'
        pg += f'<p class=small><strong>Interview Focus:</strong> {", ".join(c["interview_focus_areas"])}</p>'
        cpages.append(pg)
    # Comparison matrix
    cs = d["comparison_summary"]
    md = cs["matrix_data"]
    body_last = build_doc_header("Comparison Matrix", sm["date"])
    body_last += svg_heatmap(md["dimensions"], [c["candidate_name"] for c in d["candidates"]], md["scores"])
    body_last += f'<h3>Recommendation</h3><p>{cs["overall_recommendation"]}</p>'
    body_last += f'<h3>Suggested Interview Sequence</h3>{build_bullet_list(cs["suggested_interview_sequence"])}'
    all_pages = [cover, body1] + cpages + [body_last]
    return wrap_a4_multi(all_pages, title="Shortlist Presentation", confidential=True)


D13_DATA = {
    "comparison_meta": {"mandate_id": "MND-2026-0042", "role_title": "Chief Technology Officer", "date": "2026-09-10", "dimensions": ["Strategic Vision","Engineering Leadership","Technical Depth","Stakeholder Influence","Talent Development"]},
    "candidates": [
        {"name": "Alex Wang", "scores": {"Strategic Vision": 88, "Engineering Leadership": 82, "Technical Depth": 79, "Stakeholder Influence": 85, "Talent Development": 74}, "overall_score": 87, "key_notes": "Strongest overall. Strategic thinker."},
        {"name": "Lisa Zhang", "scores": {"Strategic Vision": 76, "Engineering Leadership": 90, "Technical Depth": 92, "Stakeholder Influence": 72, "Talent Development": 75}, "overall_score": 82, "key_notes": "Deepest technical expertise. AI specialist."},
        {"name": "James Chen", "scores": {"Strategic Vision": 70, "Engineering Leadership": 74, "Technical Depth": 78, "Stakeholder Influence": 68, "Talent Development": 88}, "overall_score": 76, "key_notes": "Best talent developer. Agile mindset."}
    ],
    "lyc_analysis": "All three candidates bring distinct strengths. Alex Wang leads on strategic and stakeholder dimensions — critical for CTO board exposure. Lisa Zhang has superior technical depth but lower stakeholder scores. James Chen excels in talent development but needs growth in executive presence.",
    "recommendation": "Proceed with Alex Wang as primary recommendation, Lisa Zhang as strong alternative. James Chen as backup."
}

def gen_comparison_matrix(d):
    cm = d["comparison_meta"]
    body = build_doc_header("Candidate Comparison Matrix", cm["date"])
    body += f"<h2>{cm['role_title']} — Comparative Analysis</h2>"
    dims = cm["dimensions"]
    body += svg_heatmap(dims, [c["name"] for c in d["candidates"]], [[c["scores"][d] for d in dims] for c in d["candidates"]])
    body += '<h3>Dimension-by-Dimension Analysis</h3>'
    for dim in dims:
        body += f'<h4>{dim}</h4>'
        for c in sorted(d["candidates"], key=lambda x: x["scores"][dim], reverse=True):
            body += svg_horizontal_bar(c["name"], c["scores"][dim], color=FUCHSIA if c["scores"][dim] >= 80 else INFO)
    body += f'<h3>LYC Analysis</h3><p>{d["lyc_analysis"]}</p>'
    body += build_callout(f'<strong>Recommendation:</strong> {d["recommendation"]}')
    return wrap_a4(body, title="Comparison Matrix", confidential=True)


D14_DATA = {
    "gap_analysis_meta": {"mandate_id": "MND-2026-0042", "role_title": "Chief Technology Officer", "pool_name": "Shortlist", "date": "2026-09-08", "candidates_assessed": 3},
    "role_requirements": {"dimensions": [{"name": "Strategic Vision", "required_level": 80, "weight": 25}, {"name": "Engineering Leadership", "required_level": 75, "weight": 25},
        {"name": "Technical Depth", "required_level": 70, "weight": 20}, {"name": "Stakeholder Influence", "required_level": 75, "weight": 15}, {"name": "Talent Development", "required_level": 65, "weight": 15}]},
    "pool_assessment": {"dimensions": [
        {"name": "Strategic Vision", "pool_average": 78, "pool_range": {"min": 70, "max": 88}, "gap_vs_requirement": -2, "gap_status": "partial"},
        {"name": "Engineering Leadership", "pool_average": 82, "pool_range": {"min": 74, "max": 90}, "gap_vs_requirement": 7, "gap_status": "exceeds"},
        {"name": "Technical Depth", "pool_average": 83, "pool_range": {"min": 78, "max": 92}, "gap_vs_requirement": 13, "gap_status": "exceeds"},
        {"name": "Stakeholder Influence", "pool_average": 75, "pool_range": {"min": 68, "max": 85}, "gap_vs_requirement": 0, "gap_status": "meets"},
        {"name": "Talent Development", "pool_average": 79, "pool_range": {"min": 74, "max": 88}, "gap_vs_requirement": 14, "gap_status": "exceeds"}
    ]},
    "candidate_breakdown": [
        {"name": "Alex Wang", "dimension_scores": {"Strategic Vision": 88, "Engineering Leadership": 82, "Technical Depth": 79, "Stakeholder Influence": 85, "Talent Development": 74}, "overall_match_pct": 87, "strongest_dimensions": ["Strategic Vision", "Stakeholder Influence"], "weakest_dimensions": ["Talent Development"]},
        {"name": "Lisa Zhang", "dimension_scores": {"Strategic Vision": 76, "Engineering Leadership": 90, "Technical Depth": 92, "Stakeholder Influence": 72, "Talent Development": 75}, "overall_match_pct": 82, "strongest_dimensions": ["Technical Depth", "Engineering Leadership"], "weakest_dimensions": ["Stakeholder Influence"]},
        {"name": "James Chen", "dimension_scores": {"Strategic Vision": 70, "Engineering Leadership": 74, "Technical Depth": 78, "Stakeholder Influence": 68, "Talent Development": 88}, "overall_match_pct": 76, "strongest_dimensions": ["Talent Development", "Technical Depth"], "weakest_dimensions": ["Stakeholder Influence"]}
    ],
    "insights": {"collective_strengths": ["Pool exceeds requirements in Engineering Leadership and Technical Depth", "Strong talent development capabilities across all candidates"],
                 "collective_gaps": ["Strategic Vision slightly below requirement — only Alex Wang exceeds threshold", "Stakeholder Influence meets but does not exceed requirement on average"],
                 "recommended_actions": ["Prioritize Alex Wang for strategic vision strength", "Consider coaching for stakeholder skills if Lisa Zhang selected"],
                 "development_opportunities": ["All candidates would benefit from executive communication coaching", "Team integration workshop recommended regardless of selection"]}
}

def gen_gap_analysis(d):
    gm = d["gap_analysis_meta"]; rr = d["role_requirements"]; pa = d["pool_assessment"]
    cover = build_cover("SKILLS & GAP<br>ANALYSIS", f"{gm['role_title']} — {gm['pool_name']} Pool",
                        [f"<strong>Candidates Assessed:</strong> {gm['candidates_assessed']}", f"<strong>Date:</strong> {gm['date']}"], status="CONFIDENTIAL")
    body1 = build_doc_header("Gap Analysis", gm["date"])
    body1 += f"<h2>Pool Overview</h2><p>{gm['candidates_assessed']} candidates assessed. Overall gap status shown below.</p>"
    # Radar: pool avg vs requirements
    dims = [d["name"] for d in pa["dimensions"]]
    pool_avgs = [d["pool_average"] for d in pa["dimensions"]]
    req_levels = [d["required_level"] for d in rr["dimensions"]]
    body1 += svg_radar(dims, pool_avgs, size=220, color=FUCHSIA)
    body1 += f'<p class=small>Fuchsia polygon = pool average | Grey = requirement level</p>'
    # Gap table
    body1 += '<table><tr><th>Dimension</th><th>Required</th><th>Pool Avg</th><th>Gap</th><th>Status</th></tr>'
    for pd in pa["dimensions"]:
        status_cls = {"exceeds": "badge-success", "meets": "badge-info", "partial": "badge-warning", "gap": "badge-danger"}.get(pd["gap_status"], "badge-neutral")
        body1 += f'<tr><td style="font-weight:600">{pd["name"]}</td><td>{pd["gap_vs_requirement"] + pd["pool_average"]}</td>'
        body1 += f'<td>{pd["pool_average"]}</td><td>{pd["gap_vs_requirement"]:+d}</td>'
        body1 += f'<td><span class="badge {status_cls}">{pd["gap_status"].upper()}</span></td></tr>'
    body1 += '</table>'
    # Candidate breakdown heatmap
    ins = d["insights"]
    body2 = build_doc_header("Insights & Recommendations", gm["date"])
    body2 += svg_heatmap(dims, [c["name"] for c in d["candidate_breakdown"]],
                         [[c["dimension_scores"][d] for d in dims] for c in d["candidate_breakdown"]])
    body2 += f'<h3>Collective Strengths</h3>{build_bullet_list(ins["collective_strengths"])}'
    body2 += f'<h3>Collective Gaps</h3>{build_bullet_list(ins["collective_gaps"])}'
    body2 += f'<h3>Recommended Actions</h3>{build_bullet_list(ins["recommended_actions"])}'
    body2 += f'<div class="callout"><strong>Development Opportunities:</strong><br>{"; ".join(ins["development_opportunities"])}</div>'
    return wrap_a4_multi([cover, body1, body2], title="Gap Analysis", confidential=True)


D16_DATA = {
    "prep_meta": {"mandate_id": "MND-2026-0042", "candidate_name": "Alex Wang", "role_title": "Chief Technology Officer", "interview_round": 1, "date_prepared": "2026-09-18"},
    "interview_logistics": {"date": "2026-09-22T10:00", "duration_minutes": 60, "format": "hybrid", "location": "Apex HQ, Conference Room A", "video_link": "https://meet.apextech.com/lyc", "dress_code": "Business professional", "what_to_bring": ["Portfolio/case examples", "Questions for the panel"]},
    "company_background": {"company_name": "Apex Technologies", "industry": "Cloud Computing", "size": "2,000+ employees", "culture": "Innovation-first, flat hierarchy, global exposure", "recent_news": ["Series C funding closed ($200M)", "New APAC data center launched", "Partnership with major enterprise client"], "key_products_services": ["Enterprise Cloud Platform", "AI Infrastructure Services", "Data Analytics Suite"]},
    "interviewer_profiles": [
        {"name": "David Liu", "title": "CEO", "background": "Former CTO at major tech company. 20+ years in enterprise software.", "interview_style": "Strategic and probing. Asks open-ended questions.", "likely_focus": "Vision alignment, leadership philosophy, cultural fit"},
        {"name": "Sarah Chen", "title": "CHRO", "background": "HR leader with 15 years in tech. Built HR function from scratch at Apex.", "interview_style": "Behavioral and empathetic. Focuses on real examples.", "likely_focus": "Team building, people development, values alignment"}
    ],
    "preparation_advice": {"key_talking_points": ["Your experience scaling Alibaba Cloud — emphasize the 3x growth story", "Your vision for AI in enterprise cloud — align with Apex's product direction", "Your approach to building engineering culture in high-growth environments"],
        "topics_to_emphasize": ["Strategic leadership at scale", "Cross-functional collaboration", "Innovation track record"],
        "topics_to_avoid": ["Compensation details (handled separately)", "Negative comments about current employer", "Specific client names from Alibaba"],
        "questions_to_prepare_for": ["Why Apex? What excites you about this role?", "How would you approach your first 90 days?", "Tell me about a time you failed and what you learned"],
        "questions_to_ask": ["What does success look like in this role at 12 months?", "How does the board view the technology function?", "What's the biggest challenge the technology team faces today?"]},
    "consultant_tips": "David values strategic clarity and directness. Sarah cares deeply about cultural fit and empathy. Be authentic — both interviewers can detect insincerity. The hybrid format means you'll be in the room with David while Sarah joins via video."
}

def gen_interview_prep_candidate(d):
    pm = d["prep_meta"]; il = d["interview_logistics"]
    cover = build_cover("INTERVIEW<br>PREPARATION", f"{pm['candidate_name']} — {pm['role_title']}",
                        [f"<strong>Interview Date:</strong> {il['date'][:10]}", f"<strong>Prepared by:</strong> Your LYC Consultant"], status="CONFIDENTIAL")
    body1 = build_doc_header("Interview Logistics", pm["date_prepared"])
    body1 += '<div class="stat-grid">'
    body1 += f'<div class="stat-card"><div class="stat-value" style="font-size:12pt">{il["date"][:16]}</div><div class="stat-label">Date & Time</div></div>'
    body1 += f'<div class="stat-card"><div class="stat-value">{il["duration_minutes"]}min</div><div class="stat-label">Duration</div></div>'
    body1 += f'<div class="stat-card"><div class="stat-value">{il["format"].title()}</div><div class="stat-label">Format</div></div>'
    body1 += '</div>'
    body1 += f'<p><strong>Location:</strong> {il["location"]}</p>'
    body1 += f'<p><strong>Dress Code:</strong> {il["dress_code"]}</p>'
    # Company background
    cb = d["company_background"]
    body2 = build_doc_header("About the Company", pm["date_prepared"])
    body2 += f"<h2>{cb['company_name']}</h2><p>{cb['culture']}</p>"
    body2 += '<p class=small>Industry: ' + cb['industry'] + ' | Size: ' + cb['size'] + '</p>'
    body2 += f"<h3>Recent Developments</h3>{build_bullet_list(cb['recent_news'])}"
    body2 += f"<h3>Key Products & Services</h3>{build_bullet_list(cb['key_products_services'])}"
    # Interviewers
    body2 += "<h2>Your Interviewers</h2>"
    for ip in d["interviewer_profiles"]:
        body2 += f'<div style="background:{GREY_100};border-radius:6px;padding:14px;margin:8px 0"><strong>{ip["name"]}</strong> — {ip["title"]}<br><span class=small>{ip["background"]}</span><br><span class=small><em>Style: {ip["interview_style"]}</em></span><br><span class=small>Likely focus: {ip["likely_focus"]}</span></div>'
    # Preparation
    pa = d["preparation_advice"]
    body3 = build_doc_header("Preparation Guide", pm["date_prepared"])
    body3 += "<h3>Key Talking Points</h3>" + build_bullet_list(pa["key_talking_points"])
    body3 += "<h3>Questions You May Face</h3>" + build_bullet_list(pa["questions_to_prepare_for"])
    body3 += "<h3>Smart Questions to Ask</h3>" + build_bullet_list(pa["questions_to_ask"])
    body3 += f'<div class="callout"><strong>Topics to Emphasize:</strong> {", ".join(pa["topics_to_emphasize"])}</div>'
    body3 += f'<div class="callout"><strong>Topics to Avoid:</strong> {", ".join(pa["topics_to_avoid"])}</div>'
    body3 += f'<h3>Tips From Your Consultant</h3><p>{d["consultant_tips"]}</p>'
    return wrap_a4_multi([cover, body1, body2, body3], title="Interview Prep — Candidate", confidential=True)


D17_DATA = {
    "schedule_meta": {"mandate_id": "MND-2026-0042", "candidate_name": "Alex Wang", "role_title": "Chief Technology Officer", "interview_date": "2026-09-22"},
    "schedule": [
        {"time_start": "10:00", "time_end": "10:10", "session_type": "interview", "interviewer": "Reception", "interviewer_title": "Welcome", "focus_area": "Building access, refreshments", "location": "Lobby", "format": "in-person", "notes": "Security badge will be ready"},
        {"time_start": "10:10", "time_end": "11:00", "session_type": "interview", "interviewer": "David Liu", "interviewer_title": "CEO", "focus_area": "Strategic vision & leadership", "location": "Conference Room A", "format": "in-person", "notes": "Main interview"},
        {"time_start": "11:00", "time_end": "11:10", "session_type": "break", "interviewer": "", "interviewer_title": "", "focus_area": "", "location": "Break area", "format": "", "notes": "Short break"},
        {"time_start": "11:10", "time_end": "11:50", "session_type": "interview", "interviewer": "Sarah Chen", "interviewer_title": "CHRO", "focus_area": "Cultural fit & team leadership", "location": "Conference Room A", "format": "hybrid", "notes": "Sarah joins via video"},
        {"time_start": "11:50", "time_end": "12:00", "session_type": "interview", "interviewer": "Kevin Hong", "interviewer_title": "LYC Consultant", "focus_area": "Debrief & next steps", "location": "Conference Room A", "format": "in-person", "notes": "Quick debrief"}
    ],
    "contacts": [{"name": "Kevin Hong", "role": "LYC Consultant", "phone": "+86 21 5888 0000", "email": "kevin@lyc-partners.ai"}, {"name": "Emily Zhang", "role": "Client Coordinator", "phone": "+86 21 6888 0001", "email": "emily@apextech.com"}],
    "logistics_notes": "Parking available in basement B1. Visitor entrance on the east side of the building. Please arrive 10 minutes early for security processing."
}

def gen_interview_schedule(d):
    sm = d["schedule_meta"]
    body = build_doc_header("Interview Schedule", sm["interview_date"])
    body += f"<h2>{sm['candidate_name']} — {sm['role_title']}</h2>"
    body += f'<p class=small>Date: {sm['interview_date']}</p>'
    body += '<table><tr><th>Time</th><th>Session</th><th>Interviewer</th><th>Location</th><th>Notes</th></tr>'
    for s in d["schedule"]:
        type_cls = {"interview": "badge-info", "break": "badge-neutral", "panel": "badge-fuchsia", "assessment": "badge-warning"}.get(s["session_type"], "badge-neutral")
        body += f'<tr><td>{s["time_start"]}–{s["time_end"]}</td><td><span class="badge {type_cls}">{s["session_type"].title()}</span></td>'
        body += f'<td>{s["interviewer"]}</td><td>{s["location"]}</td><td class=small>{s["notes"]}</td></tr>'
    body += '</table>'
    body += "<h3>Contacts</h3>"
    for c in d["contacts"]:
        body += f'<p><strong>{c["name"]}</strong> — {c["role"]} | {c["phone"]} | {c["email"]}</p>'
    body += f'<div class="callout"><strong>Logistics:</strong> {d["logistics_notes"]}</div>'
    return wrap_a4(body, title="Interview Schedule")


def generate_all(output_dir="business_docs"):
    os.makedirs(output_dir, exist_ok=True)
    docs = [
        ("D12_Shortlist_Presentation", gen_shortlist_presentation, D12_DATA),
        ("D13_Comparison_Matrix", gen_comparison_matrix, D13_DATA),
        ("D14_Gap_Analysis", gen_gap_analysis, D14_DATA),
        ("D16_Interview_Prep_Candidate", gen_interview_prep_candidate, D16_DATA),
        ("D17_Interview_Schedule", gen_interview_schedule, D17_DATA),
    ]
    for name, fn, data in docs:
        html = fn(data)
        path = os.path.join(output_dir, f"{name}.html")
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"  {name}: {len(html)//1024}KB")
    return len(docs)

if __name__ == "__main__":
    print("Missing batch 1: D12-D14, D16-D17")
    n = generate_all()
    print(f"  {n} documents generated.")
