export type PeerSkill = 'leadership' | 'communication' | 'strategic-thinking' | 'emotional-intelligence' | 'project-management' | 'data-analysis' | 'creative-problem-solving' | 'stakeholder-management';

export type ExperienceLevel = 'early-career' | 'mid-career' | 'senior' | 'executive';

export type MatchQuality = 'excellent' | 'good' | 'fair' | 'poor';

export interface PeerProfile {
  id: string;
  name: string;
  role: string;
  organization: string;
  level: ExperienceLevel;
  skills: PeerSkill[];
  strengths: string[];
  developmentAreas: string[];
  bio: string;
  availability: 'available' | 'limited' | 'unavailable';
  rating: number;
  completedSessions: number;
  location?: string;
  timezone?: string;
  preferredMethodology?: string;
}

export interface MatchScore {
  overall: number;
  skillAlignment: number;
  experienceComplement: number;
  personalityFit: number;
  availabilityMatch: number;
  diversityScore: number;
}

export interface PeerMatch {
  id: string;
  peerA: PeerProfile;
  peerB: PeerProfile;
  score: MatchScore;
  quality: MatchQuality;
  matchedAt: number;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  sessionsHeld: number;
  lastSessionAt: number | null;
}

const PEER_POOL: PeerProfile[] = [
  {
    id: 'peer-001',
    name: 'Dr. Rebecca Liu',
    role: 'VP of Product',
    organization: 'TechCorp',
    level: 'executive',
    skills: ['leadership', 'strategic-thinking', 'stakeholder-management'],
    strengths: ['Strategic planning', 'Organizational leadership', 'Board communication'],
    developmentAreas: ['Technical depth in new domains', 'Mentoring junior staff'],
    bio: '20+ years leading product organizations. Passionate about developing the next generation of leaders.',
    availability: 'limited',
    rating: 4.9,
    completedSessions: 47,
    timezone: 'America/New_York',
    preferredMethodology: 'coaching-wheel',
  },
  {
    id: 'peer-002',
    name: 'Marcus Webb',
    role: 'Engineering Manager',
    organization: 'DataSystems Inc.',
    level: 'senior',
    skills: ['leadership', 'communication', 'project-management'],
    strengths: ['Team building', 'Cross-functional collaboration', 'Performance management'],
    developmentAreas: ['Executive communication', 'Strategic thinking'],
    bio: 'Leading engineering teams at scale. Focused on building inclusive, high-performing teams.',
    availability: 'available',
    rating: 4.7,
    completedSessions: 32,
    timezone: 'Europe/London',
    preferredMethodology: 'GROW',
  },
  {
    id: 'peer-003',
    name: 'Priya Sharma',
    role: 'Senior Product Manager',
    organization: 'InnovateCo',
    level: 'mid-career',
    skills: ['strategic-thinking', 'communication', 'data-analysis'],
    strengths: ['Data-driven decision making', 'User research', 'Product strategy'],
    developmentAreas: ['People leadership', 'Executive presence'],
    bio: 'Product leader passionate about using data to drive decisions and build user-centric solutions.',
    availability: 'available',
    rating: 4.8,
    completedSessions: 28,
    timezone: 'Asia/Kolkata',
    preferredMethodology: 'FRAME',
  },
  {
    id: 'peer-004',
    name: 'James Carter',
    role: 'Director of Operations',
    organization: 'GlobalManufacturing',
    level: 'senior',
    skills: ['project-management', 'stakeholder-management', 'leadership'],
    strengths: ['Operational excellence', 'Process improvement', 'Change management'],
    developmentAreas: ['Digital transformation', 'Innovation'],
    bio: 'Operations leader with a track record of transforming businesses through process optimization and team development.',
    availability: 'limited',
    rating: 4.6,
    completedSessions: 21,
    timezone: 'Australia/Sydney',
    preferredMethodology: 'OSCAR',
  },
  {
    id: 'peer-005',
    name: 'Sofia Martinez',
    role: 'Founder & CEO',
    organization: 'SofiaTech',
    level: 'executive',
    skills: ['leadership', 'strategic-thinking', 'emotional-intelligence'],
    strengths: ['Entrepreneurship', 'Vision building', 'Fundraising'],
    developmentAreas: ['Scaling operations', 'Building executive teams'],
    bio: 'Serial entrepreneur and CEO. Passionate about helping leaders navigate the challenges of scaling their ventures.',
    availability: 'limited',
    rating: 4.9,
    completedSessions: 55,
    timezone: 'Europe/Madrid',
    preferredMethodology: 'CLEAR',
  },
  {
    id: 'peer-006',
    name: 'David Kim',
    role: 'Engineering Lead',
    organization: 'CloudServices',
    level: 'mid-career',
    skills: ['technical-leadership' as any, 'communication', 'project-management'],
    strengths: ['Technical architecture', 'Mentoring', 'Code review'],
    developmentAreas: ['Product strategy', 'Executive communication'],
    bio: 'Technical leader bridging engineering and product. Enjoys mentoring and building engineering culture.',
    availability: 'available',
    rating: 4.5,
    completedSessions: 18,
    timezone: 'Asia/Seoul',
    preferredMethodology: 'GROW',
  },
];

export function getPeerPool(): PeerProfile[] {
  return PEER_POOL;
}

export function getPeerById(id: string): PeerProfile | undefined {
  return PEER_POOL.find(p => p.id === id);
}

export function scoreMatch(peerA: PeerProfile, peerB: PeerProfile): MatchScore {
  const skillOverlap = peerA.skills.filter(s => peerB.skills.includes(s)).length;
  const skillTotal = new Set([...peerA.skills, ...peerB.skills]).size;
  const skillAlignment = skillTotal > 0 ? 1 - skillOverlap / skillTotal : 0.5;
  const levelOrder: Record<ExperienceLevel, number> = { 'early-career': 1, 'mid-career': 2, senior: 3, executive: 4 };
  const levelDiff = Math.abs(levelOrder[peerA.level] - levelOrder[peerB.level]);
  const experienceComplement = levelDiff === 1 ? 0.9 : levelDiff === 2 ? 0.6 : levelDiff === 0 ? 0.4 : 0.3;
  const commonStrengths = peerA.strengths.filter(s => peerB.developmentAreas.some(d => d.toLowerCase().includes(s.toLowerCase().split(' ')[0])));
  const complementScore = commonStrengths.length > 0 ? 0.8 : 0.4;
  const personalityFit = Math.round((peerA.rating + peerB.rating) / 2 / 5 * 100) / 100;
  const availabilityScore = (peerA.availability === 'available' ? 0.8 : peerA.availability === 'limited' ? 0.5 : 0.2) *
    (peerB.availability === 'available' ? 0.8 : peerB.availability === 'limited' ? 0.5 : 0.2);
  const diversityScore = peerA.organization !== peerB.organization ? 0.8 : 0.3;
  const overall = Math.round((skillAlignment * 0.2 + experienceComplement * 0.25 + complementScore * 0.15 + personalityFit * 0.15 + availabilityScore * 0.1 + diversityScore * 0.15) * 100) / 100;
  return {
    overall: Math.min(overall, 0.99),
    skillAlignment: Math.round(skillAlignment * 100) / 100,
    experienceComplement: Math.round(experienceComplement * 100) / 100,
    personalityFit: Math.round(personalityFit * 100) / 100,
    availabilityMatch: Math.round(availabilityScore * 100) / 100,
    diversityScore: Math.round(diversityScore * 100) / 100,
  };
}

export function matchPeers(
  coacheeProfile: PeerProfile,
  options?: { focus?: string; maxResults?: number; minScore?: number },
): { peer: PeerProfile; score: MatchScore; quality: MatchQuality }[] {
  const maxResults = options?.maxResults ?? 5;
  const minScore = options?.minScore ?? 0.4;
  const candidates = PEER_POOL.filter(p => p.id !== coacheeProfile.id && p.availability !== 'unavailable');
  const results = candidates.map(candidate => {
    const score = scoreMatch(coacheeProfile, candidate);
    const quality = classifyQuality(score.overall);
    return { peer: candidate, score, quality };
  });
  results.sort((a, b) => b.score.overall - a.score.overall);
  return results.filter(r => r.score.overall >= minScore).slice(0, maxResults);
}

export function createMatch(peerAId: string, peerBId: string): PeerMatch {
  const peerA = getPeerById(peerAId);
  const peerB = getPeerById(peerBId);
  if (!peerA || !peerB) throw new Error('Peer not found');
  const score = scoreMatch(peerA, peerB);
  const quality = classifyQuality(score.overall);
  return {
    id: `match-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    peerA,
    peerB,
    score,
    quality,
    matchedAt: Date.now(),
    status: 'pending',
    sessionsHeld: 0,
    lastSessionAt: null,
  };
}

export function updateMatchStatus(match: PeerMatch, status: PeerMatch['status']): PeerMatch {
  return { ...match, status };
}

export function recordSessionForMatch(match: PeerMatch): PeerMatch {
  return {
    ...match,
    sessionsHeld: match.sessionsHeld + 1,
    lastSessionAt: Date.now(),
  };
}

export function getMatchRecommendations(
  coacheeId: string,
  focus: string,
  limit: number = 3,
): PeerMatch[] {
  const coachee = getPeerById(coacheeId);
  if (!coachee) return [];
  const matches = matchPeers(coachee, { focus, maxResults: limit });
  return matches.map(m => createMatch(coacheeId, m.peer.id));
}

function classifyQuality(score: number): MatchQuality {
  if (score >= 0.8) return 'excellent';
  if (score >= 0.6) return 'good';
  if (score >= 0.4) return 'fair';
  return 'poor';
}

export function computePeerDevelopmentAreas(peer: PeerProfile): string[] {
  return peer.developmentAreas;
}

export function findComplementaryPeer(peer: PeerProfile): PeerProfile | null {
  const candidates = PEER_POOL.filter(p => p.id !== peer.id);
  let bestCandidate: PeerProfile | null = null;
  let bestScore = 0;
  candidates.forEach(c => {
    const score = scoreMatch(peer, c);
    if (score.overall > bestScore) {
      bestScore = score.overall;
      bestCandidate = c;
    }
  });
  return bestCandidate;
}

export function getGroupMatchSuggestions(peerIds: string[], groupSize: number = 3): string[][] {
  const peers = peerIds.map(id => getPeerById(id)).filter(Boolean) as PeerProfile[];
  if (peers.length < groupSize) return [];
  const groups: string[][] = [];
  const used = new Set<string>();
  peers.forEach(peer => {
    if (used.has(peer.id)) return;
    const group: string[] = [peer.id];
    const matches = matchPeers(peer, { maxResults: groupSize - 1 });
    matches.forEach(m => {
      if (group.length < groupSize && !used.has(m.peer.id)) {
        group.push(m.peer.id);
      }
    });
    if (group.length === groupSize) {
      group.forEach(id => used.add(id));
      groups.push(group);
    }
  });
  return groups;
}
