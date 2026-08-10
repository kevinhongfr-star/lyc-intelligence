#!/usr/bin/env python3
"""LYC Partners — Consultation Guide Generator v2 (Group 8)
10 structured consultation templates following the design spec."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from lyc_components import *

OUTPUT_DIR = Path(__file__).parent / "guides"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

GUIDES = []

# Guide 1
GUIDES.append({"number": 1, "title": "Initial Client Discovery", "sections": [
    {"title": "Client Context", "type": "narrative", "content": "Understand the client organizational structure, culture, and immediate hiring needs. Map key stakeholders and decision-making hierarchy."},
    {"title": "Role Requirements", "type": "table", "headers": ["Dimension", "Requirement", "Priority"], "rows": [
        ["Technical Depth", "10+ years engineering leadership", "Critical"],
        ["People Management", "Experience scaling 50+ teams", "High"],
        ["Strategic Vision", "Board-level communication", "Medium"]]},
    {"title": "Discussion Points", "type": "questions", "items": [
        "What does success look like in the first 6 months?",
        "What is the team biggest pain point right now?",
        "How does this role interact with the board?"]},
    {"title": "Action Items", "type": "checklist", "items": [
        "Send mandate brief and role spec",
        "Schedule stakeholder intro calls",
        "Confirm compensation band and equity structure"]}
]})

# Guide 2
GUIDES.append({"number": 2, "title": "Mandate Kick-Off", "sections": [
    {"title": "Mandate Parameters", "type": "narrative", "content": "Align on search scope, timeline, target companies, and candidate profile. Confirm sourcing strategy and weekly cadence."},
    {"title": "Timeline and Milestones", "type": "table", "headers": ["Milestone", "Target Date", "Owner"], "rows": [
        ["Market map complete", "Week 1", "Research Team"],
        ["Longlist delivered", "Week 2", "Lead Consultant"],
        ["Shortlist review", "Week 3", "Client + Consultant"],
        ["Interviews begin", "Week 4", "Client"]]},
    {"title": "Discussion Points", "type": "questions", "items": [
        "Are there any must-have vs nice-to-have candidate attributes?",
        "What is the interview process structure?",
        "Any companies we should avoid approaching?"]},
    {"title": "Action Items", "type": "checklist", "items": [
        "Finalize candidate profile scorecard",
        "Set up weekly sync meeting",
        "Launch market mapping"]}
]})

# Guide 3
GUIDES.append({"number": 3, "title": "Market Mapping Briefing", "sections": [
    {"title": "Market Landscape", "type": "narrative", "content": "Present talent pool analysis: supply/demand dynamics, competitor hiring activity, compensation benchmarks, and geographic distribution of target candidates."},
    {"title": "Target Companies", "type": "table", "headers": ["Company", "Tier", "Potential Candidates", "Approach Strategy"], "rows": [
        ["ByteDance", "Tier 1", "3-5", "Direct approach via network"],
        ["Alibaba Cloud", "Tier 1", "2-3", "Warm introduction"],
        ["Sea Group", "Tier 1", "1-2", "Conference networking"],
        ["Grab", "Tier 2", "2-4", "LinkedIn + referral"]]},
    {"title": "Discussion Points", "type": "questions", "items": [
        "Any changes to the target company list?",
        "How aggressive should we be on compensation positioning?",
        "Should we consider international relocations?"]},
    {"title": "Action Items", "type": "checklist", "items": [
        "Update talent map with feedback",
        "Begin candidate outreach",
        "Prepare longlist for review"]}
]})

# Guide 4
GUIDES.append({"number": 4, "title": "Shortlist Review", "sections": [
    {"title": "Candidate Overview", "type": "narrative", "content": "Walk through each shortlisted candidate, highlighting assessment scores, key strengths, potential risks, and fit with the role requirements."},
    {"title": "Candidate Matrix", "type": "table", "headers": ["#", "Name", "Score", "Key Strength", "Key Risk"], "rows": [
        ["1", "Candidate A", "92", "Scaling experience", "Comp expectations"],
        ["2", "Candidate B", "87", "International bg", "Less C-suite exposure"],
        ["3", "Candidate C", "82", "Technical depth", "Industry transition"]]},
    {"title": "Discussion Points", "type": "questions", "items": [
        "Which candidates should we prioritize for interviews?",
        "Any concerns about the shortlist diversity?",
        "Should we extend the search for more candidates?"]},
    {"title": "Action Items", "type": "checklist", "items": [
        "Schedule first-round interviews",
        "Prepare interview guides per candidate",
        "Send candidate briefs to interview panel"]}
]})

# Guide 5
GUIDES.append({"number": 5, "title": "Interview Preparation", "sections": [
    {"title": "Interview Strategy", "type": "narrative", "content": "Align on interview structure, question themes, evaluation criteria, and panel composition. Ensure consistent experience across candidates."},
    {"title": "Question Themes", "type": "table", "headers": ["Round", "Focus Area", "Key Questions", "Evaluator"], "rows": [
        ["Round 1", "Technical Leadership", "System design, team scaling", "CTO"],
        ["Round 2", "Strategic Thinking", "Roadmap, board interaction", "CEO"],
        ["Round 3", "Culture Fit", "Values alignment, conflict style", "HR Director"]]},
    {"title": "Discussion Points", "type": "questions", "items": [
        "What are the non-negotiable evaluation criteria?",
        "How should we handle reference checks?",
        "What is the decision timeline post-interviews?"]},
    {"title": "Action Items", "type": "checklist", "items": [
        "Distribute interview guides to panel",
        "Book interview rooms and video links",
        "Prepare candidate briefing packs"]}
]})

# Guide 6
GUIDES.append({"number": 6, "title": "Offer Negotiation", "sections": [
    {"title": "Negotiation Strategy", "type": "narrative", "content": "Review the preferred candidate assessment profile, market positioning, and negotiation leverage points. Align on offer parameters."},
    {"title": "Offer Parameters", "type": "table", "headers": ["Component", "Client Range", "Candidate Expectation", "Recommendation"], "rows": [
        ["Base Salary", "180-200", "190", "190"],
        ["Bonus", "20-30%", "25%", "25%"],
        ["Equity/RSU", "0.5-1.0%", "0.8%", "0.8%"],
        ["Sign-on", "0-10", "5", "5"]]},
    {"title": "Discussion Points", "type": "questions", "items": [
        "What is our maximum total comp authority?",
        "Are there non-monetary levers we can use?",
        "What is the backup plan if this candidate declines?"]},
    {"title": "Action Items", "type": "checklist", "items": [
        "Draft formal offer letter",
        "Prepare comp benchmark data for candidate",
        "Set offer expiry deadline"]}
]})

# Guide 7
GUIDES.append({"number": 7, "title": "Onboarding Planning", "sections": [
    {"title": "Onboarding Framework", "type": "narrative", "content": "Design a structured 90-day onboarding plan that accelerates time-to-impact and ensures cultural integration."},
    {"title": "90-Day Plan", "type": "table", "headers": ["Phase", "Duration", "Key Objectives", "Success Metrics"], "rows": [
        ["Observe", "Days 1-30", "Learn culture, build relationships", "Team feedback scores"],
        ["Contribute", "Days 31-60", "Lead first project, establish credibility", "Project delivery"],
        ["Transform", "Days 61-90", "Drive strategic initiatives", "Impact metrics"]]},
    {"title": "Discussion Points", "type": "questions", "items": [
        "Who will be the onboarding buddy or mentor?",
        "What are the first 3 priorities?",
        "How will we measure success at 90 days?"]},
    {"title": "Action Items", "type": "checklist", "items": [
        "Prepare onboarding documentation pack",
        "Schedule Day 1 meetings with key stakeholders",
        "Set up 30/60/90-day review checkpoints"]}
]})

# Guide 8
GUIDES.append({"number": 8, "title": "90-Day Check-In", "sections": [
    {"title": "Performance Review", "type": "narrative", "content": "Evaluate the candidate progress against the 90-day plan. Identify strengths demonstrated, areas needing support, and trajectory assessment."},
    {"title": "Assessment Results", "type": "table", "headers": ["Dimension", "Expected", "Actual", "Status"], "rows": [
        ["Team Integration", "Built key relationships", "On track", "Green"],
        ["Technical Impact", "Led first initiative", "In progress", "Amber"],
        ["Cultural Fit", "Aligned with values", "Strong fit", "Green"],
        ["Stakeholder Mgmt", "Board presentation done", "Delayed", "Red"]]},
    {"title": "Discussion Points", "type": "questions", "items": [
        "What support does the candidate need in the next quarter?",
        "Are there any retention concerns?",
        "Should we adjust the role scope based on performance?"]},
    {"title": "Action Items", "type": "checklist", "items": [
        "Schedule follow-up coaching session",
        "Update development plan",
        "Report outcomes to client leadership"]}
]})

# Guide 9
GUIDES.append({"number": 9, "title": "Performance Review Prep", "sections": [
    {"title": "Review Preparation", "type": "narrative", "content": "Compile assessment data, 360 feedback, and performance metrics to prepare a comprehensive review package for the client."},
    {"title": "Performance Summary", "type": "table", "headers": ["Area", "Rating", "Key Evidence", "Trend"], "rows": [
        ["Leadership", "Exceeds", "Team engagement +15%", "Up"],
        ["Technical Delivery", "Meets", "On-time project completion", "Stable"],
        ["Strategic Impact", "Developing", "Roadmap in progress", "Up"],
        ["Communication", "Meets", "Positive stakeholder feedback", "Stable"]]},
    {"title": "Discussion Points", "type": "questions", "items": [
        "What narrative should the review communicate?",
        "Are there compensation implications?",
        "What development goals for the next period?"]},
    {"title": "Action Items", "type": "checklist", "items": [
        "Finalize review document",
        "Align with HR on calibration",
        "Prepare development recommendations"]}
]})

# Guide 10
GUIDES.append({"number": 10, "title": "Leadership Development Plan", "sections": [
    {"title": "Development Strategy", "type": "narrative", "content": "Design a 12-month leadership development plan based on assessment insights, performance data, and organizational needs."},
    {"title": "Development Areas", "type": "table", "headers": ["Area", "Current Level", "Target Level", "Intervention"], "rows": [
        ["Strategic Communication", "Developing", "Strong", "Executive coaching + board exposure"],
        ["Delegation", "Strong", "Exceptional", "Stretch assignments + mentorship"],
        ["Data-Driven Decisions", "Gap", "Strong", "Analytics training + decision frameworks"],
        ["Cross-Functional Leadership", "Developing", "Strong", "Cross-team project leadership"]]},
    {"title": "Discussion Points", "type": "questions", "items": [
        "What is the investment appetite for development?",
        "Should we engage an external coach?",
        "How do we measure development progress?"]},
    {"title": "Action Items", "type": "checklist", "items": [
        "Identify and engage development providers",
        "Set quarterly milestones",
        "Create feedback loop with manager"]}
]})

def generate_guide(guide_data, client="TechCorp Asia", mandate="VP Engineering", consultant="Sarah Wong"):
    meta_num = guide_data["number"]
    parts = []
    parts.append(build_header(client=client, date="2026-07-22"))
    parts.append(f"""
    <div style="padding:20px 30px;background:{B['grey_100']};border-bottom:2px solid {B['border']}">
        <div style="font-size:8pt;color:{B['muted']};text-transform:uppercase;letter-spacing:1px">Consultation Guide #{meta_num}</div>
        <h1 style="margin:4px 0">{guide_data["title"]}</h1>
        <div style="font-size:9pt;color:{B["text2"]}">Client: {client} | Mandate: {mandate} | Consultant: {consultant}</div>
    </div>""")
    parts.append("<div class=\"section\">")
    for section in guide_data["sections"]:
        parts.append(f"<h3>{section['title']}</h3>")
        if section["type"] == "narrative":
            parts.append(build_callout(section["content"]))
        elif section["type"] == "table":
            parts.append(build_table(section["headers"], section["rows"]))
        elif section["type"] == "questions":
            parts.append(f"<div style=\"background:{B['grey_100']};padding:14px 18px;border-radius:6px;margin:8px 0\">")
            for i, q in enumerate(section["items"], 1):
                parts.append(f"<div style=\"margin:6px 0\"><span style=\"color:{B['fuchsia']};font-weight:700\">{i}.</span> {q}</div>")
            parts.append("</div>")
        elif section["type"] == "checklist":
            parts.append("<div style=\"margin:8px 0\">")
            for item in section["items"]:
                parts.append(f"<div style=\"margin:5px 0;padding:6px 10px;border:1px solid {B['border']};border-radius:4px;font-size:9pt\"><span style=\"color:{B['fuchsia']};margin-right:8px\">\u2610</span> {item}</div>")
            parts.append("</div>")
    parts.append("</div>")
    parts.append(build_footer(str(meta_num), "10"))
    return wrap_page("\n".join(parts), title=f"Guide #{meta_num} - {guide_data['title']}")

def main():
    generated = []
    for guide in GUIDES:
        html = generate_guide(guide)
        fname = f"Consultation_Guide_{guide['number']:02d}.html"
        out = OUTPUT_DIR / fname
        out.write_text(html, encoding="utf-8")
        generated.append((fname, out.stat().st_size))
        print(f"  Guide #{guide['number']}: {fname} ({out.stat().st_size // 1024}KB)")
    print(f"\nGenerated {len(generated)} consultation guides")

if __name__ == "__main__":
    main()
