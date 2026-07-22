#!/usr/bin/env python3
"""Generate missing business document templates: D11 (CV), D24 (Offer Letter), D25 (Counter-Offer Advisory), D40 (Criterion Validation)"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from lyc_business_components import *

OUT = os.path.join(os.path.dirname(__file__), "business_docs")
os.makedirs(OUT, exist_ok=True)

# ── D11: CV / Candidate Presentation ──
D11_DATA = {
    "candidate_name": "张明远",
    "role_title": "首席技术官 (CTO)",
    "client_company": "TechVentures Inc.",
    "date": "2026-07-22",
    "photo_placeholder": True,
    "personal_info": {
        "location": "上海",
        "phone": "+86 138-xxxx-xxxx",
        "email": "zhang.my@example.com",
        "nationality": "中国"
    },
    "executive_summary": "拥有18年技术管理经验的资深技术领导者，曾主导3家科技公司从0到1的技术架构搭建，带领团队规模从10人扩展至200+。在公司A任职期间推动核心系统云原生转型，年节省基础设施成本35%。",
    "core_competencies": [
        ("技术战略规划", 95),
        ("云原生架构", 90),
        ("团队建设与领导力", 92),
        ("AI/ML工程化", 85),
        ("敏捷开发管理", 88),
        ("跨部门协作", 90),
    ],
    "career_history": [
        {
            "company": "公司A — 某知名互联网集团",
            "title": "技术副总裁 / CTO",
            "period": "2020 - 至今",
            "highlights": [
                "主导核心电商平台微服务架构重构，支撑日均2亿PV",
                "组建并管理200+人技术团队，建立技术梯队培养体系",
                "推动AI驱动的智能推荐系统上线，GMV提升18%",
            ]
        },
        {
            "company": "公司B — 中型SaaS企业",
            "title": "技术总监",
            "period": "2015 - 2020",
            "highlights": [
                "从零搭建技术团队至80人规模",
                "主导SaaS平台从单体到微服务架构迁移",
                "建立DevOps文化，部署频率从月发提升到日发",
            ]
        },
        {
            "company": "公司C — 初创科技公司",
            "title": "高级软件工程师 → 技术负责人",
            "period": "2008 - 2015",
            "highlights": [
                "核心系统架构设计与开发",
                "带领10人团队完成产品从0到1上线",
                "获得公司年度最佳技术创新奖",
            ]
        },
    ],
    "education": [
        {"school": "上海交通大学", "degree": "计算机科学与技术 硕士", "year": "2006 - 2008"},
        {"school": "浙江大学", "degree": "软件工程 学士", "year": "2002 - 2006"},
    ],
    "certifications": ["AWS Solutions Architect Professional", "PMP", "TOGAF 9.2"],
    "languages": ["中文（母语）", "英文（流利，TOEFL 110）"],
    "assessment_summary": {
        "leadership": "卓越",
        "strategic_thinking": "优秀",
        "communication": "优秀",
        "cultural_fit": "高度匹配",
        "overall_rating": "强烈推荐面试",
    },
    "consultant_note": "张明远是一位兼具技术深度和管理广度的复合型技术领导者。其在大流量系统架构、团队规模化建设方面的经验与贵司CTO岗位需求高度匹配。特别推荐进入面试环节。",
}

def gen_d11():
    pages = []
    # Page 1: Cover
    cover = build_cover(
        "候选人简历 | Candidate Profile",
        f"{D11_DATA['candidate_name']}\n{D11_DATA['role_title']}",
        [f"客户: {D11_DATA['client_company']}", f"日期: {D11_DATA['date']}", "机密文件 | Confidential"],
        "机密"
    )
    pages.append(cover)

    # Page 2: Executive Summary + Competencies
    comp_bars = ""
    for name, score in D11_DATA["core_competencies"]:
        bar_color = "#C108AB" if score >= 90 else "#9B7BB8" if score >= 85 else "#B0B0B0"
        comp_bars += f'''
        <div style="margin-bottom:8px;">
            <div style="display:flex;justify-content:space-between;font-size:9.5pt;margin-bottom:3px;">
                <span>{name}</span><span style="font-weight:700;">{score}%</span>
            </div>
            <div style="height:6px;background:#F0F0F0;border-radius:3px;">
                <div style="width:{score}%;height:100%;background:{bar_color};border-radius:3px;"></div>
            </div>
        </div>'''

    pages.append(f'''<div class="page">
        {build_doc_header("候选人简历", D11_DATA["date"])}
        <div style="padding:25px 30px;">
            <div class="section-title" style="margin-top:5px;">个人信息</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 20px;font-size:9.5pt;">
                <div><span style="color:gray;">姓名:</span> {D11_DATA['candidate_name']}</div>
                <div><span style="color:gray;">所在地:</span> {D11_DATA['personal_info']['location']}</div>
                <div><span style="color:gray;">邮箱:</span> {D11_DATA['personal_info']['email']}</div>
                <div><span style="color:gray;">国籍:</span> {D11_DATA['personal_info']['nationality']}</div>
            </div>

            <div class="section-title">职业概述</div>
            <p style="font-size:10pt;line-height:1.7;">{D11_DATA['executive_summary']}</p>

            <div class="section-title">核心能力评估</div>
            {comp_bars}
        </div>
    </div>''')

    # Page 3: Career History
    career_html = ""
    for job in D11_DATA["career_history"]:
        highlights = "".join(f"<li>{h}</li>" for h in job["highlights"])
        career_html += f'''
        <div style="margin-bottom:18px;">
            <div style="display:flex;justify-content:space-between;align-items:baseline;">
                <div style="font-weight:700;font-size:11pt;">{job["title"]}</div>
                <div class="meta-info">{job["period"]}</div>
            </div>
            <div style="color:#8B5CF6;font-size:9.5pt;margin-bottom:6px;">{job["company"]}</div>
            <ul style="margin-left:18px;font-size:9.5pt;line-height:1.7;">{highlights}</ul>
        </div>'''

    pages.append(f'''<div class="page">
        {build_doc_header("候选人简历", D11_DATA["date"])}
        <div style="padding:25px 30px;">
            <div class="section-title" style="margin-top:5px;">职业经历</div>
            {career_html}

            <div class="section-title">教育背景</div>
            <table style="width:100%;font-size:9.5pt;border-collapse:collapse;">
                <tr style="background:#F5F5F5;">
                    <th style="padding:6px 10px;text-align:left;border-bottom:1px solid #E0E0E0;">院校</th>
                    <th style="padding:6px 10px;text-align:left;border-bottom:1px solid #E0E0E0;">学位</th>
                    <th style="padding:6px 10px;text-align:left;border-bottom:1px solid #E0E0E0;">时间</th>
                </tr>
                {"".join(f'<tr><td style="padding:6px 10px;border-bottom:1px solid #F0F0F0;">{e["school"]}</td><td style="padding:6px 10px;border-bottom:1px solid #F0F0F0;">{e["degree"]}</td><td style="padding:6px 10px;border-bottom:1px solid #F0F0F0;">{e["year"]}</td></tr>' for e in D11_DATA["education"])}
            </table>

            <div class="section-title">专业认证</div>
            <p style="font-size:9.5pt;">{" | ".join(D11_DATA["certifications"])}</p>

            <div class="section-title">语言能力</div>
            <p style="font-size:9.5pt;">{" | ".join(D11_DATA["languages"])}</p>
        </div>
    </div>''')

    # Page 4: Assessment Summary + Consultant Note
    assess_rows = ""
    for k, v in D11_DATA["assessment_summary"].items():
        labels = {"leadership":"领导力","strategic_thinking":"战略思维","communication":"沟通能力","cultural_fit":"文化匹配度","overall_rating":"综合评价"}
        assess_rows += f'''<tr>
            <td style="padding:6px 10px;border-bottom:1px solid #F0F0F0;font-size:9.5pt;">{labels.get(k,k)}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #F0F0F0;font-size:9.5pt;font-weight:600;{"color:#C108AB" if "推荐" in v or v=="卓越" else ""}">{v}</td>
        </tr>'''

    pages.append(f'''<div class="page">
        {build_doc_header("候选人简历", D11_DATA["date"])}
        <div style="padding:25px 30px;">
            <div class="section-title" style="margin-top:5px;">评估摘要</div>
            <table style="width:100%;border-collapse:collapse;">
                {assess_rows}
            </table>

            <div class="section-title">顾问评语</div>
            {build_callout(D11_DATA["consultant_note"])}

            <div style="margin-top:30px;padding-top:15px;border-top:1px solid #E0E0E0;">
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:9pt;color:gray;">
                    <div>
                        <div style="font-weight:600;color:#333;">LYC Partners</div>
                        <div>高端人才寻聘与组织发展咨询</div>
                    </div>
                    <div style="text-align:right;">
                        <div>本文件仅供内部决策使用</div>
                        <div>请勿外传</div>
                    </div>
                </div>
            </div>
        </div>
    </div>''')

    html = wrap_a4_multi(pages, "候选人简历", "机密文件", True)
    path = os.path.join(OUT, "D11_CV_Presentation.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  D11_CV_Presentation: {len(html)//1024}KB")
    return path


# ── D24: Offer Letter Template ──
D24_DATA = {
    "candidate_name": "李思涵",
    "role_title": "产品总监",
    "client_company": "星辰科技有限公司",
    "date": "2026-07-22",
    "offer_details": {
        "start_date": "2026年9月1日",
        "base_salary": "¥80,000/月",
        "bonus_structure": "年度绩效奖金，目标为4个月基本薪资，根据公司业绩和个人表现浮动",
        "equity": "期权授予10,000股，分4年归属，首年cliff",
        "benefits": [
            "五险一金按最高基数缴纳",
            "补充商业医疗保险（含子女）",
            "每年15天带薪年假",
            "弹性工作制",
            "年度体检",
            "学习发展津贴 ¥10,000/年",
        ],
        "reporting_to": "首席执行官 (CEO)",
        "location": "上海市浦东新区",
        "probation_period": "3个月",
        "acceptance_deadline": "2026年7月29日",
    },
    "conditions": [
        "通过背景调查（学历、工作经历、无犯罪记录）",
        "提供前雇主离职证明",
        "签署保密协议及竞业限制协议",
        "通过入职体检",
    ],
}

def gen_d24():
    cond_html = "".join(f"<li>{c}</li>" for c in D24_DATA["conditions"])
    benefits_html = "".join(f"<li>{b}</li>" for b in D24_DATA["offer_details"]["benefits"])

    body = f'''<div class="page">
        {build_doc_header("录用通知书 | Offer Letter", D24_DATA["date"])}
        <div style="padding:30px 40px;font-size:10.5pt;line-height:1.8;">
            <div style="text-align:right;margin-bottom:20px;">
                <div style="font-weight:600;">{D24_DATA["client_company"]}</div>
                <div style="color:gray;font-size:9.5pt;">{D24_DATA["date"]}</div>
            </div>

            <div style="margin-bottom:15px;">
                <div style="font-weight:600;">尊敬的 {D24_DATA["candidate_name"]}：</div>
            </div>

            <p style="margin-bottom:15px;">经过多轮面试与综合评估，我们非常高兴地向您发出正式录用通知，诚挚邀请您加入 {D24_DATA["client_company"]}，担任 <strong>{D24_DATA["role_title"]}</strong> 一职。</p>

            <div class="section-title">职位详情</div>
            <table style="width:100%;font-size:10pt;border-collapse:collapse;margin-bottom:15px;">
                <tr><td style="padding:6px 10px;width:30%;color:gray;border-bottom:1px solid #F0F0F0;">职位名称</td><td style="padding:6px 10px;border-bottom:1px solid #F0F0F0;font-weight:600;">{D24_DATA["role_title"]}</td></tr>
                <tr><td style="padding:6px 10px;color:gray;border-bottom:1px solid #F0F0F0;">汇报对象</td><td style="padding:6px 10px;border-bottom:1px solid #F0F0F0;">{D24_DATA["offer_details"]["reporting_to"]}</td></tr>
                <tr><td style="padding:6px 10px;color:gray;border-bottom:1px solid #F0F0F0;">工作地点</td><td style="padding:6px 10px;border-bottom:1px solid #F0F0F0;">{D24_DATA["offer_details"]["location"]}</td></tr>
                <tr><td style="padding:6px 10px;color:gray;border-bottom:1px solid #F0F0F0;">入职日期</td><td style="padding:6px 10px;border-bottom:1px solid #F0F0F0;">{D24_DATA["offer_details"]["start_date"]}</td></tr>
                <tr><td style="padding:6px 10px;color:gray;border-bottom:1px solid #F0F0F0;">试用期</td><td style="padding:6px 10px;border-bottom:1px solid #F0F0F0;">{D24_DATA["offer_details"]["probation_period"]}</td></tr>
            </table>

            <div class="section-title">薪酬福利</div>
            <table style="width:100%;font-size:10pt;border-collapse:collapse;margin-bottom:10px;">
                <tr><td style="padding:6px 10px;width:30%;color:gray;border-bottom:1px solid #F0F0F0;">基本薪资</td><td style="padding:6px 10px;border-bottom:1px solid #F0F0F0;font-weight:600;">{D24_DATA["offer_details"]["base_salary"]}</td></tr>
                <tr><td style="padding:6px 10px;color:gray;border-bottom:1px solid #F0F0F0;">绩效奖金</td><td style="padding:6px 10px;border-bottom:1px solid #F0F0F0;">{D24_DATA["offer_details"]["bonus_structure"]}</td></tr>
                <tr><td style="padding:6px 10px;color:gray;border-bottom:1px solid #F0F0F0;">长期激励</td><td style="padding:6px 10px;border-bottom:1px solid #F0F0F0;">{D24_DATA["offer_details"]["equity"]}</td></tr>
            </table>
            <div style="font-size:10pt;font-weight:600;margin-bottom:5px;">其他福利：</div>
            <ul style="margin-left:20px;font-size:10pt;line-height:1.7;margin-bottom:15px;">{benefits_html}</ul>

            <div class="section-title">录用条件</div>
            <ul style="margin-left:20px;font-size:10pt;line-height:1.7;margin-bottom:15px;">{cond_html}</ul>

            {build_callout(f'请在 <strong>{D24_DATA["offer_details"]["acceptance_deadline"]}</strong> 前回复确认接受此录用通知。如有任何疑问，请随时与我们联系。')}

            <div style="margin-top:30px;">
                <p style="margin-bottom:20px;">我们期待您加入团队，共创辉煌！</p>
                <div style="display:flex;gap:40px;margin-top:30px;">
                    <div style="flex:1;">
                        <div style="border-top:1px solid #333;padding-top:5px;font-size:9pt;">
                            <div>公司授权签署人</div>
                            <div style="color:gray;">日期：</div>
                        </div>
                    </div>
                    <div style="flex:1;">
                        <div style="border-top:1px solid #333;padding-top:5px;font-size:9pt;">
                            <div>候选人确认签署</div>
                            <div style="color:gray;">日期：</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>'''

    html = wrap_a4_multi([
        build_cover("录用通知书", f"{D24_DATA['candidate_name']} — {D24_DATA['role_title']}",
                    [f"公司: {D24_DATA['client_company']}", f"日期: {D24_DATA['date']}", "机密文件"], "机密"),
        body
    ], "录用通知书", "机密", True)
    path = os.path.join(OUT, "D24_Offer_Letter.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  D24_Offer_Letter: {len(html)//1024}KB")
    return path


# ── D25: Counter-Offer Advisory Brief ──
D25_DATA = {
    "candidate_name": "王志强",
    "mandate_id": "MND-2026-042",
    "role_title": "技术副总裁",
    "client_company": "远景科技集团",
    "date": "2026-07-22",
    "risk_level": "高",
    "risk_score": 78,
    "current_compensation": "¥95,000/月 + 年终6个月",
    "offered_compensation": "¥120,000/月 + 年终4个月 + 期权",
    "likely_counter_range": "¥110,000-125,000/月 + 加速股权归属",
    "historical_acceptance_rate": "62%",
    "advisory_points": [
        "该候选人目前担任关键项目负责人，离职将导致项目延期，现雇主极有可能进行挽留",
        "现雇主近期完成B轮融资，资金充裕，具备匹配薪资条件",
        "候选人与直属上级关系密切，情感挽留可能性高",
        "候选人反馈对新平台的技术挑战非常感兴趣，内在动力强",
        "建议在offer沟通中强调长期发展空间和技术平台的独特价值",
    ],
    "recommended_responses": [
        "若现雇主加薪挽留：提醒候选人关注职业发展的长期轨迹，而非短期薪资提升",
        "若现雇主承诺升职：评估承诺的可执行性和时间线，对比新职位的确定性",
        "若出现情感挽留：帮助候选人区分情感因素与职业发展理性判断",
        "建议候选人在提出离职前做好充分准备，包括项目交接方案",
    ],
    "decision_framework": "建议候选人在收到正式offer后，从以下维度进行决策：(1) 3-5年职业发展路径对比；(2) 技术成长空间与行业前景；(3) 薪酬总包的长期价值（含期权预期）；(4) 团队文化匹配度；(5) 工作生活质量。建议在做出最终决定前与顾问进行深度沟通。",
}

def gen_d25():
    risk_color = "#DC2626" if D25_DATA["risk_score"] >= 70 else "#F59E0B" if D25_DATA["risk_score"] >= 50 else "#10B981"
    adv_points = "".join(f"<li>{p}</li>" for p in D25_DATA["advisory_points"])
    responses = "".join(f"<li>{r}</li>" for r in D25_DATA["recommended_responses"])

    pages = []
    pages.append(build_cover("反要约应对策略", f"{D25_DATA['candidate_name']} — {D25_DATA['role_title']}",
                              [f"项目: {D25_DATA['mandate_id']}", f"客户: {D25_DATA['client_company']}", f"日期: {D25_DATA['date']}", "机密文件"], "机密"))

    pages.append(f'''<div class="page">
        {build_doc_header("反要约应对策略", D25_DATA["date"])}
        <div style="padding:25px 30px;">
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
                {build_stat_cards([
                    {"label": "风险等级", "value": D25_DATA["risk_level"]},
                    {"label": "风险评分", "value": f'{D25_DATA["risk_score"]}/100'},
                    {"label": "历史接受率", "value": D25_DATA["historical_acceptance_rate"]},
                    {"label": "预计反要约", "value": D25_DATA["likely_counter_range"].split("+")[0].strip()},
                ])}
            </div>

            <div class="section-title" style="margin-top:5px;">薪酬对比</div>
            <table style="width:100%;font-size:9.5pt;border-collapse:collapse;margin-bottom:15px;">
                <tr style="background:#F5F5F5;">
                    <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #E0E0E0;">项目</th>
                    <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #E0E0E0;">当前薪酬</th>
                    <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #E0E0E0;">新Offer</th>
                    <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #E0E0E0;">预估反要约</th>
                </tr>
                <tr>
                    <td style="padding:6px 10px;border-bottom:1px solid #F0F0F0;font-weight:600;">月薪</td>
                    <td style="padding:6px 10px;border-bottom:1px solid #F0F0F0;">{D25_DATA["current_compensation"].split("+")[0].strip()}</td>
                    <td style="padding:6px 10px;border-bottom:1px solid #F0F0F0;color:#C108AB;font-weight:600;">{D25_DATA["offered_compensation"].split("+")[0].strip()}</td>
                    <td style="padding:6px 10px;border-bottom:1px solid #F0F0F0;">{D25_DATA["likely_counter_range"].split("+")[0].strip()}</td>
                </tr>
                <tr>
                    <td style="padding:6px 10px;border-bottom:1px solid #F0F0F0;font-weight:600;">奖金/股权</td>
                    <td style="padding:6px 10px;border-bottom:1px solid #F0F0F0;">年终6个月</td>
                    <td style="padding:6px 10px;border-bottom:1px solid #F0F0F0;color:#C108AB;">年终4个月 + 期权</td>
                    <td style="padding:6px 10px;border-bottom:1px solid #F0F0F0;">加速归属</td>
                </tr>
            </table>

            <div class="section-title">风险因素分析</div>
            <ul style="margin-left:18px;font-size:9.5pt;line-height:1.8;margin-bottom:15px;">{adv_points}</ul>

            <div class="section-title">建议应对策略</div>
            <ul style="margin-left:18px;font-size:9.5pt;line-height:1.8;margin-bottom:15px;">{responses}</ul>

            <div class="section-title">决策框架</div>
            {build_callout(D25_DATA["decision_framework"])}
        </div>
    </div>''')

    html = wrap_a4_multi(pages, "反要约应对策略", "机密文件", True)
    path = os.path.join(OUT, "D25_Counter_Offer_Advisory.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  D25_Counter_Offer_Advisory: {len(html)//1024}KB")
    return path


# ── D40: Criterion Validation Report ──
D40_DATA = {
    "report_title": "SHIFT Assessment 预测效度验证报告",
    "instrument": "SHIFT 综合领导力评估工具 v3.2",
    "sample_size": 326,
    "date_range": "2024.01 - 2026.06",
    "date_generated": "2026-07-22",
    "methodology": "本研究采用效标关联效度（Criterion-Related Validity）设计，以326名经过SHIFT评估的高管候选人作为样本，追踪其入职后6-18个月的绩效评估数据（360度反馈 + KPI达成率），通过Pearson相关分析和多元回归分析检验评估维度的预测有效性。",
    "correlations": [
        {"dimension": "战略思维", "correlation": 0.72, "significance": "p < 0.001"},
        {"dimension": "领导力", "correlation": 0.68, "significance": "p < 0.001"},
        {"dimension": "决策能力", "correlation": 0.65, "significance": "p < 0.001"},
        {"dimension": "沟通协作", "correlation": 0.58, "significance": "p < 0.01"},
        {"dimension": "变革管理", "correlation": 0.61, "significance": "p < 0.01"},
        {"dimension": "结果导向", "correlation": 0.54, "significance": "p < 0.01"},
        {"dimension": "学习能力", "correlation": 0.49, "significance": "p < 0.05"},
        {"dimension": "文化适应性", "correlation": 0.46, "significance": "p < 0.05"},
    ],
    "predictive_accuracy": 78.5,
    "roi_analysis": "基于SHIFT评估工具的录用决策相比传统面试方法，在以下方面展现出显著ROI：(1) 试用期通过率提升23%（从71%→94%）；(2) 首年绩效优秀率提升31%；(3) 18个月内离职率降低42%；(4) 预计每笔成功录用节省隐性成本约¥180,000。",
    "conclusions": [
        "SHIFT评估工具整体预测效度良好（r=0.65, p<0.001），达到心理测量学可接受标准",
        "战略思维、领导力、决策能力三个维度预测效度最高，是核心甄选指标",
        "评估工具对高管层级的预测效度（r=0.71）显著优于中层（r=0.58）",
        "文化适应性维度预测效度相对较低，建议结合结构化面试综合判断",
    ],
    "recommendations": [
        "将SHIFT评估作为高管甄选的核心工具之一，权重建议占综合决策的40%",
        "针对战略思维和领导力维度设置更高的通过阈值（≥75分）",
        "文化适应性评估建议配合结构化行为面试（BEI）使用",
        "建议每年进行一次效度验证，持续追踪评估工具的预测准确性",
        "考虑引入行业常模，提升跨行业评估的精准度",
    ],
}

def gen_d40():
    corr_rows = ""
    for c in D40_DATA["correlations"]:
        r_val = c["correlation"]
        bar_color = "#C108AB" if r_val >= 0.65 else "#8B5CF6" if r_val >= 0.50 else "#B0B0B0"
        bar_width = int(r_val * 100)
        corr_rows += f'''<tr>
            <td style="padding:6px 10px;border-bottom:1px solid #F0F0F0;font-size:9pt;font-weight:600;">{c["dimension"]}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #F0F0F0;font-size:9pt;">r = {r_val:.2f}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #F0F0F0;font-size:9pt;">{c["significance"]}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #F0F0F0;width:35%;">
                <div style="height:8px;background:#F0F0F0;border-radius:4px;">
                    <div style="width:{bar_width}%;height:100%;background:{bar_color};border-radius:4px;"></div>
                </div>
            </td>
        </tr>'''

    conclusions_html = "".join(f"<li>{c}</li>" for c in D40_DATA["conclusions"])
    recs_html = "".join(f"<li>{r}</li>" for r in D40_DATA["recommendations"])

    pages = []
    pages.append(build_cover("效标验证报告", D40_DATA["report_title"],
                              [f"评估工具: {D40_DATA['instrument']}", f"样本量: {D40_DATA['sample_size']}", f"日期范围: {D40_DATA['date_range']}", f"生成日期: {D40_DATA['date_generated']}"], "机密"))

    pages.append(f'''<div class="page">
        {build_doc_header("效标验证报告", D40_DATA["date_generated"])}
        <div style="padding:25px 30px;">
            <div class="section-title" style="margin-top:5px;">研究方法论</div>
            <p style="font-size:9.5pt;line-height:1.7;margin-bottom:15px;">{D40_DATA["methodology"]}</p>

            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
                {build_stat_cards([
                    {"label": "样本量", "value": f'{D40_DATA["sample_size"]}人'},
                    {"label": "预测准确率", "value": f'{D40_DATA["predictive_accuracy"]}%'},
                    {"label": "整体效度", "value": "r=0.65***"},
                ])}
            </div>

            <div class="section-title">维度效度相关矩阵</div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:15px;">
                <tr style="background:#F5F5F5;">
                    <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #E0E0E0;font-size:9pt;">评估维度</th>
                    <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #E0E0E0;font-size:9pt;">相关系数</th>
                    <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #E0E0E0;font-size:9pt;">显著性</th>
                    <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #E0E0E0;font-size:9pt;">效应量</th>
                </tr>
                {corr_rows}
            </table>

            <div class="section-title">投资回报分析</div>
            {build_callout(D40_DATA["roi_analysis"])}
        </div>
    </div>''')

    pages.append(f'''<div class="page">
        {build_doc_header("效标验证报告", D40_DATA["date_generated"])}
        <div style="padding:25px 30px;">
            <div class="section-title" style="margin-top:5px;">研究结论</div>
            <ul style="margin-left:18px;font-size:9.5pt;line-height:1.8;margin-bottom:20px;">{conclusions_html}</ul>

            <div class="section-title">建议与行动计划</div>
            <ul style="margin-left:18px;font-size:9.5pt;line-height:1.8;margin-bottom:20px;">{recs_html}</ul>

            <div style="margin-top:30px;padding-top:15px;border-top:1px solid #E0E0E0;">
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:9pt;color:gray;">
                    <div>
                        <div style="font-weight:600;color:#333;">LYC Partners</div>
                        <div>人才评估与组织发展中心</div>
                    </div>
                    <div style="text-align:right;">
                        <div>本报告基于统计分析结果</div>
                        <div>仅供内部决策参考</div>
                    </div>
                </div>
            </div>
        </div>
    </div>''')

    html = wrap_a4_multi(pages, "效标验证报告", "机密文件", True)
    path = os.path.join(OUT, "D40_Criterion_Validation.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  D40_Criterion_Validation: {len(html)//1024}KB")
    return path


# ── Generate All ──
if __name__ == "__main__":
    print("Generating missing documents...")
    gen_d11()
    gen_d24()
    gen_d25()
    gen_d40()
    print("Done! 4 documents generated.")
