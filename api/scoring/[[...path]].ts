import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleScore } from '../_lib/scoreHandler.js';
import { handleScore5 } from '../_lib/score5Handler.js';
import { handleSHIFTAssessment, handleSHIFTReport } from '../_lib/scoringComputeHandler.js';
import { handleAdvisoryAssessment, handleAdvisoryReport, handleParticipantAssessment } from '../_lib/scoringComputeHandler.js';

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const sub = pathArr[0] || '';
  
  // SHIFT Assessment routes (Phase 2.2)
  if (sub === 'shift') return handleSHIFTAssessment(req, res);
  if (sub === 'shift' && pathArr[1] === 'report') return handleSHIFTReport(req, res);
  
  // Advisory Assessment routes (Phase 3.4)
  if (sub === 'advisory') return handleAdvisoryAssessment(req, res);
  if (sub === 'advisory' && pathArr[1] === 'report') return handleAdvisoryReport(req, res);
  if (sub === 'advisory' && pathArr[1] === 'participant') return handleParticipantAssessment(req, res);
  
  if (sub === '5') return handleScore5(req, res);
  return handleScore(req, res);
}
