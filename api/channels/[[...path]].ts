import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleChannels } from '../_lib/communicationsHandler';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleChannels(req, res);
}
