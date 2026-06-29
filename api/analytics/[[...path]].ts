import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleAnalytics } from '../_lib/analyticsHandler';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleAnalytics(req, res);
}
