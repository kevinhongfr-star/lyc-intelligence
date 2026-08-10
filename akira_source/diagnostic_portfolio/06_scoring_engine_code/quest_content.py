"""
QUEST Dimension Content Library — Gold Standard Narratives
Each dimension has: description, sub_dim_interpretation, band_narratives (strong/developing/gap),
overuse_risks, cross_dynamics, coaching_prompts, apac_calibration

Usage: shift_report.py imports this module and pulls dimension-specific content
instead of using template prose.
"""

QUEST_DIMENSIONS = {
    "Strategic Thinking": {
        "id": "D1",
        "construct": "Executive Performance Architecture",
        "description": [
            "Strategic Thinking is the cognitive capacity to see beyond the immediate operational horizon — to recognise patterns in complex environments, anticipate second- and third-order consequences, and articulate a coherent direction that others can follow. It is the executive function that separates managers who optimise the present from leaders who shape the future.",
            "At the QUEST level, Strategic Thinking is measured as a demonstrated behavioural competency: can the candidate actually articulate a multi-horizon vision? Do they identify systemic risks before they surface? Do they connect operational decisions to strategic intent? This distinction matters — a person may think strategically in private but fail to operationalise those insights in a leadership context.",
            "The dimension comprises six sub-dimensions that collectively define the strategic thinking competency: direction articulation (translating abstract strategy into clear, actionable direction), pattern recognition (sensing emerging trends and connecting disparate signals), multi-horizon thinking (simultaneously managing near-term execution and long-term positioning), strategic linkage (connecting decisions across organisational layers), assumption management (stress-testing underlying premises), and strategic translation (making strategy actionable for non-strategic audiences)."
        ],
        "sub_dim_interpretation": {
            "Direction articulation": "Ability to translate abstract strategy into clear, actionable direction for teams. High scorers can walk into a room and, within minutes, help a team understand where they're going and why it matters.",
            "Pattern recognition": "Sensing emerging trends, connecting dots across disparate data sources. This is the most cognitively demanding sub-dimension — it requires both domain expertise and cognitive flexibility to identify signals that others miss.",
            "Multi-horizon thinking": "Simultaneously managing near-term execution and long-term positioning. Leaders strong here avoid the false choice between quarterly delivery and strategic investment.",
            "Strategic linkage": "Understanding how decisions at one level cascade to others. The ability to see the organisation as a system rather than a collection of independent functions.",
            "Assumption management": "Stress-testing the premises underlying strategic decisions. Leaders weak here accept the frame; leaders strong here question whether the frame itself is correct.",
            "Strategic translation": "Making strategy accessible and actionable for non-strategic audiences. The gap between boardroom intent and frontline execution is often a translation failure, not a communication failure."
        },
        "band_narratives": {
            "Strong (≥70%)": "This candidate demonstrates mature strategic thinking capability. They can independently identify emerging patterns, articulate multi-horizon strategic direction, and connect operational decisions to broader strategic intent. In practice, this means they are likely the person in the room who sees the strategic landscape clearly — identifying competitive threats before they materialise, connecting seemingly unrelated trends into coherent strategic narratives, and challenging underlying assumptions when the status quo no longer serves. Their strategic thinking is not just analytical — it is communicative. They can translate complex strategic concepts into language that resonates with diverse stakeholders, from board members to frontline teams. The risk at this level is not capability but calibration: ensuring strategic ambition is matched by execution rigour, and that strategic vision does not outpace organisational readiness.",
            "Developing (50-69%)": "This candidate shows moderate strategic thinking proficiency with identifiable gaps. They can articulate strategic direction when the framework is established — translating existing strategy into team-level action — but may struggle when required to independently formulate strategy in ambiguous or novel contexts. Their strategic thinking is likely asymmetric: strong in some sub-dimensions (often direction articulation or strategic translation) and weaker in others (commonly pattern recognition or systemic analysis). In practice, this means they execute strategic direction well when given clear guidance, but may miss emerging competitive shifts, struggle with non-obvious opportunity identification, or fail to see systemic interdependencies until they surface as operational problems. The development priority is not more strategic communication — it is deeper analytical capacity: pattern recognition exercises, scenario planning, and deliberate practice in questioning underlying assumptions.",
            "Gap (<50%)": "This candidate shows significant strategic thinking gaps that will constrain their effectiveness in roles requiring strategic formulation. They are likely strong operationally — excellent at executing established direction — but struggle when the strategic landscape is ambiguous or when they need to independently identify the right direction rather than follow a prescribed one. In practice, this manifests as: difficulty articulating a coherent strategic narrative beyond their immediate functional area; reliance on established frameworks rather than original strategic thinking; tendency to be reactive rather than proactive in strategic planning. For roles that require strategic execution within defined parameters, this may be manageable with the right strategic leader above them. For roles that require independent strategic formulation — general management, P&L ownership, board-level strategy — this gap must be addressed before the candidate is placed in that context."
        },
        "overuse_risks": "Even high Strategic Thinking can become a liability when it displaces other critical competencies. The primary overuse pattern is analysis-before-action paralysis: spending excessive time refining the strategic frame rather than testing it against operational reality. At its worst, this produces beautiful strategy decks that never get validated, frequent strategic pivots before previous directions have had time to show results, and teams that feel directionally clear but operationally confused. A secondary overuse pattern is intellectual superiority: the strategic thinker who dismisses operational concerns as 'tactical' or 'not strategic enough,' creating a culture where execution capability is undervalued and strategic complexity becomes a status marker rather than a value driver.",
        "cross_dynamics": [
            {"dim": "Execution Excellence", "interaction": "The critical interaction. High Strategic Thinking + Low Execution Excellence creates a 'strategy-execution gap' — the candidate articulates direction well but cannot operationalise it. Development priority: build execution rigour BEFORE pushing for more strategic ambition. A more ambitious strategy with weak execution infrastructure will fail faster, not succeed faster.", "risk": "high"},
            {"dim": "Commercial Acumen", "interaction": "Commercial instinct can compensate for analytical gaps — a leader with strong commercial intuition can 'feel' the right strategic direction even without rigorous systemic analysis. The risk is that this commercial intuition remains unexamined, creating a 'black box' strategy that others cannot replicate or challenge.", "risk": "medium"},
            {"dim": "People Leadership", "interaction": "Strategic thinking without people leadership capability produces strategy that is analytically sound but organisationally unimplementable. The best strategic thinkers are those who can build the coalition needed to execute — not just the analysis needed to justify.", "risk": "medium"},
            {"dim": "Adaptive Capacity", "interaction": "Strategic Thinking assumes some predictability — that patterns can be identified and plans can be formed. In highly volatile environments, Adaptive Capacity matters more. The optimal profile balances strategic planning with adaptive responsiveness.", "risk": "medium"},
            {"dim": "AI Readiness", "interaction": "AI-assisted scenario planning and pattern recognition tools can directly address Strategic Thinking gaps. AI does not replace strategic thinking — but it extends cognitive bandwidth for pattern detection and systemic modelling.", "risk": "low"}
        ],
        "coaching_prompts": [
            "In the last 12 months, what emerging trend or competitive shift did you identify early — and what did you miss? When you missed something, what was the signal you didn't notice, and why?",
            "Think of a decision you made that had consequences in a different part of the organisation. Did you anticipate those consequences? If not, what analytical process would have surfaced them?",
            "When you walk into a strategic planning session, do you spend more time articulating the direction or interrogating the assumptions behind the direction? Is that balance right for your current role?",
            "How do your peers and board describe your strategic capability? Do they see you as someone who generates strategic insight — or someone who executes strategic direction well? Where is the gap?",
            "Walk me through how you identified the most significant strategic opportunity your team pursued in the last year. Was it through structured analysis, pattern sensing, competitive intelligence, or intuition? Which method do you use least — and is that a problem?"
        ],
        "apac_calibration": [
            "Power Distance & Strategic Voice: In high power-distance APAC markets (China, Japan, Korea, Indonesia, Thailand), strategic thinking is often expected to come from the top — not distributed across leadership layers. A leader scoring at the Developing band may find their strategic contributions undervalued not because the thinking is weak, but because organisational culture expects strategic direction to flow from the CEO. The development challenge is not just cognitive — it's also about finding the right forums where strategic thinking is welcomed and rewarded.",
            "Relationship vs. Analysis Orientation: In APAC business cultures with strong relational norms (Japan's nemawashi, China's guanxi, Korea's jeong), strategic decisions are often made through relationship-building and consensus rather than analytical frameworks. A candidate strong in Direction Articulation but weak in Systemic Analysis may find their analytical gap is masked by relational strength — creating a ceiling as role scope expands.",
            "Long-Term Orientation Mismatch: APAC markets vary significantly in strategic time horizon. Japanese and Korean firms plan in 10–20 year cycles; Singaporean and Australian firms in 3–5 year cycles; Chinese firms in 1–3 year cycles with 50-year aspiration. A candidate's Multi-Horizon Thinking capacity should be calibrated against their specific market's time expectations."
        ]
    },

    "Execution Excellence": {
        "id": "D2",
        "construct": "Executive Performance Architecture",
        "description": [
            "Execution Excellence is the organisational and behavioural capability to convert strategic intent into measurable results — consistently, predictably, and at scale. It is the counterweight to Strategic Thinking: where strategy defines the destination, execution defines the vehicle, the route, and the discipline to arrive on time. In executive assessment, execution capability is often the single largest differentiator between leaders who perform well in planning contexts and leaders who deliver in operating contexts.",
            "At the QUEST level, Execution Excellence is not measured as task completion or personal productivity — it is measured as organisational execution capability: can the candidate build the systems, structures, and accountability mechanisms that allow an entire organisation to deliver? Can they design roles, set milestones, manage resources, and maintain execution rigour across complex, multi-stakeholder environments?",
            "The dimension comprises six sub-dimensions: organisational design for delivery (structuring teams and processes for optimal output), strategy-to-results conversion (the translation mechanism between strategic intent and operational output), execution consistency (maintaining delivery standards across time and changing conditions), performance visibility (making execution progress transparent to stakeholders), accountability architecture (creating clear ownership and consequence systems), and resource discipline (allocating time, budget, and talent to highest-value activities without diffusion)."
        ],
        "sub_dim_interpretation": {
            "Organisational design for delivery": "The ability to structure teams, roles, and processes so that strategic intent maps cleanly to operational output. High scorers can look at an organisation chart and immediately see where execution bottlenecks will form — and redesign before the bottleneck becomes a crisis.",
            "Strategy-to-results conversion": "The translation mechanism between strategic intent and operational output. This sub-dimension separates leaders who can 'make things happen' from leaders who can 'build systems that make things happen predictably.'",
            "Execution consistency": "Maintaining delivery standards across time, changing conditions, and personnel transitions. This is the hardest sub-dimension to develop — it requires building institutional execution capability rather than relying on personal heroics.",
            "Performance visibility": "Making execution progress transparent to stakeholders. Leaders who score low here often have good execution capability but poor stakeholder management — their teams deliver, but nobody knows until the final report.",
            "Accountability architecture": "Creating clear ownership and consequence systems. This sub-dimension is often the most culturally sensitive in APAC contexts — accountability norms vary dramatically across markets.",
            "Resource discipline": "Allocating time, budget, and talent to highest-value activities without diffusion. Low scorers here spread resources too thinly; high scorers ruthlessly prioritise and defend resource allocation decisions."
        },
        "band_narratives": {
            "Strong (≥70%)": "This candidate demonstrates mature execution capability. They build systems that deliver predictably — not through personal heroics but through organisational design, clear accountability, and transparent progress tracking. In practice, this means: their teams hit milestones consistently; stakeholders can see progress without having to ask; resource allocation decisions are defensible and defendable; when problems emerge, they surface early because the visibility architecture catches them. The risk at this level is rigidity: excellent executors can become process-heavy, risk-averse, and resistant to strategic pivots even when the strategic landscape demands adaptation. The development priority for strong executors is often strategic and adaptive capability — learning when to execute harder vs. when to change direction.",
            "Developing (50-69%)": "This candidate shows moderate execution capability with identifiable gaps. They can deliver results in well-defined contexts — when the scope is clear, the resources are adequate, and the timeline is realistic — but struggle when execution conditions are ambiguous, under-resourced, or subject to frequent change. Their execution capability is likely stronger in some sub-dimensions than others: they may be good at strategy-to-results conversion (making things happen) but weak on accountability architecture (ensuring others own their deliverables). In practice, this means they personally deliver but may not have built the organisational systems for consistent delivery at scale. The development priority is shifting from personal execution to organisational execution: building accountability architectures, creating performance visibility systems, and developing resource discipline that does not depend on their personal intervention.",
            "Gap (<50%)": "This candidate shows significant execution gaps that will constrain their effectiveness in any role requiring consistent organisational delivery. They may be strategically strong or relationally strong — but if they cannot build the execution infrastructure to convert intent into results, their other capabilities become theoretical rather than operational. In practice, this manifests as: missed milestones without early warning; unclear ownership leading to dropped deliverables; resource allocation driven by loudest voice rather than highest value; stakeholder surprise when projects are behind schedule. For advisory or staff roles, this may be manageable with execution support. For any role with P&L ownership, operational leadership, or team delivery accountability, this gap is disqualifying until addressed."
        },
        "overuse_risks": "Execution Excellence overused becomes process rigidity: the leader who optimises for delivery predictability at the expense of strategic adaptation. In practice, this looks like: teams that hit every milestone but are executing against an outdated strategy; resistance to strategic pivots because 'we're already in execution mode'; heavy process infrastructure that slows response to changing conditions; and a culture where 'on time, on budget' matters more than 'on the right target.' The overused executor also tends to undervalue strategic and relational capabilities — viewing them as 'soft' compared to the 'hard' discipline of execution. This creates organisational fragility: the machine works well until the market shifts, and then it can't pivot.",
        "cross_dynamics": [
            {"dim": "Strategic Thinking", "interaction": "The defining tension. High Execution + Low Strategy = efficient delivery toward the wrong destination. High Strategy + Low Execution = brilliant plans that never materialise. The optimal profile balances both — and the development priority depends on which is weaker.", "risk": "high"},
            {"dim": "Commercial Acumen", "interaction": "Execution without commercial awareness optimises cost rather than value. A leader who can deliver anything efficiently but doesn't understand which deliverables create commercial value will optimise the wrong things. Commercial Acumen should inform Execution priorities.", "risk": "medium"},
            {"dim": "People Leadership", "interaction": "Execution through people requires different skills than execution through process. Leaders strong in both can build high-performance teams that deliver consistently; leaders strong in Execution but weak in People Leadership build process-dependent organisations that break when key people leave.", "risk": "medium"},
            {"dim": "Adaptive Capacity", "interaction": "The natural tension: execution demands consistency; adaptation demands flexibility. The optimal profile can maintain execution rigour on the right things while adapting quickly on the wrong things. Low scores on both create organisational chaos.", "risk": "high"},
            {"dim": "AI Readiness", "interaction": "AI can significantly enhance execution capability — automated progress tracking, predictive resource allocation, intelligent workflow optimisation. Leaders with AI Readiness can build next-generation execution systems that exceed what human-only execution can achieve.", "risk": "low"}
        ],
        "coaching_prompts": [
            "Think of a project that missed its milestone in the last 6 months. When did you first know it was at risk? What system or process would have surfaced that risk earlier?",
            "If you left your role tomorrow, would your team's execution capability continue at the same level? What systems exist independently of your personal involvement?",
            "How do you decide what to prioritise when resources are constrained? Walk me through a specific resource allocation decision from the last quarter — and how you defended it to stakeholders who wanted something different.",
            "Do your stakeholders ever express surprise at project status? If so, is the surprise positive or negative — and what does that tell you about your performance visibility architecture?",
            "What is the most significant execution failure in your career? What systemic cause did you identify — and what structural change did you make to prevent recurrence?"
        ],
        "apac_calibration": [
            "Accountability Culture: APAC accountability norms vary dramatically. In Japan and Korea, team-based accountability (collective responsibility) is the cultural default — individual accountability architectures can feel culturally inappropriate. In Singapore and Australia, individual accountability is expected. In China and Indonesia, accountability is often relationship-dependent rather than process-dependent. A leader's Execution Excellence must be calibrated to the accountability norms of their specific market.",
            "Hierarchy & Execution Speed: In hierarchical APAC organisations, execution often requires top-down approval at multiple levels — which can slow delivery significantly. Leaders who can navigate hierarchical execution (building sponsorship, pre-aligning stakeholders) outperform those who try to impose flat execution models on hierarchical cultures.",
            "Face & Performance Visibility: In 'face' cultures (China, Japan, Korea, Thailand, Indonesia), making poor performance visible can be culturally disruptive. Leaders need to create performance visibility mechanisms that preserve face while ensuring transparency — often through private feedback loops and structured coaching rather than public scorecards."
        ]
    },

    "Commercial Acumen": {
        "id": "D3",
        "construct": "Executive Performance Architecture",
        "description": [
            "Commercial Acumen is the ability to understand, evaluate, and act on the economic drivers of value creation within an organisation and its market. It is the executive competency that connects operational decisions to financial outcomes — understanding not just what the organisation does, but how what it does creates economic value, and what decisions maximise that value over time. In executive assessment, Commercial Acumen is often the differentiator between functional leaders (who optimise within their domain) and general managers (who optimise across the P&L).",
            "At the QUEST level, Commercial Acumen extends beyond financial literacy — it encompasses value creation understanding (how the business actually makes money, not just the revenue model but the value chain), commercial confidence (the ability to make and defend commercial decisions under uncertainty), APAC commercial intelligence (understanding the specific commercial dynamics of Asia-Pacific markets), commercial judgment under uncertainty (making high-stakes decisions with incomplete information), and market intelligence application (connecting market signals to commercial strategy).",
            "The dimension comprises six sub-dimensions that collectively define commercial capability: value creation understanding, financial literacy, commercial confidence, APAC commercial intelligence, commercial judgment under uncertainty, and market intelligence application."
        ],
        "sub_dim_interpretation": {
            "Value creation understanding": "Understanding how the business creates economic value — not just the revenue model, but the full value chain from input to customer outcome. This is the foundation of all commercial decision-making.",
            "Financial literacy": "The ability to read, interpret, and act on financial statements and metrics. At the executive level, this means understanding P&L, balance sheet, and cash flow implications of strategic and operational decisions.",
            "Commercial confidence": "The willingness and ability to make and defend commercial decisions — pricing, investment, partnership, and market entry decisions — with conviction even when the outcome is uncertain.",
            "APAC commercial intelligence": "Understanding the specific commercial dynamics of Asia-Pacific markets: regulatory differences, cultural buying patterns, competitive landscapes, and economic structures that differ from Western markets.",
            "Commercial judgment under uncertainty": "Making high-stakes commercial decisions when information is incomplete. This separates leaders who need perfect data before acting from leaders who can make good decisions with 70% of the information.",
            "Market intelligence application": "Connecting external market signals — competitor moves, regulatory changes, customer shifts, technology disruptions — to internal commercial strategy. The gap between market awareness and strategic action."
        },
        "band_narratives": {
            "Strong (≥70%)": "This candidate demonstrates mature commercial capability. They understand how their organisation creates value, can read and interpret financial implications of strategic decisions, and make commercial judgments with confidence even under uncertainty. In practice, this means: they can walk into a new business context and quickly identify the value drivers; they challenge business cases with commercially rigorous questions; they make pricing, investment, and partnership decisions that are commercially defensible; and they connect market intelligence to commercial strategy. The risk at this level is commercial myopia: focusing so intensely on commercial metrics that relational, cultural, or long-term strategic considerations are undervalued. The development priority for strong commercial leaders is often People Leadership or Adaptive Capacity — ensuring commercial rigour does not come at the expense of organisational capability.",
            "Developing (50-69%)": "This candidate shows moderate commercial capability. They understand the basic economics of their business — revenue, cost, margin — and can make commercially reasonable decisions within their functional area. However, they may struggle with: complex commercial judgments where multiple variables interact (e.g., pricing decisions that affect volume, margin, and market positioning simultaneously); commercial decisions in unfamiliar markets or business models; and connecting market intelligence to commercial strategy in non-obvious ways. In practice, they can execute established commercial strategies but may need support when the commercial landscape is novel or highly uncertain. The development priority is expanding commercial range: exposure to different business models, structured practice in commercial scenario planning, and mentorship from commercially strong leaders.",
            "Gap (<50%)": "This candidate shows significant commercial gaps that will constrain their effectiveness in any role with P&L accountability or commercial decision-making authority. They may be strategically strong, operationally excellent, or relationally powerful — but without commercial acumen, they cannot connect their capabilities to economic value creation. In practice, this manifests as: difficulty articulating the commercial rationale for strategic decisions; over-reliance on finance teams to validate commercial assumptions; discomfort with pricing, investment, or partnership decisions; and tendency to optimise functional metrics rather than economic outcomes. For functional specialist roles, this may be manageable with commercial support. For general management or P&L roles, this gap must be addressed."
        },
        "overuse_risks": "Commercial Acumen overused becomes transactional leadership: the leader who evaluates every decision through a commercial lens, even when relational, cultural, or long-term strategic considerations should take priority. In practice, this looks like: optimising short-term margin at the expense of long-term customer relationships; making commercially 'correct' decisions that destroy organisational trust; undervaluing people development investments because the ROI is not immediately commercial; and creating a culture where everything must be justified in financial terms. In APAC markets where relationship capital often matters more than transactional efficiency, over-indexing on commercial metrics can be particularly destructive.",
        "cross_dynamics": [
            {"dim": "Strategic Thinking", "interaction": "Strategic Thinking defines direction; Commercial Acumen defines viability. A strategically sound direction that is commercially unviable will fail. A commercially attractive opportunity that lacks strategic fit will distract. The two must be evaluated together.", "risk": "high"},
            {"dim": "Execution Excellence", "interaction": "Execution without commercial awareness optimises cost rather than value. The optimal profile ensures that execution resources are allocated to the highest-commercial-value activities, not just the most operationally efficient ones.", "risk": "medium"},
            {"dim": "People Leadership", "interaction": "Commercial decisions often require people to change behaviour — pricing changes, cost reduction, market pivots. Commercial Acumen without People Leadership creates commercially correct but organisationally unimplementable decisions.", "risk": "medium"},
            {"dim": "Adaptive Capacity", "interaction": "Commercial landscapes in APAC change rapidly — regulatory shifts, competitive entries, technology disruptions. Commercial Acumen must be paired with Adaptive Capacity to respond to changing commercial conditions rather than optimising for a static market.", "risk": "medium"},
            {"dim": "AI Readiness", "interaction": "AI is transforming commercial decision-making — predictive pricing, customer analytics, supply chain optimisation. Leaders with AI Readiness can leverage data-driven commercial tools that exceed human-only commercial judgment.", "risk": "low"}
        ],
        "coaching_prompts": [
            "Walk me through the economic model of your business. Not the revenue line — the actual value creation chain. Where is value created? Where is it captured? What are the critical assumptions in that chain?",
            "Think of a commercial decision you made in the last 6 months where the outcome was uncertain. What was your decision process? What information did you have — and what did you not have? Would you make the same decision again?",
            "How do you evaluate whether a strategic initiative is commercially viable? What metrics do you use? What metrics do you wish you could use but can't?",
            "In your specific APAC market, what are the commercial dynamics that differ from Western markets? How has that affected your commercial decision-making?",
            "If you had to double your business's commercial output in 18 months without doubling resources, what would you change? What would you stop doing?"
        ],
        "apac_calibration": [
            "Relationship vs. Transaction: In many APAC markets, commercial relationships are built on trust and long-term reciprocity rather than transactional efficiency. A leader with strong Commercial Acumen in a Western context may find that the same commercial logic does not apply in Japan, China, or Indonesia where relationship capital often overrides transactional optimisation.",
            "Regulatory Complexity: APAC commercial environments are characterised by rapid regulatory change, overlapping jurisdictions, and government influence on commercial outcomes. Commercial Acumen in APAC requires regulatory awareness that is often not needed in more stable Western markets.",
            "Family Business Dynamics: In many APAC markets, family-owned conglomerates dominate commercial landscapes. Commercial decision-making in these contexts must navigate family dynamics, succession considerations, and governance norms that differ significantly from publicly-listed Western companies."
        ]
    },

    "People Leadership": {
        "id": "D4",
        "construct": "Executive Performance Architecture",
        "description": [
            "People Leadership is the capability to build, develop, and sustain high-performance teams — not through personal charisma alone, but through deliberate team architecture, succession development, accountability management, and the capacity to make difficult people decisions with both rigour and humanity. In executive assessment, People Leadership is consistently the dimension that most differentiates effective senior leaders from effective individual contributors.",
            "At the QUEST level, People Leadership is measured as an organisational capability: can the candidate build teams that perform? Can they develop successors? Can they make high-stakes people decisions — hiring, promotion, termination — with both analytical rigour and interpersonal sensitivity? Can they create team independence so the organisation does not depend on their personal presence?",
            "The dimension comprises six sub-dimensions: team architecture (designing teams for optimal performance), succession development (building the pipeline of future leaders), team independence (creating teams that perform without constant personal intervention), dependency risk (identifying and mitigating over-reliance on key individuals), individualised development (tailoring development to individual needs rather than applying one-size-fits-all), and high-stakes people decisions (hiring, promotion, and termination decisions made with both rigour and humanity)."
        ],
        "sub_dim_interpretation": {
            "Team architecture": "Designing teams for optimal performance — role clarity, capability matching, cognitive diversity, and structural alignment with strategic priorities. This is the design function of leadership.",
            "Succession development": "Building the pipeline of future leaders. Leaders who score low here have teams that work well today but face capability crises when key people leave.",
            "Team independence": "Creating teams that perform without constant personal intervention. This is the difference between leading a team and being the team's operating system.",
            "Dependency risk": "Identifying and mitigating over-reliance on key individuals. This sub-dimension captures organisational resilience — if your star performer leaves tomorrow, what happens?",
            "Individualised development": "Tailoring development to individual needs rather than applying one-size-fits-all. Leaders who score high here develop people faster because they invest in the specific gaps, not generic training.",
            "High-stakes people decisions": "Hiring, promotion, and termination decisions made with both analytical rigour and interpersonal humanity. This is where leadership is most tested — and where the gap between theory and practice is most visible."
        },
        "band_narratives": {
            "Strong (≥70%)": "This candidate demonstrates mature people leadership capability. They build teams that perform consistently — not because they personally intervene in every situation, but because they have architected the team structure, developed the people, and created the accountability systems that allow the team to function independently. In practice, this means: their teams have clear successors for key roles; their people can articulate their own development priorities; the team performs well even when the leader is absent; and high-stakes people decisions are made with both analytical rigour and interpersonal sensitivity. The risk at this level is over-investment in people at the expense of strategic or commercial priorities — the leader who builds a great team but doesn't challenge them strategically or hold them to commercial accountabilities.",
            "Developing (50-69%)": "This candidate shows moderate people leadership capability. They can manage teams effectively in stable conditions — when roles are defined, people are capable, and the team is functioning. However, they may struggle with: building team independence (the team still depends heavily on their personal direction); succession development (they haven't built a clear pipeline); and high-stakes people decisions (they may delay or avoid difficult hiring, promotion, or termination decisions). In practice, their teams perform well because the leader is personally engaged — not because the team architecture is self-sustaining. The development priority is shifting from personal leadership to systemic leadership: building structures that work independently of their constant involvement.",
            "Gap (<50%)": "This candidate shows significant people leadership gaps that will constrain their effectiveness in any role requiring team leadership at scale. They may be strategically brilliant, commercially sharp, or operationally excellent — but if they cannot lead people, their other capabilities have limited organisational leverage. In practice, this manifests as: teams that underperform relative to their capability; high turnover of strong performers who feel undeveloped; unresolved performance issues that drag on team culture; and key-person dependency that creates organisational fragility. For individual contributor or advisory roles, this may be manageable. For any role requiring team leadership, this gap is disqualifying."
        },
        "overuse_risks": "People Leadership overused becomes consensus-dependent leadership: the leader who prioritises team harmony over strategic challenge, avoids necessary conflict, and delays difficult people decisions to preserve relationships. In practice, this looks like: teams that feel good but don't perform; underperformers who are protected rather than developed or moved on; strategic decisions diluted to maintain consensus; and a culture where 'being liked' matters more than 'being effective.' In APAC cultures where harmony is highly valued, this overuse pattern is particularly common and particularly destructive.",
        "cross_dynamics": [
            {"dim": "Strategic Thinking", "interaction": "Strategic Thinking without People Leadership produces strategy that is analytically sound but organisationally unimplementable. The best strategies fail without the coalition-building capability to execute.", "risk": "high"},
            {"dim": "Execution Excellence", "interaction": "Execution through people requires different skills than execution through process. Leaders strong in both build high-performance teams that deliver consistently; leaders strong in Execution but weak in People Leadership build process-dependent organisations.", "risk": "medium"},
            {"dim": "Commercial Acumen", "interaction": "People decisions often have commercial implications — hiring costs, team productivity, retention economics. Leaders who combine People Leadership with Commercial Acumen make people investments with clear economic rationale.", "risk": "low"},
            {"dim": "Adaptive Capacity", "interaction": "Leading people through change is the hardest leadership challenge. Adaptive Capacity + People Leadership = the ability to guide teams through uncertainty without losing their commitment or capability.", "risk": "high"},
            {"dim": "AI Readiness", "interaction": "AI is reshaping people leadership — talent analytics, development personalisation, performance prediction. Leaders with AI Readiness can build next-generation people systems.", "risk": "low"}
        ],
        "coaching_prompts": [
            "If you left your role tomorrow, which team members would step up — and which roles would be unfilled? What does that tell you about your succession development?",
            "Think of the most difficult people decision you made in the last year — a termination, a demotion, or a hiring decision that didn't work out. Walk me through your decision process. What would you do differently?",
            "How much of your team's performance depends on your personal involvement vs. the team's independent capability? What structural change would shift that balance?",
            "Who on your team is most at risk of leaving — and why? What is your retention strategy for that person? Is it proactive or reactive?",
            "When was the last time you challenged a team member's performance directly? What was the outcome? How often does that conversation happen on your team?"
        ],
        "apac_calibration": [
            "Face & Direct Feedback: In face cultures (China, Japan, Korea, Thailand, Indonesia), direct performance feedback — especially negative feedback — must be delivered with extraordinary care. Leaders who apply Western-style direct feedback models without cultural adaptation can destroy the very relationships they need to lead effectively.",
            "Collective vs. Individual Development: In collectivist APAC cultures, individual development plans can feel culturally inappropriate — 'Why am I being singled out?' The most effective people leaders in APAC create development through team-based mechanisms rather than individual spotlighting.",
            "Seniority & Authority: In hierarchical APAC cultures, people decisions are often expected to respect seniority — not just capability. A leader who promotes based purely on merit without regard for seniority norms can create organisational resistance. The art is navigating seniority expectations while still making capability-based decisions."
        ]
    },

    "Adaptive Capacity": {
        "id": "D5",
        "construct": "Executive Performance Architecture",
        "description": [
            "Adaptive Capacity is the capability to navigate, lead through, and thrive in conditions of ambiguity, change, and uncertainty. It is the executive competency that determines whether a leader can perform when the rules change, the landscape shifts, and established approaches no longer apply. In a VUCA (Volatile, Uncertain, Complex, Ambiguous) environment — which describes most APAC executive contexts — Adaptive Capacity is not a nice-to-have; it is the minimum requirement for sustained executive effectiveness.",
            "At the QUEST level, Adaptive Capacity is measured as a demonstrated behavioural capability: can the candidate lead through ambiguity? Can they pivot when conditions change? Can they maintain effectiveness when the path forward is unclear? This is distinct from personality-based measures of adaptability (e.g., 'Do you enjoy change?') — it measures actual adaptive behaviour, not adaptive preference.",
            "The dimension comprises six sub-dimensions: environmental scanning & response (sensing and responding to external changes), pivot capability (the ability to change direction mid-execution without losing organisational commitment), ambiguity tolerance (maintaining effectiveness when information is incomplete), APAC change leadership (leading change in culturally complex APAC contexts), change resistance (identifying and navigating organisational resistance to change), and adaptive track record (demonstrated history of successful adaptation)."
        ],
        "sub_dim_interpretation": {
            "Environmental scanning & response": "Sensing and responding to external changes — competitive, regulatory, technological, and cultural shifts. This is the early-warning system of adaptive leadership.",
            "Pivot capability": "The ability to change direction mid-execution without losing organisational commitment. This requires both cognitive flexibility and communication skill — the ability to explain why the pivot is necessary while maintaining team confidence.",
            "Ambiguity tolerance": "Maintaining effectiveness when information is incomplete and the path forward is unclear. This is the psychological foundation of adaptive leadership — the ability to act without certainty.",
            "APAC change leadership": "Leading change in culturally complex APAC contexts where change may be resisted for cultural reasons (tradition, hierarchy, face) rather than rational reasons. This sub-dimension is uniquely important for APAC executives.",
            "Change resistance": "Identifying and navigating organisational resistance to change. This requires diagnostic capability (understanding why people resist) and navigation capability (creating pathways through resistance).",
            "Adaptive track record": "Demonstrated history of successful adaptation. This sub-dimension captures whether the candidate has actually adapted successfully in the past — not just whether they claim to be adaptable."
        },
        "band_narratives": {
            "Strong (≥70%)": "This candidate demonstrates mature adaptive capability. They can lead through ambiguity, pivot when conditions change, and maintain organisational commitment even when the path forward is uncertain. In practice, this means: they are often the person called upon when situations are most volatile; they can hold multiple competing possibilities without premature closure; they communicate change in ways that maintain trust and commitment; and they have a demonstrated track record of successful navigation through significant organisational or market changes. The risk at this level is adaptive restlessness — the leader who is so comfortable with change that they create unnecessary disruption, confuse teams with frequent pivots, or undervalue the stability that consistent execution provides.",
            "Developing (50-69%)": "This candidate shows moderate adaptive capability. They can navigate moderate change effectively — when the change is visible, the rationale is clear, and the timeline is manageable. However, they may struggle with: leading through high-ambiguity situations where the path forward is genuinely unclear; pivoting mid-execution without losing team commitment; and navigating cultural resistance to change in complex APAC contexts. In practice, they adapt personally — they are not rigid or resistant — but they may not yet have the leadership capability to guide others through change effectively. The development priority is building change leadership capability: structured practice in leading change initiatives, developing communication skills for uncertain contexts, and building a track record of successful adaptive leadership.",
            "Gap (<50%)": "This candidate shows significant adaptive gaps that will constrain their effectiveness in volatile or rapidly changing environments. They are likely most effective in stable, well-defined contexts where established approaches apply — and struggle when the environment changes faster than their established responses. In practice, this manifests as: difficulty making decisions when information is incomplete; tendency to revert to established approaches even when they no longer apply; difficulty communicating change to teams; and visible discomfort or performance decline when conditions are highly ambiguous. For roles in stable, well-defined contexts, this may be manageable. For roles in volatile environments — startups, turnarounds, market entries, transformation programmes — this gap is disqualifying."
        },
        "overuse_risks": "Adaptive Capacity overused becomes change addiction: the leader who is so comfortable with change that they create unnecessary disruption, confuse teams with frequent pivots, or dismiss the need for stability and consistency. In practice, this looks like: constant reorganisation that prevents any initiative from reaching maturity; pivots that are communicated as exciting but experienced as destabilising; undervaluing of people who need consistency to perform; and a culture where 'adaptability' becomes a weapon to dismiss legitimate concerns about change fatigue. The over-adaptive leader also risks becoming a change tourist — always starting new things, never finishing them.",
        "cross_dynamics": [
            {"dim": "Strategic Thinking", "interaction": "Strategic Thinking assumes some predictability; Adaptive Capacity is required when predictability breaks down. The optimal profile can plan strategically when conditions allow and adapt when they don't — knowing when each approach is appropriate.", "risk": "high"},
            {"dim": "Execution Excellence", "interaction": "Natural tension: execution demands consistency; adaptation demands flexibility. The optimal profile maintains execution rigour on the right things while adapting quickly on the wrong things. Low scores on both create organisational chaos.", "risk": "high"},
            {"dim": "Commercial Acumen", "interaction": "Commercial landscapes in APAC change rapidly. Adaptive Capacity must be paired with Commercial Acumen to respond to changing commercial conditions — otherwise adaptation is directionless.", "risk": "medium"},
            {"dim": "People Leadership", "interaction": "Leading people through change is the hardest leadership challenge. Adaptive Capacity + People Leadership = the ability to guide teams through uncertainty without losing commitment or capability.", "risk": "high"},
            {"dim": "AI Readiness", "interaction": "AI can enhance adaptive capacity by providing real-time data, scenario modelling, and predictive analytics. Leaders who combine Adaptive Capacity with AI Readiness can adapt faster and more intelligently.", "risk": "low"}
        ],
        "coaching_prompts": [
            "Think of the most significant change you've led in the last 2 years. What was your approach to getting the team through it? What would you do differently now?",
            "When you face a situation with incomplete information, how do you decide what to do? What is your process for acting without certainty?",
            "What is the biggest change your organisation is currently facing? Are you leading that change — or is it happening to you? What is the difference?",
            "In your specific APAC context, what cultural factors make change harder? How do you navigate those factors without compromising the change?",
            "How do you know when to adapt vs. when to stay the course? What is your decision framework for that judgment?"
        ],
        "apac_calibration": [
            "Tradition & Change: In APAC cultures with strong tradition (Japan, Korea, Thailand), change is often resisted not because it is wrong but because it disrupts established cultural patterns. Adaptive leaders in these contexts must frame change as continuity rather than disruption — 'We are evolving our tradition, not abandoning it.'",
            "Change Speed Expectations: APAC change speeds vary dramatically. Chinese technology companies adapt at extreme speed (weekly pivots are normal); Japanese manufacturers adapt slowly and deliberately (annual or multi-year cycles); Singaporean financial services adapt at moderate speed (quarterly planning cycles). A leader's Adaptive Capacity must be calibrated to their market's change speed expectations.",
            "Collective vs. Individual Change: In collectivist APAC cultures, change must be adopted by the group — individual change agents who move ahead of the group can be seen as disruptive rather than visionary. Adaptive leadership in APAC often requires building collective buy-in before any visible change occurs."
        ]
    },

    "AI Readiness": {
        "id": "D6",
        "construct": "Executive Performance Architecture",
        "description": [
            "AI Readiness is the executive capability to understand, leverage, and lead AI adoption within an organisation. It is not a technical competency — it does not require the leader to build AI systems — but it does require the leader to understand what AI can and cannot do, to make informed decisions about AI investment and adoption, to navigate the ethical and risk implications of AI deployment, and to lead their organisation through the organisational change that AI adoption requires.",
            "At the QUEST level, AI Readiness is measured as an executive leadership capability: can the candidate make informed decisions about AI? Can they identify where AI creates value — and where it creates risk? Can they lead their organisation through AI adoption in a way that builds capability rather than creating dependency? This is increasingly a minimum requirement for executive effectiveness — a leader who is AI-unready in 2025+ is operating with a significant capability gap.",
            "The dimension comprises four sub-dimensions (note: this dimension uses 6 items mapped to 4 sub-dimensions, with some sub-dimensions assessed by multiple items): decision architecture readiness (structuring decisions for AI augmentation), data governance awareness (understanding data quality, privacy, and governance requirements for AI), AI ethics & risk oversight (navigating the ethical and risk implications of AI deployment), and organisational AI adoption leadership (leading the organisational change required for AI adoption)."
        ],
        "sub_dim_interpretation": {
            "Decision Architecture Readiness": "The ability to structure organisational decisions so they can be augmented by AI — understanding which decisions are amenable to AI support, what data those decisions require, and how to design decision processes that combine human judgment with AI capability.",
            "Data Governance Awareness": "Understanding the data quality, privacy, and governance requirements for effective AI deployment. AI is only as good as the data it learns from — leaders who don't understand data governance will make poor AI investment decisions.",
            "AI Ethics & Risk Oversight": "Navigating the ethical and risk implications of AI deployment — bias, transparency, accountability, job displacement, and the broader societal implications of AI adoption. This is increasingly a board-level concern.",
            "Organisational AI Adoption Leadership": "Leading the organisational change required for AI adoption — not just buying technology, but building capability, managing resistance, and ensuring AI augments rather than replaces human capability."
        },
        "band_narratives": {
            "Strong (≥70%)": "This candidate demonstrates mature AI readiness. They understand what AI can and cannot do, can make informed decisions about AI investment, and can lead their organisation through AI adoption effectively. In practice, this means: they can identify high-value AI use cases specific to their business context; they ask the right questions about data quality and governance before AI investments; they navigate AI ethics considerations proactively rather than reactively; and they lead AI adoption as an organisational capability building exercise rather than a technology deployment exercise. The risk at this level is AI solutionism — the tendency to see AI as the answer to every organisational problem, even when simpler solutions would be more effective.",
            "Developing (50-69%)": "This candidate shows moderate AI readiness. They understand that AI is important and have some awareness of AI applications — but they may struggle with: identifying specific high-value AI use cases for their context; evaluating AI vendor claims critically; understanding the data governance requirements for AI; and leading the organisational change required for AI adoption. In practice, they are AI-aware but not AI-fluent — they know they need to engage with AI but haven't yet built the capability to do so effectively. The development priority is structured AI learning: not technical AI training, but executive-level AI literacy — understanding what AI can do, what it requires, and how to lead adoption.",
            "Gap (<50%)": "This candidate shows significant AI readiness gaps that will increasingly constrain their executive effectiveness. In an environment where AI is reshaping every industry, a leader who cannot engage with AI at an executive level is operating with a growing capability gap. In practice, this manifests as: over-reliance on technology teams for AI decisions; inability to evaluate AI vendor claims; limited understanding of data governance requirements; and tendency to either ignore AI entirely or adopt AI without strategic rationale. For current roles in AI-light industries, this may be manageable short-term. For any role requiring digital transformation or technology leadership, this gap is increasingly disqualifying."
        },
        "overuse_risks": "AI Readiness overused becomes AI solutionism: the leader who sees AI as the answer to every organisational problem, even when simpler, cheaper, or more human solutions would be more effective. In practice, this looks like: AI pilots that solve non-existent problems; over-investment in AI technology without corresponding investment in data governance or organisational capability; displacement of human judgment in contexts where human judgment is essential; and a culture where 'AI-first' becomes an ideology rather than a tool. The over-ready AI leader also risks moving faster than their organisation can absorb — creating AI capability that exists in the leader's vision but not in the organisation's operational reality.",
        "cross_dynamics": [
            {"dim": "Strategic Thinking", "interaction": "AI can extend strategic thinking capability — scenario planning, pattern recognition, market analysis. The leader who combines Strategic Thinking with AI Readiness can leverage AI to enhance their strategic cognition.", "risk": "low"},
            {"dim": "Execution Excellence", "interaction": "AI can significantly enhance execution capability — automated progress tracking, predictive resource allocation, intelligent workflow optimisation. The combination is powerful but requires both execution discipline and AI understanding.", "risk": "low"},
            {"dim": "Commercial Acumen", "interaction": "AI is creating new commercial models and disrupting existing ones. Commercial Acumen + AI Readiness = the ability to identify AI-driven commercial opportunities and threats before competitors.", "risk": "medium"},
            {"dim": "People Leadership", "interaction": "AI adoption requires people change — new skills, new roles, new ways of working. AI Readiness without People Leadership creates technology without adoption; People Leadership without AI Readiness creates willingness without capability.", "risk": "medium"},
            {"dim": "Adaptive Capacity", "interaction": "AI adoption is itself a change initiative. Adaptive Capacity supports AI adoption — leaders who can navigate change can lead AI adoption more effectively. Conversely, AI can enhance Adaptive Capacity by providing real-time data for faster adaptation.", "risk": "low"}
        ],
        "coaching_prompts": [
            "What is your organisation's current AI adoption status? Not the technology deployment — the actual organisational capability. Can your teams use AI tools effectively? What is the gap?",
            "Think of the highest-value AI use case in your business context. What data does it require? Do you have that data? What governance is needed? Walk me through your analysis.",
            "What AI-related decisions are you currently making? How confident are you in those decisions? What information would increase your confidence?",
            "How are you leading AI adoption in your team? Is it top-down (you pushing AI) or bottom-up (your team pulling AI)? Which approach is more effective in your context?",
            "What are the ethical risks of AI deployment in your specific context? How are you navigating those risks? What governance framework exists?"
        ],
        "apac_calibration": [
            "Regulatory Landscape: APAC AI regulation varies dramatically — China has comprehensive AI governance frameworks; Singapore has a model AI governance framework; Japan focuses on AI ethics principles; Australia is developing its approach. Leaders must understand the specific regulatory environment for AI in their market.",
            "AI Adoption Culture: APAC attitudes toward AI vary significantly. Chinese and Korean organisations often adopt AI rapidly; Japanese organisations adopt more deliberately with focus on human-AI collaboration; Southeast Asian markets are at varying stages. A leader's AI Readiness must be calibrated to their market's adoption pace and cultural expectations.",
            "Talent Availability: AI talent availability varies dramatically across APAC markets. In China, AI talent is abundant; in Singapore, it is available but expensive; in other APAC markets, it is scarce. Leaders must build AI capability that is realistic about their market's talent constraints."
        ]
    }
}

def get_dimension_content(dim_name, score_pct, sub_dim_scores=None):
    """
    Returns structured content for a dimension at a specific score band.
    
    Args:
        dim_name: Dimension name (e.g., "Strategic Thinking")
        score_pct: Score as percentage (0-100)
        sub_dim_scores: Optional dict of sub-dimension name -> score
    
    Returns:
        dict with all content sections for the dimension
    """
    dim_data = QUEST_DIMENSIONS.get(dim_name)
    if not dim_data:
        return None
    
    # Determine band
    if score_pct >= 70:
        band_key = "Strong (≥70%)"
    elif score_pct >= 50:
        band_key = "Developing (50-69%)"
    else:
        band_key = "Gap (<50%)"
    
    result = {
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
    
    # Add sub-dimension specific interpretations if scores provided
    if sub_dim_scores:
        result["sub_dim_details"] = []
        for sd_name, sd_score in sub_dim_scores.items():
            interpretation = dim_data["sub_dim_interpretation"].get(sd_name, "")
            result["sub_dim_details"].append({
                "name": sd_name,
                "score": sd_score,
                "interpretation": interpretation
            })
    
    return result

# Test
if __name__ == "__main__":
    content = get_dimension_content("Strategic Thinking", 56.5)
    print(f"Dimension: {content['id']}")
    print(f"Band: {content['band']}")
    print(f"Description paragraphs: {len(content['description_paragraphs'])}")
    print(f"Coaching prompts: {len(content['coaching_prompts'])}")
    print(f"Cross-dynamics: {len(content['cross_dynamics'])}")
    print(f"APAC calibration notes: {len(content['apac_calibration'])}")
    print(f"\nBand narrative preview: {content['band_narrative'][:200]}...")

