import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handler } from '../_lib/chatHandler.js';

export const maxDuration = 60;

export default async function wrapper(req: VercelRequest, res: VercelResponse) {
  return handler(req, res);
}
