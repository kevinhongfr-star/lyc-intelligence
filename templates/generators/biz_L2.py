"""L2: Mandate Kick-Off Documents — D06 through D10"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from lyc_business_components import *

# ── D06: Mandate Kick-Off Brief ───────────────────────────────
D06_DATA = {
    "mandate_meta": {"mandate_id": "MND-2026-0042", "role_title": "Chief Technology Officer",
                     "client_company": "Apex Technologies", "department": "Technology",
                     "reporting_to": "CEO", "location": "Shanghai, China", "priority": "P0",
                     "kick_off_date": "2026-07-20", "target_shortlist_date": "2026-08-17",
                     "target_close_date": "2026-10-12", "lead_consultant": "Kevin Hong",
                     "research_lead": "Marcus Wei"},
    "role_context": {"business_challenge": "Scaling technology organization to support 3x revenue growth target over 3 years",
                     "why_this_role_now": "Current CTO transitioning to advisory role; company entering rapid growth phase",
                     "predecessor_situation": "promotion", "team_size": 85,
                     "budget_responsibility": "¥45M annual technology budget",
                     "key_stakeholders": ["CEO", "CFO", "VP Engineering", "VP Product", "Board Technology Committee"]},
    "competency_model": {"must_have": [
        {"competency": "Strategic Technology Leadership", "evidence": "Led org of 100+ engineers through significant growth"},
        {"competency": "Digital Transformation", "evidence": "Drove platform modernization or cloud migration"},
        {"competency": "Stakeholder Management", "evidence": "Board-level presentation and influencing experience"}
    ], "nice_to_have": [
        {"competency": "APAC Market Experience", "note": "Experience building teams across China, SEA, Japan"},
        {"competency": "AI/ML Strategy", "note": "Hands-on experience deploying AI at scale"}
    ], "deal_breakers": ["No engineering management experience", "Only startup background without scale"]},
    "market_strategy": {"target_companies": ["Alibaba Cloud", "Tencent Cloud", "ByteDance", "Huawei", "JD Technology", "Meituan"],
                        "target_industries": ["Cloud Computing", "SaaS", "Enterprise Tech"],
                        "geographic_scope": "Greater China + APAC",
                        "compensation_benchmark": {"base_range": "¥1.5M - 2.0M", "total_comp_range": "¥2.5M - 3.5M", "market_percentile": "75th"},
                        "talent_pool_estimate": 40, "search_approach": "mapped"},
    "process_plan": {"interview_rounds": 3, "interview_format": "hybrid",
                     "decision_makers": ["CEO", "CHRO", "Board Technology Committee Chair"],
                     "assessment_requirements": ["LEAP", "DRIVE"],
                     "timeline_milestones": [
                         {"phase": "Market Mapping", "target_date": "2026-08-03"},
                         {"phase": "Initial Outreach", "target_date": "2026-08-10"},
                         {"phase": "Assessment Phase", "target_date": "2026-08-24"},
                         {"phase": "Shortlist Delivery", "target_date": "2026-09-07"},
                         {"phase": "Client Interviews", "target_date": "2026-09-28"},
                         {"phase": "Final Decision", "target_date": "2026-10-12"}
                     ]}
}

def gen_mandate_brief(d):
    mm = d["mandate_meta"]
    cover = build_cover(f"MANDATE BRIEF<br>{mm['role_title']}", mm["client_company"],
                        [f"<strong>Mandate ID:</strong> {mm['mandate_id']}", f"<strong>Date:</strong> {mm['kick_off_date']}",
                         f"<strong>Priority:</strong> {mm['priority']}", f"<strong>Lead:</strong> {mm['lead_consultant']}"])
    rc = d["role_context"]
    body1 = build_doc_header("Role Context", mm["kick_off_date"])
    body1 += f"""<h2>Business Challenge</h2><p>{rc['business_challenge']}</p>
    <h3>Why This Role Now</h3><p>{rc['why_this_role_now']}</p>
    <div class="stat-grid">
        <div class="stat-card"><div class="stat-value">{rc['team_size']}</div><div class="stat-label">Team Size</div></div>
        <div class="stat-card"><div class="stat-value" style="font-size:14pt">{rc['budget_responsibility']}</div><div class="stat-label">Budget</div></div>
        <div class="stat-card"><div class="stat-value">{mm['reporting_to']}</div><div class="stat-label">Reports To</div></div>
    </div>
    <h3>Key Stakeholders</h3>{build_bullet_list(rc['key_stakeholders'])}"""
    # Competency model
    cm = d["competency_model"]
    body2 = build_doc_header("Competency Model", mm["kick_off_date"])
    body2 += "<h2>Must-Have Competencies</h2>"
    body2 += '<table><tr><th>Competency</th><th>Evidence Required</th></tr>'
    for c in cm["must_have"]:
        body2 += f'<tr><td style="font-weight:600">{c["competency"]}</td><td>{c["evidence"]}</td></tr>'
    body2 += "</table>"
    body2 += "<h3>Nice-to-Have</h3>"
    for c in cm["nice_to_have"]:
        body2 += f'<p><strong>{c["competency"]}</strong> — {c["note"]}</p>'
    body2 += f'<div class="callout"><strong>Deal-Breakers:</strong> {"; ".join(cm["deal_breakers"])}</div>'
    # Market strategy
    ms = d["market_strategy"]
    cb = ms["compensation_benchmark"]
    body3 = build_doc_header("Market Strategy", mm["kick_off_date"])
    body3 += "<h2>Target Companies</h2>"
    body3 += build_bullet_list(ms["target_companies"])
    body3 += f"<h3>Target Industries</h3><p>{', '.join(ms['target_industries'])}</p>"
    body3 += f"""<h3>Compensation Benchmark</h3>
    <div class="stat-grid">
        <div class="stat-card"><div class="stat-value" style="font-size:13pt">{cb['base_range']}</div><div class="stat-label">Base Range</div></div>
        <div class="stat-card"><div class="stat-value" style="font-size:13pt">{cb['total_comp_range']}</div><div class="stat-label">Total Comp</div></div>
        <div class="stat-card"><div class="stat-value">{cb['market_percentile']}</div><div class="stat-label">Target Percentile</div></div>
    </div>
    <p><strong>Estimated Talent Pool:</strong> ~{ms['talent_pool_estimate']} qualified candidates</p>
    <p><strong>Search Approach:</strong> {ms['search_approach'].title()}</p>"""
    # Timeline
    pp = d["process_plan"]
    body4 = build_doc_header("Process & Timeline", mm["kick_off_date"])
    body4 += "<h2>Interview Process</h2>"
    body4 += f"<p><strong>Rounds:</strong> {pp['interview_rounds']} | <strong>Format:</strong> {pp['interview_format'].title()}</p>"
    body4 += f"<p><strong>Decision Makers:</strong> {', '.join(pp['decision_makers'])}</p>"
    body4 += f"<p><strong>Assessments:</strong> {', '.join(pp['assessment_requirements'])}</p>"
    body4 += "<h3>Timeline Milestones</h3>"
    body4 += build_timeline_table(pp["timeline_milestones"])
    return wrap_a4_multi([cover, body1, body2, body3, body4], title=f"Mandate Brief - {mm['role_title']}", confidential=True)


# ── D07: Job Description ──────────────────────────────────────
D07_DATA = {
    "jd_meta": {"mandate_id": "MND-2026-0042", "role_title": "Chief Technology Officer",
                "client_company": "Apex Technologies", "location": "Shanghai, China",
                "employment_type": "full-time", "date_published": "2026-07-20", "language": "en", "version": "1.0"},
    "about_company": {"description": "Apex Technologies is a leading cloud infrastructure company serving 5,000+ enterprise clients across APAC with a mission to democratize enterprise AI.",
                      "industry": "Cloud Computing", "size": "2,000+ employees",
                      "culture_highlights": ["Innovation-first culture", "Flat organizational structure", "Global exposure"], "website": "www.apextech.com"},
    "role_summary": "As CTO, you will lead our 85-person engineering organization through a period of rapid growth. You will define our technology strategy, build world-class teams, and drive the platform evolution that enables 3x revenue growth.",
    "key_responsibilities": ["Define and execute technology strategy aligned with business objectives",
        "Lead, mentor, and scale the engineering organization from 85 to 200+ engineers",
        "Drive platform modernization including cloud-native migration and AI integration",
        "Establish engineering excellence practices including CI/CD, observability, and security",
        "Partner with Product and Business teams to deliver customer value",
        "Represent technology function at board level and with key enterprise clients",
        "Build and maintain technical partnerships with leading cloud and AI providers",
        "Manage ¥45M annual technology budget with focus on ROI optimization"],
    "requirements": {"must_have": ["15+ years in technology leadership with 5+ years at VP/CTO level",
        "Proven experience scaling engineering organizations through hypergrowth",
        "Deep expertise in cloud platforms (AWS/Azure/GCP) and distributed systems",
        "Track record of successful digital transformation in enterprise environments",
        "Fluent in English and Mandarin"],
        "preferred": ["Experience in cloud computing or SaaS industry",
            "APAC technology leadership experience across multiple markets",
            "MBA or advanced technical degree",
            "Public speaking or thought leadership presence"]},
    "compensation": {"range_display": "¥2.5M - 3.5M total compensation",
                     "benefits_summary": ["Executive health coverage", "Equity participation", "Relocation support", "Board exposure"]},
    "application_process": {"steps": ["Submit application through LYC portal", "Initial screening call with LYC consultant",
                                      "Technical leadership assessment (LEAP)", "Client interview rounds"], "contact": "kevin@lyc-partners.ai", "deadline": "2026-08-31"},
    "branding": {"show_client_name": True, "show_lyc_branding": True, "co_brand": True}
}

def gen_job_description(d):
    jd = d["jd_meta"]
    ac = d["about_company"]
    body = build_doc_header("Job Description", jd["date_published"])
    body += f'<h2 style="font-size:20pt">{jd["role_title"]}</h2>'
    body += f'<p style="font-size:11pt;color:{GREY_600}">{jd["client_company"]} | {jd["location"]} | {jd["employment_type"].replace("-"," ").title()}</p>'
    body += f'<h3>About {ac["company_name"] if "company_name" in ac else jd["client_company"]}</h3><p>{ac["description"]}</p>'
    body += f'<p class=small>Industry: {ac["industry"]} | Size: {ac["size"]} | Culture: {", ".join(ac["culture_highlights"])}</p>'
    body += f'<h3>Role Summary</h3><p>{d["role_summary"]}</p>'
    body += '<h3>Key Responsibilities</h3>' + build_bullet_list(d["key_responsibilities"])
    body += '<h3>Requirements</h3><h4>Must Have</h4>' + build_bullet_list(d["requirements"]["must_have"])
    body += '<h4>Preferred</h4>' + build_bullet_list(d["requirements"]["preferred"])
    body += f'<h3>What We Offer</h3><p><strong>Compensation:</strong> {d["compensation"]["range_display"]}</p>'
    body += build_bullet_list(d["compensation"]["benefits_summary"])
    body += f'<h3>How to Apply</h3><p>Contact: {d["application_process"]["contact"]}<br>Deadline: {d["application_process"]["deadline"]}</p>'
    body += build_bullet_list(d["application_process"]["steps"])
    return wrap_a4(body, title=f"JD - {jd['role_title']}")


# ── D08: Role Specification ───────────────────────────────────
D08_DATA = {
    "role_spec_meta": {"mandate_id": "MND-2026-0042", "role_title": "Chief Technology Officer", "date": "2026-07-20", "version": "1.0"},
    "competency_framework": {"dimensions": [
        {"name": "Strategic Vision", "weight_pct": 25, "indicators": [
            {"level": "basic", "description": "Executes defined strategy"}, {"level": "expert", "description": "Defines and communicates multi-year tech vision"}],
         "assessment_instrument": "LEAP", "interview_focus_area": "How have you shaped technology direction at scale?"},
        {"name": "Engineering Leadership", "weight_pct": 25, "indicators": [
            {"level": "basic", "description": "Manages team effectively"}, {"level": "expert", "description": "Builds and scales world-class engineering culture"}],
         "assessment_instrument": "DRIVE", "interview_focus_area": "Tell us about scaling your team through hypergrowth"},
        {"name": "Technical Depth", "weight_pct": 20, "indicators": [
            {"level": "basic", "description": "Understands core technologies"}, {"level": "expert", "description": "Drives architecture decisions and innovation"}],
         "assessment_instrument": "LEAP", "interview_focus_area": "Walk us through a complex technical decision"},
        {"name": "Stakeholder Influence", "weight_pct": 15, "indicators": [
            {"level": "basic", "description": "Communicates effectively"}, {"level": "expert", "description": "Influences board and C-suite consistently"}],
         "assessment_instrument": None, "interview_focus_area": "How do you handle conflicting priorities from the board?"},
        {"name": "Talent Development", "weight_pct": 15, "indicators": [
            {"level": "basic", "description": "Hires well"}, {"level": "expert", "description": "Creates leaders and builds talent pipelines"}],
         "assessment_instrument": "DRIVE", "interview_focus_area": "Give examples of leaders you developed"}
    ]},
    "ideal_candidate_profile": {"experience_summary": "15+ years with 5+ at CTO/VP level in high-growth technology companies",
                                "industry_background": ["Cloud Computing", "SaaS", "Enterprise Tech"],
                                "functional_expertise": ["Platform Engineering", "AI/ML", "Cloud Architecture", "Security"],
                                "leadership_style": "Collaborative, data-driven, empowers teams to own outcomes",
                                "cultural_fit_notes": "Values transparency, intellectual honesty, and continuous learning",
                                "potential_red_flags": ["Micromanagement tendencies", "Resistance to delegation", "Limited board exposure"]},
    "scoring_rubric": {"minimum_threshold": 50, "shortlist_threshold": 70, "weighting_notes": "Strategic Vision and Engineering Leadership carry highest weight — candidates must score 70+ in at least one of these"}
}

def gen_role_spec(d):
    rs = d["role_spec_meta"]
    cf = d["competency_framework"]
    cover = build_cover(f"ROLE SPECIFICATION<br>{rs['role_title']}", "Competency Framework & Evaluation Guide",
                        [f"<strong>Mandate:</strong> {rs['mandate_id']}", f"<strong>Date:</strong> {rs['date']}"])
    # Radar chart of weights
    dims = [d["name"] for d in cf["dimensions"]]
    weights = [d["weight_pct"] for d in cf["dimensions"]]
    radar = svg_radar(dims, weights, size=240)
    body1 = build_doc_header("Competency Framework", rs["date"])
    body1 += f"<h2>Dimension Weights</h2>{radar}"
    body1 += '<table><tr><th>Dimension</th><th>Weight</th><th>Assessment</th><th>Interview Focus</th></tr>'
    for dim in cf["dimensions"]:
        body1 += f'<tr><td style="font-weight:600">{dim["name"]}</td><td>{dim["weight_pct"]}%</td>'
        body1 += f'<td>{dim["assessment_instrument"] or "—"}</td><td class=small>{dim["interview_focus_area"]}</td></tr>'
    body1 += "</table>"
    # Ideal profile
    ic = d["ideal_candidate_profile"]
    body2 = build_doc_header("Ideal Candidate Profile", rs["date"])
    body2 += f"<h2>Profile Overview</h2><p>{ic['experience_summary']}</p>"
    body2 += f"<p><strong>Industry:</strong> {', '.join(ic['industry_background'])}</p>"
    body2 += f"<p><strong>Functional Expertise:</strong> {', '.join(ic['functional_expertise'])}</p>"
    body2 += f"<p><strong>Leadership Style:</strong> {ic['leadership_style']}</p>"
    body2 += f"<p><strong>Cultural Fit:</strong> {ic['cultural_fit_notes']}</p>"
    body2 += f'<div class="callout"><strong>Red Flags:</strong> {"; ".join(ic["potential_red_flags"])}</div>'
    # Scoring rubric
    sr = d["scoring_rubric"]
    body2 += f"""<h3>Evaluation Rubric</h3>
    <div class="stat-grid">
        <div class="stat-card"><div class="stat-value">{sr['minimum_threshold']}</div><div class="stat-label">Minimum Threshold</div></div>
        <div class="stat-card"><div class="stat-value">{sr['shortlist_threshold']}</div><div class="stat-label">Shortlist Threshold</div></div>
    </div>
    <p class=small>{sr['weighting_notes']}</p>"""
    return wrap_a4_multi([cover, body1, body2], title=f"Role Spec - {rs['role_title']}", confidential=True)


# ── D09: Target Company List ──────────────────────────────────
D09_DATA = {
    "target_meta": {"mandate_id": "MND-2026-0042", "role_title": "Chief Technology Officer", "date": "2026-07-22", "total_targets": 12},
    "companies": [
        {"name": "Alibaba Cloud", "industry": "Cloud Computing", "size": "50,000+", "relevance": "Direct competitor, strong CTO bench",
         "potential_candidates": ["VP Engineering", "Senior Director Infrastructure", "Head of AI Platform"], "priority": "Tier 1"},
        {"name": "Tencent Cloud", "industry": "Cloud Computing", "size": "30,000+", "relevance": "Enterprise cloud transformation experience",
         "potential_candidates": ["CTO Division", "VP Cloud Products"], "priority": "Tier 1"},
        {"name": "ByteDance", "industry": "Technology", "size": "110,000+", "relevance": "Engineering scale, AI/ML leadership",
         "potential_candidates": ["Engineering Director", "Head of Infrastructure"], "priority": "Tier 1"},
        {"name": "Huawei Cloud", "industry": "Enterprise Tech", "size": "25,000+", "relevance": "Enterprise cloud + global expansion",
         "potential_candidates": ["VP Cloud BU", "Chief Architect"], "priority": "Tier 2"},
        {"name": "JD Technology", "industry": "E-Commerce Tech", "size": "15,000+", "relevance": "Supply chain tech leadership",
         "potential_candidates": ["CTO", "VP Engineering"], "priority": "Tier 2"}
    ]
}

def gen_target_companies(d):
    tm = d["target_meta"]
    body = build_doc_header("Target Company List", tm["date"])
    body += f"<h2>Target Companies ({tm['total_targets']} identified)</h2>"
    body += '<table><tr><th>Company</th><th>Industry</th><th>Size</th><th>Relevance</th><th>Priority</th></tr>'
    for c in d["companies"]:
        tier_cls = "badge-fuchsia" if c["priority"] == "Tier 1" else "badge-info"
        body += f'<tr><td style="font-weight:600">{c["name"]}</td><td>{c["industry"]}</td><td>{c["size"]}</td>'
        body += f'<td class=small>{c["relevance"]}</td><td><span class="badge {tier_cls}">{c["priority"]}</span></td></tr>'
    body += "</table>"
    for c in d["companies"]:
        body += f'<h4>{c["name"]}</h4><p class=small>Potential candidates: {", ".join(c["potential_candidates"])}</p>'
    return wrap_a4(body, title="Target Company List", confidential=True)


# ── D10: Market Approach Plan ─────────────────────────────────
D10_DATA = {
    "approach_meta": {"mandate_id": "MND-2026-0042", "role_title": "Chief Technology Officer", "date": "2026-07-22"},
    "market_analysis": {"total_addressable_talent": 200, "active_candidates_estimate": 35, "passive_candidates_estimate": 165,
                        "supply_demand_ratio": "1:4", "market_competitiveness": "high"},
    "sourcing_strategy": {"primary_channels": ["Direct mapping", "Industry networks", "Council referrals", "LinkedIn targeted outreach"],
                          "outreach_approach": "Personalized approach emphasizing role impact and growth trajectory",
                          "messaging_themes": ["Transformational leadership opportunity", "Board-level exposure", "APAC-wide scope", "AI-first strategy"],
                          "differentiators_for_candidates": ["CEO partnership model", "Clear growth path to board", "Competitive compensation + equity"]},
    "risk_assessment": {"key_risks": [
        {"risk": "Limited active candidates", "mitigation": "Focus on passive talent through warm introductions"},
        {"risk": "Counter-offer risk from current employers", "mitigation": "Emphasize unique aspects of the opportunity"}
    ], "timeline_risk": "moderate", "compensation_risk": "low"},
    "recommended_timeline": [
        {"phase": "Research & Mapping", "duration_weeks": 2, "key_activities": ["Market sizing", "Target company mapping", "Candidate identification"]},
        {"phase": "Outreach", "duration_weeks": 3, "key_activities": ["Initial contact", "Qualification calls", "Assessment scheduling"]},
        {"phase": "Assessment", "duration_weeks": 2, "key_activities": ["LEAP assessment", "Deep-dive interviews", "Reference checks"]},
        {"phase": "Shortlist & Present", "duration_weeks": 1, "key_activities": ["Shortlist compilation", "Client presentation", "Interview scheduling"]}
    ]
}

def gen_market_approach(d):
    am = d["approach_meta"]
    ma = d["market_analysis"]
    body = build_doc_header("Market Approach Plan", am["date"])
    body += f"<h2>Market Analysis</h2>"
    body += build_stat_cards([
        {"value": ma["total_addressable_talent"], "label": "Total Talent Pool"},
        {"value": ma["active_candidates_estimate"], "label": "Active Candidates"},
        {"value": ma["passive_candidates_estimate"], "label": "Passive Candidates"},
        {"value": ma["supply_demand_ratio"], "label": "Supply:Demand"},
    ])
    body += f'<p><strong>Market Competitiveness:</strong> <span class="badge badge-warning">{ma["market_competitiveness"].upper()}</span></p>'
    # Sourcing
    ss = d["sourcing_strategy"]
    body += "<h2>Sourcing Strategy</h2>"
    body += f"<p><strong>Channels:</strong> {', '.join(ss['primary_channels'])}</p>"
    body += f"<p><strong>Approach:</strong> {ss['outreach_approach']}</p>"
    body += f"<h3>Key Messaging Themes</h3>{build_bullet_list(ss['messaging_themes'])}"
    body += f"<h3>Candidate Value Proposition</h3>{build_bullet_list(ss['differentiators_for_candidates'])}"
    # Risks
    ra = d["risk_assessment"]
    body += "<h2>Risk Assessment</h2>"
    body += '<table><tr><th>Risk</th><th>Mitigation</th></tr>'
    for r in ra["key_risks"]:
        body += f'<tr><td style="font-weight:600">{r["risk"]}</td><td>{r["mitigation"]}</td></tr>'
    body += "</table>"
    body += f'<p><strong>Timeline Risk:</strong> <span class="badge badge-warning">{ra["timeline_risk"].upper()}</span> | <strong>Compensation Risk:</strong> <span class="badge badge-success">{ra["compensation_risk"].upper()}</span></p>'
    # Timeline
    body += "<h3>Recommended Timeline</h3>"
    body += build_timeline_table([{"phase": f'{t["phase"]} ({t["duration_weeks"]}w)', "date": f'Week {sum(x["duration_weeks"] for x in d["recommended_timeline"][:i])+1}', "status": "planned"} for i, t in enumerate(d["recommended_timeline"])])
    return wrap_a4(body, title="Market Approach Plan", confidential=True)


# ── Generator ─────────────────────────────────────────────────
def generate_all(output_dir="business_docs"):
    os.makedirs(output_dir, exist_ok=True)
    docs = [
        ("D06_Mandate_Brief", gen_mandate_brief, D06_DATA),
        ("D07_Job_Description", gen_job_description, D07_DATA),
        ("D08_Role_Specification", gen_role_spec, D08_DATA),
        ("D09_Target_Companies", gen_target_companies, D09_DATA),
        ("D10_Market_Approach", gen_market_approach, D10_DATA),
    ]
    for name, fn, data in docs:
        html = fn(data)
        path = os.path.join(output_dir, f"{name}.html")
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"  {name}: {len(html)//1024}KB")
    return len(docs)

if __name__ == "__main__":
    print("L2: Mandate Kick-Off Documents")
    n = generate_all()
    print(f"  {n} documents generated.")
