import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Worker job handler stub.
 * Full implementation requires emailEngine and emailDelivery services.
 * Currently returns 501 — jobs can be wired when the email service is available.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { job } = req.query;
  
  res.status(501).json({
    ok: false,
    error: 'Worker endpoint not yet implemented',
    job: Array.isArray(job) ? job[0] : job,
  });
}
