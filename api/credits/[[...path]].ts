import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCredits } from '../_lib/creditsHandler.js';

export const maxDuration = 60;

export default handleCredits;
