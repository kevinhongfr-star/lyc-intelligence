import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleAdminClientAccounts } from '../_lib/adminClientHandler';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleAdminClientAccounts(req, res);
}
