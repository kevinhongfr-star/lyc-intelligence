"""
PRISM Dimension Content Library — Gold Standard Narratives
PRISM: Professional Brand Legibility
5 Dimensions: Brand Clarity, Market Legibility, Identity Consistency, Narrative Power, Visibility Level
"""

PRISM_DIMENSIONS = {
    "Brand Clarity": {
        "id": "D1",
        "construct": "Professional Brand Legibility",
        "description": [
            "Brand Clarity measures the precision and coherence of how a professional's value proposition is defined, differentiated, and communicated. It answers the fundamental question: can someone articulate who you are, what you do, and why you're different — in one clear sentence? In executive markets, brand clarity is the foundation upon which all other brand elements rest — without clarity of identity, market legibility, narrative, and visibility are all built on shifting ground.",
            "At the PRISM level, Brand Clarity is not about personal marketing or self-promotion — it is about the strategic definition of a professional identity that is specific enough to be memorable, differentiated enough to be valuable, and authentic enough to be sustainable. Many executives struggle with brand clarity not because they lack self-awareness but because they have not invested in the strategic work of defining what makes their professional contribution unique in their market.",
            "The dimension captures: value proposition articulation (can you define your unique value?), differentiation clarity (what makes you different from similar professionals?), audience alignment (does your brand definition resonate with the audiences that matter?), narrative coherence (do all your brand signals tell the same story?), and strategic focus (does your brand serve your career direction?)."
        ],
        "sub_dim_interpretation": {
            "Value proposition articulation": "The ability to define your unique professional value in a single, memorable sentence. This is the foundation of brand clarity — without a clear value proposition, everything else is noise.",
            "Differentiation clarity": "Understanding what makes you different from other professionals with similar titles, experience, and capabilities. The market doesn't reward 'competent and similar' — it rewards 'distinctive and valuable.'",
            "Audience alignment": "Ensuring your brand definition resonates with the specific audiences whose perceptions matter — recruiters, clients, peers, boards. A brand that only makes sense to you is not a brand.",
            "Narrative coherence": "All brand signals — your CV, LinkedIn, conversation, appearance, work product — should tell the same story. Incoherent signals create confusion, and confusion kills opportunity.",
            "Strategic focus": "Your brand should serve your career direction, not just reflect your past achievements. A brand built entirely on yesterday's success may be clear but strategically misaligned."
        },
        "band_narratives": {
            "Strong (≥70%)": "This candidate demonstrates clear, differentiated professional brand definition. They can articulate their unique value proposition in a way that is memorable, distinctive, and strategically aligned with their career direction. In practice, this means: when asked 'what do you do?' they don't default to a title or generic description but can articulate the specific value they create; their LinkedIn profile, CV, and conversation all tell the same coherent story; and people who work with them can describe them in specific terms that differentiate them from their peers. The risk at this level is brand rigidity — a clear brand that was defined 5 years ago and hasn't evolved with the market or the professional's career direction. The development priority for candidates at this level is often brand evolution: ensuring the brand remains relevant and differentiated as the market shifts.",
            "Developing (50-69%)": "This candidate shows moderate brand clarity. They have some awareness of their professional brand and can articulate aspects of their value — but their brand definition may lack specificity, differentiation, or strategic focus. In practice, they can describe what they do competently but struggle to articulate what makes them uniquely valuable. Their professional signals — CV, LinkedIn, conversation — may not all tell the same coherent story. Their brand may reflect past achievements rather than future direction. The development priority is strategic brand definition: investing time in answering 'who am I professionally, what makes me different, and where am I going?' — and ensuring the answer is specific enough to be memorable and differentiated enough to be valuable.",
            "Gap (<50%)": "This candidate shows significant brand clarity gaps. They have not yet defined a clear professional brand — or their brand definition is so generic ('experienced leader with strong communication skills') that it fails to differentiate them in any meaningful market context. In practice, this manifests as: inability to articulate unique value; LinkedIn profiles that read like every other executive's; conversation that describes role rather than contribution; and a professional identity that is defined by others rather than by the candidate themselves. For professionals who rely on personal brand for career advancement — client-facing roles, business development, board positions — this gap is foundational and must be addressed before other brand investments can be effective."
        },
        "overuse_risks": "Brand Clarity overused becomes brand narrowness: a professional identity so specifically defined that it cannot evolve with market changes or career transitions. The ultra-clear brand risks becoming a prison — the professional who is known for one thing so clearly that they cannot credibly claim anything else. In rapidly changing markets where career adaptability is increasingly valuable, excessive brand specificity can become a liability rather than an asset.",
        "cross_dynamics": [
            {"dim": "Market Legibility", "interaction": "Brand Clarity is the foundation; Market Legibility is the expression. A clear brand that is illegible to the market is useless; market presence without brand clarity is just noise. They must be developed together.", "risk": "high"},
            {"dim": "Identity Consistency", "interaction": "Brand Clarity defines the brand; Identity Consistency maintains it over time. Inconsistent identity undermines brand clarity — every mixed signal reduces the brand's memorability and credibility.", "risk": "high"},
            {"dim": "Narrative Power", "interaction": "Brand Clarity provides the story; Narrative Power delivers it. A clear brand without narrative power is a secret — known only to the professional. Narrative Power transforms brand clarity into market communication.", "risk": "medium"},
            {"dim": "Visibility Level", "interaction": "Brand Clarity provides what to communicate; Visibility Level provides how visible that communication is. Without visibility, even the clearest brand remains invisible to the market.", "risk": "medium"}
        ],
        "coaching_prompts": [
            "Can you articulate your professional value proposition in one sentence? Try it now. Is it specific enough to be memorable? Differentiated enough to be valuable?",
            "Ask 5 colleagues who know you well: 'In one sentence, what do you do and why are you different?' Compare their answers to your own self-description. Where is the gap?",
            "When you meet someone new in a professional context, how do you introduce yourself? Title and industry — or value and differentiation?",
            "Look at your LinkedIn profile. Does it tell the same story you would tell in conversation? Is it consistent with your CV? Is it consistent with how you want to be perceived?",
            "Is your brand serving where you want to go — or just reflecting where you've been? When did you last update your brand definition to reflect your current career direction?"
        ],
        "apac_calibration": [
            "Modesty Norms: In many APAC cultures (Japan, Korea, China, Thailand), self-promotion is culturally inappropriate. Professionals in these markets may struggle with Brand Clarity not because they lack self-awareness but because articulating their own value feels culturally transgressive. The development priority is finding culturally appropriate ways to define and communicate brand clarity.",
            "Collective vs. Individual Identity: In collectivist APAC cultures, professional identity is often defined through team, organisation, or family affiliation rather than individual differentiation. 'I am from [Company]' rather than 'I am [unique value].' Brand Clarity in these contexts requires navigating the tension between collective identity and individual differentiation.",
            "Title Orientation: APAC markets are often more title-focused than Western markets. Brand Clarity may need to work within title-based expectations rather than against them — using title as an entry point but then differentiating within the title category."
        ]
    },

    "Market Legibility": {
        "id": "D2",
        "construct": "Professional Brand Legibility",
        "description": [
            "Market Legibility measures how easily the market can 'read' a professional — understand their capabilities, assess their value, and identify their relevance to opportunities. It is the bridge between Brand Clarity (how you define yourself) and Market Perception (how the market actually sees you). A professional may have perfect brand clarity internally but be illegible to the market because their signals are too weak, too inconsistent, or too disconnected from market expectations.",
            "At the PRISM level, Market Legibility is measured as the market's ability to correctly assess the professional's value proposition — not the professional's self-assessment. This is a crucial distinction: the market's perception IS the professional's brand, regardless of the professional's self-perception. Market Legibility captures how accurately and completely the market can read the professional's capabilities, value, and career direction.",
            "This dimension is particularly critical in APAC markets where professional networks are often relationship-based rather than visibility-based — making market legibility harder to achieve without the traditional Western mechanisms of public brand building."
        ],
        "sub_dim_interpretation": {
            "Profile accessibility": "How easily can a recruiter, client, or market contact find and understand your professional profile? This includes digital presence (LinkedIn, company bio) and offline presence (network visibility, conference participation).",
            "Capability signal clarity": "Can the market accurately assess what you can do? Capability signals include work samples, testimonials, speaking engagements, published content — all indicators the market uses to evaluate professional capability.",
            "Career narrative visibility": "Is your career trajectory legible to the market? Can a market observer see the logical progression and understand where you're heading? Or does your career appear disconnected and random?",
            "Reputation accuracy": "Does the market's perception of you match your actual capabilities? Reputation is the market's brand of you — and its accuracy determines whether opportunities come to you or pass you by.",
            "Network signal strength": "How strong are the signals your network sends about you? Who you know, who recommends you, who publicly endorses you — these are all market legibility signals."
        },
        "band_narratives": {
            "Strong (≥70%)": "This candidate is highly legible to the market. Recruiters, clients, and market contacts can easily find, understand, and accurately assess their professional value. Their capability signals are clear and consistent; their reputation accurately reflects their actual capabilities; and their career trajectory is visible and legible. In practice, this means: relevant opportunities come to them without active searching; the market correctly values their capabilities (they are neither overvalued nor undervalued); and their professional network serves as a reliable amplification channel. The risk at this level is visibility dependency — if the candidate's market legibility is based on current visibility activities, what happens when those activities pause? The development priority is building lasting market legibility that doesn't require constant visibility investment.",
            "Developing (50-69%)": "This candidate shows moderate market legibility. The market can find them and understand basic information about their capabilities — but the market's understanding may be incomplete, inaccurate, or disconnected from the candidate's actual value. In practice, they may be known in a specific niche but invisible to adjacent markets; their reputation may lag behind their actual capability development; and opportunities may reach them inconsistently. The development priority is expanding market signal strength across multiple channels — ensuring the market can access accurate, complete, and current information about the candidate's value.",
            "Gap (<50%)": "This candidate is largely illegible to the market. The market cannot easily find, understand, or accurately assess their professional value. This does not mean the candidate lacks value — it means the market doesn't know that. In practice, this manifests as: difficulty being found by recruiters and market contacts; a professional profile that is generic or out of date; no visible capability signals (no published work, no speaking engagements, no testimonials); and a career trajectory that appears disconnected to external observers. For professionals who rely on inbound opportunities — consulting, advisory, board positions, business development — this gap is existential."
        },
        "overuse_risks": "Market Legibility overused becomes market performance: the professional whose market presence exceeds their actual capability development, creating a gap between market perception and reality that will eventually collapse. The overly-legible professional risks becoming a 'personal brand' that exists more in the market than in actual capability — all visibility, no substance.",
        "cross_dynamics": [
            {"dim": "Brand Clarity", "interaction": "Brand Clarity provides the content; Market Legibility provides the delivery. Without clear brand, legibility is empty; without legibility, clear brand is invisible.", "risk": "high"},
            {"dim": "Identity Consistency", "interaction": "Identity Consistency ensures the market receives the same signal consistently. Inconsistent identity makes the market's reading of you unreliable — sometimes you look senior, sometimes junior, sometimes different entirely.", "risk": "high"},
            {"dim": "Narrative Power", "interaction": "Narrative Power makes your professional story compelling and shareable. Without narrative power, market legibility is informational but not memorable — the market can read you but won't remember you.", "risk": "medium"},
            {"dim": "Visibility Level", "interaction": "Visibility Level is the volume of your market signal. Market Legibility is the clarity. Both are needed — visibility without clarity is noise; clarity without visibility is silence.", "risk": "medium"}
        ],
        "coaching_prompts": [
            "If a recruiter searched for someone with your capabilities today, would they find you? How? What would they see?",
            "Ask 5 people who know you professionally: 'What do you think I'm best at? What opportunities do you think I should pursue?' Compare their answers to your actual capabilities and career direction. Where is the gap?",
            "When was the last time a relevant opportunity came to you without active searching? What does that tell you about your market legibility?",
            "Look at your professional presence across all platforms and touchpoints. Is the market receiving a consistent signal — or does each touchpoint tell a different story?",
            "What capability signals is the market receiving from you? Published work, speaking engagements, client testimonials, peer endorsements? What is missing?"
        ],
        "apac_calibration": [
            "Relationship vs. Visibility Markets: In APAC markets, professional discovery is often relationship-based rather than visibility-based. Western-style public brand building (content, speaking, social media) may be less effective than relationship cultivation. Market Legibility in APAC may require building relationships with the right gatekeepers rather than building public visibility.",
            "Modesty & Self-Promotion: In APAC cultures where self-promotion is discouraged, Market Legibility must be achieved through indirect signals — peer endorsements, client testimonials, and third-party validation — rather than direct self-promotion.",
            "Digital vs. Offline Legibility: APAC markets vary in their digital professional presence. In China, WeChat and Douyin may be more important than LinkedIn; in Japan, offline introductions may matter more than online presence. Market Legibility must be calibrated to the specific market's professional discovery channels."
        ]
    },

    "Identity Consistency": {
        "id": "D3",
        "construct": "Professional Brand Legibility",
        "description": [
            "Identity Consistency measures the degree to which a professional's brand signals are aligned across all touchpoints — ensuring that every interaction, every piece of content, every visual signal reinforces the same professional identity. In brand theory, inconsistency is the single largest destroyer of brand equity. A brand that sends mixed signals — senior in some contexts, junior in others; technical in some contexts, strategic in others; different in person than on paper — is a brand the market cannot trust because it cannot predict what it will get.",
            "At the PRISM level, Identity Consistency is measured across multiple dimensions of professional signalling: visual identity (appearance, design, aesthetics), verbal identity (how you speak, write, and communicate), behavioural identity (how you act in professional contexts), and digital identity (your online presence across platforms). Each dimension must be internally consistent AND consistent with the others.",
            "This dimension is often where professionals lose the most brand equity — not because their brand is unclear or their market legibility is poor, but because their signals are inconsistent across contexts, creating confusion that undermines both clarity and legibility."
        ],
        "sub_dim_interpretation": {
            "Visual consistency": "Appearance, design choices, and visual signals are consistent across contexts — from in-person meetings to digital profiles to written documents. Visual inconsistency (different dress codes, different photo styles, different design aesthetics) undermines professional credibility.",
            "Verbal consistency": "How you speak, write, and communicate is consistent across contexts — from emails to presentations to social media to interviews. Verbal inconsistency (formal in writing but casual in speech; authoritative in some contexts but deferential in others) creates confusion about your actual position and authority.",
            "Behavioural consistency": "How you act is consistent with your brand claims — if you claim to be strategic, your behaviour should reflect strategic thinking; if you claim to be innovative, your behaviour should demonstrate innovation. The gap between brand claims and actual behaviour is the identity consistency gap.",
            "Digital consistency": "Your digital presence across all platforms tells the same story — LinkedIn, company website, social media, publications all reinforce the same professional identity.",
            "Contextual adaptability": "While consistency is important, identity must also be appropriately adapted to different contexts — without becoming inconsistent. The challenge is adaptability without contradiction."
        },
        "band_narratives": {
            "Strong (≥70%)": "This candidate demonstrates high identity consistency. Their professional brand signals are aligned across all touchpoints — visual, verbal, behavioural, and digital. When the market encounters them in different contexts, the signals reinforce rather than contradict each other. In practice, this means: their LinkedIn profile tells the same story as their conversation; their appearance is consistent with their brand positioning; their written work reinforces their verbal communication; and their behaviour in different professional contexts is recognisably the same professional. The risk at this level is brand rigidity — such strong consistency that the professional cannot adapt to new contexts or evolve their brand without appearing to have a credibility gap.",
            "Developing (50-69%)": "This candidate shows moderate identity consistency. Their brand signals are mostly aligned but with identifiable inconsistencies that create market confusion. They may be strong in one context (e.g., LinkedIn) but inconsistent in others (e.g., in-person meetings); their verbal brand may not match their behavioural brand; their digital presence may not match their written communication. In practice, the market can read them — but the reading is sometimes inconsistent, creating uncertainty about what to expect. The development priority is identifying and resolving the specific inconsistencies that create the most market confusion.",
            "Gap (<50%)": "This candidate shows significant identity inconsistencies that undermine their professional brand. Different contexts present what appears to be different professionals — the person on LinkedIn is not the person in the meeting; the written brand doesn't match the verbal brand; the claimed identity doesn't match the demonstrated behaviour. In practice, this creates a trust deficit: the market cannot predict what it will get, so it defaults to caution. For professionals who rely on market trust — client-facing roles, leadership positions, board appointments — identity consistency is foundational."
        },
        "overuse_risks": "Identity Consistency overused becomes identity rigidity: a professional who cannot adapt their signals to different contexts without appearing inauthentic or confused. The hyper-consistent professional risks becoming unable to grow beyond their established brand — every evolution looks like a contradiction, every adaptation looks like inconsistency. In rapidly changing markets, adaptive identity that evolves with the market is more valuable than consistent identity that is stuck in the past.",
        "cross_dynamics": [
            {"dim": "Brand Clarity", "interaction": "Brand Clarity defines the identity; Identity Consistency maintains it. Without clarity, consistency is maintaining something undefined; without consistency, clarity is destroyed by mixed signals.", "risk": "high"},
            {"dim": "Market Legibility", "interaction": "Market Legibility depends on consistent signals. Inconsistent identity makes the market's reading of you unreliable — the market can see you sometimes but not consistently.", "risk": "medium"},
            {"dim": "Narrative Power", "interaction": "Narrative Power requires consistent identity to be credible. A powerful narrative delivered inconsistently loses its power. A consistent identity delivered without narrative power is boring but at least reliable.", "risk": "medium"},
            {"dim": "Visibility Level", "interaction": "Visibility amplifies identity consistency — more visibility means more signals for the market to compare. If those signals are consistent, visibility builds trust; if inconsistent, visibility exposes inconsistency.", "risk": "medium"}
        ],
        "coaching_prompts": [
            "Ask 5 people who know you in different contexts: 'Describe me as a professional.' Are their descriptions consistent? What does the inconsistency tell you?",
            "Compare your LinkedIn profile to your actual behaviour in your last 5 professional interactions. Do they tell the same story? Where do they diverge?",
            "If someone followed you on LinkedIn, read your articles, attended your presentation, and then met you in person — would they feel like they met the same person? What would surprise them?",
            "What is the most common inconsistency in your professional signals — visual, verbal, behavioural, or digital? Which one is easiest to fix? Which one is hardest?",
            "How has your professional identity evolved over the last 3 years? Is the evolution visible and coherent to the market — or does it look like a series of disconnected changes?"
        ],
        "apac_calibration": [
            "Context Switching: In APAC markets, professionals often operate across multiple cultural contexts (Japanese, Chinese, Western business norms) simultaneously. Identity Consistency in these contexts requires cultural fluency — the ability to adapt signals appropriately to each context without appearing to be a different person in each one.",
            "Hierarchy & Role Consistency: In hierarchical APAC cultures, professionals may present different identity signals to seniors vs. peers vs. juniors — deference upward, authority downward. This can create identity inconsistency that is culturally appropriate but professionally confusing.",
            "Digital vs. Offline: APAC professionals may maintain very different identities online vs. offline — especially in markets where online platforms require a public-facing persona while offline culture values modesty and anonymity. Managing this duality requires particular care."
        ]
    },

    "Narrative Power": {
        "id": "D4",
        "construct": "Professional Brand Legibility",
        "description": [
            "Narrative Power measures a professional's ability to tell a compelling, memorable, and strategically useful story about their career, capabilities, and value proposition. In executive markets, narrative power is often the single largest differentiator between professionals of similar capability — the professional who can tell a compelling story about their career gets remembered, recommended, and selected; the professional who cannot gets forgotten. Narrative Power is not about storytelling for its own sake — it is about strategic communication that advances professional objectives.",
            "At the PRISM level, Narrative Power is measured as the ability to construct and deliver narratives that are: authentic (grounded in real experience), compelling (interesting enough to be memorable), strategic (serving a career objective), and adaptable (usable across different contexts — interviews, pitches, conversations, presentations).",
            "This dimension captures one of the most under-invested and highest-leverage aspects of professional brand. Many executives with strong technical capabilities are held back not by capability gaps but by narrative gaps — their inability to communicate their value in a way that creates market demand."
        ],
        "sub_dim_interpretation": {
            "Career narrative construction": "The ability to create a coherent career story that connects past experience, current capability, and future direction. This is the master narrative — the story that makes sense of everything else.",
            "Value articulation": "The ability to translate professional experience into value language that resonates with audiences — not 'I managed 200 people' but 'I led a transformation that increased revenue by 30%.'",
            "Context adaptation": "The ability to adapt your narrative to different contexts without losing its core truth. The elevator pitch, the interview story, the conference presentation, the client pitch — each needs a different version of the same narrative.",
            "Memorability engineering": "The ability to include specific, vivid details that make your narrative memorable — not generic statements that sound like every other executive's story.",
            "Audience resonance": "The ability to ensure your narrative resonates with the specific audience you're addressing — not telling the same story to a recruiter as you would to a client, a board, or a peer."
        },
        "band_narratives": {
            "Strong (≥70%)": "This candidate demonstrates mature narrative power. They can construct and deliver compelling career narratives that are authentic, memorable, and strategically useful. In practice, this means: their career story is coherent and interesting; they can articulate their value in terms that resonate with different audiences; they are memorable in professional contexts because their narrative creates a specific, vivid impression; and their narrative serves their career objectives — opening doors, creating interest, and advancing their professional agenda. The risk at this level is narrative over-substance: the professional whose narrative power exceeds their actual capability development, creating a market perception that will eventually collapse when the substance fails to match the story.",
            "Developing (50-69%)": "This candidate shows moderate narrative power. They can tell their career story but it may lack specificity, memorability, or strategic focus. In practice, their narrative is functional but not compelling — people understand what they do but don't remember it after the conversation ends; they can articulate their capabilities but not in value language that resonates; they use the same story for every audience rather than adapting their narrative to the specific listener. The development priority is narrative investment: deliberately constructing a compelling career narrative and practising its delivery across multiple contexts.",
            "Gap (<50%)": "This candidate shows significant narrative power gaps. They cannot tell a compelling story about their career, value, or capabilities. In practice, this manifests as: inability to articulate what makes their career interesting; conversations that describe role rather than contribution; lack of memorable detail that would make them stand out; and inability to adapt their professional communication to different audiences. In executive markets where narrative power is often the decisive factor in selection, this gap is often the single most fixable and highest-leverage development opportunity available."
        },
        "overuse_risks": "Narrative Power overused becomes narrative manipulation: the professional whose storytelling ability exceeds their actual capability, creating a market perception that will eventually collapse. The over-narrative professional can talk their way into opportunities they cannot deliver on — creating a gap between promise and performance that eventually destroys credibility. In APAC markets where trust is relationship-based and long-term, this pattern is particularly destructive.",
        "cross_dynamics": [
            {"dim": "Brand Clarity", "interaction": "Brand Clarity provides the content; Narrative Power provides the delivery. Without clear brand, narrative has nothing to communicate; without narrative power, clear brand remains invisible.", "risk": "high"},
            {"dim": "Market Legibility", "interaction": "Narrative Power makes market legibility compelling — the market can not only read you but remember you. Without narrative, legibility is informational but not memorable.", "risk": "medium"},
            {"dim": "Identity Consistency", "interaction": "Narrative Power requires Identity Consistency for credibility. A compelling narrative that contradicts your other signals is not powerful — it is suspicious. Consistency makes narrative credible.", "risk": "high"},
            {"dim": "Visibility Level", "interaction": "Narrative Power and Visibility Level together create market demand. Narrative without visibility is a story told to no one; visibility without narrative is presence without substance.", "risk": "medium"}
        ],
        "coaching_prompts": [
            "Tell me your career story in 2 minutes. Is it compelling? Is it specific? Does it make me want to learn more? Or does it sound like every other executive's story?",
            "How do you introduce yourself in a networking context? What makes your introduction memorable? If you can't remember your own introduction, what will the other person remember?",
            "What is the most compelling story you can tell about your professional impact? Can you tell it in 30 seconds? In 2 minutes? In 10 minutes? Each serves a different purpose.",
            "Who is the best storyteller in your professional network? What makes their storytelling effective? What can you learn from their approach?",
            "Tell me the same professional story for three different audiences: a recruiter, a potential client, and a peer. Are they different stories? Do they serve different objectives?"
        ],
        "apac_calibration": [
            "Modesty & Narrative: In many APAC cultures, self-promotional storytelling is culturally inappropriate. Professionals must find culturally appropriate narrative forms — often through third-party validation, team narratives, and client testimonials rather than direct self-promotion.",
            "Relationship vs. Narrative Markets: In relationship-based APAC markets, personal narrative may be less important than relational credibility — 'who vouches for you' matters more than 'how well you tell your story.' Narrative Power in these contexts must be expressed through relationship capital rather than public storytelling.",
            "Narrative Forms: APAC markets may respond to different narrative forms — the Chinese business biography, the Japanese professional history, the Southeast Asian relational introduction. Understanding the culturally preferred narrative form is essential for effective Narrative Power in APAC."
        ]
    },

    "Visibility Level": {
        "id": "D5",
        "construct": "Professional Brand Legibility",
        "description": [
            "Visibility Level measures how visible a professional is to the market — the degree to which they are known, recognised, and accessible to the market contacts, opportunities, and audiences that matter. In executive markets, visibility is often the binding constraint: many excellent professionals are held back not by capability gaps but by visibility gaps — they are simply not known to the people who would create opportunity for them.",
            "At the PRISM level, Visibility Level is measured across multiple dimensions: network visibility (how many relevant market contacts know you), platform visibility (your presence on relevant professional platforms), content visibility (whether your expertise is visible through published work, speaking, and thought leadership), and referral visibility (whether you are known through recommendation and referral).",
            "This dimension is often the most actionable development opportunity — visibility can be increased through deliberate investment without requiring fundamental changes in capability, brand, or identity. For many executives, the path to greater career opportunity runs through increased visibility more than any other dimension."
        ],
        "sub_dim_interpretation": {
            "Network visibility": "How many relevant market contacts know you — not just your existing network but the expanded network that would create new opportunities. Network visibility is about breadth and depth of relevant professional recognition.",
            "Platform visibility": "Your presence on the platforms that matter to your market — LinkedIn, industry publications, conference stages, professional associations. Platform visibility is about where the market looks for professionals.",
            "Content visibility": "Whether your expertise is visible through published work, presentations, social media content, and thought leadership. Content visibility creates a searchable, shareable trail of your professional value.",
            "Referral visibility": "Whether you are known through recommendation and referral — the most powerful form of visibility in many markets, especially APAC relationship-based markets. Referral visibility depends on having satisfied contacts who actively recommend you.",
            "Strategic visibility": "Whether your visibility is directed toward the specific audiences and opportunities that matter — not just visibility for visibility's sake, but visibility strategically deployed to create the career outcomes you seek."
        },
        "band_narratives": {
            "Strong (≥70%)": "This candidate is highly visible to the relevant market. They are known, recognised, and accessible to market contacts who would create opportunity for them. In practice, this means: relevant opportunities find them through multiple channels (network, platform, content, referral); they are recognised in their professional domain; and their visibility serves their career objectives — they are visible in the right places to the right audiences. The risk at this level is visibility maintenance cost: maintaining high visibility requires ongoing investment of time, energy, and resources. The development priority is ensuring visibility investment is strategic and efficient — focused on the highest-value visibility opportunities rather than scattered across all possible platforms.",
            "Developing (50-69%)": "This candidate shows moderate visibility. They are known in some contexts but not others — visible to their existing network but not to the extended network that would create new opportunities; present on some platforms but not all relevant ones; producing some content but not consistently. In practice, they receive some opportunities but miss many that should reach them; they are recognised by some audiences but unknown to others; and their visibility is inconsistent rather than strategic. The development priority is systematic visibility investment: identifying the specific audiences that matter and building visibility across the channels they use.",
            "Gap (<50%)": "This candidate is largely invisible to the market. Even if their capabilities are excellent, the market does not know they exist — they are not on relevant platforms, not publishing content, not speaking at relevant events, and not being recommended by network contacts. In practice, this means: opportunities pass them by because the market doesn't know they exist; they must create every opportunity through active search because no opportunities come to them; and their professional growth is limited to what they can access through their current, limited network. For professionals in markets where visibility is a prerequisite for opportunity advancement — consulting, board positions, client-facing roles, leadership roles — this gap is existential."
        },
        "overuse_risks": "Visibility Level overused becomes visibility without substance: the professional whose visibility exceeds their actual capability, creating a market perception that will eventually collapse when expectations are not met. The over-visible professional becomes known for being known — present everywhere, contributing little, and eventually being seen as a brand without substance. In APAC markets where trust is built on demonstrated capability rather than visibility, this pattern is particularly destructive.",
        "cross_dynamics": [
            {"dim": "Brand Clarity", "interaction": "Brand Clarity provides the message; Visibility Level provides the distribution. Clear brand without visibility is a message nobody hears; visibility without clear brand is noise without content.", "risk": "high"},
            {"dim": "Market Legibility", "interaction": "Visibility Level provides the signal strength; Market Legibility provides the signal clarity. Both are needed — strong signals without clarity are loud noise; clear signals without strength are silent.", "risk": "medium"},
            {"dim": "Identity Consistency", "interaction": "Visibility amplifies identity consistency — or inconsistency. More visibility means more signals for the market to compare. Consistent identity under visibility builds trust; inconsistent identity under visibility exposes contradiction.", "risk": "medium"},
            {"dim": "Narrative Power", "interaction": "Narrative Power makes visibility memorable. Visible professionals without narrative power are seen but not remembered; professionals with narrative power but low visibility are memorable to the few who see them.", "risk": "medium"}
        ],
        "coaching_prompts": [
            "Who are the 20 most important people in your market — the ones who could create opportunity for you? How many of them know you? How could you increase that number?",
            "What professional platforms are relevant to your market? How many of them have you invested in? When did you last update your presence on each?",
            "What content have you published in the last year? Articles, presentations, social media posts, conference talks? How does your content output compare to peers who have the career trajectory you want?",
            "How many people would actively recommend you if asked? Who are they? What have you done to earn their advocacy — and what could you do to earn more?",
            "Is your visibility strategic? Are you visible in the right places to the right audiences? Or are you just visible everywhere to everyone? What would strategic visibility look like for you?"
        ],
        "apac_calibration": [
            "Relationship-Based Visibility: In APAC relationship-based markets, visibility is often achieved through relationship cultivation rather than public platform building. The most effective visibility strategy in APAC may be investing in the relationships that create referral visibility rather than building public content visibility.",
            "Cultural Visibility Norms: In APAC cultures where modesty is valued, public visibility may require cultural navigation — building visibility through third-party endorsement, team success, and organisational affiliation rather than individual promotion.",
            "Platform Diversity: APAC professional visibility platforms vary by market — WeChat and Douyin in China, LINE in Thailand, KakaoTalk in Korea. Visibility investment must be deployed on the platforms that matter in each specific market, not just the global platforms."
        ]
    }
}

def get_dimension_content(dim_name, score_pct):
    dim_data = PRISM_DIMENSIONS.get(dim_name)
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
    for name in PRISM_DIMENSIONS:
        c = get_dimension_content(name, 55)
        total_words = sum(len(p.split()) for p in c['description_paragraphs'])
        total_words += len(c['band_narrative'].split())
        total_words += len(c['overuse_risks'].split())
        total_words += sum(len(d['interaction'].split()) for d in c['cross_dynamics'])
        total_words += sum(len(p.split()) for p in c['coaching_prompts'])
        total_words += sum(len(p.split()) for p in c['apac_calibration'])
        print(f'{c["id"]} {name}: {total_words} words | {len(c["coaching_prompts"])} prompts | {len(c["cross_dynamics"])} dynamics | {len(c["apac_calibration"])} apac')

