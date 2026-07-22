"""Final missing batch: remaining document types"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from lyc_business_components import *

def gen_simple_a4(title, subtitle, date, sections, confidential=False):
    """Generic A4 document generator for simpler document types"""
    cover = build_cover(title, subtitle, [f"<strong>Date:</strong> {date}"], status="CONFIDENTIAL" if confidential else None)
    pages = [cover]
    for sec_title, sec_content in sections:
        pg = build_doc_header(sec_title, date)
        pg += sec_content
        pages.append(pg)
    return wrap_a4_multi(pages, title=title, confidential=confidential)

def gen_simple_email(subject, body_html):
    return wrap_email(body_html, subject=subject)

# D18: Interview Question Framework
def gen_d18():
    secs = [("Question Sets",
        "<h2>Competency: Strategic Vision (25%)</h2>"
        "<p><strong>Q1:</strong> Describe how you shaped technology strategy at your current organization.</p>"
        "<p class=small>Type: Behavioral | Look for: Clear strategic thinking, market awareness</p>"
        "<p><strong>Q2:</strong> If you discovered our tech stack needs a complete overhaul, how would you approach it?</p>"
        "<p class=small>Type: Situational | Look for: Structured approach, stakeholder consideration</p>"
        "<h2>Competency: Engineering Leadership (25%)</h2>"
        "<p><strong>Q3:</strong> Tell us about scaling your engineering team through rapid growth.</p>"
        "<p class=small>Type: Behavioral | Look for: Hiring strategy, culture maintenance</p>"
    )]
    return gen_simple_a4("INTERVIEW QUESTION<br>FRAMEWORK", "CTO - Competency-Aligned Question Bank", "2026-09-01", secs, True)


# D20: Interview Feedback Form
def gen_d20():
    body = build_doc_header("Interview Feedback Form", "2026-09-22")
    body += """<h2>Candidate: Alex Wang | Interviewer: ____________</h2>
<table><tr><th>Dimension</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th></tr>
<tr><td>Strategic Vision</td><td>○</td><td>○</td><td>○</td><td>○</td><td>○</td></tr>
<tr><td>Technical Leadership</td><td>○</td><td>○</td><td>○</td><td>○</td><td>○</td></tr>
<tr><td>Stakeholder Management</td><td>○</td><td>○</td><td>○</td><td>○</td><td>○</td></tr>
<tr><td>Cultural Fit</td><td>○</td><td>○</td><td>○</td><td>○</td><td>○</td></tr></table>
<h3>Overall Recommendation</h3>
<p>○ Strong Yes &nbsp; ○ Yes &nbsp; ○ Maybe &nbsp; ○ No &nbsp; ○ Strong No</p>
<h3>Key Strengths Observed</h3><p style="border-bottom:1px solid #E5E7EB;height:40px"></p>
<h3>Concerns</h3><p style="border-bottom:1px solid #E5E7EB;height:40px"></p>
<h3>Additional Comments</h3><p style="border-bottom:1px solid #E5E7EB;height:60px"></p>"""
    return wrap_a4(body, title="Interview Feedback Form")

# D23: Reference Check Summary
def gen_d23():
    body = build_doc_header("Reference Check Summary", "2026-09-28")
    body += """<h2>Alex Wang — Reference Summary</h2>
<p><span class="badge badge-success">LOW RISK</span></p>
<div style="background:#F3F4F6;border-radius:6px;padding:14px;margin:10px 0">
<strong>Referee 1:</strong> Former VP at Alibaba Cloud (direct report)<br>
<em>Relationship: 5 years, reported to Alex</em><br>
<strong>Key Quote:</strong> "Alex is the most inspiring leader I've worked with. He builds trust through transparency and empowers his team to take ownership."</p>
Strengths confirmed: Strategic vision, team building, technical credibility
</div>
<div style="background:#F3F4F6;border-radius:6px;padding:14px;margin:10px 0">
<strong>Referee 2:</strong> CTO peer at industry consortium<br>
<em>Relationship: 3 years, professional collaboration</em><br>
<strong>Key Quote:</strong> "Exceptional at connecting technology strategy to business outcomes. One of the best CTO-caliber leaders in the market."</p>
Strengths confirmed: Strategic thinking, stakeholder management
</div>
<div class="callout"><strong>Assessment:</strong> Both references strongly validate Alex's strengths. No concerns raised. Recommend proceeding.</div>"""
    return wrap_a4(body, title="Reference Check Summary", confidential=True)

# D29: Next Step Recap — Consultant (Internal)
def gen_d29():
    body = gen_simple_email("Internal Note — MND-2026-0042", """
<p><strong>Interaction:</strong> Client alignment meeting (2026-09-10)</p>
<h3>Action Items</h3>
<div class="action-item"><span class="tag tag-lyc">P0</span> Send interview invitations — due 2026-09-15</div>
<div class="action-item"><span class="tag tag-lyc">P1</span> Prepare interview prep guides — due 2026-09-18</div>
<div class="action-item"><span class="tag tag-lyc">P1</span> Check non-Alibaba references — due 2026-09-20</div>
<h3>Follow-Up Dates</h3>
<p>2026-09-15 — Confirm interview slots | 2026-09-22 — Interview day debrief</p>
<p class=small>Internal note: David (CEO) is strongly favoring Alex Wang. Manage expectations — ensure Lisa Zhang also gets fair consideration.</p>""")
    return body

# D32: Onboarding Guide — Client
def gen_d32():
    secs = [
        ("Pre-Start Checklist", """<h2>Before Day 1</h2>""" + build_bullet_list([
            "IT access and equipment setup", "Team announcement email draft", "First week calendar setup with key meetings",
            "Buddy/mentor assignment", "Building access and parking", "Welcome package preparation"])),
        ("First 30 Days", """<h2>Week 1</h2>""" + build_bullet_list([
            "Day 1: Welcome, team introductions, setup", "Day 2-3: Key stakeholder meetings", "Day 4-5: Initial assessment and listening tour",
            "Week 2: Deep dive into current projects", "Week 3: Initial observations and quick wins", "Week 4: First team meeting and direction setting"]) +
        """<h2>30-Day Check-In</h2><p>Scheduled review at end of Week 4 to assess integration progress.</p>"""),
        ("First 90 Days", """<h2>Success Criteria</h2>""" + build_bullet_list([
            "Established relationships with all key stakeholders", "Completed technology landscape assessment",
            "Identified 3 quick wins for the engineering team", "Set 6-month technology roadmap direction"]))
    ]
    return gen_simple_a4("ONBOARDING GUIDE", "Client — Alex Wang, CTO", "2026-10-15", secs)

# D33: Onboarding Guide — Candidate
def gen_d33():
    secs = [("Before You Start", build_bullet_list(["Review Apex's latest product releases and earnings", "Prepare questions for your first team meeting",
        "Think about your 30-60-90 day priorities", "Set up any personal logistics (commute, parking)"])),
        ("First 30 Days Tips", build_bullet_list(["Listen more than you speak in the first 2 weeks", "Schedule 1:1s with all direct reports within Week 1",
        "Identify a quick win to build credibility", "Build relationship with your CEO early"])),
        ("LYC Support", """<p>Your LYC consultant remains available throughout your onboarding period.</p>""" +
        build_bullet_list(["Confidential check-in calls at Week 2, 4, 8, 12", "On-demand advice for tricky situations",
        "Executive coaching referral if needed"]))]
    return gen_simple_a4("PREPARING FOR YOUR<br>NEW ROLE", "Alex Wang — Chief Technology Officer", "2026-10-15", secs)

# D34: Guarantee Tracking
def gen_d34():
    body = build_doc_header("Guarantee Period Tracking", "2026-11-01")
    body += """<h2>Alex Wang — CTO at Apex Technologies</h2>
<p>Guarantee Period: 2026-11-01 to 2027-05-01 (6 months)</p>
<table><tr><th>Week</th><th>Date</th><th>Check-In</th><th>Status</th><th>Notes</th></tr>
<tr><td>1</td><td>2026-11-08</td><td>Candidate + Client</td><td><span class="badge badge-success">Smooth</span></td><td class=small>Settling in well. Team rapport strong.</td></tr>
<tr><td>4</td><td>2026-11-29</td><td>Joint Review</td><td><span class="badge badge-success">Smooth</span></td><td class=small>First quick wins identified. On track.</td></tr>
<tr><td>8</td><td>2026-12-27</td><td>Candidate Check-In</td><td><span class="badge badge-warning">Minor Concern</span></td><td class=small>Adjusting to slower decision-making. Coaching provided.</td></tr>
<tr><td>12</td><td>2027-01-24</td><td>Client + Candidate</td><td><span class="badge badge-success">Smooth</span></td><td class=small>Concern resolved. CEO very positive.</td></tr></table>
<p><strong>Current Status:</strong> <span class="badge badge-success">ON TRACK</span></p>"""
    return wrap_a4(body, title="Guarantee Tracking", confidential=True)

# D35: Follow-Up Schedule
def gen_d35():
    body = gen_simple_email("Follow-Up Schedule — Alex Wang Placement", """
<p>Pre-defined touchpoints for the guarantee period:</p>
<div class="action-item">✓ <strong>Week 1</strong> — 2026-11-08 — Candidate check-in</div>
<div class="action-item">✓ <strong>Week 2</strong> — 2026-11-15 — Client check-in</div>
<div class="action-item">✓ <strong>Week 4</strong> — 2026-11-29 — Joint review</div>
<div class="action-item"><strong>Week 8</strong> — 2026-12-27 — Candidate + Client check-in (upcoming)</div>
<div class="action-item"><strong>Week 12</strong> — 2027-01-24 — Guarantee period review</div>
<div class="action-item"><strong>Month 6</strong> — 2027-05-01 — Long-term follow-up + guarantee close</div>""")
    return body

# D37: Development Recommendations
def gen_d37():
    secs = [("Current Profile", """<h2>Assessment Summary</h2><p>Based on LEAP and DRIVE assessments, Alex demonstrates exceptional strategic vision and achievement motivation.</p>
<h3>Strengths</h3>""" + build_bullet_list(["Strategic technology leadership (88th percentile)", "High achievement motivation (91st percentile)", "Strong resilience and adaptability"]) +
"""<h3>Development Areas</h3>""" + build_bullet_list(["Talent coaching and development (74th percentile — lowest dimension)", "Cross-functional collaboration refinement"])),
("Development Plan", """<h3>Immediate Priorities (0-3 months)</h3>""" + build_bullet_list([
"Schedule 1:1 coaching sessions with each direct report", "Attend executive coaching program on talent development",
"Shadow CHRO on people processes"]) +
"""<h3>Medium-Term Goals (3-12 months)</h3>""" + build_bullet_list(["Build structured talent review process", "Launch engineering mentorship program"]))]
    return gen_simple_a4("DEVELOPMENT<br>RECOMMENDATIONS", "Alex Wang — CTO", "2026-10-20", secs)

# D38: Team Dynamics Report
def gen_d38():
    body = build_doc_header("Team Dynamics Report", "2026-11-15")
    body += """<h2>Technology Leadership Team</h2><p>Team Size: 6 | Leader: Alex Wang (CTO)</p>"""
    body += svg_radar(["Innovation","Execution","Collaboration","Communication","Strategic","Technical"], [72,85,68,74,80,88], size=220)
    body += """<h3>Role Distribution</h3>""" + build_bullet_list(["Strategic Thinkers: 2 (Alex, VP Product)", "Executors: 3 (Dir Eng, Dir Infra, Dir Data)", "Innovators: 1 (Chief Architect)"])
    body += """<h3>Strengths</h3>""" + build_bullet_list(["Strong technical depth across the team", "Clear execution orientation"])
    body += """<h3>Potential Gaps</h3>""" + build_bullet_list(["Collaboration dimension is lowest — team tends to work in silos", "No dedicated people-manager archetype"])
    body += """<div class="callout"><strong>Recommendation:</strong> Focus on cross-functional collaboration in first quarter. Consider team off-site to build trust.</div>"""
    return wrap_a4(body, title="Team Dynamics Report", confidential=True)

# D39: Cohort Assessment Summary
def gen_d39():
    body = build_doc_header("Cohort Assessment Summary", "2026-09-01")
    body += "<h2>CTO Candidate Pool — 12 Candidates Assessed</h2>"
    body += build_stat_cards([{"value": "12", "label": "Participants"}, {"value": "78", "label": "Mean Score"}, {"value": "82", "label": "Top Score"}, {"value": "61", "label": "Lowest Score"}])
    dims = ["Strategic Vision","Eng Leadership","Tech Depth","Stakeholder Mgmt","Talent Dev"]
    body += svg_radar(dims, [76,74,79,71,73], size=220)
    body += """<h3>Key Insights</h3>""" + build_bullet_list(["Pool is strongest in Technical Depth (avg 79)", "Weakest dimension is Stakeholder Management (avg 71)", "Top 3 candidates significantly outperform pool average"])
    return wrap_a4(body, title="Cohort Summary")

# D42: Consultant Performance Report
def gen_d42():
    body = build_doc_header("Consultant Performance", "Q3 2026")
    body += "<h2>Kevin Hong — Performance Overview</h2>"
    body += build_stat_cards([{"value": "8", "label": "Placements"}, {"value": "¥4.2M", "label": "Revenue"}, {"value": "9.5w", "label": "Avg Time to Fill"}, {"value": "4.6/5", "label": "Client Satisfaction"}])
    body += svg_horizontal_bar("Revenue Target", 105, color=SUCCESS)
    body += svg_horizontal_bar("Placement Target", 100, color=SUCCESS)
    body += svg_horizontal_bar("Client Satisfaction", 92, color=FUCHSIA)
    body += """<h3>Strengths</h3>""" + build_bullet_list(["Consistent revenue delivery", "High client satisfaction scores", "Strong candidate quality"])
    body += """<h3>Development Areas</h3>""" + build_bullet_list(["Delegation to junior consultants", "Documentation of search methodology"])
    return wrap_a4(body, title="Consultant Performance", confidential=True)

# D43: Revenue / Financial Report
def gen_d43():
    body = build_doc_header("Revenue Report", "Q3 2026")
    body += "<h2>Financial Performance</h2>"
    body += build_stat_cards([{"value": "¥4.2M", "label": "Total Revenue"}, {"value": "105%", "label": "vs Target"}, {"value": "+18%", "label": "vs Prior Period"}])
    body += """<h3>By Consultant</h3><table><tr><th>Consultant</th><th>Revenue</th><th>Placements</th><th>Margin</th></tr>
<tr><td>Kevin Hong</td><td>¥2.1M</td><td>4</td><td>78%</td></tr>
<tr><td>Marcus Wei</td><td>¥1.2M</td><td>3</td><td>75%</td></tr>
<tr><td>Team</td><td>¥0.9M</td><td>1</td><td>70%</td></tr></table>"""
    body += """<h3>Pipeline Value</h3>""" + build_stat_cards([{"value": "¥8.5M", "label": "Total Pipeline"}, {"value": "¥5.1M", "label": "Weighted"}, {"value": "¥3.2M", "label": "Expected Q4"}])
    return wrap_a4(body, title="Revenue Report", confidential=True)

# D44: SLA Compliance Report
def gen_d44():
    body = build_doc_header("SLA Compliance Report", "Q3 2026")
    body += """<h2>Service Level Compliance</h2>
<div class="stat-grid">
<div class="stat-card"><div class="stat-value">12</div><div class="stat-label">Active Mandates</div></div>
<div class="stat-card"><div class="stat-value">10</div><div class="stat-label">Compliant</div></div>
<div class="stat-card"><div class="stat-value">1</div><div class="stat-label">At Risk</div></div>
<div class="stat-card"><div class="stat-value">1</div><div class="stat-label">Breached</div></div>
</div>
<p><strong>Compliance Rate:</strong> <span style="font-size:16pt;font-weight:700;color:#10B981">83%</span></p>
<table><tr><th>Mandate</th><th>Client</th><th>SLA Item</th><th>Target</th><th>Actual</th><th>Status</th></tr>
<tr><td>MND-2026-0042</td><td>Apex Technologies</td><td>Shortlist Delivery</td><td>Week 6</td><td>Week 7</td><td><span class="badge badge-warning">At Risk</span></td></tr>
<tr><td>MND-2026-0038</td><td>TechCorp</td><td>Interview Feedback</td><td>48hrs</td><td>72hrs</td><td><span class="badge badge-danger">Breached</span></td></tr>
<tr><td>MND-2026-0041</td><td>DataFlow</td><td>Weekly Updates</td><td>Every Friday</td><td>On time</td><td><span class="badge badge-success">Met</span></td></tr></table>"""
    return wrap_a4(body, title="SLA Compliance", confidential=True)


def generate_all(output_dir="business_docs"):
    os.makedirs(output_dir, exist_ok=True)
    docs = [
        ("D18_Interview_Framework", gen_d18),
        ("D20_Feedback_Form", gen_d20),
        ("D23_Reference_Check", gen_d23),
        ("D29_NextStep_Consultant", gen_d29),
        ("D32_Onboarding_Client", gen_d32),
        ("D33_Onboarding_Candidate", gen_d33),
        ("D34_Guarantee_Tracking", gen_d34),
        ("D35_FollowUp_Schedule", gen_d35),
        ("D37_Development_Recommendations", gen_d37),
        ("D38_Team_Dynamics", gen_d38),
        ("D39_Cohort_Summary", gen_d39),
        ("D42_Consultant_Performance", gen_d42),
        ("D43_Revenue_Report", gen_d43),
        ("D44_SLA_Compliance", gen_d44),
    ]
    for name, fn in docs:
        html = fn()
        path = os.path.join(output_dir, f"{name}.html")
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"  {name}: {len(html)//1024}KB")
    return len(docs)

if __name__ == "__main__":
    print("Final missing batch")
    n = generate_all()
    print(f"  {n} documents generated.")
