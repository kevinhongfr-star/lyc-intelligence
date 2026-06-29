import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCanvas } from '../_lib/canvasHandler';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleCanvas(req, res);
}
