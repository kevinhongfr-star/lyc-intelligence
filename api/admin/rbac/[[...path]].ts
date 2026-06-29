import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleAdminRbac } from '../../_lib/rbacHandler';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleAdminRbac(req, res);
}
