
/**
 * Persisted Rate Limiting Utility
 * 
 * Replaces in-memory Map-based rate limiting with database-backed solution
 * for multi-instance serverless deployments (Vercel).
 * 
 * Uses Supabase RPC calls to check_rate_limit function in Postgres.
 * Falls back to in-memory rate limiting if DB is unavailable.
 */

import * as db from './supabaseRest.js';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryFallback = new Map<string, RateLimitEntry>();

let dbAvailable: boolean | null = null;

async function isDbAvailable(): Promise<boolean> {
  if (dbAvailable !== null) return dbAvailable;
  try {
    await db.selectOne('rate_limits', { column: 'id', value: '0', select: 'id' });
    dbAvailable = true;
  } catch {
    dbAvailable = false;
  }
  return dbAvailable;
}

function getMemoryKey(key: string, windowMs: number): string {
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
  return `${key}:${windowStart}`;
}

function checkMemoryRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const memKey = getMemoryKey(key, windowMs);
  const entry = memoryFallback.get(memKey);
  const now = Date.now();

  if (!entry || now > entry.resetAt) {
    memoryFallback.set(memKey, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Check if a request is within rate limits.
 * 
 * @param key - Unique identifier (e.g., "ip:1.2.3.4:login", "user:abc123:api")
 * @param maxRequests - Maximum requests allowed per window
 * @param windowMs - Window size in milliseconds
 * @returns true = allowed, false = rate limited
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<boolean> {
  const dbOk = await isDbAvailable();

  if (!dbOk) {
    return checkMemoryRateLimit(key, maxRequests, windowMs);
  }

  try {
    const windowSeconds = Math.floor(windowMs / 1000);
    const result = await db.rpc('check_rate_limit', {
      p_key: key,
      p_max: maxRequests,
      p_window: `${windowSeconds} seconds`,
    });
    return result === true;
  } catch (e) {
    console.warn('[rateLimit] DB rate limit failed, using memory fallback:', e);
    dbAvailable = false;
    return checkMemoryRateLimit(key, maxRequests, windowMs);
  }
}

/**
 * Read-only check (doesn't increment counter).
 * Useful for checking before expensive operations.
 */
export async function checkRateLimitReadOnly(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<boolean> {
  const dbOk = await isDbAvailable();

  if (!dbOk) {
    const memKey = getMemoryKey(key, windowMs);
    const entry = memoryFallback.get(memKey);
    if (!entry) return true;
    return entry.count < maxRequests;
  }

  try {
    const result = await db.rpc('check_rate_limit_readonly', {
      p_key: key,
      p_max: maxRequests,
      p_window: `${Math.floor(windowMs / 1000)} seconds`,
    });
    return result === true;
  } catch (e) {
    console.warn('[rateLimit] DB readonly check failed:', e);
    return true;
  }
}

/**
 * Ban a key for repeated rate limit violations.
 */
export async function banKey(
  key: string,
  durationMs: number,
  reason?: string
): Promise<void> {
  const dbOk = await isDbAvailable();
  if (!dbOk) return;

  try {
    await db.rpc('ban_rate_limit_key', {
      p_key: key,
      p_duration: `${Math.floor(durationMs / 1000)} seconds`,
      p_reason: reason || null,
    });
  } catch (e) {
    console.warn('[rateLimit] Ban failed:', e);
  }
}

/**
 * Common rate limit presets.
 */
export const RATE_LIMIT_PRESETS = {
  publicApi: { max: 30, windowMs: 60_000 },
  authenticatedApi: { max: 100, windowMs: 60_000 },
  login: { max: 5, windowMs: 60_000 },
  signup: { max: 3, windowMs: 60_000 },
  email: { max: 10, windowMs: 60_000 },
  aiCall: { max: 20, windowMs: 60_000 },
  fileUpload: { max: 10, windowMs: 60_000 },
  nexusChat: { max: 30, windowMs: 60_000 },
  scoring: { max: 15, windowMs: 60_000 },
  heavy: { max: 5, windowMs: 60_000 },
};

/**
 * Get IP from request (handles proxies).
 */
export function getIpFromRequest(req: any): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.connection?.remoteAddress || 'unknown';
}
