import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleWechat } from '../_lib/communicationsHandler';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleWechat(req, res);
}
