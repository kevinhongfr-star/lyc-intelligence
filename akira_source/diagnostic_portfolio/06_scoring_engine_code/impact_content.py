"""
IMPACT Dimension Content Library — Gold Standard Narratives
IMPACT: Board Effectiveness Assessment
5 Dimensions: Strategic Oversight, Governance Rigour, Stakeholder Intelligence, Mandate Legacy, APAC Mandate Credibility
"""

IMPACT_DIMENSIONS = {
    "Strategic Oversight": {
        "id": "D1",
        "construct": "Board Effectiveness Assessment",
        "description": [
            "Strategic Oversight measures a board member's capacity to provide effective strategic governance — not to formulate strategy (that is management's role), but to evaluate, challenge, and steward the organisation's strategic direction with rigour and independence. In a board context, strategic oversight is the fiduciary responsibility to ensure management's strategic choices serve long-term shareholder and stakeholder value, not short-term operational convenience.",
            "At the IMPACT level, Strategic Oversight is measured as a demonstrated governance capability: can the candidate challenge management's strategic assumptions effectively? Can they identify strategic risks that management may be incentivised to understate? Can they ensure the board's strategic agenda is forward-looking rather than retrospective?",
            "This dimension is critical in APAC board contexts where governance maturity varies significantly — from Singapore and Australia's well-established board governance cultures to markets where board independence is still developing. A board member with strong Strategic Oversight capability can elevate the entire board's strategic effectiveness, not just their own contribution."
        ],
        "sub_dim_interpretation": {
            "Strategic challenge capability": "The ability to ask the questions that management hasn't asked — and to persist when the answers are uncomfortable. This is the core governance function: independent challenge.",
            "Risk oversight effectiveness": "Ensuring strategic risks (reputational, regulatory, competitive, technological) are identified, assessed, and mitigated at the board level — not delegated to management without board visibility.",
            "Long-term value stewardship": "Maintaining focus on long-term value creation even when short-term pressures (activist investors, quarterly earnings, market sentiment) push toward myopic decision-making.",
            "Strategic agenda setting": "Ensuring the board's agenda allocates sufficient time to forward-looking strategic matters rather than being consumed by retrospective compliance and reporting.",
            "Management-strategic tension navigation": "Navigating the inherent tension between management's operational expertise and the board's governance responsibility — challenging without undermining, questioning without micromanaging.",
            "Competitive landscape awareness": "Maintaining independent awareness of the competitive landscape so the board can evaluate management's strategic proposals against market reality, not just internal narratives."
        },
        "band_narratives": {
            "Strong (≥70%)": "This candidate provides mature strategic oversight capability. They can independently evaluate management's strategic proposals, identify risks that management may understate, and ensure the board's strategic agenda is forward-looking. In practice, they are likely the board member who asks the question that reframes the strategic discussion — not to be contrarian, but because they see a dimension of strategic risk or opportunity that others have missed. Their governance value extends beyond their own expertise: they elevate the entire board's strategic rigour by modelling independent challenge and long-term value orientation. The risk at this level is over-challenge — the board member who opposes every strategic proposal on principle, creating a dysfunctional management-board dynamic rather than productive tension.",
            "Developing (50-69%)": "This candidate shows moderate strategic oversight capability. They can evaluate strategic proposals in familiar domains — where they have industry or functional expertise — but may struggle to provide effective challenge in unfamiliar strategic contexts or when management's strategic rationale is technically sophisticated. In practice, they contribute more effectively when the strategic discussion aligns with their expertise and less effectively when it requires independent analytical challenge beyond their domain. The development priority is building independent analytical challenge capability — the ability to evaluate strategic proposals on their analytical merits rather than relying on domain familiarity.",
            "Gap (<50%)": "This candidate shows significant strategic oversight gaps that will limit their board effectiveness. They may be a valuable board member in other dimensions — governance process, stakeholder relationships, compliance oversight — but their contribution to strategic governance will be limited. In practice, this manifests as: difficulty challenging management's strategic assumptions; tendency to defer to management's expertise rather than providing independent evaluation; and limited ability to identify strategic risks that management may understate. For advisory board roles where strategic challenge is not the primary function, this may be manageable. For fiduciary board roles, strategic oversight is a minimum requirement."
        },
        "overuse_risks": "Strategic Oversight overused becomes governance gridlock: the board member who challenges every proposal so vigorously that management stops bringing bold strategic options forward, the board becomes consumed with risk avoidance rather than value creation, and the organisation's strategic velocity slows to a crawl. In practice, this looks like: declining strategic proposals not because they are poor but because they are imperfect; excessive risk focus that crowds out opportunity evaluation; and a management-board dynamic that has shifted from productive tension to adversarial paralysis.",
        "cross_dynamics": [
            {"dim": "Governance Rigour", "interaction": "Strategic Oversight without Governance Rigour produces strategic challenge without process discipline — valuable insights that don't translate into governance outcomes. Governance Rigour without Strategic Oversight produces well-structured board processes that never ask the right questions.", "risk": "high"},
            {"dim": "Stakeholder Intelligence", "interaction": "Strategic decisions affect stakeholders differently. Stakeholder Intelligence ensures that strategic oversight considers all stakeholder impacts — not just shareholder value.", "risk": "medium"},
            {"dim": "Mandate Legacy", "interaction": "The long-term orientation connection. Strategic Oversight ensures the board looks forward; Mandate Legacy ensures it builds for the future. Together, they create a board that is both strategically aware and legacy-oriented.", "risk": "medium"},
            {"dim": "APAC Mandate Credibility", "interaction": "In APAC markets where governance maturity varies, Strategic Oversight must be calibrated to the local governance culture. Over-applying Western governance challenge norms in relationship-based APAC board cultures can be counterproductive.", "risk": "medium"}
        ],
        "coaching_prompts": [
            "In the last year, what strategic proposal did you challenge most effectively? What was the question you asked that reframed the discussion? What was the outcome?",
            "When management presents a strategy you're not expert in, how do you evaluate it? What is your process for providing independent challenge beyond domain expertise?",
            "What strategic risk did the board identify late — after it had already materialised? What would have surfaced it earlier?",
            "How much of your board's agenda is forward-looking vs. retrospective? What would an optimal balance look like?",
            "How do you navigate the tension between challenging management and maintaining a constructive relationship? Where is the line between governance rigour and micromanagement?"
        ],
        "apac_calibration": [
            "Governance Maturity Spectrum: APAC governance cultures range from mature (Singapore, Australia — independent directors, active challenge culture) to developing (Indonesia, Thailand — relationship-based boards, deference to seniority/controlling shareholders). Strategic Oversight capability must be expressed differently in each context — the same challenge behaviour that is valued in Singapore may be culturally disruptive in Jakarta.",
            "Controlling Shareholder Dynamics: In many APAC markets, boards are dominated by controlling shareholders or family principals. Strategic Oversight in these contexts requires navigating the tension between independent governance responsibility and the reality that strategic direction is often set by the controlling shareholder. The most effective board members find ways to provide strategic input that is respected rather than perceived as opposition.",
            "Regulatory Evolution: APAC governance regulation is evolving rapidly — from Singapore's rigorous code to China's evolving governance framework to India's accelerating independence requirements. Strategic Oversight capability must anticipate where regulation is going, not just where it is today."
        ]
    },

    "Governance Rigour": {
        "id": "D2",
        "construct": "Board Effectiveness Assessment",
        "description": [
            "Governance Rigour measures a board member's capacity to maintain the structural discipline that makes effective governance possible — ensuring compliance without letting compliance consume the board, maintaining process integrity without letting process become bureaucracy, and upholding fiduciary responsibility without letting risk aversion crowd out value creation. It is the infrastructure of effective governance.",
            "At the IMPACT level, Governance Rigour is measured as a demonstrated process and discipline capability: can the candidate ensure board processes are followed without becoming process-obsessed? Can they maintain compliance while keeping the board strategically focused? Can they balance fiduciary prudence with the risk tolerance that value creation requires?",
            "This dimension is particularly important in APAC governance contexts where regulatory compliance requirements are evolving rapidly and where governance maturity varies across markets. A board member with strong Governance Rigour can help build governance infrastructure that is appropriate to the market's maturity level."
        ],
        "sub_dim_interpretation": {
            "Process discipline": "Ensuring board processes — agenda setting, information flow, decision-making protocols, follow-through — are well-designed and consistently followed. This is the structural foundation of effective governance.",
            "Compliance intelligence": "Maintaining awareness of regulatory requirements without letting compliance dominate the board's agenda. The distinction between compliance as a minimum standard and compliance as a governance ceiling.",
            "Fiduciary clarity": "Understanding fiduciary duties — duty of care, duty of loyalty, duty of good faith — and ensuring board decisions are consistent with these obligations. In APAC markets, fiduciary standards vary and are evolving.",
            "Information architecture": "Ensuring the board receives the right information, in the right format, at the right time. Poor information flow is the most common root cause of governance failure.",
            "Decision-quality assurance": "Creating conditions for high-quality board decisions — adequate deliberation time, diverse perspectives, challenge culture, and documented rationale.",
            "Governance self-assessment": "The board's capacity to evaluate its own effectiveness — not just individual director performance but collective board performance against its governance charter."
        },
        "band_narratives": {
            "Strong (≥70%)": "This candidate provides mature governance rigour. They ensure board processes are well-designed and followed, compliance is maintained without dominating the agenda, and fiduciary responsibilities are upheld with both discipline and judgment. In practice, they are often the board member who notices when a decision is being made without adequate information, when a compliance requirement is being treated as a formality, or when the board's agenda has drifted from governance to management. Their contribution is often invisible when things are going well — and critically visible when governance discipline prevents a failure. The risk at this level is process over-function: the governance expert who optimises process at the expense of strategic contribution.",
            "Developing (50-69%)": "This candidate shows moderate governance rigour. They understand governance requirements and can maintain compliance in well-defined contexts — but may struggle with: designing governance processes for new or evolving situations; balancing compliance requirements with strategic imperatives; and providing governance challenge when the board is under pressure to act quickly. In practice, they contribute effectively to governance process but may not elevate the board's governance discipline beyond basic compliance. The development priority is building governance design capability — the ability to create governance structures that are appropriate to the organisation's complexity and maturity.",
            "Gap (<50%)": "This candidate shows significant governance rigour gaps. They may contribute in other dimensions — strategic insight, stakeholder relationships, industry expertise — but their governance process contribution is limited. In practice, this manifests as: difficulty ensuring board processes are followed; tendency to treat compliance as a checklist rather than a governance discipline; and limited capacity to design or improve governance structures. For advisory roles where governance process is handled by others, this may be manageable. For fiduciary roles, governance rigour is a minimum requirement."
        },
        "overuse_risks": "Governance Rigour overused becomes governance bureaucracy: the board member who insists on process for process's sake, extends deliberation beyond what the decision requires, and creates a compliance culture that prevents strategic velocity. The over-rigorous governor is the one who says 'we need another committee review' when the board is already over-committed, who flags every risk without assessing materiality, and who makes the board's relationship with management more bureaucratic than collaborative.",
        "cross_dynamics": [
            {"dim": "Strategic Oversight", "interaction": "The core governance pair. Governance Rigour provides the process; Strategic Oversight provides the content. Together, they ensure the board both asks the right questions and has the discipline to act on the answers.", "risk": "high"},
            {"dim": "Stakeholder Intelligence", "interaction": "Governance processes must serve stakeholder interests. Governance Rigour without Stakeholder Intelligence can create processes that are technically compliant but substantively misaligned with stakeholder expectations.", "risk": "medium"},
            {"dim": "Mandate Legacy", "interaction": "Governance Rigour builds the institutional infrastructure; Mandate Legacy provides the strategic direction for that infrastructure. The most effective governance structures serve the organisation's long-term mandate, not just its current compliance requirements.", "risk": "low"},
            {"dim": "APAC Mandate Credibility", "interaction": "In APAC markets, governance expectations are evolving rapidly. Governance Rigour must be calibrated to the market's current governance maturity while building toward higher standards — neither over-governing relative to the market's expectations nor under-governing relative to fiduciary duties.", "risk": "medium"}
        ],
        "coaching_prompts": [
            "When was the last time you improved a board process? What was the problem, what did you change, and what was the result?",
            "How do you balance compliance requirements with the board's need for strategic bandwidth? When has compliance consumed too much agenda time?",
            "What information does the board receive that is most valuable — and what information is received that adds no governance value? How would you redesign the information flow?",
            "How does your board evaluate its own effectiveness? Is that evaluation genuinely independent — or is it a compliance exercise?",
            "What governance failure have you witnessed or been close to? What process gap caused it — and what change did you make in response?"
        ],
        "apac_calibration": [
            "Regulatory Patchwork: APAC governance regulation varies dramatically — from Singapore's comprehensive code to emerging frameworks in developing markets. Governance Rigour must navigate this patchwork without over-applying the most rigorous standard to every market or under-applying standards where enforcement is lighter.",
            "Related-Party Complexity: In APAC markets with concentrated ownership, related-party transactions are common and governance-challenging. Governance Rigour in these contexts requires particular attention to conflict-of-interest identification and independent oversight of related-party dealings.",
            "Board Refreshment Norms: APAC board refreshment practices vary — from Australia's强制性 tenure limits to Japan's lifetime directorships. Governance Rigour must ensure board composition evolves appropriately within each market's cultural and regulatory constraints."
        ]
    },

    "Stakeholder Intelligence": {
        "id": "D3",
        "construct": "Board Effectiveness Assessment",
        "description": [
            "Stakeholder Intelligence measures a board member's capacity to understand, engage with, and balance the interests of the organisation's diverse stakeholders — shareholders, employees, regulators, communities, and broader society. In a governance context, this is the capability that ensures board decisions reflect not just shareholder value but the full stakeholder ecosystem that determines long-term organisational sustainability.",
            "At the IMPACT level, Stakeholder Intelligence is measured as a demonstrated governance capability: can the candidate identify and assess stakeholder impacts of board decisions? Can they engage with stakeholders in ways that inform governance rather than compromise independence? Can they navigate the inherent tensions between stakeholder groups when their interests diverge?",
            "This dimension is particularly critical in APAC governance where stakeholder ecosystems are often more complex — government as both regulator and shareholder, family interests, labour relations in different cultural contexts, and community expectations that differ from Western stakeholder models."
        ],
        "sub_dim_interpretation": {
            "Stakeholder identification": "The ability to identify all material stakeholders — not just the obvious ones (shareholders, regulators) but the less visible stakeholders whose interests can become material if ignored (communities, future employees, supply chain partners).",
            "Interest mapping": "Understanding what each stakeholder group actually wants — not what the board assumes they want. This requires active engagement, not just assumption.",
            "Tension navigation": "When stakeholder interests conflict (e.g., shareholder returns vs. employee welfare, regulatory compliance vs. competitive positioning), navigating the trade-offs with transparency and principle.",
            "Engagement architecture": "Designing stakeholder engagement mechanisms that inform governance without compromising board independence — the line between 'listening to stakeholders' and 'being captured by stakeholders.'",
            "ESG integration": "Understanding how environmental, social, and governance factors affect stakeholder perceptions and long-term value — and ensuring these factors are integrated into board decision-making rather than siloed in a committee.",
            "Cultural stakeholder awareness": "Understanding how stakeholder expectations vary across cultures — particularly important for APAC boards of multinational organisations."
        },
        "band_narratives": {
            "Strong (≥70%)": "This candidate demonstrates mature stakeholder intelligence. They can identify and assess the full stakeholder ecosystem, engage with stakeholders in ways that inform governance without compromising independence, and navigate stakeholder tensions with principle and transparency. In practice, they are often the board member who asks: 'Who else is affected by this decision that we haven't considered?' — and ensures the answer is genuine, not performative. Their stakeholder intelligence elevates the board's decision quality by ensuring decisions are made with full awareness of their stakeholder implications, not just their shareholder implications. The risk at this level is stakeholder capture — becoming so aligned with a particular stakeholder group's perspective that the board member loses independent judgment.",
            "Developing (50-69%)": "This candidate shows moderate stakeholder intelligence. They understand the importance of stakeholder consideration and can identify obvious stakeholder impacts — but may struggle with: identifying non-obvious stakeholders whose interests may become material; engaging with stakeholders in ways that genuinely inform governance; and navigating tensions when stakeholder interests conflict. In practice, their stakeholder consideration tends to focus on the most visible and vocal stakeholder groups rather than the full ecosystem. The development priority is expanding stakeholder range and building engagement capability that goes beyond reactive responsiveness.",
            "Gap (<50%)": "This candidate shows significant stakeholder intelligence gaps. They may be effective in other governance dimensions — strategic oversight, governance rigour, mandate legacy — but their decisions are likely to be made with limited stakeholder awareness. In practice, this manifests as: decisions that create unintended stakeholder consequences; difficulty explaining board decisions to non-shareholder stakeholders; and tendency to treat stakeholder engagement as a compliance exercise rather than a governance capability. In APAC contexts where stakeholder ecosystems are particularly complex, this gap is more consequential."
        },
        "overuse_risks": "Stakeholder Intelligence overused becomes stakeholder paralysis: the board member who insists on consulting every stakeholder before any decision, who treats every stakeholder concern as equally material regardless of actual impact, and who creates decision gridlock by trying to satisfy all stakeholders simultaneously. The over-intelligent stakeholder navigator also risks losing independent judgment — becoming a conduit for stakeholder interests rather than an independent evaluator of them.",
        "cross_dynamics": [
            {"dim": "Strategic Oversight", "interaction": "Strategic decisions create stakeholder impacts; stakeholder intelligence ensures those impacts are considered. Together, they create strategically sound decisions that are also stakeholder-aware.", "risk": "medium"},
            {"dim": "Governance Rigour", "interaction": "Stakeholder engagement must be governed — processes for identification, engagement, and conflict resolution. Governance Rigour ensures stakeholder intelligence operates within a disciplined governance framework.", "risk": "medium"},
            {"dim": "Mandate Legacy", "interaction": "Long-term value creation requires long-term stakeholder management. Mandate Legacy provides the long-term orientation; Stakeholder Intelligence provides the stakeholder awareness to sustain that orientation.", "risk": "medium"},
            {"dim": "APAC Mandate Credibility", "interaction": "In APAC markets, stakeholder ecosystems are often more complex and more political. Government as shareholder, family interests, cultural expectations — all create stakeholder dynamics that are unfamiliar to Western governance models.", "risk": "high"}
        ],
        "coaching_prompts": [
            "For the last major board decision, who were the stakeholders affected — and which stakeholders did you not consider that later became relevant?",
            "When stakeholder interests conflict on a board decision, what is your decision framework? How do you make trade-offs transparent?",
            "How do you engage with stakeholders without being captured by them? Where is the line between informed governance and stakeholder influence?",
            "In your APAC market, what stakeholder dynamics differ from Western governance models? How has that affected your board's decision-making?",
            "How is ESG integrated into your board's decision-making? Is it genuinely integrated — or siloed in a committee that the main board can ignore?"
        ],
        "apac_calibration": [
            "Government as Stakeholder: In many APAC markets, government is simultaneously regulator, shareholder, and policy-setter. This creates stakeholder dynamics that are qualitatively different from Western models where government is primarily regulator. Board members must navigate government interests with particular skill — understanding both the formal regulatory requirements and the informal expectations that affect governance decisions.",
            "Family & Controlling Shareholder Dynamics: In family-dominated APAC businesses, the controlling family is a stakeholder with unique influence. Stakeholder Intelligence in these contexts must account for family dynamics — succession, family governance, intergenerational transitions — that are not typically factors in widely-held Western companies.",
            "Labour & Community Expectations: APAC labour and community expectations vary significantly — from Australia's activist labour culture to Japan's lifetime employment traditions to China's evolving labour landscape. Stakeholder Intelligence must be calibrated to the specific cultural context."
        ]
    },

    "Mandate Legacy": {
        "id": "D4",
        "construct": "Board Effectiveness Assessment",
        "description": [
            "Mandate Legacy measures a board member's capacity to think and act with a long-term orientation — building governance contributions that outlast their board tenure and creating institutional value that persists beyond individual decisions. In a governance context, this is the capability that separates board members who create lasting governance improvement from those who contribute only while they are in the room.",
            "At the IMPACT level, Mandate Legacy is measured as a demonstrated governance orientation: does the candidate make decisions with long-term institutional impact in mind? Do they invest in governance infrastructure that will outlast their tenure? Do they develop the next generation of governance capability — both within the board and in management?",
            "This dimension is particularly important in APAC governance contexts where many organisations are multi-generational — family businesses, conglomerates, and institutions with decades or centuries of history. In these contexts, mandate legacy is not just a governance aspiration but a cultural expectation."
        ],
        "sub_dim_interpretation": {
            "Long-term decision orientation": "Making board decisions with a multi-year impact horizon rather than optimising for the current period. This is the cognitive foundation of mandate legacy — the ability to think beyond the current term.",
            "Institutional capability building": "Investing in governance infrastructure — processes, culture, capability — that will outlast individual board members. The distinction between personal governance contribution and institutional governance improvement.",
            "Succession contribution": "Actively developing the next generation of board and management capability — not just identifying successors but building the governance capability they will need.",
            "Knowledge preservation": "Ensuring critical institutional knowledge is preserved and transferable — not locked in individual board members' experience. This is the governance version of organisational memory.",
            "Cultural legacy": "Shaping board culture in ways that persist — challenge culture, independence norms, stakeholder orientation. These cultural legacies are often the most valuable and the most fragile.",
            "Stewardship orientation": "The mindset of a steward rather than a principal — governing on behalf of future stakeholders as well as current ones. This is the philosophical foundation of mandate legacy."
        },
        "band_narratives": {
            "Strong (≥70%)": "This candidate demonstrates mature mandate legacy orientation. They make decisions with long-term institutional impact, invest in governance infrastructure that will outlast their tenure, and develop the next generation of governance capability. In practice, they are often the board member who asks: 'What will this board look like in five years — and what are we doing now to ensure it will be effective then?' Their legacy orientation is not just philosophical — it is operational: they create governance structures, develop people, and preserve knowledge that makes the board better after they leave than before they arrived. The risk at this level is excessive patience — the legacy-oriented board member who tolerates underperformance in the name of stability and continuity.",
            "Developing (50-69%)": "This candidate shows moderate mandate legacy orientation. They understand the importance of long-term governance thinking and can make decisions with some long-term awareness — but may struggle with: investing in governance infrastructure that won't show results during their tenure; developing successors who may replace them; and prioritising long-term institutional value over short-term board performance. In practice, their legacy orientation is present but not dominant — they make some decisions for the long term but also some for the current term. The development priority is shifting from personal governance contribution to institutional governance legacy.",
            "Gap (<50%)": "This candidate shows significant mandate legacy gaps. They may be effective in current-period governance — strategic oversight, compliance, stakeholder engagement — but their contribution is unlikely to persist beyond their board tenure. In practice, this manifests as: decisions optimised for the current term without long-term impact assessment; limited investment in governance infrastructure; and no active succession contribution. For short-term or advisory board roles, this may be acceptable. For fiduciary board roles in multi-generational organisations, mandate legacy is essential."
        },
        "overuse_risks": "Mandate Legacy overused becomes governance stagnation: the board member who values continuity above all else, resists necessary change in the name of institutional preservation, and tolerates underperformance because 'the institution is more important than any individual.' The over-legacy-oriented governor can become the greatest obstacle to the very institutional renewal that legacy requires — creating a paradox where the desire to preserve the institution prevents the institution from evolving.",
        "cross_dynamics": [
            {"dim": "Strategic Oversight", "interaction": "Strategic Oversight ensures the board looks forward; Mandate Legacy ensures it builds forward. Together, they create a board that is both strategically aware and institutionally constructive.", "risk": "medium"},
            {"dim": "Governance Rigour", "interaction": "Governance Rigour builds the institutional infrastructure; Mandate Legacy provides the long-term orientation for that infrastructure. Governance without legacy is process without purpose.", "risk": "medium"},
            {"dim": "Stakeholder Intelligence", "interaction": "Mandate Legacy requires considering future stakeholders — not just current ones. Stakeholder Intelligence expanded to a multi-generational horizon is the stakeholder dimension of legacy.", "risk": "medium"},
            {"dim": "APAC Mandate Credibility", "interaction": "In APAC multi-generational organisations, Mandate Legacy is both a governance capability and a cultural expectation. The most effective legacy-oriented board members in APAC align their governance legacy with the organisation's cultural legacy expectations.", "risk": "high"}
        ],
        "coaching_prompts": [
            "What governance infrastructure have you built that will outlast your board tenure? How will the board be better after you leave than before you arrived?",
            "How do you make decisions when the long-term institutional benefit requires short-term board cost? Give a specific example.",
            "Who is your governance successor? What are you doing to develop their capability — not just identify them?",
            "What institutional knowledge on your board is locked in individual experience? How would you preserve and transfer that knowledge?",
            "In five years, what will your board's governance legacy be? Is that the legacy you intend — or the one that will happen by default?"
        ],
        "apac_calibration": [
            "Multi-Generational Organisations: Many APAC organisations — Japanese keiretsu, Korean chaebol, Chinese family conglomerates, Southeast Asian business groups — are inherently multi-generational. Mandate Legacy in these contexts is not just a governance aspiration but a cultural expectation. Board members who think only in single-term horizons may be culturally misaligned.",
            "Founding Family Legacy: In family-founded APAC organisations, the founding family's legacy expectations often set the tone for governance culture. Board members must navigate the tension between institutional legacy (what's best for the organisation) and family legacy (what preserves the family's vision and control).",
            "Institutional Resilience: APAC markets are characterised by greater volatility — financial crises, regulatory shifts, political changes. Mandate Legacy in APAC must include institutional resilience: governance structures that can withstand market shocks without losing their core governance integrity."
        ]
    },

    "APAC Mandate Credibility": {
        "id": "D5",
        "construct": "Board Effectiveness Assessment",
        "description": [
            "APAC Mandate Credibility measures a board member's capacity to establish and maintain governance credibility within the specific cultural, regulatory, and stakeholder dynamics of Asia-Pacific markets. It is the dimension that ensures governance capability developed in one context translates effectively to the APAC governance environment — or is rebuilt from the ground up when it doesn't.",
            "At the IMPACT level, APAC Mandate Credibility is measured as a demonstrated contextual governance capability: does the candidate understand the specific governance dynamics of their APAC market? Can they navigate the cultural, regulatory, and stakeholder complexities that differentiate APAC governance from Western governance models? Can they build governance credibility in a context where governance norms may be different from their personal governance philosophy?",
            "This dimension is unique to IMPACT because it captures the contextual dimension of governance effectiveness that is often invisible in governance assessments designed for Western markets but is critical in APAC contexts where governance maturity, cultural norms, and stakeholder dynamics differ significantly."
        ],
        "sub_dim_interpretation": {
            "Regulatory navigation": "Understanding and operating within the specific regulatory framework of the candidate's APAC market — not just the formal requirements but the informal expectations and enforcement realities that shape actual governance behaviour.",
            "Cultural governance fluency": "Navigating governance in the context of APAC cultural norms — hierarchy, face, relationship orientation, collective decision-making — without either abandoning governance rigour or imposing culturally inappropriate governance models.",
            "Stakeholder ecosystem awareness": "Understanding the specific stakeholder dynamics of APAC governance — government as shareholder, family interests, regulatory relationships, community expectations — that create governance complexity unfamiliar in Western models.",
            "Mandate calibration": "Calibrating governance expectations to the market's maturity level — neither over-governing relative to the market's stage of development nor under-governing relative to fiduciary duties.",
            "Cross-border governance": "Navigating governance across APAC jurisdictions — different regulatory frameworks, cultural norms, and stakeholder expectations — for boards that operate across multiple APAC markets.",
            "Credibility architecture": "Building personal and institutional governance credibility in APAC contexts where credibility is often based on relationships and track record rather than formal governance credentials alone."
        },
        "band_narratives": {
            "Strong (≥70%)": "This candidate demonstrates mature APAC mandate credibility. They understand the governance dynamics of their market, can navigate cultural and regulatory complexity effectively, and have established governance credibility that is recognised by APAC stakeholders. In practice, they are often the board member who can bridge governance expectations across markets — explaining APAC governance dynamics to Western-trained colleagues and translating Western governance principles into APAC-appropriate practice. Their credibility extends beyond formal governance credentials to include the relationship capital and cultural fluency that APAC governance contexts demand. The risk at this level is cultural capture — becoming so adapted to local governance norms that they lose the independent judgment that governance rigour requires.",
            "Developing (50-69%)": "This candidate shows moderate APAC mandate credibility. They understand some dimensions of APAC governance complexity — perhaps the regulatory framework or the stakeholder ecosystem — but may lack fluency in others: cultural governance norms, relationship dynamics, or cross-border governance challenges. In practice, they can operate effectively in familiar APAC governance contexts but may struggle when the market's governance dynamics differ from their experience. The development priority is expanding APAC governance range — understanding governance across multiple APAC markets, not just their home market.",
            "Gap (<50%)": "This candidate shows significant APAC mandate credibility gaps. They may have strong governance capability in Western or familiar contexts — but that capability doesn't translate effectively to APAC governance environments. In practice, this manifests as: difficulty navigating APAC cultural governance norms; limited understanding of APAC regulatory frameworks; and inability to build governance credibility in APAC stakeholder ecosystems. For domestic boards in familiar markets, this may be manageable. For regional APAC boards or cross-border governance roles, this gap is disqualifying."
        },
        "overuse_risks": "APAC Mandate Credibility overused becomes cultural capture: the board member who has become so adapted to local governance norms that they have lost the independent judgment that governance rigour requires. In practice, this looks like: deferring to seniority when independent challenge is needed; accepting relationship-based governance when process-based governance is required; and tolerating governance practices that are culturally normal but fiduciarily inadequate. The captured board member is often the most culturally fluent — which makes the capture harder to recognise.",
        "cross_dynamics": [
            {"dim": "Strategic Oversight", "interaction": "Strategic Oversight in APAC must be expressed in culturally appropriate ways. The same strategic challenge that is valued in Singapore may be disruptive in Jakarta. APAC Mandate Credibility ensures strategic oversight is calibrated to the governance culture.", "risk": "high"},
            {"dim": "Governance Rigour", "interaction": "Governance Rigour must be calibrated to the market's governance maturity. APAC Mandate Credibility provides the contextual judgment to determine how much rigour is appropriate — and how to build toward higher rigour over time.", "risk": "high"},
            {"dim": "Stakeholder Intelligence", "interaction": "APAC stakeholder ecosystems are more complex than Western models. APAC Mandate Credibility ensures stakeholder intelligence accounts for the full complexity of APAC governance stakeholders.", "risk": "high"},
            {"dim": "Mandate Legacy", "interaction": "In multi-generational APAC organisations, Mandate Legacy is both a governance capability and a cultural expectation. APAC Mandate Credibility ensures legacy orientation aligns with cultural expectations.", "risk": "medium"}
        ],
        "coaching_prompts": [
            "How does governance in your APAC market differ from Western governance models? What works differently — and what must work the same regardless of culture?",
            "Have you ever faced a situation where cultural governance norms conflicted with fiduciary duty? How did you navigate it?",
            "What governance credibility do you have in your APAC market — and what is it based on? Formal credentials, relationships, track record, or something else?",
            "If you were appointed to a board in a different APAC market, what would you need to learn? How long would it take to establish governance credibility?",
            "How do you balance cultural adaptation with governance independence? When is adaptation appropriate — and when is it capture?"
        ],
        "apac_calibration": [
            "Market-Specific Calibration: APAC is not one market — it is 40+ markets with vastly different governance cultures. Singapore and Australia have mature, Western-influenced governance codes; Japan and Korea have evolving governance frameworks; China, Indonesia, and Thailand have developing governance cultures with unique cultural dynamics. APAC Mandate Credibility must be calibrated to the specific market, not to a generic 'APAC' category.",
            "Government Relations: In many APAC markets, government relationships are essential for governance effectiveness — not as corruption but as legitimate stakeholder engagement in markets where government plays an active role. The line between appropriate government engagement and inappropriate influence varies by market and requires careful calibration.",
            "Trust Architecture: In APAC governance contexts, trust is often built through relationships and consistency over time rather than through formal governance credentials. Board members who arrive with strong formal credentials but no relationship capital may find their governance effectiveness limited until they have established trust through demonstrated reliability."
        ]
    }
}

def get_dimension_content(dim_name, score_pct):
    dim_data = IMPACT_DIMENSIONS.get(dim_name)
    if not dim_data:
        return None
    if score_pct >= 70: band_key = "Strong (≥70%)"
    elif score_pct >= 50: band_key = "Developing (50-69%)"
    else: band_key = "Gap (<50%)"
    return {
        "id": dim_data["id"],
        "construct": dim_data["construct"],
        "description_paragraphs": dim_data["description"],
        "sub_dim_interpretation": dim_data["sub_dim_interpretation"],
        "band_narrative": dim_data["band_narratives"].get(band_key, ""),
        "overuse_risks": dim_data["overuse_risks"],
        "cross_dynamics": dim_data["cross_dynamics"],
        "coaching_prompts": dim_data["coaching_prompts"],
        "apac_calibration": dim_data["apac_calibration"],
        "score_pct": score_pct,
        "band": band_key.split(" ")[0]
    }

if __name__ == "__main__":
    for name in IMPACT_DIMENSIONS:
        c = get_dimension_content(name, 55)
        total_words = sum(len(p.split()) for p in c['description_paragraphs'])
        total_words += len(c['band_narrative'].split())
        total_words += len(c['overuse_risks'].split())
        total_words += sum(len(d['interaction'].split()) for d in c['cross_dynamics'])
        total_words += sum(len(p.split()) for p in c['coaching_prompts'])
        total_words += sum(len(p.split()) for p in c['apac_calibration'])
        print(f'{c["id"]} {name}: {total_words} words | {len(c["coaching_prompts"])} prompts | {len(c["cross_dynamics"])} dynamics | {len(c["apac_calibration"])} apac')

