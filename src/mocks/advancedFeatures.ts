/**
 * EO-6 Mock Data: Growth, Services, Community, Assessments
 */

// ═══════════════════════════════════════════
// 1. GROWTH PLAN
// ═══════════════════════════════════════════

export interface Goal {
  id: string;
  title: string;
  description: string;
  type: 'short_term' | 'long_term';
  progress: number; // 0-100
  milestones: { label: string; completed: boolean; date?: string }[];
  deadline: string;
  createdAt: string;
}

export const MOCK_GOALS: Goal[] = [
  {
    id: 'g1', title: 'Transition to CTO Role', description: 'Build technical leadership credentials and secure a CTO position at a Series B+ company.',
    type: 'long_term', progress: 62,
    milestones: [
      { label: 'Complete executive presence coaching', completed: true, date: '2025-11-15' },
      { label: 'Lead cross-functional product launch', completed: true, date: '2025-12-20' },
      { label: 'Present at 2 industry conferences', completed: false },
      { label: 'Secure 3 board advisory positions', completed: false },
    ],
    deadline: '2026-06-30', createdAt: '2025-10-01',
  },
  {
    id: 'g2', title: 'Improve Board Communication', description: 'Develop clear, concise board-level presentation skills.',
    type: 'short_term', progress: 80,
    milestones: [
      { label: 'Complete board communication workshop', completed: true, date: '2025-12-01' },
      { label: 'Deliver first board presentation', completed: true, date: '2026-01-10' },
      { label: 'Get feedback from 3 board members', completed: false },
    ],
    deadline: '2026-03-31', createdAt: '2025-11-01',
  },
  {
    id: 'g3', title: 'Build APAC Network', description: 'Expand professional network across APAC markets.',
    type: 'long_term', progress: 35,
    milestones: [
      { label: 'Attend 4 APAC networking events', completed: true, date: '2026-01-15' },
      { label: 'Connect with 20 senior leaders', completed: false },
      { label: 'Join 2 advisory boards', completed: false },
    ],
    deadline: '2026-12-31', createdAt: '2025-09-01',
  },
];

export interface DevelopmentActivity {
  id: string;
  title: string;
  type: 'course' | 'reading' | 'exercise' | 'workshop';
  description: string;
  duration: string;
  completed: boolean;
  category: string;
}

export const MOCK_ACTIVITIES: DevelopmentActivity[] = [
  { id: 'a1', title: 'Executive Presence Masterclass', type: 'course', description: 'Build authentic leadership presence for board and C-suite interactions.', duration: '6 hours', completed: true, category: 'Leadership' },
  { id: 'a2', title: 'The Hard Thing About Hard Things', type: 'reading', description: 'Ben Horowitz on building and running startups.', duration: '8 hours', completed: true, category: 'Leadership' },
  { id: 'a3', title: 'Cross-Border Negotiation Simulation', type: 'exercise', description: 'Practice multi-party negotiation across cultural contexts.', duration: '2 hours', completed: false, category: 'Negotiation' },
  { id: 'a4', title: 'AI Strategy for Executives', type: 'course', description: 'Understand AI capabilities, limitations, and strategic implications.', duration: '4 hours', completed: false, category: 'Technology' },
  { id: 'a5', title: 'Board Governance Essentials', type: 'workshop', description: 'Roles, responsibilities, and best practices for board members.', duration: '1 day', completed: false, category: 'Governance' },
  { id: 'a6', title: 'Financial Statement Analysis', type: 'reading', description: 'How to read and interpret financial statements as a non-finance executive.', duration: '4 hours', completed: false, category: 'Finance' },
];

export interface Mentor {
  id: string;
  name: string;
  title: string;
  company: string;
  specialties: string[];
  rating: number;
  sessionsCompleted: number;
  bio: string;
  availability: string;
  avatarColor: string;
}

export const MOCK_MENTORS: Mentor[] = [
  { id: 'm1', name: 'Dr. Linda Cheung', title: 'Former CEO', company: 'HSBC APAC', specialties: ['Board Governance', 'Financial Services', 'APAC Markets'], rating: 4.9, sessionsCompleted: 127, bio: '30+ years in banking and financial services. Former CEO of HSBC APAC. Board member at 4 listed companies.', availability: 'Tuesdays, Thursdays', avatarColor: '#1a365d' },
  { id: 'm2', name: 'Raj Patel', title: 'CTO', company: 'Grab (Former)', specialties: ['Technology Leadership', 'Scaling Teams', 'Product Strategy'], rating: 4.8, sessionsCompleted: 89, bio: 'Scaled engineering from 20 to 2000 at Grab. Angel investor in 15+ startups.', availability: 'Wednesdays', avatarColor: '#276749' },
  { id: 'm3', name: 'Sarah Kim', title: 'Managing Director', company: 'McKinsey & Co', specialties: ['Strategy', 'Organizational Design', 'Change Management'], rating: 4.7, sessionsCompleted: 156, bio: '20 years in management consulting. Led transformation programs for Fortune 500 companies across Asia.', availability: 'Mondays, Fridays', avatarColor: '#744210' },
  { id: 'm4', name: 'James Chen', title: 'COO', company: 'Sea Group', specialties: ['Operations', 'E-commerce', 'Supply Chain'], rating: 4.6, sessionsCompleted: 64, bio: 'Operational excellence leader. Built Shopee logistics from scratch.', availability: 'Thursdays', avatarColor: '#9b2c2c' },
  { id: 'm5', name: 'Maria Santos', title: 'CHRO', company: 'DBS Bank', specialties: ['HR Strategy', 'Culture Transformation', 'Talent Management'], rating: 4.8, sessionsCompleted: 102, bio: 'Transformed DBS into a best-place-to-work employer. Expert in digital culture change.', availability: 'Tuesdays', avatarColor: '#553c9a' },
];

export const MOCK_SKILL_GAPS = {
  current: { Vision: 82, Execution: 78, Influence: 71, Learning: 88, Resilience: 76, 'Board Communication': 55, 'Financial Acumen': 60, 'Cross-Border Ops': 68 },
  target: { Vision: 90, Execution: 90, Influence: 85, Learning: 90, Resilience: 85, 'Board Communication': 85, 'Financial Acumen': 80, 'Cross-Border Ops': 85 },
};

// ═══════════════════════════════════════════
// 2. CAREER SERVICES
// ═══════════════════════════════════════════

export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  priceCredits: number;
  provider: { name: string; title: string; rating: number; avatarColor: string };
  duration: string;
  availability: string;
  rating: number;
  reviews: number;
}

export const MOCK_SERVICES: Service[] = [
  { id: 's1', name: 'Executive Resume Review', description: 'Get expert feedback on your executive-level resume from a former Fortune 500 CHRO.', category: 'Resume', priceCredits: 5, provider: { name: 'Maria Santos', title: 'Former CHRO, DBS', rating: 4.9, avatarColor: '#553c9a' }, duration: '60 min', availability: 'This week', rating: 4.9, reviews: 47 },
  { id: 's2', name: 'Mock Interview — C-Suite', description: 'Practice executive-level interview scenarios with feedback from a seasoned search consultant.', category: 'Interview', priceCredits: 8, provider: { name: 'Dr. Linda Cheung', title: 'Former CEO, HSBC APAC', rating: 4.8, avatarColor: '#1a365d' }, duration: '90 min', availability: 'Next week', rating: 4.8, reviews: 33 },
  { id: 's3', name: 'Career Strategy Session', description: 'Define your career trajectory with a structured 1-on-1 strategy session.', category: 'Coaching', priceCredits: 6, provider: { name: 'Sarah Kim', title: 'MD, McKinsey & Co', rating: 4.7, avatarColor: '#744210' }, duration: '60 min', availability: 'This week', rating: 4.7, reviews: 62 },
  { id: 's4', name: 'Salary Negotiation Workshop', description: 'Learn data-driven negotiation strategies for executive compensation packages.', category: 'Negotiation', priceCredits: 4, provider: { name: 'James Chen', title: 'COO, Sea Group', rating: 4.6, avatarColor: '#9b2c2c' }, duration: '45 min', availability: 'Tomorrow', rating: 4.6, reviews: 28 },
  { id: 's5', name: 'LinkedIn Profile Optimization', description: 'Transform your LinkedIn into a magnet for executive opportunities.', category: 'Resume', priceCredits: 3, provider: { name: 'Raj Patel', title: 'CTO, Grab (Former)', rating: 4.5, avatarColor: '#276749' }, duration: '45 min', availability: 'This week', rating: 4.5, reviews: 51 },
  { id: 's6', name: 'Board Readiness Assessment', description: 'Evaluate your readiness for board service with a governance expert.', category: 'Coaching', priceCredits: 7, provider: { name: 'Dr. Linda Cheung', title: 'Former CEO, HSBC APAC', rating: 4.9, avatarColor: '#1a365d' }, duration: '90 min', availability: 'Next week', rating: 4.9, reviews: 19 },
  { id: 's7', name: 'Executive Presence Coaching', description: 'Build authentic presence for high-stakes presentations and meetings.', category: 'Coaching', priceCredits: 6, provider: { name: 'Maria Santos', title: 'Former CHRO, DBS', rating: 4.8, avatarColor: '#553c9a' }, duration: '60 min', availability: 'This week', rating: 4.8, reviews: 38 },
  { id: 's8', name: 'Cross-Cultural Leadership Lab', description: 'Develop cultural intelligence for leading diverse, global teams.', category: 'Workshop', priceCredits: 10, provider: { name: 'Sarah Kim', title: 'MD, McKinsey & Co', rating: 4.7, avatarColor: '#744210' }, duration: '2 hours', availability: 'Monthly', rating: 4.7, reviews: 24 },
];

export const MOCK_UPCOMING_SESSIONS = [
  { id: 'us1', serviceName: 'Mock Interview — C-Suite', providerName: 'Dr. Linda Cheung', date: '2026-01-28', time: '10:00 AM', status: 'confirmed' as const },
  { id: 'us2', serviceName: 'Career Strategy Session', providerName: 'Sarah Kim', date: '2026-02-01', time: '2:00 PM', status: 'pending' as const },
];

export const MOCK_PAST_SESSIONS = [
  { id: 'ps1', serviceName: 'Executive Resume Review', providerName: 'Maria Santos', date: '2026-01-15', rating: 5, notes: 'Excellent feedback. Restructured my CV to highlight board experience.' },
  { id: 'ps2', serviceName: 'Salary Negotiation Workshop', providerName: 'James Chen', date: '2026-01-08', rating: 4, notes: 'Good frameworks. Would have liked more role-play time.' },
];

// ═══════════════════════════════════════════
// 3. COMMUNITY
// ═══════════════════════════════════════════

export interface ForumThread {
  id: string;
  title: string;
  author: string;
  authorRole: string;
  category: string;
  replies: number;
  upvotes: number;
  lastActivity: string;
  isExpert: boolean;
  content: string;
  comments: { author: string; authorRole: string; content: string; upvotes: number; isExpert: boolean; date: string }[];
}

export const MOCK_FORUM_THREADS: ForumThread[] = [
  {
    id: 'ft1', title: 'How do you prepare for a board interview?', author: 'Sarah Chen', authorRole: 'CTO Candidate', category: 'Career Advice',
    replies: 12, upvotes: 45, lastActivity: '2h ago', isExpert: false,
    content: 'I have my first board advisory interview next week. What should I expect? How is it different from a standard executive interview?',
    comments: [
      { author: 'Dr. Linda Cheung', authorRole: 'Former CEO, HSBC', content: 'Board interviews focus on governance philosophy, not operational detail. Prepare to discuss risk oversight, strategic direction, and fiduciary duty.', upvotes: 23, isExpert: true, date: '1h ago' },
      { author: 'James Park', authorRole: 'MD Candidate', content: 'I went through one last month. They asked about my experience with audit committees and how I handle conflicts of interest.', upvotes: 8, isExpert: false, date: '45min ago' },
    ],
  },
  {
    id: 'ft2', title: 'APAC vs US executive compensation norms', author: 'David Lee', authorRole: 'VP Finance', category: 'Industry Trends',
    replies: 8, upvotes: 32, lastActivity: '5h ago', isExpert: false,
    content: 'Looking at a role in Singapore after 10 years in NYC. How do compensation structures typically differ?',
    comments: [
      { author: 'Sarah Kim', authorRole: 'MD, McKinsey', content: 'APAC base is typically 15-25% lower but with higher variable components. Housing allowances are common in Singapore.', upvotes: 15, isExpert: true, date: '4h ago' },
    ],
  },
  {
    id: 'ft3', title: 'Building your first 90-day plan as a new CTO', author: 'Raj Patel', authorRole: 'CTO, Grab (Former)', category: 'Leadership',
    replies: 15, upvotes: 67, lastActivity: '1d ago', isExpert: true,
    content: 'Share your frameworks for the critical first 90 days in a CTO role. What worked, what would you change?',
    comments: [
      { author: 'Maria Santos', authorRole: 'CHRO, DBS', content: 'Listen first. Spend the first 30 days on listening tours before making any changes.', upvotes: 19, isExpert: true, date: '1d ago' },
    ],
  },
];

export interface CommunityEvent {
  id: string;
  title: string;
  type: 'webinar' | 'workshop' | 'networking' | 'job_fair';
  date: string;
  time: string;
  location: string;
  attendees: number;
  maxAttendees: number;
  description: string;
  isRegistered: boolean;
}

export const MOCK_EVENTS: CommunityEvent[] = [
  { id: 'e1', title: 'AI Leadership in 2026: What Boards Expect', type: 'webinar', date: '2026-01-30', time: '6:00 PM SGT', location: 'Virtual', attendees: 89, maxAttendees: 150, description: 'Panel discussion with board members on AI governance expectations.', isRegistered: true },
  { id: 'e2', title: 'Executive Networking: APAC Tech Leaders', type: 'networking', date: '2026-02-05', time: '7:00 PM SGT', location: 'Singapore Club', attendees: 34, maxAttendees: 50, description: 'Intimate networking dinner for C-suite tech leaders in APAC.', isRegistered: false },
  { id: 'e3', title: 'Salary Negotiation Masterclass', type: 'workshop', date: '2026-02-12', time: '10:00 AM SGT', location: 'Virtual', attendees: 67, maxAttendees: 100, description: 'Hands-on workshop on executive compensation negotiation.', isRegistered: false },
  { id: 'e4', title: 'Board Readiness Bootcamp', type: 'workshop', date: '2026-02-20', time: '9:00 AM SGT', location: 'Virtual', attendees: 23, maxAttendees: 30, description: 'Intensive 1-day bootcamp for aspiring board members.', isRegistered: false },
  { id: 'e5', title: 'Spring 2026 Executive Job Fair', type: 'job_fair', date: '2026-03-15', time: '2:00 PM SGT', location: 'Mandarin Oriental, Singapore', attendees: 120, maxAttendees: 200, description: 'Connect with 20+ firms hiring senior executives.', isRegistered: false },
];

export const MOCK_PEER_CONNECTIONS = [
  { id: 'pc1', name: 'Angela Wu', title: 'VP Product', company: 'Shopee', industry: 'Technology', matchReason: 'Similar career trajectory', avatarColor: '#1a365d' },
  { id: 'pc2', name: 'Michael Tan', title: 'Director of Engineering', company: 'Grab', industry: 'Technology', matchReason: 'Shared goals in CTO transition', avatarColor: '#276749' },
  { id: 'pc3', name: 'Priya Sharma', title: 'Head of Data', company: 'Sea Group', industry: 'Technology', matchReason: 'Industry overlap', avatarColor: '#744210' },
  { id: 'pc4', name: 'Robert Lim', title: 'CFO', company: 'Crypto.com', industry: 'Financial Services', matchReason: 'Board advisory interest', avatarColor: '#553c9a' },
];

export const MOCK_REFERRAL_STATS = { totalReferrals: 8, successfulReferrals: 3, creditsEarned: 15, leaderboardRank: 12 };

// ═══════════════════════════════════════════
// 4. ASSESSMENTS
// ═══════════════════════════════════════════

export interface Assessment {
  id: string;
  name: string;
  type: 'personality' | 'cognitive' | 'skills' | 'leadership';
  description: string;
  estimatedTime: string;
  questionCount: number;
  status: 'available' | 'in_progress' | 'completed';
  lastTaken?: string;
  score?: number;
  percentile?: number;
}

export const MOCK_ASSESSMENTS: Assessment[] = [
  { id: 'as1', name: 'TRIDENT Leadership Assessment', type: 'leadership', description: 'Comprehensive 5-dimension leadership assessment covering Vision, Execution, Influence, Learning, and Resilience.', estimatedTime: '45 min', questionCount: 40, status: 'completed', lastTaken: '2026-01-15', score: 8.7, percentile: 92 },
  { id: 'as2', name: 'Cognitive Style Profile', type: 'cognitive', description: 'Map your thinking style: analytical, strategic, creative, or practical. Understand how you process information and make decisions.', estimatedTime: '25 min', questionCount: 30, status: 'completed', lastTaken: '2026-01-10', score: 78, percentile: 85 },
  { id: 'as3', name: 'Executive Personality Index', type: 'personality', description: 'Based on the Big Five model, tailored for executive contexts. Measures openness, conscientiousness, extraversion, agreeableness, and stability under pressure.', estimatedTime: '30 min', questionCount: 50, status: 'available' },
  { id: 'as4', name: 'Cross-Cultural Intelligence (CQ)', type: 'skills', description: 'Assess your cultural intelligence across four dimensions: CQ Drive, CQ Knowledge, CQ Strategy, CQ Action.', estimatedTime: '20 min', questionCount: 25, status: 'available' },
  { id: 'as5', name: 'Strategic Thinking Assessment', type: 'skills', description: 'Evaluate your ability to identify patterns, anticipate market shifts, and formulate long-term strategies.', estimatedTime: '35 min', questionCount: 20, status: 'in_progress', lastTaken: '2026-01-22' },
  { id: 'as6', name: 'Board Readiness Evaluation', type: 'leadership', description: 'Assess your preparedness for board service across governance, risk oversight, and fiduciary responsibility.', estimatedTime: '40 min', questionCount: 35, status: 'available' },
];

export const MOCK_ASSESSMENT_QUESTIONS = [
  { id: 'aq1', text: 'When faced with a complex strategic decision, you typically:', options: ['Analyze all available data thoroughly before deciding', 'Trust your intuition and decide quickly', 'Seek input from multiple stakeholders before deciding', 'Use a structured framework to evaluate options'] },
  { id: 'aq2', text: 'In a team conflict, you prefer to:', options: ['Address it directly and immediately', 'Let it resolve naturally over time', 'Mediate between the parties involved', 'Escalate to senior leadership'] },
  { id: 'aq3', text: 'Your approach to risk can best be described as:', options: ['Risk-averse — prefer certainty', 'Balanced — calculated risks when data supports', 'Risk-seeking — embrace uncertainty for upside', 'Context-dependent — varies by situation'] },
  { id: 'aq4', text: 'When learning something new, you prefer:', options: ['Structured courses with clear curricula', 'Hands-on experimentation and trial-and-error', 'Learning from mentors and peers', 'Reading and independent research'] },
  { id: 'aq5', text: 'Your communication style is most effective when:', options: ['Presenting data and analysis to the board', 'Inspiring a large team with a vision', 'One-on-one coaching and mentoring', 'Writing detailed strategic documents'] },
];

export const MOCK_ASSESSMENT_RESULTS = {
  trident: { overall: 8.7, dimensions: { Vision: 9.2, Execution: 8.5, Influence: 8.1, Learning: 9.0, Resilience: 8.6 } },
  cognitive: { overall: 78, style: 'Strategic-Analytical', breakdown: { Analytical: 85, Strategic: 92, Creative: 68, Practical: 74 } },
};
