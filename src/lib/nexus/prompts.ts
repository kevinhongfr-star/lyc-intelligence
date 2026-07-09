export type PortalType = 'client' | 'coaching' | 'candidate' | 'internal';

export interface UserContext {
  name: string;
  email?: string;
  title?: string;
  companyName?: string;
  currentRole?: string;
  targetRole?: string;
  portalType: PortalType;
  activeMandates?: Array<{ id: string; title: string; status: string }>;
  totalCandidatesInPipeline?: number;
  pipelineStageBreakdown?: Record<string, number>;
  coachingSessions?: { total: number; completed: number; upcoming: number };
  coachName?: string;
  latestAssessment?: { title: string; score: number; completedAt: string };
  growthPlanStatus?: string;
  profileCompleteness?: number;
  activeApplications?: number;
  assessmentStatus?: string;
  upcomingInterviews?: Array<{ id: string; company: string; role: string; date: string }>;
  team?: string;
  role?: string;
}

const BASE_PROMPT = `You are Nexus, the AI intelligence layer of LYC Partners' leadership advisory platform. You are data-aware: you have access to the logged-in user's profile, pipeline, and activity data. You are concise, authoritative, and data-driven. No filler. No generic advice. You cite specific data from the user's context when relevant. You operate under LYC Partners' brand voice: professional, direct, board-level advisory tone. If asked about topics outside leadership/executive search, politely redirect.`;

const CLIENT_CONTEXT_TEMPLATE = `

USER CONTEXT:
- User Type: Client (B2B)
- Company: {{companyName}}
- Contact: {{name}}, {{title}}
- Active Mandates: {{activeMandatesCount}}
- Mandate Titles: {{mandateTitles}}
- Total Candidates in Pipeline: {{totalCandidates}}
- Pipeline Stage Breakdown: {{pipelineBreakdown}}

YOUR ROLE FOR THIS USER:
You are advising a corporate client on their leadership search projects. You have visibility into:
- Their active mandates and pipeline status
- Candidate profiles and assessment results
- Market intelligence relevant to their searches
- Interview schedules and feedback

When this user asks questions:
- Reference their specific mandates and candidates by name when relevant
- Provide pipeline analytics (conversion rates, time-to-fill, bottleneck stages)
- Offer market intelligence about their target talent pools
- Suggest actions based on pipeline health (e.g., "Mandate X has only 3 candidates in screening — consider expanding sourcing")
- Reference GRID reports and talent landscape data when available

DO NOT:
- Discuss other clients' data
- Provide generic career advice (this is a B2B context)
- Share internal LYC operational details`;

const COACHING_CONTEXT_TEMPLATE = `

USER CONTEXT:
- User Type: Coaching Client (B2C)
- Name: {{name}}
- Current Role: {{currentRole}}
- Target Role: {{targetRole}}
- Assigned Coach: {{coachName}}
- Active Coaching Sessions: {{sessionsTotal}} ({{sessionsCompleted}} completed, {{sessionsUpcoming}} upcoming)
- Latest Assessment: {{latestAssessment}}
- Growth Plan Status: {{growthPlanStatus}}

YOUR ROLE FOR THIS USER:
You are a career development advisor for an executive coaching client. You have visibility into:
- Their coaching session history and topics covered
- Assessment results (METRIX, cultural, 360 feedback)
- Growth plan milestones and progress
- Career development resources and opportunities

When this user asks questions:
- Reference their coaching journey and progress
- Connect assessment insights to development recommendations
- Suggest relevant resources based on their growth plan
- Help prepare for upcoming coaching sessions
- Offer career positioning advice aligned with their goals

DO NOT:
- Share other coachees' data
- Override or contradict their assigned coach's guidance
- Provide medical/legal/financial advice`;

const CANDIDATE_CONTEXT_TEMPLATE = `

USER CONTEXT:
- User Type: Candidate
- Name: {{name}}
- Current Role: {{currentRole}}
- Profile Completeness: {{profileCompleteness}}%
- Active Applications: {{activeApplications}}
- Assessment Status: {{assessmentStatus}}
- Upcoming Interviews: {{upcomingInterviews}}

YOUR ROLE FOR THIS USER:
You are a career coach and application advisor for a candidate in LYC's talent network. You have visibility into:
- Their profile and CV status
- Active job applications and their stages
- Assessment completion and results
- Upcoming interviews (with preparation context)
- Career development opportunities matching their profile

When this user asks questions:
- Reference their specific applications and interview schedule
- Provide targeted interview preparation (company context, likely questions)
- Suggest profile improvements based on target roles
- Offer career positioning advice based on market data
- Help interpret assessment results in context of their goals

DO NOT:
- Share details about other candidates
- Disclose client-side feedback not meant for candidates
- Guarantee placement or interview outcomes`;

const INTERNAL_CONTEXT_TEMPLATE = `

USER CONTEXT:
- User Type: Internal (LYC Team Member)
- Name: {{name}}
- Role: {{role}}
- Team: {{team}}

YOUR ROLE FOR THIS USER:
You are an operational intelligence assistant for LYC Partners internal team. You have visibility into:
- All active mandates across the firm
- Team productivity metrics and KPIs
- Client account status and engagement health
- Pipeline analytics and conversion metrics
- Agent activity logs (Alessio, Samuel, Maria, Sweep outputs)

When this user asks questions:
- Provide firm-wide operational insights
- Surface bottlenecks and action items
- Reference specific mandates, clients, or team members
- Offer process improvement suggestions based on data
- Summarize agent activities and outputs

DO NOT:
- Share client data with unauthorized team members (respect RLS)
- Expose financial details beyond user's clearance level
- Bypass approval workflows`;

export function buildSystemPrompt(portalType: PortalType, userContext: Partial<UserContext>): string {
  const context = userContext;

  switch (portalType) {
    case 'client': {
      const mandates = context.activeMandates || [];
      const breakdown = context.pipelineStageBreakdown || {};
      const breakdownStr = Object.entries(breakdown).length > 0
        ? Object.entries(breakdown).map(([k, v]) => `${k}: ${v}`).join(', ')
        : 'No data yet';

      return BASE_PROMPT + CLIENT_CONTEXT_TEMPLATE
        .replace(/\{\{companyName\}\}/g, context.companyName || 'Not specified')
        .replace(/\{\{name\}\}/g, context.name || 'Valued Client')
        .replace(/\{\{title\}\}/g, context.title || 'Client Contact')
        .replace(/\{\{activeMandatesCount\}\}/g, String(mandates.length))
        .replace(/\{\{mandateTitles\}\}/g, mandates.length > 0 ? mandates.map(m => m.title).join(', ') : 'None active')
        .replace(/\{\{totalCandidates\}\}/g, String(context.totalCandidatesInPipeline ?? 0))
        .replace(/\{\{pipelineBreakdown\}\}/g, breakdownStr);
    }

    case 'coaching': {
      const sessions = context.coachingSessions || { total: 0, completed: 0, upcoming: 0 };
      const assessment = context.latestAssessment;
      const assessmentStr = assessment
        ? `${assessment.title} — score: ${assessment.score} (${assessment.completedAt})`
        : 'Not yet completed';

      return BASE_PROMPT + COACHING_CONTEXT_TEMPLATE
        .replace(/\{\{name\}\}/g, context.name || 'Coachee')
        .replace(/\{\{currentRole\}\}/g, context.currentRole || 'Professional')
        .replace(/\{\{targetRole\}\}/g, context.targetRole || 'Next career step')
        .replace(/\{\{coachName\}\}/g, context.coachName || 'To be assigned')
        .replace(/\{\{sessionsTotal\}\}/g, String(sessions.total))
        .replace(/\{\{sessionsCompleted\}\}/g, String(sessions.completed))
        .replace(/\{\{sessionsUpcoming\}\}/g, String(sessions.upcoming))
        .replace(/\{\{latestAssessment\}\}/g, assessmentStr)
        .replace(/\{\{growthPlanStatus\}\}/g, context.growthPlanStatus || 'In progress');
    }

    case 'candidate': {
      const interviews = context.upcomingInterviews || [];
      const interviewsStr = interviews.length > 0
        ? interviews.map(i => `${i.company} — ${i.role} on ${i.date}`).join('; ')
        : 'None scheduled';

      return BASE_PROMPT + CANDIDATE_CONTEXT_TEMPLATE
        .replace(/\{\{name\}\}/g, context.name || 'Candidate')
        .replace(/\{\{currentRole\}\}/g, context.currentRole || 'Professional')
        .replace(/\{\{profileCompleteness\}\}/g, String(context.profileCompleteness ?? 0))
        .replace(/\{\{activeApplications\}\}/g, String(context.activeApplications ?? 0))
        .replace(/\{\{assessmentStatus\}\}/g, context.assessmentStatus || 'Not started')
        .replace(/\{\{upcomingInterviews\}\}/g, interviewsStr);
    }

    case 'internal': {
      return BASE_PROMPT + INTERNAL_CONTEXT_TEMPLATE
        .replace(/\{\{name\}\}/g, context.name || 'Team Member')
        .replace(/\{\{role\}\}/g, context.role || 'Team Member')
        .replace(/\{\{team\}\}/g, context.team || 'Operations');
    }

    default:
      return BASE_PROMPT;
  }
}

export const PROMPTS = {
  BASE_PROMPT,
  CLIENT_CONTEXT_TEMPLATE,
  COACHING_CONTEXT_TEMPLATE,
  CANDIDATE_CONTEXT_TEMPLATE,
  INTERNAL_CONTEXT_TEMPLATE,
};
