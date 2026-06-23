// Phase 7.2: Seed Questions - 80 System Questions
// Pre-built question bank organized by competency

export interface SeedQuestion {
  question_text: string;
  competency: string;
  difficulty: number;
  expected_answer: string;
  follow_up_question: string;
  is_system: boolean;
}

// 12 competencies: technical, leadership, communication, problem_solving,
// teamwork, cultural_fit, strategic_thinking, adaptability,
// decision_making, customer_focus, innovation, execution

export const SEED_QUESTIONS: SeedQuestion[] = [
  // ═══════════════════════════════════════════════════════════════
  // TECHNICAL (7 questions)
  // ═══════════════════════════════════════════════════════════════
  {
    question_text: "Describe your experience with the technical stack relevant to this role. What technologies have you worked with most extensively?",
    competency: "technical",
    difficulty: 1,
    expected_answer: "Look for: depth of experience, breadth of technologies, ability to explain technical concepts clearly, recent and relevant experience.",
    follow_up_question: "What was the most challenging technical problem you solved with this stack?",
    is_system: true,
  },
  {
    question_text: "Walk me through how you would architect a scalable solution for a high-traffic application.",
    competency: "technical",
    difficulty: 3,
    expected_answer: "Look for: understanding of scalability principles, load balancing, caching strategies, database optimization, microservices awareness.",
    follow_up_question: "How would you handle failure scenarios and ensure system resilience?",
    is_system: true,
  },
  {
    question_text: "Tell me about a time you had to learn a new technology quickly to complete a project.",
    competency: "technical",
    difficulty: 2,
    expected_answer: "Look for: learning agility, resourcefulness, ability to apply new knowledge quickly, structured approach to learning.",
    follow_up_question: "What resources did you use and how long did it take to become proficient?",
    is_system: true,
  },
  {
    question_text: "How do you ensure code quality and maintainability in your projects?",
    competency: "technical",
    difficulty: 2,
    expected_answer: "Look for: testing practices, code reviews, documentation habits, adherence to standards, refactoring approach.",
    follow_up_question: "Can you give an example where poor code quality caused issues and how you addressed it?",
    is_system: true,
  },
  {
    question_text: "Describe your approach to debugging a complex production issue.",
    competency: "technical",
    difficulty: 2,
    expected_answer: "Look for: systematic approach, use of monitoring tools, log analysis, hypothesis testing, collaboration with team.",
    follow_up_question: "What was the root cause and how did you prevent similar issues?",
    is_system: true,
  },
  {
    question_text: "What's your experience with technical documentation? How do you approach it?",
    competency: "technical",
    difficulty: 1,
    expected_answer: "Look for: appreciation for documentation, ability to write clearly, understanding of audience needs, maintenance practices.",
    follow_up_question: "Can you share an example of documentation you created that was particularly useful?",
    is_system: true,
  },
  {
    question_text: "How do you stay current with emerging technologies and industry trends?",
    competency: "technical",
    difficulty: 1,
    expected_answer: "Look for: proactive learning habits, professional networks, conferences, reading, experimentation with new tools.",
    follow_up_question: "What recent technology trend do you think will have the biggest impact on our industry?",
    is_system: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // LEADERSHIP (7 questions)
  // ═══════════════════════════════════════════════════════════════
  {
    question_text: "Describe your leadership style and how it has evolved over your career.",
    competency: "leadership",
    difficulty: 2,
    expected_answer: "Look for: self-awareness, adaptability, servant leadership traits, ability to motivate different personality types.",
    follow_up_question: "How do you adjust your style for different team members or situations?",
    is_system: true,
  },
  {
    question_text: "Tell me about a time you had to lead a team through a significant change or transformation.",
    competency: "leadership",
    difficulty: 3,
    expected_answer: "Look for: change management skills, communication strategy, stakeholder engagement, overcoming resistance.",
    follow_up_question: "What was the biggest challenge and how did you overcome it?",
    is_system: true,
  },
  {
    question_text: "How do you develop talent within your team? Give a specific example.",
    competency: "leadership",
    difficulty: 2,
    expected_answer: "Look for: mentoring approach, career development planning, feedback practices, succession planning.",
    follow_up_question: "How do you identify potential in team members?",
    is_system: true,
  },
  {
    question_text: "Describe a situation where you had to make a difficult decision that affected your team.",
    competency: "leadership",
    difficulty: 3,
    expected_answer: "Look for: decision-making process, transparency, handling dissent, taking responsibility for outcomes.",
    follow_up_question: "How did you communicate the decision and handle any pushback?",
    is_system: true,
  },
  {
    question_text: "How do you build trust and psychological safety within your team?",
    competency: "leadership",
    difficulty: 2,
    expected_answer: "Look for: vulnerability, consistent behavior, open communication, admitting mistakes, supporting team members.",
    follow_up_question: "Can you share an example where trust was broken and how you rebuilt it?",
    is_system: true,
  },
  {
    question_text: "Tell me about a time you had to manage conflict between team members.",
    competency: "leadership",
    difficulty: 2,
    expected_answer: "Look for: mediation skills, fairness, understanding different perspectives, resolution strategies.",
    follow_up_question: "What did you learn from that experience?",
    is_system: true,
  },
  {
    question_text: "How do you balance being hands-on versus delegating to your team?",
    competency: "leadership",
    difficulty: 2,
    expected_answer: "Look for: appropriate delegation, trust in team, knowing when to intervene, empowering others.",
    follow_up_question: "What factors influence your decision to delegate or take direct action?",
    is_system: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // COMMUNICATION (7 questions)
  // ═══════════════════════════════════════════════════════════════
  {
    question_text: "Describe how you tailor your communication style for different audiences.",
    competency: "communication",
    difficulty: 2,
    expected_answer: "Look for: audience awareness, ability to simplify complex topics, adapting tone and detail level.",
    follow_up_question: "Give an example where you had to communicate the same message to executives and technical staff.",
    is_system: true,
  },
  {
    question_text: "Tell me about a time when poor communication led to a problem. How did you resolve it?",
    competency: "communication",
    difficulty: 2,
    expected_answer: "Look for: recognition of communication gaps, proactive resolution, lessons learned, improved practices.",
    follow_up_question: "What communication practices did you implement afterward?",
    is_system: true,
  },
  {
    question_text: "How do you handle giving difficult feedback to colleagues or team members?",
    competency: "communication",
    difficulty: 2,
    expected_answer: "Look for: directness with empathy, timing considerations, private vs public feedback, follow-up support.",
    follow_up_question: "Can you share an example of feedback that was particularly challenging to deliver?",
    is_system: true,
  },
  {
    question_text: "Describe your approach to presenting complex information to stakeholders.",
    competency: "communication",
    difficulty: 3,
    expected_answer: "Look for: storytelling ability, visual aids, focusing on key messages, anticipating questions.",
    follow_up_question: "How do you prepare for presentations and handle unexpected questions?",
    is_system: true,
  },
  {
    question_text: "How do you ensure effective communication in remote or distributed teams?",
    competency: "communication",
    difficulty: 2,
    expected_answer: "Look for: use of tools, over-communication, async communication skills, building relationships remotely.",
    follow_up_question: "What challenges have you faced and how did you address them?",
    is_system: true,
  },
  {
    question_text: "Tell me about a time you had to persuade someone who was resistant to your idea.",
    competency: "communication",
    difficulty: 2,
    expected_answer: "Look for: understanding objections, building rapport, evidence-based arguments, patience.",
    follow_up_question: "What approach worked best and why?",
    is_system: true,
  },
  {
    question_text: "How do you handle situations where you need to communicate bad news?",
    competency: "communication",
    difficulty: 2,
    expected_answer: "Look for: transparency, timeliness, empathy, providing context, offering support or alternatives.",
    follow_up_question: "Can you share a specific example?",
    is_system: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // PROBLEM SOLVING (7 questions)
  // ═══════════════════════════════════════════════════════════════
  {
    question_text: "Describe your approach to solving complex problems. Walk me through your process.",
    competency: "problem_solving",
    difficulty: 2,
    expected_answer: "Look for: structured thinking, breaking down problems, gathering information, hypothesis testing.",
    follow_up_question: "How do you know when you've found the root cause versus a symptom?",
    is_system: true,
  },
  {
    question_text: "Tell me about a time you solved a problem that others couldn't.",
    competency: "problem_solving",
    difficulty: 3,
    expected_answer: "Look for: creative thinking, persistence, different perspective, collaboration when needed.",
    follow_up_question: "What made your approach different?",
    is_system: true,
  },
  {
    question_text: "How do you approach problems where you don't have all the information you need?",
    competency: "problem_solving",
    difficulty: 2,
    expected_answer: "Look for: comfort with ambiguity, gathering partial data, making assumptions explicit, iterative refinement.",
    follow_up_question: "Can you give an example where you had to make decisions with incomplete information?",
    is_system: true,
  },
  {
    question_text: "Describe a time when your initial solution to a problem didn't work. What did you do?",
    competency: "problem_solving",
    difficulty: 2,
    expected_answer: "Look for: learning from failure, pivoting quickly, not getting stuck, seeking alternative approaches.",
    follow_up_question: "How did you identify that the solution wasn't working?",
    is_system: true,
  },
  {
    question_text: "How do you prioritize when you have multiple problems to solve simultaneously?",
    competency: "problem_solving",
    difficulty: 2,
    expected_answer: "Look for: prioritization framework, impact assessment, urgency evaluation, stakeholder communication.",
    follow_up_question: "What criteria do you use to decide which problem to tackle first?",
    is_system: true,
  },
  {
    question_text: "Tell me about a problem you identified before others noticed it.",
    competency: "problem_solving",
    difficulty: 3,
    expected_answer: "Look for: proactive thinking, pattern recognition, attention to detail, initiative.",
    follow_up_question: "How did you convince others that it was a real problem?",
    is_system: true,
  },
  {
    question_text: "How do you balance quick fixes versus long-term solutions?",
    competency: "problem_solving",
    difficulty: 2,
    expected_answer: "Look for: understanding trade-offs, addressing immediate needs, planning sustainable solutions.",
    follow_up_question: "Give an example where you had to make this trade-off.",
    is_system: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // TEAMWORK (7 questions)
  // ═══════════════════════════════════════════════════════════════
  {
    question_text: "Describe how you build effective working relationships with colleagues.",
    competency: "teamwork",
    difficulty: 1,
    expected_answer: "Look for: relationship-building skills, trust development, understanding others' perspectives.",
    follow_up_question: "How do you approach relationships with people who have different working styles?",
    is_system: true,
  },
  {
    question_text: "Tell me about a time when you had to work closely with someone you didn't get along with.",
    competency: "teamwork",
    difficulty: 2,
    expected_answer: "Look for: professionalism, finding common ground, focusing on shared goals, conflict resolution.",
    follow_up_question: "What did you learn from that experience?",
    is_system: true,
  },
  {
    question_text: "How do you contribute to team success beyond your individual responsibilities?",
    competency: "teamwork",
    difficulty: 2,
    expected_answer: "Look for: helping others, sharing knowledge, mentoring, improving team processes.",
    follow_up_question: "Can you give an example of how you helped a teammate succeed?",
    is_system: true,
  },
  {
    question_text: "Describe a time when you had to rely on others to complete a project.",
    competency: "teamwork",
    difficulty: 2,
    expected_answer: "Look for: trust in teammates, clear communication, coordination skills, handling dependencies.",
    follow_up_question: "How did you ensure everyone was aligned and on track?",
    is_system: true,
  },
  {
    question_text: "How do you handle situations where team members aren't contributing equally?",
    competency: "teamwork",
    difficulty: 3,
    expected_answer: "Look for: addressing issues directly, understanding root causes, supporting improvement.",
    follow_up_question: "What approach has worked best for you?",
    is_system: true,
  },
  {
    question_text: "Tell me about a successful cross-functional collaboration you led or participated in.",
    competency: "teamwork",
    difficulty: 2,
    expected_answer: "Look for: understanding different functions, aligning goals, managing stakeholders.",
    follow_up_question: "What made the collaboration successful?",
    is_system: true,
  },
  {
    question_text: "How do you share knowledge and best practices with your team?",
    competency: "teamwork",
    difficulty: 1,
    expected_answer: "Look for: documentation, training sessions, informal sharing, mentoring.",
    follow_up_question: "What's your approach to learning from others?",
    is_system: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // CULTURAL FIT (6 questions)
  // ═══════════════════════════════════════════════════════════════
  {
    question_text: "What type of work environment helps you perform at your best?",
    competency: "cultural_fit",
    difficulty: 1,
    expected_answer: "Look for: alignment with company culture, self-awareness about preferences, flexibility.",
    follow_up_question: "How do you adapt when the environment doesn't match your preferences?",
    is_system: true,
  },
  {
    question_text: "Describe the values that are most important to you in a workplace.",
    competency: "cultural_fit",
    difficulty: 1,
    expected_answer: "Look for: values alignment with company, authenticity, ability to articulate priorities.",
    follow_up_question: "How have you seen these values demonstrated (or not) in past roles?",
    is_system: true,
  },
  {
    question_text: "Tell me about a time when you had to adapt to a new organizational culture.",
    competency: "cultural_fit",
    difficulty: 2,
    expected_answer: "Look for: adaptability, learning new norms, building relationships, patience.",
    follow_up_question: "What was challenging and how did you overcome it?",
    is_system: true,
  },
  {
    question_text: "How do you balance individual achievement with team success?",
    competency: "cultural_fit",
    difficulty: 2,
    expected_answer: "Look for: collaborative mindset, recognizing team contributions, healthy ambition.",
    follow_up_question: "Can you share an example where you prioritized team over individual goals?",
    is_system: true,
  },
  {
    question_text: "What motivates you beyond compensation and career advancement?",
    competency: "cultural_fit",
    difficulty: 2,
    expected_answer: "Look for: intrinsic motivation, purpose alignment, passion for the work.",
    follow_up_question: "How do you stay motivated during challenging periods?",
    is_system: true,
  },
  {
    question_text: "How do you handle situations where company values conflict with business pressures?",
    competency: "cultural_fit",
    difficulty: 3,
    expected_answer: "Look for: ethical stance, courage to speak up, finding balanced solutions.",
    follow_up_question: "Can you share a specific example?",
    is_system: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // STRATEGIC THINKING (7 questions)
  // ═══════════════════════════════════════════════════════════════
  {
    question_text: "Describe how you approach long-term planning versus day-to-day execution.",
    competency: "strategic_thinking",
    difficulty: 2,
    expected_answer: "Look for: balance between strategy and execution, ability to shift perspectives.",
    follow_up_question: "How do you ensure strategic plans translate into actionable steps?",
    is_system: true,
  },
  {
    question_text: "Tell me about a strategic initiative you led or contributed significantly to.",
    competency: "strategic_thinking",
    difficulty: 3,
    expected_answer: "Look for: vision, stakeholder alignment, execution planning, measuring success.",
    follow_up_question: "What was the outcome and what did you learn?",
    is_system: true,
  },
  {
    question_text: "How do you identify emerging trends or opportunities in your field?",
    competency: "strategic_thinking",
    difficulty: 2,
    expected_answer: "Look for: market awareness, networking, research habits, pattern recognition.",
    follow_up_question: "How do you evaluate which trends are worth pursuing?",
    is_system: true,
  },
  {
    question_text: "Describe a time when you had to pivot strategy based on changing circumstances.",
    competency: "strategic_thinking",
    difficulty: 3,
    expected_answer: "Look for: agility, recognizing signals, decisive action, communication.",
    follow_up_question: "What indicators prompted the pivot?",
    is_system: true,
  },
  {
    question_text: "How do you balance competing priorities when setting strategic direction?",
    competency: "strategic_thinking",
    difficulty: 3,
    expected_answer: "Look for: prioritization framework, stakeholder input, trade-off analysis.",
    follow_up_question: "Can you share an example of a difficult strategic trade-off?",
    is_system: true,
  },
  {
    question_text: "What's your approach to evaluating risk in strategic decisions?",
    competency: "strategic_thinking",
    difficulty: 2,
    expected_answer: "Look for: risk assessment methods, mitigation planning, comfort with uncertainty.",
    follow_up_question: "How do you decide when a risk is worth taking?",
    is_system: true,
  },
  {
    question_text: "How do you ensure alignment between your team's work and broader organizational goals?",
    competency: "strategic_thinking",
    difficulty: 2,
    expected_answer: "Look for: communication of vision, goal-setting, regular alignment checks.",
    follow_up_question: "What tools or practices do you use?",
    is_system: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // ADAPTABILITY (7 questions)
  // ═══════════════════════════════════════════════════════════════
  {
    question_text: "Tell me about a time when you had to adapt quickly to a major change at work.",
    competency: "adaptability",
    difficulty: 2,
    expected_answer: "Look for: resilience, positive attitude, quick learning, proactive adjustment.",
    follow_up_question: "What was most challenging about the change?",
    is_system: true,
  },
  {
    question_text: "How do you handle situations where priorities shift frequently?",
    competency: "adaptability",
    difficulty: 2,
    expected_answer: "Look for: flexibility, re-prioritization skills, maintaining focus, communication.",
    follow_up_question: "What strategies help you stay productive despite changes?",
    is_system: true,
  },
  {
    question_text: "Describe a time when you had to work outside your comfort zone.",
    competency: "adaptability",
    difficulty: 2,
    expected_answer: "Look for: willingness to try new things, learning mindset, overcoming fear.",
    follow_up_question: "What did you learn from that experience?",
    is_system: true,
  },
  {
    question_text: "How do you approach learning new skills or taking on unfamiliar responsibilities?",
    competency: "adaptability",
    difficulty: 1,
    expected_answer: "Look for: proactive learning, seeking help, structured approach, patience.",
    follow_up_question: "Can you share an example of a skill you recently developed?",
    is_system: true,
  },
  {
    question_text: "Tell me about a time when you had to change your approach mid-project.",
    competency: "adaptability",
    difficulty: 2,
    expected_answer: "Look for: recognizing need for change, pivoting gracefully, minimizing disruption.",
    follow_up_question: "What triggered the need to change?",
    is_system: true,
  },
  {
    question_text: "How do you maintain effectiveness during uncertain or ambiguous situations?",
    competency: "adaptability",
    difficulty: 3,
    expected_answer: "Look for: comfort with ambiguity, making progress despite uncertainty, seeking clarity.",
    follow_up_question: "What practices help you stay focused?",
    is_system: true,
  },
  {
    question_text: "Describe how you've adapted your communication or work style for different cultures or contexts.",
    competency: "adaptability",
    difficulty: 2,
    expected_answer: "Look for: cultural awareness, sensitivity, flexibility in approach.",
    follow_up_question: "What did you learn about yourself through that experience?",
    is_system: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // DECISION MAKING (7 questions)
  // ═══════════════════════════════════════════════════════════════
  {
    question_text: "Tell me about a time you had to make a decision with incomplete information.",
    competency: "decision_making",
    difficulty: 2,
    expected_answer: "Look for: structured approach to decision-making, comfort with ambiguity, ability to gather available data quickly, risk assessment, outcome reflection.",
    follow_up_question: "What was the outcome, and what would you do differently?",
    is_system: true,
  },
  {
    question_text: "Describe your decision-making process when facing complex choices.",
    competency: "decision_making",
    difficulty: 2,
    expected_answer: "Look for: framework for evaluation, gathering input, weighing trade-offs, timing.",
    follow_up_question: "How do you know when you have enough information to decide?",
    is_system: true,
  },
  {
    question_text: "Tell me about a difficult decision you made that had significant consequences.",
    competency: "decision_making",
    difficulty: 3,
    expected_answer: "Look for: courage, thorough analysis, stakeholder consideration, accountability.",
    follow_up_question: "How did you handle the aftermath?",
    is_system: true,
  },
  {
    question_text: "How do you balance speed versus thoroughness when making decisions?",
    competency: "decision_making",
    difficulty: 2,
    expected_answer: "Look for: appropriate urgency, knowing when to be quick vs careful, avoiding paralysis.",
    follow_up_question: "Can you share examples of both quick and deliberate decisions?",
    is_system: true,
  },
  {
    question_text: "Describe a time when you had to make a decision that others disagreed with.",
    competency: "decision_making",
    difficulty: 3,
    expected_answer: "Look for: conviction, explaining rationale, handling dissent, standing firm appropriately.",
    follow_up_question: "How did you build support for your decision?",
    is_system: true,
  },
  {
    question_text: "How do you involve others in your decision-making process?",
    competency: "decision_making",
    difficulty: 2,
    expected_answer: "Look for: appropriate collaboration, seeking expertise, avoiding over-consultation.",
    follow_up_question: "When do you decide alone versus seeking input?",
    is_system: true,
  },
  {
    question_text: "Tell me about a decision you regret. What did you learn?",
    competency: "decision_making",
    difficulty: 2,
    expected_answer: "Look for: self-awareness, learning from mistakes, improving process, honesty.",
    follow_up_question: "How has that experience changed your approach?",
    is_system: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // CUSTOMER FOCUS (6 questions)
  // ═══════════════════════════════════════════════════════════════
  {
    question_text: "How do you ensure you understand customer needs and expectations?",
    competency: "customer_focus",
    difficulty: 1,
    expected_answer: "Look for: active listening, asking questions, research, feedback collection.",
    follow_up_question: "What methods have you found most effective?",
    is_system: true,
  },
  {
    question_text: "Tell me about a time when you went above and beyond for a customer.",
    competency: "customer_focus",
    difficulty: 2,
    expected_answer: "Look for: initiative, empathy, problem-solving, exceeding expectations.",
    follow_up_question: "What motivated you to do more than required?",
    is_system: true,
  },
  {
    question_text: "How do you handle situations where customer requests conflict with company policies?",
    competency: "customer_focus",
    difficulty: 2,
    expected_answer: "Look for: balancing needs, finding creative solutions, clear communication.",
    follow_up_question: "Can you share a specific example?",
    is_system: true,
  },
  {
    question_text: "Describe how you've used customer feedback to improve products or services.",
    competency: "customer_focus",
    difficulty: 2,
    expected_answer: "Look for: listening to feedback, translating to improvements, measuring impact.",
    follow_up_question: "What was the most valuable feedback you received?",
    is_system: true,
  },
  {
    question_text: "How do you balance customer satisfaction with other business priorities?",
    competency: "customer_focus",
    difficulty: 3,
    expected_answer: "Look for: understanding trade-offs, finding win-win solutions, clear communication.",
    follow_up_question: "When have you had to say no to a customer and how did you handle it?",
    is_system: true,
  },
  {
    question_text: "Tell me about a time when you turned a dissatisfied customer into a loyal one.",
    competency: "customer_focus",
    difficulty: 2,
    expected_answer: "Look for: problem resolution, empathy, follow-up, relationship rebuilding.",
    follow_up_question: "What approach worked best?",
    is_system: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // INNOVATION (6 questions)
  // ═══════════════════════════════════════════════════════════════
  {
    question_text: "Tell me about an innovative idea you proposed and implemented.",
    competency: "innovation",
    difficulty: 2,
    expected_answer: "Look for: creativity, execution, overcoming obstacles, measuring results.",
    follow_up_question: "What inspired the idea and how did you get support for it?",
    is_system: true,
  },
  {
    question_text: "How do you foster innovation within your team or organization?",
    competency: "innovation",
    difficulty: 2,
    expected_answer: "Look for: encouraging experimentation, safe environment for ideas, recognizing contributions.",
    follow_up_question: "What practices have been most effective?",
    is_system: true,
  },
  {
    question_text: "Describe a time when you challenged an established process or approach.",
    competency: "innovation",
    difficulty: 3,
    expected_answer: "Look for: questioning status quo, evidence-based argument, handling resistance.",
    follow_up_question: "What was the outcome?",
    is_system: true,
  },
  {
    question_text: "How do you balance innovation with practical constraints like budget or time?",
    competency: "innovation",
    difficulty: 2,
    expected_answer: "Look for: realistic innovation, phased approaches, ROI thinking.",
    follow_up_question: "Can you share an example where you innovated within tight constraints?",
    is_system: true,
  },
  {
    question_text: "Tell me about a time when an innovative approach failed. What did you learn?",
    competency: "innovation",
    difficulty: 2,
    expected_answer: "Look for: learning from failure, iterating, not being discouraged.",
    follow_up_question: "How did you apply those lessons to future innovations?",
    is_system: true,
  },
  {
    question_text: "How do you stay creative and come up with new ideas?",
    competency: "innovation",
    difficulty: 1,
    expected_answer: "Look for: inspiration sources, brainstorming techniques, cross-pollination of ideas.",
    follow_up_question: "What's your most recent innovative idea?",
    is_system: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // EXECUTION (7 questions)
  // ═══════════════════════════════════════════════════════════════
  {
    question_text: "Describe your approach to ensuring projects are completed on time and to quality standards.",
    competency: "execution",
    difficulty: 2,
    expected_answer: "Look for: planning skills, tracking progress, quality checks, deadline management.",
    follow_up_question: "What tools or methods do you use?",
    is_system: true,
  },
  {
    question_text: "Tell me about a time when you had to deliver results under significant pressure.",
    competency: "execution",
    difficulty: 2,
    expected_answer: "Look for: focus, prioritization, stress management, maintaining quality.",
    follow_up_question: "How did you maintain quality while meeting tight deadlines?",
    is_system: true,
  },
  {
    question_text: "How do you track progress and ensure accountability for deliverables?",
    competency: "execution",
    difficulty: 2,
    expected_answer: "Look for: metrics, regular check-ins, clear ownership, transparency.",
    follow_up_question: "What's worked best for keeping teams on track?",
    is_system: true,
  },
  {
    question_text: "Describe a complex project you successfully executed. What made it successful?",
    competency: "execution",
    difficulty: 3,
    expected_answer: "Look for: planning, stakeholder management, problem-solving, coordination.",
    follow_up_question: "What were the biggest challenges and how did you overcome them?",
    is_system: true,
  },
  {
    question_text: "How do you handle situations where you're falling behind on commitments?",
    competency: "execution",
    difficulty: 2,
    expected_answer: "Look for: early recognition, communication, recovery planning, learning.",
    follow_up_question: "Can you share an example?",
    is_system: true,
  },
  {
    question_text: "Tell me about a time when you had to execute a plan with limited resources.",
    competency: "execution",
    difficulty: 2,
    expected_answer: "Look for: resourcefulness, prioritization, creative solutions.",
    follow_up_question: "What trade-offs did you make?",
    is_system: true,
  },
  {
    question_text: "How do you ensure the quality of your work while maintaining speed?",
    competency: "execution",
    difficulty: 2,
    expected_answer: "Look for: quality standards, efficiency techniques, appropriate review.",
    follow_up_question: "What quality checks do you use?",
    is_system: true,
  },
];

// Export count for verification
export const SEED_QUESTIONS_COUNT = SEED_QUESTIONS.length;

// Function to insert seed questions into database
export async function insertSeedQuestions(db: any): Promise<void> {
  for (const question of SEED_QUESTIONS) {
    await db.query(`
      INSERT INTO questions (
        question_text, competency, difficulty, expected_answer,
        follow_up_question, is_system, usage_count
      ) VALUES ($1, $2, $3, $4, $5, $6, 0)
      ON CONFLICT DO NOTHING
    `, [
      question.question_text,
      question.competency,
      question.difficulty,
      question.expected_answer,
      question.follow_up_question,
      question.is_system,
    ]);
  }
}

export default SEED_QUESTIONS;