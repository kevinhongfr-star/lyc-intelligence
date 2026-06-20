import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleStripe } from '../_lib/stripeHandler.js';

export const maxDuration = 60;

export default handleStripe;
