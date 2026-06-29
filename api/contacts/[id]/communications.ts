import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCommunications } from '../../_lib/communicationsHandler';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleCommunications(req, res);
}
