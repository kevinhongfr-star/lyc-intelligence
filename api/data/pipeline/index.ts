import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handler } from '../../_lib/dataHandler.js';

export const maxDuration = 60;

export default async function pipelineHandler(req: VercelRequest, res: VercelResponse) {
  if (!req.query.path || (Array.isArray(req.query.path) && req.query.path.length === 0)) {
    req.query.path = ['pipeline'];
  }
  return handler(req, res);
}
