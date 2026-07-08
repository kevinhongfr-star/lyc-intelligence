/**
 * Prompt templates for all AI features
 * Used by serverless AI endpoints
 */

export const PROMPTS = {
  interview: {
    generateQuestions: `You are a senior executive interviewer at {company} for the role of {role}.
Generate {count} behavioral interview questions at {difficulty} level.

Focus areas:
- Leadership and management experience
- Strategic decision-making
- Cross-cultural collaboration
- Change management
- Problem-solving under pressure

For each question, return JSON with:
{
  "id": "unique-id",
  "question": "The interview question",
  "category": "behavioral|technical|leadership|culture",
  "timeLimit": <seconds>,
  "expectedFramework": "STAR|Framework name"
}

Return ONLY a JSON array.`,

    evaluateAnswer: `Rate this interview answer on 6 dimensions (1-10):
- Structure: Clarity and organization
- Specificity: Concrete examples and metrics
- Impact: Quantifiable results achieved
- Leadership: Team and stakeholder influence
- Relevance: Alignment with the role
- Depth: Analysis and insight

Question: {question}
Answer: {answer}

Return ONLY JSON:
{
  "scores": {
    "Structure": <1-10>,
    "Specificity": <1-10>,
    "Impact": <1-10>,
    "Leadership": <1-10>,
    "Relevance": <1-10>,
    "Depth": <1-10>
  },
  "feedback": {
    "Strengths": ["...", "..."],
    "AreasForImprovement": ["...", "..."]
  },
  "overallScore": <1-10>
}`,

    generateReport: `Based on these interview answers and scores, generate a comprehensive interview performance report.

Interview Context:
- Company: {company}
- Role: {role}
- Date: {date}

Session Data:
{sessionData}

Report structure:
{
  "overallRating": "<rating label>",
  "overallScore": <0-100>,
  "strengths": ["...", "...", "..."],
  "improvementAreas": ["...", "...", "..."],
  "dimensionsSummary": [
    {"dimension": "Structure", "score": <0-100>, "feedback": "..."},
    {"dimension": "Specificity", "score": <0-100>, "feedback": "..."},
    {"dimension": "Impact", "score": <0-100>, "feedback": "..."},
    {"dimension": "Leadership", "score": <0-100>, "feedback": "..."},
    {"dimension": "Relevance", "score": <0-100>, "feedback": "..."},
    {"dimension": "Depth", "score": <0-100>, "feedback": "..."}
  ],
  "recommendations": ["...", "..."]
}

Return ONLY JSON.`,
  },

  cq: {
    assess: `You are a cross-cultural leadership expert. Generate 10 CQ (Cultural Intelligence) assessment questions across 5 dimensions.

Dimensions:
1. Cultural Awareness — Understanding of cultural norms and differences
2. Cultural Adaptation — Ability to adapt behavior to different cultures
3. Cultural Navigation — Skill in navigating cross-cultural situations
4. Cultural Influence — Ability to influence across cultural boundaries
5. Cultural Integration — Ability to integrate diverse cultural perspectives

Target context: {targetCulture}, {targetRole}

For each question, return:
{
  "id": "cq-1",
  "dimension": "<dimension name>",
  "question": "<scenario-based question>",
  "type": "rating|scenario"
}

Return ONLY JSON array.`,

    evaluate: `You are a cross-cultural leadership expert. Evaluate these CQ assessment responses across 5 dimensions.

User profile:
- Current role: {role}
- Cultural background: {culture}
- International experience: {experience}

Responses:
{responses}

Score each dimension 0-100 and provide analysis:
{
  "scores": {
    "CulturalAwareness": <0-100>,
    "CulturalAdaptation": <0-100>,
    "CulturalNavigation": <0-100>,
    "CulturalInfluence": <0-100>,
    "CulturalIntegration": <0-100>
  },
  "overallScore": <0-100>,
  "analysis": {
    "strengths": ["...", "..."],
    "developmentAreas": ["...", "..."]
  }
}

Return ONLY JSON.`,

    invisibleRules: `You are an expert in {targetCulture} business culture. Generate an "Invisible Rules Map" for {targetRole} working in {targetCulture}.

Identify the unwritten rules, norms, and expectations that foreign executives often miss.

Return JSON:
{
  "culturalContext": "...",
  "keyRules": [
    {"category": "Communication", "rule": "...", "whyImportant": "..."},
    {"category": "Hierarchy", "rule": "...", "whyImportant": "..."},
    {"category": "Decision-making", "rule": "...", "whyImportant": "..."},
    {"category": "Relationships", "rule": "...", "whyImportant": "..."},
    {"category": "Time", "rule": "...", "whyImportant": "..."}
  ],
  "commonMistakes": ["...", "..."],
  "successStrategies": ["...", "..."]
}

Return ONLY JSON.`,

    blindSpots: `Analyze these CQ assessment patterns to identify blind spots.

Assessment scores: {scores}
Self-reported strengths: {selfReported}

Return JSON with blind spots and recommendations:
{
  "blindSpots": [
    {"area": "...", "evidence": "...", "impact": "..."},
    {"area": "...", "evidence": "...", "impact": "..."}
  ],
  "developmentPlan": ["...", "...", "..."]
}

Return ONLY JSON.`,
  },

  org: {
    healthScore: `You are an organizational health expert. Analyze this company data and generate health scores across 5 dimensions.

Company: {companyName}
Industry: {industry}
Size: {employeeCount}

Data inputs:
- Turnover rate: {turnoverRate}%
- Engagement score: {engagementScore}/10
- Average tenure: {avgTenure} years
- Promotion rate: {promotionRate}%
- Critical role coverage: {criticalRoleCoverage}%

Score 0-100 for each dimension:
{
  "overallScore": <0-100>,
  "dimensions": {
    "TurnoverRisk": {"score": <0-100>, "analysis": "..."},
    "Engagement": {"score": <0-100>, "analysis": "..."},
    "StructureEfficiency": {"score": <0-100>, "analysis": "..."},
    "TalentDensity": {"score": <0-100>, "analysis": "..."},
    "GrowthReadiness": {"score": <0-100>, "analysis": "..."}
  },
  "risks": [{"risk": "...", "severity": "high|medium|low", "mitigation": "..."}],
  "recommendations": ["...", "...", "..."]
}

Return ONLY JSON.`,

    riskAnalysis: `You are a corporate risk analyst. Identify specific risks for this organization.

Company data:
{companyData}

Return JSON:
{
  "riskSummary": "...",
  "risks": [
    {"category": "...", "description": "...", "probability": <0-100>, "impact": <0-100>, "mitigation": "..."}
  ]
}

Return ONLY JSON.`,

    benchmark: `Compare this company against industry benchmarks.

Company: {company}
Industry: {industry}

Company metrics: {companyMetrics}

Industry benchmarks:
- Turnover rate: 15%
- Engagement score: 7.2/10
- Time to hire: 45 days
- Offer acceptance: 70%

Return JSON comparison:
{
  "comparison": [
    {"metric": "...", "companyValue": "...", "industryValue": "...", "percentile": <0-100>}
  ],
  "strengths": ["...", "..."],
  "improvementAreas": ["...", "..."]
}

Return ONLY JSON.`,
  },

  reports: {
    talentDeepDive: `You are an executive search expert. Generate a comprehensive Talent Deep-Dive report for this candidate.

Candidate: {candidateName}
Current role: {currentRole}
Years experience: {yearsExperience}

Assessment data:
{assessmentData}

Interview feedback:
{interviewFeedback}

Resume highlights:
{resumeHighlights}

Return structured JSON report:
{
  "sections": [
    {"title": "Executive Summary", "content": "...", "order": 1},
    {"title": "Experience Analysis", "content": "...", "order": 2},
    {"title": "Skills Assessment", "content": "...", "order": 3},
    {"title": "Cultural Fit Analysis", "content": "...", "order": 4},
    {"title": "Growth Trajectory", "content": "...", "order": 5},
    {"title": "Risk Factors", "content": "...", "order": 6},
    {"title": "Recommendation", "content": "...", "order": 7}
  ],
  "overallRecommendation": "Hire|Strong Hire|No Hire",
  "confidenceScore": <0-100>
}

Return ONLY JSON.`,

    lensReport: `Generate a LENS (Leadership Evaluation & Notification Score) report for this candidate.

Candidate: {candidateName}

TRIDENT scores: {tridentScores}

Assessment results:
{assessmentResults}

Return JSON:
{
  "overallScore": <0-10>,
  "dimensions": {
    "Vision": {"score": <0-10>, "analysis": "..."},
    "Execution": {"score": <0-10>, "analysis": "..."},
    "Influence": {"score": <0-10>, "analysis": "..."},
    "Learning": {"score": <0-10>, "analysis": "..."},
    "Resilience": {"score": <0-10>, "analysis": "..."}
  },
  "executiveSummary": "...",
  "recommendations": ["...", "..."]
}

Return ONLY JSON.`,

    orgHealthReport: `Generate a comprehensive Org Health Report.

Company: {company}

Health scores: {healthScores}

Risk analysis: {riskAnalysis}

Recommendations: {recommendations}

Return JSON report:
{
  "sections": [
    {"title": "Overall Health Score", "content": "...", "score": <0-100>, "order": 1},
    {"title": "Leadership Pipeline", "content": "...", "score": <0-100>, "order": 2},
    {"title": "Engagement & Culture", "content": "...", "score": <0-100>, "order": 3},
    {"title": "Retention Risk", "content": "...", "score": <0-100>, "order": 4},
    {"title": "Structure Efficiency", "content": "...", "score": <0-100>, "order": 5},
    {"title": "Recommendations", "content": "...", "order": 6}
  ]
}

Return ONLY JSON.`,
  },

  analyze: {
    general: `You are an analytical assistant. Analyze this data and provide insights.

Data: {inputData}

Task: {task}

Return structured JSON with analysis and recommendations.`,

    cv: `Extract structured information from this CV text.

CV text: {cvText}

Return JSON with:
{
  "name": "...",
  "currentTitle": "...",
  "currentCompany": "...",
  "yearsExperience": <number>,
  "keySkills": ["...", "..."],
  "education": [{"degree": "...", "institution": "...", "year": "..."}],
  "careerHighlights": ["...", "..."],
  "potentialRedFlags": ["...", "..."]
}

Return ONLY JSON.`,

    score: `Score this item using the specified criteria.

Item: {item}
Criteria: {criteria}
Scale: 0-100

Return JSON:
{
  "score": <0-100>,
  "breakdown": [{"criterion": "...", "score": <0-100>, "reason": "..."}],
  "summary": "..."
}

Return ONLY JSON.`,
  },
};

export function buildPrompt(type: keyof typeof PROMPTS, subType: string, params: Record<string, string>): string {
  const prompt = PROMPTS[type]?.[subType as keyof typeof PROMPTS[typeof type]];
  if (!prompt) {
    throw new Error(`Prompt not found: ${type}.${subType}`);
  }
  let result = prompt;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}
