import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleLinkedIn } from '../_lib/linkedinHandler';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleLinkedIn(req, res);
}
