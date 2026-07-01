import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleGrid } from '../_lib/gridHandler.js';

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleGrid(req, res);
}