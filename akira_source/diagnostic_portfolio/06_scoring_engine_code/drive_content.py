"""
DRIVE Dimension Content Library — Gold Standard Narratives
Motivation Architecture & Engagement Risk Assessment
"""

DRIVE_DIMENSIONS = {
    "Intrinsic Motivation": {
    "id": "D1",
    "construct": "DRIVE - Intrinsic Motivation",
    "description": [
        "Intrinsic Motivation represents the core drive derived from the work itself, encompassing autonomy, mastery, purpose, and intellectual challenge. It is a self-sustaining form of motivation that fuels engagement and innovation without reliance on external rewards or pressures. In APAC contexts, where hierarchical structures and collective norms often dominate, fostering intrinsic motivation requires deliberate design of roles that offer meaningful autonomy and alignment with personal values.",
        "This dimension is a critical predictor of retention risk, as employees with high intrinsic motivation are less likely to leave for purely financial incentives. They also act as engagement contagion agents, positively influencing team morale and productivity. However, over-reliance on intrinsic drive without adequate support can lead to burnout, particularly in high-pressure APAC markets where long hours are normalized.",
        "Organizations must balance intrinsic motivation with other dimensions like Extrinsic Motivation and Values Alignment to create a sustainable motivation architecture. Leaders in APAC should focus on providing clear purpose, opportunities for skill development, and intellectual stimulation to harness this drive effectively. When properly nurtured, intrinsic motivation becomes a powerful lever for leadership sustainability and long-term organizational resilience."
    ],
    "sub_dim_interpretation": {
        "sub1": "Autonomy reflects the degree of control an individual feels over their work methods, schedule, and decisions. High autonomy indicates trust and empowerment, while low autonomy may signal micromanagement or rigid processes.",
        "sub2": "Mastery captures the drive to improve skills and achieve competence. It is fueled by opportunities for learning, feedback, and progressive challenges. Low mastery scores suggest stagnation or lack of development pathways.",
        "sub3": "Purpose measures the alignment between daily work and a larger meaningful goal. High purpose correlates with strong organizational commitment, especially in APAC cultures where collective impact is valued.",
        "sub4": "Intellectual Challenge assesses the stimulation from complex problem-solving and creative thinking. Low scores may indicate boredom or underutilization of talent, increasing turnover risk.",
        "sub5": "Self-Sustaining Energy evaluates the ability to maintain motivation without external prompts. High scores reflect resilience and internal drive, while low scores may indicate dependency on rewards or recognition."
    },
    "band_narratives": {
        "Strong (>=70%)": "Individuals in this band demonstrate robust intrinsic motivation, deriving significant satisfaction from autonomy, mastery, purpose, and challenge. They are likely to be high performers and positive influencers within teams, driving engagement contagion. In APAC settings, these employees often serve as role models for self-directed learning and innovation, though they may require careful management to prevent overextension.",
        "Developing (50-69%)": "These individuals show moderate intrinsic motivation but may rely on external factors like recognition or structure to sustain engagement. They benefit from targeted interventions such as skill-building programs, clearer purpose articulation, or increased autonomy in specific areas. In APAC contexts, cultural norms around hierarchy may suppress their intrinsic drive, requiring leaders to actively create space for initiative.",
        "Gap (<50%)": "Low intrinsic motivation signals a critical risk of disengagement and turnover. These individuals may feel disconnected from their work's purpose, lack autonomy, or face unchallenging tasks. Immediate action is needed, including role redesign, coaching on personal values alignment, or addressing systemic barriers. In APAC, this gap often correlates with high burnout or misalignment between individual aspirations and organizational expectations."
    },
    "overuse_risks": "Over-reliance on intrinsic motivation without adequate structural support can lead to burnout, especially in high-demand APAC environments where employees may push themselves excessively. It may also create blind spots where individuals neglect collaboration or external feedback, assuming their internal drive is sufficient. Leaders must monitor for signs of exhaustion and ensure that intrinsic motivation is complemented by appropriate resources, recognition, and work-life boundaries to sustain long-term performance.",
    "cross_dynamics": [
        {
            "dim": "Extrinsic Motivation",
            "interaction": "High intrinsic motivation can be undermined by excessive extrinsic rewards, which may shift focus from purpose to compensation. Conversely, low intrinsic motivation may be temporarily compensated by strong extrinsic incentives, but this is unsustainable. In APAC, where bonus culture is prevalent, balancing both is critical.",
            "risk": "medium"
        },
        {
            "dim": "Values Alignment",
            "interaction": "Strong intrinsic motivation amplifies when personal values align with organizational mission. Misalignment creates cognitive dissonance, reducing engagement. In APAC, collectivist values often enhance purpose-driven work, but individualistic intrinsic drives may clash with team expectations.",
            "risk": "high"
        },
        {
            "dim": "Confidence and Self-Efficacy",
            "interaction": "High self-efficacy supports intrinsic motivation by enabling individuals to tackle challenges. Low confidence can suppress mastery and autonomy drives. In APAC, where modesty is valued, leaders must actively build confidence to unlock intrinsic potential.",
            "risk": "medium"
        },
        {
            "dim": "Growth Orientation",
            "interaction": "Growth orientation fuels intrinsic motivation through continuous learning. Stagnation in growth opportunities directly erodes mastery and challenge drives. In fast-paced APAC markets, lack of development is a top retention risk.",
            "risk": "high"
        }
    ],
    "coaching_prompts": [
        "What aspects of your current role give you the most energy and a sense of accomplishment?",
        "How much control do you feel you have over how you do your work? What would you change?",
        "Can you describe a time when you felt truly challenged and engaged? What made that experience different?",
        "How does your daily work connect to a larger purpose or impact?",
        "What skills are you most motivated to develop right now, and what support do you need?",
        "When you feel your motivation dip, what typically causes it, and how do you recover?"
    ],
    "apac_calibration": [
        "In APAC, intrinsic motivation is often moderated by cultural expectations of hierarchy and group harmony; autonomy may need to be framed as 'empowered contribution' rather than independence.",
        "Purpose alignment in APAC should explicitly reference team, organizational, and societal impact, as collectivist values amplify meaning from collective success.",
        "Mastery drives in APAC are strongly tied to career progression and job security; development opportunities must be visibly linked to advancement pathways.",
        "Intellectual challenge in APAC may be undervalued in favor of stability; leaders should proactively create stretch assignments to prevent quiet quitting."
    ]
},
    "Extrinsic Motivation": {
    "id": "D2",
    "construct": "DRIVE - Extrinsic Motivation",
    "description": [
        "Extrinsic motivation refers to the drive to perform based on external rewards such as compensation, status, title, and recognition. In an organisational context, this dimension captures how much an individual's engagement is fueled by tangible outcomes and social validation. While necessary for baseline performance and retention, extrinsic motivation alone is insufficient for sustained high performance or innovation. Over-reliance on external rewards can lead to a transactional mindset, where effort is contingent on immediate returns.",
        "In APAC workplaces, where hierarchical structures and public recognition often carry significant weight, extrinsic motivators like promotions and bonuses are particularly salient. However, cultural nuances such as collectivism in many APAC societies mean that group recognition may be valued over individual accolades. Leaders must calibrate their reward systems to align with local expectations, balancing individual incentives with team-based acknowledgements. Failure to do so can create misalignment between organisational goals and employee values.",
        "This dimension is a critical component of the DRIVE architecture, as it predicts retention risk and engagement contagion. When extrinsic motivation is high but other dimensions like intrinsic motivation or values alignment are low, employees may stay for the wrong reasons, becoming disengaged or leaving when a better offer appears. A healthy motivational profile integrates extrinsic rewards with deeper drivers, ensuring sustainable engagement and leadership sustainability."
    ],
    "sub_dim_interpretation": {
        "sub1": "Compensation Sensitivity: Reflects how much an individual's effort is tied to financial rewards. High scores indicate a strong preference for pay-for-performance models, while low scores suggest salary is a hygiene factor rather than a primary driver.",
        "sub2": "Status and Title Orientation: Measures the importance of hierarchical position and formal recognition. In APAC contexts, this can be particularly strong due to respect for seniority and organisational rank.",
        "sub3": "Recognition Need: Captures the desire for public acknowledgment and praise. Employees with high scores thrive on visibility, while those with low scores may prefer private or team-based recognition.",
        "sub4": "Reward Expectancy: Assesses the belief that effort will lead to desired external outcomes. Low scores may indicate cynicism about reward systems or perceived inequity in distribution.",
        "sub5": "Competitive Drive: Reflects motivation from outperforming peers or meeting external benchmarks. High scores can drive performance but may also create unhealthy rivalry if unmanaged."
    },
    "band_narratives": {
        "Strong (>=70%)": "Individuals in this band are highly responsive to external rewards and often seek visible markers of success. They are likely to be motivated by clear performance metrics, bonuses, and promotion opportunities. However, they may be at risk of burnout if rewards are not consistently delivered, and their engagement can fluctuate with market conditions. In APAC settings, they may excel in competitive industries but require careful management to prevent transactional relationships with the organisation.",
        "Developing (50-69%)": "These individuals value external rewards but are not solely driven by them. They appreciate recognition and fair compensation but also seek meaningful work and alignment with personal values. This balanced profile is often ideal for long-term retention, as they are less likely to leave for a marginal pay increase. In APAC contexts, they may respond well to hybrid reward systems that combine individual bonuses with team incentives.",
        "Gap (<50%)": "Low scores indicate that external rewards have limited motivational pull. These individuals may be driven more by intrinsic factors or values alignment, and may even view excessive focus on rewards as distasteful. While they can be highly engaged if their deeper needs are met, they are at risk of disengagement if the organisation relies heavily on extrinsic motivators. In APAC cultures, they may be perceived as less ambitious, but can be valuable for roles requiring long-term commitment and ethical grounding."
    },
    "overuse_risks": "Over-reliance on extrinsic motivation can lead to a culture of entitlement, where employees expect rewards for minimal effort. It may also crowd out intrinsic motivation, reducing creativity and ownership. In APAC organisations, excessive focus on status and title can create rigid hierarchies that stifle collaboration and innovation. Leaders must guard against reward inflation, where escalating bonuses or titles become expected rather than earned, eroding their motivational impact over time.",
    "cross_dynamics": [
        {
            "dim": "Intrinsic Motivation",
            "interaction": "When extrinsic motivation is high but intrinsic motivation is low, employees may perform well under clear incentives but lack passion for the work itself. This can lead to high turnover when external rewards are not competitive. In APAC, this dynamic is common in sales-driven roles where commission structures dominate.",
            "risk": "high"
        },
        {
            "dim": "Values Alignment",
            "interaction": "Strong extrinsic motivation combined with low values alignment can result in ethical blind spots, as individuals prioritise rewards over organisational principles. In APAC contexts, where guanxi and relationships matter, this can damage trust and long-term reputation.",
            "risk": "high"
        },
        {
            "dim": "Confidence and Self-Efficacy",
            "interaction": "High extrinsic motivation with low self-efficacy may lead to anxiety about meeting performance targets, especially in competitive APAC markets. Conversely, high self-efficacy can amplify the positive effects of extrinsic rewards by reinforcing a sense of capability.",
            "risk": "medium"
        },
        {
            "dim": "Growth Orientation",
            "interaction": "Extrinsic motivation can complement growth orientation when rewards are tied to learning and development. However, if rewards are only linked to outcomes, it may discourage risk-taking and experimentation. In APAC, this is particularly relevant in innovation-driven sectors.",
            "risk": "medium"
        }
    ],
    "coaching_prompts": [
        "What external rewards or recognition have most influenced your career decisions in the past?",
        "How do you feel when a colleague receives public recognition that you believe you deserved?",
        "In what ways does your current compensation package align with your sense of value and contribution?",
        "Can you describe a time when a promised reward did not materialise and how it affected your motivation?",
        "How important is your job title to your sense of professional identity, especially in the context of your local culture?",
        "What non-monetary forms of recognition would be most meaningful to you in your current role?"
    ],
    "apac_calibration": [
        "In high-power-distance cultures like Japan and Korea, status and title may be stronger motivators than in more egalitarian APAC societies like Australia or New Zealand.",
        "Collectivist cultures in Southeast Asia often respond better to team-based rewards and public recognition that highlights group achievement rather than individual performance.",
        "In China, the concept of 'face' (mianzi) means that public recognition must be carefully managed to avoid causing embarrassment or envy among peers.",
        "Economic volatility in some APAC markets can increase compensation sensitivity, making extrinsic motivation a more dominant driver during uncertain times."
    ]
},
    "Values Alignment": {
    "id": "D3",
    "construct": "DRIVE - Values Alignment",
    "description": [
        "Values Alignment measures the congruence between an individual's personal values and the values embedded in their organisation, role demands, and daily work content. When personal values align with organisational values, employees experience a sense of purpose and authenticity that fuels sustained engagement. Misalignment, however, creates a chronic psychological friction that erodes motivation over time, often manifesting as quiet quitting or active disengagement. In APAC contexts, where collectivist values and hierarchical respect often intersect with modern organisational cultures, this dimension is particularly sensitive to perceived hypocrisy between stated values and actual practices.",
        "This dimension is distinct from Intrinsic Motivation, which focuses on enjoyment of the work itself, and Extrinsic Motivation, which concerns external rewards. Instead, Values Alignment addresses the deeper question of whether the work feels meaningful and consistent with one's ethical and personal standards. For example, an employee who values collaboration may struggle in a highly competitive sales environment, even if the work is intrinsically interesting. In APAC organisations, where family and community values often influence career decisions, misalignment can lead to significant retention risk as employees seek environments that honour their broader life priorities.",
        "Organisations with strong Values Alignment across their workforce benefit from higher engagement contagion, where purpose-driven behaviour becomes the norm. Conversely, pockets of misalignment can spread cynicism and reduce team cohesion. Leadership sustainability is directly impacted, as leaders who model value-congruent behaviour inspire trust and loyalty. In APAC, where long-term relationships and loyalty are prized, values misalignment is a leading predictor of voluntary turnover, especially among high-potential talent who have the mobility to seek better-aligned opportunities."
    ],
    "sub_dim_interpretation": {
        "sub1": "Personal-Organisational Value Fit: The degree to which an individual's core values (e.g., integrity, innovation, community) match the stated and enacted values of the organisation. High fit reduces cognitive dissonance and enhances commitment.",
        "sub2": "Role-Value Congruence: Whether the specific demands and expectations of the role allow the individual to express their values. For example, a role requiring aggressive sales tactics may conflict with a value of service orientation.",
        "sub3": "Work Content Meaningfulness: The extent to which the day-to-day tasks and outputs of the job feel aligned with what the individual considers important and worthwhile. This goes beyond task enjoyment to a sense of contribution.",
        "sub4": "Value Expression Autonomy: The freedom to act in accordance with one's values within the organisational context, including the ability to voice value-based concerns without fear of reprisal.",
        "sub5": "Perceived Organisational Integrity: The belief that the organisation consistently acts on its stated values, especially in decision-making, resource allocation, and treatment of employees. In APAC, this includes consistency between local practices and global corporate values."
    },
    "band_narratives": {
        "Strong (>=70%)": "Individuals in this band experience a deep sense of purpose and authenticity in their work. They feel that their personal values are not only respected but actively reinforced by their organisation's culture and leadership. This alignment fuels high discretionary effort, resilience during change, and a strong sense of belonging. In APAC contexts, these employees often become cultural ambassadors who attract like-minded talent and reinforce positive engagement contagion.",
        "Developing (50-69%)": "These individuals experience partial alignment but with notable friction points. They may find some aspects of their role or organisation value-congruent while others create tension, leading to intermittent engagement. They are at risk of disengagement if misalignment increases or if they encounter value-compromising situations. Coaching should focus on identifying specific areas of misalignment and exploring strategies to increase congruence, such as role crafting or seeking value-aligned projects within the organisation.",
        "Gap (<50%)": "Employees in this band experience chronic value dissonance, which often manifests as cynicism, reduced effort, or active withdrawal. They may feel that their personal integrity is compromised by organisational demands, leading to high retention risk and potential negative engagement contagion. In APAC, where saving face and loyalty are important, these individuals may stay longer than they should, but their disengagement silently erodes team morale. Immediate intervention is required, including honest conversations about value gaps and exploration of internal or external alternatives."
    },
    "overuse_risks": "Over-reliance on Values Alignment as the sole driver of engagement can lead to a homogeneous culture that stifles diversity of thought. When organisations prioritise value congruence too rigidly, they may inadvertently exclude individuals with different but equally valid perspectives, reducing innovation. Additionally, employees with very high alignment may become overly identified with the organisation, leading to burnout when organisational values shift or when they are asked to compromise on secondary values. In APAC, overemphasis on alignment with hierarchical or collectivist values may suppress healthy dissent and critical feedback.",
    "cross_dynamics": [
        {
            "dim": "Intrinsic Motivation",
            "interaction": "High Values Alignment amplifies Intrinsic Motivation by adding a layer of meaning to enjoyable work. When both are strong, employees experience flow and purpose simultaneously. However, if Intrinsic Motivation is low, strong Values Alignment can sustain engagement through a sense of duty, though this may not be sustainable long-term.",
            "risk": "medium"
        },
        {
            "dim": "Extrinsic Motivation",
            "interaction": "Values Alignment can compensate for weak Extrinsic Motivation, especially in APAC where non-monetary recognition and status are valued. Conversely, high Extrinsic Motivation without alignment may lead to transactional engagement that is vulnerable to poaching. Misalignment can cause employees to reject extrinsic rewards that feel unethical.",
            "risk": "high"
        },
        {
            "dim": "Confidence and Self-Efficacy",
            "interaction": "Strong Values Alignment boosts Confidence by providing a clear ethical framework for decision-making. When employees feel their values are supported, they are more likely to take initiative. However, low self-efficacy can prevent individuals from acting on their values, leading to frustration even when alignment is high.",
            "risk": "low"
        },
        {
            "dim": "Growth Orientation",
            "interaction": "Values Alignment provides the 'why' for Growth Orientation, making learning and development feel purposeful. In APAC, where growth is often tied to organisational loyalty, misalignment can stifle growth as employees see little point in developing skills for a misaligned context. High alignment encourages proactive skill-building aligned with organisational needs.",
            "risk": "medium"
        }
    ],
    "coaching_prompts": [
        "What are the top three personal values that you feel are most important to you in a work context, and how well are they currently being met in your role?",
        "Can you describe a recent situation where you felt a conflict between your personal values and what was expected of you at work? How did you handle it?",
        "How would you describe the gap between the values your organisation publicly states and the values that actually drive decisions and behaviours here?",
        "In what ways could your current role be adjusted to better align with your core values, even if only partially?",
        "Think of a time when you felt completely aligned with your work. What conditions made that possible, and how can we recreate some of those conditions now?",
        "How do your values around family, community, or hierarchy (common in APAC) influence your career decisions, and are those values being respected in your current organisation?"
    ],
    "apac_calibration": [
        "In APAC, collectivist values such as group harmony, respect for authority, and family loyalty often take precedence over individualistic value expressions. Calibration must account for whether the organisation's values genuinely support these cultural priorities or merely pay lip service.",
        "Hierarchical cultures in many APAC markets mean that perceived organisational integrity is heavily influenced by the behaviour of senior leaders. Values misalignment at the top cascades down and is magnified, creating widespread disengagement.",
        "The concept of 'face' can mask values misalignment, as employees may not openly express value conflicts to avoid confrontation. Calibration should include indirect indicators such as absenteeism, reduced collaboration, or passive resistance.",
        "In rapidly modernising APAC economies, generational differences in values (e.g., traditional loyalty vs. entrepreneurial autonomy) create unique alignment challenges. Calibration must segment by age and career stage to avoid blanket assumptions."
    ]
},
    "Confidence and Self-Efficacy": {
    "id": "D4",
    "construct": "DRIVE - Confidence and Self-Efficacy",
    "description": [
        "Confidence and Self-Efficacy within the DRIVE framework measures an individual's belief in their own ability to successfully execute the tasks and responsibilities of their role. This dimension is critical for sustaining performance, as it directly influences how employees approach challenges, persist through setbacks, and take initiative. In an APAC context, where hierarchical structures and collective norms often shape workplace behaviour, calibrated self-belief is essential for navigating both individual accountability and team dynamics.",
        "Over-confidence can lead to underestimation of risks, poor planning, and resistance to feedback, potentially causing project failures or interpersonal friction. Conversely, under-confidence may result in missed opportunities, over-reliance on others, and reduced contribution in meetings, which can hinder career progression and team effectiveness. Organisations in APAC markets must be particularly attuned to cultural factors such as saving face and deference to authority, which can mask genuine self-efficacy levels.",
        "This dimension interacts closely with Intrinsic Motivation and Growth Orientation, as confidence fuels the willingness to take on stretch assignments and learn from failure. When balanced, high self-efficacy drives engagement and innovation; when misaligned, it becomes a retention risk or a source of engagement contagion. Leaders in APAC should foster environments where realistic self-assessment is encouraged through structured feedback and developmental opportunities."
    ],
    "sub_dim_interpretation": {
        "sub1": "Task-Specific Confidence: Belief in one's ability to perform specific job functions, such as meeting targets or mastering technical skills. Low scores here indicate a need for skill-building or clearer role expectations.",
        "sub2": "Resilience in Setbacks: The capacity to maintain confidence after failures or criticism. In APAC cultures, where public error can be stigmatised, this sub-dimension is crucial for psychological safety and learning.",
        "sub3": "Initiative and Proactivity: Willingness to take action without waiting for direction, reflecting self-trust. Overuse may appear as recklessness, while underuse suggests dependency on hierarchy.",
        "sub4": "Social Confidence: Comfort in expressing ideas, challenging norms, or leading teams, especially in cross-cultural settings. This is often moderated by collectivist values in APAC workplaces.",
        "sub5": "Calibrated Self-Awareness: Accuracy of self-assessment relative to actual performance. Misalignment here is a key indicator of over- or under-confidence risk."
    },
    "band_narratives": {
        "Strong (>=70%)": "Individuals in this band demonstrate robust and realistic self-efficacy, enabling them to tackle complex tasks and lead with assurance. They recover quickly from setbacks and are proactive in seeking growth opportunities, often serving as role models for engagement. However, in APAC contexts, they must remain vigilant against cultural tendencies toward over-assertion, which can be perceived as arrogance. Their confidence is a driver of team morale and innovation, but requires ongoing calibration through feedback.",
        "Developing (50-69%)": "These individuals show moderate self-belief, with areas of strength and vulnerability depending on the context. They may excel in familiar tasks but hesitate in novel or high-stakes situations, potentially missing leadership opportunities. In APAC organisations, they benefit from mentorship and structured challenges to build resilience. Their engagement risk is moderate, as they can be influenced by team dynamics and may need support to voice ideas confidently.",
        "Gap (<50%)": "Low confidence and self-efficacy significantly impair performance and engagement, leading to avoidance of challenges and high dependency on managers. These individuals are at high retention risk, especially in competitive APAC markets where self-promotion is often expected. They may experience impostor syndrome and require intensive coaching, skill-building, and a psychologically safe environment to rebuild belief. Without intervention, they can contribute to negative engagement contagion within teams."
    },
    "overuse_risks": "Over-confidence manifests as a tendency to take excessive risks, dismiss constructive feedback, and underestimate effort required for tasks, leading to project delays or failures. In APAC workplaces, this can clash with hierarchical respect and collaborative norms, causing team friction. Leaders with over-confidence may also fail to develop successors, creating leadership sustainability issues. The risk is heightened in high-growth environments where rapid decision-making is valued, but unchecked confidence can erode trust and increase turnover among team members who feel unheard.",
    "cross_dynamics": [
        {
            "dim": "Intrinsic Motivation",
            "interaction": "High confidence amplifies intrinsic motivation by reinforcing the joy of mastery and autonomy. Conversely, low confidence can dampen intrinsic drive, as individuals may avoid tasks they doubt they can succeed at. In APAC, where intrinsic motivation often stems from contribution to group goals, confidence in one's role within the team is critical.",
            "risk": "high"
        },
        {
            "dim": "Extrinsic Motivation",
            "interaction": "Confidence influences how extrinsic rewards are perceived: confident individuals may see bonuses or recognition as validation, while under-confident ones may feel pressure or unworthiness. Over-confidence can lead to entitlement, reducing the motivational impact of rewards. In APAC, where public recognition can be sensitive, misaligned confidence may cause discomfort.",
            "risk": "medium"
        },
        {
            "dim": "Values Alignment",
            "interaction": "When personal values align with organisational purpose, confidence is bolstered as actions feel meaningful. Misalignment can erode self-efficacy, especially if role demands conflict with core values. In APAC, values such as harmony and respect can moderate how confidence is expressed, requiring careful calibration.",
            "risk": "medium"
        },
        {
            "dim": "Growth Orientation",
            "interaction": "Growth orientation and confidence are mutually reinforcing: a growth mindset builds confidence through learning, while confidence enables embracing challenges. Low confidence stifles growth by avoiding feedback and new experiences. In APAC, where continuous improvement is often emphasised, this dynamic is key for talent development.",
            "risk": "high"
        }
    ],
    "coaching_prompts": [
        "Describe a recent situation where you felt unsure about your ability to succeed. What specific thoughts or beliefs contributed to that feeling?",
        "How do you typically respond when a colleague or manager offers you constructive criticism? Can you give an example?",
        "Think of a time you took initiative on a project. What gave you the confidence to act, and what was the outcome?",
        "In what areas of your role do you feel most and least confident? What factors do you think create that difference?",
        "How does your confidence level affect your willingness to speak up in meetings or share new ideas with your team?",
        "What would need to change for you to feel more assured in taking on stretch assignments or leadership opportunities?"
    ],
    "apac_calibration": [
        "In collectivist cultures, confidence may be expressed more subtly; low scores on social confidence may reflect cultural norms rather than actual self-efficacy.",
        "Hierarchical deference in many APAC organisations can suppress initiative and social confidence, requiring calibration against local leadership expectations.",
        "Saving face dynamics mean that over-confidence may be under-reported in self-assessments, while under-confidence may be masked by silence.",
        "Rapid economic growth in some APAC markets can inflate confidence due to external success, necessitating checks against actual performance data."
    ]
},
    "Growth Orientation": {
    "id": "D5",
    "construct": "DRIVE - Growth Orientation",
    "description": [
        "Growth Orientation measures the extent to which an individual actively pursues development, stretch, and learning opportunities. Leaders with high Growth Orientation create environments where teams embrace challenges and view setbacks as learning experiences. This dimension is critical for predicting an organisation's capacity to innovate and adapt in dynamic markets.",
        "In APAC contexts, where rapid economic transformation and digital disruption are prevalent, Growth Orientation becomes a key driver of talent retention and engagement. Employees are more likely to stay with organisations that invest in their development and provide clear pathways for advancement. A growth-oriented culture reduces engagement contagion by fostering resilience and continuous improvement.",
        "When Growth Orientation is low, organisations risk stagnation and increased turnover, particularly among high-potential employees. Leaders must model learning agility and create psychological safety for experimentation. This dimension directly influences leadership sustainability by ensuring that leaders can evolve with changing business demands."
    ],
    "sub_dim_interpretation": {
        "sub1": "Learning Agility: The speed and willingness to learn from experience and apply that learning to new situations. High scorers actively seek feedback and adapt quickly.",
        "sub2": "Stretch Goals: The tendency to set ambitious targets that push beyond current capabilities. This drives innovation but requires careful calibration to avoid burnout.",
        "sub3": "Feedback Seeking: The proactive pursuit of constructive input from others to improve performance. Essential for continuous development and building trust within teams.",
        "sub4": "Resilience in Learning: The ability to persist through challenges and setbacks in the learning process. Critical for maintaining momentum during organisational change.",
        "sub5": "Development Focus: The priority placed on personal and team growth over short-term results. Balances immediate performance with long-term capability building."
    },
    "band_narratives": {
        "Strong (>=70%)": "Leaders in this band actively create a culture of continuous learning and development. They set challenging goals, seek diverse feedback, and model resilience. Their teams demonstrate high engagement and adaptability, reducing retention risk. These leaders are well-positioned to drive transformation in APAC markets.",
        "Developing (50-69%)": "These leaders show potential for growth but may inconsistently prioritise development. They benefit from structured coaching to strengthen learning agility and goal-setting. With support, they can shift from a performance-focused to a growth-oriented mindset. Addressing gaps in feedback seeking can enhance team engagement.",
        "Gap (<50%)": "Leaders in this band may resist change or avoid stretch assignments, risking team stagnation. They often prioritise stability over learning, which can lead to disengagement among high-potential employees. Immediate intervention is needed to address underlying fears or skill deficits. Without change, retention and innovation will suffer."
    },
    "overuse_risks": "Excessive Growth Orientation can lead to burnout if stretch goals are not balanced with recovery. Leaders may push teams too hard, causing stress and turnover. In APAC cultures, where harmony and collective well-being are valued, overemphasis on growth can create friction. It is essential to pair growth with empathy and realistic pacing.",
    "cross_dynamics": [
        {
            "dim": "Intrinsic Motivation",
            "interaction": "High Growth Orientation amplifies intrinsic motivation by providing purpose and mastery opportunities. However, if intrinsic motivation is low, growth efforts may feel forced and unsustainable.",
            "risk": "medium"
        },
        {
            "dim": "Extrinsic Motivation",
            "interaction": "Growth Orientation can be undermined if extrinsic rewards (e.g., bonuses) are tied only to short-term results. Leaders may avoid stretch goals that risk immediate compensation.",
            "risk": "high"
        },
        {
            "dim": "Values Alignment",
            "interaction": "When personal values align with organisational growth priorities, Growth Orientation is naturally reinforced. Misalignment creates internal conflict and reduces engagement.",
            "risk": "high"
        },
        {
            "dim": "Confidence and Self-Efficacy",
            "interaction": "Strong self-efficacy supports Growth Orientation by enabling leaders to take risks. Low confidence can cause avoidance of learning opportunities, creating a self-fulfilling cycle.",
            "risk": "high"
        }
    ],
    "coaching_prompts": [
        "What recent stretch goal have you set for yourself or your team, and what did you learn from the process?",
        "How do you currently seek feedback, and what barriers prevent you from asking for more?",
        "Describe a time when a learning setback helped you grow. How did you maintain motivation?",
        "How do you balance pushing for growth with ensuring your team's well-being?",
        "What development opportunities are most valued by your team members in the current APAC context?",
        "How can you model learning agility in a way that resonates with your organisation's culture?"
    ],
    "apac_calibration": [
        "In high-power-distance cultures, Growth Orientation may require explicit permission from senior leaders to challenge norms.",
        "Collectivist values mean team-based development goals often outperform individual stretch targets.",
        "Rapidly growing APAC economies create urgency for growth, but also risk of burnout if not managed with cultural sensitivity.",
        "Local calibration should account for varying definitions of 'success' across markets (e.g., Singapore vs. India)."
    ]
},
}

def get_dimension_content(dim_name, score_pct):
    dim_data = DRIVE_DIMENSIONS.get(dim_name)
    if not dim_data: return None
    if score_pct >= 70: band_key = "Strong (>=70%)"
    elif score_pct >= 50: band_key = "Developing (50-69%)"
    else: band_key = "Gap (<50%)"
    return {
        "id": dim_data.get("id",""), "construct": dim_data.get("construct",""),
        "description_paragraphs": dim_data["description"],
        "sub_dim_interpretation": dim_data.get("sub_dim_interpretation", {}),
        "band_narrative": dim_data["band_narratives"].get(band_key, ""),
        "overuse_risks": dim_data.get("overuse_risks", ""),
        "cross_dynamics": dim_data.get("cross_dynamics", []),
        "coaching_prompts": dim_data.get("coaching_prompts", []),
        "apac_calibration": dim_data.get("apac_calibration", []),
        "score_pct": score_pct, "band": band_key.split(" ")[0]
    }
