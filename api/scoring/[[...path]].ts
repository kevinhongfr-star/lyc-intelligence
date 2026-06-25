import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleScore } from '../_lib/scoreHandler.js';
import { handleScore5 } from '../_lib/score5Handler.js';
import { handleSHIFTAssessment, handleSHIFTReport } from '../_lib/scoringComputeHandler.js';
import { handleAdvisoryAssessment, handleAdvisoryReport, handleParticipantAssessment } from '../_lib/scoringComputeHandler.js';
import {
  handleCandidateAssessmentScoring,
  handleGetCandidateResult,
  handleSubmitCandidateAssessment,
  handleGetCandidateAssessment,
  handleUpdateResultVisibility,
} from '../_lib/scoringComputeHandler.js';
import { getUserFromRequest } from '../_lib/adminAuth.js';

export const maxDuration = 60;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return false;
  }
  if (entry.count >= 10) return true;
  entry.count++;
  return false;
}

// Routes that need rate limiting (call DeepSeek)
const RATE_LIMITED_ROUTES = ['shift', 'advisory', 'candidate'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const sub = pathArr[0] || '';

  // Auth check (skip for public scoring mode)
  if (sub !== 'public') {
    const { user, error } = await getUserFromRequest(req);
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Attach user to request for downstream handlers
    (req as any).__authenticatedUser = user;
  }

  // Rate limiting for DeepSeek-calling routes
  if (RATE_LIMITED_ROUTES.includes(sub)) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
  }

  // SHIFT Assessment routes (Phase 2.2)
  if (sub === 'shift') return handleSHIFTAssessment(req, res);
  if (sub === 'shift' && pathArr[1] === 'report') return handleSHIFTReport(req, res);

  // Advisory Assessment routes (Phase 3.4)
  if (sub === 'advisory') return handleAdvisoryAssessment(req, res);
  if (sub === 'advisory' && pathArr[1] === 'report') return handleAdvisoryReport(req, res);
  if (sub === 'advisory' && pathArr[1] === 'participant') return handleParticipantAssessment(req, res);

  // Candidate Assessment routes (Phase 4.2)
  if (sub === 'candidate') return handleCandidateAssessmentScoring(req, res);
  if (sub === 'candidate' && pathArr[1] === 'submit') return handleSubmitCandidateAssessment(req, res);
  if (sub === 'candidate' && pathArr[1] === 'assessment') return handleGetCandidateAssessment(req, res);
  if (sub === 'candidate' && pathArr[1] === 'result') return handleGetCandidateResult(req, res);
  if (sub === 'candidate' && pathArr[1] === 'visibility') return handleUpdateResultVisibility(req, res);

  if (sub === '5') return handleScore5(req, res);
  return handleScore(req, res);
}
