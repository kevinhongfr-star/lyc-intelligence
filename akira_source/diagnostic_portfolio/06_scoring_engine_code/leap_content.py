"""
LEAP v2.1 — Gold-Standard Content Library
9 dimensions: 4 DISC behavioral + 5 Career Readiness
Each dimension: behavioral description, score-band interpretation, sub-dimension detail,
                overuse risks, cross-dimension dynamics, coaching prompts, APAC calibration.

Pattern mirrors QUEST/IMPACT/PRISM content libraries.
"""


def get_dimension_content(dim_name: str, score_pct: float) -> dict:
    """Unified interface for dimension content retrieval."""
    lib = _DIMENSION_LIBRARY.get(dim_name)
    if not lib:
        return {"error": f"Unknown dimension: {dim_name}"}
    return lib(score_pct)


# ─────────────────────────────────────────────────────────
# DISC DIMENSIONS
# ─────────────────────────────────────────────────────────

def _disc_dominance(pct):
    band = _band_label(pct, ["Minimal", "Weak", "Reserve", "Strong Secondary", "Strong Primary"])
    
    desc = [
        "Dominance measures your drive to take charge, push through resistance, and produce results. It reflects how you respond to challenges, assert your position, and navigate conflict. In leadership contexts, Dominance shapes whether you default to directive action or collaborative deliberation when stakes are high.",
        "High scorers create momentum — they make decisions quickly, challenge the status quo, and accept the discomfort of friction. Low scorers create consensus — they build buy-in, avoid unnecessary battles, and protect team harmony. Neither is inherently better; the question is whether your Dominance level matches what your role demands and your organisation rewards.",
        "In the APAC context, Dominance reads differently across cultures. In Australia and Singapore, moderate-to-high Dominance is expected of senior leaders. In Japan, Thailand, and Indonesia, overt Dominance may be perceived as aggression or loss of composure. The most effective leaders calibrate their Dominance expression to cultural context while maintaining internal conviction."
    ]
    
    sub_dims = [
        {"name": "Decision Speed", "desc": "How quickly you move from analysis to action under uncertainty."},
        {"name": "Challenge Orientation", "desc": "Whether you lean into or away from conflict and disagreement."},
        {"name": "Directive Style", "desc": "Your default mode of influencing others — telling vs. asking."},
        {"name": "Competitive Drive", "desc": "The intensity of your need to win, outperform, and be first."}
    ]
    
    if pct >= 75:
        narrative = (
            f"Your Dominance score ({pct:.0f}, {band}) places you in the top tier of directive leaders. "
            "You lead from the front, make decisions under pressure, and are comfortable with confrontation. "
            "Your team likely sees you as decisive and strong-willed — sometimes intimidating. "
            "The risk is that your speed and directness may override others' input, creating compliance rather than commitment. "
            "People may agree publicly and resist privately. Your challenge is not to be less decisive, "
            "but to ensure your pace doesn't outstrip your organisation's ability to absorb change."
        )
    elif pct >= 55:
        narrative = (
            f"Your Dominance score ({pct:.0f}, {band}) reflects a balanced approach to directive leadership. "
            "You can be assertive when needed but default to collaboration. This is often the sweet spot "
            "for senior roles in matrix organisations where influence matters more than authority. "
            "The question is whether you have specific situations where you need to dial up — "
            "turnarounds, crisis response, or pushing through organisational inertia."
        )
    else:
        narrative = (
            f"Your Dominance score ({pct:.0f}, {band}) suggests you prefer influence through persuasion, "
            "relationship, and consensus-building rather than direct assertion. You're likely perceived as "
            "collaborative and approachable — assets in many contexts. The risk is that in situations requiring "
            "decisive action, you may be perceived as indecisive or lacking conviction. "
            "The question isn't whether you need more Dominance, but whether your current style is being "
            "read as 'low drive' rather than 'different approach'."
        )
    
    overuse = [
        "At very high levels, Dominance can become intimidation — people comply but don't commit",
        "Risk of steamrolling through consensus-building, leaving hidden resistance",
        "May create a culture of dependency where others wait for your decision rather than thinking independently",
        "In APAC contexts, unchecked Dominance can damage face-saving dynamics and long-term relationships"
    ]
    
    cross_dynamics = [
        ("High D + Low S", "Impatience risk — you push for results without allowing the team the processing time they need. You may perceive others as 'slow' when they're actually being thorough."),
        ("High D + Low C", "Speed over accuracy — you make fast decisions without sufficient analytical rigour. Risk of costly errors that could have been caught with more due diligence."),
        ("High D + Low I", "Directive without inspiration — you tell people what to do but can't rally them emotionally. Compliance without commitment."),
        ("High D + Low D peers", "Dominance clash — if you're in a team of high-D peers, expect friction. Clarify decision rights early.")
    ]
    
    coaching = [
        "When was the last time someone on your team pushed back on your decision? If it's rare, that's a signal — not that they agree, but that they've learned not to challenge you.",
        "Rate your last 3 major decisions on a scale: how much of the outcome was your call vs. a genuine team decision? If it's 80%+ your call, you may be creating compliance, not commitment.",
        "Think of a stakeholder who consistently resists your approach. What would it take to understand their resistance as data rather than obstruction?",
        "In which cultural contexts has your Dominance style been misread? What adaptations have you made — and which have you refused to make?",
        "If you were unavailable for 30 days, would your team's decisions get better or worse? If worse, you haven't built enough decision-making capability around you."
    ]
    
    apac = (
        "In Australia and Singapore, high Dominance is generally read as leadership capability — "
        "but only when paired with evidence (Proof) and interpersonal skill (Influence). "
        "In Japan and Korea, Dominance must be expressed through consensus-building rituals — "
        "nemawashi in Japan, where decisions are pre-aligned before formal meetings. "
        "In Southeast Asia (Thailand, Indonesia, Philippines), overt Dominance risks loss of face "
        "and can permanently damage working relationships. "
        "Calibration tip: In high power-distance cultures, your Dominance should be expressed through "
        "the quality of your questions, not the force of your directives."
    )
    
    return {
        "id": "D", "construct": "Dominance", "band": band,
        "description_paragraphs": desc,
        "band_narrative": narrative,
        "sub_dim_interpretation": sub_dims,
        "overuse_risks": overuse,
        "cross_dynamics": cross_dynamics,
        "coaching_prompts": coaching,
        "apac_calibration": apac,
        "score_pct": pct
    }


def _disc_influence(pct):
    band = _band_label(pct, ["Minimal", "Weak", "Reserve", "Strong Secondary", "Strong Primary"])
    
    desc = [
        "Influence measures your drive to persuade, inspire, and win others over through enthusiasm and social engagement. It reflects how naturally you build relationships, communicate vision, and create emotional buy-in. In leadership, Influence determines whether you lead through authority or through attraction.",
        "High scorers are magnetic — they energise rooms, build broad networks, and create followership through personal connection. They're often the ones who can sell a vision before the details are worked out. Low scorers lead through substance, precision, and quiet credibility — their influence is earned through results, not rhetoric.",
        "Across APAC, Influence has a narrow band of acceptability. In Western contexts, high Influence is almost universally rewarded. In East Asia, excessive enthusiasm or persuasive energy can be read as superficiality or untrustworthiness. The most effective approach is what some call 'warm authority' — genuine engagement without performative extroversion."
    ]
    
    sub_dims = [
        {"name": "Persuasive Communication", "desc": "Your ability to move others through words, stories, and emotional resonance."},
        {"name": "Network Building", "desc": "How naturally you create and maintain strategic relationships."},
        {"name": "Social Confidence", "desc": "Your comfort level in new social situations and with senior stakeholders."},
        {"name": "Enthusiasm Expression", "desc": "How visibly you communicate passion and energy for ideas."}
    ]
    
    if pct >= 75:
        narrative = (
            f"Your Influence score ({pct:.0f}, {band}) indicates a natural ability to win people over. "
            "You likely find it easy to build rapport, present to senior audiences, and create excitement around ideas. "
            "People describe you as engaging, persuasive, and well-connected. "
            "The risk is that your social ease may mask a lack of depth — being liked is not the same as being trusted with high-stakes decisions. "
            "Ensure your Influence is backed by substance (Proof) and strategic direction (Positioning)."
        )
    elif pct >= 55:
        narrative = (
            f"Your Influence score ({pct:.0f}, {band}) suggests you're socially effective but not dependent on charisma. "
            "You can engage audiences when needed but don't need to be the most entertaining person in the room. "
            "This is often an advantage — you're taken seriously without being seen as style over substance. "
            "The question is whether there are specific contexts (pitching, stakeholder management, cross-border work) "
            "where you need to amplify your persuasive presence."
        )
    else:
        narrative = (
            f"Your Influence score ({pct:.0f}, {band}) suggests you lead through substance rather than social energy. "
            "You may prefer small-group conversations to large presentations, and written communication to verbal persuasion. "
            "This is not a weakness — many respected leaders are quiet influencers. "
            "However, at senior levels, the inability to inspire a room or build a broad network becomes a ceiling. "
            "The question is whether your low Influence is a deliberate choice or an undeveloped capability."
        )
    
    overuse = [
        "Risk of being perceived as charismatic but shallow — great presenter, weak executor",
        "May over-invest in relationship-building at the expense of deliverables",
        "High Influence + low C = persuading people toward poorly-analysed decisions",
        "In APAC, excessive enthusiasm can trigger distrust — 'why are they trying so hard to convince me?'"
    ]
    
    cross_dynamics = [
        ("High I + Low C", "Persuasion without rigour — you sell ideas that haven't been stress-tested. Risk of credibility erosion when the details don't hold up."),
        ("High I + Low S", "Excitement without follow-through — you start projects with energy but lose interest during execution. Others may see you as unreliable."),
        ("High I + Low D", "Charm without conviction — you can engage people but can't push through resistance. Persuasion fades when it meets friction."),
        ("High I + High D", "The powerhouse combination — you can both command and inspire. But watch for burnout and overwhelming your team.")
    ]
    
    coaching = [
        "When you walk into a room of senior stakeholders, do you naturally take the social lead or wait to read the room? Neither is wrong — but know which one you default to and why.",
        "List the 5 most senior people in your network who would advocate for you unprompted. If the list is short, your Influence isn't converting to strategic capital.",
        "Think of your last major presentation. Were people engaged because of your ideas or because of your delivery? If only the latter, the effect won't last.",
        "In which cultural contexts has your communication style been misread? What specific adjustments have you made?",
        "Are you using your Influence to build others up, or primarily to advance your own visibility? The most effective leaders do both."
    ]
    
    apac = (
        "In Australia, high Influence is rewarded — but it must be authentic and not perceived as 'slick'. "
        "The Aussie cultural filter rejects obvious persuasion tactics. "
        "In Singapore and Hong Kong, Influence works through demonstrated competence and relationship depth, not performative enthusiasm. "
        "In Japan, the concept of 'enryo' (restraint) means that excessive enthusiasm can be read as immaturity or lack of gravitas. "
        "In Southeast Asia, Influence is expressed through harmony-building and face-giving — "
        "not through standing out or being the loudest voice. "
        "Calibration tip: In relationship-based cultures, your Influence should be expressed through consistent presence and quiet reliability, not through high-energy pitches."
    )
    
    return {
        "id": "I", "construct": "Influence", "band": band,
        "description_paragraphs": desc,
        "band_narrative": narrative,
        "sub_dim_interpretation": sub_dims,
        "overuse_risks": overuse,
        "cross_dynamics": cross_dynamics,
        "coaching_prompts": coaching,
        "apac_calibration": apac,
        "score_pct": pct
    }


def _disc_steadiness(pct):
    band = _band_label(pct, ["Minimal", "Weak", "Reserve", "Strong Secondary", "Strong Primary"])
    
    desc = [
        "Steadiness measures your preference for stability, consistency, and patient relationship-building. It reflects how you handle change, manage pace, and create psychological safety for others. In leadership, Steadiness determines whether you create a calm, reliable environment or a dynamic, fast-moving one.",
        "High scorers are anchors — they create stability, absorb organisational turbulence, and build deep trust over time. They're the ones people turn to when things feel uncertain. Low scorers are catalysts — they create urgency, thrive in change, and may become restless when things feel too settled.",
        "In APAC contexts, Steadiness is highly valued — particularly in Japan, Korea, and Southeast Asia, where long-term relationship commitment and consistency are core cultural values. However, in fast-moving markets and startup environments, high Steadiness can be perceived as resistance to change."
    ]
    
    sub_dims = [
        {"name": "Change Tolerance", "desc": "Your comfort level with ambiguity, reorganisation, and shifting priorities."},
        {"name": "Pace Preference", "desc": "Whether you default to deliberate-and-thorough or fast-and-iterative."},
        {"name": "Relationship Depth", "desc": "How you invest in long-term relationships vs. transactional interactions."},
        {"name": "Emotional Regulation", "desc": "Your ability to remain calm and steady under pressure or uncertainty."}
    ]
    
    if pct >= 75:
        narrative = (
            f"Your Steadiness score ({pct:.0f}, {band}) indicates a strong preference for stability and consistency. "
            "You create calm in your teams, build deep relationships, and resist impulsive change. "
            "People see you as reliable, patient, and trustworthy. "
            "The risk is that your preference for stability may cause you to delay necessary changes, "
            "avoid difficult conversations, or miss time-sensitive opportunities. "
            "In career terms, high S can create inertia — you may be 'ready' for a move but reluctant to initiate it."
        )
    elif pct >= 55:
        narrative = (
            f"Your Steadiness score ({pct:.0f}, {band}) suggests a balanced approach to pace and change. "
            "You can operate in both stable and dynamic environments without significant discomfort. "
            "This adaptability is valuable in matrix organisations and cross-border roles where contexts shift frequently. "
            "The question is whether you have a default — when stressed, do you lean toward control or flexibility?"
        )
    else:
        narrative = (
            f"Your Steadiness score ({pct:.0f}, {band}) suggests you thrive on change, variety, and forward momentum. "
            "You're likely perceived as energetic and dynamic — possibly restless by those who prefer more stability. "
            "In career terms, low Steadiness is an asset for transitions — you're comfortable with the uncertainty "
            "of a new role, new team, or new market. The risk is that you may underestimate the value of patience "
            "and relationship depth in building long-term credibility."
        )
    
    overuse = [
        "At very high levels, Steadiness becomes resistance — avoiding necessary change under the guise of 'stability'",
        "Risk of being perceived as passive or disengaged when the organisation needs urgency",
        "May stay in comfortable roles past their optimal exit point — 'golden handcuffs' effect",
        "High S leaders may avoid difficult performance conversations, letting underperformance persist"
    ]
    
    cross_dynamics = [
        ("High S + Low D", "The inertia combination — you're comfortable and capable but not initiating change. Career risk: missing optimal transition windows."),
        ("High S + High I", "Warm and reliable — you build deep relationships. But may avoid the confrontational aspects of leadership."),
        ("High S + Low C", "Steady but not rigorous — you create stability without the analytical depth to sustain it through complex challenges."),
        ("High S + High D", "The rare balance — you can both create stability AND push for results. This combination is highly valued in turnaround contexts.")
    ]
    
    coaching = [
        "When was the last time you initiated a significant change — in your role, your team, or your approach? If it's been more than 12 months, your Steadiness may be creating inertia.",
        "Rate your last 5 career decisions on a scale of 'proactive' to 'reactive'. If most were reactive (you responded to opportunities rather than creating them), your S may be keeping you in a holding pattern.",
        "Think about the conversations you've been avoiding. Is your reluctance based on strategic timing, or discomfort with conflict?",
        "In which contexts has your steadiness been your greatest asset? In which has it held you back?",
        "If you waited for 'the right time' to make a career move, would you still be waiting? What would change if you moved in the next 90 days?"
    ]
    
    apac = (
        "In Japan, Steadiness is deeply valued — the concept of 'wa' (harmony) prioritises long-term stability "
        "and relationship continuity. Leaders who demonstrate patience and consistency earn deep respect. "
        "In China, Steadiness is valued but must be paired with visible results — 'stable but stagnant' is not acceptable. "
        "In Southeast Asia, Steadiness aligns with cultural preferences for hierarchy and long-term loyalty. "
        "In Australia, high Steadiness may be perceived as 'too comfortable' — the cultural norm favours 'a fair go' "
        "but also rewards those who show initiative and forward momentum. "
        "Calibration tip: In APAC, express your Steadiness as commitment to long-term relationships, not as resistance to change."
    )
    
    return {
        "id": "S", "construct": "Steadiness", "band": band,
        "description_paragraphs": desc,
        "band_narrative": narrative,
        "sub_dim_interpretation": sub_dims,
        "overuse_risks": overuse,
        "cross_dynamics": cross_dynamics,
        "coaching_prompts": coaching,
        "apac_calibration": apac,
        "score_pct": pct
    }


def _disc_conscientiousness(pct):
    band = _band_label(pct, ["Minimal", "Weak", "Reserve", "Strong Secondary", "Strong Primary"])
    
    desc = [
        "Conscientiousness measures your drive for accuracy, quality, and analytical rigour. It reflects how you approach problems, make decisions, and hold yourself to standards. In leadership, Conscientiousness determines whether you lead with data and precision or with instinct and speed.",
        "High scorers are thorough — they analyse before acting, quality-check before delivering, and create systems that reduce error. They're the ones who catch what others miss. Low scorers are fast — they act before the data is complete, accept 'good enough', and iterate through doing rather than planning.",
        "Across APAC, Conscientiousness manifests differently. In Japan and Korea, precision is a cultural value — 'monozukuri' (craftsmanship) in Japan creates an expectation of meticulous quality. In Singapore, analytical rigour is rewarded in business and government. In more relationship-based cultures (Philippines, Indonesia, Thailand), excessive focus on detail can be perceived as nitpicking or lack of trust in others."
    ]
    
    sub_dims = [
        {"name": "Analytical Rigour", "desc": "Your tendency to seek data, evidence, and logical structure before making decisions."},
        {"name": "Quality Standards", "desc": "How high you set your personal standards and how consistently you enforce them."},
        {"name": "Systematic Thinking", "desc": "Your preference for process, structure, and repeatable approaches."},
        {"name": "Error Avoidance", "desc": "How much you invest in preventing mistakes vs. accepting risk and learning from failure."}
    ]
    
    if pct >= 75:
        narrative = (
            f"Your Conscientiousness score ({pct:.0f}, {band}) places you among the most analytically rigorous leaders. "
            "You create structure, enforce quality, and ensure nothing ships without proper validation. "
            "Your teams likely produce high-quality work, but may move slower than competitors. "
            "The risk is perfectionism — your standards may become a bottleneck, preventing the organisation from moving fast enough. "
            "In career terms, high C is an asset for credibility but may slow your visibility and network-building."
        )
    elif pct >= 55:
        narrative = (
            f"Your Conscientiousness score ({pct:.0f}, {band}) suggests you balance rigour with pragmatism. "
            "You analyse enough to make good decisions but don't get paralysed by the need for perfect data. "
            "This is often the sweet spot for senior leadership roles that require both analytical credibility "
            "and decisive action. The question is whether there are contexts where you need to dial up or down."
        )
    else:
        narrative = (
            f"Your Conscientiousness score ({pct:.0f}, {band}) suggests you prefer speed and iteration over "
            "analysis and planning. You're likely perceived as decisive and action-oriented — possibly impatient "
            "with process. In career terms, low C can be an asset for speed but a liability when stakeholders "
            "demand rigour. The question is whether your approach is being read as 'agile' or 'reckless'."
        )
    
    overuse = [
        "Perfectionism as procrastination — waiting for perfect data when 'good enough' would suffice",
        "Analysis paralysis — delaying decisions because the information isn't 100% complete",
        "May create bottlenecks by quality-checking work that others consider 'done'",
        "In APAC, excessive C can be perceived as lack of trust in your team or partners"
    ]
    
    cross_dynamics = [
        ("High C + Low D", "Analysis without action — you create perfect plans but never execute. The organisation waits for your certainty that never arrives."),
        ("High C + Low I", "Rigour without connection — your analyses are correct but nobody wants to hear them. You're right but irrelevant."),
        ("High C + Low S", "Rigorous but restless — you create detailed systems but lose interest in maintaining them. Others inherit half-built frameworks."),
        ("High C + High D", "The precision-commander — you analyse rigorously AND act decisively. This is rare and highly valued. Watch for overwhelming your team with demands for both speed and perfection.")
    ]
    
    coaching = [
        "What percentage of your decisions are 'good enough' vs. 'optimal'? If less than 70% are 'good enough', your C may be costing you more time than it saves.",
        "Think of the last project that shipped late. How much of the delay was genuine quality work vs. perfectionism? Be honest.",
        "Rate your team's confidence in making decisions without your input. If low, your C may be creating dependency rather than capability.",
        "In which contexts has your rigour been genuinely necessary vs. a personal comfort zone? Not all decisions require the same level of analysis.",
        "How do you handle the gap between your standards and your team's output? Do you raise the team or do the work yourself?"
    ]
    
    apac = (
        "In Japan, high Conscientiousness aligns with 'monozukuri' — the cultural commitment to craftsmanship "
        "and meticulous quality. Leaders who demonstrate C earn deep respect. "
        "In Singapore, analytical rigour is expected and rewarded in both business and government contexts. "
        "In China, C is valued but must be balanced with speed — 'fast and accurate' is the expectation, "
        "not 'accurate eventually'. "
        "In Southeast Asia, excessive C can be perceived as micromanagement or distrust. "
        "Relationship-building often takes priority over process adherence. "
        "Calibration tip: In APAC, express Conscientiousness through the quality of your preparation, "
        "not through public correction of others' work."
    )
    
    return {
        "id": "C", "construct": "Conscientiousness", "band": band,
        "description_paragraphs": desc,
        "band_narrative": narrative,
        "sub_dim_interpretation": sub_dims,
        "overuse_risks": overuse,
        "cross_dynamics": cross_dynamics,
        "coaching_prompts": coaching,
        "apac_calibration": apac,
        "score_pct": pct
    }


# ─────────────────────────────────────────────────────────
# CAREER READINESS DIMENSIONS
# ─────────────────────────────────────────────────────────

def _cr_positioning(pct):
    band = _cr_band_label(pct)
    
    desc = [
        "Positioning measures whether you have a clear, differentiated professional identity — the answer to 'what are you known for?' It's the foundation of career readiness. Without clear positioning, even strong capabilities go unnoticed because decision-makers can't categorise you or connect you to opportunities.",
        "High scorers have done the work of articulating their unique value: what they do differently, what specific expertise they bring, and how they're distinct from peers at their level. Low scorers may have strong capabilities but haven't translated them into a clear narrative that the market can understand and act on.",
        "Positioning is the heaviest-weighted dimension in LEAP (25%) because it's the gateway to all other readiness work. Without positioning, Proof has no frame, Visibility has no target, and Move has no direction. It's the dimension where small investments create disproportionate returns."
    ]
    
    sub_dims = [
        {"name": "Value Articulation", "desc": "Can you state what makes you different in one sentence that a stranger would understand?"},
        {"name": "Market Perception", "desc": "Do others in your industry associate you with specific expertise — without you having to explain it?"},
        {"name": "Brand Consistency", "desc": "Is your professional identity consistent across LinkedIn, your bio, conversations, and reputation?"}
    ]
    
    if pct >= 75:
        narrative = (
            f"Your Positioning score ({pct:.0f}, {band}) is strong. You've done the hard work of defining "
            "what you're known for, and the market is responding — people connect your name to specific expertise. "
            "The challenge now is consistency: ensuring every touchpoint reinforces your positioning, "
            "and that your narrative evolves as you grow into more senior roles. "
            "The risk of strong positioning is rigidity — becoming so identified with one thing that "
            "pivoting becomes difficult."
        )
    elif pct >= 55:
        narrative = (
            f"Your Positioning score ({pct:.0f}, {band}) is developing. You have some clarity about your value "
            "but it's not yet sharp enough to be self-evident to the market. The gap isn't capability — "
            "it's translation. You know what you're good at; the question is whether a decision-maker "
            "who's never met you could articulate your value in one sentence. "
            "This is the highest-leverage investment you can make right now."
        )
    else:
        narrative = (
            f"Your Positioning score ({pct:.0f}, {band}) reveals a significant gap. You may be highly capable, "
            "but the market doesn't know what you stand for. This is the most common reason strong professionals "
            "get passed over — not lack of ability, but lack of clarity. "
            "Without positioning, your Proof has no context, your Visibility has no direction, "
            "and decision-makers can't connect you to opportunities. "
            "This is where your development work must start."
        )
    
    overuse = [
        "Over-positioning can create rigidity — becoming so identified with one thing that pivoting is hard",
        "Risk of positioning that's too narrow for the next level of leadership",
        "May spend more time on narrative than on the substance that needs to back it up"
    ]
    
    cross_dynamics = [
        ("High Positioning + Low Proof", "You know what you're about, but can't back it up. Perception exceeds substance — dangerous combination."),
        ("High Positioning + Low Visibility", "Clear identity but nobody sees it. You're well-defined but invisible — the market can't connect with you."),
        ("High Positioning + Low Move", "Crystal-clear identity but no direction. You know who you are but not where you're going."),
        ("High Positioning + High Proof", "The rare combination — clear identity backed by documented evidence. This is market-ready positioning.")
    ]
    
    coaching = [
        "Finish this sentence in 15 words or fewer: 'I'm the person who ___.' If you can't, your positioning isn't ready.",
        "Ask 5 people who know you professionally: 'What am I known for?' If their answers differ significantly, your positioning isn't landing consistently.",
        "Compare your LinkedIn headline to your elevator pitch to how your CEO would describe you. If all three are different, your brand is fragmented.",
        "What would you need to change about your current positioning to be credible at the next level? Sometimes the positioning that got you here won't get you there.",
        "When was the last time you updated your positioning? If it's been more than 18 months, it may be stale."
    ]
    
    apac = (
        "In Western contexts, positioning is about differentiation — 'what makes you different?' "
        "In many APAC cultures, positioning is about credibility and relationships — 'who vouches for you?' "
        "In Japan, positioning happens through seniority, expertise depth, and organisational loyalty, not self-promotion. "
        "In China, positioning must align with face (mianzi) — claiming too much too early can backfire. "
        "In Australia, positioning works through demonstrated results and peer recognition. "
        "Calibration tip: In APAC, your positioning should be demonstrated through actions and endorsed by trusted others, not through self-declaration."
    )
    
    return {
        "id": "Positioning", "construct": "Positioning", "band": band,
        "description_paragraphs": desc,
        "band_narrative": narrative,
        "sub_dim_interpretation": sub_dims,
        "overuse_risks": overuse,
        "cross_dynamics": cross_dynamics,
        "coaching_prompts": coaching,
        "apac_calibration": apac,
        "score_pct": pct
    }


def _cr_proof(pct):
    band = _cr_band_label(pct)
    
    desc = [
        "Proof measures your documented, verifiable track record of impact. It's not what you've done — it's what you can show you've done. In career advancement, perception without proof is opinion; perception backed by proof is evidence. The difference between being seen as capable and being seen as ready is often a matter of proof.",
        "High scorers have a clear inventory of measurable achievements: revenue generated, costs saved, teams built, transformations delivered. They can point to specific outcomes and quantify their impact. Low scorers may have done significant work but haven't documented it, or their contributions were too diffuse to attribute.",
        "Proof is the dimension that converts visibility into credibility. You can be visible (known to decision-makers) but if you can't point to concrete evidence of impact, visibility alone creates suspicion rather than trust."
    ]
    
    sub_dims = [
        {"name": "Measurable Impact", "desc": "Can you quantify your key achievements in $, %, time, or scale?"},
        {"name": "Attribution Clarity", "desc": "Is it clear what was YOUR contribution vs. your team's or organisation's?"},
        {"name": "Recognition Breadth", "desc": "Is your proof recognised by stakeholders beyond your immediate team?"}
    ]
    
    if pct >= 75:
        narrative = (
            f"Your Proof score ({pct:.0f}, {band}) is strong. You have a documented track record of measurable impact, "
            "and stakeholders beyond your team recognise your contributions. Your proof inventory can support "
            "your next move — the question is whether you're packaging it effectively for your target audience. "
            "A CEO reads proof differently from a board. A cross-border move requires different evidence "
            "from a domestic promotion."
        )
    elif pct >= 55:
        narrative = (
            f"Your Proof score ({pct:.0f}, {band}) is developing. You have some evidence of impact but it's "
            "either not recent enough, not specific enough, or not recognised by the right stakeholders. "
            "The gap isn't performance — you're likely delivering strong results. The gap is documentation "
            "and narrative. You need to convert 'I did a lot' into 'here's what changed because of me'."
        )
    else:
        narrative = (
            f"Your Proof score ({pct:.0f}, {band}) reveals a critical gap. Without documented evidence of impact, "
            "you have no foundation for advancement. It doesn't matter how capable you are — "
            "if you can't point to specific outcomes and say 'this changed because of me,' "
            "decision-makers will default to promoting people who can. "
            "This isn't about self-promotion — it's about creating evidence that speaks for itself."
        )
    
    overuse = [
        "Over-documenting can create analysis paralysis — spending more time tracking metrics than creating impact",
        "Risk of focusing only on measurable outcomes at the expense of relationship-building and culture work",
        "Proof without positioning = a long list of achievements with no coherent narrative about who you are"
    ]
    
    cross_dynamics = [
        ("High Proof + Low Positioning", "You've done great work but nobody knows what you stand for. Impact without identity."),
        ("High Proof + Low Visibility", "You've done great work but the right people don't know about it. Hidden gold."),
        ("High Proof + Low Move", "You have the evidence but aren't using it to advance. Ready but not acting."),
        ("High Proof + High Positioning", "The power combination — clear identity backed by undeniable evidence. Market-ready.")
    ]
    
    coaching = [
        "List your 3 biggest achievements in the last 2 years. For each: what was the measurable outcome? If you can't quantify it, can a decision-maker still trust it?",
        "Who outside your immediate team could testify to your impact? If the list is short, your proof is too local.",
        "Is your proof recent? Achievements from 5+ years ago carry less weight unless you've maintained visibility around them.",
        "Are you documenting impact in real-time or retroactively? Real-time documentation is more credible and less prone to inflation.",
        "What would your proof portfolio look like in 12 months if you started documenting today?"
    ]
    
    apac = (
        "In Western contexts, Proof is quantified and individual — 'I delivered X result.' "
        "In many APAC cultures, Proof is collective and relational — 'our team achieved X' carries more weight "
        "than 'I achieved X'. In Japan, proof is demonstrated through longevity, loyalty, and incremental contribution. "
        "In China, proof must be presented carefully — claiming too much individual credit can trigger face concerns. "
        "In Australia, quantified impact is expected but must be delivered without self-aggrandisement. "
        "Calibration tip: In APAC, frame your proof as team outcomes with clear attribution to your specific contribution, "
        "not as individual heroics."
    )
    
    return {
        "id": "Proof", "construct": "Proof", "band": band,
        "description_paragraphs": desc,
        "band_narrative": narrative,
        "sub_dim_interpretation": sub_dims,
        "overuse_risks": overuse,
        "cross_dynamics": cross_dynamics,
        "coaching_prompts": coaching,
        "apac_calibration": apac,
        "score_pct": pct
    }


def _cr_visibility(pct):
    band = _cr_band_label(pct)
    
    desc = [
        "Visibility measures whether decision-makers are aware of your capabilities and readiness. It combines thought leadership, strategic networking, and public presence. Visibility is not vanity — it's how the market assesses readiness. You can be the most capable person in your organisation, but if the people who make promotion and hiring decisions don't know you, you're invisible.",
        "High scorers are known — they publish, speak, contribute to industry conversations, and have built strategic networks that extend beyond their immediate team. Low scorers may be deeply capable but operate below the radar. Their work is known to their manager but not to the decision-makers who matter for advancement.",
        "Visibility is the bridge between Proof and Opportunity. Without it, strong proof stays locked inside your current organisation and doesn't reach the market. In the APAC context, visibility operates through different channels — industry associations, alumni networks, and trusted introductions carry more weight than public social media presence."
    ]
    
    sub_dims = [
        {"name": "Thought Leadership", "desc": "Do you regularly contribute insights, publish content, or speak at industry events?"},
        {"name": "Decision-Maker Awareness", "desc": "Do the people who make hiring/promotion decisions know who you are and what you can do?"},
        {"name": "Network Quality", "desc": "Is your network strategic — does it include people who can open doors, not just social contacts?"}
    ]
    
    if pct >= 75:
        narrative = (
            f"Your Visibility score ({pct:.0f}, {band}) is strong. Decision-makers know your name, "
            "your network extends strategically, and you're contributing to industry conversations. "
            "The challenge now is focus — ensuring your visibility reinforces your positioning "
            "rather than diluting it. Every public appearance should answer 'what are you known for?' "
            "not just 'are you active?'"
        )
    elif pct >= 55:
        narrative = (
            f"Your Visibility score ({pct:.0f}, {band}) is developing. You have some presence but it's "
            "not yet at the level where decision-makers proactively think of you for opportunities. "
            "The gap is likely specific: you may be visible in the wrong contexts, to the wrong people, "
            "or with insufficient frequency. Strategic visibility requires targeting, not just activity."
        )
    else:
        narrative = (
            f"Your Visibility score ({pct:.0f}, {band}) reveals a critical bottleneck. "
            "You may be highly capable and well-positioned, but if decision-makers don't know you exist, "
            "none of that matters. Invisibility is the single most common reason strong professionals "
            "get passed over. This isn't about becoming an extrovert — it's about making your capabilities "
            "discoverable to the people who need to find you."
        )
    
    overuse = [
        "Visibility without substance = reputation inflation. You're known, but for what?",
        "Risk of over-investing in visibility at the expense of Proof — all marketing, no product",
        "Too-broad visibility can dilute positioning — being visible for everything means being known for nothing"
    ]
    
    cross_dynamics = [
        ("High Visibility + Low Proof", "Known but not credible — your reputation outpaces your evidence. Dangerous gap."),
        ("High Visibility + Low Positioning", "Visible but undefined — people know your name but not what you're for."),
        ("High Visibility + High Proof", "The rare combination — known AND credible. Decision-makers trust you because they can verify."),
        ("High Visibility + Low Network", "You're visible but your network isn't strategic. Broadcasting without targeted connections.")
    ]
    
    coaching = [
        "When a decision-maker in your target market thinks of your expertise area, does your name come to mind? If not, why not?",
        "List your last 3 public contributions (articles, speaking, board roles). Were they strategically aligned with your positioning?",
        "How many people in your network could introduce you to a decision-maker in your target role? If fewer than 3, your network isn't strategic enough.",
        "What's your visibility ratio — how much time do you spend consuming content vs. creating it? If it's 90/10, you're invisible.",
        "Identify one industry event or publication where your target decision-makers gather. What would it take to be visible there within 90 days?"
    ]
    
    apac = (
        "In Western contexts, visibility often means social media presence, conference speaking, and published content. "
        "In APAC, visibility operates through different channels: industry associations, alumni networks, "
        "and trusted introductions from respected figures. In Japan, visibility comes through seniority, "
        "organisational affiliation, and contributions to industry bodies. "
        "In China, visibility must be carefully calibrated — being too visible too early can trigger jealousy and resistance. "
        "In Southeast Asia, visibility works through relationship networks and community contribution. "
        "Calibration tip: In APAC, build visibility through association with respected figures and contribution to collective outcomes, "
        "not through individual self-promotion."
    )
    
    return {
        "id": "Visibility", "construct": "Visibility & Network", "band": band,
        "description_paragraphs": desc,
        "band_narrative": narrative,
        "sub_dim_interpretation": sub_dims,
        "overuse_risks": overuse,
        "cross_dynamics": cross_dynamics,
        "coaching_prompts": coaching,
        "apac_calibration": apac,
        "score_pct": pct
    }


def _cr_move(pct):
    band = _cr_band_label(pct)
    
    desc = [
        "Move measures your readiness and active preparation for career transition. It's the difference between being ready and being willing. Many professionals have the positioning, proof, and visibility for a move — but haven't committed to one. Move captures whether you've defined your next direction, are actively preparing, and feel confident about executing within a realistic timeframe.",
        "High scorers have clarity on destination, are taking specific preparation steps, and feel confident about timing. Low scorers may be capable but uncertain — they haven't decided what's next, haven't started preparing, or are waiting for the 'right time' that may never come.",
        "Move is the dimension that converts readiness into action. Without it, all the positioning, proof, and visibility in the world stays potential energy. The career risk of low Move is timing — windows close, relationships cool, and opportunities pass to people who were ready AND willing."
    ]
    
    sub_dims = [
        {"name": "Direction Clarity", "desc": "Do you know what your next role, industry, or geography looks like?"},
        {"name": "Active Preparation", "desc": "Are you taking specific steps — upskilling, networking, positioning — toward a transition?"},
        {"name": "Timing Confidence", "desc": "Do you feel you can execute a successful move within 12 months?"}
    ]
    
    if pct >= 75:
        narrative = (
            f"Your Move score ({pct:.0f}, {band}) is strong. You know where you're going, you're preparing, "
            "and you're confident about timing. The challenge now is execution — "
            "converting readiness into a successful transition before the window closes. "
            "The risk of high Move without patience is moving too fast — accepting the first opportunity "
            "rather than the right one."
        )
    elif pct >= 55:
        narrative = (
            f"Your Move score ({pct:.0f}, {band}) is developing. You have some direction but lack full clarity "
            "or active momentum. The gap may be specific: you know the type of role but not the industry, "
            "or you know the industry but haven't started preparing. "
            "The question is: what's blocking the next step — information, confidence, or commitment?"
        )
    else:
        narrative = (
            f"Your Move score ({pct:.0f}, {band}) reveals a critical gap. You may be capable and positioned, "
            "but you haven't committed to a direction or started preparing. This is the most common "
            "form of career stagnation — not lack of ability, but lack of decision. "
            "Every month you wait is a month where competitors build their positioning, proof, and networks. "
            "The window doesn't stay open forever."
        )
    
    overuse = [
        "High Move without patience = accepting the wrong role out of urgency",
        "Risk of moving too fast without sufficient due diligence on the target organisation",
        "May underestimate the complexity of cross-border transitions — 'ready' doesn't mean 'easy'"
    ]
    
    cross_dynamics = [
        ("High Move + Low Positioning", "Moving without clarity — you're in a hurry but don't know what you're moving toward."),
        ("High Move + Low Proof", "Moving without evidence — you're ready to go but can't back up your claims."),
        ("High Move + High Alignment", "Moving in alignment with your natural style — the highest-probability transition."),
        ("High Move + Low Alignment", "Moving away from what fits — the move may succeed short-term but create long-term misalignment.")
    ]
    
    coaching = [
        "If you had to define your next role in one paragraph, could you? If not, your Move work starts with direction clarity.",
        "What specific steps have you taken in the last 30 days toward a transition? If the answer is 'none,' you're not moving — you're hoping.",
        "What would change if you moved in 90 days vs. 12 months? Is there a time-sensitive factor you're ignoring?",
        "Are you waiting for certainty? Complete certainty doesn't exist in career moves. What level of confidence would be 'enough' to act?",
        "What's the cost of not moving? If you stay where you are for another 2 years, what opportunities will have passed you by?"
    ]
    
    apac = (
        "In Western contexts, career moves are frequent and expected — changing roles every 2-4 years is normal. "
        "In many APAC cultures, moves are slower and more deliberate — job-hopping can be perceived as disloyalty. "
        "In Japan, lifetime employment is declining but still influential — moves carry more weight and require more preparation. "
        "In China, moves are common in tech and private sectors but must be framed carefully (not running away from problems). "
        "In Southeast Asia, moves often follow relationship networks — you move when someone you trust offers the opportunity. "
        "Calibration tip: In APAC, frame your move as growth toward something, not away from something. "
        "And ensure your network is primed before you announce — in APAC, moves should feel organic, not aggressive."
    )
    
    return {
        "id": "Move", "construct": "Move Readiness", "band": band,
        "description_paragraphs": desc,
        "band_narrative": narrative,
        "sub_dim_interpretation": sub_dims,
        "overuse_risks": overuse,
        "cross_dynamics": cross_dynamics,
        "coaching_prompts": coaching,
        "apac_calibration": apac,
        "score_pct": pct
    }


def _cr_alignment(pct):
    band = _cr_band_label(pct)
    
    desc = [
        "Alignment measures the fit between your natural behavioural style, your current role, and your long-term career direction. It's the dimension that asks: 'is where you are compatible with who you are?' High alignment means your role leverages your strengths, your organisation's culture fits your working style, and your career direction is consistent with your values.",
        "High scorers feel their role is a natural fit — they're using their strengths daily, the culture supports how they work best, and their trajectory feels authentic. Low scorers may be performing well but feel a persistent friction — their role requires behaviours that drain them, or the culture clashes with their natural style.",
        "Alignment is the dimension that determines sustainability. You can succeed in a misaligned role — but it costs more energy, takes longer, and increases burnout risk. In career transition, alignment ensures you're moving toward roles that fit, not just roles that are available."
    ]
    
    sub_dims = [
        {"name": "Role Fit", "desc": "Does your current role leverage your natural behavioural strengths?"},
        {"name": "Cultural Compatibility", "desc": "Does your organisation's culture support how you work best?"},
        {"name": "Value Alignment", "desc": "Is your career direction consistent with your personal values and long-term goals?"}
    ]
    
    if pct >= 75:
        narrative = (
            f"Your Alignment score ({pct:.0f}, {band}) is strong. Your current role leverages your natural strengths, "
            "the culture fits, and your direction feels authentic. This is a powerful platform for your next move — "
            "you're succeeding from a position of strength, not desperation. "
            "The risk is complacency — using current alignment as a reason to delay a move that would take you higher."
        )
    elif pct >= 55:
        narrative = (
            f"Your Alignment score ({pct:.0f}, {band}) is moderate. Some aspects of your role fit well, "
            "but others create friction. The question is which aspects — is it the role itself, "
            "the culture, or the direction? Understanding the specific misalignment helps you target "
            "your next move more precisely."
        )
    else:
        narrative = (
            f"Your Alignment score ({pct:.0f}, {band}) reveals significant misalignment. "
            "You're succeeding in a role that doesn't fit your natural style, or in a culture that clashes "
            "with how you work best. This is sustainable short-term but creates burnout risk long-term. "
            "The question isn't whether you should move — it's whether you're brave enough to move toward "
            "something that actually fits."
        )
    
    overuse = [
        "Over-alignment can create comfort zone trap — staying because it fits, not because it stretches",
        "Risk of using alignment as an excuse to avoid challenging but necessary growth experiences",
        "Perfect alignment doesn't exist — seeking it can become a form of procrastination"
    ]
    
    cross_dynamics = [
        ("High Alignment + Low Move", "Comfortable but not progressing — you're aligned but not ambitious enough to push for more."),
        ("High Alignment + High Move", "The ideal state — aligned AND actively advancing. You're succeeding from strength."),
        ("Low Alignment + High Move", "Moving away from what doesn't fit — courageous and often necessary. But ensure you're moving toward something, not just away."),
        ("Low Alignment + Low Move", "The trap — stuck in a role that doesn't fit and not taking action. This is the highest burnout risk combination.")
    ]
    
    coaching = [
        "What percentage of your working week uses your natural strengths? If less than 60%, the misalignment is significant.",
        "Think about the moments when you feel most energised at work. Are they core to your role or peripheral to it? If peripheral, your role isn't designed around your strengths.",
        "If you could redesign your role from scratch, what would you keep and what would you change? The gap between your answer and your current reality is your alignment gap.",
        "Are you confusing 'familiar' with 'aligned'? Just because you've been somewhere a long time doesn't mean it fits.",
        "What would a role with 80%+ alignment look like? Get specific — industry, function, culture, team size, reporting structure."
    ]
    
    apac = (
        "In Western contexts, alignment is about personal fulfillment — 'does this role make me happy?' "
        "In APAC, alignment often includes family expectations, social obligations, and organisational loyalty. "
        "In Japan, alignment means fitting into the organisational culture and contributing to the collective — "
        "individual misalignment is secondary to group harmony. "
        "In China, alignment includes family expectations and face considerations — a 'good job' may override personal fit. "
        "In Southeast Asia, alignment includes relationship continuity and community standing. "
        "Calibration tip: In APAC, alignment must be evaluated holistically — not just 'do I like this role' "
        "but 'does this role serve my family, my community, and my long-term goals together.'"
    )
    
    return {
        "id": "Alignment", "construct": "Alignment", "band": band,
        "description_paragraphs": desc,
        "band_narrative": narrative,
        "sub_dim_interpretation": sub_dims,
        "overuse_risks": overuse,
        "cross_dynamics": cross_dynamics,
        "coaching_prompts": coaching,
        "apac_calibration": apac,
        "score_pct": pct
    }


# ─────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────

def _band_label(pct, bands):
    if pct >= 80: return bands[4]
    if pct >= 60: return bands[3]
    if pct >= 40: return bands[2]
    if pct >= 20: return bands[1]
    return bands[0]


def _cr_band_label(pct):
    if pct >= 80: return "B4 Market-Ready"
    if pct >= 60: return "B3 Ready"
    if pct >= 40: return "B2 Developing"
    return "B1 Emerging"


# ─────────────────────────────────────────────────────────
# REGISTRY
# ─────────────────────────────────────────────────────────

_DIMENSION_LIBRARY = {
    # DISC dimensions (by construct name or code)
    "D": _disc_dominance,
    "Dominance": _disc_dominance,
    "I": _disc_influence,
    "Influence": _disc_influence,
    "S": _disc_steadiness,
    "Steadiness": _disc_steadiness,
    "C": _disc_conscientiousness,
    "Conscientiousness": _disc_conscientiousness,
    # CR dimensions
    "Positioning": _cr_positioning,
    "Proof": _cr_proof,
    "Visibility": _cr_visibility,
    "Visibility & Network": _cr_visibility,
    "Move": _cr_move,
    "Move Readiness": _cr_move,
    "Alignment": _cr_alignment,
}
