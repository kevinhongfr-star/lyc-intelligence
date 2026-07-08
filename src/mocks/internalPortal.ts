/**
 * EO-7 Mock Data: Internal Portal + System-Wide Polish
 */

// ═══════════════════════════════════════════
// 1. ADVANCED OPS
// ═══════════════════════════════════════════

export const MOCK_EXECUTION_LOGS = [
  { id: 'el1', agent: 'TRIDENT Scorer', action: 'Score Candidate', target: 'Sarah Chen', status: 'completed', duration: '2.3s', timestamp: '2026-01-22 14:32:01' },
  { id: 'el2', agent: 'Signal Processor', action: 'Ingest LinkedIn Data', target: '5 contacts', status: 'completed', duration: '8.1s', timestamp: '2026-01-22 14:28:15' },
  { id: 'el3', agent: 'Org Analyzer', action: 'Health Assessment', target: 'Lygon Group', status: 'running', duration: '12.4s', timestamp: '2026-01-22 14:25:00' },
  { id: 'el4', agent: 'Report Generator', action: 'LENS Report', target: 'James Park', status: 'failed', duration: '0.8s', timestamp: '2026-01-22 14:20:33' },
  { id: 'el5', agent: 'Pipeline Sync', action: 'Update Stages', target: 'Mandate #1042', status: 'completed', duration: '1.1s', timestamp: '2026-01-22 14:15:00' },
];

export const MOCK_RULES = [
  { id: 'r1', name: 'Auto-score on assessment completion', status: 'active', lastTriggered: '2026-01-22 14:32', successRate: 98, triggers: 156 },
  { id: 'r2', name: 'Signal alert on competitor hire', status: 'active', lastTriggered: '2026-01-22 10:15', successRate: 100, triggers: 23 },
  { id: 'r3', name: 'Follow-up task on offer expiry', status: 'active', lastTriggered: '2026-01-20 09:00', successRate: 87, triggers: 44 },
  { id: 'r4', name: 'Weekly pipeline digest', status: 'paused', lastTriggered: '2026-01-19 08:00', successRate: 95, triggers: 12 },
];

export const MOCK_SYSTEM_HEALTH = { cpu: 42, memory: 68, errorRate: 0.3, uptime: '99.97%', activeConnections: 23, requestsPerMin: 147 };

export const MOCK_ALERTS = [
  { id: 'a1', severity: 'critical', message: 'DeepSeek API latency >5s', timestamp: '2026-01-22 14:35', acknowledged: false },
  { id: 'a2', severity: 'warning', message: 'Org Analyzer queue depth >50', timestamp: '2026-01-22 14:20', acknowledged: false },
  { id: 'a3', severity: 'info', message: 'Scheduled maintenance window tonight 02:00-04:00 UTC', timestamp: '2026-01-22 08:00', acknowledged: true },
];

// ═══════════════════════════════════════════
// 2. SCHEDULING+
// ═══════════════════════════════════════════

export const MOCK_CALENDAR_CONNECTIONS = [
  { id: 'c1', provider: 'Google Calendar', email: 'kevin@lyc.partners', status: 'connected', lastSync: '2026-01-22 14:30' },
  { id: 'c2', provider: 'Outlook', email: 'kevin@lycpartners.com', status: 'disconnected' },
];

export const MOCK_SCORECARD_TEMPLATES = [
  { id: 'st1', name: 'Executive Leadership', criteria: [{ label: 'Strategic Vision', weight: 25 }, { label: 'Team Building', weight: 20 }, { label: 'Communication', weight: 20 }, { label: 'Decision Making', weight: 20 }, { label: 'Cultural Fit', weight: 15 }] },
  { id: 'st2', name: 'Technical C-Suite', criteria: [{ label: 'Technical Depth', weight: 30 }, { label: 'Business Acumen', weight: 20 }, { label: 'Innovation', weight: 20 }, { label: 'Scale Experience', weight: 15 }, { label: 'Stakeholder Mgmt', weight: 15 }] },
  { id: 'st3', name: 'Board Assessment', criteria: [{ label: 'Governance Knowledge', weight: 30 }, { label: 'Risk Oversight', weight: 25 }, { label: 'Strategic Input', weight: 20 }, { label: 'Independence', weight: 15 }, { label: 'Industry Expertise', weight: 10 }] },
];

export const MOCK_INTERVIEW_TEMPLATES = [
  { id: 'it1', name: 'C-Suite Behavioral', stages: 3, duration: '90 min', questionsPerStage: 5 },
  { id: 'it2', name: 'Technical Deep-Dive', stages: 4, duration: '120 min', questionsPerStage: 4 },
  { id: 'it3', name: 'Board Readiness', stages: 2, duration: '60 min', questionsPerStage: 6 },
];

// ═══════════════════════════════════════════
// 3. INTELLIGENCE+
// ═══════════════════════════════════════════

export const MOCK_ORG_NODES = [
  { id: 'on1', name: 'Lygon Group', type: 'company', industry: 'Technology', employees: 500, relationships: 4 },
  { id: 'on2', name: 'Meridian Capital', type: 'company', industry: 'Financial Services', employees: 200, relationships: 3 },
  { id: 'on3', name: 'Atlas Health', type: 'company', industry: 'Healthcare', employees: 1000, relationships: 2 },
  { id: 'on4', name: 'Sarah Chen', type: 'person', role: 'CTO Candidate', company: 'Lygon Group', relationships: 2 },
  { id: 'on5', name: 'James Park', type: 'person', role: 'MD Candidate', company: 'Meridian Capital', relationships: 3 },
];

export const MOCK_MARKET_MAPS = [
  { region: 'Singapore', roles: 42, avgSalary: 'SGD 450k', demand: 'High', supply: 'Low' },
  { region: 'Hong Kong', roles: 35, avgSalary: 'USD 520k', demand: 'High', supply: 'Medium' },
  { region: 'Sydney', roles: 28, avgSalary: 'AUD 380k', demand: 'Medium', supply: 'Medium' },
  { region: 'Tokyo', roles: 18, avgSalary: 'USD 400k', demand: 'Medium', supply: 'High' },
  { region: 'Mumbai', roles: 22, avgSalary: 'USD 180k', demand: 'High', supply: 'High' },
];

export const MOCK_SIGNALS = [
  { id: 's1', source: 'LinkedIn', type: 'role_change', entity: 'Angela Wu', detail: 'Promoted to VP Product at Shopee', confidence: 95, timestamp: '2026-01-22 14:30' },
  { id: 's2', source: 'News', type: 'funding', entity: 'Lygon Group', detail: 'Series C announced — USD 80M', confidence: 100, timestamp: '2026-01-22 12:00' },
  { id: 's3', source: 'Web Scraper', type: 'hiring_signal', entity: 'Meridian Capital', detail: 'Job posting: Head of Compliance, Singapore', confidence: 88, timestamp: '2026-01-22 10:15' },
  { id: 's4', source: 'CRM', type: 'engagement', entity: 'Atlas Health', detail: 'CEO viewed candidate profile 3 times', confidence: 72, timestamp: '2026-01-22 09:45' },
];

// ═══════════════════════════════════════════
// 4. PLATFORM SETTINGS
// ═══════════════════════════════════════════

export const MOCK_ROLES = [
  { id: 'role1', name: 'admin', permissions: ['all'], userCount: 3 },
  { id: 'role2', name: 'lyc_consultant', permissions: ['mandates:read', 'mandates:write', 'candidates:read', 'candidates:write', 'companies:read', 'reports:read'], userCount: 8 },
  { id: 'role3', name: 'b2b_client', permissions: ['mandates:read', 'candidates:read', 'reports:read'], userCount: 5 },
  { id: 'role4', name: 'b2c_leader', permissions: ['assessments:read', 'assessments:write', 'profile:read', 'profile:write'], userCount: 10 },
  { id: 'role5', name: 'candidate', permissions: ['profile:read', 'profile:write', 'assessments:read', 'applications:read'], userCount: 20 },
];

export const MOCK_FEATURE_FLAGS = [
  { id: 'ff1', key: 'nexus_streaming', label: 'Nexus Streaming Mode', enabled: true, portals: ['admin', 'b2b_client', 'b2c_leader', 'candidate'] },
  { id: 'ff2', key: 'org_health_v2', label: 'Org Health V2 Algorithm', enabled: false, portals: ['admin'] },
  { id: 'ff3', key: 'credit_system', label: 'Credit Gating', enabled: true, portals: ['b2c_leader', 'candidate'] },
  { id: 'ff4', key: 'dark_mode', label: 'Dark Mode', enabled: false, portals: ['admin', 'b2b_client', 'b2c_leader', 'candidate'] },
  { id: 'ff5', key: 'interview_sim_ai', label: 'AI Interview Simulator', enabled: false, portals: ['candidate'] },
];

export const MOCK_API_KEYS = [
  { id: 'ak1', name: 'Production API', prefix: 'lyc_prod_', created: '2025-12-01', lastUsed: '2026-01-22', status: 'active' },
  { id: 'ak2', name: 'Staging API', prefix: 'lyc_stag_', created: '2025-11-15', lastUsed: '2026-01-20', status: 'active' },
  { id: 'ak3', name: 'Partner — Acme Corp', prefix: 'lyc_acme_', created: '2025-10-01', lastUsed: '2025-12-15', status: 'revoked' },
];

export const MOCK_INTEGRATIONS = [
  { id: 'int1', name: 'Gmail / Google Workspace', status: 'connected', lastSync: '2026-01-22 14:30' },
  { id: 'int2', name: 'Microsoft 365', status: 'disconnected' },
  { id: 'int3', name: 'LinkedIn Recruiter', status: 'connected', lastSync: '2026-01-22 12:00' },
  { id: 'int4', name: 'Slack', status: 'disconnected' },
];

// ═══════════════════════════════════════════
// 5. TEAM MANAGEMENT
// ═══════════════════════════════════════════

export const MOCK_TEAM = [
  { id: 't1', name: 'Kevin Zhang', role: 'admin', status: 'active', mandates: 5, candidates: 23, revenue: '$420k', avatarColor: '#1a365d' },
  { id: 't2', name: 'Sarah Lim', role: 'lyc_consultant', status: 'active', mandates: 3, candidates: 18, revenue: '$310k', avatarColor: '#276749' },
  { id: 't3', name: 'David Chen', role: 'lyc_consultant', status: 'active', mandates: 4, candidates: 15, revenue: '$280k', avatarColor: '#744210' },
  { id: 't4', name: 'Emily Park', role: 'lyc_consultant', status: 'on_leave', mandates: 2, candidates: 8, revenue: '$150k', avatarColor: '#553c9a' },
  { id: 't5', name: 'Michael Tan', role: 'team_lead', status: 'active', mandates: 6, candidates: 31, revenue: '$520k', avatarColor: '#9b2c2c' },
];

// ═══════════════════════════════════════════
// 6. TASKS
// ═══════════════════════════════════════════

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export const MOCK_TASKS = [
  { id: 'tk1', title: 'Follow up with Sarah Chen on CTO offer', assignee: 'Kevin Zhang', status: 'in_progress' as TaskStatus, priority: 'high', deadline: '2026-01-25', source: 'auto', mandate: 'Lygon Group CTO' },
  { id: 'tk2', title: 'Schedule second interview — James Park', assignee: 'Sarah Lim', status: 'todo' as TaskStatus, priority: 'high', deadline: '2026-01-24', source: 'manual', mandate: 'Meridian MD' },
  { id: 'tk3', title: 'Generate LENS report for Atlas Health VP', assignee: 'David Chen', status: 'review' as TaskStatus, priority: 'medium', deadline: '2026-01-26', source: 'auto', mandate: 'Atlas VP Ops' },
  { id: 'tk4', title: 'Update org chart for Lygon Group', assignee: 'Kevin Zhang', status: 'done' as TaskStatus, priority: 'low', deadline: '2026-01-20', source: 'manual', mandate: 'Lygon Group CTO' },
  { id: 'tk5', title: 'Prepare client presentation for Meridian', assignee: 'Emily Park', status: 'todo' as TaskStatus, priority: 'medium', deadline: '2026-01-28', source: 'manual', mandate: 'Meridian MD' },
  { id: 'tk6', title: 'Review salary benchmarks — APAC Q1 2026', assignee: 'Michael Tan', status: 'in_progress' as TaskStatus, priority: 'low', deadline: '2026-01-30', source: 'auto', mandate: null },
  { id: 'tk7', title: 'Onboard new B2B client — Delta Partners', assignee: 'Kevin Zhang', status: 'todo' as TaskStatus, priority: 'high', deadline: '2026-01-23', source: 'manual', mandate: 'Delta Partners CFO' },
  { id: 'tk8', title: 'Audit Nexus conversation quality', assignee: 'Sarah Lim', status: 'todo' as TaskStatus, priority: 'medium', deadline: '2026-02-01', source: 'auto', mandate: null },
];

export const MOCK_TASK_TEMPLATES = [
  { id: 'tt1', name: 'Candidate Follow-Up', steps: ['Send follow-up email', 'Schedule call', 'Update pipeline status', 'Log outcome'] },
  { id: 'tt2', name: 'New Client Onboarding', steps: ['Send welcome kit', 'Schedule kickoff', 'Configure portal access', 'Assign consultant'] },
  { id: 'tt3', name: 'Assessment Review', steps: ['Review results', 'Prepare scorecard', 'Share with client', 'Archive assessment'] },
];

// ═══════════════════════════════════════════
// 7. ANALYTICS
// ═══════════════════════════════════════════

export const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Michael Tan', placements: 6, revenue: '$520k', satisfaction: 4.9 },
  { rank: 2, name: 'Kevin Zhang', placements: 5, revenue: '$420k', satisfaction: 4.8 },
  { rank: 3, name: 'Sarah Lim', placements: 4, revenue: '$310k', satisfaction: 4.7 },
  { rank: 4, name: 'David Chen', placements: 3, revenue: '$280k', satisfaction: 4.6 },
  { rank: 5, name: 'Emily Park', placements: 2, revenue: '$150k', satisfaction: 4.5 },
];

export const MOCK_HIRING_FUNNEL = [
  { stage: 'Sourced', count: 200 },
  { stage: 'Screened', count: 120 },
  { stage: 'Interviewed', count: 60 },
  { stage: 'Assessed', count: 35 },
  { stage: 'Shortlisted', count: 18 },
  { stage: 'Offered', count: 10 },
  { stage: 'Hired', count: 7 },
];

export const MOCK_QUALITY_OF_HIRE = { avgPerformance: 8.2, retention90d: 94, retention1y: 87, clientSatisfaction: 4.7, timeToProductivity: '4.2 months' };

export const MOCK_REVENUE = [
  { month: 'Aug', revenue: 85 }, { month: 'Sep', revenue: 92 }, { month: 'Oct', revenue: 78 }, { month: 'Nov', revenue: 110 }, { month: 'Dec', revenue: 125 }, { month: 'Jan', revenue: 130 },
];

// ═══════════════════════════════════════════
// 8. COMPLIANCE
// ═══════════════════════════════════════════

export const MOCK_AUDIT_LOG = [
  { id: 'al1', user: 'Kevin Zhang', action: 'Viewed candidate profile', target: 'Sarah Chen', ip: '103.28.54.x', timestamp: '2026-01-22 14:32:01' },
  { id: 'al2', user: 'Sarah Lim', action: 'Exported LENS report', target: 'James Park', ip: '103.28.54.x', timestamp: '2026-01-22 14:15:33' },
  { id: 'al3', user: 'System', action: 'Auto-deleted expired documents', target: '5 files', ip: '—', timestamp: '2026-01-22 02:00:00' },
  { id: 'al4', user: 'David Chen', action: 'Modified mandate details', target: 'Mandate #1042', ip: '192.168.1.x', timestamp: '2026-01-22 11:45:12' },
  { id: 'al5', user: 'Kevin Zhang', action: 'Changed role for Emily Park', target: 'team_lead → lyc_consultant', ip: '103.28.54.x', timestamp: '2026-01-21 16:30:00' },
];

export const MOCK_CONSENTS = [
  { id: 'cs1', user: 'Sarah Chen', type: 'Data Processing', granted: true, date: '2025-12-01', expiry: '2026-12-01' },
  { id: 'cs2', user: 'James Park', type: 'Marketing Communications', granted: false, date: '2025-11-15', expiry: null },
  { id: 'cs3', user: 'Angela Wu', type: 'Data Processing', granted: true, date: '2026-01-10', expiry: '2027-01-10' },
];

export const MOCK_RETENTION_POLICIES = [
  { id: 'rp1', dataType: 'Candidate Profiles', retention: '3 years after last activity', autoDelete: true },
  { id: 'rp2', dataType: 'Assessment Results', retention: '5 years', autoDelete: false },
  { id: 'rp3', dataType: 'Chat Messages', retention: '1 year', autoDelete: true },
  { id: 'rp4', dataType: 'Audit Logs', retention: '7 years', autoDelete: false },
];

export const MOCK_COMPLIANCE_CHECKLIST = [
  { id: 'cc1', item: 'Privacy policy published', status: 'complete' },
  { id: 'cc2', item: 'Data processing agreements signed', status: 'complete' },
  { id: 'cc3', item: 'PIPL compliance for China data', status: 'in_progress' },
  { id: 'cc4', item: 'Annual data audit completed', status: 'pending' },
  { id: 'cc5', item: 'Breach notification procedure documented', status: 'complete' },
];

// ═══════════════════════════════════════════
// 9. NEXUS ENGINE ADMIN
// ═══════════════════════════════════════════

export const MOCK_PERSONA_CONFIG = {
  formality: 0.7,
  directness: 0.8,
  terminology: 'executive',
  wordLimit: 200,
  diagnosticProtocol: true,
  confidentialityLevel: 'strict',
  milestoneTracking: true,
};

export const MOCK_MEMORIES = [
  { id: 'mem1', userId: 'user_001', topic: 'Career transition to CTO', confidence: 0.92, createdAt: '2026-01-20', lastReferenced: '2026-01-22' },
  { id: 'mem2', userId: 'user_001', topic: 'Board advisory interest', confidence: 0.85, createdAt: '2026-01-18', lastReferenced: '2026-01-21' },
  { id: 'mem3', userId: 'user_002', topic: 'Salary negotiation preparation', confidence: 0.78, createdAt: '2026-01-15', lastReferenced: '2026-01-20' },
];

export const MOCK_PROMPTS = [
  { id: 'pr1', name: 'Default System Prompt', useCase: 'General', lastModified: '2026-01-20', isActive: true },
  { id: 'pr2', name: 'Interview Prep Mode', useCase: 'Interview Preparation', lastModified: '2026-01-18', isActive: true },
  { id: 'pr3', name: 'Career Strategy Mode', useCase: 'Career Planning', lastModified: '2026-01-15', isActive: false },
];

export const MOCK_CHATBOT_STATS = { totalConversations: 1247, avgMessagesPerConversation: 8.3, avgResponseTime: '1.8s', satisfactionScore: 4.6, creditUsage: 3842, topTopics: ['Career positioning', 'Interview prep', 'Salary negotiation', 'Leadership development'] };

export const MOCK_CONVERSATION_AUDIT = [
  { id: 'ca1', userId: 'user_001', portal: 'b2c_leader', messages: 12, startedAt: '2026-01-22 14:00', status: 'active' },
  { id: 'ca2', userId: 'user_002', portal: 'candidate', messages: 6, startedAt: '2026-01-22 13:30', status: 'completed' },
  { id: 'ca3', userId: 'user_003', portal: 'admin', messages: 18, startedAt: '2026-01-22 11:00', status: 'completed' },
  { id: 'ca4', userId: 'user_004', portal: 'b2b_client', messages: 4, startedAt: '2026-01-22 10:15', status: 'active' },
];
