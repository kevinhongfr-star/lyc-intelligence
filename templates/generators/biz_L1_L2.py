"""L1: Business Development Documents — D01 through D05"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from lyc_business_components import *

# ── D01: Client Proposal ──────────────────────────────────────
D01_DATA = {
    "proposal_meta": {
        "proposal_id": "PROP-2026-0042", "version": "1.0", "date": "2026-07-15",
        "valid_until": "2026-08-15", "status": "draft",
        "consultant_name": "Kevin Hong", "consultant_title": "Managing Partner"
    },
    "client": {
        "company_name": "Apex Technologies", "contact_name": "Sarah Chen",
        "contact_title": "CHRO", "contact_email": "sarah.chen@apextech.com",
        "industry": "Technology", "relationship_stage": "existing"
    },
    "mandate": {
        "role_title": "Chief Technology Officer", "department": "Technology",
        "reporting_to": "CEO", "location": "Shanghai, China",
        "scope": "regional", "compensation_range": "¥2.5M - 3.5M total",
        "expected_start": "2026-10-01"
    },
    "scope_of_work": {
        "search_type": "retained",
        "methodology_summary": "Comprehensive market mapping, assessment-driven shortlisting, structured interview process",
        "deliverables": ["Market map report", "Candidate shortlist", "Assessment reports", "Interview guides", "Final recommendation"],
        "timeline_weeks": 12, "guarantee_period_months": 6
    },
    "team": [
        {"name": "Kevin Hong", "role": "Lead Partner", "bio_short": "20+ years in tech executive search across APAC"},
        {"name": "Marcus Wei", "role": "Research Director", "bio_short": "Former tech talent leader at top-tier search firms"}
    ],
    "fees": {
        "retainer_amount": 150000, "retainer_timing": "Upon engagement",
        "success_fee_amount": 500000, "success_fee_pct": 25,
        "expense_policy": "Capped at 8% of total fee", "payment_terms": "Net 30",
        "total_estimated": 650000
    }
}

def gen_proposal(d):
    pm, cl, mn, sw, tm, fe = d["proposal_meta"], d["client"], d["mandate"], d["scope_of_work"], d["team"], d["fees"]
    cover = build_cover(
        f"PROPOSAL FOR<br>{mn['role_title']}",
        f"Prepared for {cl['company_name']}",
        [f"<strong>Date:</strong> {pm['date']}", f"<strong>Reference:</strong> {pm['proposal_id']}", f"<strong>Valid Until:</strong> {pm['valid_until']}"],
        status=pm["status"].upper()
    )
    # Letter of Introduction
    letter = f"""
    {build_doc_header("Letter of Introduction", pm["date"])}
    <h2>Dear {cl['contact_name']},</h2>
    <p>Thank you for the opportunity to present this proposal for the {mn['role_title']} position at {cl['company_name']}. Based on our discussions, we understand the critical nature of this role and the urgency of finding the right leader.</p>
    <p>LYC Partners brings a proven track record in {cl['industry']} executive search, with deep networks across the {mn['location']} market. Our assessment-driven approach ensures we identify candidates who not only meet the technical requirements but align with your organization's culture and strategic vision.</p>
    <p>We look forward to partnering with you on this important mandate.</p>
    {build_signature_block(pm["consultant_name"], pm["consultant_title"], pm["date"])}
    """
    # Role understanding
    role_page = f"""
    {build_doc_header("Understanding of the Role", pm["date"])}
    <h2>Role Context</h2>
    <p>{mn['role_title']} reporting to {mn['reporting_to']}, based in {mn['location']}. This is a {mn['scope']}-scope mandate with compensation in the range of {mn['compensation_range']}.</p>
    <h3>Key Success Factors</h3>
    {build_bullet_list(["Strategic technology leadership aligned with business objectives", "Proven track record of building and scaling high-performing engineering teams", "Experience driving digital transformation in complex organizational environments", "Strong stakeholder management and board-level communication skills"])}
    <h3>Market Landscape</h3>
    <p>The {cl['industry']} sector in {mn['location']} faces intense competition for senior technology talent. Our market intelligence indicates a talent pool of approximately 200 qualified candidates at the required level, with approximately 30-40 actively accessible.</p>
    """
    # Methodology
    meth_page = f"""
    {build_doc_header("Methodology & Approach", pm["date"])}
    <h2>Search Methodology</h2>
    <p>{sw['methodology_summary']}</p>
    <h3>Phase Timeline</h3>
    {build_timeline_table([
        {"phase": "Phase 1: Market Mapping & Targeting", "date": "Week 1-2", "status": "planned"},
        {"phase": "Phase 2: Outreach & Assessment", "date": "Week 3-6", "status": "planned"},
        {"phase": "Phase 3: Shortlist & Interview", "date": "Week 7-10", "status": "planned"},
        {"phase": "Phase 4: Selection & Closing", "date": "Week 11-12", "status": "planned"}
    ])}
    <h3>Deliverables</h3>
    {build_bullet_list(sw['deliverables'])}
    """
    # Team
    team_page = f"""
    {build_doc_header("Engagement Team", pm["date"])}
    <h2>Your Team</h2>
    <div class="two-col">
    """
    for t in tm:
        team_page += f"""
        <div style="background:{GREY_100};border-radius:6px;padding:16px;">
            <div style="font-weight:700;font-size:11pt;color:{DARK}">{t['name']}</div>
            <div style="color:{FUCHSIA};font-size:9pt;font-weight:600;margin:4px 0">{t['role']}</div>
            <div style="font-size:9pt;color:{GREY_600}">{t['bio_short']}</div>
        </div>
        """
    team_page += "</div>"
    # Fees
    fee_page = f"""
    {build_doc_header("Investment", pm["date"])}
    <h2>Fee Structure</h2>
    <table>
        <tr><th>Component</th><th>Amount</th><th>Timing</th></tr>
        <tr><td>Retainer Fee</td><td>¥{fe['retainer_amount']:,}</td><td>{fe['retainer_timing']}</td></tr>
        <tr><td>Success Fee</td><td>¥{fe['success_fee_amount']:,}</td><td>Upon successful placement</td></tr>
        <tr><td>Expenses</td><td>{fe['expense_policy']}</td><td>Monthly reconciliation</td></tr>
        <tr style="font-weight:700;background:{GREY_100}"><td>Total Estimated</td><td>¥{fe['total_estimated']:,}</td><td>{fe['payment_terms']}</td></tr>
    </table>
    <h3>Guarantee</h3>
    <p>{sw['guarantee_period_months']}-month guarantee period from start date. If the placement does not meet expectations within this period, LYC will conduct a replacement search at no additional professional fee.</p>
    <h3>Acceptance</h3>
    <p>This proposal is valid until <strong>{pm['valid_until']}</strong>. To proceed, please sign below or confirm via email.</p>
    <div class="two-col">
        {build_signature_block("Client Representative", cl['contact_title'], "", cl['company_name'])}
        {build_signature_block(pm['consultant_name'], pm['consultant_title'], "", "LYC Partners")}
    </div>
    """
    return wrap_a4_multi([cover, letter, role_page, meth_page, team_page, fee_page],
                         title=f"Proposal - {mn['role_title']}", watermark="DRAFT", confidential=True)


# ── D02: Fee Schedule ─────────────────────────────────────────
D02_DATA = {
    "fee_schedule_meta": {"client_name": "Apex Technologies", "date": "2026-07-15",
                          "consultant_name": "Kevin Hong", "currency": "CNY"},
    "mandates": [
        {"role_title": "Chief Technology Officer", "search_type": "retained",
         "fee_structure": {"retainer": 150000, "success_fee": 500000, "total_estimated": 650000},
         "payment_schedule": [
             {"milestone": "Retainer", "amount": 150000, "due": "Upon engagement"},
             {"milestone": "Shortlist Delivery", "amount": 150000, "due": "Week 8"},
             {"milestone": "Successful Placement", "amount": 350000, "due": "Within 30 days of start"}
         ]}
    ],
    "volume_discount": {"applicable": True, "threshold": 3, "discount_pct": 10},
    "expense_policy": "Capped at 8% of total professional fees", "payment_terms": "Net 30"
}

def gen_fee_schedule(d):
    fm = d["fee_schedule_meta"]
    body = build_doc_header("Fee Schedule", fm["date"])
    body += f"<h2>Fee Schedule — {fm['client_name']}</h2>"
    body += '<table><tr><th>Role</th><th>Type</th><th>Retainer</th><th>Success Fee</th><th>Total</th></tr>'
    for m in d["mandates"]:
        fs = m["fee_structure"]
        body += f"<tr><td>{m['role_title']}</td><td>{m['search_type'].title()}</td>"
        body += f"<td>¥{fs['retainer']:,}</td><td>¥{fs['success_fee']:,}</td><td><strong>¥{fs['total_estimated']:,}</strong></td></tr>"
    body += "</table>"
    # Payment schedule
    for m in d["mandates"]:
        body += f"<h3>Payment Schedule — {m['role_title']}</h3>"
        body += '<table><tr><th>Milestone</th><th>Amount</th><th>Due</th></tr>'
        for ps in m["payment_schedule"]:
            body += f"<tr><td>{ps['milestone']}</td><td>¥{ps['amount']:,}</td><td>{ps['due']}</td></tr>"
        body += "</table>"
    # Discounts
    vd = d["volume_discount"]
    if vd["applicable"]:
        body += build_callout(f"Volume discount: {vd['discount_pct']}% reduction when {vd['threshold']}+ mandates engaged simultaneously.")
    body += f"<p><strong>Expense Policy:</strong> {d['expense_policy']}<br><strong>Payment Terms:</strong> {d['payment_terms']}</p>"
    return wrap_a4(body, title="Fee Schedule", confidential=True)


# ── D03: Terms & Conditions ───────────────────────────────────
D03_DATA = {
    "terms_meta": {"document_id": "T&C-2026-STD", "version": "3.2", "effective_date": "2026-01-01",
                   "client_name": "Apex Technologies", "engagement_type": "single_mandate"},
    "sections": [
        {"number": "1", "title": "Definitions", "content": "In this Agreement: 'Client' refers to Apex Technologies; 'Consultant' refers to LYC Partners; 'Candidate' refers to any individual introduced by the Consultant; 'Placement' refers to the successful engagement of a Candidate by the Client."},
        {"number": "2", "title": "Scope of Services", "content": "The Consultant shall provide executive search services as described in the associated Proposal document, including market mapping, candidate identification, assessment, and interview facilitation."},
        {"number": "3", "title": "Fees and Payment Terms", "content": "Fees shall be as specified in the Fee Schedule. Retainer fees are non-refundable. Success fees are payable within 30 days of the Candidate's start date."},
        {"number": "4", "title": "Exclusivity", "content": "This engagement is conducted on an exclusive basis. The Client shall not engage other search firms for the same role during the engagement period."},
        {"number": "5", "title": "Confidentiality", "content": "Both parties agree to maintain strict confidentiality regarding all information shared during the engagement, including candidate identities, client strategies, and fee arrangements."},
        {"number": "9", "title": "Guarantee / Replacement Policy", "content": "The Consultant provides a 6-month guarantee period. If a placed candidate leaves or is terminated for cause within this period, the Consultant will conduct a replacement search at no additional professional fee."}
    ]
}

def gen_terms(d):
    tm = d["terms_meta"]
    cover = build_cover("MASTER SERVICE AGREEMENT", f"Between LYC Partners and {tm['client_name']}",
                        [f"<strong>Document ID:</strong> {tm['document_id']}", f"<strong>Version:</strong> {tm['version']}",
                         f"<strong>Effective Date:</strong> {tm['effective_date']}"], status="DRAFT")
    body = build_doc_header("Terms & Conditions", tm["effective_date"])
    for s in d["sections"]:
        body += f"<h3>{s['number']}. {s['title']}</h3><p>{s['content']}</p>"
    body += build_signature_block("Client Representative", "", "", tm["client_name"])
    body += build_signature_block("Kevin Hong", "Managing Partner", "", "LYC Partners")
    return wrap_a4_multi([cover, body], title="Terms & Conditions", confidential=True)


# ── D04: NDA ──────────────────────────────────────────────────
D04_DATA = {
    "nda_meta": {
        "document_id": "NDA-2026-0042", "type": "mutual", "date": "2026-07-15",
        "parties": [
            {"name": "LYC Partners Ltd.", "entity_type": "company", "address": "Shanghai, China"},
            {"name": "Apex Technologies Inc.", "entity_type": "company", "address": "Beijing, China"}
        ],
        "purpose": "Executive search engagement for CTO position", "duration_months": 24, "jurisdiction": "Hong Kong"
    }
}

def gen_nda(d):
    nm = d["nda_meta"]
    cover = build_cover("CONFIDENTIALITY AGREEMENT", "Mutual Non-Disclosure Agreement",
                        [f"<strong>Reference:</strong> {nm['document_id']}", f"<strong>Date:</strong> {nm['date']}",
                         f"<strong>Duration:</strong> {nm['duration_months']} months"], status="CONFIDENTIAL")
    body = build_doc_header("Confidentiality Agreement", nm["date"])
    body += f"<h2>Parties</h2>"
    for p in nm["parties"]:
        body += f"<p><strong>{p['name']}</strong> ({p['entity_type']}), located at {p['address']}</p>"
    body += f"""
    <h2>Purpose</h2>
    <p>{nm['purpose']}</p>
    <h2>Key Terms</h2>
    {build_bullet_list(["Both parties agree to protect all confidential information shared during this engagement",
        "Confidential information includes but is not limited to: candidate identities, business strategies, financial data, and technical information",
        f"This agreement remains in effect for {nm['duration_months']} months from the date of execution",
        f"Jurisdiction: {nm['jurisdiction']}"])}
    <div class="two-col">
    """
    for p in nm["parties"]:
        body += build_signature_block("Authorized Representative", "", nm["date"], p["name"])
    return wrap_a4_multi([cover, body], title="NDA", confidential=True)


# ── D05: Track Record ─────────────────────────────────────────
D05_DATA = {
    "track_record_meta": {"title": "LYC Partners — Track Record", "subtitle": "Technology Sector Practice",
                          "date": "2026-07-15", "client_industry": "Technology", "prepared_by": "Kevin Hong"},
    "firm_highlights": {"years_operating": 15, "total_placements": 500, "industries_covered": ["Technology", "Financial Services", "Healthcare", "Consumer"],
                        "geographic_reach": ["China", "Southeast Asia", "Japan", "APAC"], "success_rate_pct": 92,
                        "avg_time_to_fill_weeks": 10, "retention_rate_12m_pct": 95},
    "case_studies": [
        {"title": "VP Engineering, Global Fintech", "industry": "Technology", "role_level": "VP",
         "challenge": "Scaling engineering team from 50 to 200 while entering APAC market",
         "approach": "Targeted mapping of APAC-based engineering leaders with global fintech experience",
         "result": "Placed within 8 weeks. Candidate now leads 180-person engineering org.", "timeline_weeks": 8, "anonymized": True},
        {"title": "Chief Data Officer, Healthcare Major", "industry": "Healthcare", "role_level": "C-suite",
         "challenge": "First-ever CDO hire to drive data transformation across 12 hospitals",
         "approach": "Cross-industry search targeting healthcare and tech leaders with data platform experience",
         "result": "Successfully placed. Data platform launched within 6 months.", "timeline_weeks": 12, "anonymized": True}
    ],
    "testimonials": [
        {"quote": "LYC Partners delivered an exceptional shortlist and the placement has been transformative for our business.", "author_name": "CEO", "author_title": "CEO", "company": "Technology Company"}
    ]
}

def gen_track_record(d):
    fh = d["firm_highlights"]
    cover = build_cover(d["track_record_meta"]["title"], d["track_record_meta"]["subtitle"],
                        [f"<strong>Date:</strong> {d['track_record_meta']['date']}", f"<strong>Prepared by:</strong> {d['track_record_meta']['prepared_by']}"])
    # Stats page
    stats = build_stat_cards([
        {"value": fh["years_operating"], "label": "Years Operating"},
        {"value": fh["total_placements"], "label": "Total Placements"},
        {"value": f'{fh["success_rate_pct"]}%', "label": "Success Rate"},
        {"value": fh["avg_time_to_fill_weeks"], "label": "Avg Weeks to Fill"},
        {"value": f'{fh["retention_rate_12m_pct"]}%', "label": "12M Retention"},
    ])
    body1 = build_doc_header("Firm Overview", d["track_record_meta"]["date"])
    body1 += "<h2>By the Numbers</h2>" + stats
    body1 += f"<h3>Industries</h3><p>{', '.join(fh['industries_covered'])}</p>"
    body1 += f"<h3>Geographic Reach</h3><p>{', '.join(fh['geographic_reach'])}</p>"
    # Case studies
    body2 = build_doc_header("Case Studies", d["track_record_meta"]["date"])
    for cs in d["case_studies"]:
        body2 += f"<h3>{cs['title']}</h3>"
        body2 += f"<p><em>{cs['industry']} | {cs['role_level']} | {cs['timeline_weeks']} weeks</em></p>"
        body2 += f"<p><strong>Challenge:</strong> {cs['challenge']}</p>"
        body2 += f"<p><strong>Approach:</strong> {cs['approach']}</p>"
        body2 += f"<p><strong>Result:</strong> {cs['result']}</p>"
        body2 += '<hr class="section-divider">'
    # Testimonials
    body2 += "<h2>Client Testimonials</h2>"
    for t in d["testimonials"]:
        body2 += f'<div class="callout">"{t["quote"]}"<br><span class=small>— {t["author_name"]}, {t["author_title"]}, {t["company"]}</span></div>'
    return wrap_a4_multi([cover, body1, body2], title="Track Record")


# ── Generator ─────────────────────────────────────────────────
def generate_all(output_dir="business_docs"):
    os.makedirs(output_dir, exist_ok=True)
    docs = [
        ("D01_Client_Proposal", gen_proposal, D01_DATA),
        ("D02_Fee_Schedule", gen_fee_schedule, D02_DATA),
        ("D03_Terms_Conditions", gen_terms, D03_DATA),
        ("D04_NDA", gen_nda, D04_DATA),
        ("D05_Track_Record", gen_track_record, D05_DATA),
    ]
    for name, fn, data in docs:
        html = fn(data)
        path = os.path.join(output_dir, f"{name}.html")
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"  {name}: {len(html)//1024}KB")
    return len(docs)

if __name__ == "__main__":
    print("L1: Business Development Documents")
    n = generate_all()
    print(f"  {n} documents generated.")
