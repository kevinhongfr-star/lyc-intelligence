import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleRbac } from '../_lib/rbacHandler';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleRbac(req, res);
}
