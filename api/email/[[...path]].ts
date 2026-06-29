import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleEmail } from '../_lib/communicationsHandler';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleEmail(req, res);
}
